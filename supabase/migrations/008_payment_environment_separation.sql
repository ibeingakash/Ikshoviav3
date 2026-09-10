-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 008:
-- PAYMENT ENVIRONMENT SEPARATION (LIVE VS TEST) & ENTITLEMENT LIFECYCLE
-- ====================================================================

-- 1. Add environment column to payment_orders, payments, and entitlements
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'LIVE';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'LIVE';

ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'LIVE';

-- 2. Performance Indexes for Environment Filtering
CREATE INDEX IF NOT EXISTS idx_payment_orders_env_status ON public.payment_orders(environment, status);
CREATE INDEX IF NOT EXISTS idx_payments_env_status ON public.payments(environment, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_env_status ON public.entitlements(environment, status);

-- 3. Mark existing test records explicitly as TEST mode
-- Detect test transactions by provider order/payment id pattern or known test orders
UPDATE public.payment_orders
SET environment = 'TEST',
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{environment}', '"TEST"')
WHERE id IN ('pord_1788955294613_btix1', 'pord_1788955178008_ln0ef')
   OR provider_order_id LIKE 'order_TZ%';

UPDATE public.payments
SET environment = 'TEST',
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{environment}', '"TEST"')
WHERE id = 'pay_1788955897311_cjw7f'
   OR provider_payment_id = 'pay_TZvwCo3I1N9P7z'
   OR provider_order_id LIKE 'order_TZ%';

-- 4. Restore valid course entitlement for the verified test transaction
-- User usr_student enrolled in crs_1788953246819_46zh for 365 days
INSERT INTO public.entitlements (
  id,
  user_id,
  course_id,
  status,
  source,
  starts_at,
  expires_at,
  granted_by,
  payment_id,
  environment,
  metadata,
  created_at,
  updated_at
)
SELECT
  'ent_1788955897311_cjw7f_recovered',
  'usr_student',
  'crs_1788953246819_46zh',
  'ACTIVE',
  'PAYMENT',
  '2026-09-09T12:11:37.278Z'::timestamptz,
  ('2026-09-09T12:11:37.278Z'::timestamptz + INTERVAL '365 days'),
  NULL,
  'pay_1788955897311_cjw7f',
  'TEST',
  jsonb_build_object(
    'orderId', 'pord_1788955294613_btix1',
    'paymentId', 'pay_1788955897311_cjw7f',
    'amount', 2499.00,
    'durationDays', 365,
    'environment', 'TEST',
    'isTest', true,
    'recoveryNote', 'Entitlement restored from verified Razorpay test checkout'
  ),
  '2026-09-09T12:11:37.278Z'::timestamptz,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.entitlements
  WHERE user_id = 'usr_student'
    AND course_id = 'crs_1788953246819_46zh'
    AND status = 'ACTIVE'
);

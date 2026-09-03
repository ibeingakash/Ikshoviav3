-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 007:
-- PRODUCTION-READY PAYMENT SYSTEM WITH RAZORPAY & VERIFIED ENTITLEMENTS
-- ====================================================================

-- 1. PAYMENT ORDERS
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  price_id TEXT REFERENCES public.prices(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'RAZORPAY',
  provider_order_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'CREATED', -- CREATED, PENDING, PAID, FAILED, CANCELLED, REFUNDED, VERIFICATION_PENDING
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PAYMENTS (Transaction records verified from gateway)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'RAZORPAY',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELLED, REFUNDED, VERIFICATION_PENDING
  method TEXT,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WEBHOOK IDEMPOTENCY & AUDIT LOG
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'RAZORPAY',
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PROCESSED', -- PROCESSED, SKIPPED, FAILED
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_status ON public.payment_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_course ON public.payment_orders(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_order ON public.payment_orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event ON public.payment_webhook_events(event_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events FORCE ROW LEVEL SECURITY;

-- Payment Orders: Learners can view only their own orders; Admins full access
DROP POLICY IF EXISTS "payment_orders_select_policy" ON public.payment_orders;
CREATE POLICY "payment_orders_select_policy" ON public.payment_orders
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

DROP POLICY IF EXISTS "payment_orders_admin_all_policy" ON public.payment_orders;
CREATE POLICY "payment_orders_admin_all_policy" ON public.payment_orders
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payments: Learners can view only their own payments; Admins full access
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

DROP POLICY IF EXISTS "payments_admin_all_policy" ON public.payments;
CREATE POLICY "payments_admin_all_policy" ON public.payments
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Webhook Events: Strictly restricted to Admin and Service Role
DROP POLICY IF EXISTS "payment_webhooks_admin_all_policy" ON public.payment_webhook_events;
CREATE POLICY "payment_webhooks_admin_all_policy" ON public.payment_webhook_events
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

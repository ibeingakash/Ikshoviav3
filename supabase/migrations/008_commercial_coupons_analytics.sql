-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 008:
-- COMMERCIAL LAYER: COUPONS, OFFERS, AND REVENUE ANALYTICS ENGINE
-- ====================================================================

-- 1. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount NUMERIC(10, 2) CHECK (max_discount IS NULL OR max_discount > 0),
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL, -- NULL = valid for all courses
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_user_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COUPON USAGES TABLE
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount >= 0),
  original_amount NUMERIC(10, 2) NOT NULL CHECK (original_amount >= 0),
  final_amount NUMERIC(10, 2) NOT NULL CHECK (final_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_course ON public.coupons(course_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON public.coupons(start_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON public.coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order ON public.coupon_usages(order_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons FORCE ROW LEVEL SECURITY;

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages FORCE ROW LEVEL SECURITY;

-- Coupons: Authenticated users can view active coupons; Admins have full access
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
CREATE POLICY "coupons_select_policy" ON public.coupons
  FOR SELECT TO authenticated
  USING (
    (is_active = true AND start_date <= NOW() AND (expiry_date IS NULL OR expiry_date > NOW()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "coupons_admin_all_policy" ON public.coupons;
CREATE POLICY "coupons_admin_all_policy" ON public.coupons
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Coupon Usages: Users can view only their own usages; Admins have full access
DROP POLICY IF EXISTS "coupon_usages_select_policy" ON public.coupon_usages;
CREATE POLICY "coupon_usages_select_policy" ON public.coupon_usages
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

DROP POLICY IF EXISTS "coupon_usages_admin_all_policy" ON public.coupon_usages;
CREATE POLICY "coupon_usages_admin_all_policy" ON public.coupon_usages
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

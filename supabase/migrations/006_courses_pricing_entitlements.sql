-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 006:
-- COURSES, PRICING, FEATURES & ENTITLEMENTS ARCHITECTURE
-- ====================================================================

-- 1. COURSES / PRODUCTS
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  exam TEXT NOT NULL DEFAULT 'UPSC',
  course_type TEXT NOT NULL DEFAULT 'TEST_SERIES',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  default_duration_days INT NOT NULL DEFAULT 90,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COURSE FEATURES (Configurable feature/capability mapping)
CREATE TABLE IF NOT EXISTS public.course_features (
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL,
  PRIMARY KEY (course_id, feature_code)
);

-- 3. COURSE PRICING (Database-driven pricing)
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'INR',
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ENTITLEMENTS (User access grants)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source TEXT NOT NULL DEFAULT 'ADMIN_GRANT',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  granted_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  payment_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_courses_exam ON public.courses(exam);
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_features_course ON public.course_features(course_id);
CREATE INDEX IF NOT EXISTS idx_prices_course_active ON public.prices(course_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_status ON public.entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_course ON public.entitlements(course_id);

-- 6. SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.course_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_features FORCE ROW LEVEL SECURITY;

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements FORCE ROW LEVEL SECURITY;

-- Courses: Authenticated users can view active courses, admins full access
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "courses_admin_all_policy" ON public.courses;
CREATE POLICY "courses_admin_all_policy" ON public.courses
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Course Features: All can read features of active courses, admins full access
DROP POLICY IF EXISTS "course_features_select_policy" ON public.course_features;
CREATE POLICY "course_features_select_policy" ON public.course_features
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "course_features_admin_all_policy" ON public.course_features;
CREATE POLICY "course_features_admin_all_policy" ON public.course_features
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Prices: All can view active prices, admins full access
DROP POLICY IF EXISTS "prices_select_policy" ON public.prices;
CREATE POLICY "prices_select_policy" ON public.prices
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "prices_admin_all_policy" ON public.prices;
CREATE POLICY "prices_admin_all_policy" ON public.prices
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Entitlements: Users can only view their own entitlements; admins full access
DROP POLICY IF EXISTS "entitlements_select_policy" ON public.entitlements;
CREATE POLICY "entitlements_select_policy" ON public.entitlements
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

DROP POLICY IF EXISTS "entitlements_admin_all_policy" ON public.entitlements;
CREATE POLICY "entitlements_admin_all_policy" ON public.entitlements
  FOR ALL TO authenticated, service_role, postgres
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

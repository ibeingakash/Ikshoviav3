-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 004: RBAC SECURITY HARDENING
-- Enables Row Level Security (RLS) on public.permissions and public.role_permissions.
-- Revokes public/anon/authenticated Data API access while preserving trusted backend access.
-- ====================================================================

-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;

-- 2. Revoke all privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.permissions FROM anon, authenticated;
REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated;

-- 3. Grant full privileges strictly to trusted postgres and service_role
GRANT ALL ON TABLE public.permissions TO postgres, service_role;
GRANT ALL ON TABLE public.role_permissions TO postgres, service_role;

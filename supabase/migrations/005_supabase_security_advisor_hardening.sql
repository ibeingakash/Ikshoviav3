-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 005
-- SUPABASE SECURITY ADVISOR FORENSIC HARDENING & COMPREHENSIVE RLS
-- ====================================================================

-- 0. HELPER FUNCTIONS FOR SAFE RBAC IN POLICIES
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())::text
      AND role IN ('ADMIN', 'SUPER_ADMIN')
  ) OR (
    COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
  ) OR (
    CURRENT_USER IN ('postgres', 'service_role')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role, postgres;

-- 1. ENABLE ROW LEVEL SECURITY ON ALL 42 PUBLIC TABLES
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_affairs_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_extracted_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. FORCE RLS ON HIGH-SENSITIVITY INTERNAL & AUTH TABLES
ALTER TABLE public.user_passwords FORCE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_errors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alembic_version FORCE ROW LEVEL SECURITY;

-- 3. GRANT HARDENING (LEAST PRIVILEGE)
-- Revoke all table privileges from anon and authenticated across private/internal tables
REVOKE ALL ON TABLE public.user_passwords FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.admin_permissions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.roles FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.permissions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ai_requests FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ai_usage FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ai_errors FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ai_drafts FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.alembic_version FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ocr_jobs FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.ocr_extracted_questions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.pyq_ingestion_runs FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_ingestion_runs FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_ingestion_jobs FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_chunks FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_documents FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_questions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_resources FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_sources FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.data_tags FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.source_freshness FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.current_affairs_sources FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.question_sources FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.question_versions FROM anon, authenticated, public;

-- Ensure trusted backend roles maintain full privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;

-- Public read-only catalog tables: Grant SELECT to anon & authenticated
GRANT SELECT ON TABLE public.subjects TO anon, authenticated;
GRANT SELECT ON TABLE public.topics TO anon, authenticated;
GRANT SELECT ON TABLE public.concepts TO anon, authenticated;
GRANT SELECT ON TABLE public.concept_relationships TO anon, authenticated;
GRANT SELECT ON TABLE public.exams TO anon, authenticated;
GRANT SELECT ON TABLE public.papers TO anon, authenticated;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
GRANT SELECT ON TABLE public.question_options TO anon, authenticated;
GRANT SELECT ON TABLE public.pyq_papers TO anon, authenticated;
GRANT SELECT ON TABLE public.pyq_questions TO anon, authenticated;
GRANT SELECT ON TABLE public.mock_tests TO anon, authenticated;
GRANT SELECT ON TABLE public.mock_questions TO anon, authenticated;
GRANT SELECT ON TABLE public.current_affairs TO anon, authenticated;
GRANT SELECT ON TABLE public.resources TO anon, authenticated;

-- User-owned tables: Grant appropriate CRUD to authenticated
GRANT SELECT, UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learner_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.concept_mastery TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.retention_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mistake_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learning_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.practice_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.practice_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.question_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.revision_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.revision_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mock_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mock_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shared_tests TO authenticated;

-- 4. POLICIES: PUBLIC READ-ONLY CATALOG
DROP POLICY IF EXISTS "Public read access for subjects" ON public.subjects;
CREATE POLICY "Public read access for subjects" ON public.subjects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for topics" ON public.topics;
CREATE POLICY "Public read access for topics" ON public.topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for concepts" ON public.concepts;
CREATE POLICY "Public read access for concepts" ON public.concepts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for concept relationships" ON public.concept_relationships;
CREATE POLICY "Public read access for concept relationships" ON public.concept_relationships
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for exams" ON public.exams;
CREATE POLICY "Public read access for exams" ON public.exams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for papers" ON public.papers;
CREATE POLICY "Public read access for papers" ON public.papers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for published questions" ON public.questions;
CREATE POLICY "Public read access for published questions" ON public.questions
  FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public read access for question options" ON public.question_options;
CREATE POLICY "Public read access for question options" ON public.question_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND (q.is_published = true OR public.is_admin()))
  );

DROP POLICY IF EXISTS "Public read access for official published pyq papers" ON public.pyq_papers;
CREATE POLICY "Public read access for official published pyq papers" ON public.pyq_papers
  FOR SELECT USING (status = 'PUBLISHED' OR public.is_admin());

DROP POLICY IF EXISTS "Public read access for official verified pyq questions" ON public.pyq_questions;
CREATE POLICY "Public read access for official verified pyq questions" ON public.pyq_questions
  FOR SELECT USING (verification_status = 'OFFICIAL_VERIFIED' OR public.is_admin());

DROP POLICY IF EXISTS "Public read access for published mock tests" ON public.mock_tests;
CREATE POLICY "Public read access for published mock tests" ON public.mock_tests
  FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public read access for mock questions" ON public.mock_questions;
CREATE POLICY "Public read access for mock questions" ON public.mock_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mock_tests mt WHERE mt.id = mock_test_id AND (mt.is_published = true OR public.is_admin()))
  );

DROP POLICY IF EXISTS "Public read access for published current affairs" ON public.current_affairs;
CREATE POLICY "Public read access for published current affairs" ON public.current_affairs
  FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public read access for resources" ON public.resources;
CREATE POLICY "Public read access for resources" ON public.resources
  FOR SELECT USING (true);

-- 5. POLICIES: AUTHENTICATED USER-OWNED DATA
DROP POLICY IF EXISTS "Users access own user record" ON public.users;
CREATE POLICY "Users access own user record" ON public.users
  FOR SELECT USING ((SELECT auth.uid())::text = id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own user record" ON public.users;
CREATE POLICY "Users update own user record" ON public.users
  FOR UPDATE USING ((SELECT auth.uid())::text = id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = id);

DROP POLICY IF EXISTS "Users access own profile" ON public.user_profiles;
CREATE POLICY "Users access own profile" ON public.user_profiles
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own goals" ON public.goals;
CREATE POLICY "Users access own goals" ON public.goals
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own learner model" ON public.learner_models;
CREATE POLICY "Users access own learner model" ON public.learner_models
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own concept mastery" ON public.concept_mastery;
CREATE POLICY "Users access own concept mastery" ON public.concept_mastery
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own retention state" ON public.retention_state;
CREATE POLICY "Users access own retention state" ON public.retention_state
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own mistake patterns" ON public.mistake_patterns;
CREATE POLICY "Users access own mistake patterns" ON public.mistake_patterns
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own learning events" ON public.learning_events;
CREATE POLICY "Users access own learning events" ON public.learning_events
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users access own practice sessions" ON public.practice_sessions
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own practice questions" ON public.practice_questions;
CREATE POLICY "Users access own practice questions" ON public.practice_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions ps
      WHERE ps.id = session_id AND ((SELECT auth.uid())::text = ps.user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = ps.user_id OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_sessions ps
      WHERE ps.id = session_id AND ((SELECT auth.uid())::text = ps.user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = ps.user_id)
    )
  );

DROP POLICY IF EXISTS "Users access own question attempts" ON public.question_attempts;
CREATE POLICY "Users access own question attempts" ON public.question_attempts
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own revision items" ON public.revision_items;
CREATE POLICY "Users access own revision items" ON public.revision_items
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own revision sessions" ON public.revision_sessions;
CREATE POLICY "Users access own revision sessions" ON public.revision_sessions
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own mock attempts" ON public.mock_attempts;
CREATE POLICY "Users access own mock attempts" ON public.mock_attempts
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own mock answers" ON public.mock_answers;
CREATE POLICY "Users access own mock answers" ON public.mock_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mock_attempts ma
      WHERE ma.id = mock_attempt_id AND ((SELECT auth.uid())::text = ma.user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = ma.user_id OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mock_attempts ma
      WHERE ma.id = mock_attempt_id AND ((SELECT auth.uid())::text = ma.user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = ma.user_id)
    )
  );

DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users access own notifications" ON public.notifications
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users access own AI conversations" ON public.ai_conversations
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own AI messages" ON public.ai_messages;
CREATE POLICY "Users access own AI messages" ON public.ai_messages
  FOR ALL USING ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = user_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own shared tests" ON public.shared_tests;
CREATE POLICY "Users access own shared tests" ON public.shared_tests
  FOR ALL USING ((SELECT auth.uid())::text = owner_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = owner_id OR public.is_admin())
  WITH CHECK ((SELECT auth.uid())::text = owner_id OR COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = owner_id);

-- 6. POLICIES: ADMIN-ONLY TABLES (Explicit Admin Access Policies)
DROP POLICY IF EXISTS "Admins access OCR jobs" ON public.ocr_jobs;
CREATE POLICY "Admins access OCR jobs" ON public.ocr_jobs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access extracted questions" ON public.ocr_extracted_questions;
CREATE POLICY "Admins access extracted questions" ON public.ocr_extracted_questions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access AI drafts" ON public.ai_drafts;
CREATE POLICY "Admins access AI drafts" ON public.ai_drafts
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access PYQ ingestion runs" ON public.pyq_ingestion_runs;
CREATE POLICY "Admins access PYQ ingestion runs" ON public.pyq_ingestion_runs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data ingestion runs" ON public.data_ingestion_runs;
CREATE POLICY "Admins access data ingestion runs" ON public.data_ingestion_runs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data ingestion jobs" ON public.data_ingestion_jobs;
CREATE POLICY "Admins access data ingestion jobs" ON public.data_ingestion_jobs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access source freshness" ON public.source_freshness;
CREATE POLICY "Admins access source freshness" ON public.source_freshness
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access current affairs sources" ON public.current_affairs_sources;
CREATE POLICY "Admins access current affairs sources" ON public.current_affairs_sources
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access question versions" ON public.question_versions;
CREATE POLICY "Admins access question versions" ON public.question_versions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access question sources" ON public.question_sources;
CREATE POLICY "Admins access question sources" ON public.question_sources
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data documents" ON public.data_documents;
CREATE POLICY "Admins access data documents" ON public.data_documents
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data chunks" ON public.data_chunks;
CREATE POLICY "Admins access data chunks" ON public.data_chunks
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data questions" ON public.data_questions;
CREATE POLICY "Admins access data questions" ON public.data_questions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data resources" ON public.data_resources;
CREATE POLICY "Admins access data resources" ON public.data_resources
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data sources" ON public.data_sources;
CREATE POLICY "Admins access data sources" ON public.data_sources
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access data tags" ON public.data_tags;
CREATE POLICY "Admins access data tags" ON public.data_tags
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access roles" ON public.roles;
CREATE POLICY "Admins access roles" ON public.roles
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access permissions" ON public.permissions;
CREATE POLICY "Admins access permissions" ON public.permissions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access role permissions" ON public.role_permissions;
CREATE POLICY "Admins access role permissions" ON public.role_permissions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins access admin permissions" ON public.admin_permissions;
CREATE POLICY "Admins access admin permissions" ON public.admin_permissions
  FOR ALL USING (public.is_admin());

-- 7. RECREATE CURRENT AFFAIRS FRESHNESS VIEW AS SECURITY INVOKER
DROP VIEW IF EXISTS public.current_affair_source_freshness;

-- In Postgres 15+, WITH (security_invoker = true) ensures view executes with invoker rights
DO $$
BEGIN
  BEGIN
    EXECUTE '
      CREATE OR REPLACE VIEW public.current_affair_source_freshness
      WITH (security_invoker = true)
      AS
      SELECT 
        source_identifier,
        display_name,
        source_type,
        is_active,
        schedule_description,
        last_attempted_run,
        last_successful_run,
        latest_discovered_article,
        latest_published_article,
        latest_article_date,
        failure_count,
        freshness_status,
        last_error,
        updated_at
      FROM public.source_freshness;
    ';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.current_affair_source_freshness AS
      SELECT 
        source_identifier,
        display_name,
        source_type,
        is_active,
        schedule_description,
        last_attempted_run,
        last_successful_run,
        latest_discovered_article,
        latest_published_article,
        latest_article_date,
        failure_count,
        freshness_status,
        last_error,
        updated_at
      FROM public.source_freshness;
    ';
  END;
END $$;

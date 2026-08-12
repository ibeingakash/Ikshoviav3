-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 002: ROW LEVEL SECURITY (RLS)
-- Protects user data privacy and isolates learner records.
-- ====================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON PRIVATE USER TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 2. PUBLIC READ POLICIES FOR CATALOG & CURRICULUM CONTENT
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- PUBLIC CONTENT READ ACCESS
CREATE POLICY "Public read access for subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public read access for topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public read access for concepts" ON public.concepts FOR SELECT USING (true);
CREATE POLICY "Public read access for published questions" ON public.questions FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for current affairs" ON public.current_affairs FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for mock tests" ON public.mock_tests FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for resources" ON public.resources FOR SELECT USING (true);

-- 3. USER DATA ISOLATION POLICIES (Users manage only their own data)
CREATE POLICY "Users access own profile" ON public.user_profiles 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own goals" ON public.goals 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own learner model" ON public.learner_models 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own concept mastery" ON public.concept_mastery 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own retention state" ON public.retention_state 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own mistake patterns" ON public.mistake_patterns 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own learning events" ON public.learning_events 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own practice sessions" ON public.practice_sessions 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own question attempts" ON public.question_attempts 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own revision items" ON public.revision_items 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own revision sessions" ON public.revision_sessions 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own mock attempts" ON public.mock_attempts 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own notifications" ON public.notifications 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own AI conversations" ON public.ai_conversations 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users access own AI messages" ON public.ai_messages 
  FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 4. SERVICE ROLE OVERRIDE FOR EXPRESS BACKEND
-- The Express backend running with SUPABASE_SERVICE_ROLE_KEY bypasses RLS automatically
-- and enforces application RBAC via server middleware (requireAuth, requireAdmin, requireSuperAdmin).

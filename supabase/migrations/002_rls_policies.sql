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
DROP POLICY IF EXISTS "Public read access for subjects" ON public.subjects;
CREATE POLICY "Public read access for subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for topics" ON public.topics;
CREATE POLICY "Public read access for topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for concepts" ON public.concepts;
CREATE POLICY "Public read access for concepts" ON public.concepts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for published questions" ON public.questions;
CREATE POLICY "Public read access for published questions" ON public.questions FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read access for current affairs" ON public.current_affairs;
CREATE POLICY "Public read access for current affairs" ON public.current_affairs FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read access for mock tests" ON public.mock_tests;
CREATE POLICY "Public read access for mock tests" ON public.mock_tests FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read access for resources" ON public.resources;
CREATE POLICY "Public read access for resources" ON public.resources FOR SELECT USING (true);

-- 3. USER DATA ISOLATION POLICIES (Users manage only their own data)
DROP POLICY IF EXISTS "Users access own profile" ON public.user_profiles;
CREATE POLICY "Users access own profile" ON public.user_profiles 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own goals" ON public.goals;
CREATE POLICY "Users access own goals" ON public.goals 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own learner model" ON public.learner_models;
CREATE POLICY "Users access own learner model" ON public.learner_models 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own concept mastery" ON public.concept_mastery;
CREATE POLICY "Users access own concept mastery" ON public.concept_mastery 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own retention state" ON public.retention_state;
CREATE POLICY "Users access own retention state" ON public.retention_state 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own mistake patterns" ON public.mistake_patterns;
CREATE POLICY "Users access own mistake patterns" ON public.mistake_patterns 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own learning events" ON public.learning_events;
CREATE POLICY "Users access own learning events" ON public.learning_events 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users access own practice sessions" ON public.practice_sessions 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own question attempts" ON public.question_attempts;
CREATE POLICY "Users access own question attempts" ON public.question_attempts 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own revision items" ON public.revision_items;
CREATE POLICY "Users access own revision items" ON public.revision_items 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own revision sessions" ON public.revision_sessions;
CREATE POLICY "Users access own revision sessions" ON public.revision_sessions 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own mock attempts" ON public.mock_attempts;
CREATE POLICY "Users access own mock attempts" ON public.mock_attempts 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users access own notifications" ON public.notifications 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users access own AI conversations" ON public.ai_conversations 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

DROP POLICY IF EXISTS "Users access own AI messages" ON public.ai_messages;
CREATE POLICY "Users access own AI messages" ON public.ai_messages 
  FOR ALL USING (COALESCE(current_setting('request.jwt.claim.sub', true), current_user) = user_id);

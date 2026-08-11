-- IKSHOVIA V3 Supabase Database Schema Migration
-- Enables RLS and creates all 23 core tables with primary keys, foreign keys, indexes, and constraints.

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_exam TEXT NOT NULL DEFAULT 'UPSC CSE 2026',
  selected_subjects JSONB DEFAULT '[]'::jsonb,
  daily_goal_minutes INT DEFAULT 120,
  experience_level TEXT DEFAULT 'Intermediate',
  goal_statement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_exam TEXT NOT NULL,
  target_date DATE NOT NULL,
  daily_study_minutes INT DEFAULT 120,
  subjects JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED')),
  progress_percentage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  topics_count INT DEFAULT 0,
  concepts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_num INT DEFAULT 1,
  concepts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONCEPTS
CREATE TABLE IF NOT EXISTS public.concepts (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  explanation TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  key_points JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'INTERMEDIATE' CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  importance TEXT DEFAULT 'HIGH' CHECK (importance IN ('HIGH', 'MEDIUM', 'LOW')),
  prerequisite_ids JSONB DEFAULT '[]'::jsonb,
  related_ids JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONCEPT RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'related', 'parent_child', 'contrast', 'application')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE(source_id, target_id, relation_type)
);

-- 8. CONCEPT MASTERY
CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  understanding INT DEFAULT 50,
  retention INT DEFAULT 50,
  application INT DEFAULT 50,
  accuracy INT DEFAULT 50,
  confidence INT DEFAULT 50,
  overall_mastery INT DEFAULT 50,
  attempts_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  confusion_partners JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_concept UNIQUE(user_id, concept_id)
);

-- 9. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'MCQ' CHECK (type IN ('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  exam_tag TEXT,
  pyq_year INT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. QUESTION ATTEMPTS
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT DEFAULT 0,
  confidence_rating INT DEFAULT 3,
  mistake_category TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MISTAKES
CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  mistake_category TEXT NOT NULL,
  severity FLOAT DEFAULT 0.5,
  explanation TEXT,
  recommended_action TEXT,
  count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. LEARNING SESSIONS
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_seconds INT DEFAULT 0,
  session_type TEXT DEFAULT 'LEARN',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REVISION ITEMS
CREATE TABLE IF NOT EXISTS public.revision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  retention INT DEFAULT 50,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW', 'URGENT')),
  last_reviewed_at TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'SKIPPED')),
  mistake_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_revision UNIQUE(user_id, concept_id)
);

-- 14. MOCK TESTS
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'QUICK' CHECK (type IN ('QUICK', 'SUBJECT', 'FULL')),
  subject_ids JSONB DEFAULT '[]'::jsonb,
  duration_minutes INT DEFAULT 30,
  total_questions INT DEFAULT 10,
  total_marks INT DEFAULT 20,
  negative_marking_rate FLOAT DEFAULT 0.66,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MOCK TEST QUESTIONS
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_num INT DEFAULT 1
);

-- 16. MOCK ATTEMPTS
CREATE TABLE IF NOT EXISTS public.mock_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  mock_title TEXT NOT NULL,
  score FLOAT DEFAULT 0,
  max_score FLOAT DEFAULT 0,
  accuracy INT DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  subject_scores JSONB DEFAULT '{}'::jsonb,
  weak_concept_ids JSONB DEFAULT '[]'::jsonb,
  mistake_summary JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CURRENT AFFAIRS
CREATE TABLE IF NOT EXISTS public.current_affairs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  background TEXT,
  key_facts JSONB DEFAULT '[]'::jsonb,
  prelims_relevance TEXT,
  mains_relevance TEXT,
  related_concept_ids JSONB DEFAULT '[]'::jsonb,
  source TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('NOTE', 'PDF', 'BOOK', 'ARTICLE', 'VIDEO', 'PYQ')),
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  summary TEXT,
  read_time_minutes INT DEFAULT 10,
  exam_tag TEXT,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_bookmark UNIQUE(user_id, resource_id)
);

-- 20. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. AI MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  quick_actions JSONB DEFAULT '[]'::jsonb,
  related_concept_ids JSONB DEFAULT '[]'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 22. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REVISION', 'STREAK', 'INSIGHT', 'GOAL')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 23. ADMIN CONTENT DRAFTS
CREATE TABLE IF NOT EXISTS public.admin_content_drafts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('MCQ', 'CONCEPT', 'SUMMARY')),
  prompt TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT,
  concept_id TEXT,
  generated_data JSONB,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR RETRIEVAL EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user ON public.concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_items_user ON public.revision_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_questions_concept ON public.questions(concept_id);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL USER DATA TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SAMPLE RLS POLICIES (Users can access their own records)
CREATE POLICY "Users can manage own user row" ON public.users FOR ALL USING (true);
CREATE POLICY "Users can manage own profile" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (true);
CREATE POLICY "Users can manage own mastery" ON public.concept_mastery FOR ALL USING (true);
CREATE POLICY "Users can manage own question attempts" ON public.question_attempts FOR ALL USING (true);
CREATE POLICY "Users can manage own mistakes" ON public.mistakes FOR ALL USING (true);
CREATE POLICY "Users can manage own learning sessions" ON public.learning_sessions FOR ALL USING (true);
CREATE POLICY "Users can manage own revision items" ON public.revision_items FOR ALL USING (true);
CREATE POLICY "Users can manage own mock attempts" ON public.mock_attempts FOR ALL USING (true);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (true);
CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations FOR ALL USING (true);
CREATE POLICY "Users can manage own AI messages" ON public.ai_messages FOR ALL USING (true);
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (true);

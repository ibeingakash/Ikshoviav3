-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 001: INITIAL SCHEMA
-- Creates all tables, foreign keys, indexes, and constraints.
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_passwords (
  email TEXT PRIMARY KEY REFERENCES public.users(email) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2. RBAC: ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (user_id, permission_code)
);

-- 3. ACADEMIC TAXONOMY: EXAMS, PAPERS, SUBJECTS, TOPICS, CONCEPTS
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  target_year INT DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.papers (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  total_marks INT DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_num INT DEFAULT 1,
  concepts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.concepts (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'related', 'parent_child', 'contrast', 'application')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE(source_id, target_id, relation_type)
);

-- 4. QUESTION BANK & PROVENANCE
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'MCQ' CHECK (type IN ('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'MAINS')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  exam_tag TEXT,
  pyq_year INT,
  exam TEXT,
  paper TEXT,
  question_number INT,
  is_pyq BOOLEAN DEFAULT FALSE,
  source TEXT,
  verified_status TEXT DEFAULT 'VERIFIED_PYQ',
  is_published BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  version_num INT NOT NULL,
  content JSONB NOT NULL,
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.question_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- e.g. PYQ, OCR_IMPORT, AI_GENERATED
  provenance_url TEXT,
  batch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRACTICE SESSIONS & ATTEMPTS
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id),
  mode TEXT DEFAULT 'STANDARD' CHECK (mode IN ('STANDARD', 'ADAPTIVE', 'REVISION')),
  total_questions INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  score FLOAT DEFAULT 0.0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES public.questions(id) ON DELETE CASCADE,
  order_num INT DEFAULT 1
);

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

-- 6. LEARNER MODEL, MASTERY & RETENTION STATE
CREATE TABLE IF NOT EXISTS public.learner_models (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  overall_score INT DEFAULT 50,
  total_study_time_minutes INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  highest_streak INT DEFAULT 0,
  active_days_count INT DEFAULT 0,
  confidence_bias TEXT DEFAULT 'BALANCED' CHECK (confidence_bias IN ('OVERCONFIDENT', 'UNDERCONFIDENT', 'BALANCED')),
  mistake_breakdown JSONB DEFAULT '{}'::jsonb,
  subject_mastery JSONB DEFAULT '{}'::jsonb,
  mastered_concepts_count INT DEFAULT 0,
  weak_concepts_count INT DEFAULT 0,
  due_revision_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.retention_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  decay_factor FLOAT DEFAULT 0.05,
  last_retention_score INT DEFAULT 50,
  last_computed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_retention UNIQUE(user_id, concept_id)
);

CREATE TABLE IF NOT EXISTS public.mistake_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  count INT DEFAULT 1,
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_mistake UNIQUE(user_id, concept_id, category)
);

CREATE TABLE IF NOT EXISTS public.learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- e.g., PRACTICE_SUBMIT, AI_TUTOR_QUERY, REVISION_COMPLETE
  payload JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVISION QUEUE & SESSIONS
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

CREATE TABLE IF NOT EXISTS public.revision_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concepts_revised INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MOCK TESTS & ATTEMPTS
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

CREATE TABLE IF NOT EXISTS public.mock_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_num INT DEFAULT 1
);

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
  status TEXT DEFAULT 'SUBMITTED',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.mock_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_attempt_id TEXT NOT NULL REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INT DEFAULT 0,
  marked_for_review BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_attempt_question UNIQUE(mock_attempt_id, question_id)
);

-- 9. OCR PROCESSING ENGINE
CREATE TABLE IF NOT EXISTS public.ocr_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  original_file_name TEXT NOT NULL,
  storage_key TEXT,
  file_size_bytes INT DEFAULT 0,
  page_count INT DEFAULT 1,
  strategy TEXT DEFAULT 'VISION_OCR',
  exam TEXT DEFAULT 'UPSC CSE',
  expected_question_count INT DEFAULT 100,
  status TEXT DEFAULT 'PENDING',
  processed_pages INT DEFAULT 0,
  detected_questions_count INT DEFAULT 0,
  approved_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  confidence_score FLOAT DEFAULT 0.0,
  questions JSONB DEFAULT '[]'::jsonb,
  missing_question_numbers JSONB DEFAULT '[]'::jsonb,
  duplicate_question_numbers JSONB DEFAULT '[]'::jsonb,
  review_state JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ocr_extracted_questions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.ocr_jobs(id) ON DELETE CASCADE,
  question_num INT,
  page_number INT DEFAULT 1,
  question_text TEXT NOT NULL,
  question_en TEXT,
  question_hi TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  options_en JSONB DEFAULT '[]'::jsonb,
  options_hi JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  explanation TEXT,
  explanation_en TEXT,
  explanation_hi TEXT,
  available_languages JSONB DEFAULT '["en"]'::jsonb,
  subject_id TEXT,
  topic_id TEXT,
  concept_id TEXT,
  difficulty TEXT DEFAULT 'MEDIUM',
  exam_tag TEXT,
  pyq_year INT,
  source TEXT DEFAULT 'OCR_IMPORTED',
  is_pyq BOOLEAN DEFAULT false,
  has_visual_content BOOLEAN DEFAULT false,
  field_confidence JSONB DEFAULT '{}'::jsonb,
  ocr_confidence FLOAT DEFAULT 0.0,
  status TEXT DEFAULT 'NEEDS_REVIEW',
  destination TEXT DEFAULT 'PRACTICE_BANK',
  validation_errors JSONB DEFAULT '[]'::jsonb,
  duplicate_warning JSONB DEFAULT 'null'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_extracted_questions_job_id ON public.ocr_extracted_questions(job_id);

-- 10. CURRENT AFFAIRS & SOURCES
CREATE TABLE IF NOT EXISTS public.current_affairs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  subtopic TEXT,
  summary TEXT NOT NULL,
  background TEXT,
  key_facts JSONB DEFAULT '[]'::jsonb,
  prelims_relevance TEXT,
  mains_relevance TEXT,
  exam_relevance TEXT DEFAULT 'BOTH',
  bihar_relevance TEXT,
  related_subject TEXT,
  related_concept_ids JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  prelims_pointers JSONB DEFAULT '[]'::jsonb,
  mains_dimensions JSONB DEFAULT '{}'::jsonb,
  important_facts JSONB DEFAULT '[]'::jsonb,
  raw_content TEXT,
  source_provenance JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'PRIMARY_GOVT',
  status TEXT DEFAULT 'PUBLISHED',
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.current_affairs_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT DEFAULT 'GOVT_RELEASE',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GOALS, RESOURCES & NOTIFICATIONS
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

CREATE TABLE IF NOT EXISTS public.shared_tests (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  access_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AI CONVERSATIONS, MESSAGES, DRAFTS & TELEMETRY
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.ai_drafts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('MCQ', 'CONCEPT', 'SUMMARY', 'MAINS')),
  prompt TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT,
  concept_id TEXT,
  generated_data JSONB,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- TUTOR, MAINS_EVAL, MISTAKE_ANALYSIS, CONTENT_STUDIO
  provider TEXT DEFAULT 'GEMINI',
  model TEXT DEFAULT 'gemini-3.6-flash',
  prompt_snippet TEXT,
  response_status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_concepts_subject ON public.concepts(subject_id);
CREATE INDEX IF NOT EXISTS idx_concepts_topic ON public.concepts(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_concept ON public.questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user ON public.concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_concept ON public.concept_mastery(concept_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_items_user ON public.revision_items(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON public.mock_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_current_affairs_date ON public.current_affairs(date);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);

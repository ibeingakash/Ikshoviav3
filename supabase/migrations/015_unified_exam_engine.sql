-- ====================================================================
-- IKSHOVIA MIGRATION 015: UNIFIED PRELIMS + MAINS + INTERVIEW ENGINE
-- Additive, non-destructive migration establishing shared exam hierarchy:
-- EXAM -> STAGE -> PAPER -> SUBJECT -> TOPIC -> CONCEPT -> QUESTION -> ATTEMPT -> EVALUATION -> PERFORMANCE
-- ====================================================================

-- 1. Papers: Add Stage and metadata columns
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'PRELIMS';
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS order_num INT DEFAULT 1;

-- 2. Questions: Add Stage, Marks, Word Limit, Origin, and Rubric
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'PRELIMS';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks NUMERIC DEFAULT 2;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS word_limit INT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'OFFICIAL_COMMISSION';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS model_structure JSONB DEFAULT '{}'::jsonb;

-- Origin protection: ensure valid origins
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS chk_question_origin;
ALTER TABLE public.questions ADD CONSTRAINT chk_question_origin 
  CHECK (origin IN ('OFFICIAL_COMMISSION', 'ADMIN_IMPORTED', 'IKSHOVIA_CREATED', 'TEACHER_CREATED', 'AI_GENERATED'));

-- Stage validation
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS chk_question_stage;
ALTER TABLE public.questions ADD CONSTRAINT chk_question_stage 
  CHECK (stage IN ('PRELIMS', 'MAINS', 'INTERVIEW'));

-- Protect Official commission integrity
CREATE INDEX IF NOT EXISTS idx_questions_stage_exam ON public.questions (stage, exam);
CREATE INDEX IF NOT EXISTS idx_questions_origin ON public.questions (origin);
CREATE INDEX IF NOT EXISTS idx_questions_paper ON public.questions (paper);

-- 3. Mains Submissions Table
CREATE TABLE IF NOT EXISTS public.mains_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  paper_id TEXT,
  paper TEXT,
  subject_id TEXT,
  topic_id TEXT,
  concept_id TEXT,
  attempt_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'EVALUATED', 'ARCHIVED')),
  submission_type TEXT NOT NULL DEFAULT 'TYPED' CHECK (submission_type IN ('TYPED', 'HANDWRITTEN_IMAGE', 'HANDWRITTEN_PDF', 'HYBRID')),
  answer_text TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  word_count INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  ocr_extracted_text TEXT,
  ocr_status TEXT DEFAULT 'NONE' CHECK (ocr_status IN ('NONE', 'PENDING', 'COMPLETED', 'FAILED')),
  marks_obtained NUMERIC,
  max_marks NUMERIC DEFAULT 10,
  percentage NUMERIC,
  feedback TEXT,
  strengths TEXT,
  weaknesses TEXT,
  missing_dimensions JSONB DEFAULT '[]'::jsonb,
  actionable_improvement TEXT,
  evaluation JSONB DEFAULT '{}'::jsonb, -- 10-point rubric breakdown
  evaluator_type TEXT DEFAULT 'NONE' CHECK (evaluator_type IN ('NONE', 'AI', 'TEACHER', 'SELF', 'PEER')),
  evaluated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mains_sub_user_q ON public.mains_submissions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_mains_sub_user ON public.mains_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mains_sub_created ON public.mains_submissions(created_at DESC);

-- 4. Interview Profiles Table (DAF & Candidate Background)
CREATE TABLE IF NOT EXISTS public.interview_profiles (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  target_exam TEXT NOT NULL DEFAULT 'UPSC CSE',
  graduation_degree TEXT,
  graduation_subject TEXT,
  optional_subject TEXT,
  hometown TEXT,
  home_state TEXT,
  work_experience TEXT,
  hobbies_interests TEXT,
  achievements TEXT,
  cadre_preferences JSONB DEFAULT '[]'::jsonb,
  service_preferences JSONB DEFAULT '[]'::jsonb,
  daf_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Interview Questions Table
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id TEXT PRIMARY KEY,
  exam TEXT NOT NULL DEFAULT 'UPSC',
  category TEXT NOT NULL CHECK (category IN (
    'DAF_PROFILE', 'EDUCATION', 'HOMETOWN', 'STATE', 'CURRENT_AFFAIRS',
    'GOVERNANCE', 'ECONOMY', 'SOCIETY', 'ETHICS', 'SITUATIONAL', 'OPINION_ANALYSIS'
  )),
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  source TEXT DEFAULT 'IKSHOVIA_BOARD',
  origin TEXT NOT NULL DEFAULT 'IKSHOVIA_CREATED' CHECK (origin IN (
    'OFFICIAL_COMMISSION', 'IKSHOVIA_CREATED', 'TEACHER_CREATED', 'AI_GENERATED'
  )),
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  suggested_dimensions JSONB DEFAULT '[]'::jsonb,
  expected_counter_arguments JSONB DEFAULT '[]'::jsonb,
  parent_question_id TEXT REFERENCES public.interview_questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_q_category ON public.interview_questions(category, exam);

-- 6. Interview Sessions Table (Interactive Panel Simulator)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam TEXT NOT NULL DEFAULT 'UPSC',
  board_name TEXT DEFAULT 'National Administrative Mock Board',
  mode TEXT NOT NULL DEFAULT 'DAF_BASED' CHECK (mode IN ('DAF_BASED', 'TOPIC_BASED', 'MOCK_BOARD', 'CURRENT_AFFAIRS')),
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_step INT DEFAULT 0,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sess_user ON public.interview_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_sess_created ON public.interview_sessions(created_at DESC);

-- 7. Add Stage & Academic Linking to Resources Table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'PRELIMS';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS paper TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS concept_id TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS question_id TEXT;

-- 8. Seed Standard Canonical Papers for UPSC and BPSC across Stages
INSERT INTO public.papers (id, exam_id, name, code, total_marks, stage, description, order_num)
VALUES
  -- UPSC Prelims
  ('paper_upsc_prelims_gs1', 'exam_upsc', 'General Studies Paper I', 'GS-1-PRE', 200, 'PRELIMS', 'Indian Polity, History, Geography, Economy, Environment, General Science & CA', 1),
  ('paper_upsc_prelims_csat', 'exam_upsc', 'General Studies Paper II (CSAT)', 'CSAT-PRE', 200, 'PRELIMS', 'Reading Comprehension, Reasoning, Quantitative Aptitude & Analytical Ability', 2),
  
  -- UPSC Mains
  ('paper_upsc_mains_essay', 'exam_upsc', 'Essay', 'ESSAY', 250, 'MAINS', 'Philosophical, Social, Economic, and Administrative Essays', 1),
  ('paper_upsc_mains_gs1', 'exam_upsc', 'General Studies Paper I', 'GS-1', 250, 'MAINS', 'Indian Heritage, History, Culture, Geography of the World and Society', 2),
  ('paper_upsc_mains_gs2', 'exam_upsc', 'General Studies Paper II', 'GS-2', 250, 'MAINS', 'Governance, Constitution, Polity, Social Justice and International Relations', 3),
  ('paper_upsc_mains_gs3', 'exam_upsc', 'General Studies Paper III', 'GS-3', 250, 'MAINS', 'Technology, Economic Development, Biodiversity, Environment, Security & Disaster Management', 4),
  ('paper_upsc_mains_gs4', 'exam_upsc', 'General Studies Paper IV', 'GS-4', 250, 'MAINS', 'Ethics, Integrity, Aptitude and Case Studies', 5),

  -- UPSC Interview
  ('paper_upsc_interview', 'exam_upsc', 'Personality Test & Interview', 'PT-BOARD', 275, 'INTERVIEW', 'DAF Verification, Current Issues, Administrative Aptitude and Personality Assessment', 1),

  -- BPSC Prelims
  ('paper_bpsc_prelims_gs', 'exam_bpsc', 'General Studies Prelims', 'BPSC-GS-PRE', 150, 'PRELIMS', 'General Science, History, Bihar Special, Geography, Polity, Economy & Mental Ability', 1),

  -- BPSC Mains
  ('paper_bpsc_mains_hindi', 'exam_bpsc', 'General Hindi (Qualifying)', 'BPSC-HINDI', 100, 'MAINS', 'General Hindi Essay, Grammar, Syntax and Precis', 1),
  ('paper_bpsc_mains_gs1', 'exam_bpsc', 'General Studies Paper I', 'BPSC-GS-1', 300, 'MAINS', 'Modern Indian History & Culture, National & International CA, Statistical Analysis & Graphs', 2),
  ('paper_bpsc_mains_gs2', 'exam_bpsc', 'General Studies Paper II', 'BPSC-GS-2', 300, 'MAINS', 'Indian Polity, Indian Economy & Geography of India, Role of Science & Tech', 3),
  ('paper_bpsc_mains_essay', 'exam_bpsc', 'Essay Paper', 'BPSC-ESSAY', 300, 'MAINS', 'Analytical, Bihar cultural themes, Socio-economic and Philosophical Essays', 4),

  -- BPSC Interview
  ('paper_bpsc_interview', 'exam_bpsc', 'Personality Test / Interview', 'BPSC-PT', 120, 'INTERVIEW', 'State Administration, Profile, Current Events & Behavioral Evaluation', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  total_marks = EXCLUDED.total_marks,
  stage = EXCLUDED.stage,
  description = EXCLUDED.description,
  order_num = EXCLUDED.order_num;

-- 9. Ensure default stage for existing questions
UPDATE public.questions SET stage = 'PRELIMS' WHERE stage IS NULL;
UPDATE public.questions SET origin = 'OFFICIAL_COMMISSION' WHERE is_pyq = true AND (origin IS NULL OR origin = '');
UPDATE public.questions SET origin = 'IKSHOVIA_CREATED' WHERE is_pyq = false AND (origin IS NULL OR origin = '');

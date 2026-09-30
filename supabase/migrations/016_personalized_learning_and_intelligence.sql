-- ====================================================================
-- IKSHOVIA MIGRATION 016: PERSONALIZED LEARNING & INTELLIGENCE LAYER
-- Study Planner, Smart Revision History, CA-Exam Intelligence Linkages,
-- and Multi-Attempt Mains Revision Tracing
-- ====================================================================

-- 1. Personalized Study Plans
CREATE TABLE IF NOT EXISTS public.study_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Personalized Preparation Plan',
  target_exam TEXT NOT NULL DEFAULT 'UPSC CSE',
  target_stage TEXT NOT NULL DEFAULT 'INTEGRATED' CHECK (target_stage IN ('PRELIMS', 'MAINS', 'INTERVIEW', 'INTEGRATED')),
  target_year INT NOT NULL DEFAULT 2026,
  daily_study_hours NUMERIC NOT NULL DEFAULT 4.0,
  study_days JSONB NOT NULL DEFAULT '["MON","TUE","WED","THU","FRI","SAT","SUN"]'::jsonb,
  preferred_study_time TEXT NOT NULL DEFAULT 'FLEXIBLE' CHECK (preferred_study_time IN ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE')),
  exam_date DATE,
  priority_subjects JSONB NOT NULL DEFAULT '["sub_polity", "sub_economy"]'::jsonb,
  preparation_level TEXT NOT NULL DEFAULT 'INTERMEDIATE' CHECK (preparation_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON public.study_plans(user_id, status);

-- 2. Daily & Weekly Study Plan Tasks
CREATE TABLE IF NOT EXISTS public.study_plan_tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
  date DATE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('PRELIMS_PYQ', 'WEAK_AREA_DRILL', 'SPACED_REVISION', 'MAINS_WRITING', 'CURRENT_AFFAIRS', 'RESOURCE_READING', 'INTERVIEW_PREP')),
  title TEXT NOT NULL,
  description TEXT,
  subject_id TEXT,
  topic_id TEXT,
  concept_id TEXT,
  question_id TEXT,
  article_id TEXT,
  resource_id TEXT,
  estimated_minutes INT NOT NULL DEFAULT 30,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW', 'URGENT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  order_num INT DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_user_date ON public.study_plan_tasks(user_id, date, status);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_plan ON public.study_plan_tasks(plan_id, order_num);

-- 3. Spaced Repetition Revision History (Ebbinghaus Active Recall Logs)
CREATE TABLE IF NOT EXISTS public.revision_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  response_quality TEXT NOT NULL CHECK (response_quality IN ('AGAIN', 'HARD', 'GOOD', 'EASY')),
  retention_before NUMERIC,
  retention_after NUMERIC,
  interval_days NUMERIC,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rev_history_user_concept ON public.revision_history(user_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_rev_history_reviewed_at ON public.revision_history(reviewed_at DESC);

-- 4. Enable RLS and security access
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.study_plans FROM anon, authenticated;
GRANT ALL ON TABLE public.study_plans TO postgres, service_role;

REVOKE ALL ON TABLE public.study_plan_tasks FROM anon, authenticated;
GRANT ALL ON TABLE public.study_plan_tasks TO postgres, service_role;

REVOKE ALL ON TABLE public.revision_history FROM anon, authenticated;
GRANT ALL ON TABLE public.revision_history TO postgres, service_role;

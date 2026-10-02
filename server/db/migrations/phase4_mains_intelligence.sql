-- ====================================================================
-- IKSHOVIA Mains Copy Checking Intelligence — Phase 4.1 Schema
-- ====================================================================

-- 1. Faculty Reviews & Ground Truth
CREATE TABLE IF NOT EXISTS public.mains_evaluation_reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || gen_random_uuid()::text),
  submission_id TEXT NOT NULL REFERENCES public.mains_submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  faculty_id TEXT NOT NULL,
  faculty_name TEXT,
  faculty_role TEXT DEFAULT 'TEACHER',
  
  -- AI Score Snapshot
  ai_marks_obtained NUMERIC,
  ai_max_marks NUMERIC DEFAULT 10,
  ai_normalized_percentage NUMERIC,
  ai_dimensions JSONB DEFAULT '{}'::jsonb,
  ai_feedback TEXT,
  ai_model_version TEXT DEFAULT 'gemini-3.8-flash:v1',
  
  -- Faculty Ground Truth
  faculty_marks_obtained NUMERIC NOT NULL,
  faculty_max_marks NUMERIC NOT NULL DEFAULT 10,
  faculty_normalized_percentage NUMERIC NOT NULL,
  faculty_dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  faculty_feedback TEXT NOT NULL,
  faculty_strengths JSONB DEFAULT '[]'::jsonb,
  faculty_weaknesses JSONB DEFAULT '[]'::jsonb,
  faculty_actionable_improvement TEXT,
  faculty_verdict TEXT NOT NULL DEFAULT 'EDITED', -- ACCEPTED, EDITED, REJECTED, INDEPENDENT
  
  -- Disagreement Analytics
  marks_difference NUMERIC NOT NULL DEFAULT 0,
  percentage_difference NUMERIC NOT NULL DEFAULT 0,
  disagreement_level TEXT NOT NULL DEFAULT 'AGREEMENT', -- AGREEMENT, MINOR_DISAGREEMENT, MAJOR_DISAGREEMENT
  
  -- Training Eligibility
  training_eligibility TEXT NOT NULL DEFAULT 'CANDIDATE', -- CANDIDATE, REVIEW_REQUIRED, TRAINING_ELIGIBLE, EXCLUDED, USED_IN_TRAINING
  exclusion_reason TEXT,
  marked_by TEXT,
  marked_at TIMESTAMPTZ,
  
  -- Question Classification & Directives
  question_type TEXT NOT NULL DEFAULT 'GS', -- GS, ESSAY, ETHICS, OPTIONAL, BPSC_GS, BPSC_OPTIONAL, OTHER
  directive TEXT DEFAULT 'DISCUSS',
  demand_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Anti-leakage / Integrity Checksum
  answer_hash TEXT NOT NULL,
  word_count INT DEFAULT 0,
  ocr_confidence NUMERIC DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mains_reviews_sub ON public.mains_evaluation_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_mains_reviews_eligibility ON public.mains_evaluation_reviews(training_eligibility);
CREATE INDEX IF NOT EXISTS idx_mains_reviews_hash ON public.mains_evaluation_reviews(answer_hash);
CREATE INDEX IF NOT EXISTS idx_mains_reviews_faculty ON public.mains_evaluation_reviews(faculty_id);

-- 2. Datasets
CREATE TABLE IF NOT EXISTS public.mains_evaluation_datasets (
  id TEXT PRIMARY KEY,
  version_name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, VALIDATED, FROZEN, PUBLISHED, ARCHIVED
  total_examples INT NOT NULL DEFAULT 0,
  exam_distribution JSONB DEFAULT '{}'::jsonb,
  subject_distribution JSONB DEFAULT '{}'::jsonb,
  question_type_distribution JSONB DEFAULT '{}'::jsonb,
  marks_distribution JSONB DEFAULT '{}'::jsonb,
  average_marks NUMERIC DEFAULT 0,
  faculty_distribution JSONB DEFAULT '{}'::jsonb,
  data_cutoff_date TIMESTAMPTZ,
  checksum_sha256 TEXT,
  export_file_path TEXT,
  is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  frozen_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dataset Items
CREATE TABLE IF NOT EXISTS public.mains_evaluation_dataset_items (
  id TEXT PRIMARY KEY DEFAULT ('ds_item_' || gen_random_uuid()::text),
  dataset_id TEXT NOT NULL REFERENCES public.mains_evaluation_datasets(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL,
  review_id TEXT NOT NULL REFERENCES public.mains_evaluation_reviews(id) ON DELETE CASCADE,
  split TEXT NOT NULL DEFAULT 'TRAIN', -- TRAIN, VALIDATION, TEST
  anonymized_learner_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  input_payload JSONB NOT NULL,
  target_payload JSONB NOT NULL,
  metadata_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_dataset_submission UNIQUE(dataset_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_ds_items_split ON public.mains_evaluation_dataset_items(dataset_id, split);
CREATE INDEX IF NOT EXISTS idx_ds_items_hash ON public.mains_evaluation_dataset_items(answer_hash);
CREATE INDEX IF NOT EXISTS idx_ds_items_learner ON public.mains_evaluation_dataset_items(anonymized_learner_id);

-- 4. Benchmarks
CREATE TABLE IF NOT EXISTS public.mains_evaluation_benchmarks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL UNIQUE,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  total_items INT NOT NULL DEFAULT 0,
  tier_distribution JSONB DEFAULT '{}'::jsonb,
  metrics_summary JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mains_evaluation_benchmark_items (
  id TEXT PRIMARY KEY DEFAULT ('bench_item_' || gen_random_uuid()::text),
  benchmark_id TEXT NOT NULL REFERENCES public.mains_evaluation_benchmarks(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL,
  review_id TEXT NOT NULL REFERENCES public.mains_evaluation_reviews(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'AVERAGE', -- WEAK, AVERAGE, STRONG, EXCELLENT
  question_type TEXT NOT NULL DEFAULT 'GS',
  marks_range TEXT NOT NULL DEFAULT '10_MARKS',
  expected_marks NUMERIC NOT NULL,
  expected_rubric JSONB NOT NULL,
  expected_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_bench_submission UNIQUE(benchmark_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_bench_items_bench ON public.mains_evaluation_benchmark_items(benchmark_id);

-- 5. Models Registry
CREATE TABLE IF NOT EXISTS public.mains_evaluation_models (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  version TEXT NOT NULL UNIQUE,
  base_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
  dataset_version TEXT,
  benchmark_version TEXT,
  status TEXT NOT NULL DEFAULT 'EXPERIMENTAL', -- EXPERIMENTAL, BENCHMARKED, SHADOW, PRODUCTION, RETIRED
  mae NUMERIC,
  mape NUMERIC,
  pearson_correlation NUMERIC,
  rubric_dimension_agreement JSONB DEFAULT '{}'::jsonb,
  major_disagreement_rate NUMERIC,
  feedback_usefulness_score NUMERIC,
  hallucination_rate NUMERIC,
  missing_key_point_rate NUMERIC,
  prompt_version TEXT DEFAULT 'v1.0',
  rubric_version TEXT DEFAULT 'v1.0',
  retrieval_context_version TEXT DEFAULT 'v1.0',
  model_provider TEXT DEFAULT 'ikshovia_hybrid',
  training_config JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Training Jobs
CREATE TABLE IF NOT EXISTS public.mains_evaluation_training_jobs (
  id TEXT PRIMARY KEY DEFAULT ('trjob_' || gen_random_uuid()::text),
  dataset_version TEXT NOT NULL REFERENCES public.mains_evaluation_datasets(version_name) ON DELETE RESTRICT,
  model_version TEXT NOT NULL,
  base_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
  training_type TEXT NOT NULL DEFAULT 'SFT', -- SFT, LORA, CALIBRATION
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  artifact_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Evaluation Runs
CREATE TABLE IF NOT EXISTS public.mains_evaluation_runs (
  id TEXT PRIMARY KEY DEFAULT ('evalrun_' || gen_random_uuid()::text),
  model_id TEXT NOT NULL REFERENCES public.mains_evaluation_models(id) ON DELETE CASCADE,
  benchmark_id TEXT REFERENCES public.mains_evaluation_benchmarks(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'BENCHMARK', -- BENCHMARK, SHADOW, CANARY, PRODUCTION
  sample_count INT NOT NULL DEFAULT 0,
  overall_mae NUMERIC,
  overall_agreement_rate NUMERIC,
  breakdown_by_subject JSONB DEFAULT '{}'::jsonb,
  breakdown_by_question_type JSONB DEFAULT '{}'::jsonb,
  detailed_results JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

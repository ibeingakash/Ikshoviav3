-- ====================================================================
-- IKSHOVIA Phase 4.1B: Faculty Ground-Truth Collection & Dataset Expansion
-- ====================================================================

-- 1. Extend mains_submissions with review workflow locks & OCR correction fields
ALTER TABLE public.mains_submissions
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS review_locked_by TEXT,
  ADD COLUMN IF NOT EXISTS review_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS original_ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS corrected_ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_corrected_by TEXT,
  ADD COLUMN IF NOT EXISTS ocr_corrected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ocr_correction_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ocr_approved BOOLEAN DEFAULT FALSE;

-- 2. Extend mains_evaluation_reviews with workflow lock & versioning
ALTER TABLE public.mains_evaluation_reviews
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS review_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ocr_verified BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_mains_sub_review_status ON public.mains_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_mains_sub_ocr_status ON public.mains_submissions(ocr_status);

-- 3. Training Safety Gate Configuration Table
CREATE TABLE IF NOT EXISTS public.mains_training_gate_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  minimum_verified_reviews INT NOT NULL DEFAULT 250,
  minimum_subjects INT NOT NULL DEFAULT 5,
  minimum_unique_answers INT NOT NULL DEFAULT 200,
  minimum_benchmark_items INT NOT NULL DEFAULT 20,
  max_disagreement_threshold NUMERIC NOT NULL DEFAULT 25.0,
  notes TEXT DEFAULT 'Safety threshold configuration for proprietary Mains evaluation fine-tuning',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default configuration if empty
INSERT INTO public.mains_training_gate_config (
  id, enabled, minimum_verified_reviews, minimum_subjects, minimum_unique_answers, minimum_benchmark_items, max_disagreement_threshold, notes, updated_at
) VALUES (
  'default', TRUE, 250, 5, 200, 20, 25.0, 'Configured Phase 4.1B conservative safety gate threshold', NOW()
) ON CONFLICT (id) DO NOTHING;

-- Migration 011: Production Database & Supabase Egress Optimization
-- Adds normalized URL lookups, removes runtime DDL dependencies, and introduces targeted high-selectivity composite indexes

-- 1. Normalized Source URL for fast O(1) deduplication without runtime string manipulation
ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS normalized_source_url TEXT;

UPDATE public.current_affairs 
SET normalized_source_url = LOWER(TRIM(TRAILING '/' FROM TRIM(source_url))) 
WHERE normalized_source_url IS NULL AND source_url IS NOT NULL;

-- 2. Current Affairs performance indexes
CREATE INDEX IF NOT EXISTS idx_current_affairs_norm_url 
ON public.current_affairs (normalized_source_url);

CREATE INDEX IF NOT EXISTS idx_current_affairs_date_pub_rel 
ON public.current_affairs (date DESC, is_published, relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_current_affairs_published_type 
ON public.current_affairs (is_published, article_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_current_affairs_bihar 
ON public.current_affairs (date DESC) 
WHERE is_bihar_special = TRUE OR exam_relevance = 'BPSC';

-- 3. Mock Test & Question candidate indexes
CREATE INDEX IF NOT EXISTS idx_mock_questions_test_order 
ON public.mock_questions (mock_test_id, order_num);

CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_created 
ON public.mock_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_subject_active 
ON public.questions (subject_id, is_active);

CREATE INDEX IF NOT EXISTS idx_questions_topic_active 
ON public.questions (topic_id, is_active);

CREATE INDEX IF NOT EXISTS idx_questions_concept_active 
ON public.questions (concept_id, is_active);

CREATE INDEX IF NOT EXISTS idx_questions_source_type 
ON public.questions (source_type, is_active);

-- 4. PYQ Questions & Papers indexes
CREATE INDEX IF NOT EXISTS idx_pyq_questions_paper_num 
ON public.pyq_questions (paper_id, question_number);

CREATE INDEX IF NOT EXISTS idx_pyq_papers_exam_year 
ON public.pyq_papers (exam, year DESC);

-- 5. Learner Practice & Attempts indexes
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_time 
ON public.question_attempts (user_id, timestamp DESC);

-- 6. Knowledge Base & Ingestion indexes
CREATE INDEX IF NOT EXISTS idx_data_resources_url 
ON public.data_resources (url);

CREATE INDEX IF NOT EXISTS idx_data_documents_resource 
ON public.data_documents (resource_id);

-- 7. OCR and Short Notes indexes
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_user_status 
ON public.ocr_jobs (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_short_notes_subject_status 
ON public.short_notes (subject, status);

CREATE INDEX IF NOT EXISTS idx_short_note_blocks_note_order 
ON public.short_note_blocks (short_note_id, order_index);

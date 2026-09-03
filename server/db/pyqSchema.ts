import pool from './pool.js';

export async function ensurePyqSchema(): Promise<void> {
  console.log('[PYQ Schema] Initializing enhanced official PYQ repository tables...');
  
  await pool.query(`
    -- 1. Official PYQ Papers Table
    CREATE TABLE IF NOT EXISTS public.pyq_papers (
      id TEXT PRIMARY KEY,
      exam TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      year INT NOT NULL,
      exam_cycle TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'Prelims',
      paper TEXT NOT NULL,
      paper_name TEXT NOT NULL,
      paper_code TEXT,
      official_source_url TEXT NOT NULL,
      official_paper_url TEXT NOT NULL,
      source_domain TEXT NOT NULL,
      expected_question_count INT NOT NULL,
      actual_question_count INT NOT NULL DEFAULT 0,
      verified_question_count INT NOT NULL DEFAULT 0,
      verification_status TEXT NOT NULL DEFAULT 'INCOMPLETE',
      answer_key_status TEXT NOT NULL DEFAULT 'OFFICIAL_KEY_VERIFIED',
      language TEXT NOT NULL DEFAULT 'bilingual',
      marks_per_correct NUMERIC NOT NULL DEFAULT 2.0,
      negative_marking NUMERIC NOT NULL DEFAULT 0.666,
      duration_minutes INT NOT NULL DEFAULT 120,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Ensure any incremental columns exist
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pyq_papers' AND column_name='paper_title') THEN
        ALTER TABLE public.pyq_papers ALTER COLUMN paper_title DROP NOT NULL;
      END IF;
    END $$;

    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS exam_name TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS exam_cycle TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS paper_name TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS paper_code TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS official_paper_url TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS source_domain TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS verified_question_count INT DEFAULT 0;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS answer_key_status TEXT DEFAULT 'OFFICIAL_KEY_VERIFIED';
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'bilingual';
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS marks_per_correct NUMERIC DEFAULT 2.0;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS negative_marking NUMERIC DEFAULT 0.666;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 120;

    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS commission TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS paper_type TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'OFFICIAL_COMMISSION';
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS official_pdf_url TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS document_hash TEXT;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS detected_question_count INT DEFAULT 0;
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS first_discovered_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS last_ingested_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS validation_report JSONB DEFAULT '{}'::jsonb;

    -- 2. Official PYQ Questions Table
    CREATE TABLE IF NOT EXISTS public.pyq_questions (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL REFERENCES public.pyq_papers(id) ON DELETE CASCADE,
      question_number INT NOT NULL,
      question_text TEXT NOT NULL,
      question_en TEXT,
      question_hi TEXT,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      options_en JSONB DEFAULT '[]'::jsonb,
      options_hi JSONB DEFAULT '[]'::jsonb,
      official_answer TEXT,
      official_answer_source TEXT DEFAULT 'Official Commission Master Answer Key',
      solution TEXT NOT NULL,
      solution_source TEXT DEFAULT 'IKSHOVIA Subject Expert & Official References',
      topic TEXT,
      subject TEXT,
      subject_id TEXT,
      gs_paper TEXT,
      prelims_area TEXT,
      difficulty TEXT DEFAULT 'MEDIUM',
      source_page TEXT,
      source_page_number INT,
      official_paper_url TEXT,
      source_verification_status TEXT DEFAULT 'OFFICIAL_VERIFIED',
      answer_verification_status TEXT DEFAULT 'OFFICIAL_VERIFIED',
      verification_status TEXT DEFAULT 'OFFICIAL_VERIFIED',
      source_type TEXT NOT NULL DEFAULT 'OFFICIAL_COMMISSION',
      document_hash TEXT,
      stem_hash TEXT,
      extraction_method TEXT DEFAULT 'TEXT',
      extraction_confidence NUMERIC DEFAULT 1.0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT pyq_questions_paper_qnum_key UNIQUE (paper_id, question_number)
    );

    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'OFFICIAL_COMMISSION';
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS source_page_number INT;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS official_paper_url TEXT;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS source_verification_status TEXT DEFAULT 'OFFICIAL_VERIFIED';
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS answer_verification_status TEXT DEFAULT 'OFFICIAL_VERIFIED';
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'SINGLE_CHOICE';
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS statements JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS statements_hi JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS match_data JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS match_data_hi JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS document_hash TEXT;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS stem_hash TEXT;
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS extraction_method TEXT DEFAULT 'TEXT';
    ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT 1.0;

    -- 3. Automatic Ingestion & Discovery Runs Table
    CREATE TABLE IF NOT EXISTS public.pyq_ingestion_runs (
      id TEXT PRIMARY KEY,
      commission TEXT NOT NULL,
      scan_type TEXT NOT NULL DEFAULT 'SCHEDULED',
      status TEXT NOT NULL,
      discovered_count INT NOT NULL DEFAULT 0,
      new_papers_count INT NOT NULL DEFAULT 0,
      processed_count INT NOT NULL DEFAULT 0,
      failed_count INT NOT NULL DEFAULT 0,
      details JSONB DEFAULT '{}'::jsonb,
      error_message TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_pyq_papers_exam_year ON public.pyq_papers(exam, year, stage, paper);
    CREATE INDEX IF NOT EXISTS idx_pyq_papers_cycle ON public.pyq_papers(exam, exam_cycle);
    CREATE INDEX IF NOT EXISTS idx_pyq_questions_paper_id ON public.pyq_questions(paper_id);
    CREATE INDEX IF NOT EXISTS idx_pyq_questions_qnum ON public.pyq_questions(paper_id, question_number);
    CREATE INDEX IF NOT EXISTS idx_pyq_questions_status ON public.pyq_questions(verification_status);
    CREATE INDEX IF NOT EXISTS idx_pyq_ingestion_runs_status ON public.pyq_ingestion_runs(status, started_at DESC);
  `);
  
  console.log('[PYQ Schema] Tables pyq_papers and pyq_questions verified with full provenance.');
}

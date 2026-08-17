import fs from 'fs';
import path from 'path';
import pool from './pool.js';
import { ensureQuestionBankSeed } from './seedQuestions.js';

export async function ensureDatabaseSchema(): Promise<void> {
  console.log('[DB Schema] Checking database schema status...');

  try {
    // 1. Check if core tables already exist
    const checkRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'current_affairs', 'questions', 'learner_models', 'mock_tests');
    `);

    const existingTables = new Set(checkRes.rows.map(r => r.table_name));
    const allCoreExist =
      existingTables.has('users') &&
      existingTables.has('current_affairs') &&
      existingTables.has('questions') &&
      existingTables.has('learner_models') &&
      existingTables.has('mock_tests');

    if (!allCoreExist) {
      console.log('[DB Schema] Core tables missing. Executing initial schema migrations...');

      const migrationFiles = [
        'supabase/migrations/001_initial_schema.sql',
        'supabase/migrations/002_rls_policies.sql',
        'supabase/migrations/003_seed_data.sql',
      ];

      for (const file of migrationFiles) {
        const sqlPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(sqlPath)) {
          console.log(`[DB Schema] Running migration: ${file}`);
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await pool.query(sql);
          console.log(`[DB Schema] Completed migration: ${file}`);
        } else {
          console.warn(`[DB Schema] Migration file not found: ${sqlPath}`);
        }
      }
    } else {
      console.log('[DB Schema] Core schema already present in database.');
    }

    // 2. Ensure any optional incremental columns/tables exist
    await pool.query(`
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_en TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_hi TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options_en JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options_hi JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation_en TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation_hi TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS available_languages JSONB DEFAULT '["en"]'::jsonb;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS paper TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number INT;
      ALTER TABLE public.mock_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SUBMITTED';
      ALTER TABLE public.mock_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.mock_answers ADD COLUMN IF NOT EXISTS marked_for_review BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam TEXT DEFAULT 'UPSC CSE';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS expected_question_count INT DEFAULT 100;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS rejected_count INT DEFAULT 0;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS exam_relevance TEXT DEFAULT 'BOTH';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS bihar_relevance TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS prelims_pointers JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS mains_dimensions JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS important_facts JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS raw_content TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS source_provenance JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS article_type TEXT DEFAULT 'CURRENT_AFFAIR';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS editorial_analysis JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS topic_cluster_id TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS topic_cluster_title TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS related_editorial_ids JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS related_current_affair_ids JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS related_pyq_ids JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS secondary_source TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS editorial_source TEXT;

      -- Scheduled & automated ingestion tracking
      CREATE TABLE IF NOT EXISTS public.data_ingestion_runs (
        id TEXT PRIMARY KEY,
        source_identifier TEXT NOT NULL,
        display_name TEXT,
        job_type TEXT DEFAULT 'SCHEDULED_INGESTION',
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        resources_discovered INT DEFAULT 0,
        resources_fetched INT DEFAULT 0,
        resources_skipped INT DEFAULT 0,
        documents_created INT DEFAULT 0,
        documents_updated INT DEFAULT 0,
        duplicates_count INT DEFAULT 0,
        current_affairs_published INT DEFAULT 0,
        editorials_published INT DEFAULT 0,
        errors JSONB DEFAULT '[]'::jsonb,
        duration_ms DOUBLE PRECISION DEFAULT 0,
        freshness_status TEXT DEFAULT 'SYNC_SUCCESSFUL',
        latest_article_date TEXT,
        latest_article_title TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Source Freshness Tracking table
      CREATE TABLE IF NOT EXISTS public.source_freshness (
        source_identifier TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        schedule_description TEXT,
        last_attempted_run TIMESTAMPTZ,
        last_successful_run TIMESTAMPTZ,
        latest_discovered_article TEXT,
        latest_published_article TEXT,
        latest_article_date TEXT,
        failure_count INT DEFAULT 0,
        freshness_status TEXT DEFAULT 'PENDING',
        last_error TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      DO $
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'mock_questions_mock_test_id_question_id_key'
        ) THEN
          ALTER TABLE public.mock_questions
          ADD CONSTRAINT mock_questions_mock_test_id_question_id_key
          UNIQUE (mock_test_id, question_id);
        END IF;
      END
      $$;
    `);

    // 3. Ensure authentic question bank seeds exist
    await ensureQuestionBankSeed();

    // 4. Verify total tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log(`[DB Schema] Database verified. Total public tables: ${tableNames.length} (${tableNames.join(', ')})`);
  } catch (err: any) {
    console.error('[DB Schema] Schema initialization notice:', err.message);
  }
}

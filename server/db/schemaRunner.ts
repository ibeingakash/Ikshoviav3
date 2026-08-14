import fs from 'fs';
import path from 'path';
import pool from './pool.js';

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
    `);

    // 3. Verify total tables
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

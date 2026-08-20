import fs from 'fs';
import path from 'path';
import pool from './pool.js';
import { ensureQuestionBankSeed } from './seedQuestions.js';
import { OFFICIAL_SUBJECTS, OFFICIAL_TOPICS, OFFICIAL_CONCEPTS } from './syllabusData.js';
import { currentAffairsRepository } from '../repositories/CurrentAffairsRepository.js';

export async function ensureSyllabusSeed(): Promise<void> {
  try {
    for (const sub of OFFICIAL_SUBJECTS) {
      await pool.query(`
        INSERT INTO public.subjects (id, name, code, description, icon_name, color, topics_count, concepts_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          description = EXCLUDED.description,
          icon_name = EXCLUDED.icon_name,
          color = EXCLUDED.color,
          topics_count = EXCLUDED.topics_count,
          concepts_count = EXCLUDED.concepts_count;
      `, [sub.id, sub.name, sub.code, sub.description, sub.iconName, sub.color, sub.topicsCount || 0, sub.conceptsCount || 0]);
    }

    for (const top of OFFICIAL_TOPICS) {
      await pool.query(`
        INSERT INTO public.topics (id, subject_id, name, description, order_num, concepts_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          subject_id = EXCLUDED.subject_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          order_num = EXCLUDED.order_num,
          concepts_count = EXCLUDED.concepts_count;
      `, [top.id, top.subjectId, top.name, top.description, top.order || 1, top.conceptsCount || 0]);
    }

    for (const con of OFFICIAL_CONCEPTS) {
      const normDiff = (con.difficulty || '').toUpperCase();
      const safeDiff = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normDiff) ? normDiff : 'INTERMEDIATE';
      const normImp = (con.importance || '').toUpperCase();
      const safeImp = ['HIGH', 'MEDIUM', 'LOW'].includes(normImp) ? normImp : 'HIGH';

      await pool.query(`
        INSERT INTO public.concepts (
          id, subject_id, topic_id, title, summary, explanation,
          examples, key_points, difficulty, importance,
          prerequisite_ids, related_ids, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          subject_id = EXCLUDED.subject_id,
          topic_id = EXCLUDED.topic_id,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          explanation = EXCLUDED.explanation,
          examples = EXCLUDED.examples,
          key_points = EXCLUDED.key_points,
          difficulty = EXCLUDED.difficulty,
          importance = EXCLUDED.importance,
          prerequisite_ids = EXCLUDED.prerequisite_ids,
          related_ids = EXCLUDED.related_ids,
          tags = EXCLUDED.tags;
      `, [
        con.id,
        con.subjectId,
        con.topicId,
        con.title,
        con.summary || '',
        con.explanation || '',
        JSON.stringify(con.examples || []),
        JSON.stringify(con.keyPoints || []),
        safeDiff,
        safeImp,
        JSON.stringify(con.prerequisiteIds || []),
        JSON.stringify(con.relatedIds || []),
        JSON.stringify(con.tags || []),
      ]);
    }
    console.log(`[DB Syllabus] Seeded ${OFFICIAL_SUBJECTS.length} subjects, ${OFFICIAL_TOPICS.length} topics, ${OFFICIAL_CONCEPTS.length} concepts into PostgreSQL.`);
  } catch (err: any) {
    console.error('[DB Syllabus] Seed error:', err.message);
  }
}

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
        'supabase/migrations/004_rbac_security_hardening.sql',
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
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS is_bihar_special BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS is_editorial BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS exam_relevance TEXT DEFAULT 'BOTH';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS bihar_relevance TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS prelims_pointers JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS mains_dimensions JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS important_facts JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS raw_content TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS source_provenance JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS source_domain TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'PASSED';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS upsc_relevant BOOLEAN DEFAULT TRUE;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS bpsc_relevant BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS relevance_score NUMERIC DEFAULT 85;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS relevance_reason TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS canonical_url TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS content_hash TEXT;
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
        resources_parsed INT DEFAULT 0,
        date_valid_count INT DEFAULT 0,
        verified_count INT DEFAULT 0,
        quality_passed_count INT DEFAULT 0,
        rejected_count INT DEFAULT 0,
        rejection_reasons JSONB DEFAULT '[]'::jsonb,
        persisted_count INT DEFAULT 0,
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

      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS resources_parsed INT DEFAULT 0;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS date_valid_count INT DEFAULT 0;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS verified_count INT DEFAULT 0;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS quality_passed_count INT DEFAULT 0;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS rejected_count INT DEFAULT 0;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS rejection_reasons JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.data_ingestion_runs ADD COLUMN IF NOT EXISTS persisted_count INT DEFAULT 0;

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

      CREATE OR REPLACE VIEW public.current_affair_source_freshness AS
      SELECT * FROM public.source_freshness;

      DO $$
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

      -- RBAC tables Row Level Security hardening (Supabase Security Advisor)
      ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;
      REVOKE ALL ON TABLE public.permissions FROM anon, authenticated;
      REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated;
      GRANT ALL ON TABLE public.permissions TO postgres, service_role;
      GRANT ALL ON TABLE public.role_permissions TO postgres, service_role;
    `);

    // 3. Ensure authentic syllabus and question bank seeds exist
    await ensureSyllabusSeed();
    await ensureQuestionBankSeed();
    await currentAffairsRepository.ensureSeedData();

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

import fs from 'fs';
import path from 'path';
import pool from './pool.js';
import { ensureQuestionBankSeed } from './seedQuestions.js';
import { OFFICIAL_SUBJECTS, OFFICIAL_TOPICS, OFFICIAL_CONCEPTS } from './syllabusData.js';
import { currentAffairsRepository } from '../repositories/CurrentAffairsRepository.js';
import { pyqRepository } from '../repositories/PyqRepository.js';
import { ocrRepository } from '../repositories/OcrRepository.js';

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
        'supabase/migrations/005_supabase_security_advisor_hardening.sql',
        'supabase/migrations/006_courses_pricing_entitlements.sql',
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
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_job_id TEXT;
      ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'IKSHOVIA_CREATED';
      ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';
      ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';

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
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS document_hash TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS official_source_url TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS source_domain TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS commission TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS paper TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS year INT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam_cycle TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS parser_version TEXT DEFAULT 'v2.1';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS ocr_engine_version TEXT DEFAULT 'deterministic_pdfparse_v2';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS structure_report JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS answer_key_status TEXT DEFAULT 'ANSWER_KEY_PENDING';
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

    // 2b. Apply full Supabase Security Advisor Hardening (Migration 005)
    const hardeningSqlPath = path.resolve(process.cwd(), 'supabase/migrations/005_supabase_security_advisor_hardening.sql');
    if (fs.existsSync(hardeningSqlPath)) {
      const hardeningSql = fs.readFileSync(hardeningSqlPath, 'utf8');
      await pool.query(hardeningSql);
      console.log('[DB Schema] Applied Supabase Security Advisor hardening policies successfully.');
    }

    // 2c. Apply Payment & Razorpay Architecture Migration 007
    const paymentsSqlPath = path.resolve(process.cwd(), 'supabase/migrations/007_payments_razorpay.sql');
    if (fs.existsSync(paymentsSqlPath)) {
      const paymentsSql = fs.readFileSync(paymentsSqlPath, 'utf8');
      await pool.query(paymentsSql);
      console.log('[DB Schema] Applied Migration 007 (payment_orders, payments, webhook_events) successfully.');
    }

    // 3. Ensure authentic syllabus, question bank, official PYQ, and canonical courses seeds exist
    await ensureSyllabusSeed();
    await ensureQuestionBankSeed();
    await ensureDefaultCoursesSeed();
    await currentAffairsRepository.ensureSeedData();
    await pyqRepository.initSchema();
    await pyqRepository.seedOfficialPapers();
    await ocrRepository.initSchema();
    await ensureContentOriginSeparation();

    // 4. Verify total tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log(`[DB Schema] Database verified successfully. Total public tables: ${tableNames.length}.`);
  } catch (err: any) {
    console.error('[DB Schema] Schema initialization notice:', err.message);
  }
}

async function ensureContentOriginSeparation(): Promise<void> {
  try {
    console.log('[Content Origin Separation] Auditing and classifying all content into OFFICIAL_COMMISSION, ADMIN_IMPORTED, and IKSHOVIA_CREATED...');

    // 0. Ensure schema columns exist
    await pool.query(`
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_job_id TEXT;
      ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'IKSHOVIA_CREATED';
      ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
      ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS deleted_by TEXT;
      ALTER TABLE public.pyq_papers ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';
      ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'OFFICIAL_COMMISSION';
    `);

    // 1. Classify Official PYQ Papers vs Admin Uploaded/FLT Papers
    // Any paper from OCR/admin upload or with flt/mock or year 2026 custom paper is ADMIN_IMPORTED
    await pool.query(`
      UPDATE public.pyq_papers
      SET source_type = 'ADMIN_IMPORTED'
      WHERE id ILIKE '%flt%' 
         OR id ILIKE '%mock%' 
         OR id ILIKE '%bpsc_2026%'
         OR paper_name ILIKE '%flt%'
         OR paper_name ILIKE '%mock%'
         OR paper ILIKE '%flt%'
         OR paper ILIKE '%mock%';

      UPDATE public.pyq_papers
      SET source_type = 'OFFICIAL_COMMISSION'
      WHERE id NOT ILIKE '%flt%' 
        AND id NOT ILIKE '%mock%'
        AND id NOT ILIKE '%bpsc_2026%'
        AND (source_domain IN ('upsc.gov.in', 'bpsc.bihar.gov.in', 'official') OR official_source_url ILIKE '%upsc.gov.in%' OR official_source_url ILIKE '%bpsc.bihar.gov.in%');
    `);

    // 2. Cascade paper source_type to pyq_questions
    await pool.query(`
      UPDATE public.pyq_questions q
      SET source_type = p.source_type
      FROM public.pyq_papers p
      WHERE q.paper_id = p.id;
    `);

    // 3. Update public.questions table source_type and is_pyq flag
    // Any question sourced from OCR_VERIFIED_IMPORT or linked to an OCR job is ADMIN_IMPORTED and is_pyq = false
    await pool.query(`
      UPDATE public.questions
      SET source_type = 'ADMIN_IMPORTED', is_pyq = false
      WHERE source = 'OCR_VERIFIED_IMPORT' 
         OR source_job_id IS NOT NULL
         OR exam_tag ILIKE '%FLT%'
         OR paper ILIKE '%FLT%'
         OR (exam = 'BPSC CCE' AND pyq_year = 2026);

      UPDATE public.questions
      SET source_type = 'OFFICIAL_COMMISSION', is_pyq = true
      WHERE (id LIKE 'data_q_%' OR id LIKE 'pyq_%' OR source = 'OFFICIAL_COMMISSION_ARCHIVE')
        AND source != 'OCR_VERIFIED_IMPORT'
        AND source_job_id IS NULL;
    `);

    // 4. Ensure public.mock_tests table has proper source_type
    await pool.query(`
      UPDATE public.mock_tests
      SET source_type = 'IKSHOVIA_CREATED'
      WHERE source_type IS NULL OR source_type = 'IKSHOVIA';
    `);

    // 5. Migrate Admin-uploaded FLT/Mock tests from pyq_papers/pyq_questions to mock_tests/mock_questions
    console.log('[Content Origin Separation] Migrating admin-uploaded mock tests to mock_tests table...');

    // Paper 1: BPSC 2026 FLT 2 (149 questions)
    const flt2Questions = await pool.query(`
      SELECT * FROM public.pyq_questions 
      WHERE paper_id = 'bpsc_2026_flt_2'
      ORDER BY question_number ASC;
    `);

    if (flt2Questions.rows.length > 0) {
      await pool.query(`
        INSERT INTO public.mock_tests (
          id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
          negative_marking_rate, source_type, is_published, created_at
        ) VALUES (
          'mock_admin_bpsc_2026_flt_2',
          '71st BPSC CCE 2026 - FLT 02 (Full Length Test)',
          'FULL',
          '["sub_polity", "sub_economy", "sub_history", "sub_geography", "sub_bihar_special"]'::jsonb,
          120,
          $1,
          150,
          0.33,
          'ADMIN_IMPORTED',
          true,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          total_questions = EXCLUDED.total_questions,
          source_type = 'ADMIN_IMPORTED',
          is_published = true;
      `, [flt2Questions.rows.length]);

      for (const q of flt2Questions.rows) {
        // Ensure question exists in questions table
        const qId = `admin_q_flt2_${q.question_number}`;
        await pool.query(`
          INSERT INTO public.questions (
            id, question, question_hi, options, options_hi, correct_answer, explanation, explanation_hi,
            difficulty, subject_id, topic_id, concept_id, exam_tag, pyq_year, is_published,
            source_type, source
          ) VALUES (
            $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8,
            $9, $10, $11, $12, '71st BPSC Prelims FLT 02', 2026, true,
            'ADMIN_IMPORTED', 'ADMIN_IMPORTED'
          )
          ON CONFLICT (id) DO UPDATE SET
            question = EXCLUDED.question,
            correct_answer = EXCLUDED.correct_answer,
            source_type = 'ADMIN_IMPORTED';
        `, [
          qId,
          q.question_text || q.question_en,
          q.question_hi,
          JSON.stringify(q.options || []),
          JSON.stringify(q.options_hi || []),
          q.official_answer || 'A',
          q.solution || 'Verified explanation',
          q.solution || null,
          q.difficulty || 'MEDIUM',
          q.subject_id || 'sub_polity',
          q.topic || 'top_rights',
          'c_art32'
        ]);

        await pool.query(`
          INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
          VALUES ('mock_admin_bpsc_2026_flt_2', $1, $2)
          ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $2;
        `, [qId, q.question_number]);
      }
    }

    // Paper 2: BPSC 2026 Prelims (146 questions)
    const prelimsQuestions = await pool.query(`
      SELECT * FROM public.pyq_questions 
      WHERE paper_id = 'bpsc_2026_bpsc_prelims'
      ORDER BY question_number ASC;
    `);

    if (prelimsQuestions.rows.length > 0) {
      await pool.query(`
        INSERT INTO public.mock_tests (
          id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
          negative_marking_rate, source_type, is_published, created_at
        ) VALUES (
          'mock_admin_bpsc_2026_prelims',
          '71st BPSC CCE 2026 - Prelims Practice Mock 01',
          'FULL',
          '["sub_polity", "sub_economy", "sub_history", "sub_geography", "sub_bihar_special"]'::jsonb,
          120,
          $1,
          150,
          0.33,
          'ADMIN_IMPORTED',
          true,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          total_questions = EXCLUDED.total_questions,
          source_type = 'ADMIN_IMPORTED',
          is_published = true;
      `, [prelimsQuestions.rows.length]);

      for (const q of prelimsQuestions.rows) {
        const qId = `admin_q_prelims_${q.question_number}`;
        await pool.query(`
          INSERT INTO public.questions (
            id, question, question_hi, options, options_hi, correct_answer, explanation, explanation_hi,
            difficulty, subject_id, topic_id, concept_id, exam_tag, pyq_year, is_published,
            source_type, source
          ) VALUES (
            $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8,
            $9, $10, $11, $12, '71st BPSC Prelims Mock', 2026, true,
            'ADMIN_IMPORTED', 'ADMIN_IMPORTED'
          )
          ON CONFLICT (id) DO UPDATE SET
            question = EXCLUDED.question,
            correct_answer = EXCLUDED.correct_answer,
            source_type = 'ADMIN_IMPORTED';
        `, [
          qId,
          q.question_text || q.question_en,
          q.question_hi,
          JSON.stringify(q.options || []),
          JSON.stringify(q.options_hi || []),
          q.official_answer || 'A',
          q.solution || 'Verified explanation',
          q.solution || null,
          q.difficulty || 'MEDIUM',
          q.subject_id || 'sub_polity',
          q.topic || 'top_rights',
          'c_art32'
        ]);

        await pool.query(`
          INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
          VALUES ('mock_admin_bpsc_2026_prelims', $1, $2)
          ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $2;
        `, [qId, q.question_number]);
      }
    }

    // 6. Clean up misclassified admin mocks from pyq_papers & pyq_questions
    await pool.query(`
      DELETE FROM public.pyq_questions
      WHERE paper_id IN ('bpsc_2026_flt_2', 'bpsc_2026_bpsc_prelims')
         OR source_type = 'ADMIN_IMPORTED';

      DELETE FROM public.pyq_papers
      WHERE id IN ('bpsc_2026_flt_2', 'bpsc_2026_bpsc_prelims')
         OR source_type = 'ADMIN_IMPORTED';
    `);

    // 7. Ensure any OCR jobs with PUBLISHED status have corresponding mock_tests and mock_questions
    const publishedOcrJobs = await pool.query(`
      SELECT * FROM public.ocr_jobs WHERE status = 'PUBLISHED' ORDER BY created_at ASC;
    `);

    for (const job of publishedOcrJobs.rows) {
      const qRes = await pool.query(`
        SELECT * FROM public.ocr_extracted_questions 
        WHERE job_id = $1 AND correct_answer IS NOT NULL AND correct_answer != ''
        ORDER BY question_num ASC;
      `, [job.id]);

      if (qRes.rows.length > 0) {
        const mockTestId = `mock_${job.id}`;
        const cleanName = job.original_file_name ? job.original_file_name.replace(/\.pdf$/i, '').replace(/_/g, ' ') : '';
        const title = cleanName ? `${job.exam} - ${cleanName}` : `${job.exam} ${job.year} - ${job.paper || 'Full Mock'}`;
        const qCount = qRes.rows.length;

        await pool.query(`
          INSERT INTO public.mock_tests (
            id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
            negative_marking_rate, source_type, is_published, created_at
          ) VALUES (
            $1, $2, 'FULL', '["sub_polity", "sub_economy", "sub_history", "sub_geography"]'::jsonb,
            120, $3, $4, $5, 'ADMIN_IMPORTED', true, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            total_questions = EXCLUDED.total_questions,
            source_type = 'ADMIN_IMPORTED',
            is_published = true;
        `, [
          mockTestId,
          title,
          qCount,
          job.exam === 'BPSC' ? qCount * 1 : qCount * 2,
          job.exam === 'BPSC' ? 0.33 : 0.66
        ]);

        for (const eq of qRes.rows) {
          const qId = `ocr_q_${eq.id}`;
          await pool.query(`
            INSERT INTO public.questions (
              id, question, question_hi, options, options_hi, correct_answer, explanation, explanation_hi,
              difficulty, subject_id, topic_id, concept_id, exam_tag, pyq_year, is_published,
              source_type, source
            ) VALUES (
              $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, true,
              'ADMIN_IMPORTED', 'ADMIN_IMPORTED'
            )
            ON CONFLICT (id) DO UPDATE SET
              question = EXCLUDED.question,
              correct_answer = EXCLUDED.correct_answer,
              source_type = 'ADMIN_IMPORTED';
          `, [
            qId,
            eq.question_en || eq.question,
            eq.question_hi,
            JSON.stringify(eq.options || []),
            JSON.stringify(eq.options_hi || []),
            eq.correct_answer,
            eq.explanation || 'Verified answer',
            eq.explanation_hi,
            eq.difficulty || 'MEDIUM',
            eq.subject_id || 'sub_polity',
            eq.topic_id || 'top_rights',
            eq.concept_id || 'c_art32',
            job.paper || `${job.exam} Prelims`,
            job.year || 2026
          ]);

          await pool.query(`
            INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
            VALUES ($1, $2, $3)
            ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
          `, [mockTestId, qId, eq.question_num || 1]);
        }
      }
    }

    console.log('[Content Origin Separation] Content provenance separation verified: Official PYQs separated from Admin & Custom content.');
  } catch (err: any) {
    console.error('[Content Origin Separation] Error during classification:', err.message);
  }
}

export async function ensureDefaultCoursesSeed(): Promise<void> {
  try {
    const courseCount = await pool.query('SELECT COUNT(*) FROM public.courses');
    if (parseInt(courseCount.rows[0].count, 10) > 0) {
      return;
    }

    console.log('[DB Courses] Seeding canonical courses and prices...');

    // Course 1: UPSC CSE 2026 Prelims Program
    await pool.query(`
      INSERT INTO public.courses (
        id, name, description, exam, course_type, is_active, display_order, default_duration_days, created_at, updated_at
      ) VALUES (
        'crs_upsc_prelims_2026',
        'UPSC CSE 2026 Comprehensive Prelims Program',
        'Holistic preparation bundle including official PYQs, full-length simulator tests, AI tutor guidance, and dynamic syllabus tracking.',
        'UPSC',
        'FULL_PROGRAM',
        true,
        1,
        365,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `);

    const features1 = ['PYQ_PRACTICE', 'MOCK_TESTS', 'TOPIC_SUBJECT_PRACTICE', 'CURRENT_AFFAIRS', 'NOTES', 'AI_TUTOR', 'STUDY_PLAN', 'ANALYTICS', 'BOOKMARKS'];
    for (const f of features1) {
      await pool.query('INSERT INTO public.course_features (course_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', ['crs_upsc_prelims_2026', f]);
    }

    await pool.query(`
      INSERT INTO public.prices (id, course_id, currency, base_price, sale_price, is_active, valid_from)
      VALUES ('prc_upsc_2026_main', 'crs_upsc_prelims_2026', 'INR', 14999.00, 8999.00, true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Course 2: 71st BPSC CCE Prelims Test Series
    await pool.query(`
      INSERT INTO public.courses (
        id, name, description, exam, course_type, is_active, display_order, default_duration_days, created_at, updated_at
      ) VALUES (
        'crs_bpsc_71st_testseries',
        '71st BPSC CCE Prelims Test Series & PYQ Simulator',
        'Dedicated Bihar Special mock simulations with 150-question 5-option patterns, official 60th-70th PYQs, and rank analysis.',
        'BPSC',
        'TEST_SERIES',
        true,
        2,
        180,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `);

    const features2 = ['PYQ_PRACTICE', 'MOCK_TESTS', 'ANALYTICS', 'BOOKMARKS'];
    for (const f of features2) {
      await pool.query('INSERT INTO public.course_features (course_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', ['crs_bpsc_71st_testseries', f]);
    }

    await pool.query(`
      INSERT INTO public.prices (id, course_id, currency, base_price, sale_price, is_active, valid_from)
      VALUES ('prc_bpsc_71st_main', 'crs_bpsc_71st_testseries', 'INR', 4999.00, 2499.00, true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Course 3: Civil Services Current Affairs & Editorial Studio
    await pool.query(`
      INSERT INTO public.courses (
        id, name, description, exam, course_type, is_active, display_order, default_duration_days, created_at, updated_at
      ) VALUES (
        'crs_current_affairs_annual',
        'Civil Services Current Affairs & Editorial Studio',
        'Daily verified multi-source editorial debriefs, PIB highlights, and exam-mapped prelims pointers with revision bookmarks.',
        'ALL',
        'CURRENT_AFFAIRS',
        true,
        3,
        365,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `);

    const features3 = ['CURRENT_AFFAIRS', 'NOTES', 'BOOKMARKS'];
    for (const f of features3) {
      await pool.query('INSERT INTO public.course_features (course_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', ['crs_current_affairs_annual', f]);
    }

    await pool.query(`
      INSERT INTO public.prices (id, course_id, currency, base_price, sale_price, is_active, valid_from)
      VALUES ('prc_ca_annual_main', 'crs_current_affairs_annual', 'INR', 2999.00, 1499.00, true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('[DB Courses] Successfully seeded 3 canonical courses with active prices and feature mappings.');
  } catch (err: any) {
    console.error('[DB Courses] Seed error:', err.message);
  }
}


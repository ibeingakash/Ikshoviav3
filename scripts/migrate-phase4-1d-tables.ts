import pool from '../server/db/pool.js';

async function migrate() {
  console.log('Migrating Phase 4.1D database tables...');

  await pool.query(`
    -- 1. Review Workload Configuration
    CREATE TABLE IF NOT EXISTS public.mains_review_workload_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      max_active_reviews_per_teacher INTEGER DEFAULT 5,
      max_daily_new_reviews INTEGER DEFAULT 20,
      max_pending_assignments INTEGER DEFAULT 10,
      double_review_percentage NUMERIC DEFAULT 20.0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO public.mains_review_workload_config (
      id, max_active_reviews_per_teacher, max_daily_new_reviews, max_pending_assignments, double_review_percentage
    ) VALUES ('default', 5, 20, 10, 20.0)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Faculty Review Assignments & Workload Tracking
    CREATE TABLE IF NOT EXISTS public.mains_review_assignments (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES public.mains_submissions(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL,
      reviewer_name TEXT,
      assigned_by TEXT,
      status TEXT NOT NULL DEFAULT 'ASSIGNED',
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      claimed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      review_duration_seconds INTEGER,
      priority_score NUMERIC DEFAULT 0,
      priority_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_mains_rev_assign_sub ON public.mains_review_assignments(submission_id);
    CREATE INDEX IF NOT EXISTS idx_mains_rev_assign_rev ON public.mains_review_assignments(reviewer_id, status);

    -- 3. Immutable Dataset Version Snapshots
    CREATE TABLE IF NOT EXISTS public.mains_dataset_snapshots (
      id TEXT PRIMARY KEY,
      version_name TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      eligible_items_count INTEGER DEFAULT 0,
      checksum_sha256 TEXT,
      eligible_submission_ids JSONB DEFAULT '[]'::jsonb,
      coverage_statistics JSONB DEFAULT '{}'::jsonb,
      duplicate_statistics JSONB DEFAULT '{}'::jsonb,
      learner_diversity JSONB DEFAULT '{}'::jsonb,
      paper_distribution JSONB DEFAULT '{}'::jsonb,
      tier_distribution JSONB DEFAULT '{}'::jsonb,
      creator_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      frozen_at TIMESTAMPTZ
    );

    -- 4. Dataset Acquisition Events / Funnel Logging
    CREATE TABLE IF NOT EXISTS public.mains_dataset_acquisition_logs (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      question_id TEXT,
      submission_id TEXT,
      learner_id TEXT,
      paper TEXT,
      subject TEXT,
      directive TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_mains_acq_event ON public.mains_dataset_acquisition_logs(event_name, created_at);
  `);

  console.log('✓ Phase 4.1D database tables successfully verified & migrated.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

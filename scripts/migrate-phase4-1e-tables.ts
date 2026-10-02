import pool from '../server/db/pool.js';

export async function migratePhase41eTables() {
  console.log('--- Migrating Phase 4.1E Quality Control, Calibration & Release Tables ---');

  // 1. mains_dataset_quality_runs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.mains_dataset_quality_runs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      overall_readiness TEXT NOT NULL,
      summary_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
      scorecard JSONB NOT NULL,
      blocking_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
      initiated_by TEXT DEFAULT 'ADMIN',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_mains_dataset_quality_runs_created_at ON public.mains_dataset_quality_runs (created_at DESC);
  `);
  console.log('✓ mains_dataset_quality_runs table ready.');

  // 2. mains_faculty_calibration_logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.mains_faculty_calibration_logs (
      id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      calibration_summary JSONB NOT NULL,
      evaluator_consistencies JSONB NOT NULL DEFAULT '[]'::jsonb,
      inter_rater_reliability JSONB NOT NULL DEFAULT '{}'::jsonb,
      triggered_by TEXT DEFAULT 'ADMIN',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_mains_faculty_calib_logs_created_at ON public.mains_faculty_calibration_logs (created_at DESC);
  `);
  console.log('✓ mains_faculty_calibration_logs table ready.');

  // 3. Extend mains_dataset_release_candidates with manifest & signature
  await pool.query(`
    ALTER TABLE public.mains_dataset_release_candidates 
      ADD COLUMN IF NOT EXISTS manifest JSONB,
      ADD COLUMN IF NOT EXISTS dataset_signature TEXT,
      ADD COLUMN IF NOT EXISTS git_commit TEXT;
  `);
  console.log('✓ mains_dataset_release_candidates extended with manifest & signature columns.');

  console.log('All Phase 4.1E tables migrated successfully.');
}

if (process.argv[1]?.endsWith('migrate-phase4-1e-tables.ts')) {
  migratePhase41eTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

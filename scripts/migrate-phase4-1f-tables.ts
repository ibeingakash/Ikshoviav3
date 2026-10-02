import pool from '../server/db/pool.js';

export async function migratePhase41fTables() {
  console.log('--- Migrating Phase 4.1F Dataset Operations & Calibration Tables ---');

  // 1. mains_faculty_calibration_attempts (strictly isolated from production ground truth)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.mains_faculty_calibration_attempts (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      faculty_id TEXT NOT NULL,
      faculty_name TEXT,
      submission_id TEXT NOT NULL,
      assigned_marks NUMERIC NOT NULL,
      ground_truth_marks NUMERIC NOT NULL,
      marks_diff NUMERIC NOT NULL,
      pct_diff NUMERIC NOT NULL,
      rubric_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
      ground_truth_rubric JSONB NOT NULL DEFAULT '{}'::jsonb,
      rubric_agreement_pct NUMERIC NOT NULL DEFAULT 0,
      performance_tier_assigned TEXT,
      performance_tier_ground_truth TEXT,
      performance_tier_match BOOLEAN NOT NULL DEFAULT false,
      feedback TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_mains_calib_attempts_faculty ON public.mains_faculty_calibration_attempts (faculty_id, created_at DESC);
  `);
  console.log('✓ mains_faculty_calibration_attempts table ready.');

  // 2. mains_operations_thresholds_config (configurable thresholds for SLA & automatic flags)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.mains_operations_thresholds_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      sla_hours_bracket_1 INTEGER NOT NULL DEFAULT 24,
      sla_hours_bracket_2 INTEGER NOT NULL DEFAULT 48,
      sla_hours_bracket_3 INTEGER NOT NULL DEFAULT 72,
      review_backlog_high_threshold INTEGER NOT NULL DEFAULT 20,
      ocr_backlog_high_threshold INTEGER NOT NULL DEFAULT 10,
      adjudication_backlog_high_threshold INTEGER NOT NULL DEFAULT 5,
      learner_concentration_pct_threshold NUMERIC NOT NULL DEFAULT 30.0,
      duplicate_spike_pct_threshold NUMERIC NOT NULL DEFAULT 10.0,
      calibration_warning_pct_threshold NUMERIC NOT NULL DEFAULT 25.0,
      notes TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO public.mains_operations_thresholds_config (id, notes)
    VALUES ('default', 'Production operational thresholds for Phase 4.1F SLA and automated health flags')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✓ mains_operations_thresholds_config table ready.');

  console.log('All Phase 4.1F tables migrated successfully.');
}

if (process.argv[1]?.endsWith('migrate-phase4-1f-tables.ts')) {
  migratePhase41fTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

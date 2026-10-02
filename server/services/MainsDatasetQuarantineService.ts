import pool from '../db/pool.js';
import { QuarantineRecord } from './MainsIntelligenceTypes.js';
import { mainsEvaluationIntelligenceService } from './MainsEvaluationIntelligenceService.js';

export class MainsDatasetQuarantineService {
  // ------------------------------------------------------------------
  // 1. QUARANTINE A SUBMISSION
  // ------------------------------------------------------------------
  async quarantineSubmission(params: {
    submissionId: string;
    quarantineReason: string;
    detectedBy: string;
    notes?: string;
    metadata?: any;
  }): Promise<QuarantineRecord> {
    const { submissionId, quarantineReason, detectedBy, notes, metadata } = params;

    // Check submission exists
    const subRes = await pool.query(
      `SELECT s.*, r.training_eligibility, r.faculty_verdict 
       FROM public.mains_submissions s
       LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
       WHERE s.id = $1 LIMIT 1;`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const prevEligibility = subRes.rows[0].training_eligibility || 'PENDING';

    // Update review if exists to ensure it is immediately excluded from training sets
    await pool.query(
      `UPDATE public.mains_evaluation_reviews 
       SET training_eligibility = 'EXCLUDED' 
       WHERE submission_id = $1;`,
      [submissionId]
    );

    const id = `quar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedMeta = { ...(metadata || {}) };
    delete sanitizedMeta.email;
    delete sanitizedMeta.phone;
    delete sanitizedMeta.password;

    const res = await pool.query(
      `INSERT INTO public.mains_dataset_quarantine (
        id, submission_id, quarantine_reason, detected_by, previous_eligibility_state,
        resolution_status, notes, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'QUARANTINED', $6, $7, NOW())
      RETURNING *;`,
      [id, submissionId, quarantineReason, detectedBy, prevEligibility, notes || null, JSON.stringify(sanitizedMeta)]
    );

    // Audit event in mains_dataset_events
    await mainsEvaluationIntelligenceService.recordDatasetEvent(
      'QUARANTINE_ISOLATED',
      submissionId,
      detectedBy,
      'ADMIN',
      { quarantineId: id, reason: quarantineReason }
    ).catch(() => null);

    return this.mapQuarantineRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 2. LIST QUARANTINED RECORDS
  // ------------------------------------------------------------------
  async listQuarantined(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<(QuarantineRecord & { paper?: string; questionText?: string; anonymizedLearnerId?: string })[]> {
    const limit = Math.min(100, Math.max(1, params?.limit || 50));
    const offset = Math.max(0, params?.offset || 0);
    const statusFilter = params?.status || null;

    const query = `
      SELECT 
        q.*,
        s.paper,
        s.user_id,
        qst.question as question_text
      FROM public.mains_dataset_quarantine q
      JOIN public.mains_submissions s ON q.submission_id = s.id
      JOIN public.questions qst ON s.question_id = qst.id
      WHERE ($1::text IS NULL OR q.resolution_status = $1)
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const res = await pool.query(query, [statusFilter, limit, offset]);

    return res.rows.map(row => ({
      ...this.mapQuarantineRow(row),
      paper: row.paper,
      questionText: row.question_text,
      anonymizedLearnerId: mainsEvaluationIntelligenceService.computeAnonymizedLearnerId(row.user_id)
    }));
  }

  // ------------------------------------------------------------------
  // 3. GET SINGLE QUARANTINE RECORD
  // ------------------------------------------------------------------
  async getQuarantineRecord(quarantineId: string): Promise<QuarantineRecord | null> {
    const res = await pool.query(
      `SELECT * FROM public.mains_dataset_quarantine WHERE id = $1 LIMIT 1;`,
      [quarantineId]
    );
    if (res.rows.length === 0) return null;
    return this.mapQuarantineRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 4. RESOLVE / RESTORE QUARANTINE
  // ------------------------------------------------------------------
  async resolveQuarantine(params: {
    quarantineId: string;
    resolutionStatus: 'QUARANTINED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
    outcome?: 'RESTORED' | 'PERMANENTLY_EXCLUDED';
    notes?: string;
    resolvedBy: string;
  }): Promise<QuarantineRecord> {
    const { quarantineId, resolutionStatus, outcome, notes, resolvedBy } = params;

    const existing = await this.getQuarantineRecord(quarantineId);
    if (!existing) {
      throw new Error(`Quarantine record ${quarantineId} not found`);
    }

    let restoredAt: Date | null = null;
    if (outcome === 'RESTORED') {
      restoredAt = new Date();
      // Restore review eligibility back to previous eligibility if valid
      const targetState = existing.previousEligibilityState === 'TRAINING_ELIGIBLE'
        ? 'TRAINING_ELIGIBLE'
        : 'EXCLUDED';

      await pool.query(
        `UPDATE public.mains_evaluation_reviews 
         SET training_eligibility = $1 
         WHERE submission_id = $2;`,
        [targetState, existing.submissionId]
      );
    } else if (outcome === 'PERMANENTLY_EXCLUDED') {
      await pool.query(
        `UPDATE public.mains_evaluation_reviews 
         SET training_eligibility = 'EXCLUDED' 
         WHERE submission_id = $1;`,
        [existing.submissionId]
      );
    }

    const res = await pool.query(
      `UPDATE public.mains_dataset_quarantine
       SET resolution_status = $1,
           resolution_outcome = $2,
           notes = COALESCE($3, notes),
           resolved_by = $4,
           resolved_at = NOW(),
           restored_at = COALESCE($5, restored_at)
       WHERE id = $6
       RETURNING *;`,
      [resolutionStatus, outcome || null, notes || null, resolvedBy, restoredAt, quarantineId]
    );

    // Audit resolution event
    await mainsEvaluationIntelligenceService.recordDatasetEvent(
      outcome === 'RESTORED' ? 'QUARANTINE_RESTORED' : 'QUARANTINE_RESOLVED',
      existing.submissionId,
      resolvedBy,
      'ADMIN',
      { quarantineId, resolutionStatus, outcome }
    ).catch(() => null);

    return this.mapQuarantineRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 5. AUTO-SCAN & QUARANTINE SYSTEM
  // ------------------------------------------------------------------
  async autoScanAndQuarantine(): Promise<{
    scanned: number;
    quarantinedCount: number;
    quarantinedIds: string[];
  }> {
    const quarantinedIds: string[] = [];

    // Query problematic items that are not already quarantined
    const query = `
      SELECT 
        s.id as submission_id,
        s.user_id,
        s.answer_text,
        s.ocr_confidence,
        s.submission_type,
        r.id as review_id,
        r.faculty_marks_obtained,
        r.faculty_max_marks,
        r.training_eligibility,
        bi.id as benchmark_item_id
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      LEFT JOIN public.mains_evaluation_benchmark_items bi ON s.id = bi.submission_id
      WHERE s.id NOT IN (SELECT submission_id FROM public.mains_dataset_quarantine WHERE resolution_status = 'QUARANTINED')
      LIMIT 100;
    `;

    const res = await pool.query(query);

    for (const row of res.rows) {
      let reason: string | undefined;

      // Check Benchmark Overlap
      if (row.benchmark_item_id && row.training_eligibility === 'TRAINING_ELIGIBLE') {
        reason = 'Benchmark overlap: submission is part of frozen benchmark evaluation set';
      }
      // Check Invalid Marks
      else if (
        row.faculty_marks_obtained !== null &&
        row.faculty_marks_obtained !== undefined &&
        (Number(row.faculty_marks_obtained) < 0 || Number(row.faculty_marks_obtained) > Number(row.faculty_max_marks || 250))
      ) {
        reason = `Invalid faculty marks scale: ${row.faculty_marks_obtained} outside [0, ${row.faculty_max_marks}]`;
      }
      // Check PII in student answer
      else if (row.answer_text && /([a-zA-Z0-9_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})|\b[6-9]\d{9}\b/.test(row.answer_text)) {
        reason = 'Learner PII (email/phone) detected in answer content';
      }
      // Check Test Fixtures marked as eligible
      else if (
        (row.submission_id.includes('_test_') || row.user_id.includes('_test_')) &&
        row.training_eligibility === 'TRAINING_ELIGIBLE'
      ) {
        reason = 'Automated test fixture detected in candidate pool';
      }

      if (reason) {
        await this.quarantineSubmission({
          submissionId: row.submission_id,
          quarantineReason: reason,
          detectedBy: 'SYSTEM_QUALITY_GATE_DAEMON',
          notes: 'Automated scan isolation'
        });
        quarantinedIds.push(row.submission_id);
      }
    }

    return {
      scanned: res.rows.length,
      quarantinedCount: quarantinedIds.length,
      quarantinedIds
    };
  }

  // ------------------------------------------------------------------
  // 6. QUARANTINE COUNTS & BREAKDOWN
  // ------------------------------------------------------------------
  async getQuarantineMetrics(): Promise<{
    totalQuarantined: number;
    underReview: number;
    resolved: number;
    restored: number;
    permanentlyExcluded: number;
    reasonsBreakdown: Record<string, number>;
  }> {
    const res = await pool.query(`
      SELECT 
        resolution_status,
        resolution_outcome,
        quarantine_reason,
        COUNT(*) as count
      FROM public.mains_dataset_quarantine
      GROUP BY resolution_status, resolution_outcome, quarantine_reason;
    `);

    let totalQuarantined = 0;
    let underReview = 0;
    let resolved = 0;
    let restored = 0;
    let permanentlyExcluded = 0;
    const reasonsBreakdown: Record<string, number> = {};

    for (const r of res.rows) {
      const c = Number(r.count);
      if (r.resolution_status === 'QUARANTINED') totalQuarantined += c;
      if (r.resolution_status === 'UNDER_REVIEW') underReview += c;
      if (r.resolution_status === 'RESOLVED') resolved += c;
      if (r.resolution_outcome === 'RESTORED') restored += c;
      if (r.resolution_outcome === 'PERMANENTLY_EXCLUDED') permanentlyExcluded += c;

      const reason = r.quarantine_reason || 'Unknown';
      reasonsBreakdown[reason] = (reasonsBreakdown[reason] || 0) + c;
    }

    return {
      totalQuarantined,
      underReview,
      resolved,
      restored,
      permanentlyExcluded,
      reasonsBreakdown
    };
  }

  private mapQuarantineRow(row: any): QuarantineRecord {
    return {
      id: row.id,
      submissionId: row.submission_id,
      quarantineReason: row.quarantine_reason,
      detectedBy: row.detected_by,
      previousEligibilityState: row.previous_eligibility_state,
      resolutionStatus: row.resolution_status,
      resolutionOutcome: row.resolution_outcome || undefined,
      notes: row.notes || undefined,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      resolvedAt: row.resolved_at || undefined,
      resolvedBy: row.resolved_by || undefined,
      restoredAt: row.restored_at || undefined
    };
  }
}

export const mainsDatasetQuarantineService = new MainsDatasetQuarantineService();

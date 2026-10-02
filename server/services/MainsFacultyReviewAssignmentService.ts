import pool from '../db/pool.js';
import { mainsEvaluationIntelligenceService } from './MainsEvaluationIntelligenceService.js';
import { ReviewAssignment, ReviewWorkloadConfig } from './MainsIntelligenceTypes.js';

export class MainsFacultyReviewAssignmentService {

  // ------------------------------------------------------------------
  // 1. WORKLOAD CONFIGURATION
  // ------------------------------------------------------------------
  async getWorkloadConfig(): Promise<ReviewWorkloadConfig> {
    const res = await pool.query(`SELECT * FROM public.mains_review_workload_config WHERE id = 'default' LIMIT 1;`);
    if (res.rows.length === 0) {
      return {
        id: 'default',
        maxActiveReviewsPerTeacher: 5,
        maxDailyNewReviews: 20,
        maxPendingAssignments: 10,
        doubleReviewPercentage: 20.0
      };
    }
    const r = res.rows[0];
    return {
      id: r.id,
      maxActiveReviewsPerTeacher: Number(r.max_active_reviews_per_teacher || 5),
      maxDailyNewReviews: Number(r.max_daily_new_reviews || 20),
      maxPendingAssignments: Number(r.max_pending_assignments || 10),
      doubleReviewPercentage: Number(r.double_review_percentage || 20.0),
      updatedAt: r.updated_at
    };
  }

  async updateWorkloadConfig(config: Partial<ReviewWorkloadConfig>): Promise<ReviewWorkloadConfig> {
    const current = await this.getWorkloadConfig();
    const maxActive = config.maxActiveReviewsPerTeacher ?? current.maxActiveReviewsPerTeacher;
    const maxDaily = config.maxDailyNewReviews ?? current.maxDailyNewReviews;
    const maxPending = config.maxPendingAssignments ?? current.maxPendingAssignments;
    const dblPct = config.doubleReviewPercentage ?? current.doubleReviewPercentage;

    const res = await pool.query(
      `INSERT INTO public.mains_review_workload_config (
        id, max_active_reviews_per_teacher, max_daily_new_reviews, max_pending_assignments, double_review_percentage, updated_at
      ) VALUES ('default', $1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        max_active_reviews_per_teacher = EXCLUDED.max_active_reviews_per_teacher,
        max_daily_new_reviews = EXCLUDED.max_daily_new_reviews,
        max_pending_assignments = EXCLUDED.max_pending_assignments,
        double_review_percentage = EXCLUDED.double_review_percentage,
        updated_at = NOW()
      RETURNING *;`,
      [maxActive, maxDaily, maxPending, dblPct]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      maxActiveReviewsPerTeacher: Number(r.max_active_reviews_per_teacher),
      maxDailyNewReviews: Number(r.max_daily_new_reviews),
      maxPendingAssignments: Number(r.max_pending_assignments),
      doubleReviewPercentage: Number(r.double_review_percentage),
      updatedAt: r.updated_at
    };
  }

  // ------------------------------------------------------------------
  // 2. PRIORITIZED PENDING REVIEWS
  // ------------------------------------------------------------------
  async getPendingSubmissionsPrioritized(params?: {
    limit?: number;
    offset?: number;
    paper?: string;
  }): Promise<any[]> {
    const limit = Math.min(100, Math.max(1, params?.limit || 25));
    const offset = Math.max(0, params?.offset || 0);

    // Fetch coverage to compute priority weights
    const coverage = await mainsEvaluationIntelligenceService.getCoverageAnalysis();
    const missingPapers = new Set(
      coverage.papers.filter(p => p.status === 'MISSING').map(p => p.subcategory.toUpperCase())
    );

    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.question_id,
        s.paper,
        s.status,
        s.submission_type,
        s.ocr_status,
        s.ocr_confidence,
        s.marks_obtained as ai_marks,
        s.max_marks,
        s.created_at,
        s.review_status,
        s.review_locked_by,
        s.review_locked_at,
        q.question,
        q.exam,
        COALESCE(subj.name, 'General Studies') as subject,
        COALESCE(top.name, 'Core Syllabus') as topic,
        COALESCE(drev.status, 'NONE') as double_review_status,
        drev.faculty_a_id,
        ra.id as assignment_id,
        ra.reviewer_id as assigned_reviewer_id,
        ra.reviewer_name as assigned_reviewer_name,
        ra.status as assignment_status
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.topics top ON q.topic_id = top.id
      LEFT JOIN public.mains_double_reviews drev ON s.id = drev.submission_id
      LEFT JOIN public.mains_review_assignments ra ON s.id = ra.submission_id AND ra.status IN ('ASSIGNED', 'CLAIMED')
      WHERE s.status = 'EVALUATED'
        AND COALESCE(s.review_status, 'OPEN') != 'COMPLETED'
        AND s.id NOT LIKE '%_test_%'
      ORDER BY s.created_at ASC
      LIMIT $1 OFFSET $2;
    `;

    const res = await pool.query(query, [limit * 2, offset]);

    // Calculate priority scores
    const items = res.rows.map(row => {
      let priorityScore = 0;
      const reasons: string[] = [];

      // 1. Age factor (older gets higher priority)
      const ageHours = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 3600);
      const ageWeight = Math.min(20, Math.round(ageHours * 0.5));
      priorityScore += ageWeight;
      if (ageHours > 24) reasons.push(`Pending over ${Math.round(ageHours)} hours`);

      // 2. Paper missing coverage gap
      const pUpper = (row.paper || '').toUpperCase();
      let isMissing = false;
      for (const mp of missingPapers) {
        if (pUpper.includes(mp)) {
          isMissing = true;
          break;
        }
      }
      if (isMissing) {
        priorityScore += 25;
        reasons.push('Paper has zero verified ground-truth coverage');
      }

      // 3. Adjudication required
      if (row.double_review_status === 'ADJUDICATION_REQUIRED') {
        priorityScore += 40;
        reasons.push('Major inter-rater disagreement requires Senior Board adjudication');
      } else if (row.double_review_status === 'AWAITING_SECOND_REVIEW') {
        priorityScore += 30;
        reasons.push('Awaiting second blind evaluation for double-review consensus');
      }

      // 4. Handwritten OCR completed
      if (row.submission_type === 'HANDWRITTEN_IMAGE' && row.ocr_status === 'OCR_COMPLETED') {
        priorityScore += 15;
        reasons.push('Handwritten OCR extracted with high confidence');
      }

      return {
        ...row,
        priorityScore,
        priorityReason: reasons.join('; ') || 'Standard chronological pending queue'
      };
    });

    items.sort((a, b) => b.priorityScore - a.priorityScore);
    return items.slice(0, limit);
  }

  // ------------------------------------------------------------------
  // 3. ASSIGN REVIEW & WORKLOAD BALANCING
  // ------------------------------------------------------------------
  async assignReview(params: {
    submissionId: string;
    reviewerId: string;
    reviewerName?: string;
    assignedBy?: string;
  }): Promise<ReviewAssignment> {
    const { submissionId, reviewerId, reviewerName, assignedBy } = params;

    // 1. Verify submission exists
    const subRes = await pool.query(
      `SELECT id, status, review_status, review_locked_by FROM public.mains_submissions WHERE id = $1 LIMIT 1;`,
      [submissionId]
    );
    if (subRes.rows.length === 0) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // 2. Check workload limits for this reviewer
    const config = await this.getWorkloadConfig();

    // Check active reviews count
    const activeRes = await pool.query(
      `SELECT COUNT(*) as active_count
       FROM public.mains_review_assignments
       WHERE reviewer_id = $1 AND status IN ('ASSIGNED', 'CLAIMED');`,
      [reviewerId]
    );
    const activeCount = Number(activeRes.rows[0]?.active_count || 0);
    if (activeCount >= config.maxActiveReviewsPerTeacher) {
      const err: any = new Error(
        `Workload limit reached: Faculty member '${reviewerName || reviewerId}' already has ${activeCount} active review assignments (Maximum limit: ${config.maxActiveReviewsPerTeacher}).`
      );
      err.statusCode = 429;
      throw err;
    }

    // Check daily new reviews count
    const dailyRes = await pool.query(
      `SELECT COUNT(*) as daily_count
       FROM public.mains_review_assignments
       WHERE reviewer_id = $1 AND assigned_at >= CURRENT_DATE;`,
      [reviewerId]
    );
    const dailyCount = Number(dailyRes.rows[0]?.daily_count || 0);
    if (dailyCount >= config.maxDailyNewReviews) {
      const err: any = new Error(
        `Daily limit reached: Faculty member '${reviewerName || reviewerId}' has already been assigned ${dailyCount} reviews today (Maximum limit: ${config.maxDailyNewReviews}).`
      );
      err.statusCode = 429;
      throw err;
    }

    // 3. Prevent duplicate active assignment for the same submission
    const existingActive = await pool.query(
      `SELECT id FROM public.mains_review_assignments WHERE submission_id = $1 AND status IN ('ASSIGNED', 'CLAIMED') LIMIT 1;`,
      [submissionId]
    );
    if (existingActive.rows.length > 0) {
      await pool.query(
        `UPDATE public.mains_review_assignments SET status = 'REASSIGNED', updated_at = NOW() WHERE id = $1;`,
        [existingActive.rows[0].id]
      );
    }

    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const insertRes = await pool.query(
      `INSERT INTO public.mains_review_assignments (
        id, submission_id, reviewer_id, reviewer_name, assigned_by, status,
        assigned_at, priority_score, priority_reason, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', NOW(), 10, 'Targeted faculty assignment', NOW(), NOW())
      RETURNING *;`,
      [assignmentId, submissionId, reviewerId, reviewerName || null, assignedBy || 'SYSTEM']
    );

    return this.mapAssignmentRecord(insertRes.rows[0]);
  }

  // ------------------------------------------------------------------
  // 4. GET ASSIGNMENTS FOR TEACHER
  // ------------------------------------------------------------------
  async getAssignmentsForTeacher(teacherId: string, status?: string): Promise<ReviewAssignment[]> {
    const statusFilter = status ? status : null;
    const res = await pool.query(
      `SELECT ra.*, s.paper, s.max_marks, q.question
       FROM public.mains_review_assignments ra
       JOIN public.mains_submissions s ON ra.submission_id = s.id
       JOIN public.questions q ON s.question_id = q.id
       WHERE ra.reviewer_id = $1
         AND ($2::text IS NULL OR ra.status = $2)
       ORDER BY ra.assigned_at DESC;`,
      [teacherId, statusFilter]
    );
    return res.rows.map(r => this.mapAssignmentRecord(r));
  }

  // ------------------------------------------------------------------
  // 5. AUTO-DISTRIBUTE PENDING REVIEWS AMONG ELIGIBLE TEACHERS
  // ------------------------------------------------------------------
  async autoDistributePendingReviews(): Promise<{
    distributedCount: number;
    assignedList: ReviewAssignment[];
  }> {
    const config = await this.getWorkloadConfig();

    // 1. Fetch eligible faculty members from users table
    const facultyRes = await pool.query(`
      SELECT id, name, email FROM public.users
      WHERE role IN ('TEACHER', 'ADMIN', 'SUPER_ADMIN')
      LIMIT 20;
    `);

    if (facultyRes.rows.length === 0) {
      return { distributedCount: 0, assignedList: [] };
    }

    const facultyList = facultyRes.rows;

    // 2. Fetch unassigned prioritized pending submissions
    const pendingSubs = await this.getPendingSubmissionsPrioritized({ limit: 15 });
    const unassigned = pendingSubs.filter(s => !s.assigned_reviewer_id);

    const assignedList: ReviewAssignment[] = [];
    let facultyIdx = 0;

    for (const sub of unassigned) {
      // Find a faculty member who hasn't reached active limit
      let assigned = false;
      for (let attempt = 0; attempt < facultyList.length; attempt++) {
        const fac = facultyList[(facultyIdx + attempt) % facultyList.length];
        try {
          const asgn = await this.assignReview({
            submissionId: sub.id,
            reviewerId: fac.id,
            reviewerName: fac.name || fac.email,
            assignedBy: 'AUTO_WORKLOAD_ENGINE'
          });
          assignedList.push(asgn);
          assigned = true;
          facultyIdx = (facultyIdx + attempt + 1) % facultyList.length;
          break;
        } catch (err: any) {
          // If workload limit hit, try next evaluator
          continue;
        }
      }
      if (!assigned) {
        // All evaluators have reached max active limit
        break;
      }
    }

    return {
      distributedCount: assignedList.length,
      assignedList
    };
  }

  // ------------------------------------------------------------------
  // 6. COMPLETE ASSIGNMENT TRACKING
  // ------------------------------------------------------------------
  async completeAssignment(submissionId: string, reviewerId: string): Promise<void> {
    const asgnRes = await pool.query(
      `SELECT id, assigned_at, claimed_at FROM public.mains_review_assignments
       WHERE submission_id = $1 AND reviewer_id = $2 AND status IN ('ASSIGNED', 'CLAIMED')
       LIMIT 1;`,
      [submissionId, reviewerId]
    );

    if (asgnRes.rows.length > 0) {
      const row = asgnRes.rows[0];
      const start = row.claimed_at ? new Date(row.claimed_at) : new Date(row.assigned_at);
      const durationSeconds = Math.max(1, Math.round((Date.now() - start.getTime()) / 1000));

      await pool.query(
        `UPDATE public.mains_review_assignments
         SET status = 'COMPLETED',
             completed_at = NOW(),
             review_duration_seconds = $1,
             updated_at = NOW()
         WHERE id = $2;`,
        [durationSeconds, row.id]
      );
    }
  }

  private mapAssignmentRecord(row: any): ReviewAssignment {
    return {
      id: row.id,
      submissionId: row.submission_id,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      assignedBy: row.assigned_by,
      status: row.status,
      assignedAt: row.assigned_at,
      claimedAt: row.claimed_at,
      completedAt: row.completed_at,
      reviewDurationSeconds: row.review_duration_seconds ? Number(row.review_duration_seconds) : undefined,
      priorityScore: Number(row.priority_score || 0),
      priorityReason: row.priority_reason
    };
  }
}

export const mainsFacultyReviewAssignmentService = new MainsFacultyReviewAssignmentService();

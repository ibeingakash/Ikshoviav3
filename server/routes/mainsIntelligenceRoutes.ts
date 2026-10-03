import express from 'express';
import pool from '../db/pool.js';
import { mainsEvaluationIntelligenceService } from '../services/MainsEvaluationIntelligenceService.js';
import { mainsDatasetAcquisitionService } from '../services/MainsDatasetAcquisitionService.js';
import { mainsFacultyReviewAssignmentService } from '../services/MainsFacultyReviewAssignmentService.js';
import { mainsDatasetQualityControlService } from '../services/MainsDatasetQualityControlService.js';
import { mainsFacultyCalibrationService } from '../services/MainsFacultyCalibrationService.js';
import { mainsDatasetQuarantineService } from '../services/MainsDatasetQuarantineService.js';
import { mainsDatasetReleaseCandidateService } from '../services/MainsDatasetReleaseCandidateService.js';
import { mainsDatasetOperationsService } from '../services/MainsDatasetOperationsService.js';
import { mainsTrainingReadinessAuditService } from '../services/MainsTrainingReadinessAuditService.js';
import { mainsDatasetRemediationService } from '../services/MainsDatasetRemediationService.js';
import { mainsDatasetGrowthService } from '../services/MainsDatasetGrowthService.js';
import { mainsTelegramIngestionService } from '../services/MainsTelegramIngestionService.js';

export function createMainsIntelligenceRouter(
  requireAuth: express.RequestHandler,
  requireTeacher: express.RequestHandler,
  requireAdmin: express.RequestHandler
): express.Router {
  const router = express.Router();

  // ----------------------------------------------------
  // 1. FACULTY REVIEW & GROUND TRUTH WORKFLOW
  // ----------------------------------------------------

  // POST /api/teacher/mains/:submissionId/claim-review
  router.post('/teacher/mains/:submissionId/claim-review', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const result = await mainsEvaluationIntelligenceService.claimReview(submissionId, user.id);
      res.json({ success: true, lock: result });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        error: err.message,
        lockedBy: err.lockedBy,
        lockedAt: err.lockedAt
      });
    }
  });

  // POST /api/teacher/mains/:submissionId/release-review
  router.post('/teacher/mains/:submissionId/release-review', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const result = await mainsEvaluationIntelligenceService.releaseReview(submissionId, user.id, isAdmin);
      res.json({ success: true, release: result });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/:submissionId/run-ocr
  router.post('/teacher/mains/:submissionId/run-ocr', requireTeacher, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const result = await mainsEvaluationIntelligenceService.processHandwrittenOcr(submissionId);
      res.json({ success: true, ocr: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/:submissionId/correct-ocr
  router.post('/teacher/mains/:submissionId/correct-ocr', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const { correctedText } = req.body;
      if (!correctedText || !correctedText.trim()) {
        return res.status(400).json({ error: 'correctedText is required' });
      }
      const result = await mainsEvaluationIntelligenceService.correctHandwrittenOcr(submissionId, user.id, correctedText.trim());
      res.json({ success: true, submission: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mains/evaluation/:submissionId/review
  router.post('/mains/evaluation/:submissionId/review', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const {
        marksObtained,
        maxMarks,
        dimensions,
        feedback,
        strengths,
        weaknesses,
        actionableImprovement,
        verdict,
        trainingEligibility,
        exclusionReason
      } = req.body;

      if (marksObtained === undefined || marksObtained === null) {
        return res.status(400).json({ error: 'marksObtained is required' });
      }
      if (!feedback) {
        return res.status(400).json({ error: 'feedback is required' });
      }

      const review = await mainsEvaluationIntelligenceService.recordFacultyReview({
        submissionId,
        facultyId: user.id,
        facultyName: user.name || user.email || 'Senior Faculty',
        facultyRole: user.role || 'TEACHER',
        facultyMarks: Number(marksObtained),
        facultyMaxMarks: maxMarks ? Number(maxMarks) : undefined,
        facultyDimensions: dimensions || {},
        facultyFeedback: feedback,
        facultyStrengths: strengths || [],
        facultyWeaknesses: weaknesses || [],
        facultyActionableImprovement: actionableImprovement || '',
        facultyVerdict: verdict || 'EDITED',
        trainingEligibility,
        exclusionReason
      });

      res.json({ success: true, review });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  });

  // GET /api/mains/evaluation/:submissionId
  router.get('/mains/evaluation/:submissionId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;

      const subRes = await pool.query(
        `SELECT s.*, q.question, q.paper as q_paper, q.exam as q_exam, q.marks as q_marks, q.word_limit as q_word_limit
         FROM public.mains_submissions s
         LEFT JOIN public.questions q ON s.question_id = q.id
         WHERE s.id = $1 LIMIT 1;`,
        [submissionId]
      );

      if (subRes.rows.length === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const sub = subRes.rows[0];

      // Privacy / Ownership check: Only author, teacher, or admin can access
      const isOwner = sub.user_id === user.id;
      const isPrivileged = user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ error: 'Access denied: You do not own this answer submission' });
      }

      // Fetch faculty reviews
      const reviewsRes = await pool.query(
        `SELECT * FROM public.mains_evaluation_reviews WHERE submission_id = $1 ORDER BY created_at DESC;`,
        [submissionId]
      );

      const classification = mainsEvaluationIntelligenceService.classifyQuestion({
        question: sub.question || '',
        paper: sub.paper || sub.q_paper,
        exam: sub.q_exam,
        marks: Number(sub.q_marks || sub.max_marks || 10)
      });

      const standardRubric = mainsEvaluationIntelligenceService.getStandardRubric(
        classification.questionType,
        Number(sub.max_marks || 10)
      );

      res.json({
        submission: sub,
        classification,
        standardRubric,
        reviews: reviewsRes.rows
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/teacher/mains/pending-reviews
  router.get('/teacher/mains/pending-reviews', requireTeacher, async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const filter = String(req.query.status || 'PENDING').toUpperCase();

      let whereClause = `WHERE s.status = 'EVALUATED'`;
      if (filter === 'PENDING') {
        whereClause += ` AND (r.id IS NULL OR r.workflow_status != 'COMPLETED' OR s.review_status != 'COMPLETED')`;
      } else if (filter === 'COMPLETED') {
        whereClause += ` AND (r.workflow_status = 'COMPLETED' OR s.review_status = 'COMPLETED')`;
      }

      const query = `
        SELECT 
          s.id,
          s.user_id,
          s.question_id,
          s.paper,
          s.submission_type as answer_type,
          s.word_count,
          s.marks_obtained as ai_marks,
          s.max_marks,
          s.feedback as ai_feedback,
          s.evaluation as ai_evaluation,
          s.attachment_url,
          s.ocr_status,
          s.ocr_confidence,
          COALESCE(s.corrected_ocr_text, s.ocr_extracted_text, s.answer_text) as student_answer,
          COALESCE(s.review_status, 'OPEN') as review_status,
          s.review_locked_by,
          s.review_locked_at,
          s.submitted_at,
          s.created_at,
          q.question,
          q.exam,
          q.paper as q_paper,
          q.marks as q_marks,
          q.word_limit,
          COALESCE(subj.name, 'General Studies') as subject,
          COALESCE(top.name, 'Syllabus Core') as topic,
          r.id as existing_review_id,
          r.faculty_id as existing_faculty_id,
          r.faculty_name as existing_faculty_name,
          r.faculty_marks_obtained as existing_faculty_marks,
          r.faculty_verdict as existing_faculty_verdict,
          r.disagreement_level as existing_disagreement_level,
          r.training_eligibility as existing_training_eligibility,
          r.exclusion_reason as existing_exclusion_reason,
          r.review_version as existing_review_version,
          r.workflow_status as existing_workflow_status
        FROM public.mains_submissions s
        JOIN public.questions q ON s.question_id = q.id
        LEFT JOIN public.subjects subj ON q.subject_id = subj.id
        LEFT JOIN public.topics top ON q.topic_id = top.id
        LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
        ${whereClause}
        ORDER BY (COALESCE(s.review_status, 'OPEN') = 'COMPLETED') ASC, (r.id IS NULL) DESC, s.created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      const result = await pool.query(query, [limit, offset]);

      // Format clean response items conforming to review card contract
      const formatted = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        questionId: row.question_id,
        question: row.question,
        exam: row.exam,
        paper: row.paper || row.q_paper,
        subject: row.subject,
        topic: row.topic,
        marks: Number(row.max_marks || row.q_marks || 10),
        maxMarks: Number(row.max_marks || row.q_marks || 10),
        wordLimit: Number(row.word_limit || 150),
        wordCount: Number(row.word_count || 0),
        studentAnswer: row.student_answer || '',
        aiEvaluation: row.ai_evaluation,
        aiMarks: row.ai_marks !== null ? Number(row.ai_marks) : null,
        aiRubric: row.ai_evaluation?.dimensions || {},
        aiFeedback: row.ai_feedback || row.ai_evaluation?.feedback || '',
        answerType: row.answer_type,
        ocrStatus: row.ocr_status,
        ocrConfidence: row.ocr_confidence !== null ? Number(row.ocr_confidence) : null,
        attachmentUrl: row.attachment_url,
        reviewStatus: row.review_status,
        reviewLockedBy: row.review_locked_by,
        reviewLockedAt: row.review_locked_at,
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
        existingReviewHistory: row.existing_review_id ? [{
          id: row.existing_review_id,
          facultyId: row.existing_faculty_id,
          facultyName: row.existing_faculty_name,
          facultyMarks: Number(row.existing_faculty_marks),
          facultyVerdict: row.existing_faculty_verdict,
          disagreementLevel: row.existing_disagreement_level,
          trainingEligibility: row.existing_training_eligibility,
          exclusionReason: row.existing_exclusion_reason,
          reviewVersion: Number(row.existing_review_version || 1),
          workflowStatus: row.existing_workflow_status
        }] : []
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/eligibility
  router.post('/teacher/mains/eligibility', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { reviewId, submissionId, eligibility, exclusionReason } = req.body;

      if (!eligibility) {
        return res.status(400).json({ error: 'eligibility status is required' });
      }

      const resUpdate = await pool.query(`
        UPDATE public.mains_evaluation_reviews
        SET training_eligibility = $1,
            exclusion_reason = $2,
            marked_by = $3,
            marked_at = NOW(),
            updated_at = NOW()
        WHERE id = $4 OR submission_id = $5
        RETURNING *;
      `, [eligibility, exclusionReason || null, user.id, reviewId || null, submissionId || null]);

      if (resUpdate.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({ success: true, review: resUpdate.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 2. ADMIN INTELLIGENCE & DATASET PIPELINE
  // ----------------------------------------------------

  // GET /api/admin/mains/metrics
  router.get('/admin/mains/metrics', requireAdmin, async (req, res) => {
    try {
      const metrics = await mainsEvaluationIntelligenceService.getAdminIntelligenceMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/disagreement-analysis
  router.get('/admin/mains/disagreement-analysis', requireAdmin, async (req, res) => {
    try {
      const qtRes = await pool.query(`
        SELECT 
          question_type,
          COUNT(*) as count,
          ROUND(AVG(marks_difference), 2) as avg_marks_diff,
          ROUND(AVG(percentage_difference), 2) as avg_pct_diff,
          COUNT(CASE WHEN disagreement_level = 'AGREEMENT' THEN 1 END) as agreement_count,
          COUNT(CASE WHEN disagreement_level = 'MAJOR_DISAGREEMENT' THEN 1 END) as major_diff_count
        FROM public.mains_evaluation_reviews
        GROUP BY question_type;
      `);

      const levelRes = await pool.query(`
        SELECT 
          disagreement_level,
          COUNT(*) as count
        FROM public.mains_evaluation_reviews
        GROUP BY disagreement_level;
      `);

      res.json({
        byQuestionType: qtRes.rows,
        byDisagreementLevel: levelRes.rows
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/datasets/build
  router.post('/admin/mains/datasets/build', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { versionName, description, trainSplitRatio, valSplitRatio } = req.body;

      if (!versionName) {
        return res.status(400).json({ error: 'versionName is required (e.g. IKSHOVIA-MAINS-v0.1)' });
      }

      const dataset = await mainsEvaluationIntelligenceService.buildDataset({
        versionName,
        description: description || `Mains Evaluation Dataset ${versionName}`,
        creatorId: user.id,
        trainSplitRatio: trainSplitRatio ? Number(trainSplitRatio) : undefined,
        valSplitRatio: valSplitRatio ? Number(valSplitRatio) : undefined
      });

      res.json({ success: true, dataset });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/datasets
  router.get('/admin/mains/datasets', requireAdmin, async (req, res) => {
    try {
      const dsRes = await pool.query(`
        SELECT * FROM public.mains_evaluation_datasets ORDER BY created_at DESC;
      `);
      res.json(dsRes.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/datasets/:id/freeze
  router.post('/admin/mains/datasets/:id/freeze', requireAdmin, async (req, res) => {
    try {
      const frozen = await mainsEvaluationIntelligenceService.freezeDataset(req.params.id);
      res.json({ success: true, dataset: frozen });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 3. BENCHMARK SYSTEM
  // ----------------------------------------------------

  // POST /api/admin/mains/benchmarks/build
  router.post('/admin/mains/benchmarks/build', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, version } = req.body;

      if (!name || !version) {
        return res.status(400).json({ error: 'name and version are required' });
      }

      const bench = await mainsEvaluationIntelligenceService.buildBenchmark({
        name,
        version,
        creatorId: user.id
      });

      res.json({ success: true, benchmark: bench });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/benchmarks
  router.get('/admin/mains/benchmarks', requireAdmin, async (req, res) => {
    try {
      const benchRes = await pool.query(`
        SELECT * FROM public.mains_evaluation_benchmarks ORDER BY created_at DESC;
      `);
      res.json(benchRes.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 4. MODEL REGISTRY & EVALUATION RUNS
  // ----------------------------------------------------

  // GET /api/admin/mains/models
  router.get('/admin/mains/models', requireAdmin, async (req, res) => {
    try {
      const modelsRes = await pool.query(`
        SELECT * FROM public.mains_evaluation_models ORDER BY created_at DESC;
      `);
      res.json(modelsRes.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/models/register
  router.post('/admin/mains/models/register', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id, modelName, version, baseModel, datasetVersion, benchmarkVersion, status, trainingConfig } = req.body;

      if (!id || !modelName || !version) {
        return res.status(400).json({ error: 'id, modelName, and version are required' });
      }

      const model = await mainsEvaluationIntelligenceService.registerModel({
        id,
        modelName,
        version,
        baseModel: baseModel || 'gemini-3.8-flash',
        datasetVersion,
        benchmarkVersion,
        status,
        trainingConfig,
        creatorId: user.id
      });

      res.json({ success: true, model });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/models/:id/promote
  router.post('/api/admin/mains/models/:id/promote', requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (status !== 'SHADOW' && status !== 'PRODUCTION') {
        return res.status(400).json({ error: 'status must be SHADOW or PRODUCTION' });
      }

      const promoted = await mainsEvaluationIntelligenceService.promoteModel(req.params.id, status);
      res.json({ success: true, model: promoted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/models/:id/retire
  router.post('/api/admin/mains/models/:id/retire', requireAdmin, async (req, res) => {
    try {
      const retired = await mainsEvaluationIntelligenceService.retireModel(req.params.id);
      res.json({ success: true, model: retired });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/models/:id/evaluate
  router.post('/api/admin/mains/models/:id/evaluate', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { benchmarkId } = req.body;

      if (!benchmarkId) {
        return res.status(400).json({ error: 'benchmarkId is required' });
      }

      const results = await mainsEvaluationIntelligenceService.evaluateModelOnBenchmark(
        req.params.id,
        benchmarkId,
        user.id
      );

      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 5. TRAINING JOB INFRASTRUCTURE
  // ----------------------------------------------------

  // POST /api/admin/mains/training-jobs
  router.post('/api/admin/mains/training-jobs', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { datasetVersion, modelVersion, baseModel, trainingType, parameters } = req.body;

      if (!datasetVersion || !modelVersion) {
        return res.status(400).json({ error: 'datasetVersion and modelVersion are required' });
      }

      const job = await mainsEvaluationIntelligenceService.createTrainingJob({
        datasetVersion,
        modelVersion,
        baseModel,
        trainingType,
        parameters,
        creatorId: user.id
      });

      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/training-jobs
  router.get('/api/admin/mains/training-jobs', requireAdmin, async (req, res) => {
    try {
      const jobs = await mainsEvaluationIntelligenceService.listTrainingJobs();
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/training-jobs/:id
  router.get('/api/admin/mains/training-jobs/:id', requireAdmin, async (req, res) => {
    try {
      const job = await mainsEvaluationIntelligenceService.getTrainingJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Training job not found' });
      }
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 6. PHASE 4.1C: DATASET COLLECTION & FACULTY CALIBRATION
  // ----------------------------------------------------

  // GET /api/mains/coverage/analysis
  router.get('/mains/coverage/analysis', requireAuth, async (req, res) => {
    try {
      const coverage = await mainsEvaluationIntelligenceService.getCoverageAnalysis();
      res.json(coverage);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/mains/coverage/practice-questions
  router.get('/mains/coverage/practice-questions', requireAuth, async (req, res) => {
    try {
      const { limit, paper } = req.query;
      const questions = await mainsEvaluationIntelligenceService.getCoveragePracticeQuestions({
        limit: limit ? Number(limit) : 10,
        paper: paper as string | undefined
      });
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/teacher/mains/calibration-cases
  router.get('/teacher/mains/calibration-cases', requireTeacher, async (req, res) => {
    try {
      const { limit, paper } = req.query;
      const cases = await mainsEvaluationIntelligenceService.getCalibrationCases({
        limit: limit ? Number(limit) : 15,
        paper: paper as string | undefined
      });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/:submissionId/double-review
  router.post('/teacher/mains/:submissionId/double-review', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const { marks, maxMarks, dimensions, feedback, verdict } = req.body;

      if (marks === undefined || marks === null) {
        return res.status(400).json({ error: 'marks is required' });
      }
      if (!dimensions) {
        return res.status(400).json({ error: 'dimensions rubric score object is required' });
      }
      if (!feedback) {
        return res.status(400).json({ error: 'feedback is required' });
      }

      const doubleReview = await mainsEvaluationIntelligenceService.submitDoubleReview({
        submissionId,
        facultyId: user.id,
        facultyName: user.name || user.email || 'Faculty Evaluator',
        marks: Number(marks),
        maxMarks: maxMarks ? Number(maxMarks) : 10,
        dimensions,
        feedback,
        verdict: verdict || 'EDITED'
      });

      res.json({ success: true, doubleReview });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/:submissionId/adjudicate
  router.post('/admin/mains/:submissionId/adjudicate', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const { score, dimensions, feedback, notes } = req.body;

      if (score === undefined || score === null) {
        return res.status(400).json({ error: 'score is required' });
      }
      if (!dimensions) {
        return res.status(400).json({ error: 'dimensions rubric score object is required' });
      }
      if (!feedback) {
        return res.status(400).json({ error: 'feedback is required' });
      }

      const adjudicated = await mainsEvaluationIntelligenceService.adjudicateDoubleReview({
        submissionId,
        adjudicatorId: user.id,
        adjudicatorName: user.name || user.email || 'Senior Board Evaluator',
        score: Number(score),
        dimensions,
        feedback,
        notes
      });

      res.json({ success: true, adjudicated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset-growth
  router.get('/admin/mains/dataset-growth', requireAdmin, async (req, res) => {
    try {
      const growth = await mainsEvaluationIntelligenceService.getLiveDatasetGrowthDashboard();
      res.json(growth);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/coverage-matrix
  router.get('/admin/mains/coverage-matrix', requireAdmin, async (req, res) => {
    try {
      const matrix = await mainsEvaluationIntelligenceService.getCoverageMatrix();
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/training-gate
  router.get('/admin/mains/training-gate', requireAdmin, async (req, res) => {
    try {
      const gate = await mainsEvaluationIntelligenceService.getTrainingGateStatus();
      res.json(gate);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/readiness-audit
  router.get('/admin/mains/readiness-audit', requireAdmin, async (req, res) => {
    try {
      const audit = await mainsEvaluationIntelligenceService.runReadinessAudit();
      res.json(audit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mains/dataset-events
  router.post('/mains/dataset-events', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { eventType, submissionId, metadata } = req.body;
      if (!eventType || !submissionId) {
        return res.status(400).json({ error: 'eventType and submissionId are required' });
      }
      const event = await mainsEvaluationIntelligenceService.recordDatasetEvent(
        eventType,
        submissionId,
        user.id,
        user.role,
        metadata
      );
      res.json({ success: true, event });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 7. PHASE 4.1D: REAL MAINS DATASET ACQUISITION ENGINE
  // ----------------------------------------------------

  // GET /api/admin/mains/dataset/acquisition
  router.get('/admin/mains/dataset/acquisition', requireAdmin, async (req, res) => {
    try {
      const { limit, paper, subject } = req.query;
      const priorities = await mainsDatasetAcquisitionService.getAcquisitionPriorities({
        limit: limit ? Number(limit) : 20,
        paper: paper as string | undefined,
        subject: subject as string | undefined
      });
      res.json(priorities);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset/coverage
  router.get('/admin/mains/dataset/coverage', requireAdmin, async (req, res) => {
    try {
      const matrix = await mainsDatasetAcquisitionService.getDetailedCoverageMatrix();
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset/growth (alias for Phase 4.1D dataset growth metrics)
  router.get('/admin/mains/dataset/growth', requireAdmin, async (req, res) => {
    try {
      const growth = await mainsEvaluationIntelligenceService.getLiveDatasetGrowthDashboard();
      res.json(growth);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset/funnel
  router.get('/admin/mains/dataset/funnel', requireAdmin, async (req, res) => {
    try {
      const funnel = await mainsDatasetAcquisitionService.getAcquisitionFunnel();
      res.json(funnel);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset/diversity
  router.get('/admin/mains/dataset/diversity', requireAdmin, async (req, res) => {
    try {
      const diversity = await mainsDatasetAcquisitionService.getLearnerDiversityMetrics();
      res.json(diversity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/dataset/snapshots
  router.post('/admin/mains/dataset/snapshots', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { versionName, description } = req.body;
      if (!versionName) {
        return res.status(400).json({ error: 'versionName is required (e.g. IKSHOVIA-MAINS-SNAPSHOT-v0.2)' });
      }
      const snapshot = await mainsDatasetAcquisitionService.createDatasetSnapshot({
        versionName,
        description,
        creatorId: user.id
      });
      res.json({ success: true, snapshot });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/dataset/snapshots
  router.get('/admin/mains/dataset/snapshots', requireAdmin, async (req, res) => {
    try {
      const snapshots = await mainsDatasetAcquisitionService.listDatasetSnapshots();
      res.json(snapshots);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/dataset/snapshots/:id/freeze
  router.post('/admin/mains/dataset/snapshots/:id/freeze', requireAdmin, async (req, res) => {
    try {
      const frozen = await mainsDatasetAcquisitionService.freezeDatasetSnapshot(req.params.id);
      res.json({ success: true, snapshot: frozen });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Teacher Review Assignments & Workload Balancing
  // GET /api/teacher/mains/review-assignments
  router.get('/teacher/mains/review-assignments', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status } = req.query;
      const assignments = await mainsFacultyReviewAssignmentService.getAssignmentsForTeacher(
        user.id,
        status as string | undefined
      );
      res.json(assignments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/teacher/mains/workload-config
  router.get('/teacher/mains/workload-config', requireTeacher, async (req, res) => {
    try {
      const config = await mainsFacultyReviewAssignmentService.getWorkloadConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/workload-config
  router.post('/teacher/mains/workload-config', requireAdmin, async (req, res) => {
    try {
      const updated = await mainsFacultyReviewAssignmentService.updateWorkloadConfig(req.body);
      res.json({ success: true, config: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/:submissionId/assign
  router.post('/teacher/mains/:submissionId/assign', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const { reviewerId, reviewerName } = req.body;
      if (!reviewerId) {
        return res.status(400).json({ error: 'reviewerId is required' });
      }
      const assignment = await mainsFacultyReviewAssignmentService.assignReview({
        submissionId,
        reviewerId,
        reviewerName,
        assignedBy: user.id
      });
      res.json({ success: true, assignment });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  });

  // POST /api/teacher/mains/auto-distribute
  router.post('/teacher/mains/auto-distribute', requireAdmin, async (req, res) => {
    try {
      const result = await mainsFacultyReviewAssignmentService.autoDistributePendingReviews();
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Learner Coverage Practice Hub Endpoints
  // GET /api/mains/practice/coverage
  router.get('/mains/practice/coverage', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const hub = await mainsDatasetAcquisitionService.getLearnerCoveragePracticeHub(user?.id);
      res.json(hub);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/mains/practice/coverage/:gapId
  router.get('/mains/practice/coverage/:gapId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { gapId } = req.params;
      const hub = await mainsDatasetAcquisitionService.getLearnerCoveragePracticeHub(user?.id);
      const track = hub.featuredPracticeTracks.find(t => t.id === gapId);
      if (!track) {
        return res.status(404).json({ error: 'Practice track not found' });
      }
      res.json(track);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 8. PHASE 4.1E: QUALITY CONTROL, CALIBRATION & RELEASE CANDIDATE
  // ----------------------------------------------------

  // GET /api/admin/mains/quality/scorecard
  router.get('/admin/mains/quality/scorecard', requireAdmin, async (req, res) => {
    try {
      const scorecard = await mainsDatasetQualityControlService.getQualityScorecard();
      res.json(scorecard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/quality/run
  router.post('/admin/mains/quality/run', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const result = await mainsDatasetQualityControlService.recordQualityRun(user?.id || 'usr_admin');
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/quality/runs
  router.get('/admin/mains/quality/runs', requireAdmin, async (req, res) => {
    try {
      const { limit } = req.query;
      const runs = await mainsDatasetQualityControlService.getRecentQualityRuns(limit ? Number(limit) : 20);
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/quality/candidate-evals
  router.get('/admin/mains/quality/candidate-evals', requireAdmin, async (req, res) => {
    try {
      const { limit, paper } = req.query;
      const evals = await mainsDatasetQualityControlService.evaluateCandidateAnswers({
        limit: limit ? Number(limit) : 50,
        paper: paper as string | undefined
      });
      res.json(evals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/quality/candidate-eval/:submissionId
  router.get('/admin/mains/quality/candidate-eval/:submissionId', requireAdmin, async (req, res) => {
    try {
      const evalResult = await mainsDatasetQualityControlService.evaluateCandidateAnswer(req.params.submissionId);
      res.json(evalResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/quality/balance-reports
  router.get('/admin/mains/quality/balance-reports', requireAdmin, async (req, res) => {
    try {
      const [papers, tiers, directives, marks, ocr, duplicates] = await Promise.all([
        mainsDatasetQualityControlService.getPaperBalanceReport(),
        mainsDatasetQualityControlService.getPerformanceTierBalanceReport(),
        mainsDatasetQualityControlService.getDirectiveBalanceReport(),
        mainsDatasetQualityControlService.getMarksDistributionReport(),
        mainsDatasetQualityControlService.getOcrQualityReport(),
        mainsDatasetQualityControlService.getDuplicateAuditReport()
      ]);
      res.json({ papers, tiers, directives, marks, ocr, duplicates });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/teacher/mains/calibration/summary
  router.get('/teacher/mains/calibration/summary', requireTeacher, async (req, res) => {
    try {
      const summary = await mainsFacultyCalibrationService.getCalibrationSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/teacher/mains/calibration/consistency
  router.get('/teacher/mains/calibration/consistency', requireTeacher, async (req, res) => {
    try {
      const list = await mainsFacultyCalibrationService.getFacultyConsistencyList();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/calibration/disagreement
  router.get('/admin/mains/calibration/disagreement', requireAdmin, async (req, res) => {
    try {
      const analytics = await mainsFacultyCalibrationService.getAiDisagreementAnalytics();
      res.json(analytics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/calibration/log
  router.post('/api/admin/mains/calibration/log', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const result = await mainsFacultyCalibrationService.recordCalibrationLog(user?.id || 'usr_admin');
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/calibration/logs
  router.get('/admin/mains/calibration/logs', requireAdmin, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await mainsFacultyCalibrationService.getRecentCalibrationLogs(limit ? Number(limit) : 20);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/quarantine
  router.get('/admin/mains/quarantine', requireAdmin, async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const records = await mainsDatasetQuarantineService.listQuarantined({
        status: status as string | undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      });
      const metrics = await mainsDatasetQuarantineService.getQuarantineMetrics();
      res.json({ records, metrics });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/quarantine
  router.post('/admin/mains/quarantine', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId, quarantineReason, notes, metadata } = req.body;
      if (!submissionId || !quarantineReason) {
        return res.status(400).json({ error: 'submissionId and quarantineReason are required' });
      }
      const record = await mainsDatasetQuarantineService.quarantineSubmission({
        submissionId,
        quarantineReason,
        detectedBy: user?.id || 'usr_admin',
        notes,
        metadata
      });
      res.json({ success: true, record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/quarantine/:id/resolve
  router.post('/admin/mains/quarantine/:id/resolve', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { resolutionStatus, outcome, notes } = req.body;
      if (!resolutionStatus) {
        return res.status(400).json({ error: 'resolutionStatus is required' });
      }
      const resolved = await mainsDatasetQuarantineService.resolveQuarantine({
        quarantineId: id,
        resolutionStatus,
        outcome,
        notes,
        resolvedBy: user?.id || 'usr_admin'
      });
      res.json({ success: true, record: resolved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/quarantine/auto-scan
  router.post('/admin/mains/quarantine/auto-scan', requireAdmin, async (req, res) => {
    try {
      const result = await mainsDatasetQuarantineService.autoScanAndQuarantine();
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/release-candidates
  router.get('/admin/mains/release-candidates', requireAdmin, async (req, res) => {
    try {
      const candidates = await mainsDatasetReleaseCandidateService.listReleaseCandidates();
      res.json(candidates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/release-candidates
  router.post('/admin/mains/release-candidates', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { datasetVersion } = req.body;
      if (!datasetVersion) {
        return res.status(400).json({ error: 'datasetVersion is required (e.g. IKSHOVIA-RC-v0.2)' });
      }
      const candidate = await mainsDatasetReleaseCandidateService.createReleaseCandidate({
        datasetVersion,
        creatorId: user?.id || 'usr_admin'
      });
      res.json({ success: true, candidate });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/release-candidates/:id
  router.get('/api/admin/mains/release-candidates/:id', requireAdmin, async (req, res) => {
    try {
      const candidate = await mainsDatasetReleaseCandidateService.getReleaseCandidate(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Release candidate not found' });
      }
      res.json(candidate);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/release-candidates/:id/manifest
  router.get('/api/admin/mains/release-candidates/:id/manifest', requireAdmin, async (req, res) => {
    try {
      const candidate = await mainsDatasetReleaseCandidateService.getReleaseCandidate(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Release candidate not found' });
      }
      res.json(candidate.manifest || { error: 'Manifest not available for this release candidate' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/release-candidates/:id/freeze
  router.post('/admin/mains/release-candidates/:id/freeze', requireAdmin, async (req, res) => {
    try {
      const frozen = await mainsDatasetReleaseCandidateService.freezeReleaseCandidate(req.params.id);
      res.json({ success: true, candidate: frozen });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 6. PHASE 4.1F — DATASET OPERATIONS & CALIBRATION LOOP
  // ----------------------------------------------------

  // GET /api/admin/mains/operations/overview
  router.get('/admin/mains/operations/overview', requireAdmin, async (req, res) => {
    try {
      const overview = await mainsDatasetOperationsService.getOperationsOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/reviews
  router.get('/admin/mains/operations/reviews', requireAdmin, async (req, res) => {
    try {
      const { status, paper, reviewerId, page, limit } = req.query;
      const queue = await mainsDatasetOperationsService.getFacultyReviewQueue({
        status: status as string,
        paper: paper as string,
        reviewerId: reviewerId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });
      res.json(queue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/workload
  router.get('/admin/mains/operations/workload', requireAdmin, async (req, res) => {
    try {
      const workload = await mainsDatasetOperationsService.getFacultyWorkloadSummary();
      res.json(workload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/calibration-cases
  router.get('/admin/mains/operations/calibration-cases', requireTeacher, async (req, res) => {
    try {
      const cases = await mainsDatasetOperationsService.getCalibrationSessionCases();
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/operations/calibration-attempt
  router.post('/admin/mains/operations/calibration-attempt', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId, assignedMarks, rubricScores, feedback } = req.body;
      if (!submissionId || assignedMarks == null || !rubricScores) {
        return res.status(400).json({ error: 'submissionId, assignedMarks, and rubricScores are required.' });
      }
      const attempt = await mainsDatasetOperationsService.submitCalibrationAttempt({
        facultyId: user?.id || 'usr_faculty',
        facultyName: user?.name || user?.email || 'Faculty Evaluator',
        submissionId,
        assignedMarks: Number(assignedMarks),
        rubricScores,
        feedback
      });
      res.json({ success: true, attempt });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/calibration-performance
  router.get('/admin/mains/operations/calibration-performance', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const targetFacultyId = (req.query.facultyId as string) || user?.id;
      const perf = await mainsDatasetOperationsService.getFacultyCalibrationPerformance(targetFacultyId);
      res.json(perf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/growth
  router.get('/admin/mains/operations/growth', requireAdmin, async (req, res) => {
    try {
      const timeRange = (req.query.timeRange as any) || '7_DAYS';
      const timeline = await mainsDatasetOperationsService.getDatasetGrowthTimeline(timeRange);
      res.json(timeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/growth-trends
  router.get('/admin/mains/operations/growth-trends', requireAdmin, async (req, res) => {
    try {
      const trends = await mainsDatasetOperationsService.getDatasetGrowthTrends();
      res.json(trends);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/weekly-report
  router.get('/admin/mains/operations/weekly-report', requireAdmin, async (req, res) => {
    try {
      const report = await mainsDatasetOperationsService.getWeeklyDatasetHealthReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/operations/release-candidates/:id/revalidate
  router.post('/admin/mains/operations/release-candidates/:id/revalidate', requireAdmin, async (req, res) => {
    try {
      const result = await mainsDatasetOperationsService.revalidateReleaseCandidate(req.params.id);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/double-reviews
  router.get('/admin/mains/operations/double-reviews', requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const data = await mainsDatasetOperationsService.getDoubleReviewOperations({
        status: status as string
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/adjudication-queue
  router.get('/admin/mains/operations/adjudication-queue', requireAdmin, async (req, res) => {
    try {
      const queue = await mainsDatasetOperationsService.getAdjudicationQueue();
      res.json(queue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/operations/adjudicate
  router.post('/admin/mains/operations/adjudicate', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId, score, dimensions, feedback, notes } = req.body;
      if (!submissionId || score == null || !dimensions) {
        return res.status(400).json({ error: 'submissionId, score, and dimensions are required.' });
      }
      const result = await mainsDatasetOperationsService.adjudicateSubmission({
        submissionId,
        adjudicatorId: user?.id || 'usr_admin',
        adjudicatorName: user?.name || user?.email || 'Senior Board Adjudicator',
        score: Number(score),
        dimensions,
        feedback: feedback || 'Adjudicated consensus score established.',
        notes
      });
      res.json({ success: true, adjudication: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/ocr-queue
  router.get('/admin/mains/operations/ocr-queue', requireTeacher, async (req, res) => {
    try {
      const { status, minConfidence, limit, offset } = req.query;
      const queue = await mainsDatasetOperationsService.getOcrOperationsQueue({
        status: status as string,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      });
      res.json(queue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/mains/operations/ocr-verify
  router.post('/admin/mains/operations/ocr-verify', requireTeacher, async (req, res) => {
    try {
      const user = (req as any).user;
      const { submissionId, correctedText } = req.body;
      if (!submissionId || !correctedText) {
        return res.status(400).json({ error: 'submissionId and correctedText are required.' });
      }
      const result = await mainsDatasetOperationsService.correctAndVerifyOcr({
        submissionId,
        correctedText,
        verifierId: user?.id || 'usr_teacher',
        verifierName: user?.name || user?.email || 'Teacher Evaluator'
      });
      res.json({ success: true, verified: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/training-gate
  router.get('/admin/mains/operations/training-gate', requireAdmin, async (req, res) => {
    try {
      const candidateId = req.query.candidateId as string;
      const evaluation = await mainsDatasetOperationsService.evaluateTrainingSafetyGate(candidateId);
      res.json(evaluation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/operations/thresholds
  router.get('/admin/mains/operations/thresholds', requireAdmin, async (req, res) => {
    try {
      const thresholds = await mainsDatasetOperationsService.getOperationsThresholds();
      res.json(thresholds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/admin/mains/operations/thresholds
  router.put('/admin/mains/operations/thresholds', requireAdmin, async (req, res) => {
    try {
      const updated = await mainsDatasetOperationsService.updateOperationsThresholds(req.body);
      res.json({ success: true, thresholds: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 7. PHASE 4.1G — TRAINING READINESS & GO/NO-GO AUDIT
  // ----------------------------------------------------

  // GET /api/admin/mains/training-readiness
  router.get('/api/admin/mains/training-readiness', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const audit = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit(user?.id || 'usr_admin');
      res.json(audit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/mains/training-readiness/history
  router.get('/api/admin/mains/training-readiness/history', requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const history = await mainsTrainingReadinessAuditService.getAuditHistory(limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Also support routes without duplicate /api prefix when mounted at /api:
  router.get('/admin/mains/training-readiness', requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const audit = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit(user?.id || 'usr_admin');
      res.json(audit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/admin/mains/training-readiness/history', requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const history = await mainsTrainingReadinessAuditService.getAuditHistory(limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // PHASE 4.1H: DATASET REMEDIATION & ACQUISITION
  // ----------------------------------------------------

  // GET /api/admin/mains/dataset-remediation
  const handleGetDatasetRemediation = async (req: express.Request, res: express.Response) => {
    try {
      const overview = await mainsDatasetRemediationService.getRemediationOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/dataset-remediation', requireAdmin, handleGetDatasetRemediation);
  router.get('/admin/mains/dataset-remediation', requireAdmin, handleGetDatasetRemediation);

  // POST /api/admin/mains/dataset-remediation/execute
  const handleExecuteRemediation = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const result = await mainsDatasetRemediationService.executeFullRemediation(user?.id || 'usr_admin');
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/dataset-remediation/execute', requireAdmin, handleExecuteRemediation);
  router.post('/admin/mains/dataset-remediation/execute', requireAdmin, handleExecuteRemediation);

  // GET /api/admin/mains/dataset-remediation/snapshots
  const handleGetRemediationSnapshots = async (req: express.Request, res: express.Response) => {
    try {
      const snRes = await pool.query(`
        SELECT id, snapshot_type, snapshot_data, created_at
        FROM public.mains_dataset_remediation_snapshots
        ORDER BY created_at DESC LIMIT 20;
      `);
      res.json(snRes.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/dataset-remediation/snapshots', requireAdmin, handleGetRemediationSnapshots);
  router.get('/admin/mains/dataset-remediation/snapshots', requireAdmin, handleGetRemediationSnapshots);

  // GET /api/mains/targeted-practice-hub (Section 7 & 20 - Faculty/Learner Safe)
  const handleGetTargetedHub = async (req: express.Request, res: express.Response) => {
    try {
      const tracks = await mainsDatasetRemediationService.getTargetedSyllabusTracks();
      res.json({
        hubTitle: 'Mains Targeted Syllabus Acquisition Hub',
        hubDescription: 'Syllabus tracks prioritized by real ground-truth coverage deficits for UPSC Civil Services Mains.',
        tracks
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/targeted-practice-hub', requireAuth, handleGetTargetedHub);
  router.get('/mains/targeted-practice-hub', requireAuth, handleGetTargetedHub);

  // ----------------------------------------------------
  // PHASE 4.1I: REAL DATASET GROWTH & CONTROLLED COLLECTION
  // ----------------------------------------------------

  // GET /api/mains/dataset-growth/overview
  const handleGetGrowthOverview = async (req: express.Request, res: express.Response) => {
    try {
      const overview = await mainsDatasetGrowthService.getDatasetGrowthOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/overview', requireAuth, handleGetGrowthOverview);
  router.get('/mains/dataset-growth/overview', requireAuth, handleGetGrowthOverview);

  // GET /api/mains/dataset-growth/targeted-questions
  const handleGetGrowthQuestions = async (req: express.Request, res: express.Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 12;
      const paper = req.query.paper as string | undefined;
      const subject = req.query.subject as string | undefined;
      const learnerId = (req as any).user?.id;
      const questions = await mainsDatasetGrowthService.getTargetedAcquisitionQuestions({
        limit,
        paper,
        subject,
        learnerId
      });
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/targeted-questions', requireAuth, handleGetGrowthQuestions);
  router.get('/mains/dataset-growth/targeted-questions', requireAuth, handleGetGrowthQuestions);

  // POST /api/mains/dataset-growth/draft
  const handleSaveGrowthDraft = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { questionId, answerText, submissionType, attachmentUrl } = req.body;
      if (!questionId) return res.status(400).json({ error: 'questionId is required' });
      const result = await mainsDatasetGrowthService.saveLearnerDraft({
        learnerId: user.id,
        questionId,
        answerText: answerText || '',
        submissionType,
        attachmentUrl
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/mains/dataset-growth/draft', requireAuth, handleSaveGrowthDraft);
  router.post('/mains/dataset-growth/draft', requireAuth, handleSaveGrowthDraft);

  // POST /api/mains/dataset-growth/submit-answer
  const handleSubmitGrowthAnswer = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { questionId, answerText, submissionType, attachmentUrl, ocrExtractedText, ocrConfidence } = req.body;
      if (!questionId) return res.status(400).json({ error: 'questionId is required' });
      if (!answerText && !ocrExtractedText) {
        return res.status(400).json({ error: 'Answer content is required' });
      }
      const result = await mainsDatasetGrowthService.submitLearnerAnswer({
        learnerId: user.id,
        questionId,
        answerText: answerText || '',
        submissionType,
        attachmentUrl,
        ocrExtractedText,
        ocrConfidence
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/mains/dataset-growth/submit-answer', requireAuth, handleSubmitGrowthAnswer);
  router.post('/mains/dataset-growth/submit-answer', requireAuth, handleSubmitGrowthAnswer);

  // GET /api/mains/dataset-growth/learner-submissions
  const handleGetLearnerSubs = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const subs = await mainsDatasetGrowthService.getLearnerSubmissions(user.id);
      res.json(subs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/learner-submissions', requireAuth, handleGetLearnerSubs);
  router.get('/mains/dataset-growth/learner-submissions', requireAuth, handleGetLearnerSubs);

  // GET /api/mains/dataset-growth/faculty-queue
  const handleGetFacultyQueue = async (req: express.Request, res: express.Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 25;
      const facultyId = (req as any).user?.id;
      const paper = req.query.paper as string | undefined;
      const queue = await mainsDatasetGrowthService.getFacultyAcquisitionQueue({
        limit,
        facultyId,
        paper
      });
      res.json(queue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/faculty-queue', requireTeacher, handleGetFacultyQueue);
  router.get('/mains/dataset-growth/faculty-queue', requireTeacher, handleGetFacultyQueue);

  // POST /api/mains/dataset-growth/faculty-review
  const handleFacultyAcquisitionReview = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const {
        submissionId,
        facultyMarks,
        facultyVerdict,
        facultyFeedback,
        facultyStrengths,
        facultyWeaknesses,
        facultyActionableImprovement,
        facultyDimensions
      } = req.body;

      if (!submissionId || facultyMarks === undefined || !facultyVerdict || !facultyFeedback) {
        return res.status(400).json({ error: 'submissionId, facultyMarks, facultyVerdict, and facultyFeedback are required' });
      }

      const result = await mainsDatasetGrowthService.recordFacultyAcquisitionReview({
        submissionId,
        facultyId: user.id,
        facultyName: user.name || 'Senior UPSC Faculty',
        facultyRole: user.role || 'LEAD_EVALUATOR',
        facultyMarks: Number(facultyMarks),
        facultyVerdict,
        facultyFeedback,
        facultyStrengths,
        facultyWeaknesses,
        facultyActionableImprovement,
        facultyDimensions
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/mains/dataset-growth/faculty-review', requireTeacher, handleFacultyAcquisitionReview);
  router.post('/mains/dataset-growth/faculty-review', requireTeacher, handleFacultyAcquisitionReview);

  // GET /api/mains/dataset-growth/coverage-matrices
  const handleGetCoverageMatrices = async (req: express.Request, res: express.Response) => {
    try {
      const matrices = await mainsDatasetGrowthService.getAcquisitionCoverageMatrices();
      res.json(matrices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/coverage-matrices', requireAdmin, handleGetCoverageMatrices);
  router.get('/mains/dataset-growth/coverage-matrices', requireAdmin, handleGetCoverageMatrices);

  // GET /api/mains/dataset-growth/benchmarks
  const handleGetGrowthBenchmarks = async (req: express.Request, res: express.Response) => {
    try {
      const benchmarks = await mainsDatasetGrowthService.getBenchmarkCollection();
      res.json(benchmarks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/benchmarks', requireAdmin, handleGetGrowthBenchmarks);
  router.get('/mains/dataset-growth/benchmarks', requireAdmin, handleGetGrowthBenchmarks);

  // GET /api/mains/dataset-growth/campaigns
  const handleGetCampaigns = async (req: express.Request, res: express.Response) => {
    try {
      const campaigns = await mainsDatasetGrowthService.getCampaigns();
      res.json(campaigns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/mains/dataset-growth/campaigns', requireAdmin, handleGetCampaigns);
  router.get('/mains/dataset-growth/campaigns', requireAdmin, handleGetCampaigns);

  // POST /api/mains/dataset-growth/campaigns
  const handleCreateCampaign = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { name, description, targetAnswers, targetFacultyReviews, targetSubjects, targetBenchmarkItems, coveragePriorities } = req.body;
      if (!name) return res.status(400).json({ error: 'Campaign name is required' });
      const campaign = await mainsDatasetGrowthService.createCampaign({
        name,
        description,
        targetAnswers,
        targetFacultyReviews,
        targetSubjects,
        targetBenchmarkItems,
        coveragePriorities,
        actorId: user.id
      });
      res.json(campaign);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/mains/dataset-growth/campaigns', requireAdmin, handleCreateCampaign);
  router.post('/mains/dataset-growth/campaigns', requireAdmin, handleCreateCampaign);

  // ----------------------------------------------------
  // PHASE 4.1J: TELEGRAM MAINS COPY INGESTION ROUTES
  // ----------------------------------------------------

  // GET /api/admin/mains/telegram/sources
  const handleGetTelegramSources = async (req: express.Request, res: express.Response) => {
    try {
      const sources = await mainsTelegramIngestionService.getSources();
      res.json(sources);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/sources', requireAdmin, handleGetTelegramSources);
  router.get('/admin/mains/telegram/sources', requireAdmin, handleGetTelegramSources);

  // POST /api/admin/mains/telegram/sources
  const handleRegisterTelegramSource = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { sourceType, telegramChatId, telegramChatType, displayName, authorized, enabled, authorizationBasis, retentionPolicy } = req.body;
      if (!sourceType || !telegramChatId || !displayName) {
        return res.status(400).json({ error: 'sourceType, telegramChatId, and displayName are required' });
      }

      const source = await mainsTelegramIngestionService.registerSource({
        sourceType,
        telegramChatId: String(telegramChatId),
        telegramChatType: telegramChatType || 'group',
        displayName,
        authorized: authorized !== undefined ? Boolean(authorized) : false,
        enabled,
        authorizationBasis,
        retentionPolicy,
        actorId: user.id,
        actorRole: user.role
      });
      res.json(source);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/sources', requireAdmin, handleRegisterTelegramSource);
  router.post('/admin/mains/telegram/sources', requireAdmin, handleRegisterTelegramSource);

  // PATCH /api/admin/mains/telegram/sources/:id
  const handleUpdateTelegramSource = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const source = await mainsTelegramIngestionService.updateSource(id, {
        ...req.body,
        actorId: user.id,
        actorRole: user.role
      });
      res.json(source);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.patch('/api/admin/mains/telegram/sources/:id', requireAdmin, handleUpdateTelegramSource);
  router.patch('/admin/mains/telegram/sources/:id', requireAdmin, handleUpdateTelegramSource);

  // POST /api/admin/mains/telegram/webhook (and open webhook receiver for Telegram platform)
  const handleTelegramWebhook = async (req: express.Request, res: express.Response) => {
    try {
      // Validate optional secret token if configured
      const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
      const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

      if (configuredSecret && secretHeader && secretHeader !== configuredSecret) {
        return res.status(401).json({ error: 'Unauthorized webhook request' });
      }

      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await mainsTelegramIngestionService.processWebhookUpdate(req.body, clientIp);
      res.json(result);
    } catch (err: any) {
      // Telegram acknowledges with 200 so handled error doesn't cause infinite webhook retry
      res.status(200).json({ ok: false, error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/webhook', handleTelegramWebhook);
  router.post('/admin/mains/telegram/webhook', handleTelegramWebhook);
  router.post('/api/telegram/mains-dataset-bot/webhook', handleTelegramWebhook);
  router.post('/telegram/mains-dataset-bot/webhook', handleTelegramWebhook);

  // POST /api/admin/mains/telegram/register-webhook (Admin explicit action)
  const handleRegisterTelegramWebhook = async (req: express.Request, res: express.Response) => {
    try {
      const { domain, dropPendingUpdates } = req.body || {};
      const result = await mainsTelegramIngestionService.registerWebhook(domain, Boolean(dropPendingUpdates));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/register-webhook', requireAdmin, handleRegisterTelegramWebhook);
  router.post('/admin/mains/telegram/register-webhook', requireAdmin, handleRegisterTelegramWebhook);

  // GET /api/admin/mains/telegram/pending-sources (Admin discovery of unauthorized groups needing review)
  const handleGetTelegramPendingSources = async (req: express.Request, res: express.Response) => {
    try {
      const pending = await mainsTelegramIngestionService.getPendingSources();
      res.json(pending);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/pending-sources', requireAdmin, handleGetTelegramPendingSources);
  router.get('/admin/mains/telegram/pending-sources', requireAdmin, handleGetTelegramPendingSources);

  // POST /api/admin/mains/telegram/pending-sources/:chatId/authorize
  const handleAuthorizeTelegramPendingSource = async (req: express.Request, res: express.Response) => {
    try {
      const chatId = req.params.chatId;
      const { displayName, authorizationBasis, retentionPolicy } = req.body || {};
      const actorId = (req as any).user?.id || 'admin_user';
      const actorRole = (req as any).user?.role || 'ADMIN';

      const source = await mainsTelegramIngestionService.authorizePendingSource(chatId, {
        displayName,
        authorizationBasis,
        retentionPolicy,
        actorId,
        actorRole
      });
      res.json(source);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/pending-sources/:chatId/authorize', requireAdmin, handleAuthorizeTelegramPendingSource);
  router.post('/admin/mains/telegram/pending-sources/:chatId/authorize', requireAdmin, handleAuthorizeTelegramPendingSource);

  // POST /api/admin/mains/telegram/pending-sources/:chatId/reject
  const handleRejectTelegramPendingSource = async (req: express.Request, res: express.Response) => {
    try {
      const chatId = req.params.chatId;
      const actorId = (req as any).user?.id || 'admin_user';
      const actorRole = (req as any).user?.role || 'ADMIN';

      await mainsTelegramIngestionService.rejectPendingSource(chatId, actorId, actorRole);
      res.json({ success: true, chatId, status: 'REJECTED' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/pending-sources/:chatId/reject', requireAdmin, handleRejectTelegramPendingSource);
  router.post('/admin/mains/telegram/pending-sources/:chatId/reject', requireAdmin, handleRejectTelegramPendingSource);

  // GET /api/admin/mains/telegram/runtime-status (Safe runtime diagnostic endpoint)
  const handleGetTelegramRuntimeStatus = async (req: express.Request, res: express.Response) => {
    try {
      const status = await mainsTelegramIngestionService.checkRuntimeStatus();
      res.json({
        configured: status.configured,
        telegramApiReachable: status.telegramApiReachable,
        webhookConfigured: status.webhookConfigured,
        runtime: status.runtime,
        runtimeState: status.runtimeState || status.runtime,
        authorizedSources: status.authorizedSources,
        environment_loaded_by_running_process: status.environment_loaded_by_running_process,
        reason: status.reason,
        webhookUrl: status.webhookUrl,
        pendingUpdateCount: status.pendingUpdateCount,
        lastErrorDate: status.lastErrorDate,
        lastErrorReason: status.lastErrorReason,
        lastErrorCode: status.lastErrorCode,
        maxConnections: status.maxConnections,
        allowedUpdates: status.allowedUpdates,
        webhookReachable: status.webhookReachable,
        lastTelegramError: status.lastTelegramError,
        lastTelegramErrorAt: status.lastTelegramErrorAt,
        lastSuccessfulWebhookEventAt: status.lastSuccessfulWebhookEventAt,
        webhookHealthy: status.webhookHealthy,
        errorClassification: status.errorClassification
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/runtime-status', requireAdmin, handleGetTelegramRuntimeStatus);
  router.get('/admin/mains/telegram/runtime-status', requireAdmin, handleGetTelegramRuntimeStatus);

  // GET /api/admin/mains/telegram/imports
  const handleGetTelegramImports = async (req: express.Request, res: express.Response) => {
    try {
      const status = req.query.status as string | undefined;
      const sourceId = req.query.sourceId as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const data = await mainsTelegramIngestionService.getImports({ status, sourceId, limit, offset });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/imports', requireAdmin, handleGetTelegramImports);
  router.get('/admin/mains/telegram/imports', requireAdmin, handleGetTelegramImports);

  // GET /api/admin/mains/telegram/imports/:id
  const handleGetTelegramImportById = async (req: express.Request, res: express.Response) => {
    try {
      const item = await mainsTelegramIngestionService.getImportById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Import record not found' });
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/imports/:id', requireAdmin, handleGetTelegramImportById);
  router.get('/admin/mains/telegram/imports/:id', requireAdmin, handleGetTelegramImportById);

  // POST /api/admin/mains/telegram/imports/:id/retry
  const handleRetryTelegramImport = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const item = await mainsTelegramIngestionService.retryImport(req.params.id, user.id, user.role);
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/imports/:id/retry', requireAdmin, handleRetryTelegramImport);
  router.post('/admin/mains/telegram/imports/:id/retry', requireAdmin, handleRetryTelegramImport);

  // POST /api/admin/mains/telegram/imports/:id/validate-ground-truth
  const handleValidateTelegramGroundTruth = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { facultyMarks, facultyMaxMarks, facultyVerdict, facultyFeedback, facultyRubric } = req.body;
      if (facultyMarks === undefined || !facultyVerdict || !facultyFeedback) {
        return res.status(400).json({ error: 'facultyMarks, facultyVerdict, and facultyFeedback are required' });
      }

      const item = await mainsTelegramIngestionService.validateGroundTruth(req.params.id, {
        facultyMarks: Number(facultyMarks),
        facultyMaxMarks: facultyMaxMarks ? Number(facultyMaxMarks) : undefined,
        facultyVerdict,
        facultyFeedback,
        facultyRubric,
        validatorId: user.id,
        validatorRole: user.role
      });
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/imports/:id/validate-ground-truth', requireAdmin, handleValidateTelegramGroundTruth);
  router.post('/admin/mains/telegram/imports/:id/validate-ground-truth', requireAdmin, handleValidateTelegramGroundTruth);

  // POST /api/admin/mains/telegram/imports/:id/exclude
  const handleExcludeTelegramImport = async (req: express.Request, res: express.Response) => {
    try {
      const user = (req as any).user;
      const { reason } = req.body;
      const item = await mainsTelegramIngestionService.excludeImport(req.params.id, reason || 'Manually excluded by administrator', user.id, user.role);
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.post('/api/admin/mains/telegram/imports/:id/exclude', requireAdmin, handleExcludeTelegramImport);
  router.post('/admin/mains/telegram/imports/:id/exclude', requireAdmin, handleExcludeTelegramImport);

  // GET /api/admin/mains/telegram/stats
  const handleGetTelegramStats = async (req: express.Request, res: express.Response) => {
    try {
      const stats = await mainsTelegramIngestionService.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  router.get('/api/admin/mains/telegram/stats', requireAdmin, handleGetTelegramStats);
  router.get('/admin/mains/telegram/stats', requireAdmin, handleGetTelegramStats);

  return router;
}

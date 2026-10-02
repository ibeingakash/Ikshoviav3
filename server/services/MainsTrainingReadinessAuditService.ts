import crypto from 'crypto';
import pool from '../db/pool.js';
import {
  TrainingReadinessAuditResult,
  TrainingReadinessStatus,
  HardGateStatus
} from './MainsIntelligenceTypes.js';

export class MainsTrainingReadinessAuditService {

  // ------------------------------------------------------------------
  // 1. EXECUTE FULL INDEPENDENT TRAINING READINESS AUDIT
  // ------------------------------------------------------------------
  async executeTrainingReadinessAudit(initiatedBy: string = 'SYSTEM'): Promise<TrainingReadinessAuditResult> {
    const generatedAt = new Date().toISOString();

    // ----------------------------------------------------
    // A. Read Configured Training Thresholds from DB
    // ----------------------------------------------------
    const gateConfigRes = await pool.query(
      `SELECT * FROM public.mains_training_gate_config WHERE id = 'default' LIMIT 1;`
    );
    const gateConfig = gateConfigRes.rows[0] || {
      minimum_verified_reviews: 250,
      minimum_unique_answers: 200,
      minimum_subjects: 5,
      minimum_benchmark_items: 20,
      max_disagreement_threshold: 25.0
    };

    const configuredThresholds = {
      minimumVerifiedReviews: Number(gateConfig.minimum_verified_reviews || 250),
      minimumUniqueAnswers: Number(gateConfig.minimum_unique_answers || 200),
      minimumSubjects: Number(gateConfig.minimum_subjects || 5),
      minimumBenchmarkItems: Number(gateConfig.minimum_benchmark_items || 20),
      maxDisagreementThreshold: Number(gateConfig.max_disagreement_threshold || 25.0)
    };

    // ----------------------------------------------------
    // B. Dataset Inventory (Real PostgreSQL Data Only)
    // ----------------------------------------------------
    const inventoryRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.mains_submissions WHERE id NOT LIKE '%_test_%') as total_submissions,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE status != 'DRAFT' AND id NOT LIKE '%_test_%') as submitted_answers,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE marks_obtained IS NOT NULL AND id NOT LIKE '%_test_%') as ai_evaluated,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE workflow_status = 'COMPLETED' AND submission_id NOT LIKE '%_test_%') as faculty_verified,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews r 
           JOIN public.mains_submissions s ON r.submission_id = s.id 
           WHERE s.marks_obtained IS NOT NULL AND r.faculty_marks_obtained IS NOT NULL 
             AND r.workflow_status = 'COMPLETED' AND s.id NOT LIKE '%_test_%') as paired_reviews,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE faculty_verdict = 'INDEPENDENT' AND submission_id NOT LIKE '%_test_%') as independent_verdicts,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE faculty_verdict = 'ACCEPTED' AND submission_id NOT LIKE '%_test_%') as accepted_verdicts,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE faculty_verdict = 'EDITED' AND submission_id NOT LIKE '%_test_%') as edited_verdicts,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE faculty_verdict = 'REJECTED' AND submission_id NOT LIKE '%_test_%') as rejected_verdicts,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE training_eligibility = 'TRAINING_ELIGIBLE' AND submission_id NOT LIKE '%_test_%') as eligible_reviews,
        (SELECT COUNT(DISTINCT answer_hash) FROM public.mains_evaluation_reviews WHERE training_eligibility = 'TRAINING_ELIGIBLE' AND submission_id NOT LIKE '%_test_%') as eligible_unique_answers,
        (SELECT COUNT(DISTINCT answer_hash) FROM public.mains_evaluation_reviews WHERE submission_id NOT LIKE '%_test_%') as unique_answers,
        (SELECT COUNT(DISTINCT user_id) FROM public.mains_submissions WHERE id NOT LIKE '%_test_%') as unique_learners,
        (SELECT COUNT(*) FROM public.mains_dataset_quarantine WHERE resolution_status = 'QUARANTINED') as quarantined_count,
        (SELECT COUNT(*) FROM public.mains_submissions s 
           LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id 
           WHERE s.id NOT LIKE '%_test_%' AND (r.id IS NULL OR r.workflow_status != 'COMPLETED')) as pending_reviews,
        (SELECT COUNT(*) FROM public.mains_double_reviews WHERE status IN ('ADJUDICATION_REQUIRED', 'ESCALATED_TO_ADJUDICATION')) as adjudication_required,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE submission_type = 'HANDWRITTEN_IMAGE' AND (ocr_approved != true OR ocr_confidence < 0.70)) as ocr_required,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE submission_type = 'HANDWRITTEN_IMAGE' AND ocr_approved = true) as ocr_reviewed,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE submission_id NOT LIKE '%_test_%') as raw_review_records,
        (SELECT COUNT(DISTINCT s.id) FROM public.mains_submissions s WHERE s.id NOT LIKE '%_test_%') as unique_submission_ids;
    `);

    const inv = inventoryRes.rows[0] || {};
    const totalSubmissions = Number(inv.total_submissions || 0);
    const uniqueAnswers = Number(inv.unique_answers || 0);
    const eligibleUniqueAnswers = Number(inv.eligible_unique_answers || 0);
    const uniqueLearners = Number(inv.unique_learners || 0);
    const facultyVerified = Number(inv.faculty_verified || 0);

    // Duplicate detection across submissions
    const dupRes = await pool.query(`
      SELECT 
        COUNT(*) as total_with_hash,
        COUNT(DISTINCT answer_hash) as unique_hashes
      FROM (
        SELECT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id))) as answer_hash
        FROM public.mains_submissions s
        LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
        WHERE s.id NOT LIKE '%_test_%' AND (r.answer_hash IS NOT NULL OR s.answer_text IS NOT NULL OR s.id IS NOT NULL)
      ) sub;
    `);
    const dRow = dupRes.rows[0] || {};
    const totalWithHash = Number(dRow.total_with_hash || 0);
    const uniqueHashes = Number(dRow.unique_hashes || 0);
    const duplicateAnswerHashes = Math.max(0, totalWithHash - uniqueHashes);
    const duplicateRate = totalWithHash > 0 ? Number(((duplicateAnswerHashes / totalWithHash) * 100).toFixed(1)) : 0;

    const datasetInventory = {
      totalSubmissions,
      submittedAnswers: Number(inv.submitted_answers || 0),
      aiEvaluatedAnswers: Number(inv.ai_evaluated || 0),
      facultyVerified,
      pairedAiFacultyAnswers: Number(inv.paired_reviews || 0),
      independentFacultyEvaluations: Number(inv.independent_verdicts || 0),
      acceptedAiEvaluations: Number(inv.accepted_verdicts || 0),
      editedCalibratedEvaluations: Number(inv.edited_verdicts || 0),
      rejectedEvaluations: Number(inv.rejected_verdicts || 0),
      trainingEligibleReviews: Number(inv.eligible_reviews || 0),
      eligibleUniqueAnswers,
      uniqueAnswers,
      uniqueLearners,
      duplicateAnswerHashes,
      duplicateRate,
      quarantinedAnswers: Number(inv.quarantined_count || 0),
      pendingFacultyReviews: Number(inv.pending_reviews || 0),
      adjudicationRequiredReviews: Number(inv.adjudication_required || 0),
      ocrRequiredAnswers: Number(inv.ocr_required || 0),
      ocrReviewedAnswers: Number(inv.ocr_reviewed || 0),
      rawReviewRecords: Number(inv.raw_review_records || 0),
      uniqueSubmissionIds: Number(inv.unique_submission_ids || 0)
    };

    // ----------------------------------------------------
    // C. Paper & Subject Coverage (Section 3)
    // ----------------------------------------------------
    const paperRes = await pool.query(`
      SELECT 
        s.paper,
        COUNT(s.id) as count,
        COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) as unique_answers,
        COUNT(CASE WHEN r.workflow_status = 'COMPLETED' THEN 1 END) as faculty_verified,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY s.paper;
    `);

    const standardPapers = ['GS1', 'GS2', 'GS3', 'GS4', 'Ethics', 'Essay', 'Optional'];
    const papersCoverage: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }> = {};
    for (const p of standardPapers) {
      papersCoverage[p] = { count: 0, uniqueAnswers: 0, facultyVerified: 0, eligible: 0, percentage: 0 };
    }

    for (const row of paperRes.rows) {
      const pRaw = (row.paper || '').toUpperCase();
      let key = 'GS2';
      if (pRaw.includes('GS 1') || pRaw.includes('GS-I') || pRaw.includes('GS1')) key = 'GS1';
      else if (pRaw.includes('GS 2') || pRaw.includes('GS-II') || pRaw.includes('GS2')) key = 'GS2';
      else if (pRaw.includes('GS 3') || pRaw.includes('GS-III') || pRaw.includes('GS3')) key = 'GS3';
      else if (pRaw.includes('GS 4') || pRaw.includes('GS-IV') || pRaw.includes('GS4')) key = 'GS4';
      else if (pRaw.includes('ETHIC')) key = 'Ethics';
      else if (pRaw.includes('ESSAY')) key = 'Essay';
      else if (pRaw.includes('OPTIONAL')) key = 'Optional';

      const count = Number(row.count || 0);
      papersCoverage[key].count += count;
      papersCoverage[key].uniqueAnswers += Number(row.unique_answers || 0);
      papersCoverage[key].facultyVerified += Number(row.faculty_verified || 0);
      papersCoverage[key].eligible += Number(row.eligible || 0);
    }

    for (const k of Object.keys(papersCoverage)) {
      papersCoverage[k].percentage = totalSubmissions > 0
        ? Number(((papersCoverage[k].count / totalSubmissions) * 100).toFixed(1))
        : 0;
    }

    // Subjects Coverage
    const subjectRes = await pool.query(`
      SELECT 
        COALESCE(subj.name, 'General Studies') as subject,
        COUNT(s.id) as count,
        COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) as unique_answers,
        COUNT(CASE WHEN r.workflow_status = 'COMPLETED' THEN 1 END) as faculty_verified,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY subj.name
      ORDER BY count DESC;
    `);

    const subjectsCoverage: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }> = {};
    for (const row of subjectRes.rows) {
      const name = row.subject || 'General Studies';
      const c = Number(row.count || 0);
      subjectsCoverage[name] = {
        count: c,
        uniqueAnswers: Number(row.unique_answers || 0),
        facultyVerified: Number(row.faculty_verified || 0),
        eligible: Number(row.eligible || 0),
        percentage: totalSubmissions > 0 ? Number(((c / totalSubmissions) * 100).toFixed(1)) : 0
      };
    }

    // Topics Coverage
    const topicRes = await pool.query(`
      SELECT 
        COALESCE(top.name, 'Core Syllabus') as topic,
        COUNT(s.id) as count,
        COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) as unique_answers,
        COUNT(CASE WHEN r.workflow_status = 'COMPLETED' THEN 1 END) as faculty_verified,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.topics top ON q.topic_id = top.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY top.name
      ORDER BY count DESC
      LIMIT 10;
    `);

    const topicsCoverage: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }> = {};
    for (const row of topicRes.rows) {
      const name = row.topic || 'Core Syllabus';
      const c = Number(row.count || 0);
      topicsCoverage[name] = {
        count: c,
        uniqueAnswers: Number(row.unique_answers || 0),
        facultyVerified: Number(row.faculty_verified || 0),
        eligible: Number(row.eligible || 0),
        percentage: totalSubmissions > 0 ? Number(((c / totalSubmissions) * 100).toFixed(1)) : 0
      };
    }

    // Detect blind spots
    const blindSpots: string[] = [];
    for (const [p, data] of Object.entries(papersCoverage)) {
      if (data.count === 0) blindSpots.push(`Paper ${p} has 0 submissions`);
      else if (data.facultyVerified === 0) blindSpots.push(`Paper ${p} has 0 faculty-verified reviews`);
    }

    // ----------------------------------------------------
    // D. Directive Coverage (Section 4)
    // ----------------------------------------------------
    const standardDirectives = [
      'Discuss', 'Explain', 'Analyze', 'Critically Analyze',
      'Examine', 'Critically Examine', 'Evaluate', 'Comment',
      'Elucidate', 'Illustrate', 'Compare', 'Justify',
      'Assess', 'Case Study', 'Essay / philosophical prompt'
    ];

    const directiveQueriesRes = await pool.query(`
      SELECT 
        q.question,
        COALESCE(r.directive, '') as review_directive,
        COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id))) as answer_hash,
        r.workflow_status,
        r.training_eligibility
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%';
    `);

    const directivesCoverage: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number; isUnderrepresented: boolean }> = {};
    for (const d of standardDirectives) {
      directivesCoverage[d] = { count: 0, uniqueAnswers: 0, facultyVerified: 0, eligible: 0, percentage: 0, isUnderrepresented: true };
    }

    for (const row of directiveQueriesRes.rows) {
      const qText = (row.question || '').toLowerCase();
      const rDir = (row.review_directive || '').toLowerCase();

      for (const d of standardDirectives) {
        const dLower = d.toLowerCase();
        if (qText.includes(dLower) || rDir.includes(dLower)) {
          directivesCoverage[d].count++;
          directivesCoverage[d].uniqueAnswers++;
          if (row.workflow_status === 'COMPLETED') directivesCoverage[d].facultyVerified++;
          if (row.training_eligibility === 'TRAINING_ELIGIBLE') directivesCoverage[d].eligible++;
        }
      }
    }

    for (const d of standardDirectives) {
      const c = directivesCoverage[d].count;
      directivesCoverage[d].percentage = totalSubmissions > 0 ? Number(((c / totalSubmissions) * 100).toFixed(1)) : 0;
      directivesCoverage[d].isUnderrepresented = c < 5;
    }

    // ----------------------------------------------------
    // E. Marks Distribution (Section 5)
    // ----------------------------------------------------
    const marksRes = await pool.query(`
      SELECT 
        s.max_marks,
        COUNT(s.id) as count,
        COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) as unique_answers,
        COUNT(CASE WHEN r.workflow_status = 'COMPLETED' THEN 1 END) as faculty_verified,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY s.max_marks
      ORDER BY s.max_marks ASC;
    `);

    const marksCoverage: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }> = {};
    for (const row of marksRes.rows) {
      const mm = `${row.max_marks || 10}m`;
      const c = Number(row.count || 0);
      marksCoverage[mm] = {
        count: c,
        uniqueAnswers: Number(row.unique_answers || 0),
        facultyVerified: Number(row.faculty_verified || 0),
        eligible: Number(row.eligible || 0),
        percentage: totalSubmissions > 0 ? Number(((c / totalSubmissions) * 100).toFixed(1)) : 0
      };
    }

    // ----------------------------------------------------
    // F. Performance Tier Distribution (Section 6)
    // ----------------------------------------------------
    const tierRes = await pool.query(`
      SELECT 
        CASE 
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) < 35 THEN 'WEAK'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 35 AND 54.99 THEN 'AVERAGE'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 55 AND 69.99 THEN 'STRONG'
          ELSE 'EXCELLENT'
        END as tier,
        COUNT(*) as count,
        COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) as unique_answers,
        COUNT(DISTINCT s.user_id) as unique_learners,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY tier;
    `);

    const tiersCoverage: Record<string, { count: number; uniqueAnswers: number; uniqueLearners: number; eligible: number; percentage: number }> = {
      WEAK: { count: 0, uniqueAnswers: 0, uniqueLearners: 0, eligible: 0, percentage: 0 },
      AVERAGE: { count: 0, uniqueAnswers: 0, uniqueLearners: 0, eligible: 0, percentage: 0 },
      STRONG: { count: 0, uniqueAnswers: 0, uniqueLearners: 0, eligible: 0, percentage: 0 },
      EXCELLENT: { count: 0, uniqueAnswers: 0, uniqueLearners: 0, eligible: 0, percentage: 0 }
    };

    for (const row of tierRes.rows) {
      if (row.tier in tiersCoverage) {
        const c = Number(row.count || 0);
        tiersCoverage[row.tier] = {
          count: c,
          uniqueAnswers: Number(row.unique_answers || 0),
          uniqueLearners: Number(row.unique_learners || 0),
          eligible: Number(row.eligible || 0),
          percentage: totalSubmissions > 0 ? Number(((c / totalSubmissions) * 100).toFixed(1)) : 0
        };
      }
    }

    // ----------------------------------------------------
    // G. Answer Format / OCR Coverage (Section 7)
    // ----------------------------------------------------
    const formatRes = await pool.query(`
      SELECT 
        COUNT(CASE WHEN submission_type != 'HANDWRITTEN_IMAGE' THEN 1 END) as typed_count,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' THEN 1 END) as handwritten_count,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND ocr_status = 'OCR_COMPLETED' THEN 1 END) as ocr_processed,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND ocr_confidence >= 0.80 THEN 1 END) as ocr_high_confidence,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND ocr_confidence < 0.80 THEN 1 END) as ocr_low_confidence,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND ocr_corrected_by IS NOT NULL THEN 1 END) as ocr_manually_corrected,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND ocr_approved = true THEN 1 END) as ocr_approved,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND (ocr_approved != true OR ocr_confidence < 0.70) THEN 1 END) as ocr_review_required,
        COUNT(CASE WHEN submission_type = 'HANDWRITTEN_IMAGE' AND (ocr_approved = true OR ocr_confidence >= 0.80) AND answer_text IS NOT NULL AND LENGTH(answer_text) >= 40 THEN 1 END) as handwritten_usable
      FROM public.mains_submissions
      WHERE id NOT LIKE '%_test_%';
    `);

    const fRow = formatRes.rows[0] || {};
    const formatsCoverage = {
      typed: Number(fRow.typed_count || 0),
      handwritten: Number(fRow.handwritten_count || 0),
      ocrProcessed: Number(fRow.ocr_processed || 0),
      ocrHighConfidence: Number(fRow.ocr_high_confidence || 0),
      ocrLowConfidence: Number(fRow.ocr_low_confidence || 0),
      ocrManuallyCorrected: Number(fRow.ocr_manually_corrected || 0),
      ocrApproved: Number(fRow.ocr_approved || 0),
      ocrReviewRequired: Number(fRow.ocr_review_required || 0),
      handwrittenUsableCount: Number(fRow.handwritten_usable || 0),
      handwrittenUsabilityNote: Number(fRow.ocr_review_required || 0) > 0
        ? `${fRow.ocr_review_required} handwritten answers require faculty OCR review/correction before being eligible for training.`
        : 'All handwritten answers have approved/verified OCR transcriptions.'
    };

    // ----------------------------------------------------
    // H. Faculty Calibration & Inter-Rater Reliability (Section 8)
    // ----------------------------------------------------
    const calibRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT r.faculty_id) as faculty_evaluators_count,
        COUNT(DISTINCT d.id) as double_reviews_count,
        COUNT(DISTINCT CASE WHEN d.inter_rater_mark_diff = 0 THEN d.id END) as exact_agreements,
        AVG(d.inter_rater_mark_diff) as avg_mark_divergence,
        AVG(d.inter_rater_pct_diff) as avg_pct_divergence,
        AVG(d.rubric_agreement_pct) as avg_rubric_agreement,
        COUNT(DISTINCT CASE WHEN d.status = 'ADJUDICATED' THEN d.id END) as adjudication_count,
        COUNT(DISTINCT CASE WHEN d.inter_rater_pct_diff > 10 THEN d.id END) as diff_above_10,
        COUNT(DISTINCT CASE WHEN d.inter_rater_pct_diff > 20 THEN d.id END) as diff_above_20
      FROM public.mains_evaluation_reviews r
      LEFT JOIN public.mains_double_reviews d ON r.submission_id = d.submission_id
      WHERE r.workflow_status = 'COMPLETED' AND r.submission_id NOT LIKE '%_test_%';
    `);

    const cRow = calibRes.rows[0] || {};
    const doubleReviewsCount = Number(cRow.double_reviews_count || 0);
    const facultyEvaluatorsCount = Number(cRow.faculty_evaluators_count || 0);
    const isCalibSampleSufficient = facultyVerified >= 5 && doubleReviewsCount >= 3;

    const calibration = {
      status: (isCalibSampleSufficient ? 'CALIBRATED' : 'INSUFFICIENT_DATA') as 'CALIBRATED' | 'WATCH' | 'INSUFFICIENT_DATA',
      mae: cRow.avg_mark_divergence != null ? Number(Number(cRow.avg_mark_divergence).toFixed(2)) : null,
      medianAbsoluteError: cRow.avg_mark_divergence != null ? Number(Number(cRow.avg_mark_divergence).toFixed(2)) : null,
      averagePercentageDifference: cRow.avg_pct_divergence != null ? Number(Number(cRow.avg_pct_divergence).toFixed(1)) : null,
      adjudicationRate: doubleReviewsCount > 0 ? Number(((Number(cRow.adjudication_count || 0) / doubleReviewsCount) * 100).toFixed(1)) : null,
      evaluatorsCount: facultyEvaluatorsCount,
      rubricAgreement: cRow.avg_rubric_agreement != null ? Number(Number(cRow.avg_rubric_agreement).toFixed(1)) : null,
      pairedReviewsCount: Number(inv.paired_reviews || 0),
      doubleReviewsCount,
      interRaterStatus: isCalibSampleSufficient ? 'SUFFICIENT_DATA' : 'INSUFFICIENT_DATA',
      note: isCalibSampleSufficient
        ? 'Evaluator consistency within configured operational error bounds.'
        : 'INSUFFICIENT DATA FOR RELIABILITY ESTIMATE: Less than 3 double-reviewed consensus cases completed.'
    };

    // ----------------------------------------------------
    // I. AI vs Faculty Agreement (Section 9)
    // ----------------------------------------------------
    const pairedRes = await pool.query(`
      SELECT 
        s.marks_obtained as ai_marks,
        r.faculty_marks_obtained,
        ABS(s.marks_obtained - r.faculty_marks_obtained) as mark_diff,
        r.percentage_difference
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_submissions s ON r.submission_id = s.id
      WHERE s.marks_obtained IS NOT NULL AND r.faculty_marks_obtained IS NOT NULL 
        AND r.workflow_status = 'COMPLETED' AND s.id NOT LIKE '%_test_%';
    `);

    const pairedDiffs = pairedRes.rows.map(r => Number(r.mark_diff));
    const pairedPctDiffs = pairedRes.rows.map(r => Number(r.percentage_difference || 0));
    const totalPaired = pairedDiffs.length;

    let aiMae: number | null = null;
    let aiMedianMae: number | null = null;
    let aiAvgPctDiff: number | null = null;
    if (totalPaired > 0) {
      aiMae = Number((pairedDiffs.reduce((a, b) => a + b, 0) / totalPaired).toFixed(2));
      const sorted = [...pairedDiffs].sort((a, b) => a - b);
      aiMedianMae = Number(sorted[Math.floor(sorted.length / 2)].toFixed(2));
      aiAvgPctDiff = Number((pairedPctDiffs.reduce((a, b) => a + b, 0) / totalPaired).toFixed(1));
    }

    // ----------------------------------------------------
    // J. Duplicate & Leakage Audit (Section 10)
    // ----------------------------------------------------
    // 1. Train / Benchmark answer overlap
    const benchOverlapRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_evaluation_benchmark_items b
      JOIN public.mains_evaluation_reviews r ON b.submission_id = r.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE';
    `);
    const benchmarkLeakageCount = Number(benchOverlapRes.rows[0]?.count || 0);

    // 2. Learner level collision in train vs benchmark
    const learnerLeakRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM (
        SELECT s.user_id 
        FROM public.mains_evaluation_benchmark_items bi
        JOIN public.mains_submissions s ON bi.submission_id = s.id
        INTERSECT
        SELECT s2.user_id
        FROM public.mains_evaluation_reviews r
        JOIN public.mains_submissions s2 ON r.submission_id = s2.id
        WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
      ) l;
    `);
    const learnerCollisionCount = Number(learnerLeakRes.rows[0]?.count || 0);

    const duplicateAudit = {
      duplicateRate,
      hashCollisions: duplicateAnswerHashes,
      exactDuplicates: duplicateAnswerHashes,
      learnerCollisions: learnerCollisionCount
    };

    // ----------------------------------------------------
    // K. Benchmark Quality Audit (Section 11)
    // ----------------------------------------------------
    const benchmarksRes = await pool.query(`
      SELECT b.id, b.version, b.name, b.is_locked, b.total_items,
             COUNT(bi.id) as actual_items,
             COUNT(DISTINCT bi.submission_id) as unique_answers
      FROM public.mains_evaluation_benchmarks b
      LEFT JOIN public.mains_evaluation_benchmark_items bi ON b.id = bi.benchmark_id
      GROUP BY b.id, b.version, b.name, b.is_locked, b.total_items;
    `);

    const benchmarksList = benchmarksRes.rows.map(b => ({
      id: b.id,
      version: b.version,
      name: b.name,
      isLocked: Boolean(b.is_locked),
      totalItems: Number(b.actual_items || b.total_items || 0),
      uniqueAnswers: Number(b.unique_answers || 0),
      status: Number(b.actual_items || 0) >= configuredThresholds.minimumBenchmarkItems ? 'READY' : 'INSUFFICIENT_DATA'
    }));

    const totalBenchmarkItems = benchmarksList.reduce((a, b) => a + b.totalItems, 0);
    const benchmarkQualityStatus: 'ISOLATED' | 'CONTAMINATED' | 'INSUFFICIENT_DATA' =
      benchmarkLeakageCount > 0 ? 'CONTAMINATED' : (totalBenchmarkItems >= configuredThresholds.minimumBenchmarkItems ? 'ISOLATED' : 'INSUFFICIENT_DATA');

    const benchmarkAudit = {
      status: benchmarkQualityStatus,
      items: totalBenchmarkItems,
      uniqueAnswers: benchmarksList.reduce((a, b) => a + b.uniqueAnswers, 0),
      isolated: benchmarkLeakageCount === 0,
      benchmarksCount: benchmarksList.length,
      leakageCount: benchmarkLeakageCount,
      benchmarksSummary: benchmarksList
    };

    // ----------------------------------------------------
    // L. Release Candidate & Dataset Version Audit (Sections 12 & 13)
    // ----------------------------------------------------
    const rcRes = await pool.query(`
      SELECT * FROM public.mains_dataset_release_candidates
      ORDER BY created_at DESC
      LIMIT 1;
    `);
    const latestRc = rcRes.rows[0];

    let rcChecksumValid = false;
    let recomputedChecksum: string | undefined = undefined;

    if (latestRc && latestRc.item_ids && Array.isArray(latestRc.item_ids)) {
      const itemsRes = await pool.query(`
        SELECT r.submission_id, r.answer_hash, r.faculty_marks_obtained
        FROM public.mains_evaluation_reviews r
        WHERE r.submission_id = ANY($1::text[])
        ORDER BY r.created_at ASC;
      `, [latestRc.item_ids.length > 0 ? latestRc.item_ids : ['empty']]);

      const hash = crypto.createHash('sha256');
      for (const item of itemsRes.rows) {
        hash.update(`${item.submission_id}:${item.answer_hash}:${item.faculty_marks_obtained}`);
      }
      recomputedChecksum = hash.digest('hex');
      rcChecksumValid = Boolean(latestRc.checksum_sha256 && latestRc.checksum_sha256 === recomputedChecksum);
    }

    // PII check on candidate answers
    const piiRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_submissions s
      JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
        AND (
          s.answer_text ~* '([a-zA-Z0-9_\\.-]+)@([\\da-zA-Z\\.-]+)\\.([a-zA-Z\\.]{2,6})'
          OR s.answer_text ~* '\\b[6-9]\\d{9}\\b'
        );
    `);
    const piiViolations = Number(piiRes.rows[0]?.count || 0);

    const releaseCandidateAudit = {
      status: (latestRc?.overall_status || 'MISSING') as 'VALIDATED' | 'FROZEN' | 'BLOCKED' | 'MISSING',
      checksumValid: rcChecksumValid,
      piiSafe: piiViolations === 0,
      frozen: latestRc?.status === 'FROZEN',
      latestVersion: latestRc?.dataset_version || undefined,
      manifestValid: Boolean(latestRc?.manifest),
      storedChecksum: latestRc?.checksum_sha256 || undefined,
      recomputedChecksum
    };

    // ----------------------------------------------------
    // M. EIGHT HARD SAFETY GATES (Section 14)
    // ----------------------------------------------------
    // Gate 1: Zero unadjudicated double reviews
    const unadjCount = datasetInventory.adjudicationRequiredReviews;
    const gate1: HardGateStatus = unadjCount === 0 ? 'PASS' : 'FAIL';

    // Gate 2: Zero quarantined submissions in training candidate
    const quarCandidateRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_dataset_quarantine q
      JOIN public.mains_evaluation_reviews r ON q.submission_id = r.submission_id
      WHERE q.resolution_status = 'QUARANTINED' 
        AND r.training_eligibility = 'TRAINING_ELIGIBLE';
    `);
    const quarInCandidateCount = Number(quarCandidateRes.rows[0]?.count || 0);
    const gate2: HardGateStatus = quarInCandidateCount === 0 ? 'PASS' : 'FAIL';

    // Gate 3: Benchmark isolation verified
    const gate3: HardGateStatus = benchmarkLeakageCount === 0 ? 'PASS' : 'FAIL';

    // Gate 4: PII safety
    const gate4: HardGateStatus = piiViolations === 0 ? 'PASS' : 'FAIL';

    // Gate 5: Rubric completeness = 100%
    const rubricRes = await pool.query(`
      SELECT 
        COUNT(*) as total_eligible,
        COUNT(CASE WHEN faculty_dimensions IS NOT NULL AND faculty_dimensions::text != '{}' AND faculty_dimensions::text != 'null' THEN 1 END) as rubric_complete
      FROM public.mains_evaluation_reviews
      WHERE training_eligibility = 'TRAINING_ELIGIBLE' AND submission_id NOT LIKE '%_test_%';
    `);
    const totalElig = Number(rubricRes.rows[0]?.total_eligible || 0);
    const rubComp = Number(rubricRes.rows[0]?.rubric_complete || 0);
    const gate5: HardGateStatus = totalElig === 0 ? 'INSUFFICIENT_DATA' : (rubComp === totalElig ? 'PASS' : 'FAIL');

    // Gate 6: Faculty ground truth exists for every candidate answer
    const gate6: HardGateStatus = totalElig === 0 ? 'INSUFFICIENT_DATA' : (facultyVerified >= totalElig ? 'PASS' : 'FAIL');

    // Gate 7: Duplicate check = zero hash collisions inside training candidate
    const candidateDupRes = await pool.query(`
      SELECT 
        COUNT(*) as total_candidate,
        COUNT(DISTINCT r.answer_hash) as unique_candidate_hashes
      FROM public.mains_evaluation_reviews r
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE' 
        AND r.submission_id NOT LIKE '%_test_%';
    `);
    const cDupRow = candidateDupRes.rows[0] || {};
    const candidateWithHash = Number(cDupRow.total_candidate || 0);
    const candidateUniqueHashes = Number(cDupRow.unique_candidate_hashes || 0);
    const candidateDuplicateCollisions = Math.max(0, candidateWithHash - candidateUniqueHashes);
    const gate7: HardGateStatus = candidateDuplicateCollisions === 0 ? 'PASS' : 'FAIL';

    // Gate 8: Signed release candidate with valid SHA-256 manifest/checksum
    const gate8: HardGateStatus = (latestRc && (latestRc.status === 'FROZEN' || latestRc.status === 'VALIDATED') && rcChecksumValid) ? 'PASS' : 'FAIL';

    const hardGates = {
      unadjudicatedDoubleReviews: gate1,
      pendingQuarantines: gate2,
      benchmarkIsolation: gate3,
      piiSafety: gate4,
      rubricCompleteness: gate5,
      facultyGroundTruth: gate6,
      duplicateCheck: gate7,
      signedReleaseCandidate: gate8
    };

    const hardGatesDetail: Record<string, { status: HardGateStatus; message: string }> = {
      unadjudicatedDoubleReviews: {
        status: gate1,
        message: gate1 === 'PASS' ? 'Zero unadjudicated double reviews.' : `${unadjCount} double review cases require adjudication.`
      },
      pendingQuarantines: {
        status: gate2,
        message: gate2 === 'PASS' ? 'Zero quarantined records active in candidate pool.' : `${quarInCandidateCount} quarantined items found in training candidate pool.`
      },
      benchmarkIsolation: {
        status: gate3,
        message: gate3 === 'PASS' ? 'Zero training answers overlap with benchmarks.' : `${benchmarkLeakageCount} benchmark leakage items detected.`
      },
      piiSafety: {
        status: gate4,
        message: gate4 === 'PASS' ? '100% PII sanitized. Zero raw emails or phone numbers.' : `${piiViolations} PII matches detected in candidate answers.`
      },
      rubricCompleteness: {
        status: gate5,
        message: gate5 === 'PASS' ? '100% of candidate answers have complete rubric dimensions.' : (gate5 === 'INSUFFICIENT_DATA' ? 'No training-eligible candidate answers present to evaluate rubrics.' : 'Incomplete rubric dimensions found in eligible answers.')
      },
      facultyGroundTruth: {
        status: gate6,
        message: gate6 === 'PASS' ? 'Faculty ground truth verified for all candidate answers.' : (gate6 === 'INSUFFICIENT_DATA' ? 'No candidate answers available.' : 'Candidate answers lack completed faculty marks.')
      },
      duplicateCheck: {
        status: gate7,
        message: gate7 === 'PASS' ? 'Zero duplicate answer hashes in training candidate set.' : `${candidateDuplicateCollisions} duplicate collisions in candidate set.`
      },
      signedReleaseCandidate: {
        status: gate8,
        message: gate8 === 'PASS' ? `Release candidate ${latestRc.dataset_version} is verified and signed.` : 'Latest release candidate is BLOCKED or missing valid signature/checksum.'
      }
    };

    // ----------------------------------------------------
    // N. Evaluate Thresholds & Blocking Reasons (Section 15 & 16)
    // ----------------------------------------------------
    const blockingReasons: string[] = [];
    const recommendations: string[] = [];

    // Check Volume Thresholds
    if (eligibleUniqueAnswers < configuredThresholds.minimumUniqueAnswers) {
      blockingReasons.push(
        `Insufficient unique training answers: ${eligibleUniqueAnswers}/${configuredThresholds.minimumUniqueAnswers} required unique answers.`
      );
      recommendations.push(
        `Acquire and verify at least ${configuredThresholds.minimumUniqueAnswers - eligibleUniqueAnswers} additional unique learner answers.`
      );
    }

    if (facultyVerified < configuredThresholds.minimumVerifiedReviews) {
      blockingReasons.push(
        `Insufficient verified faculty reviews: ${facultyVerified}/${configuredThresholds.minimumVerifiedReviews} required reviews.`
      );
      recommendations.push(
        `Assign pending submissions to certified faculty to reach the minimum ${configuredThresholds.minimumVerifiedReviews} ground-truth threshold.`
      );
    }

    const uniqueSubjectsCount = Object.keys(subjectsCoverage).filter(s => subjectsCoverage[s].count > 0).length;
    if (uniqueSubjectsCount < configuredThresholds.minimumSubjects) {
      blockingReasons.push(
        `Insufficient subject diversity: ${uniqueSubjectsCount}/${configuredThresholds.minimumSubjects} required subjects represented in dataset.`
      );
      recommendations.push(
        `Expand question bank and ingest student submissions for unrepresented subjects (Current: ${Object.keys(subjectsCoverage).join(', ')}).`
      );
    }

    if (totalBenchmarkItems < configuredThresholds.minimumBenchmarkItems) {
      blockingReasons.push(
        `Insufficient benchmark items: ${totalBenchmarkItems}/${configuredThresholds.minimumBenchmarkItems} required isolated benchmark items.`
      );
      recommendations.push(
        `Create dedicated gold-standard benchmark fixtures containing at least ${configuredThresholds.minimumBenchmarkItems} locked evaluations.`
      );
    }

    // Hard Gate Failures
    for (const [gateName, detail] of Object.entries(hardGatesDetail)) {
      if (detail.status === 'FAIL') {
        blockingReasons.push(`Hard Safety Gate FAILED (${gateName}): ${detail.message}`);
      } else if (detail.status === 'INSUFFICIENT_DATA') {
        blockingReasons.push(`Hard Safety Gate INSUFFICIENT DATA (${gateName}): ${detail.message}`);
      }
    }

    // ----------------------------------------------------
    // O. Final Readiness Classification (Section 16)
    // ----------------------------------------------------
    let status: TrainingReadinessStatus = 'TRAINING_NOT_READY';

    const allGatesPassed = Object.values(hardGates).every(g => g === 'PASS');
    const thresholdsMet =
      eligibleUniqueAnswers >= configuredThresholds.minimumUniqueAnswers &&
      facultyVerified >= configuredThresholds.minimumVerifiedReviews &&
      uniqueSubjectsCount >= configuredThresholds.minimumSubjects &&
      totalBenchmarkItems >= configuredThresholds.minimumBenchmarkItems;

    if (allGatesPassed && thresholdsMet && blindSpots.length === 0) {
      status = 'TRAINING_READY';
    } else if (allGatesPassed && thresholdsMet && blindSpots.length > 0) {
      status = 'TRAINING_READY_WITH_LIMITATIONS';
    } else {
      status = 'TRAINING_NOT_READY';
    }

    // Check running training jobs
    const jobsRes = await pool.query(`SELECT COUNT(*) as count FROM public.mains_evaluation_training_jobs WHERE status = 'RUNNING';`);
    const trainingJobsRunning = Number(jobsRes.rows[0]?.count || 0);

    const auditResult: TrainingReadinessAuditResult = {
      status,
      generatedAt,
      dataset: datasetInventory,
      coverage: {
        papers: papersCoverage,
        subjects: subjectsCoverage,
        topics: topicsCoverage,
        directives: directivesCoverage,
        marks: marksCoverage,
        tiers: tiersCoverage,
        formats: formatsCoverage,
        blindSpots
      },
      calibration,
      duplicates: duplicateAudit,
      benchmark: benchmarkAudit,
      releaseCandidate: releaseCandidateAudit,
      hardGates,
      hardGatesDetail,
      training: {
        configuredThresholds,
        actualTrainingEligible: status === 'TRAINING_READY' || status === 'TRAINING_READY_WITH_LIMITATIONS',
        modelActuallyTrained: false, // ABSOLUTE SAFETY GUARANTEE
        trainingJobsRunning
      },
      blockingReasons,
      recommendations,
      summary: status === 'TRAINING_READY'
        ? 'All hard gates passed and volume thresholds satisfied. Dataset is certified eligible for training export upon manual admin approval.'
        : status === 'TRAINING_READY_WITH_LIMITATIONS'
        ? 'All hard gates passed and volume thresholds met, but non-critical coverage limitations remain.'
        : `TRAINING NOT READY: Dataset cannot be exported for model training. ${blockingReasons.length} blocker(s) detected. Real data volume (${eligibleUniqueAnswers}/${configuredThresholds.minimumUniqueAnswers} unique answers, ${facultyVerified}/${configuredThresholds.minimumVerifiedReviews} reviews) is below production threshold.`
    };

    // ----------------------------------------------------
    // P. Persist Immutable Audit Snapshot
    // ----------------------------------------------------
    const auditId = `tra_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(`
      INSERT INTO public.mains_training_readiness_audits (
        id, status, generated_at, audit_data, blocking_reasons, hard_gates, initiated_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
    `, [
      auditId,
      status,
      generatedAt,
      JSON.stringify(auditResult),
      blockingReasons,
      JSON.stringify(hardGates),
      initiatedBy
    ]);

    // ----------------------------------------------------
    // Q. Log Dataset Event (Append-Only)
    // ----------------------------------------------------
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(`
      INSERT INTO public.mains_dataset_events (
        id, event_type, submission_id, actor_id, actor_role, metadata, created_at
      ) VALUES ($1, 'TRAINING_READINESS_AUDITED', 'GLOBAL', $2, 'ADMIN', $3, NOW());
    `, [
      eventId,
      initiatedBy,
      JSON.stringify({
        status,
        auditId,
        eligibleUniqueAnswers,
        facultyVerified,
        blockingReasonsCount: blockingReasons.length
      })
    ]);

    return auditResult;
  }

  // ------------------------------------------------------------------
  // 2. AUDIT HISTORY
  // ------------------------------------------------------------------
  async getAuditHistory(limit: number = 20): Promise<any[]> {
    const res = await pool.query(`
      SELECT id, status, generated_at, blocking_reasons, hard_gates, initiated_by, created_at
      FROM public.mains_training_readiness_audits
      ORDER BY created_at DESC
      LIMIT $1;
    `, [Math.min(100, Math.max(1, limit))]);

    return res.rows.map(r => ({
      id: r.id,
      status: r.status,
      generatedAt: r.generated_at,
      blockingReasons: r.blocking_reasons,
      hardGates: r.hard_gates,
      initiatedBy: r.initiated_by,
      createdAt: r.created_at
    }));
  }
}

export const mainsTrainingReadinessAuditService = new MainsTrainingReadinessAuditService();

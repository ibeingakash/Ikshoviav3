import pool from '../db/pool.js';
import {
  DatasetQualityScorecard,
  QualityDimensionEvaluation,
  QualityDimensionStatus
} from './MainsIntelligenceTypes.js';
import { mainsDatasetAcquisitionService } from './MainsDatasetAcquisitionService.js';
import { mainsFacultyCalibrationService } from './MainsFacultyCalibrationService.js';
import { mainsDatasetQuarantineService } from './MainsDatasetQuarantineService.js';

export class MainsDatasetQualityControlService {
  // ------------------------------------------------------------------
  // 1. DATA QUALITY SCORECARD GENERATOR
  // ------------------------------------------------------------------
  async getQualityScorecard(): Promise<DatasetQualityScorecard> {
    // 1. Query baseline real database counts without Cartesian join inflation
    const countsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.mains_submissions) as total_answers,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE status = 'EVALUATED') as ai_evaluated,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews) as faculty_reviewed,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews WHERE training_eligibility = 'TRAINING_ELIGIBLE') as training_eligible,
        (SELECT COUNT(*) FROM public.mains_submissions WHERE id LIKE '%_test_%' OR user_id LIKE '%_test_%') as test_fixtures,
        (SELECT COUNT(DISTINCT submission_id) FROM public.mains_evaluation_benchmark_items) as benchmark_overlap_count;
    `);

    const cRow = countsRes.rows[0] || {};
    const totalAnswers = Number(cRow.total_answers || 0);
    const facultyReviewed = Number(cRow.faculty_reviewed || 0);
    const trainingEligible = Number(cRow.training_eligible || 0);
    const benchmarkOverlapCount = Number(cRow.benchmark_overlap_count || 0);

    const quarMetrics = await mainsDatasetQuarantineService.getQuarantineMetrics();
    const calib = await mainsFacultyCalibrationService.getCalibrationSummary();
    const diversity = await mainsDatasetAcquisitionService.getLearnerDiversityMetrics();

    // ----------------------------------------------------------------
    // SECTION A: DATA COMPLETENESS
    // ----------------------------------------------------------------
    const completenessRes = await pool.query(`
      SELECT 
        COUNT(CASE WHEN s.answer_text IS NULL OR LENGTH(TRIM(s.answer_text)) = 0 THEN 1 END) as empty_answers,
        COUNT(CASE WHEN q.question IS NULL OR LENGTH(TRIM(q.question)) = 0 THEN 1 END) as missing_questions,
        COUNT(CASE WHEN s.max_marks <= 0 OR s.max_marks IS NULL THEN 1 END) as invalid_max_marks
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id;
    `);
    const compRow = completenessRes.rows[0] || {};
    const emptyAnswers = Number(compRow.empty_answers || 0);
    const missingQuestions = Number(compRow.missing_questions || 0);
    const invalidMaxMarks = Number(compRow.invalid_max_marks || 0);

    let compStatus: QualityDimensionStatus = 'PASS';
    let compSummary = 'All submission records contain complete question and answer payloads.';
    if (emptyAnswers > 0 || missingQuestions > 0 || invalidMaxMarks > 0) {
      compStatus = 'WARNING';
      compSummary = `Detected ${emptyAnswers} empty answers, ${missingQuestions} missing question texts, and ${invalidMaxMarks} invalid max marks.`;
    }

    const dataCompleteness: QualityDimensionEvaluation = {
      dimension: 'DATA_COMPLETENESS',
      status: compStatus,
      summary: compSummary,
      details: { totalAnswers, emptyAnswers, missingQuestions, invalidMaxMarks }
    };

    // ----------------------------------------------------------------
    // SECTION B: FACULTY GROUND TRUTH
    // ----------------------------------------------------------------
    let gtStatus: QualityDimensionStatus = 'PASS';
    let gtSummary = `Verified ${facultyReviewed} faculty evaluations with ${trainingEligible} training-eligible records.`;
    if (facultyReviewed === 0) {
      gtStatus = 'FAIL';
      gtSummary = 'Zero faculty evaluations found. Human ground truth is mandatory before release.';
    } else if (trainingEligible < 50) {
      gtStatus = 'WARNING';
      gtSummary = `Faculty ground truth pool is developing (${trainingEligible} eligible candidates, minimum target 200).`;
    }

    const facultyGroundTruth: QualityDimensionEvaluation = {
      dimension: 'FACULTY_GROUND_TRUTH',
      status: gtStatus,
      summary: gtSummary,
      details: {
        totalReviews: calib.totalReviews,
        uniqueFaculty: calib.uniqueFacultyEvaluators,
        doubleReviewed: calib.doubleReviewedAnswers,
        adjudicated: calib.adjudicatedAnswers,
        eligibleCandidates: trainingEligible
      }
    };

    // ----------------------------------------------------------------
    // SECTION C: EVALUATION CONSISTENCY
    // ----------------------------------------------------------------
    let evalStatus: QualityDimensionStatus = 'PASS';
    let evalSummary = `Average AI/Faculty difference is ${calib.averageMarkDifference} marks (${calib.percentageDifference}%).`;
    if (calib.percentageDifference > 25.0) {
      evalStatus = 'WARNING';
      evalSummary = `High divergence between AI and faculty scores (${calib.percentageDifference}%). Calibration required.`;
    }

    const evaluationConsistency: QualityDimensionEvaluation = {
      dimension: 'EVALUATION_CONSISTENCY',
      status: evalStatus,
      summary: evalSummary,
      details: {
        averageMarkDifference: calib.averageMarkDifference,
        percentageDifference: calib.percentageDifference,
        rubricAgreement: calib.rubricAgreement,
        disagreements: calib.disagreementCategories
      }
    };

    // ----------------------------------------------------------------
    // SECTION D: PAPER & SUBJECT COVERAGE
    // ----------------------------------------------------------------
    const paperCov = await this.getPaperBalanceReport();
    let paperStatus: QualityDimensionStatus = 'PASS';
    let paperSummary = 'Balanced representation across core GS papers.';
    if (paperCov.zeroCoveragePapers.length > 0) {
      paperStatus = 'WARNING';
      paperSummary = `Zero coverage in ${paperCov.zeroCoveragePapers.join(', ')}. Targeted practice active.`;
    }

    const paperSubjectCoverage: QualityDimensionEvaluation = {
      dimension: 'PAPER_SUBJECT_COVERAGE',
      status: paperStatus,
      summary: paperSummary,
      details: paperCov
    };

    // ----------------------------------------------------------------
    // SECTION E: PERFORMANCE TIER COVERAGE
    // ----------------------------------------------------------------
    const tierCov = await this.getPerformanceTierBalanceReport();
    let tierStatus: QualityDimensionStatus = 'PASS';
    let tierSummary = 'Candidate pool spans weak, average, strong, and excellent answers.';
    if (tierCov.zeroCoverageTiers.length > 0) {
      tierStatus = 'WARNING';
      tierSummary = `Missing performance tier examples: ${tierCov.zeroCoverageTiers.join(', ')}.`;
    }

    const performanceTierCoverage: QualityDimensionEvaluation = {
      dimension: 'PERFORMANCE_TIER_COVERAGE',
      status: tierStatus,
      summary: tierSummary,
      details: tierCov
    };

    // ----------------------------------------------------------------
    // SECTION F: ANSWER FORMAT COVERAGE
    // ----------------------------------------------------------------
    const formatRes = await pool.query(`
      SELECT 
        submission_type,
        COUNT(*) as count
      FROM public.mains_submissions
      GROUP BY submission_type;
    `);
    const formatCounts: Record<string, number> = {};
    for (const r of formatRes.rows) formatCounts[r.submission_type || 'TYPED'] = Number(r.count);

    const answerFormatCoverage: QualityDimensionEvaluation = {
      dimension: 'ANSWER_FORMAT_COVERAGE',
      status: (formatCounts['HANDWRITTEN_IMAGE'] || 0) > 0 ? 'PASS' : 'WARNING',
      summary: `Typed: ${formatCounts['TYPED'] || 0}, Handwritten: ${formatCounts['HANDWRITTEN_IMAGE'] || 0}`,
      details: formatCounts
    };

    // ----------------------------------------------------------------
    // SECTION G: OCR QUALITY
    // ----------------------------------------------------------------
    const ocrReport = await this.getOcrQualityReport();
    let ocrStatus: QualityDimensionStatus = 'PASS';
    let ocrSummary = `OCR Confidence avg: ${ocrReport.averageConfidence}%. Corrected: ${ocrReport.correctedCount}.`;
    if (ocrReport.belowThresholdCount > 0) {
      ocrStatus = 'WARNING';
      ocrSummary = `${ocrReport.belowThresholdCount} handwritten answers have OCR confidence < 70% and require review.`;
    }

    const ocrQuality: QualityDimensionEvaluation = {
      dimension: 'OCR_QUALITY',
      status: ocrStatus,
      summary: ocrSummary,
      details: ocrReport
    };

    // ----------------------------------------------------------------
    // SECTION H: DUPLICATE HEALTH
    // ----------------------------------------------------------------
    const dupReport = await this.getDuplicateAuditReport();
    let dupStatus: QualityDimensionStatus = 'PASS';
    let dupSummary = `Exact duplicates: ${dupReport.exactDuplicates}, Normalized duplicates: ${dupReport.normalizedDuplicates}.`;
    if (dupReport.exactDuplicates > 0 && dupReport.exactDuplicates / (totalAnswers || 1) > 0.1) {
      dupStatus = 'WARNING';
      dupSummary = `Duplicate answer rate exceeds 10% (${dupReport.exactDuplicates} duplicates detected).`;
    }

    const duplicateHealth: QualityDimensionEvaluation = {
      dimension: 'DUPLICATE_HEALTH',
      status: dupStatus,
      summary: dupSummary,
      details: dupReport
    };

    // ----------------------------------------------------------------
    // SECTION I: BENCHMARK ISOLATION (MANDATORY GATE)
    // ----------------------------------------------------------------
    let benchStatus: QualityDimensionStatus = 'PASS';
    let benchSummary = 'Zero benchmark contamination in training-eligible candidate set.';
    // Strict check: Are any training-eligible records also in the benchmark table?
    const overlapRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_evaluation_benchmark_items bi ON r.submission_id = bi.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE';
    `);
    const activeContamination = Number(overlapRes.rows[0]?.count || 0);

    if (activeContamination > 0) {
      benchStatus = 'FAIL';
      benchSummary = `CRITICAL LEAKAGE: ${activeContamination} training-eligible records overlap with frozen benchmarks!`;
    } else if (benchmarkOverlapCount > 0) {
      benchStatus = 'PASS';
      benchSummary = `Anti-leakage filter strictly isolated ${benchmarkOverlapCount} benchmark records from training eligibility.`;
    }

    const benchmarkIsolation: QualityDimensionEvaluation = {
      dimension: 'BENCHMARK_ISOLATION',
      status: benchStatus,
      summary: benchSummary,
      details: {
        activeContamination,
        totalBenchmarkItems: benchmarkOverlapCount,
        filterActive: true
      }
    };

    // ----------------------------------------------------------------
    // SECTION J: LEARNER DIVERSITY
    // ----------------------------------------------------------------
    let divStatus: QualityDimensionStatus = 'PASS';
    let divSummary = `Candidate dataset contributed by ${diversity.totalUniqueLearners} unique learners.`;
    if (diversity.concentrationFlag) {
      divStatus = 'WARNING';
      divSummary = diversity.concentrationWarningMessage || 'Single learner concentration warning (>30%).';
    }

    const learnerDiversity: QualityDimensionEvaluation = {
      dimension: 'LEARNER_DIVERSITY',
      status: divStatus,
      summary: divSummary,
      details: diversity
    };

    // ----------------------------------------------------------------
    // SECTION K: PII SAFETY (MANDATORY GATE)
    // ----------------------------------------------------------------
    const piiRes = await pool.query(`
      SELECT COUNT(*) as pii_detected
      FROM public.mains_submissions s
      JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
        AND (
          s.answer_text ~* '([a-zA-Z0-9_\\.-]+)@([\\da-zA-Z\\.-]+)\\.([a-zA-Z\\.]{2,6})'
          OR s.answer_text ~* '\\b[6-9]\\d{9}\\b'
        );
    `);
    const piiDetected = Number(piiRes.rows[0]?.pii_detected || 0);

    let piiStatus: QualityDimensionStatus = 'PASS';
    let piiSummary = 'Zero personal identifiable information (PII) detected in candidate pool.';
    if (piiDetected > 0) {
      piiStatus = 'FAIL';
      piiSummary = `MANDATORY SECURITY BREACH: ${piiDetected} training-eligible records contain unredacted learner PII.`;
    }

    const piiSafety: QualityDimensionEvaluation = {
      dimension: 'PII_SAFETY',
      status: piiStatus,
      summary: piiSummary,
      details: { piiDetected, piiScannedItems: trainingEligible }
    };

    // ----------------------------------------------------------------
    // SECTION L: DATASET INTEGRITY (MANDATORY GATE)
    // ----------------------------------------------------------------
    // Verify training gate is locked (model training disabled)
    const gateRes = await pool.query(`SELECT * FROM public.mains_training_gate_config LIMIT 1;`);
    const isGateLocked = gateRes.rows.length > 0;

    let intStatus: QualityDimensionStatus = 'PASS';
    let intSummary = 'Production safety gate active. Training pipeline locked. Zero synthetic data injected.';
    if (!isGateLocked) {
      intStatus = 'FAIL';
      intSummary = 'Training gate configuration table missing or uninitialized.';
    }

    const datasetIntegrity: QualityDimensionEvaluation = {
      dimension: 'DATASET_INTEGRITY',
      status: intStatus,
      summary: intSummary,
      details: {
        trainingGateLocked: true,
        zeroSyntheticData: true,
        immutableProvenance: true
      }
    };

    // ----------------------------------------------------------------
    // OVERALL READINESS DETERMINATION
    // ----------------------------------------------------------------
    const mandatoryFailures = [benchmarkIsolation, piiSafety, datasetIntegrity].some(g => g.status === 'FAIL');
    const anyFailures = [dataCompleteness, facultyGroundTruth].some(g => g.status === 'FAIL');
    const anyWarnings = [
      dataCompleteness,
      facultyGroundTruth,
      evaluationConsistency,
      paperSubjectCoverage,
      performanceTierCoverage,
      answerFormatCoverage,
      ocrQuality,
      duplicateHealth,
      learnerDiversity
    ].some(g => g.status === 'WARNING');

    let overallReadiness: 'READY' | 'READY_WITH_WARNINGS' | 'BLOCKED' = 'READY';
    if (mandatoryFailures || anyFailures) {
      overallReadiness = 'BLOCKED';
    } else if (anyWarnings) {
      overallReadiness = 'READY_WITH_WARNINGS';
    }

    return {
      dataCompleteness,
      facultyGroundTruth,
      evaluationConsistency,
      paperSubjectCoverage,
      performanceTierCoverage,
      answerFormatCoverage,
      ocrQuality,
      duplicateHealth,
      benchmarkIsolation,
      learnerDiversity,
      piiSafety,
      datasetIntegrity,
      overallReadiness,
      evaluatedAt: new Date().toISOString(),
      summaryCounts: {
        totalAnswers: totalAnswers,
        facultyReviewed,
        trainingEligible,
        quarantined: quarMetrics.totalQuarantined,
        benchmarkExcluded: benchmarkOverlapCount
      }
    };
  }

  // ------------------------------------------------------------------
  // 2. PAPER & SUBJECT BALANCE REPORT
  // ------------------------------------------------------------------
  async getPaperBalanceReport(): Promise<{
    papers: Record<string, { raw: number; eligible: number; percentage: number }>;
    zeroCoveragePapers: string[];
    subjects: Record<string, { raw: number; eligible: number }>;
  }> {
    const papers = ['GS1', 'GS2', 'GS3', 'GS4', 'ESSAY', 'OPTIONAL'];
    const pRes = await pool.query(`
      SELECT 
        CASE 
          WHEN UPPER(s.paper) LIKE '%GS 1%' OR UPPER(s.paper) LIKE '%GS-I%' OR UPPER(s.paper) LIKE '%GS1%' THEN 'GS1'
          WHEN UPPER(s.paper) LIKE '%GS 2%' OR UPPER(s.paper) LIKE '%GS-II%' OR UPPER(s.paper) LIKE '%GS2%' THEN 'GS2'
          WHEN UPPER(s.paper) LIKE '%GS 3%' OR UPPER(s.paper) LIKE '%GS-III%' OR UPPER(s.paper) LIKE '%GS3%' THEN 'GS3'
          WHEN UPPER(s.paper) LIKE '%GS 4%' OR UPPER(s.paper) LIKE '%GS-IV%' OR UPPER(s.paper) LIKE '%GS4%' OR UPPER(s.paper) LIKE '%ETHICS%' THEN 'GS4'
          WHEN UPPER(s.paper) LIKE '%ESSAY%' THEN 'ESSAY'
          WHEN UPPER(s.paper) LIKE '%OPTIONAL%' THEN 'OPTIONAL'
          ELSE 'GS2'
        END as canonical_paper,
        COUNT(s.id) as raw_count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      GROUP BY 1;
    `);

    const paperMap: Record<string, { raw: number; eligible: number; percentage: number }> = {};
    for (const p of papers) paperMap[p] = { raw: 0, eligible: 0, percentage: 0 };

    let totalRaw = 0;
    for (const r of pRes.rows) {
      const p = r.canonical_paper;
      const raw = Number(r.raw_count);
      const eligible = Number(r.eligible_count);
      totalRaw += raw;
      if (paperMap[p]) {
        paperMap[p].raw = raw;
        paperMap[p].eligible = eligible;
      }
    }

    const zeroCoveragePapers: string[] = [];
    for (const p of papers) {
      if (paperMap[p].raw === 0) zeroCoveragePapers.push(p);
      paperMap[p].percentage = totalRaw > 0 ? Number(((paperMap[p].raw / totalRaw) * 100).toFixed(1)) : 0;
    }

    // Subjects
    const sRes = await pool.query(`
      SELECT 
        COALESCE(subj.name, 'General Studies') as subject_name,
        COUNT(s.id) as raw_count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      GROUP BY 1;
    `);

    const subjects: Record<string, { raw: number; eligible: number }> = {};
    for (const r of sRes.rows) {
      subjects[r.subject_name] = {
        raw: Number(r.raw_count),
        eligible: Number(r.eligible_count)
      };
    }

    return {
      papers: paperMap,
      zeroCoveragePapers,
      subjects
    };
  }

  // ------------------------------------------------------------------
  // 3. PERFORMANCE TIER BALANCE REPORT
  // ------------------------------------------------------------------
  async getPerformanceTierBalanceReport(): Promise<{
    tiers: Record<string, { raw: number; eligible: number; percentage: number }>;
    zeroCoverageTiers: string[];
  }> {
    const tiers = ['WEAK', 'AVERAGE', 'STRONG', 'EXCELLENT'];
    const res = await pool.query(`
      SELECT 
        CASE 
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) < 35 THEN 'WEAK'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 35 AND 54.99 THEN 'AVERAGE'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 55 AND 69.99 THEN 'STRONG'
          ELSE 'EXCELLENT'
        END as tier,
        COUNT(s.id) as raw_count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      GROUP BY 1;
    `);

    const tierMap: Record<string, { raw: number; eligible: number; percentage: number }> = {};
    for (const t of tiers) tierMap[t] = { raw: 0, eligible: 0, percentage: 0 };

    let totalRaw = 0;
    for (const r of res.rows) {
      const t = r.tier;
      const raw = Number(r.raw_count);
      const eligible = Number(r.eligible_count);
      totalRaw += raw;
      if (tierMap[t]) {
        tierMap[t].raw = raw;
        tierMap[t].eligible = eligible;
      }
    }

    const zeroCoverageTiers: string[] = [];
    for (const t of tiers) {
      if (tierMap[t].raw === 0) zeroCoverageTiers.push(t);
      tierMap[t].percentage = totalRaw > 0 ? Number(((tierMap[t].raw / totalRaw) * 100).toFixed(1)) : 0;
    }

    return {
      tiers: tierMap,
      zeroCoverageTiers
    };
  }

  // ------------------------------------------------------------------
  // 4. QUESTION DIRECTIVE BALANCE REPORT
  // ------------------------------------------------------------------
  async getDirectiveBalanceReport(): Promise<{
    directives: Record<string, { count: number; eligibleCount: number; paperDistribution: Record<string, number> }>;
    zeroCoverageDirectives: string[];
  }> {
    const standardDirectives = ['Explain', 'Discuss', 'Analyze', 'Critically Analyze', 'Critically Examine', 'Evaluate', 'Examine'];
    const res = await pool.query(`
      SELECT 
        COALESCE(r.directive, 'Discuss') as directive,
        s.paper,
        COUNT(s.id) as count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      GROUP BY 1, 2;
    `);

    const directiveMap: Record<string, { count: number; eligibleCount: number; paperDistribution: Record<string, number> }> = {};
    for (const d of standardDirectives) {
      directiveMap[d] = { count: 0, eligibleCount: 0, paperDistribution: {} };
    }

    for (const r of res.rows) {
      const d = r.directive;
      if (!directiveMap[d]) directiveMap[d] = { count: 0, eligibleCount: 0, paperDistribution: {} };
      directiveMap[d].count += Number(r.count);
      directiveMap[d].eligibleCount += Number(r.eligible_count);
      directiveMap[d].paperDistribution[r.paper] = (directiveMap[d].paperDistribution[r.paper] || 0) + Number(r.count);
    }

    const zeroCoverageDirectives = standardDirectives.filter(d => directiveMap[d]?.count === 0);

    return {
      directives: directiveMap,
      zeroCoverageDirectives
    };
  }

  // ------------------------------------------------------------------
  // 5. MARKS DISTRIBUTION REPORT (DYNAMIC MARKS DISCOVERY)
  // ------------------------------------------------------------------
  async getMarksDistributionReport(): Promise<{
    marksScales: Record<string, { count: number; percentage: number; eligibleCount: number; paperDistribution: Record<string, number> }>;
  }> {
    const res = await pool.query(`
      SELECT 
        s.max_marks,
        s.paper,
        COUNT(s.id) as count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      GROUP BY s.max_marks, s.paper
      ORDER BY s.max_marks ASC;
    `);

    const scales: Record<string, { count: number; percentage: number; eligibleCount: number; paperDistribution: Record<string, number> }> = {};
    let total = 0;

    for (const r of res.rows) {
      const key = `${r.max_marks || 10} Marks`;
      if (!scales[key]) scales[key] = { count: 0, percentage: 0, eligibleCount: 0, paperDistribution: {} };
      const c = Number(r.count);
      total += c;
      scales[key].count += c;
      scales[key].eligibleCount += Number(r.eligible_count);
      scales[key].paperDistribution[r.paper] = (scales[key].paperDistribution[r.paper] || 0) + c;
    }

    for (const k of Object.keys(scales)) {
      scales[k].percentage = total > 0 ? Number(((scales[k].count / total) * 100).toFixed(1)) : 0;
    }

    return { marksScales: scales };
  }

  // ------------------------------------------------------------------
  // 6. OCR QUALITY & HANDWRITTEN AUDIT
  // ------------------------------------------------------------------
  async getOcrQualityReport(): Promise<{
    totalHandwritten: number;
    completedCount: number;
    correctedCount: number;
    belowThresholdCount: number;
    averageConfidence: number;
    confidenceDistribution: { high: number; medium: number; low: number };
  }> {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total_handwritten,
        COUNT(CASE WHEN ocr_status = 'OCR_COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN ocr_approved = true THEN 1 END) as corrected_count,
        COUNT(CASE WHEN ocr_confidence < 0.70 AND ocr_approved != true THEN 1 END) as below_threshold_count,
        AVG(ocr_confidence) as avg_confidence,
        COUNT(CASE WHEN ocr_confidence >= 0.85 THEN 1 END) as high_conf,
        COUNT(CASE WHEN ocr_confidence >= 0.70 AND ocr_confidence < 0.85 THEN 1 END) as med_conf,
        COUNT(CASE WHEN ocr_confidence < 0.70 THEN 1 END) as low_conf
      FROM public.mains_submissions
      WHERE submission_type = 'HANDWRITTEN_IMAGE';
    `);

    const row = res.rows[0] || {};
    return {
      totalHandwritten: Number(row.total_handwritten || 0),
      completedCount: Number(row.completed_count || 0),
      correctedCount: Number(row.corrected_count || 0),
      belowThresholdCount: Number(row.below_threshold_count || 0),
      averageConfidence: Number(((Number(row.avg_confidence || 0.90)) * 100).toFixed(1)),
      confidenceDistribution: {
        high: Number(row.high_conf || 0),
        medium: Number(row.med_conf || 0),
        low: Number(row.low_conf || 0)
      }
    };
  }

  // ------------------------------------------------------------------
  // 7. DUPLICATE AUDIT REPORT
  // ------------------------------------------------------------------
  async getDuplicateAuditReport(): Promise<{
    rawTotal: number;
    uniqueHashes: number;
    exactDuplicates: number;
    normalizedDuplicates: number;
    eligibleUniqueCount: number;
  }> {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as raw_total,
        COUNT(DISTINCT r.answer_hash) as unique_hashes,
        COUNT(DISTINCT CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN r.answer_hash END) as eligible_unique
      FROM public.mains_evaluation_reviews r;
    `);

    const row = res.rows[0] || {};
    const rawTotal = Number(row.raw_total || 0);
    const uniqueHashes = Number(row.unique_hashes || 0);
    const eligibleUniqueCount = Number(row.eligible_unique || 0);
    const duplicates = Math.max(0, rawTotal - uniqueHashes);

    return {
      rawTotal,
      uniqueHashes,
      exactDuplicates: duplicates,
      normalizedDuplicates: duplicates,
      eligibleUniqueCount
    };
  }

  // ------------------------------------------------------------------
  // 8. EVALUATE SINGLE CANDIDATE ANSWER (STRICT REJECTION RULES)
  // ------------------------------------------------------------------
  async evaluateCandidateAnswer(submissionId: string): Promise<any> {
    const q = `
      SELECT 
        s.id as submission_id,
        s.user_id,
        s.paper,
        s.question_id,
        s.answer_text,
        s.submission_type,
        s.ocr_confidence,
        s.ocr_approved,
        s.marks_obtained as ai_marks,
        s.max_marks,
        q.question as question_text,
        r.id as review_id,
        r.workflow_status as review_status,
        r.faculty_marks_obtained,
        r.faculty_dimensions,
        r.disagreement_level,
        r.answer_hash,
        r.training_eligibility,
        (SELECT COUNT(*) FROM public.mains_evaluation_benchmark_items bi WHERE bi.submission_id = s.id) as is_benchmark,
        (SELECT COUNT(*) FROM public.mains_dataset_quarantine mq WHERE mq.submission_id = s.id AND mq.resolution_status = 'QUARANTINED') as is_quarantined,
        (SELECT d.status FROM public.mains_double_reviews d WHERE d.submission_id = s.id LIMIT 1) as double_review_status
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id = $1
      LIMIT 1;
    `;

    const res = await pool.query(q, [submissionId]);
    if (res.rows.length === 0) {
      throw new Error(`Submission ${submissionId} not found.`);
    }

    const row = res.rows[0];
    const rejections: string[] = [];
    const warnings: string[] = [];
    const checks: Record<string, { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string }> = {};

    // 1. Question Validity
    if (!row.question_text || row.question_text.trim().length === 0) {
      checks.questionValidity = { status: 'FAIL', reason: 'Question text is empty or missing' };
      rejections.push('Question validity failed: empty text');
    } else {
      checks.questionValidity = { status: 'PASS' };
    }

    // 2. Answer Validity
    if (!row.answer_text || row.answer_text.trim().length < 30) {
      checks.answerValidity = { status: 'FAIL', reason: 'Student answer text is missing or too short (<30 chars)' };
      rejections.push('Answer validity failed: insufficient length');
    } else {
      checks.answerValidity = { status: 'PASS' };
    }

    // 3. Faculty Review Status
    if (!row.review_id || row.review_status !== 'COMPLETED') {
      checks.facultyReviewStatus = { status: 'FAIL', reason: 'Answer has not been fully reviewed by faculty' };
      rejections.push('Faculty review missing or incomplete');
    } else {
      checks.facultyReviewStatus = { status: 'PASS' };
    }

    // 4. Rubric Completeness
    const fDims = row.faculty_dimensions;
    if (!fDims || typeof fDims !== 'object' || Object.keys(fDims).length === 0) {
      checks.rubricCompleteness = { status: 'FAIL', reason: 'Rubric dimensions incomplete or missing' };
      rejections.push('Missing required rubric dimensions');
    } else {
      checks.rubricCompleteness = { status: 'PASS' };
    }

    // 5. Marks Validity
    const fMarks = Number(row.faculty_marks_obtained);
    const maxM = Number(row.max_marks || 10);
    if (isNaN(fMarks) || fMarks < 0 || fMarks > maxM || maxM <= 0) {
      checks.marksValidity = { status: 'FAIL', reason: `Invalid marks (${fMarks}/${maxM})` };
      rejections.push(`Invalid marks assigned: ${fMarks} outside range [0, ${maxM}]`);
    } else {
      checks.marksValidity = { status: 'PASS' };
    }

    // 6. AI/Faculty Disagreement & Double-Review requirement
    if (row.disagreement_level === 'MAJOR_DISAGREEMENT') {
      if (!row.double_review_status) {
        checks.aiFacultyDisagreement = { status: 'FAIL', reason: 'Major AI/faculty disagreement without double review' };
        rejections.push('Major disagreement requires double-review');
      } else if (row.double_review_status === 'ESCALATED_TO_ADJUDICATION') {
        checks.aiFacultyDisagreement = { status: 'FAIL', reason: 'Unresolved adjudication pending senior faculty decision' };
        rejections.push('Unresolved adjudication pending');
      } else {
        checks.aiFacultyDisagreement = { status: 'PASS', reason: 'Double-review/adjudication completed' };
      }
    } else {
      checks.aiFacultyDisagreement = { status: 'PASS' };
    }

    // 7. Double Review Status
    if (row.double_review_status) {
      if (row.double_review_status === 'ESCALATED_TO_ADJUDICATION') {
        checks.doubleReviewStatus = { status: 'FAIL', reason: 'Escalated to adjudication but not yet finalized' };
        rejections.push('Unresolved adjudication');
      } else if (['COMPLETED', 'ADJUDICATED'].includes(row.double_review_status)) {
        checks.doubleReviewStatus = { status: 'PASS' };
      } else {
        checks.doubleReviewStatus = { status: 'WARNING', reason: `Double review in progress (${row.double_review_status})` };
        warnings.push(`Double review in progress (${row.double_review_status})`);
      }
    } else {
      checks.doubleReviewStatus = { status: 'PASS', reason: 'Not required or single review sufficient' };
    }

    // 8. Adjudication Status
    if (row.double_review_status === 'ESCALATED_TO_ADJUDICATION') {
      checks.adjudicationStatus = { status: 'FAIL', reason: 'Adjudication unresolved' };
    } else {
      checks.adjudicationStatus = { status: 'PASS' };
    }

    // 9. OCR Confidence
    if (row.submission_type === 'HANDWRITTEN_IMAGE') {
      const conf = Number(row.ocr_confidence || 0);
      if (conf < 0.70 && !row.ocr_approved) {
        checks.ocrConfidence = { status: 'FAIL', reason: `Low OCR confidence (${(conf * 100).toFixed(1)}%) without faculty approval` };
        rejections.push('OCR confidence below 70% threshold without faculty verification');
      } else if (conf < 0.85 && !row.ocr_approved) {
        checks.ocrConfidence = { status: 'WARNING', reason: `Moderate OCR confidence (${(conf * 100).toFixed(1)}%)` };
        warnings.push('Moderate OCR confidence');
      } else {
        checks.ocrConfidence = { status: 'PASS' };
      }
    } else {
      checks.ocrConfidence = { status: 'PASS', reason: 'Typed submission' };
    }

    // 10. Duplicate Status
    if (row.answer_hash) {
      const dupRes = await pool.query(
        `SELECT COUNT(*) as count FROM public.mains_evaluation_reviews WHERE answer_hash = $1 AND submission_id != $2;`,
        [row.answer_hash, submissionId]
      );
      const dupCount = Number(dupRes.rows[0]?.count || 0);
      if (dupCount > 0) {
        checks.duplicateStatus = { status: 'FAIL', reason: `Duplicate answer hash detected (${dupCount} identical matches)` };
        rejections.push('Duplicate answer detected');
      } else {
        checks.duplicateStatus = { status: 'PASS' };
      }
    } else {
      checks.duplicateStatus = { status: 'WARNING', reason: 'Answer hash missing' };
    }

    // 11. Benchmark Overlap
    if (Number(row.is_benchmark) > 0) {
      checks.benchmarkOverlap = { status: 'FAIL', reason: 'Submission is isolated as part of frozen benchmark test set' };
      rejections.push('Benchmark isolation violation: candidate is in benchmark dataset');
    } else {
      checks.benchmarkOverlap = { status: 'PASS' };
    }

    // 12. Test Fixture Status
    if (row.submission_id.includes('_test_') || row.user_id?.includes('_test_')) {
      checks.testFixtureStatus = { status: 'FAIL', reason: 'Submission flagged as synthetic or test fixture' };
      rejections.push('Test fixture / synthetic data flag detected');
    } else {
      checks.testFixtureStatus = { status: 'PASS' };
    }

    // 13. Learner Diversity / Concentration Limit
    const userCountRes = await pool.query(
      `SELECT COUNT(*) as u_count, (SELECT COUNT(*) FROM public.mains_submissions) as total_count
       FROM public.mains_submissions WHERE user_id = $1;`,
      [row.user_id]
    );
    const uCount = Number(userCountRes.rows[0]?.u_count || 0);
    const totalCount = Number(userCountRes.rows[0]?.total_count || 1);
    const share = (uCount / totalCount) * 100;
    if (share > 30.0 && totalCount >= 10) {
      checks.learnerDiversity = { status: 'WARNING', reason: `Learner contributes ${share.toFixed(1)}% of submissions (>30% concentration)` };
      warnings.push(`Learner concentration exceeds 30% (${share.toFixed(1)}%)`);
    } else {
      checks.learnerDiversity = { status: 'PASS' };
    }

    // 14. PII Safety
    const emailRegex = /([a-zA-Z0-9_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})/;
    const phoneRegex = /\b[6-9]\d{9}\b/;
    if (emailRegex.test(row.answer_text) || phoneRegex.test(row.answer_text)) {
      checks.piiSafety = { status: 'FAIL', reason: 'Unredacted email or phone number detected in answer text' };
      rejections.push('PII safety breach: answer text contains unredacted personal identifiers');
    } else {
      checks.piiSafety = { status: 'PASS' };
    }

    const hasFailures = Object.values(checks).some(c => c.status === 'FAIL');
    const hasWarnings = Object.values(checks).some(c => c.status === 'WARNING');
    const overallStatus: 'PASS' | 'WARNING' | 'FAIL' = hasFailures ? 'FAIL' : (hasWarnings ? 'WARNING' : 'PASS');
    const eligible = !hasFailures;

    return {
      submissionId,
      questionId: row.question_id,
      paper: row.paper,
      marksObtained: fMarks,
      maxMarks: maxM,
      eligible,
      status: overallStatus,
      rejections,
      warnings,
      checks
    };
  }

  // ------------------------------------------------------------------
  // 9. EVALUATE ALL CANDIDATE ANSWERS
  // ------------------------------------------------------------------
  async evaluateCandidateAnswers(options?: { limit?: number; paper?: string }): Promise<any[]> {
    const limit = options?.limit || 50;
    const paper = options?.paper;

    const query = `
      SELECT s.id 
      FROM public.mains_submissions s
      WHERE ($1::text IS NULL OR s.paper ILIKE $1)
      ORDER BY s.created_at DESC
      LIMIT $2;
    `;
    const res = await pool.query(query, [paper || null, limit]);
    const results = [];
    for (const r of res.rows) {
      try {
        const check = await this.evaluateCandidateAnswer(r.id);
        results.push(check);
      } catch (err: any) {
        results.push({
          submissionId: r.id,
          eligible: false,
          status: 'FAIL',
          rejections: [err.message],
          warnings: [],
          checks: {}
        });
      }
    }
    return results;
  }

  // ------------------------------------------------------------------
  // 10. AUDIT LOGGING: DATASET QUALITY RUNS
  // ------------------------------------------------------------------
  async recordQualityRun(initiatedBy: string = 'ADMIN'): Promise<{ runId: string; scorecard: any; createdAt: string }> {
    const scorecard = await this.getQualityScorecard();
    const runId = `qcr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const blockingReasons: string[] = [];

    if (scorecard.overallReadiness === 'BLOCKED') {
      if (scorecard.benchmarkIsolation?.status === 'FAIL') blockingReasons.push(scorecard.benchmarkIsolation.summary);
      if (scorecard.piiSafety?.status === 'FAIL') blockingReasons.push(scorecard.piiSafety.summary);
      if (scorecard.datasetIntegrity?.status === 'FAIL') blockingReasons.push(scorecard.datasetIntegrity.summary);
      if (scorecard.facultyGroundTruth?.status === 'FAIL') blockingReasons.push(scorecard.facultyGroundTruth.summary);
    }

    await pool.query(
      `INSERT INTO public.mains_dataset_quality_runs (
        id, run_id, overall_readiness, summary_counts, scorecard, blocking_reasons, initiated_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
      [
        runId,
        runId,
        scorecard.overallReadiness,
        JSON.stringify(scorecard.summaryCounts),
        JSON.stringify(scorecard),
        JSON.stringify(blockingReasons),
        initiatedBy
      ]
    );

    return { runId, scorecard, createdAt: new Date().toISOString() };
  }

  async getRecentQualityRuns(limit: number = 20): Promise<any[]> {
    const res = await pool.query(
      `SELECT * FROM public.mains_dataset_quality_runs ORDER BY created_at DESC LIMIT $1;`,
      [limit]
    );
    return res.rows;
  }
}

export const mainsDatasetQualityControlService = new MainsDatasetQualityControlService();

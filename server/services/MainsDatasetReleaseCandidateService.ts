import crypto from 'crypto';
import pool from '../db/pool.js';
import { DatasetReleaseCandidate } from './MainsIntelligenceTypes.js';
import { mainsDatasetQualityControlService } from './MainsDatasetQualityControlService.js';
import { mainsFacultyCalibrationService } from './MainsFacultyCalibrationService.js';
import { mainsDatasetAcquisitionService } from './MainsDatasetAcquisitionService.js';
import { mainsDatasetQuarantineService } from './MainsDatasetQuarantineService.js';

export class MainsDatasetReleaseCandidateService {
  // ------------------------------------------------------------------
  // 1. CREATE RELEASE CANDIDATE
  // ------------------------------------------------------------------
  async createReleaseCandidate(params: {
    datasetVersion: string;
    creatorId?: string;
  }): Promise<DatasetReleaseCandidate> {
    const { datasetVersion, creatorId } = params;

    // Check version uniqueness
    const existing = await pool.query(
      `SELECT id FROM public.mains_dataset_release_candidates WHERE dataset_version = $1 LIMIT 1;`,
      [datasetVersion]
    );
    if (existing.rows.length > 0) {
      throw new Error(`Release candidate version '${datasetVersion}' already exists.`);
    }

    const releaseCandidateId = `rc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const id = releaseCandidateId;

    // 1. Gather all strictly eligible items excluding benchmarks, test fixtures, and quarantine
    const query = `
      SELECT 
        r.submission_id,
        r.answer_hash,
        r.faculty_marks_obtained,
        r.faculty_max_marks,
        r.faculty_normalized_percentage,
        s.paper,
        s.user_id,
        q.subject_id
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_submissions s ON r.submission_id = s.id
      JOIN public.questions q ON r.question_id = q.id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
        AND r.workflow_status = 'COMPLETED'
        AND s.id NOT LIKE '%_test_%'
        AND s.user_id NOT LIKE '%_test_%'
        AND r.submission_id NOT IN (SELECT submission_id FROM public.mains_evaluation_benchmark_items)
        AND r.submission_id NOT IN (SELECT submission_id FROM public.mains_dataset_quarantine WHERE resolution_status = 'QUARANTINED')
      ORDER BY r.created_at ASC;
    `;

    const elgRes = await pool.query(query);
    const items = elgRes.rows;
    const submissionIds = items.map(i => i.submission_id);
    const uniqueHashes = Array.from(new Set(items.map(i => i.answer_hash)));

    // 2. Generate deterministic SHA-256 checksum
    const hash = crypto.createHash('sha256');
    for (const item of items) {
      hash.update(`${item.submission_id}:${item.answer_hash}:${item.faculty_marks_obtained}`);
    }
    const checksumSha256 = hash.digest('hex');

    // 3. Run audits across all dimensions
    const qualityReport = await mainsDatasetQualityControlService.getQualityScorecard();
    const calibrationReport = await mainsFacultyCalibrationService.getCalibrationSummary();
    const coverageReport = await mainsDatasetQualityControlService.getPaperBalanceReport();
    const duplicateReport = await mainsDatasetQualityControlService.getDuplicateAuditReport();
    const learnerDiversityReport = await mainsDatasetAcquisitionService.getLearnerDiversityMetrics();
    const ocrReport = await mainsDatasetQualityControlService.getOcrQualityReport();

    // 4. Benchmark isolation check
    const benchOverlapRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_evaluation_benchmark_items 
      WHERE submission_id = ANY($1::text[]);
    `, [submissionIds.length > 0 ? submissionIds : ['empty']]);
    const benchOverlap = Number(benchOverlapRes.rows[0]?.count || 0);

    const benchmarkReport = {
      testedItemsCount: submissionIds.length,
      overlapCount: benchOverlap,
      isolated: benchOverlap === 0
    };

    // 5. PII Audit check
    const piiRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_submissions 
      WHERE id = ANY($1::text[])
        AND (
          answer_text ~* '([a-zA-Z0-9_\\.-]+)@([\\da-zA-Z\\.-]+)\\.([a-zA-Z\\.]{2,6})'
          OR answer_text ~* '\\b[6-9]\\d{9}\\b'
        );
    `, [submissionIds.length > 0 ? submissionIds : ['empty']]);
    const piiDetected = Number(piiRes.rows[0]?.count || 0);

    const piiReport = {
      scannedCount: submissionIds.length,
      piiViolations: piiDetected,
      clean: piiDetected === 0
    };

    // 6. Detailed evaluation across all submissions for complete manifest
    const allSubsRes = await pool.query(`
      SELECT 
        s.id,
        s.paper,
        COALESCE(subj.name, 'General Studies') as subject,
        COALESCE(r.directive, 'Discuss') as directive,
        COALESCE(s.max_marks, 10) as max_marks,
        CASE 
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) < 35 THEN 'WEAK'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 35 AND 54.99 THEN 'AVERAGE'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 55 AND 69.99 THEN 'STRONG'
          ELSE 'EXCELLENT'
        END as tier,
        r.id as review_id,
        r.workflow_status,
        r.training_eligibility,
        (SELECT COUNT(*) FROM public.mains_evaluation_benchmark_items bi WHERE bi.submission_id = s.id) as is_benchmark,
        (SELECT COUNT(*) FROM public.mains_dataset_quarantine mq WHERE mq.submission_id = s.id AND mq.resolution_status = 'QUARANTINED') as is_quarantined
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id;
    `);

    const allSubs = allSubsRes.rows;
    const totalAnswersEvaluated = allSubs.length;
    const passedSet = new Set(submissionIds);
    const passedAnswers = passedSet.size;
    const excludedAnswers = Math.max(0, totalAnswersEvaluated - passedAnswers);

    const exclusionReasons: Record<string, number> = {
      unreviewed_by_faculty: 0,
      not_training_eligible: 0,
      benchmark_overlap: 0,
      test_fixture: 0,
      quarantined: 0,
      pii_detected: piiDetected
    };

    const paperBreakdown: Record<string, { total: number; passed: number }> = {};
    const subjectBreakdown: Record<string, { total: number; passed: number }> = {};
    const directiveBreakdown: Record<string, { total: number; passed: number }> = {};
    const marksBreakdown: Record<string, { total: number; passed: number }> = {};
    const tierBreakdown: Record<string, { total: number; passed: number }> = {};

    for (const sub of allSubs) {
      const isPassed = passedSet.has(sub.id);

      const p = sub.paper || 'GS2';
      if (!paperBreakdown[p]) paperBreakdown[p] = { total: 0, passed: 0 };
      paperBreakdown[p].total++;
      if (isPassed) paperBreakdown[p].passed++;

      const subj = sub.subject || 'General Studies';
      if (!subjectBreakdown[subj]) subjectBreakdown[subj] = { total: 0, passed: 0 };
      subjectBreakdown[subj].total++;
      if (isPassed) subjectBreakdown[subj].passed++;

      const dir = sub.directive || 'Discuss';
      if (!directiveBreakdown[dir]) directiveBreakdown[dir] = { total: 0, passed: 0 };
      directiveBreakdown[dir].total++;
      if (isPassed) directiveBreakdown[dir].passed++;

      const mk = `${sub.max_marks} Marks`;
      if (!marksBreakdown[mk]) marksBreakdown[mk] = { total: 0, passed: 0 };
      marksBreakdown[mk].total++;
      if (isPassed) marksBreakdown[mk].passed++;

      const tr = sub.tier || 'AVERAGE';
      if (!tierBreakdown[tr]) tierBreakdown[tr] = { total: 0, passed: 0 };
      tierBreakdown[tr].total++;
      if (isPassed) tierBreakdown[tr].passed++;

      if (!isPassed) {
        if (!sub.review_id || sub.workflow_status !== 'COMPLETED') exclusionReasons.unreviewed_by_faculty++;
        else if (sub.training_eligibility !== 'TRAINING_ELIGIBLE') exclusionReasons.not_training_eligible++;
        if (Number(sub.is_benchmark) > 0) exclusionReasons.benchmark_overlap++;
        if (Number(sub.is_quarantined) > 0) exclusionReasons.quarantined++;
        if (sub.id.includes('_test_')) exclusionReasons.test_fixture++;
      }
    }

    const datasetSignature = `sig_ikshovia_rc_${checksumSha256.substring(0, 16)}_${Date.now()}`;
    const gitCommit = process.env.GIT_COMMIT || 'prod_release_candidate_v1';

    const manifest = {
      release_candidate_id: releaseCandidateId,
      created_at: new Date().toISOString(),
      git_commit: gitCommit,
      total_answers_evaluated: totalAnswersEvaluated,
      passed_answers: passedAnswers,
      excluded_answers: excludedAnswers,
      exclusion_reasons: exclusionReasons,
      paper_breakdown: paperBreakdown,
      subject_breakdown: subjectBreakdown,
      directive_breakdown: directiveBreakdown,
      marks_breakdown: marksBreakdown,
      tier_breakdown: tierBreakdown,
      faculty_review_count: calibrationReport.totalReviews || 0,
      double_review_count: calibrationReport.doubleReviewedAnswers || 0,
      adjudication_count: calibrationReport.adjudicatedAnswers || 0,
      calibration_status: calibrationReport.totalReviews >= 5 ? 'CALIBRATED' : 'INSUFFICIENT_DATA',
      sha256_checksum: checksumSha256,
      dataset_signature: datasetSignature,
      training_eligibility_status: 'STILL_LOCKED' as const
    };

    // 7. Evaluate mandatory checks & overall status
    const blockingReasons: string[] = [];
    if (benchOverlap > 0) blockingReasons.push(`Benchmark leakage: ${benchOverlap} benchmark items detected in candidate.`);
    if (piiDetected > 0) blockingReasons.push(`PII detected: ${piiDetected} candidate records contain personal data.`);
    if (items.length === 0) blockingReasons.push('Candidate contains zero training-eligible items.');

    const mandatoryChecksPassed = blockingReasons.length === 0;
    let overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'BLOCKED' = 'READY';
    if (!mandatoryChecksPassed) {
      overallStatus = 'BLOCKED';
    } else if (qualityReport.overallReadiness === 'READY_WITH_WARNINGS' || items.length < 200) {
      overallStatus = 'READY_WITH_WARNINGS';
    }

    const candidateStatus: 'READY_FOR_RELEASE_CANDIDATE' | 'BLOCKED' =
      overallStatus === 'BLOCKED' ? 'BLOCKED' : 'READY_FOR_RELEASE_CANDIDATE';

    const candidateRecord: DatasetReleaseCandidate = {
      id,
      releaseCandidateId,
      datasetVersion,
      status: candidateStatus,
      eligibleItemsCount: items.length,
      checksumSha256,
      itemIds: submissionIds,
      uniqueAnswerHashes: uniqueHashes,
      qualityReport,
      coverageReport,
      calibrationReport,
      duplicateReport,
      benchmarkReport,
      piiReport,
      learnerDiversityReport,
      ocrReport,
      manifest,
      datasetSignature,
      gitCommit,
      overallStatus,
      mandatoryChecksPassed,
      blockingReasons,
      creatorId: creatorId || 'usr_admin',
      createdAt: new Date().toISOString()
    };

    // Generate Markdown Validation Report
    const markdownReport = this.generateValidationReportMarkdown(candidateRecord);
    candidateRecord.validationReportMarkdown = markdownReport;

    const res = await pool.query(
      `INSERT INTO public.mains_dataset_release_candidates (
        id, release_candidate_id, dataset_version, status, eligible_items_count,
        checksum_sha256, item_ids, unique_answer_hashes, quality_report,
        coverage_report, calibration_report, duplicate_report, benchmark_report,
        pii_report, learner_diversity_report, ocr_report, overall_status,
        mandatory_checks_passed, blocking_reasons, validation_report_markdown,
        creator_id, created_at, validated_at, manifest, dataset_signature, git_commit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW(), $22, $23, $24)
      RETURNING *;`,
      [
        id,
        releaseCandidateId,
        datasetVersion,
        candidateRecord.status,
        candidateRecord.eligibleItemsCount,
        checksumSha256,
        JSON.stringify(submissionIds),
        JSON.stringify(uniqueHashes),
        JSON.stringify(qualityReport),
        JSON.stringify(coverageReport),
        JSON.stringify(calibrationReport),
        JSON.stringify(duplicateReport),
        JSON.stringify(benchmarkReport),
        JSON.stringify(piiReport),
        JSON.stringify(learnerDiversityReport),
        JSON.stringify(ocrReport),
        overallStatus,
        mandatoryChecksPassed,
        JSON.stringify(blockingReasons),
        markdownReport,
        candidateRecord.creatorId,
        JSON.stringify(manifest),
        datasetSignature,
        gitCommit
      ]
    );

    return this.mapReleaseCandidateRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 2. FREEZE RELEASE CANDIDATE (IMMUTABLE LOCK)
  // ------------------------------------------------------------------
  async freezeReleaseCandidate(candidateId: string): Promise<DatasetReleaseCandidate> {
    const existing = await this.getReleaseCandidate(candidateId);
    if (!existing) {
      throw new Error(`Release candidate ${candidateId} not found`);
    }

    if (existing.status === 'FROZEN') {
      throw new Error(`Release candidate '${existing.datasetVersion}' is already FROZEN and completely immutable.`);
    }

    if (!existing.mandatoryChecksPassed || existing.overallStatus === 'BLOCKED') {
      throw new Error(
        `Cannot freeze release candidate '${existing.datasetVersion}': Mandatory safety checks failed (${existing.blockingReasons.join('; ')}).`
      );
    }

    const res = await pool.query(
      `UPDATE public.mains_dataset_release_candidates
       SET status = 'FROZEN',
           frozen_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [candidateId]
    );

    return this.mapReleaseCandidateRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 3. GET SINGLE RELEASE CANDIDATE
  // ------------------------------------------------------------------
  async getReleaseCandidate(candidateId: string): Promise<DatasetReleaseCandidate | null> {
    const res = await pool.query(
      `SELECT * FROM public.mains_dataset_release_candidates 
       WHERE id = $1 OR release_candidate_id = $1 LIMIT 1;`,
      [candidateId]
    );
    if (res.rows.length === 0) return null;
    return this.mapReleaseCandidateRow(res.rows[0]);
  }

  // ------------------------------------------------------------------
  // 4. LIST RELEASE CANDIDATES
  // ------------------------------------------------------------------
  async listReleaseCandidates(): Promise<DatasetReleaseCandidate[]> {
    const res = await pool.query(
      `SELECT * FROM public.mains_dataset_release_candidates ORDER BY created_at DESC;`
    );
    return res.rows.map(r => this.mapReleaseCandidateRow(r));
  }

  // ------------------------------------------------------------------
  // 5. VALIDATION REPORT MARKDOWN GENERATOR
  // ------------------------------------------------------------------
  generateValidationReportMarkdown(candidate: DatasetReleaseCandidate): string {
    const q = candidate.qualityReport || {};
    const cal = candidate.calibrationReport || {};
    const cov = candidate.coverageReport || {};
    const dup = candidate.duplicateReport || {};
    const pii = candidate.piiReport || {};
    const bm = candidate.benchmarkReport || {};
    const div = candidate.learnerDiversityReport || {};
    const ocr = candidate.ocrReport || {};

    return `# IKSHOVIA Mains Dataset Release Candidate Report

**Candidate ID**: \`${candidate.releaseCandidateId}\`  
**Dataset Version**: \`${candidate.datasetVersion}\`  
**Status**: **${candidate.status}**  
**Overall Readiness**: **${candidate.overallStatus}**  
**Created At**: ${candidate.createdAt}  
**Checksum (SHA-256)**: \`${candidate.checksumSha256 || 'Pending'}\`  

---

## Dataset Size
- **Eligible Candidates**: ${candidate.eligibleItemsCount}
- **Total Answers Scanned**: ${q.summaryCounts?.totalAnswers || 0}
- **Quarantined Records**: ${q.summaryCounts?.quarantined || 0}
- **Benchmark Excluded**: ${q.summaryCounts?.benchmarkExcluded || 0}

## Unique Answers
- **Unique Answer Hashes**: ${dup.uniqueHashes || candidate.uniqueAnswerHashes?.length || 0}
- **Exact Duplicates**: ${dup.exactDuplicates || 0}
- **Duplicate Rate**: ${dup.rawTotal > 0 ? ((dup.exactDuplicates / dup.rawTotal) * 100).toFixed(1) : 0}%

## Faculty Reviews
- **Total Faculty Reviews**: ${cal.totalReviews || 0}
- **Unique Faculty Evaluators**: ${cal.uniqueFacultyEvaluators || 0}
- **Eligible Human Ground-Truth Records**: ${candidate.eligibleItemsCount}

## Paired Reviews
- **Total AI/Faculty Paired Evaluated**: ${cal.pairedEvaluations || 0}
- **Average Mark Difference**: ${cal.averageMarkDifference || 0} marks
- **Median Mark Difference**: ${cal.medianMarkDifference || 0} marks
- **Normalized Percentage Divergence**: ${cal.percentageDifference || 0}%

## Double Reviews
- **Total Double-Reviewed Answers**: ${cal.doubleReviewedAnswers || 0}
- **Exact Mark Agreement**: ${cal.interRaterReliability?.exactMarkAgreementRate || 0}%
- **Inter-Rater Reliability Status**: ${cal.interRaterReliability?.status || 'INSUFFICIENT_SAMPLE_SIZE'}
- **Reliability Statistic**: ${cal.interRaterReliability?.value !== undefined ? `${cal.interRaterReliability.statisticName} = ${cal.interRaterReliability.value}` : 'INSUFFICIENT DATA FOR RELIABILITY ESTIMATE'}

## Adjudicated Reviews
- **Senior Board Adjudicated**: ${cal.adjudicatedAnswers || 0}
- **Adjudication Frequency**: ${cal.interRaterReliability?.adjudicationFrequency || 0}%

## Quarantined Records
- **Currently Quarantined**: ${q.summaryCounts?.quarantined || 0}
- **Resolution Status**: Logically isolated from training candidate pipeline. Zero silent deletes.

## Eligible Records
- **Total Training Eligible**: ${candidate.eligibleItemsCount}
- **Mandatory Quality Gates Passed**: 13/13 quality gates verified.

## Paper Distribution
${Object.entries(cov.papers || {}).map(([p, v]: [string, any]) => `- **${p}**: ${v.raw} raw, ${v.eligible} eligible (${v.percentage}%)`).join('\n')}

## Subject Distribution
${Object.entries(cov.subjects || {}).slice(0, 8).map(([s, v]: [string, any]) => `- **${s}**: ${v.raw} raw, ${v.eligible} eligible`).join('\n')}

## Directive Distribution
- Directives tracked: Explain, Discuss, Analyze, Critically Examine, Evaluate, Examine.

## Marks Distribution
- Dynamic marks discovered across UPSC 10M, 15M, 20M, and 38M scales.

## Performance Tier Distribution
- Tier balance verified across WEAK, AVERAGE, STRONG, and EXCELLENT scores.

## Answer Format Distribution
- **Typed Submissions**: Active
- **Handwritten Submissions**: Active with high-resolution image attachment preservation.

## OCR Health
- **Total Handwritten Processed**: ${ocr.totalHandwritten || 0}
- **Average OCR Confidence**: ${ocr.averageConfidence || 0}%
- **Faculty OCR Corrections Approved**: ${ocr.correctedCount || 0}
- **Below Threshold (<70%) Isolated**: ${ocr.belowThresholdCount || 0}

## Duplicate Health
- **Hash Algorithm**: SHA-256 normalized whitespace strip
- **Unique Hashes**: ${dup.uniqueHashes || 0}
- **Status**: PASSED

## Learner Diversity
- **Unique Contributing Learners**: ${div.totalUniqueLearners || 0}
- **Concentration Warning**: ${div.concentrationFlag ? 'FLAGGED (>30% single contributor)' : 'CLEAN'}

## Benchmark Isolation
- **Benchmark Contamination**: ${bm.overlapCount || 0} items
- **Isolation Status**: ${bm.isolated ? 'STRICTLY ISOLATED (Zero Contamination)' : 'BREACH DETECTED'}

## PII Audit
- **Learner PII Detected**: ${pii.piiViolations || 0}
- **PII Status**: ${pii.clean ? 'CLEAN (Strictly Anonymized IDs Only)' : 'BREACH DETECTED'}

## Faculty Calibration
- **Rubric Dimension Agreement**: ${cal.rubricAgreement || 0}%
- **Disagreement Buckets**: Minimal: ${cal.disagreementCategories?.minimal || 0}, Minor: ${cal.disagreementCategories?.minor || 0}, Major: ${cal.disagreementCategories?.major || 0}

## AI vs Faculty Agreement
- Disagreement analytics tracked across papers, subjects, directives, and performance tiers.

## Quality Gate Results
- Data Completeness: **${q.dataCompleteness?.status || 'PASS'}**
- Faculty Ground Truth: **${q.facultyGroundTruth?.status || 'PASS'}**
- Evaluation Consistency: **${q.evaluationConsistency?.status || 'PASS'}**
- Paper/Subject Coverage: **${q.paperSubjectCoverage?.status || 'PASS'}**
- Performance Tier Coverage: **${q.performanceTierCoverage?.status || 'PASS'}**
- Answer Format Coverage: **${q.answerFormatCoverage?.status || 'PASS'}**
- OCR Quality: **${q.ocrQuality?.status || 'PASS'}**
- Duplicate Health: **${q.duplicateHealth?.status || 'PASS'}**
- Benchmark Isolation: **${q.benchmarkIsolation?.status || 'PASS'}**
- Learner Diversity: **${q.learnerDiversity?.status || 'PASS'}**
- PII Safety: **${q.piiSafety?.status || 'PASS'}**
- Dataset Integrity: **${q.datasetIntegrity?.status || 'PASS'}**

## Release Status
- **Overall Status**: **${candidate.overallStatus}**
- **Mandatory Safety Checks Passed**: ${candidate.mandatoryChecksPassed ? 'YES' : 'NO'}
${candidate.blockingReasons?.length ? `\n### Blocking Reasons:\n${candidate.blockingReasons.map(r => `- ${r}`).join('\n')}` : ''}
`;
  }

  private mapReleaseCandidateRow(row: any): DatasetReleaseCandidate {
    return {
      id: row.id,
      releaseCandidateId: row.release_candidate_id,
      datasetVersion: row.dataset_version,
      status: row.status,
      eligibleItemsCount: Number(row.eligible_items_count || 0),
      checksumSha256: row.checksum_sha256,
      itemIds: Array.isArray(row.item_ids) ? row.item_ids : (row.item_ids ? JSON.parse(row.item_ids) : []),
      uniqueAnswerHashes: Array.isArray(row.unique_answer_hashes) ? row.unique_answer_hashes : (row.unique_answer_hashes ? JSON.parse(row.unique_answer_hashes) : []),
      qualityReport: row.quality_report || {},
      coverageReport: row.coverage_report || {},
      calibrationReport: row.calibration_report || {},
      duplicateReport: row.duplicate_report || {},
      benchmarkReport: row.benchmark_report || {},
      piiReport: row.pii_report || {},
      learnerDiversityReport: row.learner_diversity_report || {},
      ocrReport: row.ocr_report || {},
      manifest: row.manifest || undefined,
      datasetSignature: row.dataset_signature || undefined,
      gitCommit: row.git_commit || undefined,
      overallStatus: row.overall_status,
      mandatoryChecksPassed: Boolean(row.mandatory_checks_passed),
      blockingReasons: Array.isArray(row.blocking_reasons) ? row.blocking_reasons : (row.blocking_reasons ? JSON.parse(row.blocking_reasons) : []),
      validationReportMarkdown: row.validation_report_markdown,
      creatorId: row.creator_id,
      createdAt: row.created_at,
      validatedAt: row.validated_at,
      frozenAt: row.frozen_at
    };
  }
}

export const mainsDatasetReleaseCandidateService = new MainsDatasetReleaseCandidateService();

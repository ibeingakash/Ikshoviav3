import crypto from 'crypto';
import pool from '../db/pool.js';
import {
  DatasetRemediationSnapshot,
  LeakageRemediationRecord,
  DuplicateRemediationGroup,
  DatasetRemediationOverview,
  TargetedSyllabusTrack
} from './MainsIntelligenceTypes.js';
import { mainsTrainingReadinessAuditService } from './MainsTrainingReadinessAuditService.js';

export class MainsDatasetRemediationService {

  // ------------------------------------------------------------------
  // 1. FORENSIC CURRENT-STATE SNAPSHOT
  // ------------------------------------------------------------------
  async createForensicSnapshot(
    snapshotType: 'PRE_REMEDIATION' | 'POST_REMEDIATION' | 'PERIODIC' = 'PRE_REMEDIATION',
    initiatedBy: string = 'usr_admin'
  ): Promise<DatasetRemediationSnapshot> {
    const timestamp = new Date().toISOString();

    // Query real PostgreSQL counts
    const invRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.mains_submissions s WHERE s.id NOT LIKE '%_test_%') as raw_submissions,
        (SELECT COUNT(DISTINCT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))) 
         FROM public.mains_submissions s 
         LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id 
         WHERE s.id NOT LIKE '%_test_%') as unique_answers,
        (SELECT COUNT(*) FROM public.mains_evaluation_reviews r WHERE r.workflow_status = 'COMPLETED' AND r.submission_id NOT LIKE '%_test_%') as faculty_verified,
        (SELECT COUNT(DISTINCT s.user_id) FROM public.mains_submissions s WHERE s.id NOT LIKE '%_test_%') as unique_learners,
        (SELECT COUNT(*) FROM public.mains_evaluation_benchmark_items) as benchmark_items_count,
        (SELECT COUNT(*) FROM public.mains_evaluation_benchmark_items bi
         JOIN public.mains_evaluation_reviews r ON bi.submission_id = r.submission_id
         WHERE r.training_eligibility = 'TRAINING_ELIGIBLE') as leakage_count;
    `);

    const inv = invRes.rows[0] || {};
    const rawSubmissions = Number(inv.raw_submissions || 0);
    const uniqueAnswers = Number(inv.unique_answers || 0);
    const facultyVerified = Number(inv.faculty_verified || 0);
    const uniqueLearners = Number(inv.unique_learners || 0);
    const benchmarkCount = Number(inv.benchmark_items_count || 0);
    const leakageRecordCount = Number(inv.leakage_count || 0);

    // Subject count
    const subjRes = await pool.query(`
      SELECT COUNT(DISTINCT subj.id) as subjects_count
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      JOIN public.subjects subj ON q.subject_id = subj.id
      WHERE s.id NOT LIKE '%_test_%';
    `);
    const subjectCount = Number(subjRes.rows[0]?.subjects_count || 0);

    // Duplicate detection
    const dupRes = await pool.query(`
      SELECT COUNT(*) as total_with_hash, COUNT(DISTINCT answer_hash) as unique_hashes
      FROM (
        SELECT COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id))) as answer_hash
        FROM public.mains_submissions s
        LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
        WHERE s.id NOT LIKE '%_test_%'
      ) sub;
    `);
    const totalWithHash = Number(dupRes.rows[0]?.total_with_hash || 0);
    const uniqueHashes = Number(dupRes.rows[0]?.unique_hashes || 0);
    const duplicateRecordCount = Math.max(0, totalWithHash - uniqueHashes);

    // Release candidate state
    const rcRes = await pool.query(`
      SELECT id, dataset_version, status, overall_status
      FROM public.mains_dataset_release_candidates
      ORDER BY created_at DESC LIMIT 1;
    `);
    const latestRc = rcRes.rows[0];
    const releaseCandidateState = latestRc ? `${latestRc.dataset_version} (${latestRc.status || latestRc.overall_status})` : 'NONE';

    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const snapshotData: DatasetRemediationSnapshot = {
      id: snapshotId,
      snapshotType,
      timestamp,
      uniqueAnswerCount: uniqueAnswers,
      facultyVerifiedCount: facultyVerified,
      uniqueLearnerCount: uniqueLearners,
      subjectCount,
      benchmarkCount,
      leakageRecordCount,
      duplicateRecordCount,
      releaseCandidateState,
      details: {
        rawSubmissions,
        latestReleaseCandidateId: latestRc?.id || null
      }
    };

    // Persist immutable snapshot
    await pool.query(`
      INSERT INTO public.mains_dataset_remediation_snapshots (
        id, snapshot_type, snapshot_data, created_at
      ) VALUES ($1, $2, $3, NOW());
    `, [snapshotId, snapshotType, JSON.stringify(snapshotData)]);

    // Emit event
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(`
      INSERT INTO public.mains_dataset_events (
        id, event_type, submission_id, actor_id, actor_role, metadata, created_at
      ) VALUES ($1, 'REMEDIATION_SNAPSHOT_CAPTURED', 'GLOBAL', $2, 'ADMIN', $3, NOW());
    `, [
      eventId,
      initiatedBy,
      JSON.stringify({ snapshotId, snapshotType, uniqueAnswers, facultyVerified, leakageRecordCount, duplicateRecordCount })
    ]);

    return snapshotData;
  }

  // ------------------------------------------------------------------
  // 2. BENCHMARK LEAKAGE REMEDIATION (SECTION 2)
  // ------------------------------------------------------------------
  async executeLeakageRemediation(initiatedBy: string = 'usr_admin'): Promise<{
    remediatedCount: number;
    records: LeakageRemediationRecord[];
  }> {
    // 1. Identify EXACT records causing benchmark leakage
    // A submission is leaking if it exists in mains_evaluation_benchmark_items AND is marked TRAINING_ELIGIBLE
    const leakageRes = await pool.query(`
      SELECT 
        bi.id as benchmark_item_id,
        bi.benchmark_id,
        bi.submission_id,
        r.id as review_id,
        r.training_eligibility,
        COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id))) as answer_hash,
        s.user_id as learner_id
      FROM public.mains_evaluation_benchmark_items bi
      JOIN public.mains_submissions s ON bi.submission_id = s.id
      JOIN public.mains_evaluation_reviews r ON bi.submission_id = r.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE';
    `);

    const remediatedRecords: LeakageRemediationRecord[] = [];
    const now = new Date().toISOString();

    for (const row of leakageRes.rows) {
      const submissionId = row.submission_id;
      const benchmarkId = row.benchmark_id;
      const benchmarkItemId = row.benchmark_item_id;
      const answerHash = row.answer_hash;
      const learnerId = row.learner_id;
      const previousEligibility = row.training_eligibility;

      // DO NOT delete original submission or mutate historical answer text
      // Mark candidate as EXCLUDED_FROM_TRAINING in review
      await pool.query(`
        UPDATE public.mains_evaluation_reviews
        SET training_eligibility = 'EXCLUDED_FROM_TRAINING',
            exclusion_reason = 'BENCHMARK_CONTAMINATION_ISOLATED: Submission is an active gold-standard locked benchmark item'
        WHERE id = $1;
      `, [row.review_id]);

      // Ensure quarantine record exists for safety audit
      const quarId = `quar_leak_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await pool.query(`
        INSERT INTO public.mains_dataset_quarantine (
          id, submission_id, quarantine_reason, detected_by, previous_eligibility_state, resolution_status, notes, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'QUARANTINED', $6, $7, NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        quarId,
        submissionId,
        'BENCHMARK_LEAKAGE: Candidate answer exists in gold-standard benchmark set',
        initiatedBy,
        previousEligibility,
        `Remediated during Phase 4.1H to enforce training_candidate ∩ benchmark = 0.`,
        JSON.stringify({ benchmarkId, benchmarkItemId, answerHash, learnerId })
      ]);

      // Emit PII-free dataset event
      const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(`
        INSERT INTO public.mains_dataset_events (
          id, event_type, submission_id, actor_id, actor_role, metadata, created_at
        ) VALUES ($1, 'BENCHMARK_LEAKAGE_REMEDIATED', $2, $3, 'ADMIN', $4, NOW());
      `, [
        eventId,
        submissionId,
        initiatedBy,
        JSON.stringify({
          benchmarkId,
          benchmarkItemId,
          answerHash,
          previousEligibility,
          remediatedEligibility: 'EXCLUDED_FROM_TRAINING',
          reason: 'BENCHMARK_CONTAMINATION_ISOLATED'
        })
      ]);

      remediatedRecords.push({
        benchmarkId,
        benchmarkItemId,
        submissionId,
        answerHash,
        learnerId,
        previousEligibility,
        remediationAction: 'QUARANTINED_AND_EXCLUDED',
        reason: 'BENCHMARK_CONTAMINATION_ISOLATED',
        remediatedAt: now
      });
    }

    return {
      remediatedCount: remediatedRecords.length,
      records: remediatedRecords
    };
  }

  // ------------------------------------------------------------------
  // 3. DUPLICATE REMEDIATION (SECTION 3)
  // ------------------------------------------------------------------
  async executeDuplicateRemediation(initiatedBy: string = 'usr_admin'): Promise<{
    duplicateGroupsRemediated: number;
    groups: DuplicateRemediationGroup[];
  }> {
    // 1. Find all duplicate answer-hash groups across real submissions
    const dupGroupsRes = await pool.query(`
      SELECT 
        COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id))) as answer_hash,
        COUNT(s.id) as total_count,
        ARRAY_AGG(s.id ORDER BY s.created_at ASC) as submission_ids,
        ARRAY_AGG(COALESCE(s.user_id, 'usr_anon')) as learner_ids
      FROM public.mains_submissions s
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY COALESCE(r.answer_hash, MD5(COALESCE(s.answer_text, s.id)))
      HAVING COUNT(s.id) > 1;
    `);

    const remediatedGroups: DuplicateRemediationGroup[] = [];
    const now = new Date().toISOString();

    for (const row of dupGroupsRes.rows) {
      const answerHash = row.answer_hash;
      const submissionIds: string[] = row.submission_ids || [];
      const learnerIds: string[] = row.learner_ids || [];

      // Determine canonical submission deterministically:
      // Canonical is the oldest submitted answer (first in submission_ids ordered by s.created_at ASC)
      const canonicalSubmissionId = submissionIds[0];
      const excludedSubmissionIds = submissionIds.slice(1);

      // Fetch review info for canonical
      const cRevRes = await pool.query(`
        SELECT faculty_id, faculty_marks_obtained 
        FROM public.mains_evaluation_reviews 
        WHERE submission_id = $1 LIMIT 1;
      `, [canonicalSubmissionId]);
      const cRev = cRevRes.rows[0];

      // For every duplicate submission (non-canonical), exclude from training candidate set
      if (excludedSubmissionIds.length > 0) {
        await pool.query(`
          UPDATE public.mains_evaluation_reviews
          SET training_eligibility = 'EXCLUDED_FROM_TRAINING',
              exclusion_reason = 'DUPLICATE_ANSWER_HASH_EXCLUDED: Duplicate of canonical submission ' || $1
          WHERE submission_id = ANY($2::text[]);
        `, [canonicalSubmissionId, excludedSubmissionIds]);

        // Emit duplicate remediation event
        const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pool.query(`
          INSERT INTO public.mains_dataset_events (
            id, event_type, submission_id, actor_id, actor_role, metadata, created_at
          ) VALUES ($1, 'DUPLICATE_TRAINING_CANDIDATE_EXCLUDED', $2, $3, 'ADMIN', $4, NOW());
        `, [
          eventId,
          canonicalSubmissionId,
          initiatedBy,
          JSON.stringify({
            answerHash,
            canonicalSubmissionId,
            excludedSubmissionIds,
            reason: 'DUPLICATE_ANSWER_HASH_EXCLUDED'
          })
        ]);
      }

      remediatedGroups.push({
        answerHash,
        totalSubmissions: Number(row.total_count || submissionIds.length),
        canonicalSubmissionId,
        canonicalFacultyId: cRev?.faculty_id,
        canonicalMarks: cRev?.faculty_marks_obtained != null ? Number(cRev.faculty_marks_obtained) : undefined,
        excludedSubmissionIds,
        learnerIds,
        remediationAction: 'EXCLUDED_NON_CANONICAL_DUPLICATES',
        remediatedAt: now
      });
    }

    return {
      duplicateGroupsRemediated: remediatedGroups.length,
      groups: remediatedGroups
    };
  }

  // ------------------------------------------------------------------
  // 4. EXECUTE FULL REMEDIATION PIPELINE
  // ------------------------------------------------------------------
  async executeFullRemediation(initiatedBy: string = 'usr_admin'): Promise<{
    preSnapshot: DatasetRemediationSnapshot;
    leakageResult: { remediatedCount: number; records: LeakageRemediationRecord[] };
    duplicateResult: { duplicateGroupsRemediated: number; groups: DuplicateRemediationGroup[] };
    postSnapshot: DatasetRemediationSnapshot;
    auditResult: any;
  }> {
    // 1. Pre-remediation snapshot
    const preSnapshot = await this.createForensicSnapshot('PRE_REMEDIATION', initiatedBy);

    // 2. Leakage remediation
    const leakageResult = await this.executeLeakageRemediation(initiatedBy);

    // 3. Duplicate remediation
    const duplicateResult = await this.executeDuplicateRemediation(initiatedBy);

    // 4. Post-remediation snapshot
    const postSnapshot = await this.createForensicSnapshot('POST_REMEDIATION', initiatedBy);

    // 5. Re-run Training Readiness Audit
    const auditResult = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit(initiatedBy);

    return {
      preSnapshot,
      leakageResult,
      duplicateResult,
      postSnapshot,
      auditResult
    };
  }

  // ------------------------------------------------------------------
  // 5. GET REMEDIATION OVERVIEW (API ENDPOINT PAYLOAD)
  // ------------------------------------------------------------------
  async getRemediationOverview(): Promise<DatasetRemediationOverview> {
    // 1. Execute live audit to get ground-truth status
    const audit = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit('OVERVIEW_LOAD');

    // 2. Fetch recent remediation events
    const leakEventsRes = await pool.query(`
      SELECT metadata, created_at 
      FROM public.mains_dataset_events 
      WHERE event_type = 'BENCHMARK_LEAKAGE_REMEDIATED'
      ORDER BY created_at DESC LIMIT 10;
    `);
    const leakageRecords: LeakageRemediationRecord[] = leakEventsRes.rows.map(r => ({
      benchmarkId: r.metadata?.benchmarkId || 'N/A',
      benchmarkItemId: r.metadata?.benchmarkItemId || 'N/A',
      submissionId: r.metadata?.submissionId || 'N/A',
      answerHash: r.metadata?.answerHash || 'N/A',
      learnerId: r.metadata?.learnerId || 'anonymized',
      previousEligibility: r.metadata?.previousEligibility || 'TRAINING_ELIGIBLE',
      remediationAction: 'QUARANTINED_AND_EXCLUDED',
      reason: r.metadata?.reason || 'BENCHMARK_CONTAMINATION_ISOLATED',
      remediatedAt: r.created_at
    }));

    const dupEventsRes = await pool.query(`
      SELECT metadata, created_at 
      FROM public.mains_dataset_events 
      WHERE event_type = 'DUPLICATE_TRAINING_CANDIDATE_EXCLUDED'
      ORDER BY created_at DESC LIMIT 10;
    `);
    const duplicateGroups: DuplicateRemediationGroup[] = dupEventsRes.rows.map(r => ({
      answerHash: r.metadata?.answerHash || 'N/A',
      totalSubmissions: (r.metadata?.excludedSubmissionIds?.length || 0) + 1,
      canonicalSubmissionId: r.metadata?.canonicalSubmissionId || 'N/A',
      excludedSubmissionIds: r.metadata?.excludedSubmissionIds || [],
      learnerIds: [],
      remediationAction: 'EXCLUDED_NON_CANONICAL_DUPLICATES',
      remediatedAt: r.created_at
    }));

    // 3. Faculty workload & concentration check
    const facRes = await pool.query(`
      SELECT 
        faculty_id,
        COUNT(*) as count
      FROM public.mains_evaluation_reviews
      WHERE workflow_status = 'COMPLETED' AND submission_id NOT LIKE '%_test_%'
      GROUP BY faculty_id
      ORDER BY count DESC;
    `);
    const totalFacultyReviews = facRes.rows.reduce((sum, r) => sum + Number(r.count), 0);
    const facultyEvaluators = facRes.rows.map(r => {
      const c = Number(r.count);
      const share = totalFacultyReviews > 0 ? Number(((c / totalFacultyReviews) * 100).toFixed(1)) : 0;
      return {
        facultyId: r.faculty_id,
        reviewsCount: c,
        percentageShare: share,
        isConcentrated: share > 40.0
      };
    });
    const facultyConcentrationWarning = facultyEvaluators.some(f => f.isConcentrated);

    // 4. Learner diversity & concentration check
    const learnerRes = await pool.query(`
      SELECT 
        s.user_id,
        COUNT(s.id) as count
      FROM public.mains_submissions s
      WHERE s.id NOT LIKE '%_test_%'
      GROUP BY s.user_id
      ORDER BY count DESC;
    `);
    const totalLearnerSubmissions = learnerRes.rows.reduce((sum, r) => sum + Number(r.count), 0);
    const maxLearnerSubmissions = Number(learnerRes.rows[0]?.count || 0);
    const maxSingleSharePct = totalLearnerSubmissions > 0
      ? Number(((maxLearnerSubmissions / totalLearnerSubmissions) * 100).toFixed(1))
      : 0;
    const learnerConcentrationWarning = maxSingleSharePct > 35.0;

    // 5. Targeted syllabus tracks (Section 7)
    const targetedTracks = await this.getTargetedSyllabusTracks();

    // 6. Next acquisition priorities (Section 6)
    const nextPriorities = this.buildAcquisitionPriorities(audit, targetedTracks);

    // 7. Coverage deficit mapping
    const coverageGaps = {
      papers: {} as Record<string, { count: number; verified: number; eligible: number; deficit: number }>,
      subjects: {} as Record<string, { count: number; verified: number; eligible: number; deficit: number }>,
      directives: {} as Record<string, { count: number; verified: number; eligible: number; isUnderrepresented: boolean }>,
      marks: {} as Record<string, { count: number; verified: number; eligible: number; isOverConcentrated: boolean }>,
      tiers: {} as Record<string, { count: number; verified: number; eligible: number }>,
      formats: audit.coverage.formats
    };

    for (const [p, data] of Object.entries(audit.coverage.papers)) {
      coverageGaps.papers[p] = {
        count: data.count,
        verified: data.facultyVerified,
        eligible: data.eligible,
        deficit: Math.max(0, 30 - data.eligible)
      };
    }

    for (const [s, data] of Object.entries(audit.coverage.subjects)) {
      coverageGaps.subjects[s] = {
        count: data.count,
        verified: data.facultyVerified,
        eligible: data.eligible,
        deficit: Math.max(0, 25 - data.eligible)
      };
    }

    for (const [d, data] of Object.entries(audit.coverage.directives)) {
      coverageGaps.directives[d] = {
        count: data.count,
        verified: data.facultyVerified,
        eligible: data.eligible,
        isUnderrepresented: data.isUnderrepresented
      };
    }

    for (const [m, data] of Object.entries(audit.coverage.marks)) {
      coverageGaps.marks[m] = {
        count: data.count,
        verified: data.facultyVerified,
        eligible: data.eligible,
        isOverConcentrated: data.percentage > 70.0
      };
    }

    for (const [t, data] of Object.entries(audit.coverage.tiers)) {
      coverageGaps.tiers[t] = {
        count: data.count,
        verified: data.uniqueAnswers,
        eligible: data.eligible
      };
    }

    const remediationOverview: DatasetRemediationOverview = {
      status: audit.status,
      remediationExecuted: leakageRecords.length > 0 || duplicateGroups.length > 0,
      remediationSummary: audit.status === 'TRAINING_READY'
        ? 'All remediation gates passed and targets achieved. Certified ready for training export.'
        : `Remediation active. Real dataset requires acquisition of ${audit.training.configuredThresholds.minimumUniqueAnswers - audit.dataset.eligibleUniqueAnswers} unique answers and ${audit.training.configuredThresholds.minimumVerifiedReviews - audit.dataset.facultyVerified} verified reviews. Zero synthetic data permitted.`,
      targets: {
        minimumVerifiedReviews: audit.training.configuredThresholds.minimumVerifiedReviews,
        minimumUniqueAnswers: audit.training.configuredThresholds.minimumUniqueAnswers,
        minimumSubjects: audit.training.configuredThresholds.minimumSubjects,
        minimumBenchmarkItems: audit.training.configuredThresholds.minimumBenchmarkItems
      },
      current: {
        rawSubmissions: audit.dataset.totalSubmissions,
        uniqueAnswers: audit.dataset.uniqueAnswers,
        facultyVerified: audit.dataset.facultyVerified,
        eligibleUniqueAnswers: audit.dataset.eligibleUniqueAnswers,
        uniqueLearners: audit.dataset.uniqueLearners,
        subjectsCount: Object.keys(audit.coverage.subjects).length,
        duplicateCollisions: audit.duplicates.hashCollisions || 0,
        benchmarkLeakageCount: audit.benchmark.leakageCount
      },
      blockers: audit.blockingReasons,
      coverageGaps,
      leakage: leakageRecords,
      duplicates: duplicateGroups,
      benchmark: {
        totalItems: audit.benchmark.items,
        requiredItems: audit.training.configuredThresholds.minimumBenchmarkItems,
        deficit: Math.max(0, audit.training.configuredThresholds.minimumBenchmarkItems - audit.benchmark.items),
        isolationVerified: audit.benchmark.isolated,
        leakageCount: audit.benchmark.leakageCount
      },
      facultyWorkload: {
        evaluatorCount: facultyEvaluators.length,
        evaluators: facultyEvaluators,
        concentrationWarning: facultyConcentrationWarning
      },
      learnerDiversity: {
        uniqueLearners: learnerRes.rows.length,
        maxSingleSharePct,
        concentrationWarning: learnerConcentrationWarning
      },
      nextPriorities,
      targetedTracks
    };

    return remediationOverview;
  }

  // ------------------------------------------------------------------
  // 6. TARGETED SYLLABUS HUB (SECTION 7)
  // ------------------------------------------------------------------
  async getTargetedSyllabusTracks(): Promise<TargetedSyllabusTrack[]> {
    const canonicalTracks = [
      { trackId: 'track_gs1_history_society', paper: 'GS1', subject: 'History & Indian Society', title: 'GS1 — History, Heritage & Society', desc: 'Ancient, Medieval, Modern History, Art & Culture, and Social Issues.' },
      { trackId: 'track_gs2_polity_governance', paper: 'GS2', subject: 'Polity & Governance', title: 'GS2 — Polity, Governance & IR', desc: 'Constitution, Executive, Judiciary, Federalism, Social Justice, and International Relations.' },
      { trackId: 'track_gs3_economy_infrastructure', paper: 'GS3', subject: 'Economy & Infrastructure', title: 'GS3 — Economy, Agriculture & S&T', desc: 'Inclusive Growth, Budgeting, Agriculture, Environment, Disaster Management, and Security.' },
      { trackId: 'track_gs4_ethics_case_studies', paper: 'GS4', subject: 'Ethics & Integrity', title: 'GS4 — Ethics, Integrity & Case Studies', desc: 'Foundational values, ethical dilemmas, public service integrity, and complex case studies.' },
      { trackId: 'track_essay_philosophical', paper: 'Essay', subject: 'Philosophical & Thematic', title: 'Essay — Philosophical & Thematic Prompts', desc: 'Abstract, philosophical, and multidimensional socio-economic themes.' },
      { trackId: 'track_optional_disciplines', paper: 'Optional', subject: 'Optional Disciplines', title: 'Optional Papers — Discipline Deep-Dive', desc: 'Specialized Mains questions across selected optional subjects.' }
    ];

    const tracks: TargetedSyllabusTrack[] = [];

    for (const ct of canonicalTracks) {
      // Query questions in DB for this track
      const qRes = await pool.query(`
        SELECT 
          COUNT(q.id) as available_questions,
          COUNT(CASE WHEN s.id IS NULL THEN 1 END) as unanswered_questions,
          COUNT(CASE WHEN s.id IS NOT NULL AND (r.id IS NULL OR r.workflow_status != 'COMPLETED') THEN 1 END) as pending_faculty_reviews,
          COUNT(CASE WHEN r.workflow_status = 'COMPLETED' THEN 1 END) as faculty_reviewed_count,
          COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as training_eligible_count
        FROM public.questions q
        LEFT JOIN public.mains_submissions s ON q.id = s.question_id AND s.id NOT LIKE '%_test_%'
        LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
        WHERE q.stage = 'MAINS' AND q.paper ILIKE $1;
      `, [`%${ct.paper}%`]);

      const qRow = qRes.rows[0] || {};
      const available = Number(qRow.available_questions || 0);
      const unanswered = Number(qRow.unanswered_questions || 0);
      const pending = Number(qRow.pending_faculty_reviews || 0);
      const reviewed = Number(qRow.faculty_reviewed_count || 0);
      const eligible = Number(qRow.training_eligible_count || 0);
      const targetPerTrack = 35;
      const deficit = Math.max(0, targetPerTrack - eligible);
      const priorityScore = (deficit * 3) + (unanswered > 0 ? 10 : 0) + (reviewed === 0 ? 20 : 0);

      // Fetch recommended next question
      const nextQRes = await pool.query(`
        SELECT q.id, q.question, q.marks, COALESCE(q.source_type, 'CANONICAL_UPSC') as source_type
        FROM public.questions q
        LEFT JOIN public.mains_submissions s ON q.id = s.question_id AND s.id NOT LIKE '%_test_%'
        WHERE q.stage = 'MAINS' AND q.paper ILIKE $1
        ORDER BY s.id NULLS FIRST, q.created_at DESC
        LIMIT 1;
      `, [`%${ct.paper}%`]);
      const nextQ = nextQRes.rows[0];

      const directive = nextQ ? this.extractDirective(nextQ.question) : 'Discuss';
      const sourceOrigin: 'CANONICAL_UPSC' | 'IKSHOVIA_CREATED' =
        nextQ?.source_type === 'IKSHOVIA_CREATED' ? 'IKSHOVIA_CREATED' : 'CANONICAL_UPSC';

      tracks.push({
        trackId: ct.trackId,
        paper: ct.paper,
        subject: ct.subject,
        title: ct.title,
        description: ct.desc,
        availableQuestions: available,
        unansweredQuestions: unanswered,
        pendingFacultyReviews: pending,
        facultyReviewedCount: reviewed,
        trainingEligibleCount: eligible,
        coverageDeficit: deficit,
        priorityScore,
        recommendedNextQuestion: nextQ ? {
          id: nextQ.id,
          question: nextQ.question,
          directive,
          marks: Number(nextQ.marks || 10),
          sourceOrigin
        } : undefined
      });
    }

    return tracks;
  }

  // ------------------------------------------------------------------
  // 7. BUILD DETERMINISTIC ACQUISITION PRIORITIES (SECTION 6)
  // ------------------------------------------------------------------
  private buildAcquisitionPriorities(audit: any, tracks: TargetedSyllabusTrack[]): any[] {
    const priorities: any[] = [];
    let rank = 1;

    // 1. Tracks with zero verified reviews have maximum priority
    for (const t of tracks) {
      if (t.facultyReviewedCount === 0) {
        priorities.push({
          rank: rank++,
          paper: t.paper,
          subject: t.subject,
          directive: t.recommendedNextQuestion?.directive || 'Discuss',
          marks: t.recommendedNextQuestion?.marks || 10,
          deficitReason: `Zero faculty-reviewed answers exist in ${t.paper}. High-priority syllabus blind spot.`,
          priorityScore: 100 - rank,
          recommendedQuestion: t.recommendedNextQuestion
        });
      }
    }

    // 2. Directives with underrepresentation (<5 items)
    for (const [directive, dData] of Object.entries(audit.coverage.directives as Record<string, any>)) {
      if (dData.isUnderrepresented && dData.count === 0) {
        priorities.push({
          rank: rank++,
          paper: 'GS2/GS3',
          subject: 'Core Governance / Economy',
          directive,
          marks: 15,
          deficitReason: `Directive '${directive}' has 0 samples across entire dataset.`,
          priorityScore: 80 - rank
        });
      }
    }

    // 3. Performance tiers deficit
    for (const [tier, tData] of Object.entries(audit.coverage.tiers as Record<string, any>)) {
      if (tData.eligible === 0) {
        priorities.push({
          rank: rank++,
          paper: 'All Papers',
          subject: 'Syllabus Calibration',
          directive: 'Any',
          marks: 10,
          deficitReason: `Performance tier ${tier} has 0 training-eligible answers. Tier balance required for model grounding.`,
          priorityScore: 70 - rank
        });
      }
    }

    return priorities.slice(0, 10);
  }

  private extractDirective(questionText: string): string {
    const qLower = (questionText || '').toLowerCase();
    const directives = [
      'critically analyze', 'critically examine', 'analyze', 'examine',
      'evaluate', 'discuss', 'elucidate', 'explain', 'comment',
      'illustrate', 'compare', 'justify', 'assess'
    ];
    for (const d of directives) {
      if (qLower.includes(d)) {
        return d.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return 'Discuss';
  }
}

export const mainsDatasetRemediationService = new MainsDatasetRemediationService();

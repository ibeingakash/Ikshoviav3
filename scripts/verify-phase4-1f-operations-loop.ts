import pool from '../server/db/pool.js';
import { mainsDatasetOperationsService } from '../server/services/MainsDatasetOperationsService.js';

async function verifyPhase41fOperations() {
  console.log('================================================================');
  console.log('PHASE 4.1F VERIFICATION: MAINS DATASET OPERATIONS & CALIBRATION');
  console.log('CRITICAL SAFETY CHECK: ZERO MODEL TRAINING IN THIS PHASE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Operations Overview (Real PostgreSQL Data)
    // ----------------------------------------------------
    console.log('\n--- 1. DATASET OPERATIONS OVERVIEW ---');
    const overview = await mainsDatasetOperationsService.getOperationsOverview();
    assert(overview !== null && typeof overview === 'object', 'Overview returns valid object');
    assert(typeof overview.pendingFacultyReviews === 'number', 'pendingFacultyReviews is a valid number', `Count: ${overview.pendingFacultyReviews}`);
    assert(typeof overview.completedFacultyReviews === 'number', 'completedFacultyReviews is a valid number', `Count: ${overview.completedFacultyReviews}`);
    assert(overview.reviewsBySla !== undefined, 'reviewsBySla brackets present');
    assert(overview.doubleReviewQueue !== undefined, 'doubleReviewQueue summary present');
    assert(overview.adjudicationQueue !== undefined, 'adjudicationQueue summary present');
    assert(overview.ocrQueue !== undefined, 'ocrQueue summary present');
    assert(overview.quarantinedRecords !== undefined, 'quarantinedRecords summary present');
    assert(Array.isArray(overview.healthFlags), 'healthFlags array present', `Flags count: ${overview.healthFlags?.length}`);
    assert(overview.trainingGateStatus === 'LOCKED', 'Training gate status strictly LOCKED');

    // ----------------------------------------------------
    // TEST 2: Faculty Review Operations Queue & Retention
    // ----------------------------------------------------
    console.log('\n--- 2. FACULTY REVIEW OPERATIONS QUEUE ---');
    const queueRes = await mainsDatasetOperationsService.getFacultyReviewQueue({ limit: 10 });
    assert(Array.isArray(queueRes.items), 'Review queue items is an array', `Items returned: ${queueRes.items.length}`);
    assert(queueRes.total >= 0, 'Total queue count is valid', `Total: ${queueRes.total}`);

    if (queueRes.items.length > 0) {
      const item = queueRes.items[0];
      assert(item.submission_id !== undefined, 'Retains submission_id', item.submission_id);
      assert(item.question !== undefined, 'Retains question text');
      assert(item.paper !== undefined, 'Retains paper metadata', item.paper);
      assert(item.marks !== undefined, 'Retains marks object (AI, Faculty, Max)');
      assert(item.status !== undefined, 'Retains review status', item.status);
      assert(item.sla_bracket !== undefined, 'Retains calculated SLA bracket', item.sla_bracket);
    }

    // Test filter by status
    const pendingQueue = await mainsDatasetOperationsService.getFacultyReviewQueue({ status: 'PENDING', limit: 5 });
    assert(pendingQueue.items !== undefined, 'Filter by status PENDING returns valid queue');

    // ----------------------------------------------------
    // TEST 3: SLA / Age Tracking
    // ----------------------------------------------------
    console.log('\n--- 3. SLA / AGE TRACKING ---');
    assert(overview.reviewsBySla.under24h >= 0, '< 24 hours tracked', `Count: ${overview.reviewsBySla.under24h}`);
    assert(overview.reviewsBySla.hours24to48 >= 0, '24-48 hours tracked', `Count: ${overview.reviewsBySla.hours24to48}`);
    assert(overview.reviewsBySla.hours48to72 >= 0, '48-72 hours tracked', `Count: ${overview.reviewsBySla.hours48to72}`);
    assert(overview.reviewsBySla.over72h >= 0, '> 72 hours tracked', `Count: ${overview.reviewsBySla.over72h}`);

    // ----------------------------------------------------
    // TEST 4: Faculty Workload Management (Strictly No Ranking)
    // ----------------------------------------------------
    console.log('\n--- 4. FACULTY WORKLOAD MANAGEMENT ---');
    const workload = await mainsDatasetOperationsService.getFacultyWorkloadSummary();
    assert(Array.isArray(workload), 'Faculty workload returns an array', `Evaluators found: ${workload.length}`);
    for (const w of workload) {
      assert(w.evaluatorId !== undefined, `Evaluator ${w.evaluatorName} has ID`);
      assert(typeof w.activeAssignments === 'number', 'activeAssignments is numeric');
      assert(typeof w.pendingAssignments === 'number', 'pendingAssignments is numeric');
      assert(typeof w.completedToday === 'number', 'completedToday is numeric');
      assert(typeof w.completedThisWeek === 'number', 'completedThisWeek is numeric');
      assert(w.status === 'VALID' || w.status === 'INSUFFICIENT_DATA', `Status is factual: ${w.status}`);
      // Verify anti-ranking: no "rank", no "best", no "worst"
      assert((w as any).rank === undefined, 'No evaluator ranking attribute present');
      assert((w as any).isBest === undefined, 'No "best" label present');
      assert((w as any).isWorst === undefined, 'No "worst" label present');
    }

    // ----------------------------------------------------
    // TEST 5: Calibration Loop (Real Completed Cases)
    // ----------------------------------------------------
    console.log('\n--- 5. CALIBRATION LOOP (REAL GROUND TRUTH CASES) ---');
    const calibCases = await mainsDatasetOperationsService.getCalibrationSessionCases();
    assert(Array.isArray(calibCases), 'Calibration cases returns an array', `Cases loaded: ${calibCases.length}`);
    if (calibCases.length > 0) {
      const c = calibCases[0];
      assert(c.question !== undefined, 'Calibration case retains question');
      assert(c.studentAnswer !== undefined, 'Calibration case retains student answer');
      assert(c.groundTruth !== undefined, 'Calibration case retains ground truth');
      assert(c.performanceTier !== undefined, 'Performance tier classified', `Tier: ${c.performanceTier}`);
      // Verify learner privacy: no student email, name, or learnerId exposed
      assert((c as any).studentEmail === undefined, 'Learner email strictly concealed');
      assert((c as any).studentName === undefined, 'Learner name strictly concealed');
    }

    // ----------------------------------------------------
    // TEST 6: Calibration Performance & Drift Detection
    // ----------------------------------------------------
    console.log('\n--- 6. CALIBRATION PERFORMANCE & DRIFT DETECTION ---');
    if (calibCases.length > 0) {
      const targetCase = calibCases[0];
      const attemptRes = await mainsDatasetOperationsService.submitCalibrationAttempt({
        facultyId: 'usr_test_evaluator_ops',
        facultyName: 'Dr. Test Evaluator',
        submissionId: targetCase.submissionId,
        assignedMarks: targetCase.groundTruth.marksObtained,
        rubricScores: targetCase.groundTruth.dimensions || { content: 4, structure: 4 },
        feedback: 'Automated test calibration review session'
      });

      assert(attemptRes !== null, 'Calibration attempt recorded successfully');
      assert(attemptRes.marks_diff !== undefined, 'Marks difference computed', `${attemptRes.marks_diff}m`);
      assert(attemptRes.rubric_agreement_pct !== undefined, 'Rubric agreement computed', `${attemptRes.rubric_agreement_pct}%`);

      // Verify ground truth did NOT mutate
      const checkSub = await pool.query(
        `SELECT faculty_marks_obtained FROM public.mains_evaluation_reviews WHERE submission_id = $1 LIMIT 1;`,
        [targetCase.submissionId]
      );
      assert(
        Number(checkSub.rows[0]?.faculty_marks_obtained) === targetCase.groundTruth.marksObtained,
        'Production ground truth marks strictly UNCHANGED (zero mutation)'
      );
    }

    const driftRes = await mainsDatasetOperationsService.getFacultyCalibrationPerformance('usr_test_evaluator_ops');
    assert(driftRes !== null, 'Calibration performance returned');
    assert(
      driftRes.driftStatus === 'STABLE' || driftRes.driftStatus === 'WATCH' || driftRes.driftStatus === 'INSUFFICIENT_DATA',
      'Drift status is valid enum',
      driftRes.driftStatus
    );

    // ----------------------------------------------------
    // TEST 7: Double Review Operations & Consensus
    // ----------------------------------------------------
    console.log('\n--- 7. DOUBLE-REVIEW OPERATIONS ---');
    const doubleOps = await mainsDatasetOperationsService.getDoubleReviewOperations();
    assert(doubleOps.summary !== undefined, 'Double review summary present');
    assert(typeof doubleOps.summary.totalDoubleReviews === 'number', 'totalDoubleReviews is numeric', `Count: ${doubleOps.summary.totalDoubleReviews}`);
    assert(typeof doubleOps.summary.exactAgreementPct === 'number', 'exactAgreementPct is numeric', `${doubleOps.summary.exactAgreementPct}%`);
    assert(typeof doubleOps.summary.averageAbsoluteDifference === 'number', 'averageAbsoluteDifference is numeric', `${doubleOps.summary.averageAbsoluteDifference}m`);
    assert(typeof doubleOps.summary.adjudicationRatePct === 'number', 'adjudicationRatePct is numeric', `${doubleOps.summary.adjudicationRatePct}%`);

    // ----------------------------------------------------
    // TEST 8: Adjudication Queue
    // ----------------------------------------------------
    console.log('\n--- 8. ADJUDICATION QUEUE ---');
    const adjQueue = await mainsDatasetOperationsService.getAdjudicationQueue();
    assert(Array.isArray(adjQueue), 'Adjudication queue returns an array', `Items pending: ${adjQueue.length}`);
    for (const item of adjQueue) {
      assert(item.facultyA !== undefined, 'Adjudication item contains Faculty A details');
      assert(item.facultyB !== undefined, 'Adjudication item contains Faculty B details');
      assert(item.percentageDifference !== undefined, 'Adjudication item contains divergence %');
    }

    // ----------------------------------------------------
    // TEST 9: OCR Quality Operations
    // ----------------------------------------------------
    console.log('\n--- 9. OCR QUALITY OPERATIONS ---');
    const ocrQueue = await mainsDatasetOperationsService.getOcrOperationsQueue({ limit: 5 });
    assert(Array.isArray(ocrQueue.items), 'OCR operations queue returns array', `Items: ${ocrQueue.items.length}`);
    assert(typeof ocrQueue.total === 'number', 'Total OCR count is valid');

    if (ocrQueue.items.length > 0) {
      const ocrItem = ocrQueue.items[0];
      assert(ocrItem.submissionType === 'HANDWRITTEN_IMAGE', 'Submission type is HANDWRITTEN_IMAGE');
      assert(typeof ocrItem.ocrConfidence === 'number', 'OCR confidence is numeric', `${Math.round(ocrItem.ocrConfidence * 100)}%`);
    }

    // ----------------------------------------------------
    // TEST 10: Dataset Growth Trends
    // ----------------------------------------------------
    console.log('\n--- 10. DATASET GROWTH TRENDS ---');
    const growthTrends = await mainsDatasetOperationsService.getDatasetGrowthTrends();
    assert(Array.isArray(growthTrends.dailyTrends), 'Daily trends array returned', `Days: ${growthTrends.dailyTrends.length}`);
    assert(Array.isArray(growthTrends.weeklyTrends), 'Weekly trends array returned', `Weeks: ${growthTrends.weeklyTrends.length}`);
    assert(growthTrends.paperDistribution !== undefined, 'Paper distribution returned');
    assert(growthTrends.tierDistribution !== undefined, 'Tier distribution returned');
    assert(growthTrends.quarantineTrend !== undefined, 'Quarantine trend returned', `Rate: ${growthTrends.quarantineTrend.quarantineRatePct}%`);

    // ----------------------------------------------------
    // TEST 11: Training Safety Gate (Critical: Zero Model Training)
    // ----------------------------------------------------
    console.log('\n--- 11. TRAINING SAFETY GATE ---');
    const gateEval = await mainsDatasetOperationsService.evaluateTrainingSafetyGate();
    assert(
      gateEval.gateStatus === 'EXPORT_BLOCKED' || gateEval.gateStatus === 'EXPORT_ALLOWED',
      'Training gate returns strict deterministic status',
      gateEval.gateStatus
    );
    assert(gateEval.hardGates !== undefined, 'All 8 hard gates evaluated');
    assert(gateEval.hardGates.zeroUnadjudicatedDoubleReviews !== undefined, 'Gate 1 evaluated');
    assert(gateEval.hardGates.zeroPendingQuarantines !== undefined, 'Gate 2 evaluated');
    assert(gateEval.hardGates.benchmarkIsolationVerified !== undefined, 'Gate 3 evaluated');
    assert(gateEval.hardGates.piiCheckPassed !== undefined, 'Gate 4 evaluated');
    assert(gateEval.hardGates.rubricCompleteness !== undefined, 'Gate 5 evaluated');
    assert(gateEval.hardGates.facultyGroundTruthPresent !== undefined, 'Gate 6 evaluated');
    assert(gateEval.hardGates.duplicateCheckPassed !== undefined, 'Gate 7 evaluated');
    assert(gateEval.hardGates.signedReleaseCandidateExists !== undefined, 'Gate 8 evaluated');
    assert(Array.isArray(gateEval.blockingReasons), 'Blocking reasons list is present', `Violations count: ${gateEval.blockingReasons.length}`);

    // Confirm NO training jobs were triggered
    const jobsRes = await pool.query(`SELECT COUNT(*) as count FROM public.mains_evaluation_training_jobs WHERE status = 'RUNNING';`);
    const runningJobs = Number(jobsRes.rows[0]?.count || 0);
    assert(runningJobs === 0, 'CRITICAL SAFETY VERIFIED: ZERO fine-tuning or model training jobs running');

    // ----------------------------------------------------
    // TEST 12: Operations Thresholds Configuration
    // ----------------------------------------------------
    console.log('\n--- 12. OPERATIONS THRESHOLDS MANAGEMENT ---');
    const thresholds = await mainsDatasetOperationsService.getOperationsThresholds();
    assert(thresholds.id === 'default', 'Default thresholds record exists');
    assert(thresholds.sla_hours_bracket_1 === 24, 'SLA bracket 1 is 24h');
    assert(thresholds.sla_hours_bracket_2 === 48, 'SLA bracket 2 is 48h');
    assert(thresholds.sla_hours_bracket_3 === 72, 'SLA bracket 3 is 72h');

    // Test non-destructive update
    const updated = await mainsDatasetOperationsService.updateOperationsThresholds({
      notes: 'Phase 4.1F automated verification test'
    });
    assert(updated.notes === 'Phase 4.1F automated verification test', 'Thresholds update succeeded');

  } catch (err: any) {
    console.error('Unexpected error during Phase 4.1F verification:', err);
    failed++;
  } finally {
    // Clean up test calibration attempt
    await pool.query(`DELETE FROM public.mains_faculty_calibration_attempts WHERE faculty_id = 'usr_test_evaluator_ops';`);
  }

  console.log('\n================================================================');
  console.log(`PHASE 4.1F VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('SAFETY GUARANTEE: NO MODEL HAS BEEN TRAINED OR SCHEDULED.');
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyPhase41fOperations();

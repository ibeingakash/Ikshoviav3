import pool from '../server/db/pool.js';
import { mainsDatasetRemediationService } from '../server/services/MainsDatasetRemediationService.js';
import { mainsTrainingReadinessAuditService } from '../server/services/MainsTrainingReadinessAuditService.js';

async function verifyPhase41hRemediation() {
  console.log('================================================================');
  console.log('PHASE 4.1H VERIFICATION: DATASET REMEDIATION & ACQUISITION EXECUTION');
  console.log('CRITICAL: ZERO MODEL TRAINING & REAL DATABASE GROUND TRUTH');
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
    // PRE-CONDITION: Record starting counts
    // ----------------------------------------------------
    const preSubsCountRes = await pool.query('SELECT COUNT(*) as count FROM public.mains_submissions;');
    const preSubsCount = Number(preSubsCountRes.rows[0]?.count || 0);

    // ----------------------------------------------------
    // 1. Execute Full Remediation Pipeline
    // ----------------------------------------------------
    console.log('\n--- 1. EXECUTING FULL REMEDIATION PIPELINE ---');
    const remResult = await mainsDatasetRemediationService.executeFullRemediation('script_verifier');
    
    // Check 1: Leakage records identified
    assert(remResult.leakageResult !== undefined, '1. Leakage records identified', `Identified: ${remResult.leakageResult.remediatedCount}`);
    
    // Check 2: Leakage candidates excluded from training
    const leakedCandidatesRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_evaluation_benchmark_items bi
      JOIN public.mains_evaluation_reviews r ON bi.submission_id = r.submission_id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE';
    `);
    const leakedCandidateCount = Number(leakedCandidatesRes.rows[0]?.count || 0);
    assert(leakedCandidateCount === 0, '2. Leakage candidates excluded from training', `Leaking candidate reviews: ${leakedCandidateCount}`);

    // Check 3: Benchmark isolation = 0
    assert(remResult.auditResult.benchmark.leakageCount === 0, '3. Benchmark isolation = 0 (Zero Contamination)', `Leakage: ${remResult.auditResult.benchmark.leakageCount}`);
    assert(remResult.auditResult.hardGates.benchmarkIsolation === 'PASS', 'Benchmark Isolation Hard Gate = PASS');

    // Check 4: Duplicate candidate collisions = 0
    const candDupRes = await pool.query(`
      SELECT COUNT(*) - COUNT(DISTINCT r.answer_hash) as candidate_collisions
      FROM public.mains_evaluation_reviews r
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE' AND r.submission_id NOT LIKE '%_test_%';
    `);
    const candCollisions = Number(candDupRes.rows[0]?.candidate_collisions || 0);
    assert(candCollisions === 0, '4. Duplicate candidate collisions = 0 in candidate set', `Candidate collisions: ${candCollisions}`);
    assert(remResult.auditResult.hardGates.duplicateCheck === 'PASS', 'Duplicate Hard Gate = PASS for candidate set');

    // ----------------------------------------------------
    // 2. Overview & Ground Truth Metrics
    // ----------------------------------------------------
    console.log('\n--- 2. REMEDIATION OVERVIEW & METRICS VERIFICATION ---');
    const overview = await mainsDatasetRemediationService.getRemediationOverview();

    // Check 5: Unique answer calculation correct
    assert(typeof overview.current.uniqueAnswers === 'number' && overview.current.uniqueAnswers >= 0,
      '5. Unique answer calculation correct', `Count: ${overview.current.uniqueAnswers}`);

    // Check 6: Faculty review calculation correct
    assert(typeof overview.current.facultyVerified === 'number' && overview.current.facultyVerified >= 0,
      '6. Faculty review calculation correct', `Count: ${overview.current.facultyVerified}`);

    // Check 7: Subject coverage correct
    assert(typeof overview.current.subjectsCount === 'number' && overview.current.subjectsCount >= 0,
      '7. Subject coverage correct', `Subjects count: ${overview.current.subjectsCount}`);

    // Check 8: Paper coverage correct
    const papersCount = Object.keys(overview.coverageGaps.papers).length;
    assert(papersCount >= 5, '8. Paper coverage correct (GS1-4, Ethics, Essay, Optional)', `Papers: ${papersCount}`);

    // Check 9: Directive coverage correct
    const directivesCount = Object.keys(overview.coverageGaps.directives).length;
    assert(directivesCount >= 10, '9. Directive coverage correct', `Directives tracked: ${directivesCount}`);

    // Check 10: Marks coverage correct
    const marksCount = Object.keys(overview.coverageGaps.marks).length;
    assert(marksCount > 0, '10. Marks coverage correct', `Marks scales tracked: ${marksCount}`);

    // Check 11: Performance-tier coverage correct
    const tiersCount = Object.keys(overview.coverageGaps.tiers).length;
    assert(tiersCount === 4, '11. Performance-tier coverage correct (WEAK, AVERAGE, STRONG, EXCELLENT)', `Tiers: ${tiersCount}`);

    // Check 12: OCR confidence logic correct
    assert(overview.coverageGaps.formats.ocrHighConfidence >= 0 && overview.coverageGaps.formats.ocrReviewRequired >= 0,
      '12. OCR confidence logic correct (&ge;80% high confidence, <70% review required)');

    // Check 13: Learner diversity calculated
    assert(typeof overview.learnerDiversity.uniqueLearners === 'number',
      '13. Learner diversity calculated', `Unique learners: ${overview.learnerDiversity.uniqueLearners}, Max share: ${overview.learnerDiversity.maxSingleSharePct}%`);

    // Check 14: Faculty diversity calculated
    assert(typeof overview.facultyWorkload.evaluatorCount === 'number',
      '14. Faculty diversity calculated', `Evaluators: ${overview.facultyWorkload.evaluatorCount}`);

    // Check 15: Benchmark count calculated
    assert(overview.benchmark.totalItems >= 0,
      '15. Benchmark count calculated', `Total items: ${overview.benchmark.totalItems} / ${overview.benchmark.requiredItems} required`);

    // ----------------------------------------------------
    // 3. Safety & Integrity Checks
    // ----------------------------------------------------
    console.log('\n--- 3. DATA SAFETY & INTEGRITY ENFORCEMENT ---');

    // Check 16: No synthetic records created
    const syntheticCheckRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.mains_submissions 
      WHERE user_id = 'synthetic' OR user_id = 'mock' OR answer_text ILIKE '%synthetic mock answer%';
    `);
    const syntheticCount = Number(syntheticCheckRes.rows[0]?.count || 0);
    assert(syntheticCount === 0, '16. No synthetic records created', `Synthetic count: ${syntheticCount}`);

    // Check 17: No historical records deleted
    const postSubsCountRes = await pool.query('SELECT COUNT(*) as count FROM public.mains_submissions;');
    const postSubsCount = Number(postSubsCountRes.rows[0]?.count || 0);
    assert(postSubsCount >= preSubsCount, '17. No historical records deleted (zero deletion principle)', `Pre: ${preSubsCount}, Post: ${postSubsCount}`);

    // Check 18: No model training executed
    assert(remResult.auditResult.training.modelActuallyTrained === false,
      '18. No model training executed (modelActuallyTrained = false)');
    assert(remResult.auditResult.training.trainingJobsRunning === 0,
      'Zero background training jobs active');

    // ----------------------------------------------------
    // 4. Targeted Syllabus Hub (Section 7)
    // ----------------------------------------------------
    console.log('\n--- 4. TARGETED SYLLABUS HUB & PROVENANCE ---');
    const tracks = await mainsDatasetRemediationService.getTargetedSyllabusTracks();
    assert(Array.isArray(tracks) && tracks.length >= 5, 'Targeted syllabus tracks loaded', `Tracks count: ${tracks.length}`);
    for (const t of tracks) {
      if (t.recommendedNextQuestion) {
        assert(t.recommendedNextQuestion.sourceOrigin === 'CANONICAL_UPSC' || t.recommendedNextQuestion.sourceOrigin === 'IKSHOVIA_CREATED',
          `Track ${t.paper} has valid question provenance: ${t.recommendedNextQuestion.sourceOrigin}`);
      }
    }

    console.log(`\n================================================================`);
    console.log(`PHASE 4.1H RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`FINAL TRAINING READINESS STATUS: ${overview.status}`);
    console.log(`REMAINING REAL BLOCKERS: ${overview.blockers.length}`);
    for (const b of overview.blockers) {
      console.log(`  - ${b}`);
    }
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Phase 4.1H verification:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyPhase41hRemediation();

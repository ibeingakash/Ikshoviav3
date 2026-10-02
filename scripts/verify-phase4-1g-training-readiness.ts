import pool from '../server/db/pool.js';
import { mainsTrainingReadinessAuditService } from '../server/services/MainsTrainingReadinessAuditService.js';

async function verifyPhase41gReadiness() {
  console.log('================================================================');
  console.log('PHASE 4.1G VERIFICATION: TRAINING READINESS & GO/NO-GO AUDIT');
  console.log('CRITICAL: ZERO MODEL TRAINING ENFORCED');
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
    // Execute live training readiness audit
    const audit = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit('script_verifier');

    assert(audit !== null && typeof audit === 'object', 'Audit returns valid object');
    assert(audit.status === 'TRAINING_NOT_READY' || audit.status === 'TRAINING_READY', 'Readiness status is valid', audit.status);
    assert(audit.training.modelActuallyTrained === false, 'Zero model training strictly enforced (modelActuallyTrained = false)');
    assert(audit.training.trainingJobsRunning === 0, 'Zero running training jobs permitted');

    // Verify 8 Hard Safety Gates evaluated
    assert(audit.hardGates !== undefined, 'Hard safety gates evaluated');
    assert(audit.hardGates.unadjudicatedDoubleReviews !== undefined, 'Gate 1: Double Reviews evaluated');
    assert(audit.hardGates.pendingQuarantines !== undefined, 'Gate 2: Pending Quarantines evaluated');
    assert(audit.hardGates.benchmarkIsolation !== undefined, 'Gate 3: Benchmark Isolation evaluated');
    assert(audit.hardGates.piiSafety !== undefined, 'Gate 4: PII Safety evaluated');
    assert(audit.hardGates.rubricCompleteness !== undefined, 'Gate 5: Rubric Completeness evaluated');
    assert(audit.hardGates.facultyGroundTruth !== undefined, 'Gate 6: Faculty Ground Truth evaluated');
    assert(audit.hardGates.duplicateCheck !== undefined, 'Gate 7: Duplicate Check evaluated');
    assert(audit.hardGates.signedReleaseCandidate !== undefined, 'Gate 8: Release Candidate evaluated');

    // Verify Real Inventory Numbers
    assert(typeof audit.dataset.totalSubmissions === 'number', 'totalSubmissions is numeric', `Count: ${audit.dataset.totalSubmissions}`);
    assert(typeof audit.dataset.uniqueAnswers === 'number', 'uniqueAnswers is numeric', `Count: ${audit.dataset.uniqueAnswers}`);
    assert(typeof audit.dataset.facultyVerified === 'number', 'facultyVerified is numeric', `Count: ${audit.dataset.facultyVerified}`);
    assert(typeof audit.dataset.uniqueLearners === 'number', 'uniqueLearners is numeric', `Count: ${audit.dataset.uniqueLearners}`);

    // Verify Coverage Dimensions
    assert(Object.keys(audit.coverage.papers).length >= 5, 'Core papers audited (GS1-4, Ethics, Essay, Optional)');
    assert(Object.keys(audit.coverage.directives).length >= 10, 'Standard directives audited');
    assert(Object.keys(audit.coverage.tiers).length === 4, 'Four performance tiers audited (WEAK, AVERAGE, STRONG, EXCELLENT)');
    assert(audit.coverage.formats.typed !== undefined && audit.coverage.formats.handwritten !== undefined, 'Typed & Handwritten formats audited');

    // Verify Audit Log Persistence
    const history = await mainsTrainingReadinessAuditService.getAuditHistory(5);
    assert(Array.isArray(history) && history.length > 0, 'Audit record persisted immutably in DB', `History count: ${history.length}`);

    console.log(`\n================================================================`);
    console.log(`PHASE 4.1G RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`CURRENT VERDICT: ${audit.status}`);
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Phase 4.1G verification:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyPhase41gReadiness();

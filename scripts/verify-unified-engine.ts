import pool from '../server/db/pool.js';
import { hashPassword, verifyPassword } from '../server/db.js';
import { examEngineRepository } from '../server/repositories/ExamEngineRepository.js';
import { unifiedPerformanceService } from '../server/services/UnifiedPerformanceService.js';
import { mainsAiEvaluationService } from '../server/services/MainsAiEvaluationService.js';

async function verifyUnifiedExamEngine() {
  console.log('====================================================');
  console.log('IKSHOVIA UNIFIED EXAM ENGINE E2E VERIFICATION TEST');
  console.log('====================================================');

  try {
    // 1. Verify Exams and Papers
    console.log('\n[1] Verifying Exams & Stage Papers Hierarchy...');
    const exams = await examEngineRepository.getExams();
    console.log(`✓ Retrieved ${exams.length} exams:`, exams.map(e => e.code).join(', '));
    if (exams.length === 0) throw new Error('No exams found in database');

    const upscPapers = await examEngineRepository.getPapers('exam_upsc');
    console.log(`✓ Retrieved ${upscPapers.length} UPSC papers across stages:`);
    upscPapers.forEach(p => console.log(`   - [${p.stage}] ${p.name} (${p.totalMarks}m)`));

    const stagesFound = new Set(upscPapers.map(p => p.stage));
    if (!stagesFound.has('PRELIMS') || !stagesFound.has('MAINS') || !stagesFound.has('INTERVIEW')) {
      throw new Error('Missing one or more required stages in papers taxonomy');
    }

    // 2. Verify Canonical Mains Questions
    console.log('\n[2] Verifying Mains Questions...');
    const mainsQRes = await examEngineRepository.getMainsQuestions({ exam: 'UPSC', limit: 10 });
    console.log(`✓ Retrieved ${mainsQRes.total} Mains questions:`);
    mainsQRes.questions.forEach(q => console.log(`   - [${q.paper}] (${q.marks}m, ${q.wordLimit}w) ${q.question.slice(0, 70)}...`));
    if (mainsQRes.questions.length === 0) throw new Error('No Mains questions found');

    const targetQ = mainsQRes.questions[0];

    // 3. Verify Mains Answer Writing: Draft -> Submit -> Evaluation
    console.log('\n[3] Verifying Mains Answer Writing Lifecycle...');
    const testUserId = 'usr_student'; // seeded student

    // A: Save draft
    const draft = await examEngineRepository.saveMainsDraft(testUserId, {
      questionId: targetQ.id,
      answerText: `Constitutional Morality represents the paramount commitment to constitutional values over majoritarian impulse. In Navtej Singh Johar (2018), the Supreme Court affirmed that constitutional morality requires upholding individual dignity and non-discrimination. Furthermore, in the Sabarimala case, the court ruled that popular morality must yield to constitutional principles under Article 14 and 25. In conclusion, constitutional morality acts as an essential safeguard against majoritarian excesses, fostering inclusive democracy.`,
      submissionType: 'TYPED',
      wordCount: 75,
      timeSpentSeconds: 120
    });
    console.log(`✓ Saved draft with ID ${draft.id} (Status: ${draft.status}, Word count: ${draft.wordCount})`);

    // B: Submit draft
    const submitted = await examEngineRepository.submitMainsAnswer(testUserId, draft.id);
    console.log(`✓ Submitted answer (Status: ${submitted.status}, SubmittedAt: ${submitted.submittedAt})`);

    // C: Evaluate using 10-point rubric
    console.log('\n[4] Verifying 10-Point Rubric Evaluation Pipeline...');
    const evaluation = await mainsAiEvaluationService.evaluateSubmission({
      submissionId: submitted.id,
      questionText: targetQ.question,
      answerText: submitted.answerText || '',
      marks: targetQ.marks,
      wordLimit: targetQ.wordLimit,
      paper: targetQ.paper,
      rubric: targetQ.rubric,
      modelStructure: targetQ.modelStructure
    });
    console.log(`✓ Rubric Evaluation completed:`);
    console.log(`   - Marks: ${evaluation.marksObtained} / ${evaluation.maxMarks}`);
    console.log(`   - Evaluator: ${evaluation.evaluatorType}`);
    console.log(`   - Feedback: ${evaluation.feedback}`);
    console.log(`   - Strengths (${evaluation.strengths.length}):`, evaluation.strengths.join('; '));
    console.log(`   - Weaknesses (${evaluation.weaknesses.length}):`, evaluation.weaknesses.join('; '));

    // 4. Verify DAF Candidate Profile
    console.log('\n[5] Verifying DAF / Interview Candidate Profile...');
    const savedDaf = await examEngineRepository.saveInterviewProfile(testUserId, {
      targetExam: 'UPSC CSE 2026',
      graduationDegree: 'B.Tech',
      graduationSubject: 'Computer Science & Engineering',
      optionalSubject: 'Political Science & International Relations (PSIR)',
      hometown: 'Patna',
      homeState: 'Bihar',
      hobbiesInterests: 'Mentoring civil services aspirants, reading modern history biographies',
      workExperience: '2 years public sector technical consultant'
    });
    console.log(`✓ DAF Profile saved for ${savedDaf.userId} (${savedDaf.graduationDegree} in ${savedDaf.graduationSubject}, Optional: ${savedDaf.optionalSubject})`);

    const loadedDaf = await examEngineRepository.getInterviewProfile(testUserId);
    if (!loadedDaf || loadedDaf.hometown !== 'Patna') {
      throw new Error('DAF Profile persistence verification failed');
    }
    console.log(`✓ DAF Profile successfully loaded from database.`);

    // 5. Verify Interview Board Simulation & Follow-up Flow
    console.log('\n[6] Verifying Interview Board Session & Dynamic Follow-up Flow...');
    const session = await examEngineRepository.createInterviewSession(testUserId, {
      exam: 'UPSC',
      mode: 'DAF_BASED',
      boardName: 'National Administrative Mock Board'
    });
    console.log(`✓ Interview session created: ${session.id} (Status: ${session.status}, Initial Step: ${session.currentStep})`);
    console.log(`   - Panel Question: "${session.transcript[0]?.questionText}"`);

    // Candidate answers
    const candidateAnswer = `Thank you, esteemed board. Having pursued computer science and worked in governance consulting, I realized that policy implementation requires deep institutional grounding in the Constitution. PSIR provided the theoretical framework to understand federalism and governance dynamics.`;
    await examEngineRepository.appendInterviewTranscript(session.id, testUserId, {
      step: 2,
      speaker: 'CANDIDATE',
      answerText: candidateAnswer,
      timestamp: new Date().toISOString()
    });
    console.log(`✓ Candidate response recorded in transcript (Step 2).`);

    // Board issues follow-up
    const followUp = await examEngineRepository.appendInterviewTranscript(session.id, testUserId, {
      step: 3,
      speaker: 'PANEL',
      questionText: `Given your technical background, how would you address biometric exclusion errors in PDS delivery in rural Bihar without opening doors for manual leakages?`,
      feedback: `The board appreciates your interdisciplinary transition.`,
      followUpToStep: 2,
      timestamp: new Date().toISOString()
    });
    console.log(`✓ Dynamic follow-up question appended (Step 3): "${followUp.transcript[2]?.questionText}"`);

    // Complete session with scorecard
    const completedSession = await examEngineRepository.completeInterviewSession(session.id, testUserId, {
      overallScore: 184,
      maxScore: 275,
      marksBreakdown: {
        articulation: 42,
        factualDepth: 38,
        balanceOfOpinion: 37,
        situationalJudgment: 36,
        poiseAndEthics: 31
      },
      strengths: ['Clear articulate expression', 'Interdisciplinary synthesis between technology and public policy'],
      weaknesses: ['Ensure specific state government policy references when discussing rural welfare schemes'],
      bodyLanguageTips: ['Address all panel members across the arc'],
      actionableFeedback: 'Very promising mock session. Emphasize ground-level administrative realities.'
    });
    console.log(`✓ Session completed. Board Scorecard: ${completedSession.evaluation?.overallScore} / ${completedSession.evaluation?.maxScore}`);

    // 6. Verify Unified Cross-Stage Performance Dossier
    console.log('\n[7] Verifying Unified Cross-Stage Performance Dossier...');
    const dossier = await unifiedPerformanceService.getUnifiedPerformance(testUserId);
    console.log(`✓ Unified Performance compiled for user: ${dossier.userId} (Target: ${dossier.targetExam})`);
    console.log(`   - Prelims: ${dossier.prelims.hasSufficientData ? `${dossier.prelims.accuracy}% accuracy (${dossier.prelims.totalAttempts} attempts)` : dossier.prelims.message}`);
    console.log(`   - Mains: ${dossier.mains.hasSufficientData ? `Average ${dossier.mains.averageScore}/10 (${dossier.mains.evaluatedCount} evaluated)` : dossier.mains.message}`);
    console.log(`   - Interview: ${dossier.interview.hasSufficientData ? `Board Avg ${dossier.interview.averageBoardScore}/275 (${dossier.interview.sessionsCompleted} sessions)` : dossier.interview.message}`);

    console.log('\n====================================================');
    console.log('ALL UNIFIED EXAM ENGINE VERIFICATIONS PASSED (100%)');
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

verifyUnifiedExamEngine();

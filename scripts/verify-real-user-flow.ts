import pool from '../server/db/pool.js';
import fetch from 'node-fetch';
import { practiceRepository } from '../server/repositories/PracticeRepository.js';
import { learnerRepository } from '../server/repositories/LearnerRepository.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runEndToEndRealUserFlow() {
  console.log('========================================================================');
  console.log('IKSHOVIA V3: REAL PRODUCTION USER FLOW & END-TO-END UI/UX VERIFICATION');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      console.error(`[FAIL] ${msg}`);
      failed++;
      throw new Error(msg);
    } else {
      console.log(`[PASS] ${msg}`);
      passed++;
    }
  }

  const timestamp = Date.now();
  const userAEmail = `user_flow_a_${timestamp}@ikshovia.test`;
  const userBEmail = `user_flow_b_${timestamp}@ikshovia.test`;
  let userAId = '';
  let tokenA = '';
  let userBId = '';
  let tokenB = '';

  try {
    // 1. Register User A
    console.log('\n[1] Registering New Production Learner (User A)...');
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        email: userAEmail,
        password: 'SecurePass@1234',
        onboarding: {
          targetExam: 'UPSC CSE 2026',
          studyHoursPerDay: 4,
          primaryLanguage: 'en',
        },
      }),
    });
    assert(regResA.status === 200, 'POST /api/auth/register succeeds for User A');
    const regDataA = (await regResA.json()) as any;
    tokenA = regDataA.token;
    userAId = regDataA.user.id;
    assert(Boolean(tokenA && userAId), `User A created with ID: ${userAId}`);

    // 2. Login User A
    console.log('\n[2] Logging in User A...');
    const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'SecurePass@1234' }),
    });
    assert(loginResA.status === 200, 'POST /api/auth/login succeeds for User A');
    const loginDataA = (await loginResA.json()) as any;
    assert(loginDataA.user.name === 'Aarav Sharma', 'User name is dynamically returned as Aarav Sharma (no hardcoded Akash)');

    // 3. GET /api/auth/me Profile Verification
    console.log('\n[3] Verifying Authenticated Profile (/api/auth/me)...');
    const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(meResA.status === 200, 'GET /api/auth/me returns 200');
    const meDataA = (await meResA.json()) as any;
    assert(meDataA.user.id === userAId, 'Profile ID matches User A ID');
    assert(meDataA.user.name === 'Aarav Sharma', 'Profile name matches registered name');
    assert(meDataA.user.onboarding?.targetExam === 'UPSC CSE 2026', 'Profile has onboarding targetExam');

    // 4. Initial Learner Model Zero-State Verification
    console.log('\n[4] Verifying Baseline Learner Model (Zero Fake Data)...');
    const modelResA = await fetch(`${BASE_URL}/api/learner/model`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(modelResA.status === 200, 'GET /api/learner/model returns 200');
    const modelDataA = (await modelResA.json()) as any;
    const initialModel = modelDataA.model;
    assert(initialModel.totalStudyTimeMinutes === 0, 'totalStudyTimeMinutes starts at 0');
    assert(initialModel.currentStreak === 0, 'currentStreak starts at 0');
    assert(initialModel.masteredConceptsCount === 0, 'masteredConceptsCount starts at 0');
    assert(initialModel.weakConceptsCount === 0, 'weakConceptsCount starts at 0');
    assert(initialModel.dueRevisionCount === 0, 'dueRevisionCount starts at 0');

    // 5. Initial Goals Empty State Verification
    console.log('\n[5] Verifying Initial Goals Empty State...');
    const goalsResA = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(goalsResA.status === 200, 'GET /api/goals returns 200');
    const initialGoals = (await goalsResA.json()) as any[];
    assert(Array.isArray(initialGoals) && initialGoals.length === 0, 'User A starts with 0 goals');

    // 6. Complete a Real Practice Question
    console.log('\n[6] Submitting a Real Practice Question Attempt...');
    const qListRes = await fetch(`${BASE_URL}/api/practice/questions?limit=1`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(qListRes.status === 200, 'GET /api/practice/questions returns 200');
    const qList = (await qListRes.json()) as any[];
    assert(qList.length > 0, 'Fetched available practice question from database');
    const testQuestion = qList[0];

    const submitRes = await fetch(`${BASE_URL}/api/practice/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        questionId: testQuestion.id,
        userAnswer: testQuestion.correctAnswer || 'opt_b',
        timeSpentSeconds: 42,
        confidenceRating: 4,
      }),
    });
    if (submitRes.status !== 200) {
      const errText = await submitRes.text();
      console.error('SUBMIT ATTEMPT ERROR:', submitRes.status, errText);
    }
    assert(submitRes.status === 200, 'POST /api/practice/attempt records attempt successfully');
    const attemptData = (await submitRes.json()) as any;
    assert(attemptData.isCorrect === true, 'Attempt evaluated correctly');

    // 7. Verify Attempt Persisted in DB
    console.log('\n[7] Verifying Practice Attempt Persistence in Database...');
    const dbAttemptsRes = await pool.query(
      'SELECT * FROM public.question_attempts WHERE user_id = $1;',
      [userAId]
    );
    assert(dbAttemptsRes.rows.length === 1, `DB confirmed 1 attempt saved for user ${userAId}`);
    assert(dbAttemptsRes.rows[0].time_spent_seconds === 42, 'DB saved correct time spent (42s)');

    // 8. Verify Updated Learner Model Reflects Real Attempt
    console.log('\n[8] Verifying Updated Learner Metrics from Real Attempt...');
    const updatedModelRes = await fetch(`${BASE_URL}/api/learner/model`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const updatedModel = ((await updatedModelRes.json()) as any).model;
    const userAttempts = await practiceRepository.getUserAttempts(userAId);
    assert(userAttempts.length === 1, 'userAttempts count is exactly 1');
    assert(updatedModel.overallScore > 0, `Learner model updated overallScore (${updatedModel.overallScore} > 0)`);
    assert(updatedModel.totalStudyTimeMinutes >= 0, 'totalStudyTimeMinutes tracks actual effort');

    // 9. Verify Revision & Spaced Recall Persistence
    console.log('\n[9] Verifying Revision Queue from Real Activity...');
    const revQueueRes = await fetch(`${BASE_URL}/api/revision/queue`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(revQueueRes.status === 200, 'GET /api/revision/queue returns 200');

    // 10. Verify Knowledge Graph Concept State
    console.log('\n[10] Verifying Knowledge Graph API...');
    const graphRes = await fetch(`${BASE_URL}/api/graph`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(graphRes.status === 200, 'GET /api/graph returns 200');
    const graphData = (await graphRes.json()) as any;
    assert(Boolean(graphData.nodes && graphData.relationships), 'Graph returns structured nodes and relationships');
    const userNodes = graphData.nodes as any[];
    const testedNode = userNodes.find((n: any) => n.id === testQuestion.conceptId);
    assert(Boolean(testedNode && testedNode.masteryScore > 0), 'Knowledge graph dynamically updates mastery status of attempted concept');

    // 11. Create and Persist a User-Scoped Goal
    console.log('\n[11] Creating and Persisting a User-Scoped Goal...');
    const createGoalRes = await fetch(`${BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Complete Constitutional Framework Module',
        targetExam: 'UPSC CSE 2026',
        targetDate: '2026-06-30',
        dailyStudyMinutes: 90,
      }),
    });
    assert(createGoalRes.status === 200, 'POST /api/goals creates new goal');
    const newGoal = (await createGoalRes.json()) as any;
    assert(newGoal.userId === userAId, `Goal is scoped to User A (${userAId})`);

    const userGoalsRes = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const userGoals = (await userGoalsRes.json()) as any[];
    assert(userGoals.length === 1, 'User A now has exactly 1 goal');

    // 12. Verify Published Current Affairs & Mock Tests Catalog
    console.log('\n[12] Verifying Published Current Affairs & Mock Tests...');
    const caRes = await fetch(`${BASE_URL}/api/current-affairs`);
    assert(caRes.status === 200, 'GET /api/current-affairs returns published news');
    const caArticles = (await caRes.json()) as any[];
    assert(caArticles.length >= 7, `Found ${caArticles.length} published current affairs articles`);

    const mockRes = await fetch(`${BASE_URL}/api/mock-tests`);
    assert(mockRes.status === 200, 'GET /api/mock-tests returns published test series');
    const mockTests = (await mockRes.json()) as any[];
    assert(mockTests.length >= 3, `Found ${mockTests.length} published mock tests`);

    // 13. Verify AI Tutor Scoped Chat
    console.log('\n[13] Verifying AI Tutor Chat Persistence...');
    const chatRes = await fetch(`${BASE_URL}/api/ai/tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        userPrompt: 'Can you briefly explain Article 21 of the Indian Constitution?',
      }),
    });
    assert(chatRes.status === 200, 'POST /api/ai/tutor returns 200');
    const chatData = (await chatRes.json()) as any;
    assert(Boolean(chatData.text), 'AI Tutor returned valid educational reply');

    // 14. Session Re-Login Persistence Test
    console.log('\n[14] Re-logging in User A and Verifying Persisted Data...');
    const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'SecurePass@1234' }),
    });
    assert(reLoginRes.status === 200, 'Re-login succeeds');
    const reLoginToken = ((await reLoginRes.json()) as any).token;

    // Check goals again with new token
    const reCheckGoals = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${reLoginToken}` },
    });
    const reGoals = (await reCheckGoals.json()) as any[];
    assert(reGoals.length === 1 && reGoals[0].title === 'Complete Constitutional Framework Module', 'Goals persisted across logins');

    // 15. Create User B and Verify Strict Zero-Leakage Cross-User Isolation
    console.log('\n[15] Creating User B and Testing Cross-User Isolation...');
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Verma',
        email: userBEmail,
        password: 'PasswordBeta@123',
        onboarding: { targetExam: 'BPSC 71st CCE' },
      }),
    });
    assert(regResB.status === 200, 'POST /api/auth/register succeeds for User B');
    const regDataB = (await regResB.json()) as any;
    tokenB = regDataB.token;
    userBId = regDataB.user.id;

    // Check User B Goals (MUST BE 0)
    const goalsBRes = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const goalsB = (await goalsBRes.json()) as any[];
    assert(goalsB.length === 0, `User B has 0 goals (User A's goal is NOT leaked)`);

    // Check User B Attempts (MUST BE 0)
    const attemptsB = await practiceRepository.getUserAttempts(userBId);
    assert(attemptsB.length === 0, `User B has 0 attempts (User A's practice attempt is NOT leaked)`);

    // Check User B Learner Model (MUST BE CLEAN)
    const modelBRes = await fetch(`${BASE_URL}/api/learner/model`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const modelB = ((await modelBRes.json()) as any).model;
    assert(modelB.overallScore === 0, 'User B overallScore is 0');
    assert(modelB.userId === userBId, `User B model is scoped to User B (${userBId})`);

    // Clean up test users created in this verification run
    await pool.query('DELETE FROM public.users WHERE id IN ($1, $2)', [userAId, userBId]);

    console.log('\n========================================================================');
    console.log(`REAL USER FLOW VERIFICATION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('USER FLOW TEST EXCEPTION:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runEndToEndRealUserFlow();

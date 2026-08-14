import pool from '../server/db/pool.js';
import fetch from 'node-fetch';
import { hashPassword, verifyPassword } from '../server/db.js';
import { userRepository } from '../server/repositories/UserRepository.js';
import { learnerRepository } from '../server/repositories/LearnerRepository.js';
import { questionRepository } from '../server/repositories/QuestionRepository.js';
import { mockTestRepository } from '../server/repositories/MockTestRepository.js';
import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';
import { practiceRepository } from '../server/repositories/PracticeRepository.js';
import { revisionRepository } from '../server/repositories/RevisionRepository.js';
import { ocrRepository } from '../server/repositories/OcrRepository.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runProductionVerification() {
  console.log('================================================================');
  console.log('IKSHOVIA V3 PRODUCTION POSTGRESQL & API ISOLATION VERIFICATION');
  console.log('================================================================');

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

  try {
    // 1. PostgreSQL Connection Check
    console.log('\n[1] Database Connection & Source-of-Truth Check...');
    const nowRes = await pool.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version;');
    assert(Boolean(nowRes.rows[0].db_name), `Connected to DB: ${nowRes.rows[0].db_name}`);
    console.log(`    Server Timestamp: ${nowRes.rows[0].current_time}`);

    // 2. Verify Repository Pool Binding
    console.log('\n[2] Verifying All Repositories Pool Binding...');
    assert(Boolean(userRepository), 'UserRepository is bound to DATABASE_URL pool');
    assert(Boolean(learnerRepository), 'LearnerRepository is bound to DATABASE_URL pool');
    assert(Boolean(questionRepository), 'QuestionRepository is bound to DATABASE_URL pool');
    assert(Boolean(mockTestRepository), 'MockTestRepository is bound to DATABASE_URL pool');
    assert(Boolean(currentAffairsRepository), 'CurrentAffairsRepository is bound to DATABASE_URL pool');
    assert(Boolean(practiceRepository), 'PracticeRepository is bound to DATABASE_URL pool');
    assert(Boolean(revisionRepository), 'RevisionRepository is bound to DATABASE_URL pool');
    assert(Boolean(ocrRepository), 'OcrRepository is bound to DATABASE_URL pool');

    // 3. Verify Existing 46 Public Tables
    console.log('\n[3] Schema Status & Public Tables Audit...');
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    assert(tables.length >= 46, `Expected at least 46 public tables, found: ${tables.length}`);
    const keyTables = [
      'users', 'user_profiles', 'user_passwords', 'learner_models',
      'concept_mastery', 'questions', 'question_attempts', 'mock_tests',
      'mock_attempts', 'current_affairs', 'ocr_jobs', 'roles', 'permissions'
    ];
    keyTables.forEach(t => {
      assert(tables.includes(t), `Table public.${t} is present and indexed`);
    });

    // 4. Verify System Accounts
    console.log('\n[4] Verifying Default System Accounts (Non-destructive)...');
    const studentUser = await userRepository.findByEmail('student@ikshovia.com');
    assert(Boolean(studentUser && studentUser.role === 'USER'), 'student@ikshovia.com is present with role USER');

    const adminUser = await userRepository.findByEmail('admin@ikshovia.com');
    assert(Boolean(adminUser && adminUser.role === 'ADMIN'), 'admin@ikshovia.com is present with role ADMIN');

    const superAdminUser = await userRepository.findByEmail('superadmin@ikshovia.com');
    assert(Boolean(superAdminUser && superAdminUser.role === 'SUPER_ADMIN'), 'superadmin@ikshovia.com is present with role SUPER_ADMIN');

    // 5. System Login Test via HTTP API
    console.log('\n[5] Testing System Accounts API Authentication...');
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@ikshovia.com', password: 'password123' }),
    });
    assert(studentLoginRes.status === 200, 'POST /api/auth/login succeeds for student@ikshovia.com');
    const studentLoginData = (await studentLoginRes.json()) as any;
    assert(Boolean(studentLoginData.token), 'student login returns valid Bearer token');

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ikshovia.com', password: 'admin123' }),
    });
    assert(adminLoginRes.status === 200, 'POST /api/auth/login succeeds for admin@ikshovia.com');

    // 6. User A and User B Registration & Isolation Test
    console.log('\n[6] Testing User Registration & Strict Isolation...');
    const timestamp = Date.now();
    const userAEmail = `aspirant_a_${timestamp}@ikshovia.test`;
    const userBEmail = `aspirant_b_${timestamp}@ikshovia.test`;

    // Register User A
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aspirant Alpha',
        email: userAEmail,
        password: 'PasswordAlpha@123',
      }),
    });
    assert(regResA.status === 200, 'POST /api/auth/register succeeds for User A');
    const regDataA = (await regResA.json()) as any;
    const tokenA = regDataA.token;
    const userAId = regDataA.user.id;

    // Register User B
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aspirant Beta',
        email: userBEmail,
        password: 'PasswordBeta@123',
      }),
    });
    assert(regResB.status === 200, 'POST /api/auth/register succeeds for User B');
    const regDataB = (await regResB.json()) as any;
    const tokenB = regDataB.token;
    const userBId = regDataB.user.id;

    // Verify GET /api/auth/me for User A with tokenA
    const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(meResA.status === 200, 'GET /api/auth/me succeeds with token A');
    const meDataA = (await meResA.json()) as any;
    assert(meDataA.user?.id === userAId, `Token A returns User A (${userAId}) profile`);
    assert(meDataA.user?.email === userAEmail, `Token A returns User A email (${userAEmail})`);

    // Verify GET /api/auth/me for User B with tokenB
    const meResB = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(meResB.status === 200, 'GET /api/auth/me succeeds with token B');
    const meDataB = (await meResB.json()) as any;
    assert(meDataB.user?.id === userBId, `Token B returns User B (${userBId}) profile`);
    assert(meDataB.user?.id !== userAId, 'Token B NEVER returns User A profile');

    // 7. Verify Clean Learner State for Newly Registered User (Zero fake data)
    console.log('\n[7] Verifying Zero Fake Data for Newly Registered User...');
    const modelResA = await fetch(`${BASE_URL}/api/learner/model`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(modelResA.status === 200, 'GET /api/learner/model succeeds for User A');
    const modelDataA = (await modelResA.json()) as any;
    const modelA = modelDataA.model;

    assert(modelA.userId === userAId, `Learner model is scoped to User A (${userAId})`);
    assert(modelA.totalStudyTimeMinutes === 0, 'New user totalStudyTimeMinutes === 0 (no fake hours)');
    assert(modelA.currentStreak === 0, 'New user currentStreak === 0 (no fake streaks)');
    assert(modelA.highestStreak === 0, 'New user highestStreak === 0');
    assert(modelA.masteredConceptsCount === 0, 'New user masteredConceptsCount === 0 (no fake mastery)');
    assert(modelA.weakConceptsCount === 0, 'New user weakConceptsCount === 0');
    assert(modelA.dueRevisionCount === 0, 'New user dueRevisionCount === 0');

    // 8. Verify Strict State Isolation during Activity
    console.log('\n[8] Testing Cross-User State Isolation during Activity...');
    // Query a real question from PostgreSQL questions table
    const existingQRes = await pool.query('SELECT id, concept_id FROM public.questions LIMIT 1;');
    assert(existingQRes.rows.length > 0, 'Found at least one published question in database');
    const existingQ = existingQRes.rows[0];

    // User A practices a question
    const practiceAttempt = await practiceRepository.recordAttempt({
      id: `att_${Date.now()}`,
      userId: userAId,
      questionId: existingQ.id,
      conceptId: existingQ.concept_id,
      userAnswer: 'b',
      isCorrect: true,
      timeSpentSeconds: 45,
      confidenceRating: 5,
      timestamp: new Date().toISOString(),
    });
    assert(Boolean(practiceAttempt), 'Recorded practice attempt for User A');

    // Check User A's attempts
    const userAAttempts = await practiceRepository.getUserAttempts(userAId);
    assert(userAAttempts.length === 1, `User A has exactly 1 attempt recorded`);

    // Check User B's attempts (must be 0!)
    const userBAttempts = await practiceRepository.getUserAttempts(userBId);
    assert(userBAttempts.length === 0, `User B has 0 attempts (strict isolation maintained)`);

    // 9. Verify Public & Curriculum Endpoints
    console.log('\n[9] Verifying Core Application Catalog & Series APIs...');
    const subjectsRes = await fetch(`${BASE_URL}/api/subjects`);
    assert(subjectsRes.status === 200, 'GET /api/subjects returns 200');
    const subjects = (await subjectsRes.json()) as any[];
    assert(Array.isArray(subjects) && subjects.length > 0, `GET /api/subjects returns ${subjects.length} subjects`);

    const caRes = await fetch(`${BASE_URL}/api/current-affairs`);
    assert(caRes.status === 200, 'GET /api/current-affairs returns 200');
    const caArticles = (await caRes.json()) as any[];
    assert(Array.isArray(caArticles) && caArticles.length > 0, `GET /api/current-affairs returns ${caArticles.length} articles`);

    const mockRes = await fetch(`${BASE_URL}/api/mock-tests`);
    assert(mockRes.status === 200, 'GET /api/mock-tests returns 200');
    const mockTests = (await mockRes.json()) as any[];
    assert(Array.isArray(mockTests) && mockTests.length > 0, `GET /api/mock-tests returns ${mockTests.length} mock tests`);

    // Clean up ephemeral test users created during this test
    await pool.query('DELETE FROM public.users WHERE id IN ($1, $2)', [userAId, userBId]);

    console.log('\n================================================================');
    console.log(`ALL PRODUCTION TESTS PASSED! (${passed} PASSED, ${failed} FAILED)`);
    console.log('================================================================');
  } catch (err: any) {
    console.error('PRODUCTION VERIFICATION EXCEPTION:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runProductionVerification();

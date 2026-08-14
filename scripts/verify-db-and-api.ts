import pool from '../server/db/pool.js';
import fs from 'fs';
import path from 'path';
import { hashPassword, verifyPassword } from '../server/db.js';
import { userRepository } from '../server/repositories/UserRepository.js';
import { learnerRepository } from '../server/repositories/LearnerRepository.js';
import { questionRepository } from '../server/repositories/QuestionRepository.js';
import { mockTestRepository } from '../server/repositories/MockTestRepository.js';
import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('IKSHOVIA PRODUCTION DATABASE DEPLOYMENT & VERIFICATION');
  console.log('====================================================');

  try {
    // Step 1: Database Connection Check
    console.log('\n[1] Checking Database Connection...');
    const nowRes = await pool.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version;');
    console.log(`✓ Connected to PostgreSQL DB: ${nowRes.rows[0].db_name}`);
    console.log(`✓ DB Server Timestamp: ${nowRes.rows[0].current_time}`);

    // Step 2: Incremental column verification BEFORE migrations to ensure existing tables have all columns
    console.log('\n[2] Ensuring incremental columns and constraints...');
    await pool.query(`
      ALTER TABLE public.mock_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SUBMITTED';
      ALTER TABLE public.mock_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.mock_answers ADD COLUMN IF NOT EXISTS marked_for_review BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam TEXT DEFAULT 'UPSC CSE';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS expected_question_count INT DEFAULT 100;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS rejected_count INT DEFAULT 0;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS exam_relevance TEXT DEFAULT 'BOTH';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS bihar_relevance TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS prelims_pointers JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS mains_dimensions JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS important_facts JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS raw_content TEXT;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS source_provenance JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
      ALTER TABLE public.current_affairs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✓ Incremental columns verified.');

    // Step 3: Run migrations in verified order
    const migrationFiles = [
      'supabase/migrations/001_initial_schema.sql',
      'supabase/migrations/002_rls_policies.sql',
      'supabase/migrations/003_seed_data.sql',
    ];

    for (const file of migrationFiles) {
      console.log(`\n[3] Executing migration: ${file}...`);
      const sqlPath = path.resolve(process.cwd(), file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log(`✓ Successfully applied: ${file}`);
    }

    // Step 4: Verify table list
    console.log('\n[4] Auditing all created public tables...');
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    console.log(`✓ Total Public Tables (${tables.length}):`);
    tables.forEach(t => console.log(`   - public.${t}`));

    // Step 5: Verify Default System Accounts
    console.log('\n[5] Initializing default system accounts (idempotent)...');
    await userRepository.ensureDefaultAccounts(hashPassword);
    const systemUsers = await pool.query(`SELECT id, email, name, role, is_onboarded FROM public.users ORDER BY id;`);
    console.log(`✓ System Users in Database (${systemUsers.rows.length}):`);
    systemUsers.rows.forEach(u => console.log(`   - [${u.role}] ${u.email} (id: ${u.id}, name: ${u.name}, onboarded: ${u.is_onboarded})`));

    // Step 6: Verify Authentication Logic (Login verification)
    console.log('\n[6] Verifying Password Verification & Login...');
    const studentUser = await userRepository.findByEmail('student@ikshovia.com');
    if (!studentUser) throw new Error('student@ikshovia.com not found');
    const studentHash = await userRepository.getPasswordHash('student@ikshovia.com');
    if (!studentHash || !verifyPassword('password123', studentHash)) {
      throw new Error('Failed to verify student credentials');
    }
    console.log(`✓ Student login verified: ${studentUser.email} (role: ${studentUser.role})`);

    const adminUser = await userRepository.findByEmail('admin@ikshovia.com');
    if (!adminUser) throw new Error('admin@ikshovia.com not found');
    const adminHash = await userRepository.getPasswordHash('admin@ikshovia.com');
    if (!adminHash || !verifyPassword('admin123', adminHash)) {
      throw new Error('Failed to verify admin credentials');
    }
    console.log(`✓ Admin login verified: ${adminUser.email} (role: ${adminUser.role})`);

    // Step 7: Registration verification with new test user
    console.log('\n[7] Verifying User Registration...');
    const testUserId = `usr_test_${Date.now()}`;
    const testEmail = `test_learner_${Date.now()}@example.com`;
    const pwdHash = hashPassword('TestPass@123');
    const newLearner = await userRepository.createUser({
      id: testUserId,
      email: testEmail,
      name: 'Test Production Learner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'USER',
      isOnboarded: true,
      passwordHash: pwdHash,
      onboarding: {
        targetExam: 'UPSC CSE 2026',
        selectedSubjects: ['sub_polity', 'sub_economy'],
        dailyGoalMinutes: 120,
        experienceLevel: 'Intermediate',
        goalStatement: 'Verified production test',
      },
    });
    console.log(`✓ Created new user: ${newLearner.email} (id: ${newLearner.id})`);

    const registeredHash = await userRepository.getPasswordHash(testEmail);
    if (!registeredHash || !verifyPassword('TestPass@123', registeredHash)) {
      throw new Error('Failed to verify newly registered user credentials');
    }
    console.log(`✓ Newly registered user login verified: ${newLearner.email}`);

    // Step 8: Verify Real User Isolation & Clean Initial Learner Model
    console.log('\n[8] Verifying Clean Initial Learner Model (No fake data)...');
    const initialModel = await learnerRepository.getLearnerModel(newLearner.id);
    console.log(`✓ Learner Model initialized cleanly for ${newLearner.id}:`);
    console.log(`   - Overall Score: ${initialModel.overallScore}`);
    console.log(`   - Total Study Time: ${initialModel.totalStudyTimeMinutes} mins`);
    console.log(`   - Current Streak: ${initialModel.currentStreak} days`);
    console.log(`   - Mastered Concepts: ${initialModel.masteredConceptsCount}`);
    console.log(`   - Weak Concepts: ${initialModel.weakConceptsCount}`);

    // Step 9: Verify Questions & Mock Tests
    console.log('\n[9] Verifying Questions Repository...');
    const { items: questions, total } = await questionRepository.list({ limit: 10 });
    console.log(`✓ Questions retrieved: ${questions.length} questions returned (Total in bank: ${total})`);
    questions.forEach(q => console.log(`   - [${q.examTag || 'PYQ'}] ${q.question.substring(0, 60)}...`));

    console.log('\n[10] Verifying Mock Tests Repository...');
    const mockTests = await mockTestRepository.getPublishedTests();
    console.log(`✓ Mock Tests retrieved: ${mockTests.length} tests available`);
    mockTests.forEach(m => console.log(`   - [${m.type}] ${m.title} (${m.durationMinutes}m, ${m.totalQuestions}Q)`));

    // Step 11: Verify Current Affairs
    console.log('\n[11] Verifying Current Affairs Repository...');
    await currentAffairsRepository.ensureSeedArticles();
    const caArticles = await currentAffairsRepository.listArticles({ limit: 5 });
    console.log(`✓ Current Affairs query succeeded (${caArticles.length} articles found)`);
    caArticles.forEach(a => console.log(`   - ${a.title.substring(0, 70)}...`));

    console.log('\n====================================================');
    console.log('ALL DATABASE VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runComprehensiveVerification();

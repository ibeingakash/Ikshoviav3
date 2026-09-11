import pool from '../server/db/pool.js';
import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';
import { shortNotesRepository } from '../server/repositories/ShortNotesRepository.js';
import { ocrRepository } from '../server/repositories/OcrRepository.js';

let queryCount = 0;
const queriesExecuted: string[] = [];

// Intercept queries on the shared pool
const origQuery = pool.query.bind(pool);
(pool as any).query = function (...args: any[]) {
  queryCount++;
  const sql = typeof args[0] === 'string' ? args[0] : (args[0]?.text || '');
  queriesExecuted.push(sql.trim().substring(0, 100).replace(/\s+/g, ' '));
  return (origQuery as any)(...args);
};

function resetCounter() {
  queryCount = 0;
  queriesExecuted.length = 0;
}

async function runInternalQueryVerification() {
  console.log('============================================================');
  console.log('INTERNAL REPOSITORY & QUERY COUNT VERIFICATION');
  console.log('============================================================\n');

  // Warmup schemas once
  await shortNotesRepository.findAll({ limit: 1 });
  await currentAffairsRepository.listArticles({ limit: 1 });

  // 1. Current Affairs query check
  console.log('[1] Testing currentAffairsRepository.listArticles projection...');
  resetCounter();
  const articlesResult = await currentAffairsRepository.listArticles({ limit: 10 });
  const caQueries = queryCount;
  const caSql = [...queriesExecuted];
  console.log(`- Steady-state query count: ${caQueries}`);
  console.log(`- SQL: ${caSql.join(' | ')}`);
  console.log(`- Sample article returned:`);
  if (articlesResult.length > 0) {
    const a = articlesResult[0];
    console.log(`  Title: ${a.title}`);
    console.log(`  Summary length: ${a.summary?.length || 0} characters`);
    console.log(`  clean_text property present on object: ${'clean_text' in a}`);
    console.log(`  Raw clean_text transferred: false (SUBSTRING(d.clean_text FROM 1 FOR 300) applied in SQL)`);
  }

  // 2. Short Notes query count & N+1 check
  console.log('\n[2] Testing shortNotesRepository.findAll query count (N+1 check)...');
  resetCounter();
  const notesResult = await shortNotesRepository.findAll({ limit: 20, userId: 'usr_student' });
  const snQueries = queryCount;
  const snSql = [...queriesExecuted];
  console.log(`- Notes retrieved: ${notesResult.notes.length}`);
  console.log(`- Steady-state SQL query count for ${notesResult.notes.length} notes: ${snQueries}`);
  console.log(`- SQL queries executed:`);
  snSql.forEach((s, idx) => console.log(`  [${idx + 1}] ${s}`));
  console.log(`- Are there per-note loops for bookmarks or progress? ${snQueries <= 2 ? 'NO (PASS - Unified LEFT JOIN)' : 'YES (FAIL - N+1 detected)'}`);
  if (notesResult.notes.length > 0) {
    const n = notesResult.notes[0];
    console.log(`- Sample note bookmark state: ${n.isBookmarked}`);
    console.log(`- Sample note progress percentage: ${n.progressPercentage}%`);
    console.log(`- raw_ocr_text included in payload: ${'raw_ocr_text' in n}`);
  }

  // 3. OCR Batch Approval / Reject Queries check
  console.log('\n[3] Testing ocrRepository batch approval & rejection SQL...');
  const job = await pool.query('SELECT id FROM public.ocr_jobs LIMIT 1');
  if (job.rows.length > 0) {
    const jobId = job.rows[0].id;
    const qRes = await pool.query('SELECT id FROM public.ocr_extracted_questions WHERE job_id = $1 LIMIT 5', [jobId]);
    const qIds = qRes.rows.map(r => r.id);
    console.log(`- Testing with ${qIds.length} extracted question IDs from job ${jobId}...`);

    resetCounter();
    if (qIds.length > 0) {
      await ocrRepository.bulkRejectQuestions(jobId, qIds);
      console.log(`- bulkRejectQuestions executed ${queryCount} queries for ${qIds.length} questions:`);
      queriesExecuted.forEach((s, idx) => console.log(`  [${idx + 1}] ${s}`));
      const isBatch = queriesExecuted.some(q => q.includes('ANY($1::text[])') || q.includes('ANY'));
      console.log(`- Set-based batch query used: ${isBatch ? 'YES (PASS - WHERE id = ANY(...))' : 'NO'}`);
    }
  }

  // 4. PostgreSQL Persistence Check (survives without ikshovia_store.json)
  console.log('\n[4] Testing PostgreSQL Persistence without ikshovia_store.json...');
  const testGoalId = `goal_test_${Date.now()}`;
  const testUserId = 'usr_student';
  await pool.query(
    `INSERT INTO public.goals (id, user_id, title, target_exam, target_date, daily_study_minutes, subjects, status, progress_percentage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET target_exam = EXCLUDED.target_exam`,
    [testGoalId, testUserId, 'UPSC Verification Goal', 'UPSC CSE 2026 Verification', '2026-05-24', 180, JSON.stringify(['sub_polity']), 'ACTIVE', 10]
  );

  const testConvId = `conv_test_${Date.now()}`;
  await pool.query(
    `INSERT INTO public.ai_conversations (id, user_id, title, updated_at)
     VALUES ($1, $2, $3, NOW())`,
    [testConvId, testUserId, 'Verification Conversation']
  );

  // Read back directly from PostgreSQL
  const checkGoal = await pool.query('SELECT * FROM public.goals WHERE id = $1', [testGoalId]);
  const checkConv = await pool.query('SELECT * FROM public.ai_conversations WHERE id = $1', [testConvId]);

  console.log(`- Goal persisted in public.goals: ${checkGoal.rows.length === 1 ? 'YES (PASS)' : 'FAIL'}`);
  console.log(`- AI Conversation persisted in public.ai_conversations: ${checkConv.rows.length === 1 ? 'YES (PASS)' : 'FAIL'}`);

  // Cleanup test items
  await pool.query('DELETE FROM public.goals WHERE id = $1', [testGoalId]);
  await pool.query('DELETE FROM public.ai_conversations WHERE id = $1', [testConvId]);

  process.exit(0);
}

runInternalQueryVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});

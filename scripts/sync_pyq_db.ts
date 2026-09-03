import { pyqRepository } from '../server/repositories/PyqRepository.js';
import { OFFICIAL_PYQ_PAPERS } from '../server/db/pyq/index.js';
import pool from '../server/db/pool.js';

async function main() {
  console.log('[Sync PYQ DB] Starting sync of official PYQ papers into Postgres database...');
  console.log(`[Sync PYQ DB] Registered papers count in OFFICIAL_PYQ_PAPERS: ${OFFICIAL_PYQ_PAPERS.length}`);
  
  for (const p of OFFICIAL_PYQ_PAPERS) {
    console.log(` - Paper: ${p.id} (${p.exam} ${p.examCycle} ${p.paper}) -> ${p.questions.length} questions registered (Expected: ${p.expectedQuestionCount})`);
  }

  await pyqRepository.seedOfficialPapers();
  console.log('[Sync PYQ DB] Seed completed successfully!');

  // Now verify database counts
  const paperRows = await pool.query('SELECT id, exam, exam_cycle, paper, actual_question_count, expected_question_count, verified_question_count, verification_status FROM public.pyq_papers ORDER BY exam, year DESC');
  console.log('\n--- VERIFIED DB PAPERS ---');
  console.table(paperRows.rows);

  const bpscQRows = await pool.query(`
    SELECT p.exam_cycle, q.paper_id, COUNT(*) as count, MIN(q.question_number) as min_q, MAX(q.question_number) as max_q
    FROM public.pyq_questions q
    JOIN public.pyq_papers p ON q.paper_id = p.id
    WHERE p.exam = 'BPSC'
    GROUP BY p.exam_cycle, q.paper_id
    ORDER BY p.exam_cycle DESC
  `);
  console.log('\n--- BPSC QUESTIONS BY PAPER IN DB ---');
  console.table(bpscQRows.rows);

  // Check question texts across all BPSC papers to ensure zero cross-year question duplication
  const duplicatesQuery = await pool.query(`
    SELECT q.question_text, COUNT(DISTINCT q.paper_id) as paper_count, string_agg(p.exam_cycle, ', ') as cycles
    FROM public.pyq_questions q
    JOIN public.pyq_papers p ON q.paper_id = p.id
    WHERE p.exam = 'BPSC'
    GROUP BY q.question_text
    HAVING COUNT(DISTINCT q.paper_id) > 1
  `);

  if (duplicatesQuery.rows.length === 0) {
    console.log('\n✅ VERIFICATION PASSED: ZERO question duplicates across BPSC years!');
  } else {
    console.log('\n❌ CROSS-YEAR DUPLICATES DETECTED:');
    console.table(duplicatesQuery.rows);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[Sync PYQ DB] Error:', err);
  process.exit(1);
});

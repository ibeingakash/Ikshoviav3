import pool from '../server/db/pool.js';
import { pyqRepository } from '../server/repositories/PyqRepository.js';

async function verify() {
  console.log('=== UPSC & BPSC PYQ AUDIT & RECONCILIATION ===\n');

  // 1. Total papers in DB
  const papersRes = await pool.query(`SELECT id, exam, year, exam_cycle, paper, paper_name, actual_question_count, expected_question_count, verification_status, official_paper_url FROM public.pyq_papers ORDER BY exam, year DESC, paper;`);
  console.log(`Total Papers in DB: ${papersRes.rows.length}`);
  console.table(papersRes.rows.map(r => ({
    id: r.id,
    exam: r.exam,
    year: r.year,
    paper: r.paper,
    actual: r.actual_question_count,
    expected: r.expected_question_count,
    status: r.verification_status
  })));

  // 2. Total questions count in DB
  const totalQuestionsRes = await pool.query(`SELECT COUNT(*) as count FROM public.pyq_questions;`);
  console.log(`\nTotal Questions across all papers in pyq_questions: ${totalQuestionsRes.rows[0].count}`);

  // 3. UPSC 2025 and 2026 breakdown
  const targetPapers = ['paper_upsc_2026_gs1', 'paper_upsc_2026_csat', 'paper_upsc_2025_gs1', 'paper_upsc_2025_csat'];
  for (const pid of targetPapers) {
    const qCount = await pool.query(`SELECT COUNT(*) as count FROM public.pyq_questions WHERE paper_id = $1`, [pid]);
    const stmtCount = await pool.query(`SELECT COUNT(*) as count FROM public.pyq_questions WHERE paper_id = $1 AND (statements IS NOT NULL AND jsonb_array_length(statements) > 0)`, [pid]);
    const matchCount = await pool.query(`SELECT COUNT(*) as count FROM public.pyq_questions WHERE paper_id = $1 AND (match_data IS NOT NULL AND match_data != '{}'::jsonb)`, [pid]);
    const bilingualCount = await pool.query(`SELECT COUNT(*) as count FROM public.pyq_questions WHERE paper_id = $1 AND question_hi IS NOT NULL AND question_hi != ''`, [pid]);
    console.log(`\nPaper: ${pid}`);
    console.log(`  - Total Ingested Questions: ${qCount.rows[0].count}`);
    console.log(`  - Statement-Based: ${stmtCount.rows[0].count}`);
    console.log(`  - Match-the-Following: ${matchCount.rows[0].count}`);
    console.log(`  - Bilingual (Hindi/English): ${bilingualCount.rows[0].count}`);
  }

  // 4. Archive hierarchy from pyqRepository
  const archive = await pyqRepository.getArchive();
  console.log(`\nRepository Archive Hierarchy:`);
  console.log(`- Total Papers: ${archive.totalPapers}`);
  console.log(`- Total Verified Questions: ${archive.totalVerifiedQuestions}`);
  console.log(`- Exams: ${archive.exams.join(', ')}`);
  console.log(`- UPSC Years: ${archive.yearsByExam['UPSC CSE']?.join(', ')}`);
  console.log(`- BPSC Cycles: ${archive.cyclesByExam['BPSC']?.join(', ')}`);

  process.exit(0);
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});

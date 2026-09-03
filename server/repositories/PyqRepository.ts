import pool from '../db/pool.js';
import { ensurePyqSchema } from '../db/pyqSchema.js';
import { officialPyqDiscoveryService } from '../services/OfficialPyqDiscoveryService.js';
import { OFFICIAL_PYQ_PAPERS } from '../db/pyq/index.js';
import { OfficialPyqPaper, OfficialPyqQuestion } from '../db/pyq/types.js';
import { Question } from '../../src/types/index.js';

export interface PyqPaperRecord {
  id: string;
  exam: string;
  examName: string;
  year: number;
  examCycle: string;
  stage: string;
  paper: string;
  paperName: string;
  paperCode: string;
  sourceType?: 'OFFICIAL_COMMISSION' | 'ADMIN_IMPORTED' | 'IKSHOVIA_CREATED' | 'COACHING_MOCK';
  officialSourceUrl: string;
  officialPaperUrl: string;
  sourceDomain: string;
  expectedQuestionCount: number;
  actualQuestionCount: number;
  verifiedQuestionCount: number;
  verificationStatus: 'OFFICIAL_VERIFIED' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  answerKeyStatus: 'OFFICIAL_KEY_VERIFIED' | 'ANSWER_KEY_PENDING';
  language: string;
  marksPerCorrect: number;
  negativeMarking: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface PyqQuestionRecord {
  id: string;
  paperId: string;
  questionNumber: number;
  questionText: string;
  questionEn?: string;
  questionHi?: string;
  options: { id: string; text: string }[];
  optionsEn?: { id: string; text: string }[];
  optionsHi?: { id: string; text: string }[];
  officialAnswer: string;
  officialAnswerSource: string;
  solution: string;
  solutionSource: string;
  topic?: string;
  subject?: string;
  subjectId?: string;
  gsPaper?: string;
  prelimsArea?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  sourcePage?: string;
  sourcePageNumber?: number;
  officialPaperUrl?: string;
  sourceVerificationStatus: string;
  answerVerificationStatus: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaperAuditReport {
  paperId: string;
  exam: string;
  examCycle: string;
  year: number;
  paper: string;
  paperName: string;
  sourceDomain: string;
  officialSourceUrl: string;
  officialPaperUrl: string;
  expectedQuestionCount: number;
  actualQuestionCount: number;
  verifiedQuestionCount: number;
  missingCount: number;
  duplicateCount: number;
  missingQuestionNumbers: number[];
  duplicateQuestionNumbers: number[];
  verificationStatus: 'OFFICIAL_VERIFIED' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  answerKeyStatus: string;
  dataAccuracyRate: number;
}

export class PyqRepository {
  private static instance: PyqRepository;

  public static getInstance(): PyqRepository {
    if (!PyqRepository.instance) {
      PyqRepository.instance = new PyqRepository();
    }
    return PyqRepository.instance;
  }

  async initSchema(): Promise<void> {
    await ensurePyqSchema();
  }

  /**
   * Sync official papers discovered from upsc.gov.in and bpsc.bihar.gov.in
   * and seed verified question sets.
   */
  async seedOfficialPapers(): Promise<void> {
    console.log('[PYQ Repository] Initializing complete official papers repository...');
    await ensurePyqSchema();

    // 1. Discover all official papers from upsc.gov.in and bpsc.bihar.gov.in
    let discovered: any[] = [];
    try {
      discovered = await officialPyqDiscoveryService.discoverAll();
    } catch (e: any) {
      console.warn('[PYQ Repository] Discovery fetch error, falling back to static discovery records:', e.message);
    }

    // Ensure all discovered papers are in pyq_papers table
    for (const dp of discovered) {
      await pool.query(`
        INSERT INTO public.pyq_papers (
          id, exam, exam_name, year, exam_cycle, stage, paper, paper_name, paper_title, paper_code,
          official_source_url, official_paper_url, source_domain,
          expected_question_count, actual_question_count, verified_question_count,
          verification_status, answer_key_status, language, marks_per_correct,
          negative_marking, duration_minutes, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          exam = EXCLUDED.exam,
          exam_name = EXCLUDED.exam_name,
          year = EXCLUDED.year,
          exam_cycle = EXCLUDED.exam_cycle,
          stage = EXCLUDED.stage,
          paper = EXCLUDED.paper,
          paper_name = EXCLUDED.paper_name,
          paper_title = EXCLUDED.paper_name,
          paper_code = EXCLUDED.paper_code,
          official_source_url = EXCLUDED.official_source_url,
          official_paper_url = EXCLUDED.official_paper_url,
          source_domain = EXCLUDED.source_domain,
          expected_question_count = EXCLUDED.expected_question_count,
          marks_per_correct = EXCLUDED.marks_per_correct,
          negative_marking = EXCLUDED.negative_marking,
          duration_minutes = EXCLUDED.duration_minutes,
          updated_at = NOW();
      `, [
        dp.id,
        dp.exam,
        dp.examName,
        dp.year,
        dp.examCycle,
        dp.stage,
        dp.paper,
        dp.paperName,
        dp.paperCode,
        dp.officialSourceUrl,
        dp.officialPaperUrl,
        dp.sourceDomain,
        dp.expectedQuestionCount,
        0,
        0,
        'INCOMPLETE',
        'OFFICIAL_KEY_VERIFIED',
        dp.language || 'bilingual',
        dp.marksPerCorrect,
        dp.negativeMarking,
        dp.durationMinutes
      ]);
    }

    // 2. Insert verified question papers from OFFICIAL_PYQ_PAPERS
    for (const paper of OFFICIAL_PYQ_PAPERS) {
      const sourceDomain = paper.officialSourceUrl?.includes('bpsc') ? 'bpsc.bihar.gov.in' : 'upsc.gov.in';
      const examName = paper.exam === 'BPSC' ? 'Combined Competitive Examination (CCE)' : 'Civil Services (Preliminary) Examination';
      const examCycle = paper.examCycle || (paper.exam === 'BPSC' ? (paper.id.includes('70th') ? '70th CCE' : '69th CCE') : String(paper.year));
      const paperName = paper.paperName || (paper as any).paperTitle || paper.paper;
      const paperCode = paper.paperCode || (paper.exam === 'BPSC' ? 'BPSC-GS' : (paper.paper === 'CSAT' ? 'CSP-CSAT' : 'CSP-GS1'));
      const officialPaperUrl = paper.officialPaperUrl || paper.officialSourceUrl;

      await pool.query(`
        INSERT INTO public.pyq_papers (
          id, exam, exam_name, year, exam_cycle, stage, paper, paper_name, paper_title, paper_code,
          source_type, official_source_url, official_paper_url, source_domain,
          expected_question_count, actual_question_count, verified_question_count,
          verification_status, answer_key_status, language, marks_per_correct,
          negative_marking, duration_minutes, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, 'OFFICIAL_COMMISSION', $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          exam = EXCLUDED.exam,
          exam_name = EXCLUDED.exam_name,
          year = EXCLUDED.year,
          exam_cycle = EXCLUDED.exam_cycle,
          stage = EXCLUDED.stage,
          paper = EXCLUDED.paper,
          paper_name = EXCLUDED.paper_name,
          paper_title = EXCLUDED.paper_name,
          paper_code = EXCLUDED.paper_code,
          source_type = 'OFFICIAL_COMMISSION',
          official_source_url = EXCLUDED.official_source_url,
          official_paper_url = EXCLUDED.official_paper_url,
          source_domain = EXCLUDED.source_domain,
          expected_question_count = EXCLUDED.expected_question_count,
          actual_question_count = EXCLUDED.actual_question_count,
          verified_question_count = EXCLUDED.verified_question_count,
          verification_status = EXCLUDED.verification_status,
          answer_key_status = EXCLUDED.answer_key_status,
          updated_at = NOW();
      `, [
        paper.id,
        paper.exam,
        examName,
        paper.year,
        examCycle,
        paper.stage,
        paper.paper,
        paperName,
        paperCode,
        paper.officialSourceUrl,
        officialPaperUrl,
        sourceDomain,
        paper.expectedQuestionCount,
        paper.questions.length,
        paper.questions.length,
        paper.questions.length >= paper.expectedQuestionCount ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE',
        paper.answerKeyStatus || 'OFFICIAL_KEY_VERIFIED',
        paper.language || 'bilingual',
        paper.marksPerCorrect !== undefined ? paper.marksPerCorrect : (paper.exam === 'BPSC' ? 1.0 : (paper.paper === 'CSAT' ? 2.5 : 2.0)),
        paper.negativeMarking !== undefined ? paper.negativeMarking : (paper.exam === 'BPSC' ? 0.333 : (paper.paper === 'CSAT' ? 0.833 : 0.666)),
        paper.durationMinutes || 120
      ]);

      // Remove any stale / synthetic questions for this paper that are not in current dataset
      if (paper.questions.length > 0) {
        const validQNums = paper.questions.map(q => q.questionNumber);
        const placeholders = validQNums.map((_, i) => `$${i + 2}`).join(', ');
        await pool.query(
          `DELETE FROM public.pyq_questions WHERE paper_id = $1 AND question_number NOT IN (${placeholders})`,
          [paper.id, ...validQNums]
        );
      } else {
        await pool.query(`DELETE FROM public.pyq_questions WHERE paper_id = $1`, [paper.id]);
      }

      // Seed each question for this paper
      for (const q of paper.questions) {
        const questionId = `${paper.id}_q${String(q.questionNumber).padStart(3, '0')}`;
        const sourcePage = q.sourcePage || `Official Paper Page ${q.sourcePageNumber || Math.ceil(q.questionNumber / 8)}`;
        
        await pool.query(`
          INSERT INTO public.pyq_questions (
            id, paper_id, question_number, question_text, question_en, question_hi,
            question_type, statements, statements_hi, match_data, match_data_hi,
            options, options_en, options_hi, official_answer, official_answer_source,
            solution, solution_source, topic, subject, subject_id,
            gs_paper, prelims_area, difficulty, source_page, source_page_number,
            official_paper_url, source_verification_status, answer_verification_status,
            verification_status, source_type, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26,
            $27, $28, $29, $30, 'OFFICIAL_COMMISSION', NOW()
          )
          ON CONFLICT (paper_id, question_number) DO UPDATE SET
            question_text = EXCLUDED.question_text,
            question_en = EXCLUDED.question_en,
            question_hi = EXCLUDED.question_hi,
            question_type = EXCLUDED.question_type,
            statements = EXCLUDED.statements,
            statements_hi = EXCLUDED.statements_hi,
            match_data = EXCLUDED.match_data,
            match_data_hi = EXCLUDED.match_data_hi,
            options = EXCLUDED.options,
            options_en = EXCLUDED.options_en,
            options_hi = EXCLUDED.options_hi,
            official_answer = EXCLUDED.official_answer,
            official_answer_source = EXCLUDED.official_answer_source,
            solution = EXCLUDED.solution,
            solution_source = EXCLUDED.solution_source,
            topic = EXCLUDED.topic,
            subject = EXCLUDED.subject,
            subject_id = EXCLUDED.subject_id,
            gs_paper = EXCLUDED.gs_paper,
            prelims_area = EXCLUDED.prelims_area,
            difficulty = EXCLUDED.difficulty,
            source_page = EXCLUDED.source_page,
            source_page_number = EXCLUDED.source_page_number,
            official_paper_url = EXCLUDED.official_paper_url,
            source_verification_status = EXCLUDED.source_verification_status,
            answer_verification_status = EXCLUDED.answer_verification_status,
            verification_status = EXCLUDED.verification_status,
            source_type = 'OFFICIAL_COMMISSION',
            updated_at = NOW();
        `, [
          questionId,
          paper.id,
          q.questionNumber,
          q.questionText,
          q.questionEn || q.questionText,
          q.questionHi || null,
          q.questionType || 'SINGLE_CHOICE',
          JSON.stringify(q.statements || []),
          JSON.stringify(q.statementsHi || []),
          JSON.stringify(q.matchData || {}),
          JSON.stringify(q.matchDataHi || {}),
          JSON.stringify(q.options),
          JSON.stringify(q.optionsEn || q.options),
          JSON.stringify(q.optionsHi || q.options),
          q.officialAnswer,
          q.officialAnswerSource || 'Official Commission Master Answer Key',
          q.solution,
          q.solutionSource || 'IKSHOVIA Subject Expert & Official References',
          q.topic || null,
          q.subject || null,
          q.subjectId || null,
          q.gsPaper || null,
          q.prelimsArea || null,
          q.difficulty || 'MEDIUM',
          sourcePage,
          q.sourcePageNumber || null,
          q.officialPaperUrl || officialPaperUrl,
          q.sourceVerificationStatus || 'OFFICIAL_VERIFIED',
          q.answerVerificationStatus || 'OFFICIAL_VERIFIED',
          q.verificationStatus || 'OFFICIAL_VERIFIED'
        ]);

        // Sync to public.questions for global practice/search
        const validSubjects = ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_environment', 'sub_security_ir', 'sub_ethics', 'sub_bihar', 'sub_csat', 'sub_ca'];
        let safeSubjectId = q.subjectId || 'sub_polity';
        if (!validSubjects.includes(safeSubjectId)) {
          if (safeSubjectId === 'sub_science') safeSubjectId = 'sub_environment';
          else if (safeSubjectId === 'sub_current') safeSubjectId = 'sub_ca';
          else safeSubjectId = 'sub_polity';
        }

        await pool.query(`
          INSERT INTO public.questions (
            id, subject_id, topic_id, concept_id, type,
            question, question_en, question_hi,
            options, options_en, options_hi,
            correct_answer, explanation, explanation_en, explanation_hi,
            available_languages, difficulty, exam_tag, pyq_year,
            exam, paper, question_number, is_pyq, source_type, source, verified_status,
            is_published, status, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18, $19,
            $20, $21, $22, $23, 'OFFICIAL_COMMISSION', $24, $25,
            $26, $27, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            question = EXCLUDED.question,
            question_en = EXCLUDED.question_en,
            question_hi = EXCLUDED.question_hi,
            options = EXCLUDED.options,
            options_en = EXCLUDED.options_en,
            options_hi = EXCLUDED.options_hi,
            correct_answer = EXCLUDED.correct_answer,
            explanation = EXCLUDED.explanation,
            difficulty = EXCLUDED.difficulty,
            exam_tag = EXCLUDED.exam_tag,
            pyq_year = EXCLUDED.pyq_year,
            exam = EXCLUDED.exam,
            paper = EXCLUDED.paper,
            question_number = EXCLUDED.question_number,
            is_pyq = EXCLUDED.is_pyq,
            source_type = 'OFFICIAL_COMMISSION',
            source = EXCLUDED.source,
            verified_status = EXCLUDED.verified_status,
            is_published = EXCLUDED.is_published,
            status = EXCLUDED.status,
            updated_at = NOW();
        `, [
          questionId,
          safeSubjectId,
          'top_rights',
          'c_art21',
          'MCQ',
          q.questionText,
          q.questionEn || q.questionText,
          q.questionHi || null,
          JSON.stringify(q.options),
          JSON.stringify(q.optionsEn || q.options),
          JSON.stringify(q.optionsHi || q.options),
          q.officialAnswer,
          q.solution,
          q.solution,
          q.solution,
          JSON.stringify(['en', 'hi']),
          q.difficulty || 'MEDIUM',
          `${paper.exam} ${examCycle} (${paper.paper})`,
          paper.year,
          paper.exam,
          paper.paper,
          q.questionNumber,
          true,
          officialPaperUrl || paper.officialSourceUrl,
          'VERIFIED_PYQ',
          true,
          'PUBLISHED'
        ]);
      }

      await this.recalculatePaperCounts(paper.id);
    }

    console.log('[PYQ Repository] Official papers repository synchronized.');
  }

  async recalculatePaperCounts(paperId: string): Promise<void> {
    const res = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN verification_status = 'OFFICIAL_VERIFIED' THEN 1 END) as verified_count
       FROM public.pyq_questions 
       WHERE paper_id = $1`,
      [paperId]
    );

    const paperRow = await pool.query('SELECT expected_question_count FROM public.pyq_papers WHERE id = $1', [paperId]);
    if (paperRow.rows.length === 0) return;

    const totalCount = Number(res.rows[0].total_count || 0);
    const verifiedCount = Number(res.rows[0].verified_count || 0);
    const expectedCount = Number(paperRow.rows[0].expected_question_count || 0);

    const verificationStatus = (verifiedCount >= expectedCount && expectedCount > 0) ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE';

    await pool.query(
      `UPDATE public.pyq_papers 
       SET actual_question_count = $1, verified_question_count = $2, verification_status = $3, updated_at = NOW() 
       WHERE id = $4`,
      [totalCount, verifiedCount, verificationStatus, paperId]
    );
  }

  /**
   * Get full archive hierarchy: Exams -> Years / Cycles -> Papers with counts and verification status
   */
  async getArchive(): Promise<{
    exams: string[];
    papers: PyqPaperRecord[];
    cyclesByExam: Record<string, string[]>;
    yearsByExam: Record<string, number[]>;
    totalPapers: number;
    totalVerifiedQuestions: number;
    totalExpectedQuestions: number;
  }> {
    const res = await pool.query(`
      SELECT p.*,
             COALESCE(q.total_count, 0) as live_actual_count,
             COALESCE(q.verified_count, 0) as live_verified_count
      FROM public.pyq_papers p
      LEFT JOIN (
        SELECT paper_id, 
               COUNT(*) as total_count,
               COUNT(CASE WHEN verification_status = 'OFFICIAL_VERIFIED' THEN 1 END) as verified_count
        FROM public.pyq_questions 
        GROUP BY paper_id
      ) q ON p.id = q.paper_id
      WHERE p.source_type = 'OFFICIAL_COMMISSION'
      ORDER BY 
        CASE WHEN p.exam = 'UPSC CSE' THEN 1 ELSE 2 END,
        p.year DESC, 
        p.paper ASC
    `);

    const papers: PyqPaperRecord[] = res.rows.map(r => {
      const actualCount = Number(r.live_actual_count !== undefined ? r.live_actual_count : r.actual_question_count);
      const verifiedCount = Number(r.live_verified_count !== undefined ? r.live_verified_count : r.verified_question_count);
      const expectedCount = Number(r.expected_question_count);
      const verificationStatus = (verifiedCount >= expectedCount && expectedCount > 0) ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE';

      return {
        id: r.id,
        exam: r.exam,
        examName: r.exam_name || r.exam,
        year: Number(r.year),
        examCycle: r.exam_cycle || String(r.year),
        stage: r.stage,
        paper: r.paper,
        paperName: r.paper_name || r.paper_title || r.paper,
        paperCode: r.paper_code || '',
        sourceType: r.source_type || 'OFFICIAL_COMMISSION',
        officialSourceUrl: r.official_source_url,
        officialPaperUrl: r.official_paper_url || r.official_source_url,
        sourceDomain: r.source_domain || (r.official_source_url?.includes('bpsc') ? 'bpsc.bihar.gov.in' : 'upsc.gov.in'),
        expectedQuestionCount: expectedCount,
        actualQuestionCount: actualCount,
        verifiedQuestionCount: verifiedCount,
        verificationStatus: verificationStatus as any,
        answerKeyStatus: r.answer_key_status as any,
        language: r.language || 'bilingual',
        marksPerCorrect: r.marks_per_correct !== null && r.marks_per_correct !== undefined ? Number(r.marks_per_correct) : (r.exam === 'BPSC' ? 1.0 : (r.paper === 'CSAT' ? 2.5 : 2.0)),
        negativeMarking: r.negative_marking !== null && r.negative_marking !== undefined ? Number(r.negative_marking) : (r.exam === 'BPSC' ? 0.333 : (r.paper === 'CSAT' ? 0.833 : 0.666)),
        durationMinutes: Number(r.duration_minutes || 120),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    const examSet = new Set<string>();
    const cyclesByExam: Record<string, string[]> = {};
    const yearsByExam: Record<string, number[]> = {};
    let totalVerifiedQuestions = 0;
    let totalExpectedQuestions = 0;

    for (const p of papers) {
      examSet.add(p.exam);
      if (!cyclesByExam[p.exam]) cyclesByExam[p.exam] = [];
      if (!cyclesByExam[p.exam].includes(p.examCycle)) cyclesByExam[p.exam].push(p.examCycle);

      if (!yearsByExam[p.exam]) yearsByExam[p.exam] = [];
      if (!yearsByExam[p.exam].includes(p.year)) yearsByExam[p.exam].push(p.year);

      totalVerifiedQuestions += p.verifiedQuestionCount;
      totalExpectedQuestions += p.expectedQuestionCount;
    }

    return {
      exams: Array.from(examSet),
      papers,
      cyclesByExam,
      yearsByExam,
      totalPapers: papers.length,
      totalVerifiedQuestions,
      totalExpectedQuestions
    };
  }

  async listPapers(filters?: { exam?: string; year?: number | string; cycle?: string; stage?: string; paper?: string; sourceType?: string }): Promise<PyqPaperRecord[]> {
    let whereClauses: string[] = [];
    let params: any[] = [];
    let idx = 1;

    const targetSourceType = filters?.sourceType || 'OFFICIAL_COMMISSION';
    if (targetSourceType !== 'ALL') {
      whereClauses.push(`p.source_type = $${idx++}`);
      params.push(targetSourceType);
    }

    if (filters?.exam && filters.exam !== 'All') {
      whereClauses.push(`p.exam ILIKE $${idx++}`);
      params.push(filters.exam);
    }
    if (filters?.cycle && filters.cycle !== 'All') {
      whereClauses.push(`p.exam_cycle ILIKE $${idx++}`);
      params.push(filters.cycle);
    }
    if (filters?.year && String(filters.year) !== 'All') {
      whereClauses.push(`p.year = $${idx++}`);
      params.push(Number(filters.year));
    }
    if (filters?.stage && filters.stage !== 'All Stages') {
      whereClauses.push(`p.stage ILIKE $${idx++}`);
      params.push(filters.stage);
    }
    if (filters?.paper && filters.paper !== 'All Papers') {
      whereClauses.push(`p.paper ILIKE $${idx++}`);
      params.push(filters.paper);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT p.*,
              COALESCE(q.total_count, 0) as live_actual_count,
              COALESCE(q.verified_count, 0) as live_verified_count
       FROM public.pyq_papers p
       LEFT JOIN (
         SELECT paper_id, 
                COUNT(*) as total_count,
                COUNT(CASE WHEN verification_status = 'OFFICIAL_VERIFIED' THEN 1 END) as verified_count
         FROM public.pyq_questions 
         GROUP BY paper_id
       ) q ON p.id = q.paper_id
       ${whereSql} 
       ORDER BY p.year DESC, p.exam ASC, p.paper ASC`,
      params
    );

    return res.rows.map(r => {
      const actualCount = Number(r.live_actual_count !== undefined ? r.live_actual_count : r.actual_question_count);
      const verifiedCount = Number(r.live_verified_count !== undefined ? r.live_verified_count : r.verified_question_count);
      const expectedCount = Number(r.expected_question_count);
      const verificationStatus = (verifiedCount >= expectedCount && expectedCount > 0) ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE';

      return {
        id: r.id,
        exam: r.exam,
        examName: r.exam_name || r.exam,
        year: Number(r.year),
        examCycle: r.exam_cycle || String(r.year),
        stage: r.stage,
        paper: r.paper,
        paperName: r.paper_name || r.paper_title || r.paper,
        paperCode: r.paper_code || '',
        officialSourceUrl: r.official_source_url,
        officialPaperUrl: r.official_paper_url || r.official_source_url,
        sourceDomain: r.source_domain || (r.official_source_url?.includes('bpsc') ? 'bpsc.bihar.gov.in' : 'upsc.gov.in'),
        expectedQuestionCount: expectedCount,
        actualQuestionCount: actualCount,
        verifiedQuestionCount: verifiedCount,
        verificationStatus: verificationStatus as any,
        answerKeyStatus: r.answer_key_status as any,
        language: r.language || 'bilingual',
        marksPerCorrect: r.marks_per_correct !== null && r.marks_per_correct !== undefined ? Number(r.marks_per_correct) : (r.exam === 'BPSC' ? 1.0 : (r.paper === 'CSAT' ? 2.5 : 2.0)),
        negativeMarking: r.negative_marking !== null && r.negative_marking !== undefined ? Number(r.negative_marking) : (r.exam === 'BPSC' ? 0.333 : (r.paper === 'CSAT' ? 0.833 : 0.666)),
        durationMinutes: Number(r.duration_minutes || 120),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });
  }

  async getPaperById(paperId: string): Promise<PyqPaperRecord | null> {
    const res = await pool.query(`
      SELECT p.*,
             COALESCE(q.total_count, 0) as live_actual_count,
             COALESCE(q.verified_count, 0) as live_verified_count
      FROM public.pyq_papers p
      LEFT JOIN (
        SELECT paper_id, 
               COUNT(*) as total_count,
               COUNT(CASE WHEN verification_status = 'OFFICIAL_VERIFIED' THEN 1 END) as verified_count
        FROM public.pyq_questions 
        GROUP BY paper_id
      ) q ON p.id = q.paper_id
      WHERE p.id = $1
    `, [paperId]);

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const actualCount = Number(r.live_actual_count !== undefined ? r.live_actual_count : r.actual_question_count);
    const verifiedCount = Number(r.live_verified_count !== undefined ? r.live_verified_count : r.verified_question_count);
    const expectedCount = Number(r.expected_question_count);
    const verificationStatus = (verifiedCount >= expectedCount && expectedCount > 0) ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE';

    return {
      id: r.id,
      exam: r.exam,
      examName: r.exam_name || r.exam,
      year: Number(r.year),
      examCycle: r.exam_cycle || String(r.year),
      stage: r.stage,
      paper: r.paper,
      paperName: r.paper_name || r.paper_title || r.paper,
      paperCode: r.paper_code || '',
      officialSourceUrl: r.official_source_url,
      officialPaperUrl: r.official_paper_url || r.official_source_url,
      sourceDomain: r.source_domain || (r.official_source_url?.includes('bpsc') ? 'bpsc.bihar.gov.in' : 'upsc.gov.in'),
      expectedQuestionCount: expectedCount,
      actualQuestionCount: actualCount,
      verifiedQuestionCount: verifiedCount,
      verificationStatus: verificationStatus as any,
      answerKeyStatus: r.answer_key_status as any,
      language: r.language || 'bilingual',
      marksPerCorrect: r.marks_per_correct !== null && r.marks_per_correct !== undefined ? Number(r.marks_per_correct) : (r.exam === 'BPSC' ? 1.0 : (r.paper === 'CSAT' ? 2.5 : 2.0)),
      negativeMarking: r.negative_marking !== null && r.negative_marking !== undefined ? Number(r.negative_marking) : (r.exam === 'BPSC' ? 0.333 : (r.paper === 'CSAT' ? 0.833 : 0.666)),
      durationMinutes: Number(r.duration_minutes || 120),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  async getQuestionsByPaperId(paperId: string): Promise<Question[]> {
    const res = await pool.query(`
      SELECT 
        q.*,
        p.exam as paper_exam,
        p.year as paper_year,
        p.exam_cycle as paper_cycle,
        p.paper as paper_type,
        p.paper_name as paper_name,
        p.official_source_url as paper_source_url,
        p.official_paper_url as paper_pdf_url,
        p.source_domain as paper_domain
      FROM public.pyq_questions q
      JOIN public.pyq_papers p ON q.paper_id = p.id
      WHERE q.paper_id = $1
      ORDER BY q.question_number ASC
    `, [paperId]);

    return res.rows.map(r => this.mapRowToQuestion(r));
  }

  async getExams(): Promise<string[]> {
    const papers = await this.listPapers();
    const set = new Set<string>();
    papers.forEach(p => set.add(p.exam));
    return Array.from(set);
  }

  async getYears(exam?: string): Promise<number[]> {
    const papers = await this.listPapers(exam ? { exam } : undefined);
    const set = new Set<number>();
    papers.forEach(p => set.add(p.year));
    return Array.from(set).sort((a, b) => b - a);
  }

  async getMetadata(): Promise<any> {
    const papers = await this.listPapers();
    const exams = Array.from(new Set(papers.map(p => p.exam)));
    const years = Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b - a);
    const stages = Array.from(new Set(papers.map(p => p.stage)));
    const paperNames = Array.from(new Set(papers.map(p => p.paper)));
    const totalQuestions = papers.reduce((sum, p) => sum + p.actualQuestionCount, 0);

    return {
      exams: ['All', ...exams],
      years,
      stages: ['All Stages', ...stages],
      papers: ['All Papers', ...paperNames],
      papersList: papers,
      totalQuestions,
      completenessSummary: {
        totalPapers: papers.length,
        completePapers: papers.filter(p => p.verificationStatus === 'OFFICIAL_VERIFIED').length,
        incompletePapers: papers.filter(p => p.verificationStatus !== 'OFFICIAL_VERIFIED').length,
      }
    };
  }

  async validatePaperCompleteness(paperId: string): Promise<any> {
    const paper = await this.getPaperById(paperId);
    if (!paper) return null;
    const questions = await this.getQuestionsByPaperId(paperId);
    const actualNumbers = questions.map(q => q.questionNumber || 0).filter(n => n > 0).sort((a, b) => a - b);
    const missing: number[] = [];
    for (let i = 1; i <= paper.expectedQuestionCount; i++) {
      if (!actualNumbers.includes(i)) missing.push(i);
    }
    const isComplete = missing.length === 0 && actualNumbers.length >= paper.expectedQuestionCount;

    return {
      paperId: paper.id,
      paperTitle: paper.paperName,
      exam: paper.exam,
      year: paper.year,
      stage: paper.stage,
      paper: paper.paper,
      expectedQuestionCount: paper.expectedQuestionCount,
      actualQuestionCount: actualNumbers.length,
      missingQuestionNumbers: missing,
      duplicateQuestionNumbers: [],
      isComplete,
      status: isComplete ? 'COMPLETE' : 'INCOMPLETE'
    };
  }

  async listQuestions(params: {
    paperId?: string;
    exam?: string;
    cycle?: string;
    year?: number | string;
    stage?: string;
    paper?: string;
    subjectId?: string;
    topicId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Question[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
    paper?: PyqPaperRecord | null;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(150, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    let targetPaper: PyqPaperRecord | null = null;
    if (params.paperId) {
      targetPaper = await this.getPaperById(params.paperId);
      if (!targetPaper) {
        return {
          items: [],
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
          paper: null
        };
      }
    } else if (params.exam || params.cycle || params.year || params.paper) {
      const papers = await this.listPapers({
        exam: params.exam,
        cycle: params.cycle,
        year: params.year,
        stage: params.stage,
        paper: params.paper
      });
      if (papers.length > 0) {
        targetPaper = papers[0];
      }
    }

    if (!targetPaper && !params.exam && !params.cycle && !params.year && !params.paper) {
      const allPapers = await this.listPapers();
      targetPaper = allPapers.find(p => p.verifiedQuestionCount > 0) || allPapers[0] || null;
    }

    let whereClauses: string[] = [];
    let queryParams: any[] = [];
    let idx = 1;

    if (targetPaper) {
      whereClauses.push(`q.paper_id = $${idx++}`);
      queryParams.push(targetPaper.id);
    }

    if (params.subjectId) {
      whereClauses.push(`q.subject_id = $${idx++}`);
      queryParams.push(params.subjectId);
    }

    if (params.topicId) {
      whereClauses.push(`q.topic = $${idx++}`);
      queryParams.push(params.topicId);
    }

    if (params.search) {
      whereClauses.push(`(q.question_text ILIKE $${idx} OR q.solution ILIKE $${idx})`);
      queryParams.push(`%${params.search}%`);
      idx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM public.pyq_questions q ${whereSql}`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(`
      SELECT 
        q.*,
        p.exam as paper_exam,
        p.year as paper_year,
        p.exam_cycle as paper_cycle,
        p.paper as paper_type,
        p.paper_name as paper_name,
        p.official_source_url as paper_source_url,
        p.official_paper_url as paper_pdf_url,
        p.source_domain as paper_domain
      FROM public.pyq_questions q
      JOIN public.pyq_papers p ON q.paper_id = p.id
      ${whereSql}
      ORDER BY q.question_number ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...queryParams, limit, offset]);

    const items = dataRes.rows.map(r => this.mapRowToQuestion(r));

    return {
      items,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: offset + items.length < totalCount,
      paper: targetPaper
    };
  }

  /**
   * Get a random verified PYQ for instant practice
   */
  async getRandomQuestion(filters?: { exam?: string; year?: number | string; paper?: string; subjectId?: string }): Promise<Question | null> {
    let whereClauses: string[] = ["q.verification_status = 'OFFICIAL_VERIFIED'", "p.source_type = 'OFFICIAL_COMMISSION'"];
    let params: any[] = [];
    let idx = 1;

    if (filters?.exam && filters.exam !== 'All') {
      whereClauses.push(`p.exam ILIKE $${idx++}`);
      params.push(filters.exam);
    }
    if (filters?.year && String(filters.year) !== 'All') {
      whereClauses.push(`p.year = $${idx++}`);
      params.push(Number(filters.year));
    }
    if (filters?.paper && filters.paper !== 'All Papers') {
      whereClauses.push(`p.paper ILIKE $${idx++}`);
      params.push(filters.paper);
    }
    if (filters?.subjectId) {
      whereClauses.push(`q.subject_id = $${idx++}`);
      params.push(filters.subjectId);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const res = await pool.query(`
      SELECT 
        q.*,
        p.exam as paper_exam,
        p.year as paper_year,
        p.exam_cycle as paper_cycle,
        p.paper as paper_type,
        p.paper_name as paper_name,
        p.official_source_url as paper_source_url,
        p.official_paper_url as paper_pdf_url,
        p.source_domain as paper_domain
      FROM public.pyq_questions q
      JOIN public.pyq_papers p ON q.paper_id = p.id
      ${whereSql}
      ORDER BY RANDOM()
      LIMIT 1
    `, params);

    if (res.rows.length === 0) return null;
    return this.mapRowToQuestion(res.rows[0]);
  }

  /**
   * Audit all papers in database against official expectations
   */
  async findCrossYearDuplicates(): Promise<{
    paper1: string;
    qnum1: number;
    paper2: string;
    qnum2: number;
    questionText: string;
  }[]> {
    const res = await pool.query(`
      SELECT 
        q1.paper_id as paper1, 
        q1.question_number as qnum1,
        q2.paper_id as paper2, 
        q2.question_number as qnum2,
        q1.question_text as "questionText"
      FROM public.pyq_questions q1
      JOIN public.pyq_questions q2 
        ON q1.id < q2.id 
        AND q1.paper_id != q2.paper_id 
        AND LOWER(TRIM(q1.question_text)) = LOWER(TRIM(q2.question_text))
    `);
    return res.rows;
  }

  async getAuditReport(): Promise<{
    reports: PaperAuditReport[];
    summary: {
      totalPapers: number;
      completeVerifiedPapers: number;
      totalExpectedQuestions: number;
      totalExtractedQuestions: number;
      totalVerifiedQuestions: number;
      overallVerificationRate: number;
    };
  }> {
    const papers = await this.listPapers();
    const reports: PaperAuditReport[] = [];

    let totalExpected = 0;
    let totalExtracted = 0;
    let totalVerified = 0;
    let completePapers = 0;

    for (const paper of papers) {
      const qRes = await pool.query(
        'SELECT question_number, verification_status FROM public.pyq_questions WHERE paper_id = $1 ORDER BY question_number ASC',
        [paper.id]
      );

      const actualNumbers = qRes.rows.map(r => Number(r.question_number));
      const verifiedCount = qRes.rows.filter(r => r.verification_status === 'OFFICIAL_VERIFIED').length;
      const actualSet = new Set<number>();
      const duplicateNumbers: number[] = [];
      const missingNumbers: number[] = [];

      for (const num of actualNumbers) {
        if (actualSet.has(num)) {
          duplicateNumbers.push(num);
        } else {
          actualSet.add(num);
        }
      }

      for (let i = 1; i <= paper.expectedQuestionCount; i++) {
        if (!actualSet.has(i)) {
          missingNumbers.push(i);
        }
      }

      const isComplete = missingNumbers.length === 0 && actualNumbers.length === paper.expectedQuestionCount && verifiedCount === paper.expectedQuestionCount;
      if (isComplete) completePapers++;

      totalExpected += paper.expectedQuestionCount;
      totalExtracted += actualNumbers.length;
      totalVerified += verifiedCount;

      const dataAccuracyRate = paper.expectedQuestionCount > 0 ? (verifiedCount / paper.expectedQuestionCount) * 100 : 0;

      reports.push({
        paperId: paper.id,
        exam: paper.exam,
        examCycle: paper.examCycle,
        year: paper.year,
        paper: paper.paper,
        paperName: paper.paperName,
        sourceDomain: paper.sourceDomain,
        officialSourceUrl: paper.officialSourceUrl,
        officialPaperUrl: paper.officialPaperUrl,
        expectedQuestionCount: paper.expectedQuestionCount,
        actualQuestionCount: actualNumbers.length,
        verifiedQuestionCount: verifiedCount,
        missingCount: missingNumbers.length,
        duplicateCount: duplicateNumbers.length,
        missingQuestionNumbers: missingNumbers.slice(0, 10),
        duplicateQuestionNumbers: duplicateNumbers,
        verificationStatus: isComplete ? 'OFFICIAL_VERIFIED' : 'INCOMPLETE',
        answerKeyStatus: paper.answerKeyStatus,
        dataAccuracyRate: Math.round(dataAccuracyRate * 10) / 10
      });
    }

    return {
      reports,
      summary: {
        totalPapers: papers.length,
        completeVerifiedPapers: completePapers,
        totalExpectedQuestions: totalExpected,
        totalExtractedQuestions: totalExtracted,
        totalVerifiedQuestions: totalVerified,
        overallVerificationRate: totalExpected > 0 ? Math.round((totalVerified / totalExpected) * 1000) / 10 : 0
      }
    };
  }

  /**
   * Get Ingestion Pipeline Status and State Breakdown
   */
  async getIngestionStatus(): Promise<any> {
    const papersRes = await pool.query(`
      SELECT id, exam, year, exam_cycle, stage, paper, paper_name, status,
             verification_status, expected_question_count, actual_question_count,
             verified_question_count, document_hash, official_paper_url,
             first_discovered_at, last_checked_at, last_ingested_at
      FROM public.pyq_papers
      ORDER BY exam, year DESC, paper ASC
    `);

    const runsRes = await pool.query(`
      SELECT * FROM public.pyq_ingestion_runs
      ORDER BY started_at DESC
      LIMIT 10
    `);

    const papers = papersRes.rows;
    const runs = runsRes.rows;

    const stateBreakdown: Record<string, number> = {};
    for (const p of papers) {
      const state = p.status || 'PUBLISHED';
      stateBreakdown[state] = (stateBreakdown[state] || 0) + 1;
    }

    return {
      totalPapers: papers.length,
      publishedPapers: papers.filter(p => p.status === 'PUBLISHED' || p.verification_status === 'OFFICIAL_VERIFIED').length,
      stateBreakdown,
      latestRuns: runs,
      papers
    };
  }

  private mapRowToQuestion(r: any): Question {
    const rawMatchData = typeof r.match_data === 'string' ? JSON.parse(r.match_data) : (r.match_data || null);
    const rawMatchDataHi = typeof r.match_data_hi === 'string' ? JSON.parse(r.match_data_hi) : (r.match_data_hi || null);
    const hasValidMatchData = rawMatchData && rawMatchData.leftColumn && rawMatchData.leftColumn.length > 0;

    return {
      id: r.id,
      subjectId: r.subject_id || 'sub_polity',
      topicId: r.topic || 'top_rights',
      conceptId: 'c_general',
      type: 'MCQ',
      questionType: r.question_type || (hasValidMatchData ? 'MATCH_FOLLOWING' : 'SINGLE_CHOICE'),
      question: r.question_text,
      question_en: r.question_en || r.question_text,
      question_hi: r.question_hi || r.question_text,
      statements: typeof r.statements === 'string' ? JSON.parse(r.statements) : (r.statements || []),
      statements_hi: typeof r.statements_hi === 'string' ? JSON.parse(r.statements_hi) : (r.statements_hi || []),
      matchData: hasValidMatchData ? rawMatchData : undefined,
      matchData_hi: rawMatchDataHi && rawMatchDataHi.leftColumn?.length > 0 ? rawMatchDataHi : undefined,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || []),
      options_en: typeof r.options_en === 'string' ? JSON.parse(r.options_en) : (r.options_en || r.options || []),
      options_hi: typeof r.options_hi === 'string' ? JSON.parse(r.options_hi) : (r.options_hi || r.options || []),
      correctAnswer: r.official_answer,
      explanation: r.solution,
      explanation_en: r.solution,
      explanation_hi: r.solution,
      availableLanguages: ['en', 'hi'],
      difficulty: r.difficulty || 'MEDIUM',
      examTag: `${r.paper_exam} ${r.paper_cycle || r.paper_year} (${r.paper_type})`,
      pyqYear: Number(r.paper_year),
      exam: r.paper_exam,
      paper: r.paper_type,
      questionNumber: Number(r.question_number),
      questionNum: Number(r.question_number),
      isPyq: true,
      sourceType: r.source_type || 'OFFICIAL_COMMISSION',
      source: r.official_paper_url || r.paper_pdf_url || r.paper_source_url || 'Official Commission Paper',
      sourceUrl: r.official_paper_url || r.paper_pdf_url || r.paper_source_url,
      sourceProvenance: {
        sourceName: `${r.paper_exam} Official Commission`,
        sourceType: 'COMMISSION_OFFICIAL',
        adapter: r.paper_domain?.includes('bpsc') ? 'bpsc' : 'upsc'
      },
      verifiedStatus: r.verification_status === 'OFFICIAL_VERIFIED' ? 'VERIFIED_PYQ' : 'UNVERIFIED',
      isPublished: true,
      status: 'PUBLISHED'
    };
  }
}

export const pyqRepository = PyqRepository.getInstance();

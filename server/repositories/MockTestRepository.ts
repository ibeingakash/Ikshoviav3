import pool from '../db/pool.js';
import { MockTest, MockAttempt, Question } from '../../src/types/index.js';
import { recordQuestionAttempt, updateLearnerModel } from '../intelligence.js';
import { resolveCanonicalSourceOrigin } from '../utils/provenance.js';

export interface MockAnswerRecord {
  id: string;
  mockAttemptId: string;
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  markedForReview: boolean;
}

export class MockTestRepository {
  private schemaChecked = false;
  private defaultTestsChecked = false;

  async ensureSchema(): Promise<void> {
    if (this.schemaChecked) return;
    try {
      await pool.query(`
        ALTER TABLE public.mock_tests
        ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'IKSHOVIA_CREATED',
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS deleted_by TEXT;
      `);
      this.schemaChecked = true;
    } catch (err: any) {
      console.warn('[MockTestRepository] ensureSchema notice:', err.message);
    }
  }

  async ensureDefaultTests(): Promise<void> {
    if (this.defaultTestsChecked) return;
    this.defaultTestsChecked = true;
    await this.ensureSchema();
    try {
      const countRes = await pool.query('SELECT COUNT(*) FROM public.mock_tests WHERE is_published = true');
      const count = parseInt(countRes.rows[0]?.count || '0', 10);
      if (count > 0) return;

      console.log('[MockTestRepository] Seeding standard IKSHOVIA Full-Length & Subject Mock Tests...');

      const defaultMocks = [
        {
          id: 'mock_flt_01',
          title: 'UPSC CSE Prelims 2026 - All India Full Mock 01 (General Studies)',
          type: 'FULL',
          subjectIds: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_ca', 'sub_scitech'],
          durationMinutes: 120,
          totalQuestions: 100,
          totalMarks: 200,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_flt_02',
          title: 'UPSC CSE Prelims 2026 - All India Full Mock 02 (Polity & Governance Heavy)',
          type: 'FULL',
          subjectIds: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_ca'],
          durationMinutes: 120,
          totalQuestions: 100,
          totalMarks: 200,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_bpsc_01',
          title: '71st BPSC CCE Prelims Full Mock 01 (General Studies & Bihar Special)',
          type: 'FULL',
          subjectIds: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_bihar_special'],
          durationMinutes: 120,
          totalQuestions: 150,
          totalMarks: 150,
          negativeMarkingRate: 0.33,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_subj_polity',
          title: 'Indian Polity & Constitutional Dynamics - Sectional Mock',
          type: 'SUBJECT',
          subjectIds: ['sub_polity'],
          durationMinutes: 60,
          totalQuestions: 50,
          totalMarks: 100,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_subj_economy',
          title: 'Indian Economy, Banking & Fiscal Policy - Sectional Mock',
          type: 'SUBJECT',
          subjectIds: ['sub_economy'],
          durationMinutes: 60,
          totalQuestions: 50,
          totalMarks: 100,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_subj_history',
          title: 'Modern Indian History & Freedom Struggle - Sectional Mock',
          type: 'SUBJECT',
          subjectIds: ['sub_history'],
          durationMinutes: 60,
          totalQuestions: 50,
          totalMarks: 100,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_subj_geography',
          title: 'Physical Geography & Environment - Sectional Mock',
          type: 'SUBJECT',
          subjectIds: ['sub_geography'],
          durationMinutes: 60,
          totalQuestions: 50,
          totalMarks: 100,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_sprint_rights',
          title: 'Fundamental Rights & Constitutional Writs - Rapid Topic Sprint',
          type: 'QUICK',
          subjectIds: ['sub_polity'],
          durationMinutes: 20,
          totalQuestions: 20,
          totalMarks: 40,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
        {
          id: 'mock_sprint_macro',
          title: 'Monetary Policy & Inflation Targeting - Rapid Topic Sprint',
          type: 'QUICK',
          subjectIds: ['sub_economy'],
          durationMinutes: 20,
          totalQuestions: 20,
          totalMarks: 40,
          negativeMarkingRate: 0.66,
          sourceType: 'IKSHOVIA_CREATED',
        },
      ];

      for (const m of defaultMocks) {
        await pool.query(`
          INSERT INTO public.mock_tests (
            id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
            negative_marking_rate, source_type, is_published, created_at
          ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, true, NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            type = EXCLUDED.type,
            source_type = EXCLUDED.source_type,
            total_questions = EXCLUDED.total_questions,
            duration_minutes = EXCLUDED.duration_minutes;
        `, [
          m.id,
          m.title,
          m.type,
          JSON.stringify(m.subjectIds),
          m.durationMinutes,
          m.totalQuestions,
          m.totalMarks,
          m.negativeMarkingRate,
          m.sourceType,
        ]);
      }
      console.log('[MockTestRepository] Successfully initialized standard mock tests.');
    } catch (err: any) {
      console.warn('[MockTestRepository] Failed to seed default mock tests:', err.message);
    }
  }

  async getPublishedTests(filters?: { testType?: string; sourceType?: string }): Promise<MockTest[]> {
    let whereClauses: string[] = ['is_published = true', '(is_deleted IS NULL OR is_deleted = false)'];
    let params: any[] = [];
    let idx = 1;

    if (filters?.testType && filters.testType !== 'ALL') {
      whereClauses.push(`type = $${idx++}`);
      params.push(filters.testType);
    }

    if (filters?.sourceType && filters.sourceType !== 'ALL') {
      whereClauses.push(`source_type = $${idx++}`);
      params.push(filters.sourceType);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const res = await pool.query(`
      SELECT id, title, display_name, original_source_name, type, source_type, subject_ids,
             duration_minutes, total_questions, total_marks, negative_marking_rate,
             is_published, is_deleted, deleted_at, deleted_by, created_at
      FROM public.mock_tests
      ${whereSql}
      ORDER BY created_at DESC;
    `, params);
    return res.rows.map(this.mapRowToMockTest);
  }

  async getAllAdminTests(filters?: { testType?: string; sourceType?: string; includeArchived?: boolean }): Promise<MockTest[]> {
    let whereClauses: string[] = [];
    let params: any[] = [];
    let idx = 1;

    if (!filters?.includeArchived) {
      whereClauses.push('(mt.is_deleted IS NULL OR mt.is_deleted = false)');
    }

    if (filters?.testType && filters.testType !== 'ALL') {
      whereClauses.push(`mt.type = $${idx++}`);
      params.push(filters.testType);
    }

    if (filters?.sourceType && filters.sourceType !== 'ALL') {
      whereClauses.push(`mt.source_type = $${idx++}`);
      params.push(filters.sourceType);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
      SELECT mt.id, mt.title, mt.display_name, mt.original_source_name, mt.type, mt.source_type, mt.subject_ids,
             mt.duration_minutes, mt.total_questions, mt.total_marks, mt.negative_marking_rate,
             mt.is_published, mt.is_deleted, mt.deleted_at, mt.deleted_by, mt.created_at,
             COALESCE(att.attempt_count, 0)::integer AS attempt_count,
             COALESCE(mq.question_count, 0)::integer AS actual_question_count
      FROM public.mock_tests mt
      LEFT JOIN (
        SELECT mock_test_id, COUNT(*) AS attempt_count
        FROM public.mock_attempts
        GROUP BY mock_test_id
      ) att ON att.mock_test_id = mt.id
      LEFT JOIN (
        SELECT mock_test_id, COUNT(*) AS question_count
        FROM public.mock_questions
        GROUP BY mock_test_id
      ) mq ON mq.mock_test_id = mt.id
      ${whereSql}
      ORDER BY mt.created_at DESC;
    `;
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => ({
      ...this.mapRowToMockTest(r),
      attemptCount: r.attempt_count || 0,
      actualQuestionCount: r.actual_question_count || r.total_questions || 0,
      isDeleted: r.is_deleted ?? false,
      deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
      deletedBy: r.deleted_by || undefined,
    }));
  }

  async archiveOrDeleteTest(testId: string, actorId: string): Promise<{ success: boolean; testId: string; title: string; attemptsPreserved: number; message: string }> {
    const testRes = await pool.query('SELECT id, title, source_type FROM public.mock_tests WHERE id = $1', [testId]);
    if (testRes.rows.length === 0) {
      const err: any = new Error(`Mock test with id '${testId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const test = testRes.rows[0];

    // Backend protection rule: Never delete official commission tests
    if (test.source_type === 'OFFICIAL_COMMISSION' || testId.startsWith('pyq_paper_')) {
      const err: any = new Error('Official Commission tests are protected and cannot be deleted.');
      err.statusCode = 403;
      throw err;
    }

    // Check learner attempts count to confirm preservation
    const attemptsRes = await pool.query(
      'SELECT COUNT(*) FROM public.mock_attempts WHERE mock_test_id = $1',
      [testId]
    );
    const attemptsCount = parseInt(attemptsRes.rows[0]?.count || '0', 10);

    // Soft-delete / Archive the test record
    await pool.query(`
      UPDATE public.mock_tests
      SET is_published = false,
          is_deleted = true,
          deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2;
    `, [actorId, testId]);

    console.log(`[MockTestRepository] Safely archived mock test '${testId}' (${test.title}). Preserved ${attemptsCount} attempts and canonical questions.`);

    return {
      success: true,
      testId,
      title: test.title,
      attemptsPreserved: attemptsCount,
      message: `Mock test "${test.title}" safely archived. All ${attemptsCount} learner attempt history records and canonical questions remain fully preserved.`,
    };
  }

  async restoreTest(testId: string, actorId: string): Promise<{ success: boolean; testId: string; message: string }> {
    const testRes = await pool.query('SELECT id, title FROM public.mock_tests WHERE id = $1', [testId]);
    if (testRes.rows.length === 0) {
      const err: any = new Error(`Mock test with id '${testId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    await pool.query(`
      UPDATE public.mock_tests
      SET is_published = true,
          is_deleted = false,
          deleted_at = NULL,
          deleted_by = NULL
      WHERE id = $1;
    `, [testId]);

    return {
      success: true,
      testId,
      message: `Mock test "${testRes.rows[0].title}" restored to active catalog.`,
    };
  }

  async getTestById(id: string): Promise<MockTest | null> {
    const res = await pool.query(`
      SELECT id, title, display_name, original_source_name, type, source_type, subject_ids,
             duration_minutes, total_questions, total_marks, negative_marking_rate,
             is_published, is_deleted, deleted_at, deleted_by, created_at
      FROM public.mock_tests
      WHERE id = $1
    `, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToMockTest(res.rows[0]);
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    const test = await this.getTestById(testId);
    if (!test) return [];

    const res = await pool.query(`
      SELECT q.id, q.subject_id, q.topic_id, q.concept_id, q.type, q.question, q.question_en, q.question_hi,
             q.options, q.options_en, q.options_hi, q.correct_answer, q.explanation, q.explanation_en, q.explanation_hi,
             q.available_languages, q.difficulty, q.exam_tag, q.pyq_year, q.exam, q.paper, q.question_number,
             q.is_pyq, q.source_type, q.source, q.verified_status, q.is_published, q.status, q.question_type,
             q.statements, q.statements_hi, q.match_data, q.match_data_hi, mq.order_num
      FROM public.mock_questions mq
      JOIN public.questions q ON mq.question_id = q.id
      WHERE mq.mock_test_id = $1
      ORDER BY mq.order_num ASC;
    `, [testId]);

    const mappedQuestions = res.rows.map(this.mapRowToQuestion);
    if (mappedQuestions.length > 0) {
      return mappedQuestions;
    }

    // Fallback only if no questions were pre-linked in mock_questions
    const targetCount = test.totalQuestions || 10;
    let questionQuery = `
      SELECT id, subject_id, topic_id, concept_id, type, question, question_en, question_hi,
             options, options_en, options_hi, correct_answer, explanation, explanation_en, explanation_hi,
             available_languages, difficulty, exam_tag, pyq_year, exam, paper, question_number,
             is_pyq, source_type, source, verified_status, is_published, status, question_type,
             statements, statements_hi, match_data, match_data_hi
      FROM public.questions
      WHERE is_published = true
    `;
    const queryParams: any[] = [];

    if (test.sourceType) {
      queryParams.push(test.sourceType);
      questionQuery += ` AND source_type = $${queryParams.length}`;
    }

    if (test.subjectIds && test.subjectIds.length > 0) {
      queryParams.push(test.subjectIds);
      questionQuery += ` AND subject_id = ANY($${queryParams.length})`;
    }

    queryParams.push(targetCount);
    questionQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;

    const fallbackRes = await pool.query(questionQuery, queryParams);
    return fallbackRes.rows.map(this.mapRowToQuestion);
  }

  async createCustomMockTest(params: {
    userId?: string;
    title: string;
    type?: 'QUICK' | 'SUBJECT' | 'FULL';
    subjectIds?: string[];
    totalQuestions?: number;
    durationMinutes?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
    examTag?: string;
    questionIds?: string[];
    sourceType?: 'IKSHOVIA_CREATED' | 'ADMIN_IMPORTED';
    isPublished?: boolean;
  }): Promise<{ test: MockTest; questions: Question[] }> {
    const {
      title,
      type = 'QUICK',
      subjectIds = ['sub_polity', 'sub_economy'],
      totalQuestions = 10,
      durationMinutes = Math.round(totalQuestions * 1.2),
      difficulty = 'MEDIUM',
      questionIds = [],
      sourceType = 'IKSHOVIA_CREATED',
      isPublished = true,
    } = params;

    const actualQuestionCount = questionIds.length > 0 ? questionIds.length : totalQuestions;
    const testId = `mock_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const totalMarks = actualQuestionCount * 2;

    const query = `
      INSERT INTO public.mock_tests (
        id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
        negative_marking_rate, source_type, is_published, created_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, 0.66, $8, $9, NOW())
      RETURNING *;
    `;
    const res = await pool.query(query, [
      testId,
      title,
      type,
      JSON.stringify(subjectIds.length ? subjectIds : ['sub_polity', 'sub_economy']),
      durationMinutes,
      actualQuestionCount,
      totalMarks,
      sourceType,
      isPublished,
    ]);

    // If specific question IDs were selected by the user/admin, link them into mock_questions
    if (questionIds.length > 0) {
      for (let i = 0; i < questionIds.length; i++) {
        await pool.query(`
          INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
          VALUES ($1, $2, $3)
          ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
        `, [testId, questionIds[i], i + 1]);
      }
    }

    const test = this.mapRowToMockTest(res.rows[0]);
    const questions = await this.getTestQuestions(testId);

    return { test, questions };
  }

  async startAttempt(userId: string, testId: string, forceNew = false): Promise<MockAttempt> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new Error(`Mock test with id ${testId} not found`);
    }

    if (forceNew) {
      // Mark any prior in-progress attempt as abandoned so the learner starts fresh
      await pool.query(`
        UPDATE public.mock_attempts
        SET status = 'ABANDONED'
        WHERE user_id = $1 AND mock_test_id = $2 AND status = 'IN_PROGRESS';
      `, [userId, testId]);
    } else {
      // Check if an existing IN_PROGRESS attempt exists to resume
      const activeRes = await pool.query(`
        SELECT * FROM public.mock_attempts
        WHERE user_id = $1 AND mock_test_id = $2 AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC LIMIT 1;
      `, [userId, testId]);

      if (activeRes.rows.length > 0) {
        return this.mapRowToMockAttempt(activeRes.rows[0]);
      }
    }

    const attemptId = `att_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const query = `
      INSERT INTO public.mock_attempts (
        id, user_id, mock_test_id, mock_title, score, max_score, accuracy,
        time_taken_seconds, subject_scores, weak_concept_ids, mistake_summary,
        status, started_at
      ) VALUES ($1, $2, $3, $4, 0, $5, 0, 0, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, 'IN_PROGRESS', NOW())
      RETURNING *;
    `;
    const values = [attemptId, userId, testId, test.title, test.totalMarks || 20];
    const res = await pool.query(query, values);
    return this.mapRowToMockAttempt(res.rows[0]);
  }

  async getAttempt(userId: string, attemptId: string): Promise<MockAttempt | null> {
    const res = await pool.query(`
      SELECT * FROM public.mock_attempts
      WHERE id = $1 AND user_id = $2;
    `, [attemptId, userId]);

    if (res.rows.length === 0) return null;
    return this.mapRowToMockAttempt(res.rows[0]);
  }

  async getAttemptAnswers(userId: string, attemptId: string): Promise<MockAnswerRecord[]> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) return [];

    const res = await pool.query(`
      SELECT * FROM public.mock_answers
      WHERE mock_attempt_id = $1;
    `, [attemptId]);

    return res.rows.map(this.mapRowToMockAnswer);
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    data: {
      userAnswer?: string | null;
      isCorrect?: boolean | null;
      timeSpentSeconds?: number;
      markedForReview?: boolean;
    }
  ): Promise<MockAnswerRecord> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) {
      throw new Error('Attempt not found or unauthorized');
    }

    if (attempt.status === 'SUBMITTED') {
      throw new Error('Attempt is already submitted');
    }

    const query = `
      INSERT INTO public.mock_answers (
        mock_attempt_id, question_id, user_answer, is_correct, time_spent_seconds, marked_for_review
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (mock_attempt_id, question_id) DO UPDATE SET
        user_answer = EXCLUDED.user_answer,
        is_correct = EXCLUDED.is_correct,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        marked_for_review = EXCLUDED.marked_for_review
      RETURNING *;
    `;
    const values = [
      attemptId,
      questionId,
      data.userAnswer ?? null,
      data.isCorrect ?? null,
      data.timeSpentSeconds ?? 0,
      data.markedForReview ?? false,
    ];

    const res = await pool.query(query, values);
    return this.mapRowToMockAnswer(res.rows[0]);
  }

  async getUserHistory(userId: string): Promise<MockAttempt[]> {
    const res = await pool.query(`
      SELECT id, user_id, mock_test_id, mock_title, score, max_score, accuracy,
             time_taken_seconds, completed_at, subject_scores, weak_concept_ids,
             mistake_summary, status, started_at
      FROM public.mock_attempts
      WHERE user_id = $1
      ORDER BY completed_at DESC, started_at DESC;
    `, [userId]);

    return res.rows.map(this.mapRowToMockAttempt);
  }

  private mapRowToMockTest(row: any): MockTest {
    const subjectIds = Array.isArray(row.subject_ids)
      ? row.subject_ids
      : (typeof row.subject_ids === 'string' ? JSON.parse(row.subject_ids) : []);

    return {
      id: row.id,
      title: row.title,
      displayName: row.display_name || undefined,
      originalSourceName: row.original_source_name || undefined,
      type: row.type || 'QUICK',
      sourceType: row.source_type || 'IKSHOVIA_CREATED',
      subjectIds,
      durationMinutes: row.duration_minutes || 30,
      totalQuestions: row.total_questions || 10,
      totalMarks: row.total_marks || 20,
      negativeMarkingRate: row.negative_marking_rate || 0.66,
      isPublished: row.is_published ?? true,
      isDeleted: row.is_deleted ?? false,
      deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
      deletedBy: row.deleted_by || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  async updateDisplayName(testId: string, displayName: string): Promise<MockTest> {
    const cleanName = displayName ? displayName.trim() : '';
    const res = await pool.query(`
      UPDATE public.mock_tests
      SET display_name = $1, title = COALESCE(NULLIF($1, ''), title)
      WHERE id = $2
      RETURNING id, title, display_name, original_source_name, type, source_type, subject_ids,
                duration_minutes, total_questions, total_marks, negative_marking_rate,
                is_published, is_deleted, deleted_at, deleted_by, created_at;
    `, [cleanName, testId]);
    if (res.rows.length === 0) {
      throw new Error(`Mock test with id ${testId} not found`);
    }
    return this.mapRowToMockTest(res.rows[0]);
  }

  private mapRowToMockAttempt(row: any): MockAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      mockTestId: row.mock_test_id,
      mockTitle: row.mock_title,
      score: row.score || 0,
      maxScore: row.max_score || 0,
      accuracy: row.accuracy || 0,
      timeTakenSeconds: row.time_taken_seconds || 0,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : '',
      subjectScores: typeof row.subject_scores === 'string' ? JSON.parse(row.subject_scores) : (row.subject_scores || {}),
      weakConceptIds: typeof row.weak_concept_ids === 'string' ? JSON.parse(row.weak_concept_ids) : (row.weak_concept_ids || []),
      mistakeSummary: typeof row.mistake_summary === 'string' ? JSON.parse(row.mistake_summary) : (row.mistake_summary || {}),
      status: row.status || 'SUBMITTED',
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    };
  }

  private mapRowToMockAnswer(row: any): MockAnswerRecord {
    return {
      id: row.id,
      mockAttemptId: row.mock_attempt_id,
      questionId: row.question_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      timeSpentSeconds: row.time_spent_seconds || 0,
      markedForReview: row.marked_for_review || false,
    };
  }

  private mapRowToQuestion(row: any): Question {
    const options = Array.isArray(row.options)
      ? row.options
      : (typeof row.options === 'string' ? JSON.parse(row.options) : undefined);

    const matchData = row.match_data && typeof row.match_data === 'object' && (row.match_data.leftColumn || row.match_data.listI)
      ? row.match_data
      : (typeof row.match_data === 'string' ? JSON.parse(row.match_data) : undefined);
    const matchData_hi = row.match_data_hi && typeof row.match_data_hi === 'object'
      ? row.match_data_hi
      : (typeof row.match_data_hi === 'string' ? JSON.parse(row.match_data_hi) : undefined);
    const statements = Array.isArray(row.statements)
      ? row.statements
      : (typeof row.statements === 'string' ? JSON.parse(row.statements) : undefined);
    const statements_hi = Array.isArray(row.statements_hi)
      ? row.statements_hi
      : (typeof row.statements_hi === 'string' ? JSON.parse(row.statements_hi) : undefined);

    const questionType = row.question_type || (matchData ? 'MATCH_FOLLOWING' : row.type);

    return {
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: row.type,
      questionType,
      statements,
      statements_hi,
      matchData,
      matchData_hi,
      question: row.question,
      options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      examTag: row.exam_tag || undefined,
      pyqYear: row.pyq_year || undefined,
      exam: row.exam || undefined,
      paper: row.paper || undefined,
      questionNumber: row.question_number || undefined,
      isPyq: row.is_pyq,
      sourceType: row.source_type || 'OFFICIAL_COMMISSION',
      source: row.source || undefined,
      verifiedStatus: row.verified_status,
      isPublished: row.is_published,
      status: row.status,
    };
  }

  async countTests(): Promise<number> {
    const res = await pool.query('SELECT COUNT(*) FROM mock_tests WHERE is_published = true');
    return parseInt(res.rows[0].count, 10);
  }

  async submitAttempt(
    userId: string,
    testOrAttemptId: string,
    payload?: {
      answers?: Record<string, string>;
      timeTakenSeconds?: number;
    }
  ): Promise<MockAttempt> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock existing attempt for update or query by test_id
      const attemptRes = await client.query(`
        SELECT * FROM public.mock_attempts
        WHERE (id = $1 OR (mock_test_id = $1 AND user_id = $2)) AND user_id = $2
        ORDER BY started_at DESC LIMIT 1
        FOR UPDATE;
      `, [testOrAttemptId, userId]);

      let row: any;

      if (attemptRes.rows.length === 0) {
        // Find test
        const testCheck = await client.query('SELECT * FROM public.mock_tests WHERE id = $1', [testOrAttemptId]);
        if (testCheck.rows.length === 0) {
          throw new Error(`Mock test or attempt not found: ${testOrAttemptId}`);
        }
        const testRow = testCheck.rows[0];
        const attemptId = `att_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newAttemptRes = await client.query(`
          INSERT INTO public.mock_attempts (
            id, user_id, mock_test_id, mock_title, score, max_score, accuracy,
            time_taken_seconds, subject_scores, weak_concept_ids, mistake_summary,
            status, started_at
          ) VALUES ($1, $2, $3, $4, 0, $5, 0, 0, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, 'IN_PROGRESS', NOW())
          RETURNING *;
        `, [attemptId, userId, testRow.id, testRow.title, testRow.total_marks || 20]);
        row = newAttemptRes.rows[0];
      } else {
        row = attemptRes.rows[0];
      }

      // Idempotency: if already submitted, return the persisted result
      if (row.status === 'SUBMITTED') {
        await client.query('COMMIT');
        return this.mapRowToMockAttempt(row);
      }

      const attemptId = row.id;

      // Fetch test details
      const testRes = await client.query('SELECT * FROM public.mock_tests WHERE id = $1', [row.mock_test_id]);
      if (testRes.rows.length === 0) {
        throw new Error(`Mock test with id ${row.mock_test_id} not found`);
      }
      const test = this.mapRowToMockTest(testRes.rows[0]);

      // If payload provided answers, upsert them into mock_answers within the transaction
      if (payload?.answers && typeof payload.answers === 'object') {
        for (const [qId, ansVal] of Object.entries(payload.answers)) {
          if (ansVal !== undefined && ansVal !== null) {
            await client.query(`
              INSERT INTO public.mock_answers (
                mock_attempt_id, question_id, user_answer, time_spent_seconds, marked_for_review
              ) VALUES ($1, $2, $3, 45, false)
              ON CONFLICT (mock_attempt_id, question_id) DO UPDATE SET
                user_answer = EXCLUDED.user_answer;
            `, [attemptId, qId, String(ansVal)]);
          }
        }
      }

      // Load test questions
      const qRes = await client.query(`
        SELECT q.*, mq.order_num
        FROM public.mock_questions mq
        JOIN public.questions q ON mq.question_id = q.id
        WHERE mq.mock_test_id = $1
        ORDER BY mq.order_num ASC;
      `, [test.id]);

      let testQuestions: Question[] = [];
      if (qRes.rows.length > 0) {
        testQuestions = qRes.rows.map(this.mapRowToQuestion);
      } else {
        let questionQuery = `
          SELECT id, subject_id, topic_id, concept_id, type, question, question_en, question_hi,
                 options, options_en, options_hi, correct_answer, explanation, explanation_en, explanation_hi,
                 available_languages, difficulty, exam_tag, pyq_year, exam, paper, question_number,
                 is_pyq, source_type, source, verified_status, is_published, status, question_type,
                 statements, statements_hi, match_data, match_data_hi
          FROM public.questions
          WHERE is_published = true
        `;
        const queryParams: any[] = [];
        if (test.subjectIds && test.subjectIds.length > 0) {
          questionQuery += ' AND subject_id = ANY($1)';
          queryParams.push(test.subjectIds);
        }
        questionQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
        queryParams.push(test.totalQuestions || 10);
        const fallbackRes = await client.query(questionQuery, queryParams);
        testQuestions = fallbackRes.rows.map(this.mapRowToQuestion);
      }

      // Load all answers for this attempt from mock_answers
      const ansRes = await client.query('SELECT * FROM public.mock_answers WHERE mock_attempt_id = $1', [attemptId]);
      const answerMap = new Map<string, string | null>();
      for (const aRow of ansRes.rows) {
        answerMap.set(aRow.question_id, aRow.user_answer);
      }

      // Scoring calculation
      let score = 0;
      let correctCount = 0;
      let attemptedCount = 0;
      const totalQCount = testQuestions.length || 1;
      const markPerQ = (test.totalMarks || 20) / totalQCount;
      const subjectStats: Record<string, { total: number; correct: number; score: number }> = {};
      const weakConceptIdsSet = new Set<string>();
      const mistakeSummary = { CONCEPT_CONFUSION: 0, RECALL_FAILURE: 0 };

      for (const q of testQuestions) {
        const subj = q.subjectId || 'general';
        if (!subjectStats[subj]) {
          subjectStats[subj] = { total: 0, correct: 0, score: 0 };
        }
        subjectStats[subj].total += 1;

        const userAns = answerMap.get(q.id);
        const optionsList = q.options || [];
        const optE = optionsList.find(o => String(o.id).toUpperCase() === 'E');
        const optEText = typeof optE?.text === 'string' ? optE.text : (optE?.text ? JSON.stringify(optE.text) : '');
        const isOptENotAttempted = Boolean(optE && (
          optEText.toLowerCase().includes('not attempted') ||
          optEText.toLowerCase().includes('अनुत्तरित') ||
          optEText.toLowerCase().includes('unattempted')
        ));

        if (userAns !== undefined && userAns !== null && userAns !== '') {
          const userAnsUpper = String(userAns).trim().toUpperCase();
          const correctAnsUpper = String(q.correctAnswer).trim().toUpperCase();
          const isCorrect = userAnsUpper === correctAnsUpper;

          // Check if user specifically selected Option E as "Not Attempted"
          const userChoseNotAttempted = userAnsUpper === 'E' && isOptENotAttempted && correctAnsUpper !== 'E';

          if (userChoseNotAttempted) {
            // Option E selected as deliberate safe skip: 0 marks, 0 penalty
            await client.query(
              'UPDATE public.mock_answers SET is_correct = false WHERE mock_attempt_id = $1 AND question_id = $2',
              [attemptId, q.id]
            );
          } else {
            attemptedCount++;
            await client.query(
              'UPDATE public.mock_answers SET is_correct = $1 WHERE mock_attempt_id = $2 AND question_id = $3',
              [isCorrect, attemptId, q.id]
            );

            if (isCorrect) {
              score += markPerQ;
              correctCount++;
              subjectStats[subj].correct += 1;
              subjectStats[subj].score += markPerQ;
              if (q.conceptId) {
                await recordQuestionAttempt(userId, q.conceptId, true, 45, 4, undefined, client);
              }
            } else {
              const penalty = markPerQ * (test.negativeMarkingRate || 0.33);
              score -= penalty;
              subjectStats[subj].score -= penalty;
              mistakeSummary.CONCEPT_CONFUSION += 1;
              if (q.conceptId) {
                weakConceptIdsSet.add(q.conceptId);
                await recordQuestionAttempt(userId, q.conceptId, false, 45, 3, 'CONCEPT_GAP', client);
              }
            }

            // Sync with question_attempts table for unified learner analytics
            const mistakeCat = isCorrect ? undefined : (mistakeSummary.CONCEPT_CONFUSION >= mistakeSummary.RECALL_FAILURE ? 'CONCEPT_CONFUSION' : 'RECALL_FAILURE');
            await client.query(`
              INSERT INTO public.question_attempts (
                id, user_id, question_id, concept_id, user_answer, is_correct, time_spent_seconds, confidence_rating, mistake_category, timestamp
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
              ON CONFLICT (id) DO UPDATE SET
                user_answer = EXCLUDED.user_answer,
                is_correct = EXCLUDED.is_correct,
                time_spent_seconds = EXCLUDED.time_spent_seconds;
            `, [
              `qa_${attemptId}_${q.id}`,
              userId,
              q.id,
              q.conceptId || 'c_art32',
              userAnsUpper,
              isCorrect,
              45,
              isCorrect ? 4 : 2,
              mistakeCat || null
            ]);
          }
        }
      }

      score = Math.max(0, Math.round(score * 10) / 10);
      const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

      const startedAtMs = row.started_at ? new Date(row.started_at).getTime() : Date.now();
      const calculatedTimeTaken = Math.max(10, Math.round((Date.now() - startedAtMs) / 1000));
      const finalTimeTaken = payload?.timeTakenSeconds && payload.timeTakenSeconds > 0
        ? Math.max(10, payload.timeTakenSeconds)
        : calculatedTimeTaken;

      const weakConceptIds = Array.from(weakConceptIdsSet);
      if (weakConceptIds.length === 0) {
        weakConceptIds.push('c_fiscal_fed', 'c_art32');
      }

      const updateRes = await client.query(`
        UPDATE public.mock_attempts SET
          score = $1,
          max_score = $2,
          accuracy = $3,
          time_taken_seconds = $4,
          subject_scores = $5::jsonb,
          weak_concept_ids = $6::jsonb,
          mistake_summary = $7::jsonb,
          status = 'SUBMITTED',
          completed_at = NOW()
        WHERE id = $8
        RETURNING *;
      `, [
        score,
        test.totalMarks,
        accuracy,
        finalTimeTaken,
        JSON.stringify(subjectStats),
        JSON.stringify(weakConceptIds),
        JSON.stringify(mistakeSummary),
        attemptId
      ]);

      await client.query('COMMIT');

      await updateLearnerModel(userId);

      return this.mapRowToMockAttempt(updateRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // -------------------------------------------------------------
  // ADMIN EDITING & AUDIT TRAIL
  // -------------------------------------------------------------

  async updateMockTest(testId: string, updates: {
    title?: string;
    displayName?: string;
    durationMinutes?: number;
    totalMarks?: number;
    negativeMarkingRate?: number;
    instructions?: string;
    isPublished?: boolean;
    type?: 'FULL' | 'SUBJECT' | 'QUICK';
    subjectIds?: string[];
  }): Promise<MockTest> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new Error(`Mock test with id ${testId} not found`);
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      values.push(updates.title);
      setClauses.push(`title = $${values.length}`);
    }
    if (updates.displayName !== undefined) {
      values.push(updates.displayName);
      setClauses.push(`display_name = $${values.length}`);
    }
    if (updates.durationMinutes !== undefined) {
      values.push(updates.durationMinutes);
      setClauses.push(`duration_minutes = $${values.length}`);
    }
    if (updates.totalMarks !== undefined) {
      values.push(updates.totalMarks);
      setClauses.push(`total_marks = $${values.length}`);
    }
    if (updates.negativeMarkingRate !== undefined) {
      values.push(updates.negativeMarkingRate);
      setClauses.push(`negative_marking_rate = $${values.length}`);
    }
    if (updates.instructions !== undefined) {
      values.push(updates.instructions);
      setClauses.push(`instructions = $${values.length}`);
    }
    if (updates.isPublished !== undefined) {
      values.push(updates.isPublished);
      setClauses.push(`is_published = $${values.length}`);
    }
    if (updates.type !== undefined) {
      values.push(updates.type);
      setClauses.push(`type = $${values.length}`);
    }
    if (updates.subjectIds !== undefined) {
      values.push(updates.subjectIds);
      setClauses.push(`subject_ids = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return test;
    }

    values.push(testId);
    const query = `
      UPDATE public.mock_tests
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING *;
    `;
    const res = await pool.query(query, values);
    return this.mapRowToMockTest(res.rows[0]);
  }

  async updateQuestionWithAudit(
    questionId: string,
    updates: {
      question?: string;
      question_en?: string;
      question_hi?: string;
      options?: any[];
      options_en?: any[];
      options_hi?: any[];
      correct_answer?: string;
      correctAnswer?: string;
      explanation?: string;
      explanation_en?: string;
      explanation_hi?: string;
      subjectId?: string;
      conceptId?: string;
    },
    changedBy = 'Admin',
    reason = 'Editorial correction'
  ): Promise<{ question: Question; revision: any }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch existing question with row lock
      const qRes = await client.query(`
        SELECT id, subject_id, topic_id, concept_id, type, question, question_en, question_hi,
               options, options_en, options_hi, correct_answer, explanation, explanation_en, explanation_hi,
               available_languages, difficulty, exam_tag, pyq_year, exam, paper, question_number,
               is_pyq, source_type, source, source_job_id, verified_status, is_published, status, question_type,
               statements, statements_hi, match_data, match_data_hi, corrections_count
        FROM public.questions
        WHERE id = $1
        FOR UPDATE
      `, [questionId]);
      if (qRes.rows.length === 0) {
        throw new Error(`Question with id ${questionId} not found`);
      }
      const current = qRes.rows[0];

      // 2. Derive canonical source_origin server-side from canonical provenance
      const sourceOrigin = resolveCanonicalSourceOrigin(current);

      // 3. Identify changes and record in question_revisions
      const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];

      const newQuestion = updates.question !== undefined ? updates.question : updates.question_en;
      if (newQuestion !== undefined && newQuestion !== current.question) {
        changes.push({ field: 'QUESTION_TEXT', oldVal: current.question || '', newVal: newQuestion });
      }

      if (updates.question_hi !== undefined && updates.question_hi !== current.question_hi) {
        changes.push({ field: 'QUESTION_HI', oldVal: current.question_hi || '', newVal: updates.question_hi });
      }

      const newAnswer = updates.correct_answer !== undefined ? updates.correct_answer : updates.correctAnswer;
      if (newAnswer !== undefined && String(newAnswer).trim().toUpperCase() !== String(current.correct_answer).trim().toUpperCase()) {
        changes.push({ field: 'CORRECT_ANSWER', oldVal: current.correct_answer || '', newVal: String(newAnswer).trim().toUpperCase() });
      }

      const newExplanation = updates.explanation !== undefined ? updates.explanation : updates.explanation_en;
      if (newExplanation !== undefined && newExplanation !== current.explanation) {
        changes.push({ field: 'EXPLANATION', oldVal: current.explanation || '', newVal: newExplanation });
      }

      if (updates.explanation_hi !== undefined && updates.explanation_hi !== current.explanation_hi) {
        changes.push({ field: 'EXPLANATION_HI', oldVal: current.explanation_hi || '', newVal: updates.explanation_hi });
      }

      if (updates.options !== undefined && JSON.stringify(updates.options) !== JSON.stringify(current.options)) {
        changes.push({ field: 'OPTIONS', oldVal: JSON.stringify(current.options), newVal: JSON.stringify(updates.options) });
      }

      if (updates.options_hi !== undefined && JSON.stringify(updates.options_hi) !== JSON.stringify(current.options_hi)) {
        changes.push({ field: 'OPTIONS_HI', oldVal: JSON.stringify(current.options_hi), newVal: JSON.stringify(updates.options_hi) });
      }

      if (updates.subjectId !== undefined && updates.subjectId !== current.subject_id) {
        changes.push({ field: 'SUBJECT_ID', oldVal: current.subject_id || '', newVal: updates.subjectId });
      }

      if (updates.conceptId !== undefined && updates.conceptId !== current.concept_id) {
        changes.push({ field: 'CONCEPT_ID', oldVal: current.concept_id || '', newVal: updates.conceptId });
      }

      // 4. Insert revision log if changes exist
      let revRow: any = null;
      if (changes.length > 0) {
        const revCountRes = await client.query(
          'SELECT COALESCE(MAX(revision_num), 0) as max_rev FROM public.question_revisions WHERE question_id = $1',
          [questionId]
        );
        const nextRevNum = Math.max(
          Number(revCountRes.rows[0]?.max_rev || 0),
          Number(current.corrections_count || 0)
        ) + 1;

        const revId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const primaryChange = changes[0];

        const revRes = await client.query(`
          INSERT INTO public.question_revisions (
            id, question_id, job_id, revision_num, source_origin, field_changed,
            old_value, new_value, reason, details, changed_by, changed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10::jsonb, $11, NOW()
          )
          RETURNING *;
        `, [
          revId,
          questionId,
          current.source_job_id || null,
          nextRevNum,
          sourceOrigin,
          primaryChange.field,
          primaryChange.oldVal,
          primaryChange.newVal,
          reason,
          JSON.stringify({ changes, updatedBy: changedBy, sourceOrigin }),
          changedBy
        ]);
        revRow = revRes.rows[0];
      }

      // 5. Update questions table without touching historical mock_attempts/mock_answers
      const setClauses: string[] = [];
      const values: any[] = [];

      if (newQuestion !== undefined) {
        values.push(newQuestion);
        setClauses.push(`question = $${values.length}`);
      }
      if (updates.question_en !== undefined || newQuestion !== undefined) {
        values.push(newQuestion || updates.question_en);
        setClauses.push(`question_en = $${values.length}`);
      }
      if (updates.question_hi !== undefined) {
        values.push(updates.question_hi);
        setClauses.push(`question_hi = $${values.length}`);
      }
      if (updates.options !== undefined) {
        values.push(JSON.stringify(updates.options));
        setClauses.push(`options = $${values.length}::jsonb`);
      }
      if (updates.options_en !== undefined || updates.options !== undefined) {
        values.push(JSON.stringify(updates.options_en || updates.options));
        setClauses.push(`options_en = $${values.length}::jsonb`);
      }
      if (updates.options_hi !== undefined) {
        values.push(JSON.stringify(updates.options_hi));
        setClauses.push(`options_hi = $${values.length}::jsonb`);
      }
      if (newAnswer !== undefined) {
        values.push(String(newAnswer).trim().toUpperCase());
        setClauses.push(`correct_answer = $${values.length}`);
      }
      if (newExplanation !== undefined) {
        values.push(newExplanation);
        setClauses.push(`explanation = $${values.length}`);
      }
      if (updates.explanation_en !== undefined || newExplanation !== undefined) {
        values.push(newExplanation || updates.explanation_en);
        setClauses.push(`explanation_en = $${values.length}`);
      }
      if (updates.explanation_hi !== undefined) {
        values.push(updates.explanation_hi);
        setClauses.push(`explanation_hi = $${values.length}`);
      }
      if (updates.subjectId !== undefined) {
        values.push(updates.subjectId);
        setClauses.push(`subject_id = $${values.length}`);
      }
      if (updates.conceptId !== undefined) {
        values.push(updates.conceptId);
        setClauses.push(`concept_id = $${values.length}`);
      }

      let updatedQuestionRow = current;

      if (setClauses.length > 0) {
        setClauses.push(`last_corrected_at = NOW()`);
        values.push(changedBy);
        setClauses.push(`last_corrected_by = $${values.length}`);
        setClauses.push(`corrections_count = COALESCE(corrections_count, 0) + 1`);

        values.push(questionId);
        const updateQQuery = `
          UPDATE public.questions
          SET ${setClauses.join(', ')}
          WHERE id = $${values.length}
          RETURNING *;
        `;
        const updateRes = await client.query(updateQQuery, values);
        updatedQuestionRow = updateRes.rows[0];
      }

      await client.query('COMMIT');

      return {
        question: this.mapRowToQuestion(updatedQuestionRow),
        revision: revRow
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getQuestionRevisions(questionId: string): Promise<any[]> {
    const res = await pool.query(`
      SELECT * FROM public.question_revisions
      WHERE question_id = $1
      ORDER BY revision_num DESC, changed_at DESC;
    `, [questionId]);
    return res.rows;
  }

  async addQuestionToMockTest(testId: string, questionId: string, orderNum?: number): Promise<void> {
    let finalOrder = orderNum;
    if (!finalOrder) {
      const maxOrderRes = await pool.query(`
        SELECT COALESCE(MAX(order_num), 0) + 1 AS next_order
        FROM public.mock_questions
        WHERE mock_test_id = $1;
      `, [testId]);
      finalOrder = parseInt(maxOrderRes.rows[0].next_order) || 1;
    }

    await pool.query(`
      INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
      VALUES ($1, $2, $3)
      ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
    `, [testId, questionId, finalOrder]);

    // Recalculate mock test total questions
    await pool.query(`
      UPDATE public.mock_tests
      SET total_questions = (SELECT COUNT(*) FROM public.mock_questions WHERE mock_test_id = $1)
      WHERE id = $1;
    `, [testId]);
  }

  async removeQuestionFromMockTest(testId: string, questionId: string): Promise<void> {
    await pool.query(`
      DELETE FROM public.mock_questions
      WHERE mock_test_id = $1 AND question_id = $2;
    `, [testId, questionId]);

    // Recalculate mock test total questions
    await pool.query(`
      UPDATE public.mock_tests
      SET total_questions = (SELECT COUNT(*) FROM public.mock_questions WHERE mock_test_id = $1)
      WHERE id = $1;
    `, [testId]);
  }
}

export const mockTestRepository = new MockTestRepository();

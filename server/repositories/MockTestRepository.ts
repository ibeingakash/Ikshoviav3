import pool from '../db/pool.js';
import { MockTest, MockAttempt, Question } from '../../src/types/index.js';
import { recordQuestionAttempt, updateLearnerModel } from '../intelligence.js';

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
  async getPublishedTests(): Promise<MockTest[]> {
    const res = await pool.query(`
      SELECT * FROM public.mock_tests 
      WHERE is_published = true 
      ORDER BY created_at DESC;
    `);
    return res.rows.map(this.mapRowToMockTest);
  }

  async getTestById(id: string): Promise<MockTest | null> {
    const res = await pool.query('SELECT * FROM public.mock_tests WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToMockTest(res.rows[0]);
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    const res = await pool.query(`
      SELECT q.*, mq.order_num 
      FROM public.mock_questions mq
      JOIN public.questions q ON mq.question_id = q.id
      WHERE mq.mock_test_id = $1
      ORDER BY mq.order_num ASC;
    `, [testId]);

    if (res.rows.length > 0) {
      return res.rows.map(this.mapRowToQuestion);
    }

    // Fallback if no specific mock_questions mappings exist: query published questions matching test subjects
    const test = await this.getTestById(testId);
    if (!test) return [];

    let questionQuery = 'SELECT * FROM public.questions WHERE is_published = true';
    const queryParams: any[] = [];

    if (test.subjectIds && test.subjectIds.length > 0) {
      questionQuery += ' AND subject_id = ANY($1)';
      queryParams.push(test.subjectIds);
    }

    questionQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(test.totalQuestions || 10);

    const fallbackRes = await pool.query(questionQuery, queryParams);
    return fallbackRes.rows.map(this.mapRowToQuestion);
  }

  async startAttempt(userId: string, testId: string): Promise<MockAttempt> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new Error(`Mock test with id ${testId} not found`);
    }

    // Check if an existing IN_PROGRESS attempt exists
    const activeRes = await pool.query(`
      SELECT * FROM public.mock_attempts
      WHERE user_id = $1 AND mock_test_id = $2 AND status = 'IN_PROGRESS'
      ORDER BY started_at DESC LIMIT 1;
    `, [userId, testId]);

    if (activeRes.rows.length > 0) {
      return this.mapRowToMockAttempt(activeRes.rows[0]);
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
      SELECT * FROM public.mock_attempts
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
      type: row.type || 'QUICK',
      subjectIds,
      durationMinutes: row.duration_minutes || 30,
      totalQuestions: row.total_questions || 10,
      totalMarks: row.total_marks || 20,
      negativeMarkingRate: row.negative_marking_rate || 0.66,
      isPublished: row.is_published ?? true,
    };
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

    return {
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: row.type,
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
        let questionQuery = 'SELECT * FROM public.questions WHERE is_published = true';
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
        if (userAns !== undefined && userAns !== null && userAns !== '') {
          attemptedCount++;
          const isCorrect = String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();

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
        }
      }

      score = Math.max(0, Math.round(score * 10) / 10);
      const accuracy = totalQCount > 0 ? Math.round((correctCount / totalQCount) * 100) : 0;

      const startedAtMs = row.started_at ? new Date(row.started_at).getTime() : Date.now();
      const calculatedTimeTaken = Math.round((Date.now() - startedAtMs) / 1000);
      const finalTimeTaken = payload?.timeTakenSeconds && payload.timeTakenSeconds > 0
        ? payload.timeTakenSeconds
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
}

export const mockTestRepository = new MockTestRepository();

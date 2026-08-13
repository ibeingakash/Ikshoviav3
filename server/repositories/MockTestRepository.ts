import pool from '../db/pool.js';
import { MockTest, MockAttempt, Question } from '../../src/types/index.js';

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
}

export const mockTestRepository = new MockTestRepository();

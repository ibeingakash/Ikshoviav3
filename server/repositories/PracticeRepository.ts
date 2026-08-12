import pool from '../db/pool.js';
import { QuestionAttempt } from '../../src/types/index.js';
import { PoolClient } from 'pg';

export class PracticeRepository {
  async recordAttempt(attempt: QuestionAttempt, client?: PoolClient): Promise<QuestionAttempt> {
    const executor = client || pool;
    const query = `
      INSERT INTO public.question_attempts (
        id, user_id, question_id, concept_id, user_answer, is_correct,
        time_spent_seconds, confidence_rating, mistake_category, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        user_answer = EXCLUDED.user_answer,
        is_correct = EXCLUDED.is_correct,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        confidence_rating = EXCLUDED.confidence_rating,
        mistake_category = EXCLUDED.mistake_category,
        timestamp = EXCLUDED.timestamp
      RETURNING *;
    `;
    const values = [
      attempt.id,
      attempt.userId,
      attempt.questionId,
      attempt.conceptId,
      attempt.userAnswer,
      attempt.isCorrect,
      attempt.timeSpentSeconds || 0,
      attempt.confidenceRating || 3,
      attempt.mistakeCategory || null,
      attempt.timestamp || new Date().toISOString()
    ];

    const res = await executor.query(query, values);
    return this.mapRowToAttempt(res.rows[0]);
  }

  async getUserAttempts(userId: string, limit: number = 50): Promise<QuestionAttempt[]> {
    const query = `
      SELECT * FROM public.question_attempts
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2;
    `;
    const res = await pool.query(query, [userId, limit]);
    return res.rows.map(this.mapRowToAttempt);
  }

  async recordLearningEvent(
    data: { userId: string; conceptId?: string; eventType: string; payload?: any },
    client?: PoolClient
  ): Promise<void> {
    const executor = client || pool;
    const query = `
      INSERT INTO public.learning_events (
        user_id, concept_id, event_type, payload, timestamp
      ) VALUES ($1, $2, $3, $4, NOW());
    `;
    const values = [
      data.userId,
      data.conceptId || null,
      data.eventType,
      data.payload ? JSON.stringify(data.payload) : '{}'
    ];
    await executor.query(query, values);
  }

  async createPracticeSession(
    data: {
      userId: string;
      subjectId?: string;
      mode?: string;
      totalQuestions?: number;
      correctCount?: number;
      score?: number;
    },
    client?: PoolClient
  ): Promise<string> {
    const executor = client || pool;
    const validMode = ['STANDARD', 'ADAPTIVE', 'REVISION'].includes(data.mode || '')
      ? data.mode
      : 'STANDARD';

    const query = `
      INSERT INTO public.practice_sessions (
        user_id, subject_id, mode, total_questions, correct_count, score, started_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id;
    `;
    const values = [
      data.userId,
      data.subjectId || null,
      validMode,
      data.totalQuestions || 0,
      data.correctCount || 0,
      data.score || 0
    ];
    const res = await executor.query(query, values);
    return res.rows[0].id;
  }

  private mapRowToAttempt(row: any): QuestionAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      questionId: row.question_id,
      conceptId: row.concept_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      timeSpentSeconds: row.time_spent_seconds,
      confidenceRating: row.confidence_rating,
      mistakeCategory: row.mistake_category || undefined,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
    };
  }
}

export const practiceRepository = new PracticeRepository();

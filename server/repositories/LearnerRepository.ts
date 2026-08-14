import pool from '../db/pool.js';
import { LearnerModel, ConceptMastery } from '../../src/types/index.js';
import { PoolClient } from 'pg';

export class LearnerRepository {
  async getLearnerModel(userId: string, client?: PoolClient): Promise<LearnerModel> {
    const executor = client || pool;
    const res = await executor.query(
      'SELECT * FROM public.learner_models WHERE user_id = $1',
      [userId]
    );

    if (res.rows.length === 0) {
      const defaultModel: LearnerModel = {
        userId,
        overallScore: 0,
        totalStudyTimeMinutes: 0,
        currentStreak: 0,
        highestStreak: 0,
        activeDaysCount: 0,
        confidenceBias: 'BALANCED',
        mistakeBreakdown: {
          CONCEPT_GAP: 0,
          RECALL_FAILURE: 0,
          CONCEPT_CONFUSION: 0,
          MISINTERPRETATION: 0,
          CARELESS_ERROR: 0,
          TIME_PRESSURE: 0,
        },
        subjectMastery: {},
        masteredConceptsCount: 0,
        weakConceptsCount: 0,
        dueRevisionCount: 0,
        lastUpdated: new Date().toISOString(),
      };
      await this.saveLearnerModel(defaultModel, client);
      return defaultModel;
    }

    return this.mapRowToLearnerModel(res.rows[0]);
  }

  async saveLearnerModel(model: LearnerModel, client?: PoolClient): Promise<LearnerModel> {
    const executor = client || pool;
    // Ensure parent record exists in public.users to prevent foreign key violations
    try {
      await executor.query(
        `INSERT INTO public.users (id, email, name, role, is_onboarded)
         VALUES ($1, $2, $3, 'USER', false)
         ON CONFLICT (id) DO NOTHING`,
        [model.userId, `${model.userId}@ikshovia.local`, model.userId]
      );
    } catch (e: any) {
      // Ignore conflict or notice
    }

    const query = `
      INSERT INTO public.learner_models (
        user_id, overall_score, total_study_time_minutes, current_streak, highest_streak,
        active_days_count, confidence_bias, mistake_breakdown, subject_mastery,
        mastered_concepts_count, weak_concepts_count, due_revision_count, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        total_study_time_minutes = EXCLUDED.total_study_time_minutes,
        current_streak = EXCLUDED.current_streak,
        highest_streak = EXCLUDED.highest_streak,
        active_days_count = EXCLUDED.active_days_count,
        confidence_bias = EXCLUDED.confidence_bias,
        mistake_breakdown = EXCLUDED.mistake_breakdown,
        subject_mastery = EXCLUDED.subject_mastery,
        mastered_concepts_count = EXCLUDED.mastered_concepts_count,
        weak_concepts_count = EXCLUDED.weak_concepts_count,
        due_revision_count = EXCLUDED.due_revision_count,
        last_updated = NOW()
      RETURNING *;
    `;
    const values = [
      model.userId,
      model.overallScore ?? 0,
      model.totalStudyTimeMinutes ?? 0,
      model.currentStreak ?? 0,
      model.highestStreak ?? 0,
      model.activeDaysCount ?? 0,
      model.confidenceBias || 'BALANCED',
      JSON.stringify(model.mistakeBreakdown || {}),
      JSON.stringify(model.subjectMastery || {}),
      model.masteredConceptsCount ?? 0,
      model.weakConceptsCount ?? 0,
      model.dueRevisionCount ?? 0,
    ];

    const res = await executor.query(query, values);
    return this.mapRowToLearnerModel(res.rows[0]);
  }

  async getConceptMastery(userId: string, conceptId: string, client?: PoolClient): Promise<ConceptMastery | null> {
    const executor = client || pool;
    const res = await executor.query(
      'SELECT * FROM public.concept_mastery WHERE user_id = $1 AND concept_id = $2',
      [userId, conceptId]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToConceptMastery(res.rows[0]);
  }

  async getUserMasteries(userId: string, client?: PoolClient): Promise<ConceptMastery[]> {
    const executor = client || pool;
    const res = await executor.query(
      'SELECT * FROM public.concept_mastery WHERE user_id = $1',
      [userId]
    );
    return res.rows.map(this.mapRowToConceptMastery);
  }

  async saveConceptMastery(userId: string, conceptId: string, mastery: ConceptMastery, client?: PoolClient): Promise<ConceptMastery> {
    const executor = client || pool;
    const query = `
      INSERT INTO public.concept_mastery (
        user_id, concept_id, understanding, retention, application, accuracy,
        confidence, overall_mastery, attempts_count, correct_count, incorrect_count,
        time_spent_seconds, last_studied_at, last_reviewed_at, next_review_date,
        confusion_partners, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      ON CONFLICT (user_id, concept_id) DO UPDATE SET
        understanding = EXCLUDED.understanding,
        retention = EXCLUDED.retention,
        application = EXCLUDED.application,
        accuracy = EXCLUDED.accuracy,
        confidence = EXCLUDED.confidence,
        overall_mastery = EXCLUDED.overall_mastery,
        attempts_count = EXCLUDED.attempts_count,
        correct_count = EXCLUDED.correct_count,
        incorrect_count = EXCLUDED.incorrect_count,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        last_studied_at = COALESCE(EXCLUDED.last_studied_at, concept_mastery.last_studied_at),
        last_reviewed_at = EXCLUDED.last_reviewed_at,
        next_review_date = EXCLUDED.next_review_date,
        confusion_partners = EXCLUDED.confusion_partners,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      userId,
      conceptId,
      mastery.understanding,
      mastery.retention,
      mastery.application,
      mastery.accuracy,
      mastery.confidence,
      mastery.overallMastery,
      mastery.attemptsCount,
      mastery.correctCount,
      mastery.incorrectCount,
      mastery.timeSpentSeconds,
      mastery.lastStudiedAt || new Date().toISOString(),
      mastery.lastReviewedAt || new Date().toISOString(),
      mastery.nextReviewDate || null,
      JSON.stringify(mastery.confusionPartners || []),
    ];

    const res = await executor.query(query, values);
    return this.mapRowToConceptMastery(res.rows[0]);
  }

  async saveRetentionState(
    userId: string,
    conceptId: string,
    retentionScore: number,
    decayFactor: number = 0.05,
    client?: PoolClient
  ): Promise<void> {
    const executor = client || pool;
    const query = `
      INSERT INTO public.retention_state (
        user_id, concept_id, decay_factor, last_retention_score, last_computed_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, concept_id) DO UPDATE SET
        decay_factor = EXCLUDED.decay_factor,
        last_retention_score = EXCLUDED.last_retention_score,
        last_computed_at = NOW();
    `;
    await executor.query(query, [userId, conceptId, decayFactor, retentionScore]);
  }

  private mapRowToLearnerModel(row: any): LearnerModel {
    return {
      userId: row.user_id,
      overallScore: row.overall_score,
      totalStudyTimeMinutes: row.total_study_time_minutes,
      currentStreak: row.current_streak,
      highestStreak: row.highest_streak,
      activeDaysCount: row.active_days_count,
      confidenceBias: row.confidence_bias,
      mistakeBreakdown: typeof row.mistake_breakdown === 'string' ? JSON.parse(row.mistake_breakdown) : (row.mistake_breakdown || {}),
      subjectMastery: typeof row.subject_mastery === 'string' ? JSON.parse(row.subject_mastery) : (row.subject_mastery || {}),
      masteredConceptsCount: row.mastered_concepts_count,
      weakConceptsCount: row.weak_concepts_count,
      dueRevisionCount: row.due_revision_count,
      lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : new Date().toISOString(),
    };
  }

  private mapRowToConceptMastery(row: any): ConceptMastery {
    return {
      conceptId: row.concept_id,
      understanding: row.understanding,
      retention: row.retention,
      application: row.application,
      accuracy: row.accuracy,
      confidence: row.confidence,
      overallMastery: row.overall_mastery,
      attemptsCount: row.attempts_count,
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      timeSpentSeconds: row.time_spent_seconds,
      lastStudiedAt: row.last_studied_at ? new Date(row.last_studied_at).toISOString() : new Date().toISOString(),
      lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at).toISOString() : undefined,
      nextReviewDate: row.next_review_date ? new Date(row.next_review_date).toISOString() : undefined,
      confusionPartners: typeof row.confusion_partners === 'string' ? JSON.parse(row.confusion_partners) : (row.confusion_partners || []),
    };
  }
}

export const learnerRepository = new LearnerRepository();

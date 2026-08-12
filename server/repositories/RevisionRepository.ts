import pool from '../db/pool.js';
import { RevisionItem } from '../../src/types/index.js';
import { PoolClient } from 'pg';

export class RevisionRepository {
  async upsertRevisionItem(
    data: {
      userId: string;
      conceptId: string;
      retention: number;
      priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
      lastReviewedAt?: string;
      nextReviewDate?: string;
      status?: 'PENDING' | 'COMPLETED' | 'SKIPPED';
      mistakeReason?: string;
    },
    client?: PoolClient
  ): Promise<void> {
    const executor = client || pool;
    const query = `
      INSERT INTO public.revision_items (
        user_id, concept_id, retention, priority, last_reviewed_at, next_review_date,
        status, mistake_reason, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id, concept_id) DO UPDATE SET
        retention = EXCLUDED.retention,
        priority = EXCLUDED.priority,
        last_reviewed_at = EXCLUDED.last_reviewed_at,
        next_review_date = EXCLUDED.next_review_date,
        status = EXCLUDED.status,
        mistake_reason = EXCLUDED.mistake_reason,
        updated_at = NOW();
    `;
    const values = [
      data.userId,
      data.conceptId,
      data.retention,
      data.priority || 'MEDIUM',
      data.lastReviewedAt || new Date().toISOString(),
      data.nextReviewDate || null,
      data.status || 'PENDING',
      data.mistakeReason || null,
    ];
    await executor.query(query, values);
  }

  async getRevisionQueue(userId: string): Promise<RevisionItem[]> {
    const query = `
      SELECT
        r.concept_id,
        c.title AS concept_title,
        s.name AS subject_name,
        r.retention,
        r.priority,
        r.last_reviewed_at,
        r.next_review_date,
        r.mistake_reason
      FROM public.revision_items r
      JOIN public.concepts c ON r.concept_id = c.id
      LEFT JOIN public.subjects s ON c.subject_id = s.id
      WHERE r.user_id = $1 AND (r.status = 'PENDING' OR r.status IS NULL)
      ORDER BY r.retention ASC;
    `;
    const res = await pool.query(query, [userId]);

    return res.rows.map(row => {
      const daysSinceLast = row.last_reviewed_at
        ? Math.max(0, Math.round((Date.now() - new Date(row.last_reviewed_at).getTime()) / (1000 * 3600 * 24)))
        : 5;

      return {
        conceptId: row.concept_id,
        conceptTitle: row.concept_title || 'Concept',
        subjectName: row.subject_name || 'General',
        retention: row.retention,
        priority: row.priority || 'MEDIUM',
        daysSinceLastReview: daysSinceLast,
        estimatedMinutes: 10,
        mistakeReason: row.mistake_reason || undefined,
      };
    });
  }
}

export const revisionRepository = new RevisionRepository();

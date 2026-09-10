import { pool } from '../db/pool.js';
import { DbResource } from './ResourceRepository.js';

export interface LearnerReadingProgress {
  id: string;
  user_id: string;
  resource_id: string;
  last_page: number;
  total_pages: number;
  progress_percentage: number;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface LearnerBookmark {
  id: string;
  user_id: string;
  resource_id: string;
  notes?: string;
  created_at: string | Date;
  resource?: DbResource;
}

export interface ResourceFilterMeta {
  subjects: string[];
  topics: string[];
  resourceTypes: string[];
  exams: string[];
  tags: string[];
}

export class LearnerResourceRepository {
  private static instance: LearnerResourceRepository;

  private constructor() {}

  public static getInstance(): LearnerResourceRepository {
    if (!LearnerResourceRepository.instance) {
      LearnerResourceRepository.instance = new LearnerResourceRepository();
    }
    return LearnerResourceRepository.instance;
  }

  /**
   * Save or update learner reading progress (debounced from frontend)
   */
  public async saveProgress(
    userId: string,
    resourceId: string,
    lastPage: number,
    totalPages: number,
    progressPercentage?: number
  ): Promise<LearnerReadingProgress> {
    const calculatedPercentage =
      progressPercentage !== undefined && !isNaN(progressPercentage)
        ? Math.min(100, Math.max(0, Number(progressPercentage.toFixed(2))))
        : Math.min(100, Math.max(0, Number(((Math.max(1, lastPage) / Math.max(1, totalPages)) * 100).toFixed(2))));

    const safeLastPage = Math.max(1, lastPage || 1);
    const safeTotalPages = Math.max(1, totalPages || 1);
    const id = `prog_${userId.substring(0, 8)}_${resourceId.substring(0, 16)}`;

    const res = await pool.query(
      `INSERT INTO public.learner_resource_progress (
        id, user_id, resource_id, last_page, total_pages, progress_percentage, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, resource_id) DO UPDATE SET
        last_page = EXCLUDED.last_page,
        total_pages = EXCLUDED.total_pages,
        progress_percentage = EXCLUDED.progress_percentage,
        updated_at = NOW()
      RETURNING *`,
      [id, userId, resourceId, safeLastPage, safeTotalPages, calculatedPercentage]
    );

    return res.rows[0];
  }

  /**
   * Retrieve single resource reading progress for a user
   */
  public async getProgress(userId: string, resourceId: string): Promise<LearnerReadingProgress | null> {
    const res = await pool.query(
      `SELECT * FROM public.learner_resource_progress WHERE user_id = $1 AND resource_id = $2`,
      [userId, resourceId]
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieve resources the learner has started reading (Continue Reading)
   */
  public async getContinueReading(userId: string, limit: number = 6): Promise<any[]> {
    const res = await pool.query(
      `SELECT
        p.id AS progress_id,
        p.last_page,
        p.total_pages,
        p.progress_percentage,
        p.updated_at AS last_read_at,
        r.*,
        (b.id IS NOT NULL) AS is_bookmarked
      FROM public.learner_resource_progress p
      JOIN public.resources r ON p.resource_id = r.id
      LEFT JOIN public.learner_resource_bookmarks b ON b.user_id = p.user_id AND b.resource_id = p.resource_id
      WHERE p.user_id = $1
        AND r.status IN ('READY', 'PUBLISHED')
        AND r.visibility NOT IN ('ADMIN_ONLY', 'ARCHIVED')
      ORDER BY p.updated_at DESC
      LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  /**
   * Add bookmark
   */
  public async addBookmark(userId: string, resourceId: string, notes?: string): Promise<{ success: boolean; isBookmarked: boolean }> {
    const id = `bm_${userId.substring(0, 8)}_${resourceId.substring(0, 16)}`;
    await pool.query(
      `INSERT INTO public.learner_resource_bookmarks (id, user_id, resource_id, notes, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, resource_id) DO UPDATE SET notes = EXCLUDED.notes`,
      [id, userId, resourceId, notes || null]
    );
    return { success: true, isBookmarked: true };
  }

  /**
   * Toggle bookmark
   */
  public async toggleBookmark(userId: string, resourceId: string, notes?: string): Promise<boolean> {
    const exists = await this.isBookmarked(userId, resourceId);
    if (exists) {
      await this.removeBookmark(userId, resourceId);
      return false;
    } else {
      await this.addBookmark(userId, resourceId, notes);
      return true;
    }
  }

  /**
   * Remove bookmark
   */
  public async removeBookmark(userId: string, resourceId: string): Promise<{ success: boolean; isBookmarked: boolean }> {
    await pool.query(
      `DELETE FROM public.learner_resource_bookmarks WHERE user_id = $1 AND resource_id = $2`,
      [userId, resourceId]
    );
    return { success: true, isBookmarked: false };
  }

  /**
   * Check if single resource is bookmarked
   */
  public async isBookmarked(userId: string, resourceId: string): Promise<boolean> {
    const res = await pool.query(
      `SELECT 1 FROM public.learner_resource_bookmarks WHERE user_id = $1 AND resource_id = $2`,
      [userId, resourceId]
    );
    return res.rows.length > 0;
  }

  /**
   * Get all bookmarked resources for learner
   */
  public async getUserBookmarks(userId: string, limit: number = 50, offset: number = 0): Promise<{ bookmarks: any[]; total: number }> {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM public.learner_resource_bookmarks b
       JOIN public.resources r ON b.resource_id = r.id
       WHERE b.user_id = $1 AND r.status IN ('READY', 'PUBLISHED') AND r.visibility NOT IN ('ADMIN_ONLY')`,
      [userId]
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const res = await pool.query(
      `SELECT
        b.id AS bookmark_id,
        b.notes,
        b.created_at AS bookmarked_at,
        r.*,
        COALESCE(p.last_page, 1) AS last_page,
        COALESCE(p.progress_percentage, 0) AS progress_percentage,
        true AS is_bookmarked
      FROM public.learner_resource_bookmarks b
      JOIN public.resources r ON b.resource_id = r.id
      LEFT JOIN public.learner_resource_progress p ON p.user_id = b.user_id AND p.resource_id = b.resource_id
      WHERE b.user_id = $1
        AND r.status IN ('READY', 'PUBLISHED')
        AND r.visibility NOT IN ('ADMIN_ONLY')
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return { bookmarks: res.rows, total };
  }

  /**
   * Distinct Filter Meta for Dynamic UI Discovery
   */
  public async getFilterMeta(): Promise<ResourceFilterMeta> {
    try {
      const subjectsRes = await pool.query(
        `SELECT DISTINCT subject FROM public.resources
         WHERE subject IS NOT NULL AND status IN ('READY', 'PUBLISHED') AND visibility NOT IN ('ADMIN_ONLY')
         ORDER BY subject ASC`
      );

      const topicsRes = await pool.query(
        `SELECT DISTINCT topic FROM public.resources
         WHERE topic IS NOT NULL AND status IN ('READY', 'PUBLISHED') AND visibility NOT IN ('ADMIN_ONLY')
         ORDER BY topic ASC`
      );

      const typesRes = await pool.query(
        `SELECT DISTINCT resource_type FROM public.resources
         WHERE resource_type IS NOT NULL
           AND resource_type NOT IN ('SYLLABUS', 'SHORT_NOTE', 'PYQ_PAPER', 'PYQ')
           AND status IN ('READY', 'PUBLISHED')
           AND visibility NOT IN ('ADMIN_ONLY')
         ORDER BY resource_type ASC`
      );

      const examsRes = await pool.query(
        `SELECT DISTINCT exam FROM public.resources
         WHERE exam IS NOT NULL
           AND resource_type NOT IN ('SYLLABUS', 'SHORT_NOTE', 'PYQ_PAPER', 'PYQ')
           AND status IN ('READY', 'PUBLISHED')
           AND visibility NOT IN ('ADMIN_ONLY')
         ORDER BY exam ASC`
      );

      return {
        subjects: subjectsRes.rows.map((r) => r.subject).filter(Boolean),
        topics: topicsRes.rows.map((r) => r.topic).filter(Boolean),
        resourceTypes: typesRes.rows.map((r) => r.resource_type).filter(Boolean),
        exams: examsRes.rows.map((r) => r.exam).filter(Boolean),
        tags: ['Prelims Core', 'Mains Paper II', 'Modern History', 'Polity', 'Constitution', 'Economics', 'Environment', 'BPSC Special', 'NCERT Synopses'],
      };
    } catch {
      return {
        subjects: ['Indian Polity', 'Modern History', 'Economy', 'Environment & Ecology', 'Bihar Special', 'General Studies'],
        topics: ['Fundamental Rights', 'National Movement', 'Fiscal Policy', 'Protected Areas', 'Champaran Satyagraha'],
        resourceTypes: ['BOOK', 'REFERENCE_RESOURCE', 'OFFICIAL_DOCUMENT'],
        exams: ['UPSC CSE', 'BPSC', 'ALL'],
        tags: ['Prelims Core', 'Mains Paper II', 'Modern History', 'Polity', 'Constitution'],
      };
    }
  }
}

export const learnerResourceRepository = LearnerResourceRepository.getInstance();

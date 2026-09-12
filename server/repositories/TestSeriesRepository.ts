import pool from '../db/pool.js';
import { TestSeries, TestSeriesTest, TestSeriesWithTests, TestSeriesStatus, TestSeriesVisibility } from '../../src/types/index.js';

export interface CreateTestSeriesInput {
  name: string;
  slug?: string;
  description?: string;
  examId?: string;
  examCycle?: string;
  targetExam: string;
  category?: string;
  language?: string;
  mrp?: number;
  salePrice?: number;
  currency?: string;
  isFree?: boolean;
  previewTestCount?: number;
  coverImage?: string;
  status?: TestSeriesStatus;
  visibility?: TestSeriesVisibility;
  displayOrder?: number;
  durationDays?: number;
  createdBy?: string;
}

export interface UpdateTestSeriesInput {
  name?: string;
  slug?: string;
  description?: string;
  examId?: string;
  examCycle?: string;
  targetExam?: string;
  category?: string;
  language?: string;
  mrp?: number;
  salePrice?: number;
  currency?: string;
  isFree?: boolean;
  previewTestCount?: number;
  coverImage?: string;
  status?: TestSeriesStatus;
  visibility?: TestSeriesVisibility;
  displayOrder?: number;
  durationDays?: number;
}

export class TestSeriesRepository {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  }

  async listTestSeries(options: {
    exam?: string;
    cycle?: string;
    category?: string;
    status?: string;
    visibility?: string;
    isFree?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ series: TestSeries[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.exam && options.exam !== 'ALL') {
      params.push(options.exam);
      whereClause += ` AND (ts.target_exam ILIKE $${params.length} OR ts.exam_id ILIKE $${params.length})`;
    }

    if (options.cycle && options.cycle !== 'ALL') {
      params.push(options.cycle);
      whereClause += ` AND ts.exam_cycle ILIKE $${params.length}`;
    }

    if (options.category && options.category !== 'ALL') {
      params.push(options.category);
      whereClause += ` AND ts.category ILIKE $${params.length}`;
    }

    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      whereClause += ` AND ts.status = $${params.length}`;
    }

    if (options.visibility && options.visibility !== 'ALL') {
      params.push(options.visibility);
      whereClause += ` AND ts.visibility = $${params.length}`;
    }

    if (typeof options.isFree === 'boolean') {
      params.push(options.isFree);
      whereClause += ` AND ts.is_free = $${params.length}`;
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      whereClause += ` AND (ts.name ILIKE $${params.length} OR ts.description ILIKE $${params.length} OR ts.target_exam ILIKE $${params.length} OR ts.exam_cycle ILIKE $${params.length})`;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as count FROM public.test_series ts ${whereClause};`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit);

    // List query
    const listParams = [...params, limit, offset];
    const listQuery = `
      SELECT ts.*
      FROM public.test_series ts
      ${whereClause}
      ORDER BY ts.display_order ASC, ts.created_at DESC
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length};
    `;

    const res = await pool.query(listQuery, listParams);

    // If userId provided, check active entitlements
    let userEntitlements: Set<string> = new Set();
    if (options.userId) {
      const entRes = await pool.query(`
        SELECT DISTINCT test_series_id, metadata->>'testSeriesId' as meta_id
        FROM public.entitlements
        WHERE user_id = $1
          AND status = 'ACTIVE'
          AND starts_at <= NOW()
          AND (expires_at IS NULL OR expires_at > NOW());
      `, [options.userId]);

      entRes.rows.forEach(r => {
        if (r.test_series_id) userEntitlements.add(r.test_series_id);
        if (r.meta_id) userEntitlements.add(r.meta_id);
      });
    }

    const series = res.rows.map(row => ({
      ...this.mapRowToTestSeries(row),
      isEnrolled: options.userId ? userEntitlements.has(row.id) : false,
    }));

    return { series, total, page, totalPages };
  }

  async getTestSeriesById(id: string, userId?: string): Promise<TestSeriesWithTests | null> {
    const seriesRes = await pool.query(
      'SELECT * FROM public.test_series WHERE id = $1 LIMIT 1;',
      [id]
    );

    if (seriesRes.rows.length === 0) return null;
    const baseSeries = this.mapRowToTestSeries(seriesRes.rows[0]);

    // Check user enrollment
    let isEnrolled = false;
    if (userId) {
      const entRes = await pool.query(`
        SELECT id FROM public.entitlements
        WHERE user_id = $1
          AND (test_series_id = $2 OR metadata->>'testSeriesId' = $2 OR product_id = $2)
          AND status = 'ACTIVE'
          AND starts_at <= NOW()
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1;
      `, [userId, id]);
      isEnrolled = entRes.rows.length > 0;
    }

    // Fetch tests linked to this series
    const testsQuery = `
      SELECT
        tst.id as link_id,
        tst.test_series_id,
        tst.mock_test_id,
        tst.sequence_number,
        tst.is_free_preview,
        tst.status as link_status,
        tst.created_at as link_created_at,
        tst.updated_at as link_updated_at,
        mt.id as mock_id,
        mt.title as mock_title,
        mt.display_name as mock_display_name,
        mt.type as mock_type,
        mt.duration_minutes as mock_duration_minutes,
        mt.total_questions as mock_total_questions,
        mt.total_marks as mock_total_marks,
        mt.negative_marking_rate as mock_negative_marking_rate,
        mt.is_published as mock_is_published,
        mt.source_type as mock_source_type
      FROM public.test_series_tests tst
      JOIN public.mock_tests mt ON tst.mock_test_id = mt.id
      WHERE tst.test_series_id = $1 AND (mt.is_deleted IS NULL OR mt.is_deleted = false)
      ORDER BY tst.sequence_number ASC;
    `;

    const testsRes = await pool.query(testsQuery, [id]);

    // If userId provided, fetch user's attempts for these tests
    const userAttemptsMap: Record<string, any> = {};
    if (userId && testsRes.rows.length > 0) {
      const testIds = testsRes.rows.map(r => r.mock_id);
      const attemptsRes = await pool.query(`
        SELECT DISTINCT ON (mock_test_id)
          id, mock_test_id, score, max_score, accuracy, status, completed_at
        FROM public.mock_attempts
        WHERE user_id = $1 AND mock_test_id = ANY($2::text[])
        ORDER BY mock_test_id, completed_at DESC NULLS LAST, started_at DESC NULLS LAST;
      `, [userId, testIds]);

      attemptsRes.rows.forEach(att => {
        userAttemptsMap[att.mock_test_id] = {
          attemptId: att.id,
          score: att.score,
          maxScore: att.max_score,
          accuracy: att.accuracy,
          status: att.status,
          completedAt: att.completed_at ? new Date(att.completed_at).toISOString() : undefined,
        };
      });
    }

    const tests: TestSeriesTest[] = testsRes.rows.map(row => ({
      id: row.link_id,
      testSeriesId: row.test_series_id,
      mockTestId: row.mock_test_id,
      sequenceNumber: row.sequence_number,
      isFreePreview: row.is_free_preview,
      status: row.link_status,
      createdAt: new Date(row.link_created_at).toISOString(),
      updatedAt: new Date(row.link_updated_at).toISOString(),
      mockTest: {
        id: row.mock_id,
        title: row.mock_title,
        displayName: row.mock_display_name || row.mock_title,
        type: row.mock_type,
        durationMinutes: row.mock_duration_minutes,
        totalQuestions: row.mock_total_questions,
        totalMarks: row.mock_total_marks,
        negativeMarkingRate: row.mock_negative_marking_rate,
        isPublished: row.mock_is_published,
        sourceType: row.mock_source_type,
      },
      attemptSummary: userAttemptsMap[row.mock_test_id] || null,
    }));

    return {
      ...baseSeries,
      isEnrolled,
      tests,
    };
  }

  async getTestSeriesBySlug(slug: string, userId?: string): Promise<TestSeriesWithTests | null> {
    const res = await pool.query('SELECT id FROM public.test_series WHERE slug = $1 LIMIT 1;', [slug]);
    if (res.rows.length === 0) return null;
    return this.getTestSeriesById(res.rows[0].id, userId);
  }

  async createTestSeries(input: CreateTestSeriesInput): Promise<TestSeries> {
    const id = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = input.slug?.trim() || this.generateSlug(input.name);

    const mrp = Math.max(0, Number(input.mrp || 0));
    let salePrice = Math.max(0, Number(input.salePrice !== undefined ? input.salePrice : mrp));
    if (salePrice > mrp) salePrice = mrp;

    const isFree = input.isFree ?? (salePrice === 0 && mrp === 0);

    const query = `
      INSERT INTO public.test_series (
        id, slug, name, description, exam_id, exam_cycle, target_exam,
        category, language, mrp, sale_price, currency, is_free,
        preview_test_count, cover_image, status, visibility, display_order,
        duration_days, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *;
    `;

    const res = await pool.query(query, [
      id,
      slug,
      input.name.trim(),
      input.description || '',
      input.examId || null,
      input.examCycle || null,
      input.targetExam.trim().toUpperCase(),
      input.category || 'PRELIMS',
      input.language || 'English / Hindi',
      mrp,
      salePrice,
      input.currency || 'INR',
      isFree,
      input.previewTestCount || 0,
      input.coverImage || null,
      input.status || 'DRAFT',
      input.visibility || 'PUBLIC',
      input.displayOrder || 0,
      input.durationDays || 180,
      input.createdBy || null,
    ]);

    return this.mapRowToTestSeries(res.rows[0]);
  }

  async updateTestSeries(id: string, input: UpdateTestSeriesInput): Promise<TestSeries | null> {
    const existing = await this.getTestSeriesById(id);
    if (!existing) return null;

    const mrp = input.mrp !== undefined ? Math.max(0, Number(input.mrp)) : existing.mrp;
    let salePrice = input.salePrice !== undefined ? Math.max(0, Number(input.salePrice)) : existing.salePrice;
    if (salePrice > mrp) salePrice = mrp;

    const isFree = input.isFree !== undefined ? input.isFree : (salePrice === 0 && mrp === 0);

    const query = `
      UPDATE public.test_series
      SET
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        exam_id = COALESCE($5, exam_id),
        exam_cycle = COALESCE($6, exam_cycle),
        target_exam = COALESCE($7, target_exam),
        category = COALESCE($8, category),
        language = COALESCE($9, language),
        mrp = $10,
        sale_price = $11,
        currency = COALESCE($12, currency),
        is_free = $13,
        preview_test_count = COALESCE($14, preview_test_count),
        cover_image = COALESCE($15, cover_image),
        status = COALESCE($16, status),
        visibility = COALESCE($17, visibility),
        display_order = COALESCE($18, display_order),
        duration_days = COALESCE($19, duration_days),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const res = await pool.query(query, [
      id,
      input.name?.trim(),
      input.slug?.trim(),
      input.description,
      input.examId,
      input.examCycle,
      input.targetExam?.trim().toUpperCase(),
      input.category,
      input.language,
      mrp,
      salePrice,
      input.currency,
      isFree,
      input.previewTestCount,
      input.coverImage,
      input.status,
      input.visibility,
      input.displayOrder,
      input.durationDays,
    ]);

    return res.rows.length > 0 ? this.mapRowToTestSeries(res.rows[0]) : null;
  }

  async deleteOrArchiveTestSeries(id: string, archiveOnly: boolean = false): Promise<boolean> {
    if (archiveOnly) {
      await pool.query("UPDATE public.test_series SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1;", [id]);
      return true;
    }

    // Hard delete test_series (test_series_tests cascade deletes)
    await pool.query('DELETE FROM public.test_series WHERE id = $1;', [id]);
    return true;
  }

  async addTestToSeries(seriesId: string, mockTestId: string, options?: { sequenceNumber?: number; isFreePreview?: boolean }): Promise<void> {
    // Determine sequence number
    let seq = options?.sequenceNumber;
    if (!seq) {
      const maxRes = await pool.query(
        'SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq FROM public.test_series_tests WHERE test_series_id = $1;',
        [seriesId]
      );
      seq = parseInt(maxRes.rows[0].next_seq || '1', 10);
    }

    const linkId = `tst_${seriesId}_${mockTestId}`;
    await pool.query(`
      INSERT INTO public.test_series_tests (
        id, test_series_id, mock_test_id, sequence_number, is_free_preview, status
      ) VALUES ($1, $2, $3, $4, $5, 'PUBLISHED')
      ON CONFLICT (test_series_id, mock_test_id) DO UPDATE SET
        sequence_number = EXCLUDED.sequence_number,
        is_free_preview = EXCLUDED.is_free_preview,
        status = 'PUBLISHED',
        updated_at = NOW();
    `, [linkId, seriesId, mockTestId, seq, options?.isFreePreview ?? false]);

    await this.recalculateSeriesCounts(seriesId);
  }

  async removeTestFromSeries(seriesId: string, mockTestId: string): Promise<void> {
    await pool.query(
      'DELETE FROM public.test_series_tests WHERE test_series_id = $1 AND mock_test_id = $2;',
      [seriesId, mockTestId]
    );

    // Re-sequence remaining tests
    const remaining = await pool.query(
      'SELECT id FROM public.test_series_tests WHERE test_series_id = $1 ORDER BY sequence_number ASC;',
      [seriesId]
    );

    for (let i = 0; i < remaining.rows.length; i++) {
      await pool.query('UPDATE public.test_series_tests SET sequence_number = $2 WHERE id = $1;', [
        remaining.rows[i].id,
        i + 1,
      ]);
    }

    await this.recalculateSeriesCounts(seriesId);
  }

  async updateTestInSeries(seriesId: string, mockTestId: string, data: { sequenceNumber?: number; isFreePreview?: boolean; status?: string }): Promise<void> {
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [seriesId, mockTestId];

    if (data.sequenceNumber !== undefined) {
      params.push(data.sequenceNumber);
      updates.push(`sequence_number = $${params.length}`);
    }
    if (data.isFreePreview !== undefined) {
      params.push(data.isFreePreview);
      updates.push(`is_free_preview = $${params.length}`);
    }
    if (data.status !== undefined) {
      params.push(data.status);
      updates.push(`status = $${params.length}`);
    }

    await pool.query(
      `UPDATE public.test_series_tests SET ${updates.join(', ')} WHERE test_series_id = $1 AND mock_test_id = $2;`,
      params
    );

    await this.recalculateSeriesCounts(seriesId);
  }

  async reorderTestsInSeries(seriesId: string, testIdsInOrder: string[]): Promise<void> {
    for (let i = 0; i < testIdsInOrder.length; i++) {
      await pool.query(
        'UPDATE public.test_series_tests SET sequence_number = $3, updated_at = NOW() WHERE test_series_id = $1 AND mock_test_id = $2;',
        [seriesId, testIdsInOrder[i], i + 1]
      );
    }
  }

  async recalculateSeriesCounts(seriesId: string): Promise<void> {
    const statsRes = await pool.query(`
      SELECT
        COUNT(tst.id) as total_tests,
        COALESCE(SUM(CASE WHEN mt.is_published = true AND (mt.is_deleted IS NULL OR mt.is_deleted = false) THEN 1 ELSE 0 END), 0) as published_test_count,
        COALESCE(SUM(mt.total_questions), 0) as total_questions,
        COALESCE(SUM(CASE WHEN tst.is_free_preview = true THEN 1 ELSE 0 END), 0) as preview_count
      FROM public.test_series_tests tst
      JOIN public.mock_tests mt ON tst.mock_test_id = mt.id
      WHERE tst.test_series_id = $1;
    `, [seriesId]);

    const stats = statsRes.rows[0];
    await pool.query(`
      UPDATE public.test_series
      SET total_tests = $2, published_test_count = $3, total_questions = $4, preview_test_count = $5, updated_at = NOW()
      WHERE id = $1;
    `, [seriesId, stats.total_tests, stats.published_test_count, stats.total_questions, stats.preview_count]);
  }

  async getAvailableMockTestsForSeries(seriesId: string, search?: string): Promise<any[]> {
    let query = `
      SELECT mt.id, mt.title, mt.display_name, mt.type, mt.total_questions, mt.duration_minutes, mt.is_published, mt.source_type
      FROM public.mock_tests mt
      WHERE (mt.is_deleted IS NULL OR mt.is_deleted = false)
        AND mt.id NOT IN (
          SELECT mock_test_id FROM public.test_series_tests WHERE test_series_id = $1
        )
    `;
    const params: any[] = [seriesId];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (mt.title ILIKE $2 OR mt.display_name ILIKE $2)`;
    }

    query += ' ORDER BY mt.created_at DESC LIMIT 50;';
    const res = await pool.query(query, params);
    return res.rows.map(r => ({
      id: r.id,
      title: r.display_name || r.title,
      type: r.type,
      totalQuestions: r.total_questions,
      durationMinutes: r.duration_minutes,
      isPublished: r.is_published,
      sourceType: r.source_type,
    }));
  }

  async getExamsSummary(): Promise<{ code: string; name: string; seriesCount: number }[]> {
    const query = `
      SELECT
        e.code,
        e.name,
        COUNT(ts.id) as series_count
      FROM public.exams e
      LEFT JOIN public.test_series ts ON (ts.target_exam ILIKE e.code OR ts.exam_id = e.id) AND ts.status = 'PUBLISHED'
      GROUP BY e.code, e.name
      ORDER BY e.code ASC;
    `;
    const res = await pool.query(query);
    return res.rows.map(r => ({
      code: r.code,
      name: r.name,
      seriesCount: parseInt(r.series_count || '0', 10),
    }));
  }

  async checkUserSeriesEntitlement(userId: string, seriesId: string): Promise<boolean> {
    const res = await pool.query(`
      SELECT id FROM public.entitlements
      WHERE user_id = $1
        AND (test_series_id = $2 OR metadata->>'testSeriesId' = $2 OR product_id = $2)
        AND status = 'ACTIVE'
        AND starts_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1;
    `, [userId, seriesId]);

    return res.rows.length > 0;
  }

  private mapRowToTestSeries(row: any): TestSeries {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      examId: row.exam_id,
      examCycle: row.exam_cycle,
      targetExam: row.target_exam,
      category: row.category,
      language: row.language,
      totalTests: parseInt(row.total_tests || '0', 10),
      publishedTestCount: parseInt(row.published_test_count || '0', 10),
      totalQuestions: parseInt(row.total_questions || '0', 10),
      mrp: parseFloat(row.mrp || '0'),
      salePrice: parseFloat(row.sale_price || '0'),
      currency: row.currency || 'INR',
      isFree: Boolean(row.is_free),
      previewTestCount: parseInt(row.preview_test_count || '0', 10),
      coverImage: row.cover_image,
      status: row.status as TestSeriesStatus,
      visibility: row.visibility as TestSeriesVisibility,
      displayOrder: parseInt(row.display_order || '0', 10),
      durationDays: parseInt(row.duration_days || '180', 10),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

export const testSeriesRepository = new TestSeriesRepository();

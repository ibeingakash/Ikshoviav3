import pool from '../db/pool.js';
import { Course, CoursePrice, PlatformFeatureCode } from '../../src/types/index.js';

export class CourseRepository {
  async listCourses(filter?: { exam?: string; activeOnly?: boolean }): Promise<Course[]> {
    let query = `
      SELECT 
        c.id, c.name, c.description, c.exam, c.course_type, c.is_active, 
        c.display_order, c.start_date, c.end_date, c.default_duration_days,
        c.created_by, c.updated_by, c.created_at, c.updated_at,
        COALESCE(
          (SELECT json_agg(cf.feature_code ORDER BY cf.feature_code) 
           FROM public.course_features cf 
           WHERE cf.course_id = c.id), '[]'::json
        ) as features,
        (
          SELECT json_build_object(
            'id', p.id,
            'courseId', p.course_id,
            'currency', p.currency,
            'basePrice', p.base_price,
            'salePrice', p.sale_price,
            'isActive', p.is_active,
            'validFrom', p.valid_from,
            'validUntil', p.valid_until,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at
          )
          FROM public.prices p
          WHERE p.course_id = c.id AND p.is_active = true
          ORDER BY p.created_at DESC
          LIMIT 1
        ) as pricing
      FROM public.courses c
      WHERE 1=1
    `;

    const params: any[] = [];
    if (filter?.exam && filter.exam !== 'ALL') {
      params.push(filter.exam);
      query += ` AND (c.exam = $${params.length} OR c.exam = 'ALL')`;
    }
    if (filter?.activeOnly) {
      query += ` AND c.is_active = true`;
    }

    query += ` ORDER BY c.display_order ASC, c.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map(r => this.mapRowToCourse(r));
  }

  async getCourseById(id: string): Promise<Course | null> {
    const query = `
      SELECT 
        c.id, c.name, c.description, c.exam, c.course_type, c.is_active, 
        c.display_order, c.start_date, c.end_date, c.default_duration_days,
        c.created_by, c.updated_by, c.created_at, c.updated_at,
        COALESCE(
          (SELECT json_agg(cf.feature_code ORDER BY cf.feature_code) 
           FROM public.course_features cf 
           WHERE cf.course_id = c.id), '[]'::json
        ) as features,
        (
          SELECT json_build_object(
            'id', p.id,
            'courseId', p.course_id,
            'currency', p.currency,
            'basePrice', p.base_price,
            'salePrice', p.sale_price,
            'isActive', p.is_active,
            'validFrom', p.valid_from,
            'validUntil', p.valid_until,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at
          )
          FROM public.prices p
          WHERE p.course_id = c.id AND p.is_active = true
          ORDER BY p.created_at DESC
          LIMIT 1
        ) as pricing
      FROM public.courses c
      WHERE c.id = $1
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToCourse(res.rows[0]);
  }

  async createCourse(
    courseData: Partial<Course>,
    featureCodes: PlatformFeatureCode[] = [],
    initialPrice?: { basePrice: number; salePrice?: number; currency?: string },
    creatorId?: string
  ): Promise<Course> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const id = courseData.id || `crs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const insertCourseSql = `
        INSERT INTO public.courses (
          id, name, description, exam, course_type, is_active, display_order, 
          start_date, end_date, default_duration_days, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
        RETURNING *
      `;

      await client.query(insertCourseSql, [
        id,
        courseData.name,
        courseData.description || '',
        courseData.exam || 'UPSC',
        courseData.courseType || 'TEST_SERIES',
        courseData.isActive !== false,
        courseData.displayOrder || 0,
        courseData.startDate || null,
        courseData.endDate || null,
        courseData.defaultDurationDays || 90,
        creatorId || null,
      ]);

      // Insert features
      if (featureCodes.length > 0) {
        for (const feat of featureCodes) {
          await client.query(
            `INSERT INTO public.course_features (course_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, feat]
          );
        }
      }

      // Insert initial price
      if (initialPrice && (initialPrice.basePrice !== undefined || initialPrice.basePrice !== null)) {
        const priceId = `prc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO public.prices (id, course_id, currency, base_price, sale_price, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [
            priceId,
            id,
            initialPrice.currency || 'INR',
            Number(initialPrice.basePrice) || 0,
            initialPrice.salePrice !== undefined && initialPrice.salePrice !== null ? Number(initialPrice.salePrice) : null,
          ]
        );
      }

      await client.query('COMMIT');

      const created = await this.getCourseById(id);
      return created!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateCourse(id: string, courseData: Partial<Course>, updaterId?: string): Promise<Course> {
    const existing = await this.getCourseById(id);
    if (!existing) throw new Error(`Course with ID ${id} not found`);

    const updateSql = `
      UPDATE public.courses
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        exam = COALESCE($4, exam),
        course_type = COALESCE($5, course_type),
        is_active = COALESCE($6, is_active),
        display_order = COALESCE($7, display_order),
        start_date = COALESCE($8, start_date),
        end_date = COALESCE($9, end_date),
        default_duration_days = COALESCE($10, default_duration_days),
        updated_by = $11,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    await pool.query(updateSql, [
      id,
      courseData.name,
      courseData.description,
      courseData.exam,
      courseData.courseType,
      courseData.isActive,
      courseData.displayOrder,
      courseData.startDate,
      courseData.endDate,
      courseData.defaultDurationDays,
      updaterId || null,
    ]);

    if (courseData.features && Array.isArray(courseData.features)) {
      await this.updateCourseFeatures(id, courseData.features);
    }

    const updated = await this.getCourseById(id);
    return updated!;
  }

  async updateCourseFeatures(courseId: string, featureCodes: PlatformFeatureCode[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM public.course_features WHERE course_id = $1', [courseId]);
      for (const feat of featureCodes) {
        await client.query(
          'INSERT INTO public.course_features (course_id, feature_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [courseId, feat]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async setCoursePrice(
    courseId: string,
    priceData: { basePrice: number; salePrice?: number | null; currency?: string; validFrom?: string; validUntil?: string }
  ): Promise<CoursePrice> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deactivate prior prices for this course
      await client.query('UPDATE public.prices SET is_active = false, updated_at = NOW() WHERE course_id = $1', [courseId]);

      const priceId = `prc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await client.query(
        `INSERT INTO public.prices (
          id, course_id, currency, base_price, sale_price, is_active, valid_from, valid_until
        ) VALUES ($1, $2, $3, $4, $5, true, COALESCE($6, NOW()), $7)
        RETURNING *`,
        [
          priceId,
          courseId,
          priceData.currency || 'INR',
          Number(priceData.basePrice) || 0,
          priceData.salePrice !== undefined && priceData.salePrice !== null ? Number(priceData.salePrice) : null,
          priceData.validFrom || null,
          priceData.validUntil || null,
        ]
      );

      await client.query('COMMIT');

      const r = res.rows[0];
      return {
        id: r.id,
        courseId: r.course_id,
        currency: r.currency,
        basePrice: parseFloat(r.base_price),
        salePrice: r.sale_price !== null ? parseFloat(r.sale_price) : null,
        isActive: r.is_active,
        validFrom: r.valid_from ? new Date(r.valid_from).toISOString() : new Date().toISOString(),
        validUntil: r.valid_until ? new Date(r.valid_until).toISOString() : null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async archiveCourse(id: string, updaterId?: string): Promise<void> {
    await pool.query(
      `UPDATE public.courses SET is_active = false, updated_by = $2, updated_at = NOW() WHERE id = $1`,
      [id, updaterId || null]
    );
  }

  private mapRowToCourse(row: any): Course {
    let pricing: CoursePrice | undefined = undefined;
    if (row.pricing && typeof row.pricing === 'object' && row.pricing.id) {
      pricing = {
        id: row.pricing.id,
        courseId: row.pricing.courseId,
        currency: row.pricing.currency || 'INR',
        basePrice: parseFloat(row.pricing.basePrice) || 0,
        salePrice: row.pricing.salePrice !== null && row.pricing.salePrice !== undefined ? parseFloat(row.pricing.salePrice) : null,
        isActive: !!row.pricing.isActive,
        validFrom: row.pricing.validFrom ? new Date(row.pricing.validFrom).toISOString() : new Date().toISOString(),
        validUntil: row.pricing.validUntil ? new Date(row.pricing.validUntil).toISOString() : null,
        createdAt: row.pricing.createdAt ? new Date(row.pricing.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: row.pricing.updatedAt ? new Date(row.pricing.updatedAt).toISOString() : new Date().toISOString(),
      };
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      exam: row.exam || 'UPSC',
      courseType: row.course_type || 'TEST_SERIES',
      isActive: row.is_active !== false,
      displayOrder: row.display_order || 0,
      startDate: row.start_date ? new Date(row.start_date).toISOString() : undefined,
      endDate: row.end_date ? new Date(row.end_date).toISOString() : undefined,
      defaultDurationDays: row.default_duration_days || 90,
      features: Array.isArray(row.features) ? row.features : [],
      pricing,
      currentPrice: pricing,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}

export const courseRepository = new CourseRepository();

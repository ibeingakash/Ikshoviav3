import pool from '../db/pool.js';
import { Entitlement, EntitlementSource, EntitlementStatus, PlatformFeatureCode } from '../../src/types/index.js';

export class EntitlementRepository {
  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    const query = `
      SELECT
        e.id, e.user_id, e.course_id, e.status, e.source, e.starts_at, e.expires_at,
        e.granted_by, e.payment_id, e.metadata, e.created_at, e.updated_at,
        u.name as user_name, u.email as user_email,
        c.name as course_name, c.exam as course_exam,
        COALESCE(
          (SELECT json_agg(cf.feature_code ORDER BY cf.feature_code)
           FROM public.course_features cf
           WHERE cf.course_id = e.course_id), '[]'::json
        ) as features,
        gb.name as granted_by_name
      FROM public.entitlements e
      LEFT JOIN public.users u ON e.user_id = u.id
      LEFT JOIN public.courses c ON e.course_id = c.id
      LEFT JOIN public.users gb ON e.granted_by = gb.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(r => this.mapRowToEntitlement(r));
  }

  async listAllEntitlements(filter?: { status?: string; courseId?: string; userId?: string }): Promise<Entitlement[]> {
    let query = `
      SELECT
        e.id, e.user_id, e.course_id, e.status, e.source, e.starts_at, e.expires_at,
        e.granted_by, e.payment_id, e.metadata, e.created_at, e.updated_at,
        u.name as user_name, u.email as user_email,
        c.name as course_name, c.exam as course_exam,
        COALESCE(
          (SELECT json_agg(cf.feature_code ORDER BY cf.feature_code)
           FROM public.course_features cf
           WHERE cf.course_id = e.course_id), '[]'::json
        ) as features,
        gb.name as granted_by_name
      FROM public.entitlements e
      LEFT JOIN public.users u ON e.user_id = u.id
      LEFT JOIN public.courses c ON e.course_id = c.id
      LEFT JOIN public.users gb ON e.granted_by = gb.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filter?.status) {
      params.push(filter.status);
      query += ` AND e.status = $${params.length}`;
    }
    if (filter?.courseId) {
      params.push(filter.courseId);
      query += ` AND e.course_id = $${params.length}`;
    }
    if (filter?.userId) {
      params.push(filter.userId);
      query += ` AND e.user_id = $${params.length}`;
    }

    query += ` ORDER BY e.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows.map(r => this.mapRowToEntitlement(r));
  }

  async getEntitlementById(id: string): Promise<Entitlement | null> {
    const query = `
      SELECT
        e.id, e.user_id, e.course_id, e.status, e.source, e.starts_at, e.expires_at,
        e.granted_by, e.payment_id, e.metadata, e.created_at, e.updated_at,
        u.name as user_name, u.email as user_email,
        c.name as course_name, c.exam as course_exam,
        COALESCE(
          (SELECT json_agg(cf.feature_code ORDER BY cf.feature_code)
           FROM public.course_features cf
           WHERE cf.course_id = e.course_id), '[]'::json
        ) as features,
        gb.name as granted_by_name
      FROM public.entitlements e
      LEFT JOIN public.users u ON e.user_id = u.id
      LEFT JOIN public.courses c ON e.course_id = c.id
      LEFT JOIN public.users gb ON e.granted_by = gb.id
      WHERE e.id = $1
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToEntitlement(res.rows[0]);
  }

  async grantEntitlement(
    userId: string,
    courseId: string,
    durationDays: number = 90,
    source: EntitlementSource = 'ADMIN_GRANT',
    grantedBy?: string,
    metadata?: Record<string, any>,
    startDate?: string
  ): Promise<Entitlement> {
    const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startsAt = startDate ? new Date(startDate) : new Date();
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const query = `
      INSERT INTO public.entitlements (
        id, user_id, course_id, status, source, starts_at, expires_at,
        granted_by, metadata
      ) VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6, $7, $8)
      RETURNING *
    `;

    await pool.query(query, [
      id,
      userId,
      courseId,
      source,
      startsAt.toISOString(),
      expiresAt.toISOString(),
      grantedBy || null,
      JSON.stringify(metadata || {}),
    ]);

    const created = await this.getEntitlementById(id);
    return created!;
  }

  async extendEntitlement(
    entitlementId: string,
    additionalDays: number,
    actorId: string,
    notes?: string
  ): Promise<Entitlement> {
    if (additionalDays <= 0) {
      throw new Error('Extension duration must be greater than zero days');
    }

    const existing = await this.getEntitlementById(entitlementId);
    if (!existing) {
      throw new Error(`Entitlement with ID ${entitlementId} not found`);
    }

    const now = new Date();
    const currentExpiry = existing.expiresAt ? new Date(existing.expiresAt) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiresAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const query = `
      UPDATE public.entitlements
      SET
        expires_at = $2::timestamptz,
        status = 'ACTIVE',
        updated_at = NOW(),
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{extensions}',
          (COALESCE(metadata->'extensions', '[]'::jsonb) || $3::jsonb)
        )
      WHERE id = $1
      RETURNING id
    `;

    const extensionEntry = JSON.stringify([{
      extendedBy: actorId,
      extendedAt: now.toISOString(),
      additionalDays,
      previousExpiry: existing.expiresAt,
      newExpiry: newExpiresAt.toISOString(),
      notes: notes || 'Admin manual extension',
    }]);

    await pool.query(query, [entitlementId, newExpiresAt.toISOString(), extensionEntry]);
    const updated = await this.getEntitlementById(entitlementId);
    return updated!;
  }

  async revokeEntitlement(entitlementId: string, revokerId?: string, reason?: string): Promise<Entitlement> {
    const query = `
      UPDATE public.entitlements
      SET
        status = 'REVOKED',
        updated_at = NOW(),
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{revocation}',
          json_build_object('revokedAt', NOW(), 'revokedBy', $2::text, 'reason', $3::text)::jsonb
        )
      WHERE id = $1
      RETURNING id
    `;
    await pool.query(query, [entitlementId, revokerId || null, reason || 'Manually revoked by administrator']);
    const updated = await this.getEntitlementById(entitlementId);
    if (!updated) throw new Error(`Entitlement with ID ${entitlementId} not found`);
    return updated;
  }

  async grantOrExtendPaymentEntitlement(
    userId: string,
    courseId: string,
    durationDays: number,
    paymentId: string,
    orderId: string,
    amount: number,
    environment: 'LIVE' | 'TEST' = 'LIVE'
  ): Promise<Entitlement> {
    // Check if user already has an active entitlement for this course
    const existingQuery = `
      SELECT * FROM public.entitlements
      WHERE user_id = $1 AND course_id = $2 AND status = 'ACTIVE'
      ORDER BY expires_at DESC NULLS FIRST
      LIMIT 1;
    `;
    const existingRes = await pool.query(existingQuery, [userId, courseId]);

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const now = new Date();
      const currentExpiry = existing.expires_at ? new Date(existing.expires_at) : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const updateQuery = `
        UPDATE public.entitlements
        SET expires_at = $2::timestamptz,
            payment_id = $3,
            environment = $5,
            updated_at = NOW(),
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{renewals}',
              (COALESCE(metadata->'renewals', '[]'::jsonb) || $4::jsonb)
            )
        WHERE id = $1
        RETURNING id;
      `;
      const renewalRecord = JSON.stringify([{
        paymentId,
        orderId,
        environment,
        extendedAt: new Date().toISOString(),
        previousExpiry: existing.expires_at ? new Date(existing.expires_at).toISOString() : null,
        newExpiry: newExpiresAt.toISOString(),
      }]);
      await pool.query(updateQuery, [
        existing.id,
        newExpiresAt.toISOString(),
        paymentId,
        renewalRecord,
        environment,
      ]);
      const updated = await this.getEntitlementById(existing.id);
      return updated!;
    }

    // No active entitlement found: create new
    const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const insertQuery = `
      INSERT INTO public.entitlements (
        id, user_id, course_id, status, source, starts_at, expires_at,
        granted_by, payment_id, environment, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, 'ACTIVE', 'PAYMENT', $4, $5, NULL, $6, $7, $8, NOW(), NOW())
      RETURNING id;
    `;

    const metadata = {
      orderId,
      paymentId,
      amount,
      durationDays,
      environment,
      isTest: environment === 'TEST',
    };

    await pool.query(insertQuery, [
      id,
      userId,
      courseId,
      startsAt.toISOString(),
      expiresAt.toISOString(),
      paymentId,
      environment,
      JSON.stringify(metadata),
    ]);

    const created = await this.getEntitlementById(id);
    return created!;
  }

  async revokeByPaymentId(paymentId: string, revokerId?: string, reason: string = 'Payment refunded'): Promise<Entitlement | null> {
    const findQuery = `
      SELECT id FROM public.entitlements
      WHERE payment_id = $1 OR metadata->>'paymentId' = $1
      LIMIT 1;
    `;
    const res = await pool.query(findQuery, [paymentId]);
    if (!res.rows.length) return null;

    const entId = res.rows[0].id;
    return this.revokeEntitlement(entId, revokerId, reason);
  }

  async checkUserFeatureAccess(userId: string, featureCode: string): Promise<{ hasAccess: boolean; entitlement?: Entitlement }> {
    const query = `
      SELECT
        e.id, e.user_id, e.course_id, e.status, e.source, e.starts_at, e.expires_at,
        e.granted_by, e.payment_id, e.metadata, e.created_at, e.updated_at,
        c.name as course_name, c.exam as course_exam
      FROM public.entitlements e
      JOIN public.courses c ON e.course_id = c.id
      JOIN public.course_features cf ON cf.course_id = e.course_id
      WHERE e.user_id = $1
        AND e.status = 'ACTIVE'
        AND cf.feature_code = $2
        AND e.starts_at <= NOW()
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
      ORDER BY e.expires_at DESC NULLS FIRST
      LIMIT 1
    `;
    const res = await pool.query(query, [userId, featureCode]);
    if (res.rows.length === 0) {
      return { hasAccess: false };
    }
    return {
      hasAccess: true,
      entitlement: this.mapRowToEntitlement(res.rows[0]),
    };
  }

  async getUserActiveFeatures(userId: string): Promise<PlatformFeatureCode[]> {
    const query = `
      SELECT DISTINCT cf.feature_code
      FROM public.entitlements e
      JOIN public.courses c ON e.course_id = c.id
      JOIN public.course_features cf ON cf.course_id = e.course_id
      WHERE e.user_id = $1
        AND e.status = 'ACTIVE'
        AND e.starts_at <= NOW()
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(r => r.feature_code as PlatformFeatureCode);
  }

  private mapRowToEntitlement(row: any): Entitlement {
    const now = new Date();
    const startsAt = new Date(row.starts_at);
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;

    let effectiveStatus: EntitlementStatus = row.status;
    if (row.status === 'REVOKED') {
      effectiveStatus = 'REVOKED';
    } else if (startsAt > now) {
      effectiveStatus = 'PENDING';
    } else if (expiresAt && expiresAt <= now) {
      effectiveStatus = 'EXPIRED';
    } else {
      effectiveStatus = 'ACTIVE';
    }

    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      courseId: row.course_id,
      courseName: row.course_name,
      courseExam: row.course_exam,
      features: Array.isArray(row.features) ? row.features : [],
      status: effectiveStatus,
      source: row.source,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      daysRemaining,
      grantedBy: row.granted_by,
      grantedByName: row.granted_by_name,
      paymentId: row.payment_id,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

export const entitlementRepository = new EntitlementRepository();

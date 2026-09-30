import pool from '../db/pool.js';
import { Coupon, DiscountType, CouponValidationResult } from '../../src/types/index.js';

export class CouponRepository {
  private mapRowToCoupon(r: any): Coupon {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      discountType: r.discount_type as DiscountType,
      discountValue: parseFloat(r.discount_value),
      maxDiscount: r.max_discount ? parseFloat(r.max_discount) : null,
      minOrderValue: parseFloat(r.min_order_value || '0'),
      courseId: r.course_id,
      courseName: r.course_name,
      startDate: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
      expiryDate: r.expiry_date ? new Date(r.expiry_date).toISOString() : null,
      usageLimit: r.usage_limit ? parseInt(r.usage_limit, 10) : null,
      perUserLimit: r.per_user_limit ? parseInt(r.per_user_limit, 10) : 1,
      timesUsed: r.times_used ? parseInt(r.times_used, 10) : 0,
      isActive: r.is_active,
      createdBy: r.created_by,
      createdByName: r.created_by_name,
      metadata: r.metadata || {},
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  async listCoupons(filter?: { activeOnly?: boolean; courseId?: string; search?: string }): Promise<Coupon[]> {
    let query = `
      SELECT 
        c.id, c.code, c.name, c.description, c.discount_type, c.discount_value,
        c.max_discount, c.min_order_value, c.course_id, c.start_date, c.expiry_date,
        c.usage_limit, c.per_user_limit, c.times_used, c.is_active, c.created_by,
        c.metadata, c.created_at, c.updated_at,
        crs.name as course_name,
        u.name as created_by_name
      FROM public.coupons c
      LEFT JOIN public.courses crs ON c.course_id = crs.id
      LEFT JOIN public.users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.activeOnly) {
      params.push(true);
      query += ` AND c.is_active = $${params.length}`;
      query += ` AND c.start_date <= NOW() AND (c.expiry_date IS NULL OR c.expiry_date > NOW())`;
    }

    if (filter?.courseId) {
      params.push(filter.courseId);
      query += ` AND (c.course_id IS NULL OR c.course_id = $${params.length})`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.trim()}%`);
      query += ` AND (c.code ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map(r => this.mapRowToCoupon(r));
  }

  async getCouponById(id: string): Promise<Coupon | null> {
    const query = `
      SELECT 
        c.id, c.code, c.name, c.description, c.discount_type, c.discount_value,
        c.max_discount, c.min_order_value, c.course_id, c.start_date, c.expiry_date,
        c.usage_limit, c.per_user_limit, c.times_used, c.is_active, c.created_by,
        c.metadata, c.created_at, c.updated_at,
        crs.name as course_name,
        u.name as created_by_name
      FROM public.coupons c
      LEFT JOIN public.courses crs ON c.course_id = crs.id
      LEFT JOIN public.users u ON c.created_by = u.id
      WHERE c.id = $1
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToCoupon(res.rows[0]);
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const cleanCode = code.trim().toUpperCase();
    const query = `
      SELECT 
        c.id, c.code, c.name, c.description, c.discount_type, c.discount_value,
        c.max_discount, c.min_order_value, c.course_id, c.start_date, c.expiry_date,
        c.usage_limit, c.per_user_limit, c.times_used, c.is_active, c.created_by,
        c.metadata, c.created_at, c.updated_at,
        crs.name as course_name,
        u.name as created_by_name
      FROM public.coupons c
      LEFT JOIN public.courses crs ON c.course_id = crs.id
      LEFT JOIN public.users u ON c.created_by = u.id
      WHERE UPPER(c.code) = $1
    `;
    const res = await pool.query(query, [cleanCode]);
    if (res.rows.length === 0) return null;
    return this.mapRowToCoupon(res.rows[0]);
  }

  async createCoupon(data: {
    code: string;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscount?: number | null;
    minOrderValue?: number;
    courseId?: string | null;
    startDate?: string;
    expiryDate?: string | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    isActive?: boolean;
    createdBy?: string;
    metadata?: Record<string, any>;
  }): Promise<Coupon> {
    const cleanCode = data.code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Coupon code cannot be empty');
    if (data.discountValue <= 0) throw new Error('Discount value must be greater than zero');
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    const id = `cpn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const query = `
      INSERT INTO public.coupons (
        id, code, name, description, discount_type, discount_value,
        max_discount, min_order_value, course_id, start_date, expiry_date,
        usage_limit, per_user_limit, times_used, is_active, created_by,
        metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, 0, $14, $15,
        $16, NOW(), NOW()
      )
      RETURNING id
    `;

    await pool.query(query, [
      id,
      cleanCode,
      data.name.trim(),
      data.description || null,
      data.discountType,
      data.discountValue,
      data.maxDiscount || null,
      data.minOrderValue || 0,
      data.courseId || null,
      data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
      data.usageLimit || null,
      data.perUserLimit || 1,
      data.isActive !== undefined ? data.isActive : true,
      data.createdBy || null,
      JSON.stringify(data.metadata || {}),
    ]);

    const created = await this.getCouponById(id);
    return created!;
  }

  async updateCoupon(
    id: string,
    updates: Partial<{
      name: string;
      description?: string | null;
      discountType: DiscountType;
      discountValue: number;
      maxDiscount?: number | null;
      minOrderValue: number;
      courseId?: string | null;
      startDate: string;
      expiryDate?: string | null;
      usageLimit?: number | null;
      perUserLimit: number;
      isActive: boolean;
      metadata?: Record<string, any>;
    }>
  ): Promise<Coupon> {
    const existing = await this.getCouponById(id);
    if (!existing) throw new Error(`Coupon not found with ID: ${id}`);

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      fields.push(`name = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description);
      fields.push(`description = $${values.length}`);
    }
    if (updates.discountType !== undefined) {
      values.push(updates.discountType);
      fields.push(`discount_type = $${values.length}`);
    }
    if (updates.discountValue !== undefined) {
      if (updates.discountValue <= 0) throw new Error('Discount value must be greater than zero');
      values.push(updates.discountValue);
      fields.push(`discount_value = $${values.length}`);
    }
    if (updates.maxDiscount !== undefined) {
      values.push(updates.maxDiscount);
      fields.push(`max_discount = $${values.length}`);
    }
    if (updates.minOrderValue !== undefined) {
      values.push(updates.minOrderValue);
      fields.push(`min_order_value = $${values.length}`);
    }
    if (updates.courseId !== undefined) {
      values.push(updates.courseId);
      fields.push(`course_id = $${values.length}`);
    }
    if (updates.startDate !== undefined) {
      values.push(new Date(updates.startDate).toISOString());
      fields.push(`start_date = $${values.length}`);
    }
    if (updates.expiryDate !== undefined) {
      values.push(updates.expiryDate ? new Date(updates.expiryDate).toISOString() : null);
      fields.push(`expiry_date = $${values.length}`);
    }
    if (updates.usageLimit !== undefined) {
      values.push(updates.usageLimit);
      fields.push(`usage_limit = $${values.length}`);
    }
    if (updates.perUserLimit !== undefined) {
      values.push(updates.perUserLimit);
      fields.push(`per_user_limit = $${values.length}`);
    }
    if (updates.isActive !== undefined) {
      values.push(updates.isActive);
      fields.push(`is_active = $${values.length}`);
    }
    if (updates.metadata !== undefined) {
      values.push(JSON.stringify(updates.metadata));
      fields.push(`metadata = $${values.length}`);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE public.coupons
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING id
    `;

    await pool.query(query, values);
    const updated = await this.getCouponById(id);
    return updated!;
  }

  async deleteOrArchiveCoupon(id: string): Promise<{ success: boolean; archived: boolean; message: string }> {
    const existing = await this.getCouponById(id);
    if (!existing) throw new Error(`Coupon not found with ID: ${id}`);

    // Check if used in historical orders
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as count FROM public.coupon_usages WHERE coupon_id = $1',
      [id]
    );
    const usageCount = parseInt(usageCheck.rows[0].count, 10);

    if (usageCount > 0) {
      // Historical safety: archive instead of hard delete
      await pool.query(
        'UPDATE public.coupons SET is_active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      return {
        success: true,
        archived: true,
        message: 'Coupon has historical usage records and was archived (deactivated) to preserve audit trails.',
      };
    }

    // Never used: safe to delete
    await pool.query('DELETE FROM public.coupons WHERE id = $1', [id]);
    return {
      success: true,
      archived: false,
      message: 'Coupon was permanently removed as it has no historical usage.',
    };
  }

  async validateCoupon(
    code: string,
    courseId: string,
    userId: string,
    originalPrice: number
  ): Promise<CouponValidationResult> {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      return {
        isValid: false,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon is invalid or no longer available.',
      };
    }

    if (!coupon.isActive) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon is invalid or no longer available.',
      };
    }

    const now = new Date();
    const startDate = new Date(coupon.startDate);
    if (startDate > now) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon is invalid or no longer available.',
      };
    }

    if (coupon.expiryDate) {
      const expiryDate = new Date(coupon.expiryDate);
      if (expiryDate <= now) {
        return {
          isValid: false,
          coupon,
          originalPrice,
          discountAmount: 0,
          finalAmount: originalPrice,
          error: 'Coupon is invalid or no longer available.',
        };
      }
    }

    if (coupon.courseId && coupon.courseId !== courseId) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon is invalid or no longer available.',
      };
    }

    if (originalPrice < coupon.minOrderValue) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
      };
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.timesUsed >= coupon.usageLimit) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon is invalid or no longer available.',
      };
    }

    // Check per-user limit
    const userUsageQuery = `
      SELECT COUNT(*) as count FROM public.coupon_usages
      WHERE coupon_id = $1 AND user_id = $2
    `;
    const userUsageRes = await pool.query(userUsageQuery, [coupon.id, userId]);
    const userUsageCount = parseInt(userUsageRes.rows[0].count, 10);
    if (userUsageCount >= coupon.perUserLimit) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'You have reached the maximum redemption limit for this coupon.',
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(((originalPrice * coupon.discountValue) / 100) * 100) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    const finalAmount = Math.round((originalPrice - discountAmount) * 100) / 100;

    // Safety rule: final payable amount must be positive unless explicit zero-order support
    if (finalAmount <= 0) {
      return {
        isValid: false,
        coupon,
        originalPrice,
        discountAmount: 0,
        finalAmount: originalPrice,
        error: 'Coupon discount cannot exceed or reduce order value to zero.',
      };
    }

    return {
      isValid: true,
      coupon,
      discountAmount,
      originalPrice,
      finalAmount,
      message: `Coupon applied: ${coupon.code} (-₹${discountAmount.toLocaleString('en-IN')})`,
    };
  }

  async recordCouponUsage(
    clientOrPool: any,
    couponId: string,
    userId: string,
    orderId: string,
    paymentId: string | null,
    discountAmount: number,
    originalAmount: number,
    finalAmount: number
  ): Promise<void> {
    const id = `cuse_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const query = `
      INSERT INTO public.coupon_usages (
        id, coupon_id, user_id, order_id, payment_id,
        discount_amount, original_amount, final_amount, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    await clientOrPool.query(query, [
      id,
      couponId,
      userId,
      orderId,
      paymentId,
      discountAmount,
      originalAmount,
      finalAmount,
    ]);

    // Atomically increment times_used
    await clientOrPool.query(
      'UPDATE public.coupons SET times_used = times_used + 1, updated_at = NOW() WHERE id = $1',
      [couponId]
    );
  }
}

export const couponRepository = new CouponRepository();

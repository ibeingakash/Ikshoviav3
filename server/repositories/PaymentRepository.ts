import { pool } from '../db/pool.js';
import { PaymentStatus } from '../services/payments/types.js';
import {
  CommercialDashboardMetrics,
  RevenueAnalyticsMetrics,
  CourseSalesAnalytics,
} from '../../src/types/index.js';

export interface PaymentOrderRecord {
  id: string;
  userId: string;
  courseId: string;
  priceId?: string;
  provider: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  courseId: string;
  provider: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  verifiedAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserPurchaseItem {
  paymentId: string;
  orderId: string;
  courseId: string;
  courseName: string;
  courseExam: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string;
  entitlementStatus?: string;
  entitlementExpiresAt?: string;
  isAccessActive: boolean;
}

export interface AdminPaymentListItem {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  courseExam: string;
  provider: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  verifiedAt?: string;
  createdAt: string;
  entitlementId?: string;
  entitlementStatus?: string;
  entitlementExpiresAt?: string;
}

export class PaymentRepository {
  async createOrder(data: {
    id: string;
    userId: string;
    courseId: string;
    priceId?: string;
    provider?: string;
    providerOrderId?: string;
    amount: number;
    currency?: string;
    status?: PaymentStatus;
    metadata?: Record<string, any>;
  }): Promise<PaymentOrderRecord> {
    const query = `
      INSERT INTO public.payment_orders (
        id, user_id, course_id, price_id, provider, provider_order_id,
        amount, currency, status, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `;

    const res = await pool.query(query, [
      data.id,
      data.userId,
      data.courseId,
      data.priceId || null,
      data.provider || 'RAZORPAY',
      data.providerOrderId || null,
      data.amount,
      data.currency || 'INR',
      data.status || 'CREATED',
      JSON.stringify(data.metadata || {}),
    ]);

    return this.mapOrder(res.rows[0]);
  }

  async getOrderById(orderId: string): Promise<PaymentOrderRecord | null> {
    const res = await pool.query(
      'SELECT * FROM public.payment_orders WHERE id = $1 LIMIT 1',
      [orderId]
    );
    if (!res.rows.length) return null;
    return this.mapOrder(res.rows[0]);
  }

  async getOrderByProviderOrderId(providerOrderId: string): Promise<PaymentOrderRecord | null> {
    const res = await pool.query(
      'SELECT * FROM public.payment_orders WHERE provider_order_id = $1 LIMIT 1',
      [providerOrderId]
    );
    if (!res.rows.length) return null;
    return this.mapOrder(res.rows[0]);
  }

  async updateOrderStatus(
    orderId: string,
    status: PaymentStatus,
    providerOrderId?: string,
    metadataUpdates?: Record<string, any>
  ): Promise<PaymentOrderRecord | null> {
    let query = `
      UPDATE public.payment_orders
      SET status = $2,
          provider_order_id = COALESCE($3, provider_order_id),
          metadata = metadata || $4::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const res = await pool.query(query, [
      orderId,
      status,
      providerOrderId || null,
      JSON.stringify(metadataUpdates || {}),
    ]);

    if (!res.rows.length) return null;
    return this.mapOrder(res.rows[0]);
  }

  async createPayment(data: {
    id: string;
    orderId: string;
    userId: string;
    courseId: string;
    provider?: string;
    providerPaymentId?: string;
    providerOrderId?: string;
    amount: number;
    currency?: string;
    status?: PaymentStatus;
    method?: string;
    verifiedAt?: Date;
    metadata?: Record<string, any>;
  }): Promise<PaymentRecord> {
    const query = `
      INSERT INTO public.payments (
        id, order_id, user_id, course_id, provider, provider_payment_id,
        provider_order_id, amount, currency, status, method, verified_at, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *;
    `;

    const res = await pool.query(query, [
      data.id,
      data.orderId,
      data.userId,
      data.courseId,
      data.provider || 'RAZORPAY',
      data.providerPaymentId || null,
      data.providerOrderId || null,
      data.amount,
      data.currency || 'INR',
      data.status || 'PENDING',
      data.method || null,
      data.verifiedAt || null,
      JSON.stringify(data.metadata || {}),
    ]);

    return this.mapPayment(res.rows[0]);
  }

  async getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    const res = await pool.query(
      'SELECT * FROM public.payments WHERE id = $1 LIMIT 1',
      [paymentId]
    );
    if (!res.rows.length) return null;
    return this.mapPayment(res.rows[0]);
  }

  async getPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null> {
    const res = await pool.query(
      'SELECT * FROM public.payments WHERE provider_payment_id = $1 LIMIT 1',
      [providerPaymentId]
    );
    if (!res.rows.length) return null;
    return this.mapPayment(res.rows[0]);
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const res = await pool.query(
      'SELECT * FROM public.payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    if (!res.rows.length) return null;
    return this.mapPayment(res.rows[0]);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    verifiedAt?: Date,
    method?: string,
    metadataUpdates?: Record<string, any>
  ): Promise<PaymentRecord | null> {
    const query = `
      UPDATE public.payments
      SET status = $2,
          verified_at = COALESCE($3, verified_at),
          method = COALESCE($4, method),
          metadata = metadata || $5::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const res = await pool.query(query, [
      paymentId,
      status,
      verifiedAt || null,
      method || null,
      JSON.stringify(metadataUpdates || {}),
    ]);

    if (!res.rows.length) return null;
    return this.mapPayment(res.rows[0]);
  }

  async listUserPurchases(userId: string): Promise<UserPurchaseItem[]> {
    const query = `
      SELECT 
        p.id as payment_id,
        p.order_id,
        p.course_id,
        c.name as course_name,
        c.exam as course_exam,
        p.amount,
        p.currency,
        p.status,
        p.method as payment_method,
        p.verified_at,
        p.created_at,
        e.id as entitlement_id,
        e.status as entitlement_status,
        e.expires_at as entitlement_expires_at
      FROM public.payments p
      JOIN public.courses c ON p.course_id = c.id
      LEFT JOIN public.entitlements e ON (e.user_id = p.user_id AND e.course_id = p.course_id AND e.status = 'ACTIVE')
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC;
    `;

    const res = await pool.query(query, [userId]);
    return res.rows.map(row => {
      const isExpired = row.entitlement_expires_at && new Date(row.entitlement_expires_at) < new Date();
      const isAccessActive = row.status === 'PAID' && row.entitlement_status === 'ACTIVE' && !isExpired;

      return {
        paymentId: row.payment_id,
        orderId: row.order_id,
        courseId: row.course_id,
        courseName: row.course_name,
        courseExam: row.course_exam || 'UPSC',
        amount: parseFloat(row.amount),
        currency: row.currency || 'INR',
        status: row.status,
        paymentMethod: row.payment_method,
        paidAt: row.verified_at ? new Date(row.verified_at).toISOString() : new Date(row.created_at).toISOString(),
        entitlementStatus: row.entitlement_status,
        entitlementExpiresAt: row.entitlement_expires_at ? new Date(row.entitlement_expires_at).toISOString() : undefined,
        isAccessActive,
      };
    });
  }

  async listAdminPayments(filters?: {
    status?: string;
    courseId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: AdminPaymentListItem[]; total: number }> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters?.courseId && filters.courseId !== 'ALL') {
      conditions.push(`p.course_id = $${paramIndex++}`);
      params.push(filters.courseId);
    }

    if (filters?.search && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      conditions.push(`(
        p.id ILIKE $${paramIndex} OR
        p.order_id ILIKE $${paramIndex} OR
        p.provider_payment_id ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex}
      )`);
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM public.payments p
       JOIN public.users u ON p.user_id = u.id
       JOIN public.courses c ON p.course_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT 
        p.id,
        p.order_id,
        p.user_id,
        u.name as user_name,
        u.email as user_email,
        p.course_id,
        c.name as course_name,
        c.exam as course_exam,
        p.provider,
        p.provider_payment_id,
        p.provider_order_id,
        p.amount,
        p.currency,
        p.status,
        p.method,
        p.verified_at,
        p.created_at,
        e.id as entitlement_id,
        e.status as entitlement_status,
        e.expires_at as entitlement_expires_at
      FROM public.payments p
      JOIN public.users u ON p.user_id = u.id
      JOIN public.courses c ON p.course_id = c.id
      LEFT JOIN public.entitlements e ON (e.user_id = p.user_id AND e.course_id = p.course_id AND e.status = 'ACTIVE')
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    params.push(limit, offset);
    const res = await pool.query(query, params);

    const items: AdminPaymentListItem[] = res.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userName: row.user_name || 'Anonymous',
      userEmail: row.user_email || 'No email',
      courseId: row.course_id,
      courseName: row.course_name,
      courseExam: row.course_exam || 'UPSC',
      provider: row.provider,
      providerPaymentId: row.provider_payment_id,
      providerOrderId: row.provider_order_id,
      amount: parseFloat(row.amount),
      currency: row.currency || 'INR',
      status: row.status,
      method: row.method,
      verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString(),
      entitlementId: row.entitlement_id,
      entitlementStatus: row.entitlement_status,
      entitlementExpiresAt: row.entitlement_expires_at ? new Date(row.entitlement_expires_at).toISOString() : undefined,
    }));

    return { items, total };
  }

  async getFinancialMetrics(): Promise<{
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    refundedCount: number;
    failedCount: number;
  }> {
    const res = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM public.payments
      GROUP BY status;
    `);

    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let failedCount = 0;

    for (const r of res.rows) {
      const c = parseInt(r.count, 10);
      const amt = parseFloat(r.total_amount);
      if (r.status === 'PAID') {
        paidCount = c;
        totalRevenue += amt;
      } else if (r.status === 'PENDING' || r.status === 'CREATED') {
        pendingCount += c;
      } else if (r.status === 'REFUNDED') {
        refundedCount += c;
      } else if (r.status === 'FAILED') {
        failedCount += c;
      }
    }

    return {
      totalRevenue,
      paidCount,
      pendingCount,
      refundedCount,
      failedCount,
    };
  }

  async getCommercialDashboardMetrics(): Promise<CommercialDashboardMetrics> {
    const coursesRes = await pool.query(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(*) FILTER (WHERE is_active = true) as active_courses
      FROM public.courses;
    `);

    const entitlementsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) FILTER (WHERE status = 'ACTIVE' AND source = 'PAYMENT' AND starts_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW())) as active_paid_users,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND starts_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW())) as active_entitlements,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND starts_at <= NOW() AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '7 days') as expiring_7d,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND starts_at <= NOW() AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '30 days') as expiring_30d
      FROM public.entitlements;
    `);

    const paymentsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) as total_verified_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PAID' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as this_month_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PAID' AND created_at >= NOW() - INTERVAL '30 days'), 0) as last_30d_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'REFUNDED'), 0) as refunds_amount,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'CREATED')) as pending_count
      FROM public.payments;
    `);

    const cRow = coursesRes.rows[0] || {};
    const eRow = entitlementsRes.rows[0] || {};
    const pRow = paymentsRes.rows[0] || {};

    return {
      totalCourses: parseInt(cRow.total_courses || '0', 10),
      activeCourses: parseInt(cRow.active_courses || '0', 10),
      activePaidUsers: parseInt(eRow.active_paid_users || '0', 10),
      activeEntitlements: parseInt(eRow.active_entitlements || '0', 10),
      expiringSoon7Days: parseInt(eRow.expiring_7d || '0', 10),
      expiringSoon30Days: parseInt(eRow.expiring_30d || '0', 10),
      totalVerifiedRevenue: parseFloat(pRow.total_verified_revenue || '0'),
      thisMonthRevenue: parseFloat(pRow.this_month_revenue || '0'),
      last30DaysRevenue: parseFloat(pRow.last_30d_revenue || '0'),
      refundsAmount: parseFloat(pRow.refunds_amount || '0'),
      failedPaymentsCount: parseInt(pRow.failed_count || '0', 10),
      pendingPaymentsCount: parseInt(pRow.pending_count || '0', 10),
    };
  }

  async getRevenueAnalytics(
    timeRange: string = '30days',
    customStart?: string,
    customEnd?: string
  ): Promise<RevenueAnalyticsMetrics> {
    let dateFilter = '';
    const params: any[] = [];

    if (timeRange === 'today') {
      dateFilter = ` AND p.created_at >= CURRENT_DATE`;
    } else if (timeRange === '7days') {
      dateFilter = ` AND p.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeRange === '30days') {
      dateFilter = ` AND p.created_at >= NOW() - INTERVAL '30 days'`;
    } else if (timeRange === 'this_month') {
      dateFilter = ` AND p.created_at >= date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'last_month') {
      dateFilter = ` AND p.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND p.created_at < date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'custom' && customStart && customEnd) {
      params.push(new Date(customStart).toISOString());
      params.push(new Date(customEnd).toISOString());
      dateFilter = ` AND p.created_at >= $1 AND p.created_at <= $2`;
    }

    const query = `
      SELECT 
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PAID'), 0) as gross_verified_revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'REFUNDED'), 0) as refunded_amount,
        COUNT(p.id) FILTER (WHERE p.status = 'PAID') as paid_orders_count
      FROM public.payments p
      WHERE 1=1 ${dateFilter};
    `;

    const res = await pool.query(query, params);
    const row = res.rows[0] || {};
    const gross = parseFloat(row.gross_verified_revenue || '0');
    const refunds = parseFloat(row.refunded_amount || '0');
    const paidCount = parseInt(row.paid_orders_count || '0', 10);
    const netRevenue = gross - refunds;
    const aov = paidCount > 0 ? Math.round((gross / paidCount) * 100) / 100 : 0;

    // Enrollments in this period
    let entDateFilter = '';
    const entParams: any[] = [];
    if (timeRange === 'today') {
      entDateFilter = ` AND created_at >= CURRENT_DATE`;
    } else if (timeRange === '7days') {
      entDateFilter = ` AND created_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeRange === '30days') {
      entDateFilter = ` AND created_at >= NOW() - INTERVAL '30 days'`;
    } else if (timeRange === 'this_month') {
      entDateFilter = ` AND created_at >= date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'last_month') {
      entDateFilter = ` AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'custom' && customStart && customEnd) {
      entParams.push(new Date(customStart).toISOString());
      entParams.push(new Date(customEnd).toISOString());
      entDateFilter = ` AND created_at >= $1 AND created_at <= $2`;
    }

    const entRes = await pool.query(
      `SELECT COUNT(*) as count FROM public.entitlements WHERE source = 'PAYMENT' ${entDateFilter}`,
      entParams
    );
    const enrollments = parseInt(entRes.rows[0]?.count || '0', 10);

    return {
      grossVerifiedRevenue: gross,
      refundedAmount: refunds,
      netRevenue,
      paidOrdersCount: paidCount,
      successfulEnrollments: enrollments,
      averageOrderValue: aov,
    };
  }

  async getCourseSalesAnalytics(
    timeRange: string = '30days',
    customStart?: string,
    customEnd?: string
  ): Promise<CourseSalesAnalytics[]> {
    let dateFilter = '';
    const params: any[] = [];

    if (timeRange === 'today') {
      dateFilter = ` AND p.created_at >= CURRENT_DATE`;
    } else if (timeRange === '7days') {
      dateFilter = ` AND p.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeRange === '30days') {
      dateFilter = ` AND p.created_at >= NOW() - INTERVAL '30 days'`;
    } else if (timeRange === 'this_month') {
      dateFilter = ` AND p.created_at >= date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'last_month') {
      dateFilter = ` AND p.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND p.created_at < date_trunc('month', CURRENT_DATE)`;
    } else if (timeRange === 'custom' && customStart && customEnd) {
      params.push(new Date(customStart).toISOString());
      params.push(new Date(customEnd).toISOString());
      dateFilter = ` AND p.created_at >= $1 AND p.created_at <= $2`;
    }

    const query = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        c.exam as course_exam,
        COUNT(p.id) FILTER (WHERE p.status = 'PAID') as paid_orders,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PAID'), 0) as gross_revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'REFUNDED'), 0) as refunds,
        (
          SELECT COUNT(DISTINCT e.user_id)
          FROM public.entitlements e
          WHERE e.course_id = c.id
            AND e.status = 'ACTIVE'
            AND e.starts_at <= NOW()
            AND (e.expires_at IS NULL OR e.expires_at > NOW())
        ) as active_students
      FROM public.courses c
      LEFT JOIN public.payments p ON p.course_id = c.id ${dateFilter}
      GROUP BY c.id, c.name, c.exam
      ORDER BY gross_revenue DESC, c.name ASC;
    `;

    const res = await pool.query(query, params);
    return res.rows.map(row => {
      const gross = parseFloat(row.gross_revenue || '0');
      const refunds = parseFloat(row.refunds || '0');
      return {
        courseId: row.course_id,
        courseName: row.course_name,
        exam: row.course_exam || 'UPSC',
        paidOrders: parseInt(row.paid_orders || '0', 10),
        grossRevenue: gross,
        refunds,
        netRevenue: gross - refunds,
        activeStudents: parseInt(row.active_students || '0', 10),
      };
    });
  }

  async recordWebhookEvent(
    eventId: string,
    provider: string,
    eventType: string,
    payload: any,
    status: string = 'PROCESSED'
  ): Promise<boolean> {
    const query = `
      INSERT INTO public.payment_webhook_events (id, provider, event_id, event_type, payload, status, processed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (event_id) DO NOTHING
      RETURNING id;
    `;

    const id = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const res = await pool.query(query, [
      id,
      provider,
      eventId,
      eventType,
      JSON.stringify(payload || {}),
      status,
    ]);

    // If rows.length > 0, it was newly inserted (not duplicate).
    return res.rows.length > 0;
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const res = await pool.query(
      'SELECT id FROM public.payment_webhook_events WHERE event_id = $1 LIMIT 1',
      [eventId]
    );
    return res.rows.length > 0;
  }

  private mapOrder(row: any): PaymentOrderRecord {
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      priceId: row.price_id,
      provider: row.provider,
      providerOrderId: row.provider_order_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  private mapPayment(row: any): PaymentRecord {
    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      courseId: row.course_id,
      provider: row.provider,
      providerPaymentId: row.provider_payment_id,
      providerOrderId: row.provider_order_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      method: row.method,
      verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : undefined,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

export const paymentRepository = new PaymentRepository();

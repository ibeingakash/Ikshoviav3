import pool from '../db/pool.js';
import { pushNotificationService } from '../services/PushNotificationService.js';

export type NotificationType =
  | 'ASSIGNMENT_ASSIGNED'
  | 'ASSIGNMENT_DUE_SOON'
  | 'ASSIGNMENT_EVALUATED'
  | 'NEW_RESOURCE'
  | 'CLASS_SCHEDULED'
  | 'CLASS_REMINDER'
  | 'LIVE_CLASS_STARTED'
  | 'ANNOUNCEMENT'
  | 'QUIZ_ASSIGNED'
  | 'QUIZ_RESULT'
  | 'TEST_ASSIGNED'
  | 'TEST_RESULT'
  | 'TEACHER_FEEDBACK'
  | 'PAYMENT_SUCCESS'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SYSTEM'
  | 'SECURITY'
  | 'PASSWORD_CHANGED';

export interface NotificationEntity {
  id: string;
  recipientUserId: string;
  actorUserId?: string;
  type: NotificationType | string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  deepLink?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata: Record<string, any>;
}

export interface UserNotificationPreferences {
  userId: string;
  assignments: boolean;
  tests: boolean;
  classes: boolean;
  resources: boolean;
  announcements: boolean;
  results: boolean;
  systemSecurity: boolean; // Always true
  updatedAt: string;
}

export class NotificationRepository {
  /**
   * Determine category from notification type for preference filtering
   */
  private getCategory(type: string): keyof Omit<UserNotificationPreferences, 'userId' | 'updatedAt'> {
    switch (type) {
      case 'ASSIGNMENT_ASSIGNED':
      case 'ASSIGNMENT_DUE_SOON':
      case 'ASSIGNMENT_EVALUATED':
        return 'assignments';
      case 'QUIZ_ASSIGNED':
      case 'QUIZ_RESULT':
      case 'TEST_ASSIGNED':
      case 'TEST_RESULT':
        return 'tests';
      case 'CLASS_SCHEDULED':
      case 'CLASS_REMINDER':
      case 'LIVE_CLASS_STARTED':
        return 'classes';
      case 'NEW_RESOURCE':
        return 'resources';
      case 'ANNOUNCEMENT':
        return 'announcements';
      case 'TEACHER_FEEDBACK':
        return 'results';
      case 'SECURITY':
      case 'PASSWORD_CHANGED':
      case 'SYSTEM':
      case 'PAYMENT_SUCCESS':
      case 'SUBSCRIPTION_EXPIRING':
      default:
        return 'systemSecurity';
    }
  }

  /**
   * Get user preferences (creating default if not exists)
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    const res = await pool.query(
      `SELECT * FROM public.user_notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      const defaultPrefs: UserNotificationPreferences = {
        userId,
        assignments: true,
        tests: true,
        classes: true,
        resources: true,
        announcements: true,
        results: true,
        systemSecurity: true,
        updatedAt: new Date().toISOString(),
      };

      await pool.query(
        `INSERT INTO public.user_notification_preferences 
         (user_id, assignments, tests, classes, resources, announcements, results, system_security)
         VALUES ($1, true, true, true, true, true, true, true)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      return defaultPrefs;
    }

    const row = res.rows[0];
    return {
      userId: row.user_id,
      assignments: row.assignments ?? true,
      tests: row.tests ?? true,
      classes: row.classes ?? true,
      resources: row.resources ?? true,
      announcements: row.announcements ?? true,
      results: row.results ?? true,
      systemSecurity: true, // Always enforced
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserNotificationPreferences, 'userId' | 'systemSecurity' | 'updatedAt'>>
  ): Promise<UserNotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = {
      ...current,
      ...updates,
      systemSecurity: true, // Security cannot be disabled
      updatedAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO public.user_notification_preferences 
       (user_id, assignments, tests, classes, resources, announcements, results, system_security, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         assignments = EXCLUDED.assignments,
         tests = EXCLUDED.tests,
         classes = EXCLUDED.classes,
         resources = EXCLUDED.resources,
         announcements = EXCLUDED.announcements,
         results = EXCLUDED.results,
         system_security = true,
         updated_at = NOW()`,
      [
        userId,
        updated.assignments,
        updated.tests,
        updated.classes,
        updated.resources,
        updated.announcements,
        updated.results,
      ]
    );

    return updated;
  }

  /**
   * Create and deliver notification to user if permitted by preferences
   */
  async createNotification(data: {
    recipientUserId: string;
    actorUserId?: string;
    type: NotificationType | string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    deepLink?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    metadata?: Record<string, any>;
  }): Promise<NotificationEntity | null> {
    const category = this.getCategory(data.type);
    
    // Check user preferences (security notifications always pass)
    if (category !== 'systemSecurity') {
      const prefs = await this.getUserPreferences(data.recipientUserId);
      if (!prefs[category]) {
        // User has opted out of this non-security category
        return null;
      }
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const priority = data.priority || 'NORMAL';
    const metadata = data.metadata || {};

    const res = await pool.query(
      `INSERT INTO public.notifications 
       (id, user_id, recipient_user_id, actor_user_id, type, title, message, entity_type, entity_id, deep_link, action_url, is_read, priority, metadata, created_at, timestamp)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $9, false, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        id,
        data.recipientUserId,
        data.actorUserId || null,
        data.type,
        data.title,
        data.message,
        data.entityType || null,
        data.entityId || null,
        data.deepLink || null,
        priority,
        JSON.stringify(metadata),
      ]
    );

    const row = res.rows[0];
    const mapped = this.mapRow(row);

    // Non-blocking real Android push dispatch (bounded retries, never throws)
    pushNotificationService.dispatchPushForNotification({
      recipientUserId: data.recipientUserId,
      title: data.title,
      message: data.message,
      deepLink: data.deepLink,
      entityType: data.entityType,
      entityId: data.entityId,
      type: data.type,
      metadata: data.metadata,
    }).catch(pushErr => {
      console.warn('[Notification Push Dispatch Notice]', pushErr.message);
    });

    return mapped;
  }

  /**
   * Get paginated notifications for user
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number; totalCount: number }> {
    const limit = Math.min(Math.max(1, options.limit || 30), 100);
    const offset = Math.max(0, options.offset || 0);

    const unreadRes = await pool.query(
      `SELECT COUNT(*) as count FROM public.notifications 
       WHERE (recipient_user_id = $1 OR user_id = $1) AND is_read = false`,
      [userId]
    );
    const unreadCount = parseInt(unreadRes.rows[0]?.count || '0', 10);

    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM public.notifications 
       WHERE (recipient_user_id = $1 OR user_id = $1)`,
      [userId]
    );
    const totalCount = parseInt(totalRes.rows[0]?.count || '0', 10);

    let query = `
      SELECT * FROM public.notifications
      WHERE (recipient_user_id = $1 OR user_id = $1)
    `;
    const params: any[] = [userId];

    if (options.unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const res = await pool.query(query, params);
    const notifications = res.rows.map(r => this.mapRow(r));

    return { notifications, unreadCount, totalCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE public.notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND (recipient_user_id = $2 OR user_id = $2)`,
      [notificationId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const res = await pool.query(
      `UPDATE public.notifications 
       SET is_read = true, read_at = NOW() 
       WHERE (recipient_user_id = $1 OR user_id = $1) AND is_read = false`,
      [userId]
    );
    return res.rowCount || 0;
  }

  private mapRow(row: any): NotificationEntity {
    let metadata: Record<string, any> = {};
    if (typeof row.metadata === 'object' && row.metadata !== null) {
      metadata = row.metadata;
    } else if (typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        metadata = {};
      }
    }

    return {
      id: row.id,
      recipientUserId: row.recipient_user_id || row.user_id,
      actorUserId: row.actor_user_id || undefined,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type || undefined,
      entityId: row.entity_id || undefined,
      deepLink: row.deep_link || row.action_url || undefined,
      isRead: !!row.is_read,
      readAt: row.read_at ? new Date(row.read_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : (row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()),
      priority: row.priority || 'NORMAL',
      metadata,
    };
  }
}

export const notificationRepository = new NotificationRepository();

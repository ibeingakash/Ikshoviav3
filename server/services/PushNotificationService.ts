import pool from '../db/pool.js';

export interface DeviceTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  appVersion?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface PushDispatchResult {
  attemptedCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'DELIVERED' | 'NO_ACTIVE_TOKENS' | 'FCM_CONFIGURATION_REQUIRED' | 'PARTIAL' | 'FAILED';
  reason?: string;
}

export class PushNotificationService {
  private initialized = false;

  /**
   * Ensure user_device_tokens table exists with correct schema
   */
  async ensureSchema(): Promise<void> {
    if (this.initialized) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.user_device_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          platform TEXT NOT NULL DEFAULT 'android',
          app_version TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_active ON public.user_device_tokens(user_id, active);
      `);
      this.initialized = true;
    } catch (err: any) {
      console.warn('[PushNotificationService Schema Notice]', err.message);
    }
  }

  /**
   * Register or update an Android/native device token for an authenticated user
   */
  async registerDevice(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android',
    appVersion?: string
  ): Promise<DeviceTokenRecord> {
    await this.ensureSchema();
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Device push token cannot be empty.');
    }

    const id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const query = `
      INSERT INTO public.user_device_tokens (id, user_id, token, platform, app_version, active, created_at, updated_at, last_seen_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), NOW())
      ON CONFLICT (token) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        app_version = COALESCE(EXCLUDED.app_version, public.user_device_tokens.app_version),
        active = true,
        updated_at = NOW(),
        last_seen_at = NOW()
      RETURNING *
    `;
    const res = await pool.query(query, [id, userId, cleanToken, platform, appVersion || null]);
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      token: r.token,
      platform: r.platform,
      appVersion: r.app_version || undefined,
      active: r.active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      lastSeenAt: new Date(r.last_seen_at).toISOString(),
    };
  }

  /**
   * Deactivate a device token upon user logout
   */
  async deactivateDevice(userId: string, token: string): Promise<boolean> {
    await this.ensureSchema();
    const res = await pool.query(
      `UPDATE public.user_device_tokens
       SET active = false, updated_at = NOW()
       WHERE user_id = $1 AND token = $2`,
      [userId, token.trim()]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Deactivate an expired or invalid token reported by push gateway
   */
  async deactivateInvalidToken(token: string): Promise<boolean> {
    await this.ensureSchema();
    const res = await pool.query(
      `UPDATE public.user_device_tokens
       SET active = false, updated_at = NOW()
       WHERE token = $1`,
      [token.trim()]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Retrieve active registered devices for a user
   */
  async getActiveDevicesForUser(userId: string): Promise<DeviceTokenRecord[]> {
    await this.ensureSchema();
    const res = await pool.query(
      `SELECT * FROM public.user_device_tokens
       WHERE user_id = $1 AND active = true
       ORDER BY last_seen_at DESC`,
      [userId]
    );
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      token: r.token,
      platform: r.platform,
      appVersion: r.app_version || undefined,
      active: r.active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      lastSeenAt: new Date(r.last_seen_at).toISOString(),
    }));
  }

  /**
   * Check whether FCM / Google push delivery credentials are configured
   */
  isFcmConfigured(): boolean {
    return Boolean(
      process.env.FCM_SERVER_KEY ||
      process.env.FIREBASE_SERVER_KEY ||
      process.env.FCM_PROJECT_ID ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
  }

  /**
   * Dispatch real push notification to all active devices of the recipient user
   * Guarantees: Non-blocking, never throws, does not break in-app persistence.
   */
  async dispatchPushForNotification(data: {
    recipientUserId: string;
    title: string;
    message: string;
    deepLink?: string;
    entityType?: string;
    entityId?: string;
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<PushDispatchResult> {
    try {
      await this.ensureSchema();
      const activeDevices = await this.getActiveDevicesForUser(data.recipientUserId);

      if (activeDevices.length === 0) {
        return {
          attemptedCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          status: 'NO_ACTIVE_TOKENS',
          reason: 'Recipient has no registered active Android devices.',
        };
      }

      // Check FCM configuration
      if (!this.isFcmConfigured()) {
        console.info(
          `[PushNotificationService] FCM configuration pending. Queued push event "${data.title}" for ${activeDevices.length} device(s) of user ${data.recipientUserId}. DeepLink: ${data.deepLink || 'N/A'}`
        );
        return {
          attemptedCount: activeDevices.length,
          deliveredCount: 0,
          failedCount: 0,
          status: 'FCM_CONFIGURATION_REQUIRED',
          reason: 'PUSH DELIVERY BLOCKED — FCM CONFIGURATION REQUIRED: Server requires FCM_SERVER_KEY or GOOGLE_APPLICATION_CREDENTIALS.',
        };
      }

      // If FCM credentials are present, attempt direct dispatch
      let delivered = 0;
      let failed = 0;
      const fcmKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;

      for (const dev of activeDevices) {
        try {
          const payload = {
            to: dev.token,
            priority: 'high',
            notification: {
              title: data.title,
              body: data.message,
              sound: 'default',
              click_action: 'FCM_PLUGIN_ACTIVITY',
            },
            data: {
              title: data.title,
              message: data.message,
              deepLink: data.deepLink || '',
              entityType: data.entityType || '',
              entityId: data.entityId || '',
              type: data.type || '',
              ...(data.metadata || {}),
            },
          };

          const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `key=${fcmKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (fcmRes.ok) {
            const fcmData = await fcmRes.json() as any;
            if (fcmData.failure > 0 && fcmData.results?.[0]?.error) {
              const errCode = fcmData.results[0].error;
              if (errCode === 'NotRegistered' || errCode === 'InvalidRegistration') {
                await this.deactivateInvalidToken(dev.token);
              }
              failed++;
            } else {
              delivered++;
            }
          } else {
            if (fcmRes.status === 404 || fcmRes.status === 410) {
              await this.deactivateInvalidToken(dev.token);
            }
            failed++;
          }
        } catch {
          failed++;
        }
      }

      return {
        attemptedCount: activeDevices.length,
        deliveredCount: delivered,
        failedCount: failed,
        status: delivered > 0 ? (failed === 0 ? 'DELIVERED' : 'PARTIAL') : 'FAILED',
      };
    } catch (err: any) {
      console.warn('[PushNotificationService Dispatch Error]', err.message);
      return {
        attemptedCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        status: 'FAILED',
        reason: err.message,
      };
    }
  }
}

export const pushNotificationService = new PushNotificationService();

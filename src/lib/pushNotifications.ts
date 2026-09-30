import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { api } from './api.js';

let isPushInitialized = false;
let currentRegisteredToken: string | null = null;

export interface PushNotificationInitOptions {
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onActionPerformed?: (action: ActionPerformed) => void;
}

/**
 * Initialize Push Notifications on native Android/iOS runtimes
 */
export async function initPushNotifications(options?: PushNotificationInitOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!Capacitor.isNativePlatform()) {
    console.info('[PushNotifications] Web platform detected; native push listener skipped.');
    return false;
  }
  if (isPushInitialized) return true;

  try {
    // 1. Check & Request Permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Push notification permission not granted:', permStatus.receive);
      return false;
    }

    // 2. Register with Apple / Google Push Services
    await PushNotifications.register();

    // 3. Setup Listeners
    PushNotifications.addListener('registration', async (token: Token) => {
      console.info('[PushNotifications] Device token registered:', token.value);
      currentRegisteredToken = token.value;
      try {
        await api.registerDeviceToken(token.value, Capacitor.getPlatform() as 'android' | 'ios' | 'web');
      } catch (err: any) {
        console.warn('[PushNotifications] Failed to sync token with backend:', err.message);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('[PushNotifications] Push registration error:', error);
    });

    // Handle incoming notification while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.info('[PushNotifications] Foreground push notification received:', notification);
      if (options?.onNotificationReceived) {
        options.onNotificationReceived(notification);
      }
    });

    // Handle user tap on notification (foreground, background, or opened from closed state)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.info('[PushNotifications] Push action performed:', action);
      const deepLink = action.notification?.data?.deepLink || action.notification?.data?.actionUrl;
      if (deepLink && typeof window !== 'undefined') {
        try {
          if (deepLink.startsWith('/')) {
            window.location.hash = deepLink;
          } else {
            window.location.href = deepLink;
          }
        } catch (navErr) {
          console.error('[PushNotifications] Navigation error for deepLink:', deepLink, navErr);
        }
      }
      if (options?.onActionPerformed) {
        options.onActionPerformed(action);
      }
    });

    isPushInitialized = true;
    return true;
  } catch (err: any) {
    console.warn('[PushNotifications] Initialization error:', err.message);
    return false;
  }
}

/**
 * Deactivate push token on logout
 */
export async function unregisterPushDevice(): Promise<void> {
  if (currentRegisteredToken) {
    try {
      await api.deactivateDeviceToken(currentRegisteredToken);
    } catch (err: any) {
      console.warn('[PushNotifications] Deactivate error:', err.message);
    }
    currentRegisteredToken = null;
  }
}

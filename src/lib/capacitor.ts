import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { syncQueuedAnswers } from './offlineQueue.js';

export const isNativeApp = (): boolean => {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const isNativeAndroidApp = (): boolean => {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
};

export const isWebPlatform = (): boolean => !isNativeApp();

export const isCapacitor = (): boolean => isNativeApp();

type BackButtonHandler = () => boolean | Promise<boolean>;
const backButtonHandlers: BackButtonHandler[] = [];

type AppStateChangeHandler = (isActive: boolean) => void;
const appStateChangeHandlers: AppStateChangeHandler[] = [];

let isInitialized = false;

/**
 * Register a back-button interceptor (e.g. for active tests, modals).
 * Handlers run in LIFO order (latest registered runs first).
 * Return `true` if the event was consumed, or `false` to pass to the next handler.
 */
export function registerBackButtonHandler(handler: BackButtonHandler): () => void {
  backButtonHandlers.push(handler);
  return () => {
    const idx = backButtonHandlers.indexOf(handler);
    if (idx !== -1) {
      backButtonHandlers.splice(idx, 1);
    }
  };
}

/**
 * Register an app state change listener (foreground/background transitions).
 * Provides cross-platform support across native Android and mobile web.
 */
export function registerAppStateChangeHandler(handler: AppStateChangeHandler): () => void {
  appStateChangeHandlers.push(handler);
  return () => {
    const idx = appStateChangeHandlers.indexOf(handler);
    if (idx !== -1) {
      appStateChangeHandlers.splice(idx, 1);
    }
  };
}

function notifyAppState(isActive: boolean) {
  if (isActive) {
    // When returning to foreground, attempt to flush any pending offline answers
    syncQueuedAnswers().catch(() => {});
  }
  for (const handler of appStateChangeHandlers) {
    try {
      handler(isActive);
    } catch (err) {
      console.error('[Capacitor AppState Handler Error]', err);
    }
  }
}

/**
 * Initialize Capacitor native integrations (back button, app lifecycle, hardware exit protection).
 */
export function initCapacitorApp(options?: {
  onNavigateBack?: () => boolean;
  canExitOnHome?: boolean;
}): void {
  if (isInitialized) return;
  isInitialized = true;

  // Web fallback for visibility changes (handles desktop/mobile browser backgrounding)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      notifyAppState(!document.hidden);
    });
    window.addEventListener('focus', () => notifyAppState(true));
    window.addEventListener('blur', () => notifyAppState(false));
  }

  if (!Capacitor.isNativePlatform()) return;

  // 1. App Lifecycle listener (background / foreground)
  CapApp.addListener('appStateChange', ({ isActive }) => {
    notifyAppState(isActive);
  });

  // 2. Hardware Back Button handling
  CapApp.addListener('backButton', async ({ canGoBack }) => {
    // A. Process custom registered handlers (LIFO order: modals/active tests/drawers first)
    for (let i = backButtonHandlers.length - 1; i >= 0; i--) {
      try {
        const consumed = await backButtonHandlers[i]();
        if (consumed) return;
      } catch (err) {
        console.error('[Capacitor BackButton Handler Error]', err);
      }
    }

    // B. Global Active Test Guard check (fallback safety)
    if ((window as any).__IKSHOVIA_ACTIVE_TEST__) {
      const confirmed = window.confirm(
        'Warning: You have an active mock test or practice attempt in progress. Leaving now will interrupt your examination attempt. Are you sure you want to exit?'
      );
      if (!confirmed) {
        return;
      }
      (window as any).__IKSHOVIA_ACTIVE_TEST__ = false;
    }

    // C. Logical App Navigation (e.g. pop previous section from history stack)
    if (options?.onNavigateBack) {
      const handled = options.onNavigateBack();
      if (handled) return;
    }

    // D. If at Root / Dashboard in native Android: prompt confirmation before exiting
    const confirmExit = window.confirm('Exit IKSHOVIA?');
    if (confirmExit) {
      CapApp.exitApp();
    }
  });
}


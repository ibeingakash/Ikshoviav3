import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { AppVersionResponse } from '../types/index.js';
import { getClientAppVersion } from '../config/appVersion.js';
import { registerAppStateChangeHandler } from '../lib/capacitor.js';

export interface UseAppUpdateReturn {
  updateInfo: AppVersionResponse | null;
  isUpdateModalOpen: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkForUpdates: (manual?: boolean) => Promise<AppVersionResponse | null>;
  dismissUpdateModal: () => void;
  openUpdateModal: () => void;
}

const DISMISSED_UPDATE_KEY = 'ikshovia_dismissed_update_build';

export const useAppUpdateCheck = (): UseAppUpdateReturn => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionResponse | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async (manual = false): Promise<AppVersionResponse | null> => {
    setIsChecking(true);
    try {
      const clientVer = await getClientAppVersion();
      const response = await api.getAppVersion(clientVer.buildNumber, clientVer.versionName);

      setLastChecked(new Date());

      if (
        response &&
        (response.updateAvailable ||
          response.status === 'UPDATE_AVAILABLE' ||
          response.status === 'MANDATORY_UPDATE')
      ) {
        setUpdateInfo(response);

        // If mandatory, always show
        if (
          response.updateRequired ||
          response.updateType === 'MANDATORY' ||
          response.status === 'MANDATORY_UPDATE'
        ) {
          setIsUpdateModalOpen(true);
          return response;
        }

        // If optional and manual check, always show
        if (manual) {
          setIsUpdateModalOpen(true);
          return response;
        }

        // If optional and automated check, only show if not already dismissed in this session
        const dismissedBuild = sessionStorage.getItem(DISMISSED_UPDATE_KEY);
        if (dismissedBuild !== String(response.latestBuildNumber)) {
          setIsUpdateModalOpen(true);
        }
      } else {
        setUpdateInfo(response);
      }

      return response;
    } catch (err) {
      console.warn('[useAppUpdateCheck] Error checking for updates:', err);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const dismissUpdateModal = useCallback(() => {
    if (
      updateInfo?.updateRequired ||
      updateInfo?.updateType === 'MANDATORY' ||
      updateInfo?.status === 'MANDATORY_UPDATE'
    ) {
      // Cannot dismiss mandatory update
      return;
    }
    if (updateInfo?.latestBuildNumber) {
      sessionStorage.setItem(DISMISSED_UPDATE_KEY, String(updateInfo.latestBuildNumber));
    }
    setIsUpdateModalOpen(false);
  }, [updateInfo]);

  const openUpdateModal = useCallback(() => {
    if (
      updateInfo?.updateAvailable ||
      updateInfo?.status === 'UPDATE_AVAILABLE' ||
      updateInfo?.status === 'MANDATORY_UPDATE'
    ) {
      setIsUpdateModalOpen(true);
    }
  }, [updateInfo]);

  // Initial check on app launch
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // Check on Android app resume / foreground & document visibility
  useEffect(() => {
    const unregisterAppState = registerAppStateChangeHandler((isActive: boolean) => {
      if (isActive) {
        checkForUpdates(false);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unregisterAppState();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return {
    updateInfo,
    isUpdateModalOpen,
    isChecking,
    lastChecked,
    checkForUpdates,
    dismissUpdateModal,
    openUpdateModal,
  };
};

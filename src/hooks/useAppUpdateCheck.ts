import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { AppVersionResponse } from '../types/index.js';
import { getClientAppVersion, CURRENT_APP_VERSION } from '../config/appVersion.js';
import { registerAppStateChangeHandler, isNativeAndroidApp } from '../lib/capacitor.js';

export type AppUpdateUiState = 'NONE' | 'OPTIONAL' | 'MANDATORY';

export interface UseAppUpdateReturn {
  updateInfo: AppVersionResponse | null;
  updateState: AppUpdateUiState;
  isUpdateModalOpen: boolean; // Backwards compatible alias for (updateState !== 'NONE')
  isChecking: boolean;
  lastChecked: Date | null;
  installedBuildNumber: number;
  checkForUpdates: (manual?: boolean) => Promise<AppVersionResponse | null>;
  dismissUpdateModal: () => void;
  openUpdateModal: () => void;
}

const DISMISSED_UPDATE_KEY = 'ikshovia_dismissed_update_build';

export const useAppUpdateCheck = (): UseAppUpdateReturn => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionResponse | null>(null);
  const [updateState, setUpdateState] = useState<AppUpdateUiState>('NONE');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [installedBuildNumber, setInstalledBuildNumber] = useState<number>(CURRENT_APP_VERSION.buildNumber);

  const checkForUpdates = useCallback(async (manual = false): Promise<AppVersionResponse | null> => {
    // CRITICAL REQUIREMENT:
    // Web users (desktop browser, mobile browser, PWA) must NEVER be prompted
    // or blocked by the Android update gate.
    // The update check only executes inside the native Capacitor Android application.
    if (!isNativeAndroidApp()) {
      setUpdateState('NONE');
      return null;
    }

    setIsChecking(true);
    try {
      const clientVer = await getClientAppVersion();
      const installedBuild = Number(clientVer.buildNumber);
      setInstalledBuildNumber(installedBuild);

      const response = await api.getAppVersion(installedBuild, clientVer.versionName);
      setLastChecked(new Date());

      if (!response) {
        setUpdateState('NONE');
        return null;
      }

      const latestBuild = Number(response.latestBuildNumber || 0);
      const minSupportedBuild = Number(response.minimumSupportedBuildNumber || 1);
      const isMandatoryFlag = Boolean(response.updateRequired || response.release?.is_mandatory);

      // ====================================================================
      // 3 STRICT ARCHITECTURAL STATES:
      // ====================================================================
      // STATE 1 — CURRENT: Installed Build >= Latest Published Build -> NONE
      // STATE 3 — MANDATORY: Installed Build < minSupportedBuild (or isMandatory)
      // STATE 2 — OPTIONAL: Installed Build < Latest Published Build
      // ====================================================================
      let calculatedState: AppUpdateUiState = 'NONE';
      let updateAvailable = false;
      let updateRequired = false;

      if (installedBuild >= latestBuild) {
        calculatedState = 'NONE';
        updateAvailable = false;
        updateRequired = false;
      } else if (installedBuild < minSupportedBuild || isMandatoryFlag) {
        calculatedState = 'MANDATORY';
        updateAvailable = true;
        updateRequired = true;
      } else {
        calculatedState = 'OPTIONAL';
        updateAvailable = true;
        updateRequired = false;
      }

      const normalizedResponse: AppVersionResponse = {
        ...response,
        updateAvailable,
        updateRequired,
        updateType: updateRequired ? 'MANDATORY' : (updateAvailable ? 'OPTIONAL' : 'NONE'),
        status: !updateAvailable ? 'CURRENT' : (updateRequired ? 'MANDATORY_UPDATE' : 'UPDATE_AVAILABLE'),
      };

      setUpdateInfo(normalizedResponse);

      // Check session dismissal for optional updates
      const dismissedBuild = sessionStorage.getItem(DISMISSED_UPDATE_KEY);
      const isDismissed = dismissedBuild === String(latestBuild);

      if (calculatedState === 'OPTIONAL' && isDismissed && !manual) {
        setUpdateState('NONE');
      } else {
        setUpdateState(calculatedState);
      }

      console.log('[AppUpdate Decision Details]', {
        platform: clientVer.platform,
        packageName: clientVer.packageId,
        installedVersionName: clientVer.versionName,
        installedBuild,
        latestVersion: response.latestVersion,
        latestBuild,
        minimumSupportedBuild: minSupportedBuild,
        calculatedState,
        finalState: (calculatedState === 'OPTIONAL' && isDismissed && !manual) ? 'NONE' : calculatedState,
      });

      return normalizedResponse;
    } catch (err) {
      console.warn('[useAppUpdateCheck] Error checking for updates:', err);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const dismissUpdateModal = useCallback(() => {
    // Mandatory state cannot be dismissed
    if (updateState === 'MANDATORY') {
      return;
    }

    if (updateInfo?.latestBuildNumber) {
      sessionStorage.setItem(DISMISSED_UPDATE_KEY, String(updateInfo.latestBuildNumber));
    }
    setUpdateState('NONE');
  }, [updateState, updateInfo]);

  const openUpdateModal = useCallback(() => {
    if (!isNativeAndroidApp() || !updateInfo) return;

    const latestBuild = Number(updateInfo.latestBuildNumber || 0);
    const minSupportedBuild = Number(updateInfo.minimumSupportedBuildNumber || 1);
    const isMandatoryFlag = Boolean(updateInfo.updateRequired || updateInfo.release?.is_mandatory);

    if (installedBuildNumber < latestBuild) {
      if (installedBuildNumber < minSupportedBuild || isMandatoryFlag) {
        setUpdateState('MANDATORY');
      } else {
        setUpdateState('OPTIONAL');
      }
    }
  }, [updateInfo, installedBuildNumber]);

  // Initial check on app launch - strictly native Android only
  useEffect(() => {
    if (!isNativeAndroidApp()) return;

    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // Check on Android app resume / foreground - strictly native Android only
  useEffect(() => {
    if (!isNativeAndroidApp()) return;

    const unregisterAppState = registerAppStateChangeHandler((isActive: boolean) => {
      if (isActive) {
        checkForUpdates(false);
      }
    });

    return () => {
      unregisterAppState();
    };
  }, [checkForUpdates]);

  return {
    updateInfo,
    updateState,
    isUpdateModalOpen: updateState !== 'NONE',
    isChecking,
    lastChecked,
    installedBuildNumber,
    checkForUpdates,
    dismissUpdateModal,
    openUpdateModal,
  };
};

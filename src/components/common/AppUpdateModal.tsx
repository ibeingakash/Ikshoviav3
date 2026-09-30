import React from 'react';
import { AppVersionResponse } from '../../types/index.js';
import { isNativeAndroidApp } from '../../lib/capacitor.js';
import { OptionalUpdateCard } from './OptionalUpdateCard.js';
import { MandatoryUpdateScreen } from './MandatoryUpdateScreen.js';

interface AppUpdateModalProps {
  isOpen?: boolean;
  updateInfo: AppVersionResponse | null;
  installedBuildNumber?: number;
  onDismiss?: () => void;
}

/**
 * AppUpdateModal:
 * Clean wrapper router routing between STATE 1 (NONE), STATE 2 (OptionalUpdateCard),
 * and STATE 3 (MandatoryUpdateScreen).
 *
 * Exclusively renders for native Android apps.
 */
export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen = true,
  updateInfo,
  installedBuildNumber = 7,
  onDismiss = () => {},
}) => {
  if (!isNativeAndroidApp() || !isOpen || !updateInfo) {
    return null;
  }

  const installedBuild = Number(installedBuildNumber) || 0;
  const latestBuild = Number(updateInfo.latestBuildNumber || 0);
  const minSupportedBuild = Number(updateInfo.minimumSupportedBuildNumber || 1);

  // STATE 1 — CURRENT: Installed Build >= Latest Published Build -> Do nothing
  if (installedBuild >= latestBuild || !updateInfo.updateAvailable) {
    return null;
  }

  // STATE 3 — MANDATORY UPDATE: Installed Build < Minimum Supported Build or updateRequired is true
  const isMandatory =
    installedBuild < minSupportedBuild ||
    Boolean(updateInfo.updateRequired) ||
    updateInfo.updateType === 'MANDATORY';

  if (isMandatory) {
    return (
      <MandatoryUpdateScreen
        updateInfo={updateInfo}
        installedBuildNumber={installedBuild}
      />
    );
  }

  // STATE 2 — OPTIONAL UPDATE: Small non-intrusive card
  return (
    <OptionalUpdateCard
      updateInfo={updateInfo}
      onDismiss={onDismiss}
    />
  );
};

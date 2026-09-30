import React from 'react';
import { useAppUpdateCheck } from '../../hooks/useAppUpdateCheck.js';
import { isNativeAndroidApp } from '../../lib/capacitor.js';
import { MandatoryUpdateScreen } from './MandatoryUpdateScreen.js';
import { OptionalUpdateCard } from './OptionalUpdateCard.js';

export const AndroidUpdateGateway: React.FC = () => {
  // CRITICAL REQUIREMENT:
  // Web users (desktop browser, mobile browser, PWA) must NEVER see any Android update UI.
  // Strictly enforce native Android Capacitor runtime.
  if (!isNativeAndroidApp()) {
    return null;
  }

  const { updateInfo, updateState, installedBuildNumber, dismissUpdateModal } = useAppUpdateCheck();

  if (!updateInfo || updateState === 'NONE') {
    return null;
  }

  if (updateState === 'MANDATORY') {
    return (
      <MandatoryUpdateScreen
        updateInfo={updateInfo}
        installedBuildNumber={installedBuildNumber}
      />
    );
  }

  if (updateState === 'OPTIONAL') {
    return (
      <OptionalUpdateCard
        updateInfo={updateInfo}
        onDismiss={dismissUpdateModal}
      />
    );
  }

  return null;
};

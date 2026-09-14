/**
 * IKSHOVIA Client Application Version Configuration
 * Used by in-app update checker to detect new APK releases.
 */

export const CURRENT_APP_VERSION = {
  versionName: '1.1',
  buildNumber: 2,
  packageId: 'com.ikshovia.app',
  platform: 'android',
  releaseChannel: 'production',
};

export const getClientAppVersion = async (): Promise<{
  versionName: string;
  buildNumber: number;
  packageId: string;
}> => {
  try {
    // If running in native Capacitor environment, check native App plugin if available
    const win = window as any;
    if (win.Capacitor && win.Capacitor.Plugins && win.Capacitor.Plugins.App) {
      const info = await win.Capacitor.Plugins.App.getInfo();
      if (info) {
        return {
          versionName: info.version || CURRENT_APP_VERSION.versionName,
          buildNumber: parseInt(info.build, 10) || CURRENT_APP_VERSION.buildNumber,
          packageId: info.id || CURRENT_APP_VERSION.packageId,
        };
      }
    }
  } catch (err) {
    // Fallback to static version constants
  }

  return {
    versionName: CURRENT_APP_VERSION.versionName,
    buildNumber: CURRENT_APP_VERSION.buildNumber,
    packageId: CURRENT_APP_VERSION.packageId,
  };
};

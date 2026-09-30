import { App } from '@capacitor/app';
import { isNativeApp } from '../lib/capacitor.js';

/**
 * IKSHOVIA Client Application Version Configuration
 * Used by native in-app update checker to detect new APK releases.
 */

export const CURRENT_APP_VERSION = {
  versionName: '3.0',
  buildNumber: 9,
  packageId: 'com.ikshovia.app',
  platform: 'android',
  releaseChannel: 'production',
};

export const WEB_APP_VERSION = {
  versionName: '3.0.0',
  platform: 'web',
};

export interface ClientAppVersionInfo {
  versionName: string;
  buildNumber: number;
  packageId: string;
  appName?: string;
  isNative: boolean;
  platform: 'android' | 'web';
}

export const getClientAppVersion = async (): Promise<ClientAppVersionInfo> => {
  const isNative = isNativeApp();

  if (isNative) {
    try {
      // Primary: Call native Capacitor App plugin directly
      const info = await App.getInfo();
      console.log('[Native App.getInfo() Result]', {
        id: info?.id,
        name: info?.name,
        version: info?.version,
        build: info?.build,
      });

      if (info && info.build) {
        const parsedBuild = parseInt(String(info.build), 10);
        const validBuild = !isNaN(parsedBuild) && parsedBuild > 0 ? parsedBuild : CURRENT_APP_VERSION.buildNumber;
        const validVersion = info.version || CURRENT_APP_VERSION.versionName;
        const validPackageId = info.id || CURRENT_APP_VERSION.packageId;

        return {
          versionName: validVersion,
          buildNumber: validBuild,
          packageId: validPackageId,
          appName: info.name,
          isNative: true,
          platform: 'android',
        };
      }
    } catch (err) {
      console.warn('[getClientAppVersion] Native App.getInfo() failed, trying plugin bridge:', err);
    }

    try {
      // Secondary: Check bridge object if direct import had an issue
      const win = window as any;
      if (win?.Capacitor?.Plugins?.App) {
        const info = await win.Capacitor.Plugins.App.getInfo();
        console.log('[Native Capacitor.Plugins.App.getInfo() Result]', {
          id: info?.id,
          name: info?.name,
          version: info?.version,
          build: info?.build,
        });

        if (info && info.build) {
          const parsedBuild = parseInt(String(info.build), 10);
          const validBuild = !isNaN(parsedBuild) && parsedBuild > 0 ? parsedBuild : CURRENT_APP_VERSION.buildNumber;
          const validVersion = info.version || CURRENT_APP_VERSION.versionName;
          const validPackageId = info.id || CURRENT_APP_VERSION.packageId;

          return {
            versionName: validVersion,
            buildNumber: validBuild,
            packageId: validPackageId,
            appName: info.name,
            isNative: true,
            platform: 'android',
          };
        }
      }
    } catch (pluginErr) {
      console.warn('[getClientAppVersion] Plugin bridge fallback failed:', pluginErr);
    }

    // Tertiary Fallback: Current verified production constants
    return {
      versionName: CURRENT_APP_VERSION.versionName,
      buildNumber: CURRENT_APP_VERSION.buildNumber,
      packageId: CURRENT_APP_VERSION.packageId,
      appName: 'IKSHOVIA',
      isNative: true,
      platform: 'android',
    };
  }

  // Web Platform (desktop browser, mobile browser, tablet browser, PWA):
  // Never treated as an Android APK installation.
  return {
    versionName: WEB_APP_VERSION.versionName,
    buildNumber: 0,
    packageId: 'com.ikshovia.web',
    appName: 'IKSHOVIA Web',
    isNative: false,
    platform: 'web',
  };
};

/**
 * IKSHOVIA Native Android APK Downloader Bridge
 *
 * Preferred architecture:
 * React/TypeScript -> Capacitor native plugin bridge -> Android DownloadManager -> APK file -> Android Package Installer
 *
 * Direct binary endpoint:
 * https://ikshoviacse.onrender.com/api/app/download/latest
 */

import { registerPlugin } from '@capacitor/core';
import { isNativeApp } from './capacitor.js';

export const CANONICAL_APK_DOWNLOAD_URL = 'https://ikshoviacse.onrender.com/api/app/download/latest';
export const EXPECTED_APK_SHA256 = '7fc08d826d9c3e2cd7a36913a60e8011919d864d6bd396bd81b36837f18a536d';
export const TARGET_APK_FILENAME = 'ikshovia-v3.0-b9.apk';

export interface ApkDownloaderPlugin {
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean; message?: string }>;
  startDownload(options: { url: string; fileName: string }): Promise<{
    downloadId: number;
    status: string;
    fileName: string;
    targetPath?: string;
  }>;
  checkDownloadStatus(options: { downloadId: number; fileName: string }): Promise<{
    downloadId: number;
    status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCESSFUL' | 'FAILED' | 'NOT_FOUND' | 'UNKNOWN';
    bytesDownloaded: number;
    totalBytes: number;
    percent: number;
    reasonCode?: number;
    filePath?: string;
    localUri?: string;
    fileExists?: boolean;
    fileSize?: number;
    message?: string;
  }>;
  verifyApk(options: { filePath?: string; fileName?: string; expectedSha256?: string }): Promise<{
    valid: boolean;
    exists: boolean;
    fileSize: number;
    packageName?: string;
    versionName?: string;
    versionCode?: number;
    sha256?: string;
    matchesExpectedSha256?: boolean;
    error?: string;
  }>;
  installApk(options: { filePath?: string; fileName?: string }): Promise<{
    success: boolean;
    requiresPermission?: boolean;
    contentUri?: string;
    message?: string;
  }>;
  downloadDirectly(options: { url: string; fileName: string }): Promise<{
    success: boolean;
    filePath: string;
    bytesDownloaded: number;
    totalBytes: number;
  }>;
}

// Register Capacitor Native Plugin Proxy
export const NativeApkDownloader = registerPlugin<ApkDownloaderPlugin>('ApkDownloader');

export type DownloadFlowState =
  | 'IDLE'
  | 'CHECKING_PERMISSIONS'
  | 'PERMISSION_REQUIRED'
  | 'STARTING_DOWNLOAD'
  | 'DOWNLOADING'
  | 'DOWNLOAD_COMPLETE'
  | 'VERIFYING_APK'
  | 'OPENING_INSTALLER'
  | 'INSTALLER_OPENED'
  | 'FAILED';

export interface DownloadProgressInfo {
  state: DownloadFlowState;
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  message: string;
  errorMessage?: string;
  downloadId?: number;
  filePath?: string;
  verifiedDetails?: {
    packageName?: string;
    versionName?: string;
    versionCode?: number;
    fileSize?: number;
    sha256?: string;
    matchesSha256?: boolean;
  };
}

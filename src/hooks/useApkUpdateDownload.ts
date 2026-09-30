import { useState, useRef, useEffect, useCallback } from 'react';
import {
  NativeApkDownloader,
  CANONICAL_APK_DOWNLOAD_URL,
  EXPECTED_APK_SHA256,
  TARGET_APK_FILENAME,
  DownloadFlowState,
} from '../lib/apkDownloader.js';
import { AppVersionResponse } from '../types/index.js';

export interface UseApkUpdateDownloadOptions {
  updateInfo: AppVersionResponse | null;
}

export interface UseApkUpdateDownloadReturn {
  flowState: DownloadFlowState;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  statusMessage: string;
  errorMessage: string | null;
  startDownload: () => Promise<void>;
  launchInstaller: () => Promise<void>;
  openSettings: () => Promise<void>;
  reset: () => void;
}

export const useApkUpdateDownload = ({
  updateInfo,
}: UseApkUpdateDownloadOptions): UseApkUpdateDownloadReturn => {
  const [flowState, setFlowState] = useState<DownloadFlowState>('IDLE');
  const [percent, setPercent] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollTimerRef = useRef<any>(null);
  const currentDownloadIdRef = useRef<number | null>(null);
  const downloadedFilePathRef = useRef<string | null>(null);

  // Clear polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const launchPackageInstaller = useCallback(async (filePath?: string) => {
    setFlowState('OPENING_INSTALLER');
    setStatusMessage('Opening Android Package Installer...');

    try {
      const perm = await NativeApkDownloader.canRequestPackageInstalls();
      if (perm && perm.canInstall === false) {
        setFlowState('PERMISSION_REQUIRED');
        setStatusMessage('Allow IKSHOVIA to install updates from this source.');
        return;
      }

      const installRes = await NativeApkDownloader.installApk({
        filePath: filePath || downloadedFilePathRef.current || undefined,
        fileName: TARGET_APK_FILENAME,
      });

      if (installRes.requiresPermission) {
        setFlowState('PERMISSION_REQUIRED');
        setStatusMessage(installRes.message || 'Allow IKSHOVIA to install updates from this source.');
        return;
      }

      if (installRes.success) {
        setFlowState('INSTALLER_OPENED');
        setStatusMessage('Package installer opened. Please confirm update on your device.');
      } else {
        throw new Error(installRes.message || 'Could not launch package installer');
      }
    } catch (installErr: any) {
      console.error('[ApkDownloader Install Error]', installErr);
      setFlowState('FAILED');
      setErrorMessage(`Failed to open installer: ${installErr.message || 'Unknown error'}`);
    }
  }, []);

  const proceedToVerification = useCallback(async (filePath?: string) => {
    setFlowState('VERIFYING_APK');
    setStatusMessage('Verifying package integrity...');
    setPercent(100);

    try {
      const expectedChecksum = updateInfo?.sha256Checksum || EXPECTED_APK_SHA256;
      const verifyRes = await NativeApkDownloader.verifyApk({
        filePath,
        fileName: TARGET_APK_FILENAME,
        expectedSha256: expectedChecksum,
      });

      if (!verifyRes.valid || !verifyRes.exists) {
        setFlowState('FAILED');
        setErrorMessage(verifyRes.error || 'Downloaded APK is invalid or corrupt. Please tap Retry to try again.');
        return;
      }

      await launchPackageInstaller(filePath);
    } catch (verifyErr: any) {
      console.error('[ApkDownloader Verify Error]', verifyErr);
      setFlowState('FAILED');
      setErrorMessage(`Verification error: ${verifyErr.message || 'Could not verify APK file.'}`);
    }
  }, [updateInfo, launchPackageInstaller]);

  const attemptDirectDownloadFallback = useCallback(async (priorErr: any) => {
    setStatusMessage('DownloadManager unavailable, switching to direct download...');
    try {
      const directRes = await NativeApkDownloader.downloadDirectly({
        url: updateInfo?.downloadUrl || updateInfo?.apkUrl || CANONICAL_APK_DOWNLOAD_URL,
        fileName: TARGET_APK_FILENAME,
      });
      if (directRes && directRes.success) {
        downloadedFilePathRef.current = directRes.filePath;
        await proceedToVerification(directRes.filePath);
      } else {
        throw new Error('Direct download completed without success signal');
      }
    } catch (fallbackErr: any) {
      console.error('[ApkDownloader Fallback Failed]', fallbackErr);
      setFlowState('FAILED');
      setErrorMessage(
        `Download failed: ${fallbackErr.message || priorErr.message || 'Unknown error'}. Tap Retry to try again.`
      );
    }
  }, [updateInfo, proceedToVerification]);

  const startDownload = useCallback(async () => {
    setErrorMessage(null);
    setFlowState('STARTING_DOWNLOAD');
    setStatusMessage('Initiating download...');
    setPercent(0);
    setDownloadedBytes(0);
    setTotalBytes(updateInfo?.fileSizeBytes || 0);

    const downloadUrl = updateInfo?.downloadUrl || updateInfo?.apkUrl || CANONICAL_APK_DOWNLOAD_URL;

    try {
      try {
        const permCheck = await NativeApkDownloader.canRequestPackageInstalls();
        if (permCheck && permCheck.canInstall === false) {
          console.warn('[ApkDownloader] App does not currently have unknown app install permission');
        }
      } catch (permErr) {
        console.warn('[ApkDownloader] Could not query install permission ahead of time:', permErr);
      }

      const res = await NativeApkDownloader.startDownload({
        url: downloadUrl,
        fileName: TARGET_APK_FILENAME,
      });

      const downloadId = res.downloadId;
      currentDownloadIdRef.current = downloadId;

      setFlowState('DOWNLOADING');
      setStatusMessage('Downloading update...');

      let attempts = 0;
      const maxAttempts = 300; // 5 minutes max

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }

      pollTimerRef.current = setInterval(async () => {
        attempts++;
        try {
          const status = await NativeApkDownloader.checkDownloadStatus({
            downloadId,
            fileName: TARGET_APK_FILENAME,
          });

          if (status.bytesDownloaded !== undefined) {
            setDownloadedBytes(status.bytesDownloaded);
          }
          if (status.totalBytes && status.totalBytes > 0) {
            setTotalBytes(status.totalBytes);
          }
          if (status.percent !== undefined) {
            setPercent(status.percent);
          }

          if (status.status === 'RUNNING') {
            setStatusMessage(`Downloading update... ${status.percent || 0}%`);
          } else if (status.status === 'PAUSED') {
            setStatusMessage(status.message || 'Download paused by Android system');
          } else if (status.status === 'SUCCESSFUL') {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            downloadedFilePathRef.current = status.filePath || null;
            await proceedToVerification(status.filePath);
          } else if (status.status === 'FAILED') {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setFlowState('FAILED');
            setErrorMessage(status.message || 'Download failed. Tap Retry to try again.');
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setFlowState('FAILED');
            setErrorMessage('Download timed out. Please check your connection and tap Retry.');
          }
        } catch (pollErr: any) {
          console.warn('[ApkDownloader Poll Error]', pollErr);
        }
      }, 1000);
    } catch (err: any) {
      console.error('[ApkDownloader Start Error]', err);
      attemptDirectDownloadFallback(err);
    }
  }, [updateInfo, proceedToVerification, attemptDirectDownloadFallback]);

  const openSettings = useCallback(async () => {
    try {
      await NativeApkDownloader.openInstallPermissionSettings();
    } catch (e: any) {
      console.warn('[ApkDownloader Settings Error]', e);
    }
  }, []);

  const reset = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setFlowState('IDLE');
    setPercent(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setStatusMessage('');
    setErrorMessage(null);
  }, []);

  return {
    flowState,
    percent,
    downloadedBytes,
    totalBytes,
    statusMessage,
    errorMessage,
    startDownload,
    launchInstaller: () => launchPackageInstaller(),
    openSettings,
    reset,
  };
};

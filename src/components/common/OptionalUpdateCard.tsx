import React from 'react';
import { Download, X, Loader2, RotateCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AppVersionResponse } from '../../types/index.js';
import { useApkUpdateDownload } from '../../hooks/useApkUpdateDownload.js';
import { isNativeAndroidApp } from '../../lib/capacitor.js';

interface OptionalUpdateCardProps {
  updateInfo: AppVersionResponse;
  onDismiss: () => void;
}

export const OptionalUpdateCard: React.FC<OptionalUpdateCardProps> = ({
  updateInfo,
  onDismiss,
}) => {
  if (!isNativeAndroidApp()) {
    return null;
  }

  const {
    flowState,
    percent,
    statusMessage,
    errorMessage,
    startDownload,
    launchInstaller,
    openSettings,
  } = useApkUpdateDownload({ updateInfo });

  const sizeMb = updateInfo.fileSizeBytes
    ? (updateInfo.fileSizeBytes / (1024 * 1024)).toFixed(1)
    : '4.4';

  const isDownloading = flowState === 'STARTING_DOWNLOAD' || flowState === 'DOWNLOADING';
  const isBusy = isDownloading || flowState === 'VERIFYING_APK' || flowState === 'OPENING_INSTALLER';

  return (
    <div
      id="optional-update-card"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-stone-900 text-stone-100 rounded-2xl p-4 shadow-2xl border border-stone-800 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Update Available (v{updateInfo.latestVersion})
            </h4>
          </div>
          <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2">
            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0
              ? updateInfo.releaseNotes[0]
              : 'New improvements and performance enhancements are available.'}
          </p>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            Build {updateInfo.latestBuildNumber} &bull; {sizeMb} MB
          </div>
        </div>

        {!isBusy && (
          <button
            id="dismiss-optional-update-btn"
            onClick={onDismiss}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar during download */}
      {isDownloading && (
        <div className="mt-3 space-y-1">
          <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 font-mono">
            <span>{statusMessage}</span>
            <span>{percent}%</span>
          </div>
        </div>
      )}

      {/* Verification or Opening status */}
      {(flowState === 'VERIFYING_APK' || flowState === 'OPENING_INSTALLER') && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Permission required notice */}
      {flowState === 'PERMISSION_REQUIRED' && (
        <div className="mt-3 p-2.5 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Permission Needed</p>
            <p className="text-[11px] text-amber-300/90 mt-0.5">
              Allow IKSHOVIA to install apps from this source in Android Settings.
            </p>
            <button
              onClick={openSettings}
              className="mt-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] rounded-md transition-colors"
            >
              Open Android Settings
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {flowState === 'FAILED' && errorMessage && (
        <p className="mt-2 text-xs text-rose-400 leading-tight">
          {errorMessage}
        </p>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        {flowState === 'IDLE' && (
          <>
            <button
              id="start-optional-download-btn"
              onClick={startDownload}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
            <button
              id="later-optional-update-btn"
              onClick={onDismiss}
              className="py-2 px-3 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Later
            </button>
          </>
        )}

        {flowState === 'INSTALLER_OPENED' && (
          <button
            id="reopen-installer-btn"
            onClick={launchInstaller}
            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Re-open Installer</span>
          </button>
        )}

        {flowState === 'FAILED' && (
          <button
            id="retry-optional-download-btn"
            onClick={startDownload}
            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry Download</span>
          </button>
        )}
      </div>
    </div>
  );
};

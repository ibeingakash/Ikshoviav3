import React from 'react';
import { Download, Loader2, RotateCw, CheckCircle2, ShieldAlert, AlertOctagon } from 'lucide-react';
import { AppVersionResponse } from '../../types/index.js';
import { useApkUpdateDownload } from '../../hooks/useApkUpdateDownload.js';
import { isNativeAndroidApp } from '../../lib/capacitor.js';

interface MandatoryUpdateScreenProps {
  updateInfo: AppVersionResponse;
  installedBuildNumber: number;
}

export const MandatoryUpdateScreen: React.FC<MandatoryUpdateScreenProps> = ({
  updateInfo,
  installedBuildNumber,
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

  return (
    <div
      id="mandatory-update-screen"
      className="fixed inset-0 z-[9999] bg-stone-950 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Update Required to Continue
            </h2>
            <p className="text-xs text-stone-400">
              IKSHOVIA v{updateInfo.latestVersion} (Build {updateInfo.latestBuildNumber})
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50 space-y-2">
          <p className="text-xs text-stone-300 leading-relaxed">
            Your installed version (Build {installedBuildNumber}) is no longer supported. This update contains essential database compatibility, test engine updates, and security fixes required to access your account and studies.
          </p>
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1 border-t border-stone-700/40">
            <span>Minimum Build: {updateInfo.minimumSupportedBuildNumber}</span>
            <span>Package Size: ~{sizeMb} MB</span>
          </div>
        </div>

        {/* Release notes highlights */}
        {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
              What&apos;s New
            </h4>
            <div className="bg-stone-950/60 rounded-xl p-3 border border-stone-800/80 max-h-32 overflow-y-auto space-y-1.5 text-xs text-stone-300">
              {updateInfo.releaseNotes.slice(0, 3).map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-400 font-bold">&bull;</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Display */}
        {isDownloading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-stone-300 font-mono">
              <span>{statusMessage}</span>
              <span className="text-amber-400 font-bold">{percent}%</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
              />
            </div>
          </div>
        )}

        {/* Verification or Launching Installer */}
        {(flowState === 'VERIFYING_APK' || flowState === 'OPENING_INSTALLER') && (
          <div className="mt-4 p-3 bg-stone-800/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-300 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Permission Required Notice */}
        {flowState === 'PERMISSION_REQUIRED' && (
          <div className="mt-4 p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Permission Needed</p>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  Allow IKSHOVIA to install updates in Android Settings, then tap Continue.
                </p>
              </div>
            </div>
            <button
              onClick={openSettings}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Open Android Settings
            </button>
          </div>
        )}

        {/* Error State */}
        {flowState === 'FAILED' && errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300">
            <p className="font-semibold">Update Failed</p>
            <p className="text-[11px] text-rose-300/90 mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="mt-5 space-y-2">
          {flowState === 'IDLE' && (
            <button
              id="start-mandatory-download-btn"
              onClick={startDownload}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download &amp; Install Update</span>
            </button>
          )}

          {flowState === 'INSTALLER_OPENED' && (
            <button
              id="reopen-mandatory-installer-btn"
              onClick={launchInstaller}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Re-open Package Installer</span>
            </button>
          )}

          {flowState === 'FAILED' && (
            <button
              id="retry-mandatory-download-btn"
              onClick={startDownload}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

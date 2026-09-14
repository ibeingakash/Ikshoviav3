import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AppVersionResponse } from '../../types/index.js';

interface AppUpdateModalProps {
  isOpen: boolean;
  updateInfo: AppVersionResponse | null;
  onDismiss: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  updateInfo,
  onDismiss,
}) => {
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !updateInfo || !updateInfo.updateAvailable) {
    return null;
  }

  const isMandatory = updateInfo.updateRequired || updateInfo.updateType === 'MANDATORY';
  const sizeMb = (updateInfo.fileSizeBytes / (1024 * 1024)).toFixed(2);

  const handleCopyChecksum = () => {
    if (updateInfo.sha256Checksum) {
      navigator.clipboard.writeText(updateInfo.sha256Checksum);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2500);
    }
  };

  const handleStartDownload = () => {
    setIsDownloading(true);
    const downloadUrl = updateInfo.downloadUrl || updateInfo.apkUrl || '/api/app/download/latest';

    // Trigger download
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `ikshovia-v${updateInfo.latestVersion}.apk`;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Keep downloading indicator for feedback
    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={isMandatory ? undefined : onDismiss}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isMandatory ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  isMandatory ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isMandatory ? 'Mandatory System Update' : 'New Update Available'}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  v{updateInfo.latestVersion}
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">
                IKSHOVIA Android Update
              </h2>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onDismiss}
              className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1 rounded-md transition-colors"
              title="Remind me later"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mandatory Warning Banner */}
        {isMandatory && (
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-semibold">Action Required to Continue</p>
              <p className="text-rose-800 leading-relaxed">
                Your current installation requires this official update to ensure database schema compatibility, offline sync integrity, and continued access to tests.
              </p>
            </div>
          </div>
        )}

        {/* Version & Build Details */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase block">New Version</span>
            <span className="text-sm font-bold text-stone-900">v{updateInfo.latestVersion}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase block">Build Code</span>
            <span className="text-sm font-bold text-stone-900">Build {updateInfo.latestBuildNumber}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase block">Package Size</span>
            <span className="text-sm font-bold text-stone-900">{sizeMb} MB</span>
          </div>
        </div>

        {/* Release Notes */}
        <div>
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
            What&apos;s New in this Release
          </h3>
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 space-y-2 max-h-48 overflow-y-auto">
            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 ? (
              updateInfo.releaseNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{note}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-600 italic">General performance and stability enhancements.</p>
            )}
          </div>
        </div>

        {/* Security & Checksum */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified SHA-256 Checksum
            </span>
            <code className="text-[10px] text-stone-600 font-mono block truncate max-w-[260px] sm:max-w-xs">
              {updateInfo.sha256Checksum}
            </code>
          </div>
          <button
            onClick={handleCopyChecksum}
            className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600 transition-colors"
            title="Copy SHA-256 Checksum"
          >
            {copiedChecksum ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Upgrade Instructions Box */}
        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-950 space-y-1">
          <p className="font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            How to Upgrade Over Your Existing App:
          </p>
          <ol className="list-decimal list-inside text-[11px] text-amber-900 space-y-0.5 pl-1 leading-relaxed">
            <li>Tap <strong>Download &amp; Install APK</strong> below.</li>
            <li>When the download finishes, tap the notification or open your Downloads folder.</li>
            <li>Choose <strong>Update</strong> — all your mock test results, bookmarks, and login session will be preserved.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <button
            onClick={handleStartDownload}
            disabled={isDownloading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Starting APK Download...' : 'Download & Install APK'}
          </button>

          {!isMandatory && (
            <button
              onClick={onDismiss}
              className="w-full py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors"
            >
              Remind Me Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

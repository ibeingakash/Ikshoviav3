import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Bot,
  Sliders,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Moon,
  Sparkles,
  Database,
  Smartphone,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { CURRENT_APP_VERSION, WEB_APP_VERSION, getClientAppVersion, ClientAppVersionInfo } from '../../config/appVersion.js';
import { isNativeAndroidApp } from '../../lib/capacitor.js';
import { AppVersionResponse } from '../../types/index.js';
import { AppUpdateModal } from '../common/AppUpdateModal.js';
import { ChangePasswordSection } from '../profile/ChangePasswordSection.js';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { refreshLearnerData, setActiveSection } = useLearner();

  const [tutorMode, setTutorMode] = useState<'SOCRATIC' | 'DIRECT' | 'SUMMARY'>('SOCRATIC');
  const [dailyReminders, setDailyReminders] = useState(true);
  const [revisionAlerts, setRevisionAlerts] = useState(true);
  const [aiDigest, setAiDigest] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // App Update checking & live runtime state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<AppVersionResponse | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [installedAppInfo, setInstalledAppInfo] = useState<ClientAppVersionInfo | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  useEffect(() => {
    getClientAppVersion().then(info => {
      setInstalledAppInfo(info);
      console.log('[SettingsView Installed Version Loaded]', info);
    });
  }, []);

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateMessage(null);
    try {
      const clientVer = await getClientAppVersion();
      setInstalledAppInfo(clientVer);
      if (clientVer.isNative) {
        const res = await api.getAppVersion(clientVer.buildNumber, clientVer.versionName);
        setUpdateStatus(res);
        if (res && res.updateAvailable) {
          setUpdateMessage(`Android Update: Version ${res.latestVersion} (Build ${res.latestBuildNumber}) is available!`);
        } else {
          setUpdateMessage('You are running the latest version of IKSHOVIA Android App.');
        }
      } else {
        // Web Platform: Informational check of latest optional APK
        const res = await api.getAppVersion();
        setUpdateStatus(res);
        setUpdateMessage(`Web platform is running the latest release (v${WEB_APP_VERSION.versionName}). Optional Android APK v${res?.latestVersion || CURRENT_APP_VERSION.versionName} (Build ${res?.latestBuildNumber || CURRENT_APP_VERSION.buildNumber}) is available.`);
      }
    } catch {
      setUpdateMessage('Unable to connect to release server. Please try again later.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-700" />
            <span>Platform Settings & Intelligence Tuning</span>
          </h1>
          <p className="text-stone-500 text-xs mt-0.5 font-medium">
            Customize how IKSHOVIA AI engine adaptively guides your study process.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Platform preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* AI Tutor Persona & Pedagogical Mode */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Bot className="w-4 h-4 text-amber-700" />
            <span>AI Tutor Pedagogical Style</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              onClick={() => setTutorMode('SOCRATIC')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SOCRATIC'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-stone-900">Socratic Coaching</span>
                {tutorMode === 'SOCRATIC' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Asks guiding questions, tests assumptions, and encourages deep conceptual reasoning before revealing answers.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('DIRECT')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'DIRECT'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-stone-900">Direct & Precise</span>
                {tutorMode === 'DIRECT' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Provides direct, structured explanations with article numbers, constitutional provisions, and bullet-point summaries.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('SUMMARY')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SUMMARY'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-stone-900">Exam High-Yield Focus</span>
                {tutorMode === 'SUMMARY' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Highlights common UPSC trap options, past-year question patterns, and key takeaways for quick revision.
              </p>
            </label>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-700" />
            <span>Spaced Repetition & Study Reminders</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-stone-900">Daily Goal Reminders</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Receive gentle prompts if daily study target is incomplete</div>
              </div>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={e => setDailyReminders(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 accent-amber-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-stone-900">Spaced Repetition Queue Alerts</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Alert when concepts hit retention decay threshold</div>
              </div>
              <input
                type="checkbox"
                checked={revisionAlerts}
                onChange={e => setRevisionAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 accent-amber-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-stone-900">AI Daily Intelligence Summary</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Daily breakdown of confidence alignment and mistake patterns</div>
              </div>
              <input
                type="checkbox"
                checked={aiDigest}
                onChange={e => setAiDigest(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 accent-amber-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Account Info & Diagnostics */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>Account Security & System Diagnostics</span>
          </h2>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <span>Authenticated Account: {user?.name}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-300 font-mono">
                  {user?.role || 'STUDENT'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono mt-1">
                {user?.email} • Target Exam: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-stone-900">Re-sync Learner Model & Engine State</div>
              <div className="text-[11px] text-stone-500 mt-0.5">Force re-evaluation of mastery scores and revision queue</div>
            </div>
            <button
              type="button"
              onClick={refreshLearnerData}
              className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Re-sync</span>
            </button>
          </div>
        </div>

        {/* Security & Password Management */}
        <div id="security-password-settings">
          <ChangePasswordSection />
        </div>

        {/* Android App & In-App Update Center */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>Android App &amp; Website Release System</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('download')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Download Portal</span>
              <Download className="w-3 h-3 text-amber-700" />
            </button>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                {isNativeAndroidApp() ? (
                  <>
                    <span>Android Client: v{installedAppInfo?.versionName || CURRENT_APP_VERSION.versionName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-semibold">
                      Build {installedAppInfo?.buildNumber ?? CURRENT_APP_VERSION.buildNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Official Signed Release
                    </span>
                  </>
                ) : (
                  <>
                    <span>Web Platform: v{WEB_APP_VERSION.versionName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Cloud Active
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      APK v{CURRENT_APP_VERSION.versionName} Available
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-mono">
                {isNativeAndroidApp()
                  ? `Package ID: ${installedAppInfo?.packageId || CURRENT_APP_VERSION.packageId} • Upgrades preserve learner data`
                  : 'Web application runs seamlessly in browser without requiring native app installation.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualCheckUpdate}
              disabled={isCheckingUpdate}
              className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? 'Checking...' : isNativeAndroidApp() ? 'Check for Updates' : 'Check Release Status'}</span>
            </button>
          </div>

          {/* Live Device & Release Diagnostics Screen/Card */}
          <div className="p-3.5 bg-stone-100/80 rounded-xl border border-stone-200 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-stone-700 font-bold border-b border-stone-200 pb-1">
              <span>DEVICE &amp; RUNTIME DIAGNOSTICS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-sans">
                {installedAppInfo?.isNative ? 'ANDROID NATIVE (Capacitor)' : 'WEB BROWSER'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-stone-600">
              <div>Installed Package: <span className="font-bold text-stone-900">{installedAppInfo?.packageId || (isNativeAndroidApp() ? 'com.ikshovia.app' : 'com.ikshovia.web')}</span></div>
              <div>Installed Version: <span className="font-bold text-stone-900">{installedAppInfo?.versionName || CURRENT_APP_VERSION.versionName}</span></div>
              <div>Installed Build: <span className="font-bold text-stone-900">{installedAppInfo?.buildNumber ?? CURRENT_APP_VERSION.buildNumber}</span></div>
              <div>Server Release: <span className="font-bold text-stone-900">{updateStatus ? `v${updateStatus.latestVersion} (Build ${updateStatus.latestBuildNumber})` : 'Run check to query'}</span></div>
              <div>Min Supported Build: <span className="font-bold text-stone-900">{updateStatus?.minimumSupportedBuildNumber ?? 'N/A'}</span></div>
              <div>Update Decision: <span className="font-bold text-stone-900">{updateStatus ? (updateStatus.updateAvailable ? (updateStatus.updateRequired ? 'MANDATORY UPDATE' : 'OPTIONAL UPDATE') : 'UP TO DATE') : 'Not checked'}</span></div>
            </div>

            {isNativeAndroidApp() && (
              <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-stone-500 font-sans">
                  Verify native DownloadManager pipeline on this physical device:
                </span>
                <button
                  type="button"
                  id="test-native-apk-downloader-btn"
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test Native APK Downloader</span>
                </button>
              </div>
            )}
          </div>

          {updateMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              updateStatus?.updateAvailable
                ? updateStatus.updateRequired
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {updateStatus?.updateAvailable ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-semibold">{updateMessage}</p>
                {updateStatus?.updateAvailable && (
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href="/api/app/download/latest"
                      className="inline-flex items-center gap-1.5 font-bold underline hover:no-underline text-xs"
                      download
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Latest APK</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveSection('download')}
                      className="font-medium underline hover:no-underline text-xs"
                    >
                      View Full Release Notes &amp; Checksums
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-amber-300 font-bold text-xs rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer transition-all"
          >
            Save All Preferences
          </button>
        </div>
      </form>

      {isTestModalOpen && isNativeAndroidApp() && (
        <AppUpdateModal
          isOpen={isTestModalOpen}
          updateInfo={{
            status: 'UPDATE_AVAILABLE',
            latestVersion: '2.2',
            latestBuildNumber: 8,
            minimumSupportedVersion: '2.2',
            minimumSupportedBuildNumber: 7,
            updateUrl: 'https://ikshoviacse.onrender.com/download',
            apkUrl: 'https://ikshoviacse.onrender.com/api/app/download/latest',
            downloadUrl: 'https://ikshoviacse.onrender.com/api/app/download/latest',
            fileSizeBytes: 4498026,
            sha256Checksum: '7fc08d826d9c3e2cd7a36913a60e8011919d864d6bd396bd81b36837f18a536d',
            updateAvailable: true,
            updateRequired: false,
            updateType: 'OPTIONAL',
            releaseNotes: ['Testing Native Android DownloadManager & Installer integration.'],
            releaseNotesRaw: 'Testing Native Android DownloadManager & Installer integration.',
            publishedAt: new Date().toISOString(),
            platform: 'android',
            packageId: 'com.ikshovia.app',
          }}
          installedBuildNumber={installedAppInfo?.buildNumber ?? 7}
          onDismiss={() => setIsTestModalOpen(false)}
        />
      )}
    </div>
  );
};

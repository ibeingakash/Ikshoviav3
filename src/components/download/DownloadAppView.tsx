import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Sparkles,
  BookOpen,
  FileCheck2,
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Bell,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { brandAssets } from '../../branding/brandAssets.js';
import { BrandLogo } from '../common/BrandLogo.js';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface PublishedRelease {
  id: string;
  platform: string;
  versionName: string;
  versionCode: number;
  minSupportedVersionCode: number;
  apkUrl: string;
  sha256Checksum: string;
  fileSizeBytes: number;
  releaseNotes?: string;
  isMandatory: boolean;
  createdAt: string;
  buildType?: string;
  isTestingBuild?: boolean;
}

interface AppVersionResponse {
  status: 'NO_RELEASE_AVAILABLE' | 'AVAILABLE' | 'UPDATE_AVAILABLE' | 'MANDATORY_UPDATE' | 'CURRENT';
  message?: string;
  platform: string;
  buildType?: string;
  isTestingBuild?: boolean;
  release: PublishedRelease | null;
}

export const DownloadAppView: React.FC<{ onBackToHome?: () => void }> = ({ onBackToHome }) => {
  const { setActiveSection } = useLearner();
  const { user } = useAuth();

  const [versionData, setVersionData] = useState<AppVersionResponse>({
    status: 'AVAILABLE',
    platform: 'android',
    buildType: 'DEBUG',
    isTestingBuild: true,
    release: {
      id: 'testing-build-local',
      platform: 'android',
      versionName: '1.0',
      versionCode: 1,
      minSupportedVersionCode: 1,
      apkUrl: '/apk/app-debug.apk',
      sha256Checksum: '30a97db96538142058f3b99b3e228098b65a7f18be347d969e2ddebb6eb87d63',
      fileSizeBytes: 14522269,
      releaseNotes: 'Testing Build: Verified Capacitor 8 runtime and debug packaging.',
      isMandatory: false,
      createdAt: new Date().toISOString(),
      buildType: 'DEBUG',
      isTestingBuild: true
    }
  });
  const [loading, setLoading] = useState(false);

  // Early access email state
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{
    success?: boolean;
    alreadySubscribed?: boolean;
    message?: string;
  } | null>(null);

  const [copiedChecksum, setCopiedChecksum] = useState(false);

  useEffect(() => {
    fetchLatestVersion();
  }, []);

  const fetchLatestVersion = async () => {
    try {
      const res = await fetch('/api/app/version/latest?platform=android');
      if (res.ok) {
        const data: AppVersionResponse = await res.json();
        if (data.release?.apkUrl) {
          setVersionData(data);
        }
      }
    } catch {
      // Keep verified local default state
    }
  };

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    try {
      setSubmitting(true);
      setSubscribeStatus(null);
      const res = await fetch('/api/app/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), platform: 'android' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribeStatus({
          success: true,
          alreadySubscribed: data.alreadySubscribed,
          message: data.message
        });
      } else {
        setSubscribeStatus({
          success: false,
          message: data.error || 'Failed to submit email. Please check your address and try again.'
        });
      }
    } catch {
      setSubscribeStatus({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyChecksum = (checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '13.85 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleReturn = () => {
    if (onBackToHome) {
      onBackToHome();
    } else if (user) {
      setActiveSection('dashboard');
    } else {
      window.location.href = '/';
    }
  };

  const release = versionData.release;
  const apkUrl = release?.apkUrl || '/apk/app-debug.apk';
  const versionName = release?.versionName || '1.0';
  const versionCode = release?.versionCode || 1;
  const checksum = release?.sha256Checksum || '30a97db96538142058f3b99b3e228098b65a7f18be347d969e2ddebb6eb87d63';
  const fileSizeBytes = release?.fileSizeBytes || 14522269;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#111426] font-sans-editorial flex flex-col selection:bg-[#35156B] selection:text-amber-300">
      {/* Top Bar */}
      <nav className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo
            variant="dashboard"
            onClick={handleReturn}
            size="md"
          />

          <button
            onClick={handleReturn}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-[#35156B] bg-white border border-stone-200/90 px-3.5 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{user ? 'Back to Dashboard' : 'Back to Platform'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs font-mono">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android App — Available</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif-editorial font-bold text-[#111426] tracking-tight leading-tight">
            IKSHOVIA Android App
          </h1>

          <p className="text-sm sm:text-base text-stone-600 font-sans max-w-2xl mx-auto leading-relaxed">
            Take your civil services preparation with you. The complete power of IKSHOVIA’s Personal Learning Intelligence—re-engineered for
            tactile, on-the-go practice, instant AI tutoring, and offline-resilient exam training.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-bold text-lg text-[#111426]">PYQ & Mock Tests</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Practice official UPSC & BPSC papers and timed mock exams with instant answer persistence,
              bilingual views, and detailed solution breakdowns.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-[#35156B] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-bold text-lg text-[#111426]">AI Tutor in Your Pocket</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Instant civil services conceptual resolution grounded strictly in official commission
              syllabus benchmarks and verified standard textbooks.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-bold text-lg text-[#111426]">Daily Current Affairs</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Curated daily news digests, Bihar special editions, and editorial summaries with linked
              revision cards and high-yield prelims MCQs.
            </p>
          </div>
        </div>

        {/* Release Status & Action Card */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          {/* Top Header & Primary Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
            <div className="flex items-start gap-4">
              <img
                src={brandAssets.appIcon}
                alt="IKSHOVIA App Icon"
                className="w-16 h-16 rounded-2xl shadow-md shrink-0 object-contain"
              />
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Android App — Available</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#111426]">
                  IKSHOVIA Android App
                </h2>
                <p className="text-xs text-stone-600 font-sans">
                  Native Android package (Capacitor 8) • Ready for direct device testing & installation
                </p>
              </div>
            </div>

            <a
              id="download-apk-button"
              href={apkUrl}
              download="ikshovia-debug.apk"
              className="inline-flex items-center justify-center gap-2.5 bg-[#0C1024] hover:bg-[#1B2144] active:scale-[0.98] text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer shrink-0"
            >
              <Download className="w-5 h-5 text-amber-400" />
              <span>DOWNLOAD APK</span>
            </a>
          </div>

          {/* Truthful Metadata Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Version</div>
              <div className="text-stone-900 font-bold text-sm">
                v{versionName} <span className="text-stone-500 font-normal text-xs">(Code {versionCode})</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Build</div>
              <div className="text-amber-800 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>Debug / Testing Build</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Package</div>
              <div className="text-stone-900 font-bold text-xs truncate">com.ikshovia.app</div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">APK Size</div>
              <div className="text-stone-900 font-bold text-sm">
                {formatFileSize(fileSizeBytes)}
              </div>
            </div>
          </div>

          {/* Checksum Details */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs font-mono">
            <div className="text-[10px] text-stone-500 font-bold uppercase flex items-center justify-between">
              <span>SHA-256 Checksum</span>
              <button
                onClick={() => copyChecksum(checksum)}
                className="text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedChecksum ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedChecksum ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-stone-700 break-all text-[11px]">
              {checksum}
            </div>
          </div>

          {/* Mandatory Testing Build Notice */}
          <div className="p-4 sm:p-5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 font-sans">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-900 font-mono">
                Testing Build
              </div>
              <p className="leading-relaxed text-amber-900/90">
                This is an early testing build. For testing purposes only. A production signed release APK will be published after final device testing and security verification.
              </p>
            </div>
          </div>

          {/* Divider and Early Access Section Below Download */}
          <div className="pt-8 border-t border-stone-200/80 space-y-5">
            <div className="space-y-1 text-left">
              <h3 className="text-lg sm:text-xl font-serif-editorial font-bold text-[#111426]">
                Want updates about the production release?
              </h3>
              <p className="text-xs text-stone-600 font-sans leading-relaxed">
                Join early access to get notified the moment our Google Play Store listing and official signed production APK are published.
              </p>
            </div>

            {/* Early Access Form */}
            <div className="bg-[#FAF8F5] border border-stone-200 p-5 rounded-2xl space-y-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-[#35156B] uppercase tracking-wider font-mono">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Early Access / Notify Me</span>
              </div>

              {subscribeStatus?.success ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-900">
                      {subscribeStatus.alreadySubscribed ? 'Already Registered!' : 'You’re on the priority list!'}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1">
                      {subscribeStatus.message}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEarlyAccessSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#35156B] focus:border-transparent font-sans"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-[#0C1024] hover:bg-[#1B2144] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 font-sans"
                    >
                      {submitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <span>Notify Me on Launch</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        </>
                      )}
                    </button>
                  </div>

                  {subscribeStatus?.success === false && (
                    <div className="text-xs text-rose-600 font-sans">
                      {subscribeStatus.message}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-stone-500 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Zero spam. You will only receive a notification when the official production release is published.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Device & Account Sync Assurance */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 font-mono">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Unified Cross-Platform Intelligence</span>
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed max-w-xl">
              Log in with your existing IKSHOVIA account on website or Android. Your course entitlements,
              question attempts, mastery graph, streaks, bookmarks, and notes remain synchronized in real time.
            </p>
          </div>

          <button
            onClick={handleReturn}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200/90 transition-all shrink-0 cursor-pointer"
          >
            {user ? 'Continue Studying on Web' : 'Explore Platform Online'}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 py-6 px-4 sm:px-8 text-center text-xs text-stone-500 font-sans">
        <p>© 2026 IKSHOVIA. All rights reserved. Personal Learning Intelligence for Civil Services Examination.</p>
      </footer>
    </div>
  );
};

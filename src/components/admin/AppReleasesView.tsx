import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ArrowUpCircle,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  History,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  Sliders,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { AppRelease, AppVersionResponse } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const AppReleasesView: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RELEASES' | 'SIMULATOR' | 'AUDIT'>('RELEASES');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inspector state
  const [serverApkInfo, setServerApkInfo] = useState<{
    fileName?: string;
    fileSizeBytes?: number;
    fileSizeMb?: string;
    sha256Checksum?: string;
    suggestedApkUrl?: string;
  } | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVersionName, setFormVersionName] = useState('');
  const [formVersionCode, setFormVersionCode] = useState(2);
  const [formMinSupportedCode, setFormMinSupportedCode] = useState(1);
  const [formApkUrl, setFormApkUrl] = useState('/apk/app-debug.apk');
  const [formSha256, setFormSha256] = useState('');
  const [formFileSizeBytes, setFormFileSizeBytes] = useState(14522269);
  const [formReleaseNotes, setFormReleaseNotes] = useState('');
  const [formIsMandatory, setFormIsMandatory] = useState(false);
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // Copied checksum feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-App Update Simulation State
  const [simBuildNumber, setSimBuildNumber] = useState<number>(0);
  const [simResult, setSimResult] = useState<AppVersionResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadData();
    inspectServerApkSilent();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rels, logs] = await Promise.all([
        api.getAdminAppReleases(),
        api.getAppReleaseAuditLogs(),
      ]);
      setReleases(rels);
      setAuditLogs(logs);
    } catch (err: any) {
      showNotification('error', 'Failed to load app releases.');
    } finally {
      setIsLoading(false);
    }
  };

  const inspectServerApkSilent = async () => {
    try {
      const res = await api.inspectLocalServerApk();
      if (res.success) {
        setServerApkInfo(res);
      }
    } catch (e) {
      // benign if not found
    }
  };

  const handleInspectServerApk = async () => {
    setIsInspecting(true);
    try {
      const res = await api.inspectLocalServerApk();
      if (res.success) {
        setServerApkInfo(res);
        showNotification('success', `Found server APK (${res.fileSizeMb} MB). Checksum verified.`);
      } else {
        showNotification('error', res.error || 'No APK package found on server storage.');
      }
    } catch (err: any) {
      showNotification('error', 'Inspection request failed.');
    } finally {
      setIsInspecting(false);
    }
  };

  const autofillFromDisk = () => {
    if (serverApkInfo) {
      if (serverApkInfo.sha256Checksum) setFormSha256(serverApkInfo.sha256Checksum);
      if (serverApkInfo.fileSizeBytes) setFormFileSizeBytes(serverApkInfo.fileSizeBytes);
      if (serverApkInfo.suggestedApkUrl) setFormApkUrl(serverApkInfo.suggestedApkUrl);
      showNotification('success', 'Form populated from server APK on disk.');
    } else {
      handleInspectServerApk();
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    const highestBuild = releases.length > 0 ? Math.max(...releases.map(r => r.version_code)) : 1;
    setFormVersionName(`1.${highestBuild}`);
    setFormVersionCode(highestBuild + 1);
    setFormMinSupportedCode(1);
    setFormApkUrl(serverApkInfo?.suggestedApkUrl || '/apk/app-debug.apk');
    setFormSha256(serverApkInfo?.sha256Checksum || '');
    setFormFileSizeBytes(serverApkInfo?.fileSizeBytes || 14522269);
    setFormReleaseNotes('• Offline sync enhancements\n• Mock test review improvements\n• Enhanced BPSC/UPSC study materials');
    setFormIsMandatory(false);
    setFormStatus('DRAFT');
    setShowModal(true);
  };

  const openEditModal = (rel: AppRelease) => {
    setEditingId(rel.id);
    setFormVersionName(rel.version_name);
    setFormVersionCode(rel.version_code);
    setFormMinSupportedCode(rel.min_supported_version_code);
    setFormApkUrl(rel.apk_url);
    setFormSha256(rel.sha256_checksum);
    setFormFileSizeBytes(Number(rel.file_size_bytes));
    setFormReleaseNotes(rel.release_notes || '');
    setFormIsMandatory(rel.is_mandatory);
    setFormStatus(rel.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    setShowModal(true);
  };

  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVersionName.trim() || !formSha256.trim() || !formApkUrl.trim()) {
      showNotification('error', 'Please fill in version name, APK URL, and SHA-256 checksum.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.createOrUpdateAppRelease({
        id: editingId || undefined,
        platform: 'android',
        version_name: formVersionName.trim(),
        version_code: Number(formVersionCode),
        min_supported_version_code: Number(formMinSupportedCode),
        apk_url: formApkUrl.trim(),
        sha256_checksum: formSha256.trim().toLowerCase(),
        file_size_bytes: Number(formFileSizeBytes),
        release_notes: formReleaseNotes.trim(),
        is_mandatory: formIsMandatory,
        status: formStatus,
      });

      if (res.success) {
        showNotification('success', `Release v${formVersionName} successfully saved.`);
        setShowModal(false);
        loadData();
      } else {
        showNotification('error', res.error || 'Failed to save release.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error occurred while saving release.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (id: string, name: string) => {
    if (!window.confirm(`Publish release v${name} as the active live production release? Older installations will be prompted to update.`)) {
      return;
    }
    try {
      const res = await api.publishAppRelease(id);
      if (res.success) {
        showNotification('success', `Release v${name} is now LIVE for all users.`);
        loadData();
      } else {
        showNotification('error', res.error || 'Failed to publish release.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Publish failed.');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Archive release v${name}?`)) return;
    try {
      const res = await api.archiveAppRelease(id);
      if (res.success) {
        showNotification('success', `Release v${name} archived.`);
        loadData();
      } else {
        showNotification('error', res.error || 'Failed to archive release.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Archive failed.');
    }
  };

  const handleRollback = async (id: string, name: string) => {
    if (!window.confirm(`Roll back active version to v${name}? This will instantly restore this version as PUBLISHED.`)) {
      return;
    }
    try {
      const res = await api.rollbackAppRelease(id);
      if (res.success) {
        showNotification('success', `Rolled back to v${name}. It is now active.`);
        loadData();
      } else {
        showNotification('error', res.error || 'Failed to rollback release.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Rollback failed.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete release v${name}? This action cannot be undone.`)) return;
    try {
      const res = await api.deleteAppRelease(id);
      if (res.success) {
        showNotification('success', `Release v${name} deleted.`);
        loadData();
      } else {
        showNotification('error', res.error || 'Failed to delete release.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Delete failed.');
    }
  };

  const handleCopyChecksum = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const runSimulator = async () => {
    setIsSimulating(true);
    try {
      const res = await api.getAppVersion(simBuildNumber);
      setSimResult(res);
    } catch {
      showNotification('error', 'Simulation call failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const activeRelease = releases.find(r => r.status === 'PUBLISHED');
  const filteredReleases = releases.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 uppercase tracking-wide">
              Official Distribution
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-stone-100 text-stone-700">
              Package: com.ikshovia.app
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-amber-600" />
            App Releases & Website APK Distribution
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Manage official Android APK versions, in-app update policies (mandatory vs. optional), and website download channels without Google Play Store dependency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
            title="Refresh Releases"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-sm transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              New Release
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Published */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Live Production Version</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {activeRelease ? (
            <div>
              <div className="text-2xl font-bold text-stone-900">
                v{activeRelease.version_name}
                <span className="text-xs font-normal text-stone-500 ml-2">Build {activeRelease.version_code}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                  Active in /download
                </span>
                {activeRelease.is_mandatory && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">
                    Mandatory
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xl font-bold text-amber-700">No Live Release</div>
              <p className="text-xs text-stone-500 mt-1">Publish a release below to activate downloads.</p>
            </div>
          )}
        </div>

        {/* Min Supported Build */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Min Supported Build</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            Build {activeRelease ? activeRelease.min_supported_version_code : '1'}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Installed builds below this will trigger a non-dismissible mandatory update.
          </p>
        </div>

        {/* Registered Releases */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>All Releases</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{releases.length}</div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
            <span>{releases.filter(r => r.status === 'PUBLISHED').length} Live</span>
            <span>•</span>
            <span>{releases.filter(r => r.status === 'DRAFT').length} Draft</span>
            <span>•</span>
            <span>{releases.filter(r => r.status === 'ARCHIVED').length} Archived</span>
          </div>
        </div>

        {/* Server APK File Status */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Server APK File</span>
            <FileCode className="w-4 h-4 text-stone-400" />
          </div>
          {serverApkInfo ? (
            <div>
              <div className="text-lg font-bold text-stone-900 truncate" title={serverApkInfo.fileName}>
                {serverApkInfo.fileName || 'app-debug.apk'}
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                <span>{serverApkInfo.fileSizeMb} MB</span>
                <span className="text-emerald-600 font-medium">Ready on Disk</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-stone-700">Checking disk...</div>
              <button
                onClick={handleInspectServerApk}
                disabled={isInspecting}
                className="mt-2 text-xs font-medium text-amber-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isInspecting ? 'animate-spin' : ''}`} />
                Inspect Server Disk
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('RELEASES')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'RELEASES'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Release Versions ({releases.length})
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SIMULATOR'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Client Update Simulator
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: RELEASES */}
      {activeTab === 'RELEASES' && (
        <div className="space-y-4">
          {/* Filters & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterStatus === tab
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All Releases' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/app/download/latest"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                Download Live APK
              </a>
              <a
                href="/api/app/version"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                View Version API JSON
              </a>
            </div>
          </div>

          {/* Releases List */}
          {filteredReleases.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
              <Smartphone className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No releases found</h3>
              <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
                No releases match the current filter. Create a new release to distribute your Android APK to learners.
              </p>
              {isSuperAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Create Release
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReleases.map(rel => {
                const isPublished = rel.status === 'PUBLISHED';
                const isDraft = rel.status === 'DRAFT';
                const isArchived = rel.status === 'ARCHIVED';
                const sizeMb = (Number(rel.file_size_bytes) / (1024 * 1024)).toFixed(2);

                return (
                  <div
                    key={rel.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-xs ${
                      isPublished
                        ? 'border-emerald-300 ring-1 ring-emerald-300/50'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Version Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-xl font-bold text-stone-900">
                            v{rel.version_name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
                            Build {rel.version_code}
                          </span>

                          {/* Status Badge */}
                          {isPublished && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              LIVE (Production)
                            </span>
                          )}
                          {isDraft && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              DRAFT
                            </span>
                          )}
                          {isArchived && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                              <Archive className="w-3.5 h-3.5 text-stone-500" />
                              ARCHIVED
                            </span>
                          )}

                          {/* Mandatory Badge */}
                          {rel.is_mandatory ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              Mandatory Enforcement
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                              Optional Update
                            </span>
                          )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-stone-500 pt-1">
                          <span>
                            Min Supported Build: <strong className="text-stone-700">{rel.min_supported_version_code}</strong>
                          </span>
                          <span>
                            File Size: <strong className="text-stone-700">{sizeMb} MB</strong>
                          </span>
                          <span>
                            Platform: <strong className="text-stone-700 capitalize">{rel.platform}</strong>
                          </span>
                          <span>
                            Created: <strong className="text-stone-700">{new Date(rel.created_at).toLocaleDateString()}</strong>
                          </span>
                        </div>

                        {/* Release Notes */}
                        {rel.release_notes && (
                          <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs text-stone-700 whitespace-pre-line border border-stone-100 max-w-2xl font-mono">
                            {rel.release_notes}
                          </div>
                        )}

                        {/* Checksum Bar */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                            SHA-256:
                          </span>
                          <code className="text-[11px] text-stone-600 font-mono bg-stone-100 px-2 py-0.5 rounded truncate max-w-md">
                            {rel.sha256_checksum}
                          </code>
                          <button
                            onClick={() => handleCopyChecksum(rel.sha256_checksum, rel.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                            title="Copy SHA-256 Checksum"
                          >
                            {copiedId === rel.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                        <a
                          href={rel.apk_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download APK
                        </a>

                        {isSuperAdmin && (
                          <>
                            {isDraft && (
                              <button
                                onClick={() => handlePublish(rel.id, rel.version_name)}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                Publish to Live
                              </button>
                            )}

                            {isPublished && (
                              <button
                                onClick={() => handleArchive(rel.id, rel.version_name)}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                Archive
                              </button>
                            )}

                            {isArchived && (
                              <button
                                onClick={() => handleRollback(rel.id, rel.version_name)}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Rollback to This
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(rel)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium"
                              >
                                Edit
                              </button>
                              {!isPublished && (
                                <button
                                  onClick={() => handleDelete(rel.id, rel.version_name)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                                  title="Delete Release"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              In-App Update Policy Simulator
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Verify how the backend responds to different client versions. Input an installed build number to inspect whether an update modal would appear as Optional, Mandatory, or Not Required.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="w-64">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Client Installed Build Number
              </label>
              <input
                type="number"
                min="0"
                value={simBuildNumber}
                onChange={e => setSimBuildNumber(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                placeholder="e.g. 0 for new or 1"
              />
            </div>

            <button
              onClick={runSimulator}
              disabled={isSimulating}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              Run Version Check
            </button>
          </div>

          {simResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-stone-50 border-stone-200">
                  <span className="text-xs text-stone-500 font-semibold uppercase">Resulting Status</span>
                  <div className="text-lg font-bold mt-1 text-stone-900">{simResult.status}</div>
                </div>
                <div className="p-4 rounded-xl border bg-stone-50 border-stone-200">
                  <span className="text-xs text-stone-500 font-semibold uppercase">Update Type</span>
                  <div className={`text-lg font-bold mt-1 ${
                    simResult.updateType === 'MANDATORY'
                      ? 'text-rose-600'
                      : simResult.updateType === 'OPTIONAL'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {simResult.updateType}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-stone-50 border-stone-200">
                  <span className="text-xs text-stone-500 font-semibold uppercase">Modal Behavior</span>
                  <div className="text-sm font-semibold mt-1 text-stone-700">
                    {simResult.updateRequired
                      ? 'Blocking (Non-dismissible)'
                      : simResult.updateAvailable
                      ? 'Advisory (Dismissible)'
                      : 'No Modal (Up to date)'}
                  </div>
                </div>
              </div>

              {/* JSON Response */}
              <div>
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                  Raw API Response (/api/app/version)
                </span>
                <pre className="mt-1 p-4 bg-stone-900 text-emerald-400 rounded-xl text-xs overflow-x-auto font-mono">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              App Release Audit Trail
            </h3>
            <span className="text-xs text-stone-500">{auditLogs.length} events logged</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              No release management actions logged yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-stone-800 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px]">
                        {log.action}
                      </span>
                      <span>Target: {log.target_id}</span>
                    </div>
                    <div className="text-stone-500">
                      Actor: <span className="font-medium text-stone-700">{log.user_id}</span> ({log.user_role})
                    </div>
                  </div>
                  <div className="text-right text-stone-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                {editingId ? 'Edit App Release' : 'Publish New App Release'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRelease} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Version Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVersionName}
                    onChange={e => setFormVersionName(e.target.value)}
                    placeholder="e.g. 1.0.1"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Build Code (Integer) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formVersionCode}
                    onChange={e => setFormVersionCode(parseInt(e.target.value, 10) || 1)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Min Supported Build *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formMinSupportedCode}
                    onChange={e => setFormMinSupportedCode(parseInt(e.target.value, 10) || 1)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    APK Download URL or Server Path *
                  </label>
                  <button
                    type="button"
                    onClick={autofillFromDisk}
                    className="text-xs text-amber-700 hover:underline font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-fill from Server Disk
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formApkUrl}
                  onChange={e => setFormApkUrl(e.target.value)}
                  placeholder="/apk/app-debug.apk or https://..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    File Size (Bytes) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formFileSizeBytes}
                    onChange={e => setFormFileSizeBytes(parseInt(e.target.value, 10) || 0)}
                    placeholder="14522269"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    ~{(formFileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="DRAFT">DRAFT (Testing only)</option>
                    <option value="PUBLISHED">PUBLISHED (Live to all users)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SHA-256 Checksum (Hex 64 chars) *
                </label>
                <input
                  type="text"
                  required
                  value={formSha256}
                  onChange={e => setFormSha256(e.target.value)}
                  placeholder="30a97db96538142058f3b99b3e228098b65a7f18be347d969e2ddebb6eb87d63"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Release Notes (Displayed to users inside update modal)
                </label>
                <textarea
                  rows={4}
                  value={formReleaseNotes}
                  onChange={e => setFormReleaseNotes(e.target.value)}
                  placeholder="• Fixed daily quiz sync&#10;• Added offline test review"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              {/* Mandatory Toggle */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="mandatoryToggle"
                  checked={formIsMandatory}
                  onChange={e => setFormIsMandatory(e.target.checked)}
                  className="mt-1 h-4 w-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                />
                <label htmlFor="mandatoryToggle" className="text-xs text-amber-900 cursor-pointer">
                  <span className="font-semibold block">Enforce Mandatory Update</span>
                  Older clients will be blocked from accessing the app until they download and install this APK.
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>Save Release</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

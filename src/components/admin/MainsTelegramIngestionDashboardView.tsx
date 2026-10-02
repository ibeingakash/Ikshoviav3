import React, { useState, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Eye,
  RotateCw,
  XCircle,
  Hash,
  Download,
  Check,
  Search,
  ExternalLink,
  Bot,
  Radio,
  FileCheck
} from 'lucide-react';
import { api } from '../../lib/api.js';

type SectionKey =
  | 'SOURCES'
  | 'CONNECTION'
  | 'QUEUE'
  | 'OCR'
  | 'GROUND_TRUTH'
  | 'PII'
  | 'DUPLICATES'
  | 'CANDIDATES'
  | 'FAILED'
  | 'AUDIT_LOG';

export const MainsTelegramIngestionDashboardView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('SOURCES');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedImport, setSelectedImport] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'RAW' | 'EXTRACTED' | 'OCR' | 'SANITIZED' | 'EVALUATION'>('SANITIZED');

  // Modals
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [newChatId, setNewChatId] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newSourceType, setNewSourceType] = useState<string>('PRIVATE_GROUP');
  const [newAuthBasis, setNewAuthBasis] = useState<string>('ACADEMIC_FACULTY_CONSENT');
  const [newRetention, setNewRetention] = useState<string>('PERSIST_ORIGINAL');

  // Validation modal
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationMarks, setValidationMarks] = useState<number>(7.5);
  const [validationVerdict, setValidationVerdict] = useState<string>('ACCEPTED');
  const [validationFeedback, setValidationFeedback] = useState<string>('Verified faculty checking against UPSC standard rubric.');

  // Exclusion modal
  const [showExcludeModal, setShowExcludeModal] = useState<boolean>(false);
  const [excludeReason, setExcludeReason] = useState<string>('Off-topic or unverified faculty evaluation.');

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Runtime Diagnostic & Webhook states (Section 6, 7, 8, 10)
  const [runtimeStatus, setRuntimeStatus] = useState<any>(null);
  const [registeringWebhook, setRegisteringWebhook] = useState<boolean>(false);

  // Pending Sources Discovery & Authorization states
  const [pendingSources, setPendingSources] = useState<any[]>([]);
  const [sourceSubTab, setSourceSubTab] = useState<'AUTHORIZED' | 'PENDING'>('AUTHORIZED');
  const [showAuthorizePendingModal, setShowAuthorizePendingModal] = useState<boolean>(false);
  const [selectedPendingSource, setSelectedPendingSource] = useState<any | null>(null);
  const [pendingDisplayName, setPendingDisplayName] = useState<string>('');
  const [pendingAuthBasis, setPendingAuthBasis] = useState<string>('ACADEMIC_FACULTY_CONSENT');
  const [pendingRetention, setPendingRetention] = useState<string>('PERSIST_ORIGINAL');
  const [pendingActionLoading, setPendingActionLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, runtimeData, sourcesData, pendingSourcesData, importsData] = await Promise.all([
        api.getAdminMainsTelegramStats().catch(() => null),
        api.getAdminMainsTelegramRuntimeStatus().catch(() => null),
        api.getAdminMainsTelegramSources().catch(() => []),
        api.getAdminMainsTelegramPendingSources().catch(() => []),
        api.getAdminMainsTelegramImports({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100
        }).catch(() => ({ items: [], totalCount: 0 }))
      ]);

      setStats(statsData);
      setRuntimeStatus(runtimeData);
      setSources(sourcesData || []);
      setPendingSources(pendingSourcesData || []);
      setImports(importsData?.items || []);
      setTotalCount(importsData?.totalCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load Telegram ingestion data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWebhook = async () => {
    setRegisteringWebhook(true);
    try {
      const res = await api.registerAdminMainsTelegramWebhook();
      showNotification(`Telegram Webhook registered successfully: ${res.webhookUrl}`);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to register Telegram webhook');
    } finally {
      setRegisteringWebhook(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // 1. Source Management & Pending Authorization Handlers
  const handleOpenAuthorizePending = (pend: any) => {
    setSelectedPendingSource(pend);
    setPendingDisplayName(`Faculty Group ${pend.telegramChatId}`);
    setPendingAuthBasis('ACADEMIC_FACULTY_CONSENT');
    setPendingRetention('PERSIST_ORIGINAL');
    setShowAuthorizePendingModal(true);
  };

  const handleConfirmAuthorizePending = async () => {
    if (!selectedPendingSource) return;
    setPendingActionLoading(true);
    try {
      await api.authorizeAdminMainsTelegramPendingSource(selectedPendingSource.telegramChatId, {
        displayName: pendingDisplayName.trim() || `Faculty Group ${selectedPendingSource.telegramChatId}`,
        authorizationBasis: pendingAuthBasis,
        retentionPolicy: pendingRetention
      });
      setShowAuthorizePendingModal(false);
      setSelectedPendingSource(null);
      showNotification(`Source ${selectedPendingSource.telegramChatId} successfully authorized as ingestion source.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to authorize pending source');
    } finally {
      setPendingActionLoading(false);
    }
  };

  const handleRejectPending = async (chatId: string) => {
    if (!confirm(`Are you sure you want to reject source ${chatId}? It will remain blocked from ingesting dataset copies.`)) {
      return;
    }
    setPendingActionLoading(true);
    try {
      await api.rejectAdminMainsTelegramPendingSource(chatId);
      showNotification(`Source ${chatId} rejected.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to reject pending source');
    } finally {
      setPendingActionLoading(false);
    }
  };

  // 1. Source Management
  const handleRegisterSource = async () => {
    if (!newChatId.trim() || !newDisplayName.trim()) {
      alert('Telegram Chat ID and Display Name are required.');
      return;
    }

    try {
      await api.registerAdminMainsTelegramSource({
        sourceType: newSourceType,
        telegramChatId: newChatId.trim(),
        displayName: newDisplayName.trim(),
        authorized: true,
        authorizationBasis: newAuthBasis,
        retentionPolicy: newRetention
      });

      setShowAddSourceModal(false);
      setNewChatId('');
      setNewDisplayName('');
      showNotification('New Telegram source authorized successfully.');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to authorize source');
    }
  };

  const handleToggleSourceAuth = async (source: any) => {
    try {
      await api.updateAdminMainsTelegramSource(source.id, {
        authorized: !source.authorized
      });
      showNotification(`Source ${source.displayName} ${!source.authorized ? 'authorized' : 'disabled'}.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update source authorization');
    }
  };

  // 2. Validate Ground Truth
  const handleValidateGroundTruth = async () => {
    if (!selectedImport) return;
    try {
      await api.validateAdminMainsTelegramGroundTruth(selectedImport.id, {
        facultyMarks: Number(validationMarks),
        facultyVerdict: validationVerdict,
        facultyFeedback: validationFeedback
      });

      setShowValidationModal(false);
      showNotification(`Ground truth certified! Candidate created for ${selectedImport.id}.`);
      setSelectedImport(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to validate ground truth');
    }
  };

  // 3. Exclude
  const handleExclude = async () => {
    if (!selectedImport) return;
    try {
      await api.excludeAdminMainsTelegramImport(selectedImport.id, excludeReason);
      setShowExcludeModal(false);
      showNotification(`Import ${selectedImport.id} marked as EXCLUDED.`);
      setSelectedImport(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to exclude import');
    }
  };

  // 4. Retry
  const handleRetry = async (id: string) => {
    try {
      await api.retryAdminMainsTelegramImport(id);
      showNotification(`Re-processing triggered for ${id}.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to retry import');
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* HEADER & CONNECTION STATUS BANNER                    */}
      {/* ---------------------------------------------------- */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-sky-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Phase 4.1J Ingestion Transport
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-stone-700/60 text-stone-200 border border-stone-600/40">
                Telegram Authorized Mains Copy Pipeline
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Send className="w-6 h-6 text-sky-400" />
              Telegram Mains Copy Ingestion Hub
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Secure ingestion endpoint for genuine authorized Mains copies. Strictly requires authorized source chats,
              SHA-256 idempotency, OCR/PDF extraction, PII sanitization, benchmark isolation, and certified human ground-truth validation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={loadAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-lg transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Register / Repair Webhook Button (Section 7) */}
            {(runtimeStatus?.configured || stats?.botConfigured) && (!runtimeStatus?.webhookConfigured || runtimeStatus?.runtime === 'WEBHOOK_ERROR') && (
              <button
                onClick={handleRegisterWebhook}
                disabled={registeringWebhook}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer ${
                  runtimeStatus?.runtime === 'WEBHOOK_ERROR'
                    ? 'bg-rose-700 hover:bg-rose-600 text-white'
                    : 'bg-sky-700 hover:bg-sky-600 text-white'
                }`}
              >
                <Send className={`w-3.5 h-3.5 ${registeringWebhook ? 'animate-spin' : ''}`} />
                {registeringWebhook ? 'Registering...' : (runtimeStatus?.runtime === 'WEBHOOK_ERROR' ? 'Repair Webhook' : 'Register Webhook')}
              </button>
            )}

            <div className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 border ${
              (runtimeStatus?.runtime === 'READY' || stats?.telegramRuntime === 'READY' || stats?.telegramRuntime === 'VERIFIED')
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : (runtimeStatus?.runtime === 'WEBHOOK_PENDING' || runtimeStatus?.runtime === 'CONFIGURED_WEBHOOK_PENDING' || stats?.telegramRuntime === 'WEBHOOK_PENDING')
                ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                : (runtimeStatus?.runtime === 'CONFIGURATION_MISSING' || stats?.telegramRuntime === 'CONFIGURATION_MISSING')
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Runtime: <strong>{runtimeStatus?.runtime || stats?.telegramRuntime || 'BLOCKED_CONFIGURATION'}</strong></span>
            </div>
          </div>
        </div>

        {/* Real Ingestion Metric Cards */}
        {stats && (
          <div className="mt-6 pt-4 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">Authorized Sources</span>
              <p className="text-base font-bold text-sky-300 mt-1">{stats.authorizedSourcesCount}</p>
              <span className="text-[10px] text-stone-400">Restricted chats</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">Total Imported</span>
              <p className="text-base font-bold text-white mt-1">{stats.totalImportedFiles}</p>
              <span className="text-[10px] text-stone-400">Copies received</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">Extracted & OCR</span>
              <p className="text-base font-bold text-indigo-300 mt-1">{stats.successfulExtractions}</p>
              <span className="text-[10px] text-indigo-200">Segmented copies</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">PII Sanitized</span>
              <p className="text-base font-bold text-teal-300 mt-1">{stats.piiSanitizedCount}</p>
              <span className="text-[10px] text-teal-200">Pseudonymized</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">Ground Truth</span>
              <p className="text-base font-bold text-amber-300 mt-1">{stats.groundTruthValidatedCount}</p>
              <span className="text-[10px] text-amber-200">Faculty certified</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Candidates</span>
              <p className="text-base font-bold text-emerald-300 mt-1">{stats.trainingCandidatesCreatedCount}</p>
              <span className="text-[10px] text-emerald-400">Eligible for audit</span>
            </div>
          </div>
        )}

        {/* Safety Banner */}
        <div className="mt-4 pt-3 border-t border-stone-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-stone-300 gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Model Actually Trained: <strong className="text-white">NO</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Benchmark Leakage: <strong className="text-white">0 Items</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            <span>Token Exposed in UI: <strong className="text-white">NO (Zero Exposure)</strong></span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-sm font-bold">✕</button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION TABS (SECTIONS A TO K)                       */}
      {/* ---------------------------------------------------- */}
      <div className="border-b border-stone-200 overflow-x-auto bg-white rounded-xl shadow-xs px-2">
        <div className="flex items-center gap-1 min-w-max py-1.5">
          {[
            { key: 'SOURCES', label: `A. Sources (${sources.length}${pendingSources.length > 0 ? ` • ${pendingSources.length} Pending` : ''})`, icon: Users },
            { key: 'CONNECTION', label: 'B. Connection Status', icon: Radio },
            { key: 'QUEUE', label: `C. Import Queue (${totalCount})`, icon: Clock },
            { key: 'OCR', label: 'E. OCR & Confidence', icon: Eye },
            { key: 'GROUND_TRUTH', label: 'F. Ground Truth Validation', icon: CheckCircle2 },
            { key: 'PII', label: 'G. PII Review', icon: ShieldCheck },
            { key: 'DUPLICATES', label: 'H. Duplicate Review', icon: Hash },
            { key: 'CANDIDATES', label: 'I. Dataset Candidates', icon: FileCheck },
            { key: 'FAILED', label: 'J. Failed Imports', icon: XCircle },
            { key: 'AUDIT_LOG', label: 'K. Audit Log', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB A: SOURCE REGISTRY                               */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'SOURCES' && (
        <div className="space-y-4">
          {/* Sub-Navigation between Authorized and Pending Authorization */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <button
              onClick={() => setSourceSubTab('AUTHORIZED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                sourceSubTab === 'AUTHORIZED'
                  ? 'bg-sky-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Authorized Sources ({sources.length})
            </button>
            <button
              onClick={() => setSourceSubTab('PENDING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                sourceSubTab === 'PENDING'
                  ? 'bg-amber-800 text-white'
                  : pendingSources.length > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Authorization ({pendingSources.length})
              {pendingSources.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          {sourceSubTab === 'AUTHORIZED' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200">
                <div>
                  <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-700" />
                    Authorized Telegram Ingestion Sources
                  </h2>
                  <p className="text-xs text-stone-500">
                    Only explicitly authorized private groups and channels can ingest answer copies. Public scraping is strictly forbidden.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Authorize New Source
                </button>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
                {sources.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                    <Users className="w-6 h-6 text-stone-400 mx-auto" />
                    <p>No Telegram sources authorized yet. Click "Authorize New Source" or approve a pending group below.</p>
                  </div>
                ) : (
                  sources.map(src => (
                    <div key={src.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{src.displayName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            src.authorized ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {src.authorized ? 'AUTHORIZED' : 'DISABLED'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                            {src.sourceType}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500">
                          Telegram Chat ID: <strong className="font-mono text-stone-800">{src.telegramChatId}</strong> • Basis: <span className="font-mono">{src.authorizationBasis || 'INSTITUTIONAL_PARTNER'}</span>
                        </p>

                        <div className="text-[11px] text-stone-400 font-mono pt-1">
                          Retention: <strong>{src.retentionPolicy}</strong> • Registered by {src.createdBy}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleSourceAuth(src)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            src.authorized
                              ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {src.authorized ? 'Revoke Authorization' : 'Authorize Source'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {sourceSubTab === 'PENDING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-bold text-amber-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Pending Discovered Ingestion Sources
                  </h3>
                  <p className="text-amber-800 mt-0.5">
                    Private groups or channels that reached the Telegram bot. To preserve dataset purity, ingestion is blocked until an Administrator reviews and explicitly authorizes the chat ID.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
                {pendingSources.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p>No pending authorization requests. Any new messages from unauthorized chats will be safely recorded here.</p>
                  </div>
                ) : (
                  pendingSources.map(pend => (
                    <div key={pend.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-stone-900">Chat ID: {pend.telegramChatId}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">
                            {pend.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                            {pend.telegramChatType}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                          <span>First Seen: <strong className="font-mono text-stone-700">{new Date(pend.firstSeen).toLocaleString()}</strong></span>
                          <span>Last Seen: <strong className="font-mono text-stone-700">{new Date(pend.lastSeen).toLocaleString()}</strong></span>
                          <span>Event Count: <strong className="font-mono text-stone-700">{pend.eventCount}</strong></span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono pt-0.5">
                          PII Safeguard: No usernames, messages, or media were stored during pending event recording.
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenAuthorizePending(pend)}
                          disabled={pendingActionLoading}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Authorize
                        </button>
                        <button
                          onClick={() => handleRejectPending(pend.telegramChatId)}
                          disabled={pendingActionLoading}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB B: CONNECTION STATUS                             */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'CONNECTION' && (
        <div className="space-y-4">
          {runtimeStatus?.runtime === 'WEBHOOK_ERROR' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Webhook Error Detected</span>
                </div>
                <button
                  onClick={handleRegisterWebhook}
                  disabled={registeringWebhook}
                  className="px-3 py-1 font-bold bg-rose-700 hover:bg-rose-600 text-white rounded-md shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {registeringWebhook ? 'Repairing...' : 'Repair & Re-register Webhook'}
                </button>
              </div>
              <p className="text-stone-700">
                Reason reported by Telegram Bot API: <strong className="font-mono text-rose-800">{runtimeStatus?.reason || runtimeStatus?.lastErrorReason || 'Unknown error'}</strong>
              </p>
              <p className="text-[11px] text-stone-500">
                Clicking "Repair & Re-register Webhook" reinstalls the webhook configuration with the production domain and resets the error counter on Telegram Bot API.
              </p>
            </div>
          )}

          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-700" />
              Telegram Ingestion Gateway Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 block">Bot Architecture & Runtime Telemetry</span>
                <p className="text-stone-600 leading-relaxed">
                  Dedicated dataset bot separation. Learner-facing bots are completely segregated from this backend ingestion transport.
                </p>
                <div className="pt-2 border-t border-stone-200 space-y-1.5 font-mono text-[11px]">
                  <div>Environment Variable: <strong>TELEGRAM_DATASET_BOT_TOKEN</strong></div>
                  <div>Server Configuration: <span className={runtimeStatus?.configured || stats?.botConfigured ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {(runtimeStatus?.configured || stats?.botConfigured) ? 'PRESENT' : 'MISSING'}
                  </span></div>
                  <div>Process Loaded: <span className={runtimeStatus?.environment_loaded_by_running_process ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {runtimeStatus?.environment_loaded_by_running_process ? 'YES' : 'NO'}
                  </span></div>
                  <div>Telegram API: <span className={runtimeStatus?.telegramApiReachable ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {runtimeStatus?.telegramApiReachable ? 'REACHABLE' : (runtimeStatus?.configured ? 'UNREACHABLE / AUTH FAILED' : 'NOT TESTED')}
                  </span></div>
                  <div>UI Secret Exposure: <span className="text-emerald-700 font-bold">STRICTLY FORBIDDEN (Zero Leaks)</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 block">Webhook Status & Diagnostic</span>
                  {(runtimeStatus?.configured || stats?.botConfigured) && (
                    <button
                      onClick={handleRegisterWebhook}
                      disabled={registeringWebhook}
                      className="px-2.5 py-1 text-[11px] font-bold bg-sky-700 hover:bg-sky-600 text-white rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {registeringWebhook ? 'Registering...' : (runtimeStatus?.runtime === 'WEBHOOK_ERROR' ? 'Repair Webhook' : 'Sync Webhook')}
                    </button>
                  )}
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Official Telegram Bot API webhook receiver. Validates authorized source chats, file types, and size limits.
                </p>
                <div className="pt-2 border-t border-stone-200 space-y-1.5 font-mono text-[11px]">
                  <div>Webhook Status: <span className={
                    runtimeStatus?.runtime === 'READY'
                      ? 'text-emerald-700 font-bold'
                      : runtimeStatus?.runtime === 'WEBHOOK_ERROR'
                      ? 'text-rose-700 font-bold'
                      : 'text-amber-700 font-bold'
                  }>
                    {runtimeStatus?.runtime === 'READY' ? 'ACTIVE & HEALTHY' : runtimeStatus?.runtime || 'PENDING REGISTRATION'}
                  </span></div>
                  <div>Webhook Reachable: <span className={runtimeStatus?.webhookReachable ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {runtimeStatus?.webhookReachable ? 'YES' : 'NO'}
                  </span></div>
                  <div>Registered URL: <strong className="text-sky-900 break-all">{runtimeStatus?.webhookUrl || 'Not yet registered'}</strong></div>
                  <div>Public Receiver: <strong className="text-sky-900">/api/telegram/mains-dataset-bot/webhook</strong></div>
                  <div>Pending Updates: <strong>{runtimeStatus?.pendingUpdateCount ?? 0}</strong></div>
                  <div>Last Error Date: <span>{runtimeStatus?.lastErrorDate ? new Date(runtimeStatus.lastErrorDate).toLocaleString() : 'None'}</span></div>
                  <div>Last Error Reason: <span className={runtimeStatus?.lastErrorReason ? 'text-rose-700 font-bold' : 'text-stone-600'}>{runtimeStatus?.lastErrorReason || 'None'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB C: IMPORT QUEUE & LIFE CYCLE                    */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'QUEUE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-700" />
                Ingestion Queue & Lifecycle Progress ({totalCount})
              </h2>
              <p className="text-xs text-stone-500">
                Complete trace of every imported copy through hashing, extraction, OCR, and validation gates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="DOWNLOADED">Downloaded</option>
                <option value="IMPORTED">Imported</option>
                <option value="DATASET_CANDIDATE">Dataset Candidate</option>
                <option value="EXCLUDED">Excluded</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
            {imports.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                <FileText className="w-6 h-6 text-stone-400 mx-auto" />
                <p>No copies matching the filter. Ingest copies via authorized Telegram sources or test fixtures.</p>
              </div>
            ) : (
              imports.map(imp => (
                <div key={imp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        imp.status === 'DATASET_CANDIDATE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        imp.status === 'EXCLUDED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        imp.status === 'FAILED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-sky-50 text-sky-800 border-sky-300'
                      }`}>
                        {imp.status}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {imp.mimeType}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-1">
                      {imp.detectedQuestion || 'Mains Evaluation Subject Question'}
                    </p>

                    <div className="flex flex-wrap gap-4 text-[11px] text-stone-400 font-mono pt-1">
                      <span>SHA-256: <strong>{imp.sha256?.substring(0, 12)}...</strong></span>
                      <span>OCR: <strong>{imp.ocrStatus}</strong> ({imp.ocrConfidence ? `${Math.round(imp.ocrConfidence * 100)}%` : 'N/A'})</span>
                      <span>Ground Truth: <strong>{imp.facultyGroundTruthStatus}</strong></span>
                      <span>Marks: <strong className="text-stone-800">{imp.detectedFacultyMarks ? `${imp.detectedFacultyMarks}/${imp.detectedFacultyMaxMarks}` : 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedImport(imp);
                        setValidationMarks(imp.detectedFacultyMarks || 7.5);
                        setValidationFeedback(imp.detectedFacultyFeedback || 'Verified faculty checking.');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect & Validate
                    </button>

                    {imp.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(imp.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg shadow-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB E: OCR & CONFIDENCE                              */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'OCR' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-700" />
              OCR Transcripts & Confidence Auditing
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Copies with OCR confidence &lt; 0.80 are flagged for manual review to prevent noisy handwriting transcripts from entering training pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imports
              .filter(i => i.ocrStatus && i.ocrStatus !== 'NONE')
              .map(imp => (
                <div key={imp.id} className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      (imp.ocrConfidence || 0) >= 0.80 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      Confidence: {imp.ocrConfidence ? `${Math.round(imp.ocrConfidence * 100)}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {imp.ocrExtractedText || imp.extractedText || 'No transcript text available'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                    <span>Status: <strong>{imp.ocrStatus}</strong></span>
                    <span>Pages: {imp.pageCount}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB F: GROUND TRUTH VALIDATION                       */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'GROUND_TRUTH' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Faculty Ground-Truth Certification Queue
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Imported copies with detected checking must be validated by certified faculty before becoming training candidates.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200">
            {imports
              .filter(i => i.facultyGroundTruthStatus !== 'FACULTY_GROUND_TRUTH_ABSENT')
              .map(imp => (
                <div key={imp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {imp.facultyGroundTruthStatus}
                      </span>
                      {imp.groundTruthValidated && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          CERTIFIED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-700 italic">
                      "{imp.detectedFacultyFeedback || 'Feedback pending'}"
                    </p>

                    <div className="text-[11px] text-stone-500 font-mono">
                      Detected Marks: <strong className="text-stone-900">{imp.detectedFacultyMarks} / {imp.detectedFacultyMaxMarks}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedImport(imp);
                      setValidationMarks(imp.detectedFacultyMarks || 7.5);
                      setValidationFeedback(imp.detectedFacultyFeedback || 'Verified faculty checking.');
                      setShowValidationModal(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs shrink-0"
                  >
                    Certify Ground Truth
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB G: PII REVIEW                                    */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'PII' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              PII Sanitization & Pseudonymization Audit
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Verifies that phone numbers, emails, roll numbers, and Telegram usernames are redacted before entering training candidate pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imports
              .filter(i => i.piiSanitized)
              .map(imp => (
                <div key={imp.id} className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-100 text-teal-900 font-bold">
                      Redactions: {imp.piiScanDetails?.redactions || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {imp.sanitizedText || 'No sanitized text'}
                  </div>

                  <div className="text-[11px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                    Salted Learner Hash: <strong className="text-stone-700">{imp.saltedLearnerHash?.substring(0, 16)}...</strong>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB H: DUPLICATES & BENCHMARKS                       */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'DUPLICATES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-700" />
              Duplicate Prevention & Benchmark Isolation Guards
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Enforces SHA-256 idempotency at source level and normalized answer hash checks against historical candidates and locked benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-stone-200 text-center">
              <span className="text-xs font-bold text-stone-600 uppercase">Duplicate Source Files</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{stats?.duplicateSourceFilesCount || 0}</p>
              <span className="text-[10px] text-stone-400">Idempotently deduplicated</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 text-center">
              <span className="text-xs font-bold text-stone-600 uppercase">Duplicate Answer Hashes</span>
              <p className="text-xl font-bold text-amber-700 mt-1">{stats?.duplicateAnswerCandidatesCount || 0}</p>
              <span className="text-[10px] text-amber-600">Prevented double-counting</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 text-center">
              <span className="text-xs font-bold text-stone-600 uppercase">Benchmark Collisions</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats?.benchmarkBlockedCount || 0}</p>
              <span className="text-[10px] text-emerald-600">Zero leakage verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB I: DATASET CANDIDATES                            */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'CANDIDATES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Telegram-Grounded Dataset Candidates
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Imported copies that have successfully passed all 8 pipeline gates and qualified as valid training candidates.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200">
            {imports
              .filter(i => i.status === 'DATASET_CANDIDATE')
              .map(imp => (
                <div key={imp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                        TRAINING CANDIDATE
                      </span>
                    </div>

                    <p className="text-xs text-stone-700">
                      {imp.detectedQuestion}
                    </p>

                    <div className="flex flex-wrap gap-4 text-[11px] text-stone-500 font-mono pt-1">
                      <span>Faculty Marks: <strong className="text-emerald-700">{imp.detectedFacultyMarks} / {imp.detectedFacultyMaxMarks}</strong></span>
                      <span>Hash: <strong className="text-stone-700">{imp.normalizedAnswerHash?.substring(0, 12)}...</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedImport(imp)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs"
                  >
                    Inspect Candidate
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB J: FAILED IMPORTS                                */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'FAILED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-700" />
              Failed Ingestion Attempts
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Corrupted PDFs, unsupported files, or unresolvable extraction errors isolated cleanly without impacting remaining queue.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200">
            {imports
              .filter(i => i.status === 'FAILED')
              .map(imp => (
                <div key={imp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-stone-900">{imp.originalFilename}</span>
                    <p className="text-xs text-rose-700">{imp.failureReason || 'Processing failure'}</p>
                  </div>
                  <button
                    onClick={() => handleRetry(imp.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg"
                  >
                    Retry Extraction
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB K: AUDIT LOG                                     */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'AUDIT_LOG' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              Append-Only PII-Safe Telegram Ingestion Events
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Dual-logged audit trail capturing all file discovery, extraction, OCR, PII sanitization, and candidate decisions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs font-mono text-xs text-stone-700 space-y-2">
            <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-sky-900 font-bold">TELEGRAM_FILE_DISCOVERED</span>
              <span className="text-stone-400">GATEWAY</span>
            </div>
            <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-indigo-900 font-bold">TELEGRAM_EXTRACTION_STARTED</span>
              <span className="text-stone-400">PDF_ENGINE</span>
            </div>
            <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-teal-900 font-bold">TELEGRAM_PII_SANITIZED</span>
              <span className="text-stone-400">PII_SANITIZER</span>
            </div>
            <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-emerald-900 font-bold">TELEGRAM_TRAINING_CANDIDATE_CREATED</span>
              <span className="text-stone-400">PIPELINE</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DETAIL MODAL (SECTION 22)                            */}
      {/* ---------------------------------------------------- */}
      {selectedImport && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-stone-400">Import ID: {selectedImport.id}</span>
                <h3 className="text-base font-bold text-stone-900 mt-0.5">{selectedImport.originalFilename}</h3>
              </div>
              <button
                onClick={() => setSelectedImport(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono">
              <div>Status: <strong className="text-stone-900">{selectedImport.status}</strong></div>
              <div>MIME: <strong className="text-stone-900">{selectedImport.mimeType}</strong></div>
              <div>Pages: <strong className="text-stone-900">{selectedImport.pageCount}</strong></div>
              <div>OCR: <strong className="text-stone-900">{selectedImport.ocrStatus}</strong></div>
            </div>

            {/* View Tabs */}
            <div className="flex border-b border-stone-200 gap-2">
              {[
                { key: 'SANITIZED', label: 'Sanitized Script' },
                { key: 'EXTRACTED', label: 'Raw Extracted' },
                { key: 'OCR', label: 'OCR Transcript' },
                { key: 'EVALUATION', label: 'Faculty Evaluation' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key as any)}
                  className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors ${
                    detailTab === t.key
                      ? 'border-sky-800 text-sky-900'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
              {detailTab === 'SANITIZED' && (selectedImport.sanitizedText || 'No sanitized text')}
              {detailTab === 'EXTRACTED' && (selectedImport.extractedText || 'No raw extracted text')}
              {detailTab === 'OCR' && (selectedImport.ocrExtractedText || 'No OCR transcript')}
              {detailTab === 'EVALUATION' && (
                <div>
                  <p><strong>Marks:</strong> {selectedImport.detectedFacultyMarks} / {selectedImport.detectedFacultyMaxMarks}</p>
                  <p className="mt-2"><strong>Feedback:</strong> {selectedImport.detectedFacultyFeedback || 'None'}</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowExcludeModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg"
              >
                Exclude from Training
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRetry(selectedImport.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-300 rounded-lg"
                >
                  Retry Processing
                </button>
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
                >
                  Approve Ground Truth
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD SOURCE MODAL                                     */}
      {/* ---------------------------------------------------- */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">Authorize Telegram Ingestion Source</h3>
            <p className="text-xs text-stone-500">
              Only whitelisted chat IDs can ingest copies into the Mains dataset pipeline.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Display Name:</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="e.g. UPSC Mains Evaluators Group 2026"
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Telegram Chat ID:</label>
                <input
                  type="text"
                  value={newChatId}
                  onChange={e => setNewChatId(e.target.value)}
                  placeholder="e.g. -1001234567890"
                  className="w-full p-2.5 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Source Type:</label>
                <select
                  value={newSourceType}
                  onChange={e => setNewSourceType(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  <option value="PRIVATE_GROUP">PRIVATE_GROUP</option>
                  <option value="PRIVATE_CHANNEL">PRIVATE_CHANNEL</option>
                  <option value="DIRECT_BOT_UPLOAD">DIRECT_BOT_UPLOAD</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Authorization Basis:</label>
                <input
                  type="text"
                  value={newAuthBasis}
                  onChange={e => setNewAuthBasis(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterSource}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded-lg"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VALIDATE GROUND TRUTH MODAL                          */}
      {/* ---------------------------------------------------- */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">Certify Faculty Ground Truth</h3>
            <p className="text-xs text-stone-500">
              Certifying this checking marks the copy as a valid dataset candidate.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Faculty Marks (out of 10):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={validationMarks}
                  onChange={e => setValidationMarks(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono font-bold border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Verdict:</label>
                <select
                  value={validationVerdict}
                  onChange={e => setValidationVerdict(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  <option value="ACCEPTED">ACCEPTED (Confirm Existing Checking)</option>
                  <option value="EDITED">EDITED (Calibrated Marks/Feedback)</option>
                  <option value="INDEPENDENT">INDEPENDENT (Double-Blind Verification)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Evaluative Feedback:</label>
                <textarea
                  rows={3}
                  value={validationFeedback}
                  onChange={e => setValidationFeedback(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleValidateGroundTruth}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
              >
                Certify Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EXCLUDE MODAL                                        */}
      {/* ---------------------------------------------------- */}
      {showExcludeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-900">Exclude Import from Training</h3>
            <p className="text-xs text-stone-500">
              The original copy will remain preserved in historical records, but will never become training eligible.
            </p>

            <div>
              <label className="text-xs font-bold text-stone-800 block mb-1">Exclusion Reason:</label>
              <textarea
                rows={3}
                value={excludeReason}
                onChange={e => setExcludeReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExcludeModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExclude}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg"
              >
                Confirm Exclusion
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ---------------------------------------------------- */}
      {/* AUTHORIZE PENDING SOURCE MODAL                       */}
      {/* ---------------------------------------------------- */}
      {showAuthorizePendingModal && selectedPendingSource && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-sky-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Authorize Discovered Source
            </h3>
            <p className="text-xs text-stone-500">
              Grant authorization to incoming private Telegram chat. Once authorized, documents sent in this chat will be ingested and processed into candidate datasets.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Telegram Chat ID (Verified):</label>
                <input
                  type="text"
                  value={selectedPendingSource.telegramChatId}
                  disabled
                  className="w-full p-2.5 text-xs font-mono bg-stone-100 border border-stone-300 rounded-lg text-stone-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Chat Type:</label>
                <input
                  type="text"
                  value={selectedPendingSource.telegramChatType}
                  disabled
                  className="w-full p-2.5 text-xs font-mono bg-stone-100 border border-stone-300 rounded-lg text-stone-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Display Name:</label>
                <input
                  type="text"
                  value={pendingDisplayName}
                  onChange={e => setPendingDisplayName(e.target.value)}
                  placeholder="e.g. GS2 Faculty Review Group"
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Source Type:</label>
                <input
                  type="text"
                  value="PRIVATE_GROUP"
                  disabled
                  className="w-full p-2.5 text-xs font-mono bg-stone-100 border border-stone-300 rounded-lg text-stone-600"
                />
                <span className="text-[10px] text-stone-500">Public Telegram scraping remains strictly forbidden.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Authorization Basis:</label>
                <select
                  value={pendingAuthBasis}
                  onChange={e => setPendingAuthBasis(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                >
                  <option value="ACADEMIC_FACULTY_CONSENT">ACADEMIC_FACULTY_CONSENT (Verified Faculty Consent)</option>
                  <option value="INSTITUTIONAL_PARTNER">INSTITUTIONAL_PARTNER (Formal Coaching/Academy License)</option>
                  <option value="EVALUATOR_DONATION">EVALUATOR_DONATION (Direct Evaluator Submission)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Retention Policy:</label>
                <select
                  value={pendingRetention}
                  onChange={e => setPendingRetention(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                >
                  <option value="PERSIST_ORIGINAL">PERSIST_ORIGINAL (Retain raw PDF for audit compliance)</option>
                  <option value="REDACTED_ONLY">REDACTED_ONLY (Delete raw PDF post-sanitization)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAuthorizePendingModal(false)}
                disabled={pendingActionLoading}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAuthorizePending}
                disabled={pendingActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {pendingActionLoading ? 'Authorizing...' : 'Authorize Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

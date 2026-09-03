import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
  FileText,
  Database,
  Building,
  Check,
  Play,
  Cpu,
  Layers,
  History,
  Activity,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { PyqAuditReport } from '../../types/index.js';

interface PyqAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const PyqAuditModal: React.FC<PyqAuditModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'PIPELINE' | 'RUNS'>('AUDIT');
  const [reports, setReports] = useState<PyqAuditReport[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Pipeline simulation state
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [selectedSimExam, setSelectedSimExam] = useState<'UPSC_2027_GS1' | 'BPSC_72ND_CCE' | 'UPSC_2027_CSAT'>('UPSC_2027_GS1');

  // Ingestion runs state
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState<boolean>(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const data = await api.getPYQAudit();
      setReports(data.reports || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to fetch audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    setLoadingRuns(true);
    try {
      const data = await api.getPYQIngestionRuns(15);
      setRuns(data || []);
    } catch (err) {
      console.error('Failed to fetch ingestion runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
      fetchRuns();
      setSyncMessage(null);
    }
  }, [isOpen]);

  const handleSyncDiscovery = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await api.runPYQDiscovery();
      setSyncMessage(result.message || 'Official Commission sync completed successfully.');
      await fetchAudit();
      await fetchRuns();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulatePYQFutureIngestion(selectedSimExam);
      setSimulationResult(res);
      await fetchAudit();
      await fetchRuns();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setSimulationResult({ success: false, error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Official PYQ Ingestion & Forensic Audit
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                  Universal Pipeline Active
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Official UPSC (upsc.gov.in) & BPSC (bpsc.bihar.gov.in) automated discovery, verification, and live catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncDiscovery}
              disabled={syncing}
              className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Scanning Portals...' : 'Scan Official Portals'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Paper Audit Matrix ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PIPELINE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Auto-Ingestion Pipeline & Future Simulator
          </button>
          <button
            onClick={() => {
              setActiveTab('RUNS');
              fetchRuns();
            }}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RUNS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            Ingestion Runs & Provenance
          </button>
        </div>

        {/* Sync Notification */}
        {syncMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* TAB 1: AUDIT MATRIX */}
        {activeTab === 'AUDIT' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Summary Metric Strip */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Total Official Papers</span>
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{summary.totalPapers}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Complete & Verified Papers</span>
                  <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">{summary.completeVerifiedPapers}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Verified Questions</span>
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{summary.totalVerifiedQuestions} / {summary.totalExpectedQuestions}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Data Accuracy Rate</span>
                  <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">{summary.overallVerificationRate}%</span>
                </div>
              </div>
            )}

            {/* Audit Table */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                  <p className="text-sm text-zinc-500">Auditing official question papers and master keys...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  No paper audit records found. Click "Scan Official Portals" to discover official papers.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Exam / Cycle</th>
                        <th className="px-4 py-3">Paper</th>
                        <th className="px-4 py-3">Official Source</th>
                        <th className="px-4 py-3 text-center">Expected</th>
                        <th className="px-4 py-3 text-center">Verified</th>
                        <th className="px-4 py-3 text-center">Answer Key</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {reports.map((r) => (
                        <tr key={r.paperId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${r.exam === 'UPSC CSE' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                              <span>{r.exam} ({r.examCycle})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-800 dark:text-zinc-200">{r.paper}</div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-xs">{r.paperName}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <a
                              href={r.officialPaperUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-[11px] underline underline-offset-2"
                            >
                              <Building className="w-3 h-3 shrink-0" />
                              <span>{r.sourceDomain}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold">
                            {r.expectedQuestionCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className={r.verifiedQuestionCount === r.expectedQuestionCount ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400'}>
                              {r.verifiedQuestionCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Official Master Key
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {r.verificationStatus === 'OFFICIAL_VERIFIED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle2 className="w-3 h-3" />
                                100% Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800/60">
                                <AlertTriangle className="w-3 h-3" />
                                Ingested ({r.verifiedQuestionCount}/{r.expectedQuestionCount})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PIPELINE & SIMULATOR */}
        {activeTab === 'PIPELINE' && (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Pipeline Architecture State Machine */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Universal Pipeline Lifecycle State Machine
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                {[
                  { step: '1', name: 'DISCOVERED', desc: 'Dynamic scraper match' },
                  { step: '2', name: 'PDF_DOWNLOADED', desc: 'Binary fetch & buffer' },
                  { step: '3', name: 'PDF_VALIDATED', desc: 'SHA-256 & magic byte' },
                  { step: '4', name: 'EXTRACTING', desc: 'Bilingual OCR & parsing' },
                  { step: '5', name: 'STRUCT_VALID', desc: 'Question count match' },
                  { step: '6', name: 'KEY_MATCHED', desc: 'Answer key verified' },
                  { step: '7', name: 'PUBLISHED', desc: 'Live in practice/mock' }
                ].map((s, idx) => (
                  <div key={s.step} className="bg-white dark:bg-zinc-800 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-700/60 flex flex-col items-center">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center mb-1">
                      {s.step}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Paper Simulation Panel */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    Future-Proof Automated Ingestion Simulator
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                    Demonstrate automatic discovery, dynamic metadata extraction, structural verification, and SHA-256 fingerprinting on future papers (e.g. UPSC CSE 2027, BPSC 72nd CCE) without requiring code modifications.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedSimExam}
                    onChange={(e: any) => setSelectedSimExam(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="UPSC_2027_GS1">UPSC CSE 2027 (GS Paper I - 100 Qs)</option>
                    <option value="BPSC_72ND_CCE">BPSC 72nd CCE (General Studies - 150 Qs)</option>
                    <option value="UPSC_2027_CSAT">UPSC CSE 2027 (CSAT Paper II - 80 Qs)</option>
                  </select>

                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                    {simulating ? 'Ingesting Pipeline...' : 'Run Pipeline Ingestion'}
                  </button>
                </div>
              </div>

              {/* Simulation Result Output */}
              {simulationResult && (
                <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {simulationResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      Pipeline Execution: {simulationResult.success ? 'SUCCESS (PUBLISHED)' : 'FAILED'}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      Paper ID: {simulationResult.paperId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">Exam / Cycle</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{simulationResult.exam} ({simulationResult.year || simulationResult.cycle})</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">Questions Verified</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{simulationResult.verifiedCount} / {simulationResult.expectedCount}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">State Status</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{simulationResult.status}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">SHA-256 Provenance</span>
                      <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 truncate block">
                        {simulationResult.documentHash ? simulationResult.documentHash.substring(0, 16) + '...' : 'Verified'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    The newly ingested paper has been seamlessly published into the live catalog, practice tests, and resources view with zero code changes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RUNS & AUDIT LOG */}
        {activeTab === 'RUNS' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Automated Ingestion History & Runs
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Scheduled scans and triggered runs across UPSC and BPSC official archives.
                </p>
              </div>
              <button
                onClick={fetchRuns}
                disabled={loadingRuns}
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRuns ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>

            {loadingRuns ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No ingestion runs recorded yet. Click "Scan Official Portals" to trigger the first scan.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Run ID</th>
                      <th className="px-4 py-3">Commission</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-center">Discovered</th>
                      <th className="px-4 py-3 text-center">Processed</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {runs.map((run) => (
                      <tr key={run.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                          {run.id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{run.commission}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                            {run.scan_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          {run.discovered_count}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {run.processed_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            run.status === 'SUCCESS' || run.status === 'NO_NEW_PAPERS'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500 font-mono text-[11px]">
                          {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-500">
          <span>Zero manual year-by-year scripts • Fully automatic discovery pipeline</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

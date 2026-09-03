import React, { useState, useEffect } from 'react';
import {
  History,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Database,
  FileText,
  Activity,
  UserCheck
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';

export const ImportPublishLogsView: React.FC = () => {
  const { setActiveSection } = useLearner();

  const [ocrJobs, setOcrJobs] = useState<any[]>([]);
  const [ingestionRuns, setIngestionRuns] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OCR_IMPORTS' | 'DISCOVERY_RUNS' | 'AUDIT_LOGS'>('OCR_IMPORTS');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadLogsData();
  }, []);

  const loadLogsData = async () => {
    setLoading(true);
    try {
      const [jobsData, runsData, auditData] = await Promise.all([
        api.getOcrJobs().catch(() => []),
        api.getPYQIngestionRuns(20).catch(() => []),
        api.getSuperAdminAuditLogs().catch(() => []),
      ]);
      setOcrJobs(jobsData || []);
      setIngestionRuns(runsData || []);
      setAuditLogs(auditData || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDiscoveryScan = async (commission: 'ALL' | 'UPSC' | 'BPSC' = 'ALL') => {
    setIsScanning(true);
    try {
      const res = await api.triggerPYQIngestionScan(commission);
      showToast(`Scan initiated for ${commission}!`);
      await loadLogsData();
    } catch (err) {
      console.error('Failed to trigger scan:', err);
      showToast('Scan failed to trigger');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold border border-amber-500/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Observability & Audit Pipeline
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {ocrJobs.length} Jobs • {ingestionRuns.length} Discovery Runs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <History className="w-7 h-7 text-amber-700" />
            <span>Content Ingestion & Publish Logs</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Real-time telemetry, paper extraction logs, answer-key binding verification, and publishing audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleTriggerDiscoveryScan('ALL')}
            disabled={isScanning}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>Run Commission Scan</span>
          </button>

          <button
            onClick={loadLogsData}
            className="px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-[#EAE6DF] text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#EAE6DF] gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('OCR_IMPORTS')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'OCR_IMPORTS'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Content Import Jobs ({ocrJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISCOVERY_RUNS')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DISCOVERY_RUNS'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Universal Ingestion Runs ({ingestionRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Publish & System Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
          Loading audit telemetry...
        </div>
      )}

      {/* TAB 1: OCR Import Jobs */}
      {!loading && activeTab === 'OCR_IMPORTS' && (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF9] border-b border-[#EAE6DF] text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Job ID & Target</th>
                  <th className="py-3 px-4">Mode & Language</th>
                  <th className="py-3 px-4">Questions Detected</th>
                  <th className="py-3 px-4">Key Status</th>
                  <th className="py-3 px-4">Publish Destination</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ocrJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      No Content Import jobs recorded yet.
                    </td>
                  </tr>
                ) : (
                  ocrJobs.map((job: any) => {
                    const statusColor =
                      job.status === 'PUBLISHED' || job.status === 'SUCCESS'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : job.status === 'FAILED'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200';

                    return (
                      <tr key={job.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900 font-serif-editorial">
                            {job.targetExam || job.examTag || 'UPSC CSE'} ({job.pyqYear || 2025})
                          </div>
                          <div className="text-[10px] font-mono text-stone-400">{job.id}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600">
                          <div>{job.mode || 'SEPARATE_PDFS'}</div>
                          <span className="text-[10px] text-stone-400">{job.documentLanguage || 'AUTO'}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold font-mono text-stone-800">
                            <span>{job.extractedCount || job.totalQuestions || 0}</span>
                            <span className="text-stone-400 font-normal">/ {job.expectedCount || 100} Qs</span>
                          </div>
                          <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.2 rounded border mt-0.5 ${statusColor}`}>
                            {job.status || 'READY_FOR_REVIEW'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {job.answerKeyBound ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Bound ({job.answerKeyCount || 0})
                            </span>
                          ) : (
                            <span className="text-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Key Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                          {job.destination || 'PRACTICE_BANK'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                          {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Recent'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setActiveSection('admin-ocr')}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Open Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Ingestion Runs */}
      {!loading && activeTab === 'DISCOVERY_RUNS' && (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF9] border-b border-[#EAE6DF] text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Run ID & Commission</th>
                  <th className="py-3 px-4">Trigger Mode</th>
                  <th className="py-3 px-4">Discovered Papers</th>
                  <th className="py-3 px-4">Verified Questions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ingestionRuns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      No automated discovery runs logged.
                    </td>
                  </tr>
                ) : (
                  ingestionRuns.map((run: any) => (
                    <tr key={run.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 font-serif-editorial">{run.commission || 'ALL'}</div>
                        <div className="text-[10px] font-mono text-stone-400">{run.id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {run.triggerMode || 'SCHEDULED'}
                      </td>

                      <td className="py-3.5 px-4 font-bold font-mono text-stone-800">
                        {run.papersDiscovered || run.discoveredPapersCount || 0}
                      </td>

                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-700">
                        {run.verifiedQuestionsCount || run.questionsIngested || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {run.status || 'COMPLETED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-500">
                        {run.timestamp ? new Date(run.timestamp).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {!loading && activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF9] border-b border-[#EAE6DF] text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Payload Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      No system audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any, idx: number) => (
                    <tr key={log.id || idx} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-stone-500 text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{log.actorId || 'admin_user'}</div>
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {log.actorRole || 'ADMIN'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                        {log.action}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {log.targetType}: {log.targetId}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 max-w-xs truncate">
                        {log.payload ? JSON.stringify(log.payload) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

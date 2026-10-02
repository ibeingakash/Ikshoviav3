import React, { useEffect, useState } from 'react';
import {
  Brain,
  Database,
  Layers,
  Award,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Play,
  Lock,
  ArrowRight,
  TrendingDown,
  BarChart3,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Tag,
  Target,
  Scale,
  FileSpreadsheet,
  Activity,
  Send
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { MainsDatasetOperationsView } from './MainsDatasetOperationsView.js';
import { MainsTrainingReadinessAuditView } from './MainsTrainingReadinessAuditView.js';
import { MainsDatasetRemediationView } from './MainsDatasetRemediationView.js';
import { MainsDatasetAcquisitionHubView } from './MainsDatasetAcquisitionHubView.js';
import { MainsTelegramIngestionDashboardView } from './MainsTelegramIngestionDashboardView.js';

export type MainsIntelligenceTab =
  | 'OVERVIEW'
  | 'COVERAGE'
  | 'ACQUISITION'
  | 'QUALITY'
  | 'OPERATIONS'
  | 'READINESS'
  | 'REMEDIATION'
  | 'GROWTH_HUB'
  | 'TELEGRAM_IMPORT'
  | 'DATASETS'
  | 'BENCHMARKS'
  | 'MODELS'
  | 'JOBS';

export interface MainsEvaluationIntelligenceDashboardProps {
  initialTab?: MainsIntelligenceTab;
  onTabChange?: (tab: MainsIntelligenceTab) => void;
}

export const MainsEvaluationIntelligenceDashboard: React.FC<MainsEvaluationIntelligenceDashboardProps> = ({
  initialTab = 'OVERVIEW',
  onTabChange,
}) => {
  const [activeTab, setActiveTabState] = useState<MainsIntelligenceTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab]);

  const setActiveTab = (tab: MainsIntelligenceTab) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
  };
  const [metrics, setMetrics] = useState<any>(null);
  const [disagreementData, setDisagreementData] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 4.1C states
  const [coverageData, setCoverageData] = useState<any>(null);
  const [coverageMatrix, setCoverageMatrix] = useState<any>(null);
  const [datasetGrowth, setDatasetGrowth] = useState<any>(null);
  const [trainingGate, setTrainingGate] = useState<any>(null);
  const [readinessAudit, setReadinessAudit] = useState<any>(null);
  const [auditRunning, setAuditRunning] = useState<boolean>(false);

  // Phase 4.1D Acquisition states
  const [acquisitionPriorities, setAcquisitionPriorities] = useState<any[]>([]);
  const [acquisitionFunnel, setAcquisitionFunnel] = useState<any>(null);
  const [learnerDiversity, setLearnerDiversity] = useState<any>(null);
  const [datasetSnapshots, setDatasetSnapshots] = useState<any[]>([]);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);
  const [snapshotVersionInput, setSnapshotVersionInput] = useState<string>('IKSHOVIA-MAINS-SNAPSHOT-v0.2');
  const [snapshotDescInput, setSnapshotDescInput] = useState<string>('Curated Phase 4.1D training snapshot');

  // Phase 4.1E Quality & Release Candidate states
  const [qualitySubTab, setQualitySubTab] = useState<'SCORECARD' | 'CALIBRATION' | 'RELEASE_CANDIDATES' | 'LEAKAGE_GUARD' | 'CANDIDATE_INSPECTOR'>('SCORECARD');
  const [qualityScorecard, setQualityScorecard] = useState<any>(null);
  const [calibrationSummary, setCalibrationSummary] = useState<any>(null);
  const [facultyConsistency, setFacultyConsistency] = useState<any[]>([]);
  const [quarantineRecords, setQuarantineRecords] = useState<any[]>([]);
  const [quarantineMetrics, setQuarantineMetrics] = useState<any>(null);
  const [releaseCandidates, setReleaseCandidates] = useState<any[]>([]);
  const [showRcModal, setShowRcModal] = useState<boolean>(false);
  const [rcVersionInput, setRcVersionInput] = useState<string>(`IKSHOVIA-RC-v0.${Date.now().toString().slice(-4)}`);
  const [selectedRcReport, setSelectedRcReport] = useState<string | null>(null);
  const [autoScanningQuarantine, setAutoScanningQuarantine] = useState<boolean>(false);
  const [candidateEvals, setCandidateEvals] = useState<any[]>([]);
  const [candidateInspectorPaper, setCandidateInspectorPaper] = useState<string>('ALL');
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  const [selectedManifest, setSelectedManifest] = useState<any | null>(null);
  const [qualityAuditRunning, setQualityAuditRunning] = useState<boolean>(false);
  const [qualityRunsHistory, setQualityRunsHistory] = useState<any[]>([]);

  // Modal states
  const [showBuildDatasetModal, setShowBuildDatasetModal] = useState<boolean>(false);
  const [datasetVersionInput, setDatasetVersionInput] = useState<string>('IKSHOVIA-MAINS-v0.1');
  const [datasetDescInput, setDatasetDescInput] = useState<string>('Initial curated faculty ground truth dataset');

  const [showBuildBenchmarkModal, setShowBuildBenchmarkModal] = useState<boolean>(false);
  const [benchNameInput, setBenchNameInput] = useState<string>('UPSC Mains Gold Standard 2026');
  const [benchVersionInput, setBenchVersionInput] = useState<string>('v1.0-gold');

  const [showRegisterModelModal, setShowRegisterModelModal] = useState<boolean>(false);
  const [modelIdInput, setModelIdInput] = useState<string>('ikshovia-mains-eval-v0.1');
  const [modelNameInput, setModelNameInput] = useState<string>('IKSHOVIA Mains Evaluator Fine-Tuned v0.1');
  const [modelVersionInput, setModelVersionInput] = useState<string>('v0.1');
  const [modelBaseInput, setModelBaseInput] = useState<string>('gemini-3.8-flash');

  const [showTrainingJobModal, setShowTrainingJobModal] = useState<boolean>(false);
  const [selectedDsVersion, setSelectedDsVersion] = useState<string>('');
  const [jobModelVersion, setJobModelVersion] = useState<string>('v0.1');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        m, dis, ds, bm, md, tr, cov, mat, grw, gt, prio, fnl, div, snaps,
        sc, cal, consist, quar, rcs
      ] = await Promise.all([
        api.getAdminMainsMetrics().catch(() => null),
        api.getAdminMainsDisagreementAnalysis().catch(() => null),
        api.getAdminMainsDatasets().catch(() => []),
        api.getAdminMainsBenchmarks().catch(() => []),
        api.getAdminMainsModels().catch(() => []),
        api.getAdminMainsTrainingJobs().catch(() => []),
        api.getMainsCoverageAnalysis().catch(() => null),
        api.getAdminMainsCoverageMatrix().catch(() => null),
        api.getAdminMainsDatasetGrowth().catch(() => null),
        api.getAdminMainsTrainingGate().catch(() => null),
        api.getAdminMainsAcquisitionPriorities().catch(() => []),
        api.getAdminMainsAcquisitionFunnel().catch(() => null),
        api.getAdminMainsLearnerDiversity().catch(() => null),
        api.getAdminMainsDatasetSnapshots().catch(() => []),
        api.getAdminMainsQualityScorecard().catch(() => null),
        api.getTeacherMainsCalibrationSummary().catch(() => null),
        api.getTeacherMainsCalibrationConsistency().catch(() => []),
        api.getAdminMainsQuarantine().catch(() => ({ records: [], metrics: null })),
        api.getAdminMainsReleaseCandidates().catch(() => [])
      ]);

      setMetrics(m);
      setDisagreementData(dis);
      setDatasets(ds || []);
      setBenchmarks(bm || []);
      setModels(md || []);
      setTrainingJobs(tr || []);
      setCoverageData(cov);
      setCoverageMatrix(mat);
      setDatasetGrowth(grw);
      setTrainingGate(gt);
      setAcquisitionPriorities(prio || []);
      setAcquisitionFunnel(fnl);
      setLearnerDiversity(div);
      setDatasetSnapshots(snaps || []);
      setQualityScorecard(sc);
      setCalibrationSummary(cal);
      setFacultyConsistency(consist || []);
      setQuarantineRecords(quar?.records || []);
      setQuarantineMetrics(quar?.metrics || null);
      setReleaseCandidates(rcs || []);

      if (ds && ds.length > 0) {
        setSelectedDsVersion(ds[0].version_name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminMainsDatasetSnapshot({
        versionName: snapshotVersionInput,
        description: snapshotDescInput
      });
      setShowSnapshotModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create dataset snapshot');
    }
  };

  const handleFreezeSnapshot = async (id: string) => {
    if (!confirm('Freezing a snapshot makes it permanently immutable. Proceed?')) return;
    try {
      await api.freezeAdminMainsDatasetSnapshot(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze snapshot');
    }
  };

  const handleCreateReleaseCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminMainsReleaseCandidate({ datasetVersion: rcVersionInput });
      setShowRcModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create release candidate');
    }
  };

  const handleFreezeReleaseCandidate = async (id: string) => {
    if (!confirm('Freezing a release candidate makes it permanently immutable and certifies it for downstream benchmarking. Proceed?')) return;
    try {
      await api.freezeAdminMainsReleaseCandidate(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze release candidate');
    }
  };

  const handleRunAutoQuarantine = async () => {
    setAutoScanningQuarantine(true);
    try {
      const res = await api.autoScanMainsQuarantine();
      alert(`Auto-quarantine scan completed: ${res.result?.quarantinedCount || 0} problematic submissions isolated.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Auto-quarantine scan failed');
    } finally {
      setAutoScanningQuarantine(false);
    }
  };

  const handleResolveQuarantine = async (id: string, outcome: 'RESTORED' | 'PERMANENTLY_EXCLUDED') => {
    const notes = prompt(`Enter resolution notes for ${outcome}:`);
    if (notes === null) return;
    try {
      await api.resolveMainsQuarantine(id, {
        resolutionStatus: 'RESOLVED',
        outcome,
        notes: notes || undefined
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve quarantine record');
    }
  };

  const handleRunAudit = async () => {
    setAuditRunning(true);
    try {
      const res = await api.runAdminMainsReadinessAudit();
      setReadinessAudit(res);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to run readiness audit');
    } finally {
      setAuditRunning(false);
    }
  };

  const handleRunQualityAudit = async () => {
    setQualityAuditRunning(true);
    try {
      await api.recordAdminMainsQualityRun();
      await loadAll();
      const runs = await api.getAdminMainsQualityRuns(10).catch(() => []);
      setQualityRunsHistory(runs || []);
      alert('Dataset Quality Audit completed and saved to immutable audit trail.');
    } catch (err: any) {
      alert(err.message || 'Failed to record quality run');
    } finally {
      setQualityAuditRunning(false);
    }
  };

  const loadCandidateEvals = async (paper?: string) => {
    setLoadingCandidates(true);
    try {
      const p = paper !== undefined ? paper : candidateInspectorPaper;
      const evals = await api.getAdminMainsCandidateEvals({
        limit: 50,
        paper: p && p !== 'ALL' ? p : undefined
      });
      setCandidateEvals(evals || []);
    } catch (err: any) {
      console.error('Failed to load candidate evaluations:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleViewManifest = async (rcId: string) => {
    try {
      const manifest = await api.getAdminMainsReleaseCandidateManifest(rcId);
      setSelectedManifest(manifest);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch release candidate manifest');
    }
  };

  const handleBuildDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.buildMainsDataset({
        versionName: datasetVersionInput,
        description: datasetDescInput
      });
      setShowBuildDatasetModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to build dataset');
    }
  };

  const handleFreezeDataset = async (id: string) => {
    if (!confirm('Freezing a dataset makes it completely immutable. Proceed?')) return;
    try {
      await api.freezeMainsDataset(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze dataset');
    }
  };

  const handleBuildBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.buildMainsBenchmark({
        name: benchNameInput,
        version: benchVersionInput
      });
      setShowBuildBenchmarkModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to build benchmark');
    }
  };

  const handleRegisterModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerMainsModel({
        id: modelIdInput,
        modelName: modelNameInput,
        version: modelVersionInput,
        baseModel: modelBaseInput,
        datasetVersion: selectedDsVersion || undefined
      });
      setShowRegisterModelModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to register model');
    }
  };

  const handlePromoteModel = async (id: string, targetStatus: 'SHADOW' | 'PRODUCTION') => {
    if (targetStatus === 'PRODUCTION') {
      if (!confirm('Promoting to PRODUCTION will make this model the primary evaluator for all student Mains answers. Proceed?')) return;
    }
    try {
      await api.promoteMainsModel(id, targetStatus);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to promote model');
    }
  };

  const handleEvaluateOnBenchmark = async (modelId: string) => {
    if (benchmarks.length === 0) {
      alert('Please build a benchmark first.');
      return;
    }
    const bench = benchmarks[0];
    try {
      const res = await api.evaluateMainsModel(modelId, bench.id);
      alert(`Benchmark evaluation complete! MAE: ${res.results.mae}, Agreement Rate: ${res.results.agreementRate}%`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Evaluation failed');
    }
  };

  const handleCreateTrainingJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMainsTrainingJob({
        datasetVersion: selectedDsVersion,
        modelVersion: jobModelVersion
      });
      setShowTrainingJobModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create training job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
              Phase 4.1 Proprietary Intelligence
            </span>
            <span className="text-xs text-stone-500 font-mono">Specialized Model Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 mt-1">
            Mains Copy Checking Intelligence & Model Training
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Ground truth curation, disagreement telemetry, sealed datasets, locked benchmarks, and fine-tuning lifecycle.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Evaluated</span>
          <p className="text-xl font-bold text-stone-900 mt-1">{metrics?.totalEvaluatedAnswers ?? 0}</p>
          <span className="text-[10px] text-stone-400">All submissions</span>
        </div>
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Faculty Reviewed</span>
          <p className="text-xl font-bold text-amber-900 mt-1">{metrics?.facultyReviewedAnswers ?? 0}</p>
          <span className="text-[10px] text-amber-700/80">Ground truth entries</span>
        </div>
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Training Eligible</span>
          <p className="text-xl font-bold text-emerald-900 mt-1">{metrics?.trainingEligibleAnswers ?? 0}</p>
          <span className="text-[10px] text-emerald-700/80">Curated & clean</span>
        </div>
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">AI vs Faculty MAE</span>
          <p className="text-xl font-bold text-blue-900 mt-1">{metrics?.mae ?? '0.00'}</p>
          <span className="text-[10px] text-blue-700/80">Mean Absolute Error</span>
        </div>
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Agreement Rate</span>
          <p className="text-xl font-bold text-indigo-900 mt-1">{metrics?.agreementRate ?? 100}%</p>
          <span className="text-[10px] text-indigo-700/80">Diff ≤ 10% marks</span>
        </div>
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Model Versions</span>
          <p className="text-xl font-bold text-purple-900 mt-1">{metrics?.modelVersionsCount ?? 0}</p>
          <span className="text-[10px] text-purple-700/80">Registered models</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-1 overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: 'Disagreement Analytics', icon: BarChart3 },
          { key: 'COVERAGE', label: 'Dataset Coverage & Growth (Phase 4.1C)', icon: Layers },
          { key: 'ACQUISITION', label: 'Acquisition & Funnel (Phase 4.1D)', icon: Target },
          { key: 'QUALITY', label: 'Quality & Release Candidate (Phase 4.1E)', icon: ShieldCheck },
          { key: 'OPERATIONS', label: 'Operations & Calibration (Phase 4.1F)', icon: Activity },
          { key: 'READINESS', label: 'Training Readiness (Phase 4.1G)', icon: ShieldAlert },
          { key: 'REMEDIATION', label: 'Remediation & Acquisition (Phase 4.1H)', icon: ShieldCheck },
          { key: 'GROWTH_HUB', label: 'Acquisition Hub (Phase 4.1I)', icon: Target },
          { key: 'TELEGRAM_IMPORT', label: 'Telegram Ingestion (Phase 4.1J)', icon: Send },
          { key: 'DATASETS', label: 'Dataset Releases', icon: Database },
          { key: 'BENCHMARKS', label: 'Locked Benchmarks', icon: Award },
          { key: 'MODELS', label: 'Model Registry', icon: Brain },
          { key: 'JOBS', label: 'Training Pipeline', icon: Zap }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-amber-700 text-amber-900 bg-amber-50/50'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. DISAGREEMENT ANALYTICS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-700" />
                Performance by Question Type
              </h3>
              {disagreementData?.byQuestionType?.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No faculty review samples recorded yet.</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {(disagreementData?.byQuestionType || []).map((q: any) => (
                    <div key={q.question_type} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900">{q.question_type}</span>
                        <span className="text-stone-400 ml-2">({q.count} samples)</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span>MAE: <strong>{q.avg_marks_diff}</strong></span>
                        <span>Diff: <strong>{q.avg_pct_diff}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                Disagreement Distribution
              </h3>
              {disagreementData?.byDisagreementLevel?.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No telemetry available.</p>
              ) : (
                <div className="space-y-3">
                  {(disagreementData?.byDisagreementLevel || []).map((l: any) => (
                    <div key={l.disagreement_level} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-stone-700">{l.disagreement_level}</span>
                        <span className="font-bold text-stone-900">{l.count} reviews</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            l.disagreement_level === 'AGREEMENT'
                              ? 'bg-emerald-500'
                              : l.disagreement_level === 'MINOR_DISAGREEMENT'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, l.count * 10))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DATASET COVERAGE & GROWTH (PHASE 4.1C) */}
      {activeTab === 'COVERAGE' && (
        <div className="space-y-6">
          {/* Header Action & Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900">
                  Phase 4.1C Production Mode
                </span>
                <span className="text-xs text-amber-900 font-mono">Real Learner & Faculty Ground Truth</span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-1">Real Mains Dataset Coverage & Growth Engine</h2>
              <p className="text-xs text-stone-600">
                Audits real database answers without synthetic data or test fixtures. Identifies zero-coverage syllabus areas for targeted copy checking.
              </p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={auditRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-xs shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditRunning ? 'animate-spin' : ''}`} />
              {auditRunning ? 'Auditing Database...' : 'Run Readiness Audit'}
            </button>
          </div>

          {/* Training Gate Safety Controller */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Training Gate Safety Controller</h3>
                  <span className="text-xs text-stone-500">Strict Anti-Contamination & Minimum Sample Gate</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Training Disabled (Phase 4.1C Safe Mode)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                <span className="text-xs text-stone-500 font-medium">Verified Ground-Truth Reviews</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-stone-900">
                    {trainingGate?.actuals?.verifiedReviews ?? 0}
                  </span>
                  <span className="text-xs text-stone-500">
                    / {trainingGate?.thresholds?.minimumVerifiedReviews ?? 250} req
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((trainingGate?.actuals?.verifiedReviews ?? 0) / (trainingGate?.thresholds?.minimumVerifiedReviews || 250)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                <span className="text-xs text-stone-500 font-medium">Unique Training Answers</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-stone-900">
                    {trainingGate?.actuals?.uniqueAnswers ?? 0}
                  </span>
                  <span className="text-xs text-stone-500">
                    / {trainingGate?.thresholds?.minimumUniqueAnswers ?? 200} req
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((trainingGate?.actuals?.uniqueAnswers ?? 0) / (trainingGate?.thresholds?.minimumUniqueAnswers || 200)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                <span className="text-xs text-stone-500 font-medium">Syllabus Subjects Covered</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-stone-900">
                    {trainingGate?.actuals?.subjectsCovered ?? 0}
                  </span>
                  <span className="text-xs text-stone-500">
                    / {trainingGate?.thresholds?.minimumSubjects ?? 5} req
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((trainingGate?.actuals?.subjectsCovered ?? 0) / (trainingGate?.thresholds?.minimumSubjects || 5)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                <span className="text-xs text-stone-500 font-medium">Isolated Benchmark Items</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-stone-900">
                    {trainingGate?.actuals?.benchmarkItems ?? 0}
                  </span>
                  <span className="text-xs text-stone-500">
                    / {trainingGate?.thresholds?.minimumBenchmarkItems ?? 20} req
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((trainingGate?.actuals?.benchmarkItems ?? 0) / (trainingGate?.thresholds?.minimumBenchmarkItems || 20)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 font-mono">
              Status: {trainingGate?.safetyCheck || 'Dataset threshold evaluation in progress.'}
            </p>
          </div>

          {/* Live Dataset Growth Counters */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              Live Dataset Growth Counters (Production Database)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Raw Submissions</span>
                <p className="text-lg font-bold text-stone-900 mt-0.5">{datasetGrowth?.rawSubmissions ?? 0}</p>
                <span className="text-[10px] text-stone-400">Total in DB</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">AI Evaluated</span>
                <p className="text-lg font-bold text-blue-900 mt-0.5">{datasetGrowth?.aiEvaluated ?? 0}</p>
                <span className="text-[10px] text-blue-600">Phase 1 automated</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Faculty Reviewed</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">{datasetGrowth?.facultyReviewed ?? 0}</p>
                <span className="text-[10px] text-amber-700">Ground truth entries</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Paired Evaluations</span>
                <p className="text-lg font-bold text-indigo-900 mt-0.5">{datasetGrowth?.pairedAiPlusFaculty ?? 0}</p>
                <span className="text-[10px] text-indigo-600">AI + Faculty paired</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Training Eligible</span>
                <p className="text-lg font-bold text-emerald-900 mt-0.5">{datasetGrowth?.trainingEligible ?? 0}</p>
                <span className="text-[10px] text-emerald-600">Passed 13 quality gates</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Double Reviewed</span>
                <p className="text-lg font-bold text-teal-900 mt-0.5">{datasetGrowth?.doubleReviewed ?? 0}</p>
                <span className="text-[10px] text-teal-600">Dual faculty blind</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Adjudicated</span>
                <p className="text-lg font-bold text-purple-900 mt-0.5">{datasetGrowth?.adjudicated ?? 0}</p>
                <span className="text-[10px] text-purple-600">Senior board settled</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Excluded Answers</span>
                <p className="text-lg font-bold text-rose-900 mt-0.5">{datasetGrowth?.excluded ?? 0}</p>
                <span className="text-[10px] text-rose-600">Short / PII / Test</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Duplicate Submissions</span>
                <p className="text-lg font-bold text-stone-900 mt-0.5">{datasetGrowth?.duplicateSubmissions ?? 0}</p>
                <span className="text-[10px] text-stone-500">Rate: {datasetGrowth?.duplicateRate ?? 0}%</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Benchmark Overlap</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">{datasetGrowth?.benchmarkOverlapCount ?? 0}</p>
                <span className="text-[10px] text-amber-700">Strictly isolated</span>
              </div>
            </div>
          </div>

          {/* Syllabus Coverage Targeting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Papers Coverage */}
            <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  Mains Papers Coverage
                </h4>
                <span className="text-[11px] text-stone-500">Target ≥ 5 eligible answers</span>
              </div>
              <div className="space-y-2">
                {(coverageData?.papers || []).map((p: any) => (
                  <div key={p.subcategory} className="flex items-center justify-between p-2 rounded-lg border border-stone-100 hover:bg-stone-50 text-xs">
                    <span className="font-bold text-stone-800">{p.subcategory}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500 text-[11px]">{p.count} total ({p.eligibleCount} eligible)</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'COVERED' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'PARTIALLY_COVERED' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Directives Coverage */}
            <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-700" />
                  Question Directives Coverage
                </h4>
                <span className="text-[11px] text-stone-500">Explain, Discuss, Analyze, etc.</span>
              </div>
              <div className="space-y-2">
                {(coverageData?.directives || []).map((d: any) => (
                  <div key={d.subcategory} className="flex items-center justify-between p-2 rounded-lg border border-stone-100 hover:bg-stone-50 text-xs">
                    <span className="font-bold text-stone-800">{d.subcategory}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500 text-[11px]">{d.count} total ({d.eligibleCount} eligible)</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'COVERED' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'PARTIALLY_COVERED' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lengths, Marks, Tiers & Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Answer Lengths</h4>
              {(coverageData?.lengths || []).map((l: any) => (
                <div key={l.subcategory} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                  <span className="text-stone-700 font-medium">{l.subcategory}</span>
                  <span className="text-stone-500">{l.count} ({l.status})</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Marks Scales</h4>
              {(coverageData?.marks || []).map((m: any) => (
                <div key={m.subcategory} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                  <span className="text-stone-700 font-medium">{m.subcategory}</span>
                  <span className="text-stone-500">{m.count} ({m.status})</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Performance Tiers</h4>
              {(coverageData?.tiers || []).map((t: any) => (
                <div key={t.subcategory} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                  <span className="text-stone-700 font-medium">{t.subcategory}</span>
                  <span className="text-stone-500">{t.count} ({t.status})</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Typed vs Handwritten</h4>
              {(coverageData?.types || []).map((ty: any) => (
                <div key={ty.subcategory} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                  <span className="text-stone-700 font-medium">{ty.subcategory}</span>
                  <span className="text-stone-500">{ty.count} ({ty.status})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Readiness Audit Report Card (if run) */}
          {readinessAudit && (
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-sm font-bold text-stone-900">Latest Database Readiness Audit Result</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Status: {readinessAudit.readinessStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>Total Answers in DB: <strong>{readinessAudit.totalAnswers}</strong></div>
                <div>Unique Answers: <strong>{readinessAudit.uniqueAnswers}</strong></div>
                <div>Faculty Reviewed: <strong>{readinessAudit.facultyReviewed}</strong></div>
                <div>Training Eligible: <strong>{readinessAudit.trainingEligible}</strong></div>
                <div>Benchmark Isolation Leakage: <strong>{readinessAudit.leakageCount} (Pass)</strong></div>
                <div>Benchmark Items: <strong>{readinessAudit.benchmarkSize}</strong></div>
                <div>Audit Timestamp: <strong className="font-mono text-[10px]">{readinessAudit.auditTimestamp}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5. DATASET ACQUISITION ENGINE & FUNNEL (PHASE 4.1D) */}
      {activeTab === 'ACQUISITION' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-200 text-indigo-900">
                  Phase 4.1D Acquisition Engine
                </span>
                <span className="text-xs text-indigo-900 font-mono">Organic Real Learner + Faculty Growth</span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-1">Real Mains Dataset Acquisition & Funnel</h2>
              <p className="text-xs text-stone-600">
                Identifies real syllabus coverage gaps, surfaces targeted practice questions to learners, and tracks conversion from question surfacing to unique training candidate.
              </p>
            </div>
            <button
              onClick={() => setShowSnapshotModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-800 hover:bg-indigo-900 rounded-lg transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Dataset Snapshot
            </button>
          </div>

          {/* Acquisition Funnel Card */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-indigo-700" />
              Dataset Acquisition Funnel (Conversion Telemetry)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">1. Surfaced</span>
                <p className="text-base font-bold text-stone-900 mt-1">{acquisitionFunnel?.questionsSurfaced ?? 0}</p>
                <span className="text-[10px] text-stone-400">Questions</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">2. Submitted</span>
                <p className="text-base font-bold text-blue-900 mt-1">{acquisitionFunnel?.answersSubmitted ?? 0}</p>
                <span className="text-[10px] text-blue-600 font-mono">{acquisitionFunnel?.conversionRates?.submissionRate ?? 0}% conv</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">3. AI Evaluated</span>
                <p className="text-base font-bold text-indigo-900 mt-1">{acquisitionFunnel?.aiEvaluated ?? 0}</p>
                <span className="text-[10px] text-indigo-600 font-mono">{acquisitionFunnel?.conversionRates?.aiEvaluationRate ?? 0}% conv</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">4. Reviewed</span>
                <p className="text-base font-bold text-amber-900 mt-1">{acquisitionFunnel?.facultyReviewed ?? 0}</p>
                <span className="text-[10px] text-amber-700 font-mono">{acquisitionFunnel?.conversionRates?.facultyReviewRate ?? 0}% conv</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">5. Accepted</span>
                <p className="text-base font-bold text-teal-900 mt-1">{acquisitionFunnel?.groundTruthAccepted ?? 0}</p>
                <span className="text-[10px] text-teal-700 font-mono">{acquisitionFunnel?.conversionRates?.acceptanceRate ?? 0}% conv</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500">6. Passed Gates</span>
                <p className="text-base font-bold text-emerald-900 mt-1">{acquisitionFunnel?.qualityGatesPassed ?? 0}</p>
                <span className="text-[10px] text-emerald-700 font-mono">{acquisitionFunnel?.conversionRates?.qualityGatePassRate ?? 0}% conv</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800">7. Candidates</span>
                <p className="text-base font-bold text-emerald-950 mt-1">{acquisitionFunnel?.uniqueTrainingCandidates ?? 0}</p>
                <span className="text-[10px] text-emerald-700 font-mono">{acquisitionFunnel?.conversionRates?.overallConversionRate ?? 0}% yield</span>
              </div>
            </div>
          </div>

          {/* Learner Diversity & Concentration Warning */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Real Learner Diversity & Anti-Concentration Control
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span>Unique Learners: <strong>{learnerDiversity?.totalUniqueLearners ?? 0}</strong></span>
                <span>Learners with Eligible Answers: <strong>{learnerDiversity?.uniqueLearnersWithEligible ?? 0}</strong></span>
              </div>
            </div>

            {learnerDiversity?.concentrationFlag && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{learnerDiversity.concentrationWarningMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(learnerDiversity?.eligibleAnswersPerLearner || []).slice(0, 3).map((l: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60 text-xs flex items-center justify-between">
                  <span className="font-mono text-stone-700">{l.anonymizedLearnerId}</span>
                  <span className="font-bold text-stone-900">{l.eligibleCount} eligible ({l.percentageOfDataset}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset Acquisition Priorities Table */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-700" />
                Dataset Acquisition Priorities (Real Coverage Gaps)
              </h3>
              <span className="text-xs text-stone-500">Surfacing underrepresented real syllabus prompts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Rank</th>
                    <th className="py-2 px-3 font-semibold">Paper</th>
                    <th className="py-2 px-3 font-semibold">Subject / Topic</th>
                    <th className="py-2 px-3 font-semibold">Directive</th>
                    <th className="py-2 px-3 font-semibold">Marks</th>
                    <th className="py-2 px-3 font-semibold">Coverage Status</th>
                    <th className="py-2 px-3 font-semibold">Provenance</th>
                    <th className="py-2 px-3 font-semibold">Priority Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {acquisitionPriorities.map((p: any) => (
                    <tr key={p.questionId} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-bold text-stone-700">#{p.priorityRank}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">{p.paper}</td>
                      <td className="py-2.5 px-3 text-stone-700">{p.subject} <span className="text-stone-400">•</span> {p.topic}</td>
                      <td className="py-2.5 px-3 font-medium text-stone-800">{p.directive}</td>
                      <td className="py-2.5 px-3 text-stone-700">{p.marks}M ({p.wordLimit}w)</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.currentCoverage === 'COVERED' ? 'bg-emerald-100 text-emerald-800' :
                          p.currentCoverage === 'PARTIALLY_COVERED' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {p.currentCoverage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-stone-600">{p.provenance}</td>
                      <td className="py-2.5 px-3 text-stone-600 italic text-[11px]">{p.priorityReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Version Snapshots */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-700" />
                  Dataset Version Snapshots (Immutable Archives)
                </h3>
                <p className="text-xs text-stone-500">Archived snapshots with cryptographic checksums and benchmark isolation.</p>
              </div>
            </div>

            <div className="divide-y divide-stone-200">
              {datasetSnapshots.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 italic">No dataset snapshots created yet. Click "Create Dataset Snapshot" above to compile current eligible training data.</p>
              ) : (
                datasetSnapshots.map((snap: any) => (
                  <div key={snap.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-900">{snap.versionName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          snap.status === 'FROZEN' ? 'bg-stone-200 text-stone-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {snap.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">{snap.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-0.5">
                        <span>Items: <strong>{snap.eligibleItemsCount}</strong></span>
                        <span>SHA-256: <strong className="font-mono text-[10px]">{snap.checksumSha256 ? `${snap.checksumSha256.substring(0, 16)}...` : 'N/A'}</strong></span>
                        <span>Created: <strong>{new Date(snap.createdAt).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                    {snap.status !== 'FROZEN' && (
                      <button
                        onClick={() => handleFreezeSnapshot(snap.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors shrink-0"
                      >
                        <Lock className="w-3 h-3" /> Freeze Snapshot
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2.8. DATASET QUALITY CONTROL & RELEASE CANDIDATE (PHASE 4.1E) */}
      {activeTab === 'QUALITY' && (
        <div className="space-y-6">
          {/* Header & Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-stone-900 to-indigo-950 text-white shadow-md">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PHASE 4.1E DATASET QUALITY & RELEASE GOVERNANCE
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono ${
                  qualityScorecard?.overallReadiness === 'READY'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400'
                    : qualityScorecard?.overallReadiness === 'READY_WITH_WARNINGS'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400'
                    : 'bg-rose-500/30 text-rose-200 border border-rose-400'
                }`}>
                  STATUS: {qualityScorecard?.overallReadiness || 'ANALYZING'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono bg-stone-700/60 text-stone-300 border border-stone-600">
                  TRAINING GATE: LOCKED
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dataset Quality Control, Faculty Calibration & Release Candidate Engine
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
                Objective production quality audit, faculty agreement statistics, anti-leakage quarantine, and certified release candidate generation.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRunQualityAudit}
                disabled={qualityAuditRunning}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition border border-stone-700 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${qualityAuditRunning ? 'animate-spin' : ''}`} />
                <span>{qualityAuditRunning ? 'Auditing...' : 'Run Quality Audit'}</span>
              </button>
              <button
                onClick={() => setShowRcModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Release Candidate</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200 overflow-x-auto">
            {[
              { id: 'SCORECARD', label: '1. Quality Scorecard', icon: ShieldCheck },
              { id: 'CALIBRATION', label: '2. Faculty Calibration & Consistency', icon: Scale },
              { id: 'RELEASE_CANDIDATES', label: '3. Release Candidate Management', icon: Award },
              { id: 'LEAKAGE_GUARD', label: '4. Benchmark Isolation & Leakage Guard', icon: ShieldAlert },
              { id: 'CANDIDATE_INSPECTOR', label: '5. Dataset Candidate Inspector', icon: FileCheck2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = qualitySubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setQualitySubTab(tab.id as any);
                    if (tab.id === 'CANDIDATE_INSPECTOR') loadCandidateEvals();
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: QUALITY SCORECARD */}
          {qualitySubTab === 'SCORECARD' && (
            <div className="space-y-6">
              {/* Real Production Metrics Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Scanned</span>
                  <p className="text-xl font-bold text-stone-900 mt-1">{qualityScorecard?.summaryCounts?.totalAnswers ?? 0}</p>
                  <span className="text-[10px] text-stone-400">Answers in database</span>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Faculty Reviewed</span>
                  <p className="text-xl font-bold text-blue-900 mt-1">{qualityScorecard?.summaryCounts?.facultyReviewed ?? 0}</p>
                  <span className="text-[10px] text-blue-700/80">Human ground truth</span>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Training Eligible</span>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{qualityScorecard?.summaryCounts?.trainingEligible ?? 0}</p>
                  <span className="text-[10px] text-emerald-700/80">Clean candidates</span>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Quarantined</span>
                  <p className="text-xl font-bold text-rose-900 mt-1">{qualityScorecard?.summaryCounts?.quarantined ?? 0}</p>
                  <span className="text-[10px] text-rose-700/80">Problematic records</span>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Benchmarks Isolated</span>
                  <p className="text-xl font-bold text-purple-900 mt-1">{qualityScorecard?.summaryCounts?.benchmarkExcluded ?? 0}</p>
                  <span className="text-[10px] text-purple-700/80">Zero leakage</span>
                </div>
              </div>

              {/* 12-DIMENSION DATA QUALITY SCORECARD */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Mains Dataset Quality Scorecard (Sections A through L)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Individual deterministic evaluations per dimension. No collapsed synthetic scores.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    Audited: {qualityScorecard?.evaluatedAt ? new Date(qualityScorecard.evaluatedAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'dataCompleteness', label: 'A. Data Completeness' },
                    { key: 'facultyGroundTruth', label: 'B. Faculty Ground Truth' },
                    { key: 'evaluationConsistency', label: 'C. Evaluation Consistency' },
                    { key: 'paperSubjectCoverage', label: 'D. Paper & Subject Coverage' },
                    { key: 'performanceTierCoverage', label: 'E. Performance-Tier Coverage' },
                    { key: 'answerFormatCoverage', label: 'F. Answer-Format Coverage' },
                    { key: 'ocrQuality', label: 'G. OCR Quality' },
                    { key: 'duplicateHealth', label: 'H. Duplicate Health' },
                    { key: 'benchmarkIsolation', label: 'I. Benchmark Isolation' },
                    { key: 'learnerDiversity', label: 'J. Learner Diversity' },
                    { key: 'piiSafety', label: 'K. PII Safety' },
                    { key: 'datasetIntegrity', label: 'L. Dataset Integrity' }
                  ].map(({ key, label }) => {
                    const item = qualityScorecard?.[key];
                    const status = item?.status || 'PASS';
                    return (
                      <div
                        key={key}
                        className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-2 hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-stone-900 line-clamp-1">{label}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">
                          {item?.summary || 'Evaluating dimension criteria...'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: FACULTY CALIBRATION & CONSISTENCY */}
          {qualitySubTab === 'CALIBRATION' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calibration Analytics (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        <span>Faculty Calibration & Inter-Rater Reliability</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Measurement of agreement across paired AI evaluations and blind double-reviews.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Total Completed Reviews</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.totalReviews ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Unique Faculty Evaluators</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.uniqueFacultyEvaluators ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Double-Reviewed Answers</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.doubleReviewedAnswers ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Senior Board Adjudicated</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.adjudicatedAnswers ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Average Mark Difference</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.averageMarkDifference ?? 0} marks</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-600">Rubric Dimension Agreement</span>
                      <span className="font-bold font-mono text-stone-900">{calibrationSummary?.rubricAgreement ?? 0}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 text-[11px]">Inter-Rater Reliability:</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800">
                          {calibrationSummary?.interRaterReliability?.status || 'INSUFFICIENT_SAMPLE_SIZE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-900">
                        {calibrationSummary?.interRaterReliability?.value !== undefined
                          ? `${calibrationSummary.interRaterReliability.statisticName}: ${calibrationSummary.interRaterReliability.value}`
                          : 'INSUFFICIENT DATA FOR RELIABILITY ESTIMATE'}
                      </p>
                      <p className="text-[10px] text-indigo-700">
                        Exact agreement: {calibrationSummary?.interRaterReliability?.exactMarkAgreementRate ?? 0}% • Adjudication freq: {calibrationSummary?.interRaterReliability?.adjudicationFrequency ?? 0}%
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await api.recordAdminMainsCalibrationLog();
                        alert('Faculty calibration snapshot logged to audit trail.');
                      } catch (err: any) {
                        alert(err.message || 'Failed to record calibration log');
                      }
                    }}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Log Calibration Snapshot
                  </button>
                </div>

                {/* Evaluator Consistency (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                    <span>Faculty Evaluator Consistency (Factual Measurements)</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Objective review volume, average marks, and disagreement rates per evaluator without subjective ranking. If reviews &lt; 5, flagged as INSUFFICIENT_DATA.
                  </p>

                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
                        <tr>
                          <th className="px-3 py-2">Evaluator</th>
                          <th className="px-3 py-2">Reviews</th>
                          <th className="px-3 py-2">Avg Marks</th>
                          <th className="px-3 py-2">Std Dev</th>
                          <th className="px-3 py-2">Major Disagree %</th>
                          <th className="px-3 py-2">Status / Calibration Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {facultyConsistency.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-stone-400">
                              No faculty reviews completed yet.
                            </td>
                          </tr>
                        ) : (
                          facultyConsistency.map((fc: any) => (
                            <tr key={fc.evaluatorId} className="hover:bg-stone-50">
                              <td className="px-3 py-2 font-medium text-stone-900">{fc.evaluatorName}</td>
                              <td className="px-3 py-2 font-mono">{fc.reviewsCompleted}</td>
                              <td className="px-3 py-2 font-mono">{fc.averageMarks}</td>
                              <td className="px-3 py-2 font-mono">±{fc.markDistribution?.stdDev ?? 0}</td>
                              <td className="px-3 py-2 font-mono">{fc.aiFacultyDisagreementRate}%</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono inline-block w-fit ${
                                    fc.status === 'VALID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {fc.status}
                                  </span>
                                  {fc.status !== 'VALID' && (
                                    <span className="text-[9px] text-stone-500">
                                      {fc.calibrationNote || 'Do not use for calibration'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: RELEASE CANDIDATE MANAGEMENT */}
          {qualitySubTab === 'RELEASE_CANDIDATES' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Dataset Release Candidates</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Pre-release candidate packages audited across 14 security, benchmark, and diversity gates with deterministic SHA-256 checksums.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRcModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Release Candidate</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-3 py-2">Candidate ID</th>
                        <th className="px-3 py-2">Version</th>
                        <th className="px-3 py-2">Eligible Items</th>
                        <th className="px-3 py-2">SHA-256 Checksum</th>
                        <th className="px-3 py-2">Overall Status</th>
                        <th className="px-3 py-2">Lifecycle</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {releaseCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-stone-400">
                            No release candidates created yet. Click "Create Release Candidate" to package eligible data.
                          </td>
                        </tr>
                      ) : (
                        releaseCandidates.map((rc: any) => (
                          <tr key={rc.id} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-mono text-stone-700">{rc.releaseCandidateId}</td>
                            <td className="px-3 py-2 font-bold text-stone-900">{rc.datasetVersion}</td>
                            <td className="px-3 py-2 font-mono">{rc.eligibleItemsCount}</td>
                            <td className="px-3 py-2 font-mono text-stone-500">
                              {rc.checksumSha256 ? `${rc.checksumSha256.substring(0, 12)}...` : 'N/A'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                rc.overallStatus === 'READY' || rc.status === 'READY_FOR_RELEASE_CANDIDATE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rc.overallStatus === 'READY_WITH_WARNINGS'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {rc.status || rc.overallStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                rc.status === 'FROZEN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}>
                                {rc.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleViewManifest(rc.id)}
                                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                View Manifest
                              </button>
                              {rc.validationReportMarkdown && (
                                <button
                                  onClick={() => setSelectedRcReport(rc.validationReportMarkdown)}
                                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  View Report
                                </button>
                              )}
                              {rc.status !== 'FROZEN' && (
                                <button
                                  onClick={() => handleFreezeReleaseCandidate(rc.id)}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Freeze</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: BENCHMARK ISOLATION & LEAKAGE GUARD */}
          {qualitySubTab === 'LEAKAGE_GUARD' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Benchmark Isolation & Automatic Data Quarantine</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Logically isolates corrupted, synthetic, PII-tainted, or benchmark-overlapping records from candidate pool. Never silently dropped.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunAutoQuarantine}
                      disabled={autoScanningQuarantine}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>{autoScanningQuarantine ? 'Scanning...' : 'Run Auto-Quarantine Scan'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Currently Quarantined</span>
                    <p className="text-xl font-bold text-rose-950 mt-1">{quarantineMetrics?.totalQuarantined ?? 0}</p>
                    <span className="text-[10px] text-rose-700">Isolated from release pipeline</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Restored After Verification</span>
                    <p className="text-xl font-bold text-emerald-950 mt-1">{quarantineMetrics?.restored ?? 0}</p>
                    <span className="text-[10px] text-emerald-700">Manually reviewed & cleared</span>
                  </div>
                  <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">Permanently Excluded</span>
                    <p className="text-xl font-bold text-stone-950 mt-1">{quarantineMetrics?.permanentlyExcluded ?? 0}</p>
                    <span className="text-[10px] text-stone-600">Preserved in audit log</span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[340px]">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-3 py-2">Submission ID</th>
                        <th className="px-3 py-2">Paper</th>
                        <th className="px-3 py-2">Quarantine Reason</th>
                        <th className="px-3 py-2">Detected By</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {quarantineRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-stone-400">
                            Zero records currently quarantined. All candidate submissions clean.
                          </td>
                        </tr>
                      ) : (
                        quarantineRecords.map((qr: any) => (
                          <tr key={qr.id} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-mono text-stone-700">{qr.submissionId}</td>
                            <td className="px-3 py-2 font-mono font-bold text-stone-800">{qr.paper || 'GS2'}</td>
                            <td className="px-3 py-2 text-rose-800 font-medium">{qr.quarantineReason}</td>
                            <td className="px-3 py-2 text-stone-500">{qr.detectedBy}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                qr.resolutionStatus === 'QUARANTINED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : qr.resolutionStatus === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {qr.resolutionStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                              {qr.resolutionStatus === 'QUARANTINED' && (
                                <>
                                  <button
                                    onClick={() => handleResolveQuarantine(qr.id, 'RESTORED')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => handleResolveQuarantine(qr.id, 'PERMANENTLY_EXCLUDED')}
                                    className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Exclude
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 5: DATASET CANDIDATE INSPECTOR */}
          {qualitySubTab === 'CANDIDATE_INSPECTOR' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>Dataset Candidate Answer Inspector</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Inspect candidate answers evaluated against all 14 strict rejection rules: faculty review, marks validity, disagreement, duplicates, benchmarks, PII, and learner concentration.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={candidateInspectorPaper}
                      onChange={(e) => {
                        setCandidateInspectorPaper(e.target.value);
                        loadCandidateEvals(e.target.value);
                      }}
                      className="text-xs font-bold border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white text-stone-800"
                    >
                      <option value="ALL">All Papers</option>
                      <option value="GS1">GS 1</option>
                      <option value="GS2">GS 2</option>
                      <option value="GS3">GS 3</option>
                      <option value="GS4">GS 4 / Ethics</option>
                      <option value="ESSAY">Essay</option>
                    </select>
                    <button
                      onClick={() => loadCandidateEvals()}
                      disabled={loadingCandidates}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition cursor-pointer border border-stone-300"
                    >
                      {loadingCandidates ? 'Loading...' : 'Refresh Candidates'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {candidateEvals.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                      {loadingCandidates ? 'Evaluating real production candidates...' : 'No candidate answers loaded. Click "Refresh Candidates".'}
                    </div>
                  ) : (
                    candidateEvals.map((c: any) => (
                      <div
                        key={c.submissionId}
                        className={`p-4 rounded-xl border transition-colors space-y-2 ${
                          c.eligible
                            ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                            : 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-stone-900">{c.submissionId}</span>
                            <span className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded font-mono text-[10px] font-bold">
                              {c.paper || 'GS2'}
                            </span>
                            <span className="text-xs text-stone-600">
                              Marks: <strong>{c.marksObtained ?? '—'} / {c.maxMarks ?? 10}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              c.eligible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {c.eligible ? 'TRAINING ELIGIBLE' : 'DISQUALIFIED'}
                            </span>
                          </div>
                        </div>

                        {/* Checks summary tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.checks && Object.entries(c.checks).map(([checkKey, checkVal]: [string, any]) => (
                            <span
                              key={checkKey}
                              title={checkVal.reason || checkKey}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                checkVal.status === 'PASS'
                                  ? 'bg-stone-100 text-stone-600'
                                  : checkVal.status === 'WARNING'
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-rose-100 text-rose-800 font-bold'
                              }`}
                            >
                              {checkKey}: {checkVal.status}
                            </span>
                          ))}
                        </div>

                        {/* Rejection reasons if disqualified */}
                        {c.rejections?.length > 0 && (
                          <div className="p-2.5 bg-rose-100/70 border border-rose-200/80 rounded-lg text-rose-900 text-xs space-y-0.5">
                            <span className="font-bold text-[11px] block">Disqualification Reasons:</span>
                            {c.rejections.map((r: string, idx: number) => (
                              <div key={idx} className="text-[11px]">• {r}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 4.1F — DATASET OPERATIONS & CALIBRATION LOOP */}
      {activeTab === 'OPERATIONS' && (
        <MainsDatasetOperationsView />
      )}

      {/* PHASE 4.1G — TRAINING READINESS & GO/NO-GO AUDIT */}
      {activeTab === 'READINESS' && (
        <MainsTrainingReadinessAuditView />
      )}

      {/* PHASE 4.1H — DATASET REMEDIATION & ACQUISITION EXECUTION */}
      {activeTab === 'REMEDIATION' && (
        <MainsDatasetRemediationView />
      )}

      {/* PHASE 4.1I — REAL DATASET GROWTH & CONTROLLED COLLECTION */}
      {activeTab === 'GROWTH_HUB' && (
        <MainsDatasetAcquisitionHubView />
      )}

      {/* PHASE 4.1J — TELEGRAM MAINS COPY INGESTION */}
      {activeTab === 'TELEGRAM_IMPORT' && (
        <MainsTelegramIngestionDashboardView />
      )}

      {/* 3. DATASETS */}
      {activeTab === 'DATASETS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Immutable Dataset Releases</h2>
              <p className="text-xs text-stone-500">Curated ground-truth exports with learner-level split isolation.</p>
            </div>
            <button
              onClick={() => setShowBuildDatasetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Build Dataset Version
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
            {datasets.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No dataset releases created yet. Click "Build Dataset Version" to compile verified ground-truth answers.
              </div>
            ) : (
              datasets.map((ds) => (
                <div key={ds.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900">{ds.version_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        ds.is_frozen ? 'bg-stone-100 text-stone-700 border-stone-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {ds.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{ds.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-1">
                      <span>Total Examples: <strong>{ds.total_examples}</strong></span>
                      <span>Average Score: <strong>{ds.average_marks}</strong></span>
                      <span>SHA-256: <strong className="font-mono text-[10px]">{ds.checksum_sha256?.substring(0, 16)}...</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!ds.is_frozen && (
                      <button
                        onClick={() => handleFreezeDataset(ds.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors"
                      >
                        <Lock className="w-3 h-3" /> Freeze Dataset
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. BENCHMARKS */}
      {activeTab === 'BENCHMARKS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Locked Evaluation Benchmarks</h2>
              <p className="text-xs text-stone-500">Golden test sets isolated from training data for unbiased calibration.</p>
            </div>
            <button
              onClick={() => setShowBuildBenchmarkModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Build Locked Benchmark
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
            {benchmarks.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No benchmarks constructed yet. Build a locked benchmark to calibrate new model candidates.
              </div>
            ) : (
              benchmarks.map((bm) => (
                <div key={bm.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{bm.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                        {bm.version}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-1">
                      <span>Total Test Items: <strong>{bm.total_items}</strong></span>
                      <span>Weak: <strong>{bm.tier_distribution?.WEAK || 0}</strong></span>
                      <span>Average: <strong>{bm.tier_distribution?.AVERAGE || 0}</strong></span>
                      <span>Strong: <strong>{bm.tier_distribution?.STRONG || 0}</strong></span>
                      <span>Excellent: <strong>{bm.tier_distribution?.EXCELLENT || 0}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. MODEL REGISTRY */}
      {activeTab === 'MODELS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Evaluation Model Registry</h2>
              <p className="text-xs text-stone-500">Model versions, validation metrics, and production promotion lifecycle.</p>
            </div>
            <button
              onClick={() => setShowRegisterModelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Model Candidate
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
            {models.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No model candidates registered.
              </div>
            ) : (
              models.map((md) => (
                <div key={md.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{md.model_name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                        {md.version}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        md.status === 'PRODUCTION'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : md.status === 'SHADOW'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}>
                        {md.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-1">
                      <span>Base Model: <strong>{md.base_model}</strong></span>
                      <span>MAE: <strong>{md.mae ?? 'Unbenchmarked'}</strong></span>
                      <span>Major Disagreement: <strong>{md.major_disagreement_rate ? `${md.major_disagreement_rate}%` : 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEvaluateOnBenchmark(md.id)}
                      className="px-2.5 py-1 text-xs font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                    >
                      Run Benchmark
                    </button>
                    {md.status !== 'PRODUCTION' && (
                      <button
                        onClick={() => handlePromoteModel(md.id, 'SHADOW')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        Set Shadow
                      </button>
                    )}
                    {md.status !== 'PRODUCTION' && (
                      <button
                        onClick={() => handlePromoteModel(md.id, 'PRODUCTION')}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                      >
                        Promote to Production
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TRAINING JOBS PIPELINE */}
      {activeTab === 'JOBS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Fine-Tuning Training Jobs</h2>
              <p className="text-xs text-stone-500">Controlled training jobs triggered via explicit administrator action.</p>
            </div>
            <button
              onClick={() => setShowTrainingJobModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Configure Training Job
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
            {trainingJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No training jobs queued. Note: Training jobs require explicit dataset selection and parameter review.
              </div>
            ) : (
              trainingJobs.map((job) => (
                <div key={job.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900">{job.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                        {job.model_version}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
                        {job.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-1">
                      <span>Dataset: <strong>{job.dataset_version}</strong></span>
                      <span>Type: <strong>{job.training_type}</strong></span>
                      <span>Base: <strong>{job.base_model}</strong></span>
                      <span>Created: <strong>{new Date(job.created_at).toLocaleDateString()}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: BUILD DATASET */}
      {showBuildDatasetModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-300">
            <h3 className="text-base font-bold font-serif-editorial text-stone-900">Build New Dataset Release</h3>
            <form onSubmit={handleBuildDataset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Dataset Version Name</label>
                <input
                  type="text"
                  value={datasetVersionInput}
                  onChange={(e) => setDatasetVersionInput(e.target.value)}
                  placeholder="e.g. IKSHOVIA-MAINS-v0.1"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Release Description</label>
                <textarea
                  rows={2}
                  value={datasetDescInput}
                  onChange={(e) => setDatasetDescInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuildDatasetModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
                >
                  Compile & Export JSONL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUILD BENCHMARK */}
      {showBuildBenchmarkModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-300">
            <h3 className="text-base font-bold font-serif-editorial text-stone-900">Build Locked Benchmark</h3>
            <form onSubmit={handleBuildBenchmark} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Benchmark Name</label>
                <input
                  type="text"
                  value={benchNameInput}
                  onChange={(e) => setBenchNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Version</label>
                <input
                  type="text"
                  value={benchVersionInput}
                  onChange={(e) => setBenchVersionInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuildBenchmarkModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg"
                >
                  Lock Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER MODEL */}
      {showRegisterModelModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-300">
            <h3 className="text-base font-bold font-serif-editorial text-stone-900">Register Model Candidate</h3>
            <form onSubmit={handleRegisterModel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Model ID</label>
                <input
                  type="text"
                  value={modelIdInput}
                  onChange={(e) => setModelIdInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={modelNameInput}
                  onChange={(e) => setModelNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={modelVersionInput}
                    onChange={(e) => setModelVersionInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Base Model</label>
                  <input
                    type="text"
                    value={modelBaseInput}
                    onChange={(e) => setModelBaseInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModelModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE TRAINING JOB */}
      {showTrainingJobModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-300">
            <h3 className="text-base font-bold font-serif-editorial text-stone-900">Configure Fine-Tuning Job</h3>
            <form onSubmit={handleCreateTrainingJob} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Dataset Release</label>
                <select
                  value={selectedDsVersion}
                  onChange={(e) => setSelectedDsVersion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white font-mono"
                  required
                >
                  {datasets.map(d => (
                    <option key={d.version_name} value={d.version_name}>
                      {d.version_name} ({d.total_examples} examples)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Target Model Version</label>
                <input
                  type="text"
                  value={jobModelVersion}
                  onChange={(e) => setJobModelVersion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                  required
                />
              </div>
              <p className="text-xs text-stone-500 leading-tight">
                Safety Note: Training jobs are queued and require explicit compute cluster provisioning. Production evaluations remain on the generic evaluator until verified.
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrainingJobModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
                >
                  Queue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DATASET SNAPSHOT (PHASE 4.1D) */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-300">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-700" />
                Create Dataset Snapshot (Phase 4.1D)
              </h3>
            </div>
            <p className="text-xs text-stone-600">
              Captures all currently verified ground-truth training candidates into a versioned archive with cryptographic checksum and benchmark isolation.
            </p>
            <form onSubmit={handleCreateSnapshot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Version Identifier</label>
                <input
                  type="text"
                  value={snapshotVersionInput}
                  onChange={(e) => setSnapshotVersionInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg font-mono"
                  placeholder="e.g. IKSHOVIA-MAINS-SNAPSHOT-v0.2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Snapshot Description</label>
                <textarea
                  value={snapshotDescInput}
                  onChange={(e) => setSnapshotDescInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  placeholder="e.g. Curated Phase 4.1D training snapshot"
                  required
                />
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="font-semibold text-stone-800">Snapshot Integrity Guarantee:</div>
                <div>• Zero benchmark overlap (anti-leakage enforced)</div>
                <div>• Duplicate answers collapsed via normalized SHA-256</div>
                <div>• Zero learner PII stored in payload</div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  Create Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE RELEASE CANDIDATE (PHASE 4.1E) */}
      {showRcModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Create Release Candidate (Phase 4.1E)</span>
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Packages all verified training-eligible candidate answers into an audited release candidate with deterministic SHA-256 checksum, benchmark leakage checks, and multidimensional quality report.
            </p>
            <form onSubmit={handleCreateReleaseCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Release Candidate Version</label>
                <input
                  type="text"
                  value={rcVersionInput}
                  onChange={(e) => setRcVersionInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. IKSHOVIA-RC-v0.1"
                  required
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="font-semibold text-stone-800">Pre-Release Quality Gates:</div>
                <div>• Zero benchmark contamination verification</div>
                <div>• Automated learner PII sanitization audit</div>
                <div>• 12-criterion quality scorecard calculation</div>
                <div>• Deterministic SHA-256 checksum generation</div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRcModal(false)}
                  className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Create Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW VALIDATION REPORT MARKDOWN */}
      {selectedRcReport && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Release Candidate Validation Report</span>
              </h3>
              <button
                onClick={() => setSelectedRcReport(null)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <pre className="text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
                {selectedRcReport}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 font-mono">IKSHOVIA Audited Release Candidate</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedRcReport);
                  alert('Validation report copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Copy Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW RELEASE CANDIDATE MANIFEST */}
      {selectedManifest && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Release Candidate Manifest</span>
                </h3>
                <span className="text-xs text-stone-500 font-mono">ID: {selectedManifest.release_candidate_id}</span>
              </div>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {/* Core Manifest Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-bold">Evaluated Answers</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{selectedManifest.total_answers_evaluated ?? 0}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-bold">Passed Candidates</span>
                  <span className="text-lg font-bold font-mono text-emerald-900">{selectedManifest.passed_answers ?? 0}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 uppercase tracking-wider block font-bold">Excluded Answers</span>
                  <span className="text-lg font-bold font-mono text-rose-900">{selectedManifest.excluded_answers ?? 0}</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-purple-700 uppercase tracking-wider block font-bold">Training Gate</span>
                  <span className="text-xs font-bold font-mono text-purple-900 block mt-1">
                    {selectedManifest.training_eligibility_status || 'STILL_LOCKED'}
                  </span>
                </div>
              </div>

              {/* Hashes & Signatures */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-stone-500">SHA-256 Checksum:</span>
                  <span className="text-stone-900 font-bold break-all">{selectedManifest.sha256_checksum}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-stone-500">Dataset Signature:</span>
                  <span className="text-emerald-700 font-bold break-all">{selectedManifest.dataset_signature}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-stone-500">Git Commit / Build:</span>
                  <span className="text-stone-700">{selectedManifest.git_commit}</span>
                </div>
              </div>

              {/* Exclusion Reasons */}
              {selectedManifest.exclusion_reasons && (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-800 text-xs block">Exclusion Audit Breakdown</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(selectedManifest.exclusion_reasons).map(([k, v]: [string, any]) => (
                      <div key={k} className="p-2 bg-white rounded-lg border border-stone-200 flex justify-between">
                        <span className="text-stone-600 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-bold font-mono text-stone-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paper Breakdown */}
              {selectedManifest.paper_breakdown && (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-800 text-xs block">Paper Coverage Breakdown (Passed / Total)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(selectedManifest.paper_breakdown).map(([paper, stats]: [string, any]) => (
                      <div key={paper} className="p-2 bg-white rounded-lg border border-stone-200">
                        <span className="font-bold text-stone-900 block">{paper}</span>
                        <span className="font-mono text-stone-600 text-[11px]">{stats.passed} / {stats.total} passed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON inspection toggle */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-900 text-stone-100 font-mono text-[10px] overflow-x-auto max-h-48">
                <pre>{JSON.stringify(selectedManifest, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 font-mono">Certified Manifest Signature</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedManifest, null, 2));
                  alert('Manifest copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Copy Manifest JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit3,
  Gavel,
  Scale,
  TrendingUp,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  X,
  Lock,
  ChevronRight,
  ArrowRight,
  Database,
  BarChart2,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const MainsDatasetOperationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'REVIEWS' | 'SLA' | 'WORKLOAD' | 'CALIBRATION' | 'DOUBLE_REVIEW' | 'ADJUDICATION' | 'OCR' | 'GROWTH' | 'SAFETY_GATE'
  >('OVERVIEW');

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [growthTrends, setGrowthTrends] = useState<any>(null);
  const [safetyGate, setSafetyGate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Review Queue state
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL');
  const [reviewPaperFilter, setReviewPaperFilter] = useState('ALL');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  // Workload state
  const [workloadList, setWorkloadList] = useState<any[]>([]);

  // Double Review & Adjudication state
  const [doubleReviewData, setDoubleReviewData] = useState<any>(null);
  const [adjudicationQueue, setAdjudicationQueue] = useState<any[]>([]);
  const [selectedAdjudication, setSelectedAdjudication] = useState<any | null>(null);
  const [adjudicationScore, setAdjudicationScore] = useState<number>(0);
  const [adjudicationFeedback, setAdjudicationFeedback] = useState<string>('');
  const [adjudicationNotes, setAdjudicationNotes] = useState<string>('');
  const [adjudicating, setAdjudicating] = useState(false);

  // OCR Queue state
  const [ocrItems, setOcrItems] = useState<any[]>([]);
  const [ocrStatusFilter, setOcrStatusFilter] = useState('REVIEW_REQUIRED');
  const [selectedOcrItem, setSelectedOcrItem] = useState<any | null>(null);
  const [correctedOcrText, setCorrectedOcrText] = useState<string>('');
  const [savingOcr, setSavingOcr] = useState(false);

  // Calibration Loop state
  const [calibrationCases, setCalibrationCases] = useState<any[]>([]);
  const [selectedCalibCase, setSelectedCalibCase] = useState<any | null>(null);
  const [calibAssignedMarks, setCalibAssignedMarks] = useState<number>(0);
  const [calibRubricScores, setCalibRubricScores] = useState<Record<string, number>>({});
  const [calibFeedback, setCalibFeedback] = useState<string>('');
  const [calibPerformance, setCalibPerformance] = useState<any>(null);
  const [submittingCalib, setSubmittingCalib] = useState(false);
  const [calibAttemptResult, setCalibAttemptResult] = useState<any | null>(null);

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'OVERVIEW') {
        const [ov, sg] = await Promise.all([
          api.getAdminMainsOperationsOverview(),
          api.getAdminMainsOperationsTrainingGate()
        ]);
        setOverview(ov);
        setSafetyGate(sg);
      } else if (activeTab === 'REVIEWS' || activeTab === 'SLA') {
        const res = await api.getAdminMainsOperationsReviews({
          status: reviewStatusFilter !== 'ALL' ? reviewStatusFilter : undefined,
          paper: reviewPaperFilter !== 'ALL' ? reviewPaperFilter : undefined,
          page: reviewPage,
          limit: 15
        });
        setReviewItems(res.items || []);
        setReviewTotalPages(res.totalPages || 1);
        if (activeTab === 'SLA' && !overview) {
          const ov = await api.getAdminMainsOperationsOverview();
          setOverview(ov);
        }
      } else if (activeTab === 'WORKLOAD') {
        const list = await api.getAdminMainsOperationsWorkload();
        setWorkloadList(list || []);
      } else if (activeTab === 'CALIBRATION') {
        const [cases, perf] = await Promise.all([
          api.getMainsOperationsCalibrationCases(),
          api.getMainsOperationsCalibrationPerformance()
        ]);
        setCalibrationCases(cases || []);
        setCalibPerformance(perf);
      } else if (activeTab === 'DOUBLE_REVIEW') {
        const data = await api.getAdminMainsOperationsDoubleReviews();
        setDoubleReviewData(data);
      } else if (activeTab === 'ADJUDICATION') {
        const queue = await api.getAdminMainsOperationsAdjudicationQueue();
        setAdjudicationQueue(queue || []);
      } else if (activeTab === 'OCR') {
        const res = await api.getMainsOperationsOcrQueue({
          status: ocrStatusFilter,
          limit: 20
        });
        setOcrItems(res.items || []);
      } else if (activeTab === 'GROWTH') {
        const trends = await api.getAdminMainsOperationsGrowthTrends();
        setGrowthTrends(trends);
      } else if (activeTab === 'SAFETY_GATE') {
        const sg = await api.getAdminMainsOperationsTrainingGate();
        setSafetyGate(sg);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load operational data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjudication = (item: any) => {
    setSelectedAdjudication(item);
    const avgScore = Number(((item.facultyA.score + item.facultyB.score) / 2).toFixed(1));
    setAdjudicationScore(avgScore);
    setAdjudicationFeedback(`Adjudicated consensus score established after resolving ${item.percentageDifference}% divergence.`);
    setAdjudicationNotes('Senior Board verified rubric criteria and established final calibrated ground truth.');
  };

  const handleSubmitAdjudication = async () => {
    if (!selectedAdjudication) return;
    setAdjudicating(true);
    setError(null);
    try {
      const mergedDims: Record<string, number> = {};
      const dimsA = selectedAdjudication.facultyA.dimensions || {};
      const dimsB = selectedAdjudication.facultyB.dimensions || {};
      const allKeys = Array.from(new Set([...Object.keys(dimsA), ...Object.keys(dimsB)]));
      for (const k of allKeys) {
        mergedDims[k] = Number((((Number(dimsA[k]) || 0) + (Number(dimsB[k]) || 0)) / 2).toFixed(1));
      }

      await api.submitMainsOperationsAdjudication({
        submissionId: selectedAdjudication.submissionId,
        score: adjudicationScore,
        dimensions: mergedDims,
        feedback: adjudicationFeedback,
        notes: adjudicationNotes
      });

      setSelectedAdjudication(null);
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Failed to submit adjudication');
    } finally {
      setAdjudicating(false);
    }
  };

  const handleOpenOcrVerify = (item: any) => {
    setSelectedOcrItem(item);
    setCorrectedOcrText(item.extractedText || item.originalOcrText || '');
  };

  const handleSaveOcr = async () => {
    if (!selectedOcrItem || !correctedOcrText.trim()) return;
    setSavingOcr(true);
    setError(null);
    try {
      await api.verifyMainsOperationsOcr({
        submissionId: selectedOcrItem.submissionId,
        correctedText: correctedOcrText.trim()
      });
      setSelectedOcrItem(null);
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Failed to verify OCR text');
    } finally {
      setSavingOcr(false);
    }
  };

  const handleStartCalibCase = (cCase: any) => {
    setSelectedCalibCase(cCase);
    setCalibAssignedMarks(cCase.maxMarks * 0.5);
    const initialDims: Record<string, number> = {};
    const gtDims = cCase.groundTruth?.dimensions || {};
    for (const k of Object.keys(gtDims)) {
      initialDims[k] = 3.0;
    }
    setCalibRubricScores(initialDims);
    setCalibFeedback('');
    setCalibAttemptResult(null);
  };

  const handleSubmitCalibAttempt = async () => {
    if (!selectedCalibCase) return;
    setSubmittingCalib(true);
    setError(null);
    try {
      const res = await api.submitMainsOperationsCalibrationAttempt({
        submissionId: selectedCalibCase.submissionId,
        assignedMarks: Number(calibAssignedMarks),
        rubricScores: calibRubricScores,
        feedback: calibFeedback
      });
      setCalibAttemptResult(res.attempt);
      const perf = await api.getMainsOperationsCalibrationPerformance();
      setCalibPerformance(perf);
    } catch (err: any) {
      setError(err.message || 'Failed to record calibration attempt');
    } finally {
      setSubmittingCalib(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-700 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PHASE 4.1F OPERATIONS
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              ZERO MODEL TRAINING ENFORCED
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Mains Dataset Operations & Calibration Loop
          </h2>
          <p className="text-sm text-slate-400">
            Real-time pipeline monitoring: real learner submissions → AI eval → faculty review → calibration → dataset growth → release candidates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTabContent()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Operational Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { key: 'OVERVIEW', label: 'Operations Overview', icon: Activity },
          { key: 'REVIEWS', label: 'Review Queue', icon: FileCheck },
          { key: 'SLA', label: 'SLA / Age Tracking', icon: Clock },
          { key: 'WORKLOAD', label: 'Faculty Workload', icon: Users },
          { key: 'CALIBRATION', label: 'Calibration Loop', icon: Scale },
          { key: 'DOUBLE_REVIEW', label: 'Double Review', icon: Layers },
          { key: 'ADJUDICATION', label: 'Adjudication Queue', icon: Gavel },
          { key: 'OCR', label: 'OCR Operations', icon: Edit3 },
          { key: 'GROWTH', label: 'Dataset Growth', icon: TrendingUp },
          { key: 'SAFETY_GATE', label: 'Training Safety Gate', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. OPERATIONS OVERVIEW TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'OVERVIEW' && overview && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Pending Reviews</span>
              <div className="text-2xl font-bold text-white mt-1">{overview.pendingFacultyReviews}</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{overview.overdueReviews} overdue (&gt;48h)</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Completed Reviews</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{overview.completedFacultyReviews}</div>
              <div className="text-xs text-slate-400 mt-2">Ground-truth verified answers</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Double Review Consensus</span>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {overview.doubleReviewQueue?.completed || 0}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {overview.doubleReviewQueue?.pending || 0} pending 2nd evaluation
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Adjudication Queue</span>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {overview.adjudicationQueue?.pending || 0}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {overview.adjudicationQueue?.completed || 0} senior board resolved
              </div>
            </div>
          </div>

          {/* Operational Health Flags */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Automated Operational Health Flags
              </h3>
              <span className="text-xs text-slate-400">Evaluated against configured thresholds</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(overview.healthFlags || []).map((flag: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    flag.active
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  {flag.active ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider">{flag.flag}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        flag.active ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {flag.active ? 'TRIGGERED' : 'HEALTHY'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-slate-300">{flag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OCR & Quarantine Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Handwritten OCR Pipeline Status
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Handwritten</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {overview.ocrQueue?.totalHandwritten || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Review Required</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">
                    {overview.ocrQueue?.reviewRequired || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Avg Confidence</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {overview.ocrQueue?.averageConfidence || 0}%
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Quarantine Submissions Status
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Quarantined</div>
                  <div className="text-lg font-bold text-rose-400 mt-0.5">
                    {overview.quarantinedRecords?.total || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Restored</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {overview.quarantinedRecords?.resolvedRestored || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Excluded</div>
                  <div className="text-lg font-bold text-slate-400 mt-0.5">
                    {overview.quarantinedRecords?.permanentlyExcluded || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REVIEW OPERATIONS QUEUE TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'REVIEWS' && (
        <div className="space-y-4">
          {/* Queue Filters */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Status Filter</label>
                <select
                  value={reviewStatusFilter}
                  onChange={e => {
                    setReviewStatusFilter(e.target.value);
                    setReviewPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="OVERDUE">OVERDUE (&gt;48h)</option>
                  <option value="ADJUDICATION_REQUIRED">ADJUDICATION_REQUIRED</option>
                  <option value="OCR_REVIEW_REQUIRED">OCR_REVIEW_REQUIRED</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Paper Filter</label>
                <select
                  value={reviewPaperFilter}
                  onChange={e => {
                    setReviewPaperFilter(e.target.value);
                    setReviewPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Papers</option>
                  <option value="GS1">GS1</option>
                  <option value="GS2">GS2</option>
                  <option value="GS3">GS3</option>
                  <option value="GS4">GS4</option>
                  <option value="ESSAY">ESSAY</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => loadTabContent()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>

          {/* Review Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Submission ID</th>
                  <th className="p-3">Paper / Subject</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">AI / Faculty Marks</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Reviewer</th>
                  <th className="p-3">Age / SLA</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviewItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No review items found for current filters.
                    </td>
                  </tr>
                ) : (
                  reviewItems.map((item: any) => (
                    <tr key={item.submission_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono font-medium text-slate-300">
                        {item.submission_id.substring(0, 14)}...
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-white">{item.paper}</span>
                        <div className="text-[11px] text-slate-400">{item.subject}</div>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-300" title={item.question}>
                        {item.question}
                      </td>
                      <td className="p-3 font-mono">
                        <span className="text-blue-400">AI: {item.marks?.ai ?? '-'}</span>
                        <span className="mx-1 text-slate-600">/</span>
                        <span className="text-emerald-400">Fac: {item.marks?.faculty ?? '-'}</span>
                        <span className="text-slate-500"> ({item.marks?.max}m)</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.answer_type === 'HANDWRITTEN_IMAGE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.answer_type === 'HANDWRITTEN_IMAGE' ? 'HANDWRITTEN' : 'TYPED'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {item.reviewer?.name || <span className="text-slate-500">Unassigned</span>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.age_hours > 72
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.age_hours > 48
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.sla_bracket} ({item.age_hours}h)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.status === 'ADJUDICATION_REQUIRED'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. SLA / AGE TRACKING TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'SLA' && overview && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Review Age Distribution (SLA Brackets)
            </h3>
            <p className="text-xs text-slate-400">
              Tracks elapsed time since submission for unreviewed answers. Operational thresholds: 24h, 48h, 72h.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="text-xs font-semibold text-emerald-400">&lt; 24 Hours</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {overview.reviewsBySla?.under24h || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Within standard turnaround</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30">
                <span className="text-xs font-semibold text-blue-400">24–48 Hours</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {overview.reviewsBySla?.hours24to48 || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Normal active review phase</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
                <span className="text-xs font-semibold text-amber-400">48–72 Hours</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {overview.reviewsBySla?.hours48to72 || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Approaching overdue threshold</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30">
                <span className="text-xs font-semibold text-rose-400">&gt; 72 Hours</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {overview.reviewsBySla?.over72h || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Critical escalation required</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. FACULTY WORKLOAD MANAGEMENT TAB (STRICTLY NO RANKING) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'WORKLOAD' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Faculty Workload & Throughput (Strictly Factual Measurements)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays objective throughput only. Strict anti-ranking policy: no evaluators are labeled "best" or "worst".
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Faculty Evaluator</th>
                  <th className="p-3">Active Reviews</th>
                  <th className="p-3">Pending</th>
                  <th className="p-3">Completed Today</th>
                  <th className="p-3">Completed This Week</th>
                  <th className="p-3">Avg Duration</th>
                  <th className="p-3">Double Reviews</th>
                  <th className="p-3">Adjudications</th>
                  <th className="p-3">Sample Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workloadList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      No faculty workload records available.
                    </td>
                  </tr>
                ) : (
                  workloadList.map((w: any) => (
                    <tr key={w.evaluatorId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{w.evaluatorName}</td>
                      <td className="p-3 font-mono">{w.activeAssignments}</td>
                      <td className="p-3 font-mono">{w.pendingAssignments}</td>
                      <td className="p-3 font-mono text-emerald-400">{w.completedToday}</td>
                      <td className="p-3 font-mono text-blue-400">{w.completedThisWeek}</td>
                      <td className="p-3 font-mono text-slate-300">
                        {w.averageReviewDurationSeconds > 0
                          ? `${Math.round(w.averageReviewDurationSeconds / 60)} min`
                          : '-'}
                      </td>
                      <td className="p-3 font-mono">{w.doubleReviewCount}</td>
                      <td className="p-3 font-mono">{w.adjudicationParticipation}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {w.status === 'VALID' ? 'VALID' : 'INSUFFICIENT_DATA'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. CALIBRATION LOOP & DRIFT TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'CALIBRATION' && (
        <div className="space-y-6">
          {/* Performance & Drift Header */}
          {calibPerformance && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Evaluator Calibration & Drift Performance
                </h3>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  calibPerformance.driftStatus === 'STABLE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : calibPerformance.driftStatus === 'WATCH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  Drift Status: {calibPerformance.driftStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center pt-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Attempts</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {calibPerformance.totalAttempts}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Avg Mark Diff</span>
                  <div className="text-xl font-bold text-blue-400 mt-0.5">
                    {calibPerformance.averageMarkDifference}m
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Rubric Agreement</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    {calibPerformance.rubricAgreementPercentage}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Tier Match</span>
                  <div className="text-xl font-bold text-purple-400 mt-0.5">
                    {calibPerformance.tierAgreementPercentage}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real Calibration Cases from Ground Truth */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">
              Real Ground-Truth Calibration Cases (Covering WEAK, AVERAGE, STRONG, EXCELLENT)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calibrationCases.map((c: any) => (
                <div key={c.submissionId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{c.paper} &bull; {c.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.performanceTier === 'EXCELLENT' ? 'bg-emerald-500/20 text-emerald-400' :
                      c.performanceTier === 'STRONG' ? 'bg-blue-500/20 text-blue-400' :
                      c.performanceTier === 'AVERAGE' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      TIER: {c.performanceTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium line-clamp-2">{c.question}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-3 bg-slate-950 p-2 rounded border border-slate-800">
                    {c.studentAnswer}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono text-slate-400">
                      GT Score: {c.groundTruth?.marksObtained} / {c.maxMarks}m
                    </span>
                    <button
                      onClick={() => handleStartCalibCase(c)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Enter Calibration Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Calibration Session Modal */}
          {selectedCalibCase && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Calibration Session</h3>
                    <p className="text-xs text-slate-400">
                      Isolated evaluation attempt. Production ground truth remains immutable.
                    </p>
                  </div>
                  <button onClick={() => setSelectedCalibCase(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Question</span>
                  <p className="text-sm font-medium text-white">{selectedCalibCase.question}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Student Answer</span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedCalibCase.studentAnswer}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Assigned Marks (Max {selectedCalibCase.maxMarks}m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={selectedCalibCase.maxMarks}
                      value={calibAssignedMarks}
                      onChange={e => setCalibAssignedMarks(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Feedback</label>
                    <input
                      type="text"
                      value={calibFeedback}
                      onChange={e => setCalibFeedback(e.target.value)}
                      placeholder="Calibration assessment notes"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {calibAttemptResult && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      Calibration Result Recorded (Isolated Storage)
                    </div>
                    <div>Difference from Ground Truth: {calibAttemptResult.marks_diff}m ({calibAttemptResult.pct_diff}%)</div>
                    <div>Rubric Agreement: {calibAttemptResult.rubric_agreement_pct}%</div>
                    <div>Performance Tier Match: {calibAttemptResult.performance_tier_match ? 'MATCHED' : 'DIVERGED'}</div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedCalibCase(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSubmitCalibAttempt}
                    disabled={submittingCalib}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {submittingCalib ? 'Recording...' : 'Submit Calibration Evaluation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. DOUBLE REVIEW OPERATIONS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'DOUBLE_REVIEW' && doubleReviewData && (
        <div className="space-y-6">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Total Double Reviews</span>
              <div className="text-2xl font-bold text-white mt-1">
                {doubleReviewData.summary.totalDoubleReviews}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {doubleReviewData.summary.pendingFacultyB} awaiting Reviewer B
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Exact Agreement Rate</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {doubleReviewData.summary.exactAgreementPct}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {doubleReviewData.summary.exactAgreementCount} exact matches
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Avg Mark Difference</span>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {doubleReviewData.summary.averageAbsoluteDifference}m
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {doubleReviewData.summary.averagePercentageDifference}% average gap
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Adjudication Rate</span>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {doubleReviewData.summary.adjudicationRatePct}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {doubleReviewData.summary.escalatedToAdjudication} escalated cases
              </div>
            </div>
          </div>

          {/* Double Review Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Paper / Subject</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Faculty A</th>
                  <th className="p-3">Faculty B</th>
                  <th className="p-3">Mark Diff</th>
                  <th className="p-3">Rubric Agree</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(doubleReviewData.items || []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-white">{item.paper}</span>
                      <div className="text-[11px] text-slate-400">{item.subject}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-300" title={item.question}>
                      {item.question}
                    </td>
                    <td className="p-3 font-mono">
                      {item.facultyA.name || 'Faculty A'}: <span className="text-emerald-400 font-bold">{item.facultyA.score ?? '-'}m</span>
                    </td>
                    <td className="p-3 font-mono">
                      {item.facultyB.name || 'Faculty B'}: <span className="text-blue-400 font-bold">{item.facultyB.score ?? '-'}m</span>
                    </td>
                    <td className="p-3 font-mono">
                      {item.markDifference != null ? `${item.markDifference}m (${item.percentageDifference}%)` : '-'}
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {item.rubricAgreementPct != null ? `${item.rubricAgreementPct}%` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.status === 'ADJUDICATED' ? 'bg-blue-500/20 text-blue-400' :
                        item.status === 'ADJUDICATION_REQUIRED' || item.status === 'ESCALATED_TO_ADJUDICATION' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. ADJUDICATION QUEUE TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ADJUDICATION' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-purple-400" />
                Senior Evaluator Adjudication Queue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cases with major inter-rater disagreement (&gt;20% mark difference). Senior board decision establishes resolved ground truth.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {adjudicationQueue.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="font-semibold text-white">Adjudication Queue is Clean</div>
                <p className="text-xs text-slate-500 mt-1">No double review cases currently require senior board escalation.</p>
              </div>
            ) : (
              adjudicationQueue.map((item: any) => (
                <div key={item.submissionId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.paper}</span>
                        <span className="text-xs text-slate-400">&bull; {item.subject}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">Submission: {item.submissionId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                        {item.percentageDifference}% Mark Divergence
                      </span>
                      <button
                        onClick={() => handleOpenAdjudication(item)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        Adjudicate
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-200">{item.question}</p>

                  {/* Independent Evaluator Scores Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                        <span>Faculty Evaluator A: {item.facultyA.name}</span>
                        <span className="text-base font-bold font-mono">{item.facultyA.score} / {item.maxMarks}m</span>
                      </div>
                      <p className="text-xs text-slate-400 italic">"{item.facultyA.feedback || 'No written feedback'}"</p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                        <span>Faculty Evaluator B: {item.facultyB.name}</span>
                        <span className="text-base font-bold font-mono">{item.facultyB.score} / {item.maxMarks}m</span>
                      </div>
                      <p className="text-xs text-slate-400 italic">"{item.facultyB.feedback || 'No written feedback'}"</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Adjudication Modal */}
          {selectedAdjudication && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-purple-400" />
                      Senior Board Adjudication
                    </h3>
                    <p className="text-xs text-slate-400">Establish authoritative ground truth for this submission.</p>
                  </div>
                  <button onClick={() => setSelectedAdjudication(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400 font-semibold">Divergence Summary</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">Evaluator A: {selectedAdjudication.facultyA.score}m</span>
                    <span className="text-blue-400">Evaluator B: {selectedAdjudication.facultyB.score}m</span>
                    <span className="text-purple-400 font-bold">Diff: {selectedAdjudication.percentageDifference}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Authoritative Final Score (Max {selectedAdjudication.maxMarks}m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={selectedAdjudication.maxMarks}
                    value={adjudicationScore}
                    onChange={e => setAdjudicationScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Senior Evaluator Feedback</label>
                  <textarea
                    rows={3}
                    value={adjudicationFeedback}
                    onChange={e => setAdjudicationFeedback(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Board Internal Notes</label>
                  <input
                    type="text"
                    value={adjudicationNotes}
                    onChange={e => setAdjudicationNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedAdjudication(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAdjudication}
                    disabled={adjudicating}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {adjudicating ? 'Saving...' : 'Finalize Calibrated Ground Truth'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. OCR OPERATIONS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'OCR' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Handwritten OCR Quality Queue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review low-confidence extractions, edit transcriptions, and mark verified.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={ocrStatusFilter}
                onChange={e => setOcrStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
              >
                <option value="REVIEW_REQUIRED">Review Required (&lt;70% or unapproved)</option>
                <option value="LOW_CONFIDENCE">Low Confidence (&lt;60%)</option>
                <option value="APPROVED">Verified &amp; Approved</option>
                <option value="OCR_PENDING">Pending OCR</option>
              </select>
              <button
                onClick={() => loadTabContent()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ocrItems.length === 0 ? (
              <div className="col-span-2 p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500">
                No OCR review items found for current filter.
              </div>
            ) : (
              ocrItems.map((item: any) => (
                <div key={item.submissionId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.paper} &bull; {item.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.ocrConfidence >= 0.80 ? 'bg-emerald-500/20 text-emerald-400' :
                      item.ocrConfidence >= 0.60 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      Confidence: {Math.round(item.ocrConfidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1">{item.question}</p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {item.extractedText}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      {item.ocrApproved ? 'Verified by Evaluator' : 'Requires Human Verification'}
                    </span>
                    <button
                      onClick={() => handleOpenOcrVerify(item)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      Verify / Edit Text
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* OCR Verification Modal */}
          {selectedOcrItem && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Manual OCR Correction & Verification</h3>
                  <button onClick={() => setSelectedOcrItem(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Question</span>
                  <p className="text-xs text-slate-200">{selectedOcrItem.question}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Extracted Answer Text</label>
                  <textarea
                    rows={8}
                    value={correctedOcrText}
                    onChange={e => setCorrectedOcrText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedOcrItem(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOcr}
                    disabled={savingOcr}
                    className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-500 disabled:opacity-50"
                  >
                    {savingOcr ? 'Saving...' : 'Mark OCR Verified & Update Answer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 9. DATASET GROWTH TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'GROWTH' && growthTrends && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Dataset Growth & Daily Ingestion Timeline
            </h3>

            {/* Daily Trends Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">New Candidate Answers</th>
                    <th className="p-2.5">Faculty Ground Truth Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(growthTrends.dailyTrends || []).map((d: any) => (
                    <tr key={d.date} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-white font-sans">{d.date}</td>
                      <td className="p-2.5 text-blue-400">+{d.submissions}</td>
                      <td className="p-2.5 text-emerald-400">+{d.groundTruth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paper & Tier Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-white">Paper Distribution Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(growthTrends.paperDistribution || {}).map(([paper, count]: [string, any]) => (
                  <div key={paper} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="font-semibold text-white">{paper}</span>
                    <span className="font-mono text-blue-400 font-bold">{count} answers</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-white">Performance Tier Distribution</h4>
              <div className="space-y-2">
                {Object.entries(growthTrends.tierDistribution || {}).map(([tier, count]: [string, any]) => (
                  <div key={tier} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950 border border-slate-800">
                    <span className={`font-semibold ${
                      tier === 'EXCELLENT' ? 'text-emerald-400' :
                      tier === 'STRONG' ? 'text-blue-400' :
                      tier === 'AVERAGE' ? 'text-amber-400' :
                      'text-rose-400'
                    }`}>
                      {tier}
                    </span>
                    <span className="font-mono text-white font-bold">{count} answers</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10. TRAINING SAFETY GATE TAB (HARD GATE AUDIT) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'SAFETY_GATE' && safetyGate && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className={`p-6 rounded-2xl border ${
            safetyGate.gateStatus === 'EXPORT_ALLOWED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          } space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold">
                {safetyGate.gateStatus === 'EXPORT_ALLOWED' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                )}
                <span>TRAINING EXPORT SAFETY GATE: {safetyGate.gateStatus}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-700 text-white">
                CRITICAL: ZERO TRAINING ACTIVE
              </span>
            </div>
            <p className="text-sm text-slate-300">{safetyGate.summary}</p>
          </div>

          {/* Hard Gates Audit Grid */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white">
              8 Mandatory Hard Quality Gates
            </h3>
            <p className="text-xs text-slate-400">
              Every single gate must strictly pass before a dataset release candidate can be certified for future model training export.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {Object.entries(safetyGate.hardGates || {}).map(([gateKey, gate]: [string, any]) => (
                <div
                  key={gateKey}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    gate.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  {gate.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{gateKey}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        gate.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {gate.passed ? 'PASSED' : 'BLOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{gate.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blocking Reasons if Any */}
          {safetyGate.blockingReasons && safetyGate.blockingReasons.length > 0 && (
            <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Active Blocking Violations ({safetyGate.blockingReasons.length})
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-200">
                {safetyGate.blockingReasons.map((reason: string, idx: number) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

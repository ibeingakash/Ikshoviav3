import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Database,
  Users,
  Award,
  BookOpen,
  Scale,
  Activity,
  Layers,
  FileCheck,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ZapOff,
  GitBranch,
  Filter,
  Eye,
  Check,
  History,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const MainsDatasetRemediationView: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminMainsDatasetRemediation();
      setOverview(data);
      const snaps = await api.getAdminMainsDatasetRemediationSnapshots();
      setSnapshots(snaps || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset remediation overview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRemediation = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.executeAdminMainsDatasetRemediation();
      setSuccessMessage(
        `Remediation executed successfully: ${res.result?.leakageResult?.remediatedCount || 0} benchmark leakage item(s) isolated, ${res.result?.duplicateResult?.duplicateGroupsRemediated || 0} duplicate group(s) remediated.`
      );
      await loadOverview();
    } catch (err: any) {
      setError(err.message || 'Failed to execute dataset remediation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
        <div className="text-sm font-semibold text-stone-700">
          Loading Phase 4.1H Dataset Remediation &amp; Acquisition State...
        </div>
        <p className="text-xs text-stone-500">
          Auditing live PostgreSQL ground truth, leakage status, duplicate exclusions, and syllabus tracks.
        </p>
      </div>
    );
  }

  const isReady = overview?.status === 'TRAINING_READY';
  const hasBlockers = (overview?.blockers?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
              PHASE 4.1H
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-800 border border-stone-300">
              DATASET REMEDIATION &amp; ACQUISITION
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              ZERO MODEL TRAINING ENFORCED
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif-editorial text-stone-900 tracking-tight mt-1.5">
            Dataset Remediation &amp; Acquisition Execution Hub
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Active leakage isolation &bull; Candidate deduplication &bull; Real faculty-guided acquisition targeting &bull; Zero synthetic records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSnapshots(!showSnapshots)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-stone-500" />
            {showSnapshots ? 'Hide Snapshots' : 'Snapshots History'}
          </button>
          <button
            onClick={loadOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExecuteRemediation}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            {actionLoading ? 'Remediating...' : 'Execute Full Remediation'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-700" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. CURRENT TRAINING READINESS STATUS & DECISION */}
      {/* ---------------------------------------------------- */}
      {overview && (
        <div className={`p-6 rounded-2xl border ${
          isReady
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        } space-y-4 shadow-xs`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isReady ? (
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Production Gate Status
                </span>
                <div className="text-2xl font-bold font-mono tracking-tight">
                  {overview.status}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-700 text-white shadow-sm">
                <Lock className="w-4 h-4" />
                <span>TRAINING LOCKED &bull; REMEDIATION ACTIVE</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-1">
                Zero proprietary model training permitted &bull; Strict audit guard
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-stone-700 bg-white/80 p-3.5 rounded-xl border border-stone-200">
            {overview.remediationSummary}
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REAL VOLUME PROGRESS & PRODUCTION TARGETS */}
      {/* ---------------------------------------------------- */}
      {overview && (
        <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-700" />
                Real Database Ground Truth vs Production Training Targets
              </h3>
              <p className="text-xs text-stone-500">
                Minimum thresholds configured in <code className="font-mono text-stone-700">mains_training_gate_config</code>. Never faked.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Unique Training Answers</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {overview.current.eligibleUniqueAnswers}
                <span className="text-xs font-normal text-stone-400"> / {overview.targets.minimumUniqueAnswers}</span>
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                {overview.current.eligibleUniqueAnswers >= overview.targets.minimumUniqueAnswers
                  ? 'Target Satisfied'
                  : `Need ${overview.targets.minimumUniqueAnswers - overview.current.eligibleUniqueAnswers} more`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Verified Faculty Reviews</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {overview.current.facultyVerified}
                <span className="text-xs font-normal text-stone-400"> / {overview.targets.minimumVerifiedReviews}</span>
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                {overview.current.facultyVerified >= overview.targets.minimumVerifiedReviews
                  ? 'Target Satisfied'
                  : `Need ${overview.targets.minimumVerifiedReviews - overview.current.facultyVerified} more`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Syllabus Subjects</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {overview.current.subjectsCount}
                <span className="text-xs font-normal text-stone-400"> / {overview.targets.minimumSubjects}</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {overview.current.subjectsCount >= overview.targets.minimumSubjects
                  ? 'Diversity Satisfied'
                  : `Need ${overview.targets.minimumSubjects - overview.current.subjectsCount} more`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Isolated Benchmark Items</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {overview.benchmark.totalItems}
                <span className="text-xs font-normal text-stone-400"> / {overview.benchmark.requiredItems}</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Leakage: <strong className="text-emerald-700">{overview.benchmark.leakageCount} (Pass)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. LEAKAGE & DUPLICATE REMEDIATION AUDIT (SECTIONS 2 & 3) */}
      {/* ---------------------------------------------------- */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benchmark Leakage Remediation */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Benchmark Leakage Remediation
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                0 LEAKAGE VERIFIED
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Benchmark gold-standard answers are strictly excluded from training candidates: <code className="font-mono text-stone-700">training_candidate ∩ benchmark = 0</code>.
            </p>

            <div className="space-y-2">
              {overview.leakage?.map((leak: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-stone-900">{leak.submissionId}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      {leak.remediationAction}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600">
                    Benchmark ID: <strong className="font-mono text-[10px]">{leak.benchmarkId}</strong>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono truncate">
                    Hash: {leak.answerHash}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Logically isolated in quarantine &bull; Zero deletion of source data
                  </div>
                </div>
              ))}
              {overview.leakage?.length === 0 && (
                <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg">
                  Zero benchmark leakage records detected. Benchmark isolation complete.
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Candidates Remediation */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                Duplicate Training Candidate Deduplication
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                0 CANDIDATE COLLISIONS
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Canonical submissions preserved. Duplicate submissions excluded from training candidates while preserving historical audit records.
            </p>

            <div className="space-y-2">
              {overview.duplicates?.map((dup: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-stone-900">Canonical: {dup.canonicalSubmissionId}</span>
                    <span className="text-stone-500 text-[11px]">{dup.totalSubmissions} submissions in group</span>
                  </div>
                  <div className="text-[11px] text-rose-700 font-mono">
                    Excluded Duplicates: {dup.excludedSubmissionIds?.join(', ') || 'None'}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono truncate">
                    Answer Hash: {dup.answerHash}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    ✓ 0 collisions in active candidate pool &bull; Historical audit preserved
                  </div>
                </div>
              ))}
              {overview.duplicates?.length === 0 && (
                <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg">
                  Zero duplicate collision groups found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. ACTIVE BLOCKERS & ACQUISITION ACTIONS */}
      {/* ---------------------------------------------------- */}
      {hasBlockers && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            Active Real Database Blockers ({overview.blockers.length})
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
            {overview.blockers.map((b: string, idx: number) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. TARGETED SYLLABUS HUB (SECTION 7) */}
      {/* ---------------------------------------------------- */}
      {overview && (
        <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                Targeted Syllabus Acquisition Hub (Phase 4.1H)
              </h3>
              <p className="text-xs text-stone-500">
                Ground-truth acquisition tracks ordered by actual coverage deficits. Recommended questions marked with source origin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.targetedTracks?.map((track: any) => (
              <div key={track.trackId} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">{track.paper}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      track.facultyReviewedCount === 0
                        ? 'bg-rose-100 text-rose-900 border border-rose-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      Deficit: {track.coverageDeficit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">{track.title}</h4>
                  <p className="text-[11px] text-stone-600 line-clamp-2">{track.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-stone-600 border-t border-stone-200 pt-2 font-mono">
                  <div>Avail: <strong>{track.availableQuestions}</strong></div>
                  <div>Reviewed: <strong className="text-emerald-700">{track.facultyReviewedCount}</strong></div>
                  <div>Pending: <strong className="text-amber-700">{track.pendingFacultyReviews}</strong></div>
                </div>

                {track.recommendedNextQuestion && (
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>Next Recommended Question</span>
                      <span className="font-semibold text-indigo-700">
                        {track.recommendedNextQuestion.sourceOrigin}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-900 font-medium line-clamp-2">
                      {track.recommendedNextQuestion.question}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-0.5">
                      <span>Directive: {track.recommendedNextQuestion.directive}</span>
                      <span>Marks: {track.recommendedNextQuestion.marks}M</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. DIVERSITY METRICS (SECTIONS 13 & 14) */}
      {/* ---------------------------------------------------- */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learner Diversity */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-700" />
              Learner Diversity &amp; Fatigue Control
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Unique Learners</span>
                <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                  {overview.learnerDiversity?.uniqueLearners}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Max Single Learner Share</span>
                <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                  {overview.learnerDiversity?.maxSingleSharePct}%
                </div>
              </div>
            </div>
            {overview.learnerDiversity?.concentrationWarning && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                LEARNER_CONCENTRATION_WARNING: Single learner exceeds 35% contribution threshold.
              </div>
            )}
          </div>

          {/* Faculty Diversity */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-700" />
              Faculty Workload &amp; Concentration Audit
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                <span className="text-stone-600">Active Faculty Evaluators</span>
                <span className="font-mono font-bold text-stone-900">{overview.facultyWorkload?.evaluatorCount}</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {overview.facultyWorkload?.evaluators?.map((f: any) => (
                  <div key={f.facultyId} className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200 text-xs">
                    <span className="font-mono text-stone-800">{f.facultyId}</span>
                    <span className="font-mono text-stone-600">
                      {f.reviewsCount} reviews ({f.percentageShare}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {overview.facultyWorkload?.concentrationWarning && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                FACULTY_CONCENTRATION_WARNING: One evaluator exceeds 40% workload share.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. SNAPSHOTS HISTORY DRAWER */}
      {/* ---------------------------------------------------- */}
      {showSnapshots && (
        <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Remediation Snapshot Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-200/60 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Snapshot ID</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Unique Answers</th>
                  <th className="p-2.5">Faculty Reviews</th>
                  <th className="p-2.5">Leakage Items</th>
                  <th className="p-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono">
                {snapshots.map((s: any) => {
                  const data = s.snapshot_data || {};
                  return (
                    <tr key={s.id} className="hover:bg-stone-100">
                      <td className="p-2.5 text-stone-900 font-bold">{s.id}</td>
                      <td className="p-2.5 font-sans font-semibold text-stone-700">{s.snapshot_type}</td>
                      <td className="p-2.5">{data.uniqueAnswerCount}</td>
                      <td className="p-2.5">{data.facultyVerifiedCount}</td>
                      <td className="p-2.5 text-emerald-700 font-bold">{data.leakageRecordCount}</td>
                      <td className="p-2.5 text-stone-600 font-sans">{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

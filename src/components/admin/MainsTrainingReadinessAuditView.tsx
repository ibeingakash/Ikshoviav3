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
  HelpCircle,
  ArrowRight,
  Sparkles,
  ZapOff,
  Download,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const MainsTrainingReadinessAuditView: React.FC = () => {
  const [audit, setAudit] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminMainsTrainingReadiness();
      setAudit(data);
      const hist = await api.getAdminMainsTrainingReadinessHistory(10);
      setHistory(hist || []);
    } catch (err: any) {
      setError(err.message || 'Failed to execute training readiness audit');
    } finally {
      setLoading(false);
    }
  };

  const exportJsonReport = () => {
    if (!audit) return;
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ikshovia-training-readiness-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMarkdownReport = () => {
    if (!audit) return;
    const passedGates = Object.values(audit.hardGates || {}).filter(g => g === 'PASS').length;
    const md = `# IKSHOVIA — PHASE 4.1G MAINS TRAINING READINESS AUDIT REPORT
**Generated At:** ${audit.generatedAt}
**Audit Status:** ${audit.status}
**Decision:** ${audit.status === 'TRAINING_READY' ? 'GO (Certified Eligible for Model Training)' : 'NO-GO (Model Training Strictly Prohibited)'}
**Hard Safety Gates:** ${passedGates} / 8 Passed

---

## 1. Executive Summary
${audit.summary}

---

## 2. Hard Safety Gates
| Gate | Status | Detail |
|---|---|---|
| Gate 1: Unadjudicated Double Reviews | ${audit.hardGates?.unadjudicatedDoubleReviews} | ${audit.hardGatesDetail?.unadjudicatedDoubleReviews?.message} |
| Gate 2: Pending Quarantines | ${audit.hardGates?.pendingQuarantines} | ${audit.hardGatesDetail?.pendingQuarantines?.message} |
| Gate 3: Benchmark Isolation | ${audit.hardGates?.benchmarkIsolation} | ${audit.hardGatesDetail?.benchmarkIsolation?.message} |
| Gate 4: PII Sanitization | ${audit.hardGates?.piiSafety} | ${audit.hardGatesDetail?.piiSafety?.message} |
| Gate 5: Rubric Completeness | ${audit.hardGates?.rubricCompleteness} | ${audit.hardGatesDetail?.rubricCompleteness?.message} |
| Gate 6: Faculty Ground Truth | ${audit.hardGates?.facultyGroundTruth} | ${audit.hardGatesDetail?.facultyGroundTruth?.message} |
| Gate 7: Duplicate Protection | ${audit.hardGates?.duplicateCheck} | ${audit.hardGatesDetail?.duplicateCheck?.message} |
| Gate 8: Signed Release Candidate | ${audit.hardGates?.signedReleaseCandidate} | ${audit.hardGatesDetail?.signedReleaseCandidate?.message} |

---

## 3. Dataset Volume & Thresholds Progress
- **Unique Training Answers:** ${audit.dataset?.eligibleUniqueAnswers} / ${audit.training?.configuredThresholds?.minimumUniqueAnswers} (Required)
- **Faculty Verified Reviews:** ${audit.dataset?.facultyVerified} / ${audit.training?.configuredThresholds?.minimumVerifiedReviews} (Required)
- **Subjects Represented:** ${Object.keys(audit.coverage?.subjects || {}).length} / ${audit.training?.configuredThresholds?.minimumSubjects} (Required)
- **Isolated Benchmark Items:** ${audit.benchmark?.items} / ${audit.training?.configuredThresholds?.minimumBenchmarkItems} (Required)
- **Benchmark Leakage:** ${audit.benchmark?.leakageCount} items
- **Duplicate Answer Rate:** ${audit.dataset?.duplicateRate}% (${audit.dataset?.duplicateAnswerHashes} collisions)
- **Unique Learners:** ${audit.dataset?.uniqueLearners}

---

## 4. Active Blocking Reasons (${audit.blockingReasons?.length || 0})
${audit.blockingReasons?.map((b: string) => `- ${b}`).join('\n') || 'None. All criteria satisfied.'}

---

## 5. Recommended Actions
${audit.recommendations?.map((r: string) => `- ${r}`).join('\n') || 'None.'}

---
*Report generated from live PostgreSQL database records. Zero synthetic data.*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ikshovia-training-readiness-audit-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !audit) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
        <div className="text-sm font-semibold text-stone-700">
          Running Independent Training Readiness Audit against Real PostgreSQL Data...
        </div>
        <p className="text-xs text-stone-500">
          Auditing dataset inventory, paper/subject coverage, directives, calibration drift, benchmark leakage, and 8 hard safety gates.
        </p>
      </div>
    );
  }

  const isReady = audit?.status === 'TRAINING_READY';
  const isReadyWithLimitations = audit?.status === 'TRAINING_READY_WITH_LIMITATIONS';
  const isNotReady = !isReady && !isReadyWithLimitations;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              PHASE 4.1G AUDIT
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-800 border border-stone-300">
              INDEPENDENT GO / NO-GO ASSESSMENT
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              ZERO MODEL TRAINING ENFORCED
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif-editorial text-stone-900 tracking-tight mt-1.5">
            Mains Dataset Training Readiness &amp; Go/No-Go Audit
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Audits real PostgreSQL evaluation ground-truth. Zero synthetic data &bull; Zero fabricated metrics &bull; Strictly deterministic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportJsonReport}
            disabled={!audit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors disabled:opacity-50"
            title="Download full machine-readable audit payload (JSON)"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            Export JSON
          </button>
          <button
            onClick={exportMarkdownReport}
            disabled={!audit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors disabled:opacity-50"
            title="Download executive audit summary (Markdown)"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            Export Markdown
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors"
          >
            {showHistory ? 'Hide History' : 'Audit History'}
          </button>
          <button
            onClick={loadAudit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-Run Full Audit
          </button>
        </div>
      </div>

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
      {/* 1. FINAL STATUS BADGE & PRIMARY READINESS VERDICT */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className={`p-6 rounded-2xl border ${
          isReady
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : isReadyWithLimitations
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
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
                  Definitive Production Readiness Decision
                </span>
                <div className="text-2xl font-bold font-mono tracking-tight">
                  {audit.status}
                </div>
              </div>
            </div>

            {/* SECTION 19: TRAINING BUTTON SAFETY ENFORCEMENT */}
            <div className="flex flex-col items-end">
              {isReady ? (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 text-white shadow-sm flex items-center gap-2 cursor-not-allowed opacity-90"
                >
                  <Sparkles className="w-4 h-4" />
                  TRAINING ELIGIBLE — MANUAL ADMIN APPROVAL REQUIRED
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-700 text-white shadow-sm">
                  <Lock className="w-4 h-4" />
                  <span>TRAINING LOCKED ({audit.blockingReasons?.length || 0} BLOCKERS)</span>
                </div>
              )}
              <span className="text-[10px] text-stone-500 mt-1">
                Zero automatic training jobs permitted &bull; Strict safety guard
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-stone-700 bg-white/80 p-3.5 rounded-xl border border-stone-200">
            {audit.summary}
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. EIGHT HARD SAFETY GATES GRID (SECTION 14) */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                Eight Mandatory Hard Safety Gates
              </h3>
              <p className="text-xs text-stone-500">
                Every single gate must pass. A failure in ANY gate immediately renders dataset TRAINING_NOT_READY.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
              {Object.values(audit.hardGates || {}).filter(g => g === 'PASS').length} / 8 PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'unadjudicatedDoubleReviews', label: 'Gate 1: Double Reviews', desc: 'Zero unadjudicated double reviews' },
              { key: 'pendingQuarantines', label: 'Gate 2: Quarantine Clean', desc: 'Zero records in quarantine' },
              { key: 'benchmarkIsolation', label: 'Gate 3: Benchmark Isolation', desc: 'Zero leakage into benchmark set' },
              { key: 'piiSafety', label: 'Gate 4: PII Sanitization', desc: 'Zero unredacted emails or phones' },
              { key: 'rubricCompleteness', label: 'Gate 5: Rubric Completeness', desc: '100% complete rubric dimensions' },
              { key: 'facultyGroundTruth', label: 'Gate 6: Faculty Ground Truth', desc: 'Faculty marks on all candidates' },
              { key: 'duplicateCheck', label: 'Gate 7: Duplicate Protection', desc: 'Zero hash collisions in training set' },
              { key: 'signedReleaseCandidate', label: 'Gate 8: Signed Manifest', desc: 'Valid SHA-256 release candidate' }
            ].map(gate => {
              const status = audit.hardGates?.[gate.key];
              const detail = audit.hardGatesDetail?.[gate.key];
              const isPass = status === 'PASS';
              const isFail = status === 'FAIL';
              return (
                <div
                  key={gate.key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                    isPass
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isFail
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{gate.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isPass
                        ? 'bg-emerald-600 text-white'
                        : isFail
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {status || 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">{detail?.message || gate.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. TRAINING THRESHOLD PROGRESS & VOLUME AUDIT (SECTIONS 2, 15) */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-800" />
                Training Volume Thresholds Progress (Real Database vs Configured Targets)
              </h3>
              <p className="text-xs text-stone-500">
                Minimum thresholds configured in <code className="font-mono text-stone-700">mains_training_gate_config</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Unique Training Answers</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {audit.dataset?.eligibleUniqueAnswers}
                <span className="text-xs font-normal text-stone-400"> / {audit.training?.configuredThresholds?.minimumUniqueAnswers}</span>
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                {audit.dataset?.eligibleUniqueAnswers >= audit.training?.configuredThresholds?.minimumUniqueAnswers
                  ? 'Threshold Met'
                  : `Need ${audit.training?.configuredThresholds?.minimumUniqueAnswers - audit.dataset?.eligibleUniqueAnswers} more`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Verified Faculty Reviews</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {audit.dataset?.facultyVerified}
                <span className="text-xs font-normal text-stone-400"> / {audit.training?.configuredThresholds?.minimumVerifiedReviews}</span>
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                {audit.dataset?.facultyVerified >= audit.training?.configuredThresholds?.minimumVerifiedReviews
                  ? 'Threshold Met'
                  : `Need ${audit.training?.configuredThresholds?.minimumVerifiedReviews - audit.dataset?.facultyVerified} more`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Subject Diversity</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {Object.keys(audit.coverage?.subjects || {}).length}
                <span className="text-xs font-normal text-stone-400"> / {audit.training?.configuredThresholds?.minimumSubjects} subjects</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Covered: {Object.keys(audit.coverage?.subjects || {}).join(', ') || 'None'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-medium text-stone-500">Isolated Benchmark Items</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {audit.benchmark?.items}
                <span className="text-xs font-normal text-stone-400"> / {audit.training?.configuredThresholds?.minimumBenchmarkItems}</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Leakage: {audit.benchmark?.leakageCount} items
              </div>
            </div>
          </div>

          {/* Deduplicated Inventory Breakdown */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Deduplicated Real DB Inventory
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Raw Submissions</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.totalSubmissions}</div>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Submitted Answers</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.submittedAnswers}</div>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">AI Evaluated</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.aiEvaluatedAnswers}</div>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Paired AI+Faculty</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.pairedAiFacultyAnswers}</div>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Unique Learners</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.uniqueLearners}</div>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Duplicate Rate</span>
                <div className="font-bold text-stone-900 mt-0.5">{audit.dataset?.duplicateRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. COVERAGE AUDIT: PAPERS, SUBJECTS, DIRECTIVES, TIERS */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Papers & Blind Spots */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-800" />
              Paper Coverage &amp; Blind Spot Detection
            </h3>
            <div className="space-y-2">
              {Object.entries(audit.coverage?.papers || {}).map(([paper, p]: [string, any]) => (
                <div key={paper} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{paper}</span>
                    <span className="text-stone-400 ml-2">({p.percentage}%)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-stone-600">
                    <span>Total: {p.count}</span>
                    <span className="text-emerald-700 font-semibold">Verified: {p.facultyVerified}</span>
                    <span className="text-blue-700 font-semibold">Eligible: {p.eligible}</span>
                  </div>
                </div>
              ))}
            </div>
            {audit.coverage?.blindSpots?.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Detected Blind Spots
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  {audit.coverage.blindSpots.map((bs: string, idx: number) => (
                    <li key={idx}>{bs}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Performance Tiers */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-800" />
              Performance Tier Distribution (Ground-Truth Tiers)
            </h3>
            <div className="space-y-2">
              {Object.entries(audit.coverage?.tiers || {}).map(([tier, t]: [string, any]) => (
                <div key={tier} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                  <span className={`font-bold ${
                    tier === 'EXCELLENT' ? 'text-emerald-800' :
                    tier === 'STRONG' ? 'text-blue-800' :
                    tier === 'AVERAGE' ? 'text-amber-800' :
                    'text-rose-800'
                  }`}>
                    {tier} ({t.percentage}%)
                  </span>
                  <div className="flex items-center gap-3 font-mono text-stone-600">
                    <span>Answers: {t.count}</span>
                    <span>Unique: {t.uniqueAnswers}</span>
                    <span className="text-purple-700 font-semibold">Learners: {t.uniqueLearners}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. DIRECTIVE & MARKS COVERAGE */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Directives */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-800" />
              Directive Representation
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {Object.entries(audit.coverage?.directives || {}).map(([dir, d]: [string, any]) => (
                <div key={dir} className="p-2 rounded bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800">{dir}</span>
                    {d.isUnderrepresented && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-semibold">
                        &lt;5 samples
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-stone-600">
                    {d.count} answers ({d.facultyVerified} verified)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Answer Formats & OCR Quality */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-800" />
              Format &amp; Handwritten OCR Coverage
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">Typed Submissions</span>
                <span className="font-mono font-bold text-stone-900">{audit.coverage?.formats?.typed}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">Handwritten Submissions</span>
                <span className="font-mono font-bold text-amber-700">{audit.coverage?.formats?.handwritten}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">OCR High Confidence (&ge;80%)</span>
                <span className="font-mono font-bold text-emerald-700">{audit.coverage?.formats?.ocrHighConfidence}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                <span className="font-semibold text-stone-800">OCR Review Required</span>
                <span className="font-mono font-bold text-rose-700">{audit.coverage?.formats?.ocrReviewRequired}</span>
              </div>
              <p className="text-[11px] text-stone-500 italic pt-1">
                {audit.coverage?.formats?.handwrittenUsabilityNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5B. MARKS & SUBJECT COVERAGE (SECTIONS 3 & 5) */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marks Distribution */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-800" />
              Marks Distribution &amp; Concentration Audit
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(audit.coverage?.marks || {}).map(([markVal, m]: [string, any]) => {
                const isDominant = m.percentage > 70;
                return (
                  <div key={markVal} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDominant ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <div>
                      <span className="font-bold text-stone-900">{markVal}</span>
                      <span className="text-stone-400 ml-2">({m.percentage}%)</span>
                      {isDominant && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                          Over-Concentrated (&gt;70%)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-stone-600 text-[11px]">
                      <span>Answers: <strong>{m.count}</strong></span>
                      <span>Verified: <strong className="text-emerald-700">{m.facultyVerified}</strong></span>
                      <span>Eligible: <strong className="text-blue-700">{m.eligible}</strong></span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(audit.coverage?.marks || {}).length === 0 && (
                <div className="p-4 text-center text-stone-400 text-xs">No marks distribution recorded.</div>
              )}
            </div>
          </div>

          {/* Subjects Coverage */}
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-800" />
              Subject Coverage &amp; Syllabus Diversity
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs pr-1">
              {Object.entries(audit.coverage?.subjects || {}).map(([subj, s]: [string, any]) => (
                <div key={subj} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900">{subj}</span>
                    <span className="text-stone-400 ml-2 text-[11px]">({s.percentage}%)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-stone-600 text-[11px]">
                    <span>Total: <strong>{s.count}</strong></span>
                    <span>Verified: <strong className="text-emerald-700">{s.facultyVerified}</strong></span>
                    <span>Eligible: <strong className="text-blue-700">{s.eligible}</strong></span>
                  </div>
                </div>
              ))}
              {Object.keys(audit.coverage?.subjects || {}).length === 0 && (
                <div className="p-4 text-center text-stone-400 text-xs">No subjects mapped in dataset.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. FACULTY CALIBRATION & AI-VS-FACULTY DISAGREEMENT */}
      {/* ---------------------------------------------------- */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-800" />
              Faculty Calibration &amp; Inter-Rater Reliability
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Evaluators</span>
                <div className="text-lg font-bold text-stone-900 mt-0.5">{audit.calibration?.evaluatorsCount}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Double Reviews</span>
                <div className="text-lg font-bold text-stone-900 mt-0.5">{audit.calibration?.doubleReviewsCount}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Avg Mark Divergence</span>
                <div className="text-lg font-bold text-stone-900 mt-0.5">
                  {audit.calibration?.mae != null ? `${audit.calibration.mae}m` : '-'}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500">Rubric Agreement</span>
                <div className="text-lg font-bold text-stone-900 mt-0.5">
                  {audit.calibration?.rubricAgreement != null ? `${audit.calibration.rubricAgreement}%` : '-'}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 italic pt-1">{audit.calibration?.note}</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-800" />
              Release Candidate &amp; Benchmark Integrity
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">Latest Release Candidate</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  audit.releaseCandidate?.status === 'FROZEN'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  {audit.releaseCandidate?.latestVersion || 'None'} ({audit.releaseCandidate?.status})
                </span>
              </div>
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">Benchmark Isolation Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  audit.benchmark?.isolated
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  {audit.benchmark?.status} ({audit.benchmark?.leakageCount} leaks)
                </span>
              </div>
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">Active Fine-Tuning Jobs</span>
                <span className="font-mono font-bold text-stone-900">
                  {audit.training?.trainingJobsRunning} RUNNING
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. BLOCKING REASONS & RECOMMENDATIONS (SECTIONS 18 & 23) */}
      {/* ---------------------------------------------------- */}
      {audit && audit.blockingReasons?.length > 0 && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            Active Blocking Reasons ({audit.blockingReasons.length})
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
            {audit.blockingReasons.map((b: string, idx: number) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {audit && audit.recommendations?.length > 0 && (
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
          <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-700" />
            Recommended Dataset Acquisition Priorities
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
            {audit.recommendations.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. AUDIT HISTORY DRAWER */}
      {/* ---------------------------------------------------- */}
      {showHistory && (
        <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Training Readiness Audit Log History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-200/60 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Audit ID</th>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Initiated By</th>
                  <th className="p-2.5">Blockers Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono">
                {history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-stone-100">
                    <td className="p-2.5 text-stone-900 font-bold">{h.id}</td>
                    <td className="p-2.5 text-stone-600 font-sans">{new Date(h.generatedAt).toLocaleString()}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.status === 'TRAINING_READY'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">{h.initiatedBy}</td>
                    <td className="p-2.5 text-rose-700 font-bold">{h.blockingReasons?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

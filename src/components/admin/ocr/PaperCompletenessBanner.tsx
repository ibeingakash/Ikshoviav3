import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { PaperCompletenessCheck } from '../../../lib/examOptionPolicy.js';

interface PaperCompletenessBannerProps {
  exam: 'UPSC CSE' | 'BPSC' | string;
  expectedCount: number;
  detectedCount: number;
  completenessCheck?: PaperCompletenessCheck | null;
  missingNumbers: number[];
  duplicateNumbers: number[];
  onAddMissingClick: (qNum?: number) => void;
  onRefreshCompleteness: () => void;
  isLoading?: boolean;
}

export const PaperCompletenessBanner: React.FC<PaperCompletenessBannerProps> = ({
  exam,
  expectedCount,
  detectedCount,
  completenessCheck,
  missingNumbers,
  duplicateNumbers,
  onAddMissingClick,
  onRefreshCompleteness,
  isLoading,
}) => {
  const isBpsc = exam === 'BPSC';
  const completenessPct = completenessCheck
    ? completenessCheck.completenessPercentage
    : Math.min(100, Math.round((detectedCount / (expectedCount || 1)) * 100));

  const canPublish = completenessCheck ? completenessCheck.canPublish : (missingNumbers.length === 0 && detectedCount >= expectedCount);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
              canPublish
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {canPublish ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Paper Completeness & Option Policy Validator
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  canPublish
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {canPublish ? 'PUBLISH READY (100% COMPLETE)' : 'PUBLISH BLOCKED (INCOMPLETE)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Commission Enforcement: {isBpsc ? 'BPSC Prelims (150 Questions • 5 Options A-E)' : 'UPSC CSE Prelims (100 Questions • 4 Options A-D)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshCompleteness}
            disabled={isLoading}
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Audit Paper</span>
          </button>
          <button
            onClick={() => onAddMissingClick()}
            disabled={missingNumbers.length === 0}
            title={
              missingNumbers.length === 0
                ? `All ${expectedCount} canonical questions are accounted for (0 missing questions).`
                : `Add missing canonical question (${missingNumbers.length} missing)`
            }
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Missing Q</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-0.5">Expected Target:</span>
          <span className="text-lg font-bold text-white font-mono">{expectedCount}</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-0.5">Accounted in Job:</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold font-mono ${detectedCount >= expectedCount ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completenessCheck?.totalAccountedCount ?? detectedCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ {expectedCount}</span>
          </div>
          {(completenessCheck?.adminAddedCount || 0) > 0 ? (
            <div className="text-[10px] text-slate-400 mt-0.5 flex gap-1 font-mono">
              <span className="text-emerald-400 font-semibold">OCR: {completenessCheck?.ocrDetectedCount ?? detectedCount}</span>
              <span>•</span>
              <span className="text-indigo-300 font-semibold">Admin: +{completenessCheck?.adminAddedCount}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              OCR Detected: {completenessCheck?.ocrDetectedCount ?? detectedCount}
            </span>
          )}
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-0.5">Missing Sequence:</span>
          <span className={`text-lg font-bold font-mono ${missingNumbers.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {missingNumbers.length}
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-0.5">Option Policy:</span>
          <span className={`text-xs font-bold block mt-1 ${
            completenessCheck?.optionViolations?.length ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {completenessCheck?.optionViolations?.length ? `${completenessCheck.optionViolations.length} Violations` : 'PASSED (A-D/A-E)'}
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-0.5">Answers Bound:</span>
          <span className="text-lg font-bold text-indigo-400 font-mono">
            {completenessCheck?.answersBoundCount ?? '—'} / {detectedCount}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>Catalog Publication Readiness</span>
          <span className="font-bold text-slate-200">{completenessPct}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              canPublish ? 'bg-emerald-500' : completenessPct > 80 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${completenessPct}%` }}
          />
        </div>
      </div>

      {/* Missing Numbers Chips */}
      {missingNumbers.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/60 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Missing Sequence Numbers ({missingNumbers.length}): Click to Add
            </span>
            <span className="text-[11px] text-rose-400">
              Publishing is blocked until all questions are accounted for
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {missingNumbers.slice(0, 30).map(n => (
              <button
                key={n}
                onClick={() => onAddMissingClick(n)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/80 transition flex items-center gap-1"
                title={`Click to manually add missed Question #${n}`}
              >
                <Plus className="w-3 h-3" />
                <span>Q#{n}</span>
              </button>
            ))}
            {missingNumbers.length > 30 && (
              <span className="text-xs text-rose-400 self-center font-bold px-1">
                +{missingNumbers.length - 30} more missing
              </span>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Numbers Warning */}
      {duplicateNumbers.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-bold">Duplicate Question Numbers Detected:</strong> Questions #{duplicateNumbers.join(', #')} appear multiple times in this job. Please review and renumber or delete duplicate items.
          </span>
        </div>
      )}

      {/* Option Violations Notice */}
      {completenessCheck?.optionViolations && completenessCheck.optionViolations.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 p-3.5 rounded-xl space-y-1 text-xs">
          <span className="font-bold text-amber-300 block mb-1">
            Option Structure Inconsistencies ({completenessCheck.optionViolations.length}):
          </span>
          <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-200/90 font-mono">
            {completenessCheck.optionViolations.slice(0, 10).map((viol, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span>• Q#{viol.questionNumber}:</span>
                <span className="text-slate-300">{viol.reason}</span>
                <span className="text-amber-400 font-bold">({viol.expectedPolicy})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Remarks */}
      {completenessCheck?.summaryRemarks && completenessCheck.summaryRemarks.length > 0 && (
        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
          {completenessCheck.summaryRemarks.map((remark, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              {remark}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

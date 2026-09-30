import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ExamExitModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  continueLabel?: string;
  leaveLabel?: string;
  onContinue: () => void;
  onLeave: () => void;
}

export const ExamExitModal: React.FC<ExamExitModalProps> = ({
  isOpen,
  title = 'Leave this test?',
  message = 'An active attempt is in progress. Leaving now will interrupt your examination attempt. Your answered questions are safely stored.',
  continueLabel = 'Continue Test',
  leaveLabel = 'Leave Test',
  onContinue,
  onLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-exit-title"
        className="bg-[#FAF8F5] border border-amber-300/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-stone-900"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 id="exam-exit-title" className="text-base font-bold font-serif-editorial text-stone-900">
              {title}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onLeave}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            {leaveLabel}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

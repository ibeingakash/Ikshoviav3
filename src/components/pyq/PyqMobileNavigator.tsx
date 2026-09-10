import React from 'react';
import {
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Question } from '../../types/index.js';

interface PyqMobileNavigatorProps {
  questions: Question[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  userAnswers: Record<string, string>;
  markedForReview: Record<string, boolean>;
  bookmarkedQuestions?: Record<string, boolean>;
  onToggleBookmark?: (questionId: string) => void;
  onSubmit: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  mode: 'COMPLETE_PAPER' | 'SIMULATION_EXAM';
}

export const PyqMobileNavigator: React.FC<PyqMobileNavigatorProps> = ({
  questions,
  currentIndex,
  onSelectQuestion,
  onPrevious,
  onNext,
  userAnswers,
  markedForReview,
  bookmarkedQuestions = {},
  onToggleBookmark,
  onSubmit,
  isOpen,
  onToggleOpen,
  mode,
}) => {
  const currentQ = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const isCurrentBookmarked = currentQ ? Boolean(bookmarkedQuestions[currentQ.id]) : false;

  return (
    <>
      {/* Slide-Up Question Navigator Drawer / Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans-editorial">
          <div
            className="bg-white rounded-t-3xl border-t border-stone-200 shadow-2xl p-5 max-h-[80vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold font-serif-editorial text-stone-900 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-amber-800" />
                  <span>Question Navigator</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  Tap any question number to jump instantly
                </p>
              </div>

              <button
                onClick={onToggleOpen}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Close question navigator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-stone-600 py-3 border-b border-stone-100">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
                <span>Answered ({answeredCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400 inline-block"></span>
                <span>Review ({markedCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-stone-200 border border-stone-300 inline-block"></span>
                <span>Unattempted ({total - answeredCount})</span>
              </span>
            </div>

            {/* Quick Numbers Grid */}
            <div className="overflow-y-auto py-3 max-h-[50vh]">
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;

                  let style = 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
                  if (isCurrent) {
                    style = 'bg-stone-900 text-white font-bold ring-2 ring-amber-500 border-stone-900';
                  } else if (isMarked) {
                    style = 'bg-amber-100 text-amber-950 font-bold border-amber-400';
                  } else if (isAnswered) {
                    style = 'bg-emerald-600 text-white font-bold border-emerald-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onSelectQuestion(idx);
                        onToggleOpen();
                      }}
                      className={`h-10 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${style}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={onToggleOpen}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to Paper
              </button>

              <button
                onClick={() => {
                  onToggleOpen();
                  onSubmit();
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Paper</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Bar for Mobile & Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Navigator Toggle Button */}
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer min-h-[44px]"
            title="Open Question Navigator"
          >
            <ListOrdered className="w-4 h-4 text-amber-800" />
            <span>Q {currentIndex + 1}/{total}</span>
            <span className="hidden sm:inline text-stone-400 font-normal">
              ({answeredCount} marked)
            </span>
          </button>

          {/* Center Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                currentIndex === 0
                  ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
              aria-label="Previous question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {onToggleBookmark && currentQ && (
              <button
                onClick={() => onToggleBookmark(currentQ.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isCurrentBookmarked
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                }`}
                title={isCurrentBookmarked ? 'Bookmarked' : 'Bookmark Question'}
                aria-label="Bookmark question"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onNext}
              disabled={currentIndex === total - 1}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                currentIndex === total - 1
                  ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
              }`}
              aria-label="Next question"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action */}
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Finish</span>
            <span>Submit</span>
          </button>
        </div>
      </div>
    </>
  );
};

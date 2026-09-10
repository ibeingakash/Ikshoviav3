import React from 'react';
import {
  BarChart3,
  X,
  BookOpen,
  PieChart,
  Tag,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { PyqPaper, Question } from '../../types/index.js';

interface PyqPaperAnalysisModalProps {
  paper: PyqPaper;
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onFilterSubject?: (subject: string) => void;
  onNavigateToTopicPractice?: (subject: string) => void;
}

export const PyqPaperAnalysisModal: React.FC<PyqPaperAnalysisModalProps> = ({
  paper,
  questions,
  isOpen,
  onClose,
  onFilterSubject,
  onNavigateToTopicPractice,
}) => {
  if (!isOpen) return null;

  // Aggregate Subject Distribution
  const subjectCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const questionTypeCounts: Record<string, number> = {
    SINGLE_CHOICE: 0,
    STATEMENT_BASED: 0,
    MATCH_FOLLOWING: 0,
  };
  const difficultyCounts: Record<string, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  };

  questions.forEach(q => {
    const subj = q.subject || q.gsPaper || 'General Studies';
    subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;

    if (q.topic) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }

    const type = q.questionType || 'SINGLE_CHOICE';
    if (type === 'MATCH_FOLLOWING') questionTypeCounts.MATCH_FOLLOWING++;
    else if (type === 'STATEMENT_BASED' || (q.statements && q.statements.length > 0)) questionTypeCounts.STATEMENT_BASED++;
    else questionTypeCounts.SINGLE_CHOICE++;

    const diff = (q.difficulty || 'MEDIUM').toUpperCase();
    if (diff.includes('EASY') || diff.includes('BEGINNER')) difficultyCounts.EASY++;
    else if (diff.includes('HARD') || diff.includes('ADVANCED')) difficultyCounts.HARD++;
    else difficultyCounts.MEDIUM++;
  });

  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const total = questions.length || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans-editorial">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                PAPER SYLLABUS INTELLIGENCE
              </span>
              <span className="text-xs font-mono text-stone-500">
                {paper.exam} • {paper.year}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif-editorial text-stone-900 mt-1">
              {paper.paperTitle} — Subject & Topic Blueprint
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close analysis modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notice about Paper Integrity vs Topic Practice */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                Authentic Commission Sequence Guaranteed
              </p>
              <p className="text-stone-700 leading-relaxed">
                This paper is preserved in its authentic question order (Q1 through Q{questions.length}). Subject and topic classifications below exist as an analytical layer for performance tracking and targeted revision.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Questions</span>
              <span className="text-xl font-bold font-mono text-stone-900">{questions.length}</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Subjects Covered</span>
              <span className="text-xl font-bold font-mono text-amber-900">{sortedSubjects.length}</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Statement-Based</span>
              <span className="text-xl font-bold font-mono text-indigo-700">{questionTypeCounts.STATEMENT_BASED}</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Match Columns</span>
              <span className="text-xl font-bold font-mono text-emerald-700">{questionTypeCounts.MATCH_FOLLOWING}</span>
            </div>
          </div>

          {/* Subject Weightage Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-700" />
                <span>Subject-Wise Weightage in this Paper</span>
              </h3>
              <span className="text-[11px] font-mono text-stone-500">
                Click a subject to highlight in paper
              </span>
            </div>

            <div className="space-y-2">
              {sortedSubjects.map(([subj, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div
                    key={subj}
                    className="p-3 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 sm:w-1/2">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                        <span className="truncate">{subj}</span>
                        <span className="font-mono text-stone-600">{count} Qs ({pct}%)</span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-700 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onFilterSubject && (
                        <button
                          onClick={() => {
                            onFilterSubject(subj);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Highlight in Paper
                        </button>
                      )}

                      {onNavigateToTopicPractice && (
                        <button
                          onClick={() => {
                            onNavigateToTopicPractice(subj);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Topic Practice</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Topics Identified */}
          {sortedTopics.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-700" />
                <span>Frequently Tested Micro-Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {sortedTopics.map(([top, count]) => (
                  <span
                    key={top}
                    className="px-3 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>{top}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-600 font-mono text-[10px] font-bold">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Source: Official Commission Master Data • Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

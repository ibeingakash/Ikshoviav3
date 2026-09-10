import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  BookOpen,
  Eye,
  EyeOff,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { PyqPaper } from '../../types/index.js';

interface PyqPaperHeaderProps {
  paper: PyqPaper;
  questionCount: number;
  viewMode: 'COMPLETE_PAPER' | 'SIMULATION_EXAM';
  onChangeViewMode: (mode: 'COMPLETE_PAPER' | 'SIMULATION_EXAM') => void;
  displayLanguage: 'en' | 'hi';
  onChangeLanguage: (lang: 'en' | 'hi') => void;
  showMetadata: boolean;
  onToggleMetadata: () => void;
  onOpenAnalysis: () => void;
  onExit: () => void;
  timeRemainingSeconds?: number;
  formatTimer?: (secs: number) => string;
  onSubmit?: () => void;
}

export const PyqPaperHeader: React.FC<PyqPaperHeaderProps> = ({
  paper,
  questionCount,
  viewMode,
  onChangeViewMode,
  displayLanguage,
  onChangeLanguage,
  showMetadata,
  onToggleMetadata,
  onOpenAnalysis,
  onExit,
  timeRemainingSeconds,
  formatTimer,
  onSubmit,
}) => {
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const isCsat = paper.paper?.toLowerCase().includes('csat');
  const isBpsc = paper.exam?.toLowerCase().includes('bpsc');
  const commissionName = isBpsc ? 'Bihar Public Service Commission (BPSC)' : 'Union Public Service Commission (UPSC)';
  const maxMarks = isCsat ? 200 : isBpsc ? 150 : 200;
  const negativePenalty = isCsat ? '1/3rd (0.83 Marks)' : isBpsc ? '1/3rd (0.33 Marks)' : '1/3rd (0.66 Marks)';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden font-sans-editorial space-y-0">
      {/* Top Bar with Navigation & Actions */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors cursor-pointer"
            title="Return to PYQ Paper Archive"
            aria-label="Back to papers"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-800" />
                <span>OFFICIAL PYQ PAPER</span>
              </span>
              <span className="text-xs font-mono text-stone-500">
                {commissionName}
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-bold font-serif-editorial text-stone-900 mt-1">
              {paper.paperTitle}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => onChangeViewMode('COMPLETE_PAPER')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'COMPLETE_PAPER'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete Paper</span>
              <span className="sm:hidden">Paper</span>
            </button>
            <button
              onClick={() => onChangeViewMode('SIMULATION_EXAM')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'SIMULATION_EXAM'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timed Simulation</span>
              <span className="sm:hidden">Timed</span>
            </button>
          </div>

          {/* Bilingual Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                displayLanguage === 'en' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                displayLanguage === 'hi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
            >
              HI
            </button>
          </div>

          {/* Metadata Toggle */}
          <button
            onClick={onToggleMetadata}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              showMetadata
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="Toggle subject and topic metadata badges on questions"
          >
            <Tag className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Metadata</span>
          </button>

          {/* Paper Analysis Button */}
          <button
            onClick={onOpenAnalysis}
            className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="View syllabus & topic blueprint"
          >
            <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Blueprint</span>
          </button>

          {/* Timer if Simulation */}
          {viewMode === 'SIMULATION_EXAM' && timeRemainingSeconds !== undefined && formatTimer && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          )}

          {/* Submit button if Simulation */}
          {viewMode === 'SIMULATION_EXAM' && onSubmit && (
            <button
              onClick={onSubmit}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              Submit
            </button>
          )}
        </div>
      </div>

      {/* Official Instructions Banner Strip */}
      <div className="bg-stone-50/80 px-5 py-2.5 border-b border-stone-100 flex items-center justify-between text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[11px]">
          <span><strong>Total Questions:</strong> {questionCount} Items (Q.1 to Q.{questionCount})</span>
          <span><strong>Time Allowed:</strong> 2 Hours (120 Mins)</span>
          <span><strong>Maximum Marks:</strong> {maxMarks}</span>
          <span><strong>Negative Penalty:</strong> {negativePenalty}</span>
        </div>

        <button
          onClick={() => setShowInstructions(prev => !prev)}
          className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
        >
          <span>{showInstructions ? 'Hide Guidelines' : 'Official Instructions'}</span>
          {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Official Commission Exam Instructions */}
      {showInstructions && (
        <div className="p-5 bg-amber-50/40 border-b border-amber-200/50 text-xs text-stone-700 space-y-2 animate-fade-in font-sans">
          <div className="font-bold text-stone-900 flex items-center gap-1.5 font-serif-editorial text-sm">
            <AlertCircle className="w-4 h-4 text-amber-800" />
            <span>Official Examination Instructions to Candidates</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 leading-relaxed text-stone-600 text-[11px]">
            <li>Check that this question paper contains all {questionCount} questions in complete sequential order from Question 1 to Question {questionCount}.</li>
            <li>All questions carry equal marks. Encode clearly your answer in the response sheet.</li>
            <li>{isBpsc ? 'For BPSC Combined Competitive Examination, questions include 5 options (A, B, C, D, E). Marking Option E marks the question as intentionally unattempted without negative penalty.' : 'For UPSC CSE, each question has four alternatives (A, B, C, D). There is only one correct answer for each question.'}</li>
            <li>Penalty for wrong answers: For each wrong answer given by the candidate, one-third of the marks assigned to that question will be deducted.</li>
            <li>Questions are presented in authentic commission order. Subject and topic tags are provided purely as an analytical study aid.</li>
          </ol>
        </div>
      )}
    </div>
  );
};

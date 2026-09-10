import React from 'react';
import {
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  BarChart3,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { PyqPaper } from '../../types/index.js';

interface PyqPaperCardProps {
  paper: PyqPaper;
  onOpenCompletePaper: (paper: PyqPaper) => void;
  onLaunchSimulation: (paper: PyqPaper) => void;
  onOpenAnalysis: (paper: PyqPaper) => void;
}

export const PyqPaperCard: React.FC<PyqPaperCardProps> = ({
  paper,
  onOpenCompletePaper,
  onLaunchSimulation,
  onOpenAnalysis,
}) => {
  const isCsat = paper.paper?.toLowerCase().includes('csat');
  const isBpsc = paper.exam?.toLowerCase().includes('bpsc');
  const questionCount = paper.actualQuestionCount || paper.expectedQuestionCount || 100;
  const maxMarks = isCsat ? 200 : isBpsc ? 150 : 200;
  const markingScheme = isCsat ? '+2.50 / -0.83' : isBpsc ? '+1.00 / -0.33' : '+2.00 / -0.66';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 shadow-2xs hover:shadow-sm transition-all duration-150 p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-700" />
            <span>OFFICIAL PAPER</span>
          </span>
          <span className="text-xs font-bold text-stone-700 font-mono">
            {paper.examCycle || paper.year}
          </span>
        </div>

        {/* Paper Title & Exam */}
        <div>
          <h3 className="text-base font-bold font-serif-editorial text-stone-900 leading-snug">
            {paper.paperTitle}
          </h3>
          <p className="text-stone-500 text-xs mt-1 font-medium">
            {paper.exam} • {paper.stage || 'Prelims'} • Original Sequence
          </p>
        </div>

        {/* Paper Specification Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Questions</span>
            <span className="text-xs font-bold text-stone-700 font-mono">
              Q.1 to Q.{questionCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Duration</span>
            <span className="text-xs font-bold text-stone-700 font-mono">120 Mins</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Marking</span>
            <span className="text-xs font-bold text-stone-700 font-mono">
              {markingScheme}
            </span>
          </div>
        </div>

        {/* Source & Verification */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-stone-400" />
            <span>Source: {paper.sourceDomain || (isBpsc ? 'bpsc.bihar.gov.in' : 'upsc.gov.in')}</span>
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Master Key Verified</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => onOpenCompletePaper(paper)}
          className="w-full py-2.5 px-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
        >
          <BookOpen className="w-4 h-4" />
          <span>Open Complete Paper</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLaunchSimulation(paper)}
            className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
          >
            <Clock className="w-3.5 h-3.5 text-amber-800" />
            <span>Timed Test</span>
          </button>

          <button
            onClick={() => onOpenAnalysis(paper)}
            className="py-2 px-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
          >
            <BarChart3 className="w-3.5 h-3.5 text-stone-500" />
            <span>Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Eye,
  Download,
  Bot,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileText,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { LearningResource } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

interface BookResourceCardProps {
  resource: LearningResource;
  onOpenReader: (resource: LearningResource) => void;
  onOpenDetail: (resource: LearningResource) => void;
  onOpenAskAI: (resource: LearningResource) => void;
  onToggleBookmark: (resourceId: string, e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}

export const BookResourceCard: React.FC<BookResourceCardProps> = ({
  resource,
  onOpenReader,
  onOpenDetail,
  onOpenAskAI,
  onToggleBookmark,
  viewMode = 'grid',
}) => {
  const { setActiveSection } = useLearner();

  const isBookmarked = Boolean(resource.is_bookmarked || resource.isBookmarked);
  const totalPages = Math.max(1, resource.page_count || 1);
  const lastPage = resource.last_page || resource.lastPage || 1;
  const progressPct = resource.progress_percentage || resource.progressPercentage || Math.round((lastPage / totalPages) * 100);

  // Compute domain-appropriate related learning links
  const getRelatedMetadata = (subject: string, title: string) => {
    const s = (subject || '').toLowerCase();
    const t = (title || '').toLowerCase();

    if (s.includes('polity') || t.includes('polity') || t.includes('constitution')) {
      return {
        pyqCount: 28,
        pyqLabel: '28 Related PYQs (Preamble, Fundamental Rights)',
        pyqTarget: 'pyq-practice',
        notesCount: 4,
        notesLabel: '4 Revision Compendiums',
        notesTarget: 'short-notes',
        syllabusTopic: 'Polity: Constitution & Governance',
        syllabusTarget: 'notes',
      };
    }
    if (s.includes('history') || t.includes('history') || t.includes('modern')) {
      return {
        pyqCount: 34,
        pyqLabel: '34 Related PYQs (Freedom Struggle, 1857)',
        pyqTarget: 'pyq-practice',
        notesCount: 3,
        notesLabel: '3 Revision Compendiums',
        notesTarget: 'short-notes',
        syllabusTopic: 'History: Modern India & Freedom Struggle',
        syllabusTarget: 'notes',
      };
    }
    if (s.includes('economy') || t.includes('economy')) {
      return {
        pyqCount: 22,
        pyqLabel: '22 Related PYQs (Monetary Policy, Fiscal Deficit)',
        pyqTarget: 'pyq-practice',
        notesCount: 3,
        notesLabel: '3 Revision Compendiums',
        notesTarget: 'short-notes',
        syllabusTopic: 'Economy: Macroeconomics & Fiscal System',
        syllabusTarget: 'notes',
      };
    }
    if (s.includes('environment') || t.includes('ecology')) {
      return {
        pyqCount: 26,
        pyqLabel: '26 Related PYQs (Biodiversity, Climate Summits)',
        pyqTarget: 'pyq-practice',
        notesCount: 3,
        notesLabel: '3 Revision Compendiums',
        notesTarget: 'short-notes',
        syllabusTopic: 'Environment: Ecology, Climate & Conventions',
        syllabusTarget: 'notes',
      };
    }
    if (s.includes('bihar') || t.includes('bihar') || t.includes('bpsc')) {
      return {
        pyqCount: 40,
        pyqLabel: '40 Related BPSC PYQs (Bihar History & Geography)',
        pyqTarget: 'pyq-practice',
        notesCount: 2,
        notesLabel: '2 Bihar Special Notes',
        notesTarget: 'short-notes',
        syllabusTopic: 'BPSC: Bihar General Studies Special',
        syllabusTarget: 'notes',
      };
    }
    return {
      pyqCount: 16,
      pyqLabel: '16 Related PYQs',
      pyqTarget: 'pyq-practice',
      notesCount: 2,
      notesLabel: '2 Revision Notes',
      notesTarget: 'short-notes',
      syllabusTopic: 'General Studies Core Curriculum',
      syllabusTarget: 'notes',
    };
  };

  const related = getRelatedMetadata(resource.subject, resource.title);

  const getBadgeType = (type: string, title: string) => {
    const t = (title || '').toLowerCase();
    if (t.includes('laxmikanth') || t.includes('ramesh singh') || t.includes('bipan chandra') || t.includes('bipin')) {
      return { label: 'STANDARD TEXTBOOK', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
    }
    if (t.includes('shankar') || t.includes('ecology')) {
      return { label: 'CORE REFERENCE NOTE', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
    }
    if (t.includes('bihar') || t.includes('bpsc')) {
      return { label: 'STATE SPECIAL BOOK', bg: 'bg-rose-100 text-rose-950 border-rose-300' };
    }
    return { label: 'STANDARD REFERENCE', bg: 'bg-stone-100 text-stone-900 border-stone-300' };
  };

  const badge = getBadgeType(resource.resource_type || resource.type || 'BOOK', resource.title);

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDetail(resource)}
        className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-14 rounded-lg bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center text-amber-800 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <span className="text-[9px] font-mono font-bold text-amber-800 mt-1 uppercase">Book</span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="text-[11px] font-medium text-stone-500 font-mono">
                {totalPages} pages
              </span>
              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                {resource.subject}
              </span>
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                {resource.exam || 'UPSC / BPSC'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold font-serif-editorial text-stone-900 group-hover:text-amber-900 transition-colors">
              {resource.title}
            </h3>

            <p className="text-xs text-stone-500 font-medium">
              By <strong className="text-stone-700 font-semibold">{resource.author || 'Civil Services Authority'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onOpenReader(resource)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{lastPage > 1 ? `Resume (P. ${lastPage})` : 'Read Book'}</span>
          </button>

          <a
            href={`/api/resources/${resource.id}/download`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => onOpenAskAI(resource)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Ask AI Tutor grounded in this book"
          >
            <Bot className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => onToggleBookmark(resource.id, e)}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked ? 'text-amber-600 bg-amber-50' : 'text-stone-300 hover:text-stone-500'
            }`}
            title="Bookmark this book"
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenDetail(resource)}
      className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 p-5 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-4 cursor-pointer group"
    >
      <div className="space-y-3">
        {/* Top Badges & Bookmark */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
            {badge.label}
          </span>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-mono text-stone-400">
              {totalPages} {totalPages === 1 ? 'page' : 'pages'}
            </span>
            <button
              onClick={(e) => onToggleBookmark(resource.id, e)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isBookmarked ? 'text-amber-600' : 'text-stone-300 hover:text-stone-500'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this book'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Book Title & Author */}
        <div>
          <h3 className="text-base font-bold font-serif-editorial text-stone-900 group-hover:text-amber-900 transition-colors leading-snug line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            By <strong className="text-stone-700 font-semibold">{resource.author || 'IKSHOVIA Editorial Board'}</strong>
          </p>
        </div>

        {/* Subject & Exam Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
            {resource.subject || 'General Studies'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
            {resource.exam || 'ALL EXAMS'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/60 flex items-center gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Edition
          </span>
        </div>

        {/* Short Description */}
        {resource.description && (
          <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100 leading-relaxed font-sans">
            {resource.description}
          </p>
        )}

        {/* Reading Progress Indicator if started */}
        {lastPage > 1 && (
          <div className="pt-2 border-t border-stone-100 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-900 font-semibold">
              <span>Reading: Page {lastPage} of {totalPages}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-700 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Cross-Linking Section (Section 11 of Spec) */}
        <div
          className="bg-stone-50/90 rounded-xl p-2.5 border border-stone-200/70 space-y-1.5 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
            <span>Related Learning Repositories</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px]">
            {/* Related PYQs deep-link */}
            <button
              onClick={() => setActiveSection(related.pyqTarget)}
              className="flex items-center justify-between text-stone-700 hover:text-amber-800 py-0.5 font-medium transition-colors cursor-pointer group/link text-left"
              title="Open Official PYQ Papers for this subject"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span className="truncate">{related.pyqLabel}</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover/link:text-amber-800 shrink-0 ml-1" />
            </button>

            {/* Related Revision Notes deep-link */}
            <button
              onClick={() => setActiveSection(related.notesTarget)}
              className="flex items-center justify-between text-stone-700 hover:text-amber-800 py-0.5 font-medium transition-colors cursor-pointer group/link text-left"
              title="Open Revision Notes & Compendiums for this subject"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">{related.notesLabel}</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover/link:text-amber-800 shrink-0 ml-1" />
            </button>

            {/* Related Syllabus Topic deep-link */}
            <button
              onClick={() => setActiveSection(related.syllabusTarget)}
              className="flex items-center justify-between text-stone-700 hover:text-amber-800 py-0.5 font-medium transition-colors cursor-pointer group/link text-left"
              title="Open Curriculum & Syllabus Breakdown"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                <span className="truncate">{related.syllabusTopic}</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover/link:text-amber-800 shrink-0 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onOpenReader(resource)}
          className="py-2 px-3.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{lastPage > 1 ? `Resume (P. ${lastPage})` : 'Read Book'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <a
            href={`/api/resources/${resource.id}/download`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => onOpenAskAI(resource)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Ask AI grounded in this book"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

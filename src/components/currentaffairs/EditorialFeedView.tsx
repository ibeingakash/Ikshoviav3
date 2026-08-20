import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  BookOpen,
  Calendar,
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Target,
  Layers,
  ArrowRight,
  X,
  Share2,
  CheckCircle2,
  FileText,
  Building2,
  Scale,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';
import { formatDateHuman } from '../../lib/dateUtils.js';

interface EditorialFeedViewProps {
  onSelectArticle?: (article: CurrentAffairArticle) => void;
}

export const EditorialFeedView: React.FC<EditorialFeedViewProps> = ({ onSelectArticle }) => {
  const { askTutorWithContext } = useLearner();
  const [editorials, setEditorials] = useState<CurrentAffairArticle[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string; formatted: string; count: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedGsPaper, setSelectedGsPaper] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalArticle, setActiveModalArticle] = useState<CurrentAffairArticle | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sources = [
    { id: 'ALL', label: 'All Newspapers' },
    { id: 'The Hindu', label: 'The Hindu' },
    { id: 'The Indian Express', label: 'The Indian Express' },
    { id: 'LiveMint', label: 'LiveMint' },
  ];

  const gsPapers = [
    { id: 'ALL', label: 'All GS Papers' },
    { id: 'GS-1', label: 'GS Paper I (History, Society, Geo)' },
    { id: 'GS-2', label: 'GS Paper II (Polity, Governance, IR)' },
    { id: 'GS-3', label: 'GS Paper III (Economy, Tech, Envt)' },
    { id: 'GS-4', label: 'GS Paper IV (Ethics & Case Studies)' },
    { id: 'ESSAY', label: 'Essay Dimension' },
  ];

  useEffect(() => {
    api.getAvailableEditorialDates().then(dates => {
      if (Array.isArray(dates) && dates.length > 0) {
        setAvailableDates(dates);
        if (!selectedDate) {
          const firstWithCount = dates.find(d => d.count > 0) || dates[0];
          setSelectedDate(firstWithCount.date);
        }
      }
    }).catch(() => {});
  }, []);

  const fetchEditorials = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getEditorials({
        date: selectedDate && selectedDate !== 'ALL' ? selectedDate : undefined,
        source: selectedSource === 'ALL' ? undefined : selectedSource,
        gsPaper: selectedGsPaper === 'ALL' ? undefined : selectedGsPaper,
        search: searchQuery || undefined,
        limit: 50,
      });
      setEditorials(list);
    } catch (err) {
      console.error('Failed to fetch editorials:', err);
      setEditorials([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedSource, selectedGsPaper, searchQuery]);

  useEffect(() => {
    fetchEditorials();
  }, [selectedDate, selectedSource, selectedGsPaper, fetchEditorials]);

  const handlePreviousDay = () => {
    if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(d => d.date === selectedDate);
      if (currentIndex !== -1 && currentIndex + 1 < availableDates.length) {
        setSelectedDate(availableDates[currentIndex + 1].date);
        return;
      }
    }
    const cur = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(d => d.date === selectedDate);
      if (currentIndex > 0) {
        setSelectedDate(availableDates[currentIndex - 1].date);
        return;
      }
    }
    const cur = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.bookmarkCurrentAffairForRevision(id);
      setBookmarkedIds(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to bookmark editorial:', err);
    }
  };

  const handleAskTutor = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    askTutorWithContext(
      `Please provide a comprehensive UPSC Mains evaluation and critical debate analysis for the editorial: "${art.title}"`,
      {
        subjectName: art.relatedSubject || art.category,
        pageContext: `Editorial: ${art.title} from ${art.source}. Core argument: ${art.editorialAnalysis?.coreArgument || art.whyInNews || art.summary}. GS Paper: ${art.gsPaper || 'GS-2'}.`,
        conceptTitle: art.title,
        conceptSummary: art.whyInNews || art.summary,
      }
    );
  };

  const handleShare = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${art.title} - ${art.source} Editorial Analysis on IKSHOVIA Intelligence`);
      setCopiedId(art.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Editorial Header Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase bg-purple-300 text-stone-950 px-2.5 py-0.5 rounded-full tracking-wider">
              UPSC Mains Analytical Desk
            </span>
            <span className="text-xs text-stone-300 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              Lead Newspaper Editorials & Critical Debates
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            Editorials, Op-Eds & Constitutional Discourse
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
            In-depth structured breakdown of daily editorial columns from The Hindu, The Indian Express, and LiveMint with balanced arguments, statutory citations, and model answer frameworks.
          </p>
        </div>
      </div>

      {/* Editorial Filter Header */}
      <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-2xs">
        
        {/* Date Navigator Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              title="Previous Day"
              className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-xs font-bold text-purple-950 font-serif">
                {selectedDate === 'ALL' ? 'All Editorial Dates' : formatDateHuman(selectedDate, { includeWeekday: true })}
              </span>
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search editorial themes, arguments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEditorials()}
              className="w-full bg-stone-50 border border-stone-200 text-xs text-stone-900 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[#35156B]"
            />
          </div>
        </div>

        {/* Date Filter Row */}
        {availableDates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-bold text-stone-500 mr-1 shrink-0 flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-[#35156B]" />
              Date Archive:
            </span>
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-[#35156B] text-amber-300 font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Dates
            </button>
            {availableDates.map(d => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedDate === d.date
                    ? 'bg-[#35156B] text-amber-300 font-bold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{d.formatted}</span>
                <span className={`text-[9px] px-1 rounded-full ${
                  selectedDate === d.date ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {d.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Source and GS Paper Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-stone-500 shrink-0">Newspaper:</span>
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(s.id)}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedSource === s.id
                    ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-stone-500 shrink-0">GS Paper:</span>
            {gsPapers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedGsPaper(p.id)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  selectedGsPaper === p.id
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {p.id === 'ALL' ? 'All GS' : p.id}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2 font-medium">
          <Sparkles className="w-6 h-6 animate-spin text-[#35156B]" />
          <span>Synthesizing lead newspaper editorials & constitutional arguments...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && editorials.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">
            No editorials found for {selectedDate === 'ALL' ? 'selected filters' : formatDateHuman(selectedDate)}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try navigating to a previous date or resetting newspaper and GS Paper filters to view lead editorials.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handlePreviousDay}
              className="text-xs font-bold bg-[#35156B] text-amber-300 hover:bg-[#4B1F78] px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              View Previous Day
            </button>
            <button
              onClick={() => {
                setSelectedDate('ALL');
                setSelectedSource('ALL');
                setSelectedGsPaper('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              View All Dates
            </button>
          </div>
        </div>
      )}

      {/* Editorials List */}
      {!loading && editorials.length > 0 && (
        <div className="space-y-5">
          {editorials.map(art => {
            const analysis = art.editorialAnalysis || {};
            const isHindu = art.source === 'The Hindu' || (art.editorialSource && art.editorialSource.includes('Hindu'));

            return (
              <article
                key={art.id}
                onClick={() => {
                  if (onSelectArticle) onSelectArticle(art);
                  else setActiveModalArticle(art);
                }}
                className="bg-white border border-stone-200 hover:border-[#35156B]/40 p-5 sm:p-6 rounded-2xl space-y-4 transition-all shadow-2xs hover:shadow-xs cursor-pointer group relative"
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      isHindu
                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}>
                      {art.source}
                    </span>

                    <span className="text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded">
                      {art.articleType || 'EDITORIAL'}
                    </span>

                    {art.gsPaper && (
                      <span className="text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded">
                        {art.gsPaper}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {formatDateHuman(art.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleBookmark(e, art.id)}
                      title="Add to Spaced Repetition Revision"
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                        bookmarkedIds[art.id]
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {bookmarkedIds[art.id] ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px]">Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-[11px]">Revise</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleShare(e, art)}
                      title="Copy Editorial Link"
                      className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {copiedId === art.id && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Copied!
                      </span>
                    )}
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#111426] group-hover:text-[#35156B] transition-colors font-serif leading-snug">
                    {art.title}
                  </h2>
                </div>

                {/* Core Editorial Argument */}
                <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-[#35156B] flex items-center gap-1.5 uppercase tracking-wide">
                    <Scale className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Lead Editorial Argument & Core Stance:</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {analysis.coreArgument || art.whyInNews || art.summary}
                  </p>
                </div>

                {/* Pros & Cons Debate Matrix */}
                {(analysis.argumentsFor?.length > 0 || analysis.argumentsAgainst?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {analysis.argumentsFor?.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-200/70 p-3 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold uppercase text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Arguments In Support (Affirmative)</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-emerald-950">
                          {analysis.argumentsFor.slice(0, 2).map((arg: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-700 font-bold">•</span>
                              <span className="line-clamp-2">{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.argumentsAgainst?.length > 0 && (
                      <div className="bg-rose-50/50 border border-rose-200/70 p-3 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold uppercase text-rose-950 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-700" />
                          <span>Critique & Concerns (Counterarguments)</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-rose-950">
                          {analysis.argumentsAgainst.slice(0, 2).map((arg: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-rose-700 font-bold">•</span>
                              <span className="line-clamp-2">{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Constitutional / Statutory Linkages */}
                {analysis.constitutionalDimensions?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-500 mr-1">Constitutional Anchors:</span>
                    {analysis.constitutionalDimensions.map((cd: string, i: number) => (
                      <span key={i} className="text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                        {cd}
                      </span>
                    ))}
                  </div>
                )}

                {/* PYQ Linkage Badge */}
                {analysis.pyqLinkages?.length > 0 && (
                  <div className="bg-[#35156B]/5 border border-[#35156B]/20 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#35156B]" />
                      <span className="font-bold text-[#35156B]">Directly Linked to Past Exam Questions:</span>
                      <span className="text-stone-700">
                        {analysis.pyqLinkages.map((p: any) => `${p.exam} ${p.year} (${p.paper || p.topic})`).join(' • ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectArticle) onSelectArticle(art);
                        else setActiveModalArticle(art);
                      }}
                      className="text-xs font-bold text-[#35156B] bg-[#35156B]/10 hover:bg-[#35156B]/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Deep Analysis & Model Answers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleAskTutor(e, art)}
                      className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#35156B]" />
                      <span>Ask AI Tutor</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      {art.editorialSource || art.source}
                    </span>

                    {art.sourceUrl && (
                      <a
                        href={art.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-stone-400 hover:text-[#35156B] transition-colors p-1"
                        title="View Original Editorial"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal View for Deep Editorial Breakdown */}
      {activeModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-stone-50/70 rounded-t-3xl sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase border px-3 py-1 rounded-full bg-purple-50 text-purple-900 border-purple-200">
                  {activeModalArticle.articleType || 'EDITORIAL'}
                </span>
                <span className="text-[10px] font-bold bg-stone-200/80 text-stone-800 px-2.5 py-1 rounded-full">
                  {activeModalArticle.source}
                </span>
                {activeModalArticle.gsPaper && (
                  <span className="text-[10px] font-extrabold bg-[#35156B]/10 text-[#35156B] px-2.5 py-1 rounded-full">
                    {activeModalArticle.gsPaper}
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveModalArticle(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto font-sans leading-relaxed">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Published on {formatDateHuman(activeModalArticle.date)}</span>
                  <span>•</span>
                  <span>{activeModalArticle.editorialSource || activeModalArticle.source}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111426] font-serif leading-tight">
                  {activeModalArticle.title}
                </h1>
              </div>

              {/* Core Argument */}
              <div className="bg-purple-50/60 border border-purple-200/70 p-4 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-700" />
                  <span>Core Editorial Thesis & Debate Foundation</span>
                </span>
                <p className="text-xs sm:text-sm text-stone-800 italic font-serif leading-relaxed">
                  "{activeModalArticle.editorialAnalysis?.coreArgument || activeModalArticle.whyInNews || activeModalArticle.summary}"
                </p>
              </div>

              {/* Background Context */}
              {activeModalArticle.whatHappened && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Editorial Context & Facts</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {activeModalArticle.whatHappened}
                  </p>
                </div>
              )}

              {/* Dual Debate Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {activeModalArticle.editorialAnalysis?.argumentsFor && activeModalArticle.editorialAnalysis.argumentsFor.length > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Arguments in Favor</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-800">
                      {activeModalArticle.editorialAnalysis.argumentsFor.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeModalArticle.editorialAnalysis?.argumentsAgainst && activeModalArticle.editorialAnalysis.argumentsAgainst.length > 0 && (
                  <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>Challenges & Counterarguments</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-800">
                      {activeModalArticle.editorialAnalysis.argumentsAgainst.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Constitutional & Statutory Articles */}
              {activeModalArticle.editorialAnalysis?.constitutionalDimensions && activeModalArticle.editorialAnalysis.constitutionalDimensions.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900 block">
                    Constitutional & Statutory Articles Linked:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeModalArticle.editorialAnalysis.constitutionalDimensions.map((dim, i) => (
                      <span key={i} className="text-xs bg-white text-purple-900 border border-purple-200 px-3 py-1 rounded-xl font-medium shadow-2xs">
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/70 rounded-b-3xl flex items-center justify-between gap-3 sticky bottom-0 z-10">
              <button
                onClick={(e) => handleAskTutor(e, activeModalArticle)}
                className="text-xs font-bold text-amber-300 bg-[#35156B] hover:bg-[#4B1F78] px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Discuss with AI Tutor</span>
              </button>

              <button
                onClick={() => setActiveModalArticle(null)}
                className="text-xs font-bold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

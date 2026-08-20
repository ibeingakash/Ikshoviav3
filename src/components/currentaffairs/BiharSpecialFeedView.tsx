import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Target,
  ArrowRight,
  Share2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';
import { formatDateHuman } from '../../lib/dateUtils.js';

interface BiharSpecialFeedViewProps {
  onSelectArticle?: (article: CurrentAffairArticle) => void;
}

export const BiharSpecialFeedView: React.FC<BiharSpecialFeedViewProps> = ({ onSelectArticle }) => {
  const { askTutorWithContext } = useLearner();
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [policyHighlights, setPolicyHighlights] = useState<{
    title: string;
    sector: string;
    bpscPaper: string;
    summary: string;
    targetYear: string;
  }[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string; formatted: string; count: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Bihar Topics' },
    { id: 'Water Resources & River Interlinking', label: 'Water & River Linking' },
    { id: 'Industrial Growth & Employment', label: 'Industry & Economy' },
    { id: 'Governance & Social Welfare', label: 'Governance & Social' },
    { id: 'Environment & Agriculture', label: 'Agri & Ecology' },
  ];

  // Fetch available dates first
  useEffect(() => {
    api.getAvailableBiharDates().then(dates => {
      if (Array.isArray(dates) && dates.length > 0) {
        setAvailableDates(dates);
        if (!selectedDate) {
          // Default to first active date
          const firstWithCount = dates.find(d => d.count > 0) || dates[0];
          setSelectedDate(firstWithCount.date);
        }
      }
    }).catch(() => {});
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await api.getBiharFeed({
        date: selectedDate && selectedDate !== 'ALL' ? selectedDate : undefined,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });

      setArticles(feed.articles || []);
      setPolicyHighlights(feed.policyHighlights || []);
      if (feed.availableDates && feed.availableDates.length > 0) {
        setAvailableDates(feed.availableDates);
      }
      setTotalCount(feed.totalArticles || 0);
      setTotalPages(feed.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch Bihar special feed:', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedCategory, searchQuery, page]);

  useEffect(() => {
    fetchFeed();
  }, [selectedDate, selectedCategory, page, fetchFeed]);

  const handlePreviousDay = () => {
    if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(d => d.date === selectedDate);
      if (currentIndex !== -1 && currentIndex + 1 < availableDates.length) {
        setSelectedDate(availableDates[currentIndex + 1].date);
        setPage(1);
        return;
      }
    }
    const cur = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
    setPage(1);
  };

  const handleNextDay = () => {
    if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(d => d.date === selectedDate);
      if (currentIndex > 0) {
        setSelectedDate(availableDates[currentIndex - 1].date);
        setPage(1);
        return;
      }
    }
    const cur = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
    setPage(1);
  };

  const handleBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.bookmarkCurrentAffairForRevision(id);
      setBookmarkedIds(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to bookmark Bihar current affair:', err);
    }
  };

  const handleAskTutor = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    askTutorWithContext(
      `Please provide BPSC exam-oriented insights, Bihar State GK linkage, and Mains GS-1/GS-2 analytical notes for: "${art.title}"`,
      {
        subjectName: 'Bihar Special Current Affairs & State GK',
        pageContext: `Bihar Current Affairs: ${art.title}. Why in news: ${art.whyInNews || art.summary}. Key Facts: ${(art.keyFacts || []).join('; ')}. BPSC relevance: ${art.biharRelevance || 'High relevance for BPSC CCE Prelims and Mains.'}`,
        conceptTitle: art.title,
        conceptSummary: art.whyInNews || art.summary,
      }
    );
  };

  const handleShare = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${art.title} — Bihar Special Current Affairs (BPSC Desk)`);
      setCopiedId(art.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getSourceClassification = (sourceType?: string, source?: string) => {
    const s = (source || '').toLowerCase();
    if (
      sourceType === 'SUPPLEMENTARY_REFERENCE' ||
      sourceType === 'EDUCATIONAL_ANALYSIS' ||
      s.includes('drishti') ||
      s.includes('reference') ||
      s.includes('synthesis') ||
      s.includes('educational')
    ) {
      return { label: 'REFERENCE / SYNTHESIS', bg: 'bg-amber-50 text-amber-900 border-amber-300' };
    }
    if (
      sourceType === 'PRIMARY_GOVT' ||
      sourceType === 'OFFICIAL_PORTAL' ||
      s.includes('iprd') ||
      s.includes('pib') ||
      s.includes('state gazette') ||
      s.includes('cabinet') ||
      s.includes('department') ||
      (s.includes('bihar') && !s.includes('synthesis') && !s.includes('reference')) ||
      s.includes('gov')
    ) {
      return { label: 'PRIMARY / OFFICIAL', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { label: 'SECONDARY / NEWS', bg: 'bg-sky-50 text-sky-900 border-sky-200' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Bihar State Focus Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full tracking-wider">
              BPSC 71st CCE Desk
            </span>
            <span className="text-xs text-amber-200 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              Date-Wise Bihar State Policies & Regional Developments
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            Bihar Special Intelligence & Policy Tracker
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
            Evidence-based regional developments, Saat Nischay-3 initiatives, intra-state river interlinking, industrial policies, and Bihar state budget highlights mapped for 71st BPSC CCE.
          </p>
        </div>
      </div>

      {/* Policy Highlights Matrix */}
      {policyHighlights && policyHighlights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-700" />
              <span>Core Bihar Flagship Schemes & Strategic Missions</span>
            </h3>
            <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              High Yield for BPSC Mains
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policyHighlights.map((policy, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 p-3.5 rounded-xl hover:border-amber-400 hover:shadow-2xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-200">
                      {policy.sector}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {policy.bpscPaper} • Target {policy.targetYear}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 font-serif leading-snug">
                    {policy.title}
                  </h4>
                  <p className="text-xs text-stone-600 font-normal leading-relaxed">
                    {policy.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Date Bar */}
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

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-xs font-bold text-amber-950 font-serif">
                {selectedDate === 'ALL' ? 'All Historical Dates' : formatDateHuman(selectedDate, { includeWeekday: true })}
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
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Bihar topics, districts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setPage(1);
                  fetchFeed();
                }
              }}
              className="w-full bg-stone-50 border border-stone-200 text-xs text-stone-900 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-800"
            />
          </div>
        </div>

        {/* Date Selector Row */}
        {availableDates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-bold text-stone-500 mr-1 shrink-0 flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-amber-800" />
              Date Archive:
            </span>
            <button
              onClick={() => {
                setSelectedDate('ALL');
                setPage(1);
              }}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-amber-800 text-amber-100 font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Dates
            </button>
            {availableDates.map(d => (
              <button
                key={d.date}
                onClick={() => {
                  setSelectedDate(d.date);
                  setPage(1);
                }}
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedDate === d.date
                    ? 'bg-amber-800 text-amber-100 font-bold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{d.formatted}</span>
                <span className={`text-[9px] px-1 rounded-full ${
                  selectedDate === d.date ? 'bg-amber-950 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {d.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Domain Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 scrollbar-none">
          <span className="text-[11px] font-bold text-stone-500 shrink-0">Domain:</span>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategory(c.id);
                setPage(1);
              }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === c.id
                  ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2 font-medium">
          <Sparkles className="w-6 h-6 animate-spin text-amber-800" />
          <span>Curating Bihar state policy updates and BPSC examination linkages...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
          <MapPin className="w-10 h-10 text-amber-700/50 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">
            No Bihar Special records found for {selectedDate === 'ALL' ? 'selected filters' : formatDateHuman(selectedDate)}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try navigating to a previous date or resetting category filters to view verified Bihar state developments.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handlePreviousDay}
              className="text-xs font-bold text-amber-100 bg-amber-800 hover:bg-amber-900 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              View Previous Day
            </button>
            <button
              onClick={() => {
                setSelectedDate('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              View All Bihar Dates
            </button>
          </div>
        </div>
      )}

      {/* Articles Feed */}
      {!loading && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((art) => {
            const isBookmarked = bookmarkedIds[art.id] || art.isBookmarked;
            const cls = getSourceClassification(art.sourceType, art.source);

            return (
              <div
                key={art.id}
                onClick={() => onSelectArticle && onSelectArticle(art)}
                className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-2xs transition-all cursor-pointer space-y-3 relative group"
              >
                {/* Header Tag Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {art.category || 'Bihar Current Affairs'}
                    </span>
                    {art.subtopic && (
                      <span className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                        {art.subtopic}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      BPSC Prelims & Mains
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cls.bg}`}>
                      {cls.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-stone-400" />
                      {art.source}
                    </span>
                    <span>•</span>
                    <span>{formatDateHuman(art.date)}</span>
                  </div>
                </div>

                {/* Article Title */}
                <h3 className="text-base sm:text-lg font-bold text-stone-950 group-hover:text-amber-900 transition-colors font-serif leading-snug">
                  {art.title}
                </h3>

                {/* Summary / Why in News */}
                <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed line-clamp-3">
                  {art.whyInNews || art.summary || art.content}
                </p>

                {/* Key Facts / BPSC Pointers Preview */}
                {art.prelimsPointers && art.prelimsPointers.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                      Key BPSC Prelims Facts:
                    </span>
                    <ul className="text-xs text-amber-950 list-disc list-inside space-y-0.5">
                      {art.prelimsPointers.slice(0, 2).map((pt, pIdx) => (
                        <li key={pIdx} className="line-clamp-1">{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAskTutor(e, art)}
                      className="text-xs font-bold text-[#35156B] bg-[#35156B]/10 hover:bg-[#35156B]/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>BPSC Tutor Analysis</span>
                    </button>

                    <button
                      onClick={(e) => handleBookmark(e, art.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                        isBookmarked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{isBookmarked ? 'Saved' : 'Save for Revision'}</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(e, art)}
                      className="text-xs text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                      title="Share Article"
                    >
                      {copiedId === art.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 group-hover:translate-x-0.5 transition-transform">
                    <span>Read Full Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="text-xs font-bold text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          
          <span className="text-xs text-stone-500 font-semibold">
            Page {page} of {totalPages} ({totalCount} developments)
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="text-xs font-bold text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};

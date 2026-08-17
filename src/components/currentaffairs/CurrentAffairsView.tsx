import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  BookOpen,
  ExternalLink,
  Calendar,
  Search,
  Sparkles,
  ShieldCheck,
  Tag,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Target,
  Layers,
  ArrowRight,
  X,
  Share2,
  CheckCircle2,
  FileText,
  HelpCircle,
  Clock,
  Building2,
  Compass,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';

export const CurrentAffairsView: React.FC = () => {
  const { navigateToConcept, askTutorWithContext } = useLearner();
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [selectedArticle, setSelectedArticle] = useState<CurrentAffairArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [biharOnly, setBiharOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Polity & Governance',
    'Economy',
    'Science & Tech',
    'International Relations',
    'Environment',
    'Bihar Current Affairs',
  ];

  const dateRanges = [
    { id: 'ALL', label: 'All Dates' },
    { id: 'TODAY', label: 'Today' },
    { id: 'YESTERDAY', label: 'Yesterday' },
    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
  ];

  const fetchArticles = () => {
    setLoading(true);
    api.getCurrentAffairs({
      category: selectedCategory,
      dateRange: selectedDateRange,
      exam: selectedExam,
      biharOnly,
      search: searchQuery,
    }).then(list => {
      setArticles(Array.isArray(list) ? list : []);
      setLoading(false);
    }).catch(() => {
      setArticles([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedDateRange, selectedExam, biharOnly]);

  const handleBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.bookmarkCurrentAffairForRevision(id);
      setBookmarkedIds(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to bookmark current affair:', err);
    }
  };

  const handleAskTutor = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    askTutorWithContext(
      `Please explain the exam importance, core concepts, and key Prelims & Mains takeaways for: "${art.title}"`,
      {
        subjectName: art.relatedSubject || art.category,
        pageContext: `Current Affairs: ${art.title}. Why in news: ${art.whyInNews || art.summary}. Key facts: ${(art.keyFacts || []).join('; ')}. GS Paper: ${art.gsPaper || 'General Studies'}.`,
        conceptTitle: art.title,
        conceptSummary: art.whyInNews || art.summary,
      }
    );
  };

  const handleShare = (e: React.MouseEvent, art: CurrentAffairArticle) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${art.title} - Read on IKSHOVIA Current Affairs Intelligence`);
      setCopiedId(art.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Science & Tech':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Economy':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'Polity & Governance':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'Environment':
        return 'bg-teal-50 text-teal-900 border-teal-200';
      case 'International Relations':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      case 'Bihar Current Affairs':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              Exam Intelligence Desk
            </span>
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              Real-time Ingested & Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111426] tracking-tight flex items-center gap-2.5 font-serif">
            <Newspaper className="w-7 h-7 text-[#35156B]" />
            <span>Current Affairs & Policy Intelligence</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl font-normal leading-relaxed">
            Primary government source documentation transformed into structured, exam-oriented news analysis for UPSC CSE & BPSC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-emerald-950 block leading-none">Primary Govt Sources</span>
              <span className="text-[10px] text-emerald-700 font-medium">PIB • ISRO • RBI • NGT • State Portals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-stone-200/90 p-4 sm:p-5 rounded-2xl space-y-4 shadow-2xs">
        
        {/* Row 1: Target Exam & Bihar Focus */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#35156B]" />
            <span className="text-xs font-bold text-stone-700">Target Exam:</span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {['ALL', 'UPSC', 'BPSC'].map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExam(ex)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedExam === ex
                      ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {ex === 'ALL' ? 'All Exams' : ex}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setBiharOnly(!biharOnly)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              biharOnly
                ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
            <span>Bihar-Specific News Only</span>
          </button>
        </div>

        {/* Row 2: Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#35156B] text-amber-300 shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 3: Timeframe & Keyword Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
            <Calendar className="w-3.5 h-3.5 text-stone-400 ml-1 shrink-0" />
            <span className="text-[11px] font-bold text-stone-500 mr-1 shrink-0 whitespace-nowrap">Timeframe:</span>
            {dateRanges.map(dr => (
              <button
                key={dr.id}
                onClick={() => setSelectedDateRange(dr.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedDateRange === dr.id
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search headline, facts, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 text-xs text-stone-900 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[#35156B]"
            />
          </form>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2 font-medium">
          <Sparkles className="w-6 h-6 animate-spin text-[#35156B]" />
          <span>Curating verified current affairs & editorial intelligence...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4 shadow-2xs">
          <Newspaper className="w-10 h-10 text-stone-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-stone-900">No verified current affairs matching your filters</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
              We strictly enforce an Article Quality Gate to exclude homepages and non-event fragments. Try selecting 'All Exams' or resetting your filters.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDateRange('ALL');
                setSelectedExam('ALL');
                setBiharOnly(false);
                setSearchQuery('');
              }}
              className="text-xs font-bold bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* News Feed Articles List */}
      {!loading && articles.length > 0 && (
        <div className="space-y-6">
          {articles.map(art => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white border border-stone-200 hover:border-[#35156B]/40 p-5 sm:p-6 rounded-2xl space-y-4 transition-all shadow-2xs hover:shadow-xs cursor-pointer group relative"
            >
              {/* Header Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-full ${getCategoryColor(art.category)}`}>
                    {art.category}
                  </span>

                  {art.gsPaper && (
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded">
                      {art.gsPaper}
                    </span>
                  )}

                  {art.examRelevance && (
                    <span className="text-[10px] font-extrabold bg-[#35156B]/10 text-[#35156B] border border-[#35156B]/20 px-2 py-0.5 rounded">
                      {art.examRelevance}
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {art.date}
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
                    title="Copy Article Reference"
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

              {/* Why in News? */}
              <div className="bg-amber-50/50 border border-amber-200/70 p-3.5 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Compass className="w-3.5 h-3.5 text-amber-700" />
                  <span>Why in News?</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  {art.whyInNews || art.summary}
                </p>
              </div>

              {/* What Happened? Snippet */}
              {art.whatHappened && art.whatHappened !== art.whyInNews && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>What Happened:</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed pl-1">
                    {art.whatHappened}
                  </p>
                </div>
              )}

              {/* Key Facts Bullet List */}
              {art.keyFacts && art.keyFacts.length > 0 && (
                <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-stone-600" />
                    <span>Key Facts & Parameters:</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700 pl-1">
                    {art.keyFacts.slice(0, 4).map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#35156B] mt-1.5 shrink-0" />
                        <span className="leading-snug">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Why It Matters High-Yield Takeaway */}
              {art.whyItMatters && (
                <div className="text-xs text-stone-700 flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200/50">
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded shrink-0">
                    Why It Matters
                  </span>
                  <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                    {art.whyItMatters}
                  </p>
                </div>
              )}

              {/* Prelims & Mains Dual Preview Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Prelims Box */}
                {art.prelimsPointers && art.prelimsPointers.length > 0 && (
                  <div className="bg-[#35156B]/5 border border-[#35156B]/15 p-3 rounded-xl space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#35156B] flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#35156B]" />
                      <span>Prelims High-Yield Facts</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-stone-700">
                      {art.prelimsPointers.slice(0, 2).map((ptr, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-[#35156B] font-bold">•</span>
                          <span className="line-clamp-2">{ptr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mains Box */}
                {art.mainsDimensions && Object.keys(art.mainsDimensions).length > 0 && (
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#35156B]" />
                      <span>Mains Value Addition</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {Object.entries(art.mainsDimensions).slice(0, 1).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-bold text-[#35156B] text-[10px] uppercase block">{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="text-stone-600 line-clamp-2">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bihar Specific Angle (Only if genuine Bihar relevance exists) */}
              {art.biharRelevance && (
                <div className="bg-amber-50 border border-amber-300/90 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>BPSC Bihar-Specific Angle:</span>
                  </div>
                  <p className="text-xs text-amber-950/90 pl-5 font-medium">{art.biharRelevance}</p>
                </div>
              )}

              {/* Card Footer: Action Toolbar & Official Source */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArticle(art);
                    }}
                    className="text-xs font-bold text-[#35156B] bg-[#35156B]/10 hover:bg-[#35156B]/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Read Full Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleAskTutor(e, art)}
                    className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Ask AI Tutor</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-600 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    {art.source}
                  </span>

                  {art.sourceUrl && (
                    <a
                      href={art.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-stone-400 hover:text-[#35156B] transition-colors p-1"
                      title="View Official Source Release"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED FULL ARTICLE READER VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-stone-50/70 rounded-t-3xl sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase border px-3 py-1 rounded-full ${getCategoryColor(selectedArticle.category)}`}>
                  {selectedArticle.category}
                </span>
                {selectedArticle.gsPaper && (
                  <span className="text-[10px] font-bold bg-stone-200/80 text-stone-800 px-2.5 py-1 rounded-full">
                    {selectedArticle.gsPaper}
                  </span>
                )}
                {selectedArticle.examRelevance && (
                  <span className="text-[10px] font-extrabold bg-[#35156B]/10 text-[#35156B] px-2.5 py-1 rounded-full">
                    {selectedArticle.examRelevance}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Complete Structured Editorial News Document */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto font-sans leading-relaxed">
              
              {/* Date & Headline */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Published on {selectedArticle.date}</span>
                  <span>•</span>
                  <span>Verified by {selectedArticle.source}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111426] font-serif leading-tight">
                  {selectedArticle.title}
                </h1>
              </div>

              {/* Section: Why in News? */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-1.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>Why is this in today's Current Affairs?</span>
                </h3>
                <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                  {selectedArticle.whyInNews || selectedArticle.summary}
                </p>
              </div>

              {/* Section: What Happened? */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
                  <FileText className="w-4 h-4 text-[#35156B]" />
                  <span>What Happened (Essential Facts)</span>
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {selectedArticle.whatHappened || selectedArticle.summary}
                </p>
              </div>

              {/* Section: Background / Context */}
              {selectedArticle.background && (
                <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-stone-600" />
                    <span>Background & Historical Context</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {selectedArticle.background}
                  </p>
                </div>
              )}

              {/* Section: Key Facts & Figures */}
              {selectedArticle.keyFacts && selectedArticle.keyFacts.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
                    <Tag className="w-4 h-4 text-[#35156B]" />
                    <span>Key Facts, Parameters & Provisions</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedArticle.keyFacts.map((kf, i) => (
                      <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{kf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Why It Matters & Significance */}
              {selectedArticle.whyItMatters && (
                <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Why It Matters (Strategic / Governance Significance)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {selectedArticle.whyItMatters}
                  </p>
                </div>
              )}

              {/* Section: Implications */}
              {selectedArticle.implications && (
                <div className="space-y-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-700" />
                    <span>Implications & Policy Impact</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                    {selectedArticle.implications}
                  </p>
                </div>
              )}

              {/* Section: Prelims Takeaways */}
              {selectedArticle.prelimsPointers && selectedArticle.prelimsPointers.length > 0 && (
                <div className="bg-[#35156B]/5 border border-[#35156B]/20 p-4 sm:p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#35156B] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#35156B]" />
                      <span>Prelims — High-Yield Examination Points</span>
                    </h3>
                    <span className="text-[10px] font-bold bg-[#35156B] text-amber-300 px-2.5 py-0.5 rounded-full">
                      Must Remember
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-800">
                    {selectedArticle.prelimsPointers.map((ptr, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#35156B]/10">
                        <span className="w-5 h-5 rounded-full bg-[#35156B] text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{ptr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section: Mains Dimensions */}
              {selectedArticle.mainsDimensions && Object.keys(selectedArticle.mainsDimensions).length > 0 && (
                <div className="bg-stone-50 border border-stone-200 p-4 sm:p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#35156B]" />
                      <span>Mains — Dimensions & Value Addition</span>
                    </h3>
                    <span className="text-[10px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      {selectedArticle.gsPaper || 'GS Paper'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedArticle.mainsDimensions).map(([k, v]) => (
                      <div key={k} className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase text-[#35156B] block mb-1">
                          {k.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <p className="text-xs text-stone-700 leading-relaxed">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Bihar Relevance */}
              {selectedArticle.biharRelevance && (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-1.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    <span>BPSC Bihar-Specific Angle</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    {selectedArticle.biharRelevance}
                  </p>
                </div>
              )}

              {/* Linked Static Concepts */}
              {selectedArticle.relatedConceptIds && selectedArticle.relatedConceptIds.length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                    Linked Static Syllabus Concepts:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedArticle.relatedConceptIds.map(cid => (
                      <button
                        key={cid}
                        onClick={() => {
                          setSelectedArticle(null);
                          navigateToConcept(cid);
                        }}
                        className="text-xs text-[#35156B] bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#35156B]" />
                        <span>{cid === 'c_art32' ? 'Article 32 Writs' : cid === 'c_art226' ? 'Article 226 Writs' : cid === 'c_rbi_mpc' ? 'RBI Monetary Policy Committee' : cid === 'c_isro_gaganyaan' ? 'ISRO Gaganyaan Mission' : 'Static Concept'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Source Reference */}
              <div className="bg-stone-100/70 p-4 rounded-2xl text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-stone-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-stone-500 shrink-0" />
                  <div>
                    <span className="font-bold text-stone-800 block">Official Source Attribution:</span>
                    <span>{selectedArticle.source}</span>
                  </div>
                </div>

                {selectedArticle.sourceUrl && (
                  <a
                    href={selectedArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#35156B] hover:text-[#4B1F78] flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-stone-50 transition-colors"
                  >
                    <span>View Official Government Notification</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/90 rounded-b-3xl flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleBookmark(e, selectedArticle.id)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                    bookmarkedIds[selectedArticle.id]
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {bookmarkedIds[selectedArticle.id] ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bookmarked for Spaced Revision</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-stone-400" />
                      <span>Add to Spaced Revision</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    handleAskTutor(e, selectedArticle);
                    setSelectedArticle(null);
                  }}
                  className="text-xs font-bold text-white bg-[#35156B] hover:bg-[#4B1F78] px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Ask AI Tutor About This</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-2 cursor-pointer"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Newspaper, BookOpen, ExternalLink, Calendar, Search, Sparkles, CheckCircle2, ShieldCheck, Tag, Bookmark, BookmarkCheck, MapPin, Target, Layers } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';

export const CurrentAffairsView: React.FC = () => {
  const { navigateToConcept } = useLearner();
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

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

  const handleBookmark = async (id: string) => {
    try {
      await api.bookmarkCurrentAffairForRevision(id);
      setBookmarkedIds(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to bookmark current affair:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-200 pb-4 gap-4 font-sans-editorial">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[#35156B]" />
            <span>Current Affairs Intelligence Feed</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            UPSC CSE & BPSC Exam-Oriented Source Provenance, Prelims Pointers, Mains Dimensions & Spaced Revision.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-900">Verified Primary Sources Only</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200/90 p-4 sm:p-5 rounded-2xl space-y-4 shadow-2xs">
        
        {/* Exam & Category Selector Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
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
            <span>Bihar-Specific Focus</span>
          </button>
        </div>

        {/* Category Tabs */}
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

        {/* Date Filter & Search */}
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
              placeholder="Search news, topics, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 text-xs text-stone-900 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[#35156B]"
            />
          </form>
        </div>
      </div>

      {/* Content State */}
      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-[#35156B]" />
          <span>Fetching verified current affairs intelligence records...</span>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4 shadow-2xs">
          <Newspaper className="w-8 h-8 text-stone-400 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-stone-900">No current affairs match these filters</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              There are no published articles matching your current filter selection. Try broadening your timeframe or target exam.
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

      {!loading && (Array.isArray(articles) ? articles : []).length > 0 && (
        <div className="space-y-4">
          {(Array.isArray(articles) ? articles : []).map(art => (
            <div
              key={art.id}
              className="bg-white border border-stone-200 hover:border-amber-400/60 p-5 rounded-2xl space-y-4 transition-all shadow-2xs"
            >
              {/* Badges & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-[#35156B]/10 text-[#35156B] border border-[#35156B]/20 px-2.5 py-0.5 rounded-full">
                    {art.category}
                  </span>

                  {art.examRelevance && (
                    <span className="text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded">
                      {art.examRelevance}
                    </span>
                  )}

                  {art.subtopic && (
                    <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {art.subtopic}
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {art.date}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBookmark(art.id)}
                    className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                      bookmarkedIds[art.id]
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {bookmarkedIds[art.id] ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bookmarked</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                        <span>Revise</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{art.sourceType || 'PRIMARY_GOVT'}</span>
                  </span>

                  {art.sourceUrl && (
                    <a
                      href={art.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#35156B] hover:text-[#4B1F78] flex items-center gap-1 font-semibold hover:underline"
                    >
                      <span>{art.source}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Summary */}
              <div>
                <h2 className="text-base font-bold text-[#111426] mb-2">{art.title}</h2>
                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                  {art.summary}
                </p>
              </div>

              {/* Bihar Specific Relevance Highlight */}
              {art.biharRelevance && (
                <div className="bg-amber-50/90 border border-amber-300/80 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>BPSC Bihar-Specific Angle:</span>
                  </div>
                  <p className="text-xs text-amber-950/90 pl-5">{art.biharRelevance}</p>
                </div>
              )}

              {/* Prelims Pointers */}
              {art.prelimsPointers && art.prelimsPointers.length > 0 && (
                <div className="space-y-1.5 bg-[#35156B]/5 p-3 rounded-xl border border-[#35156B]/15">
                  <div className="text-[11px] font-bold text-[#35156B] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Prelims High-Yield Facts & Pointers:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-700 pl-1">
                    {art.prelimsPointers.map((pointer, i) => (
                      <li key={i}>{pointer}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mains Dimensions Breakdown */}
              {art.mainsDimensions && Object.keys(art.mainsDimensions).length > 0 && (
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                  <div className="text-[11px] font-bold text-stone-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Mains Value Addition Dimensions:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {Object.entries(art.mainsDimensions).map(([key, val]) => (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                        <span className="font-bold capitalize text-[10px] uppercase block mb-0.5 text-[#35156B]">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <p className="text-stone-600 text-[11px] leading-snug">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Static Concepts */}
              {art.relatedConceptIds && art.relatedConceptIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-400">Linked Static Syllabus Concepts:</span>
                  {art.relatedConceptIds.map(cid => (
                    <button
                      key={cid}
                      onClick={() => navigateToConcept(cid)}
                      className="text-xs text-[#35156B] bg-amber-50 border border-amber-200/90 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-[#35156B]" />
                      <span>{cid === 'c_art32' ? 'Article 32 Writs' : cid === 'c_art226' ? 'Article 226 Writs' : cid === 'c_mpc' ? 'Monetary Policy Committee' : 'Static Concept'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

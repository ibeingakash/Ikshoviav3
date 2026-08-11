import React, { useState, useEffect } from 'react';
import { Newspaper, BookOpen, ExternalLink, Calendar, Filter, Search, Sparkles, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';

export const CurrentAffairsView: React.FC = () => {
  const { navigateToConcept } = useLearner();
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Polity & Governance',
    'Economy',
    'Science & Tech',
    'International Relations',
    'Environment',
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
      search: searchQuery,
    }).then(list => {
      setArticles(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedDateRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-400" />
            <span>Verified Current Affairs & Static Mapping</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real, source-backed news updates linked directly to static syllabus concepts with primary provenance.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">Official Govt & Primary Sources Only</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Date Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-[11px] font-bold text-slate-400 mr-1">Timeframe:</span>
            {dateRanges.map(dr => (
              <button
                key={dr.id}
                onClick={() => setSelectedDateRange(dr.id)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                  selectedDateRange === dr.id
                    ? 'bg-indigo-900 text-indigo-200 border border-indigo-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search current affairs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>
      </div>

      {/* Content State */}
      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
          <span>Fetching verified current affairs records...</span>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <Newspaper className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No verified current affairs found for the selected filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try switching to "All Category" or "All Dates" to explore the full repository of source-backed civil services articles.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDateRange('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-5">
          {articles.map(art => (
            <div
              key={art.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-4 transition-all shadow-md"
            >
              {/* Badges & Source */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full">
                    {art.category}
                  </span>

                  {art.subtopic && (
                    <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {art.subtopic}
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {art.date}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{art.sourceType || 'PRIMARY_GOVT'}</span>
                  </span>

                  {art.sourceUrl && (
                    <a
                      href={art.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <span>{art.source}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Summary */}
              <div>
                <h2 className="text-base font-bold text-white mb-2">{art.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {art.summary}
                </p>
              </div>

              {/* Key Exam Facts */}
              {art.keyFacts && art.keyFacts.length > 0 && (
                <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Key Exam Facts & Memory Points:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-1">
                    {art.keyFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prelims & Mains Relevance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-indigo-950/30 border border-indigo-900/50 p-2.5 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider">Prelims Relevance:</span>
                  <p className="text-xs text-slate-300 mt-0.5">{art.prelimsRelevance}</p>
                </div>

                <div className="bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">Mains Value Addition:</span>
                  <p className="text-xs text-slate-300 mt-0.5">{art.mainsRelevance}</p>
                </div>
              </div>

              {/* Linked Static Concepts */}
              {art.relatedConceptIds && art.relatedConceptIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400">Linked Static Concepts:</span>
                  {art.relatedConceptIds.map(cid => (
                    <button
                      key={cid}
                      onClick={() => navigateToConcept(cid)}
                      className="text-xs text-indigo-300 bg-indigo-950 border border-indigo-800 hover:bg-indigo-900 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3 h-3 text-indigo-400" />
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

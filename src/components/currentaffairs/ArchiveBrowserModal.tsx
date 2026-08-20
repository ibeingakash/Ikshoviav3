import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Search,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { CurrentAffairArticle } from '../../types/index.js';
import { formatDateHuman } from '../../lib/dateUtils.js';

interface ArchiveBrowserModalProps {
  onClose: () => void;
  onSelectDate: (date: string) => void;
  onSelectArticle: (article: CurrentAffairArticle) => void;
}

export const ArchiveBrowserModal: React.FC<ArchiveBrowserModalProps> = ({
  onClose,
  onSelectDate,
  onSelectArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [archiveData, setArchiveData] = useState<{
    groupedByDate: {
      date: string;
      formattedDate: string;
      count: number;
      articles: CurrentAffairArticle[];
    }[];
    totalArticles: number;
    totalPages: number;
    hasMore: boolean;
  }>({
    groupedByDate: [],
    totalArticles: 0,
    totalPages: 1,
    hasMore: false,
  });

  const categories = [
    'All',
    'Polity & Governance',
    'Economy',
    'Science & Tech',
    'International Relations',
    'Environment',
    'Bihar Current Affairs',
  ];

  const fetchArchive = (targetPage = 1) => {
    setLoading(true);
    api.getCurrentAffairsArchive({
      search: searchQuery || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      exam: selectedExam !== 'ALL' ? selectedExam : undefined,
      date: customDate || undefined,
      page: targetPage,
      limit: 12,
    }).then(res => {
      setArchiveData(res);
      setPage(targetPage);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchArchive(1);
  }, [selectedCategory, selectedExam, customDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchive(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/80 rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#35156B]" />
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">Current Affairs Archive & Calendar</h2>
              <p className="text-xs text-stone-500 font-normal">Search historical policy releases, Supreme Court verdicts, and verified news developments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/40 space-y-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search past events, keywords, bills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 text-xs text-stone-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#35156B]"
              />
            </form>

            {/* Exact Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600 shrink-0">Exact Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="bg-white border border-stone-200 text-xs text-stone-800 px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#35156B]"
              />
              {customDate && (
                <button
                  onClick={() => setCustomDate('')}
                  className="text-xs text-stone-400 hover:text-stone-700 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category & Exam Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#35156B] text-amber-300 shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl">
              {['ALL', 'UPSC', 'BPSC'].map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExam(ex)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                    selectedExam === ex
                      ? 'bg-[#35156B] text-amber-300 font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {ex === 'ALL' ? 'All Exams' : ex}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Body: Date-Grouped Bounded Feed */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {loading && (
            <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 animate-spin text-[#35156B]" />
              <span>Fetching archived records...</span>
            </div>
          )}

          {!loading && archiveData.groupedByDate.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800">No archived articles found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">Try clearing search keywords or selecting a broader date range.</p>
            </div>
          )}

          {!loading && archiveData.groupedByDate.map(group => (
            <div key={group.date} className="space-y-3">
              
              {/* Date Header Strip */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#35156B]" />
                  <span className="text-sm font-bold text-stone-900 font-serif">{formatDateHuman(group.formattedDate || group.date, { includeWeekday: true })}</span>
                  <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {group.count} {group.count === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onSelectDate(group.date);
                    onClose();
                  }}
                  className="text-xs font-bold text-[#35156B] hover:text-[#4B1F78] flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Day Reader</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Articles Grid for this Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.articles.map(art => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="bg-white border border-stone-200 hover:border-[#35156B]/50 p-4 rounded-xl space-y-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span className="font-bold text-[#35156B] bg-[#35156B]/10 px-2 py-0.5 rounded">
                        {art.category}
                      </span>
                      {art.gsPaper && (
                        <span className="font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                          {art.gsPaper}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#35156B] transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h4>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {art.whyInNews || art.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 font-medium text-stone-600">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          {art.source}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          art.sourceType === 'PRIMARY_GOVT' || (art.source && (art.source.includes('PIB') || art.source.includes('ISRO') || art.source.includes('RBI') || art.source.includes('Supreme Court') || art.source.includes('Ministry') || art.source.includes('Bihar')))
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : art.sourceType === 'EDUCATIONAL_ANALYSIS' || (art.source && art.source.includes('Drishti'))
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                        }`}>
                          {art.sourceType === 'PRIMARY_GOVT' || (art.source && (art.source.includes('PIB') || art.source.includes('ISRO') || art.source.includes('RBI') || art.source.includes('Supreme Court') || art.source.includes('Ministry') || art.source.includes('Bihar')))
                            ? 'Primary Official'
                            : art.sourceType === 'EDUCATIONAL_ANALYSIS' || (art.source && art.source.includes('Drishti'))
                            ? 'Reference / Educational'
                            : 'News / Secondary'}
                        </span>
                      </div>
                      <span className="text-[#35156B] font-bold group-hover:underline">Read →</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>

        {/* Modal Pagination Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/80 rounded-b-3xl flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Total {archiveData.totalArticles} articles • Page {page} of {archiveData.totalPages || 1}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchArchive(page - 1)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= archiveData.totalPages}
              onClick={() => fetchArchive(page + 1)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

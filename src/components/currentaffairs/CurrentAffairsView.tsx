import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle2,
  FileText,
  HelpCircle,
  Clock,
  Building2,
  Compass,
  AlertCircle,
  Scale,
  RefreshCw,
  Archive,
  GraduationCap
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';
import { formatDateHuman } from '../../lib/dateUtils.js';
import { EditorialFeedView } from './EditorialFeedView.js';
import { BiharSpecialFeedView } from './BiharSpecialFeedView.js';
import { TopicClusterExplorer } from './TopicClusterExplorer.js';
import { ArticleReaderModal } from './ArticleReaderModal.js';
import { ArchiveBrowserModal } from './ArchiveBrowserModal.js';

export const CurrentAffairsView: React.FC = () => {
  const { askTutorWithContext } = useLearner();

  // Parse URL query params on initial load
  const getInitialStateFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const validTabs = ['DAILY', 'EDITORIALS', 'BIHAR', 'CLUSTERS', 'REVISIONS'];
      const tab = validTabs.includes(tabParam?.toUpperCase() || '') ? (tabParam?.toUpperCase() as any) : 'DAILY';
      const date = params.get('date') || '';
      const exam = params.get('exam') || 'ALL';
      const category = params.get('category') || 'All';
      const page = parseInt(params.get('page') || '1', 10);
      return { tab, date, exam, category, page: isNaN(page) || page < 1 ? 1 : page };
    } catch {
      return { tab: 'DAILY' as const, date: '', exam: 'ALL', category: 'All', page: 1 };
    }
  };

  const initial = getInitialStateFromUrl();

  const [activeTab, setActiveTab] = useState<'DAILY' | 'EDITORIALS' | 'BIHAR' | 'CLUSTERS' | 'REVISIONS'>(initial.tab);
  
  // Day-Wise Reader State
  const [selectedDate, setSelectedDate] = useState<string>(initial.date);
  const [selectedExam, setSelectedExam] = useState<string>(initial.exam);
  const [selectedCategory, setSelectedCategory] = useState<string>(initial.category);
  const [biharOnly, setBiharOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(initial.page);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync state to URL without reloading
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (activeTab !== 'DAILY') params.set('tab', activeTab.toLowerCase());
      else params.delete('tab');

      if (selectedDate) params.set('date', selectedDate);
      else params.delete('date');

      if (selectedExam !== 'ALL') params.set('exam', selectedExam);
      else params.delete('exam');

      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      else params.delete('category');

      if (currentPage > 1) params.set('page', String(currentPage));
      else params.delete('page');

      const queryString = params.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch {}
  }, [activeTab, selectedDate, selectedExam, selectedCategory, currentPage]);

  // Day Feed Response Data
  const [dayFeed, setDayFeed] = useState<{
    date: string;
    formattedDate: string;
    isToday: boolean;
    digest: {
      date: string;
      formattedDate: string;
      totalDiscovered: number;
      totalEligible: number;
      topStoriesCount: number;
      importantDevelopmentsCount: number;
      editorialsCount: number;
      topicClustersCount: number;
      sourcesCount: number;
      sourcesDetected: string[];
    };
    topStories: CurrentAffairArticle[];
    importantDevelopments: CurrentAffairArticle[];
    editorials: CurrentAffairArticle[];
    topicClusters: any[];
    availableDates: { date: string; formatted: string; count: number; isToday: boolean }[];
    pagination: {
      page: number;
      limit: number;
      totalImportant: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>({
    date: '',
    formattedDate: '',
    isToday: true,
    digest: {
      date: '',
      formattedDate: '',
      totalDiscovered: 0,
      totalEligible: 0,
      topStoriesCount: 0,
      importantDevelopmentsCount: 0,
      editorialsCount: 0,
      topicClustersCount: 0,
      sourcesCount: 0,
      sourcesDetected: [],
    },
    topStories: [],
    importantDevelopments: [],
    editorials: [],
    topicClusters: [],
    availableDates: [],
    pagination: { page: 1, limit: 10, totalImportant: 0, totalPages: 1, hasMore: false },
  });

  // Revisions tab state
  const [revisionArticles, setRevisionArticles] = useState<CurrentAffairArticle[]>([]);

  // Modals
  const [selectedArticle, setSelectedArticle] = useState<CurrentAffairArticle | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    'All',
    'Polity & Governance',
    'Economy',
    'Science & Tech',
    'International Relations',
    'Environment',
    'Bihar Current Affairs',
  ];

  const fetchDayFeed = useCallback((targetDate?: string, page = 1) => {
    setLoading(true);
    api.getDayCurrentAffairs({
      date: targetDate || (selectedDate || undefined),
      exam: selectedExam !== 'ALL' ? selectedExam : undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      biharOnly,
      page,
      limit: 10,
    }).then(res => {
      setDayFeed(res);
      if (res.date && !selectedDate) {
        setSelectedDate(res.date);
      }
      setCurrentPage(page);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch day feed:', err);
      setLoading(false);
    });
  }, [selectedDate, selectedExam, selectedCategory, biharOnly]);

  const fetchRevisions = () => {
    setLoading(true);
    api.getMyCurrentAffairsRevisions().then(list => {
      setRevisionArticles(Array.isArray(list) ? list : []);
      setLoading(false);
    }).catch(() => {
      setRevisionArticles([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (activeTab === 'DAILY') {
      fetchDayFeed(selectedDate, currentPage);
    } else if (activeTab === 'REVISIONS') {
      fetchRevisions();
    }
  }, [selectedDate, selectedExam, selectedCategory, biharOnly, activeTab, fetchDayFeed]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
    fetchDayFeed(newDate, 1);
  };

  const handlePreviousDay = () => {
    if (dayFeed.availableDates.length > 0) {
      const activeDate = selectedDate || dayFeed.date;
      const currentIndex = dayFeed.availableDates.findIndex(d => d.date === activeDate);
      if (currentIndex !== -1 && currentIndex + 1 < dayFeed.availableDates.length) {
        handleDateChange(dayFeed.availableDates[currentIndex + 1].date);
        return;
      }
    }
    // Fallback: calculate calendar previous day
    const cur = new Date(selectedDate || dayFeed.date || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() - 1);
    handleDateChange(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (dayFeed.availableDates.length > 0) {
      const activeDate = selectedDate || dayFeed.date;
      const currentIndex = dayFeed.availableDates.findIndex(d => d.date === activeDate);
      if (currentIndex > 0) {
        handleDateChange(dayFeed.availableDates[currentIndex - 1].date);
        return;
      }
    }
    // Fallback: calculate calendar next day
    const cur = new Date(selectedDate || dayFeed.date || new Date().toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
    handleDateChange(cur.toISOString().split('T')[0]);
  };

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
      navigator.clipboard.writeText(`${art.title} — IKSHOVIA Daily Current Affairs`);
      setCopiedId(art.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
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
      return { label: 'REFERENCE / SYNTHESIS', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
    }
    if (
      sourceType === 'PRIMARY_GOVT' ||
      sourceType === 'OFFICIAL_PORTAL' ||
      s.includes('pib') ||
      s.includes('rbi') ||
      s.includes('isro') ||
      s.includes('ministry') ||
      s.includes('supreme court') ||
      s.includes('iprd') ||
      (s.includes('bihar') && !s.includes('synthesis') && !s.includes('reference')) ||
      s.includes('gov')
    ) {
      return { label: 'PRIMARY / OFFICIAL', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { label: 'SECONDARY / NEWS', bg: 'bg-sky-50 text-sky-900 border-sky-200' };
  };

  // Helper to render pagination controls
  const renderPaginationControls = () => {
    const totalPages = dayFeed.pagination.totalPages;
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const current = currentPage;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 border border-stone-200 p-4 rounded-2xl shadow-2xs">
        <span className="text-xs text-stone-600 font-medium">
          Showing page <span className="font-bold text-stone-900">{current}</span> of <span className="font-bold text-stone-900">{totalPages}</span> ({dayFeed.pagination.totalImportant} additional developments)
        </span>

        <div className="flex items-center gap-1.5">
          <button
            disabled={current <= 1}
            onClick={() => {
              const newPage = current - 1;
              setCurrentPage(newPage);
              fetchDayFeed(selectedDate, newPage);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-bold flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {pages.map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPage(p);
                    fetchDayFeed(selectedDate, p);
                  }}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    current === p
                      ? 'bg-[#35156B] text-amber-300 shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-1 text-stone-400 text-xs font-bold">
                  ...
                </span>
              )
            ))}
          </div>

          <button
            disabled={current >= totalPages}
            onClick={() => {
              const newPage = current + 1;
              setCurrentPage(newPage);
              fetchDayFeed(selectedDate, newPage);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-bold flex items-center gap-1 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const totalArticlesForSelectedDate = dayFeed.topStories.length + dayFeed.importantDevelopments.length;

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              Daily Intelligence Desk
            </span>
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Day-Wise News Reader
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111426] tracking-tight flex items-center gap-2.5 font-serif">
            <Newspaper className="w-7 h-7 text-[#35156B]" />
            <span>Daily Current Affairs & Intelligence</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl font-normal leading-relaxed">
            Curated daily policy developments, Supreme Court judgments, and governance updates synthesized specifically for UPSC CSE & BPSC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-emerald-950 block leading-none">Verified Multi-Source Coverage</span>
              <span className="text-[10px] text-emerald-700 font-medium">Government • Newspapers • Verified Reference Sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('DAILY')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'DAILY'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Daily News Reader</span>
        </button>

        <button
          onClick={() => setActiveTab('EDITORIALS')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'EDITORIALS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Scale className="w-4 h-4 text-purple-600" />
          <span>Editorials & Op-Eds</span>
        </button>

        <button
          onClick={() => setActiveTab('BIHAR')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'BIHAR'
              ? 'bg-amber-900 text-amber-200 shadow-2xs font-extrabold border-amber-800'
              : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-700" />
          <span>Bihar Special (BPSC)</span>
        </button>

        <button
          onClick={() => setActiveTab('CLUSTERS')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CLUSTERS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Topic Clusters & Multi-Source</span>
        </button>

        <button
          onClick={() => setActiveTab('REVISIONS')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'REVISIONS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Bookmark className="w-4 h-4 text-emerald-600" />
          <span>Saved for Revision</span>
        </button>
      </div>

      {/* RENDER EDITORIALS SUBVIEW */}
      {activeTab === 'EDITORIALS' && (
        <EditorialFeedView onSelectArticle={(art) => setSelectedArticle(art)} />
      )}

      {/* RENDER BIHAR SPECIAL SUBVIEW */}
      {activeTab === 'BIHAR' && (
        <BiharSpecialFeedView onSelectArticle={(art) => setSelectedArticle(art)} />
      )}

      {/* RENDER TOPIC CLUSTERS SUBVIEW */}
      {activeTab === 'CLUSTERS' && (
        <TopicClusterExplorer />
      )}

      {/* RENDER DAILY NEWS READER EXPERIENCE */}
      {activeTab === 'DAILY' && (
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* COMPACT DATE NAVIGATOR & EXAM FILTER BAR */}
          {/* ========================================================================= */}
          <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl space-y-4 shadow-2xs">
            
            {/* Top Row: Active Date Highlight + Previous/Next Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePreviousDay}
                  title="Previous Day"
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev Day</span>
                </button>

                <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-300/80 px-3.5 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-800" />
                  <span className="text-sm font-bold text-amber-950 font-serif">
                    {formatDateHuman(dayFeed.formattedDate || selectedDate || 'Today', { includeWeekday: true })}
                  </span>
                  {dayFeed.isToday && (
                    <span className="text-[10px] font-extrabold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                      Today
                    </span>
                  )}
                </div>

                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <span className="hidden sm:inline">Next Day</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Archive / Calendar Modal Trigger */}
              <button
                onClick={() => setShowArchiveModal(true)}
                className="text-xs font-bold text-[#35156B] bg-[#35156B]/10 hover:bg-[#35156B]/15 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-[#35156B]/20"
              >
                <Archive className="w-4 h-4" />
                <span>Browse Archive / Calendar</span>
              </button>

            </div>

            {/* Middle Row: Quick Date Selector Pills */}
            {dayFeed.availableDates && dayFeed.availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-stone-400 mr-1 shrink-0 uppercase tracking-wider">
                  Recent Days:
                </span>
                {dayFeed.availableDates.slice(0, 8).map(d => {
                  const isSelected = (selectedDate || dayFeed.date) === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => handleDateChange(d.date)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#35156B] text-amber-300 border-[#35156B] shadow-2xs font-extrabold'
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200'
                      }`}
                    >
                      <span>{d.isToday ? 'Today' : d.formatted}</span>
                      {d.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {d.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom Row: Category Strip & Target Exam Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
              
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#35156B] text-amber-300 shadow-2xs font-extrabold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Target Exam & Bihar Focus Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {['ALL', 'UPSC', 'BPSC'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => {
                        setSelectedExam(ex);
                        setCurrentPage(1);
                      }}
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

                <button
                  onClick={() => {
                    setBiharOnly(!biharOnly);
                    setCurrentPage(1);
                  }}
                  className={`text-[11px] font-bold px-3 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                    biharOnly
                      ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs font-extrabold'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>Bihar Focus</span>
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* DAILY DIGEST SUMMARY BANNER */}
          {/* ========================================================================= */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#35156B]" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Daily Intelligence Digest — {formatDateHuman(dayFeed.formattedDate || selectedDate || 'Today')}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                {dayFeed.digest.sourcesCount} Verified Sources Detected
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-stone-200/70 p-3 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Total Curated</span>
                <span className="text-xl font-bold text-stone-900 font-serif">{dayFeed.digest.totalEligible}</span>
                <span className="text-[10px] text-stone-400 block">Qualifying Developments</span>
              </div>

              <div className="bg-white border border-stone-200/70 p-3 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Top Stories</span>
                <span className="text-xl font-bold text-[#35156B] font-serif">{dayFeed.digest.topStoriesCount}</span>
                <span className="text-[10px] text-stone-400 block">High-Yield Priority</span>
              </div>

              <div className="bg-white border border-stone-200/70 p-3 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Developments</span>
                <span className="text-xl font-bold text-emerald-900 font-serif">{dayFeed.digest.importantDevelopmentsCount}</span>
                <span className="text-[10px] text-stone-400 block">Supplementary News</span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2 font-medium">
              <Sparkles className="w-6 h-6 animate-spin text-[#35156B]" />
              <span>Loading verified current affairs for {formatDateHuman(selectedDate || 'Today')}...</span>
            </div>
          )}

          {/* Empty State for the Day */}
          {!loading && totalArticlesForSelectedDate === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4 shadow-2xs">
              <Newspaper className="w-10 h-10 text-stone-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  Today's verified coverage is currently unavailable
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
                  No verified current affairs records are available for this specific date under the current filter criteria.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handlePreviousDay}
                  className="text-xs font-bold bg-[#35156B] text-amber-300 hover:bg-[#4B1F78] px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  View Previous Day
                </button>
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Browse Archive
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: TODAY'S TOP STORIES (Highest Priority, No Duplicates) */}
          {/* ========================================================================= */}
          {!loading && dayFeed.topStories.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35156B]" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                    Top Stories
                  </h2>
                  <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {dayFeed.topStories.length} Prioritized
                  </span>
                </div>
                <span className="text-xs text-stone-500 hidden sm:inline">Ranked by UPSC & BPSC syllabus weightage</span>
              </div>

              <div className="space-y-4">
                {dayFeed.topStories.map(art => (
                  <article
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="bg-white border border-stone-200 hover:border-[#35156B]/50 p-5 sm:p-6 rounded-2xl space-y-3.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group relative"
                  >
                    {/* Meta Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
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

                        <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          {art.source}
                        </span>

                        {(() => {
                          const cls = getSourceClassification(art.sourceType, art.source);
                          return (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cls.bg}`}>
                              {cls.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleBookmark(e, art.id)}
                          title="Bookmark for Revision"
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                            bookmarkedIds[art.id]
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {bookmarkedIds[art.id] ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px]">Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                              <span className="text-[10px]">Save for Revision</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => handleShare(e, art)}
                          title="Share"
                          className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="text-lg sm:text-xl font-bold text-[#111426] group-hover:text-[#35156B] transition-colors font-serif leading-snug">
                      {art.title}
                    </h3>

                    {/* Why in News Banner */}
                    <div className="bg-amber-50/60 border border-amber-200/70 p-3 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-amber-950 flex items-center gap-1 uppercase tracking-wider">
                        <Compass className="w-3 h-3 text-amber-700" />
                        <span>Why in News?</span>
                      </div>
                      <p className="text-xs text-stone-800 font-medium leading-relaxed">
                        {art.whyInNews || art.summary}
                      </p>
                    </div>

                    {/* Key Facts Snippet */}
                    {art.keyFacts && art.keyFacts.length > 0 && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                        {art.keyFacts.slice(0, 2).map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#35156B] mt-1.5 shrink-0" />
                            <span className="line-clamp-2 leading-snug">{fact}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
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
                          className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#35156B]" />
                          <span>Ask AI Tutor</span>
                        </button>
                      </div>

                      {art.sourceUrl && (
                        <a
                          href={art.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-stone-400 hover:text-[#35156B] flex items-center gap-1"
                        >
                          <span>Official Release</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: IMPORTANT DEVELOPMENTS (With Pagination) */}
          {/* ========================================================================= */}
          {!loading && dayFeed.importantDevelopments.length > 0 && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                    Important Developments
                  </h2>
                  <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {dayFeed.pagination.totalImportant} Total
                  </span>
                </div>
                <span className="text-xs text-stone-500 hidden sm:inline">
                  Page {dayFeed.pagination.page} of {dayFeed.pagination.totalPages}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayFeed.importantDevelopments.map(art => (
                  <article
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="bg-white border border-stone-200 hover:border-[#35156B]/40 p-4 sm:p-5 rounded-2xl space-y-3 transition-all shadow-2xs hover:shadow-xs cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className={`font-extrabold uppercase border px-2 py-0.5 rounded-full ${getCategoryColor(art.category)}`}>
                          {art.category}
                        </span>
                        {art.gsPaper && (
                          <span className="font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                            {art.gsPaper}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#35156B] transition-colors leading-snug font-serif">
                        {art.title}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {art.whyInNews || art.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-medium text-stone-600">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          {art.source}
                        </span>
                        {(() => {
                          const cls = getSourceClassification(art.sourceType, art.source);
                          return (
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${cls.bg}`}>
                              {cls.label}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-bold text-[#35156B] group-hover:underline">Read →</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Render pagination control */}
              {renderPaginationControls()}
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: COMPACT NAVIGATION CARDS TO DEDICATED VIEWS */}
          {/* ========================================================================= */}
          {!loading && (
            <div className="pt-6 border-t border-stone-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                Explore Dedicated Current Affairs Portals:
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Editorials Card */}
                <div
                  onClick={() => setActiveTab('EDITORIALS')}
                  className="bg-purple-50/50 hover:bg-purple-50 border border-purple-200/80 hover:border-purple-300 p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                        <Scale className="w-4 h-4 text-purple-700" />
                        <span>Editorials & Op-Eds</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {dayFeed.digest.editorialsCount} Available
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Lead debates, opinion columns, and constitutional analyses from The Hindu & Indian Express.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-purple-900 group-hover:translate-x-1 transition-transform">
                    <span>Open Editorial Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Bihar Special Card */}
                <div
                  onClick={() => setActiveTab('BIHAR')}
                  className="bg-amber-50/50 hover:bg-amber-50 border border-amber-200/80 hover:border-amber-300 p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                        <MapPin className="w-4 h-4 text-amber-700" />
                        <span>Bihar Special (BPSC)</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                        BPSC Desk
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Date-wise Bihar state policies, Saat Nischay-3, infrastructure, and budget highlights.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 group-hover:translate-x-1 transition-transform">
                    <span>Open Bihar Special</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Topic Clusters Card */}
                <div
                  onClick={() => setActiveTab('CLUSTERS')}
                  className="bg-blue-50/50 hover:bg-blue-50 border border-blue-200/80 hover:border-blue-300 p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                        <Layers className="w-4 h-4 text-blue-700" />
                        <span>Topic Clusters</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {dayFeed.digest.topicClustersCount} Clusters
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Side-by-side multi-source synthesis, connected PYQs, and 360-degree AI Tutor briefing.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-900 group-hover:translate-x-1 transition-transform">
                    <span>Explore Clusters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RENDER REVISIONS TAB */}
      {activeTab === 'REVISIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-900">Saved Articles for Revision</h2>
              <p className="text-xs text-stone-500">Your bookmarked current affairs, editorials, and Bihar special briefings.</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
              {revisionArticles.length} Saved
            </span>
          </div>

          {revisionArticles.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-900 font-serif">No bookmarked articles yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Click the "Save for Revision" button on any news article or editorial to add it to your spaced repetition dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revisionArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-white border border-stone-200 p-5 rounded-2xl space-y-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold uppercase border px-2 py-0.5 rounded-full ${getCategoryColor(art.category)}`}>
                      {art.category}
                    </span>
                    <span className="text-stone-400 font-mono">{art.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#35156B] transition-colors font-serif leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {art.whyInNews || art.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-[#35156B] font-bold">
                    <span>Open in Reader →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED FULL ARTICLE READER MODAL */}
      {/* ========================================================================= */}
      {selectedArticle && (
        <ArticleReaderModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onBookmark={(id) => handleBookmark({ stopPropagation: () => {} } as any, id)}
          isBookmarked={Boolean(bookmarkedIds[selectedArticle.id])}
        />
      )}

      {/* ========================================================================= */}
      {/* ARCHIVE / CALENDAR BROWSER MODAL */}
      {/* ========================================================================= */}
      {showArchiveModal && (
        <ArchiveBrowserModal
          onClose={() => setShowArchiveModal(false)}
          onSelectDate={(d) => {
            handleDateChange(d);
            setShowArchiveModal(false);
          }}
          onSelectArticle={(art) => {
            setSelectedArticle(art);
            setShowArchiveModal(false);
          }}
        />
      )}

    </div>
  );
};

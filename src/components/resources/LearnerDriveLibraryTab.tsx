import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Bot,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Layers,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { ResourceReaderModal } from './ResourceReaderModal.js';
import { ResourceDetailModal } from './ResourceDetailModal.js';
import { ResourceAskAIDialog } from './ResourceAskAIDialog.js';
import { BookResourceCard } from './BookResourceCard.js';

export const LearnerDriveLibraryTab: React.FC = () => {
  const { askTutorWithContext } = useLearner();

  // Resources state
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [continueReading, setContinueReading] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [continueLoading, setContinueLoading] = useState<boolean>(false);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<'recent' | 'pages' | 'title' | 'progress'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [activeReaderResource, setActiveReaderResource] = useState<LearningResource | null>(null);
  const [activeDetailResource, setActiveDetailResource] = useState<LearningResource | null>(null);
  const [activeAskAIResource, setActiveAskAIResource] = useState<LearningResource | null>(null);

  // Filter metadata from backend
  const [filterMeta, setFilterMeta] = useState<{
    subjects: string[];
    topics: string[];
    resourceTypes: string[];
    exams: string[];
  }>({
    subjects: ['Indian Polity', 'Modern History', 'Economy', 'Environment & Ecology', 'Bihar Special', 'General Studies'],
    topics: [],
    resourceTypes: ['BOOK', 'NOTES', 'SYLLABUS', 'PREVIOUS_YEAR_QUESTION', 'ARTICLE'],
    exams: ['UPSC CSE', 'BPSC', 'ALL'],
  });

  // Load filter metadata once
  useEffect(() => {
    api.getResourceFiltersMeta().then((meta) => {
      if (meta) setFilterMeta(meta);
    }).catch(() => {});
  }, []);

  // Fetch Continue Reading shelf
  const fetchContinueReading = async () => {
    setContinueLoading(true);
    try {
      const items = await api.getContinueReading(6);
      const cleanItems = (items || []).filter((r: any) => (r.resource_type || r.type) !== 'SYLLABUS');
      setContinueReading(cleanItems);
    } catch (err) {
      console.error('Failed to load continue reading items:', err);
    } finally {
      setContinueLoading(false);
    }
  };

  useEffect(() => {
    fetchContinueReading();

    // Auto-open book if navigated from Global Search
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('book_id') || (window as any).__ikshovia_auto_open_book_id;
    if (bookId) {
      delete (window as any).__ikshovia_auto_open_book_id;
      api.getResource(bookId).then((res) => {
        if (res) {
          setActiveReaderResource(res);
          const url = new URL(window.location.href);
          url.searchParams.delete('book_id');
          window.history.replaceState({}, '', url.toString());
        }
      }).catch((err) => console.warn('Failed to auto-open searched book:', err));
    }
  }, []);

  // Fetch main resource listing
  const fetchResources = async () => {
    setLoading(true);
    try {
      if (onlyBookmarked) {
        const data = await api.getResourceBookmarks(1, 60);
        let list = (data.bookmarks || []).filter((r: any) => (r.resource_type || r.type) !== 'SYLLABUS');
        if (selectedSubject !== 'ALL') {
          list = list.filter((r) => r.subject === selectedSubject);
        }
        if (selectedType !== 'ALL') {
          list = list.filter((r) => (r.resource_type || r.type) === selectedType);
        }
        if (selectedExam !== 'ALL') {
          list = list.filter((r) => (r.exam || r.examTag) === selectedExam);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.author?.toLowerCase().includes(q) ||
              r.subject?.toLowerCase().includes(q)
          );
        }
        setResources(list);
      } else {
        const data = await api.getResources({
          subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
          exam: selectedExam !== 'ALL' ? selectedExam : undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
          search: searchQuery || undefined,
          sort: sortOption,
          limit: 60,
        });
        const cleanList = (data.resources || []).filter((r: any) => (r.resource_type || r.type) !== 'SYLLABUS');
        setResources(cleanList);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedSubject, selectedType, selectedExam, searchQuery, sortOption, onlyBookmarked]);

  const handleBookmarkToggle = async (resourceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.toggleResourceBookmark(resourceId);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, is_bookmarked: res.isBookmarked, isBookmarked: res.isBookmarked } : r
        )
      );
      setContinueReading((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, is_bookmarked: res.isBookmarked, isBookmarked: res.isBookmarked } : r
        )
      );
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  };

  const handleProgressUpdate = (resourceId: string, lastPage: number, progressPct: number) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId
          ? { ...r, last_page: lastPage, lastPage, progress_percentage: progressPct, progressPercentage: progressPct }
          : r
      )
    );
    // Refresh continue reading shelf silently
    fetchContinueReading();
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center text-amber-900 shadow-2xs">
                <BookOpen className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-serif-editorial text-stone-900">
                  Learner Resource Library
                </h1>
                <span className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider">
                  Books & Reference Material
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 mt-2 max-w-2xl leading-relaxed">
              Standard civil-services textbooks, NCERTs, official references, and verified learning documents with in-app reader & grounded AI Tutor.
            </p>
          </div>

          {/* Search Bar & View Mode */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search titles, authors, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-stone-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="List View"
                aria-label="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Exam Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">Exam:</span>
            {['ALL', 'UPSC CSE', 'BPSC'].map((exam) => (
              <button
                key={exam}
                onClick={() => setSelectedExam(exam)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedExam === exam
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {exam === 'ALL' ? 'All Exams' : exam}
              </button>
            ))}

            {/* Bookmarks Toggle */}
            <button
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`ml-2 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                onlyBookmarked
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-amber-700 text-amber-700' : 'text-stone-400'}`} />
              <span>Bookmarked</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="pages">Most Pages</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="progress">Reading Progress</option>
            </select>
          </div>
        </div>

        {/* Subjects & Types Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">Subject:</span>
          {['ALL', ...filterMeta.subjects.slice(0, 6)].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedSubject === s
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {s === 'ALL' ? 'All Subjects' : s}
            </button>
          ))}
        </div>
      </div>

      {/* CONTINUE READING SHELF */}
      {continueReading.length > 0 && !onlyBookmarked && (
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs sm:text-sm font-bold text-amber-950">Continue Reading</h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              {continueReading.length} in progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {continueReading.map((item) => {
              const totalP = Math.max(1, item.page_count || 1);
              const curP = item.last_page || item.lastPage || 1;
              const pct = item.progress_percentage !== undefined ? Number(item.progress_percentage) : Math.round((curP / totalP) * 100);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveDetailResource(item)}
                  className="bg-white p-3.5 rounded-xl border border-amber-200 hover:border-amber-400 transition shadow-2xs hover:shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-bold text-amber-800 uppercase tracking-wider">
                        {item.subject || 'General Studies'}
                      </span>
                      <span className="font-semibold text-stone-500">
                        Page {curP} of {totalP}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Progress Bar */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>Progress</span>
                        <span className="font-bold text-amber-700">{pct}%</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReaderResource(item);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Resume Page {curP}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAskAIResource(item);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Ask AI about this document"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN RESOURCES DIRECTORY */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-semibold text-stone-600">
            Showing <strong className="text-stone-900">{resources.length}</strong> verified learning documents
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs font-medium">Synchronizing resource library...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300" />
            <div>
              <h3 className="font-bold text-stone-800 text-sm">No resources match your filter criteria</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Try clearing active filters, changing your search terms, or toggling off the bookmarked filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedSubject('ALL');
                setSelectedType('ALL');
                setSelectedExam('ALL');
                setSearchQuery('');
                setOnlyBookmarked(false);
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <BookResourceCard
                key={res.id}
                resource={res}
                viewMode="grid"
                onOpenReader={(r) => setActiveReaderResource(r)}
                onOpenDetail={(r) => setActiveDetailResource(r)}
                onOpenAskAI={(r) => setActiveAskAIResource(r)}
                onToggleBookmark={handleBookmarkToggle}
              />
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-3">
            {resources.map((res) => (
              <BookResourceCard
                key={res.id}
                resource={res}
                viewMode="list"
                onOpenReader={(r) => setActiveReaderResource(r)}
                onOpenDetail={(r) => setActiveDetailResource(r)}
                onOpenAskAI={(r) => setActiveAskAIResource(r)}
                onToggleBookmark={handleBookmarkToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: IN-APP PDF STREAMING READER */}
      {activeReaderResource && (
        <ResourceReaderModal
          resource={activeReaderResource}
          isOpen={Boolean(activeReaderResource)}
          onClose={() => setActiveReaderResource(null)}
          onBookmarkChanged={(id, isBmk) => {
            setResources((prev) =>
              prev.map((r) => (r.id === id ? { ...r, is_bookmarked: isBmk, isBookmarked: isBmk } : r))
            );
          }}
          onProgressUpdated={handleProgressUpdate}
        />
      )}

      {/* MODAL 2: RESOURCE DETAIL & SYLLABUS VIEW */}
      {activeDetailResource && (
        <ResourceDetailModal
          resource={activeDetailResource}
          isOpen={Boolean(activeDetailResource)}
          onClose={() => setActiveDetailResource(null)}
          onOpenReader={(r) => setActiveReaderResource(r)}
          onBookmarkChanged={(id, isBmk) => {
            setResources((prev) =>
              prev.map((r) => (r.id === id ? { ...r, is_bookmarked: isBmk, isBookmarked: isBmk } : r))
            );
          }}
        />
      )}

      {/* MODAL 3: GROUNDED AI TUTOR DIALOG */}
      {activeAskAIResource && (
        <ResourceAskAIDialog
          resource={activeAskAIResource}
          currentPage={activeAskAIResource.last_page || activeAskAIResource.lastPage || 1}
          isOpen={Boolean(activeAskAIResource)}
          onClose={() => setActiveAskAIResource(null)}
        />
      )}
    </div>
  );
};

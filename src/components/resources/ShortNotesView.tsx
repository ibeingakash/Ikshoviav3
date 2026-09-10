import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Layers,
  Sparkles,
  Bot,
  ExternalLink,
  Download,
  Calendar,
  Clock,
  RotateCcw,
  Check,
  FileText,
  Table as TableIcon,
  ListOrdered,
  AlertCircle,
  Tag,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import {
  ShortNote,
  ShortNoteBlock,
  ShortNotesHierarchyResponse,
  ShortNotesSubjectNode,
} from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

interface ShortNotesViewProps {
  initialSubject?: string;
  initialTopic?: string;
  onBack?: () => void;
}

export const ShortNotesView: React.FC<ShortNotesViewProps> = ({
  initialSubject,
  initialTopic,
  onBack,
}) => {
  const { askTutorWithContext, setActiveSection } = useLearner();

  // Navigation states
  const [hierarchy, setHierarchy] = useState<ShortNotesHierarchyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || 'All');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'bookmarked' | 'reviewed'>('all');

  // Active Reader state
  const [activeNote, setActiveNote] = useState<ShortNote | null>(null);
  const [loadingNote, setLoadingNote] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Load hierarchy and note listing
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await api.getShortNotesHierarchy('ALL');
      setHierarchy(res);
    } catch (err) {
      console.error('Failed to load short notes hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // When activeNoteId changes, fetch full note details
  useEffect(() => {
    if (!activeNoteId) {
      setActiveNote(null);
      return;
    }
    let isMounted = true;
    setLoadingNote(true);

    api
      .getShortNoteById(activeNoteId)
      .then(res => {
        if (isMounted && res?.shortNote) {
          setActiveNote(res.shortNote);
        }
      })
      .catch(err => {
        console.error('Failed to fetch short note details:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingNote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeNoteId]);

  // Extract all notes flat list
  const allNotes = useMemo(() => {
    if (!hierarchy?.subjects) return [];
    const list: ShortNote[] = [];
    for (const sub of hierarchy.subjects) {
      for (const top of sub.topics) {
        for (const note of top.notes) {
          list.push(note);
        }
      }
    }
    return list;
  }, [hierarchy]);

  // Filter notes based on selections
  const filteredNotes = useMemo(() => {
    return allNotes.filter(note => {
      if (selectedSubject !== 'All' && note.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      if (selectedTopic !== 'All' && note.topic.toLowerCase() !== selectedTopic.toLowerCase()) {
        return false;
      }
      if (filterMode === 'bookmarked' && !note.isBookmarked) {
        return false;
      }
      if (filterMode === 'reviewed' && !note.isReviewed) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesTopic = note.topic.toLowerCase().includes(q);
        const matchesSubject = note.subject.toLowerCase().includes(q);
        const matchesTags = note.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTopic && !matchesSubject && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [allNotes, selectedSubject, selectedTopic, filterMode, searchQuery]);

  // Subject list for filters
  const subjectsList = useMemo(() => {
    if (!hierarchy?.subjects) return [];
    return hierarchy.subjects.map(s => s.subject);
  }, [hierarchy]);

  // Topics for the currently selected subject
  const availableTopics = useMemo(() => {
    if (!hierarchy?.subjects || selectedSubject === 'All') return [];
    const found = hierarchy.subjects.find(s => s.subject.toLowerCase() === selectedSubject.toLowerCase());
    return found ? found.topics.map(t => t.topic) : [];
  }, [hierarchy, selectedSubject]);

  // Handlers
  const handleToggleBookmark = async (noteId: string) => {
    try {
      const res = await api.toggleShortNoteBookmark(noteId);
      if (activeNote && activeNote.id === noteId) {
        setActiveNote({ ...activeNote, isBookmarked: res.bookmarked });
      }
      // Update in hierarchy cache
      setHierarchy(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          subjects: prev.subjects.map(sub => ({
            ...sub,
            topics: sub.topics.map(top => ({
              ...top,
              notes: top.notes.map(n => (n.id === noteId ? { ...n, isBookmarked: res.bookmarked } : n)),
            })),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleToggleReviewed = async (note: ShortNote) => {
    try {
      const newStatus = !note.isReviewed;
      const newPercentage = newStatus ? 100 : 0;
      await api.updateShortNoteProgress(note.id, {
        progressPercentage: newPercentage,
        isReviewed: newStatus,
      });

      if (activeNote && activeNote.id === note.id) {
        setActiveNote({
          ...activeNote,
          isReviewed: newStatus,
          progressPercentage: newPercentage,
        });
      }

      setHierarchy(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          subjects: prev.subjects.map(sub => ({
            ...sub,
            topics: sub.topics.map(top => ({
              ...top,
              notes: top.notes.map(n =>
                n.id === note.id ? { ...n, isReviewed: newStatus, progressPercentage: newPercentage } : n
              ),
            })),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to update review status:', err);
    }
  };

  const handleAskAITutor = (note: ShortNote) => {
    const promptContext = `I am revising the High-Yield Short Note on "${note.title}" for ${note.subject} (${note.topic}). Please give me an active recall test with 3 conceptual MCQs based on this topic and explain the high-yield prelims traps.`;
    askTutorWithContext(promptContext);
    setActiveSection('ai-tutor');
  };

  // ==========================================
  // RENDER: NOTE READER VIEW
  // ==========================================
  if (activeNoteId) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white border border-[#EAE6DF] rounded-xl px-5 py-3 shadow-2xs">
          <button
            onClick={() => setActiveNoteId(null)}
            className="flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            Back to Topics & Notes
          </button>

          <div className="flex items-center gap-3">
            {activeNote && (
              <>
                <button
                  onClick={() => handleToggleBookmark(activeNote.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeNote.isBookmarked
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="Bookmark this note"
                >
                  {activeNote.isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-stone-400" />
                  )}
                  {activeNote.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>

                <button
                  onClick={() => handleToggleReviewed(activeNote)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeNote.isReviewed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${activeNote.isReviewed ? 'text-emerald-600' : 'text-stone-400'}`}
                  />
                  {activeNote.isReviewed ? 'Reviewed' : 'Mark Reviewed'}
                </button>

                <button
                  onClick={() => handleAskAITutor(activeNote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                >
                  <Bot className="w-4 h-4 text-indigo-200" />
                  Discuss with AI Tutor
                </button>
              </>
            )}
          </div>
        </div>

        {loadingNote ? (
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-stone-500">Loading structured revision cards...</p>
          </div>
        ) : activeNote ? (
          <div className="space-y-6">
            {/* Note Metadata Header */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-2xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100/70 text-amber-900 tracking-wide uppercase">
                  {activeNote.subject}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-700">
                  {activeNote.topic}
                </span>
                {activeNote.exam && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                    {activeNote.exam}
                  </span>
                )}
                {activeNote.language && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-stone-400 bg-stone-50">
                    {activeNote.language}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-stone-900 tracking-tight leading-snug">
                {activeNote.title}
              </h1>

              {activeNote.description && (
                <p className="text-sm text-stone-600 mt-2 leading-relaxed font-sans max-w-3xl">
                  {activeNote.description}
                </p>
              )}

              {/* Tags & Source Document provenance */}
              <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  {activeNote.tags?.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-stone-50 text-stone-600 rounded text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>

                {activeNote.sourceFileUrl && (
                  <a
                    href={activeNote.sourceFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-semibold underline underline-offset-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Original Source Document (PDF)
                  </a>
                )}
              </div>
            </div>

            {/* Structured Content Blocks */}
            <div className="space-y-4">
              {activeNote.blocks && activeNote.blocks.length > 0 ? (
                activeNote.blocks.map(block => (
                  <StructuredBlockCard key={block.id} block={block} />
                ))
              ) : (
                <div className="bg-white border border-[#EAE6DF] rounded-xl p-8 text-center text-stone-500 text-xs">
                  No structured blocks available for this note.
                </div>
              )}
            </div>

            {/* Bottom Complete & Action Bar */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-stone-800">Completed this Revision Topic?</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Marking it as reviewed helps IKSHOVIA track your subject readiness.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleReviewed(activeNote)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    activeNote.isReviewed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  {activeNote.isReviewed ? '✓ Revision Completed' : 'Mark Revision Complete'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-8 text-center text-stone-500">
            Note not found or unavailable.
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: HIERARCHY & EXPLORE VIEW
  // ==========================================
  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Syllabus-Aligned High-Yield Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 tracking-tight">
              Short Notes & Revision Cards
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Structured micro-notes, comparative matrices, landmark timelines, and high-yield prelims pointers
              extracted from standard reference materials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prompt = 'Can you create a quick 5-minute revision schedule for my weak subjects based on the latest UPSC and BPSC syllabus?';
                askTutorWithContext(prompt);
                setActiveSection('ai-tutor');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              Ask AI Revision Plan
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concepts, acts, articles, matrices..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-400 font-medium mr-1">Filter:</span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({allNotes.length})
            </button>
            <button
              onClick={() => setFilterMode('bookmarked')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterMode === 'bookmarked'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Bookmarked
            </button>
            <button
              onClick={() => setFilterMode('reviewed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterMode === 'reviewed'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reviewed
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => {
              setSelectedSubject('All');
              setSelectedTopic('All');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedSubject === 'All'
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            All Subjects
          </button>
          {subjectsList.map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubject(sub);
                setSelectedTopic('All');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedSubject.toLowerCase() === sub.toLowerCase()
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Sub-Topic Pills if Subject Selected */}
        {selectedSubject !== 'All' && availableTopics.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-stone-400 font-medium">Topic:</span>
            <button
              onClick={() => setSelectedTopic('All')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedTopic === 'All'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Topics
            </button>
            {availableTopics.map(top => (
              <button
                key={top}
                onClick={() => setSelectedTopic(top)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedTopic.toLowerCase() === top.toLowerCase()
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {top}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-500">Loading structured notes catalog...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-16 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Revision Notes Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try resetting your search query or selecting a different subject/topic filter.
          </p>
          <button
            onClick={() => {
              setSelectedSubject('All');
              setSelectedTopic('All');
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="mt-3 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="bg-white border border-[#EAE6DF] hover:border-amber-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              onClick={() => setActiveNoteId(note.id)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/60 uppercase">
                      {note.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                      {note.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleBookmark(note.id)}
                      className="p-1 text-stone-400 hover:text-amber-600 transition-colors"
                      title="Bookmark"
                    >
                      {note.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-50" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-serif-editorial font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                  {note.title}
                </h3>

                {note.description && (
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {note.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  {note.isReviewed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Reviewed
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      {note.pageCount || 1} {note.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-stone-700 group-hover:text-amber-700 flex items-center gap-1 transition-colors">
                  Read Note <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: STRUCTURED BLOCK RENDERER
// ==========================================
interface StructuredBlockCardProps {
  block: ShortNoteBlock;
}

export const StructuredBlockCard: React.FC<StructuredBlockCardProps> = ({ block }) => {
  switch (block.type) {
    case 'heading':
      return (
        <div className="pt-3 pb-1">
          <h2 className="text-lg sm:text-xl font-serif-editorial font-bold text-stone-900 border-b border-stone-200 pb-2">
            {block.text}
          </h2>
        </div>
      );

    case 'subheading':
      return (
        <div className="pt-2">
          <h3 className="text-sm sm:text-base font-bold text-stone-800 tracking-tight">
            {block.text}
          </h3>
        </div>
      );

    case 'paragraph':
      return (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-2xs">
          <p className="text-stone-700 leading-relaxed text-sm whitespace-pre-wrap font-sans">
            {block.text}
          </p>
        </div>
      );

    case 'bullet_list':
    case 'numbered_list':
      return (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-2xs space-y-2">
          <ul className="space-y-2">
            {block.items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
                {block.type === 'numbered_list' ? (
                  <span className="font-bold text-amber-800 shrink-0">{idx + 1}.</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-2 shrink-0" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'table':
      return (
        <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200">
                  {block.table?.headers.map((h, i) => (
                    <th key={i} className="p-3 sm:p-3.5 font-bold text-stone-800 tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {block.table?.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 sm:p-3.5 text-stone-700 leading-relaxed">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.table?.caption && (
            <div className="p-2 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 italic text-center">
              {block.table.caption}
            </div>
          )}
        </div>
      );

    case 'comparison_block':
      return (
        <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-stone-100/90 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-amber-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Comparative Analysis Matrix
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="p-3 font-bold text-stone-800 w-1/4">
                    {block.comparison?.headers[0] || 'Aspect'}
                  </th>
                  <th className="p-3 font-bold text-amber-900 bg-amber-50/50 w-3/8">
                    {block.comparison?.headers[1] || 'Subject A'}
                  </th>
                  <th className="p-3 font-bold text-indigo-900 bg-indigo-50/40 w-3/8">
                    {block.comparison?.headers[2] || 'Subject B'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {block.comparison?.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'}>
                    <td className="p-3 font-semibold text-stone-800 bg-stone-50/30">
                      {row.aspect}
                    </td>
                    <td className="p-3 text-stone-700 leading-relaxed bg-amber-50/20">
                      {row.left}
                    </td>
                    <td className="p-3 text-stone-700 leading-relaxed bg-indigo-50/20">
                      {row.right}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <Clock className="w-4 h-4" />
            <span>Chronological Evolution & Landmark Milestones</span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-200">
            {block.timeline?.events.map((evt, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 sm:-left-8 top-1 w-2.5 h-2.5 rounded-full bg-amber-600 ring-4 ring-white" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100/80 text-amber-900 shrink-0 font-mono">
                    {evt.timeOrYear}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                    {evt.title}
                  </span>
                </div>
                {evt.description && (
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {evt.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'fact_box':
      return (
        <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 tracking-tight">
              {block.factBox?.title || 'High-Yield Prelims Facts'}
            </h4>
          </div>

          <ul className="space-y-2">
            {block.factBox?.facts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-800 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'important_points':
      return (
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs sm:text-sm font-bold tracking-tight">
              Critical Exam Note / Key Takeaway
            </h4>
          </div>

          <ul className="space-y-1.5">
            {block.importantPoints?.points.map((pt, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed">
                • {pt}
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
};

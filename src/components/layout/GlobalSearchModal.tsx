import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, HelpCircle, Newspaper, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateToConcept, setActiveSection } = useLearner();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    subjects: any[];
    concepts: any[];
    questions: any[];
    currentAffairs: any[];
    resources: any[];
    pyqPapers: any[];
    books: any[];
    shortNotes: any[];
    syllabus: any[];
    mockTests: any[];
  }>({
    subjects: [],
    concepts: [],
    questions: [],
    currentAffairs: [],
    resources: [],
    pyqPapers: [],
    books: [],
    shortNotes: [],
    syllabus: [],
    mockTests: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({
        subjects: [],
        concepts: [],
        questions: [],
        currentAffairs: [],
        resources: [],
        pyqPapers: [],
        books: [],
        shortNotes: [],
        syllabus: [],
        mockTests: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchGlobal(query);
        setResults({
          subjects: Array.isArray(res?.subjects) ? res.subjects : [],
          concepts: Array.isArray(res?.concepts) ? res.concepts : [],
          questions: Array.isArray(res?.questions) ? res.questions : [],
          currentAffairs: Array.isArray(res?.currentAffairs) ? res.currentAffairs : [],
          resources: Array.isArray(res?.resources) ? res.resources : [],
          pyqPapers: Array.isArray(res?.pyqPapers) ? res.pyqPapers : [],
          books: Array.isArray(res?.books) ? res.books : [],
          shortNotes: Array.isArray(res?.shortNotes) ? res.shortNotes : [],
          syllabus: Array.isArray(res?.syllabus) ? res.syllabus : [],
          mockTests: Array.isArray(res?.mockTests) ? res.mockTests : [],
        });
      } catch (err) {
        console.error('Search failed:', err);
        setResults({
          subjects: [],
          concepts: [],
          questions: [],
          currentAffairs: [],
          resources: [],
          pyqPapers: [],
          books: [],
          shortNotes: [],
          syllabus: [],
          mockTests: [],
        });
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.pyqPapers.length +
    results.books.length +
    results.shortNotes.length +
    results.syllabus.length +
    results.mockTests.length +
    results.concepts.length +
    results.questions.length +
    results.currentAffairs.length +
    results.resources.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type anything (e.g. Article 21, Fiscal Federalism, Repo rate)..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              Searching IKSHOVIA Knowledge Base...
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <p className="font-medium text-slate-400">Quick Intelligence Search</p>
              <p>Try searching for: <span className="text-indigo-400">Article 32</span>, <span className="text-indigo-400">GST Council</span>, <span className="text-indigo-400">Monetary Policy</span>, or <span className="text-indigo-400">Western Ghats</span></p>
            </div>
          )}

          {!loading && query.trim() && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching concepts or questions found for "{query}".
            </div>
          )}

          {/* 1. Official PYQ Papers [Official PYQ] */}
          {results.pyqPapers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-sky-400 tracking-wider uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Official Question Papers ({results.pyqPapers.length})
                </span>
                <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded font-bold">
                  Official PYQ
                </span>
              </div>
              <div className="space-y-1.5">
                {results.pyqPapers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveSection('pyq-practice');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-sky-900/60 text-sky-300 px-1.5 py-0.5 rounded">
                          Official PYQ
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                          {p.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {p.exam} • Year {p.year} {p.stage ? `• ${p.stage}` : ''} • {p.actual_question_count || 100} Official Questions
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Resource Library Books & References [Book] */}
          {results.books.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Resource Library Books ({results.books.length})
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  Book
                </span>
              </div>
              <div className="space-y-1.5">
                {results.books.map(b => (
                  <div
                    key={b.id}
                    onClick={() => {
                      (window as any).__ikshovia_auto_open_book_id = b.id;
                      const url = new URL(window.location.href);
                      url.searchParams.set('book_id', b.id);
                      window.history.replaceState({}, '', url.toString());
                      setActiveSection('resources');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">
                          {b.badge || 'Book'}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                          {b.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {b.author ? `By ${b.author} • ` : ''}{b.subject} {b.page_count ? `• ${b.page_count} Pages` : ''}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Revision Notes & Compendiums [Short Note] */}
          {results.shortNotes.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Revision Notes & Compendiums ({results.shortNotes.length})
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                  Short Note
                </span>
              </div>
              <div className="space-y-1.5">
                {results.shortNotes.map(sn => (
                  <div
                    key={sn.id}
                    onClick={() => {
                      setActiveSection('short-notes');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">
                          Short Note
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                          {sn.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {sn.subject} • {sn.topic} {sn.read_time_minutes ? `• ${sn.read_time_minutes} min read` : ''}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Notes & Syllabus Documents [Syllabus] */}
          {results.syllabus.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-teal-400 tracking-wider uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Notes & Syllabus ({results.syllabus.length})
                </span>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-bold">
                  Syllabus
                </span>
              </div>
              <div className="space-y-1.5">
                {results.syllabus.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSection('notes');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded">
                          Syllabus
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                          {s.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {s.exam} • {s.subject}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Mock Tests [Mock Test] */}
          {results.mockTests.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-purple-400 tracking-wider uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Mock Tests ({results.mockTests.length})
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                  Mock Test
                </span>
              </div>
              <div className="space-y-1.5">
                {results.mockTests.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveSection('mock-tests');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">
                          Mock Test
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                          {m.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {m.exam} • {m.total_questions || 100} Questions • {m.duration_minutes || 120} Mins
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepts */}
          {results.concepts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Concepts ({results.concepts.length})
              </div>
              <div className="space-y-1.5">
                {results.concepts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      navigateToConcept(c.id);
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded">
                          Concept
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                          {c.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.summary}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Questions */}
          {results.questions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Practice Questions ({results.questions.length})
              </div>
              <div className="space-y-1.5">
                {results.questions.map(q => (
                  <div
                    key={q.id}
                    onClick={() => {
                      setActiveSection('practice');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                        Practice Question
                      </span>
                      <span className="text-[10px] text-slate-400">{q.examTag || 'Practice'}</span>
                    </div>
                    <div className="text-xs text-slate-200 line-clamp-2">{q.question}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Affairs */}
          {results.currentAffairs.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-rose-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                Current Affairs ({results.currentAffairs.length})
              </div>
              <div className="space-y-1.5">
                {results.currentAffairs.map(ca => (
                  <div
                    key={ca.id}
                    onClick={() => {
                      setActiveSection('current-affairs');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded">
                        Current Affairs
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{ca.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ca.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

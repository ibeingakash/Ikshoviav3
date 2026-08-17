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
  }>({
    subjects: [],
    concepts: [],
    questions: [],
    currentAffairs: [],
    resources: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [] });
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
        });
      } catch (err) {
        console.error('Search failed:', err);
        setResults({ subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [] });
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const totalResults =
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
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.summary}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
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
                    <div className="text-xs text-slate-200 line-clamp-2">{q.question}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                        {q.difficulty}
                      </span>
                      <span>{q.examTag || 'Practice'}</span>
                    </div>
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
                    <div className="text-xs font-semibold text-slate-200">{ca.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ca.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Resources & Documents */}
          {results.resources.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Official Resources & Documents ({results.resources.length})
              </div>
              <div className="space-y-1.5">
                {results.resources.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setActiveSection('resources');
                      setIsSearchOpen(false);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-200">{r.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{r.summary}</div>
                    {r.source && (
                      <div className="text-[10px] text-amber-300/80 font-mono mt-1">
                        Source: {r.source}
                      </div>
                    )}
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

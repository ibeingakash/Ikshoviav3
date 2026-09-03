import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  ExternalLink,
  Bot,
  GraduationCap,
  Sparkles,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

export const NotesTab: React.FC = () => {
  const { askTutorWithContext } = useLearner();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    api.getResources().then(data => {
      setResources(data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load notes resources:', err);
      setLoading(false);
    });
  }, []);

  const categories = ['All', 'Polity', 'Economy', 'History', 'Geography', 'Environment', 'Science & Tech', 'Bihar Special'];

  const filtered = resources.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || r.subject === selectedCategory || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 font-sans-editorial">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              Comprehensive Standard Revision Notes & Compilations
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Curated standard reference notes, mindmaps, and constitutional compendiums for UPSC CSE & BPSC.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes & summaries..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-amber-300 shadow-2xs'
                  : 'bg-[#F4F0E8] text-stone-700 hover:bg-[#ECE6DC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          Loading learning resources...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EAE6DF]">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-stone-600">No notes found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(res => (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 font-mono">
                    {res.subject || res.category || 'General'}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {res.format || 'PDF'}
                  </span>
                </div>

                <h3 className="text-sm font-serif-editorial font-bold text-stone-900 leading-snug">
                  {res.title}
                </h3>

                {res.description && (
                  <p className="text-xs text-stone-500 line-clamp-2">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => askTutorWithContext(`Summarize key concepts from revision note: "${res.title}"`)}
                  className="text-xs text-amber-800 hover:text-amber-900 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ask AI Tutor</span>
                </button>

                {res.url && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Open Resource"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

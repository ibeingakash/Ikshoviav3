import React, { useState, useEffect } from 'react';
import { FolderArchive, Download, FileText, Search, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';

export const ResourcesView: React.FC = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResources().then(list => {
      setResources(list);
      setLoading(false);
    });
  }, []);

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-indigo-400" />
            <span>Resource Library & PYQ Archives</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Curated syllabus PDFs, past year question analyses, official notifications, and concept notes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, PYQs..."
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
          Loading resources...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div
              key={r.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {r.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{r.fileSize || '2.4 MB'}</span>
              </div>

              <h2 className="text-sm font-bold text-white">{r.title}</h2>
              <p className="text-xs text-slate-400 line-clamp-2">{r.summary}</p>

              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open Resource</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

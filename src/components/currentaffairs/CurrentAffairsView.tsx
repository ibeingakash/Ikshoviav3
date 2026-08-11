import React, { useState, useEffect } from 'react';
import { Newspaper, BookOpen, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { CurrentAffairArticle } from '../../types/index.js';

export const CurrentAffairsView: React.FC = () => {
  const { navigateToConcept } = useLearner();
  const [articles, setArticles] = useState<CurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCurrentAffairs().then(list => {
      setArticles(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-400" />
            <span>Current Affairs & Static Mapping</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Curated exam-relevant news articles explicitly linked to underlying static syllabus concepts.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
          Fetching latest exam-relevant articles...
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {articles.map(art => (
            <div
              key={art.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl space-y-3 transition-all shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                    {art.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{art.date}</span>
                </div>

                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded">
                    Relevance: {art.relevanceScore}%
                  </span>
                </div>
              </div>

              <h2 className="text-base font-bold text-white">{art.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {art.summary}
              </p>

              {/* Related Concepts */}
              {art.relatedConceptIds && art.relatedConceptIds.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400">Linked Static Concepts:</span>
                  {art.relatedConceptIds.map(cid => (
                    <button
                      key={cid}
                      onClick={() => navigateToConcept(cid)}
                      className="text-xs text-indigo-300 bg-indigo-950 border border-indigo-800 hover:bg-indigo-900 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{cid === 'c_art32' ? 'Article 32 Writs' : 'GST Council'}</span>
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

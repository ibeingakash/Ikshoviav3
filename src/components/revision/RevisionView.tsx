import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { RevisionItem } from '../../types/index.js';

export const RevisionView: React.FC = () => {
  const { setSelectedConceptId, navigateToConcept, refreshLearnerData } = useLearner();
  const [queue, setQueue] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const q = await api.getRevisionQueue();
    setQueue(q);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReviewConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    navigateToConcept(conceptId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-400" />
            <span>Spaced Repetition Revision Engine</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Concepts scheduled for review based on memory decay curves, previous errors, and retention intervals.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          Calculating memory retention curves...
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Your Memory Memory Curve is Optimal!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No concepts are currently overdue for revision. Keep practicing or explore new topics.
          </p>
        </div>
      )}

      {!loading && queue.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Revision Items ({queue.length})</span>
            <span className="text-amber-400 font-mono">Sorted by Retention Decay</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map(item => (
              <div
                key={item.conceptId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl space-y-4 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {item.subjectName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mt-0.5">
                      {item.conceptTitle}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                      item.priority === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {/* Retention Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Current Retention</span>
                    <span
                      className={
                        item.retention < 60
                          ? 'text-rose-400'
                          : item.retention < 75
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {item.retention}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.retention < 60
                          ? 'bg-rose-500'
                          : item.retention < 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.retention}%` }}
                    />
                  </div>
                </div>

                {/* Reasons & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Est: {item.estimatedMinutes} mins</span>
                  </div>

                  <button
                    onClick={() => handleReviewConcept(item.conceptId)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span>Review Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

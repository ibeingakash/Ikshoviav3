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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-600" />
            <span>Spaced Repetition Revision Engine</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Concepts scheduled for review based on memory decay curves, previous errors, and retention intervals.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 self-start cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
          Calculating memory retention curves...
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#111827]">Your Memory Curve is Optimal!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No concepts are currently overdue for revision. Keep practicing or explore new topics.
          </p>
        </div>
      )}

      {!loading && queue.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Pending Revision Items ({queue.length})</span>
            <span className="text-indigo-600">Sorted by Retention Decay</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map(item => (
              <div
                key={item.conceptId}
                className="bg-white border border-slate-200 hover:border-indigo-200 p-5 rounded-2xl space-y-4 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                      {item.subjectName}
                    </span>
                    <h3 className="text-sm font-bold text-[#111827] line-clamp-2 mt-0.5">
                      {item.conceptTitle}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                      item.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {/* Retention Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Current Retention</span>
                    <span
                      className={
                        item.retention < 60
                          ? 'text-rose-600'
                          : item.retention < 75
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }
                    >
                      {item.retention}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Est: {item.estimatedMinutes} mins</span>
                  </div>

                  <button
                    onClick={() => handleReviewConcept(item.conceptId)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer text-xs"
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

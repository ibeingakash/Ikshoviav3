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
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#35156B]" />
            <span>Spaced Repetition Revision Engine</span>
          </h1>
          <p className="text-stone-500 text-xs mt-0.5 font-medium">
            Concepts scheduled for review based on memory decay curves, previous errors, and retention intervals.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-200/90 flex items-center gap-2 self-start cursor-pointer transition-all shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#35156B]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
          Calculating memory retention curves...
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-serif-editorial font-bold text-[#111426]">Your Memory Curve is Optimal!</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            No concepts are currently overdue for revision. Keep practicing or explore new topics.
          </p>
        </div>
      )}

      {!loading && queue.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Pending Revision Items ({queue.length})</span>
            <span className="text-[#35156B]">Sorted by Retention Decay</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map(item => (
              <div
                key={item.conceptId}
                className="bg-white border border-stone-200/90 hover:border-amber-400 p-5 rounded-2xl space-y-4 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#35156B] uppercase tracking-wider font-mono">
                      {item.subjectName}
                    </span>
                    <h3 className="text-sm font-bold text-[#111426] line-clamp-2 mt-0.5">
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
                    <span className="text-stone-500 font-mono text-[11px]">Current Retention</span>
                    <span
                      className={
                        item.retention < 60
                          ? 'text-rose-600 font-bold'
                          : item.retention < 75
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-600 font-bold'
                      }
                    >
                      {item.retention}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
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
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <div className="text-stone-500 flex items-center gap-1.5 text-[11px] font-medium font-mono">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Est: {item.estimatedMinutes} mins</span>
                  </div>

                  <button
                    onClick={() => handleReviewConcept(item.conceptId)}
                    className="px-4 py-2 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer text-xs border border-amber-500/30"
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

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Bookmark,
  Layers,
  Flame,
  FileQuestion,
  RotateCcw,
  Check,
  X,
  Compass,
  Tag,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { RevisionItem } from '../../types/index.js';

export const RevisionView: React.FC = () => {
  const { setSelectedConceptId, navigateToConcept, setActiveSection } = useLearner();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'FLASHCARDS' | 'MISTAKES' | 'HIGH_YIELD'>('QUEUE');
  const [queue, setQueue] = useState<RevisionItem[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [q, mList] = await Promise.all([
        api.getRevisionQueue(),
        api.getMistakeNotebook(),
      ]);
      setQueue(Array.isArray(q) ? q : []);
      setMistakes(Array.isArray(mList) ? mList : []);
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReviewConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    navigateToConcept(conceptId);
  };

  const handleRateActiveRecall = async (responseQuality: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    const currentItem = queue[cardIndex];
    if (!currentItem) return;

    setSavingRating(true);
    try {
      const outcome = await api.recordRevisionOutcome(currentItem.conceptId, responseQuality);
      setRatingSuccess(`Retention updated to ${outcome.retentionAfter}%. Next review in ${outcome.nextReviewDays} days.`);
      setTimeout(() => {
        setRatingSuccess(null);
        setIsFlipped(false);
        if (cardIndex < queue.length - 1) {
          setCardIndex(prev => prev + 1);
        } else {
          setCardIndex(0);
        }
        fetchQueue();
      }, 1200);
    } catch (err) {
      console.error('Failed to record revision outcome:', err);
    } finally {
      setSavingRating(false);
    }
  };

  const getMistakeBadge = (category: string) => {
    switch (category) {
      case 'CONCEPT_GAP':
        return { label: 'Concept Gap', bg: 'bg-rose-100 text-rose-950 border-rose-300' };
      case 'RECALL_FAILURE':
        return { label: 'Recall Failure', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'CONCEPT_CONFUSION':
        return { label: 'Concept Confusion', bg: 'bg-purple-100 text-purple-950 border-purple-300' };
      case 'MISINTERPRETATION':
        return { label: 'Misinterpretation', bg: 'bg-blue-100 text-blue-950 border-blue-300' };
      case 'CARELESS_ERROR':
        return { label: 'Careless Error', bg: 'bg-orange-100 text-orange-950 border-orange-300' };
      case 'TIME_PRESSURE':
        return { label: 'Time Pressure', bg: 'bg-stone-100 text-stone-900 border-stone-300' };
      default:
        return { label: 'Incorrect Answer', bg: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  const activeCard = queue[cardIndex];

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono bg-indigo-100 text-indigo-950 border border-indigo-300">
              Ebbinghaus Spaced Repetition Engine
            </span>
            <span className="text-xs text-stone-600 font-mono">
              Memory Curve Interval: SM-2 Adaptive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <RefreshCw className="w-7 h-7 text-amber-700" />
            <span>Smart Revision & Mistake Notebook</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
            Targeted active recall intervals preventing memory decay. Concepts and questions you previously struggled with are dynamically resurfaced before forgetting occurs.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 flex items-center gap-2 self-start cursor-pointer transition-all shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Refresh Retention Curves</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'QUEUE'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-700" />
          <span>Spaced Repetition Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FLASHCARDS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'FLASHCARDS'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-700" />
          <span>Active Recall Flashcards</span>
        </button>

        <button
          onClick={() => setActiveTab('MISTAKES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'MISTAKES'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Mistake Notebook ({mistakes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HIGH_YIELD')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'HIGH_YIELD'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-700" />
          <span>High-Yield Memory Sheets</span>
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
          <span>Calculating Ebbinghaus retention intervals from actual question attempts...</span>
        </div>
      )}

      {/* TAB 1: SPACED REPETITION QUEUE */}
      {!loading && activeTab === 'QUEUE' && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-serif-editorial font-bold text-stone-900">Your Memory Curve is Optimal!</h2>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                No concepts are currently overdue for spaced revision. Keep practicing or explore new syllabus topics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Concepts Scheduled For Revision ({queue.length})</span>
                <span className="text-amber-800">Sorted by Retention Decay</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queue.map(item => (
                  <div
                    key={item.conceptId}
                    className="bg-white border border-stone-200/90 hover:border-amber-400 p-5 rounded-2xl space-y-4 transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-mono">
                            {item.subjectName || 'Civil Services Core'}
                          </span>
                          <h3 className="text-sm font-bold text-stone-900 line-clamp-2 mt-0.5 font-serif-editorial">
                            {item.conceptTitle}
                          </h3>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 font-mono ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      {/* Retention Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-stone-500">Estimated Retention:</span>
                          <span className={`font-bold ${item.retention < 60 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {item.retention}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.retention < 60 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${item.retention}%` }}
                          />
                        </div>
                      </div>

                      {item.mistakeReason && (
                        <div className="text-[11px] text-stone-600 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE6DF] leading-snug">
                          <span className="font-bold text-stone-700">Trigger:</span> {item.mistakeReason}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const idx = queue.findIndex(q => q.conceptId === item.conceptId);
                          if (idx >= 0) setCardIndex(idx);
                          setActiveTab('FLASHCARDS');
                        }}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer flex items-center gap-1 font-mono"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Active Recall</span>
                      </button>

                      <button
                        onClick={() => handleReviewConcept(item.conceptId)}
                        className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all border border-amber-500/30"
                      >
                        <span>Study Concept</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE RECALL FLASHCARDS */}
      {!loading && activeTab === 'FLASHCARDS' && (
        <div className="space-y-6">
          {queue.length === 0 ? (
            <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold font-serif-editorial text-stone-900">
                Flashcard Deck is Up to Date!
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No items are currently due for spaced active recall.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                <span>Card {cardIndex + 1} of {queue.length}</span>
                <span>Active Concept: {activeCard?.conceptTitle}</span>
              </div>

              {/* Interactive Flashcard Card */}
              <div
                onClick={() => setIsFlipped(prev => !prev)}
                className="bg-white border-2 border-stone-300 hover:border-amber-400 min-h-[280px] p-6 sm:p-8 rounded-3xl shadow-md cursor-pointer transition-all flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                      {activeCard?.subjectName || 'Civil Services'}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Click anywhere to {isFlipped ? 'hide' : 'reveal'} key dimensions
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 leading-snug">
                    {activeCard?.conceptTitle}
                  </h2>

                  {!isFlipped ? (
                    <div className="py-6 text-stone-500 text-xs sm:text-sm leading-relaxed italic">
                      "Recall the core constitutional/economic principles, relevant Articles, landmark precedents, and common Prelims traps associated with this concept before flipping."
                    </div>
                  ) : (
                    <div className="py-2 space-y-3 animate-fade-in text-xs sm:text-sm text-stone-800 leading-relaxed border-t border-stone-100 pt-3">
                      <div>
                        <strong className="text-amber-900 block font-mono text-[11px] uppercase mb-0.5">Core Foundation:</strong>
                        <span>{activeCard?.mistakeReason || 'Fundamental constitutional doctrine ensuring balanced governance and rule of law.'}</span>
                      </div>
                      <div>
                        <strong className="text-amber-900 block font-mono text-[11px] uppercase mb-0.5">Retention Target:</strong>
                        <span>Current retention is estimated at {activeCard?.retention}%. Rate your active recall below to calibrate your next spaced review interval.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-mono">
                  <span>Space to flip</span>
                  <span className="text-amber-800 font-bold group-hover:underline">
                    {isFlipped ? '↺ Flip back' : '↷ Flip to check'}
                  </span>
                </div>
              </div>

              {/* Rating Feedback Message */}
              {ratingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center animate-fade-in">
                  ✓ {ratingSuccess}
                </div>
              )}

              {/* 4 Active Recall Response Rating Buttons */}
              {isFlipped && (
                <div className="space-y-2 animate-fade-in">
                  <div className="text-[11px] font-bold text-stone-500 uppercase font-mono text-center">
                    How well did you recall this concept?
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRateActiveRecall('AGAIN')}
                      disabled={savingRating}
                      className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl text-center cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="text-xs font-bold">Again</div>
                      <div className="text-[10px] text-rose-600 font-mono mt-0.5">&lt; 24 hrs</div>
                    </button>

                    <button
                      onClick={() => handleRateActiveRecall('HARD')}
                      disabled={savingRating}
                      className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-center cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="text-xs font-bold">Hard</div>
                      <div className="text-[10px] text-amber-600 font-mono mt-0.5">2 Days</div>
                    </button>

                    <button
                      onClick={() => handleRateActiveRecall('GOOD')}
                      disabled={savingRating}
                      className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl text-center cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="text-xs font-bold">Good</div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">5 Days</div>
                    </button>

                    <button
                      onClick={() => handleRateActiveRecall('EASY')}
                      disabled={savingRating}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-center cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="text-xs font-bold">Easy</div>
                      <div className="text-[10px] text-emerald-600 font-mono mt-0.5">10 Days</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MISTAKE NOTEBOOK */}
      {!loading && activeTab === 'MISTAKES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
              Previously Incorrect Questions from Real Practice ({mistakes.length})
            </div>
            <div className="text-xs text-stone-600 font-mono">
              Categorized by Mistake Pattern
            </div>
          </div>

          {mistakes.length === 0 ? (
            <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold font-serif-editorial text-stone-900">
                No Logged Mistakes in Database!
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When you answer practice or mock questions incorrectly, they are automatically cataloged here with examiner explanations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mistakes.map((m: any, idx: number) => {
                const badge = getMistakeBadge(m.mistakeCategory);

                return (
                  <div
                    key={m.attemptId || idx}
                    className="bg-white border border-stone-200/90 hover:border-amber-400 p-5 rounded-2xl space-y-3 shadow-2xs transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-full font-mono ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {m.exam && (
                          <span className="text-[10px] font-bold text-stone-500 font-mono">
                            {m.exam} {m.pyqYear ? `• ${m.pyqYear}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-stone-400 font-mono">
                        Attempted: {new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold font-serif-editorial text-stone-900 leading-snug">
                      {m.question}
                    </h4>

                    {/* Comparison of Selected Option vs Correct Answer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-rose-950 font-mono flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Your Selected Option</span>
                        </span>
                        <p className="text-xs text-rose-950 font-medium">
                          Option {m.selectedOption || 'N/A'}
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-950 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Official Correct Answer</span>
                        </span>
                        <p className="text-xs text-emerald-950 font-bold">
                          Option {m.correctAnswer || 'A'}
                        </p>
                      </div>
                    </div>

                    {/* Official Explanation */}
                    {m.explanation && (
                      <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-1 text-xs">
                        <span className="text-[10px] font-bold uppercase text-stone-600 font-mono block">
                          Examiner Rationale & Trap Analysis:
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {m.explanation}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveSection('exam-engine')}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-Attempt in Exam Engine</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HIGH-YIELD MEMORY SHEETS */}
      {!loading && activeTab === 'HIGH_YIELD' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
            High-Yield Memory Triggers & Fast Revision Sheets
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-mono">
                Indian Polity
              </span>
              <h3 className="text-sm font-bold font-serif-editorial text-stone-900">
                Key Fundamental Rights & Writs Summary
              </h3>
              <ul className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <li>• <strong>Article 14:</strong> Equality before law (UK) & Equal protection of laws (USA).</li>
                <li>• <strong>Article 19:</strong> Six freedoms; reasonable restrictions must satisfy proportionality test.</li>
                <li>• <strong>Article 21:</strong> Right to Life & Personal Liberty; Maneka Gandhi (procedure established by law vs due process).</li>
                <li>• <strong>Article 32 vs 226:</strong> Art 32 is a Fundamental Right (only for Part III); Art 226 is discretionary and broader.</li>
              </ul>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 font-mono">
                Indian Economy
              </span>
              <h3 className="text-sm font-bold font-serif-editorial text-stone-900">
                Fiscal & Monetary Policy High-Yield Formulas
              </h3>
              <ul className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <li>• <strong>Fiscal Deficit:</strong> Total Expenditure − (Revenue Receipts + Non-debt capital receipts).</li>
                <li>• <strong>Primary Deficit:</strong> Fiscal Deficit − Interest Payments.</li>
                <li>• <strong>Repo vs Reverse Repo:</strong> Repo is the rate at which RBI lends short-term liquidity to commercial banks.</li>
                <li>• <strong>Headline vs Core Inflation:</strong> Core inflation excludes volatile food and fuel prices from CPI.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

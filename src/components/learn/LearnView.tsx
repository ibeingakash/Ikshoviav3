import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  HelpCircle,
  Star,
  Bot,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { Subject, Concept } from '../../types/index.js';

export const LearnView: React.FC = () => {
  const { selectedConceptId, setSelectedConceptId, navigateToConcept, setActiveSection, appTheme } = useLearner();
  const isParchment = appTheme === 'upsc-parchment';
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('sub_polity');
  const [topics, setTopics] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [activeConcept, setActiveConcept] = useState<Concept | null>(null);
  const [conceptMastery, setConceptMastery] = useState<any>(null);
  const [prerequisites, setPrerequisites] = useState<Concept[]>([]);
  const [related, setRelated] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [confidenceRated, setConfidenceRated] = useState<number | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  useEffect(() => {
    api.getSubjects().then(subs => {
      setSubjects(subs);
      if (subs.length > 0 && !activeSubjectId) {
        setActiveSubjectId(subs[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeSubjectId) return;
    setLoading(true);
    api.getSubjectDetail(activeSubjectId).then(data => {
      setTopics(data.topics || []);
      setConcepts(data.concepts || []);
      if (data.concepts?.length > 0) {
        const found = data.concepts.find((c: Concept) => c.id === selectedConceptId) || data.concepts[0];
        setSelectedConceptId(found.id);
      }
      setLoading(false);
    });
  }, [activeSubjectId]);

  useEffect(() => {
    if (!selectedConceptId) return;
    api.getConceptDetail(selectedConceptId).then(data => {
      setActiveConcept(data.concept);
      setConceptMastery(data.mastery);
      setPrerequisites(data.prerequisites || []);
      setRelated(data.related || []);
      if (data.concept?.subjectId && data.concept.subjectId !== activeSubjectId) {
        setActiveSubjectId(data.concept.subjectId);
      }
    });
  }, [selectedConceptId]);

  const handleRateConfidence = async (rating: number) => {
    if (!activeConcept) return;
    setConfidenceRated(rating);
    await api.rateConceptConfidence(activeConcept.id, rating);
    setRatingSuccess(true);
    setTimeout(() => setRatingSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* View Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
        isParchment ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <h1 className={`text-2xl font-extrabold flex items-center gap-2 font-serif ${
            isParchment ? 'text-[#0F1E36]' : 'text-white'
          }`}>
            <BookOpen className="w-6 h-6 text-amber-600" />
            <span>Interactive Concept Learning Engine</span>
          </h1>
          <p className={`text-xs mt-1 ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
            Read core concepts, assess your understanding, view prerequisites, and launch AI explanations.
          </p>
        </div>

        <button
          onClick={() => setActiveSection('practice')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start"
        >
          <span>Practice Questions for this Concept</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSubjectId(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
              activeSubjectId === s.id
                ? 'bg-[#0F1E36] border-amber-500 text-amber-300 shadow-md font-serif'
                : isParchment
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Topic/Concept Tree (Left) + Concept Reader (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigator (4 cols) */}
        <div className={`lg:col-span-4 rounded-2xl p-4 space-y-4 max-h-[75vh] overflow-y-auto border transition-all ${
          isParchment ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between border-b pb-2 ${
            isParchment ? 'text-amber-900 font-serif border-slate-200' : 'text-slate-400 border-slate-800'
          }`}>
            <span>Syllabus Hierarchy</span>
            <span className="text-[10px] text-amber-700 font-mono font-bold">{concepts.length} Concepts</span>
          </div>

          {topics.map(t => {
            const topicConcepts = concepts.filter(c => c.topicId === t.id);
            return (
              <div key={t.id} className="space-y-1.5">
                <div className={`text-xs font-bold flex items-center gap-1.5 pt-1 ${
                  isParchment ? 'text-slate-900 font-serif' : 'text-slate-300'
                }`}>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.name}</span>
                </div>

                <div className="pl-3 space-y-1">
                  {topicConcepts.map(c => {
                    const isSelected = c.id === selectedConceptId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConceptId(c.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                          isSelected
                            ? isParchment
                              ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-sm'
                              : 'bg-indigo-950 border-indigo-600 text-indigo-200 font-bold'
                            : isParchment
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
                            : 'bg-slate-800/40 border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="line-clamp-1">{c.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                            c.importance === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                              : 'bg-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          {c.importance}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Reader (8 cols) */}
        <div className={`lg:col-span-8 rounded-2xl p-6 space-y-6 shadow-sm border transition-all ${
          isParchment ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-xl'
        }`}>
          {activeConcept ? (
            <>
              {/* Concept Header */}
              <div className={`space-y-3 border-b pb-5 ${isParchment ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {activeConcept.difficulty}
                  </span>
                  <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    Importance: {activeConcept.importance}
                  </span>
                  {conceptMastery && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Mastery: {conceptMastery.overallMastery}%
                    </span>
                  )}
                </div>

                <h2 className={`text-xl sm:text-2xl font-extrabold font-serif ${isParchment ? 'text-[#0F1E36]' : 'text-white'}`}>
                  {activeConcept.title}
                </h2>

                <p className={`text-xs sm:text-sm p-3.5 rounded-xl leading-relaxed font-medium border ${
                  isParchment ? 'bg-amber-50/80 border-amber-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  {activeConcept.summary}
                </p>
              </div>

              {/* Detailed Explanation */}
              <div className="space-y-3">
                <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                  isParchment ? 'text-amber-900' : 'text-indigo-300'
                }`}>
                  Comprehensive Civil Services Explanation
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl border font-serif ${
                  isParchment ? 'bg-amber-50/30 border-amber-200/60 text-slate-900' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}>
                  {activeConcept.explanation}
                </p>
              </div>

              {/* Key Points */}
              {activeConcept.keyPoints && activeConcept.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-serif ${
                    isParchment ? 'text-amber-900' : 'text-indigo-400'
                  }`}>
                    Must-Know Exam Takeaways
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeConcept.keyPoints.map((kp, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                          isParchment ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{kp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {activeConcept.examples && activeConcept.examples.length > 0 && (
                <div className="space-y-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-serif ${
                    isParchment ? 'text-amber-900' : 'text-amber-400'
                  }`}>
                    Practical Case Examples
                  </h3>
                  <div className="space-y-1.5">
                    {activeConcept.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs font-medium border ${
                          isParchment ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                        }`}
                      >
                        💡 {ex}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Self-Assessment Confidence Rating */}
              <div className={`p-4 rounded-2xl space-y-3 border ${
                isParchment
                  ? 'bg-amber-50/80 border-amber-300 text-slate-900'
                  : 'bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-indigo-800/60 text-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-bold ${isParchment ? 'text-amber-950 font-serif' : 'text-slate-200'}`}>
                    How well do you understand this concept right now?
                  </div>
                  {ratingSuccess && (
                    <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                      ✓ Learner Model Updated!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRateConfidence(rating)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        confidenceRated === rating
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                          : isParchment
                          ? 'bg-white border-slate-300 text-slate-800 hover:bg-amber-100'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex justify-center mb-0.5">
                        <Star
                          className={`w-3.5 h-3.5 ${
                            rating <= (confidenceRated || 0)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <span>{rating === 1 ? '1 - Low' : rating === 5 ? '5 - High' : rating}</span>
                    </button>
                  ))}
                </div>

                <p className={`text-[10px] ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
                  IKSHOVIA compares your self-assessed confidence rating with actual test performance to diagnose overconfidence/underconfidence bias.
                </p>
              </div>

              {/* Action Buttons: Ask AI Tutor | Practice Questions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setActiveSection('ai-tutor')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                >
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Ask AI Tutor to Explain or Simplify</span>
                </button>

                <button
                  onClick={() => setActiveSection('practice')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  <span>Attempt Practice MCQs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Related & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                {prerequisites.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Prerequisites
                    </div>
                    {prerequisites.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigateToConcept(p.id)}
                        className="w-full text-left p-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-indigo-300 hover:underline block truncate"
                      >
                        ← {p.title}
                      </button>
                    ))}
                  </div>
                )}

                {related.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Related Concepts
                    </div>
                    {related.map(r => (
                      <button
                        key={r.id}
                        onClick={() => navigateToConcept(r.id)}
                        className="w-full text-left p-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-indigo-300 hover:underline block truncate"
                      >
                        → {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select a concept from the left menu to start learning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

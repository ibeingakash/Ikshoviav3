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
  const { selectedConceptId, setSelectedConceptId, navigateToConcept, setActiveSection, askTutorWithContext } = useLearner();
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
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#35156B]" />
            <span>Interactive Concept Learning Engine</span>
          </h1>
          <p className="text-stone-600 text-xs mt-0.5 font-medium">
            Read core concepts, assess your understanding, view prerequisites, and launch AI explanations.
          </p>
        </div>

        <button
          onClick={() => setActiveSection('practice')}
          className="px-4 py-2 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 self-start cursor-pointer border border-amber-500/30"
        >
          <span>Practice Questions for this Concept</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Array.isArray(subjects) ? subjects : []).map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSubjectId(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              activeSubjectId === s.id
                ? 'bg-[#35156B] border-[#35156B] text-amber-300 shadow-2xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
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
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-4 space-y-4 max-h-[75vh] overflow-y-auto shadow-2xs">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center justify-between border-b border-stone-100 pb-2">
            <span>Syllabus Hierarchy</span>
            <span className="text-[10px] text-[#35156B] font-mono font-bold">{(Array.isArray(concepts) ? concepts : []).length} Concepts</span>
          </div>

          {(Array.isArray(topics) ? topics : []).map(t => {
            const safeConcepts = Array.isArray(concepts) ? concepts : [];
            const topicConcepts = safeConcepts.filter(c => c && c.topicId === t.id);
            return (
              <div key={t.id} className="space-y-1.5">
                <div className="text-xs font-bold text-[#111426] flex items-center gap-1.5 pt-1">
                  <ChevronRight className="w-3.5 h-3.5 text-[#35156B] shrink-0" />
                  <span>{t.name}</span>
                </div>

                <div className="pl-3 space-y-1">
                  {topicConcepts.map(c => {
                    const isSelected = c.id === selectedConceptId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConceptId(c.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-[#35156B] font-bold shadow-2xs'
                            : 'bg-stone-50 border-stone-200/80 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span className="line-clamp-1">{c.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                            c.importance === 'HIGH'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                              : 'bg-stone-100 text-stone-600 font-medium'
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
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          {activeConcept ? (
            <>
              {/* Concept Header */}
              <div className="space-y-3 border-b border-stone-100 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {activeConcept.difficulty}
                  </span>
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    Importance: {activeConcept.importance}
                  </span>
                  {conceptMastery && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Mastery: {conceptMastery.overallMastery}%
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#111426]">
                  {activeConcept.title}
                </h2>

                <p className="text-xs sm:text-sm p-3.5 rounded-xl leading-relaxed font-medium bg-stone-50 border border-stone-200 text-stone-800">
                  {activeConcept.summary}
                </p>

                {/* AI Tutor Action */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => {
                      askTutorWithContext(
                        `Explain ${activeConcept.title} in depth with civil services examples and landmark cases.`,
                        {
                          conceptId: activeConcept.id,
                          conceptTitle: activeConcept.title,
                          conceptSummary: activeConcept.summary,
                          subjectName: subjects.find(s => s.id === activeSubjectId)?.name || 'General Studies',
                          pageContext: `Learn -> ${activeConcept.title}`,
                        },
                        'EXPLAIN'
                      );
                    }}
                    className="px-3.5 py-1.5 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border border-amber-500/30"
                  >
                    <Bot className="w-4 h-4 text-amber-300" />
                    <span>Ask AI Tutor to Explain in Depth</span>
                  </button>
                  <button
                    onClick={() => {
                      askTutorWithContext(
                        `Simplify ${activeConcept.title} into crisp bullet points and analogies.`,
                        {
                          conceptId: activeConcept.id,
                          conceptTitle: activeConcept.title,
                          conceptSummary: activeConcept.summary,
                          subjectName: subjects.find(s => s.id === activeSubjectId)?.name || 'General Studies',
                        },
                        'SIMPLIFY'
                      );
                    }}
                    className="px-3.5 py-1.5 border border-stone-200 font-bold text-xs rounded-xl flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#35156B]" />
                    <span>Simplify Topic</span>
                  </button>
                </div>
              </div>

              {/* Detailed Explanation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#35156B] font-mono">
                  Comprehensive Civil Services Explanation
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium">
                  {activeConcept.explanation}
                </p>
              </div>

              {/* Key Points */}
              {activeConcept.keyPoints && activeConcept.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
                    Must-Know Exam Takeaways
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeConcept.keyPoints.map((kp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl text-xs flex items-start gap-2 border border-stone-200 bg-stone-50 text-stone-800 font-medium"
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
                    Practical Case Examples
                  </h3>
                  <div className="space-y-1.5">
                    {activeConcept.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl text-xs font-medium border border-amber-300 bg-amber-50/80 text-amber-950"
                      >
                        💡 {ex}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Self-Assessment Confidence Rating */}
              <div className="p-4 rounded-2xl space-y-3 border border-amber-300/60 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-800">
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
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        confidenceRated === rating
                          ? 'bg-[#35156B] border-[#35156B] text-amber-300 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex justify-center mb-0.5">
                        <Star
                          className={`w-3.5 h-3.5 ${
                            rating <= (confidenceRated || 0)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-400'
                          }`}
                        />
                      </div>
                      <span>{rating === 1 ? '1 - Low' : rating === 5 ? '5 - High' : rating}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-stone-500">
                  IKSHOVIA compares your self-assessed confidence rating with actual test performance to diagnose overconfidence/underconfidence bias.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setActiveSection('ai-tutor')}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-[#35156B]" />
                  <span>Ask AI Tutor to Explain or Simplify</span>
                </button>

                <button
                  onClick={() => setActiveSection('practice')}
                  className="px-5 py-2.5 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer border border-amber-500/30"
                >
                  <span>Attempt Practice MCQs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Related & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-4">
                {prerequisites.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-stone-500 uppercase font-mono mb-1.5">
                      Prerequisites
                    </div>
                    {prerequisites.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigateToConcept(p.id)}
                        className="w-full text-left p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#35156B] font-medium hover:underline block truncate cursor-pointer"
                      >
                        ← {p.title}
                      </button>
                    ))}
                  </div>
                )}

                {related.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-stone-500 uppercase font-mono mb-1.5">
                      Related Concepts
                    </div>
                    {related.map(r => (
                      <button
                        key={r.id}
                        onClick={() => navigateToConcept(r.id)}
                        className="w-full text-left p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#35156B] font-medium hover:underline block truncate cursor-pointer"
                      >
                        → {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-stone-500 text-xs font-medium">
              Select a concept from the left menu to start learning.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

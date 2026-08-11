import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ArrowRight, Target, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

export const OnboardingModal: React.FC = () => {
  const { user, saveOnboarding } = useAuth();
  const { refreshLearnerData } = useLearner();

  const [step, setStep] = useState(1);
  const [targetExam, setTargetExam] = useState('UPSC CSE 2026');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['sub_polity', 'sub_economy']);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [goalStatement, setGoalStatement] = useState('Dedicated preparation for Civil Services Examination');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || user.isOnboarded) return null;

  const toggleSubject = (subId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subId) ? prev.filter(s => s !== subId) : [...prev, subId]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await saveOnboarding({
        targetExam,
        selectedSubjects,
        dailyGoalMinutes,
        experienceLevel,
        goalStatement,
      });
      await refreshLearnerData();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Step {step} of 3 • Personalized Learner Setup
            </div>
            <h2 className="text-xl font-extrabold text-white">Welcome to IKSHOVIA</h2>
          </div>
        </div>

        {/* STEP 1: Target Exam & Stage */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-slate-300">
              IKSHOVIA builds a real-time intelligence model around your exact target exam and learning pace.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Examination</label>
              <select
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="UPSC CSE 2026">UPSC CSE 2026 (Target Prelims May 2026)</option>
                <option value="UPSC CSE 2027">UPSC CSE 2027</option>
                <option value="State PSC 2026">State Public Service Commission</option>
                <option value="General Competitive Exam">Other Competitive Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Preparation Stage</label>
              <div className="grid grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      experienceLevel === lvl
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <span>Continue to Core Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Subject Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-slate-300">
              Select the initial subjects to prioritize in your learner model.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'sub_polity', title: 'Indian Polity & Governance', desc: 'Articles, Writs, Preamble & Judiciary' },
                { id: 'sub_economy', title: 'Indian Economy & Development', desc: 'Fiscal Policy, RBI, Inflation & Banking' },
              ].map(sub => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{sub.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">{sub.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <span>Set Daily Target</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Daily Target & Goal */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Study Target</label>
              <div className="grid grid-cols-4 gap-2">
                {[60, 120, 180, 240].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      dailyGoalMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Focus Statement</label>
              <input
                type="text"
                value={goalStatement}
                onChange={e => setGoalStatement(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="py-3 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Initializing Engine...' : 'Launch IKSHOVIA Platform'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

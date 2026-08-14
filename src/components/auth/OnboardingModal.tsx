import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ArrowRight, Target, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';
import { IKLogo } from '../common/IKLogo.js';

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
    <div className="fixed inset-0 z-50 bg-[#FAF7F0]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans-editorial overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0C1024] border border-amber-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative space-y-5 sm:space-y-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <IKLogo
              variant="dark"
              showTagline={false}
              size="sm"
            />
            <div className="text-[10px] uppercase font-mono font-bold text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full bg-[#121027]">
              Step {step} of 3 • Learner Setup
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-white tracking-tight">
            Personalize Your Study Model
          </h2>
        </div>

        {/* STEP 1: Target Exam & Stage */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-stone-300">
              IKSHOVIA builds a real-time intelligence model around your exact target exam and learning pace.
            </p>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 mb-1">Target Examination</label>
              <select
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                className="w-full bg-[#121027] border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="UPSC CSE 2026">UPSC CSE 2026 (Target Prelims May 2026)</option>
                <option value="UPSC CSE 2027">UPSC CSE 2027</option>
                <option value="State PSC 2026">State Public Service Commission (BPSC / UPPCS)</option>
                <option value="General Competitive Exam">Other Competitive Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 mb-1">Current Preparation Stage</label>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 sm:gap-3">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      experienceLevel === lvl
                        ? 'bg-[#35156B] text-amber-300 border-amber-400 shadow-xs'
                        : 'bg-[#121027] text-stone-300 border-stone-800 hover:bg-[#17132B]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-xs border border-amber-500/30 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <span>Continue to Core Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Subject Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-stone-300">
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
                        ? 'bg-[#35156B] border-amber-400 text-white shadow-xs'
                        : 'bg-[#121027] border-stone-800 text-stone-300 hover:bg-[#17132B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{sub.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                    </div>
                    <p className="text-[11px] text-stone-400">{sub.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-6 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-xs border border-amber-500/30 flex items-center gap-2 cursor-pointer"
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
              <label className="block text-xs font-mono font-bold text-stone-300 mb-1">Daily Study Target</label>
              <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2">
                {[60, 120, 180, 240].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer font-mono ${
                      dailyGoalMinutes === mins
                        ? 'bg-[#35156B] text-amber-300 border-amber-400 shadow-xs'
                        : 'bg-[#121027] text-stone-300 border-stone-800 hover:bg-[#17132B]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 mb-1">Personal Focus Statement</label>
              <input
                type="text"
                value={goalStatement}
                onChange={e => setGoalStatement(e.target.value)}
                className="w-full bg-[#121027] border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

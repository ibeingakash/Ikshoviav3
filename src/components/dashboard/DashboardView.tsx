import React, { useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  Award,
  ChevronRight,
  Bot,
  Scale,
  Sparkles,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    learnerModel,
    nextBestAction,
    aiInsight,
    setActiveSection,
    setSelectedConceptId,
    askTutorWithContext,
  } = useLearner();

  const handleLaunchNBA = () => {
    if (!nextBestAction) return;
    if (nextBestAction.conceptId) {
      setSelectedConceptId(nextBestAction.conceptId);
    }
    if (nextBestAction.actionType === 'REVISE') setActiveSection('revision');
    else if (nextBestAction.actionType === 'PRACTICE') setActiveSection('practice');
    else if (nextBestAction.actionType === 'MOCK') setActiveSection('mock-tests');
    else setActiveSection('learn');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto font-sans-editorial">
      
      {/* 1. TOP WELCOME & TARGET EXAM HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div className="space-y-1">
          <div className="text-xs font-serif-editorial italic text-amber-800 font-medium">
            Learn With Purpose.
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#111426] tracking-tight">
            Good Morning, {user?.name?.split(' ')[0] || 'Akash'} 👋
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            Target Exam: <span className="font-bold text-stone-800">{user?.onboarding?.targetExam || 'UPSC CSE 2026'}</span> • Active Study Days: {learnerModel?.currentStreak || 14}
          </p>
        </div>

        {/* Quick Exam Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-stone-200/90 px-4 py-2 rounded-2xl shadow-2xs text-center">
            <div className="text-[10px] font-mono font-bold text-stone-500 uppercase">CONCEPT MASTERY</div>
            <div className="text-xl font-serif-editorial font-bold text-[#111426]">{learnerModel?.overallScore || 72}%</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl shadow-2xs text-center">
            <div className="text-[10px] font-mono font-bold text-amber-900 uppercase">STUDY STREAK</div>
            <div className="text-xl font-serif-editorial font-bold text-amber-900 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{learnerModel?.currentStreak || 6}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID ROW 1: TODAY'S FOCUS, NEXT BEST ACTION, METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 1: Today's Focus */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>TODAY'S FOCUS</span>
              </span>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-bold">
                3 Tasks
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Review Article 32 & Writs Taxonomy</div>
                  <div className="text-[10px] text-amber-900 mt-0.5">HIGH PRIORITY • 8 mins</div>
                </div>
                <button
                  onClick={() => setActiveSection('revision')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  Start
                </button>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Practice Polity – FR Basic Structure</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">IN PROGRESS • 12 mins</div>
                </div>
                <button
                  onClick={() => setActiveSection('practice')}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  Continue
                </button>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Mock Test – Polity Sectional</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">UPCOMING • 45 mins</div>
                </div>
                <button
                  onClick={() => setActiveSection('mock-tests')}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  Open
                </button>
              </div>

            </div>
          </div>

          <button
            onClick={() => setActiveSection('goals')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 pt-2 border-t border-stone-100 cursor-pointer"
          >
            <span>View All Planner Tasks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Dark Midnight Plum NEXT BEST ACTION Card */}
        <div className="lg:col-span-5 bg-[#0C1024] text-white rounded-2xl p-5 shadow-md space-y-4 border border-amber-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between text-stone-300 border-b border-stone-800 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>NEXT BEST ACTION</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                HIGH IMPACT
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-stone-400 uppercase">Polity • Fundamental Rights</div>
              <h3 className="text-xl font-serif-editorial font-bold text-white leading-tight">
                {nextBestAction?.title || 'Review Article 32 (Writs & Remedies)'}
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {nextBestAction?.reason || 'Retention score dropped below threshold based on your last 3 practice sets. 8 mins active recall session recommended.'}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between relative z-10">
            <span className="text-xs text-stone-400 font-mono">Yield: +8% Recall Boost</span>
            <button
              onClick={handleLaunchNBA}
              className="px-5 py-2.5 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
            >
              <span>Review Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: 4 Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          
          <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs space-y-1 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-stone-500 font-bold uppercase">Concept Mastery</div>
            <div className="text-2xl font-serif-editorial font-bold text-[#111426]">72%</div>
            <div className="text-[10px] font-bold text-emerald-600">↑ 6% this week</div>
          </div>

          <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs space-y-1 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-stone-500 font-bold uppercase">Retention Risk</div>
            <div className="text-2xl font-serif-editorial font-bold text-amber-700">High</div>
            <div className="text-[10px] font-bold text-amber-800">12 topics at risk</div>
          </div>

          <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs space-y-1 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-stone-500 font-bold uppercase">Revision Due</div>
            <div className="text-2xl font-serif-editorial font-bold text-[#111426]">8</div>
            <div className="text-[10px] font-bold text-stone-500">Topics due today</div>
          </div>

          <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs space-y-1 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-stone-500 font-bold uppercase">Today's Goal</div>
            <div className="text-2xl font-serif-editorial font-bold text-[#111426]">3 / 6</div>
            <div className="text-[10px] font-bold text-emerald-600">Tasks completed</div>
          </div>

        </div>

      </div>

      {/* 3. GRID ROW 2: MASTERY HEATMAP, LEARNING TREND, REVISION QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 4: Mastery Heatmap */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>MASTERY HEATMAP</span>
            </span>
            <span className="text-[10px] font-mono text-stone-400">Last 30 days</span>
          </div>

          <div className="space-y-2">
            {['Polity', 'Economy', 'History', 'IR', 'Science'].map((subj, idx) => (
              <div key={subj} className="flex items-center gap-2 text-xs">
                <span className="w-16 font-bold text-stone-700 text-[11px] shrink-0">{subj}</span>
                <div className="flex items-center gap-1 flex-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={`h-5 flex-1 rounded-sm ${
                        (idx + day) % 3 === 0
                          ? 'bg-emerald-500'
                          : (idx + day) % 2 === 0
                          ? 'bg-emerald-300'
                          : (idx + day) % 5 === 0
                          ? 'bg-amber-300'
                          : 'bg-stone-200'
                      }`}
                      title={`${subj} - Day ${day}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 text-[10px] text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-stone-200 rounded-xs" /><span>Low</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-300 rounded-xs" /><span>Medium</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /><span>Mastered</span></div>
          </div>
        </div>

        {/* Card 5: Learning Trend Chart */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>LEARNING TREND</span>
            </span>
            <span className="text-[10px] font-mono text-stone-400">Mastery vs Retention</span>
          </div>

          <div className="h-40 relative flex items-end pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Mastery Line */}
              <path
                d="M 0 70 Q 75 50, 150 40 T 300 25"
                fill="none"
                stroke="#0C1024"
                strokeWidth="2.5"
              />

              {/* Retention Line */}
              <path
                d="M 0 85 Q 75 70, 150 55 T 300 45"
                fill="none"
                stroke="#C9953C"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#0C1024]" />
              <span className="font-bold text-stone-800 text-[11px]">Mastery %</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#C9953C]" />
              <span className="font-bold text-stone-800 text-[11px]">Retention Score</span>
            </div>
          </div>
        </div>

        {/* Card 6: Revision Queue */}
        <div className="lg:col-span-3 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>REVISION QUEUE</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                3 Due
              </span>
            </div>

            <div className="space-y-2 text-xs">
              
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Article 21 – Right to Life</span>
                  <span className="text-[9px] font-bold bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">HIGH RISK</span>
                </div>
                <div className="text-[10px] text-stone-500">Polity • Due today</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Directive Principles</span>
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">MEDIUM RISK</span>
                </div>
                <div className="text-[10px] text-stone-500">Polity • Due today</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Fundamental Duties</span>
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">LOW RISK</span>
                </div>
                <div className="text-[10px] text-stone-500">Polity • Tomorrow</div>
              </div>

            </div>
          </div>

          <button
            onClick={() => setActiveSection('revision')}
            className="w-full mt-2 py-2 bg-[#0C1024] hover:bg-[#121027] text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            View Full Queue →
          </button>
        </div>

      </div>

    </div>
  );
};

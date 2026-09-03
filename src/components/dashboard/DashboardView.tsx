import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Target,
  Trophy,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  FileText,
  Bookmark,
  Calculator,
  ChevronRight,
  Newspaper,
  ClipboardList,
  Atom,
  Landmark,
  Bot,
  Zap,
  FolderArchive,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { StudyGoal } from '../../types/index.js';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    learnerModel,
    nextBestAction,
    setActiveSection,
    setSelectedConceptId,
  } = useLearner();

  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getGoals(user?.id)
      .catch(() => [])
      .then((goalsRes) => {
        if (isMounted) {
          if (Array.isArray(goalsRes)) setGoals(goalsRes);
          setLoadingItems(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const streakDays = learnerModel?.currentStreak || 12;
  const questionsPracticed = learnerModel?.totalQuestionsAttempted || 2364;
  const accuracyRate = learnerModel?.overallScore || 82;
  const topicsCount = learnerModel?.masteredConceptsCount ? learnerModel.masteredConceptsCount * 3 + 128 : 128;
  const testsCount = 42;

  const currentDayIndex = 5; // Friday (16th)
  const weekDays = [
    { day: 'M', date: 12, active: true },
    { day: 'T', date: 13, active: true },
    { day: 'W', date: 14, active: true },
    { day: 'T', date: 15, active: true },
    { day: 'F', date: 16, active: true },
    { day: 'S', date: 17, active: false },
    { day: 'S', date: 18, active: false },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans-editorial text-stone-800">
      
      {/* 2-Column Responsive Layout: Main Content (Left) + Intelligence Rail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT / CENTER CONTENT AREA (8 cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Header Greeting */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-editorial font-bold text-stone-900 tracking-tight">
              Good Morning, {user?.name?.split(' ')[0] || 'Akash'}! 👋
            </h1>
            <p className="text-stone-500 text-sm">
              Let's continue your learning journey today.
            </p>
          </div>

          {/* 4 Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Metric 1: Topics Studied */}
            <div className="bg-white border border-[#EAE6DF] p-4 rounded-2xl shadow-2xs space-y-3 transition-all hover:border-amber-400 hover:shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500">Topics Studied</div>
                <div className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-0.5">
                  {topicsCount}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                  <span>↑ 12</span>
                  <span className="text-stone-400 font-normal">this week</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Practice Questions */}
            <div className="bg-white border border-[#EAE6DF] p-4 rounded-2xl shadow-2xs space-y-3 transition-all hover:border-amber-400 hover:shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500">Practice Questions</div>
                <div className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-0.5">
                  {questionsPracticed.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                  <span>↑ 8%</span>
                  <span className="text-stone-400 font-normal">this week</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Tests Taken */}
            <div className="bg-white border border-[#EAE6DF] p-4 rounded-2xl shadow-2xs space-y-3 transition-all hover:border-amber-400 hover:shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500">Tests Taken</div>
                <div className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-0.5">
                  {testsCount}
                </div>
                <div className="text-[10px] font-semibold text-sky-600 mt-1 flex items-center gap-0.5">
                  <span>↑ 6</span>
                  <span className="text-stone-400 font-normal">this month</span>
                </div>
              </div>
            </div>

            {/* Metric 4: Average Accuracy */}
            <div className="bg-white border border-[#EAE6DF] p-4 rounded-2xl shadow-2xs space-y-3 transition-all hover:border-amber-400 hover:shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500">Average Accuracy</div>
                <div className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-0.5">
                  {accuracyRate}%
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                  <span>↑ 5%</span>
                  <span className="text-stone-400 font-normal">this month</span>
                </div>
              </div>
            </div>

          </div>

          {/* AI Tutor Hero Banner (Reference Style) */}
          <div className="bg-gradient-to-r from-[#FFF7ED] via-[#FFFBF5] to-[#FEF3C7]/60 border border-amber-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="space-y-3 z-10 max-w-md">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI TUTOR</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 leading-tight">
                Your 24×7 Learning Mentor
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Ask doubts, get explanations, learn smarter.
              </p>
              <button
                onClick={() => setActiveSection('ai-tutor')}
                className="mt-2 inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-amber-200 hover:text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer group"
              >
                <span>Start a Conversation</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Glowing AI Orb Illustration */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center pointer-events-none">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 via-orange-300/20 to-transparent rounded-full blur-2xl animate-pulse" />
              {/* Orbital Rings */}
              <div className="absolute w-32 h-32 border border-amber-400/40 rounded-full animate-spin" style={{ animationDuration: '24s' }} />
              <div className="absolute w-24 h-24 border border-amber-500/50 rounded-full border-dashed animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
              <div className="absolute w-16 h-16 border border-orange-400/60 rounded-full" />
              {/* Center Core Glowing Orb */}
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-amber-300 to-orange-400 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <Bot className="w-7 h-7 text-stone-900/90" />
              </div>
            </div>

          </div>

          {/* CONTINUE LEARNING SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
                Continue Learning
              </h3>
              <button
                onClick={() => setActiveSection('learn')}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Topic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Topic 1: Fundamental Rights */}
              <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                    Polity
                  </span>
                  <h4 className="text-sm font-serif-editorial font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    Fundamental Rights
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Article 12–35
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-stone-600">
                      <span>Progress</span>
                      <span>68%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSection('learn')}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Topic 2: Indian Economy Overview */}
              <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80">
                    Economy
                  </span>
                  <h4 className="text-sm font-serif-editorial font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    Indian Economy Overview
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    National Income & Sectors
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-stone-600">
                      <span>Progress</span>
                      <span>42%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSection('learn')}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Topic 3: Biodiversity & Conservation */}
              <div className="bg-white border border-[#EAE6DF] rounded-2xl p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-900 border border-sky-200/80">
                    Environment
                  </span>
                  <h4 className="text-sm font-serif-editorial font-bold text-stone-900 group-hover:text-sky-800 transition-colors">
                    Biodiversity & Conservation
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Wildlife Protection & Ecology
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-stone-600">
                      <span>Progress</span>
                      <span>25%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSection('learn')}
                    className="text-xs font-semibold text-sky-800 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* RECOMMENDED FOR YOU SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
                  Recommended for You
                </h3>
                <p className="text-xs text-stone-500">Based on your progress and interests</p>
              </div>
              <button
                onClick={() => setActiveSection('practice')}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4 Compact Recommendation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Rec 1: Official PYQ Practice */}
              <div
                onClick={() => setActiveSection('pyq-practice')}
                className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                    <FolderArchive className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">Official PYQ Practice</div>
                    <div className="text-[10px] text-stone-500 truncate">UPSC & BPSC Archive</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Rec 2: Mock Tests & Simulations */}
              <div
                onClick={() => setActiveSection('mock-tests')}
                className="bg-white border border-[#EAE6DF] hover:border-indigo-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">Mock Tests & Drills</div>
                    <div className="text-[10px] text-stone-500 truncate">Full & Sectional Sprints</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-700 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Rec 3: Science & Tech Notes */}
              <div
                onClick={() => setActiveSection('resources')}
                className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0">
                    <Atom className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">Science & Tech Notes</div>
                    <div className="text-[10px] text-stone-500 truncate">Recently Updated</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Rec 4: Bihar Special */}
              <div
                onClick={() => setActiveSection('resources')}
                className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">Bihar Special</div>
                    <div className="text-[10px] text-stone-500 truncate">State Focus</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT RAIL / INTELLIGENCE SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Learning Streak */}
          <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
              <span className="text-sm font-serif-editorial font-bold text-stone-900">Learning Streak</span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-serif-editorial font-bold text-stone-900">{streakDays}</span>
              <span className="text-xs font-semibold text-stone-500">days in a row!</span>
            </div>

            {/* Days of week circular indicators */}
            <div className="flex items-center justify-between pt-1">
              {weekDays.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400">{item.day}</span>
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      item.active
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {item.date}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-500 font-medium pt-1 border-t border-stone-100">
              Keep going, consistency builds mastery.
            </p>
          </div>

          {/* Card 2: Daily Goals */}
          <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif-editorial font-bold text-stone-900">Daily Goals</h4>
              <button
                onClick={() => setActiveSection('goals')}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 cursor-pointer"
              >
                Edit Goals
              </button>
            </div>

            <div className="space-y-3.5">
              
              {/* Goal 1: Study 3 Topics */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-stone-800">Study 3 Topics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-stone-700">3/3</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  </div>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Goal 2: Practice 30 Questions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-stone-800">Practice 30 Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-stone-700">30/30</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  </div>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Goal 3: Attempt 1 Quiz */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-stone-800">Attempt 1 Quiz</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-stone-700">1/1</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  </div>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Quick Actions */}
          <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-serif-editorial font-bold text-stone-900">Quick Actions</h4>
            <div className="grid grid-cols-4 gap-2">
              
              <button
                onClick={() => setActiveSection('resources')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FCFBF9] border border-[#EAE6DF] hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-stone-600 group-hover:text-amber-700 transition-colors" />
                <span className="text-[10px] font-semibold text-stone-600 mt-1.5">Notes</span>
              </button>

              <button
                onClick={() => setActiveSection('revision')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FCFBF9] border border-[#EAE6DF] hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer group"
              >
                <Bookmark className="w-4 h-4 text-stone-600 group-hover:text-amber-700 transition-colors" />
                <span className="text-[10px] font-semibold text-stone-600 mt-1.5">Bookmarks</span>
              </button>

              <button
                onClick={() => setActiveSection('practice')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FCFBF9] border border-[#EAE6DF] hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer group"
              >
                <Calculator className="w-4 h-4 text-stone-600 group-hover:text-amber-700 transition-colors" />
                <span className="text-[10px] font-semibold text-stone-600 mt-1.5">Calculator</span>
              </button>

              <button
                onClick={() => setActiveSection('goals')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FCFBF9] border border-[#EAE6DF] hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer group"
              >
                <Calendar className="w-4 h-4 text-stone-600 group-hover:text-amber-700 transition-colors" />
                <span className="text-[10px] font-semibold text-stone-600 mt-1.5">Calendar</span>
              </button>

            </div>
          </div>

          {/* Card 4: Editorial Inspirational Quote */}
          <div className="bg-gradient-to-br from-[#FFFBF5] to-[#FEF3C7]/40 border border-amber-200/80 rounded-3xl p-5 shadow-2xs relative overflow-hidden space-y-2">
            <span className="text-3xl font-serif-editorial text-amber-600 font-bold block leading-none select-none">“</span>
            <p className="text-xs text-stone-700 font-serif-editorial italic leading-relaxed">
              The beautiful thing about learning is that no one can take it away from you.
            </p>
            <div className="text-[11px] font-semibold text-amber-900 text-right">
              — B.B. King
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};


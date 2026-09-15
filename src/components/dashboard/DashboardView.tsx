import React, { useState, useEffect, useMemo } from 'react';
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
  GraduationCap,
  Video,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { StudyGoal } from '../../types/index.js';
import { YptHomeWidget } from './YptHomeWidget.js';

interface LearnerProgressItem {
  conceptId: string;
  conceptTitle: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  overallMastery: number;
  accuracy: number;
  retention: number;
  attemptsCount: number;
  lastStudiedAt: string;
}

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    learnerModel,
    nextBestAction,
    entitlements,
    setActiveSection,
    setSelectedConceptId,
    setSelectedSubjectId,
  } = useLearner();

  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [progressItems, setProgressItems] = useState<LearnerProgressItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getGoals(user?.id).catch(() => []),
      api.getLearnerProgress().catch(() => []),
    ]).then(([goalsRes, progRes]) => {
      if (isMounted) {
        if (Array.isArray(goalsRes)) setGoals(goalsRes);
        if (Array.isArray(progRes)) setProgressItems(progRes);
        setLoadingItems(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Canonical metrics directly from database
  const streakDays = learnerModel?.currentStreak ?? 0;
  const questionsPracticed = learnerModel?.totalQuestionsAttempted ?? 0;
  const accuracyRate = learnerModel?.accuracyRate ?? 0;
  const topicsCount = learnerModel?.topicsStudiedCount ?? 0;
  const testsCount = learnerModel?.mockTestsCompletedCount ?? 0;

  const activeEntitlements = entitlements.filter(e => e.status === 'ACTIVE');

  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  // Dynamically compute current week's 7 days
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return dayLabels.map((day, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      const isPastOrToday = d <= today;
      const isActive = streakDays > 0 && isPastOrToday && (today.getDate() - d.getDate() < streakDays);
      return {
        day,
        date: d.getDate(),
        isToday,
        active: isActive,
      };
    });
  }, [streakDays]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans-editorial text-stone-800">
      
      {/* 2-Column Responsive Layout: Main Content (Left) + Intelligence Rail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT / CENTER CONTENT AREA (8 cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Header Greeting */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-editorial font-bold text-stone-900 tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'Learner'}! 👋
            </h1>
            <p className="text-stone-500 text-sm">
              Let's continue your learning journey today.
            </p>
          </div>

          {/* 4 Top Metric Cards (Direct from Database) */}
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
                <div className="text-[10px] font-semibold text-stone-500 mt-1">
                  {topicsCount > 0 ? `${topicsCount} covered` : 'No topics yet'}
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
                <div className="text-[10px] font-semibold text-stone-500 mt-1">
                  {questionsPracticed > 0 ? `${questionsPracticed} attempted` : '0 attempted'}
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
                <div className="text-[10px] font-semibold text-stone-500 mt-1">
                  {testsCount > 0 ? `${testsCount} completed` : '0 completed'}
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
                <div className="text-[10px] font-semibold text-stone-500 mt-1">
                  {questionsPracticed > 0 ? `Across ${questionsPracticed} questions` : 'No attempts yet'}
                </div>
              </div>
            </div>

          </div>

          {/* YPT STUDY FOCUS & PEER GROUPS WIDGET */}
          <YptHomeWidget />

          {/* MY ENROLLED COURSES SECTION (Direct from Entitlements Table) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-800" />
                <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
                  My Enrolled Courses
                </h3>
              </div>
              <button
                onClick={() => setActiveSection('learner-purchases')}
                className="text-xs font-semibold text-stone-600 hover:text-amber-800 transition-colors cursor-pointer"
              >
                Invoices & Receipts →
              </button>
            </div>

            {activeEntitlements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEntitlements.map(ent => {
                  const formattedExpiry = new Date(ent.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  return (
                    <div
                      key={ent.id}
                      className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {ent.courseExam || 'UPSC / BPSC'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        </div>
                        <h4 className="text-base font-serif-editorial font-bold text-stone-900">
                          {ent.courseName}
                        </h4>
                        <p className="text-xs text-stone-500 font-sans-editorial">
                          Valid until: <span className="font-semibold text-stone-700">{formattedExpiry}</span> ({ent.daysRemaining} days remaining)
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <button
                          onClick={() => setActiveSection('pyq-practice')}
                          className="inline-flex items-center gap-2 bg-[#0C1024] hover:bg-[#1E2548] text-amber-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <span>Continue Course</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveSection('mock-tests')}
                          className="text-xs font-semibold text-stone-600 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          Mock Simulator →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 text-center space-y-3 shadow-2xs">
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  No active course enrollments yet. Unlock full test series, PYQ simulators, and study plans.
                </p>
                <button
                  onClick={() => setActiveSection('courses-catalog')}
                  className="inline-flex items-center gap-2 bg-stone-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  <span>Explore Course Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* AI Tutor Hero Banner */}
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
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 via-orange-300/20 to-transparent rounded-full blur-2xl animate-pulse" />
              <div className="absolute w-32 h-32 border border-amber-400/40 rounded-full animate-spin" style={{ animationDuration: '24s' }} />
              <div className="absolute w-24 h-24 border border-amber-500/50 rounded-full border-dashed animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
              <div className="absolute w-16 h-16 border border-orange-400/60 rounded-full" />
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-amber-300 to-orange-400 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <Bot className="w-7 h-7 text-stone-900/90" />
              </div>
            </div>

          </div>

          {/* CONTINUE LEARNING SECTION (Direct from User Concept Mastery in DB) */}
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

            {progressItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {progressItems.map(item => (
                  <div
                    key={item.conceptId}
                    className="bg-white border border-[#EAE6DF] rounded-2xl p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between relative overflow-hidden group"
                  >
                    <div className="space-y-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 truncate max-w-full">
                        {item.subjectName}
                      </span>
                      <h4 className="text-sm font-serif-editorial font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2">
                        {item.conceptTitle}
                      </h4>
                      {item.topicName && (
                        <p className="text-[11px] text-stone-500 font-mono truncate">
                          {item.topicName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-stone-600">
                          <span>Mastery</span>
                          <span>{item.overallMastery}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, item.overallMastery))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                        <span>Accuracy: <strong className="text-stone-700">{item.accuracy}%</strong></span>
                        <button
                          onClick={() => {
                            setSelectedSubjectId(item.subjectId);
                            setSelectedConceptId(item.conceptId);
                            setActiveSection('learn');
                          }}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 text-center space-y-3 shadow-2xs">
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  No topic activity recorded yet. Start practicing questions to build your subject mastery profile.
                </p>
                <button
                  onClick={() => setActiveSection('pyq-practice')}
                  className="inline-flex items-center gap-2 bg-stone-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* RECOMMENDED FOR YOU SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
                  Recommended Next Action
                </h3>
                <p className="text-xs text-stone-500">Based on your accuracy and revision schedule</p>
              </div>
              <button
                onClick={() => setActiveSection('practice')}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Practice All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Next Best Action Card or Quick Launchers */}
            {nextBestAction ? (
              <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {nextBestAction.actionType}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    ~{nextBestAction.estimatedMinutes} mins
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-serif-editorial font-bold text-stone-900">
                    {nextBestAction.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {nextBestAction.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (nextBestAction.conceptId) setSelectedConceptId(nextBestAction.conceptId);
                      if (nextBestAction.actionType === 'REVISE') setActiveSection('revision');
                      else if (nextBestAction.actionType === 'MOCK') setActiveSection('mock-tests');
                      else setActiveSection('pyq-practice');
                    }}
                    className="inline-flex items-center gap-2 bg-[#0C1024] hover:bg-[#1E2548] text-amber-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span>Execute Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  onClick={() => setActiveSection('pyq-practice')}
                  className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">PYQ Practice</div>
                      <div className="text-[10px] text-stone-500 truncate">Official Questions</div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('mock-tests')}
                  className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">Mock Simulator</div>
                      <div className="text-[10px] text-stone-500 truncate">Full Length Tests</div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('live-classes')}
                  className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                        <span>Live Classes</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">Live Mentorship</div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('resources')}
                  className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">Smart Notes</div>
                      <div className="text-[10px] text-stone-500 truncate">Study Resources</div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('current-affairs')}
                  className="bg-white border border-[#EAE6DF] hover:border-amber-400 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">Current Affairs</div>
                      <div className="text-[10px] text-stone-500 truncate">Daily Editorials</div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
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
              <span className="text-xs font-semibold text-stone-500">
                {streakDays === 1 ? 'day active' : 'days in a row'}
              </span>
            </div>

            {/* Days of week circular indicators */}
            <div className="flex items-center justify-between pt-1">
              {weekDays.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[10px] font-semibold ${item.isToday ? 'text-amber-700 font-bold' : 'text-stone-400'}`}>
                    {item.day}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      item.active
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : item.isToday
                        ? 'bg-stone-50 text-stone-700 border border-stone-300'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {item.date}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-500 font-medium pt-1 border-t border-stone-100">
              {streakDays > 0 ? 'Keep going, consistency builds exam mastery.' : 'Study today to initiate your daily streak.'}
            </p>
          </div>

          {/* Card 2: Daily Goals (Direct from Database) */}
          <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif-editorial font-bold text-stone-900">Study Goals</h4>
              <button
                onClick={() => setActiveSection('goals')}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 cursor-pointer"
              >
                {goals.length > 0 ? 'Manage Goals' : 'Set Goal'}
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-3.5">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-stone-800 truncate">{g.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[11px] font-bold text-stone-700">{g.progressPercentage || 0}%</span>
                        {g.progressPercentage >= 100 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, g.progressPercentage || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>{g.targetExam}</span>
                      <span>{g.dailyStudyMinutes} min/day</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center space-y-2">
                <p className="text-xs text-stone-500">No active study goals set.</p>
                <button
                  onClick={() => setActiveSection('goals')}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Create your first goal →
                </button>
              </div>
            )}
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

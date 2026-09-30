import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Compass,
  Layers,
  BookOpen,
  Sliders,
  AlertTriangle,
  Flame,
  FileCheck2,
  Newspaper,
  ChevronRight,
  TrendingUp,
  Target,
  Plus,
  Flag,
  CheckSquare
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';
import { StudyGoal } from '../../types/index.js';

export const GoalsView: React.FC = () => {
  const { setActiveSection, setSelectedSubjectId, askTutorWithContext } = useLearner();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WEEK' | 'INTELLIGENCE' | 'MILESTONES'>('TODAY');

  // Study Plan Data from Backend
  const [planSummary, setPlanSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Customize Plan Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTargetExam, setConfigTargetExam] = useState('UPSC CSE');
  const [configTargetStage, setConfigTargetStage] = useState<'PRELIMS' | 'MAINS' | 'INTERVIEW' | 'INTEGRATED'>('INTEGRATED');
  const [configTargetYear, setConfigTargetYear] = useState(2026);
  const [configDailyHours, setConfigDailyHours] = useState(4.5);
  const [configDays, setConfigDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [configTime, setConfigTime] = useState<'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'FLEXIBLE'>('MORNING');
  const [configExamDate, setConfigExamDate] = useState('2026-05-24');
  const [configPrioritySubjects, setConfigPrioritySubjects] = useState<string[]>(['sub_polity', 'sub_economy']);
  const [configLevel, setConfigLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [savingConfig, setSavingConfig] = useState(false);

  // Milestone Goals
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalExam, setGoalExam] = useState('UPSC CSE 2026');
  const [goalDate, setGoalDate] = useState('2026-05-24');
  const [goalMinutes, setGoalMinutes] = useState(120);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const summary = await api.getStudyPlan();
      setPlanSummary(summary);
      if (summary?.plan) {
        setConfigTargetExam(summary.plan.targetExam || 'UPSC CSE');
        setConfigTargetStage(summary.plan.targetStage || 'INTEGRATED');
        setConfigTargetYear(summary.plan.targetYear || 2026);
        setConfigDailyHours(summary.plan.dailyStudyHours || 4.5);
        setConfigDays(summary.plan.studyDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
        setConfigTime(summary.plan.preferredStudyTime || 'MORNING');
        setConfigExamDate(summary.plan.examDate || '2026-05-24');
        setConfigPrioritySubjects(summary.plan.prioritySubjects || ['sub_polity', 'sub_economy']);
        setConfigLevel(summary.plan.preparationLevel || 'INTERMEDIATE');
      }
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const list = await api.getGoals();
      setGoals(Array.isArray(list) ? list : []);
    } catch {
      setGoals([]);
    }
  };

  useEffect(() => {
    fetchPlan();
    fetchGoals();
  }, []);

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setUpdatingTaskId(task.id);
    try {
      await api.updateStudyPlanTask(task.id, newStatus);
      // Optimistic update
      setPlanSummary((prev: any) => {
        if (!prev) return prev;
        const updateList = (list: any[]) =>
          (list || []).map(t => (t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null } : t));

        const updatedToday = updateList(prev.todayTasks);
        const updatedWeek = updateList(prev.weekTasks);
        const completedCount = updatedWeek.filter(t => t.status === 'COMPLETED').length;
        const totalCount = updatedWeek.length;

        return {
          ...prev,
          todayTasks: updatedToday,
          weekTasks: updatedWeek,
          completionStats: {
            ...prev.completionStats,
            completedTasks: completedCount,
            completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          },
        };
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleLaunchTask = (task: any) => {
    if (task.subjectId) {
      setSelectedSubjectId(task.subjectId);
    }

    if (task.actionTarget?.view === 'exam-engine') {
      setActiveSection('exam-engine');
    } else if (task.actionTarget?.view === 'revision') {
      setActiveSection('revision');
    } else if (task.actionTarget?.view === 'current-affairs') {
      setActiveSection('current-affairs');
    } else if (task.actionTarget?.view === 'resources') {
      setActiveSection('resources');
    } else {
      setActiveSection('exam-engine');
    }
  };

  const handleSavePlanConfig = async () => {
    setSavingConfig(true);
    try {
      const updated = await api.setupStudyPlan({
        targetExam: configTargetExam,
        targetStage: configTargetStage,
        targetYear: configTargetYear,
        dailyStudyHours: configDailyHours,
        studyDays: configDays,
        preferredStudyTime: configTime,
        examDate: configExamDate,
        prioritySubjects: configPrioritySubjects,
        preparationLevel: configLevel,
      });
      setPlanSummary(updated);
      setShowConfigModal(false);
    } catch (err) {
      console.error('Failed to configure plan:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;
    try {
      const newG = await api.createGoal({
        title: goalTitle,
        targetExam: goalExam,
        targetDate: goalDate,
        dailyStudyMinutes: goalMinutes,
        subjects: ['sub_polity', 'sub_economy'],
      });
      if (newG && newG.id) {
        setGoals(prev => [...(Array.isArray(prev) ? prev : []), newG]);
      }
      setGoalTitle('');
      setShowCreateGoal(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const allAvailableSubjects = [
    { id: 'sub_polity', name: 'Indian Polity & Constitution' },
    { id: 'sub_economy', name: 'Indian Economy & Macroeconomics' },
    { id: 'sub_history', name: 'History & Indian Culture' },
    { id: 'sub_geography', name: 'Physical & Human Geography' },
    { id: 'sub_environment', name: 'Environment, Ecology & Climate' },
    { id: 'sub_sci_tech', name: 'Science & Emerging Technology' },
    { id: 'sub_bihar_special', name: 'Bihar Special (BPSC CCE)' },
    { id: 'sub_csat', name: 'CSAT & Analytical Aptitude' },
  ];

  const getTaskBadge = (type: string) => {
    switch (type) {
      case 'PRELIMS_PYQ':
        return { label: 'Prelims PYQ', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'WEAK_AREA_DRILL':
        return { label: 'Weak Area Drill', bg: 'bg-rose-100 text-rose-950 border-rose-300' };
      case 'SPACED_REVISION':
        return { label: 'Spaced Recall', bg: 'bg-indigo-100 text-indigo-950 border-indigo-300' };
      case 'MAINS_WRITING':
        return { label: 'Mains Answer', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
      case 'CURRENT_AFFAIRS':
        return { label: 'Current Affairs', bg: 'bg-sky-100 text-sky-950 border-sky-300' };
      case 'INTERVIEW_PREP':
        return { label: 'Mock Board', bg: 'bg-purple-100 text-purple-950 border-purple-300' };
      default:
        return { label: 'Study Task', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono bg-amber-100 text-amber-950 border border-amber-300">
              Personalized Intelligence Layer
            </span>
            <span className="text-xs text-stone-600 font-mono">
              Cycle: {planSummary?.plan?.targetYear || 2026}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-amber-700" />
            <span>Personalized Study Planner</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
            Dynamic preparation schedule synthesized from your actual attempt accuracy, spaced retention decay curves, high-importance syllabus weightages, and Current Affairs linkages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl border border-stone-800 flex items-center gap-2 shadow-2xs cursor-pointer transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Customize Blueprint</span>
          </button>

          <button
            onClick={fetchPlan}
            className="p-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 shadow-2xs cursor-pointer transition-all"
            title="Refresh Schedule"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Blueprint Overview Status Banner */}
      {planSummary?.plan && (
        <div className="bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-white p-5 sm:p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono uppercase">
                  {planSummary.plan.targetExam}
                </span>
                <span className="text-stone-400 text-xs font-mono">•</span>
                <span className="text-xs text-stone-300 font-mono uppercase">
                  Stage: {planSummary.plan.targetStage}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-editorial text-amber-100">
                {planSummary.plan.title}
              </h2>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-stone-800/80 border border-stone-700/80 px-3.5 py-2 rounded-2xl text-center">
                <div className="text-[10px] text-stone-400 font-mono uppercase">Daily Budget</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono">
                  {planSummary.plan.dailyStudyHours} hrs
                </div>
              </div>
              <div className="bg-stone-800/80 border border-stone-700/80 px-3.5 py-2 rounded-2xl text-center">
                <div className="text-[10px] text-stone-400 font-mono uppercase">Completion</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">
                  {planSummary.completionStats?.completionPercentage || 0}%
                </div>
              </div>
              <div className="bg-stone-800/80 border border-stone-700/80 px-3.5 py-2 rounded-2xl text-center">
                <div className="text-[10px] text-stone-400 font-mono uppercase">Active Days</div>
                <div className="text-sm font-bold text-stone-200 mt-0.5 font-mono">
                  {planSummary.plan.studyDays?.length || 7} / wk
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Overall Scheduled Progress</span>
              <span>{planSummary.completionStats?.completedTasks || 0} of {planSummary.completionStats?.totalTasks || 0} tasks completed</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${planSummary.completionStats?.completionPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('TODAY')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'TODAY'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Target className="w-4 h-4 text-amber-700" />
          <span>Today's Action Agenda ({planSummary?.todayTasks?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('WEEK')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'WEEK'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-700" />
          <span>Weekly Schedule ({planSummary?.weekTasks?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('INTELLIGENCE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'INTELLIGENCE'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span>Algorithm & Weak Areas</span>
        </button>

        <button
          onClick={() => setActiveTab('MILESTONES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'MILESTONES'
              ? 'border-amber-700 text-amber-950 font-serif-editorial text-sm'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-700" />
          <span>Milestone Goals ({goals.length})</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
          <span>Synthesizing personalized study schedule from real attempts...</span>
        </div>
      )}

      {/* TAB 1: TODAY'S ACTION AGENDA */}
      {!loading && activeTab === 'TODAY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
              Scheduled For Today • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-stone-600 font-mono">
              Click checkbox to toggle completion
            </div>
          </div>

          {(!planSummary?.todayTasks || planSummary.todayTasks.length === 0) ? (
            <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold font-serif-editorial text-stone-900">
                You're All Caught Up For Today!
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No outstanding tasks for today. You can review your weekly plan or customize your study blueprint.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {planSummary.todayTasks.map((task: any) => {
                const isCompleted = task.status === 'COMPLETED';
                const badge = getTaskBadge(task.taskType);

                return (
                  <div
                    key={task.id}
                    className={`bg-white border p-4 sm:p-5 rounded-2xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80'
                        : task.priority === 'URGENT'
                        ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                        : 'border-stone-200/90 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        disabled={updatingTaskId === task.id}
                        className="mt-0.5 text-stone-400 hover:text-amber-700 transition-colors cursor-pointer shrink-0"
                        title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-300 hover:text-amber-600" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-full font-mono ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {task.subjectName && (
                            <span className="text-[10px] font-bold text-stone-600 font-mono">
                              • {task.subjectName}
                            </span>
                          )}
                          <span className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {task.estimatedMinutes} mins
                          </span>
                          {task.priority === 'URGENT' && (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-mono">
                              URGENT
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm sm:text-base font-bold text-stone-900 font-serif-editorial ${isCompleted ? 'line-through text-stone-500' : ''}`}>
                          {task.title}
                        </h3>

                        <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Launch Action Button */}
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleLaunchTask(task)}
                        className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all border border-stone-800"
                      >
                        <span>Start Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY SCHEDULE CALENDAR */}
      {!loading && activeTab === 'WEEK' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
            Full 7-Day Cycle Syllabus Allocation
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
              const dayTasks = (planSummary?.weekTasks || []).filter((t: any) => t.dayOfWeek === day);

              return (
                <div
                  key={day}
                  className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-amber-400/80 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-900 font-mono">
                        {day}
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                        {dayTasks.length} Tasks
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayTasks.map((t: any) => {
                        const badge = getTaskBadge(t.taskType);
                        return (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-all ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-50/30 border-emerald-200 text-stone-500 line-through'
                                : 'bg-[#FAF8F5] border-stone-200/80 hover:border-amber-400 text-stone-800'
                            }`}
                            onClick={() => handleLaunchTask(t)}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {t.estimatedMinutes}m
                              </span>
                            </div>
                            <div className="font-bold text-stone-900 line-clamp-1">
                              {t.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-500 font-mono flex items-center justify-between">
                    <span>Total Planned:</span>
                    <span className="font-bold text-stone-700">
                      {dayTasks.reduce((s: number, t: any) => s + (t.estimatedMinutes || 30), 0)} mins
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ALGORITHM & WEAK AREAS BASIS */}
      {!loading && activeTab === 'INTELLIGENCE' && (
        <div className="space-y-5">
          <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-2">
            <h3 className="text-sm font-bold font-serif-editorial text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>How IKSHOVIA Generated Your Plan (Deterministic & Explainable)</span>
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Your study planner does not generate arbitrary generic tasks. It queries your actual question attempts, concept retention decay curves, and mistake categories to balance:
            </p>
            <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside pt-1">
              <li><strong>Spaced Repetition:</strong> Scheduled items where Ebbinghaus retention dropped below 65%.</li>
              <li><strong>Weak-Area Recovery:</strong> Focus topics where your accuracy rate is lower than 60%.</li>
              <li><strong>High-Yield Weightage:</strong> Core syllabus concepts with commission importance ratings of HIGH.</li>
              <li><strong>Mistake Correction:</strong> Questions you previously failed due to conceptual confusion.</li>
              <li><strong>Integrated Prep:</strong> Daily balance across Prelims PYQs, Mains analytical writing, and Current Affairs.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-stone-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Identified Priority Weak Areas</span>
              </h4>
              <div className="space-y-2">
                {(planSummary?.intelligenceBasis?.weakAreasIdentified || []).map((area: string, idx: number) => (
                  <div key={idx} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs flex items-center justify-between">
                    <span className="font-bold text-rose-950">{area}</span>
                    <span className="text-[10px] font-mono text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                      High Focus
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-stone-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Targeted Revision Queue Status</span>
              </h4>
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">Overdue Spaced Revisions:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {planSummary?.intelligenceBasis?.overdueRevisionsCount || 0} items
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">Scheduled Mistake Re-attempts:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {planSummary?.intelligenceBasis?.incorrectQuestionsScheduled || 0} questions
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">Uncovered Syllabus Areas:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {planSummary?.intelligenceBasis?.uncoveredSyllabusTopicsCount || 14} topics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONE GOALS */}
      {!loading && activeTab === 'MILESTONES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
              Long-Term Milestone Goals
            </div>

            <button
              onClick={() => setShowCreateGoal(true)}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Milestone</span>
            </button>
          </div>

          {showCreateGoal && (
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-2xs animate-fade-in">
              <h3 className="text-sm font-bold text-stone-900 font-serif-editorial">Create Milestone Goal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="Goal Title (e.g. Master Indian Polity Fundamental Rights)"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
                <input
                  type="text"
                  value={goalExam}
                  onChange={e => setGoalExam(e.target.value)}
                  placeholder="Target Exam (e.g. UPSC CSE 2026)"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
                <input
                  type="date"
                  value={goalDate}
                  onChange={e => setGoalDate(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
                <input
                  type="number"
                  value={goalMinutes}
                  onChange={e => setGoalMinutes(Number(e.target.value))}
                  placeholder="Daily Minutes (e.g. 120)"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateGoal}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Milestone
                </button>
                <button
                  onClick={() => setShowCreateGoal(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="bg-white border border-stone-200/90 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <Flag className="w-8 h-8 text-amber-700 mx-auto opacity-70" />
              <h3 className="text-base font-bold font-serif-editorial text-stone-900">No Custom Milestones Set</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Set milestone deadlines for full syllabus coverage or stage completion.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(g => (
                <div
                  key={g.id}
                  className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-full font-mono">
                        {g.targetExam}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 font-serif-editorial mt-1">{g.title}</h4>
                    </div>

                    <div className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      {g.progressPercentage}% Completed
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-stone-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Target: {g.targetDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Daily: {g.dailyStudyMinutes} mins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOMIZE STUDY BLUEPRINT MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                  Configure Personalized Study Blueprint
                </h2>
                <p className="text-xs text-stone-500">
                  Define your available time, target exam, and priority focus areas.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Target Exam & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-mono">Target Exam</label>
                  <select
                    value={configTargetExam}
                    onChange={e => setConfigTargetExam(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="UPSC CSE">UPSC Civil Services Examination</option>
                    <option value="71st BPSC CCE">71st BPSC Combined Competitive Exam</option>
                    <option value="UPPSC PCS">UPPSC Combined State Services</option>
                    <option value="State PSC">Other State Public Service Commission</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-mono">Target Stage</label>
                  <select
                    value={configTargetStage}
                    onChange={e => setConfigTargetStage(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="INTEGRATED">Integrated (Prelims + Mains + Interview)</option>
                    <option value="PRELIMS">Prelims Exclusive</option>
                    <option value="MAINS">Mains Exclusive</option>
                    <option value="INTERVIEW">Interview / Personality Test</option>
                  </select>
                </div>
              </div>

              {/* Daily Hours & Target Exam Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-mono">Daily Study Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="14"
                    value={configDailyHours}
                    onChange={e => setConfigDailyHours(parseFloat(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-mono">Attempt Cycle / Year</label>
                  <select
                    value={configTargetYear}
                    onChange={e => setConfigTargetYear(parseInt(e.target.value, 10))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-mono">Preparation Level</label>
                  <select
                    value={configLevel}
                    onChange={e => setConfigLevel(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="BEGINNER">Beginner (Foundation Focus)</option>
                    <option value="INTERMEDIATE">Intermediate (PYQ & Revision)</option>
                    <option value="ADVANCED">Advanced (Mains & Test Series)</option>
                  </select>
                </div>
              </div>

              {/* Study Days */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 font-mono">Preferred Study Days</label>
                <div className="flex flex-wrap gap-2">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
                    const selected = configDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setConfigDays(configDays.filter(d => d !== day));
                          } else {
                            setConfigDays([...configDays, day]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          selected
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Subjects */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 font-mono">Priority Syllabus Focus (Select 2-4)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAvailableSubjects.map(sub => {
                    const isSelected = configPrioritySubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setConfigPrioritySubjects(configPrioritySubjects.filter(id => id !== sub.id));
                          } else {
                            setConfigPrioritySubjects([...configPrioritySubjects, sub.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {isSelected && <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Exam Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 font-mono">Target Exam Date</label>
                <input
                  type="date"
                  value={configExamDate}
                  onChange={e => setConfigExamDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 border border-stone-200 text-stone-600 text-xs font-bold rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlanConfig}
                disabled={savingConfig}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer transition-all border border-stone-800"
              >
                {savingConfig ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Save & Generate Blueprint</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

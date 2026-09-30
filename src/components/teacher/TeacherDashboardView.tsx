import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Clock,
  Video,
  PlusCircle,
  FileQuestion,
  Bell,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherDashboardStats, TeacherClass, TeacherAssignment, TeacherSubmission, TeacherAnnouncement } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface TeacherDashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onNavigateTab,
  onQuickAction
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, classesRes, assignmentsRes, submissionsRes, announcementsRes] = await Promise.all([
        api.getTeacherDashboardStats().catch(() => null),
        api.getTeacherClasses().catch(() => []),
        api.getTeacherAssignments().catch(() => []),
        api.getTeacherSubmissions(undefined, 'SUBMITTED').catch(() => []),
        api.getTeacherAnnouncements().catch(() => [])
      ]);

      setStats(statsRes);
      setClasses(classesRes);
      setAssignments(assignmentsRes);
      setSubmissions(submissionsRes);
      setAnnouncements(announcementsRes);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load teacher dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-stone-500">Loading Teacher Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin Faculty View' : user?.role === 'ADMIN' ? 'Admin Faculty View' : 'Faculty Workspace'}
              </span>
              <span className="text-[10px] font-mono text-stone-400">IKSHOVIA ACADEMIC CORE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-editorial text-amber-50">
              Welcome back, {user?.name || 'Educator'}
            </h1>
            <p className="text-sm text-stone-300 mt-1 max-w-xl">
              Manage your cohort, evaluate candidate submissions, conduct live classes, and mentor aspirants across UPSC and State PSC syllabi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onQuickAction('create_class')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Class</span>
            </button>
            <button
              onClick={() => onQuickAction('start_live')}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl border border-stone-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Start Live Class</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Assigned Students</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {stats?.totalAssignedStudents ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Across active cohorts</div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Active Students</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {stats?.activeStudents ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Active this week</div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Pending Evals</span>
            <ClipboardCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {stats?.pendingEvaluations ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Requires review</div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Assignments Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {stats?.assignmentsDue ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Upcoming deadlines</div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Classes Today</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {stats?.classesToday ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Scheduled sessions</div>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Avg Performance</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {stats?.avgStudentPerformance ? `${Math.round(stats.avgStudentPerformance)}%` : '—'}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Class average</div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-stone-700 shrink-0 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Quick Actions:
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onQuickAction('create_class')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>New Class</span>
          </button>
          <button
            onClick={() => onQuickAction('create_assignment')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Assignment</span>
          </button>
          <button
            onClick={() => onQuickAction('create_quiz')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <FileQuestion className="w-3.5 h-3.5 text-emerald-600" />
            <span>Create Quiz</span>
          </button>
          <button
            onClick={() => onQuickAction('upload_resource')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>Upload Resource</span>
          </button>
          <button
            onClick={() => onQuickAction('start_live')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5 text-rose-600" />
            <span>Start Live</span>
          </button>
          <button
            onClick={() => onNavigateTab('evaluations')}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Evaluate Answers</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Classes & Submissions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Classes */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold font-serif-editorial text-stone-900">
                  Your Classes & Batches
                </h2>
                <p className="text-xs text-stone-500">Managed teaching cohorts and subjects</p>
              </div>
              <button
                onClick={() => onNavigateTab('classes')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-700">No classes created yet</p>
                <p className="text-xs text-stone-400 mt-1">Create your first class cohort to start enrolling students</p>
                <button
                  onClick={() => onQuickAction('create_class')}
                  className="mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Create Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.slice(0, 4).map(c => (
                  <div
                    key={c.id}
                    onClick={() => onNavigateTab('classes')}
                    className="p-4 border border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/20 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          {c.exam}
                        </span>
                        <h3 className="font-bold text-stone-900 text-sm mt-1.5 group-hover:text-amber-900 transition">
                          {c.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">{c.subject}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {c.enrolledCount ?? 0} students
                      </span>
                    </div>
                    {c.schedule && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{c.schedule}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Submissions / Evaluations */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                  <span>Recent Answer Submissions</span>
                  {submissions.length > 0 && (
                    <span className="text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
                      {submissions.length} Pending
                    </span>
                  )}
                </h2>
                <p className="text-xs text-stone-500">Student answers awaiting evaluation and feedback</p>
              </div>
              <button
                onClick={() => onNavigateTab('evaluations')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Evaluation Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center border border-stone-100 rounded-xl bg-stone-50/50">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-stone-700">All submissions evaluated!</p>
                <p className="text-xs text-stone-400 mt-0.5">There are no pending student responses awaiting your review.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {submissions.slice(0, 5).map(sub => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {sub.studentName || 'Learner'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 truncate">
                          {sub.studentEmail}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 truncate mt-0.5">
                        Assignment: <span className="font-medium text-stone-800">{sub.assignmentTitle || 'Mains Answer'}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('evaluations')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Evaluate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Assignments & Announcements (1 col) */}
        <div className="space-y-6">
          {/* Active Assignments */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold font-serif-editorial text-stone-900">
                Active Assignments
              </h2>
              <button
                onClick={() => onNavigateTab('assignments')}
                className="text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
              >
                View all
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-stone-100 rounded-xl bg-stone-50/50">
                No assignments active
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.slice(0, 4).map(a => (
                  <div key={a.id} className="p-3 border border-stone-200/80 rounded-xl bg-stone-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                        {a.status}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {a.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-stone-900 mt-1.5 truncate">
                      {a.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-200/60 font-mono">
                      <span>Submissions: {a.submissionsCount || 0}</span>
                      <span>Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Open'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Cohort Announcements */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold font-serif-editorial text-stone-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Class Announcements</span>
              </h2>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
              >
                Broadcast
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-stone-100 rounded-xl bg-stone-50/50">
                No announcements posted
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="p-3 bg-amber-50/30 border border-amber-200/60 rounded-xl">
                    <div className="text-xs font-bold text-stone-900">{ann.title}</div>
                    <div className="text-xs text-stone-600 mt-1 line-clamp-2">{ann.message}</div>
                    <div className="text-[10px] text-stone-400 font-mono mt-2">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  PieChart,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  averagePerformance: number;
  pendingEvaluations: number;
  assignmentsDue: number;
  totalClasses: number;
  classDistribution: Array<{
    name: string;
    subject: string;
    studentCount: number;
  }>;
}

export const TeacherAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTeacherAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-600" />
          <span>Teaching & Cohort Analytics</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Monitor cohort engagement, grading turnaround, average mark distributions, and assignment completion velocity.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Assigned Candidates</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {data?.totalStudents ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            {data?.activeStudents ?? 0} active recently
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Class Performance</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {data?.averagePerformance ? `${Math.round(data.averagePerformance)}%` : '—'}
          </div>
          <div className="text-[10px] text-teal-600 font-medium mt-1">Cohort average score</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Evaluation Backlog</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {data?.pendingEvaluations ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Submissions pending review</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Active Cohorts</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {data?.totalClasses ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Classroom batches</div>
        </div>
      </div>

      {/* Cohort Breakdown */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs">
        <h2 className="text-base font-bold font-serif-editorial text-stone-900 mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-amber-600" />
          <span>Cohort Enrollment Distribution</span>
        </h2>

        {!data?.classDistribution || data.classDistribution.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400">
            No class distribution data available yet
          </div>
        ) : (
          <div className="space-y-3">
            {data.classDistribution.map((item, idx) => {
              const maxCount = Math.max(...data.classDistribution.map(d => d.studentCount || 1));
              const percent = Math.round(((item.studentCount || 0) / maxCount) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{item.name}</span>
                      <span className="text-stone-400 font-mono ml-2">({item.subject})</span>
                    </div>
                    <span className="font-mono font-bold text-amber-900">
                      {item.studentCount} students
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Award,
  Sparkles,
  Flame,
  Clock,
  Zap,
  Target,
  BarChart2,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { learnerModel } = useLearner();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(data => {
      setAnalyticsData(data);
      setLoading(false);
    });
  }, []);

  const COLORS = ['#35156B', '#C9953C', '#6B3FD4', '#10B981', '#E0B35D', '#F43F5E'];

  const mistakePieData = learnerModel?.mistakeBreakdown
    ? Object.entries(learnerModel.mistakeBreakdown).map(([key, val]) => ({
        name: key.replace('_', ' '),
        value: val,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#35156B]" />
            <span>Learner Intelligence Analytics</span>
          </h1>
          <p className="text-stone-600 text-xs mt-0.5 font-medium">
            Deep diagnostic analysis of mastery levels, retention decay, confidence bias, and mistake drivers.
          </p>
        </div>

        {learnerModel && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl text-xs text-amber-900 font-bold self-start">
            <Award className="w-4 h-4 text-amber-700" />
            <span>Overall Score: {learnerModel.overallScore}%</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-[#35156B]" />
          Aggregating intelligence metrics...
        </div>
      )}

      {!loading && analyticsData?.hasEnoughData === false && (
        <div className="bg-white border border-stone-200 p-8 rounded-2xl text-center space-y-4 my-8 shadow-2xs">
          <BarChart2 className="w-10 h-10 text-[#35156B] mx-auto" />
          <h2 className="text-lg font-serif-editorial font-bold text-[#111426]">Not enough data yet</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Complete at least 3 practice questions or mock tests to unlock deep analytical breakdown of retention decay, confidence alignment, and speed metrics.
          </p>
        </div>
      )}

      {!loading && (analyticsData?.hasEnoughData !== false) && (
        <div className="space-y-6">
          
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#35156B] shrink-0" />
                <span className="truncate">Understanding Score</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426]">{learnerModel?.overallScore ?? 0}%</div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Application Accuracy</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-emerald-700">{learnerModel?.accuracyRate ?? 0}%</div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Study Streak</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-amber-900 flex items-center gap-1">
                {learnerModel?.currentStreak ?? 0}d
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#35156B] shrink-0" />
                <span className="truncate">Avg Speed / Q</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426] font-mono">
                {learnerModel?.avgTimePerQuestionSeconds ? `${learnerModel.avgTimePerQuestionSeconds}s` : '0s'}
              </div>
            </div>
          </div>

          {/* Secondary Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Confidence Bias Alignment</div>
              <div className="text-sm font-bold text-[#35156B] uppercase font-mono mt-1">
                {learnerModel?.confidenceBias || 'BALANCED'}
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Retention Decay Index</div>
              <div className="text-sm font-bold text-amber-800 font-mono mt-1">
                {learnerModel?.dueRevisionCount ? `${learnerModel.dueRevisionCount} Due` : 'Optimal (100%)'}
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Total Practice Attempts</div>
              <div className="text-sm font-bold text-[#111426] font-mono mt-1">
                {learnerModel?.totalAttempts ?? learnerModel?.totalQuestionsAttempted ?? 0} Questions
              </div>
            </div>
          </div>

          {/* Subject Mastery Bar Chart */}
          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-[#111426] uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#35156B]" />
              <span>Subject Mastery Index (%)</span>
            </h2>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.subjectStats || []}>
                  <XAxis dataKey="subjectName" stroke="#78716c" fontSize={12} />
                  <YAxis stroke="#78716c" domain={[0, 100]} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="mastery" fill="#35156B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mistake Breakdown Pie Chart */}
          {mistakePieData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-[#111426] uppercase tracking-wider font-mono flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#35156B]" />
                  <span>Mistake Category Distribution</span>
                </h2>

                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={mistakePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {mistakePieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagnostic Recommendation */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    <span>AI Diagnostic Advice</span>
                  </h2>

                  <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                    Your highest error rate stems from <strong>Concept Confusion</strong> between related institutional bodies and articles.
                    We recommend attempting 5 application MCQs specifically targeting <em>Finance Commission vs GST Council</em> to convert this gap into mastery.
                  </p>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] font-semibold text-amber-950">
                  ⚡ IKSHOVIA automatically recalibrates your revision queue after every practice session.
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

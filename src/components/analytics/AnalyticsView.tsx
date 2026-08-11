import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Award,
  Sparkles,
  Flame,
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

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  const mistakePieData = learnerModel?.mistakeBreakdown
    ? Object.entries(learnerModel.mistakeBreakdown).map(([key, val]) => ({
        name: key.replace('_', ' '),
        value: val,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Learner Intelligence Analytics</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Deep diagnostic analysis of mastery levels, confidence bias alignment, mistake drivers, and trends.
          </p>
        </div>

        {learnerModel && (
          <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-800 px-3 py-1.5 rounded-xl text-xs text-indigo-200 font-bold self-start">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Overall Score: {learnerModel.overallScore}%</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
          Aggregating intelligence metrics...
        </div>
      )}

      {!loading && analyticsData && (
        <div className="space-y-6">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
              <div className="text-xs text-slate-400">Total Questions Attempted</div>
              <div className="text-2xl font-black text-white">{learnerModel?.totalAttempts || 0}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
              <div className="text-xs text-slate-400">Overall Accuracy</div>
              <div className="text-2xl font-black text-emerald-400">{learnerModel?.accuracyRate || 0}%</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
              <div className="text-xs text-slate-400">Study Streak</div>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                <Flame className="w-5 h-5 fill-amber-400" />
                {learnerModel?.currentStreak || 0}d
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
              <div className="text-xs text-slate-400">Confidence Bias</div>
              <div className="text-sm font-bold text-indigo-300 uppercase font-mono mt-1">
                {learnerModel?.confidenceBias || 'Aligned'}
              </div>
            </div>
          </div>

          {/* Subject Mastery Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Subject Mastery Index (%)</span>
            </h2>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.subjectStats}>
                  <XAxis dataKey="subjectName" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="mastery" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mistake Breakdown Pie Chart */}
          {mistakePieData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-rose-400" />
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
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagnostic Recommendation */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>AI Diagnostic Advice</span>
                  </h2>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                    Your highest error rate stems from <strong>Concept Confusion</strong> between related institutional bodies and articles.
                    We recommend attempting 5 application MCQs specifically targeting <em>Finance Commission vs GST Council</em> to convert this gap into mastery.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
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

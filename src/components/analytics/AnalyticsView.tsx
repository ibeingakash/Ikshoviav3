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
  FileCheck2,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { getMockDisplayTitle } from '../../utils/mockUtils.js';
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
  const { learnerModel, setActiveSection } = useLearner();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(data => {
      setAnalyticsData(data);
      setLoading(false);
    });
  }, []);

  const COLORS = ['#35156B', '#C9953C', '#6B3FD4', '#10B981', '#E0B35D', '#F43F5E'];

  const activeModel = analyticsData?.model || learnerModel;

  const mistakePieData = activeModel?.mistakeBreakdown
    ? Object.entries(activeModel.mistakeBreakdown)
        .filter(([_, val]) => Number(val) > 0)
        .map(([key, val]) => ({
          name: key.replace(/_/g, ' '),
          value: Number(val),
        }))
    : [];

  const recentMockAttempts: any[] = analyticsData?.recentMockAttempts || [];

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

        {activeModel && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl text-xs text-amber-900 font-bold self-start">
            <Award className="w-4 h-4 text-amber-700" />
            <span>Overall Score: {activeModel.overallScore ?? 0}%</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-[#35156B]" />
          Aggregating intelligence metrics...
        </div>
      )}

      {!loading && analyticsData?.hasEnoughData === false && (
        <div className="bg-white border border-stone-200 p-8 rounded-2xl text-center space-y-4 my-8 shadow-2xs">
          <BarChart2 className="w-10 h-10 text-[#35156B] mx-auto" />
          <h2 className="text-lg font-serif-editorial font-bold text-[#111426]">
            No activity recorded yet
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Take a Daily Quiz or complete a Mock Test to unlock deep diagnostic analytics, retention tracking, and subject mastery graphs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveSection('practice')}
              className="px-4 py-2 bg-[#35156B] hover:bg-[#250d4f] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Launch Daily Quiz</span>
            </button>
            <button
              onClick={() => setActiveSection('mock')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Take Full Mock Test</span>
            </button>
          </div>
        </div>
      )}

      {!loading && analyticsData?.hasEnoughData !== false && (
        <div className="space-y-6">
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#35156B] shrink-0" />
                <span className="truncate">Understanding Score</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426]">
                {activeModel?.overallScore ?? 0}%
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Application Accuracy</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-emerald-700">
                {activeModel?.accuracyRate ?? 0}%
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Study Streak</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-amber-900 flex items-center gap-1">
                {activeModel?.currentStreak ?? 0}d
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#35156B] shrink-0" />
                <span className="truncate">Avg Speed / Q</span>
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426] font-mono">
                {activeModel?.avgTimePerQuestionSeconds ? `${activeModel.avgTimePerQuestionSeconds}s` : '45s'}
              </div>
            </div>
          </div>

          {/* Secondary Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Confidence Bias Alignment</div>
              <div className="text-sm font-bold text-[#35156B] uppercase font-mono mt-1">
                {activeModel?.confidenceBias || 'BALANCED'}
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Retention Decay Index</div>
              <div className="text-sm font-bold text-amber-800 font-mono mt-1">
                {activeModel?.dueRevisionCount ? `${activeModel.dueRevisionCount} Due for Revision` : 'Optimal (100%)'}
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-stone-500">Total Practice Attempts</div>
              <div className="text-sm font-bold text-[#111426] font-mono mt-1">
                {activeModel?.totalAttempts ?? activeModel?.totalQuestionsAttempted ?? 0} Questions
              </div>
            </div>
          </div>

          {/* Subject Mastery Bar Chart */}
          <div className="bg-white border border-stone-200 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111426] uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#35156B]" />
                <span>Subject Mastery Index (%)</span>
              </h2>
              <span className="text-[11px] text-stone-500 font-mono">Calibrated via Practice & Mocks</span>
            </div>

            {analyticsData?.subjectStats && analyticsData.subjectStats.some((s: any) => s.mastery > 0) ? (
              <div className="w-full" style={{ height: Math.max(240, (analyticsData.subjectStats.length || 4) * 44) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={analyticsData.subjectStats}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <XAxis type="number" domain={[0, 100]} unit="%" stroke="#78716c" fontSize={11} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="subjectName"
                      width={140}
                      stroke="#78716c"
                      fontSize={11}
                      tickLine={false}
                      tick={{ fill: '#332f2c', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Mastery Index']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e7e5e4',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="mastery" fill="#35156B" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 px-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-2">
                <BarChart3 className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-semibold text-stone-600">No subject mastery data recorded yet</p>
                <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                  Complete mock test sections or practice question sets to calibrate your topic-by-topic mastery graph.
                </p>
                <button
                  onClick={() => setActiveSection('practice')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35156B] text-white text-xs font-bold hover:bg-[#2a1055] transition-colors cursor-pointer"
                >
                  <span>Start Practice</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Mistake Breakdown Pie Chart & AI Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-[#111426] uppercase tracking-wider font-mono flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#35156B]" />
                <span>Mistake Category Distribution</span>
              </h2>

              {mistakePieData.length > 0 ? (
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
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-stone-400 text-xs text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <span>No mistakes recorded yet. Excellent performance!</span>
                </div>
              )}
            </div>

            {/* Diagnostic Recommendation */}
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Diagnostic Feedback</span>
                </h2>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  {activeModel?.weakConceptsCount && activeModel.weakConceptsCount > 0
                    ? `You currently have ${activeModel.weakConceptsCount} priority concepts identified for review. Attempting targeted practice in high-weightage topics will rapidly boost your composite score.`
                    : 'Your preparation indicators are tracking steadily across general syllabus categories. Continue consistent daily quizzes to maintain high recall velocity.'}
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] font-semibold text-amber-950 flex items-center justify-between">
                <span>⚡ Calibrated after every test attempt</span>
                <button
                  onClick={() => setActiveSection('practice')}
                  className="text-amber-800 hover:text-amber-900 font-bold underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Practice Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Mock Test History */}
          {recentMockAttempts.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-[#111426] uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#35156B]" />
                  <span>Recent Mock Test Submissions</span>
                </h2>
                <button
                  onClick={() => setActiveSection('mock-tests')}
                  className="text-xs font-bold text-[#35156B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Mocks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentMockAttempts.slice(0, 6).map((attempt, idx) => {
                  const durationSecs = Number(attempt.timeTakenSeconds || (attempt as any).time_taken_seconds || 0);
                  const durationDisplay = durationSecs >= 60
                    ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60 ? `${durationSecs % 60}s` : ''}`
                    : `${durationSecs > 0 ? durationSecs : 45}s`;

                  return (
                    <div
                      key={attempt.id || idx}
                      className="p-3.5 rounded-xl border border-stone-150 bg-stone-50/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {getMockDisplayTitle({ title: attempt.mockTitle || attempt.mock_title })}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Recent'}</span>
                          <span>•</span>
                          <span>{durationDisplay}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-stone-900 font-mono">
                            {attempt.score} / {attempt.maxScore || attempt.max_score}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-700">
                            {attempt.accuracy}% Acc
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            sessionStorage.setItem('review_attempt_id', attempt.id);
                            setActiveSection('mock-tests');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-[#35156B] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

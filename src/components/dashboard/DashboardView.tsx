import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Brain,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
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
    appTheme,
  } = useLearner();

  const [activeTab, setActiveTab] = useState<'revision' | 'syllabus' | 'intelligence'>('revision');
  const isParchment = appTheme === 'upsc-parchment';

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
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Futuristic Command Hero Banner */}
      <div className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl transition-all border ${
        isParchment
          ? 'bg-gradient-to-r from-[#0F1E36] via-[#1A2E4C] to-[#0F1E36] text-white border-amber-500/30 shadow-lg'
          : 'glass-card border-slate-700/60 shadow-2xl'
      }`}>
        {/* Glow backdrop effect */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                Target Exam: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
              Welcome, {user?.name || 'IKSHOVIA User'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              IKSHOVIA AI actively predicts retention decay and optimizes your exam preparation roadmap.
            </p>
          </div>

          {/* HUD Minimal Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-sm">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Mastery</div>
              <div className="text-2xl font-black text-amber-400">{learnerModel?.overallScore || 70}%</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-sm">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Streak</div>
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
                {learnerModel?.currentStreak || 6}d
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <p className="text-xs text-amber-100 font-medium italic truncate flex-1">
            "{aiInsight}"
          </p>
        </div>
      </div>

      {/* Streamlined Recommended Action Card */}
      {nextBestAction && (
        <div className="glass-card glass-card-hover border-amber-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                  Next Priority Action
                </span>
                <span className="text-xs text-amber-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {nextBestAction.estimatedMinutes} mins
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {nextBestAction.title}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-2">
                {nextBestAction.reason}
              </p>
            </div>

            <button
              id="launch-next-action-btn"
              onClick={handleLaunchNBA}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-105"
            >
              <span>Start Action</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Futuristic Clean Pillar Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'revision'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : isParchment
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revision Queue ({learnerModel?.dueRevisionCount || 2})</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'syllabus'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : isParchment
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus Topics</span>
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'intelligence'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : isParchment
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Error Analysis</span>
          </button>
        </div>

        {/* Tab 1: Revision Queue */}
        {activeTab === 'revision' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className={`p-4 rounded-2xl border transition-all ${
              isParchment ? 'bg-white border-slate-200' : 'glass-card border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isParchment ? 'text-slate-900' : 'text-white'}`}>
                  Article 32 & Supreme Court Writs
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                  Retention: 65%
                </span>
              </div>
              <p className={`text-xs mb-3 ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
                Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto writs.
              </p>
              <button
                onClick={() => {
                  setSelectedConceptId('c_art32');
                  setActiveSection('revision');
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Start Flash Revision
              </button>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isParchment ? 'bg-white border-slate-200' : 'glass-card border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isParchment ? 'text-slate-900' : 'text-white'}`}>
                  Fiscal Federalism Devolution
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded font-bold">
                  Decay High
                </span>
              </div>
              <p className={`text-xs mb-3 ${isParchment ? 'text-slate-600' : 'text-slate-400'}`}>
                Article 280 Finance Commission horizontal & vertical tax sharing.
              </p>
              <button
                onClick={() => {
                  setSelectedConceptId('c_fiscal_fed');
                  setActiveSection('revision');
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Urgent Review
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Syllabus Progress */}
        {activeTab === 'syllabus' && (
          <div className="space-y-3 animate-fade-in">
            <div className={`p-4 rounded-2xl border transition-all ${
              isParchment ? 'bg-white border-slate-200' : 'glass-card border-slate-800'
            }`}>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className={isParchment ? 'text-slate-900' : 'text-slate-100'}>Indian Polity (Article 21 & Rights)</span>
                <span className="text-amber-400">88% Mastery</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isParchment ? 'bg-white border-slate-200' : 'glass-card border-slate-800'
            }`}>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className={isParchment ? 'text-slate-900' : 'text-slate-100'}>Indian Economy (Monetary Policy)</span>
                <span className="text-emerald-400">85% Mastery</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Intelligence Analysis */}
        {activeTab === 'intelligence' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isParchment ? 'bg-amber-50 border-amber-200' : 'glass-card border-slate-800'
            }`}>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>Confidence Alignment</span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px]">Overconfident</span>
              </div>
              <p className={`text-xs leading-relaxed ${isParchment ? 'text-slate-700' : 'text-slate-300'}`}>
                Your confidence (82%) exceeds application accuracy (65%). Target statement-based eliminations to calibrate.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${
              isParchment ? 'bg-slate-50 border-slate-200' : 'glass-card border-slate-800'
            }`}>
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                <span>Primary Confusion Driver</span>
                <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[10px]">6 Errors</span>
              </div>
              <p className={`text-xs leading-relaxed ${isParchment ? 'text-slate-700' : 'text-slate-300'}`}>
                Confusing <em>Finance Commission</em> recommendations with statutory <em>GST Council</em> mandates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


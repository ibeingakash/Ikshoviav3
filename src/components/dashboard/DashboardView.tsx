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
  Zap,
  Activity,
  Award,
  ChevronRight,
  Bot,
  BarChart3,
  GitGraph,
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

  const [activeTab, setActiveTab] = useState<'revision' | 'syllabus' | 'intelligence'>('revision');

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
      
      {/* 1. Welcome Header Banner */}
      <div className="bg-white border border-[#0B1933]/10 p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-[#0B1933]/5 text-[#0B1933] border border-[#0B1933]/10 text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 text-[#D99A16]" />
            <span>Target Exam: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#0B1933] tracking-tight">
            Welcome back, {user?.name || 'Aspirant'}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed">
            Here's your personal learning intelligence summary for today.
          </p>
        </div>

        {/* HUD Quick Summary */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <div className="bg-[#FAF9F5] border border-slate-200 px-4 py-3 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Overall Mastery</div>
            <div className="text-2xl font-black text-[#0B1933] font-serif">{learnerModel?.overallScore || 72}%</div>
          </div>
          <div className="bg-[#FAF9F5] border border-slate-200 px-4 py-3 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Study Streak</div>
            <div className="text-2xl font-black text-[#D99A16] flex items-center justify-center gap-1 font-serif">
              <Flame className="w-5 h-5 fill-[#D99A16] text-[#D99A16]" />
              <span>{learnerModel?.currentStreak || 6}d</span>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Backdrop */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#D99A16]/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Four Primary Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Concept Mastery */}
        <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-2 hover:border-[#0B1933]/20 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Concept Mastery</span>
            <Award className="w-4 h-4 text-[#5B5CE2]" />
          </div>
          <div className="text-2xl font-black text-[#0B1933] font-serif">
            {learnerModel?.overallScore || 72}%
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4% this week (24 Mastery)</span>
          </div>
        </div>

        {/* Card 2: Retention Health */}
        <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-2 hover:border-[#0B1933]/20 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Retention Health</span>
            <RotateCcw className="w-4 h-4 text-[#D99A16]" />
          </div>
          <div className="text-2xl font-black text-[#0B1933] font-serif">
            78%
          </div>
          <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{learnerModel?.dueRevisionCount || 2} flashcards due revision</span>
          </div>
        </div>

        {/* Card 3: Practice Accuracy */}
        <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-2 hover:border-[#0B1933]/20 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Practice Accuracy</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1933] font-serif">
            74%
          </div>
          <div className="text-[11px] text-slate-600 font-medium">
            Calibration Index: High Confidence
          </div>
        </div>

        {/* Card 4: Next Best Action */}
        <div className="bg-[#0B1933] text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#E7A91A] text-xs font-bold">
            <span className="uppercase font-mono tracking-wider">Next Best Action</span>
            <Zap className="w-4 h-4 text-[#E7A91A]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">
              {nextBestAction?.title || 'Review Article 32 Writs'}
            </h4>
            <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
              {nextBestAction?.reason || 'Memory decay detected on Supreme Court writ jurisdiction'}
            </p>
          </div>
          <button
            onClick={handleLaunchNBA}
            className="w-full py-2 bg-[#E7A91A] hover:bg-amber-400 text-[#0B1933] font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Start Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 3. AI Learning Insight Bar */}
      <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#5B5CE2]/10 border border-[#5B5CE2]/20 flex items-center justify-center text-[#5B5CE2] shrink-0 mt-0.5">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0B1933] uppercase font-mono tracking-wider flex items-center gap-2">
              <span>AI Intelligence Insight</span>
              <span className="text-[10px] bg-indigo-50 text-[#5B5CE2] border border-indigo-200 px-2 py-0.5 rounded-md">
                Live Assessment
              </span>
            </div>
            <p className="text-xs text-slate-700 italic font-medium mt-1 leading-relaxed">
              "{aiInsight}"
            </p>
          </div>
        </div>

        <button
          onClick={() => askTutorWithContext('Explain my current mistake patterns and recommended study schedule.', { conceptId: 'c_art32', conceptTitle: 'Article 32 Writs' })}
          className="px-4 py-2 bg-[#FAF9F5] hover:bg-slate-100 text-[#0B1933] border border-[#0B1933]/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Bot className="w-4 h-4 text-[#5B5CE2]" />
          <span>Ask AI Tutor</span>
        </button>
      </div>

      {/* 4. Pillar Tabs: Revision Queue, Syllabus Topics, AI Mistake Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'revision'
                ? 'bg-[#0B1933] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D99A16]" />
            <span>Revision Queue ({learnerModel?.dueRevisionCount || 2})</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-[#0B1933] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#5B5CE2]" />
            <span>Knowledge Graph Topics</span>
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'intelligence'
                ? 'bg-[#0B1933] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>AI Diagnostic Taxonomy</span>
          </button>
        </div>

        {/* Tab 1: Revision Queue */}
        {activeTab === 'revision' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1933] font-serif">
                  Article 32 & Supreme Court Writs
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                  Retention: 65%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto writs.
              </p>
              <button
                onClick={() => {
                  setSelectedConceptId('c_art32');
                  setActiveSection('revision');
                }}
                className="w-full py-2 bg-[#0B1933] hover:bg-[#101C35] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Flash Revision</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E7A91A]" />
              </button>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1933] font-serif">
                  Fiscal Federalism & Devolution
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold">
                  Decay Risk High
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Article 280 Finance Commission horizontal & vertical tax sharing.
              </p>
              <button
                onClick={() => {
                  setSelectedConceptId('c_fiscal_fed');
                  setActiveSection('revision');
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Urgent Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge Graph Topics */}
        {activeTab === 'syllabus' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-white border border-[#0B1933]/10 p-4 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#0B1933]">Indian Polity (Fundamental Rights & Writs)</span>
                <span className="text-emerald-700 font-mono">88% Mastery</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-4 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#0B1933]">Indian Economy (Monetary Policy & Inflation)</span>
                <span className="text-amber-700 font-mono">64% Mastery</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#D99A16] h-full rounded-full" style={{ width: '64%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Diagnostic Taxonomy */}
        {activeTab === 'intelligence' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="text-xs font-bold text-[#D99A16] uppercase font-mono tracking-wider flex items-center justify-between">
                <span>Confidence Calibration</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">Overconfident</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Your confidence rating (82%) exceeds objective accuracy (65%). Practice elimination of statement distractors.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="text-xs font-bold text-rose-600 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>Primary Confusion Driver</span>
                <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded text-[10px] font-bold">6 Practice Errors</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Confusing <em>Finance Commission</em> constitutional recommendations with statutory <em>GST Council</em> mandates.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. "Continue Where You Left Off" Learning Modules */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold font-serif text-[#0B1933] flex items-center justify-between">
          <span>Continue Where You Left Off</span>
          <button
            onClick={() => setActiveSection('learn')}
            className="text-xs text-[#5B5CE2] hover:underline font-sans font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Subjects</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div
            onClick={() => {
              setSelectedConceptId('c_art32');
              setActiveSection('learn');
            }}
            className="bg-white border border-[#0B1933]/10 hover:border-[#0B1933]/30 p-5 rounded-2xl shadow-sm space-y-3 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-[#5B5CE2] border border-indigo-200 px-2 py-0.5 rounded">
                Polity
              </span>
              <span className="text-[11px] text-slate-500 font-medium">85% Complete</span>
            </div>
            <h4 className="text-sm font-bold text-[#0B1933] font-serif">Article 32 Writs Jurisdiction</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              Supreme Court original jurisdiction, Habeas Corpus, Mandamus, Quo-Warranto.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#5B5CE2] h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedConceptId('c_mpc');
              setActiveSection('learn');
            }}
            className="bg-white border border-[#0B1933]/10 hover:border-[#0B1933]/30 p-5 rounded-2xl shadow-sm space-y-3 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-[#D99A16] border border-amber-200 px-2 py-0.5 rounded">
                Economy
              </span>
              <span className="text-[11px] text-slate-500 font-medium">60% Complete</span>
            </div>
            <h4 className="text-sm font-bold text-[#0B1933] font-serif">Monetary Policy Committee</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              RBI Repo rate, Inflation targeting framework, Liquidity Adjustment Facility.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D99A16] h-full rounded-full" style={{ width: '60%' }} />
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedConceptId('c_nglv');
              setActiveSection('learn');
            }}
            className="bg-white border border-[#0B1933]/10 hover:border-[#0B1933]/30 p-5 rounded-2xl shadow-sm space-y-3 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                Science & Tech
              </span>
              <span className="text-[11px] text-slate-500 font-medium">40% Complete</span>
            </div>
            <h4 className="text-sm font-bold text-[#0B1933] font-serif">ISRO Next-Gen Launch Vehicle</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              Re-usable semi-cryogenic engines, LEO payload capacities, Bharatiya Antariksh Station.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-600 h-full rounded-full" style={{ width: '40%' }} />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

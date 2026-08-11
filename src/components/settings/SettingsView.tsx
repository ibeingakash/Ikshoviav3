import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Bot,
  Sliders,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Moon,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { refreshLearnerData } = useLearner();

  const [tutorMode, setTutorMode] = useState<'SOCRATIC' | 'DIRECT' | 'SUMMARY'>('SOCRATIC');
  const [dailyReminders, setDailyReminders] = useState(true);
  const [revisionAlerts, setRevisionAlerts] = useState(true);
  const [aiDigest, setAiDigest] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950/80 border border-indigo-800 rounded-xl text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings & Intelligence Tuning</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize how IKSHOVIA AI engine adaptively guides your study process.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* AI Tutor Persona & Pedagogical Mode */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>AI Tutor Pedagogical Style</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              onClick={() => setTutorMode('SOCRATIC')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SOCRATIC'
                  ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Socratic Coaching (Default)</span>
                {tutorMode === 'SOCRATIC' && <Sparkles className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Asks guiding questions, tests assumptions, and encourages deep conceptual reasoning before revealing answers.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('DIRECT')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'DIRECT'
                  ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Direct & Precise</span>
                {tutorMode === 'DIRECT' && <Sparkles className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Provides direct, structured explanations with article numbers, constitutional provisions, and bullet-point summaries.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('SUMMARY')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SUMMARY'
                  ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Exam High-Yield Focus</span>
                {tutorMode === 'SUMMARY' && <Sparkles className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Highlights common UPSC trap options, past-year question patterns, and key takeaways for quick revision.
              </p>
            </label>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Spaced Repetition & Study Reminders</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200">Daily Goal Reminders</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Receive gentle prompts if study target is incomplete</div>
              </div>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={e => setDailyReminders(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200">Spaced Repetition Queue Alerts</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Alert when concepts hit retention decay threshold</div>
              </div>
              <input
                type="checkbox"
                checked={revisionAlerts}
                onChange={e => setRevisionAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200">AI Daily Intelligence Summary</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Daily breakdown of confidence alignment and mistake patterns</div>
              </div>
              <input
                type="checkbox"
                checked={aiDigest}
                onChange={e => setAiDigest(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Account Info & Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Account Security & System Diagnostics</span>
          </h2>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Authenticated Account: {user?.name} ({user?.role})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {user?.email} • Target Exam: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Re-sync Learner Model & Engine State</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Force re-evaluation of mastery scores and revision queue</div>
            </div>
            <button
              type="button"
              onClick={refreshLearnerData}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-sync</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

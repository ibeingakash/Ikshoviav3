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
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#35156B]" />
            <span>Platform Settings & Intelligence Tuning</span>
          </h1>
          <p className="text-stone-500 text-xs mt-0.5 font-medium">
            Customize how IKSHOVIA AI engine adaptively guides your study process.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Platform preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* AI Tutor Persona & Pedagogical Mode */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#35156B]" />
            <span>AI Tutor Pedagogical Style</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              onClick={() => setTutorMode('SOCRATIC')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SOCRATIC'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-[#111426]">Socratic Coaching</span>
                {tutorMode === 'SOCRATIC' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Asks guiding questions, tests assumptions, and encourages deep conceptual reasoning before revealing answers.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('DIRECT')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'DIRECT'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-[#111426]">Direct & Precise</span>
                {tutorMode === 'DIRECT' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Provides direct, structured explanations with article numbers, constitutional provisions, and bullet-point summaries.
              </p>
            </label>

            <label
              onClick={() => setTutorMode('SUMMARY')}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                tutorMode === 'SUMMARY'
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-stone-50 border-stone-200/90 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif-editorial font-bold text-[#111426]">Exam High-Yield Focus</span>
                {tutorMode === 'SUMMARY' && <Sparkles className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Highlights common UPSC trap options, past-year question patterns, and key takeaways for quick revision.
              </p>
            </label>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#35156B]" />
            <span>Spaced Repetition & Study Reminders</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-[#111426]">Daily Goal Reminders</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Receive gentle prompts if daily study target is incomplete</div>
              </div>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={e => setDailyReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#35156B] accent-[#35156B] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-[#111426]">Spaced Repetition Queue Alerts</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Alert when concepts hit retention decay threshold</div>
              </div>
              <input
                type="checkbox"
                checked={revisionAlerts}
                onChange={e => setRevisionAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#35156B] accent-[#35156B] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/90">
              <div>
                <div className="font-bold text-[#111426]">AI Daily Intelligence Summary</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Daily breakdown of confidence alignment and mistake patterns</div>
              </div>
              <input
                type="checkbox"
                checked={aiDigest}
                onChange={e => setAiDigest(e.target.checked)}
                className="w-4 h-4 rounded text-[#35156B] accent-[#35156B] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Account Info & Diagnostics */}
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#35156B]" />
            <span>Account Security & System Diagnostics</span>
          </h2>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#111426] flex items-center gap-2">
                <span>Authenticated Account: {user?.name}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-purple-50 text-[#35156B] border-purple-200 font-mono">
                  {user?.role || 'STUDENT'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono mt-1">
                {user?.email} • Target Exam: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#111426]">Re-sync Learner Model & Engine State</div>
              <div className="text-[11px] text-stone-500 mt-0.5">Force re-evaluation of mastery scores and revision queue</div>
            </div>
            <button
              type="button"
              onClick={refreshLearnerData}
              className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#35156B]" />
              <span>Re-sync</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold text-xs rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer transition-all"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

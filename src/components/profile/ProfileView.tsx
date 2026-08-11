import React, { useState } from 'react';
import {
  User,
  Mail,
  Award,
  Flame,
  Calendar,
  BookOpen,
  Target,
  Edit3,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

export const ProfileView: React.FC = () => {
  const { user, saveOnboarding } = useAuth();
  const { learnerModel, setActiveSection } = useLearner();

  const [isEditing, setIsEditing] = useState(false);
  const [targetExam, setTargetExam] = useState(user?.onboarding?.targetExam || 'UPSC CSE 2026');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.onboarding?.dailyGoalMinutes || 120);
  const [experienceLevel, setExperienceLevel] = useState(user?.onboarding?.experienceLevel || 'Intermediate');
  const [goalStatement, setGoalStatement] = useState(user?.onboarding?.goalStatement || 'Dedicated preparation for Civil Services Examination');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOnboarding({
      targetExam,
      dailyGoalMinutes: Number(dailyGoalMinutes),
      experienceLevel,
      goalStatement,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const badges = [
    { title: '7-Day Streak Master', desc: 'Maintained consistent learning for 7 days', icon: Flame, color: 'text-amber-400 bg-amber-950/60 border-amber-800' },
    { title: 'Constitutional Scholar', desc: 'Achieved >80% mastery in Indian Polity', icon: Award, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800' },
    { title: 'Spaced Repetition Pro', desc: 'Completed 20+ spaced revision items', icon: Zap, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
    { title: 'Diagnostic Veteran', desc: 'Attempted 50+ adaptive MCQ practice questions', icon: Target, color: 'text-blue-400 bg-blue-950/60 border-blue-800' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-indigo-300 font-extrabold text-2xl">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                user?.role === 'ADMIN' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
            </div>
            <div className="text-xs text-indigo-400 font-medium mt-1">
              Target: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Target & Goals'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile and goal settings updated successfully!</span>
        </div>
      )}

      {/* Edit Form Modal/Drawer */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl shadow-xl space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Update Personal Target Settings</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Examination</label>
              <input
                type="text"
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. UPSC CSE 2026, State PSC"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Study Target (Minutes)</label>
              <input
                type="number"
                value={dailyGoalMinutes}
                onChange={e => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                min={30}
                max={720}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preparation Stage</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner (First Attempt)</option>
                <option value="Intermediate">Intermediate (Syllabus Covered Once)</option>
                <option value="Advanced">Advanced (Multiple Mains/Interview)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Statement</label>
              <input
                type="text"
                value={goalStatement}
                onChange={e => setGoalStatement(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="Your motivation or focus target"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-400">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{learnerModel?.currentStreak || 6} Days</div>
            <div className="text-[11px] text-slate-400 font-medium">Daily Learning Streak</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 rounded-xl text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{learnerModel?.overallScore || 70}%</div>
            <div className="text-[11px] text-slate-400 font-medium">Overall Concept Mastery</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{user?.onboarding?.dailyGoalMinutes || 120} m/day</div>
            <div className="text-[11px] text-slate-400 font-medium">Target Daily Study Time</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-blue-950/80 border border-blue-800/80 rounded-xl text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{learnerModel?.dueRevisionCount || 2} Items</div>
            <div className="text-[11px] text-slate-400 font-medium">Due in Revision Queue</div>
          </div>
        </div>
      </div>

      {/* Badges and Achievements */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Learner Achievements & Badges</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className={`p-4 rounded-xl border ${b.color} space-y-2`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold text-white">{b.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

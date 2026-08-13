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
    { title: '7-Day Streak Master', desc: 'Maintained consistent learning for 7 days', icon: Flame, color: 'text-amber-800 bg-amber-50 border-amber-200' },
    { title: 'Constitutional Scholar', desc: 'Achieved >80% mastery in Indian Polity', icon: Award, color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
    { title: 'Spaced Repetition Pro', desc: 'Completed 20+ spaced revision items', icon: Zap, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    { title: 'Diagnostic Veteran', desc: 'Attempted 50+ adaptive MCQ practice questions', icon: Target, color: 'text-blue-800 bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0 max-w-full">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-2xs shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-[#111827] truncate">{user?.name || 'IKSHOVIA User'}</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                user?.role === 'ADMIN' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {user?.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1 min-w-0">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="text-xs text-indigo-600 font-bold mt-1 truncate">
              Target: {user?.onboarding?.targetExam || 'UPSC CSE 2026'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-slate-500" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Target & Goals'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile and goal settings updated successfully!</span>
        </div>
      )}

      {/* Edit Form Modal/Drawer */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white border border-indigo-200 p-6 rounded-2xl shadow-2xs space-y-4 animate-fade-in">
          <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Update Personal Target Settings</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Examination</label>
              <input
                type="text"
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. UPSC CSE 2026, State PSC"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Study Target (Minutes)</label>
              <input
                type="number"
                value={dailyGoalMinutes}
                onChange={e => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                min={30}
                max={720}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preparation Stage</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner (First Attempt)</option>
                <option value="Intermediate">Intermediate (Syllabus Covered Once)</option>
                <option value="Advanced">Advanced (Multiple Mains/Interview)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Goal Statement</label>
              <input
                type="text"
                value={goalStatement}
                onChange={e => setGoalStatement(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                placeholder="Your motivation or focus target"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <div className="text-xl font-black text-[#111827]">{learnerModel?.currentStreak || 6} Days</div>
            <div className="text-[11px] text-slate-500 font-medium">Daily Learning Streak</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#111827]">{learnerModel?.overallScore || 70}%</div>
            <div className="text-[11px] text-slate-500 font-medium">Overall Concept Mastery</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#111827]">{user?.onboarding?.dailyGoalMinutes || 120} m/day</div>
            <div className="text-[11px] text-slate-500 font-medium">Target Daily Study Time</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#111827]">{learnerModel?.dueRevisionCount || 2} Items</div>
            <div className="text-[11px] text-slate-500 font-medium">Due in Revision Queue</div>
          </div>
        </div>
      </div>

      {/* Badges and Achievements */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Learner Achievements & Badges</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className={`p-4 rounded-xl border ${b.color} space-y-2`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold">{b.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

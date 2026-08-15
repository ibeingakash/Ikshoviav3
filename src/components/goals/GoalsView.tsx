import React, { useState, useEffect } from 'react';
import { Flag, Plus, Calendar, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { StudyGoal } from '../../types/index.js';

export const GoalsView: React.FC = () => {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [targetExam, setTargetExam] = useState('UPSC CSE 2026');
  const [targetDate, setTargetDate] = useState('2026-05-24');
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGoals().then(list => {
      setGoals(Array.isArray(list) ? list : []);
      setLoading(false);
    }).catch(() => {
      setGoals([]);
      setLoading(false);
    });
  }, []);

  const handleCreateGoal = async () => {
    if (!title.trim()) return;
    try {
      const newG = await api.createGoal({
        title,
        targetExam,
        targetDate,
        dailyStudyMinutes: dailyMinutes,
        subjects: ['sub_polity', 'sub_economy'],
      });
      if (newG && newG.id) {
        setGoals(prev => [...(Array.isArray(prev) ? prev : []), newG]);
      }
      setTitle('');
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Flag className="w-6 h-6 text-[#35156B]" />
            <span>Study Goals & Schedule Planner</span>
          </h1>
          <p className="text-stone-600 text-xs mt-0.5 font-medium">
            Set target milestones, daily study time allocations, and track target exam deadlines.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(prev => !prev)}
          className="px-4 py-2 bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start cursor-pointer transition-all border border-amber-500/30 hover:border-amber-400"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Set New Goal</span>
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-2xs animate-fade-in">
          <h2 className="text-sm font-bold text-[#111426] font-serif-editorial">Create Milestone Goal</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Goal Title (e.g., Master Fundamental Rights)"
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#35156B]"
            />

            <input
              type="text"
              value={targetExam}
              onChange={e => setTargetExam(e.target.value)}
              placeholder="Target Exam (e.g. UPSC CSE 2026)"
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B]"
            />

            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B]"
            />

            <input
              type="number"
              value={dailyMinutes}
              onChange={e => setDailyMinutes(Number(e.target.value))}
              placeholder="Daily Minutes (e.g. 120)"
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateGoal}
              className="px-5 py-2 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 text-xs font-bold rounded-xl shadow-2xs cursor-pointer border border-amber-500/30"
            >
              Save Goal
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-[#35156B]" />
          Loading study goals...
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="bg-white border border-stone-200 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
          <Flag className="w-8 h-8 text-[#35156B] mx-auto opacity-70" />
          <h2 className="text-base font-serif-editorial font-bold text-[#111426]">No Active Goals Yet</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Set your target milestones, study hours, or topic completion goals to keep your exam preparation on track.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer border border-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Create First Goal</span>
          </button>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map(g => (
            <div
              key={g.id}
              className="bg-white border border-stone-200 hover:border-amber-400/80 p-5 rounded-2xl space-y-4 shadow-2xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-purple-50 text-[#35156B] border border-purple-200 px-2.5 py-0.5 rounded-full font-mono">
                    {g.targetExam}
                  </span>
                  <h2 className="text-base font-bold text-[#111426] font-serif-editorial mt-1">{g.title}</h2>
                </div>

                <div className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  {g.progressPercentage}% Completed
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-500 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Target: {g.targetDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Daily Target: {g.dailyStudyMinutes} mins</span>
                </div>
              </div>

              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#35156B] h-full rounded-full" style={{ width: `${g.progressPercentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

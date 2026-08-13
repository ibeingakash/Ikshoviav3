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
      setGoals(list);
      setLoading(false);
    });
  }, []);

  const handleCreateGoal = async () => {
    if (!title.trim()) return;
    const newG = await api.createGoal({
      title,
      targetExam,
      targetDate,
      dailyStudyMinutes: dailyMinutes,
      subjects: ['sub_polity', 'sub_economy'],
    });
    setGoals(prev => [...prev, newG]);
    setTitle('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            <Flag className="w-6 h-6 text-indigo-600" />
            <span>Study Goals & Schedule Planner</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Set target milestones, daily study time allocations, and track target exam deadlines.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(prev => !prev)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 self-start cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-indigo-200 p-5 rounded-2xl space-y-4 shadow-2xs animate-fade-in">
          <h2 className="text-sm font-bold text-[#111827]">Create Milestone Goal</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Goal Title (e.g., Master Fundamental Rights)"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="text"
              value={targetExam}
              onChange={e => setTargetExam(e.target.value)}
              placeholder="Target Exam (e.g. UPSC CSE 2026)"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="number"
              value={dailyMinutes}
              onChange={e => setDailyMinutes(Number(e.target.value))}
              placeholder="Daily Minutes (e.g. 120)"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleCreateGoal}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
          >
            Save Goal
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
          Loading study goals...
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {goals.map(g => (
            <div
              key={g.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                    {g.targetExam}
                  </span>
                  <h2 className="text-base font-bold text-[#111827] mt-1">{g.title}</h2>
                </div>

                <div className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  {g.progressPercentage}% Completed
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: {g.targetDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Daily Target: {g.dailyStudyMinutes} mins</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${g.progressPercentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

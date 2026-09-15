import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square, Users, Flame, ArrowRight } from 'lucide-react';
import { yptService } from '../../services/yptService.js';
import { YptTodaySummary } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

export const YptHomeWidget: React.FC = () => {
  const { setActiveSection } = useLearner();
  const [summary, setSummary] = useState<YptTodaySummary | null>(null);
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (isStudying) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStudying]);

  const loadSummary = async () => {
    try {
      const data = await yptService.getTodaySummary();
      setSummary(data);
      setTimerSeconds(data.todaySeconds || 0);
      if (data.activeStudying) {
        setIsStudying(true);
      }
    } catch (err) {
      // Quiet fail on widget
    }
  };

  const handleStartTimer = async () => {
    try {
      const res = await yptService.startSession('gs_general', 'GS Preparation');
      setActiveSessionId(res.session.id);
      setIsStudying(true);
    } catch (err) {
      console.warn('Start timer error', err);
    }
  };

  const handleStopTimer = async () => {
    try {
      if (activeSessionId) {
        await yptService.stopSession(activeSessionId);
      }
      setIsStudying(false);
      setActiveSessionId(null);
      loadSummary();
    } catch (err) {
      console.warn('Stop timer error', err);
    }
  };

  const formatHMS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-5 bg-[#0F1424] border border-stone-800 hover:border-amber-500/40 rounded-2xl transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">YPT Study Focus & Groups</h3>
            <p className="text-[11px] text-stone-400">Live Peer Accountability Engine</p>
          </div>
        </div>

        <button
          onClick={() => setActiveSection('ypt')}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
        >
          <span>Open Full YPT</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#070A13] border border-stone-800/80 rounded-xl">
        <div>
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Total Focus Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">
            {formatHMS(timerSeconds)}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {summary?.goalProgressPercent || 0}% of daily target achieved
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isStudying ? (
            <button
              onClick={handleStartTimer}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Timer</span>
            </button>
          ) : (
            <button
              onClick={handleStopTimer}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Timer</span>
            </button>
          )}

          <button
            onClick={() => setActiveSection('ypt')}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Groups ({summary?.activeGroupsCount || 0})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

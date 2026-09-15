import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Square,
  Users,
  Trophy,
  Flame,
  Plus,
  Search,
  Lock,
  Globe,
  Trash2,
  LogOut,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { yptService } from '../../services/yptService.js';
import { YptGroup, YptMember, YptTodaySummary } from '../../types/index.js';

const SUBJECT_OPTIONS = [
  { id: 'polity', name: 'Indian Polity & Governance' },
  { id: 'history', name: 'History & Indian National Movement' },
  { id: 'geography', name: 'Geography & Environment' },
  { id: 'economy', name: 'Indian Economy & Development' },
  { id: 'science', name: 'Science & Technology' },
  { id: 'current_affairs', name: 'Current Affairs & Editorials' },
  { id: 'ethics', name: 'Ethics, Integrity & Aptitude (GS-4)' },
  { id: 'optional', name: 'Optional Subject Focus' },
  { id: 'csat', name: 'CSAT & Quantitative Aptitude' },
  { id: 'general', name: 'General Revision & Answer Writing' },
];

export const YptView: React.FC = () => {
  const { user } = useAuth();

  // Summary & active timer
  const [summary, setSummary] = useState<YptTodaySummary | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECT_OPTIONS[0].name);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Group explorer tabs & state
  const [tab, setTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [groups, setGroups] = useState<YptGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<YptGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<YptMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & UI alerts
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState<YptGroup | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState<'UPSC' | 'BPSC' | 'ALL'>('UPSC');
  const [createDailyGoal, setCreateDailyGoal] = useState<number>(360); // 6 hours
  const [createMaxMembers, setCreateMaxMembers] = useState<number>(50);
  const [createIsPrivate, setCreateIsPrivate] = useState(false);
  const [createAccessCode, setCreateAccessCode] = useState('');

  // Ticking timer ref
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadTodayData();
    loadGroups();
  }, [tab, categoryFilter]);

  // Handle local ticking clock
  useEffect(() => {
    if (isStudying) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isStudying]);

  const loadTodayData = async () => {
    try {
      const data = await yptService.getTodaySummary();
      setSummary(data);
      if (data.activeStudying) {
        setIsStudying(true);
        if (data.currentSubject) setSelectedSubject(data.currentSubject);
      }
      setTimerSeconds(data.todaySeconds || 0);
    } catch (err) {
      console.warn('[YPT] failed to load summary', err);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await yptService.getGroups({
        search: searchQuery || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        myGroups: tab === 'my-groups',
      });
      setGroups(res.groups || []);
    } catch (err) {
      console.error('[YPT] failed to load groups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      setActionError(null);
      const res = await yptService.startSession(
        selectedSubject.toLowerCase().replace(/\s+/g, '_'),
        selectedSubject
      );
      setActiveSessionId(res.session.id);
      setIsStudying(true);
      setActionSuccess(`Started study session: ${selectedSubject}`);
      loadTodayData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to start study timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      setActionError(null);
      if (activeSessionId) {
        await yptService.stopSession(activeSessionId);
      }
      setIsStudying(false);
      setActiveSessionId(null);
      setActionSuccess('Study session saved successfully!');
      loadTodayData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to stop session');
    }
  };

  const handleSelectGroup = async (group: YptGroup) => {
    setSelectedGroup(group);
    try {
      const res = await yptService.getGroupDetails(group.id);
      setGroupMembers(res.members || []);
    } catch (err) {
      console.error('[YPT] load group details error', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      setActionError(null);
      await yptService.createGroup({
        name: createName.trim(),
        description: createDesc.trim(),
        category: createCategory,
        targetDailyMinutes: Number(createDailyGoal),
        maxMembers: Number(createMaxMembers),
        isPrivate: createIsPrivate,
        accessCode: createIsPrivate ? createAccessCode.trim() : undefined,
      });
      setShowCreateModal(false);
      setCreateName('');
      setCreateDesc('');
      setCreateAccessCode('');
      setActionSuccess('Group created successfully!');
      setTab('my-groups');
      loadGroups();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (group: YptGroup) => {
    if (group.inviteCode && group.inviteCode !== 'PUBLIC') {
      setShowJoinCodeModal(group);
      return;
    }
    try {
      setActionError(null);
      await yptService.joinGroup(group.id);
      setActionSuccess(`Joined ${group.name}!`);
      loadGroups();
    } catch (err: any) {
      setActionError(err.message || 'Failed to join group');
    }
  };

  const handleConfirmJoinCode = async () => {
    if (!showJoinCodeModal) return;
    try {
      setActionError(null);
      await yptService.joinGroup(showJoinCodeModal.id, joinCodeInput.trim());
      setActionSuccess(`Joined ${showJoinCodeModal.name}!`);
      setShowJoinCodeModal(null);
      setJoinCodeInput('');
      loadGroups();
    } catch (err: any) {
      setActionError(err.message || 'Incorrect access code');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      await yptService.leaveGroup(groupId);
      setSelectedGroup(null);
      setActionSuccess('Left group successfully.');
      loadGroups();
    } catch (err: any) {
      setActionError(err.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Permanently delete this study group? All member progress in this group will be detached.')) return;
    try {
      await yptService.deleteGroup(groupId);
      setSelectedGroup(null);
      setActionSuccess('Group deleted permanently.');
      loadGroups();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete group');
    }
  };

  const formatHMS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-stone-100 p-4 sm:p-8 space-y-8">
      {/* 1. HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>IKSHOVIA Focus Engine (YPT Style)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Daily Study Tracker & Peer Groups
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            Track your exact productive hours, join competitive UPSC & BPSC peer study circles, and stay accountable with live presence indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Group</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="max-w-7xl mx-auto p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="max-w-7xl mx-auto p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. REAL-TIME FOCUS TIMER HERO STRIP */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-[#0F1424] border border-stone-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Today's Total Focus Time</span>
              </div>
              <div className="text-4xl sm:text-6xl font-mono font-black text-white mt-3 tracking-tight">
                {formatHMS(timerSeconds)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isStudying ? (
                <button
                  onClick={handleStartTimer}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus Session</span>
                </button>
              ) : (
                <button
                  onClick={handleStopTimer}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop & Save Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Subject Selector & Status */}
          <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">Current Subject:</span>
              <select
                disabled={isStudying}
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="bg-[#070A13] border border-stone-700 text-amber-300 text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-amber-500"
              >
                {SUBJECT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className={`w-2.5 h-2.5 rounded-full ${isStudying ? 'bg-emerald-400 animate-ping' : 'bg-stone-600'}`} />
              <span>{isStudying ? 'Focus Mode Active — Logging to Group Feed' : 'Timer Paused / Ready'}</span>
            </div>
          </div>
        </div>

        {/* Daily Goal & Accountability Card */}
        <div className="p-6 bg-[#0F1424] border border-stone-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Daily Target</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {summary ? `${Math.round(summary.todayMinutes / 60 * 10) / 10}h / ${Math.round(summary.dailyGoalMinutes / 60)}h` : '0h / 8h'}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-stone-800 rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className="bg-linear-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary?.goalProgressPercent || 0)}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex justify-between">
              <span>{summary?.goalProgressPercent || 0}% completed</span>
              <span>{summary?.sessionsCount || 0} sessions today</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-800">
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Joined Groups: <strong className="text-white">{summary?.activeGroupsCount || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GROUP EXPLORER & DETAIL VIEW */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-[#0F1424] border border-stone-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => { setTab('my-groups'); setSelectedGroup(null); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'my-groups'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              My Study Groups
            </button>
            <button
              onClick={() => { setTab('discover'); setSelectedGroup(null); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'discover'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Discover Groups
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Exam category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-[#0F1424] border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2"
            >
              <option value="ALL">All Categories</option>
              <option value="UPSC">UPSC CSE</option>
              <option value="BPSC">BPSC 71st</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadGroups(); }}
                className="w-full pl-9 pr-3 py-2 bg-[#0F1424] border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Content Area: Split View if a group is selected, otherwise grid */}
        {selectedGroup ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Group Detail & Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-[#0F1424] border border-stone-800 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="text-xs text-amber-400 hover:underline mb-2 block"
                    >
                      ← Back to all groups
                    </button>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {selectedGroup.name}
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {selectedGroup.exam}
                      </span>
                    </h2>
                    <p className="text-xs text-stone-400 mt-1">{selectedGroup.description || 'Dedicated study group for consistent daily hours.'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedGroup.userRole === 'CREATOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
                      <button
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : selectedGroup.userRole ? (
                      <button
                        onClick={() => handleLeaveGroup(selectedGroup.id)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Group Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-800">
                  <div className="p-3 bg-[#070A13] rounded-xl">
                    <div className="text-[11px] text-stone-500">Members</div>
                    <div className="text-lg font-bold text-white">{selectedGroup.memberCount}</div>
                  </div>
                  <div className="p-3 bg-[#070A13] rounded-xl">
                    <div className="text-[11px] text-stone-500">Studying Now</div>
                    <div className="text-lg font-bold text-emerald-400">{selectedGroup.activeStudyingCount} 🟢</div>
                  </div>
                  <div className="p-3 bg-[#070A13] rounded-xl">
                    <div className="text-[11px] text-stone-500">Daily Target</div>
                    <div className="text-lg font-bold text-amber-400">{Math.round((selectedGroup.dailyGoalMinutes || 360) / 60)}h</div>
                  </div>
                </div>
              </div>

              {/* Live Leaderboard Table */}
              <div className="p-6 bg-[#0F1424] border border-stone-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Today's Study Leaderboard</span>
                  </h3>
                  <span className="text-[11px] text-stone-500">Updated in real-time</span>
                </div>

                <div className="divide-y divide-stone-800">
                  {groupMembers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-stone-500">No members in this group yet.</div>
                  ) : (
                    groupMembers.map((member, idx) => (
                      <div key={member.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-500 text-stone-950' :
                            idx === 1 ? 'bg-stone-300 text-stone-950' :
                            idx === 2 ? 'bg-amber-800 text-white' : 'text-stone-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-2">
                              <span>{member.userName}</span>
                              {member.isActiveStudying && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Studying {member.currentSubject || 'GS'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {member.role === 'CREATOR' ? '👑 Leader' : member.role === 'ADMIN' ? '🛡️ Admin' : 'Scholar'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {formatHMS(member.todaySeconds || 0)}
                          </div>
                          <div className="text-[10px] text-stone-500">Total Today</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="p-6 bg-[#0F1424] border border-stone-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Group Guidelines</h4>
                <ul className="text-xs text-stone-400 space-y-2">
                  <li>• Maintain consistent daily study hours to stay in top percentiles.</li>
                  <li>• Use the focus timer whenever you sit for dedicated preparation.</li>
                  <li>• Zero tolerance for fake timer farming or non-academic spam.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Group Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-16 text-xs text-stone-500">
                Loading study groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#0F1424] border border-stone-800 rounded-2xl space-y-3">
                <Users className="w-8 h-8 text-stone-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Study Groups Found</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  {tab === 'my-groups'
                    ? "You haven't joined any study groups yet. Discover an existing circle or create your own!"
                    : 'No groups match your filter criteria.'}
                </p>
                {tab === 'my-groups' && (
                  <button
                    onClick={() => setTab('discover')}
                    className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
                  >
                    Discover Groups
                  </button>
                )}
              </div>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  className="p-5 bg-[#0F1424] border border-stone-800 hover:border-amber-500/40 rounded-2xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {group.exam}
                      </span>
                      {group.inviteCode && group.inviteCode !== 'PUBLIC' ? (
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-stone-500" /> Private
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-stone-500" /> Open
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1">{group.name}</h3>
                    <p className="text-xs text-stone-400 line-clamp-2">{group.description || 'Targeted peer group for rigorous exam preparation.'}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <div className="text-xs text-stone-400">
                      <span className="font-semibold text-white">{group.memberCount}</span> scholars
                      {group.activeStudyingCount > 0 && (
                        <span className="text-emerald-400 ml-2">({group.activeStudyingCount} 🟢)</span>
                      )}
                    </div>

                    {group.userRole ? (
                      <button
                        onClick={() => handleSelectGroup(group)}
                        className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="px-3.5 py-1.5 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-semibold rounded-lg transition-all"
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL: CREATE STUDY GROUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F1424] border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Study Group</h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs text-stone-300 block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., UPSC CSE 2026 10-Hour Grinders"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="w-full bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals, daily targets, and rules..."
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  className="w-full bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Category</label>
                  <select
                    value={createCategory}
                    onChange={e => setCreateCategory(e.target.value as any)}
                    className="w-full bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="UPSC">UPSC</option>
                    <option value="BPSC">BPSC</option>
                    <option value="ALL">Combined / General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-300 block mb-1">Target Hours / Day</label>
                  <input
                    type="number"
                    min={1}
                    max={18}
                    value={Math.round(createDailyGoal / 60)}
                    onChange={e => setCreateDailyGoal(Number(e.target.value) * 60)}
                    className="w-full bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsPrivate}
                    onChange={e => setCreateIsPrivate(e.target.checked)}
                    className="rounded-sm border-stone-700 text-amber-500"
                  />
                  <span>Require Access Code (Private Group)</span>
                </label>
                {createIsPrivate && (
                  <input
                    type="text"
                    required
                    placeholder="Enter access code for your friends"
                    value={createAccessCode}
                    onChange={e => setCreateAccessCode(e.target.value)}
                    className="w-full mt-2 bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: JOIN PRIVATE GROUP */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F1424] border border-stone-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Private Group Access Code</h3>
            <p className="text-xs text-stone-400">
              "{showJoinCodeModal.name}" requires an invite/access code to join.
            </p>

            <input
              type="text"
              placeholder="Enter access code"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value)}
              className="w-full bg-[#070A13] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
            />

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowJoinCodeModal(null); setJoinCodeInput(''); }}
                className="px-3 py-1.5 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmJoinCode}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

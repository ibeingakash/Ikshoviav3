import React, { useState } from 'react';
import {
  Users,
  Video,
  Plus,
  KeyRound,
  Sparkles,
  Copy,
  Check,
  X,
  ArrowRight,
  Shield,
  Radio,
  Share2
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService.js';
import { LiveClass } from '../../types/liveClass.js';
import { useAuth } from '../../context/AuthContext.js';

interface GroupCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterMeeting: (liveClass: LiveClass) => void;
}

export const GroupCallModal: React.FC<GroupCallModalProps> = ({
  isOpen,
  onClose,
  onEnterMeeting,
}) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'JOIN' | 'CREATE'>('JOIN');

  // Join State
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create State
  const [title, setTitle] = useState(`${user?.name || 'Scholar'}'s Group Study Room`);
  const [topic, setTopic] = useState('General Discussion & Doubts');
  const [exam, setExam] = useState<'ALL' | 'UPSC' | 'BPSC'>('ALL');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoinByMeetingId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingIdInput.trim()) {
      setJoinError('Please enter a valid Meeting ID or Room Code.');
      return;
    }

    try {
      setJoining(true);
      setJoinError(null);
      const meeting = await liveClassService.getMeetingById(meetingIdInput.trim());
      onEnterMeeting(meeting);
      onClose();
    } catch (err: any) {
      setJoinError(err.message || 'Unable to join meeting. Please verify the code.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateGroupCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      const created = await liveClassService.createGroupCall({
        title: title.trim() || `${user?.name || 'Scholar'}'s Study Room`,
        topic: topic.trim(),
        exam,
        maxParticipants: Number(maxParticipants) || 25,
      });
      onEnterMeeting(created);
      onClose();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to start group call. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0B0F1C] border border-stone-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-[#0F1424]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Real-Time Group Call</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  ENCRYPTED
                </span>
              </h2>
              <p className="text-xs text-stone-400">Join a peer study room or host a live collaborative call</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-[#070A13] border-b border-stone-800 text-xs font-bold">
          <button
            onClick={() => { setTab('JOIN'); setJoinError(null); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === 'JOIN'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Join with Meeting ID</span>
          </button>
          <button
            onClick={() => { setTab('CREATE'); setCreateError(null); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === 'CREATE'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Host New Group Call</span>
          </button>
        </div>

        {/* Tab Content: JOIN */}
        {tab === 'JOIN' && (
          <form onSubmit={handleJoinByMeetingId} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300">
                Enter Meeting ID or Room Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. IK-GRP-8F21 or IK-UPSC-4A92"
                  value={meetingIdInput}
                  onChange={e => setMeetingIdInput(e.target.value.toUpperCase())}
                  className="w-full bg-[#070A13] border border-stone-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-stone-600 focus:outline-none transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Ask the host for their IKSHOVIA Meeting ID or paste the link code.
              </p>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {joinError}
              </div>
            )}

            <div className="p-3.5 bg-[#0F1424] border border-stone-800 rounded-xl text-xs text-stone-400 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Meetings support real-time audio, video, multi-user screen sharing, live chat, and student doubt raise-hands.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={joining || !meetingIdInput.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                <span>{joining ? 'Connecting...' : 'Join Group Call'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: CREATE */}
        {tab === 'CREATE' && (
          <form onSubmit={handleCreateGroupCall} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">Group Room Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Modern Indian History Group Review"
                className="w-full bg-[#070A13] border border-stone-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Exam Target</label>
                <select
                  value={exam}
                  onChange={e => setExam(e.target.value as any)}
                  className="w-full bg-[#070A13] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Civil Services</option>
                  <option value="UPSC">UPSC CSE</option>
                  <option value="BPSC">BPSC 71st CCE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Max Participants</label>
                <select
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(Number(e.target.value))}
                  className="w-full bg-[#070A13] border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value={10}>10 Scholars (Intimate)</option>
                  <option value={25}>25 Scholars (Standard)</option>
                  <option value={50}>50 Scholars (Large Group)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">Topic / Agenda</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Answer Writing Peer Evaluation & Doubts"
                className="w-full bg-[#070A13] border border-stone-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none"
              />
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {createError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>{creating ? 'Starting Room...' : 'Start Group Call Now'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Users,
  Lock,
  MessageSquare,
  HelpCircle,
  Mic,
  Shield,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { LiveClass } from '../../types/liveClass.js';
import { liveClassService } from '../../services/liveClassService.js';
import { useAuth } from '../../context/AuthContext.js';

interface CreateLiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: LiveClass) => void;
}

const UPSC_BPSC_SUBJECTS = [
  'GS-1: Modern Indian History & Art & Culture',
  'GS-1: Indian & World Geography',
  'GS-2: Indian Polity & Constitution',
  'GS-2: Governance & Social Justice',
  'GS-2: International Relations',
  'GS-3: Indian Economy & Agriculture',
  'GS-3: Science & Tech, Environment',
  'GS-3: Internal Security & Disaster Mgmt',
  'GS-4: Ethics, Integrity & Aptitude',
  'CSAT: Quantitative Aptitude & Reasoning',
  'CSAT: Reading Comprehension',
  'BPSC Special: Bihar History & Geography',
  'BPSC Special: Bihar Economy & Schemes',
  'Mains Answer Writing & Evaluation Workshop',
  'Weekly Current Affairs & Editorial Analysis',
];

export const CreateLiveClassModal: React.FC<CreateLiveClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exam, setExam] = useState<'UPSC' | 'BPSC' | 'BOTH'>('UPSC');
  const [subject, setSubject] = useState(UPSC_BPSC_SUBJECTS[2]);

  // Default scheduled time: next hour
  const getNextHourIso = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getNextHourIso());
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxParticipants, setMaxParticipants] = useState<number>(200);

  // Classroom permissions & settings
  const [allowStudentMic, setAllowStudentMic] = useState(false);
  const [allowStudentCamera, setAllowStudentCamera] = useState(false);
  const [enableChat, setEnableChat] = useState(true);
  const [enableQA, setEnableQA] = useState(true);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a class title');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const created = await liveClassService.createClass({
        title: title.trim(),
        description: description.trim(),
        exam,
        subject,
        teacherId: user?.id,
        teacherName: user?.name || 'Faculty Member',
        teacherAvatar: user?.avatarUrl,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        allowStudentMic,
        allowStudentCamera,
        enableChat,
        enableQA,
        waitingRoomEnabled,
        isLocked,
        status: 'SCHEDULED',
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('[CreateClass Error]', err);
      setError(err.message || 'Failed to schedule live class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0F1424] border border-stone-800 text-stone-100 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800 bg-[#141A2E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Schedule Live Classroom</h3>
              <p className="text-xs text-stone-400">Set up a real-time lecture, mentorship or doubt solving session</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              Session Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GS-2 Polity: Federal Structure & Supreme Court Doctrines"
              className="w-full px-4 py-2.5 bg-stone-900/90 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Subject & Exam Tag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                Target Exam
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPSC', 'BPSC', 'BOTH'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setExam(tag)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      exam === tag
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-xs'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {tag === 'BOTH' ? 'UPSC & BPSC' : tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                Subject Focus
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-900/90 border border-stone-700/80 rounded-xl text-stone-100 text-xs focus:outline-hidden focus:border-amber-500"
              >
                {UPSC_BPSC_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub} className="bg-stone-900">
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Date Time & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-900/90 border border-stone-700/80 rounded-xl text-stone-100 text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                Duration (Mins)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-stone-900/90 border border-stone-700/80 rounded-xl text-stone-100 text-sm focus:outline-hidden focus:border-amber-500"
              >
                <option value={45}>45 mins</option>
                <option value={60}>60 mins (1 hr)</option>
                <option value={90}>90 mins (1.5 hr)</option>
                <option value={120}>120 mins (2 hr)</option>
                <option value={180}>180 mins (3 hr)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              Session Agenda & Syllabus Topics
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the core topics covered, pre-requisite readings, or question types to be solved..."
              className="w-full px-4 py-2.5 bg-stone-900/90 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>

          {/* Classroom Controls & Safeguards */}
          <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Shield className="w-4 h-4" />
              <span>Session Policies & Student Permissions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between p-2.5 bg-stone-800/40 rounded-lg border border-stone-800 cursor-pointer hover:bg-stone-800/70 transition-colors">
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Enable In-Class Chat</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableChat}
                  onChange={(e) => setEnableChat(e.target.checked)}
                  className="rounded border-stone-600 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-stone-800/40 rounded-lg border border-stone-800 cursor-pointer hover:bg-stone-800/70 transition-colors">
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Enable Q&A Doubt Solver</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableQA}
                  onChange={(e) => setEnableQA(e.target.checked)}
                  className="rounded border-stone-600 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-stone-800/40 rounded-lg border border-stone-800 cursor-pointer hover:bg-stone-800/70 transition-colors">
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>Student Mic by Default</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowStudentMic}
                  onChange={(e) => setAllowStudentMic(e.target.checked)}
                  className="rounded border-stone-600 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-stone-800/40 rounded-lg border border-stone-800 cursor-pointer hover:bg-stone-800/70 transition-colors">
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Waiting Room Enabled</span>
                </div>
                <input
                  type="checkbox"
                  checked={waitingRoomEnabled}
                  onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                  className="rounded border-stone-600 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Scheduling...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Live Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

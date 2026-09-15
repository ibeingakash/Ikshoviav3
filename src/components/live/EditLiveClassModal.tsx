import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Save,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { LiveClass } from '../../types/liveClass.js';
import { liveClassService } from '../../services/liveClassService.js';

interface EditLiveClassModalProps {
  isOpen: boolean;
  liveClass: LiveClass | null;
  onClose: () => void;
  onUpdated: (updated: LiveClass) => void;
  onDeleted: (classId: string) => void;
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

export const EditLiveClassModal: React.FC<EditLiveClassModalProps> = ({
  isOpen,
  liveClass,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  if (!isOpen || !liveClass) return null;

  const [title, setTitle] = useState(liveClass.title);
  const [description, setDescription] = useState(liveClass.description || '');
  const [exam, setExam] = useState<'UPSC' | 'BPSC' | 'BOTH'>(liveClass.exam);
  const [subject, setSubject] = useState(liveClass.subject || UPSC_BPSC_SUBJECTS[0]);
  const [durationMinutes, setDurationMinutes] = useState(liveClass.durationMinutes || 60);
  const [status, setStatus] = useState<any>(liveClass.status);
  const [isPublished, setIsPublished] = useState<boolean>(liveClass.isPublished ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updated = await liveClassService.updateClass(liveClass.id, {
        title: title.trim(),
        description: description.trim(),
        exam,
        subject,
        durationMinutes: Number(durationMinutes),
        status,
        isPublished,
      });

      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('[EditLiveClass Error]', err);
      setError(err.message || 'Failed to update live class');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${liveClass.title}"? This class will be permanently removed.`)) {
      return;
    }

    try {
      setLoading(true);
      await liveClassService.deleteClass(liveClass.id);
      onDeleted(liveClass.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete class');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0F1424] border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-5 my-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Admin & Faculty Control
            </span>
            <h2 className="text-lg font-bold text-white">Edit Live Class Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">
              Class Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A13] border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">
              Description & Syllabus Outline
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A13] border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Target Exam
              </label>
              <select
                value={exam}
                onChange={e => setExam(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#070A13] border border-stone-700 rounded-xl text-xs text-white"
              >
                <option value="UPSC">UPSC CSE</option>
                <option value="BPSC">BPSC 71st</option>
                <option value="BOTH">Combined / Both</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={360}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A13] border border-stone-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">
              Subject Focus
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A13] border border-stone-700 rounded-xl text-xs text-white"
            >
              {UPSC_BPSC_SUBJECTS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status & Learner Visibility */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#070A13] border border-stone-800 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Class State
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-[#0F1424] border border-stone-700 rounded-lg text-xs text-white"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="LIVE">LIVE (Broadcasting)</option>
                <option value="ENDED">ENDED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Learner Visibility
              </label>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isPublished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isPublished ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>PUBLISHED</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>DRAFT / HIDDEN</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-stone-800">
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Class</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  CheckCircle2,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherClass } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

interface LiveClassItem {
  id: string;
  title: string;
  description?: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  participantsCount?: number;
  meetingUrl?: string;
}

export const TeacherLiveClassesView: React.FC = () => {
  const { setActiveSection } = useLearner();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'General Studies Paper 1',
    classId: '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        api.getTeacherClasses().catch(() => []),
        fetch('/api/live-classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      setClasses(classesRes);
      setLiveSessions(sessionsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      subject: classes[0]?.subject || 'General Studies Paper 1',
      classId: classes[0]?.id || '',
      scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Session title is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/live-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          scheduled_at: new Date(formData.scheduledAt).toISOString(),
          class_id: formData.classId,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create live class');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule session');
    } finally {
      setSaving(false);
    }
  };

  const handleStartSession = (session: LiveClassItem) => {
    // Navigate to live-classes hub or classroom
    setActiveSection('live-classes');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-rose-600" />
            <span>Live Interactive Classroom</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Conduct live video lectures, doubt clearing webinars, and interactive answer-writing mentoring via WebRTC.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : liveSessions.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Video className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-sm">No live classes scheduled</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Schedule an interactive video lecture for your cohort with realtime chat and screen sharing.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Schedule Live Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveSessions.map(session => (
            <div
              key={session.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-rose-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      session.status === 'LIVE'
                        ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                        : session.status === 'ENDED'
                        ? 'bg-stone-100 text-stone-600 border border-stone-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>{session.status}</span>
                  </span>

                  <span className="text-[10px] text-stone-400 font-mono">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2.5">{session.title}</h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">{session.subject}</p>
                {session.description && (
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">{session.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(session.scheduledAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{session.participantsCount ?? 0} Attendees</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handleStartSession(session)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{session.status === 'LIVE' ? 'Join Classroom Now' : 'Launch Session'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE LIVE CLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                Schedule Live Lecture
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Lecture Topic / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Masterclass: Answer Writing Structure for GS-1"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Class Cohort</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
                  >
                    <option value="">All Enrolled Students</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Session Agenda & Prerequisites</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Topics to be covered and items students should keep ready..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {saving ? 'Scheduling...' : 'Schedule Live Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

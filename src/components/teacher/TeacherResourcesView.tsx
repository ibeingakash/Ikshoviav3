import React, { useEffect, useState } from 'react';
import {
  FolderArchive,
  Plus,
  FileText,
  Upload,
  BookOpen,
  Trash2,
  Share2,
  X,
  AlertCircle,
  ExternalLink,
  Search
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherClass } from '../../types/index.js';

interface TeacherResourceItem {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  fileUrl: string;
  classId?: string;
  className?: string;
  origin: string;
  downloadsCount?: number;
  createdAt: string;
}

export const TeacherResourcesView: React.FC = () => {
  const [resources, setResources] = useState<TeacherResourceItem[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'Indian Polity & Governance',
    topic: 'Constitutional Bodies Handout',
    classId: '',
    fileUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes] = await Promise.all([
        api.getTeacherClasses().catch(() => [])
      ]);
      setClasses(classesRes);

      // Load resources from backend
      const res = await fetch('/api/resources?origin=TEACHER_CREATED', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      subject: 'Indian Polity & Governance',
      topic: 'Comprehensive Handout',
      classId: classes[0]?.id || '',
      fileUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Resource title is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/teacher/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          topic: formData.topic,
          fileUrl: formData.fileUrl || '/resources/sample-handout.pdf',
          origin: 'TEACHER_CREATED',
          classId: formData.classId,
          tags: ['TEACHER_HANDOUT', 'STUDY_MATERIAL']
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload resource');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-amber-600" />
            <span>Faculty Handouts & Study Resources</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Distribute PDF handouts, lecture notes, and syllabus summaries to your class cohorts.
            Teacher resources are clearly designated and distinct from official commission publications.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Handout</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Resources Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-sm">No teacher handouts uploaded yet</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Upload lecture notes, summary sheets, or revision handouts for your assigned classes.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Upload First Handout
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <div
              key={r.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-amber-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                    FACULTY RESOURCE
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2.5">{r.title}</h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">{r.subject}</p>
                {r.topic && <p className="text-xs text-stone-500 mt-0.5">Topic: {r.topic}</p>}
                {r.description && (
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">{r.description}</p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-mono">
                  PDF Handout
                </span>

                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>View Handout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD RESOURCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                Upload Handout / Resource
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Fundamental Rights Article 14-32 Quick Revision Chart"
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
                    <option value="">All My Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Topic / Chapter</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Document URL / PDF Link</label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://... or /resources/handout.pdf"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of contents and study instructions..."
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Uploading...' : 'Publish Handout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

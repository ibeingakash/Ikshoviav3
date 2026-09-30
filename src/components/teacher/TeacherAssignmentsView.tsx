import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  FileText,
  Search,
  Eye
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherAssignment, TeacherClass } from '../../types/index.js';

interface TeacherAssignmentsViewProps {
  onEvaluateAssignment?: (assignmentId: string) => void;
}

export const TeacherAssignmentsView: React.FC<TeacherAssignmentsViewProps> = ({
  onEvaluateAssignment
}) => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    description: '',
    subject: 'General Studies',
    topic: '',
    instructions: 'Write answers adhering to UPSC Mains word count limits. Use diagrams and constitutional case citations where appropriate.',
    dueDate: '',
    totalMarks: 250,
    durationMinutes: 180,
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'ARCHIVED',
    questions: [
      { id: 'q1', prompt: 'Discuss the constitutional implications of cooperative federalism in India.', marks: 15, wordLimit: 250 }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentsRes, classesRes] = await Promise.all([
        api.getTeacherAssignments(),
        api.getTeacherClasses()
      ]);
      setAssignments(assignmentsRes);
      setClasses(classesRes);
      if (classesRes.length > 0 && !formData.classId) {
        setFormData(prev => ({ ...prev, classId: classesRes[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormData({
      classId: classes[0]?.id || '',
      title: '',
      description: '',
      subject: 'General Studies Paper 2',
      topic: 'Governance & Constitution',
      instructions: 'Write answers adhering to UPSC Mains word count limits. Use diagrams and constitutional case citations where appropriate.',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalMarks: 250,
      durationMinutes: 180,
      status: 'PUBLISHED',
      questions: [
        { id: 'q1', prompt: 'Discuss the constitutional implications of cooperative federalism in India.', marks: 15, wordLimit: 250 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: TeacherAssignment) => {
    setEditingAssignment(a);
    setFormData({
      classId: a.classId || '',
      title: a.title,
      description: a.description || '',
      subject: a.subject || 'General Studies',
      topic: a.topic || '',
      instructions: a.instructions || '',
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '',
      totalMarks: a.totalMarks,
      durationMinutes: a.durationMinutes || 180,
      status: a.status,
      questions: a.questions && a.questions.length > 0 ? a.questions : [
        { id: 'q1', prompt: 'Main answer evaluation question', marks: 10, wordLimit: 150 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { id: `q${formData.questions.length + 1}`, prompt: '', marks: 15, wordLimit: 250 }
      ]
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = formData.questions.filter((_, i) => i !== idx);
    setFormData({ ...formData, questions: updated });
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    const updated = [...formData.questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingAssignment) {
        await api.updateTeacherAssignment(editingAssignment.id, formData);
      } else {
        await api.createTeacherAssignment(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete assignment "${title}"?`)) return;
    try {
      await api.deleteTeacherAssignment(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-600" />
            <span>Assignments & Mains Answer Writing</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Design structured answer prompts, set word limits and marks rubrics, assign to student batches, and track submissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-sm">No assignments posted yet</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Create an assignment for your students with structured Mains questions to practice analytical writing.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Create First Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(a => (
            <div
              key={a.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-amber-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        a.status === 'PUBLISHED' || a.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : a.status === 'CLOSED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {a.status}
                    </span>
                    {a.className && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        {a.className}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 cursor-pointer"
                      title="Edit Assignment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2.5">{a.title}</h3>
                <div className="text-xs text-amber-900 font-medium mt-0.5">
                  {a.subject} {a.topic ? `• ${a.topic}` : ''}
                </div>
                {a.description && (
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">{a.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs text-stone-600 font-mono">
                  <div>
                    <span className="text-stone-400">Total Marks:</span> {a.totalMarks}
                  </div>
                  <div>
                    <span className="text-stone-400">Due:</span>{' '}
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Deadline'}
                  </div>
                  <div>
                    <span className="text-stone-400">Questions:</span> {a.questions?.length || 0}
                  </div>
                  <div>
                    <span className="text-stone-400">Submissions:</span>{' '}
                    <span className="font-bold text-stone-900">{a.submissionsCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-stone-400 font-mono">
                  {a.evaluatedCount || 0} evaluated
                </span>

                {onEvaluateAssignment && (
                  <button
                    onClick={() => onEvaluateAssignment(a.id)}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Submissions</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Class / Cohort *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
                  >
                    <option value="">All Assigned Students</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.exam})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published / Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. GS-2 Answer Writing Drill: Separation of Powers"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Polity & Governance"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              {/* Questions Section */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-stone-800 text-xs uppercase font-mono tracking-wider">
                    Questions & Prompts ({formData.questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold text-[11px] cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-700 font-mono text-[11px]">
                          Question #{idx + 1}
                        </span>
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-rose-600 hover:text-rose-800 text-[10px] font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        required
                        value={q.prompt}
                        onChange={e => handleQuestionChange(idx, 'prompt', e.target.value)}
                        placeholder="Enter Mains question prompt..."
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900 bg-white"
                      />

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <label className="font-mono text-stone-500 text-[11px]">Marks:</label>
                          <input
                            type="number"
                            value={q.marks}
                            onChange={e => handleQuestionChange(idx, 'marks', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-stone-300 rounded bg-white font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="font-mono text-stone-500 text-[11px]">Word Limit:</label>
                          <input
                            type="number"
                            value={q.wordLimit}
                            onChange={e => handleQuestionChange(idx, 'wordLimit', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-stone-300 rounded bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {saving ? 'Saving...' : editingAssignment ? 'Save Changes' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

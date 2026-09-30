import React, { useEffect, useState } from 'react';
import {
  FileQuestion,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  AlertCircle,
  Search,
  BookOpen,
  Award
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherQuiz, TeacherClass } from '../../types/index.js';

export const TeacherQuizzesView: React.FC = () => {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    description: '',
    subject: 'General Studies Prelims',
    durationMinutes: 30,
    scheduledAt: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
    questionIds: [] as string[]
  });

  // Canonical questions loader for picker
  const [searchQuestions, setSearchQuestions] = useState<string>('');
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizzesRes, classesRes] = await Promise.all([
        api.getTeacherQuizzes(),
        api.getTeacherClasses()
      ]);
      setQuizzes(quizzesRes);
      setClasses(classesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setFormData({
      classId: classes[0]?.id || '',
      title: '',
      description: '',
      subject: 'General Studies Prelims Practice',
      durationMinutes: 30,
      scheduledAt: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'PUBLISHED',
      questionIds: []
    });
    setIsModalOpen(true);
    loadAvailableQuestions();
  };

  const loadAvailableQuestions = async () => {
    setLoadingQuestions(true);
    try {
      // Fetch sample canonical questions from question bank
      const res = await api.getPYQs({ limit: 20 });
      setAvailableQuestions(res.items || []);
    } catch (err) {
      console.warn('Failed to load canonical questions for picker', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleToggleQuestionSelect = (qId: string) => {
    setFormData(prev => {
      const exists = prev.questionIds.includes(qId);
      return {
        ...prev,
        questionIds: exists
          ? prev.questionIds.filter(id => id !== qId)
          : [...prev.questionIds, qId]
      };
    });
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim()) {
      alert('Title and subject are required');
      return;
    }

    setSaving(true);
    try {
      await api.createTeacherQuiz(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create quiz');
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
            <FileQuestion className="w-6 h-6 text-amber-600" />
            <span>Class Quizzes & Practice Tests</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Construct timed practice quizzes for assigned classes using teacher questions and canonical PYQ banks.
            Official UPSC PYQs remain protected under source provenance rules.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Class Quiz</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Quizzes List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <FileQuestion className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-sm">No quizzes scheduled</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Build and assign interactive quizzes to evaluate student retention and concept readiness.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Create First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(q => (
            <div
              key={q.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-amber-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    {q.origin || 'TEACHER_CREATED'}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      q.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2.5">{q.title}</h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">{q.subject}</p>
                {q.className && <p className="text-xs text-stone-500 mt-0.5">Assigned to: {q.className}</p>}

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-500 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-bold text-stone-800">{q.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Questions:</span>
                    <span className="font-bold text-stone-800">{q.questionIds?.length || 0} items</span>
                  </div>
                  {q.scheduledAt && (
                    <div className="flex items-center justify-between">
                      <span>Scheduled:</span>
                      <span>{new Date(q.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-mono">
                  ID: {q.id.slice(0, 8)}...
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                Create Class Quiz
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Class *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
                  >
                    <option value="">All Cohorts</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Speed Quiz: Modern History 1857-1947"
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
                  <label className="block font-bold text-stone-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-mono"
                  />
                </div>
              </div>

              {/* Questions Picker */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-stone-800 text-xs uppercase font-mono tracking-wider">
                    Select Canonical Questions ({formData.questionIds.length} chosen)
                  </h3>
                  <span className="text-[10px] text-amber-700 font-mono">
                    Protected Source Provenance
                  </span>
                </div>

                {loadingQuestions ? (
                  <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-stone-200 rounded-xl p-2 bg-stone-50">
                    {availableQuestions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-stone-400">
                        Default pool will be auto-attached on submission
                      </div>
                    ) : (
                      availableQuestions.map(q => {
                        const isSelected = formData.questionIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleToggleQuestionSelect(q.id)}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 text-xs ${
                              isSelected
                                ? 'bg-amber-100 border-amber-300 text-amber-950 font-medium'
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 text-amber-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-2">{q.question_text || q.text}</p>
                              <div className="text-[10px] text-stone-400 font-mono mt-1">
                                {q.subject} • {q.exam}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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
                  {saving ? 'Creating...' : 'Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

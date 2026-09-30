import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Clock,
  Video,
  UserPlus,
  Trash2,
  Edit2,
  Calendar,
  X,
  AlertCircle,
  Search
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherClass, TeacherClassStudent } from '../../types/index.js';

interface TeacherClassesViewProps {
  onStartLiveClass?: (classData: TeacherClass) => void;
  onPostAnnouncement?: (classId: string) => void;
}

export const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({
  onStartLiveClass
}) => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<TeacherClass | null>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<TeacherClass | null>(null);
  const [rosterStudents, setRosterStudents] = useState<TeacherClassStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [addStudentInput, setAddStudentInput] = useState<string>('');
  const [addingStudent, setAddingStudent] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exam: 'UPSC',
    subject: 'General Studies Paper 1',
    topic: '',
    schedule: 'Mon, Wed, Fri at 10:00 AM IST',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED'
  });
  const [savingClass, setSavingClass] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTeacherClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      description: '',
      exam: 'UPSC',
      subject: 'General Studies Paper 1',
      topic: '',
      schedule: 'Mon, Wed, Fri at 10:00 AM IST',
      status: 'ACTIVE'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (c: TeacherClass) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      description: c.description || '',
      exam: c.exam,
      subject: c.subject,
      topic: c.topic || '',
      schedule: c.schedule || '',
      status: c.status
    });
    setIsCreateOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim()) {
      alert('Class name and subject are required');
      return;
    }

    setSavingClass(true);
    try {
      if (editingClass) {
        await api.updateTeacherClass(editingClass.id, formData);
      } else {
        await api.createTeacherClass(formData);
      }
      setIsCreateOpen(false);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to save class');
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete class "${className}"? This will unenroll all students.`)) {
      return;
    }
    try {
      await api.deleteTeacherClass(classId);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class');
    }
  };

  const handleOpenRoster = async (c: TeacherClass) => {
    setSelectedClassForRoster(c);
    setLoadingRoster(true);
    try {
      const students = await api.getClassStudents(c.id);
      setRosterStudents(students);
    } catch (err: any) {
      alert(err.message || 'Failed to load students roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForRoster || !addStudentInput.trim()) return;

    setAddingStudent(true);
    try {
      await api.addStudentToClass(selectedClassForRoster.id, addStudentInput.trim());
      setAddStudentInput('');
      const updated = await api.getClassStudents(selectedClassForRoster.id);
      setRosterStudents(updated);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to add student to class');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!selectedClassForRoster) return;
    if (!confirm(`Remove student ${studentName || studentId} from this class?`)) return;

    try {
      await api.removeStudentFromClass(selectedClassForRoster.id, studentId);
      const updated = await api.getClassStudents(selectedClassForRoster.id);
      setRosterStudents(updated);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.exam.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            <span>Classroom & Cohort Management</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize student batches, assign syllabi, schedule live sessions, and manage enrollments.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Class</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search classes by name, subject, or exam..."
          className="w-full text-xs text-stone-800 outline-none bg-transparent placeholder-stone-400"
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-sm">No classes found</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Get started by creating your first cohort to organize students and assign course material.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Create First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(c => (
            <div
              key={c.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {c.exam}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition cursor-pointer"
                      title="Edit Class"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c.id, c.name)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2.5">{c.name}</h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">{c.subject}</p>
                {c.topic && <p className="text-xs text-stone-500 mt-0.5">Topic: {c.topic}</p>}
                {c.description && (
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">{c.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-mono">{c.enrolledCount ?? 0} Enrolled Students</span>
                  </div>
                  {c.schedule && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{c.schedule}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenRoster(c)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-stone-600" />
                  <span>Manage Roster</span>
                </button>

                {onStartLiveClass && (
                  <button
                    onClick={() => onStartLiveClass(c)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-600" />
                    <span>Live Class</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CLASS MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                {editingClass ? 'Edit Class Details' : 'Create New Class'}
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. UPSC Prelims 2026 GS-1 Foundation Batch"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Exam *</label>
                  <select
                    value={formData.exam}
                    onChange={e => setFormData({ ...formData, exam: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="UPSC">UPSC Civil Services</option>
                    <option value="BPSC">BPSC Combined Competitive</option>
                    <option value="UPPSC">UPPSC Provincial Civil</option>
                    <option value="ALL">All Civil Services</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Modern Indian History"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Topic / Module</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Freedom Struggle & Constitutional Reforms"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Schedule / Timings</label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="e.g. Every Monday & Thursday at 11:00 AM IST"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description / Syllabus Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed orientation, prerequisites, and syllabus covered..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClass}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {savingClass ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER MODAL: MANAGE ENROLLED STUDENTS */}
      {selectedClassForRoster && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif-editorial text-stone-900">
                  Student Roster — {selectedClassForRoster.name}
                </h2>
                <p className="text-xs text-stone-500">
                  Manage enrolled learners for this authorized cohort
                </p>
              </div>
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add student form */}
            <form onSubmit={handleAddStudent} className="flex items-center gap-2">
              <input
                type="text"
                value={addStudentInput}
                onChange={e => setAddStudentInput(e.target.value)}
                placeholder="Enter Student Email or User ID to enroll..."
                className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={addingStudent || !addStudentInput.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{addingStudent ? 'Enrolling...' : 'Enroll Student'}</span>
              </button>
            </form>

            {/* Students list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingRoster ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-stone-200 rounded-xl text-xs text-stone-400">
                  No students currently enrolled in this class.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {rosterStudents.map(student => (
                    <div
                      key={student.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">{student.studentName || 'Learner'}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {student.studentEmail || student.studentId}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Enrolled: {new Date(student.joinedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {student.status}
                        </span>
                        <button
                          onClick={() => handleRemoveStudent(student.studentId, student.studentName || '')}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Unenroll student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 text-right">
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

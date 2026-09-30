import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Bell,
  Clock,
  Send,
  Award,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const LearnerClassesAndAssignmentsView: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Submit Answer Modal
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadLearnerData();
  }, []);

  const loadLearnerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, assignmentsRes, announcementsRes] = await Promise.all([
        api.getLearnerClasses().catch(() => []),
        api.getLearnerAssignments().catch(() => []),
        api.getLearnerAnnouncements().catch(() => [])
      ]);
      setClasses(classesRes);
      setAssignments(assignmentsRes);
      setAnnouncements(announcementsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load enrolled classes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (assignment: any) => {
    setActiveAssignmentForSubmit(assignment);
    const initial: Record<string, string> = {};
    if (assignment.questions) {
      assignment.questions.forEach((q: any) => {
        initial[q.id || q.prompt] = '';
      });
    }
    setAnswers(initial);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForSubmit) return;

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([key, val]) => ({
        prompt: key,
        text: val,
      }));

      await api.submitLearnerAssignment(activeAssignmentForSubmit.id, formattedAnswers);
      setActiveAssignmentForSubmit(null);
      await loadLearnerData();
      alert('Answer submitted successfully for faculty evaluation!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          <span>My Enrolled Classes & Assignments</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Access course cohorts assigned by faculty, submit Mains answers for evaluation, and check teacher feedback.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Bell className="w-4 h-4 text-amber-700" />
            <span>Faculty Announcements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 4).map(ann => (
              <div key={ann.id} className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs">
                <div className="font-bold text-stone-900">{ann.title}</div>
                <div className="text-stone-600 mt-0.5 line-clamp-2">{ann.message}</div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">
                  {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Classes & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
            <span>Pending & Completed Assignments</span>
          </h2>

          {assignments.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-400">
              No assignments currently assigned to your cohort.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => (
                <div
                  key={a.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-amber-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                        {a.subject}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {a.totalMarks} Marks
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm">{a.title}</h3>
                    {a.instructions && (
                      <p className="text-xs text-stone-600 line-clamp-2">{a.instructions}</p>
                    )}

                    <div className="text-[11px] text-stone-400 font-mono pt-1">
                      Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No deadline'}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => handleOpenSubmit(a)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Answer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Enrolled Classes */}
        <div className="space-y-4">
          <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Enrolled Classes</span>
          </h2>

          {classes.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-400">
              You are not currently enrolled in any faculty cohorts.
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map(c => (
                <div key={c.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {c.exam}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Enrolled
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm mt-2">{c.name}</h3>
                  <p className="text-xs text-stone-500">{c.subject}</p>
                  {c.schedule && (
                    <div className="text-[11px] text-stone-400 font-mono mt-2 pt-2 border-t border-stone-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{c.schedule}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT ANSWER MODAL */}
      {activeAssignmentForSubmit && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-base font-bold font-serif-editorial text-stone-900">
                  Submit Response: {activeAssignmentForSubmit.title}
                </h2>
                <p className="text-xs text-stone-500">
                  Total Marks: {activeAssignmentForSubmit.totalMarks} • Subject: {activeAssignmentForSubmit.subject}
                </p>
              </div>
              <button
                onClick={() => setActiveAssignmentForSubmit(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-4 text-xs">
              {activeAssignmentForSubmit.instructions && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs">
                  <span className="font-bold">Instructions: </span>
                  {activeAssignmentForSubmit.instructions}
                </div>
              )}

              {activeAssignmentForSubmit.questions && activeAssignmentForSubmit.questions.length > 0 ? (
                activeAssignmentForSubmit.questions.map((q: any, idx: number) => {
                  const key = q.id || q.prompt;
                  return (
                    <div key={idx} className="space-y-2 p-3 bg-stone-50/60 border border-stone-200 rounded-xl">
                      <div className="flex items-center justify-between font-mono font-bold text-amber-900 text-xs">
                        <span>Question #{idx + 1} ({q.marks || 15} Marks)</span>
                        {q.wordLimit && <span className="text-stone-400">Limit: {q.wordLimit} words</span>}
                      </div>
                      <p className="font-bold text-stone-900">{q.prompt}</p>
                      <textarea
                        rows={6}
                        required
                        value={answers[key] || ''}
                        onChange={e => setAnswers({ ...answers, [key]: e.target.value })}
                        placeholder="Write your structured response here..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white font-serif leading-relaxed"
                      />
                    </div>
                  );
                })
              ) : (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Mains Response *</label>
                  <textarea
                    rows={8}
                    required
                    value={answers['default'] || ''}
                    onChange={e => setAnswers({ ...answers, default: e.target.value })}
                    placeholder="Enter your complete answer draft..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white font-serif"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAssignmentForSubmit(null)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit to Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

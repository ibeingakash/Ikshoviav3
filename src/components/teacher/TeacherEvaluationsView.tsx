import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  Award,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  X,
  AlertCircle,
  Search,
  History
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TeacherSubmission } from '../../types/index.js';

interface TeacherEvaluationsViewProps {
  initialAssignmentId?: string;
}

export const TeacherEvaluationsView: React.FC<TeacherEvaluationsViewProps> = ({
  initialAssignmentId
}) => {
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Evaluating modal
  const [activeSubmission, setActiveSubmission] = useState<TeacherSubmission | null>(null);
  const [evalMarks, setEvalMarks] = useState<number>(0);
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalStrengths, setEvalStrengths] = useState<string>('');
  const [evalWeaknesses, setEvalWeaknesses] = useState<string>('');
  const [evalSuggestions, setEvalSuggestions] = useState<string>('');
  const [savingEvaluation, setSavingEvaluation] = useState<boolean>(false);

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, initialAssignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTeacherSubmissions(initialAssignmentId, statusFilter);
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluation = (sub: TeacherSubmission) => {
    setActiveSubmission(sub);
    setEvalMarks(sub.marksObtained ?? 0);
    setEvalFeedback(sub.feedback || '');
    setEvalStrengths(sub.strengths || '');
    setEvalWeaknesses(sub.weaknesses || '');
    setEvalSuggestions(sub.suggestions || '');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setSavingEvaluation(true);
    try {
      await api.evaluateTeacherSubmission(activeSubmission.id, {
        marksObtained: Number(evalMarks),
        feedback: evalFeedback,
        strengths: evalStrengths,
        weaknesses: evalWeaknesses,
        suggestions: evalSuggestions,
      });
      setActiveSubmission(null);
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to submit evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  };

  const filtered = submissions.filter(s =>
    s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.assignmentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-amber-600" />
          <span>Mains Answer Evaluation Hub</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review handwritten and typed candidate responses, award marks, annotate strengths & weaknesses, and mentor aspirants with targeted feedback.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'SUBMITTED'
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('EVALUATED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'EVALUATED'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Evaluated
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate or title..."
            className="w-full text-xs text-stone-800 outline-none bg-transparent placeholder-stone-400"
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-stone-500">Loading student submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-700">No submissions found</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Candidate answers submitted for your assignments will appear here for grading.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map(sub => (
              <div
                key={sub.id}
                className="p-4 hover:bg-amber-50/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        sub.status === 'EVALUATED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {sub.status === 'EVALUATED' ? 'Evaluated' : 'Pending Evaluation'}
                    </span>
                    <span className="font-bold text-stone-900 text-xs">
                      {sub.assignmentTitle || 'Assignment Answer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-medium text-stone-800">{sub.studentName || 'Learner'}</span>
                    <span className="text-stone-300">•</span>
                    <span className="font-mono text-stone-500 text-[11px]">{sub.studentEmail}</span>
                  </div>

                  <div className="text-[11px] text-stone-400 font-mono">
                    Submitted: {new Date(sub.submittedAt).toLocaleString()}
                    {sub.evaluatedAt && (
                      <span className="text-emerald-700 ml-2">
                        • Evaluated: {new Date(sub.evaluatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {sub.status === 'EVALUATED' && (
                    <div className="text-right font-mono text-xs">
                      <div className="text-stone-400 text-[10px]">Marks</div>
                      <div className="font-bold text-emerald-700 text-sm">
                        {sub.marksObtained} / {sub.totalMarks || 250}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenEvaluation(sub)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    {sub.status === 'EVALUATED' ? 'Re-Evaluate' : 'Grade Submission'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EVALUATION MODAL */}
      {activeSubmission && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                  <span>Candidate Evaluation & Grading</span>
                  {activeSubmission.status === 'EVALUATED' && (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                      Previously Evaluated
                    </span>
                  )}
                </h2>
                <p className="text-xs text-stone-500 font-mono">
                  Candidate: {activeSubmission.studentName} ({activeSubmission.studentEmail})
                </p>
              </div>
              <button
                onClick={() => setActiveSubmission(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split View: Left = Student Submission, Right = Teacher Rubric */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Student Answer Content */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="border-b border-stone-200 pb-2">
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Assignment</div>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5">
                    {activeSubmission.assignmentTitle}
                  </h3>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-700 font-mono uppercase tracking-wider mb-2">
                    Student Answers & Responses:
                  </h4>
                  {activeSubmission.answers && activeSubmission.answers.length > 0 ? (
                    <div className="space-y-4">
                      {activeSubmission.answers.map((ans: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200 rounded-lg space-y-2">
                          <div className="text-[11px] font-mono font-bold text-amber-900">
                            Question #{idx + 1}: {ans.prompt || 'Mains Question'}
                          </div>
                          <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed p-2.5 bg-stone-50/60 rounded border border-stone-100 font-serif">
                            {ans.text || ans.answer || 'No answer text provided.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-stone-500 italic p-4 text-center">
                      No structured questions found; raw response attached.
                    </div>
                  )}
                </div>

                {/* Evaluation History if present */}
                {activeSubmission.evaluationHistory && activeSubmission.evaluationHistory.length > 0 && (
                  <div className="pt-3 border-t border-stone-200">
                    <div className="text-[11px] font-bold text-stone-600 font-mono flex items-center gap-1 mb-1.5">
                      <History className="w-3.5 h-3.5 text-stone-400" />
                      <span>Evaluation Audit History</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-stone-500 font-mono">
                      {activeSubmission.evaluationHistory.map((h: any, i: number) => (
                        <div key={i} className="p-1.5 bg-white rounded border border-stone-200">
                          {new Date(h.timestamp).toLocaleDateString()}: Awarded {h.marksObtained} Marks
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Grading & Feedback Form */}
              <form onSubmit={handleSaveEvaluation} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Marks Awarded *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={0}
                      max={activeSubmission.totalMarks || 250}
                      value={evalMarks}
                      onChange={e => setEvalMarks(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-mono font-bold text-stone-900"
                    />
                    <span className="text-stone-500 font-mono text-xs">
                      / {activeSubmission.totalMarks || 250} total marks
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Strengths & Positive Highlights</span>
                  </label>
                  <textarea
                    rows={2}
                    value={evalStrengths}
                    onChange={e => setEvalStrengths(e.target.value)}
                    placeholder="e.g. Excellent introduction with constitutional article citation..."
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Areas for Improvement / Weaknesses</span>
                  </label>
                  <textarea
                    rows={2}
                    value={evalWeaknesses}
                    onChange={e => setEvalWeaknesses(e.target.value)}
                    placeholder="e.g. Missed the Supreme Court landmark judgments; conclusion was rushed..."
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Targeted Improvement Suggestions & Way Forward</span>
                  </label>
                  <textarea
                    rows={2}
                    value={evalSuggestions}
                    onChange={e => setEvalSuggestions(e.target.value)}
                    placeholder="e.g. Practice structured sub-headings with flowcharts to boost marks by 2-3 points."
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Overall Evaluator Comments & Summary Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={evalFeedback}
                    onChange={e => setEvalFeedback(e.target.value)}
                    placeholder="Detailed mentorship guidance for the candidate..."
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubmission(null)}
                    className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvaluation}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {savingEvaluation ? 'Saving...' : 'Submit Evaluation & Notify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

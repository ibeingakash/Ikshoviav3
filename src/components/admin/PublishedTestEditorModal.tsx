import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  BookOpen,
  Trash2,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Info,
  Clock,
  Layers,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { MockTest, Question, QuestionOption } from '../../types/index.js';
import { getExpectedOptionsForExam } from '../../lib/examOptionPolicy.js';

interface PublishedTestEditorModalProps {
  test: MockTest;
  onClose: () => void;
  onTestUpdated: (updated: MockTest) => void;
}

export const PublishedTestEditorModal: React.FC<PublishedTestEditorModalProps> = ({
  test,
  onClose,
  onTestUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'QUESTIONS'>('QUESTIONS');
  
  // Test Settings State
  const [displayName, setDisplayName] = useState(test.displayName || test.title);
  const [title, setTitle] = useState(test.title);
  const [durationMinutes, setDurationMinutes] = useState(test.durationMinutes || 120);
  const [totalMarks, setTotalMarks] = useState(test.totalMarks || 100);
  const [negativeMarkingRate, setNegativeMarkingRate] = useState(test.negativeMarkingRate || 0.33);
  const [instructions, setInstructions] = useState(test.instructions || '');
  const [isPublished, setIsPublished] = useState(test.isPublished ?? true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionSearch, setQuestionSearch] = useState('');
  
  // Single Question Editing State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQTextHi, setEditQTextHi] = useState('');
  const [editOptions, setEditOptions] = useState<Array<{ id: string; text: string; text_hi?: string }>>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationHi, setEditExplanationHi] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Revision History State
  const [revisionsModalQuestion, setRevisionsModalQuestion] = useState<Question | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [test.id]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const qs = await api.getAdminMockTestQuestions(test.id);
      setQuestions(qs);
    } catch (err) {
      console.error('Failed to load questions for editing:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await api.updateMockTest(test.id, {
        displayName: displayName.trim(),
        title: title.trim(),
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        negativeMarkingRate: Number(negativeMarkingRate),
        instructions: Array.isArray(instructions) ? instructions.join('\n') : (instructions || '').trim(),
        isPublished,
      });
      if (res?.test) {
        onTestUpdated(res.test);
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save test settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenQuestionEditor = (q: Question) => {
    setEditingQuestion(q);
    setEditQText(q.question_en || q.question || '');
    setEditQTextHi(q.question_hi || '');
    
    // Canonical exam-specific option policy (BPSC A-E vs UPSC A-D)
    const examPolicy = getExpectedOptionsForExam((test as any).exam || (test as any).examTag || test.title);
    const validLetters = examPolicy.allowedOptionIds;
    const rawOpts = (q.options || []).map((o, idx) => {
      if (typeof o === 'string') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        return { id: letters[idx] || String(idx + 1), text: o };
      }
      return o;
    });
    const normalized = validLetters.map(letter => {
      const existing = rawOpts.find(o => String(o.id).trim().toUpperCase() === letter);
      const optText = existing ? (typeof existing.text === 'string' ? existing.text : (existing as any).en || '') : '';
      const optTextHi = existing ? (existing as any).hi || (existing as any).text_hi || '' : '';
      return {
        id: letter,
        text: optText,
        text_hi: optTextHi,
      };
    });

    setEditOptions(normalized);
    setEditCorrectAnswer(String(q.correctAnswer || (q as any).correct_answer || 'A').trim().toUpperCase());
    setEditExplanation(q.explanation_en || q.explanation || '');
    setEditExplanationHi(q.explanation_hi || '');
    setEditReason('');
    setQuestionSuccess(false);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!editReason.trim()) {
      alert('Please provide a reason for this edit/correction for the permanent audit trail.');
      return;
    }

    setSavingQuestion(true);
    try {
      const formattedOptions = editOptions.map(o => ({
        id: o.id,
        text: o.text,
        text_hi: o.text_hi,
      }));

      const res = await api.updateAdminQuestion(test.id, editingQuestion.id, {
        question: editQText.trim(),
        question_hi: editQTextHi.trim() || undefined,
        options: formattedOptions,
        options_hi: formattedOptions.map(o => ({ id: o.id, text: o.text_hi || o.text })),
        correct_answer: editCorrectAnswer,
        correctAnswer: editCorrectAnswer,
        explanation: editExplanation.trim(),
        explanation_hi: editExplanationHi.trim() || undefined,
        reason: editReason.trim(),
      });

      if (res?.question) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...res.question } : q));
        setQuestionSuccess(true);
        setTimeout(() => {
          setQuestionSuccess(false);
          setEditingQuestion(null);
        }, 1200);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from this mock test? Historical student attempts will retain their record.')) {
      return;
    }
    try {
      await api.removeAdminQuestionFromMockTest(test.id, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove question');
    }
  };

  const handleViewRevisions = async (q: Question) => {
    setRevisionsModalQuestion(q);
    setLoadingRevisions(true);
    try {
      const revs = await api.getMockQuestionRevisions(q.id);
      setRevisions(revs);
    } catch (err) {
      console.error('Failed to load revisions:', err);
      setRevisions([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (!questionSearch.trim()) return true;
    const query = questionSearch.toLowerCase();
    const qText = (q.question || q.question_en || '').toLowerCase();
    const qId = q.id.toLowerCase();
    return qText.includes(query) || qId.includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                ADMIN MOCK EDITOR
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                ID: {test.id}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif-editorial text-stone-900 mt-1">
              {test.displayName || test.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-stone-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('QUESTIONS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'QUESTIONS' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Questions ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'SETTINGS' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Test Settings
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'SETTINGS' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Display Title (Learner Facing)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Original Internal Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      min={5}
                      max={240}
                      required
                      className="w-full px-3.5 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={totalMarks}
                      onChange={e => setTotalMarks(Number(e.target.value))}
                      min={1}
                      max={500}
                      required
                      className="w-full px-3.5 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Negative Marking Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={negativeMarkingRate}
                      onChange={e => setNegativeMarkingRate(Number(e.target.value))}
                      min={0}
                      max={2}
                      required
                      className="w-full px-3.5 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Candidate Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    id="isPublishedCheck"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPublishedCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                    Active & Available in Student Catalog
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save Test Settings'}</span>
                </button>

                {settingsSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settings updated successfully!</span>
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'QUESTIONS' && (
            <div className="space-y-4">
              {/* Question list toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={e => setQuestionSearch(e.target.value)}
                    placeholder="Search questions by text or ID..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="text-xs font-mono text-stone-500">
                  Showing {filteredQuestions.length} of {questions.length} questions
                </div>
              </div>

              {loadingQuestions ? (
                <div className="py-12 text-center text-stone-500 text-xs font-mono">
                  Loading test questions...
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500">
                  No questions match your filter.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {filteredQuestions.map((q, idx) => {
                    const qText = q.question_en || q.question || '';
                    const correctAns = q.correctAnswer || (q as any).correct_answer || 'N/A';

                    return (
                      <div key={q.id} className="p-4 hover:bg-stone-50/60 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono font-bold text-xs">
                              Q.{idx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 truncate max-w-[200px]">
                              {q.id}
                            </span>
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Key: Option {correctAns}
                            </span>
                          </div>

                          <p className="text-xs font-sans text-stone-800 line-clamp-2 leading-relaxed">
                            {qText}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono">
                            <span>{(q.options || []).length} Options</span>
                            {q.explanation && (
                              <span className="text-emerald-700 font-sans font-medium">✓ Solution available</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewRevisions(q)}
                            title="View Revision Audit History"
                            className="p-2 text-stone-500 hover:text-indigo-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQuestionEditor(q)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Key & Text</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            title="Remove from this test"
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUESTION EDITING MODAL / DRAWER */}
        {editingQuestion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 shrink-0">
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-700">
                    SAFE QUESTION & ANSWER KEY CORRECTION
                  </span>
                  <h3 className="text-base font-bold font-serif-editorial text-stone-900 mt-0.5">
                    Editing Question: {editingQuestion.id}
                  </h3>
                </div>

                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Safe Versioning Explainer */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Safe Versioning Enforced:</strong> Correcting this question updates future tests and creates a permanent entry in the revision audit trail. Past completed learner attempts remain safely anchored to their original snapshot.
                  </p>
                </div>

                {/* Reason for Change (Required) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Editorial Reason for Change <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="e.g. Official commission revised answer key, Typo in option C, Clarified question text"
                    required
                    className="w-full px-3.5 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Question Text (EN) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Question Text (English)
                  </label>
                  <textarea
                    rows={3}
                    value={editQText}
                    onChange={e => setEditQText(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                  />
                </div>

                {/* Question Text (HI) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Question Text (Hindi - Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editQTextHi}
                    onChange={e => setEditQTextHi(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                  />
                </div>

                {/* Dynamic Options Matrix based on exam policy */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Options & Correct Answer Key ({editOptions[0]?.id || 'A'} to {editOptions[editOptions.length - 1]?.id || 'D'})
                    </label>
                    <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {getExpectedOptionsForExam((test as any).exam || (test as any).examTag || test.title).commissionName} ({editOptions.length} Options Policy)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {editOptions.map((opt, idx) => {
                      const isCorrect = editCorrectAnswer === opt.id;
                      const isOptionE = opt.id === 'E';

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500' : 'border-stone-200 bg-stone-50/50'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-2">
                            <input
                              type="radio"
                              name="correctAnswerRadio"
                              value={opt.id}
                              checked={isCorrect}
                              onChange={() => setEditCorrectAnswer(opt.id)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="w-6 h-6 rounded-md bg-stone-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                              {opt.id}
                            </span>
                          </label>

                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              value={opt.text}
                              onChange={e => {
                                const newOpts = [...editOptions];
                                newOpts[idx].text = e.target.value;
                                setEditOptions(newOpts);
                              }}
                              placeholder={`Option ${opt.id} text (English)${isOptionE ? ' or "Not Attempted"' : ''}...`}
                              className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={opt.text_hi || ''}
                              onChange={e => {
                                const newOpts = [...editOptions];
                                newOpts[idx].text_hi = e.target.value;
                                setEditOptions(newOpts);
                              }}
                              placeholder={`Option ${opt.id} text (Hindi - Optional)${isOptionE ? ' या "अनुत्तरित प्रश्न"' : ''}...`}
                              className="w-full px-3 py-1 text-[11px] border border-stone-200 rounded-lg bg-white/70 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Official Explanation & Solution
                  </label>
                  <textarea
                    rows={3}
                    value={editExplanation}
                    onChange={e => setEditExplanation(e.target.value)}
                    placeholder="Provide authoritative reasoning, citations, and analytical breakdown..."
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingQuestion}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingQuestion ? 'Saving Correction...' : 'Save Correction & Log Audit'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REVISIONS AUDIT LOG MODAL */}
        {revisionsModalQuestion && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Question Audit History: {revisionsModalQuestion.id}
                  </h3>
                </div>

                <button
                  onClick={() => setRevisionsModalQuestion(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {loadingRevisions ? (
                  <div className="py-8 text-center text-xs font-mono text-stone-500">
                    Loading revisions...
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500">
                    No revisions logged yet for this question. It remains in its initial import version.
                  </div>
                ) : (
                  revisions.map(rev => (
                    <div key={rev.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                        <span className="font-bold text-indigo-700">{rev.field_changed}</span>
                        <span>{new Date(rev.changed_at).toLocaleString()}</span>
                      </div>
                      <p className="text-stone-700 font-medium">
                        <strong>Reason:</strong> {rev.reason}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                        <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-200 truncate">
                          Old: {rev.old_value || 'None'}
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 truncate">
                          New: {rev.new_value || 'None'}
                        </div>
                      </div>
                      <div className="text-[10px] text-stone-400">
                        By: {rev.changed_by}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Layers,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  ListPlus,
  RefreshCw,
  FileCheck2,
  Clock,
  Eye,
  X,
  Save,
  Tag,
  GraduationCap
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Question, Subject, Topic, Concept } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

const getDisplayText = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.text === 'string') return val.text;
    if (typeof val.value === 'string') return val.value;
    if (typeof val.label === 'string') return val.label;
    if (typeof val.name === 'string') return val.name;
    if (typeof val.title === 'string') return val.title;
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
};

const getOptionText = (opt: any): string => {
  if (opt === null || opt === undefined) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'number') return String(opt);
  if (typeof opt === 'object') {
    if (typeof opt.text === 'string') return opt.text;
    if (typeof opt.value === 'string') return opt.value;
    if (typeof opt.label === 'string') return opt.label;
    if (typeof opt.name === 'string') return opt.name;
    try {
      return opt.text || opt.value || opt.label || JSON.stringify(opt);
    } catch {
      return '';
    }
  }
  return String(opt);
};

export const QuestionBankView: React.FC = () => {
  const { setActiveSection } = useLearner();

  // Questions Data & Pagination
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [languageMode, setLanguageMode] = useState<'en' | 'hi'>('en');

  // Subjects & Taxonomy Data
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Selected Question for Preview / Edit Modal
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Question>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add Question Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newQuestionForm, setNewQuestionForm] = useState<Partial<Question>>({
    question: '',
    question_hi: '',
    options: ['', '', '', ''],
    options_hi: ['', '', '', ''],
    correctAnswer: 'A',
    explanation: '',
    explanation_hi: '',
    difficulty: 'MEDIUM',
    subjectId: 'sub_polity',
    examTag: 'UPSC CSE',
    pyqYear: 2025,
    isPublished: true,
  });

  // Selected for Mock Test Builder
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [page, selectedExam, selectedYear, selectedSubject, selectedDifficulty, selectedStatus, selectedSource]);

  const loadSubjects = async () => {
    try {
      const subs = await api.getSubjects();
      setSubjects(subs);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      if (selectedSource === 'OFFICIAL_COMMISSION' && selectedExam !== 'All') {
        const res = await api.getPYQs({
          exam: selectedExam !== 'All' ? selectedExam : undefined,
          year: selectedYear !== 'All' ? selectedYear : undefined,
          subjectId: selectedSubject !== 'All' ? selectedSubject : undefined,
          search: searchQuery || undefined,
          page,
          limit,
        });
        setQuestions(res.items || []);
        setTotalCount(res.totalCount || 0);
      } else {
        const res = await api.getAdminQuestions({
          subjectId: selectedSubject !== 'All' ? selectedSubject : undefined,
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
          examTag: selectedExam !== 'All' ? selectedExam : undefined,
          sourceType: selectedSource !== 'All' ? selectedSource : undefined,
          searchQuery: searchQuery || undefined,
          limit,
          offset: (page - 1) * limit,
        });
        setQuestions(res.items || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleToggleSelectQuestion = (qId: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleSendToMockBuilder = () => {
    if (selectedQuestionIds.length === 0) {
      showToast('Select at least one question to send to Mock Test Builder');
      return;
    }
    // Store selected questions in localStorage for Mock Test Builder
    localStorage.setItem('ikshovia_mock_builder_selected_qs', JSON.stringify(selectedQuestionIds));
    showToast(`Added ${selectedQuestionIds.length} questions to Mock Test Builder!`);
    setActiveSection('admin-mock-builder');
  };

  const handleSaveEdit = async () => {
    if (!activeQuestion) return;
    setIsSaving(true);
    try {
      await api.updateQuestion(activeQuestion.id, editFormData);
      setQuestions(prev =>
        prev.map(q => (q.id === activeQuestion.id ? { ...q, ...editFormData } : q))
      );
      setIsEditing(false);
      setActiveQuestion(null);
      showToast('Question updated successfully!');
    } catch (err) {
      console.error('Failed to update question:', err);
      showToast('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewQuestion = async () => {
    if (!newQuestionForm.question?.trim()) {
      showToast('Please enter question text');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.createQuestion(newQuestionForm);
      if (res.success && res.question) {
        setQuestions(prev => [res.question, ...prev]);
        setTotalCount(prev => prev + 1);
        setShowAddModal(false);
        showToast('Question created in Question Bank!');
      }
    } catch (err) {
      console.error('Failed to create question:', err);
      showToast('Failed to create question');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold border border-amber-500/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Canonical Question Bank
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {totalCount.toLocaleString()} Questions Ingested
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <Database className="w-7 h-7 text-amber-700" />
            <span>Central Question Repository</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Manage, verify, edit, and curate canonical questions across Official PYQs, OCR Ingests, and Custom syllabus items.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {selectedQuestionIds.length > 0 && (
            <button
              onClick={handleSendToMockBuilder}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ListPlus className="w-4 h-4" />
              <span>Assemble Mock ({selectedQuestionIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Question</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#EAE6DF] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, question text, concept, or source..."
              className="w-full pl-9 pr-4 py-2 bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Filter Badges / Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Source</label>
            <select
              value={selectedSource}
              onChange={e => { setSelectedSource(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Sources</option>
              <option value="OFFICIAL_COMMISSION">Official Commission PYQ</option>
              <option value="ADMIN_IMPORTED">Admin / OCR Imported</option>
              <option value="IKSHOVIA_CREATED">IKSHOVIA Created</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Exam</label>
            <select
              value={selectedExam}
              onChange={e => { setSelectedExam(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Exams</option>
              <option value="UPSC CSE">UPSC CSE</option>
              <option value="BPSC">BPSC CCE</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={e => { setSelectedDifficulty(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Levels</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-lg p-1.5 text-xs text-stone-800 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="READY_TO_PUBLISH">Published / Verified</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Language</label>
            <div className="flex rounded-lg overflow-hidden border border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setLanguageMode('en')}
                className={`flex-1 py-1.5 text-[11px] font-bold text-center transition-all ${
                  languageMode === 'en' ? 'bg-stone-900 text-amber-300' : 'bg-[#FCFBF9] text-stone-600'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('hi')}
                className={`flex-1 py-1.5 text-[11px] font-bold text-center transition-all ${
                  languageMode === 'hi' ? 'bg-stone-900 text-amber-300' : 'bg-[#FCFBF9] text-stone-600'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
          Querying canonical question bank...
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="bg-white border border-[#EAE6DF] p-12 rounded-2xl text-center space-y-3">
          <Database className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-serif-editorial font-bold text-stone-900">No Questions Found</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Try resetting your filters, or use the Content Import studio to ingest questions from official PDFs.
          </p>
          <button
            onClick={() => {
              setSelectedExam('All');
              setSelectedYear('All');
              setSelectedSubject('All');
              setSelectedDifficulty('All');
              setSelectedStatus('All');
              setSearchQuery('');
              fetchQuestions();
            }}
            className="px-4 py-2 bg-stone-900 text-amber-300 text-xs font-bold rounded-xl hover:bg-stone-800 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Questions List */}
      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            const isPyq = !!q.pyqYear || !!q.isPyq || q.tags?.some(t => t.toLowerCase().includes('pyq'));
            const isVerified = q.status === 'READY_TO_PUBLISH' || (q.status as string) === 'APPROVED' || !!q.correctAnswer;
            const qText = getDisplayText(languageMode === 'hi' && q.question_hi ? q.question_hi : (q.question_en || q.question));
            const rawOpts = languageMode === 'hi' && q.options_hi && q.options_hi.length > 0 ? q.options_hi : (q.options_en || q.options || []);
            const explanation = getDisplayText(languageMode === 'hi' && q.explanation_hi ? q.explanation_hi : (q.explanation_en || q.explanation));

            return (
              <div
                key={q.id || idx}
                className={`bg-white border rounded-2xl p-5 space-y-4 transition-all shadow-2xs ${
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/10' : 'border-[#EAE6DF] hover:border-amber-300'
                }`}
              >
                {/* Header / Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectQuestion(q.id)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                    />

                    {/* Source Badge */}
                    {isPyq ? (
                      <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        OFFICIAL PYQ {getDisplayText(q.examTag)} {q.pyqYear ? `(${q.pyqYear})` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                        <Database className="w-3 h-3 text-stone-500" />
                        CANONICAL {getDisplayText(q.examTag) || 'GENERAL'}
                      </span>
                    )}

                    {/* Verification Status Badge */}
                    {isVerified ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Answer Key Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Key Pending
                      </span>
                    )}

                    {/* Difficulty Badge */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-bold">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                  </div>

                  {/* Quick Card Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveQuestion(q);
                        const normalizedOptions = (q.options || []).map((o: any) => getOptionText(o));
                        setEditFormData({
                          ...q,
                          question: getDisplayText(q.question),
                          question_hi: q.question_hi ? getDisplayText(q.question_hi) : '',
                          explanation: q.explanation ? getDisplayText(q.explanation) : '',
                          options: normalizedOptions.length > 0 ? normalizedOptions : ['', '', '', ''],
                        });
                        setIsEditing(true);
                      }}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-stone-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        handleToggleSelectQuestion(q.id);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <ListPlus className="w-3 h-3" />
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="text-sm font-serif-editorial font-bold text-stone-900 leading-relaxed">
                  {qText}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {rawOpts.map((opt, oIdx) => {
                    const letter = ['A', 'B', 'C', 'D', 'E'][oIdx];
                    const optText = getOptionText(opt);
                    const optId = (typeof opt === 'object' && opt !== null && (opt as any).id) ? String((opt as any).id) : letter;
                    const isCorrect = q.correctAnswer?.toUpperCase() === letter || q.correctAnswer?.toUpperCase() === optId.toUpperCase();

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-stone-50/60 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {optId.length === 1 ? optId : letter}
                        </span>
                        <span className="flex-1 pt-0.5">{optText}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {explanation && (
                  <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3 text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider font-mono">
                      Official Solution & Concept Notes
                    </span>
                    <p className="leading-relaxed">{explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-[#EAE6DF] pt-4 text-xs text-stone-600 font-mono">
            <span>
              Page {page} of {totalPages} ({totalCount} total questions)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-[#EAE6DF] rounded-xl font-bold disabled:opacity-40 hover:bg-stone-50 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-[#EAE6DF] rounded-xl font-bold disabled:opacity-40 hover:bg-stone-50 cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {isEditing && activeQuestion && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-700" />
                <span>Edit Canonical Question</span>
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Question Stem (English)</label>
                <textarea
                  rows={3}
                  value={editFormData.question || ''}
                  onChange={e => setEditFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 font-serif-editorial text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Question Stem (Hindi)</label>
                <textarea
                  rows={3}
                  value={editFormData.question_hi || ''}
                  onChange={e => setEditFormData(prev => ({ ...prev, question_hi: e.target.value }))}
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 font-serif-editorial text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter} className="space-y-1">
                    <label className="font-bold text-stone-700">Option {letter}</label>
                    <input
                      type="text"
                      value={typeof editFormData.options?.[idx] === 'string' ? editFormData.options?.[idx] : (editFormData.options?.[idx]?.text || '')}
                      onChange={e => {
                        const nextOpts = [...(editFormData.options || ['', '', '', ''])];
                        const cur = nextOpts[idx];
                        nextOpts[idx] = typeof cur === 'object' && cur !== null ? { ...cur, text: e.target.value } : e.target.value;
                        setEditFormData(prev => ({ ...prev, options: nextOpts }));
                      }}
                      className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Correct Answer</label>
                  <select
                    value={editFormData.correctAnswer || 'A'}
                    onChange={e => setEditFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs font-bold text-emerald-800 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                    <option value="E">Option E</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Difficulty</label>
                  <select
                    value={editFormData.difficulty || 'MEDIUM'}
                    onChange={e => setEditFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Status</label>
                  <select
                    value={editFormData.status || 'READY_TO_PUBLISH'}
                    onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="READY_TO_PUBLISH">Published / Ready</option>
                    <option value="NEEDS_REVIEW">Needs Review</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Explanation / Solution Note</label>
                <textarea
                  rows={3}
                  value={editFormData.explanation || ''}
                  onChange={e => setEditFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-700" />
                <span>Create New Question in Canonical Bank</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Question Stem (English) *</label>
                <textarea
                  rows={3}
                  value={newQuestionForm.question || ''}
                  onChange={e => setNewQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter the question text..."
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 font-serif-editorial text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter} className="space-y-1">
                    <label className="font-bold text-stone-700">Option {letter}</label>
                    <input
                      type="text"
                      value={typeof newQuestionForm.options?.[idx] === 'string' ? newQuestionForm.options?.[idx] : (newQuestionForm.options?.[idx]?.text || '')}
                      onChange={e => {
                        const nextOpts = [...(newQuestionForm.options || ['', '', '', ''])];
                        const cur = nextOpts[idx];
                        nextOpts[idx] = typeof cur === 'object' && cur !== null ? { ...cur, text: e.target.value } : e.target.value;
                        setNewQuestionForm(prev => ({ ...prev, options: nextOpts }));
                      }}
                      placeholder={`Option ${letter} text...`}
                      className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Correct Answer</label>
                  <select
                    value={newQuestionForm.correctAnswer || 'A'}
                    onChange={e => setNewQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs font-bold text-emerald-800 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Subject</label>
                  <select
                    value={newQuestionForm.subjectId || 'sub_polity'}
                    onChange={e => setNewQuestionForm(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Difficulty</label>
                  <select
                    value={newQuestionForm.difficulty || 'MEDIUM'}
                    onChange={e => setNewQuestionForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Explanation / Concept Notes</label>
                <textarea
                  rows={3}
                  value={newQuestionForm.explanation || ''}
                  onChange={e => setNewQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why the answer is correct..."
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewQuestion}
                disabled={isSaving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Create Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

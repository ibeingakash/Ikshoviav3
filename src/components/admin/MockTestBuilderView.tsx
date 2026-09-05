import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  SlidersHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Layers,
  Clock,
  Zap,
  Search,
  ArrowRight,
  ShieldCheck,
  Save,
  Send,
  Eye,
  X,
  HelpCircle,
  BarChart3,
  ListOrdered,
  Archive,
  RotateCcw,
  Database,
  Filter,
  Users,
  ShieldAlert,
  Info,
  Edit2
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { MockTest, Question, Subject } from '../../types/index.js';
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
    try {
      return opt.text || opt.value || opt.label || JSON.stringify(opt);
    } catch {
      return '';
    }
  }
  return String(opt);
};

export const MockTestBuilderView: React.FC = () => {
  const { setActiveSection } = useLearner();

  // Active Tab: 'manage' | 'config' | 'questions' | 'preview'
  const [activeTab, setActiveTab] = useState<'manage' | 'config' | 'questions' | 'preview'>('manage');

  // Admin Mock Management State
  const [adminTests, setAdminTests] = useState<MockTest[]>([]);
  const [testsLoading, setTestsLoading] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchTestQuery, setSearchTestQuery] = useState<string>('');
  const [testToDelete, setTestToDelete] = useState<MockTest | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Test Display Name Editing State
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [savingTitle, setSavingTitle] = useState<boolean>(false);

  const handleStartEditTitle = (test: MockTest) => {
    setEditingTestId(test.id);
    setEditingTitleValue(test.displayName || test.title);
  };

  const handleSaveTitle = async (testId: string) => {
    if (!editingTitleValue.trim()) return;
    setSavingTitle(true);
    try {
      await api.updateMockTest(testId, { displayName: editingTitleValue.trim() });
      setAdminTests(prev => prev.map(t => t.id === testId ? { ...t, displayName: editingTitleValue.trim(), title: editingTitleValue.trim() } : t));
      setEditingTestId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update mock test title');
    } finally {
      setSavingTitle(false);
    }
  };

  // Test Settings for Builder
  const [title, setTitle] = useState<string>('UPSC CSE Prelims Full Mock 2026 - Test 01');
  const [examTag, setExamTag] = useState<string>('UPSC CSE Prelims');
  const [type, setType] = useState<'FULL_LENGTH' | 'SECTIONAL' | 'TOPIC_SPRINT'>('FULL_LENGTH');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [totalQuestions, setTotalQuestions] = useState<number>(100);
  const [marksPerCorrect, setMarksPerCorrect] = useState<number>(2.0);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState<number>(0.666);
  const [instructions, setInstructions] = useState<string>(
    'Standard commission instructions: 120 minutes duration, 1/3rd negative marking for incorrect answers.'
  );
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // Selected Questions for the Mock Test Builder
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Question Bank Browsing / Picker State
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState<boolean>(false);
  const [searchBankQuery, setSearchBankQuery] = useState<string>('');
  const [selectedBankSubject, setSelectedBankSubject] = useState<string>('All');
  const [selectedBankExam, setSelectedBankExam] = useState<string>('All');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadInitialData();
    fetchAdminTests();
  }, []);

  const fetchAdminTests = async () => {
    setTestsLoading(true);
    try {
      const tests = await api.getAdminMockTests({
        includeArchived: true,
      });
      setAdminTests(tests);
    } catch (err) {
      console.error('Failed to fetch admin mock tests:', err);
    } finally {
      setTestsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const subs = await api.getSubjects();
      setSubjects(subs);

      // Check if there are pre-selected questions from Question Bank
      const stored = localStorage.getItem('ikshovia_mock_builder_selected_qs');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (Array.isArray(ids) && ids.length > 0) {
          const fetched: Question[] = [];
          for (const id of ids.slice(0, 30)) {
            try {
              const res = await api.getPracticeQuestions(undefined, undefined, 50);
              const found = res.find(q => q.id === id);
              if (found) fetched.push(found);
            } catch {}
          }
          if (fetched.length > 0) {
            setSelectedQuestions(fetched);
            setTotalQuestions(fetched.length);
            setActiveTab('questions');
          }
          localStorage.removeItem('ikshovia_mock_builder_selected_qs');
        }
      }

      fetchBankQuestions();
    } catch (err) {
      console.error('Failed to load initial mock builder data:', err);
    }
  };

  const fetchBankQuestions = async () => {
    setBankLoading(true);
    try {
      const res = await api.getAdminQuestions({
        subjectId: selectedBankSubject !== 'All' ? selectedBankSubject : undefined,
        searchQuery: searchBankQuery || undefined,
        limit: 30,
      });
      setBankQuestions(res.items || []);
    } catch (err) {
      console.error('Failed to fetch bank questions:', err);
    } finally {
      setBankLoading(false);
    }
  };

  const handleAddQuestionToMock = (q: Question) => {
    if (selectedQuestions.some(item => item.id === q.id)) {
      showToast('Question already in mock test');
      return;
    }
    setSelectedQuestions(prev => [...prev, q]);
    setTotalQuestions(prev => prev + 1);
    showToast(`Added Question #${selectedQuestions.length + 1}`);
  };

  const handleRemoveQuestionFromMock = (qId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== qId));
    setTotalQuestions(prev => Math.max(0, prev - 1));
  };

  const handleAutoFillQuestions = async (count: number) => {
    setBankLoading(true);
    try {
      const qs = await api.getPracticeQuestions(undefined, undefined, count);
      const newUnique = qs.filter(q => !selectedQuestions.some(sq => sq.id === q.id));
      setSelectedQuestions(prev => [...prev, ...newUnique]);
      setTotalQuestions(prev => prev + newUnique.length);
      showToast(`Auto-assembled ${newUnique.length} questions from syllabus!`);
    } catch (err) {
      console.error('Failed to auto-fill questions:', err);
    } finally {
      setBankLoading(false);
    }
  };

  const handleSaveAndPublishMock = async () => {
    if (!title.trim()) {
      showToast('Please enter a mock test title');
      return;
    }
    if (selectedQuestions.length === 0) {
      showToast('Please add at least 1 question to the mock test');
      return;
    }

    setIsSaving(true);
    try {
      const distinctSubjects: string[] = Array.from(
        new Set(selectedQuestions.map(q => q.subjectId).filter((id): id is string => Boolean(id)))
      );
      const res = await api.createCustomMockTest({
        title,
        totalQuestions: selectedQuestions.length,
        durationMinutes,
        examTag,
        type: type === 'FULL_LENGTH' ? 'FULL' : type === 'SECTIONAL' ? 'SUBJECT' : 'QUICK',
        questionIds: selectedQuestions.map(q => q.id),
        subjectIds: distinctSubjects.length > 0 ? distinctSubjects : ['sub_polity', 'sub_economy'],
        sourceType: 'IKSHOVIA_CREATED',
        isPublished: true,
      });

      if (res.success) {
        showToast('Mock Test created and published successfully!');
        await fetchAdminTests();
        setActiveTab('manage');
      }
    } catch (err) {
      console.error('Failed to publish mock test:', err);
      showToast('Failed to save mock test');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteMockTest(testToDelete.id);
      showToast(res.message || 'Mock test safely archived.');
      setTestToDelete(null);
      await fetchAdminTests();
    } catch (err: any) {
      console.error('Failed to delete/archive test:', err);
      showToast(err.message || 'Failed to archive mock test.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (testId: string) => {
    try {
      const res = await api.restoreMockTest(testId);
      showToast(res.message || 'Mock test restored to active practice.');
      await fetchAdminTests();
    } catch (err: any) {
      console.error('Failed to restore test:', err);
      showToast(err.message || 'Failed to restore mock test.');
    }
  };

  // Filtered Admin Mock Tests
  const filteredAdminTests = adminTests.filter(t => {
    const matchesSearch = !searchTestQuery || t.title.toLowerCase().includes(searchTestQuery.toLowerCase()) || t.id.toLowerCase().includes(searchTestQuery.toLowerCase());
    const matchesSource = sourceFilter === 'All' || t.sourceType === sourceFilter;
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'ACTIVE' && (!t.isDeleted && t.isPublished)) ||
      (statusFilter === 'ARCHIVED' && (t.isDeleted || !t.isPublished));
    return matchesSearch && matchesSource && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold border border-amber-500/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Exam Simulation Engine
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {adminTests.length} Total Mock Tests Cataloged
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-amber-700" />
            <span>Mock Test Management & Assembler</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Manage, archive, inspect attempts, or assemble new full-length and sectional mock simulations for UPSC CSE candidates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSection('admin-questions')}
            className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-[#EAE6DF] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            Browse Question Bank
          </button>

          <button
            onClick={() => {
              setActiveTab('config');
            }}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Mock Test</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[#EAE6DF] gap-4 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('manage');
            fetchAdminTests();
          }}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'manage'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manage Mock Catalog ({adminTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>1. Test Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'questions'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>2. Assemble Questions ({selectedQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3. Preview & Calibrate</span>
        </button>
      </div>

      {/* TAB: MANAGE MOCKS */}
      {activeTab === 'manage' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white border border-[#EAE6DF] p-4 rounded-2xl shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTestQuery}
                  onChange={e => setSearchTestQuery(e.target.value)}
                  placeholder="Search by test title or ID..."
                  className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Source Filter */}
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All">All Sources</option>
                  <option value="ADMIN_IMPORTED">Admin / OCR Imported</option>
                  <option value="IKSHOVIA_CREATED">IKSHOVIA Custom</option>
                  <option value="OFFICIAL_COMMISSION">Official Commission</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="ACTIVE">Active (Published)</option>
                  <option value="ARCHIVED">Archived / Removed</option>
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All">All Formats</option>
                  <option value="FULL">Full Length</option>
                  <option value="SUBJECT">Subject / Sectional</option>
                  <option value="QUICK">Topic Sprint</option>
                </select>

                <button
                  onClick={fetchAdminTests}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                  title="Refresh list"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Info Notice about safe archiving */}
            <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-[11px] text-stone-600">
              <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <span>
                <strong>Safe Archiving Guarantee:</strong> Removing or archiving a mock test unpublishes it from the learner practice catalog. Learner attempt histories, analytics scores, and underlying canonical questions remain completely protected and intact in the database.
              </span>
            </div>
          </div>

          {/* Tests List */}
          {testsLoading ? (
            <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin text-amber-600" />
              <span>Loading Mock Test Catalog...</span>
            </div>
          ) : filteredAdminTests.length === 0 ? (
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif-editorial font-bold text-stone-900">
                No mock tests match your filter
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Try adjusting your search criteria or create a new mock test simulation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAdminTests.map(test => {
                const isArchived = !!test.isDeleted || !test.isPublished;
                const isOfficial = test.sourceType === 'OFFICIAL_COMMISSION' || test.id.startsWith('pyq_paper_');
                const isAdminImported = test.sourceType === 'ADMIN_IMPORTED';
                const isIkshovia = test.sourceType === 'IKSHOVIA_CREATED';

                return (
                  <div
                    key={test.id}
                    className={`bg-white border rounded-2xl p-5 space-y-3 transition-all shadow-2xs ${
                      isArchived
                        ? 'border-stone-200 bg-stone-50/70 opacity-80'
                        : 'border-[#EAE6DF] hover:border-amber-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Source Type Badge */}
                        {isOfficial ? (
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            OFFICIAL COMMISSION
                          </span>
                        ) : isAdminImported ? (
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Database className="w-3 h-3 text-blue-600" />
                            ADMIN / OCR IMPORTED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            IKSHOVIA CUSTOM
                          </span>
                        )}

                        {/* Format Badge */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                          {test.type === 'FULL' ? 'FULL LENGTH' : test.type === 'SUBJECT' ? 'SECTIONAL' : 'TOPIC SPRINT'}
                        </span>

                        {/* Status Badge */}
                        {isArchived ? (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1">
                            <Archive className="w-3 h-3" />
                            ARCHIVED / UNPUBLISHED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE IN CATALOG
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-stone-400">
                          ID: {test.id}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {isArchived ? (
                          <button
                            onClick={() => handleRestore(test.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore to Catalog</span>
                          </button>
                        ) : isOfficial ? (
                          <span
                            title="Official commission papers cannot be removed to preserve exam authenticity."
                            className="px-3 py-1.5 bg-stone-100 text-stone-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-not-allowed"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
                            <span>Protected Official</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setTestToDelete(test)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Archive / Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Test Title & Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        {editingTestId === test.id ? (
                          <div className="flex items-center gap-2 max-w-xl">
                            <input
                              type="text"
                              value={editingTitleValue}
                              onChange={(e) => setEditingTitleValue(e.target.value)}
                              placeholder="Enter clean public display title..."
                              className="flex-1 text-sm font-semibold text-stone-900 border border-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/40"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(test.id);
                                if (e.key === 'Escape') setEditingTestId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveTitle(test.id)}
                              disabled={savingTitle || !editingTitleValue.trim()}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingTitle ? 'Saving...' : 'Save'}</span>
                            </button>
                            <button
                              onClick={() => setEditingTestId(null)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 group">
                            <div>
                              <h3 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                                <span>{test.displayName || test.title}</span>
                                <button
                                  onClick={() => handleStartEditTitle(test)}
                                  title="Edit public display title"
                                  className="opacity-60 hover:opacity-100 text-stone-400 hover:text-amber-700 p-1 rounded transition-opacity cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </h3>
                              {test.originalSourceName && (
                                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                                  Source File: <span className="text-stone-700">{test.originalSourceName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {test.durationMinutes} Mins
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-stone-400" />
                            {test.actualQuestionCount || test.totalQuestions} Questions
                          </span>
                          <span>•</span>
                          <span>{test.totalMarks} Marks</span>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold">
                            -{test.negativeMarkingRate} penalty
                          </span>
                        </div>
                      </div>

                      {/* Learner Attempts Metric */}
                      <div className="bg-[#FCFBF9] border border-stone-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs">
                        <Users className="w-4 h-4 text-stone-500" />
                        <div>
                          <div className="font-bold text-stone-900 font-mono">
                            {test.attemptCount || 0} Attempts
                          </div>
                          <div className="text-[10px] text-stone-400">
                            Learner submissions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete / Archive Confirmation Modal */}
          {testToDelete && (
            <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-serif-editorial font-bold text-stone-900">
                      Archive Mock Test?
                    </h3>
                    <p className="text-xs text-stone-600">
                      You are archiving <strong>"{testToDelete.title}"</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-stone-700 space-y-2">
                  <span className="font-bold text-amber-900 block font-mono text-[11px] uppercase tracking-wider">
                    Safety & Integrity Checks
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li>This test will be immediately hidden from the learner Mock Tests practice catalog.</li>
                    <li>
                      <strong>{testToDelete.attemptCount || 0} learner attempt records</strong> and analysis metrics will remain 100% intact and preserved.
                    </li>
                    <li>All underlying canonical questions remain in the Question Bank.</li>
                    <li>You can restore this test at any time with a single click.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setTestToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#EAE6DF] text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>Confirm Safe Archive</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: Test Configuration */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-5 shadow-2xs">
            <h2 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-700" />
              <span>Exam Metadata & Timing Parameters</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Mock Test Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., UPSC CSE 2026 GS Paper 1 All-India Mock #03"
                  className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs text-stone-900 font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Exam Target / Format</label>
                  <input
                    type="text"
                    value={examTag}
                    onChange={e => setExamTag(e.target.value)}
                    className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Test Archetype</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs font-bold text-stone-800 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="FULL_LENGTH">Full-Length Comprehensive Mock</option>
                    <option value="SECTIONAL">Sectional / Subject-Focused Test</option>
                    <option value="TOPIC_SPRINT">Topic Sprint / Rapid Drill</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 60)}
                    className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Marks Per Correct</label>
                  <input
                    type="number"
                    step="0.1"
                    value={marksPerCorrect}
                    onChange={e => setMarksPerCorrect(parseFloat(e.target.value) || 2.0)}
                    className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Penalty Per Wrong</label>
                  <input
                    type="number"
                    step="0.001"
                    value={penaltyPerWrong}
                    onChange={e => setPenaltyPerWrong(parseFloat(e.target.value) || 0.666)}
                    className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs font-mono font-bold text-rose-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Candidate Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                onClick={() => setActiveTab('questions')}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Assemble Questions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-4 shadow-2xs h-fit">
            <h3 className="text-sm font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Assembly Calibration</span>
            </h3>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span>Selected Questions</span>
                <span className="font-mono font-bold text-stone-900">{selectedQuestions.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span>Estimated Test Marks</span>
                <span className="font-mono font-bold text-stone-900">
                  {(selectedQuestions.length * marksPerCorrect).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span>Pace Per Question</span>
                <span className="font-mono font-bold text-stone-900">
                  {selectedQuestions.length > 0
                    ? `${((durationMinutes * 60) / selectedQuestions.length).toFixed(0)}s`
                    : '0s'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleAutoFillQuestions(20)}
                disabled={bankLoading}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>Auto-Fill 20 Standard Questions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Assemble Questions */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Attached Questions */}
          <div className="bg-white border border-[#EAE6DF] p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Assembled Questions ({selectedQuestions.length})</span>
                </h3>
                <p className="text-[11px] text-stone-500">Questions currently part of this mock test.</p>
              </div>

              {selectedQuestions.length > 0 && (
                <button
                  onClick={() => setSelectedQuestions([])}
                  className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-stone-300" />
                <p>No questions added yet. Pick from the bank on the right or auto-fill.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {selectedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3 bg-[#FCFBF9] border border-stone-200 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-600 text-[10px]">
                        #{idx + 1} • {getDisplayText(q.examTag) || 'CANONICAL'}
                      </span>
                      <button
                        onClick={() => handleRemoveQuestionFromMock(q.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-serif-editorial font-bold text-stone-900 line-clamp-2">
                      {getDisplayText(q.question_en || q.question)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Question Bank Browser */}
          <div className="bg-white border border-[#EAE6DF] p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="border-b border-stone-100 pb-3 space-y-3">
              <h3 className="text-sm font-serif-editorial font-bold text-stone-900">
                Browse & Attach from Question Bank
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchBankQuery}
                  onChange={e => setSearchBankQuery(e.target.value)}
                  placeholder="Search bank questions..."
                  className="flex-1 bg-[#FCFBF9] border border-[#EAE6DF] rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={fetchBankQuestions}
                  className="px-3 py-1.5 bg-stone-900 text-amber-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {bankLoading && (
              <div className="py-8 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                Loading questions...
              </div>
            )}

            {!bankLoading && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {bankQuestions.map(q => {
                  const isAdded = selectedQuestions.some(item => item.id === q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        isAdded ? 'bg-emerald-50/40 border-emerald-200' : 'bg-[#FCFBF9] border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {getDisplayText(q.examTag) || 'CANONICAL'} • {q.difficulty || 'MEDIUM'}
                        </span>
                        <button
                          onClick={() => (isAdded ? handleRemoveQuestionFromMock(q.id) : handleAddQuestionToMock(q))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isAdded
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                              : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                          }`}
                        >
                          {isAdded ? 'Remove' : 'Add to Mock'}
                        </button>
                      </div>
                      <p className="font-serif-editorial font-bold text-stone-900 line-clamp-2">
                        {getDisplayText(q.question_en || q.question)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Preview */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-6 shadow-2xs">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-serif-editorial font-bold text-stone-900">{title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono mt-2">
              <span>{examTag}</span>
              <span>•</span>
              <span>{durationMinutes} Minutes</span>
              <span>•</span>
              <span>{selectedQuestions.length} Questions</span>
              <span>•</span>
              <span>+{marksPerCorrect} / -{penaltyPerWrong} Marking</span>
            </div>
          </div>

          <div className="space-y-4">
            {selectedQuestions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 bg-[#FCFBF9] border border-stone-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Question {idx + 1}
                  </span>
                  <span className="text-stone-400 font-mono text-[10px]">ID: {q.id}</span>
                </div>
                <div className="font-serif-editorial font-bold text-stone-900 text-sm">
                  {getDisplayText(q.question_en || q.question)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(q.options_en || q.options || []).map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border flex items-center gap-2 ${
                        q.correctAnswer?.toUpperCase() === ['A', 'B', 'C', 'D'][oIdx]
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center font-mono font-bold text-[10px]">
                        {['A', 'B', 'C', 'D'][oIdx]}
                      </span>
                      <span>{getOptionText(opt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <button
              onClick={handleSaveAndPublishMock}
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Publish Mock Test</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

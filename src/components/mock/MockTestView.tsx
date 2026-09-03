import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  RotateCcw,
  Zap,
  ShieldCheck,
  GraduationCap,
  Layers,
  CheckCircle,
  LayoutGrid,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Bot,
  Flame,
  FolderArchive
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { MockTest, Question, Subject, MockAttempt } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import confetti from 'canvas-confetti';

export const MockTestView: React.FC = () => {
  const { refreshLearnerData, setActiveSection, askTutorWithContext } = useLearner();

  // Active Category Tab: 'ALL' | 'FULL' | 'SUBJECT' | 'QUICK' | 'HISTORY'
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FULL' | 'SUBJECT' | 'QUICK' | 'HISTORY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IKSHOVIA_CREATED' | 'ADMIN_IMPORTED'>('ALL');

  // Standard Mock Test States
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [historyAttempts, setHistoryAttempts] = useState<MockAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Test Execution State
  const [activeTestMeta, setActiveTestMeta] = useState<{
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    totalQuestions: number;
    marksPerCorrect: number;
    penaltyPerWrong: number;
    sourceType?: string;
  } | null>(null);

  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [inTest, setInTest] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');

  // Custom Mock Test Generator Modal state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(20);
  const [customDuration, setCustomDuration] = useState<number>(25);
  const [customExam, setCustomExam] = useState<string>('UPSC CSE Prelims');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(['sub_polity', 'sub_economy']);
  const [isGenerating, setIsGenerating] = useState(false);

  // Timer state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Countdown timer for active mock test
  useEffect(() => {
    let timer: any = null;
    if (inTest && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inTest, timeRemainingSeconds]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [testsRes, subsRes] = await Promise.all([
        api.getMockTests(),
        api.getSubjects(),
      ]);
      setMockTests(Array.isArray(testsRes) ? testsRes : []);
      setAllSubjects(Array.isArray(subsRes) ? subsRes : []);

      try {
        const histRes = await api.getMockTestHistory();
        setHistoryAttempts(Array.isArray(histRes) ? histRes : []);
      } catch {}
    } catch (e) {
      console.error('Failed to load mock tests:', e);
    } finally {
      setLoading(false);
    }
  };

  // Launch Standard or Custom Mock Test
  const handleStartStandardTest = async (test: MockTest) => {
    const isBpsc = test.title.toLowerCase().includes('bpsc');
    const marksPerCorrect = isBpsc ? 1.0 : 2.0;
    const penaltyPerWrong = isBpsc ? 0.33 : test.negativeMarkingRate || 0.66;
    const duration = test.durationMinutes || (test.totalQuestions >= 50 ? 120 : 25);

    setActiveTestMeta({
      id: test.id,
      title: test.title,
      type: test.type,
      durationMinutes: duration,
      totalQuestions: test.totalQuestions || 20,
      marksPerCorrect,
      penaltyPerWrong,
      sourceType: test.sourceType,
    });

    setLoading(true);
    try {
      const testDetails = await api.getMockTest(test.id);
      let qs: Question[] = [];
      if (testDetails && Array.isArray(testDetails.questions) && testDetails.questions.length > 0) {
        qs = testDetails.questions;
      } else {
        const count = test.totalQuestions || 20;
        qs = await api.getPracticeQuestions(test.subjectIds?.[0], undefined, count);
      }
      setTestQuestions(qs);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setMarkedForReview({});
      setTimeRemainingSeconds(duration * 60);
      setInTest(true);
      setSubmittedResult(null);
    } catch (e) {
      console.error('Error starting test:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomTest = async () => {
    setIsGenerating(true);
    try {
      const res = await api.createCustomMockTest({
        title: customTitle || `${customExam} Custom Sprint (${customQuestionCount} Questions)`,
        totalQuestions: customQuestionCount,
        durationMinutes: customDuration,
        subjectIds: selectedSubjectIds,
        examTag: customExam,
        type: customQuestionCount >= 50 ? 'FULL' : customQuestionCount >= 20 ? 'SUBJECT' : 'QUICK',
        sourceType: 'IKSHOVIA_CREATED',
      });

      if (res.success && res.test) {
        setMockTests(prev => [res.test, ...prev]);
        setShowCustomBuilder(false);
        await handleStartStandardTest(res.test);
      }
    } catch (e) {
      console.error('Failed to generate custom test:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTestMeta) return;
    setLoading(true);
    try {
      const timeSpentSeconds = (activeTestMeta.durationMinutes * 60) - timeRemainingSeconds;
      
      let correct = 0;
      let incorrect = 0;
      testQuestions.forEach(q => {
        const chosen = userAnswers[q.id];
        if (chosen !== undefined && chosen !== null) {
          if (chosen.toUpperCase() === q.correctAnswer?.toUpperCase()) {
            correct++;
          } else {
            incorrect++;
          }
        }
      });

      const totalAttempted = correct + incorrect;
      const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
      const score = Math.max(0, (correct * activeTestMeta.marksPerCorrect) - (incorrect * activeTestMeta.penaltyPerWrong)).toFixed(2);
      const maxScore = (testQuestions.length * activeTestMeta.marksPerCorrect).toFixed(0);

      const mockAttempt = {
        mockTitle: activeTestMeta.title,
        score,
        maxScore,
        accuracy,
        timeTakenSeconds: Math.max(10, timeSpentSeconds),
        totalQuestions: testQuestions.length,
        totalAttempted,
        correctCount: correct,
        incorrectCount: incorrect,
        unattemptedCount: testQuestions.length - totalAttempted,
      };

      setSubmittedResult(mockAttempt);
      setInTest(false);

      // Attempt to record in backend
      try {
        await api.submitMockTest(activeTestMeta.id, userAnswers, Math.max(10, timeSpentSeconds));
      } catch {}

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      refreshLearnerData();
    } catch (e) {
      console.error('Failed to submit test:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter mock tests
  const filteredTests = mockTests.filter(t => {
    if (activeCategory !== 'ALL' && activeCategory !== 'HISTORY') {
      if (t.type !== activeCategory) return false;
    }
    if (sourceFilter !== 'ALL') {
      if (t.sourceType !== sourceFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      if (!matchTitle) return false;
    }
    return true;
  });

  const currentQ = testQuestions[currentQuestionIndex];

  // -------------------------------------------------------------
  // RENDER: Active Mock Test Execution View
  // -------------------------------------------------------------
  if (inTest && activeTestMeta && testQuestions.length > 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 pb-16 animate-fade-in font-sans-editorial">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end this mock test simulation?')) {
                  setInTest(false);
                  setActiveTestMeta(null);
                }
              }}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors cursor-pointer"
              title="Exit Test"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {activeTestMeta.sourceType === 'ADMIN_IMPORTED' ? 'ADMIN IMPORTED' : 'IKSHOVIA CUSTOM'}
                </span>
                <span className="text-[11px] font-mono text-stone-500">
                  Q {currentQuestionIndex + 1} of {testQuestions.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate max-w-md">
                {activeTestMeta.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setDisplayLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  displayLanguage === 'en' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setDisplayLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  displayLanguage === 'hi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                HI
              </button>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitTest}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Question + Palette Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3 space-y-4">
            {currentQ && (
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-700 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {currentQ.questionType === 'MATCH_FOLLOWING' ? 'Match the Following' : currentQ.questionType === 'STATEMENT_BASED' ? 'Statement Based' : 'Multiple Choice Question'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleMarkForReview(currentQ.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        markedForReview[currentQ.id]
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{markedForReview[currentQ.id] ? 'Marked' : 'Mark for Review'}</span>
                    </button>

                    <button
                      onClick={() => askTutorWithContext(currentQ.question, `Mock Test: ${activeTestMeta.title}`)}
                      className="p-1.5 rounded-lg bg-stone-50 hover:bg-indigo-50 text-stone-600 hover:text-indigo-800 border border-stone-200 transition-colors cursor-pointer"
                      title="Ask AI Tutor"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <QuestionRenderer
                  question={currentQ}
                  language={displayLanguage}
                  selectedOptionId={userAnswers[currentQ.id]}
                  onSelectOption={(optId) => handleSelectOption(currentQ.id, optId)}
                  showCorrectAnswer={false}
                />

                {/* Navigation controls */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentQuestionIndex === 0
                        ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono text-stone-400">
                    {currentQuestionIndex + 1} / {testQuestions.length}
                  </span>

                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(testQuestions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === testQuestions.length - 1}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentQuestionIndex === testQuestions.length - 1
                        ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-2xs'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Palette */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 space-y-4">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Question Palette
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-stone-500 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
                    <span>Answered ({Object.keys(userAnswers).length})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>
                    <span>Review ({Object.values(markedForReview).filter(Boolean).length})</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-[380px] overflow-y-auto p-1">
                {testQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let btnStyle = 'bg-stone-50 text-stone-600 border-stone-200';
                  if (isCurrent) {
                    btnStyle = 'bg-stone-900 text-white border-stone-900 font-bold ring-2 ring-indigo-500';
                  } else if (isMarked) {
                    btnStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitTest}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Submit Mock Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Submission Diagnostics Modal / View
  // -------------------------------------------------------------
  if (submittedResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in font-sans-editorial">
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold font-mono">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>MOCK TEST DIAGNOSTIC SCORECARD</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-editorial text-stone-900">
              {submittedResult.mockTitle}
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Completed in {Math.floor(submittedResult.timeTakenSeconds / 60)} minutes • Detailed Accuracy Analysis
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Score</span>
              <span className="text-2xl sm:text-3xl font-bold text-indigo-900 font-mono">
                {submittedResult.score} <span className="text-xs text-stone-400 font-normal">/ {submittedResult.maxScore}</span>
              </span>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Accuracy</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono">
                {submittedResult.accuracy}%
              </span>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Correct</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">
                {submittedResult.correctCount}
              </span>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Incorrect</span>
              <span className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono">
                {submittedResult.incorrectCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-100">
            <button
              onClick={() => setActiveSection('analytics')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Weak Concepts in Analytics</span>
            </button>

            <button
              onClick={() => {
                setSubmittedResult(null);
                loadInitialData();
              }}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Mock Test Catalog</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Mock Tests Catalog & Custom Builder View
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
              MOCK SIMULATION ENGINE
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              IKSHOVIA Custom & Admin Imported Tests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-indigo-700" />
            <span>Mock Tests & Simulations</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Full-length simulations, sectional subject drills, topic sprints, and custom AI test assemblies with instant diagnostics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveSection('pyq-practice')}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-800" />
            <span>Official PYQ Practice</span>
          </button>

          <button
            onClick={() => setShowCustomBuilder(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Build Custom Sprint</span>
          </button>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Mocks ({mockTests.length})
          </button>

          <button
            onClick={() => setActiveCategory('FULL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === 'FULL'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Full Length ({mockTests.filter(t => t.type === 'FULL').length})
          </button>

          <button
            onClick={() => setActiveCategory('SUBJECT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === 'SUBJECT'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Subject Tests ({mockTests.filter(t => t.type === 'SUBJECT').length})
          </button>

          <button
            onClick={() => setActiveCategory('QUICK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === 'QUICK'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Topic Sprints ({mockTests.filter(t => t.type === 'QUICK').length})
          </button>

          <button
            onClick={() => setActiveCategory('HISTORY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === 'HISTORY'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            My Attempts ({historyAttempts.length})
          </button>
        </div>

        {/* Source & Search Filters */}
        <div className="flex items-center gap-3">
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as any)}
            aria-label="Filter tests by origin"
            className="bg-stone-50 px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Origins</option>
            <option value="IKSHOVIA_CREATED">IKSHOVIA Custom</option>
            <option value="ADMIN_IMPORTED">Admin Imported</option>
          </select>

          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search mocks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* History View vs Catalog View */}
      {activeCategory === 'HISTORY' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          {historyAttempts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Award className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No mock tests attempted yet</p>
              <p className="text-xs text-stone-400">Launch any full-length mock or rapid sprint above to start building your diagnostic history.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {historyAttempts.map(h => (
                  <tr key={h.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-bold text-stone-800">{h.mockTitle}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{h.score} / {h.maxScore}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{h.accuracy}%</td>
                    <td className="py-3 px-4 text-stone-500">{Math.round((h.timeTakenSeconds || 0) / 60)} mins</td>
                    <td className="py-3 px-4 text-stone-400">{new Date(h.completedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-500 text-xs font-mono">Loading mock test simulations...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No mock tests found</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Try adjusting your search query or generate a new custom sprint with your desired subjects.
          </p>
          <button
            onClick={() => setShowCustomBuilder(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Custom Sprint</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map(test => {
            const isFull = test.type === 'FULL';
            const isSubject = test.type === 'SUBJECT';

            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-stone-200/90 hover:border-indigo-400/80 shadow-2xs hover:shadow-sm transition-all duration-150 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Origin Badge & Type Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                      test.sourceType === 'ADMIN_IMPORTED'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {test.sourceType === 'ADMIN_IMPORTED' ? 'ADMIN IMPORTED' : 'IKSHOVIA CUSTOM'}
                    </span>

                    <span className="text-[10px] font-bold font-mono text-stone-500 uppercase tracking-wider">
                      {isFull ? 'Full Mock' : isSubject ? 'Sectional' : 'Rapid Sprint'}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-bold font-serif-editorial text-stone-900 leading-snug">
                      {test.title}
                    </h3>
                  </div>

                  {/* Test Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Questions</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">
                        {test.totalQuestions || 20}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Duration</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">
                        {test.durationMinutes || 25} Mins
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Marks</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">
                        {test.totalMarks || (test.totalQuestions ? test.totalQuestions * 2 : 40)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => handleStartStandardTest(test)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Start Mock Test</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Sprint Builder Modal */}
      {showCustomBuilder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-fade-in font-sans-editorial">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-stone-900">Custom Mock Sprint Builder</h3>
              </div>
              <button
                onClick={() => setShowCustomBuilder(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Exam */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Target Exam</label>
                <select
                  value={customExam}
                  onChange={e => setCustomExam(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-hidden"
                >
                  <option value="UPSC CSE Prelims">UPSC CSE Prelims</option>
                  <option value="71st BPSC CCE Prelims">71st BPSC CCE Prelims</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Polity & Economy 20-Q Sprint"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              {/* Questions & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Questions</label>
                  <select
                    value={customQuestionCount}
                    onChange={e => {
                      const count = Number(e.target.value);
                      setCustomQuestionCount(count);
                      setCustomDuration(Math.round(count * 1.25));
                    }}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-hidden"
                  >
                    <option value={10}>10 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={30}>30 Questions</option>
                    <option value={50}>50 Questions</option>
                    <option value={100}>100 Questions (Full Mock)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={e => setCustomDuration(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">Include Subjects</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
                  {allSubjects.map(s => {
                    const isChecked = selectedSubjectIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedSubjectIds(prev => [...prev, s.id]);
                            } else {
                              setSelectedSubjectIds(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                onClick={() => setShowCustomBuilder(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleGenerateCustomTest}
                disabled={isGenerating || selectedSubjectIds.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Assembling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate & Start</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

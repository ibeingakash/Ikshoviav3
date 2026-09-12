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
  FolderArchive,
  Eye,
  Play
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { MockTest, Question, Subject, MockAttempt } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import { getMockDisplayTitle } from '../../utils/mockUtils.js';
import confetti from 'canvas-confetti';
import { registerBackButtonHandler, registerAppStateChangeHandler } from '../../lib/capacitor.js';
import { queueMockAnswer, queueMockSubmission } from '../../lib/offlineQueue.js';
import { ExamExitModal } from '../common/ExamExitModal.js';
import { WifiOff } from 'lucide-react';

export const MockTestView: React.FC = () => {
  const { refreshLearnerData, setActiveSection, askTutorWithContext, activeSection } = useLearner();

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
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [inReviewMode, setInReviewMode] = useState(false);
  const [reviewOrigin, setReviewOrigin] = useState<'SCORECARD' | 'HISTORY'>('SCORECARD');
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');

  // Custom Mock Test Generator Modal state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(20);
  const [customDuration, setCustomDuration] = useState<number>(25);
  const [customExam, setCustomExam] = useState<string>('UPSC CSE Prelims');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(['sub_polity', 'sub_economy']);
  const [isGenerating, setIsGenerating] = useState(false);

  // Timer & Lifecycle state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [testEndTimestamp, setTestEndTimestamp] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    loadInitialData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Countdown timer for active mock test with background/foreground resilience
  useEffect(() => {
    if (!inTest || !testEndTimestamp) return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((testEndTimestamp - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
      if (remaining <= 0) {
        handleSubmitTest();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    // Re-synchronize timer immediately when app returns from background
    const unregisterAppState = registerAppStateChangeHandler(isActive => {
      if (isActive) {
        tick();
      }
    });

    return () => {
      clearInterval(interval);
      unregisterAppState();
    };
  }, [inTest, testEndTimestamp]);

  // Protect active mock test from accidental Android back button navigation
  useEffect(() => {
    if (inTest) {
      (window as any).__IKSHOVIA_ACTIVE_TEST__ = true;
      const unregister = registerBackButtonHandler(() => {
        setShowExitModal(true);
        return true; // consumed, prevent silent exit
      });
      return () => {
        (window as any).__IKSHOVIA_ACTIVE_TEST__ = false;
        unregister();
      };
    } else {
      (window as any).__IKSHOVIA_ACTIVE_TEST__ = false;
    }
  }, [inTest]);

  useEffect(() => {
    if (activeSection === 'mock-attempts') {
      setActiveCategory('HISTORY');
    }
  }, [activeSection]);

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

        const reviewAttemptId = sessionStorage.getItem('review_attempt_id');
        if (reviewAttemptId) {
          sessionStorage.removeItem('review_attempt_id');
          await handleReviewHistoricalAttempt({ id: reviewAttemptId } as any);
        }
      } catch {}
    } catch (e) {
      console.error('Failed to load mock tests:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatAttemptDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '< 1 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} mins`;
  };

  // Launch Standard or Custom Mock Test (with optional forceNew to retake fresh)
  const handleStartStandardTest = async (test: MockTest, forceNew = false) => {
    const displayTitle = getMockDisplayTitle(test);
    const isBpsc = displayTitle.toLowerCase().includes('bpsc') || (test.title || '').toLowerCase().includes('bpsc');
    const marksPerCorrect = isBpsc ? 1.0 : 2.0;
    const penaltyPerWrong = isBpsc ? 0.33 : test.negativeMarkingRate || 0.66;
    const duration = test.durationMinutes || (test.totalQuestions >= 50 ? 120 : 25);

    setActiveTestMeta({
      id: test.id,
      title: displayTitle,
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
      let remainingSec = duration * 60;
      setTestEndTimestamp(Date.now() + (remainingSec * 1000));
      setTimeRemainingSeconds(remainingSec);
      setInTest(true);
      setInReviewMode(false);
      setSubmittedResult(null);

      // Attempt to start or resume a tracked session on the backend
      try {
        const startRes = await api.startMockAttempt(test.id, forceNew);
        if (startRes?.attempt?.id) {
          setCurrentAttemptId(startRes.attempt.id);

          // If resuming an ongoing attempt, calculate remaining time accurately
          if (!forceNew && startRes.attempt.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(startRes.attempt.startedAt).getTime()) / 1000);
            remainingSec = Math.max(10, (duration * 60) - elapsed);
            setTimeRemainingSeconds(remainingSec);
            setTestEndTimestamp(Date.now() + (remainingSec * 1000));
          }

          // Restore previously saved answers if resuming an in-progress attempt
          if (Array.isArray(startRes.answers) && startRes.answers.length > 0) {
            const restoredAnswers: Record<string, string> = {};
            const restoredMarked: Record<string, boolean> = {};
            startRes.answers.forEach((ans: any) => {
              if (ans.questionId && ans.userAnswer) {
                restoredAnswers[ans.questionId] = ans.userAnswer;
              }
              if (ans.questionId && ans.markedForReview) {
                restoredMarked[ans.questionId] = true;
              }
            });
            setUserAnswers(restoredAnswers);
            setMarkedForReview(restoredMarked);
          }
        } else {
          setCurrentAttemptId(null);
        }
      } catch {
        setCurrentAttemptId(null);
      }
    } catch (e) {
      console.error('Error starting test:', e);
    } finally {
      setLoading(false);
    }
  };

  // Review a submitted attempt without retaking
  const handleReviewHistoricalAttempt = async (attempt: MockAttempt) => {
    setLoading(true);
    try {
      const res = await api.getMockAttempt(attempt.id);
      if (res?.success) {
        const questions = res.questions || [];
        const answersMap: Record<string, string> = {};
        if (Array.isArray(res.answers)) {
          res.answers.forEach((ans: any) => {
            if (ans.questionId && ans.userAnswer) {
              answersMap[ans.questionId] = ans.userAnswer;
            }
          });
        }

        let correct = 0;
        let incorrect = 0;
        questions.forEach(q => {
          const userAns = answersMap[q.id];
          if (userAns !== undefined && userAns !== null && userAns !== '') {
            const userUpper = String(userAns).trim().toUpperCase();
            const correctUpper = String(q.correctAnswer).trim().toUpperCase();
            if (userUpper === correctUpper) {
              correct++;
            } else {
              incorrect++;
            }
          }
        });

        const totalAttempted = correct + incorrect;

        setTestQuestions(questions);
        setUserAnswers(answersMap);
        setSubmittedResult({
          ...res.attempt,
          totalQuestions: questions.length,
          totalAttempted,
          correctCount: correct,
          incorrectCount: incorrect,
          unattemptedCount: Math.max(0, questions.length - totalAttempted),
        });
        setReviewOrigin('HISTORY');
        setInReviewMode(true);
        setInTest(false);
        setCurrentQuestionIndex(0);
      }
    } catch (err) {
      console.error('Failed to review attempt:', err);
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

    // Persist answer in backend attempt if active, or queue locally if network drops
    if (currentAttemptId) {
      const timeSpent = activeTestMeta
        ? (activeTestMeta.durationMinutes * 60) - timeRemainingSeconds
        : 0;
      const marked = Boolean(markedForReview[questionId]);

      if (!navigator.onLine) {
        queueMockAnswer({
          attemptId: currentAttemptId,
          questionId,
          userAnswer: optionId,
          timeSpentSeconds: Math.max(1, timeSpent),
          markedForReview: marked,
          timestamp: Date.now(),
        });
      } else {
        api.saveMockAnswer(currentAttemptId, questionId, optionId, Math.max(1, timeSpent), marked)
          .then(res => {
            if (res === null) {
              queueMockAnswer({
                attemptId: currentAttemptId,
                questionId,
                userAnswer: optionId,
                timeSpentSeconds: Math.max(1, timeSpent),
                markedForReview: marked,
                timestamp: Date.now(),
              });
            }
          })
          .catch(() => {
            queueMockAnswer({
              attemptId: currentAttemptId,
              questionId,
              userAnswer: optionId,
              timeSpentSeconds: Math.max(1, timeSpent),
              markedForReview: marked,
              timestamp: Date.now(),
            });
          });
      }
    }
  };

  const handleClearResponse = (questionId: string) => {
    setUserAnswers(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    if (currentAttemptId) {
      api.saveMockAnswer(currentAttemptId, questionId, '').catch(() => {});
    }
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const updated = {
        ...prev,
        [questionId]: !prev[questionId],
      };
      if (currentAttemptId && userAnswers[questionId]) {
        api.saveMockAnswer(currentAttemptId, questionId, userAnswers[questionId], undefined, updated[questionId]).catch(() => {});
      }
      return updated;
    });
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
        if (chosen !== undefined && chosen !== null && chosen !== '') {
          const chosenUpper = String(chosen).trim().toUpperCase();
          const correctUpper = String(q.correctAnswer).trim().toUpperCase();
          
          // BPSC Option E "Not Attempted" safe skip rule
          const optionsList = q.options || [];
          const optE = optionsList.find(o => String(o.id).toUpperCase() === 'E');
          const isOptENotAttempted = optE && (
            (optE.text || '').toLowerCase().includes('not attempted') ||
            (optE.text || '').toLowerCase().includes('अनुत्तरित') ||
            (optE.text || '').toLowerCase().includes('unattempted')
          );

          if (chosenUpper === 'E' && isOptENotAttempted && correctUpper !== 'E') {
            // Candidate intentionally marked Not Attempted - 0 marks, 0 penalty
          } else if (chosenUpper === correctUpper) {
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
      setInReviewMode(false);

      // Attempt to record in backend, or queue if network fails
      try {
        await api.submitMockTest(activeTestMeta.id, userAnswers, Math.max(10, timeSpentSeconds));
      } catch (submitErr) {
        console.warn('Network submission failed, queueing for automatic background sync:', submitErr);
        queueMockSubmission({
          mockTestId: activeTestMeta.id,
          answers: userAnswers,
          timeTakenSeconds: Math.max(10, timeSpentSeconds),
          timestamp: Date.now(),
        });
      }

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
              onClick={() => setShowExitModal(true)}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Exit Test"
              aria-label="Exit Test"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {activeTestMeta.sourceType === 'ADMIN_IMPORTED' ? 'ADMIN IMPORTED' : 'IKSHOVIA CUSTOM'}
                </span>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                    <WifiOff className="w-3 h-3 text-amber-700" />
                    <span>Offline (Saved)</span>
                  </span>
                )}
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
                    {userAnswers[currentQ.id] !== undefined && userAnswers[currentQ.id] !== '' && (
                      <button
                        type="button"
                        onClick={() => handleClearResponse(currentQ.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}

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
                  questionNumber={currentQuestionIndex + 1}
                  language={displayLanguage}
                  selectedOption={userAnswers[currentQ.id]}
                  selectedOptionId={userAnswers[currentQ.id]}
                  onSelectOption={(optId) => handleSelectOption(currentQ.id, optId)}
                  mode="interactive"
                  showSolution={false}
                  showCorrectAnswer={false}
                  marks={activeTestMeta?.marksPerCorrect || 2.0}
                  negativeMarks={activeTestMeta?.penaltyPerWrong || 0.66}
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
                <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-stone-500 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
                    <span>Answered ({Object.values(userAnswers).filter(a => a !== undefined && a !== '').length})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>
                    <span>Review ({Object.values(markedForReview).filter(Boolean).length})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-stone-300 inline-block"></span>
                    <span>Unanswered ({testQuestions.length - Object.values(userAnswers).filter(a => a !== undefined && a !== '').length})</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-[380px] overflow-y-auto p-1">
                {testQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let btnStyle = 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
                  if (isCurrent) {
                    btnStyle = 'bg-stone-900 text-white border-stone-900 font-bold ring-2 ring-indigo-500';
                  } else if (isMarked) {
                    btnStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSubmitTest}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer min-h-[44px]"
              >
                Submit Mock Test
              </button>
            </div>
          </div>
        </div>

        {/* Exit Protection Confirmation Modal */}
        <ExamExitModal
          isOpen={showExitModal}
          title="Leave this test?"
          message="An active mock test is in progress. Leaving now will interrupt your examination attempt. Your selected answers have been saved."
          continueLabel="Continue Test"
          leaveLabel="Leave Test"
          onContinue={() => setShowExitModal(false)}
          onLeave={() => {
            setShowExitModal(false);
            setInTest(false);
            setActiveTestMeta(null);
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Review Mode (Post-submission solution walkthrough)
  // -------------------------------------------------------------
  if (inReviewMode && submittedResult) {
    const currentQ = testQuestions[currentQuestionIndex];
    return (
      <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                SOLUTION & DETAILED EXPLANATION REVIEW
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                Score: {submittedResult.score} / {submittedResult.maxScore}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 mt-1">
              {submittedResult.mockTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setDisplayLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  displayLanguage === 'en' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setDisplayLanguage('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  displayLanguage === 'hi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                }`}
              >
                HI
              </button>
            </div>

            <button
              onClick={() => {
                setInReviewMode(false);
                if (reviewOrigin === 'HISTORY') {
                  setSubmittedResult(null);
                  setActiveCategory('HISTORY');
                }
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{reviewOrigin === 'HISTORY' ? 'Back to Attempts' : 'Back to Scorecard'}</span>
            </button>
          </div>
        </div>

        {/* Question + Palette Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

                  <button
                    onClick={() => askTutorWithContext(currentQ.question, `Mock Test Review: ${submittedResult.mockTitle}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-indigo-50 text-stone-700 hover:text-indigo-800 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-indigo-700" />
                    <span>Ask AI Tutor</span>
                  </button>
                </div>

                <QuestionRenderer
                  question={currentQ}
                  questionNumber={currentQuestionIndex + 1}
                  language={displayLanguage}
                  selectedOption={userAnswers[currentQ.id]}
                  selectedOptionId={userAnswers[currentQ.id]}
                  isSubmitted={true}
                  mode="review"
                  showSolution={true}
                  showCorrectAnswer={true}
                  isCorrect={userAnswers[currentQ.id] ? (userAnswers[currentQ.id].trim().toUpperCase() === currentQ.correctAnswer?.trim().toUpperCase()) : undefined}
                  marks={activeTestMeta?.marksPerCorrect || 2.0}
                  negativeMarks={activeTestMeta?.penaltyPerWrong || 0.66}
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

          {/* Review Palette */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 space-y-4">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Question Review Palette
                </h3>
                <div className="flex flex-col gap-1.5 text-[10px] text-stone-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
                    <span>Correct ({submittedResult.correctCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span>
                    <span>Incorrect ({submittedResult.incorrectCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-stone-300 inline-block"></span>
                    <span>Unattempted ({submittedResult.unattemptedCount})</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-[380px] overflow-y-auto p-1">
                {testQuestions.map((q, idx) => {
                  const chosen = userAnswers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = chosen !== undefined && chosen !== '';
                  const isCorrect = isAnswered && chosen.trim().toUpperCase() === q.correctAnswer?.trim().toUpperCase();

                  let btnStyle = 'bg-stone-100 text-stone-600 border-stone-200';
                  if (isCurrent) {
                    btnStyle = 'ring-2 ring-indigo-600 font-bold ' + (isCorrect ? 'bg-emerald-600 text-white' : isAnswered ? 'bg-rose-600 text-white' : 'bg-stone-800 text-white');
                  } else if (isCorrect) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-rose-600 text-white border-rose-600 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setInReviewMode(false);
                  if (reviewOrigin === 'HISTORY') {
                    setSubmittedResult(null);
                    setActiveCategory('HISTORY');
                  }
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {reviewOrigin === 'HISTORY' ? 'Back to Attempts' : 'Back to Scorecard'}
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
              onClick={() => {
                setInReviewMode(true);
                setCurrentQuestionIndex(0);
              }}
              className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Review Questions & Solutions</span>
            </button>

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
                setInReviewMode(false);
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
            onClick={() => setActiveSection('test-series')}
            className="px-4 py-2 bg-[#35156B] hover:bg-[#250e4d] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Exam Test Series Packs</span>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Test Title & Status</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {historyAttempts.map(h => {
                    const matchingTest = mockTests.find(t => t.id === h.mockTestId);
                    const isCompleted = h.status === 'SUBMITTED';
                    const isInProgress = h.status === 'IN_PROGRESS';

                    return (
                      <tr key={h.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-stone-800 text-xs sm:text-sm">{h.mockTitle}</span>
                            <div className="flex items-center gap-2">
                              {isInProgress && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  In Progress
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Completed
                                </span>
                              )}
                              {!isCompleted && !isInProgress && (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                  {h.status}
                                </span>
                              )}
                              {matchingTest?.type && (
                                <span className="text-[10px] font-mono text-stone-400 uppercase">
                                  {matchingTest.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isCompleted ? (
                            <span className="font-mono font-bold text-indigo-700">
                              {h.score} <span className="text-stone-400 font-normal">/ {h.maxScore}</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 font-mono">-- / {h.maxScore}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isCompleted ? (
                            <span className="font-mono text-emerald-700 font-bold">{h.accuracy}%</span>
                          ) : (
                            <span className="text-stone-400 font-mono">--</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-500 font-mono text-xs">
                          {formatAttemptDuration(h.timeTakenSeconds)}
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {new Date(h.completedAt || h.startedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isInProgress && (
                              <button
                                onClick={() => matchingTest && handleStartStandardTest(matchingTest, false)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Resume</span>
                              </button>
                            )}

                            {isCompleted && (
                              <button
                                onClick={() => handleReviewHistoricalAttempt(h)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Review</span>
                              </button>
                            )}

                            {matchingTest && (
                              <button
                                onClick={() => handleStartStandardTest(matchingTest, true)}
                                title="Retake this mock test from the beginning"
                                className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">Retake</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                      {getMockDisplayTitle(test)}
                    </h3>
                    {test.originalSourceName && test.displayName && (
                      <p className="text-[11px] text-stone-500 truncate mt-0.5" title={test.originalSourceName}>
                        Source: {test.originalSourceName}
                      </p>
                    )}
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

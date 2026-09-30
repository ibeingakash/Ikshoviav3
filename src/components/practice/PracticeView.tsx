import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Star,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  FileText,
  Award,
  Send,
  Bot,
  CheckSquare,
  SlidersHorizontal,
  Check,
  BookOpen,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { Question, MistakeCategory, Subject, Topic } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import { ExamExitModal } from '../common/ExamExitModal.js';
import { registerBackButtonHandler } from '../../lib/capacitor.js';
import confetti from 'canvas-confetti';
import { BrandLogo } from '../common/BrandLogo.js';

interface QuestionAttemptState {
  selectedOption: string;
  confidenceRating: number;
  selectedMistakeCategory?: MistakeCategory;
  submitted: boolean;
  attemptResult?: any;
  startTime: number;
}

const PRACTICE_QUESTION_COUNTS = [10, 20, 50, 100, 150] as const;
type PracticeQuestionCount = (typeof PRACTICE_QUESTION_COUNTS)[number];

export const PracticeView: React.FC = () => {
  const { selectedSubjectId, selectedConceptId, refreshLearnerData, setActiveSection, askTutorWithContext, activeSection } = useLearner();
  const isDailyQuiz = activeSection === 'daily-quiz';
  const [practiceMode, setPracticeMode] = useState<'prelims' | 'mains'>('prelims');
  
  // Topic & Subject Practice setup state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>(selectedSubjectId || 'sub_polity');
  const [activeTopicId, setActiveTopicId] = useState<string>('');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<PracticeQuestionCount>(20);
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [practiceStarted, setPracticeStarted] = useState<boolean>(false);
  const [showQuestionPaletteGrid, setShowQuestionPaletteGrid] = useState<boolean>(false);

  // Prelims active session state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionAttemptState>>({});
  const [loading, setLoading] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');

  // Mains state
  const [mainsQuestion, setMainsQuestion] = useState(
    'Discuss the significance of Article 21 of the Indian Constitution in safeguarding human dignity. Analyze landmark judicial pronouncements that expanded its scope. (250 words, 15 Marks)'
  );
  const [mainsAnswerText, setMainsAnswerText] = useState('');
  const [mainsEvaluating, setMainsEvaluating] = useState(false);
  const [mainsResult, setMainsResult] = useState<any>(null);
  const [showQuizExitModal, setShowQuizExitModal] = useState(false);

  // Sync with selectedSubjectId if provided externally
  useEffect(() => {
    if (selectedSubjectId) {
      setActiveSubjectId(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  // Load subjects for Practice selector
  useEffect(() => {
    if (!isDailyQuiz) {
      api.getSubjects().then(subs => {
        if (Array.isArray(subs) && subs.length > 0) {
          setSubjects(subs);
          if (!subs.some(s => s.id === activeSubjectId)) {
            setActiveSubjectId(subs[0].id);
          }
        }
      });
    }
  }, [isDailyQuiz]);

  // Load topics when active subject changes
  useEffect(() => {
    if (!isDailyQuiz && activeSubjectId) {
      api.getTopics(activeSubjectId).then(tList => {
        setTopics(Array.isArray(tList) ? tList : []);
        setActiveTopicId(''); // Default to all topics for the subject
      });
    }
  }, [isDailyQuiz, activeSubjectId]);

  // Check live pool count for the selected subject and topic
  useEffect(() => {
    if (!isDailyQuiz) {
      setPoolLoading(true);
      api.getPracticePoolCount(activeSubjectId || undefined, activeTopicId || undefined)
        .then(count => {
          setPoolCount(count);
          setPoolLoading(false);
        })
        .catch(() => {
          setPoolCount(0);
          setPoolLoading(false);
        });
    }
  }, [isDailyQuiz, activeSubjectId, activeTopicId]);

  // Daily Quiz: keep exactly 10 questions and existing behavior
  useEffect(() => {
    if (isDailyQuiz) {
      setLoading(true);
      api.getPracticeQuestions(undefined, undefined, 10).then(qs => {
        setQuestions(qs.slice(0, 10));
        setCurrentIndex(0);
        setQuestionStates({});
        setLoading(false);
      });
    } else {
      // For Topic & Subject Practice, reset session state so user sees selection flow
      setPracticeStarted(false);
    }
  }, [isDailyQuiz]);

  // Start a fresh Practice attempt with selected question count and random shuffle
  const handleStartPractice = async (overrideCount?: PracticeQuestionCount) => {
    const targetCount = overrideCount || selectedQuestionCount;
    setLoading(true);

    try {
      // Request questions with shuffle=true to get randomly shuffled pool from backend
      const qs = await api.getPracticeQuestions(
        activeSubjectId || undefined,
        undefined,
        targetCount,
        activeTopicId || undefined,
        true
      );

      // Strictly deduplicate by ID and normalized text to guarantee zero duplicates
      const seenIds = new Set<string>();
      const seenTexts = new Set<string>();
      const uniqueQs: Question[] = [];

      for (const q of qs) {
        if (!q || !q.id || seenIds.has(q.id)) continue;
        const norm = (q.question || '').trim().toLowerCase().slice(0, 100);
        if (norm && seenTexts.has(norm)) continue;
        seenIds.add(q.id);
        if (norm) seenTexts.add(norm);
        uniqueQs.push(q);
      }

      // Perform local Fisher-Yates reshuffle to guarantee each attempt is distinct
      for (let i = uniqueQs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueQs[i], uniqueQs[j]] = [uniqueQs[j], uniqueQs[i]];
      }

      // If fewer questions are available than the selected count, use the maximum available UNIQUE questions
      // Never duplicate questions just to reach the requested count.
      const finalCount = Math.min(targetCount, uniqueQs.length);
      const finalQuestions = uniqueQs.slice(0, finalCount);

      setQuestions(finalQuestions);
      setCurrentIndex(0);
      setQuestionStates({});
      setPracticeStarted(true);
    } catch (err) {
      console.error('Failed to start practice session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Back button protection for active Daily Quiz
  useEffect(() => {
    const hasStarted = Object.values(questionStates).some((s: any) => Boolean(s?.selectedOption));
    if (isDailyQuiz && hasStarted) {
      (window as any).__IKSHOVIA_ACTIVE_TEST__ = true;
      const unregister = registerBackButtonHandler(() => {
        setShowQuizExitModal(true);
        return true; // consumed
      });
      return () => {
        (window as any).__IKSHOVIA_ACTIVE_TEST__ = false;
        unregister();
      };
    } else {
      (window as any).__IKSHOVIA_ACTIVE_TEST__ = false;
    }
  }, [isDailyQuiz, questionStates]);

  const currentQ = questions[currentIndex];
  const currentState: QuestionAttemptState = (currentQ && questionStates[currentQ.id]) || {
    selectedOption: '',
    confidenceRating: 3,
    submitted: false,
    startTime: Date.now(),
  };

  const selectedOption = currentState.selectedOption;
  const confidenceRating = currentState.confidenceRating;
  const selectedMistakeCategory = currentState.selectedMistakeCategory;
  const submitted = currentState.submitted;
  const attemptResult = currentState.attemptResult;

  const handleSelectOption = (optId: string) => {
    if (!currentQ || submitted) return;
    setQuestionStates(prev => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {
          confidenceRating: 3,
          submitted: false,
          startTime: Date.now(),
        }),
        selectedOption: optId,
      },
    }));
  };

  const handleSetConfidence = (rating: number) => {
    if (!currentQ || submitted) return;
    setQuestionStates(prev => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {
          selectedOption: '',
          submitted: false,
          startTime: Date.now(),
        }),
        confidenceRating: rating,
      },
    }));
  };

  const handleSetMistakeCategory = (cat: MistakeCategory) => {
    if (!currentQ) return;
    setQuestionStates(prev => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {
          selectedOption: '',
          confidenceRating: 3,
          submitted: false,
          startTime: Date.now(),
        }),
        selectedMistakeCategory: cat,
      },
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!currentQ || !selectedOption || submitted) return;

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - (currentState.startTime || Date.now())) / 1000));
    const result = await api.submitQuestionAttempt(
      currentQ.id,
      selectedOption,
      elapsedSeconds,
      confidenceRating,
      selectedMistakeCategory
    );

    setQuestionStates(prev => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {
          selectedOption,
          confidenceRating,
          startTime: Date.now(),
        }),
        submitted: true,
        attemptResult: result,
      },
    }));

    if (result.isCorrect) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }

    refreshLearnerData();
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setActiveSection('analytics');
    }
  };

  const handleEvaluateMains = async () => {
    if (!mainsAnswerText.trim() || mainsEvaluating) return;
    setMainsEvaluating(true);
    try {
      const res = await api.evaluateMainsAnswer(mainsQuestion, mainsAnswerText, 'Article 21');
      if (res.evaluation) {
        setMainsResult(res.evaluation);
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Mains evaluation failed:', err);
    } finally {
      setMainsEvaluating(false);
    }
  };

  const mistakeCategories: { id: MistakeCategory; label: string; desc: string }[] = [
    { id: 'CONCEPT_GAP', label: 'Concept Gap', desc: "I didn't understand the underlying concept." },
    { id: 'RECALL_FAILURE', label: 'Recall Failure', desc: 'I knew it before but forgot the key fact.' },
    { id: 'CONCEPT_CONFUSION', label: 'Concept Confusion', desc: 'I confused this with a related concept.' },
    { id: 'MISINTERPRETATION', label: 'Misinterpretation', desc: 'I misread or misinterpreted the question.' },
    { id: 'CARELESS_ERROR', label: 'Careless Error', desc: 'Avoidable slip despite knowing the answer.' },
    { id: 'TIME_PRESSURE', label: 'Time Pressure', desc: 'Rushed due to time constraints.' },
  ];

  const currentSubject = subjects.find(s => s.id === activeSubjectId);
  const currentTopic = topics.find(t => t.id === activeTopicId);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => setActiveSection('pyq-practice')}
              className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
            >
              ← Go to Official PYQ Practice
            </button>
            <button
              onClick={() => setActiveSection('mock-tests')}
              className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
            >
              Go to Mock Tests →
            </button>
          </div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            {isDailyQuiz ? (
              <>
                <CheckSquare className="w-6 h-6 text-emerald-700" />
                <span>Daily Quiz</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live • 10 Questions
                </span>
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-amber-800" />
                <span>Topic & Subject Practice</span>
              </>
            )}
          </h1>
          <p className="text-stone-600 text-xs mt-0.5 font-medium">
            {isDailyQuiz
              ? 'Exactly 10 high-yield curated questions drawn from across the canonical question bank to test daily retention and syllabus discipline.'
              : 'Select your subject or topic, choose your target question count (10, 20, 50, 100, 150), and practice with randomly shuffled unique questions.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setPracticeMode('prelims')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              practiceMode === 'prelims'
                ? 'bg-stone-900 text-amber-50 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Prelims MCQs
          </button>
          <button
            onClick={() => setPracticeMode('mains')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              practiceMode === 'mains'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mains Evaluator</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Prelims MCQs */}
      {practiceMode === 'prelims' && (
        <>
          {/* TOPIC & SUBJECT PRACTICE SETUP (When NOT Daily Quiz and Practice NOT Started) */}
          {!isDailyQuiz && !practiceStarted && (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="border-b border-stone-200 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-800" />
                  <h2 className="text-lg font-black text-stone-900">Custom Practice Session Setup</h2>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Configure your practice session. Questions are drawn randomly and deduplicated so you always practice unique questions.
                </p>
              </div>

              {/* Step 1: Select Subject & Topic */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    <span>Select Subject & Topic</span>
                  </label>
                  {poolCount !== null && (
                    <div className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300">
                      Available Pool: <span className="font-mono text-stone-900 font-black">{poolCount}</span> questions
                    </div>
                  )}
                </div>

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-600">Subject</label>
                  <select
                    value={activeSubjectId}
                    onChange={e => setActiveSubjectId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 font-semibold focus:outline-none focus:border-amber-700 focus:bg-white"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-600">Topic within Subject</label>
                  <select
                    value={activeTopicId}
                    onChange={e => setActiveTopicId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 font-semibold focus:outline-none focus:border-amber-700 focus:bg-white"
                  >
                    <option value="">All Topics (Entire {currentSubject?.name || 'Subject'} Pool)</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Select Number of Questions */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>Select Number of Questions</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {PRACTICE_QUESTION_COUNTS.map(count => {
                    const isSelected = selectedQuestionCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSelectedQuestionCount(count)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-700/40 ring-offset-1'
                            : 'bg-white text-stone-800 border-stone-300 hover:border-amber-700/60 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xl font-bold font-mono">{count}</span>
                        <span className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                          Questions
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Pool Availability and Cap Status Notice */}
                <div className="rounded-xl border text-xs leading-relaxed transition-all">
                  {poolLoading ? (
                    <div className="p-3 flex items-center gap-2 text-stone-600 bg-stone-50 rounded-xl">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      <span>Checking question pool size...</span>
                    </div>
                  ) : poolCount === 0 ? (
                    <div className="p-3 flex items-start gap-2 text-rose-900 bg-rose-50 border border-rose-200 rounded-xl">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <span className="font-bold">No Questions in Pool:</span> No active questions found for this specific selection. Please choose "All Topics" or select another subject.
                      </div>
                    </div>
                  ) : poolCount !== null && poolCount < selectedQuestionCount ? (
                    <div className="p-3 flex items-start gap-2 text-amber-950 bg-amber-50/90 border border-amber-300/80 rounded-xl">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                      <div>
                        <span className="font-bold">Pool Capacity Note:</span> You requested <strong>{selectedQuestionCount}</strong> questions, but <strong>{poolCount} unique questions</strong> are available in this {activeTopicId ? 'topic' : 'subject'}. Exactly <strong>{poolCount} unique questions</strong> will be served. Questions are never duplicated.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 flex items-center gap-2 text-emerald-950 bg-emerald-50/90 border border-emerald-300/80 rounded-xl">
                      <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                      <span>
                        <strong>{selectedQuestionCount} unique questions</strong> will be randomly shuffled and served from the <strong>{poolCount} questions</strong> available in this pool.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Start Practice Button */}
              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  disabled={loading || poolLoading || poolCount === 0}
                  onClick={() => handleStartPractice()}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Shuffling Unique Questions...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Start Practice Session ({poolCount !== null && poolCount < selectedQuestionCount ? poolCount : selectedQuestionCount} Questions)
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE PRACTICE OR DAILY QUIZ VIEW */}
          {(isDailyQuiz || practiceStarted) && (
            <>
              {loading && (
                <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
                  Loading questions...
                </div>
              )}

              {!loading && questions.length === 0 && (
                <div className="bg-white border border-stone-200 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
                  <p className="text-stone-700 text-sm font-semibold">No active questions available for this selection.</p>
                  <button
                    onClick={() => {
                      if (!isDailyQuiz) setPracticeStarted(false);
                      else setActiveSection('learn');
                    }}
                    className="px-4 py-2 bg-stone-900 text-amber-50 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {!isDailyQuiz ? 'Back to Setup' : 'Explore Learn Section'}
                  </button>
                </div>
              )}

              {!loading && currentQ && (
                <div className="space-y-4">
                  {/* Topic & Subject Session Control Banner (Topic/Subject practice only) */}
                  {!isDailyQuiz && (
                    <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {currentSubject?.name || 'Subject Practice'}
                        </span>
                        {currentTopic && (
                          <span className="text-[11px] font-semibold text-stone-700">
                            • {currentTopic.name}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                          {questions.length} Questions
                          {poolCount !== null && poolCount < selectedQuestionCount && ` (max available)`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartPractice()}
                          title="Reshuffle and start a new attempt with the same settings"
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>New Attempt (Reshuffle)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPracticeStarted(false)}
                          title="Change subject, topic or question count"
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change Setup</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Question Card */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-2xs">
                    {/* Question Navigation Palette */}
                    <div className="border-b border-stone-100 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-700">
                            Question {currentIndex + 1} of {questions.length}
                          </span>
                          {questions.length > 20 && (
                            <button
                              type="button"
                              onClick={() => setShowQuestionPaletteGrid(!showQuestionPaletteGrid)}
                              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              {showQuestionPaletteGrid ? 'Hide Grid' : `View Grid (1–${questions.length})`}
                            </button>
                          )}
                        </div>

                        <div className="text-xs font-bold text-stone-500 font-mono shrink-0">
                          {Object.values(questionStates).filter((s: QuestionAttemptState) => Boolean(s?.selectedOption)).length} / {questions.length} Answered
                        </div>
                      </div>

                      {/* Quick horizontal scrollable strip */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-thin">
                        {questions.map((q, idx) => {
                          const qState = questionStates[q.id];
                          const isCurrent = idx === currentIndex;
                          const isAnswered = Boolean(qState?.selectedOption);
                          const isSub = Boolean(qState?.submitted);
                          const isCorr = qState?.attemptResult?.isCorrect;

                          let chipClass = "border text-stone-700 bg-white border-stone-200 hover:bg-stone-50";
                          if (isSub) {
                            chipClass = isCorr 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" 
                              : "bg-rose-50 text-rose-800 border-rose-300 font-bold";
                          } else if (isAnswered) {
                            chipClass = "bg-amber-50 text-amber-900 border-amber-300 font-bold";
                          }

                          return (
                            <button
                              key={q.id || idx}
                              type="button"
                              onClick={() => setCurrentIndex(idx)}
                              className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${chipClass} ${
                                isCurrent ? "ring-2 ring-stone-900 ring-offset-1 shadow-xs font-black" : ""
                              }`}
                              title={`Question ${idx + 1}`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Optional Expanded Grid for 50/100/150 questions */}
                      {showQuestionPaletteGrid && questions.length > 20 && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5 max-h-48 overflow-y-auto">
                          {questions.map((q, idx) => {
                            const qState = questionStates[q.id];
                            const isCurrent = idx === currentIndex;
                            const isAnswered = Boolean(qState?.selectedOption);
                            const isSub = Boolean(qState?.submitted);
                            const isCorr = qState?.attemptResult?.isCorrect;

                            let chipClass = "border text-stone-700 bg-white border-stone-200 hover:bg-stone-100";
                            if (isSub) {
                              chipClass = isCorr 
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" 
                                : "bg-rose-100 text-rose-900 border-rose-300 font-bold";
                            } else if (isAnswered) {
                              chipClass = "bg-amber-100 text-amber-950 border-amber-400 font-bold";
                            }

                            return (
                              <button
                                key={`grid-${q.id || idx}`}
                                type="button"
                                onClick={() => {
                                  setCurrentIndex(idx);
                                  setShowQuestionPaletteGrid(false);
                                }}
                                className={`h-7 text-[11px] font-mono font-semibold rounded flex items-center justify-center transition-all cursor-pointer ${chipClass} ${
                                  isCurrent ? "ring-2 ring-stone-900 font-bold" : ""
                                }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Question Tag & Difficulty */}
                    <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {currentQ.type}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            currentQ.difficulty === 'HARD'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {currentQ.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Language Toggle */}
                        {(currentQ.question_hi || (currentQ.availableLanguages && currentQ.availableLanguages.includes('hi'))) && (
                          <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg p-0.5 text-xs font-bold">
                            <button
                              onClick={() => setDisplayLanguage('en')}
                              className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                                displayLanguage === 'en' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              English
                            </button>
                            <button
                              onClick={() => setDisplayLanguage('hi')}
                              className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                                displayLanguage === 'hi' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              हिंदी
                            </button>
                          </div>
                        )}

                        {currentQ.examTag && (
                          <span className="text-[10px] text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {currentQ.examTag}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rendered Question via Canonical Renderer */}
                    <QuestionRenderer
                      question={currentQ}
                      questionNumber={currentIndex + 1}
                      language={displayLanguage}
                      selectedOption={selectedOption}
                      isSubmitted={submitted}
                      isCorrect={attemptResult?.isCorrect}
                      onSelectOption={handleSelectOption}
                      mode="interactive"
                      showSolution={false}
                      hideHeaderMeta={true}
                    />

                    {/* Confidence Selector */}
                    {!submitted && (
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                        <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                          <span>How confident are you in your answer?</span>
                          <span className="text-[10px] text-amber-800 font-mono">Rating: {confidenceRating}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => handleSetConfidence(star)}
                              className={`flex-1 min-h-[44px] py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                confidenceRating === star
                                  ? 'bg-amber-900 border-amber-900 text-white'
                                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              {star}★
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation & Submit Controls */}
                    <div className="pt-4 flex items-center justify-between gap-3 border-t border-stone-100">
                      <button
                        onClick={handlePrevQuestion}
                        disabled={currentIndex === 0}
                        className="min-h-[44px] px-4 py-2 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 font-bold text-xs rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      <div className="text-xs font-bold text-stone-500 font-mono">
                        Question {currentIndex + 1} of {questions.length}
                      </div>

                      <div className="flex items-center gap-2">
                        {!submitted ? (
                          <button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedOption}
                            className="min-h-[44px] px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-50 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="min-h-[44px] px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Analytics'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post-Submission Mistake Analysis */}
                    {submitted && attemptResult && !attemptResult.isCorrect && (
                      <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                        <label className="text-xs font-bold text-rose-950 block">
                          Categorize this mistake to calibrate AI analytics:
                        </label>
                        <select
                          value={selectedMistakeCategory || ''}
                          onChange={e => handleSetMistakeCategory(e.target.value as MistakeCategory)}
                          className="text-xs border border-rose-300 rounded-lg px-2.5 py-1.5 bg-white text-stone-800 font-medium focus:outline-none focus:border-rose-600 w-full sm:w-auto"
                        >
                          <option value="">Select root cause category...</option>
                          {mistakeCategories.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.label} ({m.desc})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Submitted Explanation & AI Diagnostic */}
                    {submitted && attemptResult && (
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={attemptResult.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {attemptResult.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                          </span>
                          <button
                            onClick={() => askTutorWithContext(`Explain why option ${currentQ.correctAnswer} is correct and my chosen option was wrong for question: ${currentQ.question}`, { conceptId: currentQ.conceptId, questionText: currentQ.question })}
                            className="text-xs text-amber-800 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>Ask AI Tutor for Deep Explanation</span>
                          </button>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed font-medium">
                          {currentQ.explanation}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* MODE 2: Mains Evaluator */}
      {practiceMode === 'mains' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
              MAINS ANSWER EVALUATION ENGINE
            </span>
            <h3 className="text-base font-bold text-[#111827]">
              {mainsQuestion}
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Write or Paste Your Mains Answer:</label>
            <textarea
              rows={8}
              value={mainsAnswerText}
              onChange={e => setMainsAnswerText(e.target.value)}
              placeholder="Enter your structured answer (Introduction, Body Paragraphs, Case Laws, Conclusion)..."
              className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 p-4 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleEvaluateMains}
              disabled={mainsEvaluating || !mainsAnswerText.trim()}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              {mainsEvaluating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Evaluation Result */}
          {mainsResult && (
            <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-3">
                  <BrandLogo variant="pdf" size="xs" />
                </div>
                <span className="text-lg font-black text-amber-900 font-mono">Score: {mainsResult.score || '9.5/15'}</span>
              </div>

              <div className="space-y-2 text-xs text-amber-900/90 leading-relaxed">
                <div><strong>Structure & Intro:</strong> {mainsResult.structureFeedback || 'Good legal foundation establishing Article 21 scope.'}</div>
                <div><strong>Key Strengths:</strong> {mainsResult.strengths || 'Mentioned Maneka Gandhi case and expansion of rights.'}</div>
                <div><strong>Gaps / Improvements:</strong> {mainsResult.improvements || 'Incorporate recent privacy and digital rights rulings.'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exit Protection Confirmation Modal for Daily Quiz */}
      <ExamExitModal
        isOpen={showQuizExitModal}
        title="Leave this quiz?"
        message="Your daily quiz attempt is in progress. Leaving now will interrupt your session. Would you like to continue or exit to the dashboard?"
        continueLabel="Continue Quiz"
        leaveLabel="Leave Quiz"
        onContinue={() => setShowQuizExitModal(false)}
        onLeave={() => {
          setShowQuizExitModal(false);
          setActiveSection('dashboard');
        }}
      />
    </div>
  );
};

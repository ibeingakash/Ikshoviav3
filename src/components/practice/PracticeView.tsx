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
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { Question, MistakeCategory } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import { ExamExitModal } from '../common/ExamExitModal.js';
import { registerBackButtonHandler } from '../../lib/capacitor.js';
import confetti from 'canvas-confetti';

interface QuestionAttemptState {
  selectedOption: string;
  confidenceRating: number;
  selectedMistakeCategory?: MistakeCategory;
  submitted: boolean;
  attemptResult?: any;
  startTime: number;
}

export const PracticeView: React.FC = () => {
  const { selectedSubjectId, selectedConceptId, refreshLearnerData, setActiveSection, askTutorWithContext, activeSection } = useLearner();
  const isDailyQuiz = activeSection === 'daily-quiz';
  const [practiceMode, setPracticeMode] = useState<'prelims' | 'mains'>('prelims');
  
  // Prelims state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionAttemptState>>({});
  const [loading, setLoading] = useState(true);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');

  // Mains state
  const [mainsQuestion, setMainsQuestion] = useState(
    'Discuss the significance of Article 21 of the Indian Constitution in safeguarding human dignity. Analyze landmark judicial pronouncements that expanded its scope. (250 words, 15 Marks)'
  );
  const [mainsAnswerText, setMainsAnswerText] = useState('');
  const [mainsEvaluating, setMainsEvaluating] = useState(false);
  const [mainsResult, setMainsResult] = useState<any>(null);
  const [showQuizExitModal, setShowQuizExitModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    // For Daily Quiz, pull 10 high-yield questions from the whole canonical pool
    const subjectParam = isDailyQuiz ? undefined : (selectedSubjectId || undefined);
    const conceptParam = isDailyQuiz ? undefined : (selectedConceptId || undefined);

    api.getPracticeQuestions(subjectParam, conceptParam, 10).then(qs => {
      setQuestions(qs);
      setCurrentIndex(0);
      setQuestionStates({});
      setLoading(false);
    });
  }, [isDailyQuiz, selectedSubjectId, selectedConceptId]);

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

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setActiveSection('pyq-practice')}
              className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
            >
              ← Go to Official PYQ Practice
            </button>
            <button
              onClick={() => setActiveSection('mock-tests')}
              className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors cursor-pointer"
            >
              Go to Mock Tests →
            </button>
          </div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            {isDailyQuiz ? (
              <>
                <CheckSquare className="w-6 h-6 text-emerald-600" />
                <span>Daily Quiz</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live
                </span>
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-indigo-600" />
                <span>Topic & Subject Practice Engine</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            {isDailyQuiz
              ? '10 high-yield curated questions drawn from across the 3,300+ canonical question bank to test daily retention and syllabus discipline.'
              : 'Adaptive Concept MCQs and Gemini Mains Answer Evaluator for UPSC & BPSC syllabus.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setPracticeMode('prelims')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              practiceMode === 'prelims'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prelims MCQs
          </button>
          <button
            onClick={() => setPracticeMode('mains')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              practiceMode === 'mains'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
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
          {loading && (
            <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              Loading adaptive questions...
            </div>
          )}

          {!loading && questions.length === 0 && (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-2xs">
              <p className="text-slate-700 text-sm font-semibold">No active questions available for this selection.</p>
              <button
                onClick={() => setActiveSection('learn')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Explore Learn Section
              </button>
            </div>
          )}

          {!loading && currentQ && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
              {/* Question Navigation Palette */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {questions.map((q, idx) => {
                    const qState = questionStates[q.id];
                    const isCurrent = idx === currentIndex;
                    const isAnswered = Boolean(qState?.selectedOption);
                    const isSub = Boolean(qState?.submitted);
                    const isCorr = qState?.attemptResult?.isCorrect;

                    let chipClass = "border text-slate-700 bg-white border-slate-200 hover:bg-slate-50";
                    if (isSub) {
                      chipClass = isCorr 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" 
                        : "bg-rose-50 text-rose-800 border-rose-300 font-bold";
                    } else if (isAnswered) {
                      chipClass = "bg-indigo-50 text-indigo-800 border-indigo-300 font-bold";
                    }

                    return (
                      <button
                        key={q.id || idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${chipClass} ${
                          isCurrent ? "ring-2 ring-indigo-600 ring-offset-1 shadow-xs" : ""
                        }`}
                        title={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-bold text-slate-500 font-mono shrink-0">
                  {currentIndex + 1} / {questions.length}
                </div>
              </div>

              {/* Question Tag & Difficulty */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
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
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs font-bold">
                      <button
                        onClick={() => setDisplayLanguage('en')}
                        className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                          displayLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setDisplayLanguage('hi')}
                        className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                          displayLanguage === 'hi' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
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
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>How confident are you in your answer?</span>
                    <span className="text-[10px] text-indigo-600 font-mono">Rating: {confidenceRating}/5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleSetConfidence(star)}
                        className={`flex-1 min-h-[44px] py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          confidenceRating === star
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {star}★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation & Submit Controls */}
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-bold text-slate-500 font-mono">
                  Question {currentIndex + 1} of {questions.length}
                </div>

                <div className="flex items-center gap-2">
                  {!submitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOption}
                      className="min-h-[44px] px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="min-h-[44px] px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Analytics'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Submitted Explanation & AI Diagnostic */}
              {submitted && attemptResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={attemptResult.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {attemptResult.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                    </span>
                    <button
                      onClick={() => askTutorWithContext(`Explain why option ${currentQ.correctAnswer} is correct and my chosen option was wrong for question: ${currentQ.question}`, { conceptId: currentQ.conceptId, questionText: currentQ.question })}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI Tutor for Deep Explanation</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

            </div>
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
                <span className="text-sm font-bold text-amber-900">Evaluation Report</span>
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

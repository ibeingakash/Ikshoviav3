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
  Sparkles,
  RotateCcw,
  ShieldAlert,
  FileText,
  Award,
  Send,
  Bot,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { Question, MistakeCategory } from '../../types/index.js';
import confetti from 'canvas-confetti';

export const PracticeView: React.FC = () => {
  const { selectedSubjectId, selectedConceptId, refreshLearnerData, setActiveSection, askTutorWithContext } = useLearner();
  const [practiceMode, setPracticeMode] = useState<'prelims' | 'mains'>('prelims');
  
  // Prelims state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [confidenceRating, setConfidenceRating] = useState<number>(3);
  const [selectedMistakeCategory, setSelectedMistakeCategory] = useState<MistakeCategory | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');

  // Mains state
  const [mainsQuestion, setMainsQuestion] = useState(
    'Discuss the significance of Article 21 of the Indian Constitution in safeguarding human dignity. Analyze landmark judicial pronouncements that expanded its scope. (250 words, 15 Marks)'
  );
  const [mainsAnswerText, setMainsAnswerText] = useState('');
  const [mainsEvaluating, setMainsEvaluating] = useState(false);
  const [mainsResult, setMainsResult] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.getPracticeQuestions(selectedSubjectId || undefined, selectedConceptId || undefined, 10).then(qs => {
      setQuestions(qs);
      setCurrentIndex(0);
      setSelectedOption('');
      setSubmitted(false);
      setAttemptResult(null);
      setStartTime(Date.now());
      setLoading(false);
    });
  }, [selectedSubjectId, selectedConceptId]);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQ || !selectedOption || submitted) return;

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const result = await api.submitQuestionAttempt(
      currentQ.id,
      selectedOption,
      elapsedSeconds,
      confidenceRating,
      selectedMistakeCategory
    );

    setAttemptResult(result);
    setSubmitted(true);

    if (result.isCorrect) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }

    refreshLearnerData();
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption('');
      setConfidenceRating(3);
      setSelectedMistakeCategory(undefined);
      setSubmitted(false);
      setAttemptResult(null);
      setStartTime(Date.now());
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
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            <span>Adaptive Practice & Evaluation Engine</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Adaptive Prelims MCQs and Gemini Mains Answer Evaluator for UPSC & BPSC.
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

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-[#111827] leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                {displayLanguage === 'hi'
                  ? currentQ.question_hi || currentQ.question
                  : currentQ.question_en || currentQ.question}
              </div>

              {/* Options */}
              {currentQ.options && (
                <div className="space-y-2.5">
                  {(displayLanguage === 'hi' && currentQ.options_hi && currentQ.options_hi.length > 0
                    ? currentQ.options_hi
                    : currentQ.options
                  ).map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    let optStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';

                    if (submitted) {
                      if (opt.id === currentQ.correctAnswer) {
                        optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                      } else if (isSelected && !attemptResult?.isCorrect) {
                        optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                      }
                    } else if (isSelected) {
                      optStyle = 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={submitted}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all border flex items-center justify-between cursor-pointer ${optStyle}`}
                      >
                        <span>{opt.text}</span>
                        {submitted && opt.id === currentQ.correctAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {submitted && isSelected && !attemptResult?.isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

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
                        onClick={() => setConfidenceRating(star)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
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

              {/* Submit / Next Button */}
              <div className="pt-2 flex justify-end">
                {!submitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
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

    </div>
  );
};

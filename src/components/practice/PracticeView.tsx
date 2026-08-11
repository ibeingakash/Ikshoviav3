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
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { Question, MistakeCategory } from '../../types/index.js';
import confetti from 'canvas-confetti';

export const PracticeView: React.FC = () => {
  const { selectedSubjectId, selectedConceptId, refreshLearnerData, setActiveSection } = useLearner();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-400" />
            <span>Adaptive Practice & Evaluation Engine</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Adaptive Prelims MCQs and Gemini Mains Answer Evaluator for UPSC & BPSC.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setPracticeMode('prelims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              practiceMode === 'prelims'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Prelims MCQs
          </button>
          <button
            onClick={() => setPracticeMode('mains')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              practiceMode === 'mains'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
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
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              Loading adaptive questions...
            </div>
          )}

          {!loading && questions.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
              <p className="text-slate-300 text-sm font-semibold">No active questions available for this selection.</p>
              <button
                onClick={() => setActiveSection('learn')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                Explore Learn Section
              </button>
            </div>
          )}

          {!loading && currentQ && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Question Tag & Difficulty */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {currentQ.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      currentQ.difficulty === 'HARD'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                </div>

                {currentQ.examTag && (
                  <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                    {currentQ.examTag}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {currentQ.question}
              </div>

              {/* Options */}
              {currentQ.options && (
                <div className="space-y-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = selectedOption === opt.id;
                    let optStyle = 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800';

                    if (submitted) {
                      if (opt.id === currentQ.correctAnswer) {
                        optStyle = 'bg-emerald-950 border-emerald-600 text-emerald-200 font-bold';
                      } else if (isSelected && !attemptResult?.isCorrect) {
                        optStyle = 'bg-rose-950 border-rose-600 text-rose-200 font-bold';
                      }
                    } else if (isSelected) {
                      optStyle = 'bg-indigo-950 border-indigo-500 text-indigo-100 font-bold shadow-md';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={submitted}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all border flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt.text}</span>
                        {submitted && opt.id === currentQ.correctAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {submitted && isSelected && !attemptResult?.isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Confidence Selector */}
              {!submitted && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>How confident are you in your answer?</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Rating: {confidenceRating}/5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setConfidenceRating(star)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          confidenceRating === star
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 mx-auto ${
                            star <= confidenceRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!submitted && (
                <button
                  id="submit-practice-ans-btn"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                >
                  Verify Answer & Update Learner Model
                </button>
              )}

              {/* Feedback & Mistake Categorization when Submitted */}
              {submitted && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      attemptResult?.isCorrect
                        ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                    }`}
                  >
                    {attemptResult?.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm">
                        {attemptResult?.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                      </div>
                      <div className="text-xs opacity-90 leading-relaxed whitespace-pre-line">
                        {currentQ.explanation}
                      </div>
                    </div>
                  </div>

                  {!attemptResult?.isCorrect && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Mistake Intelligence Diagnosis: Why did you get this wrong?</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mistakeCategories.map(mc => (
                          <button
                            key={mc.id}
                            onClick={() => setSelectedMistakeCategory(mc.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                              selectedMistakeCategory === mc.id
                                ? 'bg-rose-900/80 border-rose-600 text-rose-100 font-bold'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="font-semibold">{mc.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{mc.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    id="next-practice-q-btn"
                    onClick={handleNextQuestion}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Continue to Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODE 2: Mains Answer Evaluator */}
      {practiceMode === 'mains' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> UPSC & BPSC Mains AI Answer Evaluator
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-serif text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
              {mainsQuestion}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Your Mains Answer Response</label>
            <textarea
              rows={8}
              value={mainsAnswerText}
              onChange={e => setMainsAnswerText(e.target.value)}
              placeholder="Type or paste your structured mains answer here (include intro, arguments, constitutional provisions, committee reports, and conclusion)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
            />
          </div>

          <button
            onClick={handleEvaluateMains}
            disabled={mainsEvaluating || !mainsAnswerText.trim()}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {mainsEvaluating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating against Civil Services Criteria...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Evaluate Answer with Gemini AI</span>
              </>
            )}
          </button>

          {/* Results Breakdown */}
          {mainsResult && (
            <div className="space-y-4 pt-4 border-t border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between bg-amber-950/80 border border-amber-700/80 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-amber-300 uppercase font-bold tracking-wider font-serif">Mains Score</div>
                  <div className="text-3xl font-extrabold text-amber-100 font-serif mt-1">
                    {mainsResult.score} / {mainsResult.maxScore || 10}
                  </div>
                </div>
                <div className="text-right text-xs text-amber-200">
                  <span className="font-bold">{mainsResult.score >= 6.5 ? 'Above Average' : 'Developing'}</span>
                  <div className="text-[10px] opacity-80 mt-1">UPSC Benchmark Grade</div>
                </div>
              </div>

              {/* Sub-scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Question Demand', score: mainsResult.questionDemandScore },
                  { label: 'Content Accuracy', score: mainsResult.contentAccuracyScore },
                  { label: 'Structure & Flow', score: mainsResult.structureScore },
                  { label: 'Analytical Depth', score: mainsResult.analysisScore },
                  { label: 'Intro Quality', score: mainsResult.introScore },
                  { label: 'Dimensions', score: mainsResult.dimensionsScore },
                  { label: 'Examples & Data', score: mainsResult.examplesScore },
                  { label: 'Conclusion', score: mainsResult.conclusionScore },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{item.score || 7}/10</div>
                  </div>
                ))}
              </div>

              {/* Detailed Feedback */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-200 uppercase tracking-wider font-serif">Evaluator Feedback</div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{mainsResult.overallFeedback}</p>
                <div className="text-amber-400 font-bold pt-1">
                  💡 Recommended Action: {mainsResult.recommendedAction}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

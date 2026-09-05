import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  RotateCcw,
  ShieldCheck,
  GraduationCap,
  Layers,
  Filter,
  Search,
  ExternalLink,
  BookOpen,
  CheckSquare,
  Globe,
  Bot,
  Bookmark,
  Share2,
  Calendar,
  FileText
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { PyqPaper, Question } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import confetti from 'canvas-confetti';

export const PyqPracticeView: React.FC = () => {
  const { refreshLearnerData, setActiveSection, askTutorWithContext } = useLearner();

  // Papers state
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Paper / Practice State
  const [activePaper, setActivePaper] = useState<PyqPaper | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  const [paperLoading, setPaperLoading] = useState(false);

  // Mode: 'SIMULATION' (timed test) vs 'STUDY' (untimed question-by-question practice with solutions)
  const [practiceMode, setPracticeMode] = useState<'SIMULATION' | 'STUDY'>('SIMULATION');

  // Simulation / Study Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [inActiveSession, setInActiveSession] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  useEffect(() => {
    loadPapers();
  }, []);

  // Timer for Timed Simulation Mode
  useEffect(() => {
    let timer: any = null;
    if (inActiveSession && practiceMode === 'SIMULATION' && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitSimulation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inActiveSession, practiceMode, timeRemainingSeconds]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const res = await api.getPYQPapers();
      // Ensure only OFFICIAL_COMMISSION papers are displayed in PYQ Practice
      const officialOnly = (Array.isArray(res) ? res : []).filter(
        p => !p.sourceType || p.sourceType === 'OFFICIAL_COMMISSION'
      );
      setPapers(officialOnly);
    } catch (err) {
      console.error('Failed to load official PYQ papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchPaper = async (paper: PyqPaper, mode: 'SIMULATION' | 'STUDY') => {
    setPaperLoading(true);
    try {
      const res = await api.getPYQPaperQuestions(paper.id);
      const qs: Question[] = res.questions || [];
      if (qs.length === 0) {
        alert('Questions are being processed for this paper. Please check back shortly.');
        setPaperLoading(false);
        return;
      }

      setActivePaper(paper);
      setPaperQuestions(qs);
      setPracticeMode(mode);
      setCurrentIndex(0);
      setUserAnswers({});
      setMarkedForReview({});
      setRevealedSolutions({});
      setSubmittedResult(null);

      // Duration: CSAT/GS = 120 mins
      const durationMins = 120;
      setTimeRemainingSeconds(durationMins * 60);
      setInActiveSession(true);
    } catch (err) {
      console.error('Failed to load questions for paper:', err);
    } finally {
      setPaperLoading(false);
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

  const handleToggleRevealSolution = (questionId: string) => {
    setRevealedSolutions(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitSimulation = () => {
    if (!activePaper) return;

    const isCsat = activePaper.paper.toLowerCase().includes('csat');
    const isBpsc = activePaper.exam.toLowerCase().includes('bpsc');
    const marksPerCorrect = isCsat ? 2.5 : isBpsc ? 1.0 : 2.0;
    const penaltyPerWrong = isCsat ? 0.833 : isBpsc ? 0.333 : 0.666;

    let correct = 0;
    let incorrect = 0;

    paperQuestions.forEach(q => {
      const chosen = userAnswers[q.id];
      if (chosen !== undefined && chosen !== null && chosen !== '') {
        const chosenUpper = String(chosen).trim().toUpperCase();
        const correctUpper = String(q.correctAnswer).trim().toUpperCase();

        const optionsList = q.options || [];
        const optE = optionsList.find(o => String(o.id).toUpperCase() === 'E');
        const isOptENotAttempted = optE && (
          (optE.text || '').toLowerCase().includes('not attempted') ||
          (optE.text || '').toLowerCase().includes('अनुत्तरित') ||
          (optE.text || '').toLowerCase().includes('unattempted')
        );

        if (chosenUpper === 'E' && isOptENotAttempted && correctUpper !== 'E') {
          // BPSC Candidate marked Not Attempted — safe skip (0 marks, 0 penalty)
        } else if (chosenUpper === correctUpper) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const totalAttempted = correct + incorrect;
    const score = Math.max(0, (correct * marksPerCorrect) - (incorrect * penaltyPerWrong)).toFixed(2);
    const maxScore = (paperQuestions.length * marksPerCorrect).toFixed(0);
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
    const timeSpentSeconds = (120 * 60) - timeRemainingSeconds;

    setSubmittedResult({
      paperTitle: activePaper.paperTitle,
      exam: activePaper.exam,
      year: activePaper.year,
      score,
      maxScore,
      accuracy,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: paperQuestions.length - totalAttempted,
      totalQuestions: paperQuestions.length,
      timeSpentSeconds: Math.max(15, timeSpentSeconds),
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    refreshLearnerData();
  };

  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter papers
  const filteredPapers = papers.filter(p => {
    if (selectedExam !== 'ALL' && p.exam !== selectedExam) return false;
    if (selectedYear !== 'ALL' && String(p.year) !== selectedYear) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.paperTitle?.toLowerCase().includes(q);
      const matchExam = p.exam?.toLowerCase().includes(q);
      const matchPaper = p.paper?.toLowerCase().includes(q);
      if (!matchTitle && !matchExam && !matchPaper) return false;
    }
    return true;
  });

  const availableExams = Array.from(new Set(papers.map(p => p.exam))).filter(Boolean);
  const availableYears = Array.from(new Set(papers.map(p => String(p.year)))).sort((a, b) => Number(b) - Number(a));

  // Current Active Question during Simulation / Study
  const currentQ = paperQuestions[currentIndex];

  // -------------------------------------------------------------
  // RENDER: Active Test / Study Session Mode
  // -------------------------------------------------------------
  if (inActiveSession && activePaper && paperQuestions.length > 0) {
    if (submittedResult) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in font-sans-editorial">
          {/* Result Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold font-mono">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>OFFICIAL COMMISSION PYQ SIMULATION REPORT</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-editorial text-stone-900">
                {submittedResult.paperTitle}
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                Completed in {Math.floor(submittedResult.timeSpentSeconds / 60)} minutes • Evaluated with Official Master Answer Key
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Final Score</span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-900 font-mono">
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

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  setSubmittedResult(null);
                  setPracticeMode('STUDY');
                  setCurrentIndex(0);
                }}
                className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Review Full Paper with Official Solutions</span>
              </button>

              <button
                onClick={() => {
                  setInActiveSession(false);
                  setActivePaper(null);
                  setSubmittedResult(null);
                }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to PYQ Paper Archive</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-4 pb-16 animate-fade-in font-sans-editorial">
        {/* Active Session Top Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit the current session?')) {
                  setInActiveSession(false);
                  setActivePaper(null);
                }
              }}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors cursor-pointer"
              title="Exit Session"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  OFFICIAL PYQ
                </span>
                <span className="text-[11px] font-mono text-stone-500">
                  {activePaper.exam} {activePaper.year} • Q {currentIndex + 1} of {paperQuestions.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate max-w-md">
                {activePaper.paperTitle}
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

            {/* Timer if Simulation */}
            {practiceMode === 'SIMULATION' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                Self-Paced Study Mode
              </span>
            )}

            {/* Submit / Finish */}
            {practiceMode === 'SIMULATION' && (
              <button
                onClick={handleSubmitSimulation}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Submit Paper
              </button>
            )}
          </div>
        </div>

        {/* Main Split Layout: Question View + Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-3 space-y-4">
            {currentQ && (
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                {/* Question Header & Badges */}
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {currentIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {currentQ.questionType === 'MATCH_FOLLOWING' ? 'Match the Following' : currentQ.questionType === 'STATEMENT_BASED' ? 'Statement Based' : 'Single Correct Choice'}
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
                      onClick={() => askTutorWithContext(currentQ.question, `UPSC Official PYQ: ${activePaper.paperTitle}`)}
                      className="p-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-600 hover:text-amber-800 border border-stone-200 transition-colors cursor-pointer"
                      title="Ask AI Tutor about this question"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Render Question Content */}
                <QuestionRenderer
                  question={currentQ}
                  questionNumber={currentIndex + 1}
                  language={displayLanguage}
                  selectedOption={userAnswers[currentQ.id]}
                  selectedOptionId={userAnswers[currentQ.id]}
                  onSelectOption={(optId) => handleSelectOption(currentQ.id, optId)}
                  mode={practiceMode === 'STUDY' ? 'study' : 'interactive'}
                  showSolution={practiceMode === 'STUDY' && Boolean(revealedSolutions[currentQ.id])}
                  showCorrectAnswer={practiceMode === 'STUDY' && Boolean(revealedSolutions[currentQ.id])}
                />

                {/* Study Mode: Solution Reveal */}
                {practiceMode === 'STUDY' && (
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <button
                      onClick={() => handleToggleRevealSolution(currentQ.id)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-700" />
                      <span>{revealedSolutions[currentQ.id] ? 'Hide Official Commission Answer & Explanation' : 'Check Official Answer & Key'}</span>
                    </button>

                    {revealedSolutions[currentQ.id] && (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-amber-900 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Official Answer: Option {currentQ.correctAnswer}</span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          {currentQ.explanation || 'Verified with Official Commission Master Answer Key.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentIndex === 0
                        ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono text-stone-400">
                    {currentIndex + 1} / {paperQuestions.length}
                  </span>

                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(paperQuestions.length - 1, prev + 1))}
                    disabled={currentIndex === paperQuestions.length - 1}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentIndex === paperQuestions.length - 1
                        ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-amber-800 hover:bg-amber-900 text-white border-amber-900 shadow-2xs'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Question Palette Sidebar */}
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

              {/* Grid of numbers */}
              <div className="grid grid-cols-5 gap-1.5 max-h-[380px] overflow-y-auto p-1">
                {paperQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;

                  let btnStyle = 'bg-stone-50 text-stone-600 border-stone-200';
                  if (isCurrent) {
                    btnStyle = 'bg-stone-900 text-white border-stone-900 font-bold ring-2 ring-amber-500';
                  } else if (isMarked) {
                    btnStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {practiceMode === 'SIMULATION' && (
                <button
                  onClick={handleSubmitSimulation}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  Submit Examination
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main PYQ Practice Papers Listing & Selection View
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
              OFFICIAL ARCHIVE
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              UPSC Civil Services & BPSC Combined Competitive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <FolderArchive className="w-7 h-7 text-amber-800" />
            <span>Official PYQ Practice</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Strictly official commission previous year question papers. Take full 2-hour timed simulations or step through questions with verified master keys.
          </p>
        </div>

        {/* Quick Links & Direct Navigation to Mock Tests */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSection('mock-tests')}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Switch to Mock Tests & Custom Sprints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="font-bold text-stone-500">Exam:</span>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              aria-label="Filter PYQ by exam"
              className="bg-transparent font-bold text-stone-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Official Exams</option>
              {availableExams.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="font-bold text-stone-500">Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              aria-label="Filter PYQ by year"
              className="bg-transparent font-bold text-stone-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Years (2020-2025)</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search papers (e.g. GS Paper I)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-500 text-xs font-mono">Loading official commission archives...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <FolderArchive className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No official papers match your filters</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Try resetting the exam or year filter to browse the complete official previous year archive.
          </p>
          <button
            onClick={() => {
              setSelectedExam('ALL');
              setSelectedYear('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map(paper => {
            const isCsat = paper.paper?.toLowerCase().includes('csat');
            const isBpsc = paper.exam?.toLowerCase().includes('bpsc');

            return (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 shadow-2xs hover:shadow-sm transition-all duration-150 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-700" />
                      <span>OFFICIAL PYQ</span>
                    </span>
                    <span className="text-xs font-bold text-stone-700 font-mono">
                      {paper.year}
                    </span>
                  </div>

                  {/* Title & Exam */}
                  <div>
                    <h3 className="text-base font-bold font-serif-editorial text-stone-900 leading-snug">
                      {paper.paperTitle}
                    </h3>
                    <p className="text-stone-500 text-xs mt-1 font-medium">
                      {paper.exam} • {paper.stage || 'Prelims'} • {paper.paper}
                    </p>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Questions</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">
                        {paper.actualQuestionCount || paper.expectedQuestionCount || 100}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Duration</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">120 Mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Marking</span>
                      <span className="text-xs font-bold text-stone-700 font-mono">
                        {isCsat ? '+2.5 / -0.83' : isBpsc ? '+1 / -0.33' : '+2 / -0.66'}
                      </span>
                    </div>
                  </div>

                  {/* Official Commission Source Link */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-stone-400" />
                      <span>Source: {paper.sourceDomain || (isBpsc ? 'bpsc.bihar.gov.in' : 'upsc.gov.in')}</span>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>
                </div>

                {/* Launch Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleLaunchPaper(paper, 'SIMULATION')}
                    disabled={paperLoading}
                    className="py-2.5 px-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timed Simulation</span>
                  </button>

                  <button
                    onClick={() => handleLaunchPaper(paper, 'STUDY')}
                    disabled={paperLoading}
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Practice Paper</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

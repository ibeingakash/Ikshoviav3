import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  Tag,
  ListOrdered,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { PyqPaper, Question } from '../../types/index.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import { PyqPaperCard } from './PyqPaperCard.js';
import { PyqPaperHeader } from './PyqPaperHeader.js';
import { PyqPaperAnalysisModal } from './PyqPaperAnalysisModal.js';
import { PyqMobileNavigator } from './PyqMobileNavigator.js';
import confetti from 'canvas-confetti';

export const PyqPracticeView: React.FC = () => {
  const { refreshLearnerData, setActiveSection, askTutorWithContext } = useLearner();

  // -------------------------------------------------------------
  // PRIMARY HIERARCHY STATE: Exam -> Year -> Paper
  // -------------------------------------------------------------
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [loading, setLoading] = useState(true);

  // Level 1: Selected Exam (e.g. 'UPSC CSE', 'BPSC')
  const [selectedExam, setSelectedExam] = useState<string>('UPSC CSE');

  // Level 2: Selected Year (e.g. '2024', '2023')
  const [selectedYear, setSelectedYear] = useState<string>('2024');

  // Level 3: Search within papers
  const [searchQuery, setSearchQuery] = useState<string>('');

  // -------------------------------------------------------------
  // ACTIVE PAPER & COMPLETE PAPER VIEW STATE
  // -------------------------------------------------------------
  const [activePaper, setActivePaper] = useState<PyqPaper | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  const [paperLoading, setPaperLoading] = useState(false);

  // View Mode: 'COMPLETE_PAPER' (all questions in sequence) vs 'SIMULATION_EXAM' (timed test)
  const [viewMode, setViewMode] = useState<'COMPLETE_PAPER' | 'SIMULATION_EXAM'>('COMPLETE_PAPER');

  // -------------------------------------------------------------
  // SECONDARY ANALYTICAL LAYER (Optional filter, never alters sequence)
  // -------------------------------------------------------------
  const [analyticalSubjectFilter, setAnalyticalSubjectFilter] = useState<string>('ALL');
  const [searchInPaper, setSearchInPaper] = useState<string>('');
  const [showQuestionMetadata, setShowQuestionMetadata] = useState<boolean>(true);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // -------------------------------------------------------------
  // ATTEMPT & PRACTICE EXECUTION STATE
  // -------------------------------------------------------------
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'hi'>('en');
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [showMobileNavigator, setShowMobileNavigator] = useState<boolean>(false);

  // Load all official papers on mount
  useEffect(() => {
    loadOfficialPapers();
  }, []);

  const loadOfficialPapers = async () => {
    setLoading(true);
    try {
      const res = await api.getPYQPapers();
      const officialOnly = (Array.isArray(res) ? res : []).filter(
        p => !p.sourceType || p.sourceType === 'OFFICIAL_COMMISSION'
      );
      setPapers(officialOnly);

      if (officialOnly.length > 0) {
        // Find default exam
        const exams = Array.from(new Set(officialOnly.map(p => p.exam))).filter(Boolean);
        const defaultExam = exams.includes('UPSC CSE') ? 'UPSC CSE' : exams[0];
        setSelectedExam(defaultExam);

        // Find default year for this exam
        const yearsForExam = Array.from(
          new Set(officialOnly.filter(p => p.exam === defaultExam).map(p => String(p.year)))
        ).sort((a, b) => Number(b) - Number(a));

        if (yearsForExam.length > 0) {
          setSelectedYear(yearsForExam[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load official PYQ papers:', err);
    } finally {
      setLoading(false);
    }
  };

  // When Exam changes, auto-select the latest year for that exam
  const handleSelectExam = (exam: string) => {
    setSelectedExam(exam);
    const yearsForExam = Array.from(
      new Set(papers.filter(p => p.exam === exam).map(p => String(p.year)))
    ).sort((a, b) => Number(b) - Number(a));

    if (yearsForExam.length > 0) {
      setSelectedYear(yearsForExam[0]);
    } else {
      setSelectedYear('ALL');
    }
  };

  // Launch a Complete Paper in either Complete Paper view or Timed Simulation
  const handleOpenPaper = async (paper: PyqPaper, mode: 'COMPLETE_PAPER' | 'SIMULATION_EXAM' = 'COMPLETE_PAPER') => {
    setPaperLoading(true);
    try {
      const res = await api.getPYQPaperQuestions(paper.id);
      const qs: Question[] = res.questions || [];
      if (qs.length === 0) {
        alert('Questions are being loaded for this official paper. Please check back shortly.');
        setPaperLoading(false);
        return;
      }

      // Preserve strict original question sequence (Q1 to QN)
      const sortedQs = [...qs].sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      setActivePaper(paper);
      setPaperQuestions(sortedQs);
      setViewMode(mode);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setMarkedForReview({});
      setRevealedSolutions({});
      setSubmittedResult(null);
      setAnalyticalSubjectFilter('ALL');
      setSearchInPaper('');

      // Standard Commission Duration: 120 Minutes (2 Hours)
      const durationMins = paper.durationMinutes || 120;
      setTimeRemainingSeconds(durationMins * 60);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load questions for paper:', err);
    } finally {
      setPaperLoading(false);
    }
  };

  // Timer for Timed Simulation Mode
  useEffect(() => {
    let timer: any = null;
    if (activePaper && viewMode === 'SIMULATION_EXAM' && !submittedResult && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitPaper();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activePaper, viewMode, submittedResult, timeRemainingSeconds]);

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

  const handleToggleBookmark = (questionId: string) => {
    setBookmarkedQuestions(prev => ({
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

  // -------------------------------------------------------------
  // EVALUATION & TOPIC-WISE ANALYSIS AFTER ATTEMPTING
  // -------------------------------------------------------------
  const handleSubmitPaper = () => {
    if (!activePaper) return;

    const isCsat = activePaper.paper.toLowerCase().includes('csat');
    const isBpsc = activePaper.exam.toLowerCase().includes('bpsc');
    const marksPerCorrect = isCsat ? 2.5 : isBpsc ? 1.0 : 2.0;
    const penaltyPerWrong = isCsat ? 0.833 : isBpsc ? 0.333 : 0.666;

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    // Track Topic-Wise Breakdown AFTER Attempting
    const subjectStats: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; questionNumbers: number[] }> = {};

    paperQuestions.forEach(q => {
      const subj = q.subject || q.gsPaper || 'General Studies';
      if (!subjectStats[subj]) {
        subjectStats[subj] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, questionNumbers: [] };
      }
      subjectStats[subj].total++;
      if (q.questionNumber) {
        subjectStats[subj].questionNumbers.push(q.questionNumber);
      }

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
          unattempted++;
          subjectStats[subj].unattempted++;
        } else if (chosenUpper === correctUpper) {
          correct++;
          subjectStats[subj].correct++;
        } else {
          incorrect++;
          subjectStats[subj].incorrect++;
        }
      } else {
        unattempted++;
        subjectStats[subj].unattempted++;
      }
    });

    const totalAttempted = correct + incorrect;
    const rawScore = (correct * marksPerCorrect) - (incorrect * penaltyPerWrong);
    const score = Math.max(0, rawScore).toFixed(2);
    const maxScore = (paperQuestions.length * marksPerCorrect).toFixed(0);
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
    const durationTotalSeconds = (activePaper.durationMinutes || 120) * 60;
    const timeSpentSeconds = Math.max(20, durationTotalSeconds - timeRemainingSeconds);

    setSubmittedResult({
      paperTitle: activePaper.paperTitle,
      exam: activePaper.exam,
      year: activePaper.year,
      score,
      maxScore,
      accuracy,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unattempted,
      totalQuestions: paperQuestions.length,
      timeSpentSeconds,
      subjectStats,
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    refreshLearnerData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // -------------------------------------------------------------
  // DERIVED DATA FOR PRIMARY HIERARCHY
  // -------------------------------------------------------------
  const availableExams = useMemo(() => {
    const set = new Set<string>();
    papers.forEach(p => {
      if (p.exam) set.add(p.exam);
    });
    return Array.from(set);
  }, [papers]);

  const availableYearsForSelectedExam = useMemo(() => {
    const set = new Set<string>();
    papers
      .filter(p => !selectedExam || selectedExam === 'ALL' || p.exam === selectedExam)
      .forEach(p => {
        if (p.year) set.add(String(p.year));
      });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [papers, selectedExam]);

  const papersInSelectedHierarchy = useMemo(() => {
    return papers.filter(p => {
      if (selectedExam && selectedExam !== 'ALL' && p.exam !== selectedExam) return false;
      if (selectedYear && selectedYear !== 'ALL' && String(p.year) !== selectedYear) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.paperTitle?.toLowerCase().includes(q);
        const matchPaper = p.paper?.toLowerCase().includes(q);
        if (!matchTitle && !matchPaper) return false;
      }
      return true;
    });
  }, [papers, selectedExam, selectedYear, searchQuery]);

  // Distinct subjects in active paper for optional analytical filtering
  const activePaperSubjects = useMemo(() => {
    const map: Record<string, number> = {};
    paperQuestions.forEach(q => {
      const subj = q.subject || q.gsPaper || 'General Studies';
      map[subj] = (map[subj] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [paperQuestions]);

  // Filtered view of questions (strictly preserves original sequence)
  const displayedQuestions = useMemo(() => {
    return paperQuestions.filter(q => {
      if (analyticalSubjectFilter !== 'ALL') {
        const subj = q.subject || q.gsPaper || 'General Studies';
        if (subj.toLowerCase() !== analyticalSubjectFilter.toLowerCase()) return false;
      }
      if (searchInPaper.trim()) {
        const query = searchInPaper.toLowerCase();
        const textEn = (q.question_en || q.question || '').toLowerCase();
        const textHi = (q.question_hi || '').toLowerCase();
        const subj = (q.subject || '').toLowerCase();
        const topic = (q.topic || '').toLowerCase();
        if (!textEn.includes(query) && !textHi.includes(query) && !subj.includes(query) && !topic.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [paperQuestions, analyticalSubjectFilter, searchInPaper]);

  // Current question in single-question focus or simulation mode
  const currentSingleQuestion = paperQuestions[currentQuestionIndex];

  // -------------------------------------------------------------
  // VIEW: POST-ATTEMPT EVALUATION & TOPIC-WISE ANALYSIS
  // -------------------------------------------------------------
  if (submittedResult && activePaper) {
    const isCsat = activePaper.paper.toLowerCase().includes('csat');
    const isBpsc = activePaper.exam.toLowerCase().includes('bpsc');

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fade-in font-sans-editorial">
        {/* Official Scorecard */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>OFFICIAL COMMISSION SCORECARD</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 mt-2">
                {submittedResult.paperTitle}
              </h2>
              <p className="text-stone-500 text-xs mt-0.5">
                Completed in {Math.floor(submittedResult.timeSpentSeconds / 60)} minutes • Evaluated with Official Master Answer Key
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSubmittedResult(null);
                  setViewMode('COMPLETE_PAPER');
                }}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Review Full Paper</span>
              </button>

              <button
                onClick={() => {
                  setActivePaper(null);
                  setSubmittedResult(null);
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Archive Home</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Official Score</span>
              <span className="text-2xl sm:text-3xl font-bold text-amber-950 font-mono">
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

          {/* TOPIC-WISE ANALYSIS AFTER ATTEMPTING */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-800" />
                  <span>Topic-Wise Performance Analysis</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Your performance categorized by subject classification after attempting the complete examination paper.
                </p>
              </div>

              <button
                onClick={() => setActiveSection('practice')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Drill Weak Areas in Topic Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100/80 text-stone-700 font-mono uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Subject Area</th>
                    <th className="py-3 px-3 text-center">Questions</th>
                    <th className="py-3 px-3 text-center">Correct</th>
                    <th className="py-3 px-3 text-center">Incorrect</th>
                    <th className="py-3 px-3 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {Object.entries(submittedResult.subjectStats || {}).map(([subj, stats]: [string, any]) => {
                    const attempted = stats.correct + stats.incorrect;
                    const subjAccuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;
                    const isNeedsImprovement = attempted > 0 && subjAccuracy < 60;

                    return (
                      <tr key={subj} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900 flex items-center gap-2">
                          <span>{subj}</span>
                          {isNeedsImprovement && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Priority
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-stone-600">{stats.total}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{stats.correct}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{stats.incorrect}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span className={subjAccuracy >= 70 ? 'text-emerald-700' : subjAccuracy >= 50 ? 'text-amber-700' : 'text-rose-700'}>
                            {subjAccuracy}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setAnalyticalSubjectFilter(subj);
                              setSubmittedResult(null);
                              setViewMode('COMPLETE_PAPER');
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                          >
                            Review Questions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ACTIVE PAPER (COMPLETE PAPER VIEW OR TIMED SIMULATION)
  // -------------------------------------------------------------
  if (activePaper && paperQuestions.length > 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 pb-24 animate-fade-in font-sans-editorial">
        {/* Paper Header & Instructions */}
        <PyqPaperHeader
          paper={activePaper}
          questionCount={paperQuestions.length}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          displayLanguage={displayLanguage}
          onChangeLanguage={setDisplayLanguage}
          showMetadata={showQuestionMetadata}
          onToggleMetadata={() => setShowQuestionMetadata(prev => !prev)}
          onOpenAnalysis={() => setShowAnalysisModal(true)}
          onExit={() => {
            if (window.confirm('Are you sure you want to return to the PYQ Archive?')) {
              setActivePaper(null);
            }
          }}
          timeRemainingSeconds={timeRemainingSeconds}
          formatTimer={formatTimer}
          onSubmit={handleSubmitPaper}
        />

        {/* SECONDARY ANALYTICAL FILTER STRIP (OPTIONAL OVERLAY - NEVER ALTERS ORDER) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-800" />
              <span>Analytical Filter:</span>
            </span>

            <button
              onClick={() => setAnalyticalSubjectFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                analyticalSubjectFilter === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Questions ({paperQuestions.length})
            </button>

            {activePaperSubjects.slice(0, 5).map(([subj, count]) => (
              <button
                key={subj}
                onClick={() => setAnalyticalSubjectFilter(subj)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticalSubjectFilter.toLowerCase() === subj.toLowerCase()
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{subj}</span>
                <span className="text-[10px] font-mono opacity-70">({count})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in paper..."
              value={searchInPaper}
              onChange={e => setSearchInPaper(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Notice if an Analytical Filter is active */}
        {analyticalSubjectFilter !== 'ALL' && (
          <div className="px-4 py-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                Analytical Layer: Highlighting questions classified under <strong>{analyticalSubjectFilter}</strong>. Original question numbers and commission sequence are preserved.
              </span>
            </div>
            <button
              onClick={() => setAnalyticalSubjectFilter('ALL')}
              className="font-bold underline cursor-pointer ml-2"
            >
              Show All Questions
            </button>
          </div>
        )}

        {/* MODE A: COMPLETE PAPER VIEW (ALL QUESTIONS 1..N SEQUENTIAL BOOKLET) */}
        {viewMode === 'COMPLETE_PAPER' ? (
          <div className="space-y-6">
            {displayedQuestions.map((q, idx) => {
              const qNum = q.questionNumber || idx + 1;
              const isAnswered = userAnswers[q.id] !== undefined;
              const isMarked = markedForReview[q.id];
              const isBookmarked = bookmarkedQuestions[q.id];
              const isSolutionRevealed = revealedSolutions[q.id];

              return (
                <div
                  key={q.id}
                  id={`question-${qNum}`}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-5 scroll-mt-20 hover:border-stone-300 transition-colors"
                >
                  {/* Question Header & Action Strip */}
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                        {qNum}
                      </span>
                      <span className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider">
                        Question {qNum} of {paperQuestions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMarkForReview(q.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isMarked
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isMarked ? 'Marked' : 'Review'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleBookmark(q.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                        }`}
                        title="Save to learner revision bookmarks"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => askTutorWithContext(q.question, `${activePaper.paperTitle} • Question ${qNum}`)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-600 hover:text-amber-800 border border-stone-200 transition-colors cursor-pointer"
                        title="Consult AI Tutor on this question"
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subject & Topic Metadata Badge (Visible when enabled) */}
                  {showQuestionMetadata && (
                    <div className="flex flex-wrap items-center gap-2 py-1 px-3 rounded-xl bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600">
                      <span className="font-bold text-stone-500 font-mono uppercase text-[10px]">Metadata:</span>
                      <span className="font-bold text-stone-800">{q.subject || 'General Studies'}</span>
                      {q.topic && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-stone-600">{q.topic}</span>
                        </>
                      )}
                      {q.tags && q.tags.length > 0 && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-stone-500">{q.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Render Question Body & Options */}
                  <QuestionRenderer
                    question={q}
                    questionNumber={qNum}
                    language={displayLanguage}
                    selectedOption={userAnswers[q.id]}
                    selectedOptionId={userAnswers[q.id]}
                    onSelectOption={(optId) => handleSelectOption(q.id, optId)}
                    mode="interactive"
                    showSolution={Boolean(isSolutionRevealed)}
                    showCorrectAnswer={Boolean(isSolutionRevealed)}
                  />

                  {/* Official Answer Key Toggle */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleRevealSolution(q.id)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-800" />
                      <span>{isSolutionRevealed ? 'Hide Solution' : 'Check Official Answer & Key'}</span>
                    </button>

                    <span className="text-[11px] font-mono text-stone-400">
                      Official Master Key: Option {q.correctAnswer}
                    </span>
                  </div>

                  {/* Solution Expansion */}
                  {isSolutionRevealed && (
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-amber-950 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Master Answer: Option {q.correctAnswer}</span>
                      </div>
                      <p className="text-stone-700 leading-relaxed">
                        {q.explanation || 'Verified with Official Commission Master Answer Key.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Final Submit Block */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center space-y-3">
              <h3 className="text-base font-bold font-serif-editorial text-stone-900">
                Completed the Paper?
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Submit your answers to generate your official commission scorecard and topic-wise performance breakdown.
              </p>
              <button
                onClick={handleSubmitPaper}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit & Generate Scorecard</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODE B: TIMED SIMULATION / SINGLE-QUESTION FOCUS */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {currentSingleQuestion && (
                <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {currentQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-stone-500 font-mono">
                        Question {currentQuestionIndex + 1} of {paperQuestions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMarkForReview(currentSingleQuestion.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          markedForReview[currentSingleQuestion.id]
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{markedForReview[currentSingleQuestion.id] ? 'Marked' : 'Mark for Review'}</span>
                      </button>

                      <button
                        onClick={() => askTutorWithContext(currentSingleQuestion.question, `${activePaper.paperTitle} • Q${currentQuestionIndex + 1}`)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-stone-600 hover:text-amber-800 border border-stone-200 transition-colors cursor-pointer"
                        title="Ask AI Tutor"
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Badge */}
                  {showQuestionMetadata && (
                    <div className="flex flex-wrap items-center gap-2 py-1 px-3 rounded-xl bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600">
                      <span className="font-bold text-stone-500 font-mono uppercase text-[10px]">Metadata:</span>
                      <span className="font-bold text-stone-800">{currentSingleQuestion.subject || 'General Studies'}</span>
                      {currentSingleQuestion.topic && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-stone-600">{currentSingleQuestion.topic}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Question Renderer */}
                  <QuestionRenderer
                    question={currentSingleQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    language={displayLanguage}
                    selectedOption={userAnswers[currentSingleQuestion.id]}
                    selectedOptionId={userAnswers[currentSingleQuestion.id]}
                    onSelectOption={(optId) => handleSelectOption(currentSingleQuestion.id, optId)}
                    mode="interactive"
                    showSolution={Boolean(revealedSolutions[currentSingleQuestion.id])}
                    showCorrectAnswer={Boolean(revealedSolutions[currentSingleQuestion.id])}
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
                      {currentQuestionIndex + 1} / {paperQuestions.length}
                    </span>

                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(paperQuestions.length - 1, prev + 1))}
                      disabled={currentQuestionIndex === paperQuestions.length - 1}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentQuestionIndex === paperQuestions.length - 1
                          ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                          : 'bg-amber-800 hover:bg-amber-900 text-white border-amber-800 shadow-2xs'
                      }`}
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Question Palette Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 space-y-4 sticky top-20">
                <div className="border-b border-stone-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
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

                <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto p-1">
                  {paperQuestions.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isMarked = markedForReview[q.id];
                    const isCurrent = idx === currentQuestionIndex;

                    let btnStyle = 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100';
                    if (isCurrent) {
                      btnStyle = 'bg-stone-900 text-white border-stone-900 font-bold ring-2 ring-amber-500';
                    } else if (isMarked) {
                      btnStyle = 'bg-amber-100 text-amber-950 border-amber-400 font-bold';
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
                  onClick={handleSubmitPaper}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  Submit Examination
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Mobile & Desktop Navigator */}
        <PyqMobileNavigator
          questions={paperQuestions}
          currentIndex={currentQuestionIndex}
          onSelectQuestion={(idx) => {
            setCurrentQuestionIndex(idx);
            if (viewMode === 'COMPLETE_PAPER') {
              const el = document.getElementById(`question-${idx + 1}`);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onPrevious={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentQuestionIndex(prev => Math.min(paperQuestions.length - 1, prev + 1))}
          userAnswers={userAnswers}
          markedForReview={markedForReview}
          bookmarkedQuestions={bookmarkedQuestions}
          onToggleBookmark={handleToggleBookmark}
          onSubmit={handleSubmitPaper}
          isOpen={showMobileNavigator}
          onToggleOpen={() => setShowMobileNavigator(prev => !prev)}
          mode={viewMode}
        />

        {/* Paper Syllabus Blueprint Modal */}
        <PyqPaperAnalysisModal
          paper={activePaper}
          questions={paperQuestions}
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          onFilterSubject={(subj) => setAnalyticalSubjectFilter(subj)}
          onNavigateToTopicPractice={() => setActiveSection('practice')}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PRIMARY VIEW: PYQ ARCHIVE HIERARCHY (EXAM -> YEAR -> PAPER)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* View Header & Explicit Distinction Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
              OFFICIAL COMMISSION ARCHIVE
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              Complete Examination Papers (Original Sequence)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <FolderArchive className="w-7 h-7 text-amber-800" />
            <span>Official PYQ Library</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium max-w-2xl">
            Browse and attempt complete, authentic UPSC Civil Services and BPSC question papers preserved in their original question order (Q1 to Q100/150).
          </p>
        </div>

        {/* Clear Distinction Callout to Topic Practice */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSection('practice')}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-800" />
            <span>Switch to Topic & Subject Practice</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Distinction Explanatory Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950">
              Authentic Commission Hierarchy: Exam → Year → Paper
            </p>
            <p className="text-stone-600 leading-relaxed">
              Every paper in this library preserves the original question order, numbering, and official commission master answer keys. Subject and topic classification is preserved as an analytical layer for performance tracking and post-test insights.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveSection('practice')}
          className="shrink-0 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-bold rounded-lg transition-colors cursor-pointer self-start md:self-auto"
        >
          Explore Topic Practice
        </button>
      </div>

      {/* LEVEL 1: EXAM SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono flex items-center gap-1.5">
            <Building className="w-4 h-4 text-amber-800" />
            <span>Step 1: Select Examination Commission</span>
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            {availableExams.length} Official Commissions Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableExams.map(exam => {
            const isSelected = selectedExam === exam;
            const isBpsc = exam.toLowerCase().includes('bpsc');
            const totalForExam = papers.filter(p => p.exam === exam).length;

            return (
              <button
                key={exam}
                onClick={() => handleSelectExam(exam)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-50/60 border-amber-500 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 font-serif-editorial">
                      {isBpsc ? 'Bihar Public Service Commission' : 'Union Public Service Commission'}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                      {exam}
                    </span>
                  </div>
                  <p className="text-stone-500 text-xs font-sans">
                    {isBpsc ? 'Combined Competitive Examination (CCE) Prelims' : 'Civil Services Preliminary Examination (GS & CSAT)'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-mono text-stone-700 block">
                    {totalForExam} Papers
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">100% Verified</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL 2: YEAR / CYCLE SELECTION TIMELINE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-800" />
            <span>Step 2: Select Examination Year / Cycle</span>
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            {availableYearsForSelectedExam.length} Examination Cycles
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {availableYearsForSelectedExam.map(yr => {
            const isSelected = selectedYear === yr;
            const papersInYear = papers.filter(
              p => p.exam === selectedExam && String(p.year) === yr
            );

            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{yr}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                }`}>
                  {papersInYear.length} {papersInYear.length === 1 ? 'Paper' : 'Papers'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL 3: PAPERS IN CHOSEN EXAM & YEAR */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-800" />
              <span>Step 3: Choose Paper to Open Complete Question Sequence</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Showing official papers for <strong>{selectedExam}</strong> • <strong>{selectedYear}</strong>
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search paper name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-stone-500 text-xs font-mono">Loading official commission archives...</p>
          </div>
        ) : papersInSelectedHierarchy.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <FolderArchive className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No papers match this cycle</h3>
            <p className="text-stone-500 text-xs max-w-md mx-auto">
              Try choosing another year or resetting the search filter to browse the archive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {papersInSelectedHierarchy.map(paper => (
              <PyqPaperCard
                key={paper.id}
                paper={paper}
                onOpenCompletePaper={(p) => handleOpenPaper(p, 'COMPLETE_PAPER')}
                onLaunchSimulation={(p) => handleOpenPaper(p, 'SIMULATION_EXAM')}
                onOpenAnalysis={async (p) => {
                  try {
                    const res = await api.getPYQPaperQuestions(p.id);
                    setActivePaper(p);
                    setPaperQuestions(res.questions || []);
                    setShowAnalysisModal(true);
                  } catch (e) {
                    console.error('Failed to load questions for blueprint:', e);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

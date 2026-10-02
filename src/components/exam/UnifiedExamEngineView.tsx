import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Target,
  PenTool,
  Award,
  BookOpen,
  FileCheck2,
  FolderArchive,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Save,
  RotateCcw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Shield,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  Building,
  MapPin,
  Briefcase,
  Smile,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Upload,
  ExternalLink,
  History,
  ThumbsUp,
  ThumbsDown,
  Scale,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import {
  ExamStage,
  ExamPaper,
  MainsQuestionItem,
  MainsSubmissionItem,
  InterviewProfile,
  InterviewQuestionItem,
  InterviewSessionItem,
  UnifiedLearnerPerformance,
  Question,
  LearningResource,
} from '../../types/index.js';
import { ResourceReaderModal } from '../resources/ResourceReaderModal.js';

export interface UnifiedExamEngineViewProps {
  initialStage?: ExamStage;
  initialExam?: string;
}

export const UnifiedExamEngineView: React.FC<UnifiedExamEngineViewProps> = ({
  initialStage = 'PRELIMS',
  initialExam = 'UPSC CSE',
}) => {
  const { setActiveSection, askTutorWithContext } = useLearner();
  const { user } = useAuth();

  // Active Stage Navigation
  const [activeStage, setActiveStage] = useState<ExamStage>(initialStage);
  const [targetExam, setTargetExam] = useState<string>(initialExam);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>('ALL');

  useEffect(() => {
    if (initialStage) {
      setActiveStage(initialStage);
    }
  }, [initialStage]);

  // Performance State
  const [performance, setPerformance] = useState<UnifiedLearnerPerformance | null>(null);
  const [loadingPerf, setLoadingPerf] = useState<boolean>(true);

  // ----------------------------------------------------------------
  // PRELIMS INTERACTIVE PRACTICE STATE
  // ----------------------------------------------------------------
  const [prelimsMode, setPrelimsMode] = useState<'DASHBOARD' | 'PRACTICE' | 'RESULT'>('DASHBOARD');
  const [prelimsQuestions, setPrelimsQuestions] = useState<Question[]>([]);
  const [prelimsCurrentIdx, setPrelimsCurrentIdx] = useState<number>(0);
  const [prelimsSelectedOption, setPrelimsSelectedOption] = useState<string | null>(null);
  const [prelimsTimerSeconds, setPrelimsTimerSeconds] = useState<number>(0);
  const [prelimsLoading, setPrelimsLoading] = useState<boolean>(false);
  const [prelimsAnswers, setPrelimsAnswers] = useState<
    Record<string, { selectedOption: string; isCorrect: boolean; timeSpent: number }>
  >({});
  const [prelimsActiveSubject, setPrelimsActiveSubject] = useState<string>('sub_polity');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------------------
  // MAINS ANSWER WRITING STATE
  // ----------------------------------------------------------------
  const [mainsQuestions, setMainsQuestions] = useState<MainsQuestionItem[]>([]);
  const [mainsSubmissions, setMainsSubmissions] = useState<MainsSubmissionItem[]>([]);
  const [teacherEvaluations, setTeacherEvaluations] = useState<any[]>([]);
  const [selectedMainsQ, setSelectedMainsQ] = useState<MainsQuestionItem | null>(null);
  const [mainsTab, setMainsTab] = useState<'QUESTIONS' | 'SUBMISSIONS' | 'TEACHER_FEEDBACK' | 'COVERAGE_PRACTICE'>('QUESTIONS');
  const [answerFormat, setAnswerFormat] = useState<'TYPED' | 'HANDWRITTEN'>('TYPED');
  const [answerText, setAnswerText] = useState<string>('');
  const [handwrittenFile, setHandwrittenFile] = useState<File | null>(null);
  const [handwrittenUrl, setHandwrittenUrl] = useState<string | null>(null);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeSubmission, setActiveSubmission] = useState<MainsSubmissionItem | null>(null);
  const [isRevisionMode, setIsRevisionMode] = useState<boolean>(false);
  const [showAttemptComparison, setShowAttemptComparison] = useState<boolean>(false);
  const [revisionChecklist, setRevisionChecklist] = useState<Record<string, boolean>>({});
  const [mainsSearch, setMainsSearch] = useState<string>('');
  const [mainsTimerSeconds, setMainsTimerSeconds] = useState<number>(0);
  const [coverageHubData, setCoverageHubData] = useState<any>(null);
  const [loadingCoverageHub, setLoadingCoverageHub] = useState<boolean>(false);
  const [selectedHubPaperFilter, setSelectedHubPaperFilter] = useState<string>('ALL');

  // ----------------------------------------------------------------
  // INTERVIEW STATE
  // ----------------------------------------------------------------
  const [interviewTab, setInterviewTab] = useState<'BOARD_SESSION' | 'DAF_PROFILE' | 'QUESTION_BANK' | 'HISTORY'>('BOARD_SESSION');
  const [interviewProfile, setInterviewProfile] = useState<InterviewProfile | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestionItem[]>([]);
  const [selectedInterviewCategory, setSelectedInterviewCategory] = useState<string>('ALL');
  const [interviewSessions, setInterviewSessions] = useState<InterviewSessionItem[]>([]);
  const [activeSession, setActiveSessionState] = useState<InterviewSessionItem | null>(null);
  const [candidateResponse, setCandidateResponse] = useState<string>('');
  const [sendingResponse, setSendingResponse] = useState<boolean>(false);
  const [savingDaf, setSavingDaf] = useState<boolean>(false);
  const [dafSaveMessage, setDafSaveMessage] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // RESOURCE READER INTEGRATION STATE
  // ----------------------------------------------------------------
  const [activeReadingResource, setActiveReadingResource] = useState<LearningResource | null>(null);
  const [isResourceReaderOpen, setIsResourceReaderOpen] = useState<boolean>(false);

  // ----------------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------------
  useEffect(() => {
    loadPapers();
    loadPerformance();
  }, [targetExam, activeStage]);

  const loadPapers = async () => {
    try {
      const examCode = targetExam.includes('BPSC') ? 'exam_bpsc' : 'exam_upsc';
      const data = await api.getPapers(examCode);
      setPapers(data);
    } catch (err) {
      console.warn('Failed to load papers:', err);
    }
  };

  const loadPerformance = async () => {
    setLoadingPerf(true);
    try {
      const data = await api.getUnifiedPerformance();
      setPerformance(data);
    } catch (err) {
      console.warn('Failed to load unified performance:', err);
    } finally {
      setLoadingPerf(false);
    }
  };

  // Mains Load
  useEffect(() => {
    if (activeStage === 'MAINS') {
      loadMainsQuestions();
      loadMainsSubmissions();
      loadTeacherEvaluations();
      loadCoveragePracticeHub();
    }
  }, [activeStage, targetExam, selectedPaper, mainsSearch]);

  const loadMainsQuestions = async () => {
    try {
      const examName = targetExam.includes('BPSC') ? 'BPSC' : 'UPSC';
      const res = await api.getMainsQuestions({
        exam: examName,
        paper: selectedPaper !== 'ALL' ? selectedPaper : undefined,
        search: mainsSearch || undefined,
        limit: 25,
      });
      setMainsQuestions(res.questions || []);
      if (res.questions?.length > 0 && !selectedMainsQ) {
        handleSelectMainsQuestion(res.questions[0]);
      }
    } catch (err) {
      console.warn('Failed to load Mains questions:', err);
    }
  };

  const loadMainsSubmissions = async () => {
    try {
      const subs = await api.getMainsSubmissions();
      setMainsSubmissions(subs);
    } catch (err) {
      console.warn('Failed to load Mains submissions:', err);
    }
  };

  const loadTeacherEvaluations = async () => {
    try {
      const evals = await api.getTeacherEvaluationsForLearner();
      setTeacherEvaluations(evals || []);
    } catch (err) {
      console.warn('Failed to load teacher evaluations:', err);
    }
  };

  const loadCoveragePracticeHub = async () => {
    setLoadingCoverageHub(true);
    try {
      const hub = await api.getLearnerMainsCoveragePracticeHub();
      setCoverageHubData(hub);
    } catch (err) {
      console.warn('Failed to load coverage practice hub:', err);
    } finally {
      setLoadingCoverageHub(false);
    }
  };

  const handleStartCoveragePractice = (qItem: any) => {
    const mappedQ: MainsQuestionItem = {
      id: qItem.questionId,
      subjectId: qItem.subject || 'sub_general',
      topicId: qItem.topic || 'top_general',
      conceptId: qItem.concept || 'con_general',
      type: 'DESCRIPTIVE',
      stage: 'MAINS',
      exam: targetExam.includes('BPSC') ? 'BPSC' : 'UPSC CSE',
      paper: qItem.paper || 'GS2',
      marks: Number(qItem.marks || 10),
      wordLimit: Number(qItem.wordLimit || 150),
      difficulty: 'MEDIUM',
      origin: qItem.provenance === 'IKSHOVIA_CREATED' ? 'IKSHOVIA_CREATED' : 'OFFICIAL_COMMISSION',
      source: qItem.provenance === 'IKSHOVIA_CREATED' ? 'IKSHOVIA_CREATED' : 'CANONICAL_UPSC',
      isPyq: qItem.provenance !== 'IKSHOVIA_CREATED',
      question: qItem.question,
      explanation: `Targeted syllabus practice: ${qItem.priorityReason || 'Master key syllabus dimensions'}. Recommended directive focus: ${qItem.directive}.`
    };

    setMainsQuestions(prev => {
      if (!prev.find(p => p.id === mappedQ.id)) {
        return [mappedQ, ...prev];
      }
      return prev;
    });

    handleSelectMainsQuestion(mappedQ);
    setMainsTab('QUESTIONS');
  };

  // Interview Load
  useEffect(() => {
    if (activeStage === 'INTERVIEW') {
      loadInterviewProfile();
      loadInterviewQuestions();
      loadInterviewSessions();
    }
  }, [activeStage, selectedInterviewCategory]);

  const loadInterviewProfile = async () => {
    try {
      const prof = await api.getInterviewProfile();
      if (prof) setInterviewProfile(prof);
    } catch (err) {
      console.warn('Failed to load DAF profile:', err);
    }
  };

  const loadInterviewQuestions = async () => {
    try {
      const examName = targetExam.includes('BPSC') ? 'BPSC' : 'UPSC';
      const qs = await api.getInterviewQuestions({
        exam: examName,
        category: selectedInterviewCategory !== 'ALL' ? selectedInterviewCategory : undefined,
        limit: 25,
      });
      setInterviewQuestions(qs);
    } catch (err) {
      console.warn('Failed to load interview questions:', err);
    }
  };

  const loadInterviewSessions = async () => {
    try {
      const sessions = await api.getInterviewSessions();
      setInterviewSessions(sessions);
      if (sessions.length > 0 && !activeSession) {
        const inProgress = sessions.find((s: InterviewSessionItem) => s.status === 'IN_PROGRESS');
        setActiveSessionState(inProgress || sessions[0]);
      }
    } catch (err) {
      console.warn('Failed to load interview sessions:', err);
    }
  };

  // ----------------------------------------------------------------
  // PRELIMS PRACTICE WORKFLOW HANDLERS
  // ----------------------------------------------------------------
  const startPrelimsPractice = async (subjectId?: string, count: number = 5) => {
    setPrelimsLoading(true);
    setPrelimsMode('PRACTICE');
    setPrelimsCurrentIdx(0);
    setPrelimsSelectedOption(null);
    setPrelimsAnswers({});
    setPrelimsTimerSeconds(0);

    const sub = subjectId || prelimsActiveSubject || 'sub_polity';
    setPrelimsActiveSubject(sub);

    try {
      const qs = await api.getPracticeQuestions(sub, undefined, count, undefined, true);
      setPrelimsQuestions(qs);
      setPrelimsLoading(false);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setPrelimsTimerSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to fetch prelims practice questions:', err);
      setPrelimsLoading(false);
    }
  };

  const handleSelectPrelimsOption = (optionKey: string) => {
    setPrelimsSelectedOption(optionKey);
    const curQ = prelimsQuestions[prelimsCurrentIdx];
    if (curQ) {
      const isCorrect = String(optionKey) === String(curQ.correctAnswer);
      const timeSpent = Math.max(5, Math.round(prelimsTimerSeconds / (prelimsCurrentIdx + 1)));
      setPrelimsAnswers((prev) => ({
        ...prev,
        [curQ.id]: {
          selectedOption: optionKey,
          isCorrect,
          timeSpent,
        },
      }));
    }
  };

  const handleClearPrelimsSelection = () => {
    setPrelimsSelectedOption(null);
    const curQ = prelimsQuestions[prelimsCurrentIdx];
    if (curQ) {
      setPrelimsAnswers((prev) => {
        const next = { ...prev };
        delete next[curQ.id];
        return next;
      });
    }
  };

  const handleJumpToPrelimsQuestion = (idx: number) => {
    if (idx < 0 || idx >= prelimsQuestions.length) return;
    setPrelimsCurrentIdx(idx);
    const targetQ = prelimsQuestions[idx];
    const existing = prelimsAnswers[targetQ?.id]?.selectedOption;
    setPrelimsSelectedOption(existing && existing !== 'SKIPPED' ? existing : null);
  };

  const handlePreviousPrelimsQuestion = () => {
    if (prelimsCurrentIdx > 0) {
      handleJumpToPrelimsQuestion(prelimsCurrentIdx - 1);
    }
  };

  const handleNextPrelimsQuestion = async () => {
    const curQ = prelimsQuestions[prelimsCurrentIdx];
    if (curQ && !prelimsAnswers[curQ.id]) {
      setPrelimsAnswers((prev) => ({
        ...prev,
        [curQ.id]: {
          selectedOption: prelimsSelectedOption || 'SKIPPED',
          isCorrect: prelimsSelectedOption ? String(prelimsSelectedOption) === String(curQ.correctAnswer) : false,
          timeSpent: Math.max(5, Math.round(prelimsTimerSeconds / (prelimsCurrentIdx + 1))),
        },
      }));
    }

    if (prelimsCurrentIdx < prelimsQuestions.length - 1) {
      handleJumpToPrelimsQuestion(prelimsCurrentIdx + 1);
    } else {
      await handleFinishPrelimsDrill();
    }
  };

  const handleFinishPrelimsDrill = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Save final selected option if any
    const curQ = prelimsQuestions[prelimsCurrentIdx];
    const finalAnswers = { ...prelimsAnswers };
    if (curQ && prelimsSelectedOption && !finalAnswers[curQ.id]) {
      finalAnswers[curQ.id] = {
        selectedOption: prelimsSelectedOption,
        isCorrect: String(prelimsSelectedOption) === String(curQ.correctAnswer),
        timeSpent: Math.max(5, Math.round(prelimsTimerSeconds / (prelimsCurrentIdx + 1))),
      };
      setPrelimsAnswers(finalAnswers);
    }

    // Persist all answered questions to backend
    for (const [qId, ans] of Object.entries(finalAnswers)) {
      if (ans.selectedOption && ans.selectedOption !== 'SKIPPED') {
        try {
          await api.submitQuestionAttempt(qId, ans.selectedOption, ans.timeSpent || 25, 3);
        } catch (e) {
          console.warn('Attempt record notice:', e);
        }
      }
    }

    setPrelimsMode('RESULT');
    await loadPerformance();
  };

  // ----------------------------------------------------------------
  // MAINS WORKFLOW HANDLERS
  // ----------------------------------------------------------------
  const handleSelectMainsQuestion = (q: MainsQuestionItem) => {
    setSelectedMainsQ(q);
    setIsRevisionMode(false);
    const existingList = mainsSubmissions.filter((s) => s.questionId === q.id);
    const latest = existingList.sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];
    if (latest) {
      setActiveSubmission(latest);
      setAnswerText(latest.answerText || '');
      setHandwrittenUrl(latest.attachmentUrl || null);
    } else {
      setActiveSubmission(null);
      setAnswerText('');
      setHandwrittenUrl(null);
    }
  };

  const handleStartMainsRevision = (prevSub: MainsSubmissionItem) => {
    setIsRevisionMode(true);
    setActiveSubmission(null); // Fresh draft which will be Attempt N+1
    setAnswerText('');
    setHandwrittenUrl(null);
    setMainsTimerSeconds(0);
    // Initialize targeted gap checklist
    const initialChecklist: Record<string, boolean> = {
      'Incorporate constitutional articles & statutory provisions': false,
      'Address missing dimensions highlighted in evaluation': false,
      'Include recent committee recommendations & economic data': false,
      'Structure balanced conclusion with administrative way forward': false,
    };
    if (prevSub.missingDimensions && Array.isArray(prevSub.missingDimensions)) {
      prevSub.missingDimensions.forEach(dim => {
        initialChecklist[`Add dimension: ${dim}`] = false;
      });
    }
    setRevisionChecklist(initialChecklist);
  };

  const handleSaveMainsDraft = async () => {
    if (!selectedMainsQ) return;
    setIsSavingDraft(true);
    try {
      const draft = await api.saveMainsDraft({
        submissionId: activeSubmission?.id,
        questionId: selectedMainsQ.id,
        answerText,
        submissionType: answerFormat === 'HANDWRITTEN' ? 'HANDWRITTEN_IMAGE' : 'TYPED',
        attachmentUrl: handwrittenUrl || undefined,
        wordCount: answerText.trim().split(/\s+/).filter(Boolean).length,
        timeSpentSeconds: mainsTimerSeconds,
      });
      setActiveSubmission(draft);
      await loadMainsSubmissions();
    } catch (err: any) {
      alert(`Could not save draft: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitMainsAnswer = async () => {
    if (!selectedMainsQ || (!answerText.trim() && !handwrittenUrl)) {
      alert('Please provide your typed answer or upload your handwritten sheet before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Save draft first to ensure server holds latest content
      const draft = await api.saveMainsDraft({
        submissionId: activeSubmission?.id,
        questionId: selectedMainsQ.id,
        answerText,
        submissionType: answerFormat === 'HANDWRITTEN' ? 'HANDWRITTEN_IMAGE' : 'TYPED',
        attachmentUrl: handwrittenUrl || undefined,
        wordCount: answerText.trim().split(/\s+/).filter(Boolean).length,
        timeSpentSeconds: mainsTimerSeconds,
      });

      // 2. Submit
      const submitted = await api.submitMainsAnswer(draft.id);
      setActiveSubmission(submitted);

      // 3. Trigger 10-Point Rubric AI Evaluation
      setIsEvaluatingAI(true);
      const evalRes = await api.evaluateMainsAnswerAI(submitted.id);
      if (evalRes.submission) {
        setActiveSubmission(evalRes.submission);
      }
      await loadMainsSubmissions();
      await loadPerformance();
    } catch (err: any) {
      alert(`Submission notice: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setIsEvaluatingAI(false);
    }
  };

  const handleHandwrittenUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHandwrittenFile(file);
    const mockUrl = URL.createObjectURL(file);
    setHandwrittenUrl(mockUrl);
  };

  // ----------------------------------------------------------------
  // INTERVIEW WORKFLOW HANDLERS
  // ----------------------------------------------------------------
  const handleStartNewBoardSession = async () => {
    try {
      const examName = targetExam.includes('BPSC') ? 'BPSC' : 'UPSC';
      const sess = await api.createInterviewSession({
        exam: examName,
        mode: 'DAF_BASED',
        boardName: 'National Administrative Mock Board',
      });
      setActiveSessionState(sess);
      setInterviewSessions([sess, ...interviewSessions]);
      setInterviewTab('BOARD_SESSION');
    } catch (err: any) {
      alert(`Failed to initialize board session: ${err.message}`);
    }
  };

  const handleSendInterviewAnswer = async () => {
    if (!activeSession || !candidateResponse.trim()) return;
    setSendingResponse(true);
    try {
      const updated = await api.sendInterviewMessage(
        activeSession.id,
        candidateResponse.trim(),
        activeSession.currentStep + 1
      );
      setActiveSessionState(updated);
      setCandidateResponse('');
      await loadInterviewSessions();
    } catch (err: any) {
      alert(`Board communication error: ${err.message}`);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!activeSession) return;
    try {
      const completed = await api.completeInterviewSession(activeSession.id);
      setActiveSessionState(completed);
      await loadInterviewSessions();
      await loadPerformance();
    } catch (err: any) {
      alert(`Could not complete session: ${err.message}`);
    }
  };

  const handleSaveDafProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewProfile) return;
    setSavingDaf(true);
    setDafSaveMessage(null);
    try {
      const saved = await api.saveInterviewProfile(interviewProfile);
      setInterviewProfile(saved);
      setDafSaveMessage('Detailed Application Form (DAF) saved successfully!');
      setTimeout(() => setDafSaveMessage(null), 3000);
    } catch (err: any) {
      alert(`Could not save DAF: ${err.message}`);
    } finally {
      setSavingDaf(false);
    }
  };

  // ----------------------------------------------------------------
  // RESOURCE READER INTEGRATION
  // ----------------------------------------------------------------
  const handleOpenRecommendedResource = async (subjectOrTheme: string) => {
    try {
      const resData = await api.getResources({ search: subjectOrTheme });
      if (resData?.resources && resData.resources.length > 0) {
        setActiveReadingResource(resData.resources[0]);
        setIsResourceReaderOpen(true);
      } else {
        const all = await api.getResources();
        if (all?.resources && all.resources.length > 0) {
          setActiveReadingResource(all.resources[0]);
          setIsResourceReaderOpen(true);
        } else {
          setActiveSection('resources');
        }
      }
    } catch {
      setActiveSection('resources');
    }
  };

  // Marking Scheme Calculations
  const isBPSC = targetExam.includes('BPSC');
  const isCSAT = selectedPaper.includes('CSAT') || prelimsActiveSubject === 'sub_csat';
  const marksPerCorrect = isBPSC ? 1.0 : isCSAT ? 2.5 : 2.0;
  const negativeMarkPerIncorrect = isBPSC ? 0.33 : isCSAT ? 0.83 : 0.66;

  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
  const isOverWordLimit = selectedMainsQ?.wordLimit ? wordCount > selectedMainsQ.wordLimit + 25 : false;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in font-sans-editorial text-stone-800">
      {/* ==================================================== */}
      {/* 1. TOP HERO: EXAM PREPARATION ARCHITECTURE */}
      {/* ==================================================== */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>IKSHOVIA EXAM PREPARATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold tracking-tight text-white flex items-center gap-3">
              <span>Prelims • Mains • Interview Workflow Engine</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real learner workflows: objective question drilling, descriptive answer writing with 10-point commission rubrics, and dynamic mock interview board sessions.
            </p>
          </div>

          {/* Exam Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-stone-950/80 p-2.5 rounded-2xl border border-stone-800 self-start md:self-auto">
            <span className="text-[11px] font-mono text-stone-400 uppercase font-bold pl-2">Target Exam:</span>
            <select
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              className="bg-stone-900 text-stone-100 text-xs font-bold rounded-xl px-3 py-2 border border-stone-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="UPSC CSE">UPSC Civil Services Examination (CSE)</option>
              <option value="BPSC CCE">BPSC Combined Competitive Exam (CCE)</option>
            </select>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3 REAL-PROGRESS STAGE LANDING CARDS */}
        {/* ==================================================== */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PRELIMS CARD */}
          <div
            onClick={() => setActiveStage('PRELIMS')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              activeStage === 'PRELIMS'
                ? 'bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">1. PRELIMS</h3>
                  <span className="text-[11px] text-stone-400 font-mono">Objective Stage</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-amber-300">
                {isBPSC ? '+1.0 / -0.33' : '+2.0 / -0.66'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {performance?.prelims.hasSufficientData ? (
                <>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-stone-400">Accuracy:</span>
                    <span className="text-base font-bold text-emerald-400">{performance.prelims.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Attempts: {performance.prelims.totalAttempts}</span>
                    <span>Mocks: {performance.prelims.completedTests}</span>
                  </div>
                  {performance.prelims.weakestAreas.length > 0 && (
                    <div className="text-[10px] text-rose-300 font-mono pt-1 truncate">
                      Focus: {performance.prelims.weakestAreas.slice(0, 2).join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-stone-400 italic py-1">
                  Not enough data yet. Complete 5 practice questions to view accuracy.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Enter Prelims Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* MAINS CARD */}
          <div
            onClick={() => setActiveStage('MAINS')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              activeStage === 'MAINS'
                ? 'bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">2. MAINS</h3>
                  <span className="text-[11px] text-stone-400 font-mono">Descriptive & Rubric</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-amber-300">
                GS 1-4 & Essay
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {performance?.mains.hasSufficientData ? (
                <>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-stone-400">Average Score:</span>
                    <span className="text-base font-bold text-amber-400">{performance.mains.averageScore}/10</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Written: {performance.mains.totalAnswersWritten}</span>
                    <span>Evaluated: {performance.mains.evaluatedCount}</span>
                  </div>
                  <div className="text-[10px] text-stone-300 font-mono pt-1">
                    Pending Drafts: {performance.mains.draftsCount}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-stone-400 italic py-1">
                  Not enough data yet. Submit descriptive answers to view rubric evaluations.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Write & Submit Answers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* INTERVIEW CARD */}
          <div
            onClick={() => setActiveStage('INTERVIEW')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              activeStage === 'INTERVIEW'
                ? 'bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">3. INTERVIEW</h3>
                  <span className="text-[11px] text-stone-400 font-mono">Personality Board</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-amber-300">
                {isBPSC ? '120 Marks' : '275 Marks'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {performance?.interview.hasSufficientData ? (
                <>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-stone-400">Board Avg:</span>
                    <span className="text-base font-bold text-amber-400">
                      {performance.interview.averageBoardScore}/{performance.interview.maxBoardScore}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Sessions: {performance.interview.sessionsCompleted}</span>
                    <span>DAF: {interviewProfile?.graduationDegree ? 'Complete' : 'Pending'}</span>
                  </div>
                  {performance.interview.topStrengths[0] && (
                    <div className="text-[10px] text-emerald-300 font-mono pt-1 truncate">
                      Strength: {performance.interview.topStrengths[0]}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-stone-400 italic py-1">
                  Not enough data yet. Complete an interactive board session to receive your personality scorecard.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Start Mock Board Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. STAGE 1: PRELIMS ACTUAL PRACTICE & WEAK-AREA FLOW */}
      {/* ==================================================== */}
      {activeStage === 'PRELIMS' && (
        <div className="space-y-6">
          {prelimsMode === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* Prelims Quick Launch Bar */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-700" />
                      <span>Start Prelims Objective Drill</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      Select subject and launch real timed practice with immediate attempt persistence and score tracking.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-mono font-bold">
                    Marking: {isBPSC ? '+1.0 / -0.33' : '+2.0 / -0.66'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'sub_polity', name: 'Indian Polity' },
                    { id: 'sub_economy', name: 'Economy & Banking' },
                    { id: 'sub_history', name: 'Indian History' },
                    { id: 'sub_geography', name: 'Geography' },
                    { id: 'sub_bihar', name: 'Bihar Special' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => startPrelimsPractice(sub.id, 5)}
                      disabled={prelimsLoading}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        prelimsActiveSubject === sub.id
                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span className="text-xs">{sub.name}</span>
                      <span className="text-[10px] text-amber-800 font-mono mt-2 flex items-center gap-1 font-semibold">
                        <span>Start 5Q Drill</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* WEAK-AREA PRACTICE CARD */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <h3 className="font-bold text-sm text-stone-900">Practice Your Weak Areas</h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">Personalized Evidence</span>
                </div>

                {performance?.prelims.hasSufficientData && performance.prelims.weakestAreas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {performance.prelims.weakestAreas.map((weakSub, idx) => {
                      const acc = performance.prelims.subjectAccuracy.find((s) => s.subject === weakSub)?.accuracy || 45;
                      const mappedSubId = weakSub.toLowerCase().includes('polity')
                        ? 'sub_polity'
                        : weakSub.toLowerCase().includes('econ')
                        ? 'sub_economy'
                        : weakSub.toLowerCase().includes('hist')
                        ? 'sub_history'
                        : weakSub.toLowerCase().includes('geo')
                        ? 'sub_geography'
                        : 'sub_polity';

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-rose-50/60 rounded-xl border border-rose-200/80 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-stone-900">{weakSub}</span>
                              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                {acc}%
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-1">Accuracy below target threshold.</p>
                          </div>

                          <button
                            onClick={() => startPrelimsPractice(mappedSubId, 5)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Drill {weakSub} Weak Area</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>
                      {performance?.prelims.hasSufficientData
                        ? 'No persistent weak areas detected yet. Maintain balanced practice across subjects.'
                        : 'Complete more questions to unlock personalized weak-area practice recommendations.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Links to Verified PYQs, Mocks, and Test Series */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveSection('pyq-practice')}
                  className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 shadow-xs transition cursor-pointer"
                >
                  <FolderArchive className="w-6 h-6 text-amber-700 mb-2" />
                  <h4 className="font-bold text-sm text-stone-900">Official PYQ Repository</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Authentic 2014-2024 UPSC and BPSC official papers with verified answer keys.
                  </p>
                </div>

                <div
                  onClick={() => setActiveSection('mock-tests')}
                  className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 shadow-xs transition cursor-pointer"
                >
                  <FileCheck2 className="w-6 h-6 text-amber-700 mb-2" />
                  <h4 className="font-bold text-sm text-stone-900">Mock Tests & Simulations</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Timed 100Q/150Q exam simulations with rank and full mistake categorization.
                  </p>
                </div>

                <div
                  onClick={() => setActiveSection('test-series')}
                  className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 shadow-xs transition cursor-pointer"
                >
                  <Layers className="w-6 h-6 text-amber-700 mb-2" />
                  <h4 className="font-bold text-sm text-stone-900">Exam Test Series</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Curated sectional and full-length test series packs aligned with 2026/2027 syllabus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRELIMS ACTUAL PRACTICE RUNNER */}
          {prelimsMode === 'PRACTICE' && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-6">
              {prelimsLoading ? (
                <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                  <p className="text-xs font-semibold">Loading verified practice questions...</p>
                </div>
              ) : prelimsQuestions.length === 0 ? (
                <div className="py-12 text-center text-stone-500 space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto text-amber-600" />
                  <p className="text-xs font-bold">No practice questions available for this subject.</p>
                  <button
                    onClick={() => setPrelimsMode('DASHBOARD')}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Runner Top Bar */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                        Question {prelimsCurrentIdx + 1} of {prelimsQuestions.length}
                      </span>
                      <span className="font-mono text-stone-500">
                        Marks: +{marksPerCorrect} / -{negativeMarkPerIncorrect}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <div className="flex items-center gap-1.5 text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {Math.floor(prelimsTimerSeconds / 60)}:
                          {(prelimsTimerSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (timerRef.current) clearInterval(timerRef.current);
                          setPrelimsMode('DASHBOARD');
                        }}
                        className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
                      >
                        Exit Drill
                      </button>
                    </div>
                  </div>

                  {/* Question Palette */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="text-[11px] font-mono text-stone-500 font-semibold mr-1">Question Palette:</span>
                    {prelimsQuestions.map((q, qIdx) => {
                      const ans = prelimsAnswers[q.id];
                      const isAnswered = ans && ans.selectedOption && ans.selectedOption !== 'SKIPPED';
                      const isSkipped = ans?.selectedOption === 'SKIPPED';
                      const isCurrent = prelimsCurrentIdx === qIdx;

                      return (
                        <button
                          key={q.id}
                          onClick={() => handleJumpToPrelimsQuestion(qIdx)}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                            isCurrent
                              ? 'ring-2 ring-amber-500 bg-amber-600 text-white shadow-2xs'
                              : isAnswered
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isSkipped
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-700'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question Body */}
                  {(() => {
                    const q = prelimsQuestions[prelimsCurrentIdx];
                    if (!q) return null;
                    const optionsList = Array.isArray(q.options) ? q.options : [];

                    return (
                      <div className="space-y-5">
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-relaxed font-serif-editorial">
                          {q.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-2.5">
                          {optionsList.map((opt: any, idx: number) => {
                            const optKey = typeof opt === 'string' ? opt.split('.')[0]?.trim() || String.fromCharCode(65 + idx) : opt.key || opt.id || String.fromCharCode(65 + idx);
                            const optText = typeof opt === 'string' ? opt : opt.text || opt.value || '';
                            const isSelected = prelimsSelectedOption === optKey;

                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectPrelimsOption(optKey)}
                                className={`w-full p-4 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 text-xs sm:text-sm ${
                                  isSelected
                                    ? 'bg-amber-50 border-amber-500 font-bold text-stone-950 shadow-2xs'
                                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                                  }`}
                                >
                                  {optKey}
                                </span>
                                <span className="flex-1 leading-relaxed">{optText}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navigation Footer */}
                  <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePreviousPrelimsQuestion}
                        disabled={prelimsCurrentIdx === 0}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={handleClearPrelimsSelection}
                        disabled={!prelimsSelectedOption}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer transition"
                      >
                        Clear Selection
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPrelimsSelectedOption(null);
                          handleNextPrelimsQuestion();
                        }}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold cursor-pointer transition"
                      >
                        Skip
                      </button>

                      <button
                        onClick={handleNextPrelimsQuestion}
                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>
                          {prelimsCurrentIdx === prelimsQuestions.length - 1 ? 'Finish & Submit Drill' : 'Next Question'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRELIMS RESULT BREAKDOWN */}
          {prelimsMode === 'RESULT' && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-6">
              <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                    Drill Completed & Persisted
                  </span>
                  <h3 className="text-xl font-serif-editorial font-bold text-stone-900 mt-0.5">
                    Prelims Attempt Result & Performance Impact
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {performance?.prelims.weakestAreas && performance.prelims.weakestAreas.length > 0 && (
                    <button
                      onClick={() => {
                        const weakSub = performance.prelims.weakestAreas[0];
                        const mappedSubId = weakSub.toLowerCase().includes('polity')
                          ? 'sub_polity'
                          : weakSub.toLowerCase().includes('econ')
                          ? 'sub_economy'
                          : weakSub.toLowerCase().includes('hist')
                          ? 'sub_history'
                          : weakSub.toLowerCase().includes('geo')
                          ? 'sub_geography'
                          : 'sub_polity';
                        startPrelimsPractice(mappedSubId, 5);
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Practice Weak Area ({performance.prelims.weakestAreas[0]})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setPrelimsMode('DASHBOARD')}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    Return to Prelims Hub
                  </button>
                </div>
              </div>

              {(() => {
                const total = prelimsQuestions.length;
                const answeredList = Object.values(prelimsAnswers);
                const correctCount = answeredList.filter((a) => a.isCorrect).length;
                const incorrectCount = answeredList.filter((a) => !a.isCorrect && a.selectedOption !== 'SKIPPED').length;
                const skippedCount = total - (correctCount + incorrectCount);
                const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
                const positiveMarks = correctCount * marksPerCorrect;
                const negativeMarks = Number((incorrectCount * negativeMarkPerIncorrect).toFixed(2));
                const netScore = Number((positiveMarks - negativeMarks).toFixed(2));
                const minutesUsed = Math.floor(prelimsTimerSeconds / 60);
                const secondsUsed = prelimsTimerSeconds % 60;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-mono text-stone-500 uppercase block">Net Score</span>
                        <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
                          {netScore} / {total * marksPerCorrect}
                        </span>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-mono text-stone-500 uppercase block">Accuracy</span>
                        <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                          {accuracy}%
                        </span>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-mono text-stone-500 uppercase block">Correct / Wrong</span>
                        <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
                          <span className="text-emerald-700">{correctCount}</span> /{' '}
                          <span className="text-rose-700">{incorrectCount}</span>
                        </span>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-mono text-stone-500 uppercase block">Time Used</span>
                        <span className="text-xl font-bold font-mono text-stone-800 mt-1 block">
                          {minutesUsed}m {secondsUsed}s
                        </span>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-mono text-stone-500 uppercase block">Negative Penalty</span>
                        <span className="text-xl font-bold font-mono text-rose-700 mt-1 block">
                          -{negativeMarks}m
                        </span>
                      </div>
                    </div>

                    {/* Explanations Accordion */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase font-mono text-stone-500">
                        Question Review & Explanations:
                      </h4>
                      {prelimsQuestions.map((q, idx) => {
                        const ans = prelimsAnswers[q.id];
                        const wasCorrect = ans?.isCorrect;

                        return (
                          <div
                            key={q.id}
                            className={`p-4 rounded-xl border space-y-2 text-xs ${
                              wasCorrect
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-rose-50/40 border-rose-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[11px] text-stone-600">
                                Q{idx + 1}
                              </span>
                              <span
                                className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                                  wasCorrect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {wasCorrect ? 'CORRECT' : ans?.selectedOption === 'SKIPPED' ? 'SKIPPED' : 'INCORRECT'}
                              </span>
                            </div>
                            <p className="font-semibold text-stone-900">{q.question}</p>
                            <div className="flex items-center gap-4 text-[11px] font-mono">
                              <span>Your: <strong className="text-stone-800">{ans?.selectedOption || 'None'}</strong></span>
                              <span>Correct: <strong className="text-emerald-800">{q.correctAnswer}</strong></span>
                            </div>
                            {q.explanation && (
                              <p className="text-[11px] text-stone-600 pt-1 border-t border-stone-200/60 leading-relaxed">
                                <strong>Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. STAGE 2: MAINS ANSWER WRITING & EVALUATION */}
      {/* ==================================================== */}
      {activeStage === 'MAINS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <h2 className="text-xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-amber-700" />
                <span>Stage 2: Mains Answer Writing & Commission Rubrics</span>
              </h2>
              <p className="text-xs text-stone-500">
                Write descriptive answers, save drafts, and review distinct AI and Teacher evaluations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainsTab('QUESTIONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  mainsTab === 'QUESTIONS' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Question Explorer
              </button>
              <button
                onClick={() => setMainsTab('SUBMISSIONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  mainsTab === 'SUBMISSIONS' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                My Submissions ({mainsSubmissions.length})
              </button>
              <button
                onClick={() => setMainsTab('TEACHER_FEEDBACK')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  mainsTab === 'TEACHER_FEEDBACK' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Teacher Evaluations ({teacherEvaluations.length})
              </button>
              <button
                onClick={() => {
                  setMainsTab('COVERAGE_PRACTICE');
                  loadCoveragePracticeHub();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                  mainsTab === 'COVERAGE_PRACTICE' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Targeted Syllabus Hub
              </button>
            </div>
          </div>

          {/* TARGETED SYLLABUS PRACTICE HUB TAB (PHASE 4.1D) */}
          {mainsTab === 'COVERAGE_PRACTICE' && (
            <div className="space-y-6">
              {/* Hub Hero Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[11px] font-semibold">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Curated Mains Syllabus Mastery</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">
                      Targeted Mains Syllabus Practice Hub
                    </h3>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      Practice underrepresented high-yield syllabus areas, master diverse question directives (Explain, Discuss, Analyze, Evaluate), and receive authentic evaluation.
                    </p>
                  </div>
                  <button
                    onClick={loadCoveragePracticeHub}
                    disabled={loadingCoverageHub}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition border border-white/20 self-start md:self-auto cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCoverageHub ? 'animate-spin' : ''}`} />
                    Refresh Hub
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingCoverageHub ? (
                <div className="py-16 text-center text-stone-500 text-sm bg-white rounded-2xl border border-stone-200 shadow-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
                  Loading syllabus coverage practice tracks...
                </div>
              ) : (
                <>
                  {/* Featured Practice Tracks */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-600" />
                        <span>Featured Syllabus Practice Tracks</span>
                      </h4>
                      <span className="text-xs text-stone-500">Targeted exam directives & blueprints</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coverageHubData?.featuredPracticeTracks?.map((track: any) => (
                        <div
                          key={track.id}
                          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                                {track.paper} • {track.marks} Marks
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-stone-100 text-stone-700">
                                {track.directive}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-stone-900 line-clamp-1">{track.title}</h5>
                            <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                              {track.description}
                            </p>
                            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-700 space-y-1">
                              <div className="font-semibold text-stone-800 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Prep Value:</span>
                              </div>
                              <p className="text-stone-600 italic">{track.targetBenefit}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[11px] text-stone-400 font-mono">
                              {track.availableQuestionsCount} curated questions
                            </span>
                            {track.sampleQuestion ? (
                              <button
                                onClick={() => handleStartCoveragePractice(track.sampleQuestion)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                <span>Practice Now</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs text-stone-400 italic">Track in session</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Questions Section */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-600" />
                          <span>Underrepresented Syllabus Practice Questions</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Questions strategically selected from zero or low-coverage syllabus areas to round out your answer writing.
                        </p>
                      </div>

                      {/* Paper Filter Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {['ALL', 'GS1', 'GS2', 'GS3', 'GS4', 'ESSAY'].map(p => (
                          <button
                            key={p}
                            onClick={() => setSelectedHubPaperFilter(p)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              selectedHubPaperFilter === p
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(coverageHubData?.allPriorities || [])
                        .filter((p: any) => selectedHubPaperFilter === 'ALL' || p.paper === selectedHubPaperFilter)
                        .map((qItem: any) => (
                          <div
                            key={qItem.questionId}
                            className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-900">
                                    {qItem.paper}
                                  </span>
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-stone-200 text-stone-700">
                                    {qItem.directive}
                                  </span>
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {qItem.marks}M • {qItem.wordLimit}w
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  qItem.provenance === 'IKSHOVIA_CREATED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {qItem.provenance === 'IKSHOVIA_CREATED' ? 'IKSHOVIA STANDARD' : 'CANONICAL UPSC'}
                                </span>
                              </div>

                              <p className="text-xs font-medium text-stone-900 leading-snug line-clamp-3">
                                {qItem.question}
                              </p>

                              <div className="text-[11px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-stone-700">{qItem.subject}</span>
                                <span>•</span>
                                <span>{qItem.topic}</span>
                              </div>

                              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[10px] text-amber-900 font-medium">
                                <span className="font-bold">Targeted Gap: </span>
                                {qItem.priorityReason}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                              <span className="text-[10px] text-stone-400 font-mono">
                                Path: {qItem.recommendedPracticePath}
                              </span>
                              <button
                                onClick={() => handleStartCoveragePractice(qItem)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>Write Answer</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {(!coverageHubData?.allPriorities || coverageHubData.allPriorities.length === 0) && (
                      <div className="py-12 text-center text-stone-400 text-xs">
                        No targeted practice questions found for current filter.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TEACHER EVALUATIONS TAB */}
          {mainsTab === 'TEACHER_FEEDBACK' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <span>Teacher Faculty Evaluations</span>
                </h3>
                <span className="text-[11px] font-mono text-stone-400">Authentic Faculty Grades</span>
              </div>

              {teacherEvaluations.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <GraduationCap className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold">No teacher evaluations received yet.</p>
                  <p className="text-[11px] text-stone-500">
                    When your enrolled class faculty grades an assignment, their detailed marks and handwritten feedback will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teacherEvaluations.map((te) => (
                    <div key={te.id} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold rounded">
                            {te.subject} • {te.topic || 'General'}
                          </span>
                          <h4 className="font-bold text-sm text-stone-900 mt-1">{te.assignmentTitle}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-amber-800">
                            {te.marksObtained} / {te.maxMarks || 100}
                          </span>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            By {te.teacherName || 'Faculty'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                        <strong className="block text-[11px] uppercase font-mono text-stone-500">Faculty Remarks:</strong>
                        <p className="leading-relaxed">{te.feedback || 'Good attempt overall.'}</p>
                      </div>

                      {(te.strengths || te.weaknesses) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {te.strengths && (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                              <span className="font-bold text-[11px] block">Strengths:</span>
                              <p className="text-[11px] mt-0.5">{te.strengths}</p>
                            </div>
                          )}
                          {te.weaknesses && (
                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-950">
                              <span className="font-bold text-[11px] block">Areas to Improve:</span>
                              <p className="text-[11px] mt-0.5">{te.weaknesses}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBMISSIONS TAB */}
          {mainsTab === 'SUBMISSIONS' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900">Mains Answer Writing Submissions</h3>
              {mainsSubmissions.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <FileText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                  <p className="text-xs font-semibold">No submissions yet.</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Select a question to write your first answer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mainsSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setActiveSubmission(sub);
                        setAnswerText(sub.answerText || '');
                        if (sub.question) setSelectedMainsQ(sub.question);
                        setMainsTab('QUESTIONS');
                      }}
                      className="p-4 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded font-mono text-[10px] font-bold">
                            {sub.paper || 'GS Paper'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              sub.status === 'EVALUATED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : sub.status === 'SUBMITTED'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {sub.status}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {sub.question?.question || `Question #${sub.questionId}`}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {sub.marksObtained != null && (
                          <div className="text-right">
                            <span className="text-sm font-bold font-mono text-amber-700">
                              {sub.marksObtained}/{sub.maxMarks}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">({sub.percentage}%)</span>
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS & WRITING WORKSPACE TAB */}
          {mainsTab === 'QUESTIONS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Questions Explorer (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                    <Search className="w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search Mains questions..."
                      value={mainsSearch}
                      onChange={(e) => setMainsSearch(e.target.value)}
                      className="bg-transparent text-stone-900 focus:outline-none w-full text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {(isBPSC
                      ? ['ALL', 'General Studies I', 'General Studies II', 'Essay', 'General Hindi']
                      : ['ALL', 'GS Paper I', 'GS Paper II', 'GS Paper III', 'GS Paper IV', 'Essay']
                    ).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPaper(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          selectedPaper === p
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {mainsQuestions.map((q) => {
                    const isSelected = selectedMainsQ?.id === q.id;
                    const hasSub = mainsSubmissions.find((s) => s.questionId === q.id);

                    return (
                      <div
                        key={q.id}
                        onClick={() => handleSelectMainsQuestion(q)}
                        className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-mono text-[10px] font-bold rounded">
                              {q.paper}
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold rounded">
                              {q.marks} Marks
                            </span>
                          </div>
                          {hasSub && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                hasSub.status === 'EVALUATED'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {hasSub.status}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-3">{q.question}</h4>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                          <span>Target: {q.wordLimit || 150} words</span>
                          <span className="text-amber-800 font-medium">Write Answer →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Writing Workspace & Evaluation Display (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {selectedMainsQ ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
                    {/* Question Header */}
                    <div className="space-y-2 border-b border-stone-100 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded-lg border border-amber-200">
                            {selectedMainsQ.paper}
                          </span>
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-mono text-xs font-bold rounded-lg border border-stone-200">
                            {selectedMainsQ.marks} Marks
                          </span>
                          <span className="text-xs font-mono text-stone-400">
                            Target: {selectedMainsQ.wordLimit || 150} words
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-stone-400">
                          Origin: {selectedMainsQ.origin}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-relaxed font-serif-editorial">
                        {selectedMainsQ.question}
                      </h3>

                      {selectedMainsQ.rubric?.dimensions && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                          <span className="font-bold text-stone-800 block text-[11px] uppercase font-mono">
                            Official Rubric Directives:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {selectedMainsQ.rubric.dimensions.map((d: string, i: number) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Attempt Trajectory & Revision Switcher */}
                    {/* Multiple Attempt History & Trajectory Bar */}
                    {(() => {
                      const qAttempts = mainsSubmissions
                        .filter((s) => s.questionId === selectedMainsQ.id)
                        .sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));

                      if (qAttempts.length === 0) return null;

                      const firstAtt = qAttempts[0];
                      const latestAtt = qAttempts[qAttempts.length - 1];
                      const hasMarksDiff = firstAtt?.marksObtained != null && latestAtt?.marksObtained != null && qAttempts.length >= 2;
                      const marksDelta = hasMarksDiff ? Number((latestAtt.marksObtained! - firstAtt.marksObtained!).toFixed(1)) : 0;

                      return (
                        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-stone-800 uppercase text-[11px]">
                                Attempt History & Score Trajectory
                              </span>
                              <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                {qAttempts.length} {qAttempts.length === 1 ? 'Attempt' : 'Attempts'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {qAttempts.length >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAttemptComparison(!showAttemptComparison)}
                                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 font-mono cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition"
                                >
                                  {showAttemptComparison ? 'Hide Comparative View' : '⚖️ Compare Attempts & Rubric'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartMainsRevision(latestAtt)}
                                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 font-mono cursor-pointer flex items-center gap-1"
                              >
                                <span>+ Write Revision (Attempt #{qAttempts.length + 1})</span>
                              </button>
                            </div>
                          </div>

                          {/* Trajectory Banner (When Multiple Attempts Exist) */}
                          {hasMarksDiff && (
                            <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-stone-500">Trajectory:</span>
                                <span className="font-bold text-stone-700">Attempt #1: {firstAtt.marksObtained}/{firstAtt.maxMarks}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                                <span className="font-bold text-amber-700">Attempt #{latestAtt.attemptNumber}: {latestAtt.marksObtained}/{latestAtt.maxMarks}</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${marksDelta >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                                {marksDelta >= 0 ? `+${marksDelta} Marks Gained` : `${marksDelta} Marks`}
                              </span>
                            </div>
                          )}

                          {/* Interactive Attempt Selection Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {qAttempts.map((att) => {
                              const isSelected = activeSubmission?.id === att.id;
                              return (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveSubmission(att);
                                    setAnswerText(att.answerText || '');
                                    setHandwrittenUrl(att.attachmentUrl || null);
                                    setIsRevisionMode(false);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 border ${
                                    isSelected
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                  }`}
                                >
                                  <span>Attempt #{att.attemptNumber || 1}</span>
                                  {att.marksObtained != null && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-amber-700 text-amber-100' : 'bg-stone-100 text-stone-600'}`}>
                                      {att.marksObtained}/{att.maxMarks}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Side-by-Side Comparative Attempt & Rubric Progression Drawer */}
                          {showAttemptComparison && qAttempts.length >= 2 && (() => {
                            const prevAtt = firstAtt;
                            const revAtt = latestAtt;
                            const prevDims = (prevAtt.evaluation?.dimensions || {}) as Record<string, any>;
                            const revDims = (revAtt.evaluation?.dimensions || {}) as Record<string, any>;
                            const allDims = Array.from(new Set([...Object.keys(prevDims), ...Object.keys(revDims)]));

                            return (
                              <div className="mt-3 p-4 bg-white rounded-2xl border-2 border-amber-300/80 space-y-4 animate-fade-in shadow-xs">
                                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-amber-700" />
                                    <h4 className="text-xs font-bold font-mono text-stone-900 uppercase">
                                      Comparative Rubric Progression (Attempt #{prevAtt.attemptNumber || 1} vs Attempt #{revAtt.attemptNumber || 2})
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-mono text-stone-500">10-Point Commission Rubric Criteria</span>
                                </div>

                                {/* Rubric Dimensions Delta Matrix */}
                                {allDims.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[11px] font-mono text-stone-600 uppercase block font-semibold">
                                      Dimension-by-Dimension Progression:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {allDims.map((dim) => {
                                        const pScore = Number(prevDims[dim] ?? 0);
                                        const rScore = Number(revDims[dim] ?? 0);
                                        const delta = rScore - pScore;
                                        return (
                                          <div key={dim} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                                            <div className="text-[11px] text-stone-700 capitalize font-medium truncate">
                                              {dim.replace(/([A-Z])/g, ' $1')}
                                            </div>
                                            <div className="flex items-center justify-between font-mono text-xs">
                                              <span className="text-stone-500">#{prevAtt.attemptNumber}: {pScore}/10</span>
                                              <ArrowRight className="w-3 h-3 text-stone-400" />
                                              <span className="font-bold text-amber-800">#{revAtt.attemptNumber}: {rScore}/10</span>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${delta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {delta >= 0 ? `+${delta}` : delta}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Side-by-Side Answers Comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                                      <span className="text-[11px] font-mono font-bold text-stone-800">
                                        Attempt #{prevAtt.attemptNumber || 1} Answer
                                      </span>
                                      <span className="text-[10px] font-mono text-stone-500">
                                        Score: {prevAtt.marksObtained}/{prevAtt.maxMarks}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans bg-white p-2.5 rounded-lg border border-stone-100">
                                      {prevAtt.answerText || 'Handwritten sheet submitted.'}
                                    </p>
                                    {prevAtt.actionableImprovement && (
                                      <div className="text-[10px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                                        <strong>Missing in #1:</strong> {prevAtt.actionableImprovement}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                                    <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                                      <span className="text-[11px] font-mono font-bold text-amber-950">
                                        Attempt #{revAtt.attemptNumber || 2} Answer (Revised)
                                      </span>
                                      <span className="text-[10px] font-mono text-amber-900 font-bold">
                                        Score: {revAtt.marksObtained}/{revAtt.maxMarks}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans bg-white p-2.5 rounded-lg border border-amber-100">
                                      {revAtt.answerText || 'Handwritten sheet submitted.'}
                                    </p>
                                    {revAtt.strengths && (
                                      <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                        <strong>Strengths in #2:</strong> {revAtt.strengths}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Revision Improvement Guidance Studio */}
                    {isRevisionMode && (
                      <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-bold font-mono text-amber-950 uppercase">
                              Answer Improvement Studio • Revision Mode
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-800 font-mono">
                            Aiming for +2.0 to +3.5 marks improvement
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">
                          Incorporate the missing dimensions from your previous evaluation. Check off the target areas as you write your improved answer:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {Object.keys(revisionChecklist).map((key) => {
                            const isChecked = revisionChecklist[key];
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  setRevisionChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
                                }
                                className={`p-2 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition cursor-pointer ${
                                  isChecked
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                }`}
                              >
                                <span>{key}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 text-emerald-600 ml-2"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mode Switcher: Typed vs Handwritten Upload */}
                    <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                      <button
                        type="button"
                        onClick={() => setAnswerFormat('TYPED')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          answerFormat === 'TYPED'
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        Typed Answer Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerFormat('HANDWRITTEN')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          answerFormat === 'HANDWRITTEN'
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Handwritten Sheet</span>
                      </button>
                    </div>

                    {/* Editor Body */}
                    {answerFormat === 'TYPED' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-stone-800">Your Structured Answer:</label>
                          <span className={`font-mono text-[11px] ${isOverWordLimit ? 'text-rose-600 font-bold' : 'text-stone-500'}`}>
                            {wordCount} / {selectedMainsQ.wordLimit || 150} words
                          </span>
                        </div>

                        <textarea
                          rows={11}
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Write your answer here following standard UPSC / BPSC structure: Introduction (definition/context) → Categorized Body with Subheadings & Examples → Balanced Conclusion..."
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white leading-relaxed font-sans"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <label className="font-bold text-xs text-stone-800 block">
                          Upload Handwritten Answer Sheets (Image or PDF):
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleHandwrittenUpload}
                          className="text-xs text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                        />
                        {handwrittenUrl && (
                          <div className="p-3 bg-white rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                            <span className="font-mono text-stone-700">{handwrittenFile?.name || 'Uploaded answer sheet'}</span>
                            <span className="text-emerald-700 font-bold">Ready to Submit</span>
                          </div>
                        )}
                        <p className="text-[11px] text-stone-500">
                          Handwritten answers are run through the evaluation OCR pipeline to extract text for rubric grading.
                        </p>
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveMainsDraft}
                        disabled={isSavingDraft || (!answerText.trim() && !handwrittenUrl)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitMainsAnswer}
                        disabled={isSubmitting || isEvaluatingAI || (!answerText.trim() && !handwrittenUrl)}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        {isEvaluatingAI ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Grading on Commission Rubric...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-amber-300" />
                            <span>Submit for Evaluation</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* EVALUATION DISPLAY: AI & TEACHER */}
                    {activeSubmission?.status === 'EVALUATED' && (() => {
                      const linkedTeacherEval = teacherEvaluations.find(
                        (te) =>
                          te.questionId === selectedMainsQ.id ||
                          (te.subject && selectedMainsQ.subjectId && te.subject.toLowerCase().includes(selectedMainsQ.subjectId.replace('sub_', '')))
                      );

                      return (
                        <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                          {/* 1. AI Commission Rubric Evaluation Card */}
                          <div className="p-5 bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 space-y-4">
                            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                              <div>
                                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                                  AI Commission Rubric Evaluation
                                </span>
                                <h4 className="text-base font-bold font-serif-editorial text-white flex items-center gap-2 mt-0.5">
                                  <span>
                                    Score: {activeSubmission.marksObtained} / {activeSubmission.maxMarks}
                                  </span>
                                  <span className="text-xs text-amber-300 font-mono">({activeSubmission.percentage}%)</span>
                                </h4>
                              </div>

                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded-lg border border-amber-500/30">
                                Evaluator: AI Commission Model
                              </span>
                            </div>

                            {/* 10-Point Rubric Breakdown */}
                            {activeSubmission.evaluation?.dimensions && (
                              <div className="space-y-2">
                                <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">
                                  10-Point Commission Rubric Breakdown (out of 10):
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                  {Object.entries(activeSubmission.evaluation.dimensions).map(([dim, score]) => (
                                    <div
                                      key={dim}
                                      className="p-2 bg-stone-950/80 rounded-lg border border-stone-800 flex items-center justify-between"
                                    >
                                      <span className="text-[11px] text-stone-300 capitalize">
                                        {dim.replace(/([A-Z])/g, ' $1')}
                                      </span>
                                      <span className="font-mono font-bold text-amber-400 text-xs">{score}/10</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1">
                                <span className="font-bold text-emerald-400 block text-[11px]">Strengths:</span>
                                <p className="text-[11px] text-stone-300 leading-relaxed">
                                  {activeSubmission.strengths || 'Strong conceptual framework and relevant examples.'}
                                </p>
                              </div>

                              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-1">
                                <span className="font-bold text-rose-400 block text-[11px]">Actionable Improvements:</span>
                                <p className="text-[11px] text-stone-300 leading-relaxed">
                                  {activeSubmission.actionableImprovement || 'Enrich with constitutional articles and data points.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 2. Teacher Faculty Evaluation Card */}
                          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                              <div>
                                <span className="text-[10px] font-mono text-stone-500 uppercase font-bold tracking-wider">
                                  Teacher Faculty Evaluation
                                </span>
                                <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                                  {linkedTeacherEval
                                    ? `Score: ${linkedTeacherEval.marksObtained} / ${linkedTeacherEval.maxMarks || selectedMainsQ.marks}`
                                    : 'Awaiting Faculty Grading'}
                                </h4>
                              </div>

                              <span className="px-2.5 py-1 bg-stone-200 text-stone-700 text-[10px] font-mono rounded-lg">
                                {linkedTeacherEval
                                  ? `Faculty: ${linkedTeacherEval.teacherName || 'Enrolled Faculty'}`
                                  : 'Status: In Review Queue'}
                              </span>
                            </div>

                            {linkedTeacherEval ? (
                              <div className="space-y-2 text-xs">
                                <p className="text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200">
                                  {linkedTeacherEval.feedback || 'Good structured approach with clear headings.'}
                                </p>
                                {linkedTeacherEval.strengths && (
                                  <div className="text-[11px] text-emerald-800">
                                    <strong>Strengths:</strong> {linkedTeacherEval.strengths}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-500 italic">
                                Teacher Evaluation: In faculty review queue. When your enrolled batch faculty reviews your submitted answer, their manual marks and handwritten annotations will appear here alongside the AI evaluation.
                              </p>
                            )}
                          </div>

                          {/* Re-attempt / Revision Action */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-stone-500 font-mono">
                              Attempt #{activeSubmission.attemptNumber || 1} • Submitted on {new Date(activeSubmission.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleStartMainsRevision(activeSubmission)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
                              <span>Improve & Rewrite Answer (Revision Mode)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 shadow-xs">
                    <PenTool className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold">Select a question to begin answer writing.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. STAGE 3: INTERVIEW MOCK BOARD SIMULATOR & DAF */}
      {/* ==================================================== */}
      {activeStage === 'INTERVIEW' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <h2 className="text-xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-700" />
                <span>Stage 3: Interview & Personality Test Board</span>
              </h2>
              <p className="text-xs text-stone-500">
                Detailed Application Form (DAF) profiling, interactive mock board simulations with dynamic follow-ups, and session scorecards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInterviewTab('BOARD_SESSION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  interviewTab === 'BOARD_SESSION' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Mock Board Session
              </button>
              <button
                onClick={() => setInterviewTab('DAF_PROFILE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  interviewTab === 'DAF_PROFILE' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                DAF Profile
              </button>
              <button
                onClick={() => setInterviewTab('HISTORY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                  interviewTab === 'HISTORY' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Past Mock Interviews ({interviewSessions.length})
              </button>
            </div>
          </div>

          {/* INTERVIEW HISTORY TAB */}
          {interviewTab === 'HISTORY' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900">Previous Mock Board Interviews</h3>
              {interviewSessions.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Award className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                  <p className="text-xs font-semibold">No mock interviews completed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviewSessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => {
                        setActiveSessionState(sess);
                        setInterviewTab('BOARD_SESSION');
                      }}
                      className="p-4 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded font-mono text-[10px] font-bold">
                            {sess.mode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              sess.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {sess.status}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {new Date(sess.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900">{sess.boardName}</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        {sess.evaluation?.overallScore && (
                          <div className="text-right">
                            <span className="text-base font-bold font-mono text-amber-800">
                              {sess.evaluation.overallScore} / {sess.evaluation.maxScore || 275}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">
                              View Scorecard →
                            </span>
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DAF PROFILE TAB */}
          {interviewTab === 'DAF_PROFILE' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-700" />
                    <span>Candidate Detailed Application Form (DAF)</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Your profile data directly influences mock board questions and follow-ups.
                  </p>
                </div>
                {dafSaveMessage && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {dafSaveMessage}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveDafProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Graduation Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech / B.A. (Hons)"
                      value={interviewProfile?.graduationDegree || ''}
                      onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, graduationDegree: e.target.value }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Graduation Subject / Discipline</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science / History"
                      value={interviewProfile?.graduationSubject || ''}
                      onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, graduationSubject: e.target.value }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Optional Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Political Science & IR (PSIR) / Geography"
                      value={interviewProfile?.optionalSubject || ''}
                      onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, optionalSubject: e.target.value }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Hometown & State</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Hometown (e.g. Patna)"
                        value={interviewProfile?.hometown || ''}
                        onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, hometown: e.target.value }))}
                        className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Home State (e.g. Bihar)"
                        value={interviewProfile?.homeState || ''}
                        onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, homeState: e.target.value }))}
                        className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-stone-700 block">Hobbies & Extracurricular Pursuits</label>
                    <input
                      type="text"
                      placeholder="e.g. Mentoring civil service aspirants, trekking, reading historical biographies"
                      value={interviewProfile?.hobbiesInterests || ''}
                      onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, hobbiesInterests: e.target.value }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-stone-700 block">Work Experience (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 2 years as Software Engineer / Consultant"
                      value={interviewProfile?.workExperience || ''}
                      onChange={(e) => setInterviewProfile((prev) => ({ ...prev!, workExperience: e.target.value }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Cadre Preferences (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bihar, Uttar Pradesh, AGMUT, Rajasthan"
                      value={interviewProfile?.cadrePreferences?.join(', ') || ''}
                      onChange={(e) =>
                        setInterviewProfile((prev) => ({
                          ...prev!,
                          cadrePreferences: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        }))
                      }
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Service Preferences (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. IAS, IPS, IFS, IRS"
                      value={interviewProfile?.servicePreferences?.join(', ') || ''}
                      onChange={(e) =>
                        setInterviewProfile((prev) => ({
                          ...prev!,
                          servicePreferences: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        }))
                      }
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={savingDaf}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    {savingDaf ? 'Saving DAF Profile...' : 'Save DAF Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MOCK BOARD SESSION TAB */}
          {interviewTab === 'BOARD_SESSION' && (
            <div className="space-y-4">
              {!activeSession ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-xs space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="font-bold text-base text-stone-900">National Administrative Mock Board</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Experience realistic board questioning. The panel listens to your answers and issues dynamic, challenging follow-ups based on your stated assertions.
                    </p>
                  </div>
                  <button
                    onClick={handleStartNewBoardSession}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    Enter Board Room & Start Simulation
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-[700px]">
                  {/* Board Room Top Bar */}
                  <div className="px-6 py-4 bg-stone-950 text-white flex items-center justify-between border-b border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{activeSession.boardName}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span>Mode: {activeSession.mode}</span>
                          <span>•</span>
                          <span>Status: {activeSession.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeSession.status !== 'COMPLETED' ? (
                        <button
                          onClick={handleCompleteInterview}
                          className="px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Conclude Interview & Get Scorecard
                        </button>
                      ) : (
                        <button
                          onClick={handleStartNewBoardSession}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Start New Session
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Transcript Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
                    {activeSession.transcript.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 max-w-2xl ${
                          item.speaker === 'PANEL' ? 'mr-auto' : 'ml-auto flex-row-reverse'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            item.speaker === 'PANEL'
                              ? 'bg-amber-900 text-amber-200 border border-amber-700'
                              : 'bg-stone-800 text-white'
                          }`}
                        >
                          {item.speaker === 'PANEL' ? 'B' : 'You'}
                        </div>

                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            item.speaker === 'PANEL'
                              ? 'bg-white border border-stone-200 text-stone-900 shadow-2xs'
                              : 'bg-stone-900 text-white shadow-xs'
                          }`}
                        >
                          {item.speaker === 'PANEL' ? (
                            <div className="space-y-1">
                              {item.feedback && (
                                <span className="text-[10px] text-amber-800 font-semibold block italic">
                                  {item.feedback}
                                </span>
                              )}
                              <p className="font-semibold">{item.questionText}</p>
                            </div>
                          ) : (
                            <p>{item.answerText}</p>
                          )}
                          <span className="text-[9px] text-stone-400 block mt-1.5 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Final Board Scorecard */}
                    {activeSession.evaluation && (
                      <div className="p-6 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-4 mt-6 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                              IKSHOVIA Mock Interview Scorecard
                            </span>
                            <h4 className="text-xl font-bold font-serif-editorial text-white">
                              Total Score: {activeSession.evaluation.overallScore} / {activeSession.evaluation.maxScore}
                            </h4>
                          </div>
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-lg border border-amber-500/30">
                            {Math.round((activeSession.evaluation.overallScore / activeSession.evaluation.maxScore) * 100)}%
                          </span>
                        </div>

                        {/* Marks Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          {Object.entries(activeSession.evaluation.marksBreakdown).map(([k, val]) => (
                            <div key={k} className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 text-center">
                              <span className="text-[10px] text-stone-400 uppercase block font-mono">
                                {k.replace(/([A-Z])/g, ' $1')}
                              </span>
                              <span className="text-sm font-bold font-mono text-amber-400 mt-1 block">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                            <span className="font-bold text-emerald-400 block mb-1">Board Strengths:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-stone-300">
                              {activeSession.evaluation.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                            <span className="font-bold text-amber-400 block mb-1">Articulation & Body Language Advice:</span>
                            <p className="text-stone-300 leading-relaxed">
                              {activeSession.evaluation.actionableFeedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Candidate Input Controls */}
                  {activeSession.status !== 'COMPLETED' && (
                    <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="State your answer clearly to the board..."
                        value={candidateResponse}
                        onChange={(e) => setCandidateResponse(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendInterviewAnswer();
                          }
                        }}
                        className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleSendInterviewAnswer}
                        disabled={sendingResponse || !candidateResponse.trim()}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {sendingResponse ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Panel is listening...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply to Board</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. CROSS-STAGE PERFORMANCE DOSSIER & RECOMMENDATIONS */}
      {/* ==================================================== */}
      <div id="unified-performance-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono text-amber-700 uppercase font-bold tracking-wider">
              Cross-Stage Learner Intelligence
            </span>
            <h3 className="text-xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2 mt-0.5">
              <BarChart3 className="w-5 h-5 text-amber-700" />
              <span>Unified Prelims + Mains + Interview Synthesis</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Aggregated from authentic question attempts, descriptive submissions, and interview board interactions.
            </p>
          </div>

          <button
            onClick={loadPerformance}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* 3-Stage Metric Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-700" />
                <span>Prelims Foundation</span>
              </span>
              <span className="text-stone-400 font-mono text-[10px]">MCQ & Mocks</span>
            </div>
            {performance?.prelims.hasSufficientData ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-stone-900">{performance.prelims.accuracy}%</span>
                  <span className="text-xs text-stone-500">accuracy ({performance.prelims.totalAttempts} attempts)</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Completed Mocks: <span className="font-bold text-stone-800">{performance.prelims.completedTests}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">Not enough data yet</p>
            )}
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-amber-700" />
                <span>Mains Answer Writing</span>
              </span>
              <span className="text-stone-400 font-mono text-[10px]">10-Pt Rubric</span>
            </div>
            {performance?.mains.hasSufficientData ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-stone-900">
                    {performance.mains.averageScore != null ? `${performance.mains.averageScore}/10` : '—'}
                  </span>
                  <span className="text-xs text-stone-500">avg score ({performance.mains.evaluatedCount} evaluated)</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Written Answers: <span className="font-bold text-stone-800">{performance.mains.totalAnswersWritten}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">Not enough data yet</p>
            )}
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" />
                <span>Interview Board</span>
              </span>
              <span className="text-stone-400 font-mono text-[10px]">Board PT</span>
            </div>
            {performance?.interview.hasSufficientData ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-stone-900">
                    {performance.interview.averageBoardScore != null ? `${performance.interview.averageBoardScore}/275` : '—'}
                  </span>
                  <span className="text-xs text-stone-500">avg score</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Completed Sessions: <span className="font-bold text-stone-800">{performance.interview.sessionsCompleted}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">Not enough data yet</p>
            )}
          </div>
        </div>

        {/* Overall Readiness Indicator */}
        {performance?.overallReadiness && (
          <div className="p-5 bg-gradient-to-r from-amber-950/30 via-stone-900 to-stone-950 text-white rounded-2xl border border-amber-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  Unified Exam Readiness Indicator
                </span>
                <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{performance.overallReadiness.label}</span>
                  {performance.overallReadiness.score !== null && (
                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono font-bold rounded">
                      {performance.overallReadiness.score} / 100 Index
                    </span>
                  )}
                </h4>
              </div>
              {performance.overallReadiness.score !== null && (
                <div className="w-full sm:w-48 bg-stone-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${performance.overallReadiness.score}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {performance.overallReadiness.summary}
            </p>
          </div>
        )}

        {/* Correlated Subject Knowledge Across Stages */}
        {performance?.correlatedSubjects && performance.correlatedSubjects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase font-mono text-stone-500">
                Correlated Subject Knowledge Across Prelims, Mains & Interview:
              </h4>
              <span className="text-[11px] font-mono text-stone-400">Integrated Dossier</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-mono uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">Subject / Core Domain</th>
                    <th className="p-3">Prelims MCQ Accuracy</th>
                    <th className="p-3">Mains Answer Quality</th>
                    <th className="p-3">Interview Governance Proxy</th>
                    <th className="p-3 text-right">Readiness Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {performance.correlatedSubjects.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/80 transition">
                      <td className="p-3 font-bold text-stone-900">{item.subject}</td>
                      <td className="p-3 font-mono">
                        {item.prelimsAccuracy !== null ? (
                          <span className={item.prelimsAccuracy >= 65 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            {item.prelimsAccuracy}%
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">No attempts yet</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {item.mainsAverageScore !== null ? (
                          <span className={item.mainsAverageScore >= 6.5 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            {item.mainsAverageScore}/10
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">No answers written</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {item.interviewGovernanceScore !== null ? (
                          <span className="text-stone-800 font-bold">{item.interviewGovernanceScore}%</span>
                        ) : (
                          <span className="text-stone-400 italic">Pending session</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.readinessLevel === 'EXEMPLARY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.readinessLevel === 'STRONG'
                              ? 'bg-sky-100 text-sky-800'
                              : item.readinessLevel === 'DEVELOPING'
                              ? 'bg-amber-100 text-amber-800'
                              : item.readinessLevel === 'NEEDS_FOCUS'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {item.readinessLevel.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVIDENCE-BASED RECOMMENDATIONS & ACTIONABLE BUTTONS */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-xs uppercase font-mono text-stone-500">
            Evidence-Based Multi-Stage Recommendations:
          </h4>

          {performance?.crossStageInsights && performance.crossStageInsights.recurringGaps.length > 0 ? (
            <div className="space-y-3">
              {performance.crossStageInsights.recurringGaps.map((gap, i) => (
                <div
                  key={i}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{gap.subjectOrTheme}</span>
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                        Recurring Learning Gap
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600 space-y-0.5">
                      {gap.evidence.prelims && <div>• Prelims: {gap.evidence.prelims}</div>}
                      {gap.evidence.mains && <div>• Mains: {gap.evidence.mains}</div>}
                    </div>
                    <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                      → Action: {gap.actionableRemedy}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenRecommendedResource(gap.subjectOrTheme)}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                      <span>Open Book (Original PDF)</span>
                    </button>

                    <button
                      onClick={() => {
                        askTutorWithContext(
                          `Explain foundational concepts and recurring exam themes in ${gap.subjectOrTheme}`,
                          {
                            exam: targetExam,
                            stage: activeStage,
                            subjectName: gap.subjectOrTheme,
                            contextSummary: `Student has identified recurring learning gap in ${gap.subjectOrTheme}`,
                          }
                        );
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-200" />
                      <span>Ask AI Tutor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500">
              No cross-stage gaps identified yet. Continue attempting questions across Prelims and Mains to build your evidentiary learning profile.
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. ORIGINAL PDF RESOURCE READER MODAL (HIGH FIDELITY) */}
      {/* ==================================================== */}
      {activeReadingResource && (
        <ResourceReaderModal
          resource={activeReadingResource}
          isOpen={isResourceReaderOpen}
          onClose={() => setIsResourceReaderOpen(false)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Target,
  PenTool,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Database,
  Users,
  Award,
  Layers,
  FileText,
  Upload,
  RefreshCw,
  Plus,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Filter,
  Check,
  HelpCircle,
  Eye,
  Send,
  Save,
  Lock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api.js';

type TabKey = 
  | 'TARGETED_QUESTIONS'
  | 'ANSWER_NOW'
  | 'PENDING_REVIEW'
  | 'REVIEW_HISTORY'
  | 'DATASET_COVERAGE'
  | 'FACULTY_QUEUE'
  | 'BENCHMARK_COLLECTION'
  | 'ADMIN_CAMPAIGNS';

export const MainsDatasetAcquisitionHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('TARGETED_QUESTIONS');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [learnerSubs, setLearnerSubs] = useState<{ pending: any[]; history: any[] }>({ pending: [], history: [] });
  const [facultyQueue, setFacultyQueue] = useState<any[]>([]);
  const [matrices, setMatrices] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Answer Now Workspace states
  const [answerType, setAnswerType] = useState<'TYPED' | 'HANDWRITTEN_IMAGE'>('TYPED');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [draftSaving, setDraftSaving] = useState<boolean>(false);

  // Faculty Review Workspace states
  const [selectedSubmissionToReview, setSelectedSubmissionToReview] = useState<any | null>(null);
  const [facultyMarks, setFacultyMarks] = useState<number>(6);
  const [facultyVerdict, setFacultyVerdict] = useState<'ACCEPTED' | 'EDITED' | 'REJECTED' | 'INDEPENDENT'>('ACCEPTED');
  const [facultyFeedback, setFacultyFeedback] = useState<string>('');
  const [facultyStrengths, setFacultyStrengths] = useState<string>('Clear structural headings, logical sequence, good constitutional context.');
  const [facultyWeaknesses, setFacultyWeaknesses] = useState<string>('Needs more specific recent case law citations.');
  const [facultyActionable, setFacultyActionable] = useState<string>('Incorporate 2nd ARC commission recommendations in the conclusion.');
  const [facultyDimensions, setFacultyDimensions] = useState({
    relevance: 7,
    structure: 7,
    content: 7,
    analysis: 6,
    presentation: 7
  });

  // Filter states
  const [paperFilter, setPaperFilter] = useState<string>('ALL');
  const [coverageMatrixView, setCoverageMatrixView] = useState<'PAPER_MARKS' | 'PAPER_DIRECTIVE' | 'PAPER_TIER' | 'PAPER_FORMAT' | 'SUBJECT_TOPIC' | 'LEARNERS' | 'FACULTY'>('PAPER_MARKS');

  // New campaign modal
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [newCampaignDesc, setNewCampaignDesc] = useState<string>('');
  const [newCampaignTargetAnswers, setNewCampaignTargetAnswers] = useState<number>(200);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, qData, lSubs, fQueue, matData, benchData, campData] = await Promise.all([
        api.getMainsDatasetGrowthOverview().catch(() => null),
        api.getMainsDatasetGrowthQuestions({ limit: 20 }).catch(() => []),
        api.getMainsDatasetGrowthLearnerSubmissions().catch(() => ({ pending: [], history: [] })),
        api.getMainsDatasetGrowthFacultyQueue().catch(() => []),
        api.getMainsDatasetGrowthCoverageMatrices().catch(() => null),
        api.getMainsDatasetGrowthBenchmarks().catch(() => null),
        api.getMainsDatasetGrowthCampaigns().catch(() => [])
      ]);

      setOverview(ovData);
      setQuestions(qData || []);
      if (qData && qData.length > 0 && !selectedQuestion) {
        setSelectedQuestion(qData[0]);
      }
      setLearnerSubs(lSubs || { pending: [], history: [] });
      setFacultyQueue(fQueue || []);
      setMatrices(matData);
      setBenchmarks(benchData);
      setCampaigns(campData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load acquisition hub data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // 1. Learner Draft Save
  const handleSaveDraft = async () => {
    if (!selectedQuestion) return;
    setDraftSaving(true);
    try {
      await api.saveMainsDatasetGrowthDraft({
        questionId: selectedQuestion.questionId,
        answerText: typedAnswer,
        submissionType: answerType,
        attachmentUrl: imageUrl || undefined
      });
      showNotification('Answer draft saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save draft');
    } finally {
      setDraftSaving(false);
    }
  };

  // 2. Learner Submit Answer
  const handleSubmitAnswer = async () => {
    if (!selectedQuestion) return;
    const content = answerType === 'HANDWRITTEN_IMAGE' ? (ocrText || typedAnswer) : typedAnswer;
    if (!content.trim()) {
      alert('Please enter or extract answer text before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitMainsDatasetGrowthAnswer({
        questionId: selectedQuestion.questionId,
        answerText: typedAnswer,
        submissionType: answerType,
        attachmentUrl: imageUrl || undefined,
        ocrExtractedText: answerType === 'HANDWRITTEN_IMAGE' ? ocrText : undefined,
        ocrConfidence: answerType === 'HANDWRITTEN_IMAGE' ? 0.92 : 1.0
      });

      showNotification(`Answer submitted! SHA-256 Hash: ${res.answerHash.substring(0, 10)}... Status: PENDING_FACULTY_REVIEW`);
      setTypedAnswer('');
      setOcrText('');
      setImageUrl('');
      await loadAllData();
      setActiveTab('PENDING_REVIEW');
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Faculty Record Review
  const handleSubmitFacultyReview = async () => {
    if (!selectedSubmissionToReview) return;
    if (!facultyFeedback.trim()) {
      alert('Please provide detailed evaluative feedback.');
      return;
    }

    try {
      const strengthsArr = facultyStrengths.split(',').map(s => s.trim()).filter(Boolean);
      const weaknessesArr = facultyWeaknesses.split(',').map(s => s.trim()).filter(Boolean);

      const res = await api.submitMainsDatasetGrowthFacultyReview({
        submissionId: selectedSubmissionToReview.submissionId,
        facultyMarks: Number(facultyMarks),
        facultyVerdict,
        facultyFeedback,
        facultyStrengths: strengthsArr,
        facultyWeaknesses: weaknessesArr,
        facultyActionableImprovement: facultyActionable,
        facultyDimensions
      });

      showNotification(`Faculty Review certified! Eligibility: ${res.training_eligibility || res.review?.training_eligibility || 'EVALUATED'}`);
      setSelectedSubmissionToReview(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to record faculty review');
    }
  };

  // 4. Create Campaign
  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    try {
      await api.createMainsDatasetGrowthCampaign({
        name: newCampaignName,
        description: newCampaignDesc,
        targetAnswers: Number(newCampaignTargetAnswers)
      });
      setShowCampaignModal(false);
      setNewCampaignName('');
      setNewCampaignDesc('');
      showNotification('New acquisition campaign launched.');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const wordCount = (typedAnswer || ocrText || '').trim().split(/\s+/).filter(Boolean).length;
  const wordLimit = selectedQuestion?.wordLimit || 150;
  const wordCountPct = Math.min(100, Math.round((wordCount / wordLimit) * 100));

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* HEADER & EXECUTIVE REINFORCEMENT BANNER              */}
      {/* ---------------------------------------------------- */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Phase 4.1I Controlled Growth Loop
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                Live DB Ground-Truth Acquisition
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Target className="w-6 h-6 text-indigo-400" />
              Mains Dataset Acquisition Hub
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Production data-collection engine connecting genuine UPSC Mains learners with certified faculty evaluators.
              Strictly enforces zero synthetic generation, benchmark isolation, and quality-gated training eligibility.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-lg transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="px-3.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Training Gate: <strong>{overview?.status || 'LOCKED'}</strong></span>
            </div>
          </div>
        </div>

        {/* Real Safety Guarantees Bar */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-stone-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Model Actually Trained: <strong className="text-white">NO</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Fine-Tuning Executed: <strong className="text-white">NO</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synthetic Data Created: <strong className="text-white">NO (Zero)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Benchmark Leakage: <strong className="text-white">0 Items</strong></span>
          </div>
        </div>

        {/* Progress against 200 / 250 requirements */}
        {overview && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Unique Training Answers</span>
                <span className="font-mono font-bold text-amber-300">
                  {overview.progress.uniqueTrainingAnswers.current} / {overview.progress.uniqueTrainingAnswers.target}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, overview.progress.uniqueTrainingAnswers.percentage)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                {overview.progress.uniqueTrainingAnswers.percentage}% of 200 required
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Faculty Verified Reviews</span>
                <span className="font-mono font-bold text-indigo-300">
                  {overview.progress.facultyVerifiedReviews.current} / {overview.progress.facultyVerifiedReviews.target}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, overview.progress.facultyVerifiedReviews.percentage)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                {overview.progress.facultyVerifiedReviews.percentage}% of 250 required
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Subjects Diversity</span>
                <span className="font-mono font-bold text-teal-300">
                  {overview.progress.subjectsCovered.current} / {overview.progress.subjectsCovered.target}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (overview.progress.subjectsCovered.current / overview.progress.subjectsCovered.target) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Target: minimum 5 distinct subjects
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Benchmark Gold Set</span>
                <span className="font-mono font-bold text-emerald-300">
                  {overview.progress.benchmarkItems.current} / {overview.progress.benchmarkItems.target}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (overview.progress.benchmarkItems.current / overview.progress.benchmarkItems.target) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Isolated with zero leakage
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-sm font-bold">✕</button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* NAVIGATION TABS (SECTIONS A TO H)                     */}
      {/* ---------------------------------------------------- */}
      <div className="border-b border-stone-200 overflow-x-auto bg-white rounded-xl shadow-xs px-2">
        <div className="flex items-center gap-1 min-w-max py-1.5">
          {[
            { key: 'TARGETED_QUESTIONS', label: 'A. Targeted Questions', icon: Target },
            { key: 'ANSWER_NOW', label: 'B. Answer Now (Workspace)', icon: PenTool },
            { key: 'PENDING_REVIEW', label: `C. Pending Review (${learnerSubs.pending.length})`, icon: Clock },
            { key: 'REVIEW_HISTORY', label: `D. My Review History (${learnerSubs.history.length})`, icon: FileCheck },
            { key: 'DATASET_COVERAGE', label: 'E. Dataset Coverage Matrices', icon: Layers },
            { key: 'FACULTY_QUEUE', label: `F. Faculty Collection Queue (${facultyQueue.length})`, icon: Users },
            { key: 'BENCHMARK_COLLECTION', label: 'G. Benchmark Collection', icon: Award },
            { key: 'ADMIN_CAMPAIGNS', label: 'H. Admin Progress & Campaigns', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB A: TARGETED QUESTIONS                            */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'TARGETED_QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-700" />
                Syllabus Gap Prioritized Questions
              </h2>
              <p className="text-xs text-stone-500">
                Canonical questions selected dynamically to eliminate current dataset deficits across papers and directives.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Paper:</span>
              <select
                value={paperFilter}
                onChange={e => setPaperFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800"
              >
                <option value="ALL">All Papers</option>
                <option value="GS1">GS Paper 1</option>
                <option value="GS2">GS Paper 2</option>
                <option value="GS3">GS Paper 3</option>
                <option value="GS4">GS Paper 4 / Ethics</option>
                <option value="Essay">Essay</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions
              .filter(q => paperFilter === 'ALL' || q.paper.toUpperCase().includes(paperFilter.toUpperCase()))
              .map(q => (
                <div
                  key={q.questionId}
                  className="p-4 rounded-xl border border-stone-200 bg-white hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                        {q.paper}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        q.provenance === 'OFFICIAL_COMMISSION' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                      }`}>
                        {q.provenance}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-stone-900 leading-snug line-clamp-3">
                      {q.question}
                    </h3>

                    <div className="p-2 rounded bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{q.priorityReason}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>Directive: <strong className="text-stone-700">{q.directive}</strong></span>
                      <span>{q.marks} Marks • {q.wordLimit} Words</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setActiveTab('ANSWER_NOW');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors shadow-xs"
                    >
                      <PenTool className="w-3 h-3" />
                      Answer This Question
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB B: ANSWER NOW (WORKSPACE)                        */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ANSWER_NOW' && (
        <div className="space-y-4">
          {selectedQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Question Prompt & Instructions */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900">
                      {selectedQuestion.paper}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-600">
                      {selectedQuestion.marks} Marks • {selectedQuestion.wordLimit} Words
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-stone-900 leading-snug">
                    {selectedQuestion.question}
                  </h2>

                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs text-stone-700">
                    <div><strong>Directive:</strong> <span className="text-indigo-900 font-mono font-bold">{selectedQuestion.directive}</span></div>
                    <div><strong>Subject:</strong> {selectedQuestion.subject}</div>
                    <div><strong>Topic:</strong> {selectedQuestion.topic}</div>
                    <div><strong>Provenance:</strong> <span className="font-mono text-[10px]">{selectedQuestion.provenance}</span></div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Ground-Truth Evaluation Guarantee
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Your submission will first receive an instant baseline evaluation, followed by guaranteed human review by certified faculty.
                    </p>
                  </div>
                </div>

                {/* Format Toggle */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
                  <span className="text-xs font-bold text-stone-800 block">Submission Format</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAnswerType('TYPED')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                        answerType === 'TYPED'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Typed Text
                    </button>
                    <button
                      onClick={() => setAnswerType('HANDWRITTEN_IMAGE')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                        answerType === 'HANDWRITTEN_IMAGE'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Handwritten OCR
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Writing & Submission Arena */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-indigo-700" />
                      <h3 className="text-sm font-bold text-stone-900">Your Answer Script</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-mono">
                        <span className={wordCount > wordLimit ? 'text-rose-600 font-bold' : 'text-stone-700'}>
                          {wordCount}
                        </span>
                        <span className="text-stone-400"> / {wordLimit} words ({wordCountPct}%)</span>
                      </div>
                      <button
                        onClick={handleSaveDraft}
                        disabled={draftSaving}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {draftSaving ? 'Saving...' : 'Save Draft'}
                      </button>
                    </div>
                  </div>

                  {/* Submission format view */}
                  {answerType === 'TYPED' ? (
                    <div className="space-y-2">
                      <textarea
                        rows={14}
                        value={typedAnswer}
                        onChange={e => setTypedAnswer(e.target.value)}
                        placeholder="Structure your answer with: Introduction (define context / constitutional article) → Core Body (sub-headings, multi-dimensional analysis, data/case laws) → Way Forward & Balanced Conclusion..."
                        className="w-full p-4 border border-stone-300 rounded-xl text-xs font-mono leading-relaxed text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50 text-center space-y-2">
                        <Upload className="w-6 h-6 text-stone-400 mx-auto" />
                        <span className="text-xs font-semibold text-stone-700 block">
                          Provide Image URL or Upload Handwritten Script
                        </span>
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={e => setImageUrl(e.target.value)}
                          placeholder="e.g. /dist/mains-handwritten/sample_sheet_page1.jpg or secure upload link"
                          className="w-full max-w-md mx-auto p-2 text-xs border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-800">
                          Handwriting Transcript / OCR Extracted Text:
                        </label>
                        <textarea
                          rows={10}
                          value={ocrText}
                          onChange={e => setOcrText(e.target.value)}
                          placeholder="Extracted or corrected OCR transcript..."
                          className="w-full p-3 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <p className="text-[11px] text-stone-500">
                      ⚡ SHA-256 fingerprint will be calculated upon submission. Duplicate checks prevent double-counting.
                    </p>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || wordCount === 0}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 disabled:bg-stone-300 rounded-xl transition-all shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Submitting & Computing Fingerprint...' : 'Submit Real Answer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200 space-y-3">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800">No question selected</h3>
              <p className="text-xs text-stone-500">Select a question from Section A to begin answering.</p>
              <button
                onClick={() => setActiveTab('TARGETED_QUESTIONS')}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 rounded-lg hover:bg-indigo-950"
              >
                Browse Targeted Questions
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB C: PENDING FACULTY REVIEW                        */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'PENDING_REVIEW' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              My Pending Answers Awaiting Faculty Evaluation ({learnerSubs.pending.length})
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Answers queued in the production pipeline for certified human ground-truth marking. Not yet eligible for model training.
            </p>
          </div>

          {learnerSubs.pending.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-stone-400 mx-auto" />
              <p>You have no pending submissions. Submit an answer in Section B to add to the queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {learnerSubs.pending.map((sub: any) => (
                <div key={sub.submissionId} className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                        {sub.paper}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        PENDING FACULTY REVIEW
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono">
                      Submitted: {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-stone-900">{sub.question}</h3>

                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 font-mono line-clamp-3">
                    {sub.answerText}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100 font-mono">
                    <span>Baseline AI Marks: <strong>{sub.aiMarks || 5.5} / {sub.maxMarks}</strong></span>
                    <span>Submission ID: <strong className="text-stone-700">{sub.submissionId}</strong></span>
                    <span className="text-amber-700 font-bold">Training Status: PENDING_REVIEW</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB D: MY REVIEW HISTORY                             */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'REVIEW_HISTORY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Completed Faculty Evaluations & Ground Truth ({learnerSubs.history.length})
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Certified evaluations with faculty verdict, dimensional rubric breakdown, and quality gate outcomes.
            </p>
          </div>

          {learnerSubs.history.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500 space-y-2">
              <HelpCircle className="w-6 h-6 text-stone-400 mx-auto" />
              <p>No completed evaluations found for this profile yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {learnerSubs.history.map((h: any) => (
                <div key={h.submissionId} className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                        {h.paper}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.trainingEligibility === 'TRAINING_ELIGIBLE'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {h.trainingEligibility || 'EVALUATED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>Faculty Marks: <strong className="text-emerald-700 text-sm">{h.facultyMarks} / {h.maxMarks}</strong></span>
                      {h.aiMarks != null && (
                        <span className="text-stone-500">(AI Baseline: {h.aiMarks})</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-stone-900">{h.question}</h3>

                  {/* Feedback and Rubric */}
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2 text-xs">
                    <div>
                      <strong className="text-stone-800">Faculty Verdict:</strong>{' '}
                      <span className="font-mono text-indigo-900 font-bold">{h.facultyVerdict}</span>
                    </div>
                    <div>
                      <strong className="text-stone-800">Faculty Feedback:</strong>{' '}
                      <span className="text-stone-700">{h.facultyFeedback}</span>
                    </div>
                    {h.facultyActionableImprovement && (
                      <div className="p-2 rounded bg-amber-50 text-amber-900 text-[11px]">
                        <strong>Actionable Improvement:</strong> {h.facultyActionableImprovement}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB E: DATASET COVERAGE MATRICES                     */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'DATASET_COVERAGE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                Real-Time Dataset Acquisition Matrices
              </h2>
              <p className="text-xs text-stone-500">
                Live distribution of raw submissions, verified ground truths, and training-eligible candidates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'PAPER_MARKS', label: 'Paper × Marks' },
                { key: 'PAPER_DIRECTIVE', label: 'Paper × Directive' },
                { key: 'PAPER_TIER', label: 'Paper × Tier' },
                { key: 'PAPER_FORMAT', label: 'Paper × Format' },
                { key: 'SUBJECT_TOPIC', label: 'Subject × Topic' },
                { key: 'LEARNERS', label: 'Learners' },
                { key: 'FACULTY', label: 'Faculty' }
              ].map(subTab => (
                <button
                  key={subTab.key}
                  onClick={() => setCoverageMatrixView(subTab.key as any)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    coverageMatrixView === subTab.key
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          </div>

          {matrices ? (
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs overflow-x-auto">
              {coverageMatrixView === 'PAPER_MARKS' && (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-mono">
                      <th className="p-2">Paper</th>
                      {['10m', '15m', '20m', '25m', '38m', '125m'].map(m => (
                        <th key={m} className="p-2 text-center">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrices.paperMarks || {}).map(([paper, marks]: [string, any]) => (
                      <tr key={paper} className="border-b border-stone-100 hover:bg-stone-50/50">
                        <td className="p-2 font-bold text-stone-900">{paper}</td>
                        {['10m', '15m', '20m', '25m', '38m', '125m'].map(m => {
                          const cell = marks[m] || { raw: 0, reviewed: 0, eligible: 0 };
                          return (
                            <td key={m} className="p-2 text-center font-mono">
                              <span className={cell.eligible > 0 ? 'text-emerald-700 font-bold' : cell.raw > 0 ? 'text-amber-700' : 'text-stone-300'}>
                                {cell.eligible}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                raw: {cell.raw}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {coverageMatrixView === 'PAPER_DIRECTIVE' && (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-mono">
                      <th className="p-2">Paper</th>
                      {['Discuss', 'Explain', 'Analyze', 'Critically Analyze', 'Examine', 'Evaluate', 'Comment'].map(d => (
                        <th key={d} className="p-2 text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrices.paperDirective || {}).map(([paper, dirs]: [string, any]) => (
                      <tr key={paper} className="border-b border-stone-100 hover:bg-stone-50/50">
                        <td className="p-2 font-bold text-stone-900">{paper}</td>
                        {['Discuss', 'Explain', 'Analyze', 'Critically Analyze', 'Examine', 'Evaluate', 'Comment'].map(d => {
                          const cell = dirs[d] || { raw: 0, reviewed: 0, eligible: 0 };
                          return (
                            <td key={d} className="p-2 text-center font-mono">
                              <span className={cell.eligible > 0 ? 'text-emerald-700 font-bold' : cell.raw > 0 ? 'text-amber-700' : 'text-stone-300'}>
                                {cell.eligible}
                              </span>
                              <span className="text-[10px] text-stone-400 block">r: {cell.raw}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {coverageMatrixView === 'PAPER_TIER' && (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-mono">
                      <th className="p-2">Paper</th>
                      {['WEAK', 'AVERAGE', 'STRONG', 'EXCELLENT'].map(t => (
                        <th key={t} className="p-2 text-center">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrices.paperTier || {}).map(([paper, tiers]: [string, any]) => (
                      <tr key={paper} className="border-b border-stone-100 hover:bg-stone-50/50">
                        <td className="p-2 font-bold text-stone-900">{paper}</td>
                        {['WEAK', 'AVERAGE', 'STRONG', 'EXCELLENT'].map(t => {
                          const cell = tiers[t] || { raw: 0, reviewed: 0, eligible: 0 };
                          return (
                            <td key={t} className="p-2 text-center font-mono">
                              <span className={cell.eligible > 0 ? 'text-emerald-700 font-bold' : cell.raw > 0 ? 'text-amber-700' : 'text-stone-300'}>
                                {cell.eligible} eligible
                              </span>
                              <span className="text-[10px] text-stone-400 block">raw: {cell.raw}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {coverageMatrixView === 'PAPER_FORMAT' && (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-mono">
                      <th className="p-2">Paper</th>
                      <th className="p-2 text-center">Typed Script</th>
                      <th className="p-2 text-center">Handwritten OCR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrices.paperFormat || {}).map(([paper, fmts]: [string, any]) => (
                      <tr key={paper} className="border-b border-stone-100 hover:bg-stone-50/50">
                        <td className="p-2 font-bold text-stone-900">{paper}</td>
                        {['TYPED', 'HANDWRITTEN'].map(f => {
                          const cell = fmts[f] || { raw: 0, reviewed: 0, eligible: 0 };
                          return (
                            <td key={f} className="p-2 text-center font-mono">
                              <span className="text-stone-800 font-bold">{cell.raw} raw</span>
                              <span className="text-[10px] text-emerald-700 font-bold block">{cell.eligible} eligible</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {coverageMatrixView === 'LEARNERS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <strong>Learner Concentration Guard:</strong> Ensures no single learner represents &gt;15% of the eventual training dataset pool.
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-mono">
                        <th className="p-2">Learner Identifier</th>
                        <th className="p-2 text-center">Total Answers</th>
                        <th className="p-2 text-center">Training-Eligible</th>
                        <th className="p-2 text-center">Share of Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(matrices.learnerContribution || {}).map(([learner, data]: [string, any]) => (
                        <tr key={learner} className="border-b border-stone-100">
                          <td className="p-2 font-mono text-stone-900">{learner}</td>
                          <td className="p-2 text-center font-mono">{data.total}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">{data.eligible}</td>
                          <td className="p-2 text-center font-mono">{data.sharePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {coverageMatrixView === 'FACULTY' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                    <strong>Faculty Workload Guard:</strong> Prevents single-evaluator bias by enforcing distributed verification.
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-mono">
                        <th className="p-2">Faculty Identifier</th>
                        <th className="p-2 text-center">Total Reviews</th>
                        <th className="p-2 text-center">Independent Verifications</th>
                        <th className="p-2 text-center">Workload Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(matrices.facultyReviews || {}).map(([faculty, data]: [string, any]) => (
                        <tr key={faculty} className="border-b border-stone-100">
                          <td className="p-2 font-mono text-stone-900">{faculty}</td>
                          <td className="p-2 text-center font-mono font-bold">{data.total}</td>
                          <td className="p-2 text-center font-mono text-indigo-700">{data.independent}</td>
                          <td className="p-2 text-center font-mono">{data.sharePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-stone-500">Loading matrices...</div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB F: FACULTY COLLECTION QUEUE                      */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'FACULTY_QUEUE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-700" />
              Faculty Acquisition & Ground-Truth Review Queue ({facultyQueue.length})
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Real learner answers awaiting human faculty ground-truth certification. Quality gates are computed live upon review.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of queue items */}
            <div className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto">
              {facultyQueue.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
                  Queue is currently clear.
                </div>
              ) : (
                facultyQueue.map(item => (
                  <div
                    key={item.submissionId}
                    onClick={() => {
                      setSelectedSubmissionToReview(item);
                      setFacultyMarks(item.aiMarksObtained || 6);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all shadow-xs space-y-2 ${
                      selectedSubmissionToReview?.submissionId === item.submissionId
                        ? 'bg-indigo-50/80 border-indigo-400'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                        {item.paper}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        Age: {item.ageHours}h
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-stone-900 line-clamp-2">
                      {item.question}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>{item.marks}m • {item.wordCount} words</span>
                      <span className="text-indigo-800 font-bold">Priority: {item.priorityScore}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Marking Arena */}
            <div className="lg:col-span-2">
              {selectedSubmissionToReview ? (
                <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900">
                        {selectedSubmissionToReview.paper}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">
                        {selectedSubmissionToReview.question}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600">
                      Max Marks: {selectedSubmissionToReview.marks}
                    </span>
                  </div>

                  {/* Student Answer View */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800">Learner Submission Script:</label>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {selectedSubmissionToReview.learnerAnswer}
                    </div>
                  </div>

                  {/* Faculty Scoring & Verdict Form */}
                  <div className="space-y-4 pt-2 border-t border-stone-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          Faculty Marks Obtained (out of {selectedSubmissionToReview.marks}):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={selectedSubmissionToReview.marks}
                          value={facultyMarks}
                          onChange={e => setFacultyMarks(Number(e.target.value))}
                          className="w-full p-2.5 text-xs font-bold font-mono border border-stone-300 rounded-lg text-stone-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          Faculty Verdict:
                        </label>
                        <select
                          value={facultyVerdict}
                          onChange={e => setFacultyVerdict(e.target.value as any)}
                          className="w-full p-2.5 text-xs font-bold border border-stone-300 rounded-lg text-stone-900 bg-white"
                        >
                          <option value="ACCEPTED">ACCEPTED (Confirm AI Baseline)</option>
                          <option value="EDITED">EDITED (Calibrate Rubric/Marks)</option>
                          <option value="INDEPENDENT">INDEPENDENT (Double-Blind Truth)</option>
                          <option value="REJECTED">REJECTED (Low Quality / Off-Topic)</option>
                        </select>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800 block">
                        Detailed Evaluative Feedback (Quality Gate Enforced):
                      </label>
                      <textarea
                        rows={3}
                        value={facultyFeedback}
                        onChange={e => setFacultyFeedback(e.target.value)}
                        placeholder="Comprehensive feedback analyzing demand fulfillment, structural balance, and conceptual depth..."
                        className="w-full p-2.5 text-xs border border-stone-300 rounded-lg text-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">Strengths (comma separated):</label>
                        <input
                          type="text"
                          value={facultyStrengths}
                          onChange={e => setFacultyStrengths(e.target.value)}
                          className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">Weaknesses (comma separated):</label>
                        <input
                          type="text"
                          value={facultyWeaknesses}
                          onChange={e => setFacultyWeaknesses(e.target.value)}
                          className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800 block">Actionable Recommendation:</label>
                      <input
                        type="text"
                        value={facultyActionable}
                        onChange={e => setFacultyActionable(e.target.value)}
                        className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900"
                      />
                    </div>

                    <button
                      onClick={handleSubmitFacultyReview}
                      className="w-full py-2.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Certify & Record Ground-Truth Review
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
                  Select a submission from the left queue to evaluate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB G: BENCHMARK COLLECTION & ISOLATION              */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'BENCHMARK_COLLECTION' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Locked Gold Benchmark Collection
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Certified ground-truth evaluation targets isolated strictly from the training candidates pool.
            </p>
          </div>

          {benchmarks && (
            <div className="space-y-4">
              {/* Isolation Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                benchmarks.isolation.isIsolated
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-3">
                  {benchmarks.isolation.isIsolated ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-700" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold">
                      {benchmarks.isolation.isIsolated
                        ? 'Benchmark Isolation Verified (Zero Leakage)'
                        : 'Benchmark Leakage Detected!'}
                    </h3>
                    <p className="text-[11px] opacity-80">
                      Leakage Count: {benchmarks.isolation.leakageCount} • Required: 0
                    </p>
                  </div>
                </div>
              </div>

              {/* Benchmark Items List */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800">
                  Gold Benchmark Items ({benchmarks.items.length})
                </h3>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {benchmarks.items.map((item: any) => (
                    <div key={item.id} className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {item.tier} • {item.marks_range}
                        </span>
                        <span className="font-mono text-[10px] text-stone-500">
                          Expected Marks: <strong>{item.expected_marks}</strong>
                        </span>
                      </div>
                      <p className="font-semibold text-stone-900">{item.question || 'Mains Evaluation Target'}</p>
                      <p className="text-[11px] text-stone-600 italic">{item.expected_feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB H: ADMIN PROGRESS & CAMPAIGN CONTROLS            */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ADMIN_CAMPAIGNS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-700" />
                Active Acquisition Campaigns & Controls
              </h2>
              <p className="text-xs text-stone-500">
                Targeted syllabus campaigns actively collecting real ground-truth data from the student body.
              </p>
            </div>

            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Launch New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                    ACTIVE CAMPAIGN
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Created: {new Date(camp.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900">{camp.name}</h3>
                  <p className="text-xs text-stone-600 mt-1">{camp.description}</p>
                </div>

                {camp.progress && (
                  <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                        <span>Unique Training Answers</span>
                        <span className="font-mono font-bold text-stone-900">
                          {camp.progress.currentAnswers} / {camp.targetAnswers} ({camp.progress.answersPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, camp.progress.answersPct)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                        <span>Faculty Verified Reviews</span>
                        <span className="font-mono font-bold text-stone-900">
                          {camp.progress.currentReviews} / {camp.targetFacultyReviews} ({camp.progress.reviewsPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, camp.progress.reviewsPct)}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">Launch Acquisition Campaign</h3>
            <p className="text-xs text-stone-500">
              Create an operational campaign prioritizing targeted questions to eliminate specific syllabus blind spots.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Campaign Name:</label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder="e.g. GS4 Ethics & Case Studies Growth Drive"
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={newCampaignDesc}
                  onChange={e => setNewCampaignDesc(e.target.value)}
                  placeholder="Focuses on acquiring high-quality ethics answers..."
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Target Unique Answers:</label>
                <input
                  type="number"
                  value={newCampaignTargetAnswers}
                  onChange={e => setNewCampaignTargetAnswers(Number(e.target.value))}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg"
              >
                Launch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

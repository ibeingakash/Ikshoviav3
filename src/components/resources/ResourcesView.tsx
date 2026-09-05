import React, { useState, useEffect, useRef } from 'react';
import {
  FolderArchive,
  Download,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Award,
  Clock,
  Zap,
  CheckCircle,
  ListOrdered,
  Eye,
  FileCheck2,
  Flame,
  LayoutGrid,
  Maximize2,
  Building,
  Shuffle,
  Filter,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Question, PyqPaper, PyqArchiveData } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { PyqPracticeSession } from './PyqPracticeSession.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import { PyqAuditModal } from './PyqAuditModal.js';
import { NotesTab } from './NotesTab.js';
import { LearnerDriveLibraryTab } from './LearnerDriveLibraryTab.js';

export const ResourcesView: React.FC = () => {
  const { askTutorWithContext, setActiveSection } = useLearner();
  const [activeTab, setActiveTab] = useState<'pyqs' | 'notes' | 'library'>('pyqs');

  // Archive & Hierarchy Data
  const [archive, setArchive] = useState<PyqArchiveData | null>(null);
  const [loadingArchive, setLoadingArchive] = useState<boolean>(true);

  // Selected Hierarchical Path
  const [selectedExam, setSelectedExam] = useState<string>('UPSC CSE');
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<PyqPaper | null>(null);

  // Practice & Question State
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [allPaperQuestions, setAllPaperQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);

  // Browsing / Study View State (10 per page)
  const [studyPage, setStudyPage] = useState<number>(1);
  const [studyLimit] = useState<number>(10);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [studyTotalCount, setStudyTotalCount] = useState<number>(0);
  const [studyTotalPages, setStudyTotalPages] = useState<number>(1);
  const [studyLoading, setStudyLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [bilingualLang, setBilingualLang] = useState<'en' | 'hi'>('en');

  // Audit Modal
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // 1. Fetch live archive from database
  const loadArchive = async () => {
    setLoadingArchive(true);
    try {
      const data = await api.getPYQArchive();
      setArchive(data);

      if (data.papers.length > 0) {
        // Set initial selected exam & paper
        const initialExam = data.exams.includes('UPSC CSE') ? 'UPSC CSE' : data.exams[0];
        setSelectedExam(initialExam);

        const examCycles = data.cyclesByExam[initialExam] || [];
        const initialCycle = examCycles[0] || '';
        setSelectedCycle(initialCycle);

        const examPapers = data.papers.filter(p => p.exam === initialExam && (p.examCycle === initialCycle || String(p.year) === initialCycle));
        const initialPaper = examPapers[0] || data.papers[0];
        setSelectedPaper(initialPaper);
      }
    } catch (err) {
      console.error('Failed to fetch PYQ archive:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, []);

  // 2. When selectedExam changes, update cycles and select default paper
  const handleExamSelect = (exam: string) => {
    setSelectedExam(exam);
    if (!archive) return;

    const cycles = archive.cyclesByExam[exam] || [];
    const firstCycle = cycles[0] || '';
    setSelectedCycle(firstCycle);

    const papers = archive.papers.filter(p => p.exam === exam && (p.examCycle === firstCycle || String(p.year) === firstCycle));
    setSelectedPaper(papers[0] || null);
    setPracticeMode(false);
    setStudyPage(1);
  };

  // 3. When selectedCycle changes, update paper
  const handleCycleSelect = (cycle: string) => {
    setSelectedCycle(cycle);
    if (!archive) return;

    const papers = archive.papers.filter(p => p.exam === selectedExam && (p.examCycle === cycle || String(p.year) === cycle));
    setSelectedPaper(papers[0] || null);
    setPracticeMode(false);
    setStudyPage(1);
  };

  // 4. When selectedPaper changes, fetch study questions or practice questions
  useEffect(() => {
    if (!selectedPaper) {
      setStudyQuestions([]);
      setAllPaperQuestions([]);
      return;
    }

    // Load full questions for practice mode
    setLoadingQuestions(true);
    api.getPYQPaperQuestions(selectedPaper.id).then(res => {
      setAllPaperQuestions(res.questions || []);
      setLoadingQuestions(false);
    }).catch(() => {
      setAllPaperQuestions([]);
      setLoadingQuestions(false);
    });

    // Load paginated questions for study mode
    loadStudyQuestions(selectedPaper.id, studyPage, searchQuery);
  }, [selectedPaper?.id]);

  const loadStudyQuestions = async (paperId: string, page: number, search: string) => {
    setStudyLoading(true);
    try {
      const res = await api.getPYQs({
        paperId,
        page,
        limit: studyLimit,
        search: search || undefined
      });
      setStudyQuestions(res.items || []);
      setStudyTotalCount(res.totalCount || 0);
      setStudyTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load study questions:', err);
    } finally {
      setStudyLoading(false);
    }
  };

  // Handle Search Input Debounced
  useEffect(() => {
    if (!selectedPaper) return;
    const timer = setTimeout(() => {
      setStudyPage(1);
      loadStudyQuestions(selectedPaper.id, 1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Random PYQ Action
  const handleRandomPYQ = async () => {
    try {
      const randomQ = await api.getRandomPYQ({ exam: selectedExam });
      if (randomQ) {
        if (archive && randomQ.exam) {
          const matchingPaper = archive.papers.find(p => p.exam === randomQ.exam && (p.paper === randomQ.paper || p.paperTitle === randomQ.source));
          if (matchingPaper) {
            setSelectedPaper(matchingPaper);
            setSelectedExam(matchingPaper.exam);
            setSelectedCycle(matchingPaper.examCycle || String(matchingPaper.year));
          }
        }
        setPracticeMode(true);
      }
    } catch (err) {
      console.error('Failed to fetch random PYQ:', err);
    }
  };

  const handleStartMock = () => {
    if (setActiveSection) {
      setActiveSection('mock');
    }
  };

  const toggleSolution = (qId: string) => {
    setExpandedSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const availableCycles = (archive && selectedExam) ? (archive.cyclesByExam[selectedExam] || []) : [];
  const papersInCycle = (archive && selectedExam && selectedCycle)
    ? archive.papers.filter(p => p.exam === selectedExam && (p.examCycle === selectedCycle || String(p.year) === selectedCycle))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans-editorial animate-in fade-in duration-300">
      
      {/* Top Header & Tab Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-amber-700" />
            <span>Official PYQ Repository & Compendiums</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Complete official UPSC CSE and BPSC question papers verified strictly against commission originals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Commission Data Audit</span>
          </button>

          <button
            onClick={handleRandomPYQ}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random PYQ</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs: Official PYQs vs Revision Notes */}
      <div className="flex items-center gap-2 border-b border-[#EAE6DF]">
        <button
          onClick={() => { setActiveTab('pyqs'); setPracticeMode(false); }}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'pyqs'
              ? 'border-amber-600 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building className="w-4 h-4 text-amber-700" />
          Official Commission Question Papers ({archive?.totalPapers || 16} Papers)
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'notes'
              ? 'border-amber-600 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-700" />
          Standard Revision Notes & Compendiums
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'library'
              ? 'border-amber-600 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-amber-700" />
          Reference Library & Textbooks (Google Drive)
        </button>
      </div>

      {/* Tab 1: Official PYQs Section */}
      {activeTab === 'pyqs' && (
        <div className="space-y-6">
          {/* Practice Mode Overlay */}
          {practiceMode && selectedPaper ? (
            <PyqPracticeSession
              paper={selectedPaper}
              questions={allPaperQuestions}
              onExit={() => setPracticeMode(false)}
              onRandomQuestion={handleRandomPYQ}
            />
          ) : (
            <>
              {/* Compact Hierarchical Navigation Header */}
              <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4">
                
                {/* Level 1: Exam Selector & Level 2: Year/Cycle Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Exam Selector Buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 mr-1 font-mono uppercase">Exam:</span>
                    {(archive?.exams || ['UPSC CSE', 'BPSC']).map(exam => (
                      <button
                        key={exam}
                        onClick={() => handleExamSelect(exam)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedExam === exam
                            ? 'bg-stone-900 text-amber-300 shadow-2xs'
                            : 'bg-[#F4F0E8] text-stone-700 hover:bg-[#ECE6DC]'
                        }`}
                      >
                        {exam}
                      </button>
                    ))}
                  </div>

                  {/* Year / Cycle Dropdown */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="cycle-select" className="text-xs font-bold text-stone-500 font-mono uppercase">
                      Year / Cycle:
                    </label>
                    <select
                      id="cycle-select"
                      value={selectedCycle}
                      onChange={(e) => handleCycleSelect(e.target.value)}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      {availableCycles.map(cycle => (
                        <option key={cycle} value={cycle}>
                          {selectedExam === 'BPSC' ? `${cycle} Prelims` : `${cycle} Examination`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Level 3: Paper Selector Pills (If multiple papers exist in cycle) */}
                {papersInCycle.length > 1 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-500 mr-1 font-mono uppercase">Select Paper:</span>
                    {papersInCycle.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPaper(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selectedPaper?.id === p.id
                            ? 'bg-amber-50 text-amber-950 border border-amber-300 font-bold'
                            : 'bg-[#F4F0E8] text-stone-700 hover:bg-[#ECE6DC]'
                        }`}
                      >
                        {p.paper}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Compact Active Paper Hero Card with 3 Key Actions */}
              {selectedPaper && (
                <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  {/* Paper Information */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-mono">
                        {selectedPaper.exam} {selectedPaper.examCycle || selectedPaper.year}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                        {selectedPaper.paper}
                      </span>
                      {selectedPaper.verificationStatus === 'OFFICIAL_VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          100% Officially Verified ({selectedPaper.verifiedQuestionCount || selectedPaper.actualQuestionCount}/{selectedPaper.expectedQuestionCount} Qs)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-medium border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          Digitization In Progress ({selectedPaper.actualQuestionCount}/{selectedPaper.expectedQuestionCount} Qs)
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
                      {selectedPaper.paperName || selectedPaper.paperTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-mono">
                      <span>• Expected: {selectedPaper.expectedQuestionCount} Questions</span>
                      <span>• Marks: {selectedPaper.marksPerCorrect || 2.0} per correct (-{selectedPaper.negativeMarking || 0.666})</span>
                      <span>• Duration: {selectedPaper.durationMinutes || 120} Mins</span>
                      <span className="flex items-center gap-1 text-stone-600">
                        • Source: <a href={selectedPaper.officialPaperUrl || selectedPaper.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-900 underline inline-flex items-center gap-0.5">{selectedPaper.sourceDomain || 'Official Commission'}<ExternalLink className="w-2.5 h-2.5" /></a>
                      </span>
                    </div>
                  </div>

                  {/* 3 Clear Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
                    {/* Action 1: Practice Questions */}
                    <button
                      onClick={() => setPracticeMode(true)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Practice Questions</span>
                    </button>

                    {/* Action 2: Full Mock Simulation */}
                    <button
                      onClick={handleStartMock}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Full Mock Mode</span>
                    </button>

                    {/* Action 3: View Official PDF */}
                    <a
                      href={selectedPaper.officialPaperUrl || selectedPaper.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#FAF8F5] hover:bg-[#F4F0E8] text-stone-700 border border-[#EAE6DF] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Open Official Commission Booklet"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Official PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Study Mode: Browsable Question List */}
              <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-2xs space-y-6">
                
                {/* Search & Bilingual Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions by topic, keyword, or concept..."
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 font-mono">
                      Showing {studyQuestions.length} of {studyTotalCount} Questions
                    </span>

                    {/* Language Switcher */}
                    <div className="flex items-center bg-[#F4F0E8] border border-[#EAE6DF] rounded-xl p-0.5 text-xs font-medium">
                      <button
                        onClick={() => setBilingualLang('en')}
                        className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${bilingualLang === 'en' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => setBilingualLang('hi')}
                        className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${bilingualLang === 'hi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                      >
                        HI
                      </button>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {studyLoading ? (
                  <div className="text-center py-16 text-stone-400 text-sm">
                    Loading official questions...
                  </div>
                ) : !selectedPaper ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EAE6DF] space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                    <div className="text-sm font-bold text-stone-900">
                      No Question Paper Selected
                    </div>
                    <p className="text-xs text-stone-600 max-w-md mx-auto">
                      Please select an examination and year/cycle from the navigation header above.
                    </p>
                  </div>
                ) : studyQuestions.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EAE6DF] space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                    <div className="text-sm font-bold text-stone-900">
                      {(selectedPaper?.actualQuestionCount ?? 0) === 0 
                        ? 'Official Paper Scanning & Ingestion Pending'
                        : 'No questions found matching your filter criteria.'}
                    </div>
                    <p className="text-xs text-stone-600 max-w-md mx-auto">
                      {(selectedPaper?.actualQuestionCount ?? 0) === 0
                        ? `The authentic question booklet for ${selectedPaper?.exam || 'BPSC'} ${selectedPaper?.examCycle || selectedPaper?.year || ''} is queued for verified digital ingestion. In accordance with strict data integrity standards, synthetic or placeholder questions are never generated.`
                        : 'Try searching with a different keyword or resetting your search filter.'}
                    </p>
                    {(selectedPaper?.actualQuestionCount ?? 0) === 0 && (selectedPaper?.officialPaperUrl || selectedPaper?.officialSourceUrl) && (
                      <div className="pt-2">
                        <a
                          href={selectedPaper?.officialPaperUrl || selectedPaper?.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Official Commission PDF ({selectedPaper?.sourceDomain || 'Commission Portal'})</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 divide-y divide-stone-100">
                    {studyQuestions.map((q, idx) => {
                      const isExpanded = !!expandedSolutions[q.id];

                      return (
                        <div key={q.id} className={`pt-6 first:pt-0 space-y-4`}>
                          <QuestionRenderer
                            question={q}
                            questionNumber={q.questionNumber || ((studyPage - 1) * studyLimit + idx + 1)}
                            language={bilingualLang}
                            mode="study"
                            showSolution={isExpanded}
                            onToggleSolution={() => toggleSolution(q.id)}
                            onAskAiTutor={(prompt) => askTutorWithContext(prompt)}
                            marks={selectedPaper?.marksPerCorrect || 2.0}
                            negativeMarks={selectedPaper?.negativeMarking || 0.666}
                          />

                          {/* Solution Accordion Toggle */}
                          <div className="pt-1">
                            <button
                              onClick={() => toggleSolution(q.id)}
                              className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>{isExpanded ? 'Hide Detailed Solution' : 'View Official Key & Explanation'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {studyTotalPages > 1 && selectedPaper && (
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <button
                      onClick={() => {
                        const newP = Math.max(1, studyPage - 1);
                        setStudyPage(newP);
                        loadStudyQuestions(selectedPaper.id, newP, searchQuery);
                      }}
                      disabled={studyPage === 1}
                      className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#EAE6DF] text-stone-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>

                    <span className="text-xs text-stone-500 font-medium">
                      Page {studyPage} of {studyTotalPages}
                    </span>

                    <button
                      onClick={() => {
                        const newP = Math.min(studyTotalPages, studyPage + 1);
                        setStudyPage(newP);
                        loadStudyQuestions(selectedPaper.id, newP, searchQuery);
                      }}
                      disabled={studyPage === studyTotalPages}
                      className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#EAE6DF] text-stone-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Revision Notes & Standard Compendiums */}
      {activeTab === 'notes' && <NotesTab />}

      {/* Tab 3: Google Drive Reference Library */}
      {activeTab === 'library' && <LearnerDriveLibraryTab />}

      {/* Data Accuracy Audit Modal */}
      <PyqAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onSyncComplete={loadArchive}
      />
    </div>
  );
};

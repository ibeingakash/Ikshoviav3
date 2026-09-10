import React, { useState, useEffect, useRef } from 'react';
import {
  FileUp,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Filter,
  Trash2,
  Edit3,
  BookOpen,
  Check,
  X,
  RefreshCw,
  Info,
  UploadCloud,
  ShieldCheck,
  Eye,
  Save,
  Send,
  HelpCircle,
  FileCheck,
  History,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  Clock,
} from 'lucide-react';
import {
  OCRImportMode,
  Question,
  Subject,
  Topic,
  Concept,
  PublishDestination,
} from '../../types/index.js';
import { api, waitForBackendReadiness, isBackendStartingError } from '../../lib/api.js';
import { AddMissingQuestionModal } from './ocr/AddMissingQuestionModal.js';
import { QuestionRevisionModal } from './ocr/QuestionRevisionModal.js';
import { FigureEditorModal } from './ocr/FigureEditorModal.js';
import { PaperCompletenessBanner } from './ocr/PaperCompletenessBanner.js';
import {
  PaperCompletenessCheck,
  calculateCanonicalMissingQuestions,
  getCanonicalExpectedQuestions,
  validatePaperCompleteness,
  normalizeOptionsForExam,
  isBpscExam,
  isUpscExam,
} from '../../lib/examOptionPolicy.js';

interface UploadFileState {
  file: File | null;
  name: string;
  sizeBytes: number;
  base64: string;
  status: 'IDLE' | 'READING' | 'READY' | 'ERROR';
  errorMessage?: string;
}

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export const OCRStudioView: React.FC = () => {
  // Active Step state (1 to 6)
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Step 1: Import Mode
  const [mode, setMode] = useState<OCRImportMode>('SEPARATE_PDFS');

  // Step 2: Local File Upload States
  const [questionFile, setQuestionFile] = useState<UploadFileState>({
    file: null,
    name: '',
    sizeBytes: 0,
    base64: '',
    status: 'IDLE',
  });

  const [answerFile, setAnswerFile] = useState<UploadFileState>({
    file: null,
    name: '',
    sizeBytes: 0,
    base64: '',
    status: 'IDLE',
  });

  const questionFileInputRef = useRef<HTMLInputElement | null>(null);
  const answerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: Syllabus & Destination Mapping
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState('sub_full_length');
  const [selectedTopicId, setSelectedTopicId] = useState('top_mixed');
  const [selectedConceptId, setSelectedConceptId] = useState('c_mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [examTag, setExamTag] = useState('UPSC CSE Prelims');
  const [pyqYear, setPyqYear] = useState<number>(2025);
  const [destination, setDestination] = useState<PublishDestination>('PRACTICE_BANK');
  const [keepOriginalPdf, setKeepOriginalPdf] = useState(false);

  // Accuracy & Bilingual Configuration
  const [selectedExam, setSelectedExam] = useState<'UPSC CSE' | 'BPSC'>('UPSC CSE');
  const [documentLanguage, setDocumentLanguage] = useState<'EN' | 'HI' | 'BILINGUAL' | 'AUTO'>('AUTO');
  const [totalExpectedQuestions, setTotalExpectedQuestions] = useState<number>(100);
  const [ocrResultMeta, setOcrResultMeta] = useState<any>(null);
  const [cardLang, setCardLang] = useState<Record<string, 'en' | 'hi'>>({});
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);
  const [answerKeyInputText, setAnswerKeyInputText] = useState('');
  const [isApplyingKey, setIsApplyingKey] = useState(false);
  const [isPublishingToCatalog, setIsPublishingToCatalog] = useState(false);

  const handleExamChange = (exam: 'UPSC CSE' | 'BPSC') => {
    setSelectedExam(exam);
    if (exam === 'UPSC CSE') {
      setTotalExpectedQuestions(100);
      setExamTag('UPSC CSE Prelims');
    } else if (exam === 'BPSC') {
      setTotalExpectedQuestions(150);
      setExamTag('BPSC Prelims');
    }
  };

  // Step 4: OCR V2 Processing & Real-time Polling State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<{
    stage?: string;
    currentPage?: number;
    totalPages?: number;
    pagesCompleted?: number;
    percentage?: number;
    detectedQuestions?: number;
    answerMatches?: number;
    reviewCount?: number;
    errorMessage?: string;
    diagnostics?: any;
  } | null>(null);
  const pollingTimerRef = useRef<any>(null);

  // Step 5: Review & Questions
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'READY_TO_PUBLISH' | 'NEEDS_REVIEW' | 'NEEDS_ANSWER' | 'LOW_CONFIDENCE'>('ALL');
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});

  // Missing questions modal & audit & figure modals
  const [showAddMissingModal, setShowAddMissingModal] = useState(false);
  const [suggestedMissingQNum, setSuggestedMissingQNum] = useState<number | undefined>(undefined);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionTargetQuestion, setRevisionTargetQuestion] = useState<Question | null>(null);
  const [showFigureModal, setShowFigureModal] = useState(false);
  const [figureTargetQuestion, setFigureTargetQuestion] = useState<Question | null>(null);

  // Completeness check state
  const [completenessCheck, setCompletenessCheck] = useState<PaperCompletenessCheck | null>(null);
  const [isCheckingCompleteness, setIsCheckingCompleteness] = useState(false);

  // Recent jobs & active job selector
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  // Status notification banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Step 6: Publish Safety & Summary
  const [isPublishing, setIsPublishing] = useState(false);

  // Slot-level Option Editing (e.g. adding missing Option B, C, D, E)
  const [addingSlotForQ, setAddingSlotForQ] = useState<{ qId: string; slotId: string } | null>(null);
  const [slotInputText, setSlotInputText] = useState('');
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  const getActiveJobId = () => {
    return (
      ocrResultMeta?.id ||
      ocrResultMeta?.jobId ||
      ocrResultMeta?.job?.id ||
      activeJobId ||
      (extractedQuestions && extractedQuestions.length > 0 ? (extractedQuestions.find(q => (q as any).jobId) as any)?.jobId : '') ||
      localStorage.getItem('ocr_active_job_id') ||
      (recentJobs && recentJobs.length > 0 ? recentJobs[0]?.id : '') ||
      ''
    );
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const jobs = await api.getOcrJobs();
      if (Array.isArray(jobs)) {
        setRecentJobs(jobs);
      }
    } catch (e) {
      console.warn('[OCR Studio] Could not fetch recent jobs:', e);
    }
  };

  const loadJobForReview = async (jobId: string) => {
    if (!jobId) return false;
    setIsLoadingJob(true);
    setIsCheckingCompleteness(true);
    try {
      const res = await api.getOcrJobReview(jobId);
      if (res && res.job) {
        const job = res.job;
        const questionsList = Array.isArray(res.questions) ? res.questions : [];
        setActiveJobId(job.id);
        localStorage.setItem('ocr_active_job_id', job.id);
        setExtractedQuestions(questionsList);
        setSelectedExam(job.exam || 'BPSC');
        setExamTag(job.exam || 'BPSC');
        setPyqYear(job.year || 2026);
        setTotalExpectedQuestions(res.expectedCount || job.expectedQuestionCount || (job.exam === 'BPSC' ? 150 : 100));
        setOcrResultMeta({
          ...job,
          id: job.id,
          jobId: job.id,
          questions: questionsList,
          strategyUsed: job.strategy || 'OCR_V2_DETERMINISTIC_CLI',
          detectedLanguage: job.detectedLanguage || 'EN',
          totalExpected: res.expectedCount || job.expectedQuestionCount,
          totalDetected: res.totalAccountedCount || res.detectedCount || questionsList.length,
          missingQuestionNums: res.missingNumbers || [],
          validationPassed: (res.missingNumbers || []).length === 0,
        });
        if (res.completeness) {
          setCompletenessCheck(res.completeness);
        } else {
          setCompletenessCheck(res);
        }
        setCurrentStep(5);
        fetchRecentJobs();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[OCR Studio] Failed to load job for review:', err);
      return false;
    } finally {
      setIsLoadingJob(false);
      setIsCheckingCompleteness(false);
    }
  };

  useEffect(() => {
    loadMetaData();
    fetchRecentJobs();

    // Check if there is an active OCR background job stored in session or query param
    const urlParams = new URLSearchParams(window.location.search);
    const urlJobId = urlParams.get('jobId');
    const storedJobId = urlJobId || localStorage.getItem('ocr_active_job_id');

    if (storedJobId) {
      api.getOcrJobDetails(storedJobId).then(async (res) => {
        if (res?.job) {
          if (res.job.status === 'QUEUED' || res.job.status === 'PROCESSING') {
            setActiveJobId(storedJobId);
            localStorage.setItem('ocr_active_job_id', storedJobId);
            setIsProcessing(true);
            setCurrentStep(4);
            startPolling(storedJobId);
          } else if (res.job.status === 'COMPLETED' || res.job.status === 'REVIEW_REQUIRED' || res.job.status === 'PARSED') {
            await loadJobForReview(storedJobId);
          }
        }
      }).catch(() => {
        // Stale job id in localStorage
      });
    }

    return () => {
      stopPolling();
    };
  }, []);

  const pollJobStatus = async (jobId: string) => {
    try {
      const res = await api.getOcrJobDetails(jobId);
      if (!res || !res.job) return;

      const job = res.job;
      const reviewState = job.reviewState || {};
      const stage = reviewState.stage || job.status;

      setJobProgress({
        stage,
        currentPage: reviewState.currentPage || job.processedPages || 0,
        totalPages: reviewState.totalPages || job.pageCount || 0,
        pagesCompleted: reviewState.pagesCompleted || job.processedPages || 0,
        percentage: reviewState.percentage || (job.status === 'COMPLETED' ? 100 : 0),
        detectedQuestions: reviewState.detectedQuestions || job.detectedQuestionsCount || 0,
        answerMatches: reviewState.answerMatches || 0,
        reviewCount: reviewState.reviewCount || 0,
        errorMessage: reviewState.errorMessage || job.errorMessage,
        diagnostics: reviewState.diagnostics,
      });

      // Update numerical stage indicator for progress checklist
      if (stage === 'VALIDATING' || job.status === 'QUEUED') {
        setProcessingStage(1);
      } else if (stage === 'OCR_PROCESSING' || stage === 'TEXT_EXTRACTION') {
        setProcessingStage(2);
      } else if (stage === 'SEGMENTING_QUESTIONS') {
        setProcessingStage(3);
      } else if (stage === 'BINDING_ANSWERS' || stage === 'FINALIZING_STAGING') {
        setProcessingStage(4);
      }

      if (job.status === 'COMPLETED' || job.status === 'REVIEW_REQUIRED' || job.status === 'PARSED') {
        stopPolling();
        setIsProcessing(false);
        setProcessingStage(5);
        await loadJobForReview(job.id);
        setStatusMessage({
          type: 'success',
          text: `OCR Extraction complete! Processed job #${job.id.slice(0, 16)}...`,
        });
      } else if (job.status === 'FAILED') {
        stopPolling();
        localStorage.removeItem('ocr_active_job_id');
        setIsProcessing(false);
        const errMsg = reviewState.errorMessage || job.errorMessage || 'OCR extraction failed.';
        setStatusMessage({
          type: 'error',
          text: `OCR Extraction Failure: ${errMsg}`,
        });
      }
    } catch (err: any) {
      console.warn('[OCR Polling Warning]', err?.message || err);
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    pollJobStatus(jobId);
    pollingTimerRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 2000);
  };

  // Update dependent topics and concepts when Subject/Topic selection changes
  useEffect(() => {
    if (selectedSubjectId) {
      loadTopicsForSubject(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedTopicId) {
      loadConceptsForTopic(selectedTopicId);
    }
  }, [selectedTopicId]);

  const loadMetaData = async () => {
    try {
      const subRes = await api.getSubjects();
      if (Array.isArray(subRes) && subRes.length > 0) {
        setSubjects(subRes);
        if (!selectedSubjectId || !subRes.some(s => s.id === selectedSubjectId)) {
          setSelectedSubjectId(subRes[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const loadTopicsForSubject = async (subjId: string) => {
    if (subjId === 'sub_full_length') {
      const mixedTopics: Topic[] = [
        {
          id: 'top_mixed',
          name: 'All / Mixed Topics',
          subjectId: 'sub_full_length',
          description: 'Multi-disciplinary and full paper topic coverage',
          order: 1,
          conceptsCount: 1,
        },
      ];
      setTopics(mixedTopics);
      setSelectedTopicId('top_mixed');
      return;
    }

    try {
      const topicRes = await api.getTopics(subjId);
      if (Array.isArray(topicRes) && topicRes.length > 0) {
        setTopics(topicRes);
        if (!selectedTopicId || !topicRes.some(t => t.id === selectedTopicId)) {
          setSelectedTopicId(topicRes[0].id);
        }
      } else {
        setTopics([]);
        setSelectedTopicId('');
        setConcepts([]);
        setSelectedConceptId('');
      }
    } catch (err) {
      console.error('Failed to load topics', err);
    }
  };

  const loadConceptsForTopic = async (topId: string) => {
    if (!topId) {
      setConcepts([]);
      setSelectedConceptId('');
      return;
    }

    if (topId === 'top_mixed') {
      const mixedConcepts: Concept[] = [
        {
          id: 'c_mixed',
          title: 'All / Mixed Concepts (Full Paper)',
          topicId: 'top_mixed',
          subjectId: 'sub_full_length',
          summary: 'Full length paper mixed conceptual coverage',
          explanation: 'Covers questions across the entire syllabus for mock and PYQ full-length papers.',
          examples: [],
          keyPoints: ['Comprehensive syllabus coverage', 'Real exam simulation'],
          difficulty: 'INTERMEDIATE',
          importance: 'HIGH',
          prerequisiteIds: [],
          relatedIds: [],
          tags: ['Full Length', 'PYQ', 'Mock'],
        },
      ];
      setConcepts(mixedConcepts);
      setSelectedConceptId('c_mixed');
      return;
    }

    try {
      const conRes = await api.getConcepts(topId);
      if (Array.isArray(conRes) && conRes.length > 0) {
        setConcepts(conRes);
        if (!selectedConceptId || !conRes.some(c => c.id === selectedConceptId)) {
          setSelectedConceptId(conRes[0].id);
        }
      } else {
        setConcepts([]);
        setSelectedConceptId('');
      }
    } catch (err) {
      console.error('Failed to load concepts', err);
    }
  };

  // Helper to format bytes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File handler helpers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'QUESTION' | 'ANSWER') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMessage({ type: 'error', text: 'Security Warning: Only valid PDF documents (.pdf) are accepted.' });
      return;
    }

    const reader = new FileReader();
    const updateState = (partial: Partial<UploadFileState>) => {
      if (target === 'QUESTION') setQuestionFile(prev => ({ ...prev, ...partial }));
      else setAnswerFile(prev => ({ ...prev, ...partial }));
    };

    updateState({ file, name: file.name, sizeBytes: file.size, status: 'READING' });

    reader.onload = () => {
      const base64 = reader.result as string;
      updateState({ base64, status: 'READY' });
      setStatusMessage({ type: 'success', text: `Loaded ${file.name} (${formatFileSize(file.size)}).` });
    };

    reader.onerror = () => {
      updateState({ status: 'ERROR', errorMessage: 'Failed to read PDF file content.' });
      setStatusMessage({ type: 'error', text: 'Error reading local file.' });
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (target: 'QUESTION' | 'ANSWER') => {
    if (target === 'QUESTION') {
      setQuestionFile({ file: null, name: '', sizeBytes: 0, base64: '', status: 'IDLE' });
      if (questionFileInputRef.current) questionFileInputRef.current.value = '';
    } else {
      setAnswerFile({ file: null, name: '', sizeBytes: 0, base64: '', status: 'IDLE' });
      if (answerFileInputRef.current) answerFileInputRef.current.value = '';
    }
  };

  // Run OCR processing in Step 4
  const handleExecuteOCR = async () => {
    setIsProcessing(true);
    setProcessingStage(1);
    setStatusMessage({ type: 'info', text: 'Verifying OCR server readiness...' });

    try {
      // 1. Check backend readiness before uploading heavy PDF payloads
      // Retry lightweight /api/health with bounded exponential backoff; NEVER repeat the heavy OCR upload
      const readiness = await waitForBackendReadiness({
        maxWaitMs: 75000,
        initialDelayMs: 2000,
        maxDelayMs: 8000,
        onProgress: (info) => {
          setStatusMessage({
            type: 'info',
            text: info.message,
          });
        },
      });

      if (!readiness.ready) {
        setIsProcessing(false);
        setStatusMessage({
          type: 'error',
          text: 'OCR server is starting. Please try again in a moment. Your PDF was not submitted.',
        });
        return;
      }

      setStatusMessage({ type: 'info', text: 'Submitting document to deterministic background OCR pipeline...' });

      const idempotencyKey = `ocr_ui_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Execute OCR upload & queue
      const res = await api.processOcrImport({
        idempotencyKey,
        mode,
        exam: selectedExam,
        documentLanguage,
        totalExpectedQuestions,
        questionPdfBase64: questionFile.base64,
        answerPdfBase64: answerFile.base64,
        questionFileName: questionFile.name || 'Question_Paper.pdf',
        answerFileName: answerFile.name || 'Answer_Key.pdf',
        subjectId: selectedSubjectId || 'sub_full_length',
        topicId: selectedTopicId || 'top_mixed',
        conceptId: selectedConceptId || 'c_mixed',
        difficulty: selectedDifficulty,
        examTag,
        pyqYear,
        destination,
        keepOriginalPdf,
      });

      if (res.success && Array.isArray(res.questions) && res.questions.length > 0) {
        const activeId = res.jobId || res.job?.id;
        if (activeId) {
          setActiveJobId(activeId);
          localStorage.setItem('ocr_active_job_id', activeId);
        }
        setExtractedQuestions(res.questions);
        setOcrResultMeta(res);
        setStatusMessage({
          type: 'success',
          text: `OCR Extraction complete! Extracted ${res.questions.length} question(s) (Expected: ${totalExpectedQuestions}).`,
        });
        setIsProcessing(false);
        setCurrentStep(5); // Proceed to Review Step
        if (activeId) {
          await loadJobForReview(activeId);
        }
      } else if (res.jobId || res.job?.id) {
        const queuedJobId = res.jobId || res.job?.id;
        setActiveJobId(queuedJobId);
        localStorage.setItem('ocr_active_job_id', queuedJobId);
        setStatusMessage({
          type: 'info',
          text: `Document accepted. Native OCR processing initiated (Job: ${queuedJobId.slice(0, 16)}...).`,
        });
        startPolling(queuedJobId);
      } else {
        setIsProcessing(false);
        const stageInfo = res.stage ? `[Stage: ${res.stage}] ` : '';
        const detailsInfo = res.details ? ` (${res.details})` : '';
        setStatusMessage({
          type: 'error',
          text: `${stageInfo}${res.error || 'Failed to process OCR document.'}${detailsInfo}`,
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      if (isBackendStartingError(err)) {
        setStatusMessage({
          type: 'error',
          text: 'OCR server is starting. Please try again in a moment. Your PDF was not submitted.',
        });
      } else {
        const errDetail = err?.message || 'Server error during OCR extraction.';
        setStatusMessage({ type: 'error', text: `OCR Processing Error: ${errDetail}` });
      }
    }
  };

  // Review & Selection actions
  const handleToggleSelectAll = () => {
    const visibleIds = filteredQuestions.map(q => q.id);
    if (selectedQuestionIds.length === visibleIds.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(visibleIds);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(qId => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleBulkAction = async (action: 'DELETE' | 'SAVE_DRAFT' | 'APPROVE' | 'PUBLISH') => {
    if (selectedQuestionIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one question from the review list.' });
      return;
    }

    const jobId = getActiveJobId();
    try {
      const res = await api.bulkActionOcrQuestions({
        jobId,
        questionIds: selectedQuestionIds,
        action,
        destination,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        conceptId: selectedConceptId,
        difficulty: selectedDifficulty,
        examTag,
        pyqYear,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        if (Array.isArray(res.questions) && res.questions.length > 0) {
          setExtractedQuestions(res.questions);
        } else {
          setExtractedQuestions(prev =>
            prev
              .map(q => {
                if (!selectedQuestionIds.includes(q.id)) return q;
                if (action === 'DELETE') return null;
                if (action === 'PUBLISH' && q.correctAnswer && q.correctAnswer !== '') {
                  return { ...q, isPublished: true, status: 'PUBLISHED' as const, destination };
                }
                if (action === 'APPROVE') {
                  const isBlocked = res.rejectedIds?.includes(q.id);
                  return isBlocked ? q : { ...q, status: 'READY_TO_PUBLISH' as const };
                }
                if (action === 'SAVE_DRAFT') return { ...q, status: 'DRAFT' as const, isPublished: false };
                return q;
              })
              .filter(Boolean) as Question[]
          );
        }
        setSelectedQuestionIds([]);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Bulk action failed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error executing bulk action.' });
    }
  };

  const handleStartEdit = (q: Question) => {
    setEditingQId(q.id);
    const isBpsc = isBpscExam(selectedExam);
    const canonicalLabels = isBpsc ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    const existingMap = new Map<string, string>();
    (q.options || []).forEach((opt: any, idx: number) => {
      const letter = typeof opt === 'object' && opt?.id ? String(opt.id).toUpperCase() : String.fromCharCode(65 + idx);
      const text = typeof opt === 'string' ? opt : (opt?.text || '');
      existingMap.set(letter, text);
    });

    const normalizedOpts = canonicalLabels.map(label => ({
      id: label,
      text: existingMap.get(label) || '',
    }));

    if (!isBpsc && existingMap.has('E')) {
      normalizedOpts.push({ id: 'E', text: existingMap.get('E') || '' });
    }

    setEditForm({
      ...q,
      options: normalizedOpts,
    });
  };

  const handleSaveInlineEdit = async () => {
    if (!editingQId) return;
    try {
      // Clean and normalize options before saving
      const canonicalOrder = ['A', 'B', 'C', 'D', 'E'];
      const cleanedOptions = (editForm.options || [])
        .map((opt: any, idx: number) => {
          const letter = typeof opt === 'object' && opt?.id ? String(opt.id).toUpperCase() : String.fromCharCode(65 + idx);
          const text = typeof opt === 'string' ? opt : (opt?.text || '');
          return { id: letter, text: text.trim() };
        })
        .sort((a: any, b: any) => {
          const idxA = canonicalOrder.indexOf(a.id);
          const idxB = canonicalOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.id.localeCompare(b.id);
        });

      const payload = {
        ...editForm,
        options: cleanedOptions,
      };

      const res = await api.updateOcrQuestion(editingQId, payload);
      if (res.success && res.question) {
        const updatedList = extractedQuestions.map(q => (q.id === editingQId ? (res.question as Question) : q));
        setExtractedQuestions(updatedList);
        setEditingQId(null);
        setStatusMessage({ type: 'success', text: 'Extracted question saved directly to PostgreSQL!' });
        runCompletenessAudit(updatedList);
      } else {
        const fallback = await api.updateQuestion(editingQId, payload);
        if (fallback.success) {
          const updatedList = extractedQuestions.map(q => (q.id === editingQId ? (fallback.question as Question) : q));
          setExtractedQuestions(updatedList);
          setEditingQId(null);
          setStatusMessage({ type: 'success', text: 'Question updated successfully.' });
          runCompletenessAudit(updatedList);
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update question.' });
    }
  };

  const handleSaveSlotOption = async (q: Question, slotId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: `Option ${slotId} text cannot be empty.` });
      return;
    }
    const currentOptions = Array.isArray(q.options) ? [...q.options] : [];
    const normalizedSlotId = slotId.trim().toUpperCase();

    // Upsert the option into raw array
    let found = false;
    const updatedRaw = currentOptions.map((opt: any, idx: number) => {
      const optId = typeof opt === 'object' && opt?.id ? String(opt.id).trim().toUpperCase() : String.fromCharCode(65 + idx);
      if (optId === normalizedSlotId) {
        found = true;
        return typeof opt === 'string' ? { id: normalizedSlotId, text: trimmed } : { ...opt, id: normalizedSlotId, text: trimmed };
      }
      return typeof opt === 'string' ? { id: optId, text: opt } : { ...opt, id: optId };
    });

    if (!found) {
      updatedRaw.push({ id: normalizedSlotId, text: trimmed });
    }

    // Canonical sorting: A, B, C, D, E (strictly NO Option F for BPSC or UPSC)
    const canonicalOrder = ['A', 'B', 'C', 'D', 'E'];
    const canonicalSortedOptions = updatedRaw
      .map((opt: any, idx: number) => ({
        id: String(opt.id || String.fromCharCode(65 + idx)).trim().toUpperCase(),
        text: typeof opt.text === 'string' ? opt.text.trim() : '',
      }))
      .filter(opt => canonicalOrder.includes(opt.id)) // Strip any accidental Option F
      .sort((a, b) => {
        const idxA = canonicalOrder.indexOf(a.id);
        const idxB = canonicalOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.id.localeCompare(b.id);
      });

    setIsSavingSlot(true);
    try {
      const res = await api.correctQuestion(q.id, {
        fieldChanged: 'options',
        reason: `Added/updated canonical Option ${normalizedSlotId} to satisfy ${selectedExam} option policy`,
        oldValue: `${currentOptions.length} options`,
        newValue: `${canonicalSortedOptions.length} options (includes Option ${normalizedSlotId})`,
        newOptions: canonicalSortedOptions,
      });

      await api.updateOcrQuestion(q.id, { options: canonicalSortedOptions });

      const updatedQuestion = res?.question || { ...q, options: canonicalSortedOptions };
      const updatedList = extractedQuestions.map(item =>
        item.id === q.id ? { ...item, ...updatedQuestion, options: canonicalSortedOptions } : item
      );

      setExtractedQuestions(updatedList);
      setAddingSlotForQ(null);
      setSlotInputText('');

      setStatusMessage({
        type: 'success',
        text: `Question #${q.questionNum || q.questionNumber}: Option ${normalizedSlotId} saved canonically into paper sequence!`,
      });

      runCompletenessAudit(updatedList);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || `Failed to save Option ${normalizedSlotId}.` });
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleApplyAnswerKeyText = async () => {
    if (!answerKeyInputText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter answer key text (e.g. 1 A 2 B 3 C 4 D).' });
      return;
    }
    const jobId = getActiveJobId();
    if (!jobId) {
      setStatusMessage({ type: 'error', text: 'No active OCR job ID found. Please process a document first.' });
      return;
    }

    setIsApplyingKey(true);
    try {
      const res = await api.parseOcrAnswerKey(jobId, answerKeyInputText);
      if (res.success && Array.isArray(res.questions)) {
        setExtractedQuestions(res.questions);
        setShowAnswerKeyModal(false);
        setAnswerKeyInputText('');
        setStatusMessage({
          type: 'success',
          text: `Master Answer Key applied! Matched ${res.matchedCount} keys, updated ${res.updatedQuestionsCount} questions to READY_TO_PUBLISH.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to parse and bind answer key.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error applying answer key text.' });
    } finally {
      setIsApplyingKey(false);
    }
  };

  const runCompletenessAudit = async (customQuestions?: Question[]) => {
    const list = customQuestions || extractedQuestions;
    const jobId = getActiveJobId();
    setIsCheckingCompleteness(true);
    try {
      if (jobId) {
        const res = await api.getOcrJobReview(jobId);
        const comp = res?.completeness || (res?.expectedCount ? res : null);
        if (comp) {
          setCompletenessCheck(comp);
          if (Array.isArray(res.questions) && res.questions.length > 0) {
            setExtractedQuestions(res.questions);
          }
          return;
        }
      }
      const exp = totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag);
      const local = validatePaperCompleteness(selectedExam, list, exp);
      setCompletenessCheck(local);
    } catch {
      const exp = totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag);
      const local = validatePaperCompleteness(selectedExam, list, exp);
      setCompletenessCheck(local);
    } finally {
      setIsCheckingCompleteness(false);
    }
  };

  const handleStripOptionE = async (q: Question) => {
    const originalOptions = q.options || [];
    const filteredOptions = originalOptions.filter((opt: any) => {
      const label = typeof opt === 'object' ? opt.id : '';
      return label?.toUpperCase() !== 'E';
    });
    try {
      const res = await api.correctQuestion(q.id, {
        fieldChanged: 'options',
        reason: 'Stripped Option E to enforce UPSC CSE 4-option (A-D) commission policy',
        oldValue: `${originalOptions.length} options (includes Option E)`,
        newValue: `${filteredOptions.length} options (A-D only)`,
      });
      const updated = res?.question || { ...q, options: filteredOptions };
      setExtractedQuestions(prev => prev.map(item => (item.id === q.id ? { ...item, ...updated } : item)));
      setStatusMessage({
        type: 'success',
        text: `Question #${q.questionNum || q.questionNumber}: Removed Option E to enforce UPSC 4-option policy.`,
      });
      runCompletenessAudit();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to strip Option E.' });
    }
  };

  const handleAddOptionE = async (q: Question) => {
    await handleSaveSlotOption(q, 'E', 'More than one of the above / None of the above');
  };

  const handlePublishEntirePaperToPyqCatalog = async () => {
    const jobId = getActiveJobId();
    if (!jobId) {
      setStatusMessage({ type: 'error', text: 'No active OCR Job ID found to publish.' });
      return;
    }

    setIsPublishingToCatalog(true);
    try {
      const res = await api.publishOcrJobToPyq(jobId, {
        exam: selectedExam,
        year: pyqYear,
        paper: examTag,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully published entire paper (${res.publishedCount} questions) to canonical PYQ database [Paper ID: ${res.paperId}]!`,
        });
        setExtractedQuestions(prev =>
          prev.map(q => ({ ...q, isPublished: true, status: 'PUBLISHED' as const }))
        );
        runCompletenessAudit();
      } else {
        if (res.completeness) {
          setCompletenessCheck(res.completeness);
        }
        setStatusMessage({
          type: 'error',
          text: res.error || 'Completeness validation blocked publishing this paper.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Exception while publishing to canonical PYQ catalog.' });
    } finally {
      setIsPublishingToCatalog(false);
    }
  };

  const handleFinalPublish = async (action: 'PUBLISH' | 'DRAFT') => {
    setIsPublishing(true);
    const targetIds = extractedQuestions.map(q => q.id);
    const jobId = getActiveJobId();

    try {
      const res = await api.bulkActionOcrQuestions({
        jobId,
        questionIds: targetIds,
        action: action === 'PUBLISH' ? 'PUBLISH' : 'SAVE_DRAFT',
        destination,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        conceptId: selectedConceptId,
        difficulty: selectedDifficulty,
        examTag,
        pyqYear,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        if (Array.isArray(res.questions) && res.questions.length > 0) {
          setExtractedQuestions(res.questions);
        } else if (action === 'PUBLISH') {
          setExtractedQuestions(prev =>
            prev.map(q =>
              q.correctAnswer && q.correctAnswer !== ''
                ? { ...q, isPublished: true, status: 'PUBLISHED' as const }
                : q
            )
          );
        }
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Publish action failed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error publishing questions.' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered Questions for Step 5
  const filteredQuestions = extractedQuestions.filter(q => {
    if (filterTab === 'READY_TO_PUBLISH') return q.status === 'READY_TO_PUBLISH';
    if (filterTab === 'NEEDS_REVIEW') return q.status === 'NEEDS_REVIEW';
    if (filterTab === 'NEEDS_ANSWER') return q.status === 'NEEDS_ANSWER' || !q.correctAnswer;
    if (filterTab === 'LOW_CONFIDENCE') return q.ocrConfidence !== undefined && q.ocrConfidence < 70;
    return true;
  });

  // Active Subject & Concept object helpers
  const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);
  const currentConceptObj = concepts.find(c => c.id === selectedConceptId);

  // Stats Counters
  const readyCount = extractedQuestions.filter(q => q.status === 'READY_TO_PUBLISH' || q.status === 'PUBLISHED').length;
  const needsReviewCount = extractedQuestions.filter(q => q.status === 'NEEDS_REVIEW').length;
  const needsAnswerCount = extractedQuestions.filter(q => q.status === 'NEEDS_ANSWER' || !q.correctAnswer).length;
  const lowConfidenceCount = extractedQuestions.filter(q => q.ocrConfidence !== undefined && q.ocrConfidence < 70).length;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-16 min-w-0 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Content Import • Ingestion & OCR Pipeline
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Content Import Studio (PDF & Answer Key Ingestion)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Digitize Civil Services PYQs and Mock Test PDFs. Auto-match question papers with solution keys, inspect extraction confidence, map to syllabus hierarchy, and publish.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {recentJobs.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowJobSelector(!showJobSelector)}
                  className="flex items-center gap-1.5 text-xs text-indigo-200 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/60 px-3 py-1.5 rounded-xl font-medium transition-all shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{getActiveJobId() ? `Job: ${getActiveJobId().slice(0, 14)}...` : 'Select OCR Job'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showJobSelector && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 max-h-72 overflow-y-auto">
                    <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                      Recent Ingestion Jobs ({recentJobs.length})
                    </div>
                    {recentJobs.map((j) => {
                      const isCurrent = j.id === getActiveJobId();
                      return (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            setShowJobSelector(false);
                            loadJobForReview(j.id);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all flex flex-col gap-0.5 ${
                            isCurrent
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white truncate">{j.fileName || j.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              j.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              j.status === 'REVIEW_REQUIRED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {j.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{j.exam || 'BPSC'} • {j.detectedQuestionsCount || 0} Qs</span>
                            <span className="font-mono text-[10px] text-slate-500">{new Date(j.createdAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <span className="text-xs text-indigo-200 bg-indigo-900/60 border border-indigo-700/50 px-3 py-1.5 rounded-xl font-medium">
              Step {currentStep} of 6
            </span>
          </div>
        </div>
      </div>

      {/* Progressive Step Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { num: 1, label: '1. Import Type', icon: Layers },
            { num: 2, label: '2. Upload PDF(s)', icon: UploadCloud },
            { num: 3, label: '3. Syllabus Mapping', icon: BookOpen },
            { num: 4, label: '4. OCR Processing', icon: RefreshCw },
            { num: 5, label: '5. Review Questions', icon: FileCheck },
            { num: 6, label: '6. Publish Safety', icon: ShieldCheck },
          ].map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => {
                  if (step.num <= currentStep || extractedQuestions.length > 0) {
                    setCurrentStep(step.num as StepNumber);
                  }
                }}
                disabled={step.num > currentStep && extractedQuestions.length === 0}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : isCompleted
                    ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/70 border border-indigo-800/40'
                    : 'bg-slate-950/40 text-slate-500 cursor-not-allowed border border-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : isCompleted ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">{step.label}</span>
                {isCompleted && <Check className="w-3 h-3 text-emerald-400 ml-auto hidden sm:inline" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-700 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 px-2 py-1 bg-slate-900/50 rounded-lg">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: IMPORT TYPE SELECTION */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Step 1: Choose Import Mode</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select the structure of the document(s) you are uploading for question digitization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'SEPARATE_PDFS',
                title: 'Mode 4: Separate PDFs',
                badge: 'Recommended',
                desc: 'Upload Question Paper PDF + Answer/Solution PDF. Auto-aligns questions with solution key numbers.',
                icon: Layers,
              },
              {
                id: 'QUESTION_PDF_ONLY',
                title: 'Mode 1: Question PDF Only',
                badge: 'Questions Only',
                desc: 'Extract questions & options. Correct answers remain unassigned until solution key is provided.',
                icon: FileUp,
              },
              {
                id: 'ANSWER_PDF_ONLY',
                title: 'Mode 2: Solution PDF Only',
                badge: 'Keys & Solutions',
                desc: 'Extract answer keys & explanations to resolve draft questions or create solution entries.',
                icon: FileCheck,
              },
              {
                id: 'COMBINED_PDF',
                title: 'Mode 3: Combined PDF',
                badge: 'Single File',
                desc: 'Single document containing questions, options, correct answers, and explanations together.',
                icon: FileText,
              },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = mode === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setMode(item.id as OCRImportMode)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-indigo-950/70 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.badge === 'Recommended'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                    <span className={isSelected ? 'text-amber-400' : 'text-slate-500'}>
                      {isSelected ? 'Selected' : 'Click to Select'}
                    </span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                      {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <span>Next: Upload Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REAL FILE UPLOADS (DRAG & DROP) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <span>Step 2: Local File Upload Dropzone</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload real local PDF files ({mode === 'SEPARATE_PDFS' ? 'Two PDFs required' : 'One PDF required'}).
              </p>
            </div>
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-slate-300 font-mono">
              Accepted: PDF (.pdf)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question PDF Upload Area */}
            {mode !== 'ANSWER_PDF_ONLY' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Question Paper PDF</span>
                </label>

                {questionFile.status === 'READY' || questionFile.status === 'READING' ? (
                  <div className="bg-slate-950 border border-indigo-800/60 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-950 border border-indigo-700/50 rounded-xl text-amber-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-[280px]">
                          {questionFile.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(questionFile.sizeBytes)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => questionFileInputRef.current?.click()}
                        className="text-xs text-indigo-300 hover:text-white bg-indigo-950/80 border border-indigo-700/60 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleRemoveFile('QUESTION')}
                        className="text-xs text-rose-400 hover:text-rose-200 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => questionFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/50 hover:bg-slate-900/60 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mx-auto transition-all">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-amber-300">
                        Click to select or drag & drop Question PDF
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Supports UPSC, State PSC, and custom test paper documents</p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={questionFileInputRef}
                  onChange={e => handleFileChange(e, 'QUESTION')}
                  accept="application/pdf"
                  className="hidden"
                />
              </div>
            )}

            {/* Answer / Solution PDF Upload Area */}
            {(mode === 'SEPARATE_PDFS' || mode === 'ANSWER_PDF_ONLY') && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Answer Key / Solution PDF</span>
                </label>

                {answerFile.status === 'READY' || answerFile.status === 'READING' ? (
                  <div className="bg-slate-950 border border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-950 border border-emerald-700/50 rounded-xl text-emerald-400">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-[280px]">
                          {answerFile.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(answerFile.sizeBytes)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => answerFileInputRef.current?.click()}
                        className="text-xs text-emerald-300 hover:text-white bg-emerald-950/80 border border-emerald-700/60 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleRemoveFile('ANSWER')}
                        className="text-xs text-rose-400 hover:text-rose-200 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => answerFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/50 hover:bg-slate-900/60 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto transition-all">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                        Click to select or drag & drop Solution Key PDF
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Contains official answer keys & detailed explanations</p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={answerFileInputRef}
                  onChange={e => handleFileChange(e, 'ANSWER')}
                  accept="application/pdf"
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <span>Next: Syllabus Mapping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: SYLLABUS & DESTINATION MAPPING */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Step 3: Syllabus Hierarchy & Destination Mapping</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Assign extracted questions to the correct Subject, Topic, Concept, Exam Tag, and Destination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Target Subject <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Target Topic <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
                disabled={topics.length === 0}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none disabled:opacity-50"
              >
                {topics.length > 0 ? (
                  topics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                ) : (
                  <option value="">No topics available for this subject</option>
                )}
              </select>
            </div>

            {/* Concept Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Target Concept <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedConceptId}
                onChange={e => setSelectedConceptId(e.target.value)}
                disabled={concepts.length === 0}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none disabled:opacity-50"
              >
                {concepts.length > 0 ? (
                  concepts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                ) : (
                  <option value="">No concepts available for this topic</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-slate-800">
            {/* Target Exam */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Target Exam</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <select
                value={selectedExam}
                onChange={e => handleExamChange(e.target.value as 'UPSC CSE' | 'BPSC')}
                className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="UPSC CSE">UPSC CSE (100 Questions)</option>
                <option value="BPSC">BPSC (150 Questions)</option>
              </select>
            </div>

            {/* Document Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Document Language</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <select
                value={documentLanguage}
                onChange={e => setDocumentLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="AUTO">Auto Detect Language</option>
                <option value="EN">English Only</option>
                <option value="HI">हिंदी (Hindi Only)</option>
                <option value="BILINGUAL">English + हिंदी (Bilingual Paper)</option>
              </select>
            </div>

            {/* Total Expected Questions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Expected Total Questions</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={totalExpectedQuestions}
                onChange={e => setTotalExpectedQuestions(Number(e.target.value) || 150)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none font-semibold"
                placeholder="e.g. 150"
              />
            </div>

            {/* Exam Tag */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Exam Tag</label>
              <input
                type="text"
                value={examTag}
                onChange={e => setExamTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
                placeholder="e.g. UPSC CSE Prelims"
              />
            </div>

            {/* PYQ Year */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">PYQ Year</label>
              <input
                type="number"
                value={pyqYear}
                onChange={e => setPyqYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Difficulty Level</label>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            {/* Publish Destination */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Publish Destination</label>
              <select
                value={destination}
                onChange={e => setDestination(e.target.value as PublishDestination)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="PRACTICE_BANK">Practice Question Bank</option>
                <option value="MOCK_TEST">Mock Test Set</option>
                <option value="BOTH">Both (Bank & Mock)</option>
              </select>
            </div>
          </div>

          {/* Storage Policy Checkbox */}
          <div className="pt-4 border-t border-slate-800 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={keepOriginalPdf}
                onChange={e => setKeepOriginalPdf(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-white">Keep Original PDF in Document Storage</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Default is OFF (Temporary processing memory only). Checking this retains the original uploaded PDF in abstracted document storage.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <span>Next: OCR Processing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: OCR & VISION PROCESSING STAGE */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl text-center max-w-2xl mx-auto">
          <div className="p-4 bg-amber-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-400 border border-amber-500/30">
            <RefreshCw className={`w-8 h-8 ${isProcessing ? 'animate-spin' : ''}`} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white">Deterministic OCR & Extraction Pipeline</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Extract authentic questions, parse choices & statements, align answer keys, and calculate forensic confidence scores using isolated native CLI workers.
            </p>
          </div>

          {/* Live Progress Metrics (When Active) */}
          {isProcessing && (
            <div className="bg-slate-950 border border-indigo-900/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 font-semibold uppercase tracking-wider">
                  {jobProgress?.stage?.replace(/_/g, ' ') || 'PROCESSING'}
                </span>
                <span className="text-white font-mono font-bold">
                  {jobProgress?.percentage || 5}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(5, Math.min(100, jobProgress?.percentage || 5))}%` }}
                />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Pages</div>
                  <div className="text-sm font-bold text-white">
                    {jobProgress?.currentPage || 0} / {jobProgress?.totalPages || '...'}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Questions Found</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {jobProgress?.detectedQuestions || 0}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Expected</div>
                  <div className="text-sm font-bold text-amber-400">
                    {totalExpectedQuestions}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps Indicator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            {[
              { idx: 1, label: 'Validate PDF header & native system dependencies' },
              { idx: 2, label: 'Deterministic native text / Tesseract CLI OCR extraction' },
              { idx: 3, label: 'Sequential boundary segmentation & 5-option normalization' },
              { idx: 4, label: 'Align solution key numbers & verification diagnostics' },
            ].map(st => (
              <div key={st.idx} className="flex items-center gap-3 text-xs">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    processingStage > st.idx
                      ? 'bg-emerald-500 text-slate-950'
                      : processingStage === st.idx
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {processingStage > st.idx ? <Check className="w-3 h-3 stroke-[3]" /> : st.idx}
                </div>
                <span className={processingStage >= st.idx ? 'text-white font-medium' : 'text-slate-500'}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => {
                if (!isProcessing) setCurrentStep(3);
              }}
              disabled={isProcessing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              Back to Mapping
            </button>

            <button
              onClick={handleExecuteOCR}
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing in Background...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Execute OCR Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: REVIEW & EDITING DASHBOARD */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {/* Extraction & Accuracy Report Banner */}
          {ocrResultMeta && (
            <div className="bg-slate-900 border border-indigo-800/80 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">OCR Accuracy & Pipeline Verification Report</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-1 rounded-lg font-mono">
                    Strategy: {ocrResultMeta.strategyUsed || 'VISION_API'}
                  </span>
                  <span className="bg-amber-950 text-amber-300 border border-amber-700/60 px-2.5 py-1 rounded-lg font-mono">
                    Detected Lang: {ocrResultMeta.detectedLanguage || 'EN'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Total Expected:</div>
                  <div className="text-lg font-bold text-white">{ocrResultMeta.totalExpected || totalExpectedQuestions}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Total Detected:</div>
                  <div className="text-lg font-bold text-emerald-400">{ocrResultMeta.totalDetected || extractedQuestions.length}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Missing Questions:</div>
                  <div className={`text-lg font-bold ${ocrResultMeta.missingQuestionNums?.length ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {ocrResultMeta.missingQuestionNums?.length || 0}
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Accuracy Status:</div>
                  <div className="text-sm font-bold text-amber-400 mt-1">
                    {ocrResultMeta.validationPassed ? 'PASSED (Sequence OK)' : 'REVIEW REQUIRED'}
                  </div>
                </div>
              </div>

              {/* Forensic Diagnostics Details */}
              {ocrResultMeta.diagnostics && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <Info className="w-4 h-4" />
                      Deterministic Extraction Diagnostics
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {ocrResultMeta.diagnostics.processingTimeMs}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">PDF Layer: </span>
                      <span className="font-semibold text-white">{ocrResultMeta.diagnostics.pdfType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pages Processed: </span>
                      <span className="font-semibold text-white">{ocrResultMeta.diagnostics.pageCount || ocrResultMeta.diagnostics.ocrPagesProcessed}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Extracted Chars: </span>
                      <span className="font-semibold text-white">{(ocrResultMeta.diagnostics.extractedTextCharCount || ocrResultMeta.diagnostics.ocrCharCount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Question Markers: </span>
                      <span className="font-semibold text-emerald-400">{ocrResultMeta.diagnostics.detectedQuestionMarkers}</span>
                    </div>
                  </div>
                  {ocrResultMeta.diagnostics.rejectionReasons && ocrResultMeta.diagnostics.rejectionReasons.length > 0 && (
                    <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-900">
                      <span className="font-bold text-amber-400">Parser Notices: </span>
                      {ocrResultMeta.diagnostics.rejectionReasons.join(' • ')}
                    </div>
                  )}
                </div>
              )}

              {ocrResultMeta.missingQuestionNums && ocrResultMeta.missingQuestionNums.length > 0 && (
                <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong className="font-bold">Missing Sequence Warning:</strong> Questions #{ocrResultMeta.missingQuestionNums.join(', #')} were not detected in the PDF source. Please verify manual entry.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Paper Completeness & Option Policy Validator Banner */}
          <PaperCompletenessBanner
            exam={selectedExam}
            expectedCount={ocrResultMeta?.totalExpected || totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag)}
            detectedCount={extractedQuestions.length}
            completenessCheck={completenessCheck}
            missingNumbers={
              completenessCheck?.missingNumbers ||
              ocrResultMeta?.missingQuestionNums ||
              calculateCanonicalMissingQuestions(
                ocrResultMeta?.totalExpected || totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag),
                extractedQuestions.map(q => Number(q.questionNum || q.questionNumber)).filter(n => !isNaN(n) && n > 0)
              ).missingNumbers
            }
            duplicateNumbers={
              completenessCheck?.duplicateNumbers ||
              calculateCanonicalMissingQuestions(
                ocrResultMeta?.totalExpected || totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag),
                extractedQuestions.map(q => Number(q.questionNum || q.questionNumber)).filter(n => !isNaN(n) && n > 0)
              ).duplicateNumbers
            }
            onAddMissingClick={(qNum) => {
              setSuggestedMissingQNum(qNum);
              setShowAddMissingModal(true);
            }}
            onRefreshCompleteness={() => runCompletenessAudit()}
            isLoading={isCheckingCompleteness}
          />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Extracted', val: extractedQuestions.length, color: 'text-white', bg: 'bg-slate-900 border-slate-800' },
              { label: 'Ready to Publish', val: readyCount, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/60' },
              { label: 'Needs Review', val: needsReviewCount, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/60' },
              { label: 'Missing Answer', val: needsAnswerCount, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/60' },
              { label: 'Low Confidence', val: lowConfidenceCount, color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-800/60' },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} border rounded-2xl p-4 shadow-md text-center`}>
                <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.val}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs & Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              {[
                { id: 'ALL', label: `All (${extractedQuestions.length})` },
                { id: 'READY_TO_PUBLISH', label: `Ready (${readyCount})` },
                { id: 'NEEDS_REVIEW', label: `Needs Review (${needsReviewCount})` },
                { id: 'NEEDS_ANSWER', label: `Missing Answer (${needsAnswerCount})` },
                { id: 'LOW_CONFIDENCE', label: `Low Confidence (${lowConfidenceCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bulk Toolbar */}
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 flex-wrap">
              <button
                onClick={() => {
                  setSuggestedMissingQNum(undefined);
                  setShowAddMissingModal(true);
                }}
                disabled={(completenessCheck?.missingNumbers?.length ?? 0) === 0}
                title={
                  (completenessCheck?.missingNumbers?.length ?? 0) === 0
                    ? 'All canonical questions accounted for (0 missing questions).'
                    : `Add missing canonical question (${completenessCheck?.missingNumbers?.length} unresolved)`
                }
                className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Missing Q</span>
              </button>

              <button
                onClick={() => setShowAnswerKeyModal(true)}
                className="text-xs bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Bind Master Answer Key</span>
              </button>

              <button
                onClick={handleToggleSelectAll}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-medium"
              >
                {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                onClick={() => handleBulkAction('APPROVE')}
                disabled={selectedQuestionIds.length === 0}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
              >
                Approve ({selectedQuestionIds.length})
              </button>

              <button
                onClick={() => handleBulkAction('DELETE')}
                disabled={selectedQuestionIds.length === 0}
                className="text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
              >
                Delete ({selectedQuestionIds.length})
              </button>
            </div>
          </div>

          {/* Master Answer Key Quick-Binder Modal */}
          {showAnswerKeyModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Bind Master Answer Key</h3>
                  </div>
                  <button
                    onClick={() => setShowAnswerKeyModal(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Paste the official answer key text. Formats supported: <code className="text-amber-300 font-mono">1 A 2 B 3 C</code>, tabular numbers, or <code className="text-amber-300 font-mono">Q1: A, Q2: B</code>.
                </p>

                <textarea
                  value={answerKeyInputText}
                  onChange={e => setAnswerKeyInputText(e.target.value)}
                  placeholder="1 A&#10;2 B&#10;3 C&#10;4 D..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAnswerKeyModal(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyAnswerKeyText}
                    disabled={isApplyingKey || !answerKeyInputText.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isApplyingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Parse & Apply Keys</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question Cards List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No questions in this filter tab</p>
                <p className="text-xs text-slate-400 mt-1">Select "All" to view extracted questions or run OCR again.</p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const isEditing = editingQId === q.id;
                const anyQ = q as any;

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg transition-all space-y-4 ${
                      isSelected ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Meta Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(q.id)}
                          className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                        />
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                          Question #{anyQ.questionNum || idx + 1}
                        </span>

                        {anyQ.format && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono">
                            {anyQ.format}
                          </span>
                        )}

                        {/* Answer Key Binding Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            anyQ.answerKeyStatus === 'ANSWER_BOUND' || anyQ.correctAnswer
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {anyQ.answerKeyStatus === 'ANSWER_BOUND' || anyQ.correctAnswer ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Answer Bound ({anyQ.correctAnswer})</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Answer Pending</span>
                            </>
                          )}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            q.status === 'READY_TO_PUBLISH' || q.status === 'PUBLISHED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : q.status === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {q.status || 'UNASSIGNED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Visual Content Flag */}
                        {q.hasVisualContent && (
                          <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            📷 Diagram/Map
                          </span>
                        )}

                        {/* Language switcher for bilingual questions */}
                        {(q.question_hi || (q.availableLanguages && q.availableLanguages.includes('hi'))) && (
                          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 text-[11px] font-bold">
                            <button
                              onClick={() => setCardLang({ ...cardLang, [q.id]: 'en' })}
                              className={`px-2 py-0.5 rounded ${
                                (cardLang[q.id] || 'en') === 'en'
                                   ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              EN
                            </button>
                            <button
                              onClick={() => setCardLang({ ...cardLang, [q.id]: 'hi' })}
                              className={`px-2 py-0.5 rounded ${
                                cardLang[q.id] === 'hi'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              हिंदी
                            </button>
                          </div>
                        )}

                        {/* Confidence Score Badge */}
                        {q.ocrConfidence !== undefined && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              q.ocrConfidence >= 85
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : q.ocrConfidence >= 70
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : 'bg-rose-950 text-rose-300 border-rose-700'
                            }`}
                          >
                            Confidence: {q.ocrConfidence}%
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setRevisionTargetQuestion(q);
                            setShowRevisionModal(true);
                          }}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-medium transition"
                          title="View provenance history and record audited revisions"
                        >
                          <History className="w-3.5 h-3.5 text-amber-400" />
                          <span>Audit ({q.corrections_count || (q as any).correctionsCount || 0})</span>
                        </button>

                        <button
                          onClick={() => {
                            setFigureTargetQuestion(q);
                            setShowFigureModal(true);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 font-medium transition ${
                            q.image_url || q.imageUrl
                              ? 'bg-purple-950/80 text-purple-300 border-purple-700 hover:bg-purple-900'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Inspect, upload, or verify question diagram/figure"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{q.image_url || q.imageUrl ? 'Diagram Attached' : 'Figure'}</span>
                        </button>

                        <button
                          onClick={() => (isEditing ? handleSaveInlineEdit() : handleStartEdit(q))}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditing ? 'Save' : 'Edit'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Editing Form or View Mode */}
                    {isEditing ? (
                      <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-1 block">Question Statement</label>
                          <textarea
                            value={editForm.question || ''}
                            onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Options inline editing with clear letter badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(editForm.options || []).map((opt: any, oIdx: number) => {
                            const optLetter = typeof opt === 'object' && opt?.id ? String(opt.id).toUpperCase() : String.fromCharCode(65 + oIdx);
                            const optText = typeof opt === 'string' ? opt : (opt?.text || '');
                            const isCorrect =
                              editForm.correctAnswer === optLetter ||
                              editForm.correctAnswer === String(oIdx) ||
                              editForm.correctAnswer === String.fromCharCode(65 + oIdx);
                            return (
                              <div key={`edit_opt_${q.id}_${optLetter}_${oIdx}`} className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer shrink-0" title={`Mark ${optLetter} as correct answer`}>
                                  <input
                                    type="radio"
                                    name={`correct_${q.id}`}
                                    checked={isCorrect}
                                    onChange={() => setEditForm({ ...editForm, correctAnswer: optLetter })}
                                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isCorrect ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                    {optLetter}.
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={optText}
                                  placeholder={`Option ${optLetter} text...`}
                                  onChange={e => {
                                    const updatedOpts = [...(editForm.options || [])];
                                    updatedOpts[oIdx] = typeof opt === 'string' ? { id: optLetter, text: e.target.value } : { ...opt, id: optLetter, text: e.target.value };
                                    setEditForm({ ...editForm, options: updatedOpts });
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-1 block">Solution Explanation</label>
                          <textarea
                            value={editForm.explanation || ''}
                            onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingQId(null)}
                            className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveInlineEdit}
                            className="text-xs bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-lg shadow"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Validation Warnings if present */}
                        {q.validationErrors && q.validationErrors.length > 0 && (
                          <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-2.5 text-xs text-amber-200 space-y-1">
                            <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" /> Validation Flags:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                              {q.validationErrors.map((vErr, vIdx) => (
                                <li key={vIdx}>{vErr}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Passage text block for comprehension */}
                        {anyQ.passageText && (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Passage / Context</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{anyQ.passageText}</p>
                          </div>
                        )}

                        {/* Exam Option Policy Notice & Actions */}
                        {(() => {
                          const isUpsc = isUpscExam(selectedExam);
                          const isBpsc = isBpscExam(selectedExam);
                          const rawOpts = (cardLang[q.id] === 'hi' && q.options_hi && q.options_hi.length > 0 ? q.options_hi : q.options) || [];
                          const normalized = normalizeOptionsForExam(selectedExam, rawOpts);
                          const missingSlots = normalized.filter(o => o.status === 'MISSING' || !o.text.trim()).map(o => o.id);
                          const unexpectedSlots = normalized.filter(o => o.status === 'UNEXPECTED').map(o => o.id);

                          if (isUpsc && unexpectedSlots.length > 0) {
                            return (
                              <div className="bg-rose-950/70 border border-rose-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-rose-300">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                  <span>
                                    <strong>UPSC Violation:</strong> Option {unexpectedSlots.join(', ')} detected (UPSC CSE Prelims policy strictly requires Options A-D only).
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleStripOptionE(q)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs shrink-0"
                                >
                                  Strip Option {unexpectedSlots[0]}
                                </button>
                              </div>
                            );
                          }

                          if (isBpsc && missingSlots.length > 0) {
                            return (
                              <div className="bg-amber-950/70 border border-amber-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                <div className="flex items-center gap-2 text-amber-300">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>
                                    <strong>BPSC Option Policy:</strong> Only {5 - missingSlots.length} of 5 options extracted. Missing slot{missingSlots.length > 1 ? 's' : ''}:{' '}
                                    <strong className="text-amber-200">{missingSlots.join(', ')}</strong>.
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  {missingSlots.map(slotId => (
                                    <button
                                      key={`btn_add_slot_${q.id}_${slotId}`}
                                      onClick={() => {
                                        setAddingSlotForQ({ qId: q.id, slotId });
                                        setSlotInputText('');
                                      }}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1 shadow-sm"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Option {slotId}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        {/* Figure / Diagram Visual Content Block */}
                        {(q.image_url || q.imageUrl) && (
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
                            <img
                              src={q.image_url || q.imageUrl}
                              alt={q.image_caption || q.imageCaption || 'Question figure'}
                              className="max-h-24 max-w-xs object-contain rounded bg-black/40 border border-slate-800"
                            />
                            <div className="text-xs text-slate-300">
                              <div className="font-semibold text-purple-300 flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Verified Question Diagram</span>
                              </div>
                              {(q.image_caption || q.imageCaption) && (
                                <p className="text-slate-400 text-[11px] mt-0.5">{q.image_caption || q.imageCaption}</p>
                              )}
                              <button
                                onClick={() => {
                                  setFigureTargetQuestion(q);
                                  setShowFigureModal(true);
                                }}
                                className="text-[11px] text-indigo-400 hover:underline mt-1 block"
                              >
                                Edit / Replace Diagram
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Question Statement (Bilingual support) */}
                        <p className="text-sm font-semibold text-white leading-relaxed">
                          {cardLang[q.id] === 'hi'
                            ? q.question_hi || q.question
                            : q.question_en || q.question}
                        </p>

                        {/* Statements list for STATEMENT_BASED questions */}
                        {Array.isArray(anyQ.statements) && anyQ.statements.length > 0 && (
                          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs text-slate-200">
                            {anyQ.statements.map((st: any, sIdx: number) => {
                              const stmtText = typeof st === 'string' ? st : (st?.text || String(st || ''));
                              const stmtId = typeof st === 'object' && st?.id ? st.id : (sIdx + 1);
                              return (
                                <div key={`stmt_${q.id}_${stmtId}_${sIdx}`} className="flex items-start gap-2">
                                  <span className="font-bold text-amber-400 shrink-0">{stmtId}.</span>
                                  <span>{stmtText}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Match the Following Table */}
                        {anyQ.matchData && (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-800 text-[11px] font-bold text-amber-400 uppercase">
                                  <th className="pb-2">{anyQ.matchData.leftHeader || 'List I'}</th>
                                  <th className="pb-2">{anyQ.matchData.rightHeader || 'List II'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {anyQ.matchData.leftColumn && anyQ.matchData.rightColumn ? (
                                  Array.from({ length: Math.max(anyQ.matchData.leftColumn.length, anyQ.matchData.rightColumn.length) }).map((_, rIdx) => {
                                    const left = anyQ.matchData.leftColumn[rIdx];
                                    const right = anyQ.matchData.rightColumn[rIdx];
                                    return (
                                      <tr key={`match_row_${q.id}_${rIdx}`}>
                                        <td className="py-1.5 pr-4">
                                          {left ? <span className="font-medium text-slate-200">{left.key || left.id}. {left.text}</span> : ''}
                                        </td>
                                        <td className="py-1.5">
                                          {right ? <span className="font-medium text-slate-200">{right.key || right.id}. {right.text}</span> : ''}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (anyQ.matchData.pairs || []).map((pair: any, pIdx: number) => (
                                  <tr key={`pair_${q.id}_${pIdx}`}>
                                    <td className="py-1.5 pr-4">{typeof pair === 'object' ? (pair.itemA || pair.item1 || pair.key || '') : String(pair)}</td>
                                    <td className="py-1.5">{typeof pair === 'object' ? (pair.itemB || pair.item2 || pair.value || '') : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Options List with Canonical Exam Policy Enforcement */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const rawOpts = (cardLang[q.id] === 'hi' && q.options_hi && q.options_hi.length > 0 ? q.options_hi : q.options) || [];
                            const normalized = normalizeOptionsForExam(selectedExam, rawOpts);
                            const correctLetter = (q.correctAnswer || '').trim().toUpperCase();

                            return normalized.map((opt, oIdx) => {
                              const isMissing = opt.status === 'MISSING' || !opt.text.trim();
                              const isUnexpected = opt.status === 'UNEXPECTED';
                              const isBeingEdited = addingSlotForQ?.qId === q.id && addingSlotForQ?.slotId === opt.id;
                              const isCorrect = !isMissing && (correctLetter === opt.id || correctLetter === String(oIdx));

                              if (isMissing) {
                                return (
                                  <div
                                    key={`card_opt_${q.id}_missing_${opt.id}_${oIdx}`}
                                    className="p-2.5 rounded-xl border border-dashed border-amber-600/70 bg-amber-950/20 text-xs flex flex-col justify-center gap-2"
                                  >
                                    {isBeingEdited ? (
                                      <div className="space-y-1.5 w-full">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                                          <span>Enter Option {opt.id} Text:</span>
                                          <span className="text-slate-400 font-normal">Press Enter to save</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            autoFocus
                                            value={slotInputText}
                                            onChange={e => setSlotInputText(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') handleSaveSlotOption(q, opt.id, slotInputText);
                                              if (e.key === 'Escape') {
                                                setAddingSlotForQ(null);
                                                setSlotInputText('');
                                              }
                                            }}
                                            placeholder={`Enter canonical text for Option ${opt.id}...`}
                                            className="flex-1 bg-slate-900 border border-amber-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                          />
                                          <button
                                            type="button"
                                            disabled={isSavingSlot || !slotInputText.trim()}
                                            onClick={() => handleSaveSlotOption(q, opt.id, slotInputText)}
                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50 shrink-0"
                                          >
                                            {isSavingSlot ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddingSlotForQ(null);
                                              setSlotInputText('');
                                            }}
                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition shrink-0"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-amber-400">{opt.id}.</span>
                                          <span className="text-amber-300/80 font-semibold italic text-[11px]">MISSING</span>
                                          <span className="text-slate-500 text-[10px] hidden sm:inline">(Not extracted by OCR)</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingSlotForQ({ qId: q.id, slotId: opt.id });
                                            setSlotInputText('');
                                          }}
                                          className="text-[11px] font-bold text-amber-300 bg-amber-950 hover:bg-amber-900 border border-amber-700/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Add {opt.id}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              if (isUnexpected) {
                                return (
                                  <div
                                    key={`card_opt_${q.id}_unexpected_${opt.id}_${oIdx}`}
                                    className="p-2.5 rounded-xl border border-rose-800 bg-rose-950/40 text-xs flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-rose-400">{opt.id}.</span>
                                      <span className="text-rose-200">{opt.text}</span>
                                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-900 text-rose-300 border border-rose-700">
                                        UNEXPECTED
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleStripOptionE(q)}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition"
                                    >
                                      Strip
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={`card_opt_${q.id}_${opt.id}_${oIdx}`}
                                  className={`group p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold ring-1 ring-emerald-500/30'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 mr-2">
                                    <span className="font-bold text-slate-400 shrink-0">{opt.id}.</span>
                                    <span className="break-words">{opt.text}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isCorrect && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingSlotForQ({ qId: q.id, slotId: opt.id });
                                        setSlotInputText(opt.text);
                                      }}
                                      className="opacity-60 hover:opacity-100 text-slate-400 hover:text-amber-400 p-0.5 rounded transition"
                                      title={`Edit Option ${opt.id}`}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Explanation block with Forensic Provenance */}
                        {(cardLang[q.id] === 'hi' ? q.explanation_hi || q.explanation : q.explanation_en || q.explanation) && (
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1">
                              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Solution Explanation:</span>
                              {(anyQ.solutionSource || anyQ.solutionQuestionNumber) && (
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
                                  Provenance: {anyQ.solutionSource || `Canonical Solution #${anyQ.solutionQuestionNumber}`}
                                </span>
                              )}
                            </div>
                            <p className="leading-relaxed">
                              {cardLang[q.id] === 'hi' ? q.explanation_hi || q.explanation : q.explanation_en || q.explanation}
                            </p>
                          </div>
                        )}

                        {/* Field Confidence Breakdown & Match Reason */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                          {q.fieldConfidence && (
                            <div className="flex items-center gap-2 font-mono">
                              <span>Confidence Breakdown:</span>
                              <span className="text-indigo-300">Q:{q.fieldConfidence.question}</span>
                              <span className="text-indigo-300">Opts:{q.fieldConfidence.options}</span>
                              <span className="text-indigo-300">Ans:{q.fieldConfidence.correctAnswer || (q.fieldConfidence as any).answer || 'HIGH'}</span>
                            </div>
                          )}

                          {q.ocrMatchReason && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{q.ocrMatchReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Bar to Next Step */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Syllabus</span>
            </button>

            <button
              onClick={() => setCurrentStep(6)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <span>Next: Publish Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: PUBLISH SAFETY & SUMMARY */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Step 6: Import Summary & Publish Safety Guardrails</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify question readiness before committing to the official syllabus database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary Breakdown */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Import Summary</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total Questions Processed:</span>
                  <span className="font-bold text-white">{extractedQuestions.length}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Ready to Publish:</span>
                  <span className="font-bold text-emerald-400">{readyCount}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Needs Review:</span>
                  <span className="font-bold text-amber-400">{needsReviewCount}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Blocked / Needs Answer:</span>
                  <span className="font-bold text-rose-400">{needsAnswerCount}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Target Subject:</span>
                  <span className="font-bold text-indigo-300">{currentSubjectObj?.name || 'Indian Polity'}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Publish Destination:</span>
                  <span className="font-bold text-amber-400">
                    {destination === 'BOTH' ? 'Both (Practice Bank & Mock Test)' : destination === 'MOCK_TEST' ? 'Mock Test Set' : 'Practice Question Bank'}
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Guardrail Policy Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Publish Guardrail Rules
              </h3>

              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>Questions without a verified correct answer cannot be published to live student banks.</li>
                <li>Unresolved questions will automatically remain in Draft state for review.</li>
                <li>Published questions become instantly available in Practice Mode and Mock Test algorithms.</li>
              </ul>
            </div>
          </div>

          {/* Completeness Guardrail Diagnostics in Step 6 */}
          {completenessCheck && !completenessCheck.canPublish && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 text-xs text-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Official PYQ Catalog Completeness Lock ({completenessCheck.completenessPercentage}%)
                </span>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold underline"
                >
                  Resolve in Review (Step 5)
                </button>
              </div>
              <p className="text-rose-300">
                Official Commission PYQ catalog papers require 100% complete question sequences and compliant commission option policies.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-rose-300/90">
                {completenessCheck.missingCount > 0 && (
                  <span>• Missing sequence questions: {completenessCheck.missingCount} (e.g. #{completenessCheck.missingNumbers.slice(0, 10).join(', #')})</span>
                )}
                {completenessCheck.questionsWithUnexpectedOptions?.length > 0 && (
                  <span>• UPSC questions with Option E: {completenessCheck.questionsWithUnexpectedOptions.length}</span>
                )}
                {completenessCheck.questionsWithMissingOptions?.length > 0 && (
                  <span>• Questions with missing options: {completenessCheck.questionsWithMissingOptions.length}</span>
                )}
                {completenessCheck.questionsWithPendingAnswers?.length > 0 && (
                  <span>• Questions pending answer key: {completenessCheck.questionsWithPendingAnswers.length}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(5)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto"
            >
              Back to Review
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleFinalPublish('DRAFT')}
                disabled={isPublishing || isPublishingToCatalog}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>

              <button
                onClick={handlePublishEntirePaperToPyqCatalog}
                disabled={isPublishing || isPublishingToCatalog || readyCount === 0 || (completenessCheck !== null && !completenessCheck.canPublish)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2 text-sm"
                title={completenessCheck && !completenessCheck.canPublish ? 'Blocked: Paper completeness check failed' : 'Publish complete paper to PYQ Catalog'}
              >
                {isPublishingToCatalog ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing to PYQ...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Publish to Official PYQ Catalog ({readyCount})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleFinalPublish('PUBLISH')}
                disabled={isPublishing || isPublishingToCatalog || readyCount === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2 text-sm"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Publish to {destination === 'BOTH' ? 'Practice Bank & Mock Test' : destination === 'MOCK_TEST' ? 'Mock Test Set' : 'Practice Bank'} ({readyCount})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Question Modal */}
      {showAddMissingModal && (
        <AddMissingQuestionModal
          jobId={getActiveJobId()}
          exam={selectedExam}
          suggestedQuestionNum={suggestedMissingQNum}
          existingMissingNumbers={
            completenessCheck?.missingNumbers ||
            calculateCanonicalMissingQuestions(
              ocrResultMeta?.totalExpected || totalExpectedQuestions || getCanonicalExpectedQuestions(selectedExam, examTag),
              extractedQuestions.map(q => Number(q.questionNum || q.questionNumber)).filter(n => !isNaN(n) && n > 0)
            ).missingNumbers
          }
          onClose={() => {
            setShowAddMissingModal(false);
            setSuggestedMissingQNum(undefined);
          }}
          onQuestionAdded={(newQ, updatedCompleteness) => {
            setExtractedQuestions(prev => {
              const next = [...prev, newQ];
              return next.sort((a, b) => Number(a.questionNum || a.questionNumber || 0) - Number(b.questionNum || b.questionNumber || 0));
            });
            if (updatedCompleteness) {
              setCompletenessCheck(updatedCompleteness);
            }
            setStatusMessage({
              type: 'success',
              text: `Question #${newQ.questionNum || newQ.questionNumber} added directly to OCR job sequence!`,
            });
            runCompletenessAudit();
          }}
        />
      )}

      {/* Provenance & Revision Audit Modal */}
      {showRevisionModal && revisionTargetQuestion && (
        <QuestionRevisionModal
          question={revisionTargetQuestion}
          onClose={() => {
            setShowRevisionModal(false);
            setRevisionTargetQuestion(null);
          }}
          onCorrectionSaved={(updatedQ) => {
            setExtractedQuestions(prev =>
              prev.map(q => (q.id === updatedQ.id ? { ...q, ...updatedQ } : q))
            );
            setStatusMessage({
              type: 'success',
              text: `Audit correction recorded for Question #${updatedQ.questionNum || updatedQ.questionNumber}!`,
            });
            runCompletenessAudit();
          }}
        />
      )}

      {/* Figure / Diagram Editor Modal */}
      {showFigureModal && figureTargetQuestion && (
        <FigureEditorModal
          question={figureTargetQuestion}
          onClose={() => {
            setShowFigureModal(false);
            setFigureTargetQuestion(null);
          }}
          onFigureSaved={(updatedQ) => {
            setExtractedQuestions(prev =>
              prev.map(q => (q.id === updatedQ.id ? { ...q, ...updatedQ } : q))
            );
            setStatusMessage({
              type: 'success',
              text: `Figure updated and verified for Question #${updatedQ.questionNum || updatedQ.questionNumber}!`,
            });
            runCompletenessAudit();
          }}
        />
      )}
    </div>
  );
};

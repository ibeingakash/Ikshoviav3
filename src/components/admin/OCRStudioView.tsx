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
} from 'lucide-react';
import {
  OCRImportMode,
  Question,
  Subject,
  Topic,
  Concept,
  PublishDestination,
} from '../../types/index.js';
import { api } from '../../lib/api.js';

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
    name: 'UPSC_Prelims_2025_GS1.pdf',
    sizeBytes: 2450000,
    base64: '',
    status: 'READY',
  });

  const [answerFile, setAnswerFile] = useState<UploadFileState>({
    file: null,
    name: 'UPSC_Prelims_2025_GS1_AnswerKey.pdf',
    sizeBytes: 1120000,
    base64: '',
    status: 'READY',
  });

  const questionFileInputRef = useRef<HTMLInputElement | null>(null);
  const answerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: Syllabus & Destination Mapping
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState('sub_polity');
  const [selectedTopicId, setSelectedTopicId] = useState('top_rights');
  const [selectedConceptId, setSelectedConceptId] = useState('c_art32');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [examTag, setExamTag] = useState('UPSC CSE Prelims');
  const [pyqYear, setPyqYear] = useState<number>(2025);
  const [destination, setDestination] = useState<PublishDestination>('PRACTICE_BANK');
  const [keepOriginalPdf, setKeepOriginalPdf] = useState(false);

  // Accuracy & Bilingual Configuration
  const [documentLanguage, setDocumentLanguage] = useState<'EN' | 'HI' | 'BILINGUAL' | 'AUTO'>('AUTO');
  const [totalExpectedQuestions, setTotalExpectedQuestions] = useState<number>(150);
  const [ocrResultMeta, setOcrResultMeta] = useState<any>(null);
  const [cardLang, setCardLang] = useState<Record<string, 'en' | 'hi'>>({});

  // Step 4: OCR Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<number>(0);

  // Step 5: Review & Questions
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'READY_TO_PUBLISH' | 'NEEDS_REVIEW' | 'NEEDS_ANSWER' | 'LOW_CONFIDENCE'>('ALL');
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});

  // Status notification banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Step 6: Publish Safety & Summary
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadMetaData();
  }, []);

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
        if (!selectedSubjectId) setSelectedSubjectId(subRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const loadTopicsForSubject = async (subjId: string) => {
    try {
      const topicRes = await api.getTopics(subjId);
      if (Array.isArray(topicRes)) {
        setTopics(topicRes);
        if (topicRes.length > 0) {
          setSelectedTopicId(topicRes[0].id);
        } else {
          setSelectedTopicId('');
          setConcepts([]);
          setSelectedConceptId('');
        }
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
    try {
      const conRes = await api.getConcepts(topId);
      if (Array.isArray(conRes)) {
        setConcepts(conRes);
        if (conRes.length > 0) {
          setSelectedConceptId(conRes[0].id);
        } else {
          setSelectedConceptId('');
        }
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

    try {
      setTimeout(() => setProcessingStage(2), 600);
      setTimeout(() => setProcessingStage(3), 1200);

      const res = await api.processOcrImport({
        mode,
        documentLanguage,
        totalExpectedQuestions,
        questionPdfBase64: questionFile.base64,
        answerPdfBase64: answerFile.base64,
        questionFileName: questionFile.name || 'Question_Paper.pdf',
        answerFileName: answerFile.name || 'Answer_Key.pdf',
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        conceptId: selectedConceptId,
        difficulty: selectedDifficulty,
        examTag,
        pyqYear,
        destination,
        keepOriginalPdf,
      });

      setProcessingStage(4);

      if (res.success && Array.isArray(res.questions)) {
        setExtractedQuestions(res.questions);
        setOcrResultMeta(res);
        setStatusMessage({
          type: 'success',
          text: `OCR Extraction complete! Extracted ${res.questions.length} question(s) (Expected: ${totalExpectedQuestions}). Strategy: ${res.strategyUsed || 'VISION_API'}.`,
        });
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(5); // Proceed to Review Step
        }, 800);
      } else {
        setIsProcessing(false);
        setStatusMessage({ type: 'error', text: res.error || 'Failed to process OCR document.' });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: 'Server error during OCR extraction.' });
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

    try {
      const res = await api.bulkActionOcrQuestions({
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
        setExtractedQuestions(prev =>
          prev
            .map(q => {
              if (!selectedQuestionIds.includes(q.id)) return q;
              if (action === 'DELETE') return null;
              if (action === 'PUBLISH' && q.correctAnswer && q.correctAnswer !== '') {
                return { ...q, isPublished: true, status: 'PUBLISHED' as const, destination };
              }
              if (action === 'APPROVE') return { ...q, status: 'READY_TO_PUBLISH' as const };
              if (action === 'SAVE_DRAFT') return { ...q, status: 'DRAFT' as const, isPublished: false };
              return q;
            })
            .filter(Boolean) as Question[]
        );
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
    setEditForm({ ...q });
  };

  const handleSaveInlineEdit = async () => {
    if (!editingQId) return;
    try {
      const res = await api.updateQuestion(editingQId, editForm);
      if (res.success) {
        setExtractedQuestions(prev =>
          prev.map(q => (q.id === editingQId ? (res.question as Question) : q))
        );
        setEditingQId(null);
        setStatusMessage({ type: 'success', text: 'Question updated successfully.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update question.' });
    }
  };

  const handleFinalPublish = async (action: 'PUBLISH' | 'DRAFT') => {
    setIsPublishing(true);
    const targetIds = extractedQuestions.map(q => q.id);

    try {
      const res = await api.bulkActionOcrQuestions({
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
        if (action === 'PUBLISH') {
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
    <div className="space-y-6 max-w-[1700px] mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                IKSHOVIA V3 OCR & Vision Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Question & Solution PDF Import System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Digitize Civil Services PYQs and Mock Test PDFs. Auto-match question papers with solution keys, inspect extraction confidence, map to syllabus hierarchy, and publish.
            </p>
          </div>

          <div className="flex items-center gap-3">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800">
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
            <h2 className="text-xl font-extrabold text-white">OCR Vision Intelligence Pipeline</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Extract questions, parse choices, align answer keys, and calculate confidence scores.
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            {[
              { idx: 1, label: 'Validate PDF headers & security structure' },
              { idx: 2, label: 'Run Gemini Vision OCR extraction' },
              { idx: 3, label: 'Align solution key numbers & explanations' },
              { idx: 4, label: 'Generate confidence scores & review flags' },
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
              onClick={() => setCurrentStep(3)}
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
                  <span>Processing...</span>
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
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
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

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg transition-all space-y-4 ${
                      isSelected ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Meta Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(q.id)}
                          className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                        />
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                          Question #{idx + 1}
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

                        {/* Options inline editing */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(editForm.options || []).map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={editForm.correctAnswer === String(oIdx)}
                                onChange={() => setEditForm({ ...editForm, correctAnswer: String(oIdx) })}
                                className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-slate-900"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={e => {
                                  const updatedOpts = [...(editForm.options || [])];
                                  updatedOpts[oIdx] = { ...opt, text: e.target.value };
                                  setEditForm({ ...editForm, options: updatedOpts });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          ))}
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

                        {/* Question Statement (Bilingual support) */}
                        <p className="text-sm font-semibold text-white leading-relaxed">
                          {cardLang[q.id] === 'hi'
                            ? q.question_hi || q.question
                            : q.question_en || q.question}
                        </p>

                        {/* Options List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {((cardLang[q.id] === 'hi' && q.options_hi && q.options_hi.length > 0
                            ? q.options_hi
                            : q.options) || []
                          ).map((opt, oIdx) => {
                            const isCorrect = q.correctAnswer === String(oIdx);
                            return (
                              <div
                                key={opt.id || oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                  <span>{opt.text}</span>
                                </div>
                                {isCorrect && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        {(cardLang[q.id] === 'hi' ? q.explanation_hi || q.explanation : q.explanation_en || q.explanation) && (
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                            <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Solution Explanation:</span>
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
                              <span className="text-indigo-300">Ans:{q.fieldConfidence.correctAnswer}</span>
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
                  <span className="text-slate-400">Blocked / Needs Answer:</span>
                  <span className="font-bold text-rose-400">{needsAnswerCount}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Target Subject:</span>
                  <span className="font-bold text-indigo-300">{currentSubjectObj?.name || 'Indian Polity'}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Publish Destination:</span>
                  <span className="font-bold text-amber-400">{destination}</span>
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
                disabled={isPublishing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>

              <button
                onClick={() => handleFinalPublish('PUBLISH')}
                disabled={isPublishing || readyCount === 0}
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
                    <span>Publish Ready Questions ({readyCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

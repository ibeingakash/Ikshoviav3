/**
 * OCR V2 Types & Interfaces
 * Deterministic, Isolated OCR Architecture
 */

export type OcrV2Stage =
  | 'QUEUED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'OCR_PROCESSING'
  | 'SEGMENTING'
  | 'ANSWER_BINDING'
  | 'STAGING'
  | 'COMPLETED'
  | 'REVIEW_REQUIRED'
  | 'FAILED';

export interface OcrV2Progress {
  stage: OcrV2Stage;
  currentPage: number;
  totalPages: number;
  pagesCompleted: number;
  percentage: number;
  detectedQuestions: number;
  answerMatches: number;
  reviewCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  errorStage?: string;
  errorMessage?: string;
  strategyUsed?: string;
  diagnostics?: OcrV2Diagnostics;
}

export interface OcrV2Diagnostics {
  pdfSizeMb: number;
  pageCount: number;
  pdfType: 'TEXT_PDF' | 'SCANNED_PDF' | 'HYBRID_PDF';
  parsingTimeMs?: number;
  ghostscriptTimeMs?: number;
  avgRenderTimeMs?: number;
  avgTesseractTimeMs?: number;
  totalOcrTimeMs?: number;
  segmentationTimeMs?: number;
  answerBindingTimeMs?: number;
  dbStagingTimeMs?: number;
  totalJobTimeMs?: number;
  peakMemoryMb?: number;
  tesseractVersion?: string;
  gsVersion?: string;
  popplerVersion?: string;
}

export interface OcrV2JobInput {
  jobId: string;
  userId?: string;
  mode: 'QUESTION_PDF_ONLY' | 'ANSWER_PDF_ONLY' | 'COMBINED_PDF' | 'SEPARATE_PDFS';
  exam: 'UPSC CSE' | 'BPSC';
  documentLanguage: 'EN' | 'HI' | 'BILINGUAL' | 'AUTO';
  totalExpectedQuestions: number;
  questionPdfPath?: string;
  answerPdfPath?: string;
  questionPdfBase64?: string;
  answerPdfBase64?: string;
  questionFileName: string;
  answerFileName?: string;
  questionTextRaw?: string;
  answerTextRaw?: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  examTag: string;
  pyqYear: number;
  destination: 'PRACTICE_BANK' | 'QUESTION_BANK' | 'RESOURCE_STUDIO' | 'COMMISSION_OFFICIAL';
  officialSourceUrl?: string;
  keepOriginalPdf: boolean;
}

export interface OcrV2ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  questionEn: string;
  questionHi?: string;
  options: Array<{ id: string; text: string }>;
  optionsEn: Array<{ id: string; text: string }>;
  optionsHi?: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  explanation?: string;
  explanationEn?: string;
  explanationHi?: string;
  hasOptionE: boolean;
  pageNumber: number;
  confidence: number;
  status: 'READY_TO_PUBLISH' | 'NEEDS_REVIEW' | 'FLAGGED';
  answerKeyStatus: 'ANSWER_BOUND' | 'ANSWER_PENDING' | 'MANUAL_VERIFIED';
  validationErrors: string[];
  questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING' | 'ASSERTION_REASON';
  statements?: string[];
  statementsHi?: string[];
  matchData?: {
    listI: string[];
    listII: string[];
  };
}

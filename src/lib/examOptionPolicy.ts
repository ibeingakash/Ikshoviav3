/**
 * Canonical Exam-Specific Option Policy & Sequence Completeness System
 * Single source of truth for BPSC (5 options A-E) and UPSC (4 options A-D)
 */

export type ExamCanonicalType = 'BPSC' | 'UPSC' | 'OTHER';

export type OptionStatus =
  | 'EXTRACTED'
  | 'MISSING'
  | 'ADMIN_ADDED'
  | 'ADMIN_CORRECTED'
  | 'UNEXPECTED'
  | 'VERIFIED';

export interface NormalizedOptionItem {
  id: string; // 'A', 'B', 'C', 'D', 'E', etc.
  text: string;
  status: OptionStatus;
  originalOcrText?: string;
  correctedBy?: string;
  correctedAt?: string;
}

export interface CanonicalMissingReport {
  expectedCount: number;
  canonicalCount: number;
  detectedCount: number;
  missingCount: number;
  missingNumbers: number[];
  duplicateNumbers: number[];
  unexpectedNumbers: number[];
  isComplete: boolean;
}

export interface PaperCompletenessCheck {
  canPublish: boolean;
  totalExpected: number;
  expectedCount?: number;
  totalDetected: number;
  detectedCount?: number;
  ocrDetectedCount?: number;
  adminAddedCount?: number;
  totalAccountedCount?: number;
  missingCount: number;
  missingNumbers: number[];
  duplicateNumbers: number[];
  unexpectedNumbers?: number[];
  questionNumbers?: number[];
  questionsWithMissingOptions: Array<{ questionNum: number; missingLabels: string[] }>;
  questionsWithUnexpectedOptions: Array<{ questionNum: number; unexpectedLabels: string[] }>;
  questionsWithPendingAnswers: number[];
  questionsNeedingReview: number[];
  questionsWithFigures?: number;
  figureReviewPendingCount?: number;
  optionPolicy?: string;
  completenessPercentage: number;
  summaryRemarks: string[];
  blockReasons: string[];
  optionViolations?: Array<{ questionNumber: number; reason: string; expectedPolicy: string }>;
  answersBoundCount?: number;
}

/**
 * Determine if exam is BPSC
 */
export function isBpscExam(examStr?: string): boolean {
  if (!examStr) return false;
  const upper = examStr.toUpperCase();
  return upper.includes('BPSC') || upper.includes('BIHAR');
}

/**
 * Determine if exam is UPSC
 */
export function isUpscExam(examStr?: string): boolean {
  if (!examStr) return false;
  const upper = examStr.toUpperCase();
  return upper.includes('UPSC') || upper.includes('CIVIL SERVICES') || upper.includes('CSE');
}

/**
 * Get canonical option count for exam
 * BPSC = 5 (A, B, C, D, E)
 * UPSC = 4 (A, B, C, D)
 */
export function getExpectedOptionCount(examStr?: string): number {
  if (isBpscExam(examStr)) return 5;
  return 4; // UPSC & standard MCQs
}

export interface ExamOptionPolicy {
  expectedCount: number;
  allowedOptionIds: string[];
  strictCommissionPolicy: boolean;
  commissionName: string;
}

/**
 * Get full option policy specification for exam
 */
export function getExpectedOptionsForExam(examStr?: string): ExamOptionPolicy {
  const isBpsc = isBpscExam(examStr);
  if (isBpsc) {
    return {
      expectedCount: 5,
      allowedOptionIds: ['A', 'B', 'C', 'D', 'E'],
      strictCommissionPolicy: true,
      commissionName: 'Bihar Public Service Commission (BPSC)',
    };
  }
  return {
    expectedCount: 4,
    allowedOptionIds: ['A', 'B', 'C', 'D'],
    strictCommissionPolicy: true,
    commissionName: 'Union Public Service Commission (UPSC)',
  };
}

/**
 * Validate question options against exam policy
 */
export function validateQuestionOptionsForExam(question: any, examStr?: string) {
  const isBpsc = isBpscExam(examStr);
  const normalized = normalizeOptionsForExam(examStr || '', question?.options || []);
  const missingOptions = normalized.filter(o => o.status === 'MISSING' || !o.text.trim()).map(o => o.id);
  const unexpectedOptions = normalized.filter(o => o.status === 'UNEXPECTED').map(o => o.id);
  const hasMissingOptions = missingOptions.length > 0;
  const hasUnexpectedOptions = unexpectedOptions.length > 0;
  const isValid = !hasMissingOptions && !hasUnexpectedOptions;

  return {
    isValid,
    hasMissingOptions,
    hasUnexpectedOptions,
    missingOptions,
    unexpectedOptions,
    normalized,
    policyName: isBpsc ? 'BPSC 5-option policy (A-E)' : 'UPSC 4-option policy (A-D)',
  };
}

/**
 * Get canonical option labels list for exam
 */
export function getCanonicalOptionLabels(examStr?: string): string[] {
  if (isBpscExam(examStr)) {
    return ['A', 'B', 'C', 'D', 'E'];
  }
  return ['A', 'B', 'C', 'D'];
}

/**
 * Get standard expected question count for an exam and paper
 */
export function getCanonicalExpectedQuestions(examStr?: string, paperTitle?: string): number {
  if (isBpscExam(examStr)) {
    return 150; // Canonical BPSC CCE Prelims has 150 questions
  }
  if (isUpscExam(examStr)) {
    if (paperTitle && (paperTitle.toUpperCase().includes('CSAT') || paperTitle.toUpperCase().includes('PAPER-II') || paperTitle.toUpperCase().includes('PAPER 2'))) {
      return 80;
    }
    return 100; // UPSC Prelims GS Paper I has 100 questions
  }
  return 100;
}

/**
 * Calculate missing canonical question numbers from a set of detected numbers
 * Strictly checks 1..expectedCount without assuming array index continuity.
 */
export function calculateCanonicalMissingQuestions(
  expectedCount: number,
  detectedQuestionNumbers: number[]
): CanonicalMissingReport {
  const safeExpected = Math.max(1, expectedCount || 100);
  const detectedSet = new Set<number>();
  const duplicatesSet = new Set<number>();
  const unexpectedNumbers: number[] = [];

  for (const n of detectedQuestionNumbers) {
    if (typeof n !== 'number' || isNaN(n) || n <= 0) continue;

    if (n > safeExpected) {
      unexpectedNumbers.push(n);
    }

    if (detectedSet.has(n)) {
      duplicatesSet.add(n);
    } else {
      detectedSet.add(n);
    }
  }

  const missingNumbers: number[] = [];
  for (let i = 1; i <= safeExpected; i++) {
    if (!detectedSet.has(i)) {
      missingNumbers.push(i);
    }
  }

  const duplicateNumbers = Array.from(duplicatesSet).sort((a, b) => a - b);
  const sortedUnexpected = unexpectedNumbers.sort((a, b) => a - b);
  const detectedCount = detectedSet.size;
  const missingCount = missingNumbers.length;
  const isComplete = missingCount === 0 && duplicateNumbers.length === 0;

  return {
    expectedCount: safeExpected,
    canonicalCount: safeExpected,
    detectedCount,
    missingCount,
    missingNumbers,
    duplicateNumbers,
    unexpectedNumbers: sortedUnexpected,
    isComplete,
  };
}

/**
 * Normalize and enforce exam-specific option slots.
 * For BPSC: MUST ALWAYS HAVE SLOTS A, B, C, D, E.
 * If OCR extracted only C, D, E: A and B are returned with status = 'MISSING'.
 * For UPSC: Expected slots A, B, C, D. If E is extracted, status = 'UNEXPECTED'.
 */
export function normalizeOptionsForExam(
  examStr: string,
  rawOptions: any[] = []
): NormalizedOptionItem[] {
  const isBpsc = isBpscExam(examStr);
  const canonicalLabels = isBpsc ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

  // Map existing options by uppercase letter id
  const existingMap = new Map<string, any>();
  const unmappedOptions: any[] = [];

  for (let idx = 0; idx < rawOptions.length; idx++) {
    const raw = rawOptions[idx];
    let letter = '';
    let text = '';
    let status: OptionStatus = 'EXTRACTED';
    let originalOcrText = '';
    let correctedBy: string | undefined;
    let correctedAt: string | undefined;

    if (typeof raw === 'string') {
      letter = String.fromCharCode(65 + idx);
      text = raw;
      originalOcrText = raw;
    } else if (raw && typeof raw === 'object') {
      letter = (raw.id || String.fromCharCode(65 + idx)).trim().toUpperCase();
      text = raw.text || raw.optionText || '';
      status = (raw.status as OptionStatus) || 'EXTRACTED';
      originalOcrText = raw.originalOcrText || text;
      correctedBy = raw.correctedBy;
      correctedAt = raw.correctedAt;
    }

    if (['A', 'B', 'C', 'D', 'E'].includes(letter)) {
      existingMap.set(letter, {
        id: letter,
        text,
        status,
        originalOcrText,
        correctedBy,
        correctedAt,
      });
    } else {
      unmappedOptions.push(raw);
    }
  }

  const result: NormalizedOptionItem[] = [];

  // Build canonical slots
  for (const label of canonicalLabels) {
    if (existingMap.has(label)) {
      const item = existingMap.get(label)!;
      result.push({
        id: label,
        text: item.text,
        status: item.text.trim().length === 0 ? 'MISSING' : item.status,
        originalOcrText: item.originalOcrText,
        correctedBy: item.correctedBy,
        correctedAt: item.correctedAt,
      });
    } else {
      // Slot was not extracted by OCR
      result.push({
        id: label,
        text: '',
        status: 'MISSING',
        originalOcrText: '',
      });
    }
  }

  // If exam is UPSC and Option E exists in extraction, retain it with UNEXPECTED flag
  if (!isBpsc && existingMap.has('E')) {
    const optE = existingMap.get('E')!;
    result.push({
      id: 'E',
      text: optE.text,
      status: 'UNEXPECTED',
      originalOcrText: optE.originalOcrText,
    });
  }

  return result;
}

/**
 * Validate complete paper before publication.
 * Ensures:
 * - Expected question count is matched
 * - No missing canonical numbers
 * - No duplicate question numbers
 * - All options are present and non-empty
 * - UPSC has no Option E
 * - All answers are bound
 */
export function validatePaperCompleteness(
  firstArg: any,
  secondArg: any,
  thirdArg?: number
): PaperCompletenessCheck {
  let examStr = 'UPSC CSE';
  let questions: any[] = [];
  let expectedCount = 100;

  if (Array.isArray(firstArg)) {
    questions = firstArg;
    examStr = typeof secondArg === 'string' ? secondArg : 'UPSC CSE';
    expectedCount = typeof thirdArg === 'number' ? thirdArg : getCanonicalExpectedQuestions(examStr);
  } else {
    examStr = typeof firstArg === 'string' ? firstArg : 'UPSC CSE';
    questions = Array.isArray(secondArg) ? secondArg : [];
    expectedCount = typeof thirdArg === 'number' ? thirdArg : getCanonicalExpectedQuestions(examStr);
  }

  const isBpsc = isBpscExam(examStr);
  const detectedNums = questions
    .map((q, idx) => (typeof q.questionNum === 'number' ? q.questionNum : (q.questionNumber || idx + 1)))
    .filter(Boolean);

  const missingReport = calculateCanonicalMissingQuestions(expectedCount, detectedNums);

  const questionsWithMissingOptions: Array<{ questionNum: number; missingLabels: string[] }> = [];
  const questionsWithUnexpectedOptions: Array<{ questionNum: number; unexpectedLabels: string[] }> = [];
  const questionsWithPendingAnswers: number[] = [];
  const questionsNeedingReview: number[] = [];
  let questionsWithFigures = 0;
  let figureReviewPendingCount = 0;
  let ocrDetectedCount = 0;
  let adminAddedCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as any;
    const qNum = q.questionNum || q.questionNumber || i + 1;

    if (q.source === 'ADMIN_ADDED') {
      adminAddedCount++;
    } else {
      ocrDetectedCount++;
    }

    if (q.hasVisualContent || q.imageUrl) {
      questionsWithFigures++;
    }
    if (q.figureStatus === 'FIGURE_REVIEW_REQUIRED') {
      figureReviewPendingCount++;
    }

    const normalized = normalizeOptionsForExam(examStr, q.options || []);

    const missingOpts = normalized.filter(o => o.status === 'MISSING' || !o.text.trim()).map(o => o.id);
    if (missingOpts.length > 0) {
      questionsWithMissingOptions.push({ questionNum: qNum, missingLabels: missingOpts });
    }

    const unexpectedOpts = normalized.filter(o => o.status === 'UNEXPECTED').map(o => o.id);
    if (unexpectedOpts.length > 0) {
      questionsWithUnexpectedOptions.push({ questionNum: qNum, unexpectedLabels: unexpectedOpts });
    }

    const hasAnswer = q.correctAnswer && String(q.correctAnswer).trim().length > 0;
    if (!hasAnswer || q.answerKeyStatus === 'ANSWER_PENDING') {
      questionsWithPendingAnswers.push(qNum);
    }

    if (q.status === 'NEEDS_REVIEW' || q.status === 'FLAGGED' || (q.validationErrors && q.validationErrors.length > 0)) {
      questionsNeedingReview.push(qNum);
    }
  }

  const summaryRemarks: string[] = [];

  if (missingReport.missingCount > 0) {
    summaryRemarks.push(`Missing ${missingReport.missingCount} questions from canonical 1..${expectedCount} sequence: #${missingReport.missingNumbers.join(', #')}`);
  }

  if (missingReport.duplicateNumbers.length > 0) {
    summaryRemarks.push(`Duplicate question numbers detected: #${missingReport.duplicateNumbers.join(', #')}`);
  }

  if (questionsWithMissingOptions.length > 0) {
    summaryRemarks.push(
      `${questionsWithMissingOptions.length} question(s) have missing options (${isBpsc ? 'BPSC requires all 5 options A-E' : 'UPSC requires 4 options A-D'}).`
    );
  }

  if (questionsWithUnexpectedOptions.length > 0) {
    summaryRemarks.push(
      `${questionsWithUnexpectedOptions.length} UPSC question(s) contain unexpected options (Option E strictly prohibited).`
    );
  }

  if (questionsWithPendingAnswers.length > 0) {
    summaryRemarks.push(`${questionsWithPendingAnswers.length} question(s) have pending answers.`);
  }

  if (figureReviewPendingCount > 0) {
    summaryRemarks.push(`${figureReviewPendingCount} visual question(s) require diagram/figure review.`);
  }

  const optionViolations: Array<{ questionNumber: number; reason: string; expectedPolicy: string }> = [];
  for (const m of questionsWithMissingOptions) {
    optionViolations.push({
      questionNumber: m.questionNum,
      reason: `Missing option(s): ${m.missingLabels.join(', ')}`,
      expectedPolicy: isBpsc ? 'BPSC 5-option policy (A-E required)' : 'UPSC 4-option policy (A-D required)',
    });
  }
  for (const u of questionsWithUnexpectedOptions) {
    optionViolations.push({
      questionNumber: u.questionNum,
      reason: `Unexpected option(s): ${u.unexpectedLabels.join(', ')}`,
      expectedPolicy: 'UPSC CSE 4-option policy (Options A-D only, no Option E)',
    });
  }

  const answersBoundCount = questions.length - questionsWithPendingAnswers.length;

  const canPublish =
    missingReport.isComplete &&
    questionsWithMissingOptions.length === 0 &&
    questionsWithUnexpectedOptions.length === 0 &&
    questionsWithPendingAnswers.length === 0 &&
    figureReviewPendingCount === 0;

  const totalPoints =
    expectedCount * 3; // 1 for presence, 1 for options, 1 for answer
  const earnedPoints =
    (expectedCount - missingReport.missingCount) +
    (questions.length - questionsWithMissingOptions.length) +
    (questions.length - questionsWithPendingAnswers.length);

  const completenessPercentage = Math.max(0, Math.min(100, Math.round((earnedPoints / (totalPoints || 1)) * 100)));

  return {
    canPublish,
    totalExpected: expectedCount,
    expectedCount,
    totalDetected: questions.length,
    detectedCount: questions.length,
    ocrDetectedCount,
    adminAddedCount,
    totalAccountedCount: questions.length,
    missingCount: missingReport.missingCount,
    missingNumbers: missingReport.missingNumbers,
    duplicateNumbers: missingReport.duplicateNumbers,
    unexpectedNumbers: missingReport.unexpectedNumbers || [],
    questionNumbers: Array.from(new Set(detectedNums)).sort((a, b) => a - b),
    questionsWithMissingOptions,
    questionsWithUnexpectedOptions,
    questionsWithPendingAnswers,
    questionsNeedingReview,
    questionsWithFigures,
    figureReviewPendingCount,
    optionPolicy: isBpsc ? 'BPSC 5-option policy (A-E required)' : 'UPSC 4-option policy (A-D required)',
    completenessPercentage,
    summaryRemarks,
    blockReasons: summaryRemarks,
    optionViolations,
    answersBoundCount,
  };
}

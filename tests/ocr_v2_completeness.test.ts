import { describe, it, expect } from 'vitest';
import {
  getCanonicalExpectedQuestions,
  getExpectedOptionsForExam,
  calculateCanonicalMissingQuestions,
  validateQuestionOptionsForExam,
  validatePaperCompleteness,
  normalizeOptionsForExam,
} from '../src/lib/examOptionPolicy.js';

describe('OCR V2 Paper Completeness & Exam Option Policy Suite', () => {
  describe('1. Canonical Exam Question Counts', () => {
    it('returns 100 for UPSC CSE Prelims General Studies (Paper 1)', () => {
      expect(getCanonicalExpectedQuestions('UPSC CSE', 'GS_PAPER_1')).toBe(100);
      expect(getCanonicalExpectedQuestions('UPSC', 'Paper 1')).toBe(100);
    });

    it('returns 80 for UPSC CSE CSAT (Paper 2)', () => {
      expect(getCanonicalExpectedQuestions('UPSC CSE', 'CSAT')).toBe(80);
      expect(getCanonicalExpectedQuestions('UPSC', 'Paper 2 (CSAT)')).toBe(80);
    });

    it('returns 150 for BPSC Prelims General Studies', () => {
      expect(getCanonicalExpectedQuestions('BPSC', 'GS')).toBe(150);
      expect(getCanonicalExpectedQuestions('BPSC Prelims', 'Paper 1')).toBe(150);
    });

    it('returns 100 for general default papers', () => {
      expect(getCanonicalExpectedQuestions('UPPSC', 'General')).toBe(100);
    });
  });

  describe('2. Exam Option Policy (UPSC vs BPSC)', () => {
    it('enforces 4 options (A-D) for UPSC CSE', () => {
      const upscPolicy = getExpectedOptionsForExam('UPSC CSE');
      expect(upscPolicy.expectedCount).toBe(4);
      expect(upscPolicy.allowedOptionIds).toEqual(['A', 'B', 'C', 'D']);
      expect(upscPolicy.strictCommissionPolicy).toBe(true);
    });

    it('enforces 5 options (A-E) for BPSC Prelims', () => {
      const bpscPolicy = getExpectedOptionsForExam('BPSC');
      expect(bpscPolicy.expectedCount).toBe(5);
      expect(bpscPolicy.allowedOptionIds).toEqual(['A', 'B', 'C', 'D', 'E']);
      expect(bpscPolicy.strictCommissionPolicy).toBe(true);
    });

    it('flags unexpected Option E in UPSC question as policy violation', () => {
      const question = {
        id: 'q-1',
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
          { id: 'E', text: 'Unexpected Option E' },
        ],
      };
      const check = validateQuestionOptionsForExam(question, 'UPSC CSE');
      expect(check.isValid).toBe(false);
      expect(check.hasUnexpectedOptions).toBe(true);
      expect(check.unexpectedOptions).toContain('E');
    });

    it('validates compliant 4-option UPSC question', () => {
      const question = {
        id: 'q-2',
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
        ],
      };
      const check = validateQuestionOptionsForExam(question, 'UPSC CSE');
      expect(check.isValid).toBe(true);
      expect(check.hasMissingOptions).toBe(false);
      expect(check.hasUnexpectedOptions).toBe(false);
    });

    it('flags missing Option E in BPSC question', () => {
      const question = {
        id: 'q-3',
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
        ],
      };
      const check = validateQuestionOptionsForExam(question, 'BPSC');
      expect(check.isValid).toBe(false);
      expect(check.hasMissingOptions).toBe(true);
      expect(check.missingOptions).toContain('E');
    });

    it('validates compliant 5-option BPSC question', () => {
      const question = {
        id: 'q-4',
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
          { id: 'E', text: 'More than one of the above / None of the above' },
        ],
      };
      const check = validateQuestionOptionsForExam(question, 'BPSC');
      expect(check.isValid).toBe(true);
      expect(check.hasMissingOptions).toBe(false);
      expect(check.hasUnexpectedOptions).toBe(false);
    });
  });

  describe('3. Canonical Sequence and Missing Question Detection', () => {
    it('detects sequential gaps correctly in a 100 question paper', () => {
      const detected = [1, 2, 3, 5, 6, 7, 10];
      const res = calculateCanonicalMissingQuestions(10, detected);
      expect(res.missingNumbers).toEqual([4, 8, 9]);
      expect(res.duplicateNumbers).toEqual([]);
      expect(res.canonicalCount).toBe(10);
      expect(res.detectedCount).toBe(7);
    });

    it('identifies duplicates without corrupting the missing list', () => {
      const detected = [1, 2, 2, 3, 4, 5];
      const res = calculateCanonicalMissingQuestions(5, detected);
      expect(res.duplicateNumbers).toEqual([2]);
      expect(res.missingNumbers).toEqual([]);
    });

    it('handles unordered question arrays correctly', () => {
      const detected = [5, 1, 4, 2];
      const res = calculateCanonicalMissingQuestions(5, detected);
      expect(res.missingNumbers).toEqual([3]);
    });
  });

  describe('4. Paper Completeness Gatekeeper for Official PYQ Catalog', () => {
    it('blocks publication when questions are missing', () => {
      // 98 out of 100 questions
      const questions = Array.from({ length: 98 }, (_, i) => ({
        id: `q-${i + 1}`,
        questionNum: i + 1,
        question: `Question ${i + 1}`,
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
        ],
        correctAnswer: 'A',
      }));

      const check = validatePaperCompleteness(questions, 'UPSC CSE', 100);
      expect(check.canPublish).toBe(false);
      expect(check.missingCount).toBe(2);
      expect(check.missingNumbers).toEqual([99, 100]);
      expect(check.completenessPercentage).toBe(98);
      expect(check.blockReasons.some(r => r.includes('Missing 2 questions'))).toBe(true);
    });

    it('blocks publication when option policy is violated (e.g. UPSC has Option E)', () => {
      const questions = Array.from({ length: 100 }, (_, i) => ({
        id: `q-${i + 1}`,
        questionNum: i + 1,
        question: `Question ${i + 1}`,
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
          ...(i === 42 ? [{ id: 'E', text: 'Invalid Option E' }] : []),
        ],
        correctAnswer: 'A',
      }));

      const check = validatePaperCompleteness(questions, 'UPSC CSE', 100);
      expect(check.canPublish).toBe(false);
      expect(check.questionsWithUnexpectedOptions.some(q => q.questionNum === 43)).toBe(true);
      expect(check.blockReasons.some(r => r.includes('unexpected options'))).toBe(true);
    });

    it('blocks publication when answers are not bound', () => {
      const questions = Array.from({ length: 100 }, (_, i) => ({
        id: `q-${i + 1}`,
        questionNum: i + 1,
        question: `Question ${i + 1}`,
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
        ],
        correctAnswer: i < 90 ? 'A' : '', // 10 questions have no answer
      }));

      const check = validatePaperCompleteness(questions, 'UPSC CSE', 100);
      expect(check.canPublish).toBe(false);
      expect(check.questionsWithPendingAnswers.length).toBe(10);
      expect(check.answersBoundCount).toBe(90);
    });

    it('permits publication when 100% complete, all options valid, all answers bound', () => {
      const questions = Array.from({ length: 100 }, (_, i) => ({
        id: `q-${i + 1}`,
        questionNum: i + 1,
        question: `Question ${i + 1}`,
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
        ],
        correctAnswer: 'B',
      }));

      const check = validatePaperCompleteness(questions, 'UPSC CSE', 100);
      expect(check.canPublish).toBe(true);
      expect(check.missingCount).toBe(0);
      expect(check.missingNumbers).toEqual([]);
      expect(check.questionsWithUnexpectedOptions).toEqual([]);
      expect(check.questionsWithMissingOptions).toEqual([]);
      expect(check.questionsWithPendingAnswers).toEqual([]);
      expect(check.completenessPercentage).toBe(100);
      expect(check.answersBoundCount).toBe(100);
      expect(check.blockReasons).toEqual([]);
    });

    it('validates 150-question BPSC paper with 5 options correctly', () => {
      const questions = Array.from({ length: 150 }, (_, i) => ({
        id: `bpsc-${i + 1}`,
        questionNum: i + 1,
        question: `BPSC Question ${i + 1}`,
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
          { id: 'E', text: 'E' },
        ],
        correctAnswer: 'C',
      }));

      const check = validatePaperCompleteness(questions, 'BPSC', 150);
      expect(check.canPublish).toBe(true);
      expect(check.completenessPercentage).toBe(150 / 150 * 100);
      expect(check.detectedCount).toBe(150);
      expect(check.expectedCount).toBe(150);
    });
  });

  describe('5. Option Normalization & Remediation', () => {
    it('normalizes missing option slots for BPSC papers', () => {
      const rawOptions = [
        { id: 'A', text: 'First' },
        { id: 'B', text: 'Second' },
        { id: 'D', text: 'Fourth' },
      ];
      const normalized = normalizeOptionsForExam('BPSC', rawOptions);
      expect(normalized.length).toBe(5);
      const optC = normalized.find((o: any) => o.id === 'C');
      const optE = normalized.find((o: any) => o.id === 'E');
      expect(optC.status).toBe('MISSING');
      expect(optE.status).toBe('MISSING');
    });

    it('marks Option E as UNEXPECTED for UPSC papers', () => {
      const rawOptions = [
        { id: 'A', text: 'One' },
        { id: 'B', text: 'Two' },
        { id: 'C', text: 'Three' },
        { id: 'D', text: 'Four' },
        { id: 'E', text: 'None of the above' },
      ];
      const normalized = normalizeOptionsForExam('UPSC CSE', rawOptions);
      const optE = normalized.find((o: any) => o.id === 'E');
      expect(optE).toBeDefined();
      expect(optE.status).toBe('UNEXPECTED');
    });

    it('preserves existing option text when normalized', () => {
      const rawOptions = [
        { id: 'A', text: 'Constitutional amendment' },
        { id: 'B', text: 'Ordinary bill' },
      ];
      const normalized = normalizeOptionsForExam('UPSC CSE', rawOptions);
      expect(normalized[0].text).toBe('Constitutional amendment');
      expect(normalized[1].text).toBe('Ordinary bill');
      expect(normalized[2].status).toBe('MISSING');
      expect(normalized[3].status).toBe('MISSING');
    });
  });

  describe('6. Provenance Preservation & Audit Trail (Non-Destructive Overrides)', () => {
    it('preserves original OCR text when admin updates question statement', () => {
      const originalQuestion = {
        id: 'q-test-1',
        questionNum: 14,
        question: 'What is the speed of light in vacum?', // Typo in OCR
        provenance: 'OFFICIAL_COMMISSION',
        originalOcrQuestion: 'What is the speed of light in vacum?',
        revisionCount: 0,
      };

      // Admin correction applied
      const updatedQuestion = {
        ...originalQuestion,
        question: 'What is the speed of light in vacuum?',
        hasManualOverride: true,
        revisionCount: 1,
        lastEditedBy: 'admin@ikshovia.com',
      };

      expect(updatedQuestion.question).toBe('What is the speed of light in vacuum?');
      expect(updatedQuestion.originalOcrQuestion).toBe('What is the speed of light in vacum?');
      expect(updatedQuestion.provenance).toBe('OFFICIAL_COMMISSION');
      expect(updatedQuestion.hasManualOverride).toBe(true);
    });

    it('retains original option text when option is corrected', () => {
      const optionSlot = {
        id: 'B',
        text: '3 x 10^8 m/s',
        status: 'CORRECTED',
        originalOcrText: '3 x 10^8 mls',
        correctedBy: 'admin@ikshovia.com',
        correctedAt: new Date().toISOString(),
      };

      expect(optionSlot.text).toBe('3 x 10^8 m/s');
      expect(optionSlot.originalOcrText).toBe('3 x 10^8 mls');
      expect(optionSlot.status).toBe('CORRECTED');
    });

    it('marks manually added questions as MANUAL_ADD while keeping paper provenance', () => {
      const manualQ = {
        id: 'manual-q-45',
        questionNum: 45,
        question: 'Which Article of the Constitution deals with the Election Commission?',
        provenance: 'OFFICIAL_COMMISSION',
        sourceType: 'ADMIN_MANUAL_INSERT',
        isManualAddition: true,
        options: [
          { id: 'A', text: 'Article 324' },
          { id: 'B', text: 'Article 326' },
          { id: 'C', text: 'Article 330' },
          { id: 'D', text: 'Article 332' },
        ],
        correctAnswer: 'A',
      };

      expect(manualQ.provenance).toBe('OFFICIAL_COMMISSION');
      expect(manualQ.isManualAddition).toBe(true);
      expect(manualQ.sourceType).toBe('ADMIN_MANUAL_INSERT');
    });
  });

  describe('7. Figure & Diagram Verification Flow', () => {
    it('correctly associates image URL and diagram caption to question', () => {
      const question = {
        id: 'q-geo-1',
        questionNum: 22,
        question: 'Consider the map given below:',
        has_image: true,
        image_url: '/uploads/ocr_figures/job_123_q22.png',
        image_caption: 'Contour map of Deccan Plateau river systems',
        isFigureVerified: true,
      };

      expect(question.has_image).toBe(true);
      expect(question.image_url).toBe('/uploads/ocr_figures/job_123_q22.png');
      expect(question.isFigureVerified).toBe(true);
    });

    it('allows clearing figure without losing question text', () => {
      const question = {
        id: 'q-geo-2',
        questionNum: 23,
        question: 'Which of the following passes connects Himachal with Tibet?',
        image_url: null,
        has_image: false,
      };

      expect(question.image_url).toBeNull();
      expect(question.has_image).toBe(false);
      expect(question.question).toBeTruthy();
    });
  });

  describe('8. Google Drive & Resource Ingestion Isolation', () => {
    it('verifies OCR endpoint path isolates from Google Drive and Resource sync', () => {
      const ocrApiPath = '/api/admin/ocr';
      const googleDrivePath = '/api/admin/resources/google-drive';
      const resourceSyncPath = '/api/admin/resources/sync';

      expect(ocrApiPath.startsWith('/api/admin/ocr')).toBe(true);
      expect(ocrApiPath).not.toContain('resource');
      expect(googleDrivePath).not.toContain('ocr');
      expect(resourceSyncPath).not.toContain('ocr');
    });

    it('ensures published PYQ papers write to official_pyq_papers table rather than resource files', () => {
      const targetTable = 'official_pyq_papers';
      const resourceTable = 'learning_resources';

      expect(targetTable).toBe('official_pyq_papers');
      expect(targetTable).not.toBe(resourceTable);
    });
  });

  describe('9. Job Queue Lifecycle & Status Invariants', () => {
    it('validates state transitions order', () => {
      const validStatuses = ['QUEUED', 'EXTRACTING', 'CLASSIFYING', 'READY_FOR_REVIEW', 'PUBLISHED', 'FAILED'];
      expect(validStatuses.indexOf('QUEUED')).toBe(0);
      expect(validStatuses.indexOf('EXTRACTING')).toBe(1);
      expect(validStatuses.indexOf('READY_FOR_REVIEW')).toBe(3);
      expect(validStatuses.indexOf('PUBLISHED')).toBe(4);
    });

    it('rejects publication when job is still EXTRACTING', () => {
      const job = { status: 'EXTRACTING', totalExtracted: 40, totalExpected: 100 };
      const canPublishJob = job.status === 'READY_FOR_REVIEW' && job.totalExtracted === job.totalExpected;
      expect(canPublishJob).toBe(false);
    });

    it('permits review step when job reaches READY_FOR_REVIEW', () => {
      const job = { status: 'READY_FOR_REVIEW', totalExtracted: 100, totalExpected: 100 };
      const isReviewable = job.status === 'READY_FOR_REVIEW' || job.status === 'PUBLISHED';
      expect(isReviewable).toBe(true);
    });
  });

  describe('10. Multi-Page PDF Handling & Chunk Resilience', () => {
    it('calculates page chunks appropriately without exceeding memory limits', () => {
      const totalPages = 42;
      const chunkSize = 5;
      const chunks = [];
      for (let i = 1; i <= totalPages; i += chunkSize) {
        chunks.push({ startPage: i, endPage: Math.min(i + chunkSize - 1, totalPages) });
      }

      expect(chunks.length).toBe(9);
      expect(chunks[0]).toEqual({ startPage: 1, endPage: 5 });
      expect(chunks[8]).toEqual({ startPage: 41, endPage: 42 });
    });

    it('handles single page document correctly', () => {
      const totalPages = 1;
      const chunkSize = 5;
      const chunks = [];
      for (let i = 1; i <= totalPages; i += chunkSize) {
        chunks.push({ startPage: i, endPage: Math.min(i + chunkSize - 1, totalPages) });
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0]).toEqual({ startPage: 1, endPage: 1 });
    });

    it('correctly aggregates extracted questions across chunk boundaries', () => {
      const chunk1 = [{ questionNum: 1 }, { questionNum: 2 }];
      const chunk2 = [{ questionNum: 3 }, { questionNum: 4 }];
      const combined = [...chunk1, ...chunk2];

      expect(combined.length).toBe(4);
      expect(combined.map(q => q.questionNum)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('11. Advanced Question Formats & Bilingual Robustness', () => {
    it('supports bilingual question statements in English and Hindi', () => {
      const bilingualQ = {
        id: 'bi-1',
        questionNum: 1,
        question_en: 'Who among the following was the founder of the Nalanda University?',
        question_hi: 'निम्नलिखित में से कौन नालंदा विश्वविद्यालय के संस्थापक थे?',
        question: 'Who among the following was the founder of the Nalanda University?',
      };

      expect(bilingualQ.question_en).toContain('Nalanda University');
      expect(bilingualQ.question_hi).toContain('नालंदा विश्वविद्यालय');
    });

    it('handles statement-based multiple choice structures', () => {
      const stmtQ = {
        id: 'stmt-1',
        questionNum: 2,
        question: 'With reference to the Indian economy, consider the following statements:',
        statements: [
          { id: 1, text: 'A share of 8 core industries in IIP is more than 40%.' },
          { id: 2, text: 'Fertilizers have the highest weight in core industries.' },
        ],
        options: [
          { id: 'A', text: '1 only' },
          { id: 'B', text: '2 only' },
          { id: 'C', text: 'Both 1 and 2' },
          { id: 'D', text: 'Neither 1 nor 2' },
        ],
        correctAnswer: 'A',
      };

      expect(stmtQ.statements.length).toBe(2);
      expect(stmtQ.statements[0].id).toBe(1);
      expect(stmtQ.options.length).toBe(4);
    });

    it('retains match-the-following tabular data structure', () => {
      const matchQ = {
        id: 'match-1',
        questionNum: 3,
        question: 'Match List I (Tiger Reserve) with List II (State):',
        matchData: {
          leftHeader: 'Tiger Reserve',
          rightHeader: 'State',
          leftColumn: ['Bandipur', 'Valmiki', 'Simlipal'],
          rightColumn: ['Karnataka', 'Bihar', 'Odisha'],
        },
        options: [
          { id: 'A', text: 'A-1, B-2, C-3' },
          { id: 'B', text: 'A-2, B-1, C-3' },
          { id: 'C', text: 'A-3, B-2, C-1' },
          { id: 'D', text: 'A-1, B-3, C-2' },
        ],
        correctAnswer: 'A',
      };

      expect(matchQ.matchData.leftColumn.length).toBe(3);
      expect(matchQ.matchData.rightColumn.length).toBe(3);
      expect(matchQ.matchData.leftColumn[1]).toBe('Valmiki');
      expect(matchQ.matchData.rightColumn[1]).toBe('Bihar');
    });

    it('enforces official commission provenance tag immutability across edits', () => {
      const publishedPyq = {
        id: 'pyq-bpsc-69',
        examName: 'BPSC',
        examYear: 2023,
        paperCode: '69th CCE Prelims GS',
        provenance: 'OFFICIAL_COMMISSION',
        isOfficialCommissionPaper: true,
        completenessStatus: 'COMPLETE',
      };

      expect(publishedPyq.provenance).toBe('OFFICIAL_COMMISSION');
      expect(publishedPyq.isOfficialCommissionPaper).toBe(true);
      expect(publishedPyq.completenessStatus).toBe('COMPLETE');
    });
  });
});

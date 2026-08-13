import pool from '../db/pool.js';
import { OCRJob, Question, FieldConfidence } from '../../src/types/index.js';
import { questionRepository } from './QuestionRepository.js';

export interface OcrJobRecord {
  id: string;
  userId?: string;
  originalFileName: string;
  storageKey?: string;
  fileSizeBytes: number;
  pageCount: number;
  strategy: string;
  exam: string;
  expectedQuestionCount: number;
  status: string; // 'UPLOADED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PARTIALLY_APPROVED' | 'COMPLETED' | 'FAILED'
  processedPages: number;
  detectedQuestionsCount: number;
  approvedCount: number;
  rejectedCount: number;
  confidenceScore: number;
  missingQuestionNumbers: number[];
  duplicateQuestionNumbers: number[];
  reviewState: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedQuestionRecord extends Question {
  jobId: string;
  duplicateWarning?: {
    isDuplicate: boolean;
    existingQuestionId?: string;
    existingText?: string;
    similarityScore?: number;
    source?: 'INTERNAL' | 'QUESTION_BANK';
  } | null;
}

export class OcrRepository {
  async initSchema(): Promise<void> {
    await pool.query(`
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam TEXT DEFAULT 'UPSC CSE';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS expected_question_count INT DEFAULT 100;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS rejected_count INT DEFAULT 0;

      CREATE TABLE IF NOT EXISTS public.ocr_extracted_questions (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL REFERENCES public.ocr_jobs(id) ON DELETE CASCADE,
        question_num INT,
        page_number INT DEFAULT 1,
        question_text TEXT NOT NULL,
        question_en TEXT,
        question_hi TEXT,
        options JSONB NOT NULL DEFAULT '[]'::jsonb,
        options_en JSONB DEFAULT '[]'::jsonb,
        options_hi JSONB DEFAULT '[]'::jsonb,
        correct_answer TEXT,
        explanation TEXT,
        explanation_en TEXT,
        explanation_hi TEXT,
        available_languages JSONB DEFAULT '["en"]'::jsonb,
        subject_id TEXT,
        topic_id TEXT,
        concept_id TEXT,
        difficulty TEXT DEFAULT 'MEDIUM',
        exam_tag TEXT,
        pyq_year INT,
        source TEXT DEFAULT 'OCR_IMPORTED',
        is_pyq BOOLEAN DEFAULT false,
        has_visual_content BOOLEAN DEFAULT false,
        field_confidence JSONB DEFAULT '{}'::jsonb,
        ocr_confidence FLOAT DEFAULT 0.0,
        status TEXT DEFAULT 'NEEDS_REVIEW',
        destination TEXT DEFAULT 'PRACTICE_BANK',
        validation_errors JSONB DEFAULT '[]'::jsonb,
        duplicate_warning JSONB DEFAULT 'null'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ocr_extracted_questions_job_id ON public.ocr_extracted_questions(job_id);
    `);
  }

  // --- JOB METHODS ---

  async createJob(job: Partial<OcrJobRecord> & { id: string; originalFileName: string }): Promise<OcrJobRecord> {
    const query = `
      INSERT INTO public.ocr_jobs (
        id, user_id, original_file_name, storage_key, file_size_bytes,
        page_count, strategy, exam, expected_question_count, status,
        processed_pages, detected_questions_count, approved_count, rejected_count,
        confidence_score, missing_question_numbers, duplicate_question_numbers,
        review_state, error_message, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        original_file_name = EXCLUDED.original_file_name,
        storage_key = EXCLUDED.storage_key,
        file_size_bytes = EXCLUDED.file_size_bytes,
        page_count = EXCLUDED.page_count,
        strategy = EXCLUDED.strategy,
        exam = EXCLUDED.exam,
        expected_question_count = EXCLUDED.expected_question_count,
        status = EXCLUDED.status,
        processed_pages = EXCLUDED.processed_pages,
        detected_questions_count = EXCLUDED.detected_questions_count,
        approved_count = EXCLUDED.approved_count,
        rejected_count = EXCLUDED.rejected_count,
        confidence_score = EXCLUDED.confidence_score,
        missing_question_numbers = EXCLUDED.missing_question_numbers,
        duplicate_question_numbers = EXCLUDED.duplicate_question_numbers,
        review_state = EXCLUDED.review_state,
        error_message = EXCLUDED.error_message,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      job.id,
      job.userId || null,
      job.originalFileName,
      job.storageKey || null,
      job.fileSizeBytes || 0,
      job.pageCount || 1,
      job.strategy || 'VISION_OCR',
      job.exam || 'UPSC CSE',
      job.expectedQuestionCount || (job.exam === 'BPSC' ? 150 : 100),
      job.status || 'PROCESSING',
      job.processedPages || 0,
      job.detectedQuestionsCount || 0,
      job.approvedCount || 0,
      job.rejectedCount || 0,
      job.confidenceScore || 0,
      JSON.stringify(job.missingQuestionNumbers || []),
      JSON.stringify(job.duplicateQuestionNumbers || []),
      JSON.stringify(job.reviewState || {}),
      job.errorMessage || null,
    ];

    const res = await pool.query(query, values);
    return this.mapRowToJob(res.rows[0]);
  }

  async getJobById(id: string): Promise<OcrJobRecord | null> {
    const res = await pool.query('SELECT * FROM public.ocr_jobs WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToJob(res.rows[0]);
  }

  async listJobs(userId?: string, limit = 50, offset = 0): Promise<OcrJobRecord[]> {
    let query = 'SELECT * FROM public.ocr_jobs';
    let params: any[] = [];

    if (userId) {
      query += ' WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params = [userId, limit, offset];
    } else {
      query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params = [limit, offset];
    }

    const res = await pool.query(query, params);
    return res.rows.map(r => this.mapRowToJob(r));
  }

  async countJobs(): Promise<number> {
    const res = await pool.query('SELECT COUNT(*) as total FROM public.ocr_jobs');
    return parseInt(res.rows[0]?.total || '0', 10);
  }

  async updateJob(id: string, updates: Partial<OcrJobRecord>): Promise<OcrJobRecord | null> {
    const job = await this.getJobById(id);
    if (!job) return null;

    const merged = { ...job, ...updates };
    return this.createJob(merged);
  }

  async deleteJob(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM public.ocr_jobs WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- EXTRACTED QUESTION METHODS ---

  async saveExtractedQuestions(jobId: string, questions: ExtractedQuestionRecord[]): Promise<ExtractedQuestionRecord[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const saved: ExtractedQuestionRecord[] = [];
      for (const q of questions) {
        const query = `
          INSERT INTO public.ocr_extracted_questions (
            id, job_id, question_num, page_number, question_text,
            question_en, question_hi, options, options_en, options_hi,
            correct_answer, explanation, explanation_en, explanation_hi,
            available_languages, subject_id, topic_id, concept_id,
            difficulty, exam_tag, pyq_year, source, is_pyq,
            has_visual_content, field_confidence, ocr_confidence, status,
            destination, validation_errors, duplicate_warning, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22, $23,
            $24, $25, $26, $27,
            $28, $29, $30, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            question_num = EXCLUDED.question_num,
            page_number = EXCLUDED.page_number,
            question_text = EXCLUDED.question_text,
            question_en = EXCLUDED.question_en,
            question_hi = EXCLUDED.question_hi,
            options = EXCLUDED.options,
            options_en = EXCLUDED.options_en,
            options_hi = EXCLUDED.options_hi,
            correct_answer = EXCLUDED.correct_answer,
            explanation = EXCLUDED.explanation,
            explanation_en = EXCLUDED.explanation_en,
            explanation_hi = EXCLUDED.explanation_hi,
            available_languages = EXCLUDED.available_languages,
            subject_id = EXCLUDED.subject_id,
            topic_id = EXCLUDED.topic_id,
            concept_id = EXCLUDED.concept_id,
            difficulty = EXCLUDED.difficulty,
            exam_tag = EXCLUDED.exam_tag,
            pyq_year = EXCLUDED.pyq_year,
            source = EXCLUDED.source,
            is_pyq = EXCLUDED.is_pyq,
            has_visual_content = EXCLUDED.has_visual_content,
            field_confidence = EXCLUDED.field_confidence,
            ocr_confidence = EXCLUDED.ocr_confidence,
            status = EXCLUDED.status,
            destination = EXCLUDED.destination,
            validation_errors = EXCLUDED.validation_errors,
            duplicate_warning = EXCLUDED.duplicate_warning,
            updated_at = NOW()
          RETURNING *
        `;

        const values = [
          q.id,
          jobId,
          q.questionNum || q.questionNumber || null,
          q.pageNumber || 1,
          q.question,
          q.question_en || null,
          q.question_hi || null,
          JSON.stringify(q.options || []),
          JSON.stringify(q.options_en || []),
          JSON.stringify(q.options_hi || []),
          q.correctAnswer || '',
          q.explanation || '',
          q.explanation_en || null,
          q.explanation_hi || null,
          JSON.stringify(q.availableLanguages || ['en']),
          q.subjectId || 'sub_polity',
          q.topicId || 'top_rights',
          q.conceptId || 'c_art32',
          q.difficulty || 'MEDIUM',
          q.examTag || null,
          q.pyqYear || null,
          q.source || 'OCR_IMPORTED',
          q.isPyq || false,
          q.hasVisualContent || false,
          JSON.stringify(q.fieldConfidence || {}),
          q.ocrConfidence || 0.0,
          q.status || 'NEEDS_REVIEW',
          q.destination || 'PRACTICE_BANK',
          JSON.stringify(q.validationErrors || []),
          JSON.stringify(q.duplicateWarning || null),
        ];

        const res = await client.query(query, values);
        saved.push(this.mapRowToExtractedQuestion(res.rows[0]));
      }

      await client.query('COMMIT');
      return saved;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getQuestionsByJobId(jobId: string): Promise<ExtractedQuestionRecord[]> {
    const res = await pool.query(
      'SELECT * FROM public.ocr_extracted_questions WHERE job_id = $1 ORDER BY question_num ASC NULLS LAST, created_at ASC',
      [jobId]
    );
    return res.rows.map(r => this.mapRowToExtractedQuestion(r));
  }

  async getExtractedQuestionById(id: string): Promise<ExtractedQuestionRecord | null> {
    const res = await pool.query('SELECT * FROM public.ocr_extracted_questions WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToExtractedQuestion(res.rows[0]);
  }

  async updateExtractedQuestion(id: string, updates: Partial<ExtractedQuestionRecord>): Promise<ExtractedQuestionRecord | null> {
    const existing = await this.getExtractedQuestionById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const saved = await this.saveExtractedQuestions(existing.jobId, [merged]);
    return saved[0] || null;
  }

  async approveAndPublishQuestion(
    questionId: string,
    targetMeta?: {
      subjectId?: string;
      topicId?: string;
      conceptId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      destination?: 'PRACTICE_BANK' | 'MOCK_TEST' | 'BOTH';
      examTag?: string;
      pyqYear?: number;
    }
  ): Promise<{ success: boolean; question?: Question; error?: string }> {
    const eq = await this.getExtractedQuestionById(questionId);
    if (!eq) return { success: false, error: 'Extracted question not found' };

    // Validate
    if (!eq.question || eq.question.trim().length < 5) {
      return { success: false, error: `Question ${eq.questionNum || ''}: Question text is missing or too short` };
    }
    if (!eq.options || eq.options.length < 2) {
      return { success: false, error: `Question ${eq.questionNum || ''}: Options set is incomplete (< 2 options)` };
    }
    if (eq.correctAnswer === undefined || eq.correctAnswer === null || eq.correctAnswer === '') {
      return { success: false, error: `Question ${eq.questionNum || ''}: Correct answer is required before publishing` };
    }

    // Merge meta
    const subjectId = targetMeta?.subjectId || eq.subjectId || 'sub_polity';
    const topicId = targetMeta?.topicId || eq.topicId || 'top_rights';
    const conceptId = targetMeta?.conceptId || eq.conceptId || 'c_art32';
    const difficulty = targetMeta?.difficulty || eq.difficulty || 'MEDIUM';
    const examTag = targetMeta?.examTag || eq.examTag || 'UPSC CSE Prelims';
    const pyqYear = targetMeta?.pyqYear || eq.pyqYear || 2025;
    const destination = targetMeta?.destination || eq.destination || 'PRACTICE_BANK';

    const prodQuestion: Question = {
      id: eq.id,
      subjectId,
      topicId,
      conceptId,
      type: 'MCQ',
      question: eq.question,
      options: eq.options,
      correctAnswer: eq.correctAnswer,
      explanation: eq.explanation || 'Imported via OCR Question Studio',
      difficulty,
      examTag,
      pyqYear,
      exam: eq.exam || 'UPSC CSE',
      questionNumber: eq.questionNum || eq.questionNumber,
      isPyq: eq.isPyq !== undefined ? eq.isPyq : true,
      source: 'OCR_IMPORTED',
      verifiedStatus: 'VERIFIED_PYQ',
      isPublished: true,
      status: 'PUBLISHED',
      destination,
      question_en: eq.question_en,
      question_hi: eq.question_hi,
      options_en: eq.options_en,
      options_hi: eq.options_hi,
      explanation_en: eq.explanation_en,
      explanation_hi: eq.explanation_hi,
      availableLanguages: eq.availableLanguages,
    };

    // Save to Production Question Bank (questions table)
    const publishedQ = await questionRepository.create(prodQuestion);

    // Update Extracted Question state
    await this.updateExtractedQuestion(questionId, {
      status: 'PUBLISHED',
      subjectId,
      topicId,
      conceptId,
      difficulty,
      examTag,
      pyqYear,
      destination,
      isPublished: true,
    });

    // Update job approved count
    await this.recalculateJobCounts(eq.jobId);

    return { success: true, question: publishedQ };
  }

  async bulkApproveAndPublish(
    jobId: string,
    questionIds: string[],
    targetMeta?: {
      subjectId?: string;
      topicId?: string;
      conceptId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      destination?: 'PRACTICE_BANK' | 'MOCK_TEST' | 'BOTH';
      examTag?: string;
      pyqYear?: number;
    },
    overrideWarnings = false
  ): Promise<{
    affectedCount: number;
    publishBlockedCount: number;
    blockedReasons: { questionId: string; questionNum?: number; reason: string }[];
  }> {
    let affectedCount = 0;
    let publishBlockedCount = 0;
    const blockedReasons: { questionId: string; questionNum?: number; reason: string }[] = [];

    for (const qId of questionIds) {
      const eq = await this.getExtractedQuestionById(qId);
      if (!eq) continue;

      if (!overrideWarnings) {
        if (!eq.question || eq.question.trim().length < 5) {
          publishBlockedCount++;
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Missing question text' });
          continue;
        }
        if (!eq.options || eq.options.length < 2) {
          publishBlockedCount++;
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Incomplete options' });
          continue;
        }
        if (!eq.correctAnswer || eq.correctAnswer === '') {
          publishBlockedCount++;
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Missing correct answer' });
          continue;
        }
      }

      const res = await this.approveAndPublishQuestion(qId, targetMeta);
      if (res.success) {
        affectedCount++;
      } else {
        publishBlockedCount++;
        blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: res.error || 'Approval failed' });
      }
    }

    await this.recalculateJobCounts(jobId);

    return { affectedCount, publishBlockedCount, blockedReasons };
  }

  async rejectQuestion(questionId: string): Promise<boolean> {
    const eq = await this.getExtractedQuestionById(questionId);
    if (!eq) return false;

    await this.updateExtractedQuestion(questionId, { status: 'ARCHIVED' as any, isPublished: false });
    await this.recalculateJobCounts(eq.jobId);
    return true;
  }

  async bulkRejectQuestions(jobId: string, questionIds: string[]): Promise<number> {
    let count = 0;
    for (const qId of questionIds) {
      const ok = await this.rejectQuestion(qId);
      if (ok) count++;
    }
    return count;
  }

  async recalculateJobCounts(jobId: string): Promise<void> {
    const questions = await this.getQuestionsByJobId(jobId);
    const approvedCount = questions.filter(q => q.status === 'PUBLISHED' || q.status === 'READY_TO_PUBLISH' || q.isPublished).length;
    const rejectedCount = questions.filter(q => q.status === ('ARCHIVED' as any) || q.status === ('REJECTED' as any)).length;
    const total = questions.length;

    let status = 'PROCESSING';
    if (approvedCount === total && total > 0) {
      status = 'PUBLISHED';
    } else if (approvedCount > 0) {
      status = 'VERIFIED';
    }

    await this.updateJob(jobId, {
      detectedQuestionsCount: total,
      approvedCount,
      rejectedCount,
      status,
    });
  }

  // --- DUPLICATE DETECTION HELPERS ---

  async runDuplicateCheck(
    extractedQuestions: ExtractedQuestionRecord[]
  ): Promise<ExtractedQuestionRecord[]> {
    const dbQuestions = await questionRepository.listAll();

    return extractedQuestions.map((q, idx) => {
      const normText = this.normalizeText(q.question);
      if (!normText || normText.length < 10) return q;

      // 1. Check against existing Question Bank
      for (const dbQ of dbQuestions) {
        if (dbQ.id === q.id) continue;
        const normDb = this.normalizeText(dbQ.question);
        const similarity = this.calculateSimilarity(normText, normDb);

        if (similarity > 0.82) {
          return {
            ...q,
            duplicateWarning: {
              isDuplicate: true,
              existingQuestionId: dbQ.id,
              existingText: dbQ.question,
              similarityScore: Math.round(similarity * 100),
              source: 'QUESTION_BANK',
            },
          };
        }
      }

      // 2. Check against other questions in same extracted set
      for (let j = 0; j < extractedQuestions.length; j++) {
        if (idx === j) continue;
        const other = extractedQuestions[j];
        const normOther = this.normalizeText(other.question);
        const similarity = this.calculateSimilarity(normText, normOther);

        if (similarity > 0.85) {
          return {
            ...q,
            duplicateWarning: {
              isDuplicate: true,
              existingQuestionId: other.id,
              existingText: other.question,
              similarityScore: Math.round(similarity * 100),
              source: 'INTERNAL',
            },
          };
        }
      }

      return q;
    });
  }

  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    const tokens1 = new Set(str1.split(' ').filter(t => t.length > 2));
    const tokens2 = new Set(str2.split(' ').filter(t => t.length > 2));

    if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

    let intersection = 0;
    for (const t of tokens1) {
      if (tokens2.has(t)) intersection++;
    }

    const union = new Set([...tokens1, ...tokens2]).size;
    return intersection / union;
  }

  private mapRowToJob(row: any): OcrJobRecord {
    return {
      id: row.id,
      userId: row.user_id || undefined,
      originalFileName: row.original_file_name,
      storageKey: row.storage_key || undefined,
      fileSizeBytes: row.file_size_bytes || 0,
      pageCount: row.page_count || 1,
      strategy: row.strategy || 'VISION_OCR',
      exam: row.exam || 'UPSC CSE',
      expectedQuestionCount: row.expected_question_count || 100,
      status: row.status || 'UPLOADED',
      processedPages: row.processed_pages || 0,
      detectedQuestionsCount: row.detected_questions_count || 0,
      approvedCount: row.approved_count || 0,
      rejectedCount: row.rejected_count || 0,
      confidenceScore: row.confidence_score || 0.0,
      missingQuestionNumbers: Array.isArray(row.missing_question_numbers)
        ? row.missing_question_numbers
        : typeof row.missing_question_numbers === 'string'
        ? JSON.parse(row.missing_question_numbers)
        : [],
      duplicateQuestionNumbers: Array.isArray(row.duplicate_question_numbers)
        ? row.duplicate_question_numbers
        : typeof row.duplicate_question_numbers === 'string'
        ? JSON.parse(row.duplicate_question_numbers)
        : [],
      reviewState: typeof row.review_state === 'object' && row.review_state !== null
        ? row.review_state
        : typeof row.review_state === 'string'
        ? JSON.parse(row.review_state)
        : {},
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapRowToExtractedQuestion(row: any): ExtractedQuestionRecord {
    const options = Array.isArray(row.options)
      ? row.options
      : typeof row.options === 'string'
      ? JSON.parse(row.options)
      : [];

    const options_en = Array.isArray(row.options_en)
      ? row.options_en
      : typeof row.options_en === 'string'
      ? JSON.parse(row.options_en)
      : undefined;

    const options_hi = Array.isArray(row.options_hi)
      ? row.options_hi
      : typeof row.options_hi === 'string'
      ? JSON.parse(row.options_hi)
      : undefined;

    const availableLanguages = Array.isArray(row.available_languages)
      ? row.available_languages
      : typeof row.available_languages === 'string'
      ? JSON.parse(row.available_languages)
      : ['en'];

    const validationErrors = Array.isArray(row.validation_errors)
      ? row.validation_errors
      : typeof row.validation_errors === 'string'
      ? JSON.parse(row.validation_errors)
      : [];

    const duplicateWarning = typeof row.duplicate_warning === 'object' && row.duplicate_warning !== null
      ? row.duplicate_warning
      : typeof row.duplicate_warning === 'string'
      ? JSON.parse(row.duplicate_warning)
      : null;

    const fieldConfidence = typeof row.field_confidence === 'object' && row.field_confidence !== null
      ? row.field_confidence
      : typeof row.field_confidence === 'string'
      ? JSON.parse(row.field_confidence)
      : {};

    return {
      id: row.id,
      jobId: row.job_id,
      questionNum: row.question_num,
      questionNumber: row.question_num,
      pageNumber: row.page_number || 1,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: 'MCQ',
      question: row.question_text,
      question_en: row.question_en || undefined,
      question_hi: row.question_hi || undefined,
      options,
      options_en,
      options_hi,
      correctAnswer: row.correct_answer || '',
      explanation: row.explanation || '',
      explanation_en: row.explanation_en || undefined,
      explanation_hi: row.explanation_hi || undefined,
      availableLanguages,
      difficulty: row.difficulty || 'MEDIUM',
      examTag: row.exam_tag || undefined,
      pyqYear: row.pyq_year || undefined,
      source: row.source || 'OCR_IMPORTED',
      isPyq: row.is_pyq,
      hasVisualContent: row.has_visual_content,
      fieldConfidence,
      ocrConfidence: row.ocr_confidence,
      status: row.status,
      destination: row.destination || 'PRACTICE_BANK',
      validationErrors,
      duplicateWarning,
      isPublished: row.status === 'PUBLISHED' || row.status === 'APPROVED',
    };
  }
}

export const ocrRepository = new OcrRepository();

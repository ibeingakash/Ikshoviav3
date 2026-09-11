import crypto from 'crypto';
import pool from '../db/pool.js';
import { OCRJob, Question, FieldConfidence } from '../../src/types/index.js';
import { questionRepository } from './QuestionRepository.js';
import {
  validatePaperCompleteness,
  normalizeOptionsForExam,
  calculateCanonicalMissingQuestions,
  PaperCompletenessCheck,
} from '../../src/lib/examOptionPolicy.js';

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
  status: string; // 'UPLOADED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PARTIALLY_APPROVED' | 'COMPLETED' | 'VERIFIED' | 'PUBLISHED' | 'FAILED'
  processedPages: number;
  detectedQuestionsCount: number;
  approvedCount: number;
  rejectedCount: number;
  confidenceScore: number;
  missingQuestionNumbers: number[];
  duplicateQuestionNumbers: number[];
  reviewState: Record<string, any>;
  errorMessage?: string;
  documentHash?: string;
  officialSourceUrl?: string;
  sourceDomain?: string;
  commission?: string;
  paper?: string;
  year?: number;
  examCycle?: string;
  parserVersion?: string;
  ocrEngineVersion?: string;
  structureReport?: Record<string, any>;
  answerKeyStatus?: string;
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
  aiAssisted?: boolean;
  parseConfidence?: number;
  structureStatus?: 'AUTO_VERIFIED' | 'NEEDS_REVIEW' | 'FAILED' | 'MANUALLY_VERIFIED';
  sourcePageCrop?: string;
  originalOcrText?: string;
  originalOptions?: any[];
  imageUrl?: string;
  imageCaption?: string;
  figureStatus?: 'FIGURE_VERIFIED' | 'FIGURE_REVIEW_REQUIRED' | 'FIGURE_MISSING' | 'FIGURE_NOT_REQUIRED';
  correctionsCount?: number;
  lastCorrectedAt?: string;
  lastCorrectedBy?: string;
}

export class OcrRepository {
  async initSchema(): Promise<void> {
    await pool.query(`
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam TEXT DEFAULT 'UPSC CSE';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS expected_question_count INT DEFAULT 100;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS rejected_count INT DEFAULT 0;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS document_hash TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS official_source_url TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS source_domain TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS commission TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS paper TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS year INT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS exam_cycle TEXT;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS parser_version TEXT DEFAULT 'v2.1';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS ocr_engine_version TEXT DEFAULT 'deterministic_pdfparse_v2';
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS structure_report JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS answer_key_status TEXT DEFAULT 'ANSWER_KEY_PENDING';

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
        question_type TEXT DEFAULT 'SINGLE_CHOICE',
        statements JSONB DEFAULT '[]'::jsonb,
        statements_hi JSONB DEFAULT '[]'::jsonb,
        match_data JSONB DEFAULT '{}'::jsonb,
        match_data_hi JSONB DEFAULT '{}'::jsonb,
        document_hash TEXT,
        official_source_url TEXT,
        source_domain TEXT,
        ai_assisted BOOLEAN DEFAULT FALSE,
        parse_confidence FLOAT DEFAULT 1.0,
        structure_status TEXT DEFAULT 'AUTO_VERIFIED',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'SINGLE_CHOICE';
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS statements JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS statements_hi JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS match_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS match_data_hi JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS document_hash TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS official_source_url TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS source_domain TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS ai_assisted BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS parse_confidence FLOAT DEFAULT 1.0;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS structure_status TEXT DEFAULT 'AUTO_VERIFIED';
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS answer_key_status TEXT DEFAULT 'ANSWER_PENDING';
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS solution_source TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS solution_page_number INT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS solution_question_number INT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS original_ocr_text TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS original_options JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS image_caption TEXT;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS figure_status TEXT DEFAULT 'FIGURE_NOT_REQUIRED';
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS corrections_count INT DEFAULT 0;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS last_corrected_at TIMESTAMPTZ;
      ALTER TABLE public.ocr_extracted_questions ADD COLUMN IF NOT EXISTS last_corrected_by TEXT;

      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS original_ocr_text TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS original_options JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_caption TEXT;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS figure_status TEXT DEFAULT 'FIGURE_NOT_REQUIRED';
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS corrections_count INT DEFAULT 0;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS last_corrected_at TIMESTAMPTZ;
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS last_corrected_by TEXT;

      CREATE TABLE IF NOT EXISTS public.question_revisions (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        job_id TEXT,
        revision_num INT NOT NULL DEFAULT 1,
        source_origin TEXT NOT NULL,
        field_changed TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        reason TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        changed_by TEXT,
        changed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ocr_extracted_questions_job_id ON public.ocr_extracted_questions(job_id);
      CREATE INDEX IF NOT EXISTS idx_question_revisions_qid ON public.question_revisions(question_id);
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
        review_state, error_message, document_hash, official_source_url, source_domain,
        commission, paper, year, exam_cycle, parser_version, ocr_engine_version,
        structure_report, answer_key_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28,
        $29, $30, NOW(), NOW()
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
        document_hash = COALESCE(EXCLUDED.document_hash, public.ocr_jobs.document_hash),
        official_source_url = COALESCE(EXCLUDED.official_source_url, public.ocr_jobs.official_source_url),
        source_domain = COALESCE(EXCLUDED.source_domain, public.ocr_jobs.source_domain),
        commission = COALESCE(EXCLUDED.commission, public.ocr_jobs.commission),
        paper = COALESCE(EXCLUDED.paper, public.ocr_jobs.paper),
        year = COALESCE(EXCLUDED.year, public.ocr_jobs.year),
        exam_cycle = COALESCE(EXCLUDED.exam_cycle, public.ocr_jobs.exam_cycle),
        parser_version = EXCLUDED.parser_version,
        ocr_engine_version = EXCLUDED.ocr_engine_version,
        structure_report = EXCLUDED.structure_report,
        answer_key_status = EXCLUDED.answer_key_status,
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
      job.strategy || 'TEXT_EXTRACTION',
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
      job.documentHash || null,
      job.officialSourceUrl || null,
      job.sourceDomain || null,
      job.commission || null,
      job.paper || null,
      job.year || null,
      job.examCycle || null,
      job.parserVersion || 'v2.1',
      job.ocrEngineVersion || 'deterministic_pdfparse_v2',
      JSON.stringify(job.structureReport || {}),
      job.answerKeyStatus || 'ANSWER_KEY_PENDING',
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
            destination, validation_errors, duplicate_warning,
            question_type, statements, statements_hi, match_data, match_data_hi,
            document_hash, official_source_url, source_domain, ai_assisted,
            parse_confidence, structure_status, answer_key_status, solution_source, solution_page_number, solution_question_number,
            original_ocr_text, original_options, image_url, image_caption, figure_status, corrections_count, last_corrected_at, last_corrected_by,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22, $23,
            $24, $25, $26, $27,
            $28, $29, $30,
            $31, $32, $33, $34, $35,
            $36, $37, $38, $39,
            $40, $41, $42, $43, $44, $45,
            $46, $47, $48, $49, $50, $51, $52, $53,
            NOW(), NOW()
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
            question_type = EXCLUDED.question_type,
            statements = EXCLUDED.statements,
            statements_hi = EXCLUDED.statements_hi,
            match_data = EXCLUDED.match_data,
            match_data_hi = EXCLUDED.match_data_hi,
            document_hash = COALESCE(EXCLUDED.document_hash, public.ocr_extracted_questions.document_hash),
            official_source_url = COALESCE(EXCLUDED.official_source_url, public.ocr_extracted_questions.official_source_url),
            source_domain = COALESCE(EXCLUDED.source_domain, public.ocr_extracted_questions.source_domain),
            ai_assisted = EXCLUDED.ai_assisted,
            parse_confidence = EXCLUDED.parse_confidence,
            structure_status = EXCLUDED.structure_status,
            answer_key_status = EXCLUDED.answer_key_status,
            solution_source = EXCLUDED.solution_source,
            solution_page_number = EXCLUDED.solution_page_number,
            solution_question_number = EXCLUDED.solution_question_number,
            original_ocr_text = COALESCE(public.ocr_extracted_questions.original_ocr_text, EXCLUDED.original_ocr_text),
            original_options = COALESCE(public.ocr_extracted_questions.original_options, EXCLUDED.original_options),
            image_url = EXCLUDED.image_url,
            image_caption = EXCLUDED.image_caption,
            figure_status = EXCLUDED.figure_status,
            corrections_count = EXCLUDED.corrections_count,
            last_corrected_at = EXCLUDED.last_corrected_at,
            last_corrected_by = EXCLUDED.last_corrected_by,
            updated_at = NOW()
          RETURNING *
        `;

        const qAny = q as any;
        const questionTextResolved = q.question || qAny.questionText || qAny.text || qAny.textEn || `Question #${q.questionNum || qAny.questionNumber || 1}`;
        const questionEnResolved = q.question_en || qAny.questionEn || qAny.textEn || null;
        const questionHiResolved = q.question_hi || qAny.questionHi || qAny.textHi || null;

        const values = [
          q.id,
          jobId,
          q.questionNum || qAny.questionNumber || null,
          q.pageNumber || 1,
          questionTextResolved,
          questionEnResolved,
          questionHiResolved,
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
          Boolean(q.hasVisualContent || q.imageUrl),
          JSON.stringify(q.fieldConfidence || {}),
          q.ocrConfidence || 0.0,
          q.status || 'NEEDS_REVIEW',
          q.destination || 'PRACTICE_BANK',
          JSON.stringify(q.validationErrors || []),
          JSON.stringify(q.duplicateWarning || null),
          q.questionType || (q.matchData ? 'MATCH_FOLLOWING' : (q.statements && q.statements.length > 0 ? 'STATEMENT_BASED' : 'SINGLE_CHOICE')),
          JSON.stringify(q.statements || []),
          JSON.stringify(q.statements_hi || []),
          JSON.stringify(q.matchData || {}),
          JSON.stringify(q.matchData_hi || {}),
          (q as any).documentHash || null,
          (q as any).officialSourceUrl || null,
          (q as any).sourceDomain || null,
          q.aiAssisted || false,
          q.parseConfidence || 1.0,
          q.structureStatus || 'AUTO_VERIFIED',
          q.answerKeyStatus || (q.correctAnswer ? 'ANSWER_BOUND' : 'ANSWER_PENDING'),
          q.solutionSource || null,
          q.solutionPageNumber || null,
          q.solutionQuestionNumber || null,
          q.originalOcrText || (q as any).original_ocr_text || questionTextResolved,
          JSON.stringify(q.originalOptions || (q as any).original_options || q.options || []),
          q.imageUrl || (q as any).image_url || null,
          q.imageCaption || (q as any).image_caption || null,
          q.figureStatus || (q as any).figure_status || (q.imageUrl ? 'FIGURE_VERIFIED' : (q.hasVisualContent ? 'FIGURE_REVIEW_REQUIRED' : 'FIGURE_NOT_REQUIRED')),
          q.correctionsCount || (q as any).corrections_count || 0,
          q.lastCorrectedAt || (q as any).last_corrected_at || null,
          q.lastCorrectedBy || (q as any).last_corrected_by || null,
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
      exam?: string;
      paper?: string;
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

    const job = await this.getJobById(eq.jobId);
    const finalSubjectId = targetMeta?.subjectId || eq.subjectId || 'sub_polity';
    const finalTopicId = targetMeta?.topicId || eq.topicId || 'top_rights';
    const finalConceptId = targetMeta?.conceptId || eq.conceptId || 'c_art32';
    const finalDifficulty = targetMeta?.difficulty || eq.difficulty || 'MEDIUM';
    const finalExamTag = targetMeta?.examTag || eq.examTag || job?.exam || 'UPSC CSE';
    const finalPyqYear = targetMeta?.pyqYear || eq.pyqYear || job?.year || 2025;
    const finalDestination = targetMeta?.destination || eq.destination || 'PRACTICE_BANK';
    const finalExam = targetMeta?.exam || job?.exam || 'UPSC CSE';
    const finalPaper = targetMeta?.paper || job?.paper || 'General Studies Paper-I';

    // Admin OCR uploads are strictly ADMIN_IMPORTED.
    // Official Commission is strictly for papers ingested by the official crawler pipeline.
    const resolvedSourceType: 'OFFICIAL_COMMISSION' | 'ADMIN_IMPORTED' = 
      (job as any)?.isOfficialIngestion ? 'OFFICIAL_COMMISSION' : 'ADMIN_IMPORTED';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update in staging table
      await client.query(
        `UPDATE public.ocr_extracted_questions 
         SET status = 'PUBLISHED', is_pyq = $1, subject_id = $2, topic_id = $3, concept_id = $4, 
             difficulty = $5, exam_tag = $6, pyq_year = $7, destination = $8, updated_at = NOW()
         WHERE id = $9`,
        [resolvedSourceType === 'OFFICIAL_COMMISSION', finalSubjectId, finalTopicId, finalConceptId, finalDifficulty, finalExamTag, finalPyqYear, finalDestination, questionId]
      );

      // 2. Publish to standard questions table
      const publishedQuestion: Question = {
        ...eq,
        id: eq.id,
        subjectId: finalSubjectId,
        topicId: finalTopicId,
        conceptId: finalConceptId,
        difficulty: finalDifficulty,
        examTag: finalExamTag,
        pyqYear: finalPyqYear,
        destination: finalDestination,
        sourceType: resolvedSourceType,
        isPublished: true,
        status: 'READY_TO_PUBLISH',
        source: resolvedSourceType,
        sourceJobId: eq.jobId,
        questionType: eq.questionType || (eq.matchData ? 'MATCH_FOLLOWING' : (eq.statements && eq.statements.length > 0 ? 'STATEMENT_BASED' : 'SINGLE_CHOICE')),
        statements: eq.statements,
        statements_hi: eq.statements_hi,
        matchData: eq.matchData,
        matchData_hi: eq.matchData_hi,
        imageUrl: eq.imageUrl,
        imageCaption: eq.imageCaption,
        figureStatus: eq.figureStatus,
        originalOcrText: eq.originalOcrText || eq.question,
        originalOptions: eq.originalOptions || eq.options,
      };

      await questionRepository.create(publishedQuestion);

      const qNum = eq.questionNum || eq.questionNumber || 1;

      // 3. If OFFICIAL_COMMISSION, publish to canonical pyq_papers & pyq_questions
      if (resolvedSourceType === 'OFFICIAL_COMMISSION') {
        const paperId = `${finalExam.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${finalPyqYear}_${finalPaper.toLowerCase().replace(/[^a-z0-9]/g, '_')}`.replace(/__+/g, '_');

        const paperCheck = await client.query('SELECT id FROM public.pyq_papers WHERE id = $1', [paperId]);
        if (paperCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO public.pyq_papers (
              id, exam, exam_name, year, exam_cycle, stage, paper, paper_name,
              source_type, official_source_url, official_paper_url, source_domain,
              expected_question_count, actual_question_count, verified_question_count,
              verification_status, answer_key_status, language, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, 'Prelims', $6, $7,
              'OFFICIAL_COMMISSION', $8, $9, $10,
              $11, 1, 1,
              'INCOMPLETE', $12, 'bilingual', NOW(), NOW()
            )`,
            [
              paperId,
              finalExam,
              finalExamTag,
              finalPyqYear,
              `${finalPyqYear}`,
              finalPaper,
              `${finalExam} ${finalPyqYear} - ${finalPaper}`,
              job?.officialSourceUrl || (finalExam === 'BPSC' ? 'https://bpsc.bihar.gov.in' : 'https://upsc.gov.in'),
              job?.officialSourceUrl || (finalExam === 'BPSC' ? 'https://bpsc.bihar.gov.in' : 'https://upsc.gov.in'),
              job?.sourceDomain || (finalExam === 'BPSC' ? 'bpsc.bihar.gov.in' : 'upsc.gov.in'),
              job?.expectedQuestionCount || (finalExam === 'BPSC' ? 150 : (finalPaper.includes('CSAT') ? 80 : 100)),
              job?.answerKeyStatus || 'OFFICIAL_KEY_VERIFIED',
            ]
          );
        }

        const pyqQId = `${paperId}_q${String(qNum).padStart(3, '0')}`;
        await client.query(
          `INSERT INTO public.pyq_questions (
            id, paper_id, question_number, question_text, question_en, question_hi,
            options, options_en, options_hi, official_answer, official_answer_source,
            solution, solution_source, topic, subject, subject_id, gs_paper,
            difficulty, source_page_number, official_paper_url, question_type,
            statements, statements_hi, match_data, match_data_hi, document_hash,
            extraction_method, extraction_confidence, source_type, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, 'Official Commission Master Answer Key',
            $11, 'Official References & Verification', $12, $13, $14, $15,
            $16, $17, $18, $19,
            $20, $21, $22, $23, $24,
            'TEXT', $25, 'OFFICIAL_COMMISSION', NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            question_text = EXCLUDED.question_text,
            question_en = EXCLUDED.question_en,
            question_hi = EXCLUDED.question_hi,
            options = EXCLUDED.options,
            options_en = EXCLUDED.options_en,
            options_hi = EXCLUDED.options_hi,
            official_answer = EXCLUDED.official_answer,
            solution = EXCLUDED.solution,
            question_type = EXCLUDED.question_type,
            statements = EXCLUDED.statements,
            statements_hi = EXCLUDED.statements_hi,
            match_data = EXCLUDED.match_data,
            match_data_hi = EXCLUDED.match_data_hi,
            source_type = 'OFFICIAL_COMMISSION',
            updated_at = NOW()`,
          [
            pyqQId,
            paperId,
            qNum,
            eq.question,
            eq.question_en || eq.question,
            eq.question_hi || null,
            JSON.stringify(eq.options || []),
            JSON.stringify(eq.options_en || []),
            JSON.stringify(eq.options_hi || []),
            eq.correctAnswer,
            eq.explanation || 'Official Verified Answer',
            finalTopicId,
            finalSubjectId,
            finalSubjectId,
            finalPaper,
            finalDifficulty,
            eq.pageNumber || 1,
            job?.officialSourceUrl || '',
            eq.questionType || (eq.matchData ? 'MATCH_FOLLOWING' : (eq.statements && eq.statements.length > 0 ? 'STATEMENT_BASED' : 'SINGLE_CHOICE')),
            JSON.stringify(eq.statements || []),
            JSON.stringify(eq.statements_hi || []),
            JSON.stringify(eq.matchData || {}),
            JSON.stringify(eq.matchData_hi || {}),
            job?.documentHash || null,
            eq.ocrConfidence || 1.0,
          ]
        );

        await client.query(
          `UPDATE public.pyq_papers
           SET actual_question_count = (SELECT COUNT(*) FROM public.pyq_questions WHERE paper_id = $1),
               verified_question_count = (SELECT COUNT(*) FROM public.pyq_questions WHERE paper_id = $1 AND (verification_status = 'OFFICIAL_VERIFIED' OR official_answer IS NOT NULL)),
               verification_status = CASE
                 WHEN (SELECT COUNT(*) FROM public.pyq_questions WHERE paper_id = $1) >= expected_question_count THEN 'OFFICIAL_VERIFIED'
                 ELSE 'INCOMPLETE'
               END,
               updated_at = NOW()
           WHERE id = $1`,
          [paperId]
        );
      }

      // 4. For ALL ADMIN_IMPORTED uploads (or when MOCK_TEST destination is chosen), create/update mock_tests & mock_questions
      if (resolvedSourceType === 'ADMIN_IMPORTED' || finalDestination === 'MOCK_TEST' || finalDestination === 'BOTH') {
        const mockTestId = `mock_${eq.jobId || 'imported'}`;
        const cleanFileName = job?.originalFileName ? job.originalFileName.replace(/\.pdf$/i, '').replace(/_/g, ' ') : '';
        const mockTitle = cleanFileName
          ? `${finalExam} - ${cleanFileName}`
          : (job?.paper && !job.paper.includes('General Studies Paper-I') && !job.paper.includes('BPSC Prelims')
              ? `${finalExam} ${finalPyqYear} - ${job.paper}`
              : `${finalExam} ${finalPyqYear} - Full Mock Simulation`);

        const expectedQ = job?.expectedQuestionCount || 100;
        const testType = expectedQ >= 50 ? 'FULL' : (expectedQ >= 20 ? 'SUBJECT' : 'QUICK');
        const duration = expectedQ >= 100 ? 120 : (expectedQ >= 50 ? 90 : Math.round(expectedQ * 1.2));
        const totalMarks = finalExam === 'BPSC' ? expectedQ * 1 : expectedQ * 2;
        const negRate = finalExam === 'BPSC' ? 0.33 : 0.66;

        await client.query(`
          INSERT INTO public.mock_tests (
            id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
            negative_marking_rate, source_type, is_published, created_at
          ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, 'ADMIN_IMPORTED', true, NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            type = EXCLUDED.type,
            source_type = 'ADMIN_IMPORTED',
            is_published = true;
        `, [
          mockTestId,
          mockTitle,
          testType,
          JSON.stringify([finalSubjectId]),
          duration,
          expectedQ,
          totalMarks,
          negRate
        ]);

        await client.query(`
          INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
          VALUES ($1, $2, $3)
          ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
        `, [mockTestId, publishedQuestion.id, qNum]);

        // Keep mock_tests.total_questions accurate
        await client.query(`
          UPDATE public.mock_tests
          SET total_questions = (SELECT COUNT(*) FROM public.mock_questions WHERE mock_test_id = $1),
              total_marks = CASE WHEN '${finalExam}' = 'BPSC' THEN (SELECT COUNT(*) FROM public.mock_questions WHERE mock_test_id = $1) * 1 ELSE (SELECT COUNT(*) FROM public.mock_questions WHERE mock_test_id = $1) * 2 END
          WHERE id = $1;
        `, [mockTestId]);
      }

      await client.query('COMMIT');
      await this.recalculateJobCounts(eq.jobId);

      return { success: true, question: publishedQuestion };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || 'Database error publishing question' };
    } finally {
      client.release();
    }
  }

  async publishEntireJobToPyq(
    jobId: string,
    metadata?: {
      exam?: string;
      year?: number;
      paper?: string;
      subjectId?: string;
      topicId?: string;
      conceptId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      force?: boolean;
    }
  ): Promise<{
    success: boolean;
    publishedCount: number;
    blockedCount: number;
    paperId?: string;
    error?: string;
    completeness?: PaperCompletenessCheck;
  }> {
    const job = await this.getJobById(jobId);
    if (!job) return { success: false, publishedCount: 0, blockedCount: 0, error: 'Job not found' };

    const questions = await this.getQuestionsByJobId(jobId);
    if (questions.length === 0) {
      return { success: false, publishedCount: 0, blockedCount: 0, error: 'No questions in job' };
    }

    const finalExam = metadata?.exam || job.exam || 'UPSC CSE';
    const expectedCount = job.expectedQuestionCount || (finalExam === 'BPSC' ? 150 : 100);

    // Prompt requirement: Paper Completeness Validation before Publish
    const completeness = validatePaperCompleteness(finalExam, questions, expectedCount);
    if (!completeness.canPublish && !metadata?.force) {
      return {
        success: false,
        publishedCount: 0,
        blockedCount: questions.length,
        error: `Publication blocked: Paper completeness validation failed (${completeness.completenessPercentage}% complete). ${completeness.summaryRemarks.join('; ')}`,
        completeness,
      };
    }

    let publishedCount = 0;
    let blockedCount = 0;

    for (const q of questions) {
      if (!q.correctAnswer || q.options.length < 2 || !q.question || q.question.trim().length < 5) {
        blockedCount++;
        continue;
      }
      const res = await this.approveAndPublishQuestion(q.id, {
        subjectId: metadata?.subjectId || q.subjectId,
        topicId: metadata?.topicId || q.topicId,
        conceptId: metadata?.conceptId || q.conceptId,
        difficulty: (metadata?.difficulty || (q.difficulty === 'EASY' || q.difficulty === 'HARD' ? q.difficulty : 'MEDIUM')) as 'EASY' | 'MEDIUM' | 'HARD',
        exam: finalExam,
        pyqYear: metadata?.year || job.year,
        paper: metadata?.paper || job.paper,
      });

      if (res.success) {
        publishedCount++;
      } else {
        blockedCount++;
      }
    }

    await this.updateJob(jobId, {
      status: publishedCount > 0 ? 'PUBLISHED' : job.status,
      approvedCount: publishedCount,
    });

    const finalYear = metadata?.year || job.year || 2025;
    const finalPaper = metadata?.paper || job.paper || 'General Studies Paper-I';
    const paperId = `${finalExam.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${finalYear}_${finalPaper.toLowerCase().replace(/[^a-z0-9]/g, '_')}`.replace(/__+/g, '_');

    return { success: true, publishedCount, blockedCount, paperId, completeness };
  }

  async checkJobCompleteness(jobId: string): Promise<PaperCompletenessCheck | null> {
    const job = await this.getJobById(jobId);
    if (!job) return null;
    const questions = await this.getQuestionsByJobId(jobId);
    const expected = job.expectedQuestionCount || (job.exam === 'BPSC' ? 150 : 100);
    return validatePaperCompleteness(job.exam, questions, expected);
  }

  async getJobReviewSummary(jobId: string): Promise<any | null> {
    const job = await this.getJobById(jobId);
    if (!job) return null;
    const questions = await this.getQuestionsByJobId(jobId);
    const expectedCount = job.expectedQuestionCount || (job.exam === 'BPSC' ? 150 : 100);
    const completeness = validatePaperCompleteness(job.exam, questions, expectedCount);

    return {
      success: true,
      job: {
        ...job,
        id: job.id,
        jobId: job.id,
      },
      questions,
      expectedCount: completeness.expectedCount,
      detectedCount: completeness.detectedCount,
      ocrDetectedCount: completeness.ocrDetectedCount,
      adminAddedCount: completeness.adminAddedCount,
      totalAccountedCount: completeness.totalAccountedCount,
      missingCount: completeness.missingCount,
      missingQuestions: completeness.missingNumbers,
      missingNumbers: completeness.missingNumbers,
      duplicates: completeness.duplicateNumbers,
      duplicateNumbers: completeness.duplicateNumbers,
      unexpectedQuestions: completeness.unexpectedNumbers || [],
      unexpectedNumbers: completeness.unexpectedNumbers || [],
      questionNumbers: completeness.questionNumbers || [],
      optionPolicy: completeness.optionPolicy,
      optionValidation: completeness.optionViolations || [],
      optionViolations: completeness.optionViolations || [],
      questionsWithMissingOptions: completeness.questionsWithMissingOptions || [],
      questionsWithUnexpectedOptions: completeness.questionsWithUnexpectedOptions || [],
      questionsWithPendingAnswers: completeness.questionsWithPendingAnswers || [],
      answersBoundCount: completeness.answersBoundCount || 0,
      answerBinding: {
        totalBound: completeness.answersBoundCount || 0,
        totalPending: completeness.questionsWithPendingAnswers?.length || 0,
        boundPercentage: Math.round(((completeness.answersBoundCount || 0) / (questions.length || 1)) * 100),
      },
      figures: {
        totalWithVisualContent: completeness.questionsWithFigures || 0,
        figureReviewPendingCount: completeness.figureReviewPendingCount || 0,
        figureVerifiedCount: questions.filter(q => q.figureStatus === 'FIGURE_VERIFIED').length,
        figureMissingCount: questions.filter(q => q.figureStatus === 'FIGURE_MISSING').length,
      },
      completeness,
      canPublish: completeness.canPublish,
      publishBlockedReasons: completeness.blockReasons || [],
    };
  }

  /**
   * Correct a question (staging or already published) with full audit trail.
   * For OFFICIAL_COMMISSION: original provenance is strictly preserved!
   */
  async recordQuestionCorrection(params: {
    questionId: string;
    fieldChanged: 'questionText' | 'options' | 'correctAnswer' | 'explanation' | 'figure';
    oldValue?: string;
    newValue?: string;
    reason?: string;
    details?: any;
    changedBy?: string;
    newQuestionText?: string;
    newOptions?: any[];
    newCorrectAnswer?: string;
    newExplanation?: string;
    newImageUrl?: string;
    newImageCaption?: string;
    newFigureStatus?: string;
  }): Promise<{ success: boolean; question?: any; revision?: any; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eqRes = await client.query('SELECT * FROM public.ocr_extracted_questions WHERE id = $1', [params.questionId]);
      let isStaging = eqRes.rows.length > 0;
      let questionRow = eqRes.rows[0];
      let sourceOrigin = 'ADMIN_IMPORTED';

      if (!isStaging) {
        const qRes = await client.query('SELECT * FROM public.questions WHERE id = $1', [params.questionId]);
        if (qRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return { success: false, error: 'Question not found in staging or questions bank' };
        }
        questionRow = qRes.rows[0];
        // CRITICAL: Preserve source_origin / source_type for OFFICIAL_COMMISSION
        sourceOrigin = questionRow.source_type || questionRow.source || 'OFFICIAL_COMMISSION';
      } else {
        const isOfficialJob = questionRow.job_id
          ? Boolean(
              questionRow.source === 'OFFICIAL_COMMISSION' ||
              (await client.query(
                "SELECT id FROM public.ocr_jobs WHERE id = $1 AND (commission IS NOT NULL OR official_source_url IS NOT NULL OR exam ILIKE '%BPSC%' OR exam ILIKE '%UPSC%')",
                [questionRow.job_id]
              )).rows.length > 0
            )
          : questionRow.source === 'OFFICIAL_COMMISSION';
        sourceOrigin = isOfficialJob ? 'OFFICIAL_COMMISSION' : (questionRow.source || 'ADMIN_IMPORTED');
      }

      const currentCorrectionsCount = Number(questionRow.corrections_count || 0);
      const revisionNum = currentCorrectionsCount + 1;
      const revisionId = `rev_${crypto.randomBytes(8).toString('hex')}`;

      // 1. Insert into public.question_revisions
      await client.query(
        `INSERT INTO public.question_revisions (
          id, question_id, job_id, revision_num, source_origin, field_changed,
          old_value, new_value, reason, details, changed_by, changed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, NOW()
        )`,
        [
          revisionId,
          params.questionId,
          questionRow.job_id || questionRow.source_job_id || null,
          revisionNum,
          sourceOrigin,
          params.fieldChanged,
          params.oldValue || '',
          params.newValue || '',
          params.reason || 'Admin manual correction',
          JSON.stringify(params.details || {}),
          params.changedBy || 'admin',
        ]
      );

      let updatedQuestion: any = null;

      if (isStaging) {
        const originalOcrText = questionRow.original_ocr_text || questionRow.question_text;
        const originalOptions = questionRow.original_options || questionRow.options;

        const updatedText = params.newQuestionText !== undefined ? params.newQuestionText : questionRow.question_text;
        const updatedOptions = params.newOptions !== undefined ? JSON.stringify(params.newOptions) : questionRow.options;
        const updatedAnswer = params.newCorrectAnswer !== undefined ? params.newCorrectAnswer : questionRow.correct_answer;
        const updatedExplanation = params.newExplanation !== undefined ? params.newExplanation : questionRow.explanation;
        const updatedImageUrl = params.newImageUrl !== undefined ? params.newImageUrl : questionRow.image_url;
        const updatedCaption = params.newImageCaption !== undefined ? params.newImageCaption : questionRow.image_caption;
        const updatedFigStatus = params.newFigureStatus !== undefined ? params.newFigureStatus : (updatedImageUrl ? 'FIGURE_VERIFIED' : questionRow.figure_status);

        const updateRes = await client.query(
          `UPDATE public.ocr_extracted_questions
           SET question_text = $1,
               options = $2,
               correct_answer = $3,
               explanation = $4,
               image_url = $5,
               image_caption = $6,
               figure_status = $7,
               has_visual_content = $8,
               original_ocr_text = COALESCE(original_ocr_text, $9),
               original_options = COALESCE(original_options, $10),
               corrections_count = $11,
               last_corrected_at = NOW(),
               last_corrected_by = $12,
               source = CASE WHEN $14 = 'OFFICIAL_COMMISSION' THEN 'OFFICIAL_COMMISSION' ELSE source END,
               structure_status = 'MANUALLY_VERIFIED',
               status = CASE WHEN $3 <> '' THEN 'READY_TO_PUBLISH' ELSE status END,
               updated_at = NOW()
           WHERE id = $13
           RETURNING *`,
          [
            updatedText,
            updatedOptions,
            updatedAnswer,
            updatedExplanation,
            updatedImageUrl,
            updatedCaption,
            updatedFigStatus,
            Boolean(updatedImageUrl),
            originalOcrText,
            typeof originalOptions === 'string' ? originalOptions : JSON.stringify(originalOptions),
            revisionNum,
            params.changedBy || 'admin',
            params.questionId,
            sourceOrigin,
          ]
        );
        updatedQuestion = this.mapRowToExtractedQuestion(updateRes.rows[0]);
      } else {
        // Published questions table: PRESERVE source_type / source_origin!
        const originalOcrText = questionRow.original_ocr_text || questionRow.question;
        const originalOptions = questionRow.original_options || questionRow.options;

        const updatedText = params.newQuestionText !== undefined ? params.newQuestionText : questionRow.question;
        const updatedOptions = params.newOptions !== undefined ? JSON.stringify(params.newOptions) : questionRow.options;
        const updatedAnswer = params.newCorrectAnswer !== undefined ? params.newCorrectAnswer : questionRow.correct_answer;
        const updatedExplanation = params.newExplanation !== undefined ? params.newExplanation : questionRow.explanation;
        const updatedImageUrl = params.newImageUrl !== undefined ? params.newImageUrl : questionRow.image_url;
        const updatedCaption = params.newImageCaption !== undefined ? params.newImageCaption : questionRow.image_caption;
        const updatedFigStatus = params.newFigureStatus !== undefined ? params.newFigureStatus : (updatedImageUrl ? 'FIGURE_VERIFIED' : questionRow.figure_status);

        const updateRes = await client.query(
          `UPDATE public.questions
           SET question = $1,
               options = $2,
               correct_answer = $3,
               explanation = $4,
               image_url = $5,
               image_caption = $6,
               figure_status = $7,
               has_visual_content = $8,
               original_ocr_text = COALESCE(original_ocr_text, $9),
               original_options = COALESCE(original_options, $10),
               corrections_count = $11,
               last_corrected_at = NOW(),
               last_corrected_by = $12,
               updated_at = NOW()
           WHERE id = $13
           RETURNING *`,
          [
            updatedText,
            updatedOptions,
            updatedAnswer,
            updatedExplanation,
            updatedImageUrl,
            updatedCaption,
            updatedFigStatus,
            Boolean(updatedImageUrl),
            originalOcrText,
            typeof originalOptions === 'string' ? originalOptions : JSON.stringify(originalOptions),
            revisionNum,
            params.changedBy || 'admin',
            params.questionId,
          ]
        );
        updatedQuestion = updateRes.rows[0];
      }

      await client.query('COMMIT');

      return {
        success: true,
        question: updatedQuestion,
        revision: {
          id: revisionId,
          questionId: params.questionId,
          revisionNum,
          sourceOrigin,
          fieldChanged: params.fieldChanged,
          oldValue: params.oldValue,
          newValue: params.newValue,
          reason: params.reason,
          changedBy: params.changedBy || 'admin',
          changedAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  }

  async getQuestionRevisions(questionId: string): Promise<any[]> {
    const res = await pool.query(
      'SELECT * FROM public.question_revisions WHERE question_id = $1 ORDER BY revision_num DESC, changed_at DESC',
      [questionId]
    );
    return res.rows.map(r => ({
      id: r.id,
      questionId: r.question_id,
      jobId: r.job_id,
      revisionNum: r.revision_num,
      sourceOrigin: r.source_origin,
      fieldChanged: r.field_changed,
      oldValue: r.old_value,
      newValue: r.new_value,
      reason: r.reason,
      details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
      changedBy: r.changed_by,
      changedAt: r.changed_at,
    }));
  }

  /**
   * Add a missing question to an existing OCR job with strict exam option policy enforcement.
   */
  async addMissingQuestionToJob(
    jobId: string,
    data: {
      questionNum: number;
      question: string;
      questionEn?: string;
      questionHi?: string;
      options: { id: string; text: string }[];
      optionsEn?: { id: string; text: string }[];
      optionsHi?: { id: string; text: string }[];
      correctAnswer?: string;
      explanation?: string;
      explanationEn?: string;
      explanationHi?: string;
      imageUrl?: string;
      imageCaption?: string;
      figureStatus?: 'FIGURE_VERIFIED' | 'FIGURE_REVIEW_REQUIRED' | 'FIGURE_MISSING' | 'FIGURE_NOT_REQUIRED';
      subjectId?: string;
      topicId?: string;
      conceptId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      pageNumber?: number;
    },
    actorId?: string
  ): Promise<{ success: boolean; question?: ExtractedQuestionRecord; completeness?: any; error?: string }> {
    const job = await this.getJobById(jobId);
    if (!job) return { success: false, error: 'Job not found' };

    // Strict duplicate check: Do not permit inserting already accounted question numbers
    const existingQ = await pool.query(
      'SELECT id FROM public.ocr_extracted_questions WHERE job_id = $1 AND question_num = $2',
      [jobId, data.questionNum]
    );
    if (existingQ.rows.length > 0) {
      return {
        success: false,
        error: `Question #${data.questionNum} already exists in this OCR job. Duplicate question numbers are not permitted.`,
      };
    }

    const exam = job.exam || 'UPSC CSE';
    const norm = normalizeOptionsForExam(exam, data.options);

    // Provenance rule: preserve OFFICIAL_COMMISSION for official commission papers
    const isOfficialCommission = Boolean(
      job.commission ||
      job.officialSourceUrl ||
      (job as any)?.isOfficialIngestion ||
      (job.exam && (job.exam.includes('BPSC') || job.exam.includes('UPSC')) && (job.year || (job as any).isPyq))
    );
    const resolvedSourceOrigin = isOfficialCommission ? 'OFFICIAL_COMMISSION' : 'ADMIN_ADDED';

    const questionId = `ocr_q_${jobId}_${data.questionNum}_${crypto.randomBytes(3).toString('hex')}`;
    const newRecord: ExtractedQuestionRecord = {
      id: questionId,
      jobId,
      questionNum: data.questionNum,
      questionNumber: data.questionNum,
      pageNumber: data.pageNumber || 1,
      subjectId: data.subjectId || 'sub_polity',
      topicId: data.topicId || 'top_rights',
      conceptId: data.conceptId || 'c_art32',
      type: 'MCQ',
      questionType: 'SINGLE_CHOICE',
      question: data.question.trim(),
      question_en: data.questionEn || data.question.trim(),
      question_hi: data.questionHi,
      options: norm.map(item => ({ id: item.id, text: item.text })),
      options_en: data.optionsEn,
      options_hi: data.optionsHi,
      correctAnswer: data.correctAnswer || '',
      explanation: data.explanation || '',
      explanation_en: data.explanationEn,
      explanation_hi: data.explanationHi,
      availableLanguages: data.questionHi ? ['en', 'hi'] : ['en'],
      difficulty: data.difficulty || 'MEDIUM',
      examTag: job.exam,
      pyqYear: job.year,
      source: resolvedSourceOrigin,
      isPyq: isOfficialCommission,
      hasVisualContent: Boolean(data.imageUrl),
      imageUrl: data.imageUrl,
      imageCaption: data.imageCaption,
      figureStatus: data.figureStatus || (data.imageUrl ? 'FIGURE_VERIFIED' : 'FIGURE_NOT_REQUIRED'),
      fieldConfidence: {
        question: 'HIGH',
        options: 'HIGH',
        answer: data.correctAnswer ? 'HIGH' : 'LOW',
        explanation: data.explanation ? 'HIGH' : 'LOW',
      },
      ocrConfidence: 100,
      status: data.correctAnswer ? 'READY_TO_PUBLISH' : 'NEEDS_REVIEW',
      destination: 'PRACTICE_BANK',
      validationErrors: [],
      aiAssisted: false,
      parseConfidence: 1.0,
      structureStatus: 'MANUALLY_VERIFIED',
      answerKeyStatus: data.correctAnswer ? 'ANSWER_BOUND' : 'ANSWER_PENDING',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCorrectedBy: actorId || 'admin',
      lastCorrectedAt: new Date().toISOString(),
      correctionsCount: 1,
    };

    const saved = await this.saveExtractedQuestions(jobId, [newRecord]);
    const createdQuestion = saved[0];

    // Immutable audit record in question_revisions
    try {
      const revisionId = `rev_${crypto.randomBytes(8).toString('hex')}`;
      await pool.query(
        `INSERT INTO public.question_revisions (
          id, question_id, job_id, revision_num, source_origin, field_changed,
          old_value, new_value, reason, details, changed_by, changed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, NOW()
        )`,
        [
          revisionId,
          questionId,
          jobId,
          1,
          resolvedSourceOrigin,
          'question_created',
          '',
          `Created Missing Question #${data.questionNum}`,
          'Admin manually added missing canonical question',
          JSON.stringify({ questionNum: data.questionNum, optionsCount: norm.length, exam }),
          actorId || 'admin',
        ]
      );
    } catch (revErr) {
      console.warn('[OcrRepository] Failed to write initial revision log:', revErr);
    }

    // Re-evaluate missing questions for the job
    const allQuestions = await this.getQuestionsByJobId(jobId);
    const detectedNums = allQuestions
      .map(q => q.questionNum || q.questionNumber)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));

    const expectedCount = job.expectedQuestionCount || (exam === 'BPSC' ? 150 : 100);
    const seq = calculateCanonicalMissingQuestions(expectedCount, detectedNums);
    const completeness = validatePaperCompleteness(exam, allQuestions, expectedCount);

    await this.updateJob(jobId, {
      detectedQuestionsCount: allQuestions.length,
      missingQuestionNumbers: seq.missingNumbers,
      duplicateQuestionNumbers: seq.duplicateNumbers,
    });

    return { success: true, question: createdQuestion, completeness };
  }

  async bulkApproveQuestions(
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
    }
  ): Promise<{
    affectedCount: number;
    publishBlockedCount: number;
    approvedIds: string[];
    rejectedIds: string[];
    blockedReasons: { questionId: string; questionNum?: number; reason: string }[];
    questions: ExtractedQuestionRecord[];
  }> {
    const approvedIds: string[] = [];
    const rejectedIds: string[] = [];
    const blockedReasons: { questionId: string; questionNum?: number; reason: string }[] = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fetchRes = await client.query(
        'SELECT * FROM public.ocr_extracted_questions WHERE id = ANY($1::text[])',
        [questionIds]
      );
      const rowMap = new Map<string, any>(fetchRes.rows.map(r => [r.id, r]));

      for (const qId of questionIds) {
        const row = rowMap.get(qId);
        if (!row) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, reason: 'Question not found in database' });
          continue;
        }
        const eq = this.mapRowToExtractedQuestion(row);

        // Validate approval prerequisites
        if (!eq.question || eq.question.trim().length < 5) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Question text is missing or too short' });
          continue;
        }
        if (!eq.options || !Array.isArray(eq.options) || eq.options.length < 2) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Incomplete options set (< 2 options)' });
          continue;
        }
        if (eq.correctAnswer === undefined || eq.correctAnswer === null || eq.correctAnswer.trim() === '') {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Missing verified correct answer' });
          continue;
        }

        // Check option alignment if letter-based
        const optIds = eq.options.map(o => o.id?.toUpperCase());
        const ans = eq.correctAnswer.trim().toUpperCase();
        if (optIds.length > 0 && ['A', 'B', 'C', 'D', 'E'].includes(ans) && !optIds.includes(ans)) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: `Answer (${ans}) not found in options (${optIds.join(', ')})` });
          continue;
        }

        const finalSubjectId = targetMeta?.subjectId || eq.subjectId || 'sub_polity';
        const finalTopicId = targetMeta?.topicId || eq.topicId || 'top_rights';
        const finalConceptId = targetMeta?.conceptId || eq.conceptId || 'c_art32';
        const finalDifficulty = targetMeta?.difficulty || eq.difficulty || 'MEDIUM';
        const finalExamTag = targetMeta?.examTag || eq.examTag || null;
        const finalPyqYear = targetMeta?.pyqYear || eq.pyqYear || null;
        const finalDestination = targetMeta?.destination || eq.destination || 'PRACTICE_BANK';

        await client.query(
          `UPDATE public.ocr_extracted_questions 
           SET status = 'READY_TO_PUBLISH',
               subject_id = $1, topic_id = $2, concept_id = $3,
               difficulty = $4, exam_tag = $5, pyq_year = $6, destination = $7,
               updated_at = NOW()
           WHERE id = $8`,
          [finalSubjectId, finalTopicId, finalConceptId, finalDifficulty, finalExamTag, finalPyqYear, finalDestination, qId]
        );
        approvedIds.push(qId);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const effectiveJobId = jobId || (approvedIds.length > 0 ? (await this.getExtractedQuestionById(approvedIds[0]))?.jobId : undefined);
    if (effectiveJobId) {
      await this.recalculateJobCounts(effectiveJobId);
    }
    const refreshed = effectiveJobId ? await this.getQuestionsByJobId(effectiveJobId) : [];

    return {
      affectedCount: approvedIds.length,
      publishBlockedCount: rejectedIds.length,
      approvedIds,
      rejectedIds,
      blockedReasons,
      questions: refreshed,
    };
  }

  async bulkPublishQuestions(
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
    approvedIds: string[];
    rejectedIds: string[];
    blockedReasons: { questionId: string; questionNum?: number; reason: string }[];
    questions: ExtractedQuestionRecord[];
  }> {
    let affectedCount = 0;
    const approvedIds: string[] = [];
    const rejectedIds: string[] = [];
    const blockedReasons: { questionId: string; questionNum?: number; reason: string }[] = [];

    const fetchRes = await pool.query(
      'SELECT * FROM public.ocr_extracted_questions WHERE id = ANY($1::text[])',
      [questionIds]
    );
    const rowMap = new Map<string, any>(fetchRes.rows.map(r => [r.id, this.mapRowToExtractedQuestion(r)]));

    for (const qId of questionIds) {
      const eq = rowMap.get(qId);
      if (!eq) {
        rejectedIds.push(qId);
        blockedReasons.push({ questionId: qId, reason: 'Question not found in database' });
        continue;
      }

      if (!overrideWarnings) {
        if (!eq.question || eq.question.trim().length < 5) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Missing question text' });
          continue;
        }
        if (!eq.options || eq.options.length < 2) {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Incomplete options (< 2 options)' });
          continue;
        }
        if (eq.correctAnswer === undefined || eq.correctAnswer === null || eq.correctAnswer.trim() === '') {
          rejectedIds.push(qId);
          blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: 'Missing correct answer' });
          continue;
        }
      }

      const res = await this.approveAndPublishQuestion(qId, targetMeta);
      if (res.success) {
        affectedCount++;
        approvedIds.push(qId);
      } else {
        rejectedIds.push(qId);
        blockedReasons.push({ questionId: qId, questionNum: eq.questionNum, reason: res.error || 'Publish failed' });
      }
    }

    const effectiveJobId = jobId || (questionIds.length > 0 ? (await this.getExtractedQuestionById(questionIds[0]))?.jobId : undefined);
    if (effectiveJobId) {
      await this.recalculateJobCounts(effectiveJobId);
    }
    const refreshed = effectiveJobId ? await this.getQuestionsByJobId(effectiveJobId) : [];

    return {
      affectedCount,
      publishBlockedCount: rejectedIds.length,
      approvedIds,
      rejectedIds,
      blockedReasons,
      questions: refreshed,
    };
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
    const res = await this.bulkPublishQuestions(jobId, questionIds, targetMeta, overrideWarnings);
    return {
      affectedCount: res.affectedCount,
      publishBlockedCount: res.publishBlockedCount,
      blockedReasons: res.blockedReasons,
    };
  }

  async deleteExtractedQuestion(questionId: string): Promise<boolean> {
    const eq = await this.getExtractedQuestionById(questionId);
    if (!eq) return false;
    await pool.query('DELETE FROM public.ocr_extracted_questions WHERE id = $1', [questionId]);
    await this.recalculateJobCounts(eq.jobId);
    return true;
  }

  async bulkDeleteQuestions(jobId: string, questionIds: string[]): Promise<number> {
    if (!questionIds || questionIds.length === 0) return 0;
    const res = await pool.query('DELETE FROM public.ocr_extracted_questions WHERE id = ANY($1)', [questionIds]);
    const deletedCount = res.rowCount || 0;
    const effectiveJobId = jobId || (questionIds.length > 0 ? (await this.getExtractedQuestionById(questionIds[0]))?.jobId : undefined);
    if (effectiveJobId) {
      await this.recalculateJobCounts(effectiveJobId);
    }
    return deletedCount;
  }

  async rejectQuestion(questionId: string): Promise<boolean> {
    const eq = await this.getExtractedQuestionById(questionId);
    if (!eq) return false;

    await this.updateExtractedQuestion(questionId, { status: 'ARCHIVED' as any, isPublished: false });
    await this.recalculateJobCounts(eq.jobId);
    return true;
  }

  async bulkRejectQuestions(jobId: string, questionIds: string[]): Promise<number> {
    if (!questionIds.length) return 0;
    try {
      const res = await pool.query(
        `UPDATE public.ocr_extracted_questions
         SET status = 'REJECTED', updated_at = NOW()
         WHERE id = ANY($1::text[])`,
        [questionIds]
      );
      await this.recalculateJobCounts(jobId);
      return res.rowCount || 0;
    } catch (err: any) {
      console.warn('[OcrRepository] bulkRejectQuestions batch update notice (using sequential fallback):', err.message);
      let count = 0;
      for (const qId of questionIds) {
        const ok = await this.rejectQuestion(qId);
        if (ok) count++;
      }
      return count;
    }
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
      strategy: row.strategy || 'TEXT_EXTRACTION',
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
      documentHash: row.document_hash || undefined,
      officialSourceUrl: row.official_source_url || undefined,
      sourceDomain: row.source_domain || undefined,
      commission: row.commission || undefined,
      paper: row.paper || undefined,
      year: row.year ? Number(row.year) : undefined,
      examCycle: row.exam_cycle || undefined,
      parserVersion: row.parser_version || 'v2.1',
      ocrEngineVersion: row.ocr_engine_version || 'deterministic_pdfparse_v2',
      structureReport: typeof row.structure_report === 'object' && row.structure_report !== null
        ? row.structure_report
        : typeof row.structure_report === 'string'
        ? JSON.parse(row.structure_report)
        : {},
      answerKeyStatus: row.answer_key_status || 'ANSWER_KEY_PENDING',
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

    const statements = Array.isArray(row.statements)
      ? row.statements
      : typeof row.statements === 'string'
      ? JSON.parse(row.statements)
      : undefined;

    const statements_hi = Array.isArray(row.statements_hi)
      ? row.statements_hi
      : typeof row.statements_hi === 'string'
      ? JSON.parse(row.statements_hi)
      : undefined;

    const matchData = typeof row.match_data === 'object' && row.match_data !== null && Object.keys(row.match_data).length > 0
      ? row.match_data
      : typeof row.match_data === 'string' && row.match_data !== '{}'
      ? JSON.parse(row.match_data)
      : undefined;

    const matchData_hi = typeof row.match_data_hi === 'object' && row.match_data_hi !== null && Object.keys(row.match_data_hi).length > 0
      ? row.match_data_hi
      : typeof row.match_data_hi === 'string' && row.match_data_hi !== '{}'
      ? JSON.parse(row.match_data_hi)
      : undefined;

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
      questionType: row.question_type || (matchData ? 'MATCH_FOLLOWING' : (statements && statements.length > 0 ? 'STATEMENT_BASED' : 'SINGLE_CHOICE')),
      question: row.question_text,
      question_en: row.question_en || undefined,
      question_hi: row.question_hi || undefined,
      statements,
      statements_hi,
      matchData,
      matchData_hi,
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
      aiAssisted: row.ai_assisted || false,
      parseConfidence: row.parse_confidence !== undefined ? row.parse_confidence : 1.0,
      structureStatus: row.structure_status || 'AUTO_VERIFIED',
      answerKeyStatus: row.answer_key_status || (row.correct_answer ? 'ANSWER_BOUND' : 'ANSWER_PENDING'),
      solutionSource: row.solution_source || undefined,
      solutionPageNumber: row.solution_page_number ? Number(row.solution_page_number) : undefined,
      solutionQuestionNumber: row.solution_question_number ? Number(row.solution_question_number) : undefined,
      isPublished: row.status === 'PUBLISHED' || row.status === 'APPROVED',
      originalOcrText: row.original_ocr_text || undefined,
      originalOptions: Array.isArray(row.original_options)
        ? row.original_options
        : typeof row.original_options === 'string'
        ? JSON.parse(row.original_options)
        : undefined,
      imageUrl: row.image_url || undefined,
      imageCaption: row.image_caption || undefined,
      figureStatus: row.figure_status || (row.image_url ? 'FIGURE_VERIFIED' : (row.has_visual_content ? 'FIGURE_REVIEW_REQUIRED' : 'FIGURE_NOT_REQUIRED')),
      correctionsCount: row.corrections_count ? Number(row.corrections_count) : 0,
      lastCorrectedAt: row.last_corrected_at || undefined,
      lastCorrectedBy: row.last_corrected_by || undefined,
    };
  }
}

export const ocrRepository = new OcrRepository();

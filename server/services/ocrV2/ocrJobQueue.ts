import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { OcrV2JobInput, OcrV2Progress, OcrV2Diagnostics } from './ocrTypes.js';
import { ocrEngineV2 } from './ocrEngineV2.js';
import { questionSegmenterV2 } from './questionSegmenterV2.js';
import { ocrRepository, ExtractedQuestionRecord } from '../../repositories/OcrRepository.js';
import { QuestionStatus, PublishDestination } from '../../../src/types/index.js';

export class OcrJobQueue {
  private static instance: OcrJobQueue;
  private queue: OcrV2JobInput[] = [];
  private activeJob: OcrV2JobInput | null = null;
  private isProcessing = false;

  public static getInstance(): OcrJobQueue {
    if (!OcrJobQueue.instance) {
      OcrJobQueue.instance = new OcrJobQueue();
    }
    return OcrJobQueue.instance;
  }

  public getQueueStatus() {
    return {
      activeJobId: this.activeJob ? this.activeJob.jobId : null,
      queueLength: this.queue.length,
      queuedJobIds: this.queue.map(j => j.jobId),
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Enqueue job for deterministic FIFO execution with bounded concurrency (strictly 1 at a time).
   */
  public async enqueueJob(input: OcrV2JobInput): Promise<void> {
    // Avoid double enqueuing
    if (this.activeJob?.jobId === input.jobId || this.queue.some(j => j.jobId === input.jobId)) {
      console.log(`[OcrJobQueue] Job ${input.jobId} already enqueued or running.`);
      return;
    }

    this.queue.push(input);
    console.log(`[OcrJobQueue] Enqueued job ${input.jobId}. Total pending in queue: ${this.queue.length}`);

    // Trigger queue processor asynchronously
    setImmediate(() => {
      this.processNext().catch(err => {
        console.error('[OcrJobQueue] Unhandled error in processNext loop:', err);
      });
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    if (this.queue.length === 0) {
      this.activeJob = null;
      return;
    }

    this.isProcessing = true;
    this.activeJob = this.queue.shift() || null;

    if (!this.activeJob) {
      this.isProcessing = false;
      return;
    }

    const job = this.activeJob;
    const tempDir = path.join(process.cwd(), 'data', 'ocr_temp', job.jobId);

    try {
      console.log(`\n==================================================`);
      console.log(`[OCR V2 Worker] Starting Job: ${job.jobId}`);
      console.log(`Mode: ${job.mode} | Exam: ${job.exam} | Lang: ${job.documentLanguage}`);
      console.log(`==================================================\n`);

      await this.runJob(job, tempDir);
    } catch (jobErr: any) {
      console.error(`[OCR V2 Worker] Fatal job failure for ${job.jobId}:`, jobErr);
      await this.handleJobFailure(job, jobErr);
    } finally {
      // Clean temporary directory
      this.cleanTempDir(tempDir, job.keepOriginalPdf);
      this.activeJob = null;
      this.isProcessing = false;

      // Continue processing next job in queue if any
      if (this.queue.length > 0) {
        setImmediate(() => {
          this.processNext().catch(e => console.error('[OcrJobQueue] Error scheduling next job:', e));
        });
      }
    }
  }

  /**
   * Main pipeline execution for an OCR V2 Job.
   */
  private async runJob(job: OcrV2JobInput, tempDir: string): Promise<void> {
    const jobStartTime = Date.now();
    const diagnostics: OcrV2Diagnostics = {
      pdfSizeMb: 0,
      pageCount: 0,
      pdfType: 'SCANNED_PDF',
    };

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // -------------------------------------------------------------
    // STAGE 1: VALIDATING
    // -------------------------------------------------------------
    await this.updateProgress(job.jobId, {
      stage: 'VALIDATING',
      currentPage: 0,
      totalPages: 0,
      pagesCompleted: 0,
      percentage: 2,
      detectedQuestions: 0,
      answerMatches: 0,
      reviewCount: 0,
      startedAt: new Date(jobStartTime).toISOString(),
      updatedAt: new Date().toISOString(),
      strategyUsed: 'OCR_V2_DETERMINISTIC_CLI',
    });

    const sysStatus = ocrEngineV2.checkSystemDependencies();
    if (!sysStatus.ok) {
      throw new Error(`OCR System binary check failed: ${sysStatus.error}`);
    }

    diagnostics.tesseractVersion = sysStatus.tesseractVersion;
    diagnostics.gsVersion = sysStatus.gsVersion;
    diagnostics.popplerVersion = sysStatus.popplerVersion;

    // Locate or write Question PDF
    let questionPdfPath = job.questionPdfPath;
    if (!questionPdfPath || !fs.existsSync(questionPdfPath)) {
      if (job.questionPdfBase64) {
        questionPdfPath = path.join(tempDir, 'question.pdf');
        const cleanB64 = job.questionPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        fs.writeFileSync(questionPdfPath, Buffer.from(cleanB64, 'base64'));
      } else {
        throw new Error('Question PDF was not provided or could not be found.');
      }
    }

    const inspectRes = await ocrEngineV2.inspectPdf(questionPdfPath);
    const totalPages = inspectRes.pageCount;
    diagnostics.pdfSizeMb = Number((inspectRes.fileSizeBytes / (1024 * 1024)).toFixed(2));
    diagnostics.pageCount = totalPages;
    diagnostics.pdfType = inspectRes.pdfType;

    console.log(`[OCR V2 Worker] PDF Inspected: ${totalPages} pages, ${diagnostics.pdfSizeMb} MB, Type: ${inspectRes.pdfType}`);

    const pagesText: Array<{ pageNum: number; text: string }> = [];
    let totalRenderMs = 0;
    let totalTessMs = 0;

    // -------------------------------------------------------------
    // STAGE 2: EXTRACTION (Fast TEXT_PDF vs Page-by-Page SCANNED_PDF)
    // -------------------------------------------------------------
    if (inspectRes.pdfType === 'TEXT_PDF') {
      await this.updateProgress(job.jobId, {
        stage: 'EXTRACTING',
        currentPage: 0,
        totalPages,
        pagesCompleted: 0,
        percentage: 10,
        detectedQuestions: 0,
        answerMatches: 0,
        reviewCount: 0,
        startedAt: new Date(jobStartTime).toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const parseStart = Date.now();
      const rawText = await ocrEngineV2.extractTextWithPoppler(questionPdfPath);
      diagnostics.parsingTimeMs = Date.now() - parseStart;

      // Split text roughly per form feed or treat as multi-page stream
      const rawPages = rawText.split('\x0C');
      for (let p = 0; p < rawPages.length; p++) {
        if (rawPages[p].trim().length > 0) {
          pagesText.push({ pageNum: p + 1, text: rawPages[p] });
        }
      }
    } else {
      // Scanned PDF: Render page-by-page using Ghostscript + Tesseract CLI
      for (let p = 1; p <= totalPages; p++) {
        const percent = Math.min(90, Math.round(5 + ((p - 1) / totalPages) * 80));

        await this.updateProgress(job.jobId, {
          stage: 'OCR_PROCESSING',
          currentPage: p,
          totalPages,
          pagesCompleted: p - 1,
          percentage: percent,
          detectedQuestions: 0,
          answerMatches: 0,
          reviewCount: 0,
          startedAt: new Date(jobStartTime).toISOString(),
          updatedAt: new Date().toISOString(),
        });

        const pagePngPath = path.join(tempDir, `page_${p}.png`);
        const pageOutBase = path.join(tempDir, `page_${p}_out`);

        try {
          // Render single page
          const renderRes = await ocrEngineV2.renderSinglePage(questionPdfPath, p, pagePngPath, 150);
          totalRenderMs += renderRes.renderTimeMs;

          // OCR single page image
          const ocrRes = await ocrEngineV2.ocrPageImage(pagePngPath, pageOutBase, job.documentLanguage, 3);
          totalTessMs += ocrRes.ocrTimeMs;

          pagesText.push({
            pageNum: p,
            text: ocrRes.text,
          });

          console.log(`[OCR V2 Worker] Page ${p}/${totalPages} completed (Render: ${renderRes.renderTimeMs}ms, OCR: ${ocrRes.ocrTimeMs}ms, Chars: ${ocrRes.text.length})`);
        } catch (pageErr: any) {
          console.warn(`[OCR V2 Worker] Warning: Failed processing page ${p}: ${pageErr.message}`);
          pagesText.push({
            pageNum: p,
            text: '',
          });
        } finally {
          // Always delete the PNG immediately to keep disk/RAM footprint ultra small
          try { if (fs.existsSync(pagePngPath)) fs.unlinkSync(pagePngPath); } catch {}
          try { if (fs.existsSync(`${pageOutBase}.txt`)) fs.unlinkSync(`${pageOutBase}.txt`); } catch {}
        }
      }

      diagnostics.avgRenderTimeMs = Math.round(totalRenderMs / Math.max(totalPages, 1));
      diagnostics.avgTesseractTimeMs = Math.round(totalTessMs / Math.max(totalPages, 1));
      diagnostics.totalOcrTimeMs = totalRenderMs + totalTessMs;
    }

    // -------------------------------------------------------------
    // STAGE 3: SEGMENTATION
    // -------------------------------------------------------------
    await this.updateProgress(job.jobId, {
      stage: 'SEGMENTING',
      currentPage: totalPages,
      totalPages,
      pagesCompleted: totalPages,
      percentage: 88,
      detectedQuestions: 0,
      answerMatches: 0,
      reviewCount: 0,
      startedAt: new Date(jobStartTime).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const segStart = Date.now();
    // Check for external answer key (e.g. from answerTextRaw or separate answer PDF)
    const externalAnswerMap: Record<number, { correctOption: string; explanation?: string }> = {};

    if (job.mode === 'SEPARATE_PDFS' || job.answerTextRaw) {
      await this.parseExternalAnswerKey(job, tempDir, externalAnswerMap);
    }

    const segResult = questionSegmenterV2.parseQuestions(pagesText, {
      totalExpectedQuestions: job.totalExpectedQuestions,
      exam: job.exam,
      documentLanguage: job.documentLanguage,
      externalAnswerMap,
    });

    diagnostics.segmentationTimeMs = Date.now() - segStart;
    console.log(`[OCR V2 Worker] Segmentation completed: ${segResult.detectedCount} questions detected, ${segResult.answerMatchedCount} answers matched.`);

    // -------------------------------------------------------------
    // STAGE 4: ANSWER BINDING & VERIFICATION
    // -------------------------------------------------------------
    await this.updateProgress(job.jobId, {
      stage: 'ANSWER_BINDING',
      currentPage: totalPages,
      totalPages,
      pagesCompleted: totalPages,
      percentage: 92,
      detectedQuestions: segResult.detectedCount,
      answerMatches: segResult.answerMatchedCount,
      reviewCount: segResult.reviewRequiredCount,
      startedAt: new Date(jobStartTime).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // -------------------------------------------------------------
    // STAGE 5: DATABASE STAGING
    // -------------------------------------------------------------
    await this.updateProgress(job.jobId, {
      stage: 'STAGING',
      currentPage: totalPages,
      totalPages,
      pagesCompleted: totalPages,
      percentage: 96,
      detectedQuestions: segResult.detectedCount,
      answerMatches: segResult.answerMatchedCount,
      reviewCount: segResult.reviewRequiredCount,
      startedAt: new Date(jobStartTime).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const stagingStart = Date.now();
    const extractedRecords: ExtractedQuestionRecord[] = segResult.questions.map((q, idx) => {
      const qId = `ocr_q_${job.jobId}_${q.questionNumber || idx + 1}_${crypto.randomBytes(3).toString('hex')}`;
      return {
        id: qId,
        jobId: job.jobId,
        questionNumber: q.questionNumber,
        questionNum: q.questionNumber,
        pageNumber: q.pageNumber,
        type: (q.questionType as any) || 'MCQ',
        question: q.questionEn || q.questionText || '',
        questionText: q.questionText,
        questionEn: q.questionEn,
        questionHi: q.questionHi,
        options: q.options,
        optionsEn: q.optionsEn,
        optionsHi: q.optionsHi,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        explanationEn: q.explanationEn || '',
        explanationHi: q.explanationHi || '',
        availableLanguages: ['en'],
        subjectId: job.subjectId,
        topicId: job.topicId,
        conceptId: job.conceptId,
        difficulty: job.difficulty,
        examTag: job.examTag,
        pyqYear: job.pyqYear,
        source: 'OCR_IMPORTED',
        isPyq: true,
        isPublished: false,
        hasVisualContent: false,
        fieldConfidence: {
          question: q.confidence >= 0.85 ? 'HIGH' : q.confidence >= 0.65 ? 'MEDIUM' : 'LOW',
          options: q.confidence >= 0.85 ? 'HIGH' : q.confidence >= 0.65 ? 'MEDIUM' : 'LOW',
          answer: q.correctAnswer ? 'HIGH' : 'LOW',
          explanation: q.explanation ? 'HIGH' : 'LOW',
        },
        ocrConfidence: q.confidence,
        status: (q.status === 'FLAGGED' ? 'NEEDS_REVIEW' : q.status) as QuestionStatus,
        destination: 'PRACTICE_BANK' as PublishDestination,
        validationErrors: q.validationErrors,
        duplicateWarning: null,
        questionType: q.questionType,
        statements: q.statements?.map((st: any, sIdx: number) =>
          typeof st === 'string' ? { id: sIdx + 1, text: st } : st
        ),
        statements_hi: q.statementsHi?.map((st: any, sIdx: number) =>
          typeof st === 'string' ? { id: sIdx + 1, text: st } : st
        ),
        matchData: q.matchData
          ? {
              leftColumn: (q.matchData.listI || []).map((t: string, i: number) => ({
                key: String.fromCharCode(65 + i),
                text: t,
              })),
              rightColumn: (q.matchData.listII || []).map((t: string, i: number) => ({
                key: String(i + 1),
                text: t,
              })),
              codes: [],
              leftHeader: 'List I',
              rightHeader: 'List II',
            }
          : undefined,
        officialSourceUrl: job.officialSourceUrl,
        aiAssisted: false,
        parseConfidence: q.confidence,
        structureStatus: q.validationErrors.length === 0 ? 'AUTO_VERIFIED' : 'NEEDS_REVIEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    await ocrRepository.saveExtractedQuestions(job.jobId, extractedRecords);
    diagnostics.dbStagingTimeMs = Date.now() - stagingStart;
    diagnostics.totalJobTimeMs = Date.now() - jobStartTime;

    // -------------------------------------------------------------
    // CANONICAL SEQUENCE & COMPLETENESS DIAGNOSTICS
    // -------------------------------------------------------------
    const expectedCount = job.totalExpectedQuestions || (job.exam === 'BPSC' ? 150 : 100);
    const detectedNums = extractedRecords
      .map(r => r.questionNum || r.questionNumber)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));

    const detectedSet = new Set<number>();
    const dupSet = new Set<number>();
    for (const n of detectedNums) {
      if (detectedSet.has(n)) dupSet.add(n);
      else detectedSet.add(n);
    }
    const missingQuestionNumbers: number[] = [];
    for (let i = 1; i <= expectedCount; i++) {
      if (!detectedSet.has(i)) {
        missingQuestionNumbers.push(i);
      }
    }
    const duplicateQuestionNumbers = Array.from(dupSet).sort((a, b) => a - b);

    // Attach canonical sequence stats to diagnostics
    (diagnostics as any).missingQuestionNums = missingQuestionNumbers;
    (diagnostics as any).duplicateQuestionNums = duplicateQuestionNumbers;
    (diagnostics as any).totalExpected = expectedCount;
    (diagnostics as any).totalDetected = extractedRecords.length;

    // -------------------------------------------------------------
    // STAGE 6: COMPLETION
    // -------------------------------------------------------------
    const finalStatus = (segResult.reviewRequiredCount > 0 || missingQuestionNumbers.length > 0) ? 'REVIEW_REQUIRED' : 'COMPLETED';

    await this.updateProgress(
      job.jobId,
      {
        stage: 'COMPLETED',
        currentPage: totalPages,
        totalPages,
        pagesCompleted: totalPages,
        percentage: 100,
        detectedQuestions: segResult.detectedCount,
        answerMatches: segResult.answerMatchedCount,
        reviewCount: segResult.reviewRequiredCount,
        startedAt: new Date(jobStartTime).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        diagnostics,
      },
      finalStatus,
      {
        missingQuestionNumbers,
        duplicateQuestionNumbers,
        detectedQuestionsCount: extractedRecords.length,
        expectedQuestionCount: expectedCount,
      }
    );

    console.log(`\n==================================================`);
    console.log(`[OCR V2 Worker] Job ${job.jobId} FINISHED SUCCESSFULLY`);
    console.log(`Final Status: ${finalStatus} | Total Questions: ${segResult.detectedCount}`);
    console.log(`Answer Matches: ${segResult.answerMatchedCount} | Review Needed: ${segResult.reviewRequiredCount}`);
    console.log(`Total Duration: ${(diagnostics.totalJobTimeMs / 1000).toFixed(1)}s`);
    console.log(`==================================================\n`);
  }

  /**
   * Helper to parse external answer keys if separate answer PDF or text is supplied.
   */
  private async parseExternalAnswerKey(
    job: OcrV2JobInput,
    tempDir: string,
    answerMap: Record<number, { correctOption: string; explanation?: string }>
  ): Promise<void> {
    let answerText = job.answerTextRaw || '';

    if (!answerText && (job.answerPdfPath || job.answerPdfBase64)) {
      let ansPdf = job.answerPdfPath;
      if (!ansPdf && job.answerPdfBase64) {
        ansPdf = path.join(tempDir, 'answer.pdf');
        const cleanB64 = job.answerPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        fs.writeFileSync(ansPdf, Buffer.from(cleanB64, 'base64'));
      }

      if (ansPdf && fs.existsSync(ansPdf)) {
        try {
          const ansInspect = await ocrEngineV2.inspectPdf(ansPdf);
          if (ansInspect.pdfType === 'TEXT_PDF') {
            answerText = await ocrEngineV2.extractTextWithPoppler(ansPdf);
          } else {
            // For scanned answer keys (typically 1-3 pages)
            for (let p = 1; p <= Math.min(ansInspect.pageCount, 5); p++) {
              const pImg = path.join(tempDir, `ans_p_${p}.png`);
              const pOut = path.join(tempDir, `ans_p_${p}_out`);
              try {
                await ocrEngineV2.renderSinglePage(ansPdf, p, pImg, 150);
                const r = await ocrEngineV2.ocrPageImage(pImg, pOut, 'AUTO', 3);
                answerText += '\n' + r.text;
              } finally {
                try { if (fs.existsSync(pImg)) fs.unlinkSync(pImg); } catch {}
              }
            }
          }
        } catch (ansErr) {
          console.warn('[OCR V2 Worker] Failed to extract separate answer PDF:', ansErr);
        }
      }
    }

    if (answerText) {
      // Match patterns: "1. B", "1: B", "1 - C", "Q1: A", "Q1 (A)"
      const lines = answerText.split('\n');
      for (const line of lines) {
        const m = line.match(/(?:Q(?:uestion)?)?\s*0*(\d{1,3})\s*[\.\:\-\)\s]+\(?([A-Ea-e1-5])\)?(?:\s+(.*))?/i);
        if (m) {
          const qNum = parseInt(m[1], 10);
          let opt = m[2].toUpperCase();
          if (opt === '1') opt = 'A';
          else if (opt === '2') opt = 'B';
          else if (opt === '3') opt = 'C';
          else if (opt === '4') opt = 'D';
          else if (opt === '5') opt = 'E';

          const expl = (m[3] || '').trim();
          if (['A', 'B', 'C', 'D', 'E'].includes(opt)) {
            answerMap[qNum] = {
              correctOption: opt,
              explanation: expl.length > 5 ? expl : undefined,
            };
          }
        }
      }
    }
  }

  /**
   * Update live job progress in database and in-memory review_state.
   */
  private async updateProgress(
    jobId: string,
    progress: OcrV2Progress,
    statusOverride?: string,
    extraUpdates?: Record<string, any>
  ): Promise<void> {
    try {
      const existing = await ocrRepository.getJobById(jobId);
      if (!existing) return;

      const mergedReviewState = {
        ...(existing.reviewState || {}),
        ...progress,
      };

      const status = statusOverride || (progress.stage === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING');

      await ocrRepository.updateJob(jobId, {
        status,
        processedPages: progress.pagesCompleted,
        pageCount: Math.max(existing.pageCount || 0, progress.totalPages),
        detectedQuestionsCount: progress.detectedQuestions,
        reviewState: mergedReviewState,
        ...(extraUpdates || {}),
      });
    } catch (err) {
      console.warn(`[OCR V2 Worker] Failed to update progress for job ${jobId}:`, err);
    }
  }

  /**
   * Handle fatal job failure cleanly without crashing the server.
   */
  private async handleJobFailure(job: OcrV2JobInput, err: any): Promise<void> {
    try {
      const errMsg = err?.message || String(err);
      await ocrRepository.updateJob(job.jobId, {
        status: 'FAILED',
        errorMessage: errMsg,
        reviewState: {
          stage: 'FAILED',
          errorStage: 'EXECUTION',
          errorMessage: errMsg,
          failedAt: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.error(`[OCR V2 Worker] Failed saving failure state for ${job.jobId}:`, dbErr);
    }
  }

  /**
   * Clean temporary directory.
   */
  private cleanTempDir(dirPath: string, keepOriginalPdf: boolean): void {
    try {
      if (!fs.existsSync(dirPath)) return;

      if (!keepOriginalPdf) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`[OCR V2 Worker] Cleaned temporary directory: ${dirPath}`);
      } else {
        // Keep question.pdf, delete intermediate png/txt
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file !== 'question.pdf') {
            try { fs.unlinkSync(path.join(dirPath, file)); } catch {}
          }
        }
        console.log(`[OCR V2 Worker] Retained original question.pdf in: ${dirPath}`);
      }
    } catch (err) {
      console.warn(`[OCR V2 Worker] Failed cleaning temp dir ${dirPath}:`, err);
    }
  }
}

export const ocrJobQueue = OcrJobQueue.getInstance();

import crypto from 'crypto';
import pool from '../db/pool.js';
import { upscDiscoveryAdapter } from './UpscDiscoveryAdapter.js';
import { bpscDiscoveryAdapter } from './BpscDiscoveryAdapter.js';
import { universalPyqIngestionEngine, IngestionResult } from './UniversalPyqIngestionEngine.js';

export interface IngestionRunSummary {
  runId: string;
  commission: 'UPSC' | 'BPSC' | 'ALL';
  scanType: 'SCHEDULED' | 'MANUAL' | 'TRIGGERED';
  status: 'SUCCESS' | 'NO_NEW_PAPERS' | 'SOURCE_SCAN_FAILED' | 'PARTIAL_SUCCESS' | 'ERROR';
  discoveredCount: number;
  newPapersCount: number;
  processedCount: number;
  failedCount: number;
  results: IngestionResult[];
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
}

export class PyqScheduler {
  private static instance: PyqScheduler;
  private isScanning = false;
  private timer: NodeJS.Timeout | null = null;

  public static getInstance(): PyqScheduler {
    if (!PyqScheduler.instance) {
      PyqScheduler.instance = new PyqScheduler();
    }
    return PyqScheduler.instance;
  }

  /**
   * Start the automated background discovery scan (e.g. runs every 24 hours)
   */
  public startBackgroundScheduler(intervalHours = 24): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    console.log(`[PyqScheduler] Background discovery scheduler initialized (interval: ${intervalHours}h).`);
    
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      console.log('[PyqScheduler] Triggering periodic scheduled PYQ discovery scan...');
      this.runDiscoveryScan('ALL', 'SCHEDULED').catch(err => {
        console.error('[PyqScheduler] Scheduled discovery scan error:', err);
      });
    }, intervalMs);
  }

  /**
   * Stop background scheduler
   */
  public stopBackgroundScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Execute full discovery scan across UPSC and/or BPSC
   */
  public async runDiscoveryScan(
    targetCommission: 'UPSC' | 'BPSC' | 'ALL' = 'ALL',
    scanType: 'SCHEDULED' | 'MANUAL' | 'TRIGGERED' = 'MANUAL'
  ): Promise<IngestionRunSummary> {
    if (this.isScanning) {
      console.warn('[PyqScheduler] A discovery scan is already in progress.');
      throw new Error('A discovery scan is currently in progress. Please wait for it to complete.');
    }

    this.isScanning = true;
    const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const startedAt = new Date().toISOString();
    const results: IngestionResult[] = [];
    let discoveredCount = 0;
    let newPapersCount = 0;
    let processedCount = 0;
    let failedCount = 0;
    let errorMessage: string | undefined;

    console.log(`[PyqScheduler] [${runId}] Starting discovery scan for commission: ${targetCommission} (type: ${scanType})...`);

    try {
      const papersToProcess: any[] = [];

      // 1. Discover UPSC Papers
      if (targetCommission === 'UPSC' || targetCommission === 'ALL') {
        try {
          const upscPapers = await upscDiscoveryAdapter.discoverAllUpscPapers();
          discoveredCount += upscPapers.length;
          papersToProcess.push(...upscPapers);
        } catch (err: any) {
          console.error('[PyqScheduler] Error during UPSC discovery:', err);
          errorMessage = `UPSC discovery error: ${err.message}`;
        }
      }

      // 2. Discover BPSC Papers
      if (targetCommission === 'BPSC' || targetCommission === 'ALL') {
        try {
          const bpscPapers = await bpscDiscoveryAdapter.discoverAllCcePapers();
          discoveredCount += bpscPapers.length;
          papersToProcess.push(...bpscPapers);
        } catch (err: any) {
          console.error('[PyqScheduler] Error during BPSC discovery:', err);
          errorMessage = (errorMessage ? `${errorMessage}; ` : '') + `BPSC discovery error: ${err.message}`;
        }
      }

      // 3. Process each discovered paper through the Universal Ingestion Engine
      for (const paper of papersToProcess) {
        try {
          // Check if paper already exists in DB
          const checkRes = await pool.query(
            'SELECT id, status, actual_question_count, expected_question_count FROM public.pyq_papers WHERE id = $1',
            [paper.id]
          );
          const isNew = checkRes.rows.length === 0;
          if (isNew) {
            newPapersCount++;
          }

          const res = await universalPyqIngestionEngine.processDiscoveredPaper(paper);
          results.push(res);

          if (res.success) {
            processedCount++;
          } else {
            failedCount++;
          }
        } catch (procErr: any) {
          console.error(`[PyqScheduler] Ingestion error on ${paper.id}:`, procErr);
          failedCount++;
          results.push({
            success: false,
            paperId: paper.id,
            exam: paper.exam,
            year: paper.year,
            cycle: paper.examCycle,
            paper: paper.paper,
            status: 'PARSING_FAILED',
            expectedCount: paper.expectedQuestionCount,
            detectedCount: 0,
            verifiedCount: 0,
            error: procErr.message
          });
        }
      }

      let status: 'SUCCESS' | 'NO_NEW_PAPERS' | 'SOURCE_SCAN_FAILED' | 'PARTIAL_SUCCESS' | 'ERROR' = 'SUCCESS';
      if (discoveredCount === 0 && errorMessage) {
        status = 'SOURCE_SCAN_FAILED';
      } else if (newPapersCount === 0 && failedCount === 0) {
        status = 'NO_NEW_PAPERS';
      } else if (failedCount > 0 && processedCount > 0) {
        status = 'PARTIAL_SUCCESS';
      } else if (failedCount > 0 && processedCount === 0) {
        status = 'ERROR';
      }

      const completedAt = new Date().toISOString();

      // 4. Log the Ingestion Run
      await pool.query(`
        INSERT INTO public.pyq_ingestion_runs (
          id, commission, scan_type, status, discovered_count, new_papers_count,
          processed_count, failed_count, details, error_message, started_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        runId,
        targetCommission,
        scanType,
        status,
        discoveredCount,
        newPapersCount,
        processedCount,
        failedCount,
        JSON.stringify(results),
        errorMessage || null,
        startedAt,
        completedAt
      ]);

      const summary: IngestionRunSummary = {
        runId,
        commission: targetCommission,
        scanType,
        status,
        discoveredCount,
        newPapersCount,
        processedCount,
        failedCount,
        results,
        errorMessage,
        startedAt,
        completedAt
      };

      console.log(`[PyqScheduler] [${runId}] Scan completed. Status: ${status} (Discovered: ${discoveredCount}, Processed: ${processedCount}, Failed: ${failedCount}).`);
      return summary;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Fetch recent ingestion runs
   */
  public async getRecentRuns(limit = 10): Promise<any[]> {
    const res = await pool.query(
      'SELECT * FROM public.pyq_ingestion_runs ORDER BY started_at DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  }
}

export const pyqScheduler = PyqScheduler.getInstance();

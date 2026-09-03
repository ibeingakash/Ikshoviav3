import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import type { Request, Response } from 'express';
import { dataApiService } from './dataApiService.js';

const FASTAPI_HOST = process.env.FASTAPI_HOST || '127.0.0.1';
const FASTAPI_PORT = Number(process.env.FASTAPI_PORT) || 8001;
const FASTAPI_BASE_URL = `http://${FASTAPI_HOST}:${FASTAPI_PORT}`;

let fastApiProcess: ChildProcess | null = null;
let isStarting = false;
let cleanupRegistered = false;

let fastApiHealthy = false;
let lastHealthCheck = 0;

/**
 * Checks if the internal FastAPI service is already alive and accepting requests.
 */
export async function isFastApiAlive(timeoutMs = 500): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < 10000 && !fastApiHealthy) {
    return false;
  }
  lastHealthCheck = now;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    fastApiHealthy = response.ok || response.status === 200;
    return fastApiHealthy;
  } catch {
    fastApiHealthy = false;
    return false;
  }
}

/**
 * Handles Data API requests via native PostgreSQL service fallback.
 */
export async function handleDataApiFallback(
  req: Request,
  res: Response,
  targetPath: string
): Promise<void> {
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const method = req.method.toUpperCase();

  // 1. Health
  if (cleanPath === '/api/v1/health') {
    return dataApiService.handleHealth(req, res);
  }

  // 2. Ingestion
  if (cleanPath === '/api/v1/ingestion/run' && method === 'POST') {
    return dataApiService.runIngestion(req, res);
  }

  // 3. Search
  if (cleanPath === '/api/v1/search' && method === 'GET') {
    return dataApiService.searchKnowledge(req, res);
  }

  // 4. AI Tutor
  if (cleanPath === '/api/v1/ai/tutor' && method === 'POST') {
    return dataApiService.handleAiTutor(req, res);
  }

  // 5. Sources
  if (cleanPath === '/api/v1/sources') {
    if (method === 'GET') return dataApiService.listSources(req, res);
    if (method === 'POST') return dataApiService.createSource(req, res);
  }
  if (cleanPath.startsWith('/api/v1/sources/')) {
    const sourceId = decodeURIComponent(cleanPath.replace('/api/v1/sources/', ''));
    if (method === 'GET') return dataApiService.getSource(req, res, sourceId);
  }

  // 6. Resources
  if (cleanPath === '/api/v1/resources') {
    if (method === 'GET') return dataApiService.listResources(req, res);
    if (method === 'POST') return dataApiService.createResource(req, res);
  }
  if (cleanPath.startsWith('/api/v1/resources/')) {
    const resourceId = decodeURIComponent(cleanPath.replace('/api/v1/resources/', ''));
    if (method === 'GET') return dataApiService.getResource(req, res, resourceId);
  }

  // 7. Documents
  if (cleanPath === '/api/v1/documents') {
    if (method === 'GET') return dataApiService.listDocuments(req, res);
    if (method === 'POST') return dataApiService.createDocument(req, res);
  }
  if (cleanPath.startsWith('/api/v1/documents/')) {
    const documentId = decodeURIComponent(cleanPath.replace('/api/v1/documents/', ''));
    if (method === 'GET') return dataApiService.getDocument(req, res, documentId);
  }

  // 8. Chunks
  if (cleanPath === '/api/v1/chunks') {
    if (method === 'GET') return dataApiService.listChunks(req, res);
    if (method === 'POST') return dataApiService.createChunk(req, res);
  }
  if (cleanPath.startsWith('/api/v1/chunks/')) {
    const chunkId = decodeURIComponent(cleanPath.replace('/api/v1/chunks/', ''));
    if (method === 'GET') return dataApiService.getChunk(req, res, chunkId);
  }

  // 9. Jobs
  if (cleanPath === '/api/v1/jobs') {
    if (method === 'GET') return dataApiService.listJobs(req, res);
    if (method === 'POST') return dataApiService.createJob(req, res);
  }
  if (cleanPath.startsWith('/api/v1/jobs/')) {
    const jobId = decodeURIComponent(cleanPath.replace('/api/v1/jobs/', ''));
    if (method === 'GET') return dataApiService.getJob(req, res, jobId);
    if (method === 'PATCH') return dataApiService.updateJob(req, res, jobId);
  }

  // 10. Questions
  if (cleanPath === '/api/v1/questions/bulk' && method === 'POST') {
    return dataApiService.bulkCreateQuestions(req, res);
  }
  if (cleanPath === '/api/v1/questions') {
    if (method === 'GET') return dataApiService.listQuestions(req, res);
    if (method === 'POST') return dataApiService.createQuestion(req, res);
  }
  if (cleanPath.startsWith('/api/v1/questions/')) {
    const questionId = decodeURIComponent(cleanPath.replace('/api/v1/questions/', ''));
    if (method === 'GET') return dataApiService.getQuestion(req, res, questionId);
  }

  // 11. Tags
  if (cleanPath === '/api/v1/tags') {
    if (method === 'GET') return dataApiService.listTags(req, res);
    if (method === 'POST') return dataApiService.createTag(req, res);
  }
  if (cleanPath.startsWith('/api/v1/tags/')) {
    const tagId = decodeURIComponent(cleanPath.replace('/api/v1/tags/', ''));
    if (method === 'GET') return dataApiService.getTag(req, res, tagId);
  }

  res.status(404).json({ error: 'Endpoint not found in Data API', path: targetPath });
}

/**
 * Ensures the internal FastAPI service is launched safely as a background child process
 * without blocking Node.js startup or crashing Node on error.
 */
export async function ensureFastApiBridgeStarted(): Promise<void> {
  if (fastApiProcess && !fastApiProcess.killed) {
    return;
  }

  const alreadyRunning = await isFastApiAlive(500);
  if (alreadyRunning) {
    console.log(`[FastAPI Bridge] Connected to existing FastAPI process on ${FASTAPI_BASE_URL}`);
    return;
  }

  if (isStarting) return;
  isStarting = true;

  try {
    const apiDir = path.resolve(process.cwd(), 'api');
    const pythonCmd = process.env.PYTHON_BIN || 'python3';

    console.log(`[FastAPI Bridge] Starting internal FastAPI service on ${FASTAPI_BASE_URL} via ${pythonCmd}...`);

    fastApiProcess = spawn(
      pythonCmd,
      ['-m', 'uvicorn', 'app.main:app', '--host', FASTAPI_HOST, '--port', String(FASTAPI_PORT)],
      {
        cwd: apiDir,
        env: { ...process.env, PYTHONPATH: apiDir },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    if (fastApiProcess.stdout) {
      fastApiProcess.stdout.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[FastAPI] ${msg}`);
      });
    }

    if (fastApiProcess.stderr) {
      fastApiProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.warn(`[FastAPI] ${msg}`);
      });
    }

    fastApiProcess.on('error', (err) => {
      console.warn(`[FastAPI Bridge Notice] Child process error: ${err.message}`);
      fastApiProcess = null;
      isStarting = false;
    });

    fastApiProcess.on('exit', (code, signal) => {
      console.log(`[FastAPI Bridge] Process exited with code: ${code}, signal: ${signal}`);
      fastApiProcess = null;
      isStarting = false;
    });

    // Register cleanup hooks once
    if (!cleanupRegistered) {
      cleanupRegistered = true;
      const shutdown = () => {
        if (fastApiProcess && !fastApiProcess.killed) {
          console.log('[FastAPI Bridge] Gracefully terminating FastAPI child process...');
          fastApiProcess.kill('SIGTERM');
        }
      };

      process.on('exit', shutdown);
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    }
  } catch (err: any) {
    console.warn(`[FastAPI Bridge Startup Error] ${err?.message || err}`);
  } finally {
    isStarting = false;
  }
}

/**
 * Generic Express-to-FastAPI proxy forwarding helper.
 * Preserves method, path mapping (/api/v1/data/* -> /api/v1/*), query params, body, status codes, and headers.
 * Seamlessly falls back to native PostgreSQL data service when FastAPI is not running.
 */
export async function proxyFastApiRequest(
  req: Request,
  res: Response,
  targetPath: string
): Promise<void> {
  if (!fastApiHealthy) {
    return handleDataApiFallback(req, res, targetPath);
  }

  // Construct target URL preserving query string
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const cleanTargetPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const targetUrl = `${FASTAPI_BASE_URL}${cleanTargetPath}${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'IKSHOVIA-Node-Bridge/1.0',
    };

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      signal: controller.signal,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json(data);
    } else {
      const text = await response.text().catch(() => '');
      res.status(response.status).send(text);
    }
  } catch {
    fastApiHealthy = false;
    // Upstream FastAPI unavailable - seamlessly route to native dataApiService
    await handleDataApiFallback(req, res, targetPath);
  }
}

/**
 * Proxies an Express request to the internal FastAPI server health endpoint.
 */
export async function proxyFastApiHealth(req: Request, res: Response): Promise<void> {
  await proxyFastApiRequest(req, res, '/api/v1/health');
}

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import type { Request, Response } from 'express';

const FASTAPI_HOST = process.env.FASTAPI_HOST || '127.0.0.1';
const FASTAPI_PORT = Number(process.env.FASTAPI_PORT) || 8001;
const FASTAPI_BASE_URL = `http://${FASTAPI_HOST}:${FASTAPI_PORT}`;

let fastApiProcess: ChildProcess | null = null;
let isStarting = false;
let cleanupRegistered = false;

/**
 * Checks if the internal FastAPI service is already alive and accepting requests.
 */
export async function isFastApiAlive(timeoutMs = 800): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 200;
  } catch {
    return false;
  }
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
 * Returns clean 503 JSON without crashing Node on upstream failure.
 */
export async function proxyFastApiRequest(
  req: Request,
  res: Response,
  targetPath: string
): Promise<void> {
  // Construct target URL preserving query string
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const cleanTargetPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const targetUrl = `${FASTAPI_BASE_URL}${cleanTargetPath}${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    console.warn(`[FastAPI Bridge Proxy Notice] ${req.method} ${targetPath} -> ${isAbort ? 'Request timed out' : err.message}`);

    ensureFastApiBridgeStarted().catch(() => {});

    res.status(503).json({
      status: 'unavailable',
      error: 'FastAPI service bridge unavailable',
      message: isAbort
        ? 'The internal FastAPI backend request timed out.'
        : 'The internal FastAPI backend is unreachable or initializing.',
      service: 'IKSHOVIA Data API',
    });
  }
}

/**
 * Proxies an Express request to the internal FastAPI server health endpoint.
 * Returns clean, structured JSON errors on upstream failure without crashing Express.
 */
export async function proxyFastApiHealth(req: Request, res: Response): Promise<void> {
  await proxyFastApiRequest(req, res, '/api/v1/health');
}

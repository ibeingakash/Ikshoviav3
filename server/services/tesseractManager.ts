import path from 'path';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { validateImageDimensions, STANDARD_OCR_DPI } from './ocrImagePreprocessor.js';

export interface TesseractLangDiagnostic {
  exists: boolean;
  sizeBytes: number;
  sizeMb: string;
  source?: string;
}

export interface TesseractRuntimeDiagnostics {
  resolvedLangDir: string;
  languages: {
    eng: TesseractLangDiagnostic;
    hin: TesseractLangDiagnostic;
  };
  ready: boolean;
}

export interface OcrEngineStructuredError extends Error {
  success: false;
  stage: 'OCR_ENGINE_INIT' | 'IMAGE_PREPROCESSING' | 'OCR_EXECUTION';
  error: string;
  details?: any;
}

/**
 * Deterministic runtime language-data directory.
 * Independent of arbitrary current working directories.
 */
export const RUNTIME_TESSERACT_DIR =
  process.env.TESSERACT_LANG_DIR ||
  path.resolve(process.cwd(), 'runtime_assets', 'tesseract');

/**
 * Ensures the target language directory exists and language models are present.
 * Uses local package-managed data (@tesseract.js-data/eng and @tesseract.js-data/hin)
 * with deterministic fallback resolution.
 */
export async function initTesseractLanguageData(): Promise<TesseractRuntimeDiagnostics> {
  try {
    if (!fs.existsSync(RUNTIME_TESSERACT_DIR)) {
      fs.mkdirSync(RUNTIME_TESSERACT_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.error(`[TesseractManager] Failed to create runtime directory ${RUNTIME_TESSERACT_DIR}:`, err.message);
  }

  const supportedLangs = ['eng', 'hin'] as const;

  for (const lang of supportedLangs) {
    const targetFile = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata.gz`);
    const targetUncompressed = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata`);

    // If target file already exists and has valid size (> 10KB), skip
    if (fs.existsSync(targetFile)) {
      const stats = fs.statSync(targetFile);
      if (stats.size > 10000) {
        continue;
      }
    }

    // Attempt to locate source from installed npm package @tesseract.js-data/<lang>
    const packageCandidates = [
      path.resolve(process.cwd(), 'node_modules', '@tesseract.js-data', lang, '4.0.0', `${lang}.traineddata.gz`),
      path.resolve(process.cwd(), 'node_modules', '@tesseract.js-data', lang, '4.0.0_best_int', `${lang}.traineddata.gz`),
      path.resolve(process.cwd(), 'node_modules', '@tesseract.js-data', lang, '4.0.0', `${lang}.traineddata`),
      path.resolve(process.cwd(), 'node_modules', '@tesseract.js-data', lang, '4.0.0_best_int', `${lang}.traineddata`),
    ];

    let copied = false;
    for (const cand of packageCandidates) {
      if (fs.existsSync(cand)) {
        try {
          const isGz = cand.endsWith('.gz');
          const dest = isGz ? targetFile : targetUncompressed;
          fs.copyFileSync(cand, dest);
          copied = true;
          break;
        } catch (copyErr: any) {
          console.warn(`[TesseractManager] Could not copy candidate ${cand}:`, copyErr.message);
        }
      }
    }

    // Fallback: If not found in node_modules, attempt remote deterministic fetch
    if (!copied && !fs.existsSync(targetFile) && !fs.existsSync(targetUncompressed)) {
      try {
        const cdnUrl = `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const resp = await fetch(cdnUrl, { signal: controller.signal });
        clearTimeout(timer);

        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          if (buf.length > 10000) {
            fs.writeFileSync(targetFile, buf);
            copied = true;
          }
        }
      } catch (dlErr: any) {
        // Log warning only; handled cleanly in createSafeTesseractWorker
        console.warn(`[TesseractManager] Remote fallback fetch skipped/failed for ${lang}:`, dlErr.message);
      }
    }
  }

  const diagnostics = getTesseractRuntimeDiagnostics();
  return diagnostics;
}

/**
 * Runtime diagnostic checking ONLY language files existence and sizes.
 * Strictly avoids logging OCR contents, credentials, tokens, or secrets.
 */
export function getTesseractRuntimeDiagnostics(): TesseractRuntimeDiagnostics {
  const getLangStats = (lang: string): TesseractLangDiagnostic => {
    const gzPath = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata.gz`);
    const plainPath = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata`);

    if (fs.existsSync(gzPath)) {
      try {
        const size = fs.statSync(gzPath).size;
        return {
          exists: size > 10000,
          sizeBytes: size,
          sizeMb: (size / (1024 * 1024)).toFixed(2) + ' MB',
          source: gzPath,
        };
      } catch {
        return { exists: false, sizeBytes: 0, sizeMb: '0 MB' };
      }
    }

    if (fs.existsSync(plainPath)) {
      try {
        const size = fs.statSync(plainPath).size;
        return {
          exists: size > 10000,
          sizeBytes: size,
          sizeMb: (size / (1024 * 1024)).toFixed(2) + ' MB',
          source: plainPath,
        };
      } catch {
        return { exists: false, sizeBytes: 0, sizeMb: '0 MB' };
      }
    }

    return { exists: false, sizeBytes: 0, sizeMb: '0 MB' };
  };

  const engStats = getLangStats('eng');
  const hinStats = getLangStats('hin');

  return {
    resolvedLangDir: RUNTIME_TESSERACT_DIR,
    languages: {
      eng: engStats,
      hin: hinStats,
    },
    ready: engStats.exists,
  };
}

/**
 * Creates a Tesseract Worker safely with guaranteed runtime language paths,
 * structured error handling, and uncaught-exception immunity.
 */
export async function createSafeTesseractWorker(
  langs: string = 'eng',
  options: Record<string, any> = {}
): Promise<any> {
  // Ensure the runtime directory is initialized
  if (!fs.existsSync(RUNTIME_TESSERACT_DIR)) {
    await initTesseractLanguageData();
  }

  const langList = langs.split('+').map(l => l.trim()).filter(Boolean);
  const missingLangs: string[] = [];

  for (const lang of langList) {
    const gzPath = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata.gz`);
    const plainPath = path.join(RUNTIME_TESSERACT_DIR, `${lang}.traineddata`);
    const exists =
      (fs.existsSync(gzPath) && fs.statSync(gzPath).size > 10000) ||
      (fs.existsSync(plainPath) && fs.statSync(plainPath).size > 10000);

    if (!exists) {
      // One last check: copy from node_modules if present
      const pkgCand = path.resolve(process.cwd(), 'node_modules', '@tesseract.js-data', lang, '4.0.0', `${lang}.traineddata.gz`);
      if (fs.existsSync(pkgCand)) {
        try {
          fs.copyFileSync(pkgCand, gzPath);
        } catch {}
      }
      const recheck =
        (fs.existsSync(gzPath) && fs.statSync(gzPath).size > 10000) ||
        (fs.existsSync(plainPath) && fs.statSync(plainPath).size > 10000);
      if (!recheck) {
        missingLangs.push(lang);
      }
    }
  }

  if (missingLangs.length > 0) {
    const err = new Error(`Tesseract language data unavailable: ${missingLangs.join(', ')}`) as OcrEngineStructuredError;
    err.success = false;
    err.stage = 'OCR_ENGINE_INIT';
    err.error = `Tesseract language data unavailable: ${missingLangs.join(', ')}`;
    throw err;
  }

  try {
    const worker = await Tesseract.createWorker(langs, 1, {
      langPath: RUNTIME_TESSERACT_DIR,
      gzip: true,
      cachePath: RUNTIME_TESSERACT_DIR,
      errorHandler: (workerErr: any) => {
        // Prevents unhandled worker event from escaping to Node process as uncaught exception
        console.warn(`[Tesseract Worker Warning (${langs})]`, workerErr?.message || workerErr);
      },
      logger: () => {},
      ...options,
    });

    // Explicitly configure resolution to match pipeline standard (default 200 DPI)
    // Prevents Tesseract from guessing 70 DPI and triggering erratic Leptonica line scaling
    const dpi = String(options?.dpi || STANDARD_OCR_DPI);
    await worker.setParameters({
      user_defined_dpi: dpi,
    });

    return worker;
  } catch (initErr: any) {
    const err = new Error(initErr?.message || `Tesseract language data initialization failed for ${langs}`) as OcrEngineStructuredError;
    err.success = false;
    err.stage = 'OCR_ENGINE_INIT';
    err.error = initErr?.message || `Tesseract language data unavailable: ${langs}`;
    err.details = initErr;
    throw err;
  }
}

/**
 * Safely recognizes an image file using Tesseract with automatic worker lifecycle termination.
 * Strictly validates image existence and dimensions BEFORE passing to Tesseract, preventing Leptonica null-pix crashes.
 */
export async function safeTesseractRecognize(
  imagePath: string,
  langs: string = 'eng',
  options: Record<string, any> = {}
): Promise<{ text: string; confidence?: number }> {
  // 1. Validate image file existence and metadata
  if (!fs.existsSync(imagePath)) {
    const notFoundErr = new Error(`OCR target image not found: ${imagePath}`) as OcrEngineStructuredError;
    notFoundErr.success = false;
    notFoundErr.stage = 'IMAGE_PREPROCESSING';
    notFoundErr.error = `Image file not found on disk: ${imagePath}`;
    throw notFoundErr;
  }

  let imgMeta: any;
  try {
    imgMeta = await sharp(imagePath).metadata();
  } catch (metaErr: any) {
    const readErr = new Error(`Failed to decode image metadata: ${metaErr?.message}`) as OcrEngineStructuredError;
    readErr.success = false;
    readErr.stage = 'IMAGE_PREPROCESSING';
    readErr.error = `Corrupt or unreadable image file: ${imagePath}`;
    readErr.details = metaErr;
    throw readErr;
  }

  const validation = validateImageDimensions(
    { width: imgMeta.width, height: imgMeta.height, format: imgMeta.format, density: imgMeta.density },
    `safeTesseractRecognize(${path.basename(imagePath)})`
  );

  if (!validation.valid) {
    const invalidErr = new Error(`OCR Image Validation Failed: ${validation.reason}`) as OcrEngineStructuredError;
    invalidErr.success = false;
    invalidErr.stage = 'IMAGE_PREPROCESSING';
    invalidErr.error = validation.reason || 'Image dimensions below safe OCR threshold';
    invalidErr.details = validation;
    throw invalidErr;
  }

  let worker: any = null;
  try {
    worker = await createSafeTesseractWorker(langs, options);
    const res = await worker.recognize(imagePath);
    return {
      text: res?.data?.text || '',
      confidence: res?.data?.confidence,
    };
  } catch (err: any) {
    if (err?.stage === 'OCR_ENGINE_INIT' || err?.stage === 'IMAGE_PREPROCESSING') {
      throw err;
    }
    const execErr = new Error(err?.message || 'Tesseract OCR recognition failed') as OcrEngineStructuredError;
    execErr.success = false;
    execErr.stage = 'OCR_EXECUTION';
    execErr.error = err?.message || 'OCR execution failed';
    throw execErr;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr: any) {
        console.warn('[TesseractManager] Worker termination error:', termErr?.message || termErr);
      }
    }
  }
}

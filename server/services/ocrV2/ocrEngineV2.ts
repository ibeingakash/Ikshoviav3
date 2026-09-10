import { execFile, execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface SystemOcrStatus {
  ok: boolean;
  tesseractVersion?: string;
  gsVersion?: string;
  popplerVersion?: string;
  languages: string[];
  error?: string;
}

export interface PdfInspectionResult {
  pageCount: number;
  fileSizeBytes: number;
  pdfType: 'TEXT_PDF' | 'SCANNED_PDF' | 'HYBRID_PDF';
  previewTextSample: string;
}

export class OcrEngineV2 {
  private static instance: OcrEngineV2;
  private cachedStatus: SystemOcrStatus | null = null;
  private autoInstallAttempted = false;

  public static getInstance(): OcrEngineV2 {
    if (!OcrEngineV2.instance) {
      OcrEngineV2.instance = new OcrEngineV2();
    }
    return OcrEngineV2.instance;
  }

  /**
   * Deterministically attempts to auto-install missing system dependencies
   * using ensure-system-deps.sh if available and running with root permissions.
   */
  public tryAutoInstallDependencies(): boolean {
    try {
      const scriptPath = path.resolve(process.cwd(), 'scripts/ensure-system-deps.sh');
      if (fs.existsSync(scriptPath)) {
        console.log('[OCR V2 Engine] Missing OCR system binaries detected. Running ensure-system-deps.sh...');
        const res = spawnSync('bash', [scriptPath], {
          encoding: 'utf8',
          timeout: 120000,
          stdio: 'inherit',
          env: {
            ...process.env,
            DEBIAN_FRONTEND: 'noninteractive',
          },
        });
        return res.status === 0;
      }
    } catch (err: any) {
      console.warn('[OCR V2 Engine] Auto-install attempt failed:', err?.message || err);
    }
    return false;
  }

  /**
   * Verify availability of native binaries and language packs.
   */
  public checkSystemDependencies(): SystemOcrStatus {
    if (this.cachedStatus && this.cachedStatus.ok) {
      return this.cachedStatus;
    }

    try {
      let tesseractVersion = '';
      let gsVersion = '';
      let popplerVersion = '';
      const languages: string[] = [];

      // 1. Check Ghostscript
      const gsRes = spawnSync('gs', ['--version'], { encoding: 'utf8', timeout: 5000 });
      if (gsRes.status === 0 && gsRes.stdout) {
        gsVersion = gsRes.stdout.trim();
      } else {
        if (!this.autoInstallAttempted) {
          this.autoInstallAttempted = true;
          this.tryAutoInstallDependencies();
          return this.checkSystemDependencies();
        }
        return {
          ok: false,
          languages: [],
          error: `Ghostscript (gs) is not available: ${gsRes.error?.message || gsRes.stderr || 'Command not found'}`,
        };
      }

      // 2. Check Poppler (pdftotext)
      const pdfRes = spawnSync('pdftotext', ['-v'], { encoding: 'utf8', timeout: 5000 });
      const pdfCombined = ((pdfRes.stderr || '') + '\n' + (pdfRes.stdout || '')).trim();
      if (pdfCombined.includes('pdftotext version')) {
        popplerVersion = pdfCombined.split('\n')[0].trim();
      } else {
        if (!this.autoInstallAttempted) {
          this.autoInstallAttempted = true;
          this.tryAutoInstallDependencies();
          return this.checkSystemDependencies();
        }
        // Fallback: If pdftotext cannot be installed, allow pdf-parse fallback
        popplerVersion = 'pdf-parse (pure-js fallback)';
      }

      // 3. Check Tesseract
      const tessRes = spawnSync('tesseract', ['--version'], { encoding: 'utf8', timeout: 5000 });
      if (tessRes.status === 0 && (tessRes.stdout || tessRes.stderr)) {
        tesseractVersion = (tessRes.stdout || tessRes.stderr).split('\n')[0].trim();
      } else {
        if (!this.autoInstallAttempted) {
          this.autoInstallAttempted = true;
          this.tryAutoInstallDependencies();
          return this.checkSystemDependencies();
        }
        return {
          ok: false,
          languages: [],
          error: `Tesseract CLI executable is not available: ${tessRes.error?.message || tessRes.stderr || 'Command not found'}`,
        };
      }

      // 4. Check Languages
      const langRes = spawnSync('tesseract', ['--list-langs'], { encoding: 'utf8', timeout: 5000 });
      const langCombined = (langRes.stdout || '') + '\n' + (langRes.stderr || '');
      const lines = langCombined.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.includes('List of available languages') && !line.includes(':')) {
          languages.push(line);
        }
      }

      const hasEng = languages.includes('eng');
      const hasHin = languages.includes('hin');

      if (!hasEng || !hasHin) {
        if (!this.autoInstallAttempted) {
          this.autoInstallAttempted = true;
          this.tryAutoInstallDependencies();
          return this.checkSystemDependencies();
        }
        return {
          ok: false,
          tesseractVersion,
          gsVersion,
          popplerVersion,
          languages,
          error: `Missing required language packs in tessdata. Found: [${languages.join(', ')}]. Required: eng, hin.`,
        };
      }

      this.cachedStatus = {
        ok: true,
        tesseractVersion,
        gsVersion,
        popplerVersion,
        languages,
      };

      return this.cachedStatus;
    } catch (err: any) {
      return {
        ok: false,
        languages: [],
        error: `Unexpected error checking OCR system dependencies: ${err.message}`,
      };
    }
  }

  /**
   * Inspect PDF using Poppler pdfinfo and sample text extraction with pdf-parse fallback.
   * Determines page count, file size, and whether document has digital text layer.
   */
  public async inspectPdf(pdfPath: string): Promise<PdfInspectionResult> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file does not exist at path: ${pdfPath}`);
    }

    const stat = fs.statSync(pdfPath);
    let pageCount = 1;

    // Use pdfinfo for fast and accurate metadata extraction
    try {
      const infoOut = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8', timeout: 10000 });
      const pagesMatch = infoOut.match(/Pages:\s+(\d+)/i);
      if (pagesMatch) {
        pageCount = parseInt(pagesMatch[1], 10);
      }
    } catch {
      // pdfinfo fallback
    }

    // Sample up to first 3 pages to check for native text layer
    let previewTextSample = '';
    try {
      const sampleOut = execFileSync('pdftotext', ['-f', '1', '-l', '3', pdfPath, '-'], {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      previewTextSample = (sampleOut || '').trim();
    } catch {
      // If pdftotext is not available or errors, fall back to pure JS pdf-parse
      try {
        const buf = fs.readFileSync(pdfPath);
        const { extractTextFromPdfBuffer } = await import('../../ocr.js');
        const parsed = await extractTextFromPdfBuffer(buf);
        if (parsed.text) {
          previewTextSample = parsed.text.slice(0, 1000);
          if (pageCount <= 1 && parsed.pageCount > 1) {
            pageCount = parsed.pageCount;
          }
        }
      } catch {
        // Scanned fallback
      }
    }

    const cleanSample = previewTextSample.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');
    const isTextPdf = cleanSample.length > 150;

    return {
      pageCount: Math.max(pageCount, 1),
      fileSizeBytes: stat.size,
      pdfType: isTextPdf ? 'TEXT_PDF' : 'SCANNED_PDF',
      previewTextSample: previewTextSample.slice(0, 500),
    };
  }

  /**
   * Extract text from entire PDF using native Poppler pdftotext with layout preservation,
   * falling back cleanly to pdf-parse if pdftotext fails or is unavailable.
   * Used for TEXT_PDF documents without rasterization.
   */
  public async extractTextWithPoppler(pdfPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('pdftotext', ['-layout', pdfPath, '-'], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
        timeout: 60000,
      }, async (err, stdout) => {
        if (err) {
          console.warn(`[OCR V2 Engine] pdftotext failed (${err.message}). Attempting pdf-parse fallback...`);
          try {
            const buf = fs.readFileSync(pdfPath);
            const { extractTextFromPdfBuffer } = await import('../../ocr.js');
            const parsed = await extractTextFromPdfBuffer(buf);
            if (parsed.text && parsed.text.trim().length > 0) {
              console.log(`[OCR V2 Engine] pdf-parse fallback successfully extracted ${parsed.text.length} chars.`);
              return resolve(parsed.text);
            }
          } catch (fallbackErr: any) {
            console.error(`[OCR V2 Engine] Fallback pdf-parse failed: ${fallbackErr.message}`);
          }
          return reject(new Error(`Poppler pdftotext extraction failed: ${err.message}`));
        }
        resolve(stdout || '');
      });
    });
  }

  /**
   * Render a single page of a PDF to PNG using Ghostscript with safe deterministic settings.
   */
  public async renderSinglePage(
    pdfPath: string,
    pageNum: number,
    outPngPath: string,
    dpi = 150
  ): Promise<{ width: number; height: number; renderTimeMs: number }> {
    const t0 = Date.now();

    return new Promise((resolve, reject) => {
      const args = [
        '-dSAFER',
        '-dNOPAUSE',
        '-dBATCH',
        '-sDEVICE=png16m',
        `-r${dpi}`,
        `-dFirstPage=${pageNum}`,
        `-dLastPage=${pageNum}`,
        `-sOutputFile=${outPngPath}`,
        pdfPath,
      ];

      execFile('gs', args, { timeout: 25000 }, async (err) => {
        if (err) {
          return reject(new Error(`Ghostscript failed rendering page ${pageNum}: ${err.message}`));
        }

        if (!fs.existsSync(outPngPath) || fs.statSync(outPngPath).size === 0) {
          return reject(new Error(`Ghostscript produced empty/missing output for page ${pageNum}`));
        }

        try {
          const meta = await sharp(outPngPath).metadata();
          const width = meta.width || 0;
          const height = meta.height || 0;

          if (width < 64 || height < 64) {
            return reject(new Error(`Rendered page ${pageNum} image dimensions too small (${width}x${height})`));
          }

          resolve({
            width,
            height,
            renderTimeMs: Date.now() - t0,
          });
        } catch (metaErr: any) {
          reject(new Error(`Failed to validate rendered page image with Sharp: ${metaErr.message}`));
        }
      });
    });
  }

  /**
   * Deterministic native Tesseract CLI execution on a page image.
   * Applies OMP_THREAD_LIMIT=1 to ensure consistent ~2-3s runtime per page and prevent thread thrashing.
   */
  public async ocrPageImage(
    imagePath: string,
    outBasePath: string,
    langOption: 'EN' | 'HI' | 'BILINGUAL' | 'AUTO' = 'AUTO',
    psm = 3
  ): Promise<{ text: string; ocrTimeMs: number }> {
    const t0 = Date.now();

    let tesseractLang = 'eng+hin';
    if (langOption === 'EN') {
      tesseractLang = 'eng';
    } else if (langOption === 'HI') {
      tesseractLang = 'hin';
    } else {
      tesseractLang = 'eng+hin';
    }

    return new Promise((resolve, reject) => {
      const args = [
        imagePath,
        outBasePath,
        '-l',
        tesseractLang,
        '--psm',
        String(psm),
      ];

      execFile('tesseract', args, {
        timeout: 45000,
        env: {
          ...process.env,
          OMP_THREAD_LIMIT: '1',
        },
      }, (err) => {
        const outTxtPath = `${outBasePath}.txt`;

        if (err) {
          try { if (fs.existsSync(outTxtPath)) fs.unlinkSync(outTxtPath); } catch {}
          return reject(new Error(`Tesseract CLI failed on page image: ${err.message}`));
        }

        try {
          let text = '';
          if (fs.existsSync(outTxtPath)) {
            text = fs.readFileSync(outTxtPath, 'utf8');
            fs.unlinkSync(outTxtPath);
          }
          resolve({
            text,
            ocrTimeMs: Date.now() - t0,
          });
        } catch (readErr: any) {
          reject(new Error(`Failed reading Tesseract text output: ${readErr.message}`));
        }
      });
    });
  }
}

export const ocrEngineV2 = OcrEngineV2.getInstance();

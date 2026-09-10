import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { ocrEngineV2 } from '../ocrV2/ocrEngineV2.js';
import { extractTextFromPdfBuffer, rasterizeAndOcrScannedPdf } from '../../ocr.js';

export interface PageOcrOutput {
  pageNumber: number;
  text: string;
  charCount: number;
  isScanned: boolean;
  imagePath?: string;
}

export interface ShortNotesOcrResult {
  pages: PageOcrOutput[];
  fullText: string;
  pageCount: number;
  totalChars: number;
  engineUsed: string;
  documentHash: string;
}

/**
 * Thin Adapter that reuses the EXISTING Test Paper OCR system.
 * CRITICAL: This adapter DOES NOT modify or duplicate the existing OCR engine.
 * It directly invokes the existing ocrEngineV2 and rasterizeAndOcrScannedPdf methods.
 */
export async function runExistingOcrOnDocument(
  buffer: Buffer,
  fileName: string,
  docLang: 'AUTO' | 'EN' | 'HI' | 'BILINGUAL' = 'AUTO'
): Promise<ShortNotesOcrResult> {
  const documentHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const tempDir = path.join(process.cwd(), 'data', 'ocr_temp', `shortnote_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const isImage = fileName.match(/\.(png|jpe?g|webp|bmp|tiff)$/i);

  // Case A: Image Input (single page)
  if (isImage) {
    const imgPath = path.join(tempDir, 'page_001.png');
    await sharp(buffer).png().toFile(imgPath);
    const outBasePath = path.join(tempDir, 'ocr_page_001');

    const langOpt = docLang === 'HI' ? 'HI' : docLang === 'EN' ? 'EN' : 'BILINGUAL';
    const ocrRes = await ocrEngineV2.ocrPageImage(imgPath, outBasePath, langOpt as any);

    return {
      pages: [
        {
          pageNumber: 1,
          text: ocrRes.text.trim(),
          charCount: ocrRes.text.length,
          isScanned: true,
          imagePath: imgPath,
        },
      ],
      fullText: ocrRes.text.trim(),
      pageCount: 1,
      totalChars: ocrRes.text.length,
      engineUsed: 'EXISTING_TEST_PAPER_OCR_TESSERACT_IMAGE',
      documentHash,
    };
  }

  // Case B: PDF Input - Use existing inspectPdf & Poppler/Ghostscript pipeline
  const pdfPath = path.join(tempDir, 'input.pdf');
  fs.writeFileSync(pdfPath, buffer);

  let inspection: { pageCount: number; pdfType: 'TEXT_PDF' | 'SCANNED_PDF' | 'HYBRID_PDF'; previewTextSample: string } = {
    pageCount: 1,
    pdfType: 'TEXT_PDF',
    previewTextSample: '',
  };
  try {
    inspection = await ocrEngineV2.inspectPdf(pdfPath);
  } catch (err: any) {
    console.warn('[ShortNotesOcrAdapter] inspectPdf notice:', err.message);
  }

  const pageCount = Math.max(1, inspection.pageCount);
  const pages: PageOcrOutput[] = [];

  // If the document has a digital text layer, extract page-aware text
  if (inspection.pdfType === 'TEXT_PDF') {
    try {
      const extractedFull = await ocrEngineV2.extractTextWithPoppler(pdfPath);
      // Split by form-feed character (\f) to get exact page boundaries from pdftotext -layout
      const rawPages = extractedFull.split('\x0c');

      for (let p = 1; p <= pageCount; p++) {
        const pageText = (rawPages[p - 1] || '').trim();
        pages.push({
          pageNumber: p,
          text: pageText,
          charCount: pageText.length,
          isScanned: false,
        });
      }

      const totalChars = pages.reduce((acc, p) => acc + p.charCount, 0);
      if (totalChars > 150) {
        return {
          pages,
          fullText: extractedFull.trim(),
          pageCount,
          totalChars,
          engineUsed: 'EXISTING_TEST_PAPER_OCR_POPPLER_LAYOUT',
          documentHash,
        };
      }
    } catch (err: any) {
      console.warn('[ShortNotesOcrAdapter] Poppler text extraction failed, falling back to rasterization:', err.message);
    }
  }

  // Fallback for Scanned PDF or low text yield: Render pages with Ghostscript & run existing Tesseract CLI
  console.log(`[ShortNotesOcrAdapter] Running page-by-page rasterization OCR on ${pageCount} pages...`);
  let fullAccumulator = '';

  for (let p = 1; p <= Math.min(pageCount, 50); p++) {
    const outPng = path.join(tempDir, `page_${String(p).padStart(3, '0')}.png`);
    const outBase = path.join(tempDir, `ocr_page_${String(p).padStart(3, '0')}`);

    try {
      await ocrEngineV2.renderSinglePage(pdfPath, p, outPng, 150);
      const langOpt = docLang === 'HI' ? 'HI' : docLang === 'EN' ? 'EN' : 'BILINGUAL';
      const ocrPage = await ocrEngineV2.ocrPageImage(outPng, outBase, langOpt as any);

      pages.push({
        pageNumber: p,
        text: ocrPage.text.trim(),
        charCount: ocrPage.text.length,
        isScanned: true,
        imagePath: outPng,
      });
      fullAccumulator += `\n--- Page ${p} ---\n` + ocrPage.text;
    } catch (pageErr: any) {
      console.warn(`[ShortNotesOcrAdapter] Failed to OCR page ${p}:`, pageErr.message);
      pages.push({
        pageNumber: p,
        text: '',
        charCount: 0,
        isScanned: true,
      });
    }
  }

  // If pages are still empty, try legacy rasterizeAndOcrScannedPdf from server/ocr.ts
  if (pages.every(p => p.charCount === 0)) {
    try {
      const v1Result = await rasterizeAndOcrScannedPdf(buffer, `sn_${Date.now()}`, docLang);
      if (v1Result && v1Result.ocrText) {
        return {
          pages: [{
            pageNumber: 1,
            text: v1Result.ocrText.trim(),
            charCount: v1Result.ocrText.length,
            isScanned: true,
          }],
          fullText: v1Result.ocrText.trim(),
          pageCount: v1Result.pagesProcessed || 1,
          totalChars: v1Result.totalCharsOcred || v1Result.ocrText.length,
          engineUsed: 'EXISTING_TEST_PAPER_OCR_V1_FALLBACK',
          documentHash,
        };
      }
    } catch (v1Err: any) {
      console.warn('[ShortNotesOcrAdapter] v1 rasterize fallback notice:', v1Err.message);
    }
  }

  const totalChars = pages.reduce((acc, p) => acc + p.charCount, 0);
  return {
    pages,
    fullText: fullAccumulator.trim() || pages.map(p => p.text).join('\n\n'),
    pageCount,
    totalChars,
    engineUsed: 'EXISTING_TEST_PAPER_OCR_TESSERACT_RASTER',
    documentHash,
  };
}

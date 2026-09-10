import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ImageCropBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ColumnCropConfig {
  label: 'left' | 'right' | 'full';
  bounds: ImageCropBounds;
}

export interface ImageValidationResult {
  valid: boolean;
  reason?: string;
  width?: number;
  height?: number;
  area?: number;
  aspectRatio?: number;
}

export interface OcrPreprocessResult {
  outputPath: string;
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
  dpi: number;
  format: string;
  byteSize: number;
  cropBounds?: ImageCropBounds;
  label: string;
}

export interface ImagePipelineLogInfo {
  pageNum: number;
  originalWidth: number;
  originalHeight: number;
  dpi: number;
  format: string;
  byteSize: number;
  cropLabel: string;
  cropWidth: number;
  cropHeight: number;
  resizeTargetWidth?: number;
  resizeTargetHeight?: number;
  resizeFactor?: number;
  finalWidth: number;
  finalHeight: number;
}

// Critical OCR Preprocessing Constants to prevent Leptonica/Tesseract scaling null-pix errors
export const MIN_SAFE_OCR_DIMENSION = 64; // Minimum width or height (pixels)
export const MIN_SAFE_OCR_AREA = 4096; // 64 x 64 pixels
export const MAX_SAFE_ASPECT_RATIO = 20; // Aspect ratio cap: rejects narrow 13x983 slivers (ratio 75:1)
export const STANDARD_OCR_DPI = 200; // Optimal deterministic resolution for Ghostscript & Tesseract

/**
 * Validates image dimensions against mathematical and Leptonica constraints.
 * Strictly prevents zero-area, negative, or degenerate sliver images from reaching Tesseract.
 */
export function validateImageDimensions(
  metadata: { width?: number; height?: number; format?: string; density?: number },
  context: string = 'image'
): ImageValidationResult {
  const { width, height } = metadata;

  if (typeof width !== 'number' || typeof height !== 'number') {
    return { valid: false, reason: `${context}: Missing width or height dimensions in metadata.` };
  }

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { valid: false, reason: `${context}: Dimensions are not finite (w=${width}, h=${height}).`, width, height };
  }

  if (width <= 0 || height <= 0) {
    return { valid: false, reason: `${context}: Non-positive dimension (w=${width}, h=${height}).`, width, height };
  }

  const intW = Math.floor(width);
  const intH = Math.floor(height);
  const area = intW * intH;

  if (area < MIN_SAFE_OCR_AREA) {
    return {
      valid: false,
      reason: `${context}: Pixel area ${area} is below safe minimum ${MIN_SAFE_OCR_AREA} (w=${intW}, h=${intH}).`,
      width: intW,
      height: intH,
      area,
    };
  }

  if (intW < MIN_SAFE_OCR_DIMENSION) {
    return {
      valid: false,
      reason: `${context}: Width ${intW}px is below safe OCR threshold ${MIN_SAFE_OCR_DIMENSION}px.`,
      width: intW,
      height: intH,
      area,
    };
  }

  if (intH < MIN_SAFE_OCR_DIMENSION) {
    return {
      valid: false,
      reason: `${context}: Height ${intH}px is below safe OCR threshold ${MIN_SAFE_OCR_DIMENSION}px.`,
      width: intW,
      height: intH,
      area,
    };
  }

  const aspectRatio = Math.max(intW / intH, intH / intW);
  if (aspectRatio > MAX_SAFE_ASPECT_RATIO) {
    return {
      valid: false,
      reason: `${context}: Extreme aspect ratio ${aspectRatio.toFixed(1)}:1 exceeds limit ${MAX_SAFE_ASPECT_RATIO}:1 (w=${intW}, h=${intH}). Slivers cause Leptonica scale-to-zero failures.`,
      width: intW,
      height: intH,
      area,
      aspectRatio,
    };
  }

  return {
    valid: true,
    width: intW,
    height: intH,
    area,
    aspectRatio,
  };
}

/**
 * Calculates safe column crops for a document page.
 * Detects whether page is suitable for 2-column extraction or should be processed full-width.
 * Guarantees all crop coordinates stay strictly inside image boundaries with integer coordinates.
 */
export function calculateSafeColumnCrops(pageWidth: number, pageHeight: number): ColumnCropConfig[] {
  const w = Math.floor(pageWidth);
  const h = Math.floor(pageHeight);

  // Proportional margins clamped within safe physical bounds
  const marginX = Math.max(15, Math.min(45, Math.floor(w * 0.025)));
  const marginTop = Math.max(20, Math.min(50, Math.floor(h * 0.02)));
  const marginBottom = Math.max(20, Math.min(50, Math.floor(h * 0.02)));
  const contentHeight = Math.max(MIN_SAFE_OCR_DIMENSION, h - marginTop - marginBottom);

  // Determine if page has sufficient width for two columns
  const minTwoColumnWidth = 800; // standard A4 at 200 DPI is ~1653px
  const isLandscapeOrNarrow = w < minTwoColumnWidth || w > h * 1.1;

  if (isLandscapeOrNarrow) {
    // Single full-width column
    const contentWidth = Math.max(MIN_SAFE_OCR_DIMENSION, w - (marginX * 2));
    return [
      {
        label: 'full',
        bounds: {
          left: marginX,
          top: marginTop,
          width: contentWidth,
          height: contentHeight,
        },
      },
    ];
  }

  // 2-column calculation with safe gutter
  const gutter = Math.max(16, Math.min(32, Math.floor(w * 0.015)));
  const halfWidth = Math.floor(w / 2);

  // Left column: from marginX to (halfWidth - gutter/2)
  const leftColLeft = marginX;
  const leftColWidth = Math.max(MIN_SAFE_OCR_DIMENSION, halfWidth - marginX - Math.floor(gutter / 2));

  // Right column: from (halfWidth + gutter/2) to (w - marginX)
  const rightColLeft = halfWidth + Math.ceil(gutter / 2);
  const rightColWidth = Math.max(MIN_SAFE_OCR_DIMENSION, w - rightColLeft - marginX);

  const leftCrop: ColumnCropConfig = {
    label: 'left',
    bounds: {
      left: Math.max(0, leftColLeft),
      top: Math.max(0, marginTop),
      width: Math.min(leftColWidth, w - leftColLeft),
      height: Math.min(contentHeight, h - marginTop),
    },
  };

  const rightCrop: ColumnCropConfig = {
    label: 'right',
    bounds: {
      left: Math.max(0, rightColLeft),
      top: Math.max(0, marginTop),
      width: Math.min(rightColWidth, w - rightColLeft),
      height: Math.min(contentHeight, h - marginTop),
    },
  };

  return [leftCrop, rightCrop];
}

/**
 * Preprocesses and extracts a crop region safely for Tesseract OCR.
 * Normalizes contrast, converts to grayscale, sets DPI metadata, and verifies dimensions.
 * Never allows invalid/null pix images to be output.
 */
export async function preprocessCropForOcr(
  sourceImagePath: string,
  outputPath: string,
  cropBounds: ImageCropBounds,
  cropLabel: 'left' | 'right' | 'full' = 'left',
  pageNum: number = 1
): Promise<OcrPreprocessResult> {
  const sourceMeta = await sharp(sourceImagePath).metadata();
  const sourceW = sourceMeta.width || 0;
  const sourceH = sourceMeta.height || 0;
  const sourceDpi = sourceMeta.density || STANDARD_OCR_DPI;
  const sourceFormat = sourceMeta.format || 'png';
  const sourceStats = fs.statSync(sourceImagePath);

  // Clamp crop bounds strictly inside source image boundaries
  const clampLeft = Math.max(0, Math.min(Math.floor(cropBounds.left), sourceW - MIN_SAFE_OCR_DIMENSION));
  const clampTop = Math.max(0, Math.min(Math.floor(cropBounds.top), sourceH - MIN_SAFE_OCR_DIMENSION));
  const clampWidth = Math.max(
    MIN_SAFE_OCR_DIMENSION,
    Math.min(Math.floor(cropBounds.width), sourceW - clampLeft)
  );
  const clampHeight = Math.max(
    MIN_SAFE_OCR_DIMENSION,
    Math.min(Math.floor(cropBounds.height), sourceH - clampTop)
  );

  const clampedBounds: ImageCropBounds = {
    left: clampLeft,
    top: clampTop,
    width: clampWidth,
    height: clampHeight,
  };

  // Validate crop dimensions before extraction
  const preValidation = validateImageDimensions(clampedBounds, `Page ${pageNum} ${cropLabel} crop bounds`);
  if (!preValidation.valid) {
    throw new Error(`[OCR Preprocessor] Invalid crop coordinates: ${preValidation.reason}`);
  }

  // Preprocess with Sharp: Extract -> Grayscale -> Normalize Contrast -> Set DPI metadata
  await sharp(sourceImagePath)
    .extract({
      left: clampedBounds.left,
      top: clampedBounds.top,
      width: clampedBounds.width,
      height: clampedBounds.height,
    })
    .grayscale() // Reduces memory and speeds up Tesseract LSTM binarization
    .normalize() // Enhances text edge contrast against paper background
    .withMetadata({ density: STANDARD_OCR_DPI }) // Explicitly set DPI to 200 for Tesseract
    .png({ compressionLevel: 6 })
    .toFile(outputPath);

  // Verify the resulting image on disk
  const finalMeta = await sharp(outputPath).metadata();
  const finalStats = fs.statSync(outputPath);

  const postValidation = validateImageDimensions(
    { width: finalMeta.width, height: finalMeta.height },
    `Page ${pageNum} ${cropLabel} output file`
  );

  if (!postValidation.valid) {
    try { fs.unlinkSync(outputPath); } catch {}
    throw new Error(`[OCR Preprocessor] Generated crop failed validation: ${postValidation.reason}`);
  }

  const result: OcrPreprocessResult = {
    outputPath,
    originalWidth: sourceW,
    originalHeight: sourceH,
    finalWidth: finalMeta.width!,
    finalHeight: finalMeta.height!,
    dpi: finalMeta.density || STANDARD_OCR_DPI,
    format: finalMeta.format || 'png',
    byteSize: finalStats.size,
    cropBounds: clampedBounds,
    label: cropLabel,
  };

  // Safe diagnostic log — strictly metadata only (NO OCR text or PDF contents)
  logImagePipelineMetadata({
    pageNum,
    originalWidth: sourceW,
    originalHeight: sourceH,
    dpi: result.dpi,
    format: result.format,
    byteSize: result.byteSize,
    cropLabel,
    cropWidth: clampedBounds.width,
    cropHeight: clampedBounds.height,
    finalWidth: result.finalWidth,
    finalHeight: result.finalHeight,
  });

  return result;
}

/**
 * Diagnostic logger for the OCR image pipeline.
 * Safely logs image metadata (dimensions, DPI, format, byte size, crop) WITHOUT leaking any PDF text or secrets.
 */
export function logImagePipelineMetadata(info: ImagePipelineLogInfo): void {
  const resizeInfo = info.resizeFactor ? ` resizeFactor=${info.resizeFactor}` : '';
  console.log(
    `[OCR Image Pipeline] Page ${info.pageNum} (${info.cropLabel}): ` +
    `original=${info.originalWidth}x${info.originalHeight} (${info.format}, ${info.dpi} DPI, ${Math.round(info.byteSize / 1024)} KB) -> ` +
    `crop=${info.cropWidth}x${info.cropHeight}${resizeInfo} -> ` +
    `finalPassedToTesseract=${info.finalWidth}x${info.finalHeight}`
  );
}

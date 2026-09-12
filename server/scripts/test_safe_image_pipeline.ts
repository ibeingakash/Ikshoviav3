import {
  validateImageDimensions,
  calculateSafeColumnCrops,
  preprocessCropForOcr,
  MIN_SAFE_OCR_DIMENSION,
} from '../services/ocrImagePreprocessor.js';
import { safeTesseractRecognize } from '../services/tesseractManager.js';
import sharp from 'sharp';
import fs from 'fs';

async function runTests() {
  console.log('=== RUNNING SAFE OCR IMAGE PIPELINE TESTS ===\n');

  // Test 1: 13x983 sliver image (the exact dimensions from the Leptonica error!)
  console.log('Test 1: Validating 13x983 sliver image...');
  const sliverVal = validateImageDimensions({ width: 13, height: 983 }, '13x983 sliver');
  console.log('Result:', sliverVal.valid ? 'UNEXPECTED PASS' : `EXPECTED REJECTION: ${sliverVal.reason}`);
  if (sliverVal.valid) throw new Error('Test 1 failed: 13x983 was not rejected!');

  // Test 2: Negative and zero dimensions
  console.log('\nTest 2: Validating 0x0 and negative dimensions...');
  const zeroVal = validateImageDimensions({ width: 0, height: 100 }, '0x100 image');
  console.log('0x100 Result:', zeroVal.valid ? 'UNEXPECTED PASS' : `EXPECTED REJECTION: ${zeroVal.reason}`);
  if (zeroVal.valid) throw new Error('Test 2 failed: 0x100 was not rejected!');

  // Test 3: Narrow page cropping (e.g. 600x800)
  console.log('\nTest 3: Testing calculateSafeColumnCrops on narrow page (600x800)...');
  const narrowCrops = calculateSafeColumnCrops(600, 800);
  console.log('Narrow page crops count:', narrowCrops.length, 'labels:', narrowCrops.map(c => c.label));
  if (narrowCrops.length !== 1 || narrowCrops[0].label !== 'full') {
    throw new Error('Test 3 failed: narrow page did not fall back to single full-width crop!');
  }
  console.log('Narrow crop bounds:', JSON.stringify(narrowCrops[0].bounds));

  // Test 4: Standard A4 page (1653x2339)
  console.log('\nTest 4: Testing calculateSafeColumnCrops on standard A4 (1653x2339)...');
  const a4Crops = calculateSafeColumnCrops(1653, 2339);
  console.log('A4 page crops count:', a4Crops.length, 'labels:', a4Crops.map(c => c.label));
  if (a4Crops.length !== 2) throw new Error('Test 4 failed: A4 page did not produce 2 columns!');
  for (const c of a4Crops) {
    console.log(`Column ${c.label} bounds:`, JSON.stringify(c.bounds));
    if (c.bounds.width < MIN_SAFE_OCR_DIMENSION || c.bounds.height < MIN_SAFE_OCR_DIMENSION) {
      throw new Error(`Test 4 failed: crop ${c.label} has dimensions smaller than safe minimum!`);
    }
    if (c.bounds.left + c.bounds.width > 1653) {
      throw new Error(`Test 4 failed: crop ${c.label} exceeds page width!`);
    }
  }

  // Test 5: End-to-end preprocessing and safe recognition on a real sample page
  console.log('\nTest 5: Testing real crop preprocessing and Tesseract recognition...');
  const samplePage = fs.readdirSync('/tmp').find(f => f.startsWith('ocr_page_job_ocr_1788766002074_v2ew_001') && f.endsWith('.png'))
    || fs.readdirSync('/tmp').find(f => f.startsWith('ocr_page_') && f.endsWith('.png'));
  if (samplePage) {
    const fullPath = `/tmp/${samplePage}`;
    console.log(`Using sample page: ${samplePage}`);
    const meta = await sharp(fullPath).metadata();
    const crops = calculateSafeColumnCrops(meta.width || 1653, meta.height || 2339);
    const testCropPath = '/tmp/test_pipeline_left_crop.png';
    try {
      const preRes = await preprocessCropForOcr(fullPath, testCropPath, crops[0].bounds, 'left', 1);
      console.log(`Preprocessed crop: ${preRes.finalWidth}x${preRes.finalHeight}, format=${preRes.format}, bytes=${preRes.byteSize}`);
      const ocrRes = await safeTesseractRecognize(testCropPath, 'eng');
      console.log(`safeTesseractRecognize succeeded! Text length: ${ocrRes.text.length} chars, confidence: ${ocrRes.confidence}`);
    } finally {
      try { fs.unlinkSync(testCropPath); } catch {}
    }
  } else {
    console.log('No sample page in /tmp, creating synthetic document to test end-to-end...');
    const synthPath = '/tmp/synth_test_page.png';
    await sharp({
      create: {
        width: 1653,
        height: 2339,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toFile(synthPath);

    const crops = calculateSafeColumnCrops(1653, 2339);
    const testCropPath = '/tmp/test_pipeline_left_crop.png';
    try {
      const preRes = await preprocessCropForOcr(synthPath, testCropPath, crops[0].bounds, 'left', 1);
      console.log(`Preprocessed crop: ${preRes.finalWidth}x${preRes.finalHeight}`);
      const ocrRes = await safeTesseractRecognize(testCropPath, 'eng');
      console.log(`safeTesseractRecognize succeeded! Text length: ${ocrRes.text.length}`);
    } finally {
      try { fs.unlinkSync(synthPath); } catch {}
      try { fs.unlinkSync(testCropPath); } catch {}
    }
  }

  // Test 6: Verify rejection inside safeTesseractRecognize when given invalid image
  console.log('\nTest 6: Testing safeTesseractRecognize rejection on corrupt/invalid file...');
  const invalidPath = '/tmp/invalid_tiny.png';
  await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  }).png().toFile(invalidPath);

  try {
    await safeTesseractRecognize(invalidPath, 'eng');
    throw new Error('Test 6 failed: safeTesseractRecognize should have rejected 10x10 image!');
  } catch (err: any) {
    if (err.stage === 'IMAGE_PREPROCESSING') {
      console.log(`EXPECTED STRUCTURED REJECTION: stage=${err.stage}, error=${err.error}`);
    } else {
      throw err;
    }
  } finally {
    try { fs.unlinkSync(invalidPath); } catch {}
  }

  console.log('\n=== ALL 6 TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

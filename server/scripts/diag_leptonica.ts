import Tesseract from 'tesseract.js';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

async function main() {
  const logFile = '/tmp/diag_leptonica.log';
  fs.writeFileSync(logFile, `Starting diagnosis at ${new Date().toISOString()}\n`);

  const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  const jobId = 'job_ocr_1788766002074_v2ew';
  const prefix = 'ocr_page_' + jobId + '_';
  const pages = fs.readdirSync('/tmp').filter(f => f.startsWith(prefix) && f.endsWith('.png')).sort();

  log(`Found ${pages.length} pages for job ${jobId}`);

  const worker = await Tesseract.createWorker('eng+hin', 1, {
    langPath: path.resolve('runtime_assets/tesseract'),
    cachePath: path.resolve('runtime_assets/tesseract'),
    logger: m => {
      if (m.status !== 'recognizing text') {
        // Only log major status changes
      }
    }
  });

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const pagePath = path.join('/tmp', pages[i]);
    const stats = fs.statSync(pagePath);
    const meta = await sharp(pagePath).metadata();

    const w = meta.width || 0;
    const h = meta.height || 0;
    const halfWidth = Math.floor(w / 2);

    log(`[Page ${pageNum}] file=${pages[i]} size=${stats.size}b w=${w} h=${h} dpi=${meta.density || 'none'} format=${meta.format}`);

    const leftCrop = `/tmp/diag_crop_L_${pageNum}.png`;
    const rightCrop = `/tmp/diag_crop_R_${pageNum}.png`;

    const lCropW = halfWidth - 45;
    const rCropW = halfWidth - 45;
    const cropH = h - 70;

    log(`[Page ${pageNum}] leftCrop: left=35, top=35, w=${lCropW}, h=${cropH}`);
    await sharp(pagePath)
      .extract({ left: 35, top: 35, width: lCropW, height: cropH })
      .toFile(leftCrop);

    const leftMeta = await sharp(leftCrop).metadata();
    log(`[Page ${pageNum}] leftCrop generated: w=${leftMeta.width}, h=${leftMeta.height}`);

    try {
      const resL = await worker.recognize(leftCrop);
      log(`[Page ${pageNum}] leftCrop OCR OK: textLen=${resL.data.text.length}`);
    } catch (err: any) {
      log(`[Page ${pageNum}] leftCrop OCR ERROR: ${err.message}`);
    }

    log(`[Page ${pageNum}] rightCrop: left=${halfWidth + 10}, top=35, w=${rCropW}, h=${cropH}`);
    await sharp(pagePath)
      .extract({ left: halfWidth + 10, top: 35, width: rCropW, height: cropH })
      .toFile(rightCrop);

    const rightMeta = await sharp(rightCrop).metadata();
    log(`[Page ${pageNum}] rightCrop generated: w=${rightMeta.width}, h=${rightMeta.height}`);

    try {
      const resR = await worker.recognize(rightCrop);
      log(`[Page ${pageNum}] rightCrop OCR OK: textLen=${resR.data.text.length}`);
    } catch (err: any) {
      log(`[Page ${pageNum}] rightCrop OCR ERROR: ${err.message}`);
    }

    try { fs.unlinkSync(leftCrop); } catch {}
    try { fs.unlinkSync(rightCrop); } catch {}

    if (pageNum >= 10) {
      log('Sample of first 10 pages completed successfully without crash.');
      break;
    }
  }

  await worker.terminate();
  log('Done.');
}

main().catch(err => {
  fs.appendFileSync('/tmp/diag_leptonica.log', `Fatal error: ${err.stack || err}\n`);
  console.error('Fatal:', err);
});

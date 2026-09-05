import crypto from 'crypto';
import { resourceRepository, DbResource, ResourceType, ResourceVisibility } from '../repositories/ResourceRepository.js';
import { getStorageProvider } from './storage/index.js';
import { pool } from '../db/pool.js';
import { extractTextFromPdfBuffer, rasterizeAndOcrScannedPdf } from '../ocr.js';

export interface IngestResourceParams {
  title: string;
  author?: string;
  description?: string;
  resourceType: ResourceType;
  subject: string;
  topic?: string;
  exam: string;
  visibility: ResourceVisibility;
  fileName: string;
  buffer: Buffer;
  uploadedBy: string;
  autoPublish?: boolean;
}

export class ResourceIngestionService {
  private static instance: ResourceIngestionService;

  private constructor() {}

  public static getInstance(): ResourceIngestionService {
    if (!ResourceIngestionService.instance) {
      ResourceIngestionService.instance = new ResourceIngestionService();
    }
    return ResourceIngestionService.instance;
  }

  /**
   * Complete end-to-end ingestion pipeline:
   * 1. Validate PDF
   * 2. Insert DRAFT in DB
   * 3. Upload to Google Drive (Resumable)
   * 4. Text Extraction (Native/OCR)
   * 5. Page-aware chunking & Knowledge Base RAG indexing
   * 6. Mark READY / PUBLISHED
   */
  public async ingestResource(params: IngestResourceParams): Promise<DbResource> {
    const { buffer, fileName, title, author, description, resourceType, subject, topic, exam, visibility, uploadedBy, autoPublish } = params;

    // 1. Security & File Validation
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer provided.');
    }
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('File exceeds maximum supported limit of 100MB.');
    }
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid file format. Uploaded file is not a valid PDF document.');
    }

    const sanitizedFileName = (fileName || 'resource.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');

    // Determine Google Drive folder category
    let folderCategory: 'RESOURCES' | 'OFFICIAL_DOCUMENTS' | 'NOTES' = 'RESOURCES';
    if (resourceType === 'OFFICIAL_DOCUMENT') folderCategory = 'OFFICIAL_DOCUMENTS';
    if (resourceType === 'NOTES') folderCategory = 'NOTES';

    // 2. Create Initial Record in PostgreSQL
    const resource = await resourceRepository.create({
      title,
      author: author || 'IKSHOVIA Faculty',
      description: description || '',
      resource_type: resourceType,
      type: resourceType,
      subject,
      topic: topic || '',
      exam: exam || 'ALL',
      file_name: sanitizedFileName,
      file_size: buffer.length,
      mime_type: 'application/pdf',
      status: 'UPLOADING',
      visibility: visibility || 'PUBLIC',
      uploaded_by: uploadedBy,
      summary: description || '',
    });

    try {
      // 3. Resumable Upload to Google Drive
      console.log(`[ResourceIngestion] Uploading ${sanitizedFileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to Google Drive...`);
      const storage = getStorageProvider();
      const uploadResult = await storage.uploadFile({
        fileName: sanitizedFileName,
        buffer,
        mimeType: 'application/pdf',
        folderCategory,
      });

      console.log(`[ResourceIngestion] Uploaded to Drive: fileId=${uploadResult.fileId}, folderId=${uploadResult.folderId}`);

      await resourceRepository.update(resource.id, {
        drive_file_id: uploadResult.fileId,
        drive_folder_id: uploadResult.folderId,
        status: 'PROCESSING',
      });

      // 4. Text Extraction & OCR
      console.log(`[ResourceIngestion] Extracting text and page structure for ${resource.id}...`);
      let extractedText = '';
      let pageCount = 1;
      let extractionMethod = 'DIRECT_TEXT';

      try {
        const textExtract = await extractTextFromPdfBuffer(buffer);
        extractedText = textExtract.text || '';
        pageCount = Math.max(1, textExtract.pageCount || 1);
        if (textExtract.pdfType === 'SCANNED') {
          extractionMethod = 'OCR_REQUIRED';
        }
      } catch (err: any) {
        console.warn(`[ResourceIngestion] PDFParse notice: ${err?.message || err}`);
      }

      // If text extraction yielded minimal text, invoke local OCR fallback
      if (extractedText.trim().length < 200) {
        console.log(`[ResourceIngestion] Minimal text extracted (${extractedText.trim().length} chars). Invoking OCR fallback for ${resource.id}...`);
        try {
          const ocrResult = await rasterizeAndOcrScannedPdf(buffer, resource.id);
          if (ocrResult && ocrResult.ocrText && ocrResult.ocrText.trim().length > extractedText.trim().length) {
            extractedText = ocrResult.ocrText;
            pageCount = Math.max(pageCount, ocrResult.pagesProcessed || 1);
            extractionMethod = 'TESSERACT_OCR';
            console.log(`[ResourceIngestion] OCR fallback succeeded: ${ocrResult.totalCharsOcred} chars across ${ocrResult.pagesProcessed} pages.`);
          }
        } catch (ocrErr: any) {
          console.warn(`[ResourceIngestion] OCR rasterization notice: ${ocrErr?.message || ocrErr}`);
        }
      }

      // 5. Ensure parent source and sync to data_resources table for global RAG consistency
      await pool.query(
        `INSERT INTO public.data_sources (id, name, slug, base_url, source_type, is_active, created_at, updated_at)
         VALUES ('src_google_drive', 'IKSHOVIA Google Drive Library', 'google-drive-library', 'https://drive.google.com', 'OTHER', true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`
      );

      await pool.query(
        `INSERT INTO public.data_resources (
          id, source_id, title, url, resource_type, description, retrieved_at, status, created_at, updated_at
        ) VALUES (
          $1, 'src_google_drive', $2, $3, $4, $5, NOW(), 'PROCESSED', NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          url = EXCLUDED.url,
          description = EXCLUDED.description,
          updated_at = NOW()`,
        [resource.id, title, `/api/resources/${resource.id}/stream`, resourceType || 'PDF', description || '']
      );

      // 6. Store in data_documents table
      const docId = `doc_${crypto.randomBytes(6).toString('hex')}`;
      await pool.query(
        `INSERT INTO public.data_documents (
          id, resource_id, raw_text, clean_text, mime_type, file_size_bytes,
          page_count, language, extraction_status, extraction_method, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          docId,
          resource.id,
          extractedText,
          extractedText.replace(/\s+/g, ' ').trim(),
          'application/pdf',
          buffer.length,
          pageCount,
          'en',
          extractedText.trim().length > 0 ? 'EXTRACTED' : 'PARTIAL',
          extractionMethod,
        ]
      );

      // 7. Page-aware Chunking & RAG Indexing
      await this.createPageAwareChunks(docId, resource.id, title, author, subject, extractedText, pageCount);

      // 8. Update Resource to READY or PUBLISHED
      const finalStatus = autoPublish ? 'PUBLISHED' : 'READY';
      const updatedResource = await resourceRepository.update(resource.id, {
        page_count: pageCount,
        status: finalStatus,
        read_time_minutes: Math.max(5, Math.ceil(pageCount * 2.5)),
        url: `/api/resources/${resource.id}/stream`,
      });

      console.log(`[ResourceIngestion] Completed processing resource ${resource.id} (Status: ${finalStatus}, Pages: ${pageCount})`);
      return updatedResource || resource;
    } catch (error: any) {
      console.error(`[ResourceIngestion] Pipeline failure for resource ${resource.id}:`, error);
      await resourceRepository.update(resource.id, {
        status: 'ERROR',
        description: `${description || ''}\n\n[Ingestion Error: ${error.message}]`.trim(),
      });
      throw error;
    }
  }

  /**
   * Creates page-aware knowledge chunks with citations and stores them in data_chunks.
   */
  private async createPageAwareChunks(
    docId: string,
    resourceId: string,
    resourceTitle: string,
    author: string | undefined,
    subject: string,
    fullText: string,
    totalPageCount: number
  ): Promise<number> {
    if (!fullText || fullText.trim().length === 0) {
      return 0;
    }

    // Split text by page delimiters, form feeds, or pdf-parse page boundaries
    const rawPages = fullText.split(/\x0c|\n(?=Page\s+\d+)|\s*--\s*\d+\s*of\s*\d+\s*--\s*/i);
    const pages: { pageNum: number; content: string }[] = [];

    if (rawPages.length > 1) {
      rawPages.forEach((p, idx) => {
        const trimmed = p.trim();
        if (trimmed.length > 30) {
          pages.push({ pageNum: idx + 1, content: trimmed });
        }
      });
    } else {
      // Estimate pages by dividing text evenly across totalPageCount
      const estimatedCharsPerPage = Math.max(800, Math.ceil(fullText.length / Math.max(1, totalPageCount)));
      for (let i = 0; i < fullText.length; i += estimatedCharsPerPage) {
        const pageNum = Math.floor(i / estimatedCharsPerPage) + 1;
        const pageContent = fullText.substring(i, i + estimatedCharsPerPage).trim();
        if (pageContent) {
          pages.push({ pageNum, content: pageContent });
        }
      }
    }

    let chunkIndex = 0;
    const chunkSize = 1200; // ~300 tokens per chunk
    const chunkOverlap = 150;

    for (const page of pages) {
      const pageText = page.content;

      for (let start = 0; start < pageText.length; start += (chunkSize - chunkOverlap)) {
        const end = Math.min(pageText.length, start + chunkSize);
        const chunkContent = pageText.substring(start, end).trim();

        if (chunkContent.length < 50) continue;

        const chunkId = `chk_res_${crypto.randomBytes(6).toString('hex')}`;
        const chunkHash = crypto.createHash('sha256').update(chunkContent).digest('hex');

        // Extract first heading or line
        const firstLine = chunkContent.split('\n')[0].replace(/^[#*\s-]+/, '').trim().substring(0, 100);
        const heading = firstLine || `${resourceTitle} - Page ${page.pageNum}`;
        const section = `Page ${page.pageNum}`;

        const metadata = {
          resourceId,
          resourceTitle,
          author: author || 'IKSHOVIA',
          subject,
          pageNumber: page.pageNum,
          totalPageCount,
          chunkHash,
        };

        await pool.query(
          `INSERT INTO public.data_chunks (
            id, document_id, chunk_index, content, token_count,
            character_count, heading, section, chunk_hash, metadata_json, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING`,
          [
            chunkId,
            docId,
            chunkIndex++,
            chunkContent,
            Math.ceil(chunkContent.length / 4),
            chunkContent.length,
            heading,
            section,
            chunkHash,
            JSON.stringify(metadata),
          ]
        );

        // Cap chunks per resource to 300 to prevent runaway bloat on massive 1000-page books
        if (chunkIndex >= 300) break;
      }
      if (chunkIndex >= 300) break;
    }

    console.log(`[ResourceIngestion] Indexed ${chunkIndex} knowledge chunks for '${resourceTitle}'`);
    return chunkIndex;
  }
}

export const resourceIngestionService = ResourceIngestionService.getInstance();

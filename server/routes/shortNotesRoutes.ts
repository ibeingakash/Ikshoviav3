import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { shortNotesRepository } from '../repositories/ShortNotesRepository.js';
import { runExistingOcrOnDocument } from '../services/shortNotes/shortNotesOcrAdapter.js';
import { ShortNotesStructureMapper } from '../services/shortNotes/shortNotesStructureMapper.js';
import { ShortNote, ShortNoteBlock, ResourceVisibility } from '../../src/types/index.js';

export function registerShortNotesRoutes(
  app: express.Express,
  requireAdmin: express.RequestHandler
) {
  // Helper to extract optional auth user
  const getUser = (req: express.Request) => {
    return (req as any).user || null;
  };

  // ==========================================
  // ADMIN SHORT NOTE ROUTES
  // ==========================================

  /**
   * POST /api/admin/short-notes/upload
   * Uploads Short Note PDF or Image, passes through EXISTING Test Paper OCR,
   * runs Structure Mapper, and prepares for Admin Review.
   */
  app.post('/api/admin/short-notes/upload', requireAdmin, async (req, res) => {
    try {
      const {
        title,
        exam,
        subject,
        topic,
        tags,
        description,
        year,
        language,
        visibility,
        fileBase64,
        fileName,
        autoPublish,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required for Short Note.' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ error: 'Subject is required (e.g. History, Polity, Economy, Environment).' });
      }
      if (!topic || !topic.trim()) {
        return res.status(400).json({ error: 'Topic is required.' });
      }
      if (!fileBase64) {
        return res.status(400).json({ error: 'File payload (fileBase64) is required.' });
      }

      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Uploaded file buffer is empty.' });
      }

      const noteId = `sn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const resourceId = `res_${noteId}`;
      const documentId = `doc_${noteId}`;

      // Save file to public/resources/ for permanent learner source provenance access
      const safeFileName = (fileName || `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`).replace(/\s+/g, '_');
      const publicDir = path.join(process.cwd(), 'public', 'resources');
      fs.mkdirSync(publicDir, { recursive: true });
      const savedFilePath = path.join(publicDir, `${noteId}_${safeFileName}`);
      fs.writeFileSync(savedFilePath, buffer);
      const sourceFileUrl = `/resources/${noteId}_${safeFileName}`;

      console.log(`[ShortNotes Upload] Running EXISTING Test Paper OCR on ${safeFileName} (${(buffer.length / 1024).toFixed(1)} KB)...`);

      const docLang = language === 'hi' ? 'HI' : language === 'en' ? 'EN' : 'BILINGUAL';
      const ocrResult = await runExistingOcrOnDocument(buffer, safeFileName, docLang);

      console.log(`[ShortNotes Upload] OCR finished using ${ocrResult.engineUsed}. Total chars: ${ocrResult.totalChars} across ${ocrResult.pageCount} pages.`);

      // Map OCR output through Short Notes Structure Mapper
      const blocks = ShortNotesStructureMapper.mapOcrPagesToBlocks(ocrResult.pages, {
        resourceId,
        documentId,
        title: title.trim(),
      });

      console.log(`[ShortNotes Upload] Structure Mapper generated ${blocks.length} structured revision blocks.`);

      const authUser = getUser(req);
      const uploadedBy = authUser?.email || authUser?.name || 'Admin';

      const shortNote: Omit<ShortNote, 'createdAt' | 'updatedAt'> = {
        id: noteId,
        resourceId,
        documentId,
        title: title.trim(),
        exam: exam || 'ALL',
        subject: subject.trim(),
        topic: topic.trim(),
        tags: Array.isArray(tags) ? tags : [],
        description: description?.trim() || '',
        year: year ? parseInt(year, 10) : null,
        language: (language as any) || 'en',
        visibility: (visibility as ResourceVisibility) || 'ALL_LEARNERS',
        status: autoPublish ? 'PUBLISHED' : 'REVIEW_REQUIRED',
        pageCount: ocrResult.pageCount || 1,
        blocks,
        rawOcrText: ocrResult.fullText,
        sourceFileUrl,
        reviewedBy: autoPublish ? uploadedBy : null,
        reviewedAt: autoPublish ? new Date().toISOString() : null,
      };

      const created = await shortNotesRepository.create(shortNote);

      return res.status(201).json({
        success: true,
        shortNote: created,
        ocrSummary: {
          engineUsed: ocrResult.engineUsed,
          pages: ocrResult.pageCount,
          totalChars: ocrResult.totalChars,
          blocksCount: blocks.length,
        },
        message: autoPublish
          ? 'Short Note uploaded, OCR-processed, mapped, and published.'
          : 'Short Note uploaded, OCR-processed, and ready for Admin Review.',
      });
    } catch (err: any) {
      console.error('[ShortNotes Upload] Failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to upload and process short note' });
    }
  });

  /**
   * GET /api/admin/short-notes
   * Lists short notes with administrative filters.
   */
  app.get('/api/admin/short-notes', requireAdmin, async (req, res) => {
    try {
      const { subject, topic, exam, status, search, limit, offset } = req.query;
      const result = await shortNotesRepository.findAll({
        subject: subject as string,
        topic: topic as string,
        exam: exam as string,
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/admin/short-notes/:id
   * Fetches full Short Note including blocks and raw OCR output for admin review.
   */
  app.get('/api/admin/short-notes/:id', requireAdmin, async (req, res) => {
    try {
      const note = await shortNotesRepository.findById(req.params.id);
      if (!note) {
        return res.status(404).json({ error: 'Short Note not found' });
      }
      return res.json({ success: true, shortNote: note });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * PUT /api/admin/short-notes/:id
   * Allows Admin Review: correct headings, text, tables, rows, columns, lists, and block ordering.
   */
  app.put('/api/admin/short-notes/:id', requireAdmin, async (req, res) => {
    try {
      const { title, subject, topic, tags, description, year, language, visibility, blocks } = req.body;
      const authUser = getUser(req);
      const reviewer = authUser?.email || authUser?.name || 'Admin';

      // Ensure block orders and IDs are intact
      let sanitizedBlocks: ShortNoteBlock[] | undefined = undefined;
      if (Array.isArray(blocks)) {
        sanitizedBlocks = blocks.map((b, idx) => ({
          ...b,
          id: b.id || `blk_${crypto.randomBytes(4).toString('hex')}`,
          order_index: typeof b.order_index === 'number' ? b.order_index : idx,
          page_number: b.page_number || 1,
        }));
      }

      const updated = await shortNotesRepository.update(req.params.id, {
        ...(title ? { title: title.trim() } : {}),
        ...(subject ? { subject: subject.trim() } : {}),
        ...(topic ? { topic: topic.trim() } : {}),
        ...(tags ? { tags } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(year !== undefined ? { year: year ? parseInt(year, 10) : null } : {}),
        ...(language ? { language } : {}),
        ...(visibility ? { visibility } : {}),
        ...(sanitizedBlocks ? { blocks: sanitizedBlocks } : {}),
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ error: 'Short Note not found' });
      }

      return res.json({
        success: true,
        shortNote: updated,
        message: 'Short note corrections saved successfully.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/short-notes/:id/publish
   * Publishes Short Note to the learner-facing library.
   */
  app.post('/api/admin/short-notes/:id/publish', requireAdmin, async (req, res) => {
    try {
      const authUser = getUser(req);
      const reviewer = authUser?.email || authUser?.name || 'Admin';

      const updated = await shortNotesRepository.update(req.params.id, {
        status: 'PUBLISHED',
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ error: 'Short Note not found' });
      }

      return res.json({
        success: true,
        shortNote: updated,
        message: 'Short note published successfully for learners.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/short-notes/:id/archive
   */
  app.post('/api/admin/short-notes/:id/archive', requireAdmin, async (req, res) => {
    try {
      const updated = await shortNotesRepository.update(req.params.id, {
        status: 'ARCHIVED',
      });
      if (!updated) return res.status(404).json({ error: 'Short Note not found' });
      return res.json({ success: true, shortNote: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * DELETE /api/admin/short-notes/:id
   */
  app.delete('/api/admin/short-notes/:id', requireAdmin, async (req, res) => {
    try {
      await shortNotesRepository.delete(req.params.id);
      return res.json({ success: true, message: 'Short Note deleted.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // LEARNER SHORT NOTE ROUTES
  // ==========================================

  /**
   * GET /api/short-notes/hierarchy
   * Returns Subject -> Topic -> Short Note hierarchy tree.
   * Examples:
   * History -> Ancient History, Medieval History, Modern History
   * Polity -> Constitution, Fundamental Rights, Parliament
   * Economy -> Inflation, Banking, Monetary Policy
   * Environment -> Ecology, Biodiversity, Climate Change
   */
  app.get('/api/short-notes/hierarchy', async (req, res) => {
    try {
      const exam = (req.query.exam as string) || 'ALL';
      const authUser = getUser(req);
      const hierarchy = await shortNotesRepository.getHierarchy(exam, authUser?.id);
      return res.json({ success: true, ...hierarchy });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/short-notes
   * Filtered published short notes list.
   */
  app.get('/api/short-notes', async (req, res) => {
    try {
      const { subject, topic, exam, search, onlyBookmarked, onlyReviewed, limit, offset } = req.query;
      const authUser = getUser(req);

      const result = await shortNotesRepository.findAll({
        status: 'PUBLISHED',
        subject: subject as string,
        topic: topic as string,
        exam: exam as string,
        search: search as string,
        userId: authUser?.id,
        onlyBookmarked: onlyBookmarked === 'true',
        onlyReviewed: onlyReviewed === 'true',
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/short-notes/:id
   * Fetches published short note with blocks, source provenance, progress, and bookmark status.
   */
  app.get('/api/short-notes/:id', async (req, res) => {
    try {
      const authUser = getUser(req);
      const note = await shortNotesRepository.findById(req.params.id, authUser?.id);

      if (!note) {
        return res.status(404).json({ error: 'Short Note not found' });
      }

      // Security: Non-admin learners can only access PUBLISHED notes
      const isAdmin = authUser?.role === 'admin' || authUser?.role === 'superadmin';
      if (!isAdmin && note.status !== 'PUBLISHED') {
        return res.status(403).json({ error: 'This short note is not published yet.' });
      }

      return res.json({ success: true, shortNote: note });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/short-notes/:id/bookmark
   * Learner toggle bookmark for entire note or specific block.
   */
  app.post('/api/short-notes/:id/bookmark', async (req, res) => {
    try {
      const authUser = getUser(req);
      const userId = authUser?.id || 'demo_learner';
      const { blockId } = req.body;

      const result = await shortNotesRepository.toggleBookmark(req.params.id, userId, blockId);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/short-notes/:id/progress
   * Updates reading progress, marks reviewed, or saves last page/block.
   */
  app.post('/api/short-notes/:id/progress', async (req, res) => {
    try {
      const authUser = getUser(req);
      const userId = authUser?.id || 'demo_learner';
      const { progressPercentage, isReviewed, lastPage, lastBlockId } = req.body;

      const result = await shortNotesRepository.updateProgress(
        req.params.id,
        userId,
        typeof progressPercentage === 'number' ? progressPercentage : 0,
        isReviewed,
        lastPage,
        lastBlockId
      );

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}

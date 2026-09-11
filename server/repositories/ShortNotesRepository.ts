import pool from '../db/pool.js';
import crypto from 'crypto';
import {
  ShortNote,
  ShortNoteBlock,
  ShortNotesHierarchyResponse,
  ShortNotesSubjectNode,
  ShortNotesTopicNode,
} from '../../src/types/index.js';

export interface ShortNotesQueryOptions {
  subject?: string;
  topic?: string;
  exam?: string;
  status?: string;
  search?: string;
  userId?: string;
  onlyBookmarked?: boolean;
  onlyReviewed?: boolean;
  limit?: number;
  offset?: number;
}

export class ShortNotesRepository {
  private inMemoryNotes: Map<string, ShortNote> = new Map();
  private inMemoryBookmarks: Set<string> = new Set(); // `${userId}_${noteId}_${blockId || 'note'}`
  private inMemoryProgress: Map<string, { progressPercentage: number; isReviewed: boolean; lastPage?: number; lastBlockId?: string }> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private hasSeeded = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.isInitialized = true;
      try {
        if (pool) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS short_notes (
              id VARCHAR(120) PRIMARY KEY,
              resource_id VARCHAR(120),
              document_id VARCHAR(120),
              title VARCHAR(500) NOT NULL,
              exam VARCHAR(100) DEFAULT 'ALL',
              subject VARCHAR(200) NOT NULL,
              topic VARCHAR(200) NOT NULL,
              tags JSONB DEFAULT '[]',
              description TEXT,
              year INT,
              language VARCHAR(20) DEFAULT 'en',
              visibility VARCHAR(50) DEFAULT 'ALL_LEARNERS',
              status VARCHAR(50) DEFAULT 'PUBLISHED',
              page_count INT DEFAULT 1,
              raw_ocr_text TEXT,
              source_file_url TEXT,
              reviewed_by VARCHAR(200),
              reviewed_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS short_note_blocks (
              id VARCHAR(120) PRIMARY KEY,
              short_note_id VARCHAR(120) REFERENCES short_notes(id) ON DELETE CASCADE,
              resource_id VARCHAR(120),
              document_id VARCHAR(120),
              page_number INT DEFAULT 1,
              order_index INT NOT NULL,
              type VARCHAR(50) NOT NULL,
              text TEXT,
              level INT,
              items JSONB,
              table_data JSONB,
              fact_box JSONB,
              comparison JSONB,
              timeline JSONB,
              important_points JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS short_note_user_progress (
              user_id VARCHAR(120) NOT NULL,
              short_note_id VARCHAR(120) REFERENCES short_notes(id) ON DELETE CASCADE,
              progress_percentage INT DEFAULT 0,
              is_reviewed BOOLEAN DEFAULT FALSE,
              last_page INT DEFAULT 1,
              last_block_id VARCHAR(120),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              PRIMARY KEY (user_id, short_note_id)
            );

            CREATE TABLE IF NOT EXISTS short_note_bookmarks (
              id VARCHAR(120) PRIMARY KEY,
              user_id VARCHAR(120) NOT NULL,
              short_note_id VARCHAR(120) REFERENCES short_notes(id) ON DELETE CASCADE,
              block_id VARCHAR(120),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE (user_id, short_note_id, block_id)
            );

            CREATE INDEX IF NOT EXISTS idx_short_notes_subject_topic ON short_notes(subject, topic);
            CREATE INDEX IF NOT EXISTS idx_short_notes_status ON short_notes(status);
            CREATE INDEX IF NOT EXISTS idx_short_note_blocks_note ON short_note_blocks(short_note_id, order_index);
          `);
          console.log('[ShortNotesRepository] PostgreSQL schema verified successfully.');
        }
      } catch (err: any) {
        console.warn('[ShortNotesRepository] DB schema init notice (fallback to memory if needed):', err.message);
      }

      // Seed canonical high-yield revision notes if empty
      await this.seedCanonicalNotes();
    })();

    return this.initPromise;
  }

  public async create(note: Omit<ShortNote, 'createdAt' | 'updatedAt'>): Promise<ShortNote> {
    await this.init();
    const now = new Date().toISOString();
    const fullNote: ShortNote = {
      ...note,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (pool) {
        await pool.query(
          `INSERT INTO short_notes (
            id, resource_id, document_id, title, exam, subject, topic, tags,
            description, year, language, visibility, status, page_count,
            raw_ocr_text, source_file_url, reviewed_by, reviewed_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            subject = EXCLUDED.subject,
            topic = EXCLUDED.topic,
            tags = EXCLUDED.tags,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            reviewed_by = EXCLUDED.reviewed_by,
            reviewed_at = EXCLUDED.reviewed_at,
            updated_at = EXCLUDED.updated_at;`,
          [
            fullNote.id,
            fullNote.resourceId,
            fullNote.documentId || null,
            fullNote.title,
            fullNote.exam,
            fullNote.subject,
            fullNote.topic,
            JSON.stringify(fullNote.tags || []),
            fullNote.description || null,
            fullNote.year || null,
            fullNote.language,
            fullNote.visibility,
            fullNote.status,
            fullNote.pageCount || 1,
            fullNote.rawOcrText || null,
            fullNote.sourceFileUrl || null,
            fullNote.reviewedBy || null,
            fullNote.reviewedAt || null,
            now,
            now,
          ]
        );

        // Insert blocks
        if (fullNote.blocks && fullNote.blocks.length > 0) {
          await pool.query(`DELETE FROM short_note_blocks WHERE short_note_id = $1`, [fullNote.id]);
          for (let i = 0; i < fullNote.blocks.length; i++) {
            const b = fullNote.blocks[i];
            await pool.query(
              `INSERT INTO short_note_blocks (
                id, short_note_id, resource_id, document_id, page_number, order_index,
                type, text, level, items, table_data, fact_box, comparison, timeline, important_points
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
              [
                b.id || `blk_${crypto.randomBytes(4).toString('hex')}`,
                fullNote.id,
                b.resource_id || fullNote.resourceId,
                b.document_id || fullNote.documentId || null,
                b.page_number || 1,
                typeof b.order_index === 'number' ? b.order_index : i,
                b.type,
                b.text || null,
                b.level || null,
                b.items ? JSON.stringify(b.items) : null,
                b.table ? JSON.stringify(b.table) : null,
                b.factBox ? JSON.stringify(b.factBox) : null,
                b.comparison ? JSON.stringify(b.comparison) : null,
                b.timeline ? JSON.stringify(b.timeline) : null,
                b.importantPoints ? JSON.stringify(b.importantPoints) : null,
              ]
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB create failed, saving to in-memory store:', err.message);
    }

    this.inMemoryNotes.set(fullNote.id, fullNote);
    return fullNote;
  }

  public async update(id: string, partial: Partial<ShortNote>): Promise<ShortNote | null> {
    await this.init();
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ShortNote = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (pool) {
        await pool.query(
          `UPDATE short_notes SET
            title = COALESCE($1, title),
            subject = COALESCE($2, subject),
            topic = COALESCE($3, topic),
            tags = COALESCE($4, tags),
            description = COALESCE($5, description),
            year = COALESCE($6, year),
            language = COALESCE($7, language),
            visibility = COALESCE($8, visibility),
            status = COALESCE($9, status),
            reviewed_by = COALESCE($10, reviewed_by),
            reviewed_at = COALESCE($11, reviewed_at),
            updated_at = NOW()
          WHERE id = $12;`,
          [
            partial.title || null,
            partial.subject || null,
            partial.topic || null,
            partial.tags ? JSON.stringify(partial.tags) : null,
            partial.description !== undefined ? partial.description : null,
            partial.year !== undefined ? partial.year : null,
            partial.language || null,
            partial.visibility || null,
            partial.status || null,
            partial.reviewedBy || null,
            partial.reviewedAt || null,
            id,
          ]
        );

        if (partial.blocks && Array.isArray(partial.blocks)) {
          await pool.query(`DELETE FROM short_note_blocks WHERE short_note_id = $1`, [id]);
          for (let i = 0; i < partial.blocks.length; i++) {
            const b = partial.blocks[i];
            await pool.query(
              `INSERT INTO short_note_blocks (
                id, short_note_id, resource_id, document_id, page_number, order_index,
                type, text, level, items, table_data, fact_box, comparison, timeline, important_points
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
              [
                b.id || `blk_${crypto.randomBytes(4).toString('hex')}`,
                id,
                b.resource_id || existing.resourceId,
                b.document_id || existing.documentId || null,
                b.page_number || 1,
                typeof b.order_index === 'number' ? b.order_index : i,
                b.type,
                b.text || null,
                b.level || null,
                b.items ? JSON.stringify(b.items) : null,
                b.table ? JSON.stringify(b.table) : null,
                b.factBox ? JSON.stringify(b.factBox) : null,
                b.comparison ? JSON.stringify(b.comparison) : null,
                b.timeline ? JSON.stringify(b.timeline) : null,
                b.importantPoints ? JSON.stringify(b.importantPoints) : null,
              ]
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB update failed, falling back to memory:', err.message);
    }

    this.inMemoryNotes.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    await this.init();
    try {
      if (pool) {
        // Retrieve note to inspect source_file_url and resource_id for file cleanup
        const noteRes = await pool.query(`SELECT * FROM short_notes WHERE id = $1`, [id]);
        const note = noteRes.rows[0];

        if (note) {
          // 1. Delete local temp file cache if present in /uploads/
          if (note.source_file_url && typeof note.source_file_url === 'string') {
            try {
              const fs = await import('fs');
              const path = await import('path');
              if (note.source_file_url.startsWith('/uploads/short_notes/')) {
                const localFilePath = path.resolve(process.cwd(), 'public', note.source_file_url.replace(/^\//, ''));
                if (fs.existsSync(localFilePath)) {
                  fs.unlinkSync(localFilePath);
                }
              }
            } catch (fErr: any) {
              console.warn('[ShortNotesRepository] Local file cleanup notice:', fErr?.message);
            }
          }
        }

        // 2. Clean up associated blocks, progress and bookmarks (cascaded safely)
        // DO NOT delete shared resources, books, questions or Google Drive files
        await pool.query(`DELETE FROM short_note_bookmarks WHERE short_note_id = $1`, [id]);
        await pool.query(`DELETE FROM short_note_user_progress WHERE short_note_id = $1`, [id]);
        await pool.query(`DELETE FROM short_note_blocks WHERE short_note_id = $1`, [id]);

        // 3. Delete the note record
        await pool.query(`DELETE FROM short_notes WHERE id = $1`, [id]);
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB delete failed:', err.message);
    }
    this.inMemoryNotes.delete(id);
    return true;
  }

  public async findById(id: string, userId?: string): Promise<ShortNote | null> {
    await this.init();

    try {
      if (pool) {
        const res = await pool.query(`SELECT * FROM short_notes WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const blocksRes = await pool.query(
            `SELECT * FROM short_note_blocks WHERE short_note_id = $1 ORDER BY order_index ASC`,
            [id]
          );

          const blocks: ShortNoteBlock[] = blocksRes.rows.map(b => ({
            id: b.id,
            type: b.type,
            resource_id: b.resource_id,
            document_id: b.document_id,
            page_number: b.page_number,
            order_index: b.order_index,
            text: b.text || undefined,
            level: b.level || undefined,
            items: b.items ? (typeof b.items === 'string' ? JSON.parse(b.items) : b.items) : undefined,
            table: b.table_data ? (typeof b.table_data === 'string' ? JSON.parse(b.table_data) : b.table_data) : undefined,
            factBox: b.fact_box ? (typeof b.fact_box === 'string' ? JSON.parse(b.fact_box) : b.fact_box) : undefined,
            comparison: b.comparison ? (typeof b.comparison === 'string' ? JSON.parse(b.comparison) : b.comparison) : undefined,
            timeline: b.timeline ? (typeof b.timeline === 'string' ? JSON.parse(b.timeline) : b.timeline) : undefined,
            importantPoints: b.important_points ? (typeof b.important_points === 'string' ? JSON.parse(b.important_points) : b.important_points) : undefined,
          }));

          let isBookmarked = false;
          let progressPercentage = 0;
          let isReviewed = false;
          let lastPage = 1;

          if (userId) {
            const bmRes = await pool.query(
              `SELECT 1 FROM short_note_bookmarks WHERE user_id = $1 AND short_note_id = $2 AND (block_id IS NULL OR block_id = '')`,
              [userId, id]
            );
            isBookmarked = bmRes.rows.length > 0;

            const progRes = await pool.query(
              `SELECT progress_percentage, is_reviewed, last_page FROM short_note_user_progress WHERE user_id = $1 AND short_note_id = $2`,
              [userId, id]
            );
            if (progRes.rows.length > 0) {
              progressPercentage = progRes.rows[0].progress_percentage || 0;
              isReviewed = progRes.rows[0].is_reviewed || false;
              lastPage = progRes.rows[0].last_page || 1;
            }
          }

          const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [];

          return {
            id: row.id,
            resourceId: row.resource_id,
            documentId: row.document_id,
            title: row.title,
            exam: row.exam,
            subject: row.subject,
            topic: row.topic,
            tags,
            description: row.description,
            year: row.year,
            language: row.language,
            visibility: row.visibility,
            status: row.status,
            pageCount: row.page_count,
            blocks,
            rawOcrText: row.raw_ocr_text,
            sourceFileUrl: row.source_file_url,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
            isBookmarked,
            isReviewed,
            progressPercentage,
            lastPage,
          };
        }
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB findById error:', err.message);
    }

    // Fallback to memory
    const memory = this.inMemoryNotes.get(id);
    if (!memory) return null;

    const note = { ...memory };
    if (userId) {
      note.isBookmarked = this.inMemoryBookmarks.has(`${userId}_${id}_note`);
      const prog = this.inMemoryProgress.get(`${userId}_${id}`);
      if (prog) {
        note.progressPercentage = prog.progressPercentage;
        note.isReviewed = prog.isReviewed;
        note.lastPage = prog.lastPage;
      }
    }
    return note;
  }

  public async findAll(options: ShortNotesQueryOptions): Promise<{ notes: ShortNote[]; total: number }> {
    await this.init();

    try {
      if (pool) {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let pIdx = 1;

        if (options.status) {
          conditions.push(`sn.status = $${pIdx++}`);
          params.push(options.status);
        }
        if (options.subject) {
          conditions.push(`LOWER(sn.subject) = LOWER($${pIdx++})`);
          params.push(options.subject);
        }
        if (options.topic) {
          conditions.push(`LOWER(sn.topic) = LOWER($${pIdx++})`);
          params.push(options.topic);
        }
        if (options.exam && options.exam !== 'ALL') {
          conditions.push(`(sn.exam = $${pIdx++} OR sn.exam = 'ALL')`);
          params.push(options.exam);
        }
        if (options.search) {
          conditions.push(`(LOWER(sn.title) LIKE $${pIdx} OR LOWER(sn.topic) LIKE $${pIdx} OR LOWER(sn.subject) LIKE $${pIdx} OR LOWER(sn.description) LIKE $${pIdx})`);
          params.push(`%${options.search.toLowerCase()}%`);
          pIdx++;
        }

        let userParamPlaceholder = '';
        if (options.userId) {
          params.push(options.userId);
          userParamPlaceholder = `$${pIdx++}`;
        }

        if (options.onlyBookmarked && userParamPlaceholder) {
          conditions.push(`b.id IS NOT NULL`);
        }
        if (options.onlyReviewed && userParamPlaceholder) {
          conditions.push(`p.is_reviewed = true`);
        }

        const joinBookmarks = userParamPlaceholder
          ? `LEFT JOIN short_note_bookmarks b ON b.short_note_id = sn.id AND b.user_id = ${userParamPlaceholder}`
          : `LEFT JOIN (SELECT NULL::text AS id, NULL::text AS short_note_id) b ON 1=0`;

        const joinProgress = userParamPlaceholder
          ? `LEFT JOIN short_note_user_progress p ON p.short_note_id = sn.id AND p.user_id = ${userParamPlaceholder}`
          : `LEFT JOIN (SELECT 0 AS progress_percentage, false AS is_reviewed, NULL::text AS short_note_id) p ON 1=0`;

        const countQuery = `
          SELECT COUNT(DISTINCT sn.id) 
          FROM short_notes sn
          ${joinBookmarks}
          ${joinProgress}
          WHERE ${conditions.join(' AND ')}
        `;
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const limit = options.limit || 50;
        const offset = options.offset || 0;
        params.push(limit, offset);

        const listQuery = `
          SELECT
            sn.id,
            sn.resource_id,
            sn.document_id,
            sn.title,
            sn.exam,
            sn.subject,
            sn.topic,
            sn.tags,
            sn.description,
            sn.year,
            sn.language,
            sn.visibility,
            sn.status,
            sn.page_count,
            sn.source_file_url,
            sn.reviewed_by,
            sn.reviewed_at,
            sn.created_at,
            sn.updated_at,
            (b.id IS NOT NULL) AS is_bookmarked,
            COALESCE(p.progress_percentage, 0) AS progress_percentage,
            COALESCE(p.is_reviewed, false) AS is_reviewed
          FROM short_notes sn
          ${joinBookmarks}
          ${joinProgress}
          WHERE ${conditions.join(' AND ')}
          ORDER BY sn.created_at DESC
          LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;

        const res = await pool.query(listQuery, params);
        const notes: ShortNote[] = res.rows.map(row => {
          const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [];
          return {
            id: row.id,
            resourceId: row.resource_id,
            documentId: row.document_id,
            title: row.title,
            exam: row.exam,
            subject: row.subject,
            topic: row.topic,
            tags,
            description: row.description,
            year: row.year,
            language: row.language,
            visibility: row.visibility,
            status: row.status,
            pageCount: row.page_count,
            blocks: [], // summary list does not fetch heavy blocks for performance
            sourceFileUrl: row.source_file_url,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
            isBookmarked: Boolean(row.is_bookmarked),
            isReviewed: Boolean(row.is_reviewed),
            progressPercentage: Number(row.progress_percentage) || 0,
          };
        });

        return { notes, total };
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB findAll error:', err.message);
    }

    // In-Memory Fallback
    let list = Array.from(this.inMemoryNotes.values());

    if (options.status) {
      list = list.filter(n => n.status === options.status);
    }
    if (options.subject) {
      list = list.filter(n => n.subject.toLowerCase() === options.subject!.toLowerCase());
    }
    if (options.topic) {
      list = list.filter(n => n.topic.toLowerCase() === options.topic!.toLowerCase());
    }
    if (options.exam && options.exam !== 'ALL') {
      list = list.filter(n => n.exam === options.exam || n.exam === 'ALL');
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.topic.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          (n.description && n.description.toLowerCase().includes(q))
      );
    }

    if (options.userId) {
      list = list.map(n => {
        const isBookmarked = this.inMemoryBookmarks.has(`${options.userId}_${n.id}_note`);
        const prog = this.inMemoryProgress.get(`${options.userId}_${n.id}`);
        return {
          ...n,
          isBookmarked,
          isReviewed: prog?.isReviewed || false,
          progressPercentage: prog?.progressPercentage || 0,
        };
      });

      if (options.onlyBookmarked) {
        list = list.filter(n => n.isBookmarked);
      }
      if (options.onlyReviewed) {
        list = list.filter(n => n.isReviewed);
      }
    }

    const total = list.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const notes = list.slice(offset, offset + limit);

    return { notes, total };
  }

  public async getHierarchy(exam: string = 'ALL', userId?: string): Promise<ShortNotesHierarchyResponse> {
    const { notes } = await this.findAll({
      status: 'PUBLISHED',
      exam: exam === 'ALL' ? undefined : exam,
      userId,
      limit: 1000,
    });

    const subjectMap = new Map<string, Map<string, ShortNote[]>>();

    for (const note of notes) {
      if (!subjectMap.has(note.subject)) {
        subjectMap.set(note.subject, new Map());
      }
      const topicMap = subjectMap.get(note.subject)!;
      if (!topicMap.has(note.topic)) {
        topicMap.set(note.topic, []);
      }
      topicMap.get(note.topic)!.push(note);
    }

    let totalReviewed = 0;
    const subjects: ShortNotesSubjectNode[] = [];

    for (const [subjectName, topicMap] of subjectMap.entries()) {
      const topics: ShortNotesTopicNode[] = [];
      let subjNotesCount = 0;
      let subjReviewedCount = 0;

      for (const [topicName, noteList] of topicMap.entries()) {
        const reviewedInTopic = noteList.filter(n => n.isReviewed).length;
        topics.push({
          topic: topicName,
          notesCount: noteList.length,
          reviewedCount: reviewedInTopic,
          notes: noteList,
        });
        subjNotesCount += noteList.length;
        subjReviewedCount += reviewedInTopic;
      }

      totalReviewed += subjReviewedCount;
      subjects.push({
        subject: subjectName,
        topicsCount: topics.length,
        notesCount: subjNotesCount,
        reviewedCount: subjReviewedCount,
        topics,
      });
    }

    // Sort subjects canonically: History, Polity, Economy, Environment, Geography, Science & Tech
    const canonicalOrder = ['History', 'Polity', 'Economy', 'Environment', 'Geography', 'Science & Technology'];
    subjects.sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a.subject);
      const idxB = canonicalOrder.indexOf(b.subject);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.subject.localeCompare(b.subject);
    });

    return {
      subjects,
      totalNotes: notes.length,
      totalReviewed,
    };
  }

  public async toggleBookmark(
    shortNoteId: string,
    userId: string,
    blockId?: string
  ): Promise<{ bookmarked: boolean }> {
    await this.init();
    const key = `${userId}_${shortNoteId}_${blockId || 'note'}`;

    try {
      if (pool) {
        const check = await pool.query(
          `SELECT id FROM short_note_bookmarks WHERE user_id = $1 AND short_note_id = $2 AND (block_id = $3 OR ($3 IS NULL AND block_id IS NULL))`,
          [userId, shortNoteId, blockId || null]
        );

        if (check.rows.length > 0) {
          await pool.query(
            `DELETE FROM short_note_bookmarks WHERE user_id = $1 AND short_note_id = $2 AND (block_id = $3 OR ($3 IS NULL AND block_id IS NULL))`,
            [userId, shortNoteId, blockId || null]
          );
          this.inMemoryBookmarks.delete(key);
          return { bookmarked: false };
        } else {
          await pool.query(
            `INSERT INTO short_note_bookmarks (id, user_id, short_note_id, block_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT DO NOTHING`,
            [`bm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`, userId, shortNoteId, blockId || null]
          );
          this.inMemoryBookmarks.add(key);
          return { bookmarked: true };
        }
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB toggleBookmark fallback:', err.message);
    }

    if (this.inMemoryBookmarks.has(key)) {
      this.inMemoryBookmarks.delete(key);
      return { bookmarked: false };
    } else {
      this.inMemoryBookmarks.add(key);
      return { bookmarked: true };
    }
  }

  public async updateProgress(
    shortNoteId: string,
    userId: string,
    progressPercentage: number,
    isReviewed?: boolean,
    lastPage?: number,
    lastBlockId?: string
  ): Promise<{ progressPercentage: number; isReviewed: boolean }> {
    await this.init();
    const capped = Math.max(0, Math.min(100, Math.round(progressPercentage)));
    const reviewed = isReviewed !== undefined ? isReviewed : capped >= 100;

    try {
      if (pool) {
        await pool.query(
          `INSERT INTO short_note_user_progress (
            user_id, short_note_id, progress_percentage, is_reviewed, last_page, last_block_id, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (user_id, short_note_id) DO UPDATE SET
            progress_percentage = GREATEST(short_note_user_progress.progress_percentage, EXCLUDED.progress_percentage),
            is_reviewed = EXCLUDED.is_reviewed OR short_note_user_progress.is_reviewed,
            last_page = COALESCE(EXCLUDED.last_page, short_note_user_progress.last_page),
            last_block_id = COALESCE(EXCLUDED.last_block_id, short_note_user_progress.last_block_id),
            updated_at = NOW()`,
          [userId, shortNoteId, capped, reviewed, lastPage || 1, lastBlockId || null]
        );
      }
    } catch (err: any) {
      console.warn('[ShortNotesRepository] DB updateProgress fallback:', err.message);
    }

    this.inMemoryProgress.set(`${userId}_${shortNoteId}`, {
      progressPercentage: capped,
      isReviewed: reviewed,
      lastPage,
      lastBlockId,
    });

    return { progressPercentage: capped, isReviewed: reviewed };
  }

  /**
   * Seed canonical high-yield revision short notes for UPSC and BPSC civil services
   */
  private async seedCanonicalNotes(): Promise<void> {
    if (this.hasSeeded) return;
    this.hasSeeded = true;

    const canonicalSeeds: Omit<ShortNote, 'createdAt' | 'updatedAt'>[] = [
      // 1. Modern History - Governor Generals & Major Constitutional Acts
      {
        id: 'sn_hist_gov_acts',
        resourceId: 'res_hist_gov_acts',
        title: 'Governor-Generals, Viceroys & Major Constitutional Acts (1773–1947)',
        exam: 'ALL',
        subject: 'History',
        topic: 'Modern History & British Rule',
        tags: ['History', 'Modern India', 'Acts', 'Governor Generals', 'High-Yield'],
        description: 'Chronological revision of key British enactments, executive measures, and constitutional landmarks.',
        year: 2025,
        language: 'en',
        visibility: 'ALL_LEARNERS',
        status: 'PUBLISHED',
        pageCount: 2,
        reviewedBy: 'Academic Council',
        reviewedAt: new Date().toISOString(),
        blocks: [
          {
            id: 'blk_hist_1',
            type: 'heading',
            resource_id: 'res_hist_gov_acts',
            page_number: 1,
            order_index: 0,
            text: 'Constitutional Landmark Acts (1773 – 1935)',
            level: 1,
          },
          {
            id: 'blk_hist_2',
            type: 'important_points',
            resource_id: 'res_hist_gov_acts',
            page_number: 1,
            order_index: 1,
            importantPoints: {
              calloutType: 'key',
              points: [
                'Regulating Act 1773 created the office of Governor-General of Bengal (Warren Hastings).',
                'Charter Act 1833 made Governor-General of Bengal into Governor-General of India (Lord William Bentinck).',
                'Government of India Act 1858 transferred power to the British Crown, designating GG as Viceroy (Lord Canning).',
              ],
            },
          },
          {
            id: 'blk_hist_3',
            type: 'timeline',
            resource_id: 'res_hist_gov_acts',
            page_number: 1,
            order_index: 2,
            timeline: {
              events: [
                { timeOrYear: '1773', title: 'Regulating Act', description: 'Supreme Court at Calcutta established (1774); Warren Hastings first GG of Bengal.' },
                { timeOrYear: '1784', title: "Pitt's India Act", description: 'Established dual system of control: Board of Control (political) & Court of Directors (commercial).' },
                { timeOrYear: '1813', title: 'Charter Act', description: 'Abolished company monopoly except for trade in tea and trade with China; ₹1 lakh grant for Indian education.' },
                { timeOrYear: '1833', title: 'Charter Act', description: 'Complete end of EIC commercial activities; Macaulay Law Commission appointed; Bentinck enacted abolition of Sati.' },
                { timeOrYear: '1853', title: 'Charter Act', description: 'Separated executive and legislative functions of the Governor General Council; introduced open civil service competition.' },
                { timeOrYear: '1858', title: 'GoI Act (Good Governance)', description: 'Abolished Board of Control and Court of Directors; Secretary of State for India created with 15-member council.' },
                { timeOrYear: '1909', title: 'Morley-Minto Reforms', description: 'Introduced separate electorates for Muslims; Satyendra Prasad Sinha first Indian in Viceroy Executive Council.' },
                { timeOrYear: '1919', title: 'Montagu-Chelmsford Reforms', description: 'Dyarchy introduced in provinces (Transferred vs Reserved subjects); bicameralism at Centre.' },
                { timeOrYear: '1935', title: 'GoI Act 1935', description: 'Provincial autonomy; Federal Court; Reserve Bank of India; dyarchy abolished at provinces and introduced at Centre.' },
              ],
            },
          },
          {
            id: 'blk_hist_4',
            type: 'table',
            resource_id: 'res_hist_gov_acts',
            page_number: 2,
            order_index: 3,
            table: {
              headers: ['Governor-General / Viceroy', 'Period', 'Key Achievements & Enactments'],
              rows: [
                ['Warren Hastings', '1772–1785', 'Abolished Dual Government of Bengal; Asiatic Society of Bengal (1784).'],
                ['Lord Cornwallis', '1786–1793', 'Permanent Settlement of Bengal (1793); Father of Civil Services in India; Police reforms.'],
                ['Lord Wellesley', '1798–1805', 'Subsidiary Alliance system introduced (First state: Hyderabad 1798); Fort William College.'],
                ['Lord William Bentinck', '1828–1835', 'Abolition of Sati (1829, Reg XVII); Suppression of Thuggee (William Sleeman); English Education Act 1835.'],
                ['Lord Dalhousie', '1848–1856', 'Doctrine of Lapse (Satara 1848, Jhansi, Nagpur); First Railway Line (1853 Bombay-Thane); Telegraph line; Woods Despatch (1854).'],
                ['Lord Ripon', '1880–1884', 'Father of Local Self Government (1882); Repealed Vernacular Press Act (1882); Ilbert Bill controversy.'],
                ['Lord Curzon', '1899–1905', 'Partition of Bengal (1905); Archaeological Survey of India revitalized; Ancient Monuments Preservation Act.'],
              ],
            },
          },
        ],
      },

      // 2. Indian Polity - Fundamental Rights vs Directive Principles
      {
        id: 'sn_pol_fr_dpsp',
        resourceId: 'res_pol_fr_dpsp',
        title: 'Fundamental Rights vs Directive Principles of State Policy',
        exam: 'ALL',
        subject: 'Polity',
        topic: 'Constitutional Framework & Rights',
        tags: ['Polity', 'Constitution', 'Fundamental Rights', 'DPSP', 'Amendments'],
        description: 'Complete comparison, judicial conflicts (Champakam to Minerva Mills), and harmonisation doctrine.',
        year: 2025,
        language: 'en',
        visibility: 'ALL_LEARNERS',
        status: 'PUBLISHED',
        pageCount: 2,
        reviewedBy: 'Academic Council',
        reviewedAt: new Date().toISOString(),
        blocks: [
          {
            id: 'blk_pol_1',
            type: 'heading',
            resource_id: 'res_pol_fr_dpsp',
            page_number: 1,
            order_index: 0,
            text: 'Constitutional Foundation & Comparison Matrix',
            level: 1,
          },
          {
            id: 'blk_pol_2',
            type: 'comparison_block',
            resource_id: 'res_pol_fr_dpsp',
            page_number: 1,
            order_index: 1,
            comparison: {
              headers: ['Aspect', 'Fundamental Rights (Part III)', 'Directive Principles (Part IV)'],
              rows: [
                { aspect: 'Source Constitution', left: 'Bill of Rights (USA)', right: 'Irish Constitution (Ireland)' },
                { aspect: 'Articles Encompassed', left: 'Articles 12 to 35', right: 'Articles 36 to 51' },
                { aspect: 'Nature & Enforceability', left: 'Justiciable (Article 32 & 226)', right: 'Non-justiciable (Article 37)' },
                { aspect: 'Objective', left: 'Establishes Political Democracy', right: 'Establishes Social & Economic Democracy (Welfare State)' },
                { aspect: 'Legal Sanction', left: 'Negative obligations on State', right: 'Positive instructions to State governance' },
                { aspect: 'Suspension', left: 'Can be suspended during Emergency (Except Arts 20 & 21)', right: 'Cannot be suspended (permanent governance guidance)' },
              ],
            },
          },
          {
            id: 'blk_pol_3',
            type: 'fact_box',
            resource_id: 'res_pol_fr_dpsp',
            page_number: 1,
            order_index: 2,
            factBox: {
              title: 'Evolution of FR vs DPSP Primacy (Landmark Judgments)',
              facts: [
                'State of Madras v. Champakam Dorairajan (1951): FRs are sacrosanct; DPSPs must run subsidiary to FRs.',
                'Golak Nath Case (1967): Parliament cannot abridge or take away any Fundamental Right via constitutional amendment.',
                '25th Constitutional Amendment (1971): Inserted Article 31C, giving primacy to Art 39(b) & (c) over Articles 14 and 19.',
                'Kesavananda Bharati (1973): Upheld Article 31C part 1; introduced Basic Structure Doctrine.',
                'Minerva Mills Case (1980): The Indian Constitution is founded on the bedrock of the balance between Part III and Part IV. Giving absolute primacy to one over the other destroys the harmony of the Constitution.',
              ],
            },
          },
        ],
      },

      // 3. Indian Economy - Monetary Policy & RBI Framework
      {
        id: 'sn_econ_monetary_policy',
        resourceId: 'res_econ_monetary_policy',
        title: 'Monetary Policy Framework & RBI Policy Instruments',
        exam: 'ALL',
        subject: 'Economy',
        topic: 'Money, Banking & Monetary Policy',
        tags: ['Economy', 'RBI', 'Monetary Policy', 'Inflation', 'Repo Rate', 'SLR', 'CRR'],
        description: 'Deep dive into quantitative and qualitative credit control tools, MPC composition, and inflation targeting.',
        year: 2025,
        language: 'en',
        visibility: 'ALL_LEARNERS',
        status: 'PUBLISHED',
        pageCount: 2,
        reviewedBy: 'Academic Council',
        reviewedAt: new Date().toISOString(),
        blocks: [
          {
            id: 'blk_econ_1',
            type: 'heading',
            resource_id: 'res_econ_monetary_policy',
            page_number: 1,
            order_index: 0,
            text: 'Monetary Policy Committee (MPC) Architecture',
            level: 1,
          },
          {
            id: 'blk_econ_2',
            type: 'important_points',
            resource_id: 'res_econ_monetary_policy',
            page_number: 1,
            order_index: 1,
            importantPoints: {
              calloutType: 'key',
              points: [
                'Statutory Basis: Constituted under Section 45ZB of the amended RBI Act, 1934 (Finance Act 2016).',
                'Composition: 6 Members (3 from RBI including Governor as ex-officio Chair, 3 appointed by Central Government).',
                'Decision: Majority vote; Governor has a casting vote in case of a tie.',
                'Mandate: Flexible Inflation Targeting (FIT) target: 4% CPI headline inflation with a tolerance band of +/- 2% (2% to 6%).',
              ],
            },
          },
          {
            id: 'blk_econ_3',
            type: 'table',
            resource_id: 'res_econ_monetary_policy',
            page_number: 1,
            order_index: 2,
            table: {
              headers: ['Policy Tool', 'Type', 'Mechanism', 'Impact on Money Supply'],
              rows: [
                ['Repo Rate', 'Policy Rate', 'Interest rate at which RBI lends short-term liquidity to commercial banks against government securities.', 'Higher repo increases borrowing costs and reduces liquidity.'],
                ['Standing Deposit Facility (SDF)', 'Floor Rate', 'Collateral-free liquidity absorption tool (introduced in 2022 replacing reverse repo as policy floor).', 'Absorbs excess liquidity from banks without providing collateral.'],
                ['Marginal Standing Facility (MSF)', 'Ceiling Rate', 'Penal rate for overnight borrowing above SLR quota against approved securities.', 'Sets the upper ceiling of the Liquidity Adjustment Facility (LAF) corridor.'],
                ['Cash Reserve Ratio (CRR)', 'Quantitative Reserve', 'Percentage of Net Demand and Time Liabilities (NDTL) banks must park in cash with RBI (earns no interest).', 'Directly locks bank funds; higher CRR contracts credit multiplier.'],
                ['Statutory Liquidity Ratio (SLR)', 'Quantitative Reserve', 'Percentage of NDTL banks must maintain in liquid assets (Gold, G-Secs, Cash) under Section 24 of BRA 1949.', 'Ensures bank solvency and guarantees captive market for government debt.'],
                ['Open Market Operations (OMO)', 'Direct Market', 'Outright purchase or sale of government securities in secondary market.', 'Sale absorbs liquidity; purchase injects durable liquidity into banking system.'],
              ],
            },
          },
        ],
      },

      // 4. Environment & Ecology - Protected Area Network
      {
        id: 'sn_env_protected_areas',
        resourceId: 'res_env_protected_areas',
        title: 'National Parks vs Wildlife Sanctuaries vs Biosphere Reserves',
        exam: 'ALL',
        subject: 'Environment',
        topic: 'Ecology & Biodiversity Conservation',
        tags: ['Environment', 'Ecology', 'Protected Areas', 'Wildlife Protection Act', 'Ramsar'],
        description: 'Comprehensive classification of protected areas in India under WPA 1972 and UNESCO MAB programme.',
        year: 2025,
        language: 'en',
        visibility: 'ALL_LEARNERS',
        status: 'PUBLISHED',
        pageCount: 2,
        reviewedBy: 'Academic Council',
        reviewedAt: new Date().toISOString(),
        blocks: [
          {
            id: 'blk_env_1',
            type: 'heading',
            resource_id: 'res_env_protected_areas',
            page_number: 1,
            order_index: 0,
            text: 'Protected Area Network Classification & Legal Framework',
            level: 1,
          },
          {
            id: 'blk_env_2',
            type: 'comparison_block',
            resource_id: 'res_env_protected_areas',
            page_number: 1,
            order_index: 1,
            comparison: {
              headers: ['Parameter', 'National Park (NP)', 'Wildlife Sanctuary (WLS)', 'Biosphere Reserve (BR)'],
              rows: [
                { aspect: 'Governing Legislation', left: 'Wildlife (Protection) Act, 1972 (Section 35)', right: 'WPA 1972 (Section 18–26) vs UNESCO Man and Biosphere (MAB)' },
                { aspect: 'Level of Protection', left: 'Highest protection; complete ban on biotic interference', right: 'Moderate protection in WLS; zoning concept in BR (Core, Buffer, Transition)' },
                { aspect: 'Human Rights & Grazing', left: 'Strictly prohibited; no grazing or private land tenure', right: 'Grazing permitted with Chief Wildlife Warden permission in WLS; permitted in Buffer/Transition of BR' },
                { aspect: 'Species Specificity', left: 'Not species-centric (preserves whole ecosystem)', right: 'Can be focused on particular flagship species (e.g. Periyar Elephant WLS)' },
                { aspect: 'Boundary Alteration', left: 'Only on recommendation of National Board for Wildlife (NBWL)', right: 'NBWL recommendation required for WLS; national notification for BR' },
              ],
            },
          },
          {
            id: 'blk_env_3',
            type: 'fact_box',
            resource_id: 'res_env_protected_areas',
            page_number: 1,
            order_index: 2,
            factBox: {
              title: 'Critical Prelims Facts (India Protected Areas)',
              facts: [
                'India has 106 National Parks, 573 Wildlife Sanctuaries, and 18 Biosphere Reserves (12 in UNESCO World Network of Biosphere Reserves).',
                'First National Park: Hailey National Park (1936), now Jim Corbett National Park (Uttarakhand).',
                'First Biosphere Reserve: Nilgiri Biosphere Reserve (1986) covering TN, Kerala, and Karnataka.',
                'Largest National Park: Hemis National Park (Ladakh); Smallest: South Button Island National Park (Andaman & Nicobar).',
                'Floating National Park: Keibul Lamjao National Park on Loktak Lake (Manipur), home to Sangai brow-antlered deer.',
              ],
            },
          },
        ],
      },
    ];

    for (const seed of canonicalSeeds) {
      this.inMemoryNotes.set(seed.id, {
        ...seed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (pool) {
        try {
          await this.create(seed);
        } catch {
          // already seeded or handled
        }
      }
    }
  }
}

export const shortNotesRepository = new ShortNotesRepository();

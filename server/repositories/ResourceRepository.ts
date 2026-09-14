import { pool } from '../db/pool.js';

export type ResourceStatus = 'DRAFT' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'ARCHIVED' | 'ERROR';
export type ResourceVisibility = 'PUBLIC' | 'ALL_LEARNERS' | 'UPSC' | 'BPSC' | 'COURSE' | 'BATCH' | 'ENROLLED' | 'ADMIN_ONLY';
export type ResourceType = 'BOOK' | 'OFFICIAL_DOCUMENT' | 'NOTES' | 'SYLLABUS' | 'PREVIOUS_YEAR_PAPER' | 'NOTE' | 'PDF' | 'ARTICLE' | 'VIDEO' | 'PYQ' | 'OFFICIAL' | 'CURRENT_AFFAIRS';

export interface DbResource {
  id: string;
  title: string;
  author?: string;
  description?: string;
  resource_type: ResourceType;
  type?: ResourceType;
  subject?: string;
  subject_id?: string;
  topic?: string;
  concept_id?: string;
  exam?: string;
  exam_tag?: string;
  edition?: string;
  publication_year?: number;
  publisher?: string;
  language?: string;
  isbn?: string;
  license_status?: string;
  cover_image_url?: string;
  tags?: string;
  source_attribution?: string;
  storage_provider?: string;
  file_hash?: string;
  drive_file_id?: string;
  drive_folder_id?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  uploaded_by?: string;
  url?: string;
  summary?: string;
  read_time_minutes?: number;
  is_bookmarked?: boolean;
  last_page?: number;
  progress_percentage?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

const RESOURCE_BASE_COLUMNS = `
  id, title, author, description, summary, resource_type, type, subject, subject_id,
  topic, concept_id, exam, exam_tag, edition, publication_year, publisher, language,
  isbn, license_status, cover_image_url, tags, source_attribution, storage_provider,
  file_hash, drive_file_id, drive_folder_id, file_name, file_size, mime_type,
  page_count, status, visibility, uploaded_by, url, read_time_minutes, created_at, updated_at
`;

const RESOURCE_ALIAS_COLUMNS = `
  r.id, r.title, r.author, r.description, r.summary, r.resource_type, r.type, r.subject, r.subject_id,
  r.topic, r.concept_id, r.exam, r.exam_tag, r.edition, r.publication_year, r.publisher, r.language,
  r.isbn, r.license_status, r.cover_image_url, r.tags, r.source_attribution, r.storage_provider,
  r.file_hash, r.drive_file_id, r.drive_folder_id, r.file_name, r.file_size, r.mime_type,
  r.page_count, r.status, r.visibility, r.uploaded_by, r.url, r.read_time_minutes, r.created_at, r.updated_at
`;

export class ResourceRepository {
  private static instance: ResourceRepository;

  private constructor() {}

  public static getInstance(): ResourceRepository {
    if (!ResourceRepository.instance) {
      ResourceRepository.instance = new ResourceRepository();
    }
    return ResourceRepository.instance;
  }

  async findAll(filters?: {
    status?: ResourceStatus | ResourceStatus[];
    visibility?: ResourceVisibility | ResourceVisibility[];
    subject?: string;
    topic?: string;
    exam?: string;
    resourceType?: string;
    allowedTypes?: string[];
    forRepository?: 'RESOURCE_LIBRARY' | 'SYLLABUS' | 'ALL';
    search?: string;
    sort?: 'recent' | 'pages' | 'title' | 'progress';
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ resources: DbResource[]; total: number }> {
    const conditions: string[] = [];
    const whereValues: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`r.status = ANY($${paramIndex++})`);
        whereValues.push(filters.status);
      } else {
        conditions.push(`r.status = $${paramIndex++}`);
        whereValues.push(filters.status);
      }
    }

    if (filters?.visibility) {
      if (Array.isArray(filters.visibility)) {
        conditions.push(`r.visibility = ANY($${paramIndex++})`);
        whereValues.push(filters.visibility);
      } else {
        conditions.push(`r.visibility = $${paramIndex++}`);
        whereValues.push(filters.visibility);
      }
    }

    if (filters?.subject && filters.subject !== 'ALL') {
      conditions.push(`(r.subject ILIKE $${paramIndex} OR r.subject_id ILIKE $${paramIndex})`);
      whereValues.push(`%${filters.subject}%`);
      paramIndex++;
    }

    if (filters?.topic && filters.topic !== 'ALL') {
      conditions.push(`r.topic ILIKE $${paramIndex}`);
      whereValues.push(`%${filters.topic}%`);
      paramIndex++;
    }

    if (filters?.exam && filters.exam !== 'ALL') {
      conditions.push(`(r.exam ILIKE $${paramIndex} OR r.exam_tag ILIKE $${paramIndex} OR r.exam = 'ALL')`);
      whereValues.push(`%${filters.exam}%`);
      paramIndex++;
    }

    if (filters?.resourceType && filters.resourceType !== 'ALL') {
      conditions.push(`(r.resource_type = $${paramIndex} OR r.type = $${paramIndex})`);
      whereValues.push(filters.resourceType);
      paramIndex++;
    } else if (filters?.allowedTypes && filters.allowedTypes.length > 0) {
      conditions.push(`(r.resource_type = ANY($${paramIndex}) OR r.type = ANY($${paramIndex}))`);
      whereValues.push(filters.allowedTypes);
      paramIndex++;
    } else if (filters?.forRepository === 'RESOURCE_LIBRARY') {
      // Learner Resource Library canonical contract: Books, References, Official Documents only
      const canonicalLibTypes = ['BOOK', 'TEXTBOOK', 'REFERENCE_RESOURCE', 'OFFICIAL_DOCUMENT', 'GOVERNMENT_REPORT', 'ARTICLE'];
      conditions.push(`(r.resource_type = ANY($${paramIndex}) OR r.type = ANY($${paramIndex}))`);
      whereValues.push(canonicalLibTypes);
      paramIndex++;
    } else if (filters?.forRepository === 'SYLLABUS') {
      // Notes & Syllabus canonical contract: Syllabus and Study Notes only
      const canonicalSyllabusTypes = ['SYLLABUS', 'STUDY_NOTE'];
      conditions.push(`(r.resource_type = ANY($${paramIndex}) OR r.type = ANY($${paramIndex}))`);
      whereValues.push(canonicalSyllabusTypes);
      paramIndex++;
    }

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(`(
        r.title ILIKE $${paramIndex} OR
        r.author ILIKE $${paramIndex} OR
        r.description ILIKE $${paramIndex} OR
        r.topic ILIKE $${paramIndex} OR
        r.subject ILIKE $${paramIndex} OR
        r.summary ILIKE $${paramIndex} OR
        r.exam ILIKE $${paramIndex} OR
        r.resource_type ILIKE $${paramIndex}
      )`);
      whereValues.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM public.resources r ${whereClause}`, whereValues);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const limit = Math.max(1, filters?.limit || 50);
    const offset = Math.max(0, filters?.offset || 0);

    let orderBy = 'r.created_at DESC';
    if (filters?.sort === 'pages') {
      orderBy = 'r.page_count DESC NULLS LAST, r.created_at DESC';
    } else if (filters?.sort === 'title') {
      orderBy = 'r.title ASC';
    } else if (filters?.sort === 'progress' && filters?.userId) {
      orderBy = 'COALESCE(p.progress_percentage, 0) DESC, r.created_at DESC';
    }

    const queryValues = [...whereValues];
    let queryParamIndex = paramIndex;

    let selectFields = `${RESOURCE_ALIAS_COLUMNS}, 1 AS last_page, 0 AS progress_percentage, false AS is_bookmarked`;
    let joins = '';

    if (filters?.userId) {
      const uParam1 = queryParamIndex++;
      queryValues.push(filters.userId);
      const uParam2 = queryParamIndex++;
      queryValues.push(filters.userId);

      selectFields = `
        ${RESOURCE_ALIAS_COLUMNS},
        COALESCE(p.last_page, 1) AS last_page,
        COALESCE(p.progress_percentage, 0) AS progress_percentage,
        (b.id IS NOT NULL) AS is_bookmarked
      `;
      joins = `
        LEFT JOIN public.learner_resource_progress p ON p.resource_id = r.id AND p.user_id = $${uParam1}
        LEFT JOIN public.learner_resource_bookmarks b ON b.resource_id = r.id AND b.user_id = $${uParam2}
      `;
    }

    const limitParam = queryParamIndex++;
    queryValues.push(limit);
    const offsetParam = queryParamIndex++;
    queryValues.push(offset);

    const query = `
      SELECT ${selectFields}
      FROM public.resources r
      ${joins}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const res = await pool.query(query, queryValues);
    return {
      resources: res.rows.map(this.mapRowToResource),
      total,
    };
  }

  /**
   * Canonical Resource Library: BOOK, TEXTBOOK, REFERENCE_RESOURCE, OFFICIAL_DOCUMENT only
   */
  async getResourceLibrary(filters?: Omit<Parameters<ResourceRepository['findAll']>[0], 'forRepository'>): Promise<{ resources: DbResource[]; total: number }> {
    return this.findAll({
      ...filters,
      forRepository: 'RESOURCE_LIBRARY',
    });
  }

  /**
   * Canonical Notes & Syllabus: SYLLABUS, STUDY_NOTE only
   */
  async getSyllabusResources(filters?: Omit<Parameters<ResourceRepository['findAll']>[0], 'forRepository'>): Promise<{ resources: DbResource[]; total: number }> {
    return this.findAll({
      ...filters,
      forRepository: 'SYLLABUS',
    });
  }

  async findById(id: string, userId?: string): Promise<DbResource | null> {
    if (userId) {
      const res = await pool.query(
        `SELECT ${RESOURCE_ALIAS_COLUMNS},
          COALESCE(p.last_page, 1) AS last_page,
          COALESCE(p.progress_percentage, 0) AS progress_percentage,
          (b.id IS NOT NULL) AS is_bookmarked
        FROM public.resources r
        LEFT JOIN public.learner_resource_progress p ON p.resource_id = r.id AND p.user_id = $2
        LEFT JOIN public.learner_resource_bookmarks b ON b.resource_id = r.id AND b.user_id = $2
        WHERE r.id = $1`,
        [id, userId]
      );
      if (res.rows.length === 0) return null;
      return this.mapRowToResource(res.rows[0]);
    }

    const res = await pool.query(`SELECT ${RESOURCE_BASE_COLUMNS} FROM public.resources WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToResource(res.rows[0]);
  }

  async findLikelyDuplicate(params: {
    title: string;
    author?: string;
    fileHash?: string;
    driveFileId?: string;
    excludeId?: string;
  }): Promise<DbResource | null> {
    const { title, author, fileHash, driveFileId, excludeId } = params;

    if (fileHash) {
      const hashRes = await pool.query(
        `SELECT ${RESOURCE_BASE_COLUMNS} FROM public.resources WHERE file_hash = $1 AND ($2::text IS NULL OR id != $2) LIMIT 1`,
        [fileHash, excludeId || null]
      );
      if (hashRes.rows.length > 0) {
        return this.mapRowToResource(hashRes.rows[0]);
      }
    }

    if (driveFileId) {
      const driveRes = await pool.query(
        `SELECT ${RESOURCE_BASE_COLUMNS} FROM public.resources WHERE drive_file_id = $1 AND ($2::text IS NULL OR id != $2) LIMIT 1`,
        [driveFileId, excludeId || null]
      );
      if (driveRes.rows.length > 0) {
        return this.mapRowToResource(driveRes.rows[0]);
      }
    }

    if (title && title.trim()) {
      const cleanTitle = title.trim().toLowerCase();
      if (author && author.trim()) {
        const cleanAuthor = author.trim().toLowerCase();
        const normRes = await pool.query(
          `SELECT ${RESOURCE_BASE_COLUMNS} FROM public.resources
           WHERE LOWER(TRIM(title)) = $1
             AND LOWER(TRIM(author)) = $2
             AND ($3::text IS NULL OR id != $3)
           LIMIT 1`,
          [cleanTitle, cleanAuthor, excludeId || null]
        );
        if (normRes.rows.length > 0) {
          return this.mapRowToResource(normRes.rows[0]);
        }
      } else {
        const titleRes = await pool.query(
          `SELECT ${RESOURCE_BASE_COLUMNS} FROM public.resources
           WHERE LOWER(TRIM(title)) = $1
             AND ($2::text IS NULL OR id != $2)
           LIMIT 1`,
          [cleanTitle, excludeId || null]
        );
        if (titleRes.rows.length > 0) {
          return this.mapRowToResource(titleRes.rows[0]);
        }
      }
    }

    return null;
  }

  async create(data: Partial<DbResource>): Promise<DbResource> {
    const id = data.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    // Strictly validate subject_id against public.subjects (No invented IDs, no fake sub_general)
    let validatedSubjectId = data.subject_id;
    let validatedSubjectName = data.subject;

    if (validatedSubjectId) {
      const check = await pool.query('SELECT id, name FROM public.subjects WHERE id = $1', [validatedSubjectId]);
      if (check.rows.length > 0) {
        validatedSubjectId = check.rows[0].id;
        if (!validatedSubjectName || validatedSubjectName === 'General Studies') {
          validatedSubjectName = check.rows[0].name;
        }
      } else {
        validatedSubjectId = undefined;
      }
    }

    if (!validatedSubjectId && validatedSubjectName) {
      const match = await pool.query(
        `SELECT id, name FROM public.subjects
         WHERE LOWER(name) = LOWER($1)
            OR LOWER(code) = LOWER($1)
            OR name ILIKE $2
         ORDER BY id ASC LIMIT 1`,
        [validatedSubjectName.trim(), `%${validatedSubjectName.trim()}%`]
      );
      if (match.rows.length > 0) {
        validatedSubjectId = match.rows[0].id;
        validatedSubjectName = match.rows[0].name;
      }
    }

    if (!validatedSubjectId) {
      const defaultSub = await pool.query('SELECT id, name FROM public.subjects ORDER BY id ASC LIMIT 1');
      if (defaultSub.rows.length > 0) {
        validatedSubjectId = defaultSub.rows[0].id;
        if (!validatedSubjectName) validatedSubjectName = defaultSub.rows[0].name;
      } else {
        throw new Error('Subject validation failed: No valid subject exists in public.subjects.');
      }
    }

    const query = `
      INSERT INTO public.resources (
        id, title, author, description, resource_type, type,
        subject, subject_id, topic, concept_id, exam, exam_tag,
        edition, publication_year, publisher, language, isbn,
        license_status, cover_image_url, tags, source_attribution,
        storage_provider, file_hash,
        drive_file_id, drive_folder_id, file_name, file_size,
        mime_type, page_count, status, visibility, uploaded_by,
        url, summary, read_time_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23,
        $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37
      )
      RETURNING *
    `;

    const res = await pool.query(query, [
      id,
      data.title || 'Untitled Resource',
      data.author || 'IKSHOVIA Faculty',
      data.description || '',
      data.resource_type || 'BOOK',
      (['NOTE', 'PDF', 'BOOK', 'ARTICLE', 'VIDEO', 'PYQ'].includes(data.type || '')
        ? data.type
        : ['NOTE', 'PDF', 'BOOK', 'ARTICLE', 'VIDEO', 'PYQ'].includes(data.resource_type || '')
          ? data.resource_type
          : 'PDF') as any,
      validatedSubjectName || 'Indian Polity & Governance',
      validatedSubjectId,
      data.topic || '',
      data.concept_id || null,
      data.exam || 'ALL',
      data.exam_tag || data.exam || 'ALL',
      data.edition || null,
      data.publication_year || null,
      data.publisher || null,
      data.language || 'English',
      data.isbn || null,
      data.license_status || 'REQUIRES_REVIEW',
      data.cover_image_url || null,
      data.tags || null,
      data.source_attribution || null,
      data.storage_provider || 'GOOGLE_DRIVE',
      data.file_hash || null,
      data.drive_file_id || null,
      data.drive_folder_id || null,
      data.file_name || null,
      data.file_size || 0,
      data.mime_type || 'application/pdf',
      data.page_count || 0,
      data.status || 'DRAFT',
      data.visibility || 'PUBLIC',
      data.uploaded_by || 'admin',
      data.url || `/api/resources/${id}/stream`,
      data.summary || data.description || '',
      data.read_time_minutes || Math.max(5, Math.ceil((data.page_count || 10) * 2)),
      now,
      now,
    ]);

    return this.mapRowToResource(res.rows[0]);
  }

  async update(id: string, updates: Partial<DbResource>): Promise<DbResource | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields: (keyof DbResource)[] = [
      'title', 'author', 'description', 'resource_type', 'type',
      'subject', 'subject_id', 'topic', 'concept_id', 'exam', 'exam_tag',
      'edition', 'publication_year', 'publisher', 'language', 'isbn',
      'license_status', 'cover_image_url', 'tags', 'source_attribution',
      'storage_provider', 'file_hash',
      'drive_file_id', 'drive_folder_id', 'file_name', 'file_size',
      'mime_type', 'page_count', 'status', 'visibility', 'summary',
      'read_time_minutes', 'url',
    ];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(updates[key]);
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE public.resources
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await pool.query(query, values);
    if (res.rows.length === 0) return null;
    return this.mapRowToResource(res.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM public.resources WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  private mapRowToResource(row: any): DbResource {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      description: row.description || row.summary,
      resource_type: row.resource_type || row.type || 'BOOK',
      type: row.type || row.resource_type || 'BOOK',
      subject: row.subject || row.subject_id,
      subject_id: row.subject_id || row.subject,
      topic: row.topic,
      concept_id: row.concept_id,
      exam: row.exam || row.exam_tag || 'ALL',
      exam_tag: row.exam_tag || row.exam || 'ALL',
      edition: row.edition,
      publication_year: row.publication_year ? Number(row.publication_year) : undefined,
      publisher: row.publisher,
      language: row.language || 'English',
      isbn: row.isbn,
      license_status: row.license_status || 'REQUIRES_REVIEW',
      cover_image_url: row.cover_image_url,
      tags: row.tags,
      source_attribution: row.source_attribution,
      storage_provider: row.storage_provider || 'GOOGLE_DRIVE',
      file_hash: row.file_hash,
      drive_file_id: row.drive_file_id,
      drive_folder_id: row.drive_folder_id,
      file_name: row.file_name,
      file_size: Number(row.file_size || 0),
      mime_type: row.mime_type || 'application/pdf',
      page_count: Number(row.page_count || 0),
      status: (row.status || 'READY').toUpperCase() as ResourceStatus,
      visibility: (row.visibility || 'PUBLIC').toUpperCase() as ResourceVisibility,
      uploaded_by: row.uploaded_by,
      url: row.url || `/api/resources/${row.id}/stream`,
      summary: row.summary || row.description,
      read_time_minutes: Number(row.read_time_minutes || 10),
      is_bookmarked: Boolean(row.is_bookmarked),
      last_page: row.last_page ? Number(row.last_page) : 1,
      progress_percentage: row.progress_percentage !== undefined && row.progress_percentage !== null ? Number(row.progress_percentage) : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const resourceRepository = ResourceRepository.getInstance();

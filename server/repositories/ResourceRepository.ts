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
  created_at: Date | string;
  updated_at: Date | string;
}

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
    exam?: string;
    resourceType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ resources: DbResource[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex++})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        values.push(filters.status);
      }
    }

    if (filters?.visibility) {
      if (Array.isArray(filters.visibility)) {
        conditions.push(`visibility = ANY($${paramIndex++})`);
        values.push(filters.visibility);
      } else {
        conditions.push(`visibility = $${paramIndex++}`);
        values.push(filters.visibility);
      }
    }

    if (filters?.subject && filters.subject !== 'ALL') {
      conditions.push(`(subject ILIKE $${paramIndex} OR subject_id ILIKE $${paramIndex})`);
      values.push(`%${filters.subject}%`);
      paramIndex++;
    }

    if (filters?.exam && filters.exam !== 'ALL') {
      conditions.push(`(exam ILIKE $${paramIndex} OR exam_tag ILIKE $${paramIndex} OR exam = 'ALL')`);
      values.push(`%${filters.exam}%`);
      paramIndex++;
    }

    if (filters?.resourceType && filters.resourceType !== 'ALL') {
      conditions.push(`(resource_type = $${paramIndex} OR type = $${paramIndex})`);
      values.push(filters.resourceType);
      paramIndex++;
    }

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(`(title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR topic ILIKE $${paramIndex})`);
      values.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM public.resources ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const limit = Math.max(1, filters?.limit || 50);
    const offset = Math.max(0, filters?.offset || 0);

    const query = `
      SELECT *
      FROM public.resources
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    values.push(limit, offset);

    const res = await pool.query(query, values);
    return {
      resources: res.rows.map(this.mapRowToResource),
      total,
    };
  }

  async findById(id: string): Promise<DbResource | null> {
    const res = await pool.query('SELECT * FROM public.resources WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToResource(res.rows[0]);
  }

  async create(data: Partial<DbResource>): Promise<DbResource> {
    const id = data.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const query = `
      INSERT INTO public.resources (
        id, title, author, description, resource_type, type,
        subject, subject_id, topic, concept_id, exam, exam_tag,
        drive_file_id, drive_folder_id, file_name, file_size,
        mime_type, page_count, status, visibility, uploaded_by,
        url, summary, read_time_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26
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
      data.subject || 'General Studies',
      data.subject_id || 'sub_general',
      data.topic || '',
      data.concept_id || null,
      data.exam || 'ALL',
      data.exam_tag || data.exam || 'ALL',
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
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const resourceRepository = ResourceRepository.getInstance();

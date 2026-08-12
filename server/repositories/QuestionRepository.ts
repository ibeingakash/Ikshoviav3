import pool from '../db/pool.js';
import { Question } from '../../src/types/index.js';

export interface QuestionListParams {
  subjectId?: string;
  topicId?: string;
  conceptId?: string;
  isPyq?: boolean;
  isPublished?: boolean;
  status?: string;
  examTag?: string;
  difficulty?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface PYQListParams {
  subjectId?: string;
  topicId?: string;
  conceptId?: string;
  exam?: string;
  pyqYear?: number;
  limit?: number;
  offset?: number;
}

export class QuestionRepository {
  async findById(id: string): Promise<Question | null> {
    const res = await pool.query('SELECT * FROM public.questions WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToQuestion(res.rows[0]);
  }

  async count(): Promise<number> {
    const res = await pool.query('SELECT COUNT(*) as total FROM public.questions');
    return parseInt(res.rows[0]?.total || '0', 10);
  }

  async list(params: QuestionListParams = {}): Promise<{ items: Question[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let idx = 1;

    if (params.subjectId) {
      whereConditions.push(`subject_id = $${idx++}`);
      values.push(params.subjectId);
    }
    if (params.topicId) {
      whereConditions.push(`topic_id = $${idx++}`);
      values.push(params.topicId);
    }
    if (params.conceptId) {
      whereConditions.push(`concept_id = $${idx++}`);
      values.push(params.conceptId);
    }
    if (params.isPyq !== undefined) {
      whereConditions.push(`is_pyq = $${idx++}`);
      values.push(params.isPyq);
    }
    if (params.isPublished !== undefined) {
      whereConditions.push(`is_published = $${idx++}`);
      values.push(params.isPublished);
    }
    if (params.status) {
      whereConditions.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.difficulty) {
      whereConditions.push(`difficulty = $${idx++}`);
      values.push(params.difficulty);
    }
    if (params.examTag) {
      whereConditions.push(`exam_tag ILIKE $${idx++}`);
      values.push(`%${params.examTag}%`);
    }
    if (params.searchQuery) {
      whereConditions.push(`(question ILIKE $${idx} OR explanation ILIKE $${idx})`);
      values.push(`%${params.searchQuery}%`);
      idx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM public.questions ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const dataQuery = `
      SELECT * FROM public.questions 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const queryValues = [...values, limit, offset];

    const res = await pool.query(dataQuery, queryValues);
    const items = res.rows.map(r => this.mapRowToQuestion(r));

    return { items, total };
  }

  async listPYQs(params: PYQListParams = {}): Promise<{ items: Question[]; total: number }> {
    let whereConditions: string[] = ['(is_pyq = true OR exam_tag ILIKE \'%PYQ%\')', 'is_published = true'];
    let values: any[] = [];
    let idx = 1;

    if (params.subjectId) {
      whereConditions.push(`subject_id = $${idx++}`);
      values.push(params.subjectId);
    }
    if (params.topicId) {
      whereConditions.push(`topic_id = $${idx++}`);
      values.push(params.topicId);
    }
    if (params.conceptId) {
      whereConditions.push(`concept_id = $${idx++}`);
      values.push(params.conceptId);
    }
    if (params.exam) {
      whereConditions.push(`(exam ILIKE $${idx} OR exam_tag ILIKE $${idx})`);
      values.push(`%${params.exam}%`);
      idx++;
    }
    if (params.pyqYear) {
      whereConditions.push(`pyq_year = $${idx++}`);
      values.push(params.pyqYear);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM public.questions ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const dataQuery = `
      SELECT * FROM public.questions 
      ${whereClause} 
      ORDER BY pyq_year DESC NULLS LAST, created_at DESC 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const queryValues = [...values, limit, offset];

    const res = await pool.query(dataQuery, queryValues);
    const items = res.rows.map(r => this.mapRowToQuestion(r));

    return { items, total };
  }

  async listAll(): Promise<Question[]> {
    const res = await pool.query('SELECT * FROM public.questions ORDER BY created_at DESC');
    return res.rows.map(r => this.mapRowToQuestion(r));
  }

  async create(data: Question): Promise<Question> {
    const query = `
      INSERT INTO public.questions (
        id, subject_id, topic_id, concept_id, type, question, options,
        correct_answer, explanation, difficulty, exam_tag, pyq_year,
        exam, paper, question_number, is_pyq, source, verified_status,
        is_published, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20
      )
      ON CONFLICT (id) DO UPDATE SET
        subject_id = EXCLUDED.subject_id,
        topic_id = EXCLUDED.topic_id,
        concept_id = EXCLUDED.concept_id,
        type = EXCLUDED.type,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer,
        explanation = EXCLUDED.explanation,
        difficulty = EXCLUDED.difficulty,
        exam_tag = EXCLUDED.exam_tag,
        pyq_year = EXCLUDED.pyq_year,
        exam = EXCLUDED.exam,
        paper = EXCLUDED.paper,
        question_number = EXCLUDED.question_number,
        is_pyq = EXCLUDED.is_pyq,
        source = EXCLUDED.source,
        verified_status = EXCLUDED.verified_status,
        is_published = EXCLUDED.is_published,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      data.id,
      data.subjectId || 'subj_polity',
      data.topicId || 'topic_polity_constitution',
      data.conceptId || 'concept_preamble',
      data.type || 'MCQ',
      data.question,
      data.options ? JSON.stringify(data.options) : null,
      data.correctAnswer,
      data.explanation || '',
      data.difficulty || 'MEDIUM',
      data.examTag || null,
      data.pyqYear || null,
      data.exam || null,
      data.paper || null,
      data.questionNumber || data.questionNum || null,
      data.isPyq || false,
      data.source || null,
      data.verifiedStatus || 'VERIFIED_PYQ',
      data.isPublished !== undefined ? data.isPublished : true,
      data.status || 'PUBLISHED',
    ];

    const res = await pool.query(query, values);
    return this.mapRowToQuestion(res.rows[0]);
  }

  async update(id: string, updates: Partial<Question>): Promise<Question | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    return await this.create(merged);
  }

  async delete(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM public.questions WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  private mapRowToQuestion(row: any): Question {
    const options = Array.isArray(row.options)
      ? row.options
      : (typeof row.options === 'string' ? JSON.parse(row.options) : undefined);

    return {
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: row.type,
      question: row.question,
      options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      examTag: row.exam_tag || undefined,
      pyqYear: row.pyq_year || undefined,
      exam: row.exam || undefined,
      paper: row.paper || undefined,
      questionNumber: row.question_number || undefined,
      isPyq: row.is_pyq,
      source: row.source || undefined,
      verifiedStatus: row.verified_status,
      isPublished: row.is_published,
      status: row.status,
    };
  }
}

export const questionRepository = new QuestionRepository();

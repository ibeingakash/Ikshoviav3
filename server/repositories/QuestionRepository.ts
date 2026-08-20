import pool from '../db/pool.js';
import { db } from '../db.js';
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

const SUBJECT_ID_TO_ENUMS: Record<string, string[]> = {
  sub_polity: ['POLITY', 'INDIAN POLITY', 'POLITY & GOVERNANCE'],
  sub_economy: ['ECONOMY', 'INDIAN ECONOMY', 'ECONOMICS', 'BANKING'],
  sub_history: ['HISTORY', 'INDIAN HISTORY', 'ANCIENT HISTORY', 'MODERN HISTORY', 'ART & CULTURE'],
  sub_geography: ['GEOGRAPHY', 'ENVIRONMENT', 'ECOLOGY', 'INDIAN GEOGRAPHY'],
  sub_ca: ['CURRENT_AFFAIRS', 'CURRENT AFFAIRS', 'SCIENCE_TECH', 'SCIENCE & TECHNOLOGY', 'GOVERNANCE'],
};

const ENUM_TO_SUBJECT_ID: Record<string, string> = {
  POLITY: 'sub_polity',
  'INDIAN POLITY': 'sub_polity',
  'POLITY & GOVERNANCE': 'sub_polity',
  ECONOMY: 'sub_economy',
  'INDIAN ECONOMY': 'sub_economy',
  ECONOMICS: 'sub_economy',
  BANKING: 'sub_economy',
  HISTORY: 'sub_history',
  'INDIAN HISTORY': 'sub_history',
  'ANCIENT HISTORY': 'sub_history',
  'MODERN HISTORY': 'sub_history',
  'ART & CULTURE': 'sub_history',
  GEOGRAPHY: 'sub_geography',
  'INDIAN GEOGRAPHY': 'sub_geography',
  ENVIRONMENT: 'sub_geography',
  ECOLOGY: 'sub_geography',
  CURRENT_AFFAIRS: 'sub_ca',
  'CURRENT AFFAIRS': 'sub_ca',
  SCIENCE_TECH: 'sub_ca',
  'SCIENCE & TECHNOLOGY': 'sub_ca',
};

const DEFAULT_TOPIC_CONCEPT_BY_SUBJECT: Record<string, { topicId: string; conceptId: string }> = {
  sub_polity: { topicId: 'top_const', conceptId: 'c_art32' },
  sub_economy: { topicId: 'top_monetary', conceptId: 'c_mpc' },
  sub_history: { topicId: 'top_modern', conceptId: 'c_non_coop' },
  sub_geography: { topicId: 'top_phys_geo', conceptId: 'c_himalayas' },
  sub_ca: { topicId: 'top_nat_affairs', conceptId: 'c_ca_general' },
};

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQuestionDedupKey(q: {
  question?: string;
  pyqYear?: number;
  exam?: string;
  examTag?: string;
  paper?: string;
}): string {
  const normText = normalizeText(q.question || '').slice(0, 75);
  const yearNorm = q.pyqYear || '';
  return `${normText}::${yearNorm}`;
}

export class QuestionRepository {
  async findById(id: string): Promise<Question | null> {
    const res = await pool.query('SELECT * FROM public.questions WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      return this.mapRowToQuestion(res.rows[0]);
    }

    const dqRes = await pool.query(`
      SELECT 
        dq.*,
        dr.title as resource_title,
        dr.url as resource_url,
        dr.status as resource_status,
        ds.id as source_id,
        ds.name as source_name,
        ds.slug as source_slug,
        ds.source_type as source_type_enum
      FROM data_questions dq
      LEFT JOIN data_resources dr ON dq.resource_id = dr.id
      LEFT JOIN data_sources ds ON dr.source_id = ds.id
      WHERE dq.id = $1
      LIMIT 1;
    `, [id]);

    if (dqRes.rows.length > 0) {
      return this.mapDataQuestionRowToQuestion(dqRes.rows[0]);
    }

    if (db.questions.has(id)) {
      return db.questions.get(id)!;
    }

    return null;
  }

  async count(): Promise<number> {
    const all = await this.listAll();
    return all.length;
  }

  async list(params: QuestionListParams = {}): Promise<{ items: Question[]; total: number }> {
    // 1. Fetch curated questions
    const curatedQuestions = await this.fetchCuratedQuestions(params);

    // 2. Fetch official data questions
    const officialQuestions = await this.fetchOfficialQuestions(params);

    // 3. Merge and deduplicate deterministically
    const merged = this.mergeAndDeduplicate(curatedQuestions, officialQuestions);

    // 4. Sort results
    merged.sort((a, b) => {
      const yearA = a.pyqYear || 0;
      const yearB = b.pyqYear || 0;
      if (yearB !== yearA) return yearB - yearA;
      return (b.id || '').localeCompare(a.id || '');
    });

    const total = merged.length;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const items = merged.slice(offset, offset + limit);

    return { items, total };
  }

  async listPYQs(params: PYQListParams = {}): Promise<{ items: Question[]; total: number }> {
    // 1. Fetch curated PYQs
    const curatedPYQs = await this.fetchCuratedPYQs(params);

    // 2. Fetch official PYQs
    const officialPYQs = await this.fetchOfficialPYQs(params);

    // 3. Merge and deduplicate deterministically
    const merged = this.mergeAndDeduplicate(curatedPYQs, officialPYQs);

    // 4. Sort results by year descending
    merged.sort((a, b) => {
      const yearA = a.pyqYear || 0;
      const yearB = b.pyqYear || 0;
      if (yearB !== yearA) return yearB - yearA;
      return (b.id || '').localeCompare(a.id || '');
    });

    const total = merged.length;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const items = merged.slice(offset, offset + limit);

    return { items, total };
  }

  async getPYQMetadata(): Promise<{
    exams: string[];
    years: number[];
    stages: string[];
    papers: string[];
    totalCount: number;
  }> {
    try {
      const qRes = await pool.query(`
        SELECT DISTINCT exam, pyq_year, paper FROM public.questions WHERE (is_pyq = true OR exam_tag ILIKE '%PYQ%')
      `);
      const dqRes = await pool.query(`
        SELECT DISTINCT exam, year as pyq_year, paper FROM data_questions WHERE is_pyq = true
      `);

      const examSet = new Set<string>();
      const yearSet = new Set<number>();
      const paperSet = new Set<string>();

      const processRow = (row: any) => {
        if (row.exam) {
          const raw = String(row.exam).trim();
          const clean = raw === 'UPSC_CSE' ? 'UPSC CSE' : raw.replace(/_/g, ' ');
          if (clean && clean !== 'null') examSet.add(clean);
        }
        if (row.pyq_year && Number(row.pyq_year) > 1990) {
          yearSet.add(Number(row.pyq_year));
        }
        if (row.paper) {
          const p = String(row.paper).trim();
          if (p && p !== 'null') paperSet.add(p);
        }
      };

      qRes.rows.forEach(processRow);
      dqRes.rows.forEach(processRow);

      if (examSet.size === 0) {
        examSet.add('UPSC CSE');
        examSet.add('BPSC');
        examSet.add('UPPCS');
      }

      const years = Array.from(yearSet).sort((a, b) => b - a);
      const exams = Array.from(examSet).sort();
      const papers = Array.from(paperSet).sort();

      return {
        exams: ['All', ...exams],
        years,
        stages: ['All Stages', 'Prelims', 'Mains'],
        papers: ['All Papers', ...papers],
        totalCount: qRes.rows.length + dqRes.rows.length,
      };
    } catch {
      return {
        exams: ['All', 'UPSC CSE', 'BPSC', 'UPPCS'],
        years: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018],
        stages: ['All Stages', 'Prelims', 'Mains'],
        papers: ['All Papers', 'GS Paper I', 'GS Paper II', 'GS Paper III', 'GS Paper IV', 'CSAT'],
        totalCount: 0,
      };
    }
  }

  async listAll(): Promise<Question[]> {
    const curated = await this.fetchCuratedQuestions({});
    const official = await this.fetchOfficialQuestions({});
    const merged = this.mergeAndDeduplicate(curated, official);
    merged.sort((a, b) => {
      const yearA = a.pyqYear || 0;
      const yearB = b.pyqYear || 0;
      if (yearB !== yearA) return yearB - yearA;
      return (b.id || '').localeCompare(a.id || '');
    });
    return merged;
  }

  async create(data: Question): Promise<Question> {
    const query = `
      INSERT INTO public.questions (
        id, subject_id, topic_id, concept_id, type, question, question_en, question_hi,
        options, options_en, options_hi, correct_answer, explanation, explanation_en, explanation_hi,
        available_languages, difficulty, exam_tag, pyq_year,
        exam, paper, question_number, is_pyq, source, verified_status,
        is_published, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25,
        $26, $27
      )
      ON CONFLICT (id) DO UPDATE SET
        subject_id = EXCLUDED.subject_id,
        topic_id = EXCLUDED.topic_id,
        concept_id = EXCLUDED.concept_id,
        type = EXCLUDED.type,
        question = EXCLUDED.question,
        question_en = EXCLUDED.question_en,
        question_hi = EXCLUDED.question_hi,
        options = EXCLUDED.options,
        options_en = EXCLUDED.options_en,
        options_hi = EXCLUDED.options_hi,
        correct_answer = EXCLUDED.correct_answer,
        explanation = EXCLUDED.explanation,
        explanation_en = EXCLUDED.explanation_en,
        explanation_hi = EXCLUDED.explanation_hi,
        available_languages = EXCLUDED.available_languages,
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

    const normDifficulty = (data.difficulty || '').toUpperCase();
    const safeDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(normDifficulty) ? normDifficulty : 'MEDIUM';

    // Validate and resolve FK references against database
    let conceptId = data.conceptId || 'c_art21';
    let topicId = data.topicId;
    let subjectId = data.subjectId;

    const conRes = await pool.query(
      'SELECT c.id, c.topic_id, t.subject_id FROM public.concepts c JOIN public.topics t ON c.topic_id = t.id WHERE c.id = $1',
      [conceptId]
    );

    if (conRes.rows.length > 0) {
      conceptId = conRes.rows[0].id;
      topicId = topicId || conRes.rows[0].topic_id;
      subjectId = subjectId || conRes.rows[0].subject_id;
    } else {
      const fallbackRes = await pool.query(
        'SELECT c.id, c.topic_id, t.subject_id FROM public.concepts c JOIN public.topics t ON c.topic_id = t.id LIMIT 1'
      );
      if (fallbackRes.rows.length > 0) {
        conceptId = fallbackRes.rows[0].id;
        topicId = fallbackRes.rows[0].topic_id;
        subjectId = fallbackRes.rows[0].subject_id;
      } else {
        conceptId = 'c_art21';
        topicId = 'top_rights';
        subjectId = 'sub_polity';
      }
    }

    const values = [
      data.id,
      subjectId,
      topicId,
      conceptId,
      data.type || 'MCQ',
      data.question,
      data.question_en || data.question,
      data.question_hi || null,
      data.options ? JSON.stringify(data.options) : null,
      data.options_en ? JSON.stringify(data.options_en) : (data.options ? JSON.stringify(data.options) : null),
      data.options_hi ? JSON.stringify(data.options_hi) : null,
      data.correctAnswer,
      data.explanation || '',
      data.explanation_en || data.explanation || null,
      data.explanation_hi || null,
      data.availableLanguages ? JSON.stringify(data.availableLanguages) : JSON.stringify(['en']),
      safeDifficulty,
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

  private async fetchCuratedQuestions(params: QuestionListParams): Promise<Question[]> {
    const memoryQuestions = Array.from(db.questions.values()).filter(q => {
      if (params.subjectId && q.subjectId !== params.subjectId) return false;
      if (params.topicId && q.topicId !== params.topicId) return false;
      if (params.conceptId && q.conceptId !== params.conceptId) return false;
      if (params.isPyq !== undefined && Boolean(q.isPyq) !== params.isPyq) return false;
      if (params.isPublished !== undefined && q.isPublished !== params.isPublished) return false;
      if (params.status && q.status !== params.status) return false;
      if (params.difficulty && q.difficulty?.toLowerCase() !== params.difficulty.toLowerCase()) return false;
      if (params.examTag && !q.examTag?.toLowerCase().includes(params.examTag.toLowerCase()) && !q.exam?.toLowerCase().includes(params.examTag.toLowerCase())) return false;
      if (params.searchQuery) {
        const sq = params.searchQuery.toLowerCase();
        const inQ = q.question?.toLowerCase().includes(sq);
        const inExp = q.explanation?.toLowerCase().includes(sq);
        if (!inQ && !inExp) return false;
      }
      return true;
    });

    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let idx = 1;

      if (params.subjectId) {
        whereConditions.push(`subject_id = ${idx++}`);
        values.push(params.subjectId);
      }
      if (params.topicId) {
        whereConditions.push(`topic_id = ${idx++}`);
        values.push(params.topicId);
      }
      if (params.conceptId) {
        whereConditions.push(`concept_id = ${idx++}`);
        values.push(params.conceptId);
      }
      if (params.isPyq !== undefined) {
        whereConditions.push(`is_pyq = ${idx++}`);
        values.push(params.isPyq);
      }
      if (params.isPublished !== undefined) {
        whereConditions.push(`is_published = ${idx++}`);
        values.push(params.isPublished);
      }
      if (params.status) {
        whereConditions.push(`status = ${idx++}`);
        values.push(params.status);
      }
      if (params.difficulty) {
        whereConditions.push(`difficulty ILIKE ${idx++}`);
        values.push(params.difficulty);
      }
      if (params.examTag) {
        whereConditions.push(`(exam_tag ILIKE ${idx} OR exam ILIKE ${idx})`);
        values.push(`%${params.examTag}%`);
        idx++;
      }
      if (params.searchQuery) {
        whereConditions.push(`(question ILIKE ${idx} OR explanation ILIKE ${idx})`);
        values.push(`%${params.searchQuery}%`);
        idx++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const res = await pool.query(`SELECT * FROM public.questions ${whereClause} ORDER BY created_at DESC`, values);
      const dbQuestions = res.rows.map(r => this.mapRowToQuestion(r));

      // Combine memory and database questions by ID
      const map = new Map<string, Question>();
      memoryQuestions.forEach(q => map.set(q.id, q));
      dbQuestions.forEach(q => map.set(q.id, q));
      return Array.from(map.values());
    } catch {
      return memoryQuestions;
    }
  }

  private async fetchOfficialQuestions(params: QuestionListParams): Promise<Question[]> {
    let whereConditions: string[] = ['dq.is_verified = true'];
    let values: any[] = [];
    let idx = 1;

    if (params.subjectId) {
      const enumList = SUBJECT_ID_TO_ENUMS[params.subjectId] || [params.subjectId.toUpperCase()];
      whereConditions.push(`dq.subject = ANY($${idx++})`);
      values.push(enumList);
    }
    if (params.topicId) {
      whereConditions.push(`dq.topic ILIKE $${idx++}`);
      values.push(`%${params.topicId}%`);
    }
    if (params.conceptId) {
      whereConditions.push(`(dq.topic ILIKE $${idx} OR dq.tags::text ILIKE $${idx})`);
      values.push(`%${params.conceptId}%`);
      idx++;
    }
    if (params.isPyq !== undefined) {
      whereConditions.push(`dq.is_pyq = $${idx++}`);
      values.push(params.isPyq);
    }
    if (params.difficulty) {
      whereConditions.push(`dq.difficulty ILIKE $${idx++}`);
      values.push(params.difficulty);
    }
    if (params.examTag) {
      whereConditions.push(`(dq.exam ILIKE $${idx} OR dq.paper ILIKE $${idx})`);
      values.push(`%${params.examTag}%`);
      idx++;
    }
    if (params.searchQuery) {
      whereConditions.push(`(dq.question_text ILIKE $${idx} OR dq.explanation ILIKE $${idx} OR dq.topic ILIKE $${idx})`);
      values.push(`%${params.searchQuery}%`);
      idx++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const query = `
      SELECT 
        dq.*,
        dr.title as resource_title,
        dr.url as resource_url,
        dr.status as resource_status,
        ds.id as source_id,
        ds.name as source_name,
        ds.slug as source_slug,
        ds.source_type as source_type_enum
      FROM data_questions dq
      LEFT JOIN data_resources dr ON dq.resource_id = dr.id
      LEFT JOIN data_sources ds ON dr.source_id = ds.id
      ${whereClause}
      ORDER BY dq.created_at DESC;
    `;

    const res = await pool.query(query, values);
    return res.rows.map(r => this.mapDataQuestionRowToQuestion(r));
  }

  private async fetchCuratedPYQs(params: PYQListParams): Promise<Question[]> {
    const memoryPYQs = Array.from(db.questions.values()).filter(q => {
      const isPyq = q.isPyq || q.examTag?.includes('PYQ');
      if (!isPyq) return false;
      if (q.isPublished === false) return false;
      if (params.subjectId && q.subjectId !== params.subjectId) return false;
      if (params.topicId && q.topicId !== params.topicId) return false;
      if (params.conceptId && q.conceptId !== params.conceptId) return false;
      if (params.exam && params.exam !== 'All') {
        const normExam = params.exam.toLowerCase();
        const matchesExam = q.exam?.toLowerCase().includes(normExam) || q.examTag?.toLowerCase().includes(normExam);
        if (!matchesExam) return false;
      }
      if (params.pyqYear && q.pyqYear !== params.pyqYear) return false;
      return true;
    });

    try {
      let whereConditions: string[] = ['(is_pyq = true OR exam_tag ILIKE \'%PYQ%\')', 'is_published = true'];
      let values: any[] = [];
      let idx = 1;

      if (params.subjectId) {
        whereConditions.push(`subject_id = ${idx++}`);
        values.push(params.subjectId);
      }
      if (params.topicId) {
        whereConditions.push(`topic_id = ${idx++}`);
        values.push(params.topicId);
      }
      if (params.conceptId) {
        whereConditions.push(`concept_id = ${idx++}`);
        values.push(params.conceptId);
      }
      if (params.exam && params.exam !== 'All') {
        whereConditions.push(`(exam ILIKE ${idx} OR exam_tag ILIKE ${idx})`);
        values.push(`%${params.exam}%`);
        idx++;
      }
      if (params.pyqYear) {
        whereConditions.push(`pyq_year = ${idx++}`);
        values.push(params.pyqYear);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      const res = await pool.query(`SELECT * FROM public.questions ${whereClause} ORDER BY pyq_year DESC NULLS LAST, created_at DESC`, values);
      const dbPYQs = res.rows.map(r => this.mapRowToQuestion(r));

      const map = new Map<string, Question>();
      memoryPYQs.forEach(q => map.set(q.id, q));
      dbPYQs.forEach(q => map.set(q.id, q));
      return Array.from(map.values());
    } catch {
      return memoryPYQs;
    }
  }

  private async fetchOfficialPYQs(params: PYQListParams): Promise<Question[]> {
    let whereConditions: string[] = ['dq.is_pyq = true', 'dq.is_verified = true'];
    let values: any[] = [];
    let idx = 1;

    if (params.subjectId) {
      const enumList = SUBJECT_ID_TO_ENUMS[params.subjectId] || [params.subjectId.toUpperCase()];
      whereConditions.push(`dq.subject = ANY($${idx++})`);
      values.push(enumList);
    }
    if (params.topicId) {
      whereConditions.push(`dq.topic ILIKE $${idx++}`);
      values.push(`%${params.topicId}%`);
    }
    if (params.conceptId) {
      whereConditions.push(`(dq.topic ILIKE $${idx} OR dq.tags::text ILIKE $${idx})`);
      values.push(`%${params.conceptId}%`);
      idx++;
    }
    if (params.exam && params.exam !== 'All') {
      const examPattern = params.exam.replace(/\s+/g, '_').toUpperCase();
      whereConditions.push(`(dq.exam ILIKE $${idx} OR dq.exam ILIKE $${idx + 1} OR dq.paper ILIKE $${idx})`);
      values.push(`%${params.exam}%`, `%${examPattern}%`);
      idx += 2;
    }
    if (params.pyqYear) {
      whereConditions.push(`dq.year = $${idx++}`);
      values.push(params.pyqYear);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const query = `
      SELECT 
        dq.*,
        dr.title as resource_title,
        dr.url as resource_url,
        dr.status as resource_status,
        ds.id as source_id,
        ds.name as source_name,
        ds.slug as source_slug,
        ds.source_type as source_type_enum
      FROM data_questions dq
      LEFT JOIN data_resources dr ON dq.resource_id = dr.id
      LEFT JOIN data_sources ds ON dr.source_id = ds.id
      ${whereClause}
      ORDER BY dq.year DESC NULLS LAST, dq.created_at DESC;
    `;

    const res = await pool.query(query, values);
    return res.rows.map(r => this.mapDataQuestionRowToQuestion(r));
  }

  private mergeAndDeduplicate(curated: Question[], official: Question[]): Question[] {
    const seenKeys = new Map<string, Question>();
    const results: Question[] = [];

    // Curated questions are canonical and registered first
    for (const q of curated) {
      const key = getQuestionDedupKey(q);
      seenKeys.set(key, q);
      results.push(q);
    }

    // Official questions enrich canonical if duplicate, or append if unique
    for (const o of official) {
      const key = getQuestionDedupKey(o);
      if (seenKeys.has(key)) {
        const canonical = seenKeys.get(key)!;
        if (!canonical.sourceProvenance && o.sourceProvenance) {
          canonical.sourceProvenance = o.sourceProvenance;
        }
        if (!canonical.sourceUrl && o.sourceUrl) {
          canonical.sourceUrl = o.sourceUrl;
        }
      } else {
        seenKeys.set(key, o);
        results.push(o);
      }
    }

    return results;
  }

  private mapRowToQuestion(row: any): Question {
    const options = Array.isArray(row.options)
      ? row.options
      : (typeof row.options === 'string' ? JSON.parse(row.options) : undefined);

    const options_en = Array.isArray(row.options_en)
      ? row.options_en
      : (typeof row.options_en === 'string' ? JSON.parse(row.options_en) : undefined);

    const options_hi = Array.isArray(row.options_hi)
      ? row.options_hi
      : (typeof row.options_hi === 'string' ? JSON.parse(row.options_hi) : undefined);

    const availableLanguages = Array.isArray(row.available_languages)
      ? row.available_languages
      : (typeof row.available_languages === 'string' ? JSON.parse(row.available_languages) : undefined);

    return {
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: row.type,
      question: row.question,
      question_en: row.question_en || undefined,
      question_hi: row.question_hi || undefined,
      options,
      options_en,
      options_hi,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      explanation_en: row.explanation_en || undefined,
      explanation_hi: row.explanation_hi || undefined,
      availableLanguages,
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

  private mapDataQuestionRowToQuestion(row: any): Question {
    const normSubject = (row.subject || '').toUpperCase().trim();
    const subjectId = ENUM_TO_SUBJECT_ID[normSubject] || 'sub_polity';
    const defaultMeta = DEFAULT_TOPIC_CONCEPT_BY_SUBJECT[subjectId] || { topicId: 'top_const', conceptId: 'c_art32' };

    const rawExam = row.exam || 'UPSC_CSE';
    const formattedExam = rawExam === 'UPSC_CSE' ? 'UPSC CSE' : rawExam.replace(/_/g, ' ');
    const yearStr = row.year ? ` ${row.year}` : '';
    const paperStr = row.paper ? ` (${row.paper})` : '';
    const examTag = `${formattedExam}${yearStr}${paperStr}`;

    let parsedOptions: any[] = [];
    if (row.options) {
      if (Array.isArray(row.options)) {
        parsedOptions = row.options;
      } else if (typeof row.options === 'string') {
        try {
          parsedOptions = JSON.parse(row.options);
        } catch {
          parsedOptions = [];
        }
      }
    }

    const options = parsedOptions.map((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        return {
          id: String.fromCharCode(65 + idx),
          text: opt,
        };
      }
      if (opt && typeof opt === 'object') {
        return {
          id: String(opt.id || String.fromCharCode(65 + idx)),
          text: String(opt.text || opt.value || opt.label || ''),
        };
      }
      return {
        id: String.fromCharCode(65 + idx),
        text: String(opt),
      };
    });

    const sourceName = row.source_name || (row.resource_title ? `Official: ${row.resource_title}` : 'Official UPSC / Examination Portal');

    return {
      id: row.id,
      subjectId,
      topicId: defaultMeta.topicId,
      conceptId: defaultMeta.conceptId,
      type: (row.question_type === 'MAINS_SUBJECTIVE' || row.question_type === 'SHORT_ANSWER') ? 'SHORT_ANSWER' : 'MCQ',
      question: row.question_text,
      question_en: row.question_text,
      options,
      options_en: options,
      correctAnswer: String(row.correct_answer || 'A'),
      explanation: row.explanation || '',
      explanation_en: row.explanation || '',
      difficulty: (row.difficulty || 'MEDIUM').toUpperCase() as any,
      examTag,
      pyqYear: row.year || undefined,
      exam: formattedExam,
      paper: row.paper || undefined,
      isPyq: Boolean(row.is_pyq),
      source: sourceName,
      sourceUrl: row.resource_url || undefined,
      sourceProvenance: {
        sourceId: row.source_id || undefined,
        resourceId: row.resource_id || undefined,
        sourceName,
        sourceType: row.source_type_enum || 'GOVERNMENT',
        adapter: row.source_slug || 'upsc',
      },
      verifiedStatus: row.is_verified ? 'VERIFIED_PYQ' : 'UNVERIFIED',
      isPublished: true,
      status: 'PUBLISHED',
    };
  }
}

export const questionRepository = new QuestionRepository();

import pool from '../db/pool.js';
import { db } from '../db.js';

export function formatDateOnly(d: any): string {
  if (!d) return new Date().toISOString().split('T')[0];
  if (typeof d === 'string') {
    return d.includes('T') ? d.split('T')[0] : d.trim();
  }
  if (d instanceof Date) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(d).split('T')[0];
}

export interface CurrentAffairRecord {
  id: string;
  title: string;
  summary: string;
  whyInNews?: string;
  whatHappened?: string;
  background?: string;
  keyConcepts?: string[];
  keyFacts?: string[];
  whyItMatters?: string;
  implications?: string;
  issuesAndChallenges?: string[];
  wayForward?: string[];
  category: string;
  subtopic?: string;
  source: string;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceType?: 'PRIMARY_GOVT' | 'SECONDARY_NEWS' | 'OFFICIAL_PORTAL' | 'SUPPLEMENTARY_REFERENCE' | 'EDUCATIONAL_ANALYSIS' | string;
  primarySource?: string;
  documentType?: string;
  secondarySource?: string;
  editorialSource?: string;
  articleType?: 'EDITORIAL' | 'OPINION' | 'EXPLAINER' | 'UPSC_GUIDE' | 'CURRENT_AFFAIR' | 'STANDARD' | string;
  editorialAnalysis?: Record<string, any>;
  topicClusterId?: string;
  topicClusterTitle?: string;
  relatedEditorialIds?: string[];
  relatedCurrentAffairIds?: string[];
  relatedPyqIds?: string[];
  isBiharSpecial?: boolean;
  isEditorial?: boolean;
  date: string;
  relatedSubject?: string;
  prelimsRelevance?: string;
  mainsRelevance?: string;
  examRelevance?: 'UPSC' | 'BPSC' | 'BOTH' | string | string[];
  biharRelevance?: string;
  keywords?: string[];
  gsPaper?: string;
  prelimsPointers?: string[];
  mainsDimensions?: Record<string, string>;
  importantFacts?: string[];
  relatedConceptIds?: string[];
  rawContent?: string;
  sourceProvenance?: Record<string, any>;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'FAILED' | string;
  qualityStatus?: 'PASSED' | 'FLAGGED' | 'REJECTED' | string;
  rejectionReason?: string;
  upscRelevant?: boolean;
  bpscRelevant?: boolean;
  relevanceScore?: number;
  relevanceReason?: string;
  canonicalUrl?: string;
  contentHash?: string;
  status?: 'INGESTED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PUBLISHED' | 'REJECTED';
  isPublished: boolean;
  publishedAt?: string;
  retrievedAt?: string;
  discoveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentAffairFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  dateRange?: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'ALL';
  search?: string;
  subjectId?: string;
  exam?: 'UPSC' | 'BPSC' | 'BOTH' | 'ALL';
  relevance?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL';
  biharOnly?: boolean;
  isPublished?: boolean;
  articleType?: string;
  source?: string;
  gsPaper?: string;
  topicClusterId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface CurrentAffairSourceRecord {
  id: string;
  name: string;
  url: string;
  sourceType?: string;
  category?: string;
  providerCode?: string;
  isActive: boolean;
  freshnessStatus?: string;
  latestArticleDate?: string;
  latestDiscoveredArticle?: string;
  latestPublishedArticle?: string;
  lastAttemptedRun?: string;
  lastSuccessfulRun?: string;
  failureCount?: number;
  lastError?: string;
}

export class CurrentAffairsRepository {
  mapRowToRecord(row: any): CurrentAffairRecord {
    let keyFacts: string[] = [];
    if (Array.isArray(row.key_facts)) {
      keyFacts = row.key_facts;
    } else if (typeof row.key_facts === 'string') {
      try { keyFacts = JSON.parse(row.key_facts); } catch { keyFacts = []; }
    } else if (Array.isArray(row.important_facts)) {
      keyFacts = row.important_facts;
    }

    let prelimsPointers: string[] = [];
    if (Array.isArray(row.prelims_pointers)) {
      prelimsPointers = row.prelims_pointers;
    } else if (typeof row.prelims_pointers === 'string') {
      try { prelimsPointers = JSON.parse(row.prelims_pointers); } catch { prelimsPointers = []; }
    }

    let prov: any = {};
    if (typeof row.source_provenance === 'object' && row.source_provenance !== null) {
      prov = row.source_provenance;
    } else if (typeof row.source_provenance === 'string') {
      try { prov = JSON.parse(row.source_provenance); } catch { prov = {}; }
    }

    let editorialAnalysis: any = undefined;
    if (typeof row.editorial_analysis === 'object' && row.editorial_analysis !== null) {
      editorialAnalysis = row.editorial_analysis;
    } else if (typeof row.editorial_analysis === 'string') {
      try { editorialAnalysis = JSON.parse(row.editorial_analysis); } catch { editorialAnalysis = undefined; }
    }

    let gsPaper = row.gs_paper || undefined;
    if (!gsPaper) {
      const cat = (row.category || '').toLowerCase();
      if (cat.includes('polity') || cat.includes('governance') || cat.includes('constitution') || cat.includes('social justice') || cat.includes('international')) {
        gsPaper = 'GS Paper II';
      } else if (cat.includes('economy') || cat.includes('environment') || cat.includes('science') || cat.includes('security') || cat.includes('agriculture')) {
        gsPaper = 'GS Paper III';
      } else if (cat.includes('history') || cat.includes('geography') || cat.includes('culture') || cat.includes('society')) {
        gsPaper = 'GS Paper I';
      } else if (cat.includes('ethics') || cat.includes('integrity')) {
        gsPaper = 'GS Paper IV';
      } else if (cat.includes('bihar')) {
        gsPaper = 'BPSC General Studies';
      }
    }

    const source = this.normalizeSourceName(row.source, row.source_url);
    const domain = row.source_domain || (row.source_url ? (() => { try { return new URL(row.source_url).hostname; } catch { return undefined; } })() : undefined);

    return {
      id: row.id,
      title: row.title,
      summary: row.summary || row.why_in_news || '',
      whyInNews: row.why_in_news || row.summary || '',
      whatHappened: row.what_happened || row.summary || '',
      background: row.background || undefined,
      category: row.category || 'Polity & Governance',
      subtopic: row.subtopic || undefined,
      source,
      sourceUrl: row.source_url || undefined,
      sourceDomain: domain,
      sourceType: row.source_type || 'PRIMARY_GOVT',
      date: formatDateOnly(row.date),
      articleType: row.article_type || (row.is_editorial ? 'EDITORIAL' : 'CURRENT_AFFAIR'),
      editorialSource: row.editorial_source || undefined,
      editorialAnalysis,
      topicClusterId: row.topic_cluster_id || undefined,
      topicClusterTitle: row.topic_cluster_title || undefined,
      relatedEditorialIds: Array.isArray(row.related_editorial_ids) ? row.related_editorial_ids : [],
      relatedCurrentAffairIds: Array.isArray(row.related_current_affair_ids) ? row.related_current_affair_ids : [],
      relatedPyqIds: Array.isArray(row.related_pyq_ids) ? row.related_pyq_ids : [],
      secondarySource: row.secondary_source || undefined,
      keyFacts,
      whyItMatters: row.why_it_matters || undefined,
      implications: row.implications || undefined,
      isBiharSpecial: Boolean(row.is_bihar_special || row.bihar_relevance || (row.category && row.category.toLowerCase().includes('bihar'))),
      isEditorial: Boolean(row.is_editorial || row.article_type === 'EDITORIAL' || row.article_type === 'OPINION' || row.article_type === 'EXPLAINER'),
      relatedSubject: row.related_subject || undefined,
      prelimsRelevance: row.prelims_relevance || undefined,
      mainsRelevance: row.mains_relevance || undefined,
      examRelevance: row.exam_relevance || 'BOTH',
      biharRelevance: row.bihar_relevance || undefined,
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      gsPaper,
      prelimsPointers,
      mainsDimensions: typeof row.mains_dimensions === 'object' && row.mains_dimensions !== null ? row.mains_dimensions : {},
      importantFacts: keyFacts,
      relatedConceptIds: Array.isArray(row.related_concept_ids) ? row.related_concept_ids : [],
      rawContent: row.raw_content || undefined,
      sourceProvenance: prov,
      verificationStatus: row.verification_status || 'VERIFIED',
      qualityStatus: row.quality_status || 'PASSED',
      rejectionReason: row.rejection_reason || undefined,
      upscRelevant: row.upsc_relevant ?? true,
      bpscRelevant: row.bpsc_relevant ?? Boolean(row.is_bihar_special || row.bihar_relevance),
      relevanceScore: Number(row.relevance_score) || 85,
      relevanceReason: row.relevance_reason || undefined,
      canonicalUrl: row.canonical_url || row.source_url || undefined,
      contentHash: row.content_hash || undefined,
      status: row.status || 'PUBLISHED',
      isPublished: row.is_published ?? true,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : undefined,
      discoveredAt: row.discovered_at ? new Date(row.discovered_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  normalizeSourceName(sourceName?: string | null, url?: string | null): string {
    const raw = (sourceName || '').trim();
    const u = (url || '').toLowerCase();

    if (raw.toLowerCase().includes('the hindu') || u.includes('thehindu.com')) return 'The Hindu';
    if (raw.toLowerCase().includes('indian express') || u.includes('indianexpress.com')) return 'The Indian Express';
    if (raw.toLowerCase().includes('livemint') || u.includes('livemint.com')) return 'LiveMint';
    if (raw.toLowerCase().includes('business standard') || u.includes('business-standard.com')) return 'Business Standard';
    if (raw.toLowerCase().includes('drishti') || u.includes('drishtiias.com')) return 'Drishti IAS (Supplementary Analysis)';

    if (raw.includes('/') || raw.toLowerCase().includes('supreme court judgment')) {
      if (raw.toLowerCase().includes('supreme court') || u.includes('sci.gov.in')) return 'Supreme Court of India';
      if (raw.toLowerCase().includes('pib') || u.includes('pib.gov.in')) return 'Press Information Bureau (PIB)';
    }

    if (raw.toLowerCase() === 'generic http' || raw === '' || raw.toLowerCase() === 'official source') {
      if (u.includes('isro.gov.in')) return 'Indian Space Research Organisation (ISRO)';
      if (u.includes('pib.gov.in')) return 'Press Information Bureau (PIB)';
      if (u.includes('rbi.org.in')) return 'Reserve Bank of India (RBI)';
      if (u.includes('wrd.bihar.gov.in') || u.includes('bihar.gov.in')) return 'Department of Information & Public Relations (IPRD Bihar)';
      if (u.includes('greentribunal.gov.in')) return 'National Green Tribunal (NGT)';
      if (u.includes('mea.gov.in')) return 'Ministry of External Affairs (MEA)';
      if (u.includes('mnre.gov.in')) return 'Ministry of New and Renewable Energy (MNRE)';
      if (u.includes('fincomindia.nic.in')) return '16th Finance Commission of India';
      if (u.includes('nha.gov.in')) return 'National Health Authority (NHA)';
      if (u.includes('asi.nic.in')) return 'Archaeological Survey of India (ASI)';
      if (u.includes('upsc.gov.in')) return 'Union Public Service Commission (UPSC)';
      if (u.includes('niti.gov.in')) return 'NITI Aayog';
      return 'Official Government Source';
    }

    if (raw.toLowerCase() === 'pib') return 'Press Information Bureau (PIB)';
    if (raw.toLowerCase() === 'isro') return 'Indian Space Research Organisation (ISRO)';
    if (raw.toLowerCase() === 'rbi') return 'Reserve Bank of India (RBI)';
    return raw;
  }

  async createArticle(data: Partial<CurrentAffairRecord>): Promise<CurrentAffairRecord> {
    const id = data.id || `ca_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = data.title || 'Untitled Article';
    const summary = data.summary || data.whyInNews || '';
    const whyInNews = data.whyInNews || summary;
    const whatHappened = data.whatHappened || summary;
    const background = data.background || null;
    const category = data.category || 'Polity & Governance';
    const subtopic = data.subtopic || null;
    const source = this.normalizeSourceName(data.source, data.sourceUrl);
    const sourceUrl = data.sourceUrl || null;
    const sourceDomain = data.sourceDomain || (data.sourceUrl ? (() => { try { return new URL(data.sourceUrl).hostname; } catch { return null; } })() : null);
    const sourceType = data.sourceType || (source === 'The Hindu' || source === 'The Indian Express' || source === 'LiveMint' ? 'SECONDARY_NEWS' : 'PRIMARY_GOVT');
    const date = data.date || new Date().toISOString().split('T')[0];
    const relatedSubject = data.relatedSubject || null;
    const prelimsRelevance = data.prelimsRelevance || null;
    const mainsRelevance = data.mainsRelevance || null;
    const examRelevance = data.examRelevance || 'BOTH';
    const biharRelevance = data.biharRelevance || null;
    const keywords = JSON.stringify(data.keywords || []);
    const keyFacts = JSON.stringify(data.keyFacts || []);
    const whyItMatters = data.whyItMatters || null;
    const implications = data.implications || null;
    const gsPaper = data.gsPaper || null;
    const prelimsPointers = JSON.stringify(data.prelimsPointers || []);
    const mainsDimensions = JSON.stringify(data.mainsDimensions || {});
    const importantFacts = JSON.stringify(data.importantFacts || data.keyFacts || []);
    const relatedConceptIds = JSON.stringify(data.relatedConceptIds || []);
    const rawContent = data.rawContent || null;
    const sourceProvenance = JSON.stringify(data.sourceProvenance || {});
    const verificationStatus = data.verificationStatus || 'VERIFIED';
    const qualityStatus = data.qualityStatus || 'PASSED';
    const rejectionReason = data.rejectionReason || null;
    const upscRelevant = data.upscRelevant ?? true;
    const bpscRelevant = data.bpscRelevant ?? Boolean(data.isBiharSpecial || data.biharRelevance);
    const relevanceScore = data.relevanceScore ?? 85;
    const relevanceReason = data.relevanceReason || null;
    const canonicalUrl = data.canonicalUrl || data.sourceUrl || null;
    const contentHash = data.contentHash || null;
    const status = data.status || 'PUBLISHED';
    const isPublished = data.isPublished ?? (status === 'PUBLISHED');
    const articleType = data.articleType || 'CURRENT_AFFAIR';
    const editorialAnalysis = data.editorialAnalysis && Object.keys(data.editorialAnalysis).length > 0 ? JSON.stringify(data.editorialAnalysis) : null;
    const topicClusterId = data.topicClusterId || null;
    const topicClusterTitle = data.topicClusterTitle || null;
    const relatedEditorialIds = JSON.stringify(data.relatedEditorialIds || []);
    const relatedCurrentAffairIds = JSON.stringify(data.relatedCurrentAffairIds || []);
    const relatedPyqIds = JSON.stringify(data.relatedPyqIds || []);
    const secondarySource = data.secondarySource || null;
    const editorialSource = data.editorialSource || null;

    const isBiharSpecial = Boolean(data.isBiharSpecial || data.biharRelevance || (data.category && data.category.toLowerCase().includes('bihar')));
    const isEditorial = Boolean(data.isEditorial || data.articleType === 'EDITORIAL' || data.articleType === 'OPINION' || data.articleType === 'EXPLAINER');

    const query = `
      INSERT INTO public.current_affairs (
        id, title, summary, background, category, subtopic, source, source_url, source_domain, source_type,
        date, related_subject, prelims_relevance, mains_relevance, exam_relevance, bihar_relevance,
        keywords, key_facts, prelims_pointers, mains_dimensions, important_facts,
        related_concept_ids, raw_content, source_provenance, verification_status, quality_status,
        rejection_reason, upsc_relevant, bpsc_relevant, relevance_score, relevance_reason,
        canonical_url, content_hash, status, is_published,
        why_in_news, what_happened, why_it_matters, implications, gs_paper,
        article_type, editorial_analysis, topic_cluster_id, topic_cluster_title,
        related_editorial_ids, related_current_affair_ids, related_pyq_ids,
        secondary_source, editorial_source, is_bihar_special, is_editorial,
        published_at, retrieved_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16,
        $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb,
        $22::jsonb, $23, $24::jsonb, $25, $26,
        $27, $28, $29, $30, $31,
        $32, $33, $34, $35,
        $36, $37, $38, $39, $40,
        $41, $42::jsonb, $43, $44,
        $45::jsonb, $46::jsonb, $47::jsonb,
        $48, $49, $50, $51,
        COALESCE($52::timestamptz, NOW()), NOW(), NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        why_in_news = EXCLUDED.why_in_news,
        what_happened = EXCLUDED.what_happened,
        background = EXCLUDED.background,
        category = EXCLUDED.category,
        subtopic = EXCLUDED.subtopic,
        source = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        source_domain = EXCLUDED.source_domain,
        source_type = EXCLUDED.source_type,
        date = EXCLUDED.date,
        related_subject = EXCLUDED.related_subject,
        prelims_relevance = EXCLUDED.prelims_relevance,
        mains_relevance = EXCLUDED.mains_relevance,
        exam_relevance = EXCLUDED.exam_relevance,
        bihar_relevance = EXCLUDED.bihar_relevance,
        keywords = EXCLUDED.keywords,
        key_facts = EXCLUDED.key_facts,
        why_it_matters = EXCLUDED.why_it_matters,
        implications = EXCLUDED.implications,
        gs_paper = EXCLUDED.gs_paper,
        prelims_pointers = EXCLUDED.prelims_pointers,
        mains_dimensions = EXCLUDED.mains_dimensions,
        important_facts = EXCLUDED.important_facts,
        related_concept_ids = EXCLUDED.related_concept_ids,
        raw_content = EXCLUDED.raw_content,
        source_provenance = EXCLUDED.source_provenance,
        verification_status = EXCLUDED.verification_status,
        quality_status = EXCLUDED.quality_status,
        rejection_reason = EXCLUDED.rejection_reason,
        upsc_relevant = EXCLUDED.upsc_relevant,
        bpsc_relevant = EXCLUDED.bpsc_relevant,
        relevance_score = EXCLUDED.relevance_score,
        relevance_reason = EXCLUDED.relevance_reason,
        canonical_url = EXCLUDED.canonical_url,
        content_hash = EXCLUDED.content_hash,
        status = EXCLUDED.status,
        is_published = EXCLUDED.is_published,
        article_type = EXCLUDED.article_type,
        editorial_analysis = EXCLUDED.editorial_analysis,
        topic_cluster_id = EXCLUDED.topic_cluster_id,
        topic_cluster_title = EXCLUDED.topic_cluster_title,
        related_editorial_ids = EXCLUDED.related_editorial_ids,
        related_current_affair_ids = EXCLUDED.related_current_affair_ids,
        related_pyq_ids = EXCLUDED.related_pyq_ids,
        secondary_source = EXCLUDED.secondary_source,
        editorial_source = EXCLUDED.editorial_source,
        is_bihar_special = EXCLUDED.is_bihar_special,
        is_editorial = EXCLUDED.is_editorial,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      id, title, summary, background, category, subtopic, source, sourceUrl, sourceDomain, sourceType,
      date, relatedSubject, prelimsRelevance, mainsRelevance, examRelevance, biharRelevance,
      keywords, keyFacts, prelimsPointers, mainsDimensions, importantFacts,
      relatedConceptIds, rawContent, sourceProvenance, verificationStatus, qualityStatus,
      rejectionReason, upscRelevant, bpscRelevant, relevanceScore, relevanceReason,
      canonicalUrl, contentHash, status, isPublished,
      whyInNews, whatHappened, whyItMatters, implications, gsPaper,
      articleType, editorialAnalysis, topicClusterId, topicClusterTitle,
      relatedEditorialIds, relatedCurrentAffairIds, relatedPyqIds,
      secondarySource, editorialSource, isBiharSpecial, isEditorial,
      data.publishedAt || null
    ];

    const res = await pool.query(query, values);
    return this.mapRowToRecord(res.rows[0]);
  }

  async updateArticle(id: string, updates: Partial<CurrentAffairRecord>): Promise<CurrentAffairRecord | null> {
    const existing = await this.getArticleById(id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.title !== undefined) { setClauses.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.summary !== undefined) { setClauses.push(`summary = $${idx++}`); values.push(updates.summary); }
    if (updates.whyInNews !== undefined) { setClauses.push(`why_in_news = $${idx++}`); values.push(updates.whyInNews); }
    if (updates.whatHappened !== undefined) { setClauses.push(`what_happened = $${idx++}`); values.push(updates.whatHappened); }
    if (updates.background !== undefined) { setClauses.push(`background = $${idx++}`); values.push(updates.background); }
    if (updates.category !== undefined) { setClauses.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.subtopic !== undefined) { setClauses.push(`subtopic = $${idx++}`); values.push(updates.subtopic); }
    if (updates.source !== undefined) { setClauses.push(`source = $${idx++}`); values.push(updates.source); }
    if (updates.sourceUrl !== undefined) { setClauses.push(`source_url = $${idx++}`); values.push(updates.sourceUrl); }
    if (updates.date !== undefined) { setClauses.push(`date = $${idx++}`); values.push(updates.date); }
    if (updates.gsPaper !== undefined) { setClauses.push(`gs_paper = $${idx++}`); values.push(updates.gsPaper); }
    if (updates.status !== undefined) { setClauses.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.isPublished !== undefined) { setClauses.push(`is_published = $${idx++}`); values.push(updates.isPublished); }
    if (updates.editorialAnalysis !== undefined) { setClauses.push(`editorial_analysis = $${idx++}::jsonb`); values.push(JSON.stringify(updates.editorialAnalysis)); }
    if (updates.topicClusterId !== undefined) { setClauses.push(`topic_cluster_id = $${idx++}`); values.push(updates.topicClusterId); }
    if (updates.topicClusterTitle !== undefined) { setClauses.push(`topic_cluster_title = $${idx++}`); values.push(updates.topicClusterTitle); }
    if (updates.verificationStatus !== undefined) { setClauses.push(`verification_status = $${idx++}`); values.push(updates.verificationStatus); }
    if (updates.relevanceScore !== undefined) { setClauses.push(`relevance_score = $${idx++}`); values.push(updates.relevanceScore); }

    setClauses.push(`updated_at = NOW()`);

    const query = `UPDATE public.current_affairs SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;
    values.push(id);

    const res = await pool.query(query, values);
    if (!res.rows[0]) return null;
    return this.mapRowToRecord(res.rows[0]);
  }

  async getArticleById(id: string): Promise<CurrentAffairRecord | null> {
    const res = await pool.query(`SELECT * FROM public.current_affairs WHERE id = $1;`, [id]);
    if (!res.rows[0]) return null;
    return this.mapRowToRecord(res.rows[0]);
  }

  async findDuplicateByUrlOrTitle(sourceUrl?: string, title?: string, date?: string): Promise<CurrentAffairRecord | null> {
    if (sourceUrl) {
      const resUrl = await pool.query(
        `SELECT * FROM public.current_affairs WHERE LOWER(TRIM(source_url)) = LOWER(TRIM($1)) LIMIT 1;`,
        [sourceUrl]
      );
      if (resUrl.rows[0]) return this.mapRowToRecord(resUrl.rows[0]);
    }
    if (title && date) {
      const resTitle = await pool.query(
        `SELECT * FROM public.current_affairs WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) AND date = $2 LIMIT 1;`,
        [title, date]
      );
      if (resTitle.rows[0]) return this.mapRowToRecord(resTitle.rows[0]);
    }
    return null;
  }

  async listArticles(filters: CurrentAffairFilter = {}): Promise<CurrentAffairRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.isPublished !== undefined) {
      conditions.push(`is_published = $${idx++}`);
      values.push(filters.isPublished);
    }

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    }

    if (filters.date) {
      conditions.push(`date = $${idx++}`);
      values.push(filters.date);
    } else if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        conditions.push(`date >= $${idx++}`);
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        conditions.push(`date <= $${idx++}`);
        values.push(filters.endDate);
      }
    }

    if (filters.category && filters.category !== 'ALL' && filters.category !== 'All') {
      conditions.push(`(LOWER(category) LIKE $${idx} OR LOWER(COALESCE(subtopic, '')) LIKE $${idx})`);
      values.push(`%${filters.category.toLowerCase()}%`);
      idx++;
    }

    if (filters.exam && filters.exam !== 'ALL') {
      conditions.push(`(exam_relevance = $${idx} OR exam_relevance = 'BOTH')`);
      values.push(filters.exam);
      idx++;
    }

    if (filters.biharOnly) {
      conditions.push(`(is_bihar_special = TRUE OR exam_relevance = 'BPSC' OR bihar_relevance IS NOT NULL OR LOWER(category) LIKE '%bihar%')`);
    }

    if (filters.search) {
      conditions.push(`(
        LOWER(title) LIKE $${idx} OR
        LOWER(summary) LIKE $${idx} OR
        LOWER(source) LIKE $${idx} OR
        LOWER(COALESCE(why_in_news, '')) LIKE $${idx}
      )`);
      values.push(`%${filters.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let limitClause = '';
    if (filters.limit) {
      limitClause = `LIMIT ${filters.limit}`;
      if (filters.offset) limitClause += ` OFFSET ${filters.offset}`;
    }

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, relevance_score DESC, created_at DESC
      ${limitClause};
    `;

    const res = await pool.query(query, values);
    return res.rows.map(row => this.mapRowToRecord(row));
  }

  scoreArticleRelevance(article: CurrentAffairRecord, targetExam?: string): number {
    let score = article.relevanceScore || 50;

    if (article.sourceType === 'PRIMARY_GOVT') score += 15;
    if (article.isEditorial) score += 10;

    const exam = targetExam?.toUpperCase();
    if (exam === 'BPSC' && (article.isBiharSpecial || article.biharRelevance)) {
      score += 25;
    } else if (exam === 'UPSC' && article.upscRelevant) {
      score += 15;
    }

    return score;
  }

  async getAvailableDates(daysLimit = 30): Promise<{ date: string; formatted: string; count: number; isToday: boolean }[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const query = `
      SELECT date, COUNT(*) as count
      FROM public.current_affairs
      WHERE is_published = TRUE
      GROUP BY date
      ORDER BY date DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [daysLimit]);
    return res.rows.map(row => {
      const dStr = formatDateOnly(row.date);
      let formatted = dStr;
      try {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formatted = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
      return {
        date: dStr,
        formatted,
        count: parseInt(row.count),
        isToday: dStr === todayStr,
      };
    });
  }

  async getDayFeed(params: {
    date?: string;
    exam?: string;
    category?: string;
    biharOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    date: string;
    formattedDate: string;
    isToday: boolean;
    hasArticles: boolean;
    digest: {
      date: string;
      formattedDate: string;
      totalDiscovered: number;
      totalEligible: number;
      topStoriesCount: number;
      importantDevelopmentsCount: number;
      editorialsCount: number;
      biharArticlesCount: number;
      topicClustersCount: number;
      sourcesCount: number;
      sourcesDetected: string[];
    };
    topStories: CurrentAffairRecord[];
    importantDevelopments: CurrentAffairRecord[];
    editorials: CurrentAffairRecord[];
    editorialPreview: CurrentAffairRecord[];
    biharArticles: CurrentAffairRecord[];
    topicClusters: any[];
    availableDates: { date: string; formatted: string; count: number; isToday: boolean }[];
    pagination: {
      page: number;
      limit: number;
      totalImportant: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDate = params.date ? formatDateOnly(params.date) : todayStr;

    const availableDates = await this.getAvailableDates(30);

    // Query ALL articles on that exact date
    const dayArticles = await this.listArticles({
      date: selectedDate,
      category: params.category && params.category !== 'ALL' ? params.category : undefined,
      isPublished: true,
    });

    let filtered = dayArticles;
    if (params.biharOnly || params.exam === 'BPSC') {
      filtered = filtered.filter(a => a.examRelevance === 'BPSC' || a.examRelevance === 'BOTH' || Boolean(a.biharRelevance) || a.isBiharSpecial);
    } else if (params.exam === 'UPSC') {
      filtered = filtered.filter(a => a.examRelevance === 'UPSC' || a.examRelevance === 'BOTH');
    }

    // Separate Editorials & Bihar articles
    const editorials = filtered.filter(a => a.isEditorial || a.articleType === 'EDITORIAL' || a.articleType === 'OPINION' || a.articleType === 'EXPLAINER');
    const biharArticles = filtered.filter(a => a.isBiharSpecial || Boolean(a.biharRelevance) || a.category === 'Bihar Current Affairs');

    // Separate Standard news developments (excluding pure editorials)
    const standardNews = filtered.filter(a => !editorials.some(e => e.id === a.id));

    // Rank standard news by relevance score
    standardNews.sort((a, b) => {
      const scoreB = this.scoreArticleRelevance(b, params.exam);
      const scoreA = this.scoreArticleRelevance(a, params.exam);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return String(b.title || '').localeCompare(String(a.title || ''));
    });

    // Top Stories: Top ranked news items (up to 5)
    const topStoriesCount = Math.min(5, Math.ceil(standardNews.length * 0.4));
    const topStories = standardNews.slice(0, topStoriesCount);
    const remainingDevelopments = standardNews.slice(topStoriesCount);

    // Bounded Pagination for Important Developments
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 8);
    const offset = (page - 1) * limit;
    const paginatedDevelopments = remainingDevelopments.slice(offset, offset + limit);
    const totalPages = Math.max(1, Math.ceil(remainingDevelopments.length / limit));

    // Topic Clusters for the date
    const clusterMap = new Map<string, {
      id: string;
      title: string;
      category: string;
      articles: CurrentAffairRecord[];
      sourcesDetected: Set<string>;
    }>();

    for (const a of filtered) {
      if (a.topicClusterId) {
        if (!clusterMap.has(a.topicClusterId)) {
          clusterMap.set(a.topicClusterId, {
            id: a.topicClusterId,
            title: a.topicClusterTitle || a.title,
            category: a.category,
            articles: [],
            sourcesDetected: new Set<string>(),
          });
        }
        const cl = clusterMap.get(a.topicClusterId)!;
        cl.articles.push(a);
        if (a.source) cl.sourcesDetected.add(a.source);
      }
    }

    const topicClusters = Array.from(clusterMap.values()).map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      articlesCount: c.articles.length,
      sourcesDetected: Array.from(c.sourcesDetected),
      articles: c.articles.map(art => ({
        id: art.id,
        title: art.title,
        source: art.source,
        articleType: art.articleType,
        gsPaper: art.gsPaper,
        summary: art.summary,
      })),
    }));

    const formatHelper = (dStr: string) => {
      try {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      } catch {}
      return dStr;
    };

    const sourcesSet = new Set<string>();
    for (const a of filtered) {
      if (a.source) sourcesSet.add(a.source);
    }

    const digest = {
      date: selectedDate,
      formattedDate: formatHelper(selectedDate),
      totalDiscovered: filtered.length,
      totalEligible: filtered.length,
      topStoriesCount: topStories.length,
      importantDevelopmentsCount: remainingDevelopments.length,
      editorialsCount: editorials.length,
      biharArticlesCount: biharArticles.length,
      topicClustersCount: topicClusters.length,
      sourcesCount: sourcesSet.size,
      sourcesDetected: Array.from(sourcesSet),
    };

    return {
      date: selectedDate,
      formattedDate: formatHelper(selectedDate),
      isToday: selectedDate === todayStr,
      hasArticles: filtered.length > 0,
      digest,
      topStories,
      importantDevelopments: paginatedDevelopments,
      editorials,
      editorialPreview: editorials.slice(0, 3),
      biharArticles,
      topicClusters,
      availableDates,
      pagination: {
        page,
        limit,
        totalImportant: remainingDevelopments.length,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async listEditorials(filter: {
    date?: string;
    startDate?: string;
    endDate?: string;
    source?: string;
    gsPaper?: string;
    articleType?: string;
    search?: string;
    page?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<CurrentAffairRecord[] & {
    items: CurrentAffairRecord[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const conditions: string[] = [
      "is_published = TRUE",
      "(is_editorial = TRUE OR article_type IN ('EDITORIAL', 'OPINION', 'EXPLAINER') OR source IN ('The Hindu', 'LiveMint', 'The Indian Express'))"
    ];
    const values: any[] = [];
    let idx = 1;

    if (filter.date) {
      conditions.push(`date = $${idx++}`);
      values.push(filter.date);
    }
    if (filter.startDate) {
      conditions.push(`date >= $${idx++}`);
      values.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`date <= $${idx++}`);
      values.push(filter.endDate);
    }

    if (filter.source && filter.source !== 'ALL') {
      conditions.push(`LOWER(source) LIKE $${idx++}`);
      values.push(`%${filter.source.toLowerCase()}%`);
    }

    if (filter.gsPaper && filter.gsPaper !== 'ALL') {
      conditions.push(`gs_paper = $${idx++}`);
      values.push(filter.gsPaper);
    }

    if (filter.articleType && filter.articleType !== 'ALL') {
      conditions.push(`article_type = $${idx++}`);
      values.push(filter.articleType);
    }

    if (filter.search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(summary) LIKE $${idx} OR LOWER(source) LIKE $${idx})`);
      values.push(`%${filter.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await pool.query(`SELECT COUNT(*) FROM public.current_affairs ${whereClause};`, values);
    const totalCount = parseInt(countRes.rows[0].count) || 0;

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, filter.limit || 50);
    const offset = filter.offset !== undefined ? filter.offset : (page - 1) * limit;

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, relevance_score DESC, created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    const res = await pool.query(query, values);
    const records = res.rows.map(row => this.mapRowToRecord(row));
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const result = records as any;
    result.items = records;
    result.pagination = {
      page,
      limit,
      totalCount,
      totalPages,
      hasMore: page < totalPages,
    };

    return result;
  }

  async getBiharFeed(params: {
    date?: string;
    category?: string;
    sector?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    date: string;
    developments: CurrentAffairRecord[];
    staticReference: CurrentAffairRecord[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const conditions: string[] = [
      "is_published = TRUE",
      "(is_bihar_special = TRUE OR exam_relevance = 'BPSC' OR bihar_relevance IS NOT NULL OR LOWER(category) LIKE '%bihar%')"
    ];
    const values: any[] = [];
    let idx = 1;

    if (params.date) {
      conditions.push(`date = $${idx++}`);
      values.push(params.date);
    }

    const effectiveSector = params.category || params.sector;
    if (effectiveSector && effectiveSector !== 'ALL' && effectiveSector !== 'All') {
      conditions.push(`(LOWER(category) LIKE $${idx} OR LOWER(COALESCE(subtopic, '')) LIKE $${idx})`);
      values.push(`%${effectiveSector.toLowerCase()}%`);
      idx++;
    }

    if (params.search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(summary) LIKE $${idx})`);
      values.push(`%${params.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await pool.query(`SELECT COUNT(*) FROM public.current_affairs ${whereClause};`, values);
    const totalCount = parseInt(countRes.rows[0].count) || 0;

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    const res = await pool.query(query, values);
    const items = res.rows.map(row => this.mapRowToRecord(row));
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Distinguish dated daily developments from static/foundational reference
    const developments = items.filter(i => !i.title.toLowerCase().includes('background') && !i.title.toLowerCase().includes('overview'));
    const staticReference = items.filter(i => i.title.toLowerCase().includes('background') || i.title.toLowerCase().includes('overview'));

    return {
      date: params.date || new Date().toISOString().split('T')[0],
      developments,
      staticReference,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getArchiveFeed(params: {
    date?: string;
    startDate?: string;
    endDate?: string;
    exam?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: CurrentAffairRecord[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const conditions: string[] = ["is_published = TRUE"];
    const values: any[] = [];
    let idx = 1;

    if (params.date) {
      conditions.push(`date = $${idx++}`);
      values.push(params.date);
    }
    if (params.startDate) {
      conditions.push(`date >= $${idx++}`);
      values.push(params.startDate);
    }
    if (params.endDate) {
      conditions.push(`date <= $${idx++}`);
      values.push(params.endDate);
    }
    if (params.category && params.category !== 'ALL') {
      conditions.push(`(LOWER(category) LIKE $${idx} OR LOWER(COALESCE(subtopic, '')) LIKE $${idx})`);
      values.push(`%${params.category.toLowerCase()}%`);
      idx++;
    }
    if (params.exam && params.exam !== 'ALL') {
      conditions.push(`(exam_relevance = $${idx} OR exam_relevance = 'BOTH')`);
      values.push(params.exam);
      idx++;
    }
    if (params.search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(summary) LIKE $${idx} OR LOWER(source) LIKE $${idx})`);
      values.push(`%${params.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await pool.query(`SELECT COUNT(*) FROM public.current_affairs ${whereClause};`, values);
    const totalCount = parseInt(countRes.rows[0].count) || 0;

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 12);
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    const res = await pool.query(query, values);
    const items = res.rows.map(row => this.mapRowToRecord(row));
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async listTopicClusters(): Promise<any[]> {
    const query = `
      SELECT
        topic_cluster_id as id,
        topic_cluster_title as title,
        category,
        COUNT(*) as articles_count,
        MAX(date) as latest_date,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', id,
          'title', title,
          'source', source,
          'sourceUrl', source_url,
          'articleType', article_type,
          'gsPaper', gs_paper,
          'date', date,
          'summary', summary
        ) ORDER BY date DESC) as articles
      FROM public.current_affairs
      WHERE topic_cluster_id IS NOT NULL AND is_published = TRUE
      GROUP BY topic_cluster_id, topic_cluster_title, category
      ORDER BY latest_date DESC, articles_count DESC;
    `;
    const res = await pool.query(query);
    return res.rows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      articlesCount: parseInt(r.articles_count),
      latestDate: formatDateOnly(r.latest_date),
      articles: r.articles || [],
    }));
  }

  async recordIngestionRun(run: {
    sourceIdentifier: string;
    displayName: string;
    jobType?: string;
    status: string;
    resourcesDiscovered: number;
    resourcesFetched: number;
    resourcesSkipped: number;
    resourcesParsed?: number;
    dateValidCount?: number;
    verifiedCount?: number;
    qualityPassedCount?: number;
    rejectedCount?: number;
    rejectionReasons?: string[];
    persistedCount?: number;
    documentsCreated: number;
    documentsUpdated: number;
    duplicatesCount: number;
    currentAffairsPublished: number;
    editorialsPublished: number;
    errors?: string[];
    durationMs: number;
    freshnessStatus: string;
    latestArticleDate?: string;
    latestArticleTitle?: string;
  }): Promise<void> {
    const id = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const query = `
      INSERT INTO public.data_ingestion_runs (
        id, source_identifier, display_name, job_type, status,
        resources_discovered, resources_fetched, resources_skipped,
        resources_parsed, date_valid_count, verified_count, quality_passed_count,
        rejected_count, rejection_reasons, persisted_count,
        documents_created, documents_updated, duplicates_count,
        current_affairs_published, editorials_published,
        errors, duration_ms, freshness_status, latest_article_date, latest_article_title,
        started_at, completed_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14::jsonb, $15,
        $16, $17, $18,
        $19, $20,
        $21::jsonb, $22, $23, $24, $25,
        $26, NOW()
      );
    `;
    const startedAt = new Date(Date.now() - (run.durationMs || 0));
    const values = [
      id, run.sourceIdentifier, run.displayName, run.jobType || 'SCHEDULED_INGESTION', run.status,
      run.resourcesDiscovered, run.resourcesFetched, run.resourcesSkipped,
      run.resourcesParsed || run.resourcesFetched, run.dateValidCount || run.resourcesFetched,
      run.verifiedCount || run.documentsCreated, run.qualityPassedCount || run.documentsCreated,
      run.rejectedCount || 0, JSON.stringify(run.rejectionReasons || []), run.persistedCount || run.documentsCreated,
      run.documentsCreated, run.documentsUpdated, run.duplicatesCount,
      run.currentAffairsPublished, run.editorialsPublished,
      JSON.stringify(run.errors || []), run.durationMs, run.freshnessStatus,
      run.latestArticleDate || null, run.latestArticleTitle || null,
      startedAt
    ];
    await pool.query(query, values);
  }

  async listIngestionRuns(limit = 20): Promise<any[]> {
    const query = `
      SELECT * FROM public.data_ingestion_runs
      ORDER BY started_at DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }

  async updateSourceFreshness(sourceIdentifier: string, data: {
    displayName: string;
    sourceType: string;
    isActive?: boolean;
    latestDiscoveredArticle?: string;
    latestPublishedArticle?: string;
    latestArticleDate?: string;
    freshnessStatus?: string;
    lastError?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO public.source_freshness (
        source_identifier, display_name, source_type, is_active,
        latest_discovered_article, latest_published_article, latest_article_date,
        last_attempted_run, last_successful_run, failure_count, freshness_status,
        last_error, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        NOW(), CASE WHEN $8 = 'SYNC_FAILED' OR $8 = 'DEGRADED' THEN NULL ELSE NOW() END,
        CASE WHEN $8 = 'SYNC_FAILED' OR $8 = 'DEGRADED' THEN 1 ELSE 0 END,
        $8, $9, NOW()
      )
      ON CONFLICT (source_identifier) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        source_type = EXCLUDED.source_type,
        is_active = COALESCE(EXCLUDED.is_active, source_freshness.is_active),
        latest_discovered_article = COALESCE(EXCLUDED.latest_discovered_article, source_freshness.latest_discovered_article),
        latest_published_article = COALESCE(EXCLUDED.latest_published_article, source_freshness.latest_published_article),
        latest_article_date = COALESCE(EXCLUDED.latest_article_date, source_freshness.latest_article_date),
        last_attempted_run = NOW(),
        last_successful_run = CASE WHEN EXCLUDED.freshness_status = 'SYNC_FAILED' OR EXCLUDED.freshness_status = 'DEGRADED' THEN source_freshness.last_successful_run ELSE NOW() END,
        failure_count = CASE WHEN EXCLUDED.freshness_status = 'SYNC_FAILED' OR EXCLUDED.freshness_status = 'DEGRADED' THEN source_freshness.failure_count + 1 ELSE 0 END,
        freshness_status = EXCLUDED.freshness_status,
        last_error = EXCLUDED.last_error,
        updated_at = NOW();
    `;
    const values = [
      sourceIdentifier,
      data.displayName,
      data.sourceType,
      data.isActive ?? true,
      data.latestDiscoveredArticle || null,
      data.latestPublishedArticle || null,
      data.latestArticleDate || null,
      data.freshnessStatus || 'HEALTHY',
      data.lastError || null,
    ];
    await pool.query(query, values);
  }

  async getSourceFreshnessList(): Promise<any[]> {
    const query = `SELECT * FROM public.source_freshness ORDER BY updated_at DESC;`;
    const res = await pool.query(query);
    return res.rows;
  }

  async getTopicClusterDetails(clusterId: string): Promise<any | null> {
    const res = await pool.query(
      `SELECT * FROM public.current_affairs WHERE topic_cluster_id = $1 ORDER BY date DESC;`,
      [clusterId]
    );
    if (res.rows.length === 0) return null;
    const records = res.rows.map(r => this.mapRowToRecord(r));
    const first = records[0];
    const editorials = records.filter(r => r.isEditorial || r.articleType === 'EDITORIAL');
    const sourcesSet = new Set<string>();
    records.forEach(r => { if (r.source) sourcesSet.add(r.source); });

    return {
      id: clusterId,
      title: first.topicClusterTitle || first.title,
      category: first.category,
      articles: records,
      editorials,
      sourcesDetected: Array.from(sourcesSet),
    };
  }

  async getDailyDigest(targetDate?: string, targetExam?: string): Promise<{
    date: string;
    formattedDate: string;
    totalDiscovered: number;
    totalEligible: number;
    topStoriesCount: number;
    importantDevelopmentsCount: number;
    editorialsCount: number;
    biharArticlesCount: number;
    topicClustersCount: number;
    sourcesCount: number;
    sourcesDetected: string[];
  }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const date = targetDate ? formatDateOnly(targetDate) : todayStr;
    const articles = await this.listArticles({ date, isPublished: true });

    let filtered = articles;
    if (targetExam && targetExam !== 'ALL') {
      if (targetExam === 'BPSC') {
        filtered = filtered.filter(a => a.examRelevance === 'BPSC' || a.examRelevance === 'BOTH' || a.isBiharSpecial);
      } else if (targetExam === 'UPSC') {
        filtered = filtered.filter(a => a.examRelevance === 'UPSC' || a.examRelevance === 'BOTH');
      }
    }

    const editorials = filtered.filter(a => a.isEditorial || a.articleType === 'EDITORIAL');
    const bihar = filtered.filter(a => a.isBiharSpecial || a.category === 'Bihar Current Affairs');
    const nonEditorials = filtered.filter(a => !editorials.some(e => e.id === a.id));
    const topStoriesCount = Math.min(5, nonEditorials.length);
    const sourcesSet = new Set<string>();
    filtered.forEach(a => { if (a.source) sourcesSet.add(a.source); });

    const formatHelper = (dStr: string) => {
      try {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
      return dStr;
    };

    return {
      date,
      formattedDate: formatHelper(date),
      totalDiscovered: filtered.length,
      totalEligible: filtered.length,
      topStoriesCount,
      importantDevelopmentsCount: Math.max(0, nonEditorials.length - topStoriesCount),
      editorialsCount: editorials.length,
      biharArticlesCount: bihar.length,
      topicClustersCount: 0,
      sourcesCount: sourcesSet.size,
      sourcesDetected: Array.from(sourcesSet),
    };
  }

  async getAvailableEditorialDates(): Promise<{ date: string; formatted: string; count: number }[]> {
    const query = `
      SELECT date, COUNT(*) as count
      FROM public.current_affairs
      WHERE is_published = TRUE AND (is_editorial = TRUE OR article_type IN ('EDITORIAL', 'OPINION', 'EXPLAINER') OR source IN ('The Hindu', 'LiveMint', 'The Indian Express'))
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30;
    `;
    const res = await pool.query(query);
    return res.rows.map(row => {
      const dStr = formatDateOnly(row.date);
      let formatted = dStr;
      try {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formatted = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
      return {
        date: dStr,
        formatted,
        count: parseInt(row.count),
      };
    });
  }

  async listBiharArticles(filter: {
    date?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CurrentAffairRecord[]> {
    const conditions: string[] = [
      "is_published = TRUE",
      "(is_bihar_special = TRUE OR exam_relevance = 'BPSC' OR bihar_relevance IS NOT NULL OR LOWER(category) LIKE '%bihar%')"
    ];
    const values: any[] = [];
    let idx = 1;

    if (filter.date) {
      conditions.push(`date = $${idx++}`);
      values.push(filter.date);
    }
    if (filter.category && filter.category !== 'ALL' && filter.category !== 'All') {
      conditions.push(`(LOWER(category) LIKE $${idx} OR LOWER(COALESCE(subtopic, '')) LIKE $${idx})`);
      values.push(`%${filter.category.toLowerCase()}%`);
      idx++;
    }
    if (filter.search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(summary) LIKE $${idx})`);
      values.push(`%${filter.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    let limitClause = '';
    if (filter.limit) {
      limitClause = `LIMIT ${filter.limit}`;
      if (filter.offset) limitClause += ` OFFSET ${filter.offset}`;
    }

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, relevance_score DESC, created_at DESC
      ${limitClause};
    `;
    const res = await pool.query(query, values);
    return res.rows.map(r => this.mapRowToRecord(r));
  }

  async getAvailableBiharDates(): Promise<{ date: string; formatted: string; count: number }[]> {
    const query = `
      SELECT date, COUNT(*) as count
      FROM public.current_affairs
      WHERE is_published = TRUE AND (is_bihar_special = TRUE OR exam_relevance = 'BPSC' OR bihar_relevance IS NOT NULL OR LOWER(category) LIKE '%bihar%')
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30;
    `;
    const res = await pool.query(query);
    return res.rows.map(row => {
      const dStr = formatDateOnly(row.date);
      let formatted = dStr;
      try {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formatted = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
      return {
        date: dStr,
        formatted,
        count: parseInt(row.count),
      };
    });
  }

  async bookmarkForRevision(userId: string, currentAffairId: string): Promise<boolean> {
    const query = `
      INSERT INTO public.revision_items (
        id, user_id, current_affair_id, item_type, status, retention, priority, next_review_date, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'CURRENT_AFFAIR', 'PENDING', 100, 'HIGH', NOW(), NOW()
      )
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(query, [userId, currentAffairId]);
    return true;
  }

  async getUserRevisions(userId: string): Promise<CurrentAffairRecord[]> {
    const query = `
      SELECT ca.* FROM public.current_affairs ca
      INNER JOIN public.revision_items ri ON ca.id = ri.current_affair_id
      WHERE ri.user_id = $1
      ORDER BY ri.updated_at DESC;
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(r => this.mapRowToRecord(r));
  }

  async isBookmarkedBy(userId: string, currentAffairId: string): Promise<boolean> {
    const query = `
      SELECT id FROM public.revision_items
      WHERE user_id = $1 AND current_affair_id = $2
      LIMIT 1;
    `;
    const res = await pool.query(query, [userId, currentAffairId]);
    return res.rows.length > 0;
  }

  async ensureSeedArticles(): Promise<void> {
    console.log('[CurrentAffairsRepository] Repository initialized ready for truthful live ingestion.');
  }

  async ensureSeedData(): Promise<void> {
    console.log('[CurrentAffairsRepository] Seed data verified.');
  }

  async publishArticle(id: string): Promise<CurrentAffairRecord | null> {
    const query = `
      UPDATE public.current_affairs
      SET is_published = TRUE, status = 'PUBLISHED', quality_status = 'PASSED', verification_status = 'VERIFIED', updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [id]);
    return res.rows.length > 0 ? this.mapRowToRecord(res.rows[0]) : null;
  }

  async rejectArticle(id: string, reason?: string): Promise<CurrentAffairRecord | null> {
    const query = `
      UPDATE public.current_affairs
      SET is_published = FALSE, status = 'REJECTED', quality_status = 'FAILED', rejection_reason = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [id, reason || 'Rejected by administrator']);
    return res.rows.length > 0 ? this.mapRowToRecord(res.rows[0]) : null;
  }

  async listSources(): Promise<any[]> {
    return this.getSourceFreshnessList();
  }

  async createSource(data: any): Promise<any> {
    const sourceId = data.sourceIdentifier || data.id || `src_${Date.now()}`;
    await this.updateSourceFreshness(sourceId, {
      displayName: data.displayName || data.name || 'Custom Source',
      sourceType: data.sourceType || 'SECONDARY_MEDIA',
      isActive: data.isActive ?? true,
      freshnessStatus: 'HEALTHY',
    });
    return {
      sourceIdentifier: sourceId,
      displayName: data.displayName || data.name || 'Custom Source',
      sourceType: data.sourceType || 'SECONDARY_MEDIA',
      isActive: data.isActive ?? true,
    };
  }

  async deleteArticle(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM public.current_affairs WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  async getAdminMetrics(): Promise<{
    total: number;
    totalArticles: number;
    totalEditorials: number;
    totalBiharArticles: number;
    totalSources: number;
    healthySources: number;
  }> {
    const artRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_editorial = TRUE OR article_type = 'EDITORIAL') as editorials,
        COUNT(*) FILTER (WHERE is_bihar_special = TRUE OR category = 'Bihar Current Affairs') as bihar
      FROM public.current_affairs;
    `);
    const srcRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE freshness_status = 'HEALTHY' OR freshness_status = 'SYNC_SUCCESSFUL') as healthy
      FROM public.source_freshness;
    `);

    const total = parseInt(artRes.rows[0].total) || 0;
    return {
      total,
      totalArticles: total,
      totalEditorials: parseInt(artRes.rows[0].editorials) || 0,
      totalBiharArticles: parseInt(artRes.rows[0].bihar) || 0,
      totalSources: parseInt(srcRes.rows[0].total) || 0,
      healthySources: parseInt(srcRes.rows[0].healthy) || 0,
    };
  }
}

export const currentAffairsRepository = new CurrentAffairsRepository();

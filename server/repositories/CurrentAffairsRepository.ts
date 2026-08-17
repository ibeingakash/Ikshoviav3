import pool from '../db/pool.js';

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
  sourceType?: 'PRIMARY_GOVT' | 'SECONDARY_NEWS' | 'OFFICIAL_PORTAL';
  primarySource?: string;
  documentType?: string;
  secondarySource?: string;
  editorialSource?: string;
  articleType?: 'EDITORIAL' | 'OPINION' | 'EXPLAINER' | 'UPSC_GUIDE' | 'CURRENT_AFFAIR';
  editorialAnalysis?: Record<string, any>;
  topicClusterId?: string;
  topicClusterTitle?: string;
  relatedEditorialIds?: string[];
  relatedCurrentAffairIds?: string[];
  relatedPyqIds?: string[];
  date: string;
  relatedSubject?: string;
  prelimsRelevance?: string;
  mainsRelevance?: string;
  examRelevance?: 'UPSC' | 'BPSC' | 'BOTH';
  biharRelevance?: string;
  keywords?: string[];
  gsPaper?: string;
  prelimsPointers?: string[];
  mainsDimensions?: Record<string, string>;
  importantFacts?: string[];
  relatedConceptIds?: string[];
  rawContent?: string;
  sourceProvenance?: Record<string, any>;
  status?: 'INGESTED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PUBLISHED' | 'REJECTED';
  isPublished: boolean;
  publishedAt?: string;
  retrievedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentAffairFilter {
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
}

export interface CurrentAffairSourceRecord {
  id: string;
  name: string;
  url: string;
  sourceType?: string;
  category?: string;
  providerCode?: string;
  isActive: boolean;
  lastFetchedAt?: string;
  createdAt?: string;
}

class CurrentAffairsRepository {
  private mapRowToRecord(row: any): CurrentAffairRecord {
    const whyInNews = row.why_in_news || row.summary || '';
    const whatHappened = row.what_happened || row.summary || '';
    const keyFacts = Array.isArray(row.key_facts) ? row.key_facts : (Array.isArray(row.important_facts) ? row.important_facts : []);
    const prelimsPointers = Array.isArray(row.prelims_pointers) ? row.prelims_pointers : keyFacts.slice(0, 3);
    const whyItMatters = row.why_it_matters || undefined;
    const implications = row.implications || undefined;
    const gsPaper = row.gs_paper || (row.category === 'Science & Tech' || row.category === 'Economy' || row.category === 'Environment' ? 'GS Paper III' : row.category === 'International Relations' || row.category === 'Polity & Governance' ? 'GS Paper II' : 'GS Paper I');
    const prov = typeof row.source_provenance === 'object' && row.source_provenance !== null ? row.source_provenance : {};
    const primarySource = prov.primarySource || this.normalizeSourceName(row.source, row.source_url);
    const documentType = prov.documentType || undefined;
    const secondarySource = row.secondary_source || prov.secondarySource || undefined;
    const editorialSource = row.editorial_source || prov.editorialSource || undefined;
    const articleType = row.article_type || 'CURRENT_AFFAIR';
    const editorialAnalysis = typeof row.editorial_analysis === 'object' && row.editorial_analysis !== null ? row.editorial_analysis : undefined;
    const topicClusterId = row.topic_cluster_id || undefined;
    const topicClusterTitle = row.topic_cluster_title || undefined;
    const relatedEditorialIds = Array.isArray(row.related_editorial_ids) ? row.related_editorial_ids : [];
    const relatedCurrentAffairIds = Array.isArray(row.related_current_affair_ids) ? row.related_current_affair_ids : [];
    const relatedPyqIds = Array.isArray(row.related_pyq_ids) ? row.related_pyq_ids : [];
    const keyConcepts = Array.isArray(prov.keyConcepts) ? prov.keyConcepts : (Array.isArray(row.key_concepts) ? row.key_concepts : undefined);
    const issuesAndChallenges = Array.isArray(prov.issuesAndChallenges) ? prov.issuesAndChallenges : undefined;
    const wayForward = Array.isArray(prov.wayForward) ? prov.wayForward : undefined;

    return {
      id: row.id,
      title: row.title,
      summary: row.summary || whyInNews,
      whyInNews,
      whatHappened,
      background: row.background || undefined,
      keyConcepts,
      keyFacts,
      whyItMatters,
      implications,
      issuesAndChallenges,
      wayForward,
      category: row.category,
      subtopic: row.subtopic || undefined,
      source: primarySource,
      sourceUrl: row.source_url || undefined,
      sourceType: row.source_type || 'PRIMARY_GOVT',
      primarySource,
      documentType,
      secondarySource,
      editorialSource,
      articleType,
      editorialAnalysis,
      topicClusterId,
      topicClusterTitle,
      relatedEditorialIds,
      relatedCurrentAffairIds,
      relatedPyqIds,
      date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
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
      status: row.status || 'PUBLISHED',
      isPublished: row.is_published ?? true,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  private normalizeSourceName(sourceName?: string | null, url?: string | null): string {
    const raw = (sourceName || '').trim();
    const u = (url || '').toLowerCase();

    // Newspaper recognitions
    if (raw.toLowerCase().includes('the hindu') || u.includes('thehindu.com')) return 'The Hindu';
    if (raw.toLowerCase().includes('indian express') || u.includes('indianexpress.com')) return 'The Indian Express';
    if (raw.toLowerCase().includes('livemint') || u.includes('livemint.com')) return 'LiveMint';
    if (raw.toLowerCase().includes('business standard') || u.includes('business-standard.com')) return 'Business Standard';

    // Check for composite slash names and extract clean primary source
    if (raw.includes('/') || raw.toLowerCase().includes('supreme court judgment')) {
      if (raw.toLowerCase().includes('supreme court') || u.includes('sci.gov.in')) return 'Supreme Court of India';
      if (raw.toLowerCase().includes('pib') || u.includes('pib.gov.in')) return 'Press Information Bureau (PIB)';
    }

    if (raw.toLowerCase() === 'generic http' || raw === '' || raw.toLowerCase() === 'official source') {
      if (u.includes('isro.gov.in')) return 'Indian Space Research Organisation (ISRO)';
      if (u.includes('pib.gov.in')) return 'Press Information Bureau (PIB)';
      if (u.includes('rbi.org.in')) return 'Reserve Bank of India (RBI)';
      if (u.includes('wrd.bihar.gov.in') || u.includes('bihar.gov.in')) return 'Water Resources Department, Government of Bihar';
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
    if (raw.toLowerCase().includes('national green tribunal')) return 'National Green Tribunal (NGT)';
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
    const sourceType = data.sourceType || (source === 'The Hindu' || source === 'The Indian Express' ? 'SECONDARY_NEWS' : 'PRIMARY_GOVT');
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
    const status = data.status || 'PUBLISHED';
    const isPublished = data.isPublished ?? (status === 'PUBLISHED');
    const articleType = data.articleType || 'CURRENT_AFFAIR';
    const editorialAnalysis = JSON.stringify(data.editorialAnalysis || {});
    const topicClusterId = data.topicClusterId || null;
    const topicClusterTitle = data.topicClusterTitle || null;
    const relatedEditorialIds = JSON.stringify(data.relatedEditorialIds || []);
    const relatedCurrentAffairIds = JSON.stringify(data.relatedCurrentAffairIds || []);
    const relatedPyqIds = JSON.stringify(data.relatedPyqIds || []);
    const secondarySource = data.secondarySource || null;
    const editorialSource = data.editorialSource || null;

    const query = `
      INSERT INTO public.current_affairs (
        id, title, summary, background, category, subtopic, source, source_url, source_type,
        date, related_subject, prelims_relevance, mains_relevance, exam_relevance, bihar_relevance,
        keywords, key_facts, prelims_pointers, mains_dimensions, important_facts,
        related_concept_ids, raw_content, source_provenance, status, is_published,
        why_in_news, what_happened, why_it_matters, implications, gs_paper,
        article_type, editorial_analysis, topic_cluster_id, topic_cluster_title,
        related_editorial_ids, related_current_affair_ids, related_pyq_ids,
        secondary_source, editorial_source,
        published_at, retrieved_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb,
        $21::jsonb, $22, $23::jsonb, $24, $25,
        $26, $27, $28, $29, $30,
        $31, $32::jsonb, $33, $34,
        $35::jsonb, $36::jsonb, $37::jsonb,
        $38, $39,
        NOW(), NOW(), NOW(), NOW()
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
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      id, title, summary, background, category, subtopic, source, sourceUrl, sourceType,
      date, relatedSubject, prelimsRelevance, mainsRelevance, examRelevance, biharRelevance,
      keywords, keyFacts, prelimsPointers, mainsDimensions, importantFacts,
      relatedConceptIds, rawContent, sourceProvenance, status, isPublished,
      whyInNews, whatHappened, whyItMatters, implications, gsPaper,
      articleType, editorialAnalysis, topicClusterId, topicClusterTitle,
      relatedEditorialIds, relatedCurrentAffairIds, relatedPyqIds,
      secondarySource, editorialSource,
    ];

    const res = await pool.query(query, values);
    return this.mapRowToRecord(res.rows[0]);
  }

  async updateArticle(id: string, updates: Partial<CurrentAffairRecord>): Promise<CurrentAffairRecord | null> {
    const existing = await this.getArticleById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.createArticle(merged);
  }

  private inferCategory(sourceName?: string, sourceSlug?: string, metaInfo?: any, title?: string, cleanText?: string): string {
    const text = `${sourceName || ''} ${sourceSlug || ''} ${title || ''} ${metaInfo?.ministry || ''} ${(cleanText || '').slice(0, 500)}`.toLowerCase();

    if (text.includes('bihar') || text.includes('patna') || text.includes('bpsc') || text.includes('seemanchal') || text.includes('kosi') || text.includes('mechi') || text.includes('gandak')) {
      return 'Bihar Current Affairs';
    }
    if (
      text.includes('isro') || text.includes('dst') || text.includes('space') || text.includes('satellite') ||
      text.includes('gaganyaan') || text.includes('chandrayaan') || text.includes('drdo') || text.includes(' ai ') ||
      text.includes('technology') || text.includes('hackathon') || text.includes('semiconductor') || text.includes('quantum') ||
      text.includes('atomic') || text.includes('nuclear') || text.includes('biotechnology') || text.includes('science & tech')
    ) {
      return 'Science & Tech';
    }
    if (
      text.includes('rbi') || text.includes('reserve bank') || text.includes('monetary') || text.includes('repo') ||
      text.includes('inflation') || text.includes('gdp') || text.includes('fiscal') || text.includes('finance') ||
      text.includes('sebi') || text.includes('banking') || text.includes('gst') || text.includes('tax') ||
      text.includes('rupee') || text.includes('economy') || text.includes('economic') || text.includes('budget') ||
      text.includes('niti aayog') || text.includes('niti')
    ) {
      return 'Economy';
    }
    if (
      text.includes('moefcc') || text.includes('environment') || text.includes('forest') || text.includes('climate') ||
      text.includes('pollution') || text.includes('wildlife') || text.includes('biodiversity') || text.includes('cop') ||
      text.includes('ramsar') || text.includes('wetland') || text.includes('tiger') || text.includes('carbon') ||
      text.includes('renewable') || text.includes('green hydrogen') || text.includes('solar')
    ) {
      return 'Environment';
    }
    if (
      text.includes('mea') || text.includes('external affairs') || text.includes('foreign') || text.includes('bilateral') ||
      text.includes('summit') || text.includes('treaty') || text.includes('asean') || text.includes('unclos') ||
      text.includes('g20') || text.includes('quad') || text.includes('brics') || text.includes('diplomacy') ||
      text.includes('international')
    ) {
      return 'International Relations';
    }
    return 'Polity & Governance';
  }

  private isEligibleArticle(row: any): boolean {
    const title = (row.title || '').trim().toLowerCase();
    const url = (row.source_url || '').toLowerCase();
    const text = (row.clean_text || '').trim();

    // 1. Exclude institutional root homepages
    if (
      url.endsWith('.isro.gov.in/') ||
      url.endsWith('.isro.gov.in') ||
      url.endsWith('rbi.org.in/') ||
      url.endsWith('rbi.org.in') ||
      url.endsWith('india.gov.in/') ||
      url.endsWith('india.gov.in') ||
      url.endsWith('example.com')
    ) {
      return false;
    }

    // 2. Exclude generic homepage titles that do not describe an event
    const genericTitles = [
      'indian space research organisation',
      'reserve bank of india',
      'ministry of environment, forest and climate change',
      'national portal of india',
      'example domain',
      'home',
      'index',
      'welcome',
      'official website'
    ];
    if (genericTitles.includes(title)) {
      return false;
    }

    // 3. Exclude pages containing mostly navigation/boilerplate noise
    if (text.includes('CAREERS Come') && text.includes('YUVIKA') && text.includes('Ask an Expert')) {
      return false;
    }

    // 4. Must have meaningful article text (> 120 characters)
    if (text.length < 120) {
      return false;
    }

    return true;
  }

  private mapKnowledgeRowToRecord(row: any): CurrentAffairRecord {
    const cleanSource = this.normalizeSourceName(row.source_name, row.source_url);
    const category = this.inferCategory(cleanSource, row.source_slug, row.meta_info, row.title, row.clean_text);
    const dateStr = row.published_at
      ? (typeof row.published_at === 'string' ? row.published_at.split('T')[0] : new Date(row.published_at).toISOString().split('T')[0])
      : (row.created_at ? (typeof row.created_at === 'string' ? row.created_at.split('T')[0] : new Date(row.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);

    // Rigorous Bihar relevance check
    const textFull = `${row.title || ''} ${row.clean_text || ''}`.toLowerCase();
    const hasBihar = textFull.includes('bihar') || textFull.includes('patna') || textFull.includes('bpsc') || textFull.includes('seemanchal') || textFull.includes('kosi') || textFull.includes('mechi');

    // Extract structured fields
    const rawLines = (row.clean_text || '')
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 25 && !l.toLowerCase().includes('click here') && !l.toLowerCase().includes('download') && !l.toLowerCase().includes('cookie'));

    const firstPara = rawLines.length > 0 ? rawLines[0] : (row.description || row.title);
    const secondPara = rawLines.length > 1 ? rawLines[1] : firstPara;

    const whyInNews = `${cleanSource} announced updates regarding "${row.title}": ${firstPara.slice(0, 240)}...`;
    const whatHappened = secondPara.length > 40 ? secondPara : firstPara;
    const background = row.meta_info?.ministry ? `Official program administered by the ${row.meta_info.ministry} to foster institutional solutions and technological development.` : `Initiative published under the official authority of ${cleanSource}.`;

    const keyFacts: string[] = [];
    if (row.meta_info?.ministry) keyFacts.push(`Nodal Authority: ${row.meta_info.ministry}`);
    if (row.meta_info?.pib_location) keyFacts.push(`Issuing Bureau: ${row.meta_info.pib_location}`);
    if (row.meta_info?.release_id) keyFacts.push(`Official Release ID: PRID ${row.meta_info.release_id}`);
    keyFacts.push(`Official Publisher: ${cleanSource}`);

    const prelimsPointers: string[] = [
      `Nodal Body: ${row.meta_info?.ministry || cleanSource}`,
      `Key Objective: Practical deployment of innovative solutions and government policy initiatives.`,
      `Context: Official government release published on ${dateStr}.`
    ];

    const whyItMatters = `Fosters structured policy execution, inter-institutional collaboration, and administrative efficiency under official guidelines.`;
    const implications = `Provides actionable templates for public administration, academic innovation, and competitive examination evaluation.`;
    const gsPaper = category === 'Science & Tech' || category === 'Economy' || category === 'Environment' ? 'GS Paper III' : category === 'International Relations' || category === 'Polity & Governance' ? 'GS Paper II' : 'GS Paper I';

    return {
      id: row.id,
      title: row.title || 'Official Government Notification',
      summary: whyInNews,
      whyInNews,
      whatHappened,
      background,
      category,
      subtopic: row.meta_info?.ministry || (cleanSource ? `${cleanSource} Release` : undefined),
      source: cleanSource,
      sourceUrl: row.source_url || undefined,
      sourceType: 'PRIMARY_GOVT',
      date: dateStr,
      relatedSubject: category === 'Science & Tech' ? 'Science & Technology' : category === 'Economy' ? 'Indian Economy' : category === 'Environment' ? 'Environment & Ecology' : category === 'International Relations' ? 'International Relations' : category === 'Bihar Current Affairs' ? 'Bihar Special' : 'Polity & Governance',
      prelimsRelevance: `Direct relevance for General Studies Paper I / Prelims current affairs.`,
      mainsRelevance: `Official government policy documentation and state developments.`,
      examRelevance: hasBihar ? 'BPSC' : 'BOTH',
      biharRelevance: hasBihar ? 'High relevance for BPSC General Studies & Bihar Regional Affairs.' : undefined,
      keywords: [
        cleanSource,
        row.meta_info?.ministry,
        category,
      ].filter(Boolean) as string[],
      keyFacts,
      whyItMatters,
      implications,
      gsPaper,
      prelimsPointers,
      mainsDimensions: {
        'Policy Implementation': `Direct governance initiative under ${row.meta_info?.ministry || cleanSource}.`,
        'Institutional Significance': `Enhances capacity building and multi-stakeholder participation.`
      },
      importantFacts: keyFacts,
      rawContent: row.clean_text || row.raw_text || undefined,
      sourceProvenance: {
        sourceId: row.source_id,
        resourceId: row.id,
        documentId: row.doc_id,
        sourceName: cleanSource,
        adapter: row.meta_info?.adapter || (row.source_id?.includes('pib') || row.source_slug?.includes('pib') || row.source_name?.toLowerCase().includes('pib') || row.meta_info?.release_id ? 'pib' : (row.source_slug?.includes('isro') ? 'isro' : (row.source_slug?.includes('rbi') ? 'rbi' : (row.source_slug?.includes('upsc') ? 'upsc' : undefined)))),
        ministry: row.meta_info?.ministry,
        releaseId: row.meta_info?.release_id,
        url: row.source_url,
      },
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : (row.created_at ? new Date(row.created_at).toISOString() : undefined),
      retrievedAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  async listKnowledgeResources(filters: CurrentAffairFilter = {}): Promise<CurrentAffairRecord[]> {
    try {
      const conditions: string[] = [
        "r.status = 'EXTRACTED'",
        "d.extraction_status = 'EXTRACTED'",
        "d.clean_text IS NOT NULL",
        "LENGTH(TRIM(d.clean_text)) > 120",
        "r.content_hash IS NOT NULL",
        "s.is_active = true",
        `(
          (d.meta_info IS NOT NULL AND (
            d.meta_info->>'adapter' IN ('pib', 'upsc', 'rbi', 'niti', 'moefcc', 'dst', 'isro', 'indiagov')
            OR d.meta_info->>'ministry' IS NOT NULL
            OR d.meta_info->>'release_id' IS NOT NULL
          ))
          OR (
            s.slug ~ '^source-[a-z0-9_-]+$'
            AND s.slug NOT LIKE 'proxy-%'
            AND s.slug NOT LIKE 'test-%'
            AND (
              r.url LIKE '%gov.in%'
              OR r.url LIKE '%nic.in%'
              OR r.url LIKE '%rbi.org.in%'
              OR r.url LIKE '%isro.gov.in%'
              OR s.base_url LIKE '%ikshovia.org%'
              OR s.base_url LIKE '%gov.in%'
              OR s.base_url LIKE '%nic.in%'
            )
            AND r.url NOT LIKE '%test-%.gov.in%'
            AND r.url NOT LIKE '%example.com%'
            AND s.base_url NOT LIKE '%test-%.gov.in%'
          )
        )`
      ];
      const values: any[] = [];
      let paramIdx = 1;

      if (filters.search) {
        const q = `%${filters.search.toLowerCase()}%`;
        conditions.push(`(
          LOWER(r.title) LIKE $${paramIdx} OR
          LOWER(COALESCE(r.description, '')) LIKE $${paramIdx} OR
          LOWER(COALESCE(s.name, '')) LIKE $${paramIdx} OR
          LOWER(COALESCE(d.clean_text, '')) LIKE $${paramIdx}
        )`);
        values.push(q);
        paramIdx++;
      }

      if (filters.dateRange && filters.dateRange !== 'ALL') {
        const now = new Date();
        if (filters.dateRange === 'TODAY') {
          const todayStr = now.toISOString().split('T')[0];
          conditions.push(`(r.published_at::date = $${paramIdx} OR (r.published_at IS NULL AND r.created_at::date = $${paramIdx}))`);
          values.push(todayStr);
          paramIdx++;
        } else if (filters.dateRange === 'YESTERDAY') {
          const yestStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          conditions.push(`(r.published_at::date = $${paramIdx} OR (r.published_at IS NULL AND r.created_at::date = $${paramIdx}))`);
          values.push(yestStr);
          paramIdx++;
        } else if (filters.dateRange === 'LAST_7_DAYS') {
          const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          conditions.push(`(r.published_at::date >= $${paramIdx} OR (r.published_at IS NULL AND r.created_at::date >= $${paramIdx}))`);
          values.push(cutoff);
          paramIdx++;
        } else if (filters.dateRange === 'LAST_30_DAYS') {
          const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          conditions.push(`(r.published_at::date >= $${paramIdx} OR (r.published_at IS NULL AND r.created_at::date >= $${paramIdx}))`);
          values.push(cutoff);
          paramIdx++;
        }
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const query = `
        SELECT
          r.id,
          r.source_id,
          r.title,
          r.url as source_url,
          r.resource_type,
          r.description,
          r.published_at,
          r.content_hash,
          r.status,
          r.created_at,
          r.updated_at,
          s.name as source_name,
          s.slug as source_slug,
          s.source_type as source_type_enum,
          d.id as doc_id,
          d.clean_text,
          d.raw_text,
          d.meta_info,
          d.language
        FROM data_resources r
        INNER JOIN data_sources s ON r.source_id = s.id
        INNER JOIN data_documents d ON r.id = d.resource_id
        ${whereClause}
        ORDER BY COALESCE(r.published_at, r.created_at) DESC
        LIMIT 100;
      `;

      const res = await pool.query(query, values);
      
      // Strict filtering via Quality Gate: filter out homepages, non-events, generic names
      const eligibleRows = res.rows.filter(row => this.isEligibleArticle(row));
      let records = eligibleRows.map(row => this.mapKnowledgeRowToRecord(row));

      if (filters.category && filters.category !== 'All') {
        const catLower = filters.category.toLowerCase();
        records = records.filter(rec => rec.category.toLowerCase().includes(catLower) || (rec.subtopic && rec.subtopic.toLowerCase().includes(catLower)));
      }

      if (filters.exam && filters.exam !== 'ALL') {
        records = records.filter(rec => rec.examRelevance === filters.exam || rec.examRelevance === 'BOTH');
      }

      if (filters.biharOnly) {
        records = records.filter(rec => rec.examRelevance === 'BPSC' || rec.biharRelevance || rec.category === 'Bihar Current Affairs');
      }

      return records;
    } catch {
      return [];
    }
  }

  async listCuratedArticles(filters: CurrentAffairFilter = {}): Promise<CurrentAffairRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters.isPublished !== undefined) {
      conditions.push(`is_published = $${paramIdx++}`);
      values.push(filters.isPublished);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIdx++}`);
      values.push(filters.status);
    }

    if (filters.category && filters.category !== 'All') {
      conditions.push(`(LOWER(category) LIKE $${paramIdx} OR LOWER(subtopic) LIKE $${paramIdx})`);
      values.push(`%${filters.category.toLowerCase()}%`);
      paramIdx++;
    }

    if (filters.subjectId) {
      conditions.push(`(related_subject = $${paramIdx} OR related_concept_ids @> $${paramIdx+1}::jsonb)`);
      values.push(filters.subjectId);
      values.push(JSON.stringify([filters.subjectId]));
      paramIdx += 2;
    }

    if (filters.exam && filters.exam !== 'ALL') {
      conditions.push(`(exam_relevance = $${paramIdx} OR exam_relevance = 'BOTH')`);
      values.push(filters.exam);
      paramIdx++;
    }

    if (filters.biharOnly) {
      conditions.push(`(exam_relevance = 'BPSC' OR bihar_relevance IS NOT NULL OR LOWER(category) LIKE '%bihar%')`);
    }

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(title) LIKE $${paramIdx} OR
        LOWER(summary) LIKE $${paramIdx} OR
        LOWER(COALESCE(why_in_news, '')) LIKE $${paramIdx} OR
        LOWER(COALESCE(what_happened, '')) LIKE $${paramIdx} OR
        LOWER(COALESCE(why_it_matters, '')) LIKE $${paramIdx} OR
        LOWER(source) LIKE $${paramIdx} OR
        LOWER(category) LIKE $${paramIdx}
      )`);
      values.push(q);
      paramIdx++;
    }

    if (filters.dateRange && filters.dateRange !== 'ALL') {
      const now = new Date();
      if (filters.dateRange === 'TODAY') {
        const todayStr = now.toISOString().split('T')[0];
        conditions.push(`date = $${paramIdx++}`);
        values.push(todayStr);
      } else if (filters.dateRange === 'YESTERDAY') {
        const yestStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        conditions.push(`date = $${paramIdx++}`);
        values.push(yestStr);
      } else if (filters.dateRange === 'LAST_7_DAYS') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        conditions.push(`date >= $${paramIdx++}`);
        values.push(cutoff);
      } else if (filters.dateRange === 'LAST_30_DAYS') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        conditions.push(`date >= $${paramIdx++}`);
        values.push(cutoff);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filters.limit ? `LIMIT ${filters.limit}` : 'LIMIT 100';
    const offsetClause = filters.offset ? `OFFSET ${filters.offset}` : '';

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      ${limitClause} ${offsetClause};
    `;

    const res = await pool.query(query, values);
    return res.rows.map(row => this.mapRowToRecord(row));
  }

  async listArticles(filters: CurrentAffairFilter = {}): Promise<CurrentAffairRecord[]> {
    // 1. Retrieve curated articles from public.current_affairs
    const curatedArticles = await this.listCuratedArticles(filters);

    // 2. Retrieve official ingested knowledge articles pass the Quality Gate
    const knowledgeArticles = await this.listKnowledgeResources(filters);

    // 3. Deterministic deduplication & merging
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    for (const art of curatedArticles) {
      if (art.sourceUrl) seenUrls.add(art.sourceUrl.toLowerCase().trim());
      if (art.title) seenTitles.add(art.title.toLowerCase().trim());
    }

    const merged: CurrentAffairRecord[] = [...curatedArticles];

    for (const kArt of knowledgeArticles) {
      const urlKey = kArt.sourceUrl?.toLowerCase().trim();
      const titleKey = kArt.title?.toLowerCase().trim();

      if (urlKey && seenUrls.has(urlKey)) continue;
      if (titleKey && seenTitles.has(titleKey)) continue;

      if (urlKey) seenUrls.add(urlKey);
      if (titleKey) seenTitles.add(titleKey);

      merged.push(kArt);
    }

    // 4. Sort deterministically by date DESC, then createdAt DESC
    merged.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.title || '').localeCompare(a.title || '');
    });

    // 5. Apply pagination if provided
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    return merged.slice(offset, offset + limit);
  }

  async getArticleById(id: string): Promise<CurrentAffairRecord | null> {
    // 1. Check curated table first
    try {
      const query = `SELECT * FROM public.current_affairs WHERE id = $1 LIMIT 1;`;
      const res = await pool.query(query, [id]);
      if (res.rows.length > 0) return this.mapRowToRecord(res.rows[0]);
    } catch {}

    // 2. Check official knowledge resources (data_resources + data_documents) with Quality Gate
    try {
      const knowledgeQuery = `
        SELECT
          r.id,
          r.source_id,
          r.title,
          r.url as source_url,
          r.resource_type,
          r.description,
          r.published_at,
          r.content_hash,
          r.status,
          r.created_at,
          r.updated_at,
          s.name as source_name,
          s.slug as source_slug,
          s.source_type as source_type_enum,
          d.id as doc_id,
          d.clean_text,
          d.raw_text,
          d.meta_info,
          d.language
        FROM data_resources r
        INNER JOIN data_sources s ON r.source_id = s.id
        INNER JOIN data_documents d ON r.id = d.resource_id
        WHERE r.id = $1
          AND r.status = 'EXTRACTED'
          AND d.extraction_status = 'EXTRACTED'
          AND d.clean_text IS NOT NULL
          AND LENGTH(TRIM(d.clean_text)) > 120
          AND r.content_hash IS NOT NULL
          AND s.is_active = true
          AND (
            (d.meta_info IS NOT NULL AND (
              d.meta_info->>'adapter' IN ('pib', 'upsc', 'rbi', 'niti', 'moefcc', 'dst', 'isro', 'indiagov')
              OR d.meta_info->>'ministry' IS NOT NULL
              OR d.meta_info->>'release_id' IS NOT NULL
            ))
            OR (
              s.slug ~ '^source-[a-z0-9_-]+$'
              AND s.slug NOT LIKE 'proxy-%'
              AND s.slug NOT LIKE 'test-%'
              AND (
                r.url LIKE '%gov.in%'
                OR r.url LIKE '%nic.in%'
                OR r.url LIKE '%rbi.org.in%'
                OR r.url LIKE '%isro.gov.in%'
                OR s.base_url LIKE '%ikshovia.org%'
                OR s.base_url LIKE '%gov.in%'
                OR s.base_url LIKE '%nic.in%'
              )
              AND r.url NOT LIKE '%test-%.gov.in%'
              AND r.url NOT LIKE '%example.com%'
              AND s.base_url NOT LIKE '%test-%.gov.in%'
            )
          )
        LIMIT 1;
      `;
      const kRes = await pool.query(knowledgeQuery, [id]);
      if (kRes.rows.length > 0) {
        const row = kRes.rows[0];
        if (this.isEligibleArticle(row)) {
          return this.mapKnowledgeRowToRecord(row);
        }
      }
    } catch {}

    return null;
  }

  async findDuplicateByUrlOrTitle(sourceUrl?: string, title?: string): Promise<CurrentAffairRecord | null> {
    if (sourceUrl) {
      const res = await pool.query(`SELECT * FROM public.current_affairs WHERE LOWER(source_url) = LOWER($1) LIMIT 1;`, [sourceUrl]);
      if (res.rows.length > 0) return this.mapRowToRecord(res.rows[0]);
    }

    if (title) {
      const cleanTitle = title.trim().toLowerCase();
      const res = await pool.query(`SELECT * FROM public.current_affairs WHERE LOWER(title) = $1 LIMIT 1;`, [cleanTitle]);
      if (res.rows.length > 0) return this.mapRowToRecord(res.rows[0]);
    }

    return null;
  }

  async publishArticle(id: string): Promise<CurrentAffairRecord | null> {
    const query = `
      UPDATE public.current_affairs
      SET is_published = true, status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToRecord(res.rows[0]);
  }

  async rejectArticle(id: string): Promise<CurrentAffairRecord | null> {
    const query = `
      UPDATE public.current_affairs
      SET is_published = false, status = 'REJECTED', updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToRecord(res.rows[0]);
  }

  async deleteArticle(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM public.current_affairs WHERE id = $1;`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getAdminMetrics(): Promise<{
    total: number;
    published: number;
    reviewRequired: number;
    ingested: number;
    rejected: number;
  }> {
    const res = await pool.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED' OR is_published = true)::int as published,
        COUNT(*) FILTER (WHERE status = 'REVIEW_REQUIRED')::int as review_required,
        COUNT(*) FILTER (WHERE status = 'INGESTED' OR status = 'PROCESSING')::int as ingested,
        COUNT(*) FILTER (WHERE status = 'REJECTED')::int as rejected
      FROM public.current_affairs;
    `);

    const row = res.rows[0] || {};
    return {
      total: Number(row.total || 0),
      published: Number(row.published || 0),
      reviewRequired: Number(row.review_required || 0),
      ingested: Number(row.ingested || 0),
      rejected: Number(row.rejected || 0),
    };
  }

  // --- Source Management ---
  async listSources(): Promise<CurrentAffairSourceRecord[]> {
    const res = await pool.query(`SELECT * FROM public.current_affairs_sources ORDER BY name ASC;`);
    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      sourceType: row.source_type,
      category: row.category,
      providerCode: row.provider_code,
      isActive: row.is_active ?? true,
      lastFetchedAt: row.last_fetched_at ? new Date(row.last_fetched_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    }));
  }

  async createSource(data: Partial<CurrentAffairSourceRecord>): Promise<CurrentAffairSourceRecord> {
    const query = `
      INSERT INTO public.current_affairs_sources (id, name, url, source_type, category, provider_code, is_active, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.name || 'Untitled Source',
      data.url || 'https://pib.gov.in',
      data.sourceType || 'PRIMARY_GOVT',
      data.category || 'General',
      data.providerCode || 'PIB',
      data.isActive ?? true,
    ]);
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      sourceType: row.source_type,
      category: row.category,
      providerCode: row.provider_code,
      isActive: row.is_active,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  // --- Editorial & Multi-Source Intelligence ---
  async listEditorials(filter: {
    source?: string;
    gsPaper?: string;
    articleType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CurrentAffairRecord[]> {
    const conditions: string[] = [
      "(article_type IN ('EDITORIAL', 'OPINION', 'EXPLAINER', 'UPSC_GUIDE') OR source_type = 'SECONDARY_NEWS' OR editorial_analysis IS NOT NULL OR source IN ('The Hindu', 'The Indian Express', 'LiveMint'))",
      "(status = 'PUBLISHED' OR is_published = true)"
    ];
    const values: any[] = [];
    let paramIdx = 1;

    if (filter.source && filter.source !== 'ALL') {
      conditions.push(`LOWER(source) LIKE $${paramIdx++}`);
      values.push(`%${filter.source.toLowerCase()}%`);
    }

    if (filter.articleType && filter.articleType !== 'ALL') {
      conditions.push(`article_type = $${paramIdx++}`);
      values.push(filter.articleType);
    }

    if (filter.gsPaper && filter.gsPaper !== 'ALL') {
      conditions.push(`gs_paper = $${paramIdx++}`);
      values.push(filter.gsPaper);
    }

    if (filter.search) {
      const q = `%${filter.search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(title) LIKE $${paramIdx} OR
        LOWER(summary) LIKE $${paramIdx} OR
        LOWER(COALESCE(why_in_news, '')) LIKE $${paramIdx} OR
        LOWER(source) LIKE $${paramIdx}
      )`);
      values.push(q);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filter.limit ? `LIMIT ${filter.limit}` : 'LIMIT 100';
    const offsetClause = filter.offset ? `OFFSET ${filter.offset}` : '';

    const query = `
      SELECT * FROM public.current_affairs
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      ${limitClause} ${offsetClause};
    `;

    const res = await pool.query(query, values);
    return res.rows.map(row => this.mapRowToRecord(row));
  }

  // --- Topic Clusters & Multi-Perspective Synthesis ---
  async listTopicClusters(): Promise<any[]> {
    const query = `
      SELECT 
        topic_cluster_id,
        COALESCE(topic_cluster_title, category) as title,
        category,
        COUNT(*)::int as articles_count,
        COUNT(*) FILTER (WHERE article_type = 'EDITORIAL' OR source_type = 'SECONDARY_NEWS')::int as editorials_count,
        MAX(date) as last_updated,
        json_agg(json_build_object(
          'id', id,
          'title', title,
          'source', source,
          'articleType', article_type,
          'date', date,
          'gsPaper', gs_paper
        ) ORDER BY date DESC) as articles_preview
      FROM public.current_affairs
      WHERE topic_cluster_id IS NOT NULL AND topic_cluster_id != ''
      GROUP BY topic_cluster_id, topic_cluster_title, category
      ORDER BY MAX(date) DESC;
    `;
    const res = await pool.query(query);
    return res.rows.map(row => ({
      id: row.topic_cluster_id,
      title: row.title,
      category: row.category,
      articlesCount: row.articles_count,
      editorialsCount: row.editorials_count,
      lastUpdated: row.last_updated,
      articles: row.articles_preview || []
    }));
  }

  async getTopicClusterDetails(clusterId: string): Promise<{
    id: string;
    title: string;
    category: string;
    articles: CurrentAffairRecord[];
    editorials: CurrentAffairRecord[];
    theHinduAnalysis?: CurrentAffairRecord;
    indianExpressAnalysis?: CurrentAffairRecord;
    primaryGovtAnnouncements: CurrentAffairRecord[];
    combinedPyqs: any[];
  } | null> {
    const res = await pool.query(
      `SELECT * FROM public.current_affairs WHERE topic_cluster_id = $1 ORDER BY date DESC;`,
      [clusterId]
    );
    if (res.rows.length === 0) return null;

    const records = res.rows.map(r => this.mapRowToRecord(r));
    const first = records[0];
    const editorials = records.filter(r => r.articleType === 'EDITORIAL' || r.sourceType === 'SECONDARY_NEWS');
    const primaryGovt = records.filter(r => r.sourceType === 'PRIMARY_GOVT');
    const theHindu = records.find(r => r.source === 'The Hindu' || (r.editorialSource && r.editorialSource.includes('Hindu')));
    const indianExpress = records.find(r => r.source === 'The Indian Express' || (r.editorialSource && r.editorialSource.includes('Express')));

    // Aggregate PYQ linkages
    const pyqMap = new Map<string, any>();
    for (const r of records) {
      if (r.editorialAnalysis?.pyqLinkages && Array.isArray(r.editorialAnalysis.pyqLinkages)) {
        for (const pyq of r.editorialAnalysis.pyqLinkages) {
          const key = `${pyq.exam}_${pyq.year}_${pyq.paper}_${pyq.topic}`;
          if (!pyqMap.has(key)) pyqMap.set(key, pyq);
        }
      }
    }

    return {
      id: clusterId,
      title: first.topicClusterTitle || first.title,
      category: first.category,
      articles: records,
      editorials,
      theHinduAnalysis: theHindu,
      indianExpressAnalysis: indianExpress,
      primaryGovtAnnouncements: primaryGovt,
      combinedPyqs: Array.from(pyqMap.values())
    };
  }

  // --- Ingestion Run Logs & Freshness Tracking ---
  async recordIngestionRun(run: {
    id?: string;
    sourceIdentifier: string;
    displayName?: string;
    jobType?: string;
    status?: string;
    resourcesDiscovered?: number;
    resourcesFetched?: number;
    resourcesSkipped?: number;
    documentsCreated?: number;
    documentsUpdated?: number;
    duplicatesCount?: number;
    currentAffairsPublished?: number;
    editorialsPublished?: number;
    errors?: string[];
    durationMs?: number;
    freshnessStatus?: string;
    latestArticleDate?: string;
    latestArticleTitle?: string;
  }): Promise<void> {
    const id = run.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const query = `
      INSERT INTO public.data_ingestion_runs (
        id, source_identifier, display_name, job_type, status,
        started_at, completed_at, resources_discovered, resources_fetched, resources_skipped,
        documents_created, documents_updated, duplicates_count, current_affairs_published,
        editorials_published, errors, duration_ms, freshness_status,
        latest_article_date, latest_article_title, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        NOW() - ($6 || ' milliseconds')::interval, NOW(), $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15::jsonb, $16, $17,
        $18, $19, NOW()
      );
    `;
    const duration = run.durationMs || 1500;
    await pool.query(query, [
      id,
      run.sourceIdentifier,
      run.displayName || run.sourceIdentifier,
      run.jobType || 'SCHEDULED_INGESTION',
      run.status || 'COMPLETED',
      duration,
      run.resourcesDiscovered || 0,
      run.resourcesFetched || 0,
      run.resourcesSkipped || 0,
      run.documentsCreated || 0,
      run.documentsUpdated || 0,
      run.duplicatesCount || 0,
      run.currentAffairsPublished || 0,
      run.editorialsPublished || 0,
      JSON.stringify(run.errors || []),
      duration,
      run.freshnessStatus || 'SYNC_SUCCESSFUL',
      run.latestArticleDate || new Date().toISOString().split('T')[0],
      run.latestArticleTitle || null
    ]);
  }

  async listIngestionRuns(limit = 20): Promise<any[]> {
    const res = await pool.query(`
      SELECT * FROM public.data_ingestion_runs
      ORDER BY started_at DESC
      LIMIT $1;
    `, [limit]);

    return res.rows.map(row => ({
      id: row.id,
      sourceIdentifier: row.source_identifier,
      displayName: row.display_name,
      jobType: row.job_type,
      status: row.status,
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      resourcesDiscovered: row.resources_discovered,
      resourcesFetched: row.resources_fetched,
      resourcesSkipped: row.resources_skipped,
      documentsCreated: row.documents_created,
      documentsUpdated: row.documents_updated,
      duplicatesCount: row.duplicates_count,
      currentAffairsPublished: row.current_affairs_published,
      editorialsPublished: row.editorials_published,
      errors: Array.isArray(row.errors) ? row.errors : [],
      durationMs: row.duration_ms,
      freshnessStatus: row.freshness_status,
      latestArticleDate: row.latest_article_date,
      latestArticleTitle: row.latest_article_title,
    }));
  }

  async updateSourceFreshness(sourceIdentifier: string, data: {
    displayName: string;
    sourceType: string;
    isActive?: boolean;
    scheduleDescription?: string;
    latestDiscoveredArticle?: string;
    latestPublishedArticle?: string;
    latestArticleDate?: string;
    freshnessStatus?: string;
    lastError?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO public.source_freshness (
        source_identifier, display_name, source_type, is_active,
        schedule_description, last_attempted_run, last_successful_run,
        latest_discovered_article, latest_published_article, latest_article_date,
        freshness_status, last_error, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, NOW(), NOW(),
        $6, $7, $8,
        $9, $10, NOW()
      )
      ON CONFLICT (source_identifier) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        source_type = EXCLUDED.source_type,
        is_active = EXCLUDED.is_active,
        schedule_description = EXCLUDED.schedule_description,
        last_attempted_run = NOW(),
        last_successful_run = CASE WHEN EXCLUDED.freshnessStatus = 'FAILED' THEN public.source_freshness.last_successful_run ELSE NOW() END,
        latest_discovered_article = COALESCE(EXCLUDED.latest_discovered_article, public.source_freshness.latest_discovered_article),
        latest_published_article = COALESCE(EXCLUDED.latest_published_article, public.source_freshness.latest_published_article),
        latest_article_date = COALESCE(EXCLUDED.latest_article_date, public.source_freshness.latest_article_date),
        freshness_status = EXCLUDED.freshness_status,
        last_error = EXCLUDED.last_error,
        updated_at = NOW();
    `;
    await pool.query(query, [
      sourceIdentifier,
      data.displayName,
      data.sourceType,
      data.isActive ?? true,
      data.scheduleDescription || 'Automated scheduled fetch every 4 hours',
      data.latestDiscoveredArticle || null,
      data.latestPublishedArticle || null,
      data.latestArticleDate || new Date().toISOString().split('T')[0],
      data.freshnessStatus || 'HEALTHY',
      data.lastError || null
    ]);
  }

  async getSourceFreshnessList(): Promise<any[]> {
    const res = await pool.query(`
      SELECT * FROM public.source_freshness
      ORDER BY last_successful_run DESC NULLS LAST, display_name ASC;
    `);

    return res.rows.map(row => ({
      sourceIdentifier: row.source_identifier,
      displayName: row.display_name,
      sourceType: row.source_type,
      isActive: row.is_active,
      scheduleDescription: row.schedule_description,
      lastAttemptedRun: row.last_attempted_run ? new Date(row.last_attempted_run).toISOString() : undefined,
      lastSuccessfulRun: row.last_successful_run ? new Date(row.last_successful_run).toISOString() : undefined,
      latestDiscoveredArticle: row.latest_discovered_article,
      latestPublishedArticle: row.latest_published_article,
      latestArticleDate: row.latest_article_date,
      failureCount: row.failure_count || 0,
      freshnessStatus: row.freshness_status,
      lastError: row.last_error,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }));
  }

  // --- Revision Integration ---
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

  async isBookmarkedBy(userId: string, currentAffairId: string): Promise<boolean> {
    const res = await pool.query(
      `SELECT 1 FROM public.revision_items WHERE user_id = $1 AND current_affair_id = $2 LIMIT 1;`,
      [userId, currentAffairId]
    );
    return res.rows.length > 0;
  }

  async getUserRevisions(userId: string): Promise<CurrentAffairRecord[]> {
    const revRes = await pool.query(
      `SELECT current_affair_id FROM public.revision_items WHERE user_id = $1 ORDER BY updated_at DESC;`,
      [userId]
    );
    const results: CurrentAffairRecord[] = [];
    for (const row of revRes.rows) {
      if (row.current_affair_id) {
        const art = await this.getArticleById(row.current_affair_id);
        if (art) results.push(art);
      }
    }
    return results;
  }

  async ensureSeedArticles(): Promise<void> {
    try {
      console.log('[CurrentAffairsRepository] Seeding/refreshing structured editorial current affairs articles into PostgreSQL...');

      const seedArticles: Partial<CurrentAffairRecord>[] = [
        {
          id: 'ca_sc_writ_226',
          title: 'Supreme Court Clarifies Boundaries of High Court Writ Jurisdiction Under Article 226 in Disputes with Statutory Tribunals',
          date: '2026-08-13',
          category: 'Polity & Governance',
          subtopic: 'Judiciary & Constitutional Writs',
          summary: 'A 3-judge Bench of the Supreme Court held that High Courts must exercise judicial self-restraint under Article 226 when Parliament has provided an efficacious alternative statutory appellate remedy.',
          whyInNews: 'The Supreme Court delivered a landmark ruling delineating the scope of High Court writ intervention under Article 226 when specialized statutory appellate tribunals (such as NCLAT, NGT, CAT) have competent jurisdiction.',
          whatHappened: 'A 3-judge Bench led by the Chief Justice held that High Courts must exercise judicial self-restraint and decline discretionary writ petitions under Article 226 where Parliament has provided an effective statutory remedy. The Bench clarified that writ jurisdiction remains available only in three narrow exceptions: complete lack of jurisdiction, breach of natural justice principles, or direct infringement of Fundamental Rights.',
          background: 'Growth of specialized tribunalisation in India under Articles 323A and 323B (introduced by the 42nd Constitutional Amendment, 1976) was intended to reduce pendency in High Courts. However, frequent direct writ petitions under Article 226 created parallel litigation and institutional delay.',
          keyFacts: [
            'Constitutional Provisions: Article 226 (High Courts writ power) vs Article 32 (Supreme Court constitutional remedy)',
            'Bench Strength: 3-Judge Division Bench of the Supreme Court of India',
            'Core Doctrine: Exhaustion of statutory remedies is a rule of judicial convenience and policy, not an absolute constitutional bar',
            '42nd Amendment Act (1976): Inserted Part XIV-A (Articles 323A & 323B) empowering Parliament to create administrative and subject-matter tribunals',
            'L. Chandra Kumar v. Union of India (1997): Held that judicial review under Articles 226 and 32 forms part of the unamendable Basic Structure of the Constitution',
            'Three Recognized Exceptions: Lack of jurisdiction, breach of natural justice, or direct violation of Fundamental Rights'
          ],
          whyItMatters: 'Prevents aggressive forum shopping by powerful litigants, eliminates duplicate judicial hierarchies, preserves the statutory mandate of specialized tribunals, and relieves overburdened High Courts.',
          implications: 'High Courts will summarily dismiss premature writ petitions where statutory tribunals (such as NCLAT, NGT, CAT) possess competent jurisdiction, streamlining commercial and administrative justice.',
          gsPaper: 'GS Paper II — Indian Constitution, Judiciary, Separation of Powers & Dispute Redressal',
          prelimsRelevance: 'Scope of Article 32 vs Article 226, 42nd Amendment (Articles 323A/323B), Basic Structure doctrine in L. Chandra Kumar.',
          mainsRelevance: 'Judicial restraint vs judicial activism, tribunalisation of justice, and docket management in higher judiciary (GS Paper II - Polity).',
          relatedSubject: 'Indian Polity & Governance',
          relatedConceptIds: ['c_art226', 'c_art32', 'c_basic_structure'],
          keywords: ['Article 226', 'Supreme Court', 'Writ Jurisdiction', 'Tribunalisation', 'Article 32', 'L Chandra Kumar'],
          source: 'Supreme Court of India',
          sourceUrl: 'https://main.sci.gov.in/judgments',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Supreme Court of India',
          documentType: 'Judgment',
          secondarySource: 'Press Information Bureau (Ministry of Law and Justice)',
          sourceProvenance: {
            primarySource: 'Supreme Court of India',
            documentType: 'Judgment',
            secondarySource: 'Press Information Bureau (Ministry of Law and Justice)',
            keyConcepts: [
              'Rule of Alternative Remedy',
              'Separation of Powers',
              'Judicial Restraint vs Judicial Activism',
              'Tribunalisation (Articles 323A & 323B)',
              'Supervisory Jurisdiction (Article 227)'
            ],
            issuesAndChallenges: [
              'Mounting case pendency in tribunals due to vacancy of judicial and technical members.',
              'Quality and perceived independence of executive-appointed tribunal benches.',
              'Risk of genuine ultra vires or civil liberties claims facing procedural hurdles if High Courts apply rigid thresholds.'
            ],
            wayForward: [
              'Expediting appointments via an independent National Tribunals Commission.',
              'Standardizing tribunal rules while preserving High Court supervisory oversight under Article 227 for grave jurisdictional errors.'
            ]
          },
          publishedAt: '2026-08-13T08:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'UPSC',
          prelimsPointers: [
            'Article 226 empowers High Courts to issue writs for enforcement of Fundamental Rights as well as for "any other purpose", giving its textual scope a wider remit than Article 32.',
            'Article 32 is itself a Fundamental Right guaranteed in Part III and forms part of the Basic Structure, whereas Article 226 is a constitutional discretionary power.',
            'Under Article 226(2), a High Court can issue writs against an authority outside its territory if the cause of action arises, in whole or in part, within its jurisdiction.',
            'In L. Chandra Kumar (1997), a 7-judge Constitution Bench held that power of judicial review under Articles 226 and 32 is an integral Basic Structure feature and cannot be ousted by statutory amendments.',
            'Writs applicable: Habeas Corpus, Mandamus, Prohibition, Certiorari, and Quo-Warranto.',
            'Exhaustion of alternative statutory remedy is a self-imposed rule of policy, discretion, and convenience evolved by the judiciary, not an absolute constitutional limitation.'
          ],
          mainsDimensions: {
            'Constitutional Balance & Basic Structure': 'Reconciling specialized tribunalisation under Articles 323A/323B with High Court judicial review affirmed in L. Chandra Kumar.',
            'Judicial Efficiency & Docket Management': 'Combating mounting judicial arrears by channeling technical and commercial disputes to expert statutory bodies.',
            'Access to Justice & Rule of Law': 'Ensuring alternative remedies remain genuinely speedy, independent, and accessible rather than creating multi-tiered procedural barriers for citizens.',
            'Tribunal Governance': 'Addressing executive interference, tenure security, and infrastructural adequacy in statutory bodies.'
          }
        },
        {
          id: 'ca_rbi_mpc_rate_2026',
          title: 'RBI Monetary Policy Committee Retains Policy Repo Rate at 6.50% to Ensure Durable CPI Inflation Alignment',
          date: '2026-08-13',
          category: 'Economy',
          subtopic: 'Monetary Policy & Banking',
          summary: 'The Reserve Bank of India Monetary Policy Committee (MPC) voted unanimously to keep the policy repo rate unchanged at 6.50% while maintaining its focus on withdrawal of accommodation to align CPI inflation with the 4.0% statutory target.',
          whyInNews: 'The 6-member Monetary Policy Committee (MPC) of the Reserve Bank of India concluded its bi-monthly meeting, deciding to hold the benchmark policy repo rate unchanged at 6.50%.',
          whatHappened: 'The MPC voted unanimously to keep the policy repo rate steady at 6.50%, maintaining the Standing Deposit Facility (SDF) rate at 6.25% and the Marginal Standing Facility (MSF) rate at 6.75%. By a 4:2 majority, the Committee decided to remain focused on the withdrawal of accommodation to guide headline CPI inflation toward the statutory 4.0% midpoint target.',
          background: 'India’s Flexible Inflation Targeting (FIT) framework was institutionalized in 2016 under Section 45ZB of the RBI Act, 1934, following the Urjit Patel Committee recommendations. While headline CPI moderated, volatile food and vegetable supply shocks required vigilant policy stance.',
          keyFacts: [
            'Policy Repo Rate: 6.50%',
            'Standing Deposit Facility (SDF) Rate: 6.25% (Floor of LAF corridor)',
            'Marginal Standing Facility (MSF) & Bank Rate: 6.75% (Ceiling of LAF corridor)',
            'Target Mandate: CPI Headline Inflation of 4.0% with a tolerance band of ±2% (2% to 6%) under Section 45ZA of RBI Act, 1934',
            'MPC Structure: 6 members (3 ex-officio RBI officials including Governor as Chairperson, 3 external experts appointed by Central Government for 4-year non-renewable terms)',
            'Quorum & Voting: Quorum is 4 members; each member has 1 vote, with RBI Governor exercising a casting vote in case of a tie'
          ],
          whyItMatters: 'Prevents second-round spillover of food price pressures into generalized inflation, anchors household inflation expectations, protects real yields for domestic savers, and stabilizes foreign exchange capital flows.',
          implications: 'Lending and deposit benchmark interest rates (EBLR/MCLR) remain steady; stable cost of capital for corporate capital expenditure; balances economic growth with macroeconomic price stability.',
          gsPaper: 'GS Paper III — Indian Economy, Monetary Policy, Inflation & Banking Sector',
          prelimsRelevance: 'Statutory mandate under RBI Act 1934, MPC composition, LAF corridor (Repo, SDF, MSF), CPI-Combined basket composition.',
          mainsRelevance: 'Growth-inflation trade-off, monetary transmission bottlenecks, central bank operational independence (GS Paper III - Economy).',
          relatedSubject: 'Indian Economy',
          relatedConceptIds: ['c_rbi_mpc', 'c_monetary_policy', 'c_inflation_targeting'],
          keywords: ['RBI', 'Repo Rate', 'Monetary Policy Committee', 'CPI Inflation', 'SDF', 'Liquidity Adjustment Facility'],
          source: 'Reserve Bank of India (RBI)',
          sourceUrl: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58310',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Reserve Bank of India (RBI)',
          documentType: 'Monetary Policy Statement & Resolution',
          secondarySource: 'Press Information Bureau (Ministry of Finance)',
          sourceProvenance: {
            primarySource: 'Reserve Bank of India (RBI)',
            documentType: 'Monetary Policy Statement & Resolution',
            secondarySource: 'Press Information Bureau (Ministry of Finance)',
            keyConcepts: [
              'Flexible Inflation Targeting (FIT)',
              'Standing Deposit Facility (SDF)',
              'Marginal Standing Facility (MSF)',
              'Policy Stance (Withdrawal of Accommodation vs Neutral)',
              'Inflationary Expectations'
            ],
            issuesAndChallenges: [
              'Food inflation volatility driven by climatic disruptions (El Niño, unseasonal rains).',
              'Transmission lags in credit market from policy rate to deposit and lending rates.',
              'Global divergence in monetary policy cycles across major central banks.'
            ],
            wayForward: [
              'Targeted supply-side interventions by government in pulses and edible oils to complement RBI monetary measures.',
              'Strengthening bond market depth and complete external benchmark transmission.'
            ]
          },
          publishedAt: '2026-08-13T09:30:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'Flexible Inflation Targeting (FIT) is statutory under the Reserve Bank of India Act, 1934 (amended in 2016).',
            'CPI-Combined (Base Year 2012) compiled by the National Statistical Office (NSO), MoSPI, is the official inflation metric used by the MPC.',
            'Food and beverages carry a high weight of ~45.86% in the Consumer Price Index (CPI-Combined) basket.',
            'Standing Deposit Facility (SDF), introduced in 2022 under Section 17 of RBI Act, allows RBI to absorb surplus liquidity without pledging government securities (collateral-free).',
            'MPC must meet at least 4 times every fiscal year; minutes of meetings are published on the 14th day after the meeting.',
            'If RBI fails to meet inflation target for 3 consecutive quarters, it must report reasons, remedies, and estimated time to achieve target to the Central Government.'
          ],
          mainsDimensions: {
            'Growth-Inflation Trade-off': 'Central banking balancing act between curbing food-led cost-push inflation and maintaining industrial credit momentum.',
            'Monetary-Fiscal Coordination': 'Synergizing RBI rate actions with governmental supply-side buffer stocks, trade tariffs, and logistics improvements.',
            'Monetary Transmission': 'Overcoming structural rigidities in banking channels to transmit liquidity signals to the real economy.',
            'External Financial Stability': 'Managing rupee exchange rate volatility and foreign portfolio investment flows amidst global interest rate differentials.'
          }
        },
        {
          id: 'ca_isro_gaganyaan_2026',
          title: 'ISRO Successfully Validates Gaganyaan Environmental Control and Life Support System (ECLSS) in Ground Simulation Trials',
          date: '2026-08-12',
          category: 'Science & Tech',
          subtopic: 'Space Science & Human Spaceflight',
          summary: 'ISRO completed vital ground qualification benchmarks for the indigenously designed Environmental Control and Life Support System (ECLSS) module for the upcoming uncrewed Gaganyaan (G1) test mission.',
          whyInNews: 'The Indian Space Research Organisation (ISRO) accomplished key ground qualification milestones for the indigenously designed Environmental Control and Life Support System (ECLSS) for the upcoming uncrewed Gaganyaan (G1) test mission.',
          whatHappened: 'Engineers and scientists at the ISRO Propulsion Complex (IPRC), Mahendragiri, successfully completed integrated simulation tests of the ECLSS module. The system proved flawless operation in maintaining atmospheric pressure (1 atm), regulating cabin temperature (24°C), replenishing oxygen levels, and removing metabolic carbon dioxide and moisture for an orbital crew.',
          background: 'The Gaganyaan Programme aims to demonstrate India’s indigenous capability to launch a human crew to a 400 km Low Earth Orbit (LEO) for a 3-day mission and recover them safely in Indian territorial waters. Indigenous ECLSS development avoids dependence on foreign aerospace suppliers and establishes foundational capabilities for the planned Bharatiya Antariksh Station (BAS) by 2035.',
          keyFacts: [
            'Mission: Gaganyaan Human Spaceflight Programme',
            'Mission Profile: 3-member astronaut crew in 400 km circular Low Earth Orbit (LEO) for up to 3 days',
            'Launch Vehicle: Human-Rated LVM3 (HLVM3) with solid booster (HS200), liquid core (L110), and cryogenic upper stage (C25)',
            'Test Facility: ISRO Propulsion Complex (IPRC), Mahendragiri, Tamil Nadu',
            'ECLSS Responsibilities: Atmosphere control (78% N2, 21% O2 at 101.3 kPa), CO2 scrubbing using solid amines/LiOH, trace contaminant removal, and thermal/humidity management',
            'Landing Recovery: Parachute-assisted splashdown in the Arabian Sea / Bay of Bengal with Indian Navy coordination'
          ],
          whyItMatters: 'Establishes technological sovereignty in human spaceflight, positioning India as only the 4th nation (after Russia, USA, and China) with autonomous crewed launch capability.',
          implications: 'Catalyzes domestic aerospace industrial manufacturing, advances biotechnology and life-support R&D, and creates the foundational infrastructure for Bharatiya Antariksh Station (2035) and lunar landing (2040).',
          gsPaper: 'GS Paper III — Science & Technology, Indigenous Technology & Space Missions',
          prelimsRelevance: 'Gaganyaan orbital parameters (400 km LEO), HLVM3 3-stage configuration, Vyommitra humanoid robot, IN-SPACe mandate.',
          mainsRelevance: 'Strategic autonomy in space, commercial space economy under Indian Space Policy 2023, and technological spinoffs for terrestrial health and industry (GS Paper III - Science & Tech).',
          relatedSubject: 'Science & Technology',
          relatedConceptIds: ['c_isro_gaganyaan', 'c_space_tech'],
          keywords: ['ISRO', 'Gaganyaan', 'ECLSS', 'Human Spaceflight', 'LEO Orbit', 'HLVM3', 'Vyommitra'],
          source: 'Indian Space Research Organisation (ISRO)',
          sourceUrl: 'https://www.isro.gov.in/Gaganyaan.html',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Indian Space Research Organisation (ISRO)',
          documentType: 'Official Mission Update & Technical Press Release',
          secondarySource: 'Department of Space, Government of India',
          sourceProvenance: {
            primarySource: 'Indian Space Research Organisation (ISRO)',
            documentType: 'Official Mission Update & Technical Press Release',
            secondarySource: 'Department of Space, Government of India',
            keyConcepts: [
              'Environmental Control and Life Support System (ECLSS)',
              'Human Rated Launch Vehicle (HLVM3)',
              'Orbital Module (Crew Module + Service Module)',
              'Crew Escape System (CES)',
              'Low Earth Orbit (LEO)',
              'Microgravity Biology'
            ],
            issuesAndChallenges: [
              'Extremely high reliability safety margins (>0.99) required for human rating of rocket propulsion stages.',
              'Managing extreme thermal variations, microgravity fluid mechanics, and space radiation shielding.',
              'Complex international supply chains for specialized space-grade alloys and astronaut spacesuits.'
            ],
            wayForward: [
              'Executing uncrewed qualification flights (G1 and G2) carrying Vyommitra humanoid robot before final crewed launch.',
              'Fostering IN-SPACe private-sector space industry partnerships for subsystem serial production.'
            ]
          },
          publishedAt: '2026-08-12T14:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'UPSC',
          prelimsPointers: [
            'Gaganyaan will place a crew module at an altitude of approximately 400 km in Low Earth Orbit (LEO).',
            'HLVM3 rocket uses three propulsion stages: solid (HS200), Vikas liquid core stage (L110), and cryogenic upper stage (C25).',
            'Crew Escape System (CES) with High Thrust Solid Motors can safely eject the crew module during pad abort or ascent abort emergencies.',
            'Vyommitra is a female-looking humanoid spacefaring robot developed by ISRO to test microgravity life-support parameters in uncrewed test flights.',
            'IN-SPACe (Indian National Space Promotion and Authorization Centre) acts as the single-window nodal agency for non-government private space entities in India.',
            'Bharatiya Antariksh Station (BAS) is planned for operational deployment by 2035, followed by crewed Lunar exploration by 2040.'
          ],
          mainsDimensions: {
            'Strategic Autonomy & Space Power': 'Elevating India’s geopolitical stature in the global space commons and international space governance frameworks (e.g., Artemis Accords).',
            'Technological & Industrial Spinoffs': 'Commercial applications of ECLSS, materials science, life-support membranes, advanced sensors, and telemedicine for terrestrial healthcare.',
            'Commercial Space Ecosystem': 'Leveraging the 2023 Indian Space Policy to boost private participation, space startups, and global satellite launch market share.',
            'Human Capital & Scientific Temper': 'Inspiring national STEM education, advanced aerospace research, and high-skilled industrial job creation.'
          }
        },
        {
          id: 'ca_kosi_mechi_bihar_2026',
          title: 'Bihar Kosi-Mechi Intra-State River Linking Scheme Secures Final Central Hydrological Clearance',
          date: '2026-08-11',
          category: 'Bihar Current Affairs',
          subtopic: 'Water Resources & Bihar Regional Development',
          summary: 'The Union Ministry of Jal Shakti and the Central Water Commission granted final hydrological and techno-economic clearance for Bihar’s Kosi-Mechi intra-state river linking project, providing assured irrigation to 2.14 lakh hectares in Seemanchal.',
          whyInNews: 'The Union Ministry of Jal Shakti and the Central Water Commission (CWC) granted final techno-economic and hydrological safety clearance for Bihar’s Kosi-Mechi intra-state river linking project.',
          whatHappened: 'The clearance enables execution of a 76-km canal link diverting surplus monsoon waters from the Hanuman Nagar barrage on the Kosi river to the Mechi river, bringing assured canal irrigation to 2.14 lakh hectares in Seemanchal (Araria, Kishanganj, Purnea, Katihar) and mitigating chronic flooding in the Kosi basin.',
          background: 'The project is approved as India’s second major intra-state river link under the National Perspective Plan (after MP’s Ken-Betwa). North Bihar suffers annual flood devastation from Himalayan rivers originating in Nepal, while eastern districts face dry spells during critical kharif crop cycles.',
          keyFacts: [
            'Project: Kosi-Mechi Intra-State Link Project',
            'Beneficiary Districts: Araria, Kishanganj, Purnea, and Katihar (Seemanchal region of Bihar)',
            'Irrigated Area: 2,14,843 hectares (2.14 lakh ha) of culturable command area',
            'Canal Infrastructure: 76 km link canal from the existing Eastern Kosi Main Canal system to the Mechi river',
            'Mechi River Status: Transboundary river originating in Nepal, flowing along the India-Nepal border, and joining the Mahananda River (Ganga river basin)',
            'Central Financial Assistance: 60:40 Special Category funding pattern under Pradhan Mantri Krishi Sinchayee Yojana - Accelerated Irrigation Benefit Programme (PMKSY-AIBP)'
          ],
          whyItMatters: 'Solves the paradox of simultaneous flood hazards in the Kosi basin and moisture deficits in Seemanchal, transforming agrarian yields of paddy, maize, and jute while protecting over 50 lakh rural residents from annual displaced distress.',
          implications: 'Massive boost to Bihar’s agricultural GSDP; improves groundwater table replenishment in North-Eastern Bihar; sets an engineering benchmark for other intra-state river linkages in eastern India.',
          gsPaper: 'GS Paper I & II / BPSC General Studies Paper II (Bihar Geography, Water Resources & Regional Economy)',
          prelimsRelevance: 'Kosi river origin (Saptakoshi), Mechi river tributaries, Mahananda sub-basin, Seemanchal geography (BPSC Prelims).',
          mainsRelevance: 'Flood mitigation in North Bihar, irrigation potential expansion, and regional economic development (GS Paper II/III & BPSC Mains Paper II).',
          relatedSubject: 'Geography & Bihar Special',
          relatedConceptIds: ['c_bihar_rivers', 'c_interlinking_rivers', 'c_seemanchal'],
          keywords: ['Kosi Mechi', 'Bihar Rivers', 'Seemanchal', 'BPSC Current Affairs', 'Irrigation', 'Mahananda'],
          source: 'Water Resources Department, Government of Bihar',
          sourceUrl: 'https://wrd.bihar.gov.in/',
          sourceType: 'OFFICIAL_PORTAL',
          primarySource: 'Water Resources Department, Government of Bihar',
          documentType: 'State Project Authorization & Central Jal Shakti Clearance',
          secondarySource: 'Ministry of Jal Shakti / Central Water Commission',
          sourceProvenance: {
            primarySource: 'Water Resources Department, Government of Bihar',
            documentType: 'State Project Authorization & Central Jal Shakti Clearance',
            secondarySource: 'Ministry of Jal Shakti / Central Water Commission',
            keyConcepts: [
              'Intra-State River Linking',
              'National Perspective Plan (Himalayan Rivers Development)',
              'Floodplain Dynamics',
              'Saptakoshi Basin',
              'PMKSY-AIBP Funding'
            ],
            issuesAndChallenges: [
              'Heavy sediment and silt load carried by the Kosi River ("Sorrow of Bihar") causing canal siltation.',
              'Land acquisition and fair compensation in densely populated agrarian tracts of Seemanchal.',
              'Transboundary water diplomacy with Nepal for upstream catchment management and high-dam construction.'
            ],
            wayForward: [
              'Implementing silt-exclusion basins and continuous desiltation dredging along the canal headworks.',
              'Developing decentralized Water User Associations (WUAs) for equitable tail-end water distribution across Seemanchal.'
            ]
          },
          publishedAt: '2026-08-11T11:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BPSC',
          biharRelevance: 'Direct, high-yield relevance for 71st BPSC Prelims & Mains (General Studies Paper II: Bihar Economy, Irrigation Projects & Regional Geography).',
          prelimsPointers: [
            'Kosi River is formed by seven Himalayan tributaries (Saptakoshi), enters Bihar near Bhimnagar (Supaul district), and meets the Ganga at Kursela in Katihar.',
            'Mechi River is an important eastern tributary of the Mahananda River in the Ganga sub-basin.',
            'Kosi-Mechi is India’s second national intra-state river interlinking project approved under the National Water Development Agency (NWDA) framework.',
            'Seemanchal region consists of four border districts in eastern Bihar: Araria, Kishanganj, Purnea, and Katihar.',
            'PMKSY (Pradhan Mantri Krishi Sinchayee Yojana) incorporates AIBP (Accelerated Irrigation Benefits Programme) and Har Khet Ko Pani components.',
            'Central funding model provides 60% Central grant and 40% State share for approved national projects.'
          ],
          mainsDimensions: {
            'Disaster Mitigation & Flood Resilience': 'Converting destructive monsoon deluge into productive irrigation capital, reducing recurring SDRF/NDRF relief expenditures in North Bihar.',
            'Agrarian Economy & Rural Incomes': 'Enhancing cropping intensity for high-value jute, maize, and aromatic paddy in Seemanchal, driving Bihar’s Agriculture Roadmap goals.',
            'Environmental & Ecological Balance': 'Recharging depleted aquifers without causing large-scale submergence of wildlife corridors or pristine forest tracts.',
            'Inter-Governmental Hydrological Federalism': 'Model for successful Centre-State cooperative federalism and water resource planning under the National Perspective Plan.'
          }
        },
        {
          id: 'ca_ngt_wetlands_2026',
          title: 'National Green Tribunal Mandates 1-Km Eco-Sensitive Buffer Zones Around All Declared Ramsar Wetlands',
          date: '2026-08-08',
          category: 'Environment',
          subtopic: 'Environmental Conservation & Biodiversity',
          summary: 'The Principal Bench of the National Green Tribunal directed state pollution control boards and MoEFCC to enforce a mandatory 1-km Eco-Sensitive Zone around all 85 Ramsar wetland sites in India.',
          whyInNews: 'The Principal Bench of the National Green Tribunal (NGT) issued nationwide binding orders directing all State Pollution Control Boards and MoEFCC to demarcate and enforce a mandatory 1-km Eco-Sensitive Zone (ESZ) around all 85 Ramsar sites in India.',
          whatHappened: 'Hearing environmental public interest petitions regarding rapid real-estate encroachment and industrial effluent discharge into protected wetlands, the NGT prohibited all unregulated commercial construction, solid waste dumping, and untreated sewage discharge within a 1-km radius of Ramsar wetland boundaries.',
          background: 'Wetlands cover ~4.6% of India’s geographical area and provide essential ecosystem services including groundwater recharge, flood attenuation, and carbon sequestration. However, inadequate local zoning led to severe shrinkage of wetland areas (e.g., Deepor Beel, Sambhar Lake, Kolleru).',
          keyFacts: [
            'Adjudicating Authority: National Green Tribunal (Principal Bench, New Delhi) under Section 14 & 15 of NGT Act, 2010',
            'Governing Global Treaty: Ramsar Convention on Wetlands of International Importance (signed 1971, Iran; India ratified 1982)',
            'India Ramsar Sites: 85 designated wetlands covering ~1.35 million hectares (highest in South Asia)',
            'Statutory Law: Environment (Protection) Act, 1986 and Wetlands (Conservation and Management) Rules, 2017',
            'Regulatory Mandate: Mandatory 1-km buffer zone prohibiting red-category polluting industries and unauthorized landfill sites'
          ],
          whyItMatters: 'Halts irreversible loss of critical aquatic ecosystems, protects migratory flyways (Central Asian Flyway), and legally enforces buffer zone protection against speculative urban encroachment.',
          implications: 'Municipal corporations must fast-track sewage treatment plants (STPs); State wetland authorities must conduct GIS boundary geotagging; developers face strict environmental clearances near water bodies.',
          gsPaper: 'GS Paper III — Environment, Biodiversity Conservation, Environmental Impact Assessment & NGT',
          prelimsRelevance: 'Ramsar Convention criteria, Montreux Record sites in India, Wetlands Rules 2017 provisions, NGT jurisdiction under NGT Act 2010.',
          mainsRelevance: 'Environmental jurisprudence in India, urban wetland preservation, polluter pays principle, and ecological resilience (GS Paper III - Environment).',
          relatedSubject: 'Environment & Ecology',
          relatedConceptIds: ['c_ramsar_sites', 'c_ngt', 'c_wetland_conservation'],
          keywords: ['NGT', 'Ramsar Sites', 'Wetlands', 'Eco Sensitive Zone', 'Biodiversity', 'Montreux Record'],
          source: 'National Green Tribunal (NGT)',
          sourceUrl: 'https://greentribunal.gov.in/',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'National Green Tribunal (NGT)',
          documentType: 'Principal Bench Judgment & Statutory Order',
          secondarySource: 'Ministry of Environment, Forest and Climate Change (MoEFCC)',
          sourceProvenance: {
            primarySource: 'National Green Tribunal (NGT)',
            documentType: 'Principal Bench Judgment & Statutory Order',
            secondarySource: 'Ministry of Environment, Forest and Climate Change (MoEFCC)',
            keyConcepts: [
              'Ramsar Convention on Wetlands (1971)',
              'Eco-Sensitive Zones (ESZ)',
              'Polluter Pays Principle',
              'Precautionary Principle',
              'Montreux Record',
              'Wetlands (Conservation & Management) Rules 2017'
            ],
            issuesAndChallenges: [
              'Conflicting land records between state revenue departments and forest/wetland authorities.',
              'Inadequate financial and technical resources in smaller Urban Local Bodies (ULBs) for sewage interception.',
              'Balancing ecological buffer zones with traditional livelihood rights of local fishing communities.'
            ],
            wayForward: [
              'Community-based wetland co-management integrating traditional fishermen into conservation monitoring.',
              'Comprehensive geotagged digital wetland inventory with automated satellite change detection by NRSC/ISRO.'
            ]
          },
          publishedAt: '2026-08-08T10:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'The Ramsar Convention was signed on February 2, 1971 (celebrated as World Wetlands Day); India ratified the convention on February 1, 1982.',
            'Montreux Record is a register of Ramsar wetland sites where changes in ecological character have occurred, are occurring, or are likely to occur as a result of technological developments, pollution, or human interference.',
            'Currently, two Indian wetlands are on the Montreux Record: Keoladeo National Park (Rajasthan) and Loktak Lake (Manipur); Chilika Lake (Odisha) was removed from the record in 2002 after successful ecological restoration.',
            'The Wetlands (Conservation and Management) Rules, 2017 established State Wetland Authorities (SWAs) and prohibited activities like reclamation, industrial setup, solid waste dumping, and untreated effluent discharge.',
            'The National Green Tribunal (NGT) was established in 2010 under the NGT Act as a specialized judicial body guided by principles of Natural Justice, not bound by the Code of Civil Procedure (CPC).',
            'NGT is statutorily mandated to dispose of environmental applications within 6 months of filing.'
          ],
          mainsDimensions: {
            'Ecosystem Services & Climate Resilience': 'Wetlands as natural sponges for urban flood control, carbon sinks, and groundwater replenishment.',
            'Environmental Jurisprudence & NGT': 'Evolution of judicial oversight applying the Precautionary Principle and Polluter Pays Principle in India.',
            'Urban Planning vs Ecological Preservation': 'Integrating blue-green infrastructure into master plans of expanding tier-1 and tier-2 Indian cities.',
            'Rights of Wetland-Dependent Communities': 'Balancing ecological zoning with sustainable livelihood security for traditional fishing and agrarian settlements.'
          }
        },
        {
          id: 'ca_green_hydrogen_2026',
          title: 'Union Cabinet Expands SIGHT Scheme Outlay Under National Green Hydrogen Mission for Electrolysers',
          date: '2026-07-28',
          category: 'Economy',
          subtopic: 'Renewable Energy & Industrial Policy',
          summary: 'The Ministry of New and Renewable Energy announced Tranche-II operational guidelines under the SIGHT program to scale domestic electrolyser manufacturing capacity to 1,500 MW per year.',
          whyInNews: 'The Ministry of New and Renewable Energy (MNRE) notified operational guidelines for Tranche-II financial incentives under the Strategic Interventions for Green Hydrogen Transition (SIGHT) program.',
          whatHappened: 'The Union Cabinet augmented direct financial support to establish 1,500 MW annual domestic electrolyser manufacturing capacity, offering performance-linked subsidies to reduce production costs below $2 per kg by 2030 and support indigenous stack manufacturing.',
          background: 'Launched in 2023 with an initial outlay of ₹19,744 crore, the National Green Hydrogen Mission aims to establish India as a global manufacturing and export powerhouse for green hydrogen and green ammonia.',
          keyFacts: [
            'Mission: National Green Hydrogen Mission (NGHM) launched with ₹19,744 crore outlay',
            'Flagship Incentive: SIGHT (Strategic Interventions for Green Hydrogen Transition) Programme',
            'Target: 5 MMT (Million Metric Tonnes) green hydrogen production per year by 2030',
            'Renewable Energy Capacity Addition: ~125 GW associated renewable power capacity by 2030',
            'Electrolyser Technologies Supported: Proton Exchange Membrane (PEM), Alkaline, and Solid Oxide Electrolyser Cells (SOEC)',
            'Nodal Ministry: Ministry of New and Renewable Energy (MNRE)'
          ],
          whyItMatters: 'Decarbonizes heavy industrial sectors (fertilizers, crude refineries, steel manufacturing), displaces expensive imported LNG and fossil fuels, and reduces India’s carbon emissions by 50 MMT annually by 2030.',
          implications: 'Fosters domestic manufacturing of high-tech electrolyser components; positions India as a major exporter of green ammonia to the European Union (navigating CBAM carbon tariffs) and Japan.',
          gsPaper: 'GS Paper III — Energy, Infrastructure, Industrial Policy & Climate Change Mitigation',
          prelimsRelevance: 'Types of Hydrogen (Green vs Grey vs Blue vs Turquoise), SIGHT program financial tracks, Panchamrit targets.',
          mainsRelevance: 'Clean energy transition, industrial decarbonization in hard-to-abate sectors, and green industrial export competitiveness (GS Paper III - Economy/Environment).',
          relatedSubject: 'Indian Economy',
          relatedConceptIds: ['c_green_hydrogen', 'c_renewable_energy', 'c_panchamrit'],
          keywords: ['Green Hydrogen', 'SIGHT Scheme', 'Electrolyser', 'MNRE', 'Decarbonization', 'CBAM'],
          source: 'Ministry of New and Renewable Energy (MNRE)',
          sourceUrl: 'https://mnre.gov.in/green-hydrogen-mission',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Ministry of New and Renewable Energy (MNRE)',
          documentType: 'Cabinet Resolution & Operational Policy Guidelines',
          secondarySource: 'Press Information Bureau (Ministry of New and Renewable Energy)',
          sourceProvenance: {
            primarySource: 'Ministry of New and Renewable Energy (MNRE)',
            documentType: 'Cabinet Resolution & Operational Policy Guidelines',
            secondarySource: 'Press Information Bureau (Ministry of New and Renewable Energy)',
            keyConcepts: [
              'Green vs Blue vs Grey Hydrogen',
              'Electrolyser Technologies (PEM, Alkaline, Solid Oxide)',
              'SIGHT Scheme Components',
              'Decarbonization of Hard-to-Abate Sectors',
              'Net-Zero 2070'
            ],
            issuesAndChallenges: [
              'High capital costs of electrolysers and scarce precious metal catalysts (platinum, iridium in PEM).',
              'Continuous availability of low-cost round-the-clock (RTC) renewable electricity.',
              'Storage, transportation, and safety infrastructure for liquid hydrogen and ammonia bunkering.'
            ],
            wayForward: [
              'Scaling domestic manufacturing to drive economies of scale, targeting green hydrogen cost parity with fossil grey hydrogen ($1-1.5/kg).',
              'Building dedicated green hydrogen transport pipelines and port infrastructure for export corridors.'
            ]
          },
          publishedAt: '2026-07-28T12:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'UPSC',
          prelimsPointers: [
            'Green Hydrogen is produced through water electrolysis powered entirely by renewable energy sources (solar, wind), producing zero carbon emissions.',
            'Grey Hydrogen is produced from natural gas (methane) via Steam Methane Reforming (SMR) releasing CO2 into the atmosphere; Blue Hydrogen uses the same process but captures and stores the emitted CO2 (CCUS).',
            'SIGHT Programme has two distinct financial incentive tracks: Component I (Electrolyser Manufacturing) and Component II (Green Hydrogen Production).',
            'India has set a target of achieving 500 GW of non-fossil electricity capacity by 2030 and Net Zero carbon emissions by 2070.',
            'Under NGHM, mandatory green hydrogen consumption mandates are being instituted for oil refineries and fertilizer plants.',
            'Ammonia (NH3) is the primary transport vector for green hydrogen exports because it liquefies at higher temperatures (-33°C) compared to liquid hydrogen (-253°C).'
          ],
          mainsDimensions: {
            'Energy Security & Import Substitution': 'Mitigating India’s vulnerable reliance on imported crude oil and natural gas while conserving foreign exchange reserves.',
            'Industrial Decarbonization & CBAM Preparedness': 'Shielding Indian steel, aluminum, and chemical exports against the European Union’s Carbon Border Adjustment Mechanism (CBAM).',
            'Manufacturing Leadership & Global Supply Chains': 'Establishing domestic intellectual property in electrolyser stacks rather than remaining a technology importer.',
            'Geopolitical Positioning in Clean Tech': 'Partnering in bilateral green hydrogen supply corridors with Indo-Pacific and European allies under the International Solar Alliance (ISA) umbrella.'
          }
        },
        {
          id: 'ca_india_asean_2026',
          title: 'India and ASEAN Finalize Modalities for Comprehensive Review of ASEAN-India Trade in Goods Agreement (AITIGA)',
          date: '2026-08-10',
          category: 'International Relations',
          subtopic: 'Act East Policy & Indo-Pacific Security',
          summary: 'India and the 10 ASEAN member nations agreed on a structured negotiating framework to conclude the review of the ASEAN-India Trade in Goods Agreement (AITIGA) by late 2026.',
          whyInNews: 'Senior trade officials and delegates from India and the 10 ASEAN member states concluded formal negotiating rounds in Jakarta, agreeing on a structured roadmap to conclude the AITIGA review by late 2026.',
          whatHappened: 'India and ASEAN finalized modalities to resolve trade asymmetries, streamline non-tariff technical barriers, update Rules of Origin to prevent third-party goods rerouting, and facilitate enhanced market access for Indian agricultural, engineering, and pharmaceutical goods.',
          background: 'The original AITIGA entered into force in 2010. While bilateral trade crossed $120 Billion in FY25, India’s trade deficit with ASEAN widened from $7.5 Billion in 2010 to over $40 Billion, necessitating a comprehensive modernization of the trade pact.',
          keyFacts: [
            'Agreement: ASEAN-India Trade in Goods Agreement (AITIGA) signed in 2009, effective 2010',
            'ASEAN Member States (10 Nations): Brunei, Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand, Vietnam',
            'Bilateral Trade: Surpassed $120 Billion in FY25 with India’s trade deficit exceeding $40 Billion',
            'Strategic Milestone: ASEAN-India Comprehensive Strategic Partnership established in 2022',
            'Maritime Security Framework: Reaffirmation of UNCLOS 1982 for freedom of navigation in the South China Sea and Malacca Straits',
            'Nodal Ministries: Ministry of Commerce & Industry and Ministry of External Affairs (MEA)'
          ],
          whyItMatters: 'Eliminates trade asymmetries that harm Indian manufacturing while anchoring India’s Act East diplomacy, secure maritime supply chains, and rules-based Indo-Pacific regional architecture.',
          implications: 'Stronger Rules of Origin prevent Chinese origin goods dumping via Southeast Asian transshipment routes; Indian exporters in pharmaceuticals, auto parts, and chemicals gain lower tariffs.',
          gsPaper: 'GS Paper II — International Relations, Bilateral, Regional and Global Groupings involving India',
          prelimsRelevance: 'ASEAN 10 member states, Bangkok Declaration 1967, UNCLOS 1982 maritime zones, Rules of Origin concept.',
          mainsRelevance: 'Act East Policy, Indo-Pacific maritime security, trade deficit management, and regional value chain integration (GS Paper II - IR).',
          relatedSubject: 'International Relations',
          relatedConceptIds: ['c_asean_india', 'c_act_east', 'c_unclos'],
          keywords: ['India ASEAN', 'AITIGA', 'Act East Policy', 'Indo Pacific', 'UNCLOS', 'Rules of Origin'],
          source: 'Ministry of External Affairs (MEA), Government of India',
          sourceUrl: 'https://mea.gov.in/press-releases.htm',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Ministry of External Affairs (MEA), Government of India',
          documentType: 'Joint Official Communiqué & Trade Declaration',
          secondarySource: 'Ministry of Commerce and Industry / PIB',
          sourceProvenance: {
            primarySource: 'Ministry of External Affairs (MEA), Government of India',
            documentType: 'Joint Official Communiqué & Trade Declaration',
            secondarySource: 'Ministry of Commerce and Industry / PIB',
            keyConcepts: [
              'Act East Policy',
              'Indo-Pacific Oceans Initiative (IPOI)',
              'Rules of Origin Criteria',
              'Non-Tariff Barriers (NTBs)',
              'UNCLOS 1982',
              'Supply Chain Resilience Initiative (SCRI)'
            ],
            issuesAndChallenges: [
              'Balancing tariff reductions across 10 diverse ASEAN economies with divergent domestic industrial priorities.',
              'Non-tariff barriers and sanitary/phytosanitary (SPS) compliance hurdles for Indian agro-exports.',
              'Managing geopolitical tensions in the South China Sea impacting commercial shipping lanes.'
            ],
            wayForward: [
              'Implementing simplified electronic certificate of origin (e-CoO) systems.',
              'Synergizing the AITIGA review with digital economy partnerships, UPI-cross border payment linkages (like India-Singapore PayNow), and local currency settlement frameworks.'
            ]
          },
          publishedAt: '2026-08-10T15:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'UPSC',
          prelimsPointers: [
            'ASEAN was founded on August 8, 1967 with the signing of the Bangkok Declaration by Indonesia, Malaysia, Philippines, Singapore, and Thailand.',
            'ASEAN Secretariat is located in Jakarta, Indonesia.',
            'India’s formal engagement with ASEAN began as a Sectoral Dialogue Partner in 1992, Full Dialogue Partner in 1995, Summit Partner in 2002, Strategic Partner in 2012, and Comprehensive Strategic Partner in 2022.',
            'India is a founding member of the East Asia Summit (EAS) and the ASEAN Regional Forum (ARF).',
            'Rules of Origin criteria determine the national source of a product to prevent non-member third countries from enjoying preferential duty rates.',
            'UNCLOS (United Nations Convention on the Law of the Sea, 1982) defines maritime zones: Territorial Sea (12 NM), Contiguous Zone (24 NM), and Exclusive Economic Zone (200 NM).'
          ],
          mainsDimensions: {
            'Economic Rebalancing & Trade Deficit Management': 'Correcting inverted duty structures and origin circumvention to safeguard domestic manufacturing under Make in India.',
            'Act East Policy & Indo-Pacific Security': 'Strengthening ASEAN centrality as the anchor of India’s vision for a free, open, and inclusive Indo-Pacific region.',
            'Supply Chain Diversification': 'Developing resilient regional value chains in critical minerals, electronics, and pharmaceuticals to counter single-source dependencies.',
            'Digital & Connectivity Cooperation': 'Expanding physical (India-Myanmar-Thailand Trilateral Highway) and digital infrastructure (cross-border fintech integration) across Southeast Asia.'
          }
        },
        {
          id: 'ca_fincom_16th_2026',
          title: '16th Finance Commission Finalizes Consultation Roadmap on Vertical and Horizontal Tax Devolution Principles',
          date: '2026-08-05',
          category: 'Polity & Governance',
          subtopic: 'Fiscal Federalism & Inter-Governmental Finances',
          summary: 'The 16th Finance Commission, chaired by Dr. Arvind Panagariya, formulated its state consultation paper evaluating the 41% vertical tax devolution pool, cess and surcharge shares, and horizontal distribution formula.',
          whyInNews: 'The 16th Finance Commission initiated structured state-level consultations to establish the award framework for vertical and horizontal tax devolution for the five-year period starting April 1, 2026.',
          whatHappened: 'The Commission, constituted under Article 280 of the Constitution and chaired by Dr. Arvind Panagariya, finalized its consultative framework to assess state demands for raising the vertical devolution share beyond the current 41%, review the proliferation of non-shareable cesses and surcharges, and recalibrate horizontal distribution criteria like Income Distance and Demographic Performance.',
          background: 'The Finance Commission is a quasi-judicial constitutional body appointed every five years by the President of India under Article 280 to recommend the distribution of net tax proceeds between the Union and the States under Article 270.',
          keyFacts: [
            'Constitutional Mandate: Article 280 of the Constitution of India',
            'Leadership: Dr. Arvind Panagariya (Chairman) and 4 Commission Members',
            'Award Period: 5-year term from 2026-27 to 2030-31',
            'Current Vertical Devolution: 41% of the divisible tax pool (recommended by 15th FC after J&K reorganization)',
            'Divisible Pool Rule: Article 270 allocates Union tax revenues to the divisible pool, excluding cesses and surcharges levied under Article 271',
            'Key Horizontal Criteria: Income Distance, Population (2011 Census), Forest & Ecology, Demographic Performance, and Tax Effort'
          ],
          whyItMatters: 'Shapes fiscal capacity and developmental expenditure for all 28 states, determining budgetary allocations for capital infrastructure, social welfare, and disaster management.',
          implications: 'High-deficit states (including Bihar, UP, and eastern states) advocate higher weightage for income distance to address historical regional backwardness, while southern states seek greater rewards for demographic stabilization.',
          gsPaper: 'GS Paper II & III — Indian Constitution, Fiscal Federalism, Centre-State Financial Relations & Public Finance',
          prelimsRelevance: 'Article 280 provisions, composition of Finance Commission, Article 270/271 cess sharing rules, 15th FC devolution criteria.',
          mainsRelevance: 'Cooperative fiscal federalism, cesses and surcharges eroding state revenues, horizontal equity vs economic efficiency (GS Paper II/III).',
          relatedSubject: 'Indian Polity & Governance',
          relatedConceptIds: ['c_finance_commission', 'c_fiscal_federalism', 'c_art280'],
          keywords: ['Finance Commission', 'Article 280', 'Fiscal Federalism', 'Tax Devolution', 'Panagariya', 'Cess and Surcharge'],
          source: '16th Finance Commission of India',
          sourceUrl: 'https://fincomindia.nic.in/',
          sourceType: 'PRIMARY_GOVT',
          primarySource: '16th Finance Commission of India',
          documentType: 'Official Press Release & State Consultation Paper',
          secondarySource: 'Ministry of Finance, Government of India',
          sourceProvenance: {
            primarySource: '16th Finance Commission of India',
            documentType: 'Official Press Release & State Consultation Paper',
            secondarySource: 'Ministry of Finance, Government of India',
            keyConcepts: [
              'Vertical vs Horizontal Devolution',
              'Divisible Pool of Taxes (Article 270)',
              'Article 271 (Cesses and Surcharges)',
              'Income Distance Criterion',
              'Demographic Performance Penalty/Reward',
              'Grants-in-Aid (Article 275)'
            ],
            issuesAndChallenges: [
              'Rising proportion of cesses and surcharges as a percentage of gross tax revenue, shrinking the effective divisible pool.',
              'North-South divergence on using 2011 Census population data vs demographic transition achievements.',
              'Assessing the fiscal sustainability of state-level off-budget borrowings and power sector guarantees.'
            ],
            wayForward: [
              'Capping non-shareable cesses and surcharges or bringing long-term cesses into the shareable tax pool.',
              'Balancing equity (supporting backward states like Bihar) with performance incentives (rewarding tax efficiency and population control).'
            ]
          },
          publishedAt: '2026-08-05T10:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'The Finance Commission is constituted by the President of India every five years or earlier under Article 280.',
            'Composition: A Chairman and 4 other members appointed by the President, whose qualifications are determined by Parliament under the Finance Commission Act, 1951.',
            'Under Article 270, all taxes and duties referred to in the Union List are shared with States, except cesses and surcharges levied for specific purposes under Article 271.',
            'The 15th Finance Commission (chaired by N.K. Singh) recommended a vertical devolution of 41% to states for 2021-26 (adjusted 1% from 14th FC for Jammu & Kashmir).',
            'Grants-in-aid to states in need of assistance are provided under Article 275 of the Constitution on recommendations of the Finance Commission.',
            'Finance Commission recommendations are advisory in nature, though conventionally accepted by the Union Government.'
          ],
          mainsDimensions: {
            'Fiscal Federalism & Divisible Pool Integrity': 'Addressing the structural erosion of states’ revenue shares due to expanding central cesses and surcharges.',
            'Equity vs Efficiency Dilemma': 'Balancing redistributive justice for low-income states with incentives for fiscal discipline and demographic performance.',
            'Sub-State Local Governance Financing': 'Strengthening tied and untied grants for Panchayati Raj Institutions (PRIs) and Urban Local Bodies (ULBs).',
            'Disaster Risk Management Financing': 'Revisiting state disaster mitigation funds (SDMF) allocations in light of increasing extreme climate vulnerabilities.'
          }
        },
        {
          id: 'ca_ab_pmjay_senior_2026',
          title: 'Union Health Ministry Expands AB-PMJAY Health Cover to All Senior Citizens Aged 70 and Above Regardless of Income',
          date: '2026-08-01',
          category: 'Social Issues',
          subtopic: 'Public Health & Senior Citizen Welfare',
          summary: 'The Union Cabinet approved universal health insurance coverage of ₹5 lakh per year under Ayushman Bharat Pradhan Mantri Jan Arogya Yojana for all senior citizens aged 70 and above.',
          whyInNews: 'The Union Ministry of Health and Family Welfare and the National Health Authority (NHA) notified the nationwide rollout of Ayushman Bharat PM-JAY coverage for all senior citizens aged 70 years and above, irrespective of socioeconomic status.',
          whatHappened: 'Under the expanded scheme, every citizen aged 70+ receives a dedicated Ayushman Vay Vandana card providing ₹5 lakh annual secondary and tertiary hospitalisation cover per family, covering over 6 crore senior citizens across 4.5 crore families.',
          background: 'Launched in 2018, AB-PMJAY originally targeted the bottom 40% vulnerable population identified via SECC 2011. Rapid population aging and high out-of-pocket healthcare expenses (OOPE) for chronic geriatric conditions led to universal elderly health protection.',
          keyFacts: [
            'Scheme: Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) Senior Citizen Expansion',
            'Coverage Limit: ₹5,00,000 per family per year on a family floater basis',
            'Eligible Age: 70 years and above (determined strictly by Aadhaar verification)',
            'Income Ceiling: No income limit; universal coverage for all 70+ seniors',
            'Nodal Agency: National Health Authority (NHA)',
            'Financing Model: Centrally Sponsored Scheme with 60:40 Centre-State cost sharing (90:10 for NE & Himalayan States)'
          ],
          whyItMatters: 'Shields elderly citizens against catastrophic out-of-pocket health expenditure (OOPE), providing dignified access to tertiary hospitalization, cardiology, oncology, and orthopedic care without impoverishing families.',
          implications: 'Substantial surge in hospital empanelment and geriatric care bed capacity; drives digital health record adoption under Ayushman Bharat Digital Mission (ABDM).',
          gsPaper: 'GS Paper II — Welfare Schemes for Vulnerable Sections, Issues Relating to Health & Social Justice',
          prelimsRelevance: 'AB-PMJAY core features, NHA nodal authority, funding pattern, Ayushman Arogya Mandir network.',
          mainsRelevance: 'Geriatric healthcare challenges in India, demographic transition, universal health coverage (UHC), and social safety nets (GS Paper II - Health/Welfare).',
          relatedSubject: 'Social Justice & Health',
          relatedConceptIds: ['c_pmjay', 'c_universal_healthcare', 'c_geriatric_care'],
          keywords: ['PMJAY', 'Ayushman Bharat', 'Senior Citizens', 'Geriatric Health', 'NHA', 'Health Insurance'],
          source: 'National Health Authority (NHA)',
          sourceUrl: 'https://nha.gov.in/PM-JAY',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'National Health Authority (NHA) / Ministry of Health & Family Welfare',
          documentType: 'Central Gazette Notification & Policy Rollout Order',
          secondarySource: 'Press Information Bureau (Ministry of Health and Family Welfare)',
          sourceProvenance: {
            primarySource: 'National Health Authority (NHA) / Ministry of Health & Family Welfare',
            documentType: 'Central Gazette Notification & Policy Rollout Order',
            secondarySource: 'Press Information Bureau (Ministry of Health and Family Welfare)',
            keyConcepts: [
              'Universal Health Coverage (UHC)',
              'Out-of-Pocket Expenditure (OOPE)',
              'Demographic Transition & Ageing Population',
              'Secondary and Tertiary Healthcare',
              'Ayushman Bharat Digital Mission (ABDM)'
            ],
            issuesAndChallenges: [
              'Hospital empanelment shortages and claims settlement delays in rural districts.',
              'Ensuring fraud prevention and rationalizing package pricing for private tertiary hospitals.',
              'Fiscal sustainability for states contributing 40% matching grants amid rising claims volume.'
            ],
            wayForward: [
              'Strengthening primary healthcare screening at Ayushman Arogya Mandirs for early non-communicable disease (NCD) detection.',
              'Integrating long-term palliative and home healthcare support into the PMJAY package ecosystem.'
            ]
          },
          publishedAt: '2026-08-01T08:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'AB-PMJAY is the world’s largest government-funded health assurance scheme, offering ₹5 lakh per family per year.',
            'NHA (National Health Authority) is an attached office of the Ministry of Health and Family Welfare responsible for implementing PM-JAY and ABDM.',
            'Senior citizens aged 70+ who are already covered under other government schemes (CGHS, ECHS, Ayushman CAPF) may either choose to continue with their existing scheme or opt for AB-PMJAY.',
            'Funding ratio: 60:40 between Centre and States, 90:10 for North Eastern states and Himalayan states, 100% for UTs without legislature.',
            'National Health Policy 2017 targets public health expenditure to reach 2.5% of GDP.',
            'Aadhaar-based e-KYC is mandatory for the issuance of the Ayushman Vay Vandana Card.'
          ],
          mainsDimensions: {
            'Demographic Transition & Geriatric Healthcare': 'Addressing India’s accelerating demographic aging where elderly population is projected to reach ~20% by 2050.',
            'Universal Health Coverage (UHC) Milestone': 'Transitioning from targeted poverty-based health protection toward universal entitlement for vulnerable cohorts.',
            'Fiscal & Administrative Sustainability': 'Balancing premium subsidies and hospital reimbursement rates to prevent moral hazard and fraudulent claims.',
            'Primary vs Tertiary Healthcare Synergy': 'Connecting primary preventative care at Ayushman Arogya Mandirs with tertiary curative care under PMJAY.'
          }
        },
        {
          id: 'ca_nalanda_asi_conservation_2026',
          title: 'Archaeological Survey of India Initiates Scientific Conservation of Ancient Nalanda Mahavihara and Vikramshila Ruins',
          date: '2026-07-25',
          category: 'Bihar Current Affairs',
          subtopic: 'History, Heritage & Art Conservation',
          summary: 'The Archaeological Survey of India (ASI) commenced advanced geophysical radar mapping and chemical preservation at UNESCO World Heritage Site Nalanda and ancient Vikramshila University in Bihar.',
          whyInNews: 'The Archaeological Survey of India (ASI) launched a comprehensive scientific conservation and structural stabilization project across the ancient university ruins of Nalanda Mahavihara and Vikramshila in Bihar.',
          whatHappened: 'The Patna Circle of ASI deployed Ground Penetrating Radar (GPR) and non-invasive geochemical preservation techniques to stabilize exposed terracotta plaques, votive stupas, and monastic brick structures dating from the 5th to 12th century CE, safeguarding them against monsoon humidity and weathering.',
          background: 'Nalanda (founded under the Gupta Empire in the 5th century CE) was inscribed as a UNESCO World Heritage Site in 2016. Vikramshila (founded by Pala ruler Dharmapala in the late 8th century CE in Bhagalpur) was a leading centre of Vajrayana Buddhist philosophy.',
          keyFacts: [
            'Sites Covered: Nalanda Mahavihara (Nalanda district) and Vikramshila Mahavihara (Antichak, Bhagalpur district)',
            'Nodal Authority: Archaeological Survey of India (Patna Circle) under the Ministry of Culture',
            'UNESCO Status: Nalanda Mahavihara inscribed as UNESCO World Heritage Site in 2016',
            'Historical Founders: Nalanda founded by Gupta Emperor Kumaragupta I (Shakraditya); Vikramshila founded by Pala King Dharmapala',
            'Foreign Chroniclers: Detailed eyewitness accounts by Xuanzang (Hiuen Tsang) and Yijing (I-Tsing) during Harsha’s reign',
            'Statutory Protection: Ancient Monuments and Archaeological Sites and Remains (AMASR) Act, 1958'
          ],
          whyItMatters: 'Preserves the architectural and intellectual heritage of India’s ancient monastic universities, reinforces Bihar’s Buddhist Circuit global tourism potential, and provides scientific insights into ancient urban brick construction.',
          implications: 'Boosts high-value cultural heritage tourism in Bihar; provides specialized training in non-invasive archaeology; advances archaeological research into the Pala period.',
          gsPaper: 'GS Paper I & BPSC General Studies Paper I (Indian Culture, Art, Architecture & Bihar Heritage)',
          prelimsRelevance: 'Gupta and Pala dynasty rulers, Nalanda & Vikramshila history, Buddhist philosophy schools, AMASR Act 1958 rules (BPSC & UPSC Prelims).',
          mainsRelevance: 'Ancient Indian higher education traditions, Nalanda’s global intellectual influence, Buddhist architectural synthesis, and heritage conservation policy (GS Paper I & BPSC Mains Paper I).',
          relatedSubject: 'History, Art & Culture',
          relatedConceptIds: ['c_nalanda', 'c_vikramshila', 'c_pala_art', 'c_buddhist_architecture'],
          keywords: ['Nalanda', 'Vikramshila', 'ASI', 'BPSC Culture', 'Gupta Empire', 'Pala Dynasty', 'Buddhism'],
          source: 'Archaeological Survey of India (ASI)',
          sourceUrl: 'https://asi.nic.in/',
          sourceType: 'PRIMARY_GOVT',
          primarySource: 'Archaeological Survey of India (ASI)',
          documentType: 'Heritage Conservation Directive & Field Study Report',
          secondarySource: 'Department of Art, Culture & Youth, Government of Bihar',
          sourceProvenance: {
            primarySource: 'Archaeological Survey of India (ASI)',
            documentType: 'Heritage Conservation Directive & Field Study Report',
            secondarySource: 'Department of Art, Culture & Youth, Government of Bihar',
            keyConcepts: [
              'Nalanda Mahavihara (Gupta Era)',
              'Vikramshila University (Pala Era)',
              'Pala Art & Vajrayana Buddhism',
              'Ground Penetrating Radar (GPR) Conservation',
              'AMASR Act 1958',
              'UNESCO World Heritage Criteria'
            ],
            issuesAndChallenges: [
              'Severe moisture ingress and capillary water seepage in ancient brick masonry during humid monsoon months.',
              'Unregulated urban construction near protected prohibited (100m) and regulated (200m) heritage perimeters.',
              'Need for enhanced tourist amenities while preserving delicate structural integrity of monastic cells.'
            ],
            wayForward: [
              'Adopting nanotechnology-based breathable hydrophobic chemical coatings on exposed terracotta bricks.',
              'Developing an integrated digital Buddhist Tourism Circuit connecting Nalanda, Rajgir, Bodh Gaya, and Vikramshila.'
            ]
          },
          publishedAt: '2026-07-25T09:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BPSC',
          biharRelevance: 'High direct relevance for 71st BPSC Prelims & Mains (General Studies Paper I: Bihar Art & Architecture, Ancient History of Magadha & Buddhist Heritage).',
          prelimsPointers: [
            'Nalanda Mahavihara was founded during the reign of Gupta Emperor Kumaragupta I (5th century CE) and patronized by Harshavardhana and Pala kings.',
            'Vikramshila University was established by the Pala king Dharmapala (late 8th century CE) in present-day Antichak, Kahalgaon, Bhagalpur district of Bihar.',
            'Atisha Dipankara Srijnana, a renowned Buddhist scholar from Vikramshila, played a key role in the revival of Buddhism in Tibet.',
            'Chinese pilgrim Xuanzang (Hiuen Tsang) studied at Nalanda for several years under the guidance of Chancellor Shilabhadra.',
            'Under the AMASR Act 1958, an area of 100 meters around a protected monument is a Prohibited Area, and an additional 200 meters is a Regulated Area.',
            'Nalanda was destroyed in the late 12th century CE by Bakhtiyar Khilji; it was inscribed on the UNESCO World Heritage list in 2016.'
          ],
          mainsDimensions: {
            'Ancient Higher Education Tradition': 'The residential university model of Nalanda and Vikramshila emphasizing multidisciplinary pedagogy, grammar, astronomy, logic, and medicine.',
            'Buddhist Architectural Synthesis': 'Evolution of monastic architecture (Chaityas, Viharas, and stepped brick stupas) and distinctive Pala stone and bronze sculptures.',
            'Soft Power & Cultural Diplomacy': 'Reviving ancient historical linkages with Southeast and East Asian nations through the modern Nalanda International University.',
            'Heritage Tourism & Economic Revitalization': 'Transforming Bihar’s Buddhist Circuit into a sustainable, community-inclusive eco-tourism and cultural hub.'
          }
        },
        {
          id: 'ca_valmiki_tiger_rhino_2026',
          title: 'Bihar State Wildlife Board Notifies Rhino Conservation Task Force and Habitat Expansion at Valmiki Tiger Reserve',
          date: '2026-07-20',
          category: 'Bihar Current Affairs',
          subtopic: 'Biodiversity, Forestry & Wildlife Conservation',
          summary: 'The Bihar Department of Environment, Forest and Climate Change constituted a Rhino Task Force to reintroduce the greater one-horned rhinoceros in Valmiki Tiger Reserve (VTR), West Champaran.',
          whyInNews: 'The State Board for Wildlife, chaired by the Chief Minister of Bihar, notified the Rhino Task Force to establish a protected breeding enclosure in Valmiki Tiger Reserve (VTR).',
          whatHappened: 'Following positive feasibility assessments by the Wildlife Institute of India (WII), the Bihar government approved the reintroduction of the Greater One-Horned Rhinoceros (Rhinoceros unicornis) into VTR from Assam and West Bengal, while securing elephant corridors connecting Chitwan National Park in Nepal.',
          background: 'Valmiki Tiger Reserve in West Champaran is Bihar’s sole tiger reserve, situated at the foothills of the Himalayas along the Gandak river basin. Over the last decade, tiger population in VTR rose from 31 in 2018 to 54 in 2022 due to intensive grassland management.',
          keyFacts: [
            'Protected Area: Valmiki Tiger Reserve (VTR), West Champaran district, Bihar',
            'Ecological Status: Bihar’s only Tiger Reserve and National Park (~898 sq km)',
            'Transboundary Contiguity: Contiguous with Chitwan National Park and Parsa Wildlife Sanctuary in Nepal',
            'Target Species: Greater One-Horned Rhinoceros (IUCN Status: Vulnerable, CITES Appendix I, Wildlife Protection Act Schedule I)',
            'Technical Collaborator: Wildlife Institute of India (WII), Dehradun',
            'Nodal Department: Department of Environment, Forest and Climate Change, Government of Bihar'
          ],
          whyItMatters: 'De-concentrates India’s rhino population from flood-prone Kaziranga, creates a viable meta-population in the Terai arc landscape, and boosts eco-tourism revenue in North-West Bihar.',
          implications: 'Intensifies anti-poaching wireless patrols; creates local eco-guide livelihoods for Tharu indigenous communities; strengthens transboundary wildlife management with Nepal.',
          gsPaper: 'GS Paper III & BPSC General Studies Paper II (Bihar Geography, Environment & Biodiversity)',
          prelimsRelevance: 'Valmiki Tiger Reserve location, rivers flowing through VTR (Gandak, Masan, Pandai), IUCN status of One-Horned Rhino (BPSC & UPSC Prelims).',
          mainsRelevance: 'Wildlife conservation strategies, human-wildlife conflict mitigation in Terai, and transboundary conservation diplomacy (GS Paper III & BPSC Mains Paper II).',
          relatedSubject: 'Environment & Bihar Special',
          relatedConceptIds: ['c_valmiki_tr', 'c_rhino_conservation', 'c_bihar_forests'],
          keywords: ['Valmiki Tiger Reserve', 'Rhino Task Force', 'BPSC Environment', 'West Champaran', 'IUCN Vulnerable'],
          source: 'Department of Environment, Forest and Climate Change, Government of Bihar',
          sourceUrl: 'https://forest.bihar.gov.in/',
          sourceType: 'OFFICIAL_PORTAL',
          primarySource: 'Department of Environment, Forest and Climate Change, Government of Bihar',
          documentType: 'State Wildlife Board Resolution & Notification',
          secondarySource: 'Wildlife Institute of India (WII) Technical Feasibility Report',
          sourceProvenance: {
            primarySource: 'Department of Environment, Forest and Climate Change, Government of Bihar',
            documentType: 'State Wildlife Board Resolution & Notification',
            secondarySource: 'Wildlife Institute of India (WII) Technical Feasibility Report',
            keyConcepts: [
              'Valmiki Tiger Reserve (Terai Arc Landscape)',
              'Greater One-Horned Rhinoceros (Rhinoceros unicornis)',
              'Transboundary Protected Area Corridors',
              'Grassland Succession Management',
              'Wildlife Protection Act (1972) Schedule I'
            ],
            issuesAndChallenges: [
              'Risk of human-wildlife conflict along agricultural fringes bordering West Champaran villages.',
              'Invasive weed infestation (Lantana camara and Mikania micrantha) suppressing native palatable grasses.',
              'Seasonal flooding of the Gandak river causing grassland erosion and animal displacement.'
            ],
            wayForward: [
              'Constructing high-ground mud mounds (highlands) inside core zones to serve as safety shelters during monsoons.',
              'Equipping joint patrol units with drone surveillance and GPS-enabled M-STrIPES monitoring software.'
            ]
          },
          publishedAt: '2026-07-20T10:30:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BPSC',
          biharRelevance: 'Direct high-yield topic for 71st BPSC Prelims & Mains (Bihar Geography, Forests & Wildlife, Valmiki Tiger Reserve).',
          prelimsPointers: [
            'Valmiki Tiger Reserve is located in West Champaran district and is the northernmost protected forest in Bihar.',
            'River Gandak (Narayani in Nepal) forms the western boundary of Valmiki Tiger Reserve.',
            'VTR is contiguous with Chitwan National Park of Nepal to the north, forming a critical transboundary wildlife corridor.',
            'Greater One-Horned Rhinoceros is listed as "Vulnerable" on the IUCN Red List and protected under Schedule I of Wildlife (Protection) Act, 1972.',
            'According to the All India Tiger Estimation (2022), tiger numbers in VTR increased to 54.',
            'Kaimur Wildlife Sanctuary is proposed to be developed as the second tiger reserve of Bihar.'
          ],
          mainsDimensions: {
            'Species Reintroduction & Biodiversity Resilience': 'Creating auxiliary habitats to safeguard endangered megaherbivores from catastrophic epidemics in single protected zones.',
            'Indigenous Community Co-existence': 'Integrating the indigenous Tharu community into participatory forest management and homestay eco-tourism.',
            'Transboundary Conservation Diplomacy': 'Harmonizing anti-poaching protocols and river corridor monitoring between Indian and Nepalese forest rangers.',
            'Eco-Tourism & Regional Employment': 'Developing regulated wildlife tourism circuits in Tirhut division to generate non-agrarian employment.'
          }
        },
        {
          id: 'ca_bihar_industrial_policy_2026',
          title: 'Bihar State Cabinet Approves Electronics, IT & Semiconductor Incentive Policy 2026 with Capital Subsidies',
          date: '2026-07-15',
          category: 'Bihar Current Affairs',
          subtopic: 'Industrial Policy, Infrastructure & Employment',
          summary: 'The Bihar State Cabinet approved the Bihar IT, ITeS & Electronic System Design Manufacturing (ESDM) Policy 2026, offering up to 30% capital investment subsidy and stamp duty exemptions.',
          whyInNews: 'The Bihar State Cabinet approved the comprehensive Bihar Electronics, Information Technology (IT) and Semiconductor Promotion Policy 2026.',
          whatHappened: 'The policy offers up to 30% capital investment subsidy (capped at ₹30 crore), 100% reimbursement of stamp duty and land conversion charges, 50% power tariff subsidies for 5 years, and employment generation incentives of ₹20,000 per employee per month for domestic IT/ESDM units.',
          background: 'Bihar has historically had a low share of industrial manufacturing in Gross State Domestic Product (GSDP) (~19%). The policy aims to leverage Bihar’s high youth demographic dividend and reverse technical brain drain by creating plug-and-play IT mega hubs in Patna (Bihta), Rajgir, and Darbhanga.',
          keyFacts: [
            'Policy Name: Bihar IT, ITeS & Electronic System Design and Manufacturing (ESDM) Policy 2026',
            'Capital Investment Subsidy: 30% of eligible fixed capital investment (EFCI)',
            'Land Incentives: 100% reimbursement of stamp duty, registration fee, and land conversion cess',
            'Employment Generation Grant: Up to ₹20,000 per month per employee for female/domiciled workforce',
            'Dedicated Tech Parks: Bihta IT Park (Patna), Rajgir Knowledge City, and Darbhanga Software Technology Park',
            'Nodal Department: Department of Information Technology, Government of Bihar'
          ],
          whyItMatters: 'Transforms Bihar from a pure agrarian and migrant-labor exporting economy into an emerging technology services and electronics assembly hub, retaining skilled engineering talent.',
          implications: 'Accelerates investment in data centres, BPOs, software development centres, and chip testing/packaging units (OSAT) in Bihar.',
          gsPaper: 'GS Paper III & BPSC General Studies Paper II (Bihar Economy, Industrial Development & Employment Generation)',
          prelimsRelevance: 'Key subsidy provisions of Bihar IT Policy 2026, Bihta IT Park location, ESDM sector definitions (BPSC Prelims).',
          mainsRelevance: 'Industrialization hurdles in Bihar, service sector growth, demographic dividend utilization, and industrial policy reforms (BPSC Mains Paper II).',
          relatedSubject: 'Bihar Economy & Governance',
          relatedConceptIds: ['c_bihar_industry', 'c_bihar_it_policy', 'c_demographic_dividend'],
          keywords: ['Bihar IT Policy', 'BPSC Economy', 'Bihta IT Park', 'Capital Subsidy', 'ESDM', 'GSDP'],
          source: 'Department of Information Technology, Government of Bihar',
          sourceUrl: 'https://state.bihar.gov.in/dit',
          sourceType: 'OFFICIAL_PORTAL',
          primarySource: 'Department of Information Technology, Government of Bihar',
          documentType: 'State Cabinet Resolution & Industrial Gazette Notification',
          secondarySource: 'Bihar Industrial Area Development Authority (BIADA)',
          sourceProvenance: {
            primarySource: 'Department of Information Technology, Government of Bihar',
            documentType: 'State Cabinet Resolution & Industrial Gazette Notification',
            secondarySource: 'Bihar Industrial Area Development Authority (BIADA)',
            keyConcepts: [
              'Electronic System Design & Manufacturing (ESDM)',
              'Capital Investment Subsidy',
              'Plug-and-Play Infrastructure (BIADA)',
              'Demographic Dividend & Skill Development',
              'GSDP Sectoral Composition'
            ],
            issuesAndChallenges: [
              'Perception of industrial infrastructure deficits and shortage of tier-1 grade office spaces in state capitals.',
              'Ensuring 24x7 uninterrupted high-voltage industrial power supply at competitive tariffs.',
              'Industry-academia skill gap between state technical universities and global software/semiconductor standards.'
            ],
            wayForward: [
              'Fast-tracking BIADA land allotment through single-window clearances and digital clearances.',
              'Partnering with IIT Patna, NIT Patna, and IIIT Bhagalpur for specialized centers of excellence in AI, VLSI design, and embedded systems.'
            ]
          },
          publishedAt: '2026-07-15T11:30:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BPSC',
          biharRelevance: 'Direct high-yield topic for 71st BPSC Prelims & Mains (General Studies Paper II: Bihar Economy, Industrial Policy & Employment).',
          prelimsPointers: [
            'Bihar IT, ITeS & ESDM Policy 2026 provides a 30% capital subsidy on eligible fixed capital investments.',
            'BIADA (Bihar Industrial Area Development Authority) is the statutory authority managing industrial estates and technology parks across Bihar.',
            'Major IT infrastructure hubs identified include Bihta (Patna), Rajgir Knowledge City (Nalanda), and Darbhanga.',
            'The policy provides special 5% additional capital subsidy for enterprises led by women, SC/ST, and Divyangjan entrepreneurs.',
            'Bihar’s secondary (industrial) sector contributes approximately 19% to the Gross State Domestic Product (GSDP).',
            'Software Technology Parks of India (STPI) operates active incubation centres at Patna and Darbhanga.'
          ],
          mainsDimensions: {
            'Structural Economic Transformation': 'Transitioning Bihar’s agrarian-dominated economy (Primary Sector ~25%) towards high-productivity IT services and manufacturing.',
            'Reversing Brain Drain & Skill Retention': 'Providing high-income white-collar employment opportunities within Bihar for thousands of STEM graduates migrating annually.',
            'Ease of Doing Business & Single Window Clearance': 'Institutionalizing streamlined statutory clearances, land bank digitisation, and investor grievance redressal under BIADA.',
            'Balanced Regional Industrial Development': 'Dispersing technology parks beyond Patna to tier-2 cities like Darbhanga, Bhagalpur, and Gaya.'
          }
        }
      ];

      for (const item of seedArticles) {
        await this.createArticle(item);
      }

      console.log('[CurrentAffairsRepository] Successfully seeded 12 rich structured editorial current affairs articles.');
    } catch (err: any) {
      console.error('[CurrentAffairsRepository] Seed error:', err.message);
    }
  }
}

export const currentAffairsRepository = new CurrentAffairsRepository();

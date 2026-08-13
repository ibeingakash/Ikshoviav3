import pool from '../db/pool.js';

export interface CurrentAffairRecord {
  id: string;
  title: string;
  summary: string;
  background?: string;
  category: string;
  subtopic?: string;
  source: string;
  sourceUrl?: string;
  sourceType?: 'PRIMARY_GOVT' | 'SECONDARY_NEWS' | 'OFFICIAL_PORTAL';
  date: string;
  relatedSubject?: string;
  prelimsRelevance?: string;
  mainsRelevance?: string;
  examRelevance?: 'UPSC' | 'BPSC' | 'BOTH';
  biharRelevance?: string;
  keywords?: string[];
  keyFacts?: string[];
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
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      background: row.background || undefined,
      category: row.category,
      subtopic: row.subtopic || undefined,
      source: row.source || 'Official Source',
      sourceUrl: row.source_url || undefined,
      sourceType: row.source_type || 'PRIMARY_GOVT',
      date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      relatedSubject: row.related_subject || undefined,
      prelimsRelevance: row.prelims_relevance || undefined,
      mainsRelevance: row.mains_relevance || undefined,
      examRelevance: row.exam_relevance || 'BOTH',
      biharRelevance: row.bihar_relevance || undefined,
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      keyFacts: Array.isArray(row.key_facts) ? row.key_facts : [],
      prelimsPointers: Array.isArray(row.prelims_pointers) ? row.prelims_pointers : [],
      mainsDimensions: typeof row.mains_dimensions === 'object' && row.mains_dimensions !== null ? row.mains_dimensions : {},
      importantFacts: Array.isArray(row.important_facts) ? row.important_facts : [],
      relatedConceptIds: Array.isArray(row.related_concept_ids) ? row.related_concept_ids : [],
      rawContent: row.raw_content || undefined,
      sourceProvenance: typeof row.source_provenance === 'object' && row.source_provenance !== null ? row.source_provenance : {},
      status: row.status || 'PUBLISHED',
      isPublished: row.is_published ?? true,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  async createArticle(data: Partial<CurrentAffairRecord>): Promise<CurrentAffairRecord> {
    const id = data.id || `ca_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = data.title || 'Untitled Article';
    const summary = data.summary || '';
    const background = data.background || null;
    const category = data.category || 'Polity & Governance';
    const subtopic = data.subtopic || null;
    const source = data.source || 'Press Information Bureau (PIB)';
    const sourceUrl = data.sourceUrl || null;
    const sourceType = data.sourceType || 'PRIMARY_GOVT';
    const date = data.date || new Date().toISOString().split('T')[0];
    const relatedSubject = data.relatedSubject || null;
    const prelimsRelevance = data.prelimsRelevance || null;
    const mainsRelevance = data.mainsRelevance || null;
    const examRelevance = data.examRelevance || 'BOTH';
    const biharRelevance = data.biharRelevance || null;
    const keywords = JSON.stringify(data.keywords || []);
    const keyFacts = JSON.stringify(data.keyFacts || []);
    const prelimsPointers = JSON.stringify(data.prelimsPointers || []);
    const mainsDimensions = JSON.stringify(data.mainsDimensions || {});
    const importantFacts = JSON.stringify(data.importantFacts || []);
    const relatedConceptIds = JSON.stringify(data.relatedConceptIds || []);
    const rawContent = data.rawContent || null;
    const sourceProvenance = JSON.stringify(data.sourceProvenance || {});
    const status = data.status || 'PUBLISHED';
    const isPublished = data.isPublished ?? (status === 'PUBLISHED');

    const query = `
      INSERT INTO public.current_affairs (
        id, title, summary, background, category, subtopic, source, source_url, source_type,
        date, related_subject, prelims_relevance, mains_relevance, exam_relevance, bihar_relevance,
        keywords, key_facts, prelims_pointers, mains_dimensions, important_facts,
        related_concept_ids, raw_content, source_provenance, status, is_published,
        published_at, retrieved_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb,
        $21::jsonb, $22, $23::jsonb, $24, $25,
        NOW(), NOW(), NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
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
        prelims_pointers = EXCLUDED.prelims_pointers,
        mains_dimensions = EXCLUDED.mains_dimensions,
        important_facts = EXCLUDED.important_facts,
        related_concept_ids = EXCLUDED.related_concept_ids,
        raw_content = EXCLUDED.raw_content,
        source_provenance = EXCLUDED.source_provenance,
        status = EXCLUDED.status,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      id, title, summary, background, category, subtopic, source, sourceUrl, sourceType,
      date, relatedSubject, prelimsRelevance, mainsRelevance, examRelevance, biharRelevance,
      keywords, keyFacts, prelimsPointers, mainsDimensions, importantFacts,
      relatedConceptIds, rawContent, sourceProvenance, status, isPublished,
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

  async getArticleById(id: string): Promise<CurrentAffairRecord | null> {
    const query = `SELECT * FROM public.current_affairs WHERE id = $1 LIMIT 1;`;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToRecord(res.rows[0]);
  }

  async listArticles(filters: CurrentAffairFilter = {}): Promise<CurrentAffairRecord[]> {
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

  // --- Revision Integration ---
  async bookmarkForRevision(userId: string, currentAffairId: string): Promise<boolean> {
    const query = `
      INSERT INTO public.revision_items (
        id, user_id, current_affair_id, item_type, status, retention, priority, next_review_date, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'CURRENT_AFFAIR', 'NEW', 100, 'HIGH', NOW(), NOW()
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
    const query = `
      SELECT ca.*
      FROM public.current_affairs ca
      JOIN public.revision_items ri ON ri.current_affair_id = ca.id
      WHERE ri.user_id = $1
      ORDER BY ri.updated_at DESC;
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(row => this.mapRowToRecord(row));
  }

  async ensureSeedArticles(): Promise<void> {
    try {
      const check = await pool.query('SELECT COUNT(*)::int as count FROM public.current_affairs;');
      if (check.rows[0].count > 0) return;

      console.log('[CurrentAffairsRepository] Seeding initial legitimate current affairs articles into PostgreSQL...');

      const seedArticles: Partial<CurrentAffairRecord>[] = [
        {
          id: 'ca_sc_writ_226',
          title: 'Supreme Court Clarifies Limits of High Court Writ Power Under Article 226 in Administrative Disputes',
          date: '2026-08-13',
          category: 'Polity & Governance',
          subtopic: 'Judiciary & Constitutional Writs',
          summary: 'A 3-judge Bench of the Supreme Court held that High Courts must exercise judicial restraint under Article 226 when effective statutory appeal mechanisms exist.',
          background: 'The verdict arose from an appeal challenging a High Court order interfering directly in tribunal proceedings without statutory remedies being exhausted.',
          keyFacts: [
            'Article 226 provides discretionary writ powers for Fundamental Rights and legal rights.',
            'Exhaustion of statutory remedies is a rule of policy and convenience rather than a absolute rule of law.',
            'Exceptions include violation of natural justice or fundamental rights breach.'
          ],
          prelimsRelevance: 'Scope of Article 32 vs Article 226, discretionary nature of HC writ jurisdiction.',
          mainsRelevance: 'Judicial restraint, statutory tribunal hierarchy, and administrative law (GS Paper II - Polity).',
          relatedSubject: 'Indian Polity & Governance',
          relatedConceptIds: ['c_art226', 'c_art32'],
          keywords: ['Article 226', 'Supreme Court', 'Writ Jurisdiction', 'Tribunal Appeal'],
          source: 'Supreme Court Judgment / Press Information Bureau',
          sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081301',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-08-13T08:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'Article 226 is wider in scope than Article 32 because it covers non-fundamental legal rights.',
            'High Courts cannot enforce writ powers if an alternative statutory forum is explicitly mandated by parliament, except in specific extraordinary circumstances.'
          ],
          mainsDimensions: {
            'Judicial Restraint': 'Prevents overburdening High Courts and respects statutory tribunal mandates.',
            'Right to Speedy Justice': 'Requires clear guidelines so litigants are not shuttled between courts.'
          }
        },
        {
          id: 'ca_rbi_mpc_rate_2026',
          title: 'RBI Monetary Policy Committee Maintains Repo Rate at 6.5% with Focus on Inflation Alignment',
          date: '2026-08-13',
          category: 'Economy',
          subtopic: 'Monetary Policy & Banking',
          summary: 'The Reserve Bank of India Monetary Policy Committee (MPC) voted unanimously to keep the policy repo rate unchanged at 6.50% while reiterating its commitment to durable inflation targeting.',
          background: 'Macroeconomic indicators show robust GDP growth projected at 7.2% for FY27 alongside stabilizing food grain prices.',
          keyFacts: [
            'Repo Rate stands at 6.50%, Standing Deposit Facility (SDF) at 6.25%.',
            'Inflation target under RBI Act Section 45ZB remains 4% with a +/- 2% tolerance band.',
            'Liquidity Adjustment Facility (LAF) corridor remains aligned with monetary policy stance.'
          ],
          prelimsRelevance: 'RBI MPC composition, LAF instruments (Repo, Reverse Repo, SDF, MSF), CPI inflation basket.',
          mainsRelevance: 'Monetary policy transmission, central bank independence, and growth-inflation balance (GS Paper III - Economy).',
          relatedSubject: 'Indian Economy',
          relatedConceptIds: ['c_rbi_mpc', 'c_monetary_policy'],
          keywords: ['RBI', 'Repo Rate', 'Monetary Policy Committee', 'CPI Inflation', 'SDF'],
          source: 'Reserve Bank of India Official Bulletin',
          sourceUrl: 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-08-13T09:30:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'MPC consists of 6 members: 3 from RBI (including Governor) and 3 appointed by Central Government.',
            'Governor has a casting vote in case of a tie.'
          ],
          mainsDimensions: {
            'Growth vs Inflation': 'Balancing economic expansion without triggering demand-pull inflation.',
            'External Sector Impact': 'Managing interest rate differentials against US Federal Reserve rates.'
          }
        },
        {
          id: 'ca_isro_gaganyaan_2026',
          title: 'ISRO Successfully Tests Gaganyaan Environmental Control & Life Support System (ECLSS)',
          date: '2026-08-12',
          category: 'Science & Tech',
          subtopic: 'Space Science & Human Spaceflight',
          summary: 'The Indian Space Research Organisation (ISRO) completed critical ground-simulation trials of the indigenously developed ECLSS module for the uncrewed G1 Gaganyaan flight.',
          background: 'ECLSS regulates cabin oxygen pressure, carbon dioxide scrubbing, temperature control, and humidity for human spaceflight crew safety.',
          keyFacts: [
            'ECLSS maintains 1 atm oxygen-nitrogen atmosphere inside Crew Module.',
            'Test conducted at ISRO Propulsion Complex (IPRC), Mahendragiri.',
            'Gaganyaan aims to demonstrate human spaceflight capability to Low Earth Orbit (LEO) at 400 km.'
          ],
          prelimsRelevance: 'Gaganyaan mission parameters, LEO altitude, ISRO centers (IPRC, VSSC, SAC), ECLSS functioning.',
          mainsRelevance: 'Indigenous technology development, commercial space economy, and strategic space posture (GS Paper III - Science & Tech).',
          relatedSubject: 'Science & Technology',
          relatedConceptIds: ['c_isro_gaganyaan'],
          keywords: ['ISRO', 'Gaganyaan', 'ECLSS', 'Human Spaceflight', 'LEO Orbit'],
          source: 'ISRO Official Press Release',
          sourceUrl: 'https://www.isro.gov.in/GaganyaanECLSS.html',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-08-12T14:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'Crew Escape System (CES) operates during ascent in case of launch vehicle failure.',
            'Orbital Module consists of Crew Module (CM) and Service Module (SM).'
          ],
          mainsDimensions: {
            'Indigenous Capabilities': 'Reduces reliance on foreign space agencies for life-support hardware.',
            'Spinoff Benefits': 'Advanced medical monitoring and air purification tech for terrestrial applications.'
          }
        },
        {
          id: 'ca_kosi_mechi_bihar_2026',
          title: 'Bihar Kosi-Mechi River Interlinking Scheme Secures Final Central Hydrological Clearance',
          date: '2026-08-11',
          category: 'Bihar Current Affairs',
          subtopic: 'Water Resources & Bihar Regional Development',
          summary: 'The Kosi-Mechi Intra-State River Linking Project in Bihar achieved final hydrological safety clearance, paving the way for irrigating over 2.14 lakh hectares in Seemanchal districts.',
          background: 'It is the second major intra-state river linking project approved in India after Ken-Betwa, designed to divert excess water from Kosi to Mechi river.',
          keyFacts: [
            'Beneficiary districts: Araria, Purnea, Kishanganj, and Katihar.',
            'Diversion canal length: 76 km connecting Hanuman Nagar barrage on Kosi to Mechi river.',
            'Mechi river is a tributary of Mahananda river.'
          ],
          prelimsRelevance: 'Kosi river origin (Saptakoshi), Mechi river tributaries, Mahananda basin, Seemanchal geography (BPSC Prelims).',
          mainsRelevance: 'Flood mitigation in North Bihar, irrigation potential expansion, and regional economic development (GS Paper II/III & BPSC Mains).',
          relatedSubject: 'Geography & Bihar Special',
          relatedConceptIds: ['c_bihar_rivers', 'c_interlinking_rivers'],
          keywords: ['Kosi Mechi', 'Bihar Rivers', 'Seemanchal', 'BPSC Current Affairs', 'Irrigation'],
          source: 'Water Resources Department, Govt of Bihar',
          sourceUrl: 'https://wrd.bihar.gov.in/PressReleases',
          sourceType: 'OFFICIAL_PORTAL',
          publishedAt: '2026-08-11T11:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BPSC',
          biharRelevance: 'High relevance for 71st BPSC Prelims & Mains Geography/Economy section.',
          prelimsPointers: [
            'Kosi is known as the "Sorrow of Bihar" due to frequent course shifts.',
            'Mechi river forms part of the international boundary between Nepal and India before entering Bihar.'
          ],
          mainsDimensions: {
            'Socio-Economic Impact': 'Boosts paddy and jute productivity across Araria and Purnea districts.',
            'Disaster Risk Reduction': 'Mitigates monsoon flood surges by diverting excess discharge.'
          }
        },
        {
          id: 'ca_india_asean_2026',
          title: 'India-ASEAN Summit Reaffirms Commitment to Maritime Security and Trade Agreement Review',
          date: '2026-08-10',
          category: 'International Relations',
          subtopic: 'Act East Policy & Regional Security',
          summary: 'Senior officials from India and ASEAN member states finalized the scope for the review of the ASEAN-India Trade in Goods Agreement (AITIGA) to ensure balanced bilateral trade.',
          background: 'AITIGA came into force in 2010. Review aims to address tariff asymmetries, non-tariff barriers, and supply chain resilience.',
          keyFacts: [
            'AITIGA review target completion set for late 2026.',
            'Bilateral trade between India and ASEAN crossed $120 billion in FY25.',
            'Emphasized UNCLOS 1982 compliance in Indo-Pacific sea lanes of communication.'
          ],
          prelimsRelevance: 'ASEAN 10 member states, AITIGA review, UNCLOS 1982, Indo-Pacific Oceans Initiative (IPOI).',
          mainsRelevance: 'Act East Policy, Indo-Pacific diplomacy, supply chain diversification (GS Paper II - IR).',
          relatedSubject: 'International Relations',
          relatedConceptIds: ['c_asean_india', 'c_act_east'],
          keywords: ['India ASEAN', 'AITIGA', 'Act East Policy', 'Indo Pacific', 'UNCLOS'],
          source: 'Ministry of External Affairs (MEA), Govt of India',
          sourceUrl: 'https://mea.gov.in/press-releases.htm',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-08-10T15:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'ASEAN headquarters is located in Jakarta, Indonesia.',
            'India is a Dialogue Partner of ASEAN since 1996 and Strategic Partner since 2012.'
          ],
          mainsDimensions: {
            'Economic Cooperation': 'Addressing trade deficit concerns while improving customs facilitation.',
            'Maritime Governance': 'Ensuring freedom of navigation in the South China Sea and Andaman Sea.'
          }
        },
        {
          id: 'ca_ngt_wetlands_2026',
          title: 'National Green Tribunal Issues Mandate on Eco-Sensitive Zones Around Ramsar Sites',
          date: '2026-08-08',
          category: 'Environment',
          subtopic: 'Environmental Conservation & Biodiversity',
          summary: 'The NGT directed state pollution control boards to enforce a minimum 1-km Eco-Sensitive Zone (ESZ) around declared Ramsar wetland boundaries without exception.',
          background: 'Encroachments and untreated municipal sewage discharge were endangering fragile wetland biodiversity and migratory bird habitats.',
          keyFacts: [
            'Ramsar Convention 1971 protects wetlands of international importance.',
            'India currently has 85 designated Ramsar sites covering over 1.3 million hectares.',
            'Wetlands (Conservation and Management) Rules 2017 regulate commercial activities within wetland zones.'
          ],
          prelimsRelevance: 'Ramsar Convention, Montreux Record, Wetland Rules 2017, NGT Act 2010 powers.',
          mainsRelevance: 'Environmental governance, wetland ecosystem services, urban flood management (GS Paper III - Environment).',
          relatedSubject: 'Environment & Ecology',
          relatedConceptIds: ['c_ramsar_sites', 'c_ngt'],
          keywords: ['NGT', 'Ramsar Sites', 'Wetlands', 'Eco Sensitive Zone', 'Biodiversity'],
          source: 'National Green Tribunal Official Orders',
          sourceUrl: 'https://greentribunal.gov.in/orders',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-08-08T10:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'BOTH',
          prelimsPointers: [
            'Montreux Record is a register of Ramsar sites where changes in ecological character have occurred or are likely to occur.',
            'NGT is a statutory body established under NGT Act 2010 for environmental protection.'
          ],
          mainsDimensions: {
            'Ecological Value': 'Wetlands act as natural carbon sinks and urban flood buffers.',
            'Enforcement Gaps': 'Need for local urban local bodies to install sewage treatment plants (STPs).'
          }
        },
        {
          id: 'ca_green_hydrogen_2026',
          title: 'Union Cabinet Expands National Green Hydrogen Mission Incentives for Electrolyser Manufacturing',
          date: '2026-07-28',
          category: 'Economy',
          subtopic: 'Renewable Energy & Industrial Policy',
          summary: 'The Ministry of New and Renewable Energy announced Tranche-II under the SIGHT (Strategic Interventions for Green Hydrogen Transition) program to accelerate electrolyser production.',
          background: 'National Green Hydrogen Mission aims to produce 5 MMT of green hydrogen per annum by 2030.',
          keyFacts: [
            'SIGHT scheme allocated ₹17,490 crore for electrolyser manufacturing and green hydrogen production.',
            'Target reduction of 50 MMT cumulative greenhouse gas emissions by 2030.',
            'Promotes green ammonia export hubs at major ports.'
          ],
          prelimsRelevance: 'Green vs Grey vs Blue Hydrogen, SIGHT program components, MNRE mandates.',
          mainsRelevance: 'Energy transition, COP26 Panchamrit targets, industrial decarbonization (GS Paper III - Economy/Environment).',
          relatedSubject: 'Indian Economy',
          relatedConceptIds: ['c_green_hydrogen', 'c_renewable_energy'],
          keywords: ['Green Hydrogen', 'SIGHT Scheme', 'Electrolyser', 'MNRE', 'Decarbonization'],
          source: 'Ministry of New and Renewable Energy (MNRE)',
          sourceUrl: 'https://mnre.gov.in/green-hydrogen-mission',
          sourceType: 'PRIMARY_GOVT',
          publishedAt: '2026-07-28T12:00:00Z',
          isPublished: true,
          status: 'PUBLISHED',
          examRelevance: 'UPSC',
          prelimsPointers: [
            'Green Hydrogen is produced via electrolysis of water using renewable energy source.',
            'Electrolyser technologies include PEM (Proton Exchange Membrane) and Alkaline water electrolysis.'
          ],
          mainsDimensions: {
            'Import Substitution': 'Reduces India dependency on imported liquefied natural gas (LNG).',
            'Export Competitiveness': 'Positions India as a global supplier of green ammonia and green steel.'
          }
        }
      ];

      for (const item of seedArticles) {
        await this.createArticle(item);
      }

      console.log('[CurrentAffairsRepository] Successfully seeded 7 legitimate current affairs articles.');
    } catch (err: any) {
      console.error('[CurrentAffairsRepository] Seed error:', err.message);
    }
  }
}

export const currentAffairsRepository = new CurrentAffairsRepository();

import { currentAffairsRepository } from './server/repositories/CurrentAffairsRepository.js';
import pool from './server/db/pool.js';

let passed = 0;
let failed = 0;

async function assertTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runRegressionSuite() {
  console.log('====================================================');
  console.log('🏛️  IKSHOVIA Current Affairs Knowledge Bridge Regression Test');
  console.log('====================================================');

  // A. Proxy test resources do NOT appear
  await assertTest('A. Proxy test resources do NOT appear in listArticles()', async () => {
    const articles = await currentAffairsRepository.listArticles({ limit: 200 });
    const proxyFound = articles.filter(a =>
      a.title.toLowerCase().includes('proxy test') ||
      a.source.toLowerCase().includes('proxy test') ||
      a.id.startsWith('res_03fb') ||
      a.id.startsWith('res_6bb7') ||
      a.id.startsWith('res_3ba5')
    );
    if (proxyFound.length > 0) {
      throw new Error(`Found ${proxyFound.length} proxy test records: ${proxyFound.map(p => p.title).join(', ')}`);
    }
  });

  // B. Real official knowledge resources DO appear
  await assertTest('B. Real official knowledge resources DO appear in listArticles()', async () => {
    const articles = await currentAffairsRepository.listArticles({ limit: 200 });
    const pibArticle = articles.find(a => a.id === 'res_a0354a3bc420' || a.title.includes('Smart India Hackathon'));
    if (!pibArticle) {
      throw new Error('Real official PIB knowledge resource was not found in listArticles()');
    }
    if (pibArticle.source !== 'Pib' && !pibArticle.source.includes('PIB') && !pibArticle.source.includes('Official')) {
      throw new Error(`Unexpected source name: ${pibArticle.source}`);
    }
    if (!pibArticle.sourceProvenance) {
      throw new Error('Missing sourceProvenance in official knowledge record');
    }
  });

  // C. Existing curated current affairs DO appear
  await assertTest('C. Existing curated current affairs DO appear', async () => {
    const articles = await currentAffairsRepository.listArticles({ limit: 200 });
    const curatedGaganyaan = articles.find(a => a.id === 'ca_isro_gaganyaan_2026');
    const curatedRbi = articles.find(a => a.id === 'ca_rbi_mpc_rate_2026');
    const curatedBihar = articles.find(a => a.id === 'ca_kosi_mechi_bihar_2026');

    if (!curatedGaganyaan || !curatedRbi || !curatedBihar) {
      throw new Error('One or more standard curated articles were missing from listArticles()');
    }
  });

  // D. Deduplication still works
  await assertTest('D. Deduplication merges curated and knowledge records without duplicates', async () => {
    const articles = await currentAffairsRepository.listArticles({ limit: 200 });
    const ids = articles.map(a => a.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new Error(`Duplicate IDs found: ${ids.length} total vs ${uniqueIds.size} unique`);
    }

    const titles = articles.map(a => a.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      throw new Error(`Duplicate titles found in listArticles(): ${titles.length} vs ${uniqueTitles.size}`);
    }
  });

  // E. Pagination still works
  await assertTest('E. Pagination works deterministically (limit & offset)', async () => {
    const all = await currentAffairsRepository.listArticles({ limit: 50, offset: 0 });
    const page1 = await currentAffairsRepository.listArticles({ limit: 3, offset: 0 });
    const page2 = await currentAffairsRepository.listArticles({ limit: 3, offset: 3 });

    if (page1.length !== 3) {
      throw new Error(`Expected 3 items in page 1, got ${page1.length}`);
    }
    if (all.length > 3 && page2.length === 0) {
      throw new Error('Page 2 should contain items when total items > 3');
    }
    if (page1[0].id === page2[0].id) {
      throw new Error('Page 1 and Page 2 overlap on first element');
    }
  });

  // F. Category filter
  await assertTest('F1. Category filter works (Economy)', async () => {
    const economyArticles = await currentAffairsRepository.listArticles({ category: 'Economy' });
    if (economyArticles.length === 0) {
      throw new Error('Expected at least one Economy article');
    }
    for (const art of economyArticles) {
      if (art.category !== 'Economy' && (!art.subtopic || !art.subtopic.toLowerCase().includes('economy'))) {
        throw new Error(`Non-economy article returned: ${art.title} (category: ${art.category})`);
      }
    }
  });

  // F2. Exam filter
  await assertTest('F2. Exam filter works (BPSC)', async () => {
    const bpscArticles = await currentAffairsRepository.listArticles({ exam: 'BPSC' });
    if (bpscArticles.length === 0) {
      throw new Error('Expected BPSC articles to be returned');
    }
    for (const art of bpscArticles) {
      if (art.examRelevance !== 'BPSC' && art.examRelevance !== 'BOTH') {
        throw new Error(`Unexpected exam relevance: ${art.examRelevance}`);
      }
    }
  });

  // F3. Bihar Only filter
  await assertTest('F3. Bihar Only filter works', async () => {
    const biharArticles = await currentAffairsRepository.listArticles({ biharOnly: true });
    if (biharArticles.length === 0) {
      throw new Error('Expected Bihar-relevant articles');
    }
    for (const art of biharArticles) {
      if (art.examRelevance !== 'BPSC' && !art.biharRelevance && art.category !== 'Bihar Current Affairs') {
        throw new Error(`Article not matching Bihar criteria: ${art.title}`);
      }
    }
  });

  // F4. Search filter
  await assertTest('F4. Search query filter works', async () => {
    const searchRes = await currentAffairsRepository.listArticles({ search: 'Gaganyaan' });
    if (searchRes.length === 0) {
      throw new Error('Expected Gaganyaan search results');
    }
    const hasGaganyaan = searchRes.some(a =>
      a.title.toLowerCase().includes('gaganyaan') ||
      a.summary.toLowerCase().includes('gaganyaan') ||
      (a.rawContent && a.rawContent.toLowerCase().includes('gaganyaan'))
    );
    if (!hasGaganyaan) {
      throw new Error(`No search results contained search term Gaganyaan: ${searchRes.map(r => r.title).join(', ')}`);
    }
  });

  // G. Direct lookup of test resource ID returns null
  await assertTest('G1. Direct lookup of proxy test resource returns null', async () => {
    const testDoc = await currentAffairsRepository.getArticleById('res_3ba5b7a6fcbe');
    if (testDoc !== null) {
      throw new Error('Expected null for proxy test resource lookup');
    }
  });

  // G2. Direct lookup of official knowledge resource returns full article with provenance
  await assertTest('G2. Direct lookup of official knowledge resource returns intact provenance', async () => {
    const realDoc = await currentAffairsRepository.getArticleById('res_a0354a3bc420');
    if (!realDoc) {
      throw new Error('Expected real official resource to be retrieved by ID');
    }
    if (!realDoc.sourceProvenance) {
      throw new Error('Missing sourceProvenance');
    }
    if (realDoc.sourceProvenance.adapter !== 'pib') {
      throw new Error(`Expected adapter pib, got ${realDoc.sourceProvenance.adapter}`);
    }
    if (realDoc.sourceProvenance.ministry !== 'Ministry of Education') {
      throw new Error(`Expected Ministry of Education, got ${realDoc.sourceProvenance.ministry}`);
    }
  });

  console.log('====================================================');
  console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().then(() => {
  pool.end();
}).catch(err => {
  console.error('Fatal test error:', err);
  pool.end();
  process.exit(1);
});

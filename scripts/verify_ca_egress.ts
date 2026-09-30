import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';
import { normalizeSourceUrl } from '../server/repositories/CurrentAffairsRepository.js';
import pool from '../server/db/pool.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  results.push({
    name,
    passed: condition,
    details: condition ? `OK: ${details}` : `FAILED: ${details}`,
  });
}

async function runVerification() {
  console.log('--- STARTING CURRENT AFFAIRS EGRESS & REPOSITORY VERIFICATION ---');

  // Test 1: URL Normalization function
  try {
    const u1 = normalizeSourceUrl('  HTTPS://News.Pib.Gov.IN/Release/101/// ');
    const u2 = normalizeSourceUrl('https://news.pib.gov.in/release/101');
    assert(u1 === u2 && u1 === 'https://news.pib.gov.in/release/101', 'URL Normalization', `Normalized: ${u1}`);
  } catch (err: any) {
    assert(false, 'URL Normalization', err.message);
  }

  // Test 2: HTTP Endpoint: Current affairs listing
  try {
    const res = await fetch('http://localhost:3000/api/current-affairs?limit=5');
    const data = await res.json();
    assert(res.ok && Array.isArray(data) && data.length <= 5, 'HTTP Listing Endpoint (/api/current-affairs)', `Status: ${res.status}, Count: ${data.length}`);
    if (data.length > 0) {
      const first = data[0];
      assert(!first.rawContent, 'Listing Projection: Excludes rawContent', 'Confirmed rawContent is absent in listing response');
      assert('title' in first && 'date' in first && 'category' in first, 'Listing Projection: Essential fields present', `Has title, date, category`);
    }
  } catch (err: any) {
    assert(false, 'HTTP Listing Endpoint', err.message);
  }

  // Test 3: HTTP Endpoint: Latest current affairs
  try {
    const res = await fetch('http://localhost:3000/api/current-affairs/latest?limit=3');
    const data = await res.json();
    assert(res.ok && Array.isArray(data) && data.length <= 3, 'HTTP Latest Endpoint (/api/current-affairs/latest)', `Status: ${res.status}, Count: ${data.length}`);
  } catch (err: any) {
    assert(false, 'HTTP Latest Endpoint', err.message);
  }

  // Test 4: HTTP Endpoint: Bihar current affairs
  try {
    const res = await fetch('http://localhost:3000/api/current-affairs/bihar/articles?limit=5');
    const data = await res.json();
    assert(res.ok && Array.isArray(data) && data.length <= 5, 'HTTP Bihar Articles Endpoint (/api/current-affairs/bihar/articles)', `Status: ${res.status}, Count: ${data.length}`);
  } catch (err: any) {
    assert(false, 'HTTP Bihar Articles Endpoint', err.message);
  }

  // Test 5: HTTP Endpoint: Search
  try {
    const res = await fetch('http://localhost:3000/api/current-affairs/articles?search=India&limit=4');
    const data = await res.json();
    assert(res.ok && data.articles && Array.isArray(data.articles) && data.articles.length <= 4, 'HTTP Search Endpoint (/api/current-affairs/articles)', `Status: ${res.status}, Count: ${data.articles.length}`);
  } catch (err: any) {
    assert(false, 'HTTP Search Endpoint', err.message);
  }

  // Test 6: HTTP Pagination: Page 1 vs Page 2 (offset)
  try {
    const res1 = await fetch('http://localhost:3000/api/current-affairs?limit=2&offset=0');
    const data1 = await res1.json();
    const res2 = await fetch('http://localhost:3000/api/current-affairs?limit=2&offset=2');
    const data2 = await res2.json();
    const ids1 = data1.map((d: any) => d.id);
    const ids2 = data2.map((d: any) => d.id);
    const overlap = ids1.filter((id: string) => ids2.includes(id));
    assert(res1.ok && res2.ok && overlap.length === 0, 'Pagination: Distinct Offset Pages', `Page 1: [${ids1}], Page 2: [${ids2}], Overlap: ${overlap.length}`);
  } catch (err: any) {
    assert(false, 'Pagination Test', err.message);
  }

  // Test 7: Direct Repository: Create Article & normalized_source_url population
  const testId = `test_egress_art_${Date.now()}`;
  const testUrl = '  https://PIB.Gov.IN/PressRelease/TestVerificationEgress2026/  ';
  try {
    const created = await currentAffairsRepository.createArticle({
      id: testId,
      title: 'Test Verification Article for Supabase Egress Optimization',
      summary: 'Verification of normalized URL indexing and minimal column egress',
      category: 'Science & Technology',
      source: 'Press Information Bureau (PIB)',
      sourceUrl: testUrl,
      date: '2026-09-22',
      isPublished: true,
      rawContent: 'A'.repeat(5000), // simulate large raw content
    });

    assert(created.id === testId, 'createArticle: returns record', `Created with ID: ${created.id}`);

    // Verify in database that normalized_source_url is correctly stored
    const checkDb = await pool.query(
      `SELECT id, source_url, normalized_source_url FROM public.current_affairs WHERE id = $1;`,
      [testId]
    );
    const dbRow = checkDb.rows[0];
    const expectedNormalized = 'https://pib.gov.in/pressrelease/testverificationegress2026';
    assert(
      dbRow && dbRow.normalized_source_url === expectedNormalized,
      'createArticle: normalized_source_url stored correctly',
      `DB Value: "${dbRow?.normalized_source_url}", Expected: "${expectedNormalized}"`
    );
  } catch (err: any) {
    assert(false, 'createArticle Test', err.message);
  }

  // Test 8: Duplicate Detection using indexed normalized_source_url
  try {
    // Lookup with trailing slash, mixed case
    const dupVariant = 'HTTPS://pib.gov.in/PressRelease/TestVerificationEgress2026///';
    const dupFound = await currentAffairsRepository.findDuplicateByUrlOrTitle(dupVariant, undefined, undefined);
    assert(
      dupFound !== null && dupFound.id === testId,
      'findDuplicateByUrlOrTitle: indexed URL match',
      `Found ID: ${dupFound?.id}`
    );

    // Verify it only returned id (lightweight)
    assert(!('rawContent' in (dupFound || {})), 'findDuplicateByUrlOrTitle: lightweight payload', 'Only ID returned');
  } catch (err: any) {
    assert(false, 'findDuplicateByUrlOrTitle Test', err.message);
  }

  // Test 9: Update Article & normalized_source_url synchronization
  try {
    const newUrl = 'HTTPS://NewSource.ORG/articles/UpdatedUrl2026/';
    const updated = await currentAffairsRepository.updateArticle(testId, {
      sourceUrl: newUrl,
      summary: 'Updated summary for egress test',
    });

    assert(updated !== null && updated.id === testId, 'updateArticle: returns updated record', `Updated ID: ${updated?.id}`);

    // Verify normalized_source_url in DB
    const checkDb = await pool.query(
      `SELECT id, source_url, normalized_source_url FROM public.current_affairs WHERE id = $1;`,
      [testId]
    );
    const dbRow = checkDb.rows[0];
    const expectedNormalized = 'https://newsource.org/articles/updatedurl2026';
    assert(
      dbRow && dbRow.normalized_source_url === expectedNormalized,
      'updateArticle: normalized_source_url synchronized on update',
      `DB Value: "${dbRow?.normalized_source_url}", Expected: "${expectedNormalized}"`
    );

    // Duplicate check on new URL
    const dupCheckNew = await currentAffairsRepository.findDuplicateByUrlOrTitle(newUrl, undefined, undefined);
    assert(dupCheckNew?.id === testId, 'findDuplicateByUrlOrTitle: matches updated URL', `Found ID: ${dupCheckNew?.id}`);
  } catch (err: any) {
    assert(false, 'updateArticle Test', err.message);
  }

  // Test 10: Cleanup test article
  try {
    const deleted = await currentAffairsRepository.deleteArticle(testId);
    assert(deleted, 'deleteArticle: cleanup completed', `Test record ${testId} deleted`);
  } catch (err: any) {
    assert(false, 'deleteArticle Test', err.message);
  }

  console.log('\n--- VERIFICATION RESULTS SUMMARY ---');
  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅' : '❌';
    console.log(`${symbol} [${r.passed ? 'PASS' : 'FAIL'}] ${r.name} - ${r.details}`);
    if (r.passed) passedCount++;
  }
  console.log(`\nTotal: ${results.length}, Passed: ${passedCount}, Failed: ${results.length - passedCount}`);

  await pool.end();
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

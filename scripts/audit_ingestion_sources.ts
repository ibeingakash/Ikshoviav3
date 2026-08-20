import pool from '../server/db/pool.js';
import { ensureDatabaseSchema } from '../server/db/schemaRunner.js';
import { initDatabase } from '../server/db.js';
import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';

async function runAudit() {
  console.log('=== IKSHOVIA CURRENT AFFAIRS MULTI-SOURCE INGESTION AUDIT ===\n');

  await ensureDatabaseSchema();
  await initDatabase();
  await currentAffairsRepository.ensureSeedArticles();

  const dates = [
    '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08',
    '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12',
    '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16',
    '2026-08-17', '2026-08-18', '2026-08-19'
  ];

  console.log('1. Database Coverage by Date (All Sources):');
  const dateCountsRes = await pool.query(`
    SELECT 
      TO_CHAR(date, 'YYYY-MM-DD') as article_date,
      COUNT(*) as total,
      COUNT(CASE WHEN exam_relevance::text ILIKE '%UPSC%' THEN 1 END) as upsc_count,
      COUNT(CASE WHEN exam_relevance::text ILIKE '%BPSC%' THEN 1 END) as bpsc_count,
      COUNT(CASE WHEN category = 'Bihar Current Affairs' OR category = 'Bihar Special' OR bihar_relevance IS NOT NULL THEN 1 END) as bihar_count,
      COUNT(CASE WHEN article_type = 'EDITORIAL' OR article_type = 'EXPLAINER' THEN 1 END) as editorial_count
    FROM current_affairs
    GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
    ORDER BY article_date ASC
  `);

  console.table(dateCountsRes.rows);

  console.log('\n2. Source Breakdown across Database:');
  const sourceBreakdownRes = await pool.query(`
    SELECT 
      source,
      source_type,
      COUNT(*) as total_articles,
      MIN(TO_CHAR(date, 'YYYY-MM-DD')) as min_date,
      MAX(TO_CHAR(date, 'YYYY-MM-DD')) as max_date
    FROM current_affairs
    GROUP BY source, source_type
    ORDER BY total_articles DESC
  `);
  console.table(sourceBreakdownRes.rows);

  console.log('\n3. Source × Date Matrix:');
  const matrixRes = await pool.query(`
    SELECT 
      TO_CHAR(date, 'YYYY-MM-DD') as article_date,
      source,
      COUNT(*) as count
    FROM current_affairs
    WHERE TO_CHAR(date, 'YYYY-MM-DD') IN (${dates.map(d => `'${d}'`).join(',')})
    GROUP BY TO_CHAR(date, 'YYYY-MM-DD'), source
    ORDER BY article_date DESC, count DESC
  `);
  console.table(matrixRes.rows);

  console.log('\n4. Check Source Freshness Table:');
  try {
    const freshnessRes = await pool.query(`
      SELECT source_identifier, display_name, source_type, is_active, schedule_description, latest_article_date, freshness_status FROM source_freshness ORDER BY source_identifier ASC
    `);
    console.table(freshnessRes.rows);
  } catch (e: any) {
    console.log('Source freshness table note:', e.message);
  }

  process.exit(0);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

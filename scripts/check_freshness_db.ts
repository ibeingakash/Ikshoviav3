import pool from '../server/db/pool.js';

async function checkStatus() {
  try {
    const datesRes = await pool.query(`
      SELECT date, COUNT(*) as count, 
             COUNT(CASE WHEN article_type = 'EDITORIAL' THEN 1 END) as editorials,
             COUNT(CASE WHEN category ILIKE '%bihar%' THEN 1 END) as bihar_special,
             COUNT(CASE WHEN exam_relevance ILIKE '%UPSC%' THEN 1 END) as upsc_count,
             COUNT(CASE WHEN exam_relevance ILIKE '%BPSC%' THEN 1 END) as bpsc_count
      FROM public.current_affairs
      GROUP BY date
      ORDER BY date DESC;
    `);

    console.log('Current affairs date distribution in DB:');
    console.table(datesRes.rows);

    const freshnessRes = await pool.query(`
      SELECT source_identifier, display_name, source_type, freshness_status, latest_article_date, updated_at
      FROM public.source_freshness;
    `);
    console.log('Source freshness in DB:');
    console.table(freshnessRes.rows);

    const runsRes = await pool.query(`
      SELECT id, source_identifier, status, resources_discovered, current_affairs_published, created_at
      FROM public.data_ingestion_runs
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    console.log('Recent ingestion runs in DB:');
    console.table(runsRes.rows);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error running check:', err);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

checkStatus();

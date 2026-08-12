import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

async function deploySchema() {
  console.log('Connecting to Cloud SQL PostgreSQL...');
  const client = new Client({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: 5432
  });

  try {
    await client.connect();
    console.log('Connected to Cloud SQL PostgreSQL successfully.');

    // Ensure auth schema and stub functions exist if auth.uid() is called in RLS
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS text AS $$
        SELECT COALESCE(current_setting('request.jwt.claim.sub', true), current_user);
      $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
        SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'service_role');
      $$ LANGUAGE sql STABLE;
    `);

    const migrationFiles = [
      'supabase/migrations/001_initial_schema.sql',
      'supabase/migrations/002_rls_policies.sql',
      'supabase/migrations/003_seed_data.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`Executing migration file: ${file}...`);
      const sqlPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(sqlPath)) {
        console.error(`File not found: ${sqlPath}`);
        continue;
      }
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log(`Successfully executed: ${file}`);
    }

    // Verify deployed tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = res.rows.map(r => r.table_name);
    console.log('--- DEPLOYED PUBLIC TABLES ---');
    console.log(tableNames.join(', '));
    console.log(`Total tables: ${tableNames.length}`);

    await client.end();
  } catch (err: any) {
    console.error('Migration deployment error:', err);
    process.exit(1);
  }
}

deploySchema();

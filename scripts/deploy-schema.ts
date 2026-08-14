import pool from '../server/db/pool.js';
import { ensureDatabaseSchema } from '../server/db/schemaRunner.js';

async function runDeploy() {
  console.log('--- STARTING SCHEMA DEPLOYMENT ---');
  try {
    await ensureDatabaseSchema();
    console.log('--- SCHEMA DEPLOYMENT COMPLETE ---');
  } catch (err: any) {
    console.error('Schema deployment failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDeploy();

import pg from 'pg';
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

const hasExplicitHost = Boolean(process.env.SQL_HOST || process.env.PGHOST);
const isProduction = process.env.NODE_ENV === 'production';

if (!connectionString && !hasExplicitHost) {
  if (isProduction) {
    throw new Error(
      '[PostgreSQL Pool Error] CRITICAL: DATABASE_URL (or POSTGRES_URL/SUPABASE_DB_URL) is required in production environment! Production cannot connect without database credentials.'
    );
  } else {
    console.warn(
      '[PostgreSQL Pool Warning] No DATABASE_URL or SQL_HOST defined. Defaulting to local connection settings.'
    );
  }
}

function resolveSSL(connStr?: string): boolean | { rejectUnauthorized: boolean } {
  if (process.env.PGSSLMODE === 'disable') {
    return false;
  }
  if (connStr && (connStr.includes('sslmode=disable') || connStr.includes('ssl=false'))) {
    return false;
  }
  if (process.env.PGSSLMODE === 'require') {
    return { rejectUnauthorized: false };
  }
  if (connStr) {
    if (
      connStr.includes('sslmode=require') ||
      connStr.includes('supabase') ||
      connStr.includes('render.com') ||
      connStr.includes('aivencloud.com') ||
      connStr.includes('neon.tech')
    ) {
      return { rejectUnauthorized: false };
    }
  }
  if (isProduction) {
    return { rejectUnauthorized: false };
  }
  return false;
}

const poolConfig: pg.PoolConfig = connectionString
  ? {
      connectionString,
      ssl: resolveSSL(connectionString),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.SQL_HOST || process.env.PGHOST || 'localhost',
      user: process.env.SQL_ADMIN_USER || process.env.PGUSER,
      password: process.env.SQL_ADMIN_PASSWORD || process.env.PGPASSWORD,
      database: process.env.SQL_DB_NAME || process.env.PGDATABASE,
      port: Number(process.env.SQL_PORT || process.env.PGPORT || 5432),
      ssl: resolveSSL(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

export default pool;


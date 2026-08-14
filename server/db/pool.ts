import pg from 'pg';
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

const hasExplicitHost = Boolean(process.env.SQL_HOST || process.env.PGHOST);

if (!connectionString && !hasExplicitHost) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[PostgreSQL Pool Error] CRITICAL: DATABASE_URL (or POSTGRES_URL/SUPABASE_DB_URL) is required in production environment! Production cannot connect without database credentials.'
    );
  } else {
    console.warn(
      '[PostgreSQL Pool Warning] No DATABASE_URL or SQL_HOST defined. Defaulting to local connection settings.'
    );
  }
}

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig: pg.PoolConfig = connectionString
  ? {
      connectionString,
      ssl:
        isProduction ||
        process.env.PGSSLMODE === 'require' ||
        connectionString.includes('sslmode=require') ||
        connectionString.includes('supabase') ||
        connectionString.includes('render.com') ||
        connectionString.includes('aivencloud.com') ||
        connectionString.includes('neon.tech')
          ? { rejectUnauthorized: false }
          : false,
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
      ssl:
        isProduction || process.env.PGSSLMODE === 'require'
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

export default pool;


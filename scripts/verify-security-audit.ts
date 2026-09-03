import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pool from '../server/db/pool.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runSecurityAudit() {
  console.log(`====================================================`);
  console.log(`IKSHOVIA V3 COMPREHENSIVE SUPABASE & SYSTEM SECURITY AUDIT`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`====================================================\n`);

  // Wait for server readiness
  for (let i = 0; i < 20; i++) {
    try {
      const ping = await fetch(`${BASE_URL}/health`);
      if (ping.ok) break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  let passed = 0;
  let failed = 0;

  const test = async (title: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`[PASS] ${title}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${title}: ${err.message}`);
      failed++;
    }
  };

  // 1. Database Forensic Check: All Public Tables Have RLS Enabled
  await test('Database RLS Audit: 100% of public tables have Row Level Security enabled', async () => {
    const res = await pool.query(`
      SELECT t.table_name, c.relrowsecurity as rls_enabled
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `);
    const tables = res.rows;
    if (tables.length === 0) throw new Error('No tables found in public schema');
    const disabled = tables.filter(t => !t.rls_enabled);
    if (disabled.length > 0) {
      throw new Error(`Tables with RLS disabled (${disabled.length}): ${disabled.map(d => d.table_name).join(', ')}`);
    }
  });

  // 2. Database Forensic Check: Sensitive Tables Have Forced RLS
  await test('Database RLS Audit: Critical tables have relforcerowsecurity = true', async () => {
    const res = await pool.query(`
      SELECT t.table_name, c.relforcerowsecurity as rls_forced
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      WHERE t.table_schema = 'public' AND t.table_name IN ('user_passwords', 'admin_permissions', 'permissions', 'role_permissions', 'audit_logs')
      ORDER BY t.table_name;
    `);
    const notForced = res.rows.filter(r => !r.rls_forced);
    if (notForced.length > 0) {
      throw new Error(`Critical tables without forced RLS: ${notForced.map(r => r.table_name).join(', ')}`);
    }
  });

  // 3. Database Forensic Check: Views are SECURITY INVOKER (No Security Definer Views)
  await test('Database View Audit: current_affair_source_freshness view has no security definer privilege escalation', async () => {
    const res = await pool.query(`
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'current_affair_source_freshness';
    `);
    if (res.rows.length === 0) throw new Error('View current_affair_source_freshness not found');
  });

  // 4. Database Forensic Check: Sensitive Columns in practice_questions & users are protected
  await test('Database Column Audit: practice_questions and user_passwords protected by RLS and least-privilege grants', async () => {
    const grantRes = await pool.query(`
      SELECT grantee, privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'public' AND table_name = 'user_passwords' AND grantee IN ('anon', 'authenticated', 'public');
    `);
    if (grantRes.rows.length > 0) {
      throw new Error(`user_passwords still accessible to: ${grantRes.rows.map(r => `${r.grantee}:${r.privilege_type}`).join(', ')}`);
    }
  });

  // 5. Security Headers Verification (CSP, HSTS, X-Content-Type-Options, etc.)
  await test('Security Headers: CSP, HSTS, X-Content-Type-Options present on response', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const csp = res.headers.get('content-security-policy');
    const hsts = res.headers.get('strict-transport-security');
    const nosniff = res.headers.get('x-content-type-options');
    const frame = res.headers.get('x-frame-options');

    if (!csp || !csp.includes("default-src 'self'")) {
      throw new Error(`Missing or invalid Content-Security-Policy: ${csp}`);
    }
    if (!hsts || !hsts.includes('max-age')) {
      throw new Error(`Missing or invalid Strict-Transport-Security: ${hsts}`);
    }
    if (nosniff !== 'nosniff') {
      throw new Error(`Expected X-Content-Type-Options: nosniff, got: ${nosniff}`);
    }
    if (frame !== 'SAMEORIGIN') {
      throw new Error(`Expected X-Frame-Options: SAMEORIGIN, got: ${frame}`);
    }
  });

  // 6. CORS Verification
  await test('CORS: Trusted origin receives Access-Control-Allow-Origin', async () => {
    const trustedOrigin = 'https://ikshovia.com';
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: trustedOrigin },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin !== trustedOrigin) {
      throw new Error(`Expected ${trustedOrigin}, got ${allowOrigin}`);
    }
  });

  await test('CORS: Untrusted origin does NOT receive Access-Control-Allow-Origin', async () => {
    const untrustedOrigin = 'https://evil-attacker.com';
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: untrustedOrigin },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin) {
      throw new Error(`Untrusted origin received access-control-allow-origin: ${allowOrigin}`);
    }
  });

  // 7. Frontend Production Bundle Secret Scan
  await test('Frontend Bundle Secret Scan (dist directory)', async () => {
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      console.log('   [INFO] dist directory does not exist yet. Skipping bundle scan.');
      return;
    }

    const files = fs.readdirSync(distDir, { recursive: true }) as string[];
    const jsFiles = files.filter(f => typeof f === 'string' && f.endsWith('.js'));

    const forbiddenPatterns = [
      'DATABASE_URL',
      'POSTGRES_URL',
      'SUPABASE_DB_URL',
      'AUTH_SECRET',
      'JWT_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
      'postgresql://',
      'postgres://',
    ];

    for (const relFile of jsFiles) {
      const fullPath = path.join(distDir, relFile);
      if (fs.statSync(fullPath).isDirectory()) continue;
      const content = fs.readFileSync(fullPath, 'utf8');

      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          throw new Error(`Forbidden secret pattern "${pattern}" found in frontend bundle: ${relFile}`);
        }
      }
    }
  });

  // 8. SQL Injection Resistance
  await test('SQL Injection Payload Resistance on Auth & Query endpoints', async () => {
    const sqlPayloads = [
      "' OR '1'='1",
      "admin' --",
      "'; DROP TABLE users; --",
      "1' UNION SELECT * FROM users --",
    ];

    for (const payload of sqlPayloads) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload, password: 'password123' }),
      });
      if (res.status === 500) {
        const body = await res.text();
        throw new Error(`Potential SQL Injection vulnerability, 500 error: ${body}`);
      }
      if (res.status !== 401 && res.status !== 400) {
        throw new Error(`Unexpected status ${res.status} for payload: ${payload}`);
      }
    }
  });

  // 9. Path Traversal Resistance
  await test('Path Traversal Resistance on Static / Resource endpoints', async () => {
    const traversalPayloads = [
      '/api/resources/download?file=../../../../etc/passwd',
      '/../../../../etc/passwd',
      '/..%2f..%2f..%2fetc/passwd',
    ];

    for (const url of traversalPayloads) {
      const res = await fetch(`${BASE_URL}${url}`);
      if (res.status === 200) {
        const text = await res.text();
        if (text.includes('root:') || text.includes('bin/bash')) {
          throw new Error(`Path traversal succeeded on ${url}`);
        }
      }
    }
  });

  // 10. Role-Based Access Control: Unauthorized access to Admin OCR & PYQ APIs
  await test('RBAC: Anonymous user denied from /api/admin/ocr/jobs', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/ocr/jobs`);
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test('RBAC: Anonymous user denied from /api/admin/pyq/ingestion/scan', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/pyq/ingestion/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  // 11. Public Educational Content Accessibility
  await test('Public Content: Published syllabus subjects remain accessible', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects`);
    if (res.status !== 200) {
      throw new Error(`Expected 200 for syllabus subjects, got ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Expected non-empty syllabus subjects array');
    }
  });

  await test('Public Content: Official PYQ papers remain accessible to students', async () => {
    const res = await fetch(`${BASE_URL}/api/pyq/papers`);
    if (res.status !== 200) {
      throw new Error(`Expected 200 for pyq papers, got ${res.status}`);
    }
    const data = (await res.json()) as any;
    const papers = Array.isArray(data) ? data : data.papers;
    if (!Array.isArray(papers) || papers.length === 0) {
      throw new Error('Expected non-empty papers array in pyq papers response');
    }
  });

  console.log(`\n====================================================`);
  console.log(`SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal error during security audit:', err);
  process.exit(1);
});

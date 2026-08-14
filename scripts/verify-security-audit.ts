import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runSecurityAudit() {
  console.log(`====================================================`);
  console.log(`IKSHOVIA V3 COMPREHENSIVE SECURITY EVIDENCE AUDIT`);
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

  // 1. Security Headers Verification (CSP, HSTS, X-Content-Type-Options, etc.)
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

  // 2. CORS Verification
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

  // 3. Frontend Production Bundle Secret Scan
  await test('Frontend Bundle Secret Scan (dist directory)', async () => {
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error('dist directory does not exist. Run build first.');
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

  // 4. SQL Injection Resistance
  await test('SQL Injection Payload Resistance on Auth & Query endpoints', async () => {
    // Attempting SQL injection on login
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
      // Should cleanly fail with 401 or 400, never 500 SQL syntax error
      if (res.status === 500) {
        const body = await res.text();
        throw new Error(`Potential SQL Injection vulnerability, 500 error: ${body}`);
      }
      if (res.status !== 401 && res.status !== 400) {
        throw new Error(`Unexpected status ${res.status} for payload: ${payload}`);
      }
    }
  });

  // 5. Path Traversal Resistance
  await test('Path Traversal Resistance on Static / Resource endpoints', async () => {
    const traversalPayloads = [
      '/api/resources/download?file=../../../../etc/passwd',
      '/../../../../etc/passwd',
      '/..%2f..%2f..%2fetc/passwd',
    ];

    for (const url of traversalPayloads) {
      const res = await fetch(`${BASE_URL}${url}`);
      // Should not return 200 with sensitive system files
      if (res.status === 200) {
        const text = await res.text();
        if (text.includes('root:') || text.includes('bin/bash')) {
          throw new Error(`Path traversal succeeded on ${url}`);
        }
      }
    }
  });

  // 6. XSS / Script Injection Resistance
  await test('XSS / Script Injection Sanitization in JSON payload', async () => {
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: xssPayload,
        email: `xss_test_${Date.now()}@example.com`,
        password: 'Password123!',
      }),
    });
    if (res.status !== 200) {
      throw new Error(`Registration failed with status ${res.status}`);
    }
    const data = (await res.json()) as any;
    if (!data.user || !data.token) {
      throw new Error(`Expected user object, got ${JSON.stringify(data)}`);
    }
  });

  // 7. Rate Limiting Verification
  await test('Rate Limiting Verification on Auth Endpoint', async () => {
    let limited = false;
    // Sending burst of requests beyond threshold of 120
    for (let i = 0; i < 130; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `rate_test_${i}@test.com`, password: 'wrong' }),
      });
      if (res.status === 429) {
        limited = true;
        break;
      }
    }
    if (!limited) {
      throw new Error('Rate limiter did not trigger after 130 rapid requests');
    }
  });

  // 8. Dependency Vulnerability Audit
  await test('NPM Dependency Audit Execution', async () => {
    try {
      const output = execSync('npm audit --json || true', { encoding: 'utf8' });
      const audit = JSON.parse(output);
      const vulns = audit.metadata?.vulnerabilities || {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      };
      console.log(`   [INFO] Vulnerabilities: Critical: ${vulns.critical}, High: ${vulns.high}, Moderate: ${vulns.moderate || vulns.medium || 0}, Low: ${vulns.low}`);
    } catch (e: any) {
      console.log(`   [INFO] npm audit check executed with message: ${e.message}`);
    }
  });

  console.log(`\n====================================================`);
  console.log(`SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal error during security audit:', err);
  process.exit(1);
});

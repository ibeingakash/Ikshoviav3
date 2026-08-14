import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runApiVerification() {
  console.log('====================================================');
  console.log('IKSHOVIA HTTP API ENDPOINT COMPREHENSIVE SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  // 1. /health
  await check('GET /health returns 200 and status ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (data.status !== 'ok') throw new Error(`Expected status ok, got ${JSON.stringify(data)}`);
  });

  // 2. /api/health
  await check('GET /api/health returns 200 and status ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (data.status !== 'ok') throw new Error(`Expected status ok, got ${JSON.stringify(data)}`);
  });

  // 3. Unauthenticated access to protected endpoints should return 401
  await check('GET /api/learner/model returns 401 without auth token', async () => {
    const res = await fetch(`${BASE_URL}/api/learner/model`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  await check('POST /api/learner/mastery/rate returns 401 without auth token', async () => {
    const res = await fetch(`${BASE_URL}/api/learner/mastery/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId: 'c_fund_rights', confidenceRating: 5 }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 4. Registration
  let registeredToken = '';
  let registeredUserId = '';
  const testEmail = `api_test_${Date.now()}@ikshovia.internal`;

  await check('POST /api/auth/register creates new user account', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API Test Aspirant',
        email: testEmail,
        password: 'AspirantPassword@2026',
      }),
    });
    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Expected 200, got ${res.status}: ${err}`);
    }
    const data = (await res.json()) as any;
    if (!data.success || !data.token || !data.user) {
      throw new Error(`Invalid register response: ${JSON.stringify(data)}`);
    }
    registeredToken = data.token;
    registeredUserId = data.user.id;
  });

  // 5. Login
  let studentToken = '';
  await check('POST /api/auth/login logs in existing student user', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@ikshovia.com',
        password: 'password123',
      }),
    });
    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Expected 200, got ${res.status}: ${err}`);
    }
    const data = (await res.json()) as any;
    if (!data.success || !data.token) {
      throw new Error(`Invalid login response: ${JSON.stringify(data)}`);
    }
    studentToken = data.token;
  });

  // 6. /api/auth/me with Bearer token
  await check('GET /api/auth/me returns authenticated user profile', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.user || data.user.email !== 'student@ikshovia.com') {
      throw new Error(`Expected student@ikshovia.com, got ${JSON.stringify(data)}`);
    }
  });

  // 7. Authenticated learner endpoints
  await check('GET /api/learner/model returns learner model for authenticated user', async () => {
    const res = await fetch(`${BASE_URL}/api/learner/model`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.model || typeof data.model.overallScore !== 'number') {
      throw new Error(`Expected model object with overallScore, got ${JSON.stringify(data)}`);
    }
  });

  await check('GET /api/subjects returns public subject catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected non-empty subjects array, got ${JSON.stringify(data)}`);
    }
  });

  await check('GET /api/current-affairs returns published daily current affairs', async () => {
    const res = await fetch(`${BASE_URL}/api/current-affairs`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected non-empty current affairs articles array, got ${JSON.stringify(data)}`);
    }
  });

  await check('GET /api/mock-tests returns published test series', async () => {
    const res = await fetch(`${BASE_URL}/api/mock-tests`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected non-empty mock tests array, got ${JSON.stringify(data)}`);
    }
  });

  // 8. Authenticated Revision Queue & Analytics with Student Token
  await check('GET /api/revision/queue succeeds with student token', async () => {
    const res = await fetch(`${BASE_URL}/api/revision/queue`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`);
  });

  await check('GET /api/revision/queue returns 401 without auth token', async () => {
    const res = await fetch(`${BASE_URL}/api/revision/queue`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await check('GET /api/analytics succeeds with student token', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.model) throw new Error(`Expected analytics data with model, got ${JSON.stringify(data)}`);
  });

  // 9. Authenticated Goals & Notifications
  await check('GET /api/goals succeeds with registeredToken and returns empty array', async () => {
    const res = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${registeredToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`);
  });

  await check('POST /api/goals creates goal scoped to authenticated user', async () => {
    const res = await fetch(`${BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${registeredToken}`,
      },
      body: JSON.stringify({
        title: 'Master Polity Prelims',
        targetExam: 'UPSC CSE 2026',
        dailyStudyMinutes: 180,
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    if (data.userId !== registeredUserId) throw new Error(`Expected goal userId ${registeredUserId}, got ${data.userId}`);
  });

  // 10. Admin RBAC protection test
  await check('GET /api/admin/metrics returns 403 for student user', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await check('GET /api/superadmin/overview returns 403 for student user', async () => {
    const res = await fetch(`${BASE_URL}/api/superadmin/overview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  console.log(`\n====================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runApiVerification();

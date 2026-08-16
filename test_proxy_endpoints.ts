/**
 * Comprehensive Node/Express Proxy Verification Test Suite
 * Tests all 12 proxy cases for Sources, Resources, and failure modes against the live Node server on port 3000.
 */

interface HttpResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

async function request<T = any>(
  method: string,
  urlPath: string,
  body?: any
): Promise<HttpResponse<T>> {
  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
  const url = `${baseUrl}${urlPath}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'IKSHOVIA-Proxy-Tester/1.0',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text().catch(() => '');
  }

  return {
    status: response.status,
    data,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Starting Node Proxy Test Suite (Port 3000)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  const uniqueSuffix = Date.now().toString(36);
  let createdSourceId = '';
  let createdResourceId = '';

  // 1. GET /api/v1/data/health
  await assertTest('1. GET /api/v1/data/health returns 200 with FastAPI payload', async () => {
    const res = await request('GET', '/api/v1/data/health');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.service !== 'IKSHOVIA Data API') throw new Error(`Unexpected service name: ${res.data?.service}`);
    if (!res.data?.status) throw new Error('Missing status in health response');
  });

  // 2. POST /api/v1/data/sources (Create Source)
  await assertTest('2. POST /api/v1/data/sources creates source (201)', async () => {
    const payload = {
      name: `Proxy Test Source ${uniqueSuffix}`,
      slug: `proxy-src-${uniqueSuffix}`,
      base_url: `https://test-${uniqueSuffix}.gov.in`,
      source_type: 'GOVERNMENT',
      is_active: true,
    };
    const res = await request('POST', '/api/v1/data/sources', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.slug !== payload.slug) throw new Error('Invalid source created payload');
    createdSourceId = res.data.id;
  });

  // 3. GET /api/v1/data/sources (List Sources)
  await assertTest('3. GET /api/v1/data/sources returns list of sources (200)', async () => {
    const res = await request('GET', '/api/v1/data/sources?is_active=true');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected data to be an array of sources');
    const found = res.data.some((s: any) => s.id === createdSourceId);
    if (!found) throw new Error(`Created source ${createdSourceId} not found in listing`);
  });

  // 4. GET /api/v1/data/sources/:source_id
  await assertTest('4. GET /api/v1/data/sources/:source_id returns single source (200)', async () => {
    const res = await request('GET', `/api/v1/data/sources/${createdSourceId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdSourceId) throw new Error(`Expected source id ${createdSourceId}, got ${res.data?.id}`);
  });

  // 5. Source validation error (422)
  await assertTest('5. POST /api/v1/data/sources validation error on invalid URL (422)', async () => {
    const payload = {
      name: 'Invalid URL Source',
      slug: `invalid-src-${uniqueSuffix}`,
      base_url: 'not-a-valid-url',
      source_type: 'GOVERNMENT',
      is_active: true,
    };
    const res = await request('POST', '/api/v1/data/sources', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.detail && !res.data?.error) throw new Error('Expected validation error detail in response');
  });

  // 6. Duplicate Source (409)
  await assertTest('6. POST /api/v1/data/sources duplicate slug returns 409 conflict', async () => {
    const payload = {
      name: `Duplicate Source ${uniqueSuffix}`,
      slug: `proxy-src-${uniqueSuffix}`,
      base_url: `https://test-duplicate-${uniqueSuffix}.gov.in`,
      source_type: 'GOVERNMENT',
      is_active: true,
    };
    const res = await request('POST', '/api/v1/data/sources', payload);
    if (res.status !== 409) throw new Error(`Expected status 409, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 7. POST /api/v1/data/resources (Create Resource)
  await assertTest('7. POST /api/v1/data/resources creates resource (201)', async () => {
    const payload = {
      source_id: createdSourceId,
      title: `Proxy Test Gazette Document ${uniqueSuffix}`,
      url: `https://test-${uniqueSuffix}.gov.in/gazette/doc-${uniqueSuffix}.pdf`,
      resource_type: 'GAZETTE',
      status: 'DISCOVERED',
    };
    const res = await request('POST', '/api/v1/data/resources', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.source_id !== createdSourceId) throw new Error('Invalid resource created payload');
    createdResourceId = res.data.id;
  });

  // 8. GET /api/v1/data/resources (List Resources with Pagination & Meta)
  await assertTest('8. GET /api/v1/data/resources returns paginated response (200)', async () => {
    const res = await request('GET', '/api/v1/data/resources');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data?.success || !Array.isArray(res.data?.data) || !res.data?.pagination) {
      throw new Error(`Invalid paginated structure: ${JSON.stringify(res.data)}`);
    }
  });

  // 9. GET /api/v1/data/resources/:resource_id
  await assertTest('9. GET /api/v1/data/resources/:resource_id returns single resource (200)', async () => {
    const res = await request('GET', `/api/v1/data/resources/${createdResourceId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdResourceId) throw new Error(`Expected resource id ${createdResourceId}, got ${res.data?.id}`);
  });

  // 10. Resource Filtering query parameters
  await assertTest('10. GET /api/v1/data/resources with filtering query params (200)', async () => {
    const query = `source_id=${createdSourceId}&resource_type=GAZETTE&status=DISCOVERED`;
    const res = await request('GET', `/api/v1/data/resources?${query}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data) || res.data.data.length === 0) {
      throw new Error('Expected filtered resource to match query parameters');
    }
    const match = res.data.data.every((r: any) => r.source_id === createdSourceId && r.resource_type === 'GAZETTE');
    if (!match) throw new Error('Resource filter criteria not correctly applied');
  });

  // 11. Resource Pagination query parameters
  await assertTest('11. GET /api/v1/data/resources pagination (page=1&page_size=1)', async () => {
    const res = await request('GET', '/api/v1/data/resources?page=1&page_size=1');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.pagination?.page_size !== 1) throw new Error(`Expected page_size 1, got ${res.data?.pagination?.page_size}`);
    if (res.data?.data?.length > 1) throw new Error('Returned more than 1 item for page_size=1');
  });

  // 12. Duplicate Resource URL (409)
  await assertTest('12. POST /api/v1/data/resources duplicate URL returns 409 conflict', async () => {
    const payload = {
      source_id: createdSourceId,
      title: `Duplicate Resource ${uniqueSuffix}`,
      url: `https://test-${uniqueSuffix}.gov.in/gazette/doc-${uniqueSuffix}.pdf`,
      resource_type: 'GAZETTE',
      status: 'DISCOVERED',
    };
    const res = await request('POST', '/api/v1/data/resources', payload);
    if (res.status !== 409) throw new Error(`Expected status 409, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  let createdDocId = '';

  // 13. POST /api/v1/data/documents (Create Document)
  await assertTest('13. POST /api/v1/data/documents creates document (201)', async () => {
    const payload = {
      resource_id: createdResourceId,
      raw_text: `Full raw text of Gazette Notification ${uniqueSuffix}. The Parliament has enacted the Green Energy Act with landmark provisions on solar and hydrogen infrastructure.`,
      clean_text: `The Parliament has enacted the Green Energy Act with landmark provisions on solar and hydrogen infrastructure ${uniqueSuffix}.`,
      mime_type: 'text/plain',
      language: 'en',
      extraction_status: 'EXTRACTED',
      extraction_method: 'DIRECT_TEXT',
    };
    const res = await request('POST', '/api/v1/data/documents', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.resource_id !== createdResourceId) throw new Error('Invalid document created payload');
    createdDocId = res.data.id;
  });

  // 14. GET /api/v1/data/documents (List Documents)
  await assertTest('14. GET /api/v1/data/documents returns paginated list of documents (200)', async () => {
    const res = await request('GET', `/api/v1/data/documents?resource_id=${createdResourceId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data?.success || !Array.isArray(res.data?.data) || !res.data?.pagination) {
      throw new Error(`Invalid paginated documents response: ${JSON.stringify(res.data)}`);
    }
    const found = res.data.data.some((d: any) => d.id === createdDocId);
    if (!found) throw new Error(`Created doc ${createdDocId} not found in documents listing`);
  });

  // 15. GET /api/v1/data/documents/:document_id
  await assertTest('15. GET /api/v1/data/documents/:document_id returns single document (200)', async () => {
    const res = await request('GET', `/api/v1/data/documents/${createdDocId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdDocId) throw new Error(`Expected document id ${createdDocId}, got ${res.data?.id}`);
    if (!res.data?.clean_text) throw new Error('Missing clean_text in document response');
  });

  // 16. Document validation error (422 or 404 on invalid parent resource)
  await assertTest('16. POST /api/v1/data/documents validation error on missing/invalid resource (404/422)', async () => {
    const payload = {
      resource_id: '00000000-0000-0000-0000-000000000000',
      clean_text: 'Text without valid parent resource',
    };
    const res = await request('POST', '/api/v1/data/documents', payload);
    if (res.status !== 404 && res.status !== 422) {
      throw new Error(`Expected status 404 or 422, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 17. Missing Document (404)
  await assertTest('17. GET /api/v1/data/documents/:document_id missing document returns 404', async () => {
    const res = await request('GET', '/api/v1/data/documents/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  let createdChunkId = '';

  // 18. POST /api/v1/data/chunks (Create Chunk)
  await assertTest('18. POST /api/v1/data/chunks creates chunk (201)', async () => {
    const payload = {
      document_id: createdDocId,
      chunk_index: 0,
      content: `The Green Energy Act mandate solar panels and hydrogen power generation across ${uniqueSuffix}.`,
      heading: 'Green Energy Mandates',
      section: 'Chapter 1',
    };
    const res = await request('POST', '/api/v1/data/chunks', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.document_id !== createdDocId) throw new Error('Invalid chunk created payload');
    createdChunkId = res.data.id;
  });

  // 19. GET /api/v1/data/chunks (List Chunks)
  await assertTest('19. GET /api/v1/data/chunks returns paginated chunks (200)', async () => {
    const res = await request('GET', `/api/v1/data/chunks?document_id=${createdDocId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data?.success || !Array.isArray(res.data?.data) || !res.data?.pagination) {
      throw new Error(`Invalid paginated chunks response: ${JSON.stringify(res.data)}`);
    }
    const found = res.data.data.some((c: any) => c.id === createdChunkId);
    if (!found) throw new Error(`Created chunk ${createdChunkId} not found in chunks listing`);
  });

  // 20. GET /api/v1/data/chunks/:chunk_id
  await assertTest('20. GET /api/v1/data/chunks/:chunk_id returns single chunk (200)', async () => {
    const res = await request('GET', `/api/v1/data/chunks/${createdChunkId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdChunkId) throw new Error(`Expected chunk id ${createdChunkId}, got ${res.data?.id}`);
  });

  // 21. Content/Full-Text Search on Chunks
  await assertTest('21. GET /api/v1/data/chunks with search query parameter (200)', async () => {
    const res = await request('GET', `/api/v1/data/chunks?search=${uniqueSuffix}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data) || res.data.data.length === 0) {
      throw new Error(`Expected at least 1 search result for keyword ${uniqueSuffix}`);
    }
    const match = res.data.data.some((c: any) => c.content.includes(uniqueSuffix));
    if (!match) throw new Error('Search result content does not match keyword');
  });

  // 22. Missing Chunk (404)
  await assertTest('22. GET /api/v1/data/chunks/:chunk_id missing chunk returns 404', async () => {
    const res = await request('GET', '/api/v1/data/chunks/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  let createdJobId = '';

  // 23. POST /api/v1/data/jobs (Create Job)
  await assertTest('23. POST /api/v1/data/jobs creates job (201)', async () => {
    const payload = {
      source_id: createdSourceId,
      resource_id: createdResourceId,
      job_type: 'EXTRACTION',
      meta_info: { test_run: uniqueSuffix },
    };
    const res = await request('POST', '/api/v1/data/jobs', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.job_type !== 'EXTRACTION') throw new Error('Invalid job created payload');
    createdJobId = res.data.id;
  });

  // 24. GET /api/v1/data/jobs (List Jobs)
  await assertTest('24. GET /api/v1/data/jobs returns paginated list of jobs (200)', async () => {
    const res = await request('GET', '/api/v1/data/jobs');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data?.success || !Array.isArray(res.data?.data) || !res.data?.pagination) {
      throw new Error(`Invalid paginated jobs response: ${JSON.stringify(res.data)}`);
    }
    const found = res.data.data.some((j: any) => j.id === createdJobId);
    if (!found) throw new Error(`Created job ${createdJobId} not found in jobs listing`);
  });

  // 25. GET /api/v1/data/jobs/:job_id
  await assertTest('25. GET /api/v1/data/jobs/:job_id returns single job (200)', async () => {
    const res = await request('GET', `/api/v1/data/jobs/${createdJobId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdJobId) throw new Error(`Expected job id ${createdJobId}, got ${res.data?.id}`);
    if (res.data?.status !== 'PENDING') throw new Error(`Expected status PENDING, got ${res.data?.status}`);
  });

  // 26. Job status filtering (?status=PENDING)
  await assertTest('26. GET /api/v1/data/jobs with status filter (200)', async () => {
    const res = await request('GET', '/api/v1/data/jobs?status=PENDING');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data)) throw new Error('Expected data array');
    const allPending = res.data.data.every((j: any) => j.status === 'PENDING');
    if (!allPending) throw new Error('Status filter did not restrict results to PENDING jobs');
  });

  // 27. Job validation error (422 or 400 on invalid payload / foreign key)
  await assertTest('27. POST /api/v1/data/jobs validation error on invalid payload / foreign key (400/422)', async () => {
    const payload = {
      source_id: 'not-a-valid-uuid',
      job_type: 'INVALID_JOB_TYPE',
      meta_info: 'invalid_should_be_object',
    };
    const res = await request('POST', '/api/v1/data/jobs', payload);
    if (res.status !== 400 && res.status !== 422) {
      throw new Error(`Expected status 400 or 422, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 28. Missing Job (404)
  await assertTest('28. GET /api/v1/data/jobs/:job_id missing job returns 404', async () => {
    const res = await request('GET', '/api/v1/data/jobs/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  // 29. PATCH /api/v1/data/jobs/:job_id (Update Progress / Status)
  await assertTest('29. PATCH /api/v1/data/jobs/:job_id updates job status and progress (200)', async () => {
    const updatePayload = {
      status: 'RUNNING',
      progress_percentage: 50,
      items_processed: 5,
      total_items: 10,
    };
    const res = await request('PATCH', `/api/v1/data/jobs/${createdJobId}`, updatePayload);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data?.status !== 'RUNNING' || res.data?.progress_percentage !== 50) {
      throw new Error(`Updated job did not reflect payload changes: ${JSON.stringify(res.data)}`);
    }
  });

  let createdQuestionId = '';

  // 30. POST /api/v1/data/questions (Create Question)
  await assertTest('30. POST /api/v1/data/questions creates question (201)', async () => {
    const payload = {
      resource_id: createdResourceId,
      exam: 'UPSC_CSE',
      year: 2024,
      paper: 'GS1',
      subject: 'POLITY',
      topic: `Judicial Review ${uniqueSuffix}`,
      question_type: 'MCQ',
      question_text: `Which article of the Indian Constitution enshrines the Right to Constitutional Remedies ${uniqueSuffix}?`,
      options: [
        { id: 'A', text: 'Article 14' },
        { id: 'B', text: 'Article 21' },
        { id: 'C', text: 'Article 32' },
        { id: 'D', text: 'Article 44' },
      ],
      correct_answer: 'C',
      explanation: 'Article 32 provides the right to move the Supreme Court by appropriate proceedings for enforcement of fundamental rights.',
      difficulty: 'MEDIUM',
      marks: 2.0,
      negative_marks: 0.66,
      tags: ['Polity', 'Fundamental Rights', 'Article 32'],
      is_pyq: true,
      is_verified: true,
    };
    const res = await request('POST', '/api/v1/data/questions', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.exam !== 'UPSC_CSE') throw new Error('Invalid question created payload');
    createdQuestionId = res.data.id;
  });

  // 31. GET /api/v1/data/questions (List Questions)
  await assertTest('31. GET /api/v1/data/questions returns paginated questions (200)', async () => {
    const res = await request('GET', '/api/v1/data/questions');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data?.success || !Array.isArray(res.data?.data) || !res.data?.pagination) {
      throw new Error(`Invalid paginated questions response: ${JSON.stringify(res.data)}`);
    }
    const found = res.data.data.some((q: any) => q.id === createdQuestionId);
    if (!found) throw new Error(`Created question ${createdQuestionId} not found in questions listing`);
  });

  // 32. GET /api/v1/data/questions/:question_id
  await assertTest('32. GET /api/v1/data/questions/:question_id returns single question (200)', async () => {
    const res = await request('GET', `/api/v1/data/questions/${createdQuestionId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdQuestionId) throw new Error(`Expected question id ${createdQuestionId}, got ${res.data?.id}`);
    if (res.data?.correct_answer !== 'C') throw new Error(`Expected correct_answer 'C', got ${res.data?.correct_answer}`);
  });

  // 33. Question filtering by exam (?exam=UPSC_CSE)
  await assertTest('33. GET /api/v1/data/questions filter by exam (200)', async () => {
    const res = await request('GET', '/api/v1/data/questions?exam=UPSC_CSE');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data)) throw new Error('Expected data array');
    const allMatch = res.data.data.every((q: any) => q.exam === 'UPSC_CSE');
    if (!allMatch) throw new Error('Filter by exam returned mismatched records');
  });

  // 34. Question filtering by year (?year=2024)
  await assertTest('34. GET /api/v1/data/questions filter by year (200)', async () => {
    const res = await request('GET', '/api/v1/data/questions?year=2024');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data)) throw new Error('Expected data array');
    const allMatch = res.data.data.every((q: any) => q.year === 2024);
    if (!allMatch) throw new Error('Filter by year returned mismatched records');
  });

  // 35. Question filtering by subject (?subject=POLITY)
  await assertTest('35. GET /api/v1/data/questions filter by subject (200)', async () => {
    const res = await request('GET', '/api/v1/data/questions?subject=POLITY');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data?.data)) throw new Error('Expected data array');
    const allMatch = res.data.data.every((q: any) => q.subject === 'POLITY');
    if (!allMatch) throw new Error('Filter by subject returned mismatched records');
  });

  // 36. Pagination (?page=1&page_size=1)
  await assertTest('36. GET /api/v1/data/questions pagination (200)', async () => {
    const res = await request('GET', '/api/v1/data/questions?page=1&page_size=1');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.data?.length !== 1 || res.data?.pagination?.page_size !== 1) {
      throw new Error(`Expected page_size 1, got ${JSON.stringify(res.data?.pagination)}`);
    }
  });

  // 37. POST /api/v1/data/questions/bulk (Bulk Questions)
  await assertTest('37. POST /api/v1/data/questions/bulk bulk creates questions (201)', async () => {
    const payload = {
      questions: [
        {
          exam: 'UPSC_CSE',
          year: 2023,
          paper: 'GS1',
          subject: 'ECONOMY',
          topic: `Monetary Policy ${uniqueSuffix}`,
          question_type: 'MCQ',
          question_text: `What is the primary objective of the Monetary Policy Committee in India ${uniqueSuffix}?`,
          options: [
            { id: 'A', text: 'Fiscal Consolidation' },
            { id: 'B', text: 'Price Stability while keeping growth in mind' },
            { id: 'C', text: 'Foreign Exchange Reserve Management' },
            { id: 'D', text: 'Direct Tax Collection' },
          ],
          correct_answer: 'B',
          explanation: 'The MPC is mandated to maintain price stability while keeping in mind the objective of growth.',
          is_pyq: true,
        },
      ],
    };
    const res = await request('POST', '/api/v1/data/questions/bulk', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected array of created questions');
  });

  // 38. Question validation failure (422)
  await assertTest('38. POST /api/v1/data/questions validation failure on missing fields (422)', async () => {
    const payload = {
      exam: 'UPSC_CSE',
      // missing question_text, subject, options, correct_answer etc.
    };
    const res = await request('POST', '/api/v1/data/questions', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 39. Missing Question (404)
  await assertTest('39. GET /api/v1/data/questions/:question_id missing question returns 404', async () => {
    const res = await request('GET', '/api/v1/data/questions/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  let createdTagId = '';
  const uniqueTagSlug = `tag-polity-judiciary-${uniqueSuffix}`;

  // 40. POST /api/v1/data/tags (Create Tag)
  await assertTest('40. POST /api/v1/data/tags creates tag (201)', async () => {
    const payload = {
      name: `Judiciary Reforms ${uniqueSuffix}`,
      slug: uniqueTagSlug,
      category: 'SYLLABUS_SECTION',
      description: 'Supreme court, high courts, and constitutional tribunals.',
    };
    const res = await request('POST', '/api/v1/data/tags', payload);
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.id || res.data?.slug !== uniqueTagSlug) throw new Error('Invalid tag created payload');
    createdTagId = res.data.id;
  });

  // 41. GET /api/v1/data/tags (List Tags)
  await assertTest('41. GET /api/v1/data/tags returns list of tags (200)', async () => {
    const res = await request('GET', '/api/v1/data/tags');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array of tags');
    const found = res.data.some((t: any) => t.id === createdTagId);
    if (!found) throw new Error(`Created tag ${createdTagId} not found in tags listing`);
  });

  // 42. GET /api/v1/data/tags/:tag_id
  await assertTest('42. GET /api/v1/data/tags/:tag_id returns single tag (200)', async () => {
    const res = await request('GET', `/api/v1/data/tags/${createdTagId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.id !== createdTagId) throw new Error(`Expected tag id ${createdTagId}, got ${res.data?.id}`);
    if (res.data?.slug !== uniqueTagSlug) throw new Error(`Expected slug ${uniqueTagSlug}, got ${res.data?.slug}`);
  });

  // 43. Category filtering on tags (?category=SYLLABUS_SECTION)
  await assertTest('43. GET /api/v1/data/tags category filter (200)', async () => {
    const res = await request('GET', '/api/v1/data/tags?category=SYLLABUS_SECTION');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array of tags');
    const allMatch = res.data.every((t: any) => t.category === 'SYLLABUS_SECTION');
    if (!allMatch) throw new Error('Category filter returned mismatched tag category');
  });

  // 44. Tag validation failure or duplicate conflict (422 / 409)
  await assertTest('44. POST /api/v1/data/tags duplicate slug returns 409 conflict', async () => {
    const payload = {
      name: `Duplicate Tag ${uniqueSuffix}`,
      slug: uniqueTagSlug,
      category: 'SYLLABUS_SECTION',
    };
    const res = await request('POST', '/api/v1/data/tags', payload);
    if (res.status !== 409) throw new Error(`Expected status 409, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 45. Missing Tag (404)
  await assertTest('45. GET /api/v1/data/tags/:tag_id missing tag returns 404', async () => {
    const res = await request('GET', '/api/v1/data/tags/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  let ingestionJobId = '';
  let ingestionResourceId = '';
  let ingestionDocumentId = '';
  let ingestionContentHash = '';

  // 46. POST /api/v1/data/ingestion/run (Valid Ingestion Request)
  await assertTest('46. POST /api/v1/data/ingestion/run executes pipeline on valid source (200)', async () => {
    const payload = {
      url: 'https://example.com',
      source_id: createdSourceId,
      chunk_size: 500,
      chunk_overlap: 50,
    };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.success || !res.data?.data) throw new Error(`Expected success response: ${JSON.stringify(res.data)}`);
    
    const runData = res.data.data;
    if (!runData.job_id || runData.status !== 'COMPLETED') {
      throw new Error(`Expected completed job status, got: ${JSON.stringify(runData)}`);
    }
    if (!runData.resource_id || !runData.document_id || runData.chunks_count <= 0) {
      throw new Error(`Expected resource, document, and chunks to be created: ${JSON.stringify(runData)}`);
    }
    ingestionJobId = runData.job_id;
    ingestionResourceId = runData.resource_id;
    ingestionDocumentId = runData.document_id;
    ingestionContentHash = runData.content_hash;
  });

  // 47. Database Chain Verification: Job -> Resource -> Document -> Chunks
  await assertTest('47. Database Chain Verification (Job -> Resource -> Document -> Chunks)', async () => {
    // A. Verify Job
    const jobRes = await request('GET', `/api/v1/data/jobs/${ingestionJobId}`);
    if (jobRes.status !== 200) throw new Error(`Expected status 200 for job fetch, got ${jobRes.status}`);
    if (jobRes.data?.status !== 'COMPLETED' || jobRes.data?.progress_percentage !== 100) {
      throw new Error(`Job state mismatch: ${JSON.stringify(jobRes.data)}`);
    }

    // B. Verify Resource
    const resRes = await request('GET', `/api/v1/data/resources/${ingestionResourceId}`);
    if (resRes.status !== 200) throw new Error(`Expected status 200 for resource fetch, got ${resRes.status}`);
    if (resRes.data?.id !== ingestionResourceId) {
      throw new Error(`Resource id mismatch: ${resRes.data?.id} vs ${ingestionResourceId}`);
    }

    // C. Verify Document
    const docRes = await request('GET', `/api/v1/data/documents/${ingestionDocumentId}`);
    if (docRes.status !== 200) throw new Error(`Expected status 200 for document fetch, got ${docRes.status}`);
    if (docRes.data?.resource_id !== ingestionResourceId) {
      throw new Error(`Document parent resource mismatch: ${docRes.data?.resource_id} vs ${ingestionResourceId}`);
    }

    // D. Verify Chunks
    const chunkRes = await request('GET', `/api/v1/data/chunks?document_id=${ingestionDocumentId}`);
    if (chunkRes.status !== 200) throw new Error(`Expected status 200 for chunks fetch, got ${chunkRes.status}`);
    if (!Array.isArray(chunkRes.data?.data) || chunkRes.data.data.length === 0) {
      throw new Error(`Expected chunks linked to document, got: ${JSON.stringify(chunkRes.data)}`);
    }
  });

  // 48. POST /api/v1/data/ingestion/run (Duplicate / Content Hash Detection)
  await assertTest('48. POST /api/v1/data/ingestion/run detects duplicate content (200)', async () => {
    const payload = {
      url: 'https://example.com',
      source_id: createdSourceId,
    };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.success || !res.data?.data?.is_duplicate) {
      throw new Error(`Expected is_duplicate to be true, got: ${JSON.stringify(res.data)}`);
    }
    if (res.data?.data?.content_hash !== ingestionContentHash) {
      throw new Error(`Expected matching content_hash ${ingestionContentHash}, got ${res.data?.data?.content_hash}`);
    }
  });

  // 49. POST /api/v1/data/ingestion/run (Invalid URL format)
  await assertTest('49. POST /api/v1/data/ingestion/run rejects invalid URL format (422)', async () => {
    const payload = { url: 'not-a-valid-url-format' };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 50. POST /api/v1/data/ingestion/run (Unsupported Scheme rejection)
  await assertTest('50. POST /api/v1/data/ingestion/run rejects unsupported file:// scheme (422)', async () => {
    const payload = { url: 'file:///etc/passwd' };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 51. POST /api/v1/data/ingestion/run (Localhost / Loopback rejection)
  await assertTest('51. POST /api/v1/data/ingestion/run rejects localhost loopback address (422)', async () => {
    const payload = { url: 'http://localhost:3000/secret' };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 52. POST /api/v1/data/ingestion/run (Private IP rejection)
  await assertTest('52. POST /api/v1/data/ingestion/run rejects private RFC1918 IP address (422)', async () => {
    const payload = { url: 'http://192.168.1.1/admin' };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 53. POST /api/v1/data/ingestion/run (Malformed request body)
  await assertTest('53. POST /api/v1/data/ingestion/run malformed request body (422)', async () => {
    const payload = {}; // missing url field
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 422) throw new Error(`Expected status 422, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  let failedJobId = '';

  // 54. POST /api/v1/data/ingestion/run (Graceful Failure on Unreachable Public URL)
  await assertTest('54. POST /api/v1/data/ingestion/run handles network fetch failure gracefully (200 with success=false)', async () => {
    const payload = { url: 'https://nonexistent-domain-ikshovia-safe-test-999.org/article' };
    const res = await request('POST', '/api/v1/data/ingestion/run', payload);
    if (res.status !== 200) throw new Error(`Expected status 200 with failure wrapper, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data?.success !== false || res.data?.data?.status !== 'FAILED') {
      throw new Error(`Expected success=false and status=FAILED, got: ${JSON.stringify(res.data)}`);
    }
    if (!Array.isArray(res.data?.data?.errors) || res.data.data.errors.length === 0) {
      throw new Error('Expected errors array on failure');
    }
    failedJobId = res.data.data.job_id;
  });

  // 55. Database Verification for Failed Ingestion Job
  await assertTest('55. Database Verification for Failed Ingestion Job (Status: FAILED)', async () => {
    const res = await request('GET', `/api/v1/data/jobs/${failedJobId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data?.status !== 'FAILED') {
      throw new Error(`Expected job status FAILED, got: ${res.data?.status}`);
    }
    if (res.data?.error_message && res.data.error_message.includes('/root/')) {
      throw new Error('Error message leaked sensitive system paths');
    }
  });

  // 56. GET /api/v1/data/search (Knowledge Search Validation)
  await assertTest('56. GET /api/v1/data/search rejects empty/missing queries with 422', async () => {
    const resMissing = await request('GET', '/api/v1/data/search');
    if (resMissing.status !== 422) throw new Error(`Expected 422 for missing query, got ${resMissing.status}`);

    const resEmpty = await request('GET', '/api/v1/data/search?q=');
    if (resEmpty.status !== 422) throw new Error(`Expected 422 for empty query, got ${resEmpty.status}`);
  });

  // 57. GET /api/v1/data/search (Basic Knowledge Search & Pagination)
  await assertTest('57. GET /api/v1/data/search executes query and returns structured response', async () => {
    const res = await request('GET', '/api/v1/data/search?q=India&page=1&page_size=10');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data?.success !== true) throw new Error(`Expected success=true, got ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data?.results)) throw new Error('Expected results to be an array');
    if (!res.data?.pagination || typeof res.data.pagination.total !== 'number') {
      throw new Error('Expected pagination object with total count');
    }
  });

  // 58. POST /api/v1/data/ai/tutor (Validation of empty message)
  await assertTest('58. POST /api/v1/data/ai/tutor rejects empty/missing message with 422', async () => {
    const resEmpty = await request('POST', '/api/v1/data/ai/tutor', { message: '   ' });
    if (resEmpty.status !== 422 && resEmpty.status !== 400) {
      throw new Error(`Expected 422/400 for empty message, got ${resEmpty.status}`);
    }
  });

  // 59. POST /api/v1/data/ai/tutor (AI Tutor Query & Grounding Execution)
  await assertTest('59. POST /api/v1/data/ai/tutor processes academic question and returns structured grounding', async () => {
    const res = await request('POST', '/api/v1/data/ai/tutor', {
      message: 'Explain the Basic Structure Doctrine in Indian Constitutional Law',
      exam: 'UPSC CSE',
      subject: 'Polity',
      provider: 'mock',
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data?.success !== true) throw new Error(`Expected success=true, got ${JSON.stringify(res.data)}`);
    if (typeof res.data?.answer !== 'string' || !res.data?.answer) {
      throw new Error('Expected valid non-empty answer string');
    }
    if (!res.data?.knowledge || typeof res.data?.knowledge?.used !== 'boolean') {
      throw new Error('Expected knowledge metadata object in response');
    }
    if (!res.data?.ai || typeof res.data?.ai?.used !== 'boolean') {
      throw new Error('Expected ai metadata object in response');
    }
  });



  console.log('\n====================================================');
  console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

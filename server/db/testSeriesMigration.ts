import pool from './pool.js';

export async function runTestSeriesMigration(): Promise<void> {
  console.log('[Test Series Migration] Ensuring database schema and seeds...');

  // 1. Create test_series table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.test_series (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      exam_id TEXT,
      exam_cycle TEXT,
      target_exam TEXT NOT NULL DEFAULT 'BPSC',
      category TEXT DEFAULT 'PRELIMS',
      language TEXT DEFAULT 'English / Hindi',
      total_tests INTEGER DEFAULT 0,
      published_test_count INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      mrp NUMERIC(10,2) DEFAULT 0,
      sale_price NUMERIC(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      is_free BOOLEAN DEFAULT false,
      preview_test_count INTEGER DEFAULT 0,
      cover_image TEXT,
      status TEXT DEFAULT 'DRAFT',
      visibility TEXT DEFAULT 'PUBLIC',
      display_order INTEGER DEFAULT 0,
      duration_days INTEGER DEFAULT 180,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Create test_series_tests table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.test_series_tests (
      id TEXT PRIMARY KEY,
      test_series_id TEXT NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
      mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      is_free_preview BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'PUBLISHED',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_test_series_mock UNIQUE (test_series_id, mock_test_id),
      CONSTRAINT uq_test_series_seq UNIQUE (test_series_id, sequence_number)
    );
  `);

  // 3. Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_test_series_exam_id ON public.test_series(exam_id);
    CREATE INDEX IF NOT EXISTS idx_test_series_exam_cycle ON public.test_series(exam_cycle);
    CREATE INDEX IF NOT EXISTS idx_test_series_target_exam ON public.test_series(target_exam);
    CREATE INDEX IF NOT EXISTS idx_test_series_status ON public.test_series(status);
    CREATE INDEX IF NOT EXISTS idx_test_series_visibility ON public.test_series(visibility);
    CREATE INDEX IF NOT EXISTS idx_test_series_tests_series_id ON public.test_series_tests(test_series_id);
    CREATE INDEX IF NOT EXISTS idx_test_series_tests_mock_id ON public.test_series_tests(mock_test_id);
  `);

  // 4. Update entitlements, payments, payment_orders for product_type and test_series_id
  await pool.query(`
    ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'COURSE';
    ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS product_id TEXT;
    ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS test_series_id TEXT;
    ALTER TABLE public.entitlements ALTER COLUMN course_id DROP NOT NULL;

    ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'COURSE';
    ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS product_id TEXT;
    ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS test_series_id TEXT;
    ALTER TABLE public.payment_orders ALTER COLUMN course_id DROP NOT NULL;

    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'COURSE';
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS product_id TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS test_series_id TEXT;
    ALTER TABLE public.payments ALTER COLUMN course_id DROP NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_entitlements_test_series_id ON public.entitlements(test_series_id);
    CREATE INDEX IF NOT EXISTS idx_payments_test_series_id ON public.payments(test_series_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_test_series_id ON public.payment_orders(test_series_id);
  `);

  // 5. Seed default exams if empty
  const examCheck = await pool.query('SELECT COUNT(*) FROM public.exams');
  if (parseInt(examCheck.rows[0].count, 10) === 0) {
    await pool.query(`
      INSERT INTO public.exams (id, name, code, description, target_year) VALUES
      ('exam_bpsc', 'BPSC (Bihar Public Service Commission)', 'BPSC', 'Bihar Combined Competitive Examination (CCE) Prelims & Mains', 2026),
      ('exam_upsc', 'UPSC (Union Public Service Commission)', 'UPSC', 'Civil Services Examination (CSE) Prelims & Mains', 2027),
      ('exam_aedo', 'AEDO (Assistant Extension Officer)', 'AEDO', 'Assistant Extension & Development Officer State Examination', 2026)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('[Test Series Migration] Seeded default exams.');
  }

  // 6. Seed initial test series
  const seriesData = [
    {
      id: 'ts_bpsc_72_prelims',
      slug: 'bpsc-72nd-prelims-test-series',
      name: 'BPSC 72nd Combined Competitive (CCE) Prelims All-India Test Series',
      description: 'Comprehensive 72nd BPSC Prelims simulation series covering General Studies, Bihar Special dynamics, History, Geography, and current affairs mapped strictly to official commission negative marking standards.',
      exam_id: 'exam_bpsc',
      exam_cycle: '72nd CCE',
      target_exam: 'BPSC',
      category: 'PRELIMS',
      language: 'English / Hindi',
      mrp: 1999,
      sale_price: 799,
      is_free: false,
      preview_test_count: 1,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      display_order: 1,
      duration_days: 180,
      testIds: [
        { testId: 'mock_job_ocr_1788358847218_ry3f', isPreview: true },
        { testId: 'mock_job_ocr_1788459036188_thp4', isPreview: false },
        { testId: 'mock_job_ocr_1788495834512_cj3g', isPreview: false },
        { testId: 'mock_ocr_1788778886590_a33aa5', isPreview: false },
        { testId: 'mock_job_ocr_1788803600640_vjfe', isPreview: false },
        { testId: 'mock_job_ocr_1788804136661_9s2x', isPreview: false },
        { testId: 'mock_job_ocr_1788804517419_m8wd', isPreview: false },
        { testId: 'mock_job_ocr_1788853775273_ipta', isPreview: false },
        { testId: 'mock_job_ocr_1788854092974_5snb', isPreview: false },
        { testId: 'mock_job_ocr_1788803184097_b9lv', isPreview: false },
        { testId: 'mock_ocr_1788777685887_b53b84', isPreview: false }
      ]
    },
    {
      id: 'ts_upsc_cse_prelims',
      slug: 'upsc-cse-prelims-test-series',
      name: 'UPSC CSE Prelims Comprehensive All-India Test Series',
      description: 'Standard UPSC Civil Services Prelims mock test program featuring General Studies Paper-I simulations, sectional concept tests, and multi-statement analytical drills.',
      exam_id: 'exam_upsc',
      exam_cycle: 'CSE 2027',
      target_exam: 'UPSC',
      category: 'PRELIMS',
      language: 'English / Hindi',
      mrp: 2499,
      sale_price: 999,
      is_free: false,
      preview_test_count: 1,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      display_order: 2,
      duration_days: 180,
      testIds: [
        { testId: 'mock_full_upsc', isPreview: true },
        { testId: 'mock_subj_polity', isPreview: false },
        { testId: 'mock_quick_1', isPreview: false },
        { testId: 'mock_custom_1786835299036_8rmr', isPreview: false }
      ]
    },
    {
      id: 'ts_aedo_2026',
      slug: 'aedo-state-prelims-test-series',
      name: 'AEDO 2026 Extension & Development Officer Test Series',
      description: 'Specialized preparation test series for Assistant Extension & Development Officer recruitment examinations covering general studies, rural dynamics, and quantitative aptitude.',
      exam_id: 'exam_aedo',
      exam_cycle: 'AEDO 2026',
      target_exam: 'AEDO',
      category: 'SECTIONAL',
      language: 'English / Hindi',
      mrp: 999,
      sale_price: 399,
      is_free: false,
      preview_test_count: 1,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      display_order: 3,
      duration_days: 180,
      testIds: [
        { testId: 'mock_admin_bpsc_2026_prelims', isPreview: true },
        { testId: 'mock_admin_bpsc_2026_flt_2', isPreview: false }
      ]
    }
  ];

  for (const s of seriesData) {
    await pool.query(`
      INSERT INTO public.test_series (
        id, slug, name, description, exam_id, exam_cycle, target_exam,
        category, language, mrp, sale_price, is_free, preview_test_count,
        status, visibility, display_order, duration_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        exam_id = EXCLUDED.exam_id,
        exam_cycle = EXCLUDED.exam_cycle,
        target_exam = EXCLUDED.target_exam,
        category = EXCLUDED.category,
        language = EXCLUDED.language,
        mrp = EXCLUDED.mrp,
        sale_price = EXCLUDED.sale_price,
        is_free = EXCLUDED.is_free,
        status = EXCLUDED.status,
        visibility = EXCLUDED.visibility,
        display_order = EXCLUDED.display_order;
    `, [
      s.id, s.slug, s.name, s.description, s.exam_id, s.exam_cycle, s.target_exam,
      s.category, s.language, s.mrp, s.sale_price, s.is_free, s.preview_test_count,
      s.status, s.visibility, s.display_order, s.duration_days
    ]);

    let seq = 1;
    for (const t of s.testIds) {
      const linkId = 'tst_' + s.id + '_' + t.testId;
      await pool.query(`
        INSERT INTO public.test_series_tests (
          id, test_series_id, mock_test_id, sequence_number, is_free_preview, status
        ) VALUES ($1, $2, $3, $4, $5, 'PUBLISHED')
        ON CONFLICT (test_series_id, mock_test_id) DO UPDATE SET
          sequence_number = EXCLUDED.sequence_number,
          is_free_preview = EXCLUDED.is_free_preview;
      `, [linkId, s.id, t.testId, seq++, t.isPreview]);
    }

    // Recalculate stats
    const statsRes = await pool.query(`
      SELECT 
        COUNT(tst.id) as total_tests,
        COALESCE(SUM(CASE WHEN mt.is_published = true AND (mt.is_deleted IS NULL OR mt.is_deleted = false) THEN 1 ELSE 0 END), 0) as published_test_count,
        COALESCE(SUM(mt.total_questions), 0) as total_questions
      FROM public.test_series_tests tst
      JOIN public.mock_tests mt ON tst.mock_test_id = mt.id
      WHERE tst.test_series_id = $1
    `, [s.id]);

    const stats = statsRes.rows[0];
    await pool.query(`
      UPDATE public.test_series
      SET total_tests = $2, published_test_count = $3, total_questions = $4, updated_at = NOW()
      WHERE id = $1;
    `, [s.id, stats.total_tests, stats.published_test_count, stats.total_questions]);

    console.log(`[Test Series Migration] Updated ${s.name}: ${stats.total_tests} tests, ${stats.total_questions} questions.`);
  }

  console.log('[Test Series Migration] Successfully completed test series setup!');
}

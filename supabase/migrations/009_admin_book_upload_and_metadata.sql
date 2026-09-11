-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 009:
-- ADMIN BOOK UPLOAD, RESOURCE INGESTION & ENRICHED METADATA
-- ====================================================================

-- 1. Add canonical Book & Resource metadata columns to public.resources
ALTER TABLE public.resources 
  ADD COLUMN IF NOT EXISTS edition TEXT,
  ADD COLUMN IF NOT EXISTS publication_year INT,
  ADD COLUMN IF NOT EXISTS publisher TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'REQUIRES_REVIEW',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT,
  ADD COLUMN IF NOT EXISTS source_attribution TEXT,
  ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'GOOGLE_DRIVE',
  ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 2. Indexes for canonical queries, searching, and duplicate prevention
CREATE INDEX IF NOT EXISTS idx_resources_type_status ON public.resources(resource_type, status);
CREATE INDEX IF NOT EXISTS idx_resources_exam_subject ON public.resources(exam, subject);
CREATE INDEX IF NOT EXISTS idx_resources_title_lower ON public.resources(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_resources_file_hash ON public.resources(file_hash);

-- 3. Seed/Enrich canonical books with authentic publication metadata
UPDATE public.resources
SET 
  edition = '6th Edition',
  publication_year = 2021,
  publisher = 'McGraw Hill Education',
  language = 'English',
  license_status = 'LICENSED',
  tags = 'Polity, Constitution, Fundamental Rights, Supreme Court, Laxmikanth, UPSC CSE, Prelims, Mains Paper II',
  source_attribution = 'McGraw Hill Education (India) Private Limited',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_polity_laxmikanth';

UPDATE public.resources
SET 
  edition = 'Revised Edition',
  publication_year = 2020,
  publisher = 'Orient Blackswan',
  language = 'English',
  license_status = 'LICENSED',
  tags = 'History, Freedom Struggle, 1857, Modern India, Bipin Chandra, UPSC CSE, Prelims Core',
  source_attribution = 'Orient Blackswan / Bipin Chandra Historical Foundation',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_modern_history_chandra';

UPDATE public.resources
SET 
  edition = '14th Edition',
  publication_year = 2022,
  publisher = 'McGraw Hill Education',
  language = 'English',
  license_status = 'LICENSED',
  tags = 'Economy, Macroeconomics, Fiscal Policy, Inflation, RBI, Ramesh Singh, UPSC CSE, Mains Paper III',
  source_attribution = 'McGraw Hill Education (India)',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_economy_ramesh_singh';

UPDATE public.resources
SET 
  edition = '8th Edition',
  publication_year = 2021,
  publisher = 'Shankar IAS Academy Publications',
  language = 'English',
  license_status = 'LICENSED',
  tags = 'Environment, Ecology, Biodiversity, Climate Change, Protected Areas, Shankar IAS, UPSC CSE',
  source_attribution = 'Shankar IAS Academy Publications',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_environment_shankar';

UPDATE public.resources
SET 
  edition = 'Latest Comprehensive Edition',
  publication_year = 2023,
  publisher = 'Prabhat Prakashan',
  language = 'English/Hindi',
  license_status = 'LICENSED',
  tags = 'BPSC, Bihar Special, Bihar History, Champaran Satyagraha, Bihar Geography, Manish Rannjan',
  source_attribution = 'Prabhat Prakashan / Dr. Manish Rannjan IAS',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_bpsc_bihar_special';

UPDATE public.resources
SET 
  edition = 'Official Gazette Edition 2025',
  publication_year = 2025,
  publisher = 'Union Public Service Commission',
  language = 'English/Hindi',
  license_status = 'PUBLIC_DOMAIN',
  resource_type = 'SYLLABUS',
  tags = 'UPSC CSE, Official Syllabus, Examination Scheme, Prelims, Mains, Optional Subjects',
  source_attribution = 'UPSC DOPT Official Gazette',
  storage_provider = 'GOOGLE_DRIVE'
WHERE id = 'res_upsc_official_syllabus';

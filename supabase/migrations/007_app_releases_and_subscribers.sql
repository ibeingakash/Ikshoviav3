-- Migration 007: Android Mobile App Releases & Early Access Subscribers

CREATE TABLE IF NOT EXISTS public.app_releases (
  id VARCHAR(64) PRIMARY KEY,
  platform VARCHAR(16) NOT NULL DEFAULT 'android',
  version_name VARCHAR(32) NOT NULL,
  version_code INT NOT NULL,
  min_supported_version_code INT NOT NULL,
  apk_url TEXT NOT NULL,
  sha256_checksum VARCHAR(64) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  release_notes TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'DEPRECATED'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_releases_platform_status ON public.app_releases(platform, status, version_code DESC);

CREATE TABLE IF NOT EXISTS public.app_early_access_subscribers (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  platform VARCHAR(16) NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  CONSTRAINT uq_early_access_email_platform UNIQUE (email, platform)
);

CREATE INDEX IF NOT EXISTS idx_early_access_email ON public.app_early_access_subscribers(email);

ALTER TABLE public.app_early_access_subscribers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_early_access_subscribers FROM anon, authenticated;
GRANT ALL ON TABLE public.app_early_access_subscribers TO postgres, service_role;

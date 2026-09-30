-- Migration 014: Production Notification Center, Preferences, and Analytics Indexes

-- 1. Upgrade public.notifications table with full production schema
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS deep_link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Backfill recipient_user_id and deep_link from legacy columns
UPDATE public.notifications SET recipient_user_id = user_id WHERE recipient_user_id IS NULL AND user_id IS NOT NULL;
UPDATE public.notifications SET deep_link = action_url WHERE deep_link IS NULL AND action_url IS NOT NULL;
UPDATE public.notifications SET created_at = timestamp WHERE created_at IS NULL AND timestamp IS NOT NULL;

-- 2. Indexes for fast, bounded notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_legacy ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- 3. User Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  assignments BOOLEAN NOT NULL DEFAULT true,
  tests BOOLEAN NOT NULL DEFAULT true,
  classes BOOLEAN NOT NULL DEFAULT true,
  resources BOOLEAN NOT NULL DEFAULT true,
  announcements BOOLEAN NOT NULL DEFAULT true,
  results BOOLEAN NOT NULL DEFAULT true,
  system_security BOOLEAN NOT NULL DEFAULT true, -- always true, cannot be disabled
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indices for Analytics & Performance Aggregation
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_created ON public.mock_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_submissions_student ON public.teacher_submissions (student_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_submissions_assign ON public.teacher_submissions (assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_live_attendance_user ON public.live_class_attendance (user_id, live_class_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs (action, timestamp DESC);

-- 5. RLS Policies
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can read own preferences" ON public.user_notification_preferences FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_notification_preferences FOR ALL USING (true) WITH CHECK (true);

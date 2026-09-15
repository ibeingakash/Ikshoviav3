-- 010_live_classroom_schema.sql
-- Production-Ready IKSHOVIA Live Classroom Schema

-- 1. Live Classes Table
CREATE TABLE IF NOT EXISTS public.live_classes (
  id TEXT PRIMARY KEY,
  meeting_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  exam TEXT NOT NULL DEFAULT 'ALL', -- 'UPSC' | 'BPSC' | 'ALL'
  topic TEXT,
  teacher_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL,
  teacher_avatar TEXT,
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  scheduled_start_iso TIMESTAMPTZ NOT NULL,
  expected_duration_minutes INT NOT NULL DEFAULT 60,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  max_participants INT DEFAULT 100,
  meeting_type TEXT NOT NULL DEFAULT 'LECTURE', -- 'LECTURE' | 'DOUBT_CLEARING' | 'ESSAY_EVALUATION' | 'MENTORSHIP' | 'ANSWER_WRITING'
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  recording_enabled BOOLEAN DEFAULT TRUE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  student_mic_allowed BOOLEAN DEFAULT TRUE,
  student_camera_allowed BOOLEAN DEFAULT TRUE,
  waiting_room_enabled BOOLEAN DEFAULT FALSE,
  screen_sharing_allowed BOOLEAN DEFAULT TRUE,
  file_sharing_allowed BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  target_course_id TEXT,
  target_test_series_id TEXT,
  linked_mock_test_id TEXT,
  linked_mains_task_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_classes_status ON public.live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_meeting_id ON public.live_classes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled_start ON public.live_classes(scheduled_start_iso);
CREATE INDEX IF NOT EXISTS idx_live_classes_exam ON public.live_classes(exam);
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_id ON public.live_classes(teacher_id);

-- 2. Live Class Participants Table
CREATE TABLE IF NOT EXISTS public.live_class_participants (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT' | 'TEACHER' | 'ADMIN'
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_registered BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  is_admitted BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  camera_on BOOLEAN DEFAULT FALSE,
  hand_raised BOOLEAN DEFAULT FALSE,
  hand_raised_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'REGISTERED', -- 'REGISTERED' | 'WAITING' | 'JOINED' | 'LEFT' | 'REMOVED'
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT uq_live_class_participant UNIQUE (live_class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_participants_class_user ON public.live_class_participants(live_class_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_status ON public.live_class_participants(status);

-- 3. Live Class Attendance Records
CREATE TABLE IF NOT EXISTS public.live_class_attendance (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  join_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leave_time TIMESTAMPTZ,
  total_duration_seconds INT DEFAULT 0,
  rejoin_count INT DEFAULT 0,
  attendance_status TEXT NOT NULL DEFAULT 'PRESENT', -- 'PRESENT' | 'LATE' | 'LEFT_EARLY' | 'ABSENT'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_attendance_class_id ON public.live_class_attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_user_id ON public.live_class_attendance(user_id);

-- 4. Live Class Real-Time Messages
CREATE TABLE IF NOT EXISTS public.live_class_messages (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'STUDENT',
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_messages_class ON public.live_class_messages(live_class_id, created_at);

-- 5. Live Class Q&A Questions
CREATE TABLE IF NOT EXISTS public.live_class_questions (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  question TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  upvoted_by JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'ANSWERING' | 'ANSWERED' | 'DISMISSED'
  is_pinned BOOLEAN DEFAULT FALSE,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_questions_class ON public.live_class_questions(live_class_id, status);

-- 6. Live Class Files and Handouts
CREATE TABLE IF NOT EXISTS public.live_class_files (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_files_class ON public.live_class_files(live_class_id);

-- 7. Live Class Recordings
CREATE TABLE IF NOT EXISTS public.live_class_recordings (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  recording_url TEXT NOT NULL,
  duration_seconds INT DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  transcript TEXT,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  download_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_recordings_class ON public.live_class_recordings(live_class_id);

-- 8. Live Class Polls
CREATE TABLE IF NOT EXISTS public.live_class_polls (
  id TEXT PRIMARY KEY,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  duration_seconds INT DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'CLOSED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_live_polls_class ON public.live_class_polls(live_class_id, status);

-- 9. Live Class Poll Responses
CREATE TABLE IF NOT EXISTS public.live_class_poll_responses (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES public.live_class_polls(id) ON DELETE CASCADE,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_live_poll_response UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_poll_responses_poll ON public.live_class_poll_responses(poll_id);

-- 10. Direct 1:1 Video Calls
CREATE TABLE IF NOT EXISTS public.direct_video_calls (
  id TEXT PRIMARY KEY,
  caller_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caller_name TEXT NOT NULL,
  caller_avatar TEXT,
  callee_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  callee_name TEXT NOT NULL,
  callee_avatar TEXT,
  room_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'RINGING', -- 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'ENDED' | 'MISSED'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_calls_users ON public.direct_video_calls(caller_id, callee_id, status);

-- Ensure user columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migration 013: Teacher Workspace and Safe User Removal

-- 1. Ensure user status and role constraint allows TEACHER
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'));

CREATE INDEX IF NOT EXISTS idx_users_status_role ON public.users(status, role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));

-- 2. Teacher Classes
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  exam TEXT NOT NULL DEFAULT 'UPSC',
  subject TEXT NOT NULL,
  topic TEXT,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  schedule TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_status ON public.teacher_classes(status);

-- 3. Teacher Class Students (Enrolled Learners)
CREATE TABLE IF NOT EXISTS public.teacher_class_students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ENROLLED', -- ENROLLED, DROPPED
  CONSTRAINT uq_teacher_class_student UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_class_students_class ON public.teacher_class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_students_student ON public.teacher_class_students(student_id);

-- 4. Teacher Assignments
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.teacher_classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  topic TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  total_marks NUMERIC DEFAULT 100,
  duration_minutes INTEGER,
  questions JSONB DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, OPEN, CLOSED, ARCHIVED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON public.teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_status ON public.teacher_assignments(status);

-- 5. Teacher Submissions
CREATE TABLE IF NOT EXISTS public.teacher_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES public.teacher_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.teacher_classes(id) ON DELETE SET NULL,
  answers JSONB DEFAULT '[]'::JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, LATE, EVALUATED
  marks_obtained NUMERIC,
  feedback TEXT,
  strengths TEXT,
  weaknesses TEXT,
  suggestions TEXT,
  evaluated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  evaluated_at TIMESTAMPTZ,
  evaluation_history JSONB DEFAULT '[]'::JSONB,
  CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_submissions_assignment ON public.teacher_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_teacher_submissions_student ON public.teacher_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_submissions_status ON public.teacher_submissions(status);

-- 6. Teacher Quizzes (Assign canonical questions with TEACHER_CREATED origin)
CREATE TABLE IF NOT EXISTS public.teacher_quizzes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.teacher_classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  question_ids JSONB DEFAULT '[]'::JSONB,
  origin TEXT NOT NULL DEFAULT 'TEACHER_CREATED', -- TEACHER_CREATED, OFFICIAL_COMMISSION, IKSHOVIA_CREATED
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, CLOSED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_teacher ON public.teacher_quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_class ON public.teacher_quizzes(class_id);

-- 7. Teacher Announcements
CREATE TABLE IF NOT EXISTS public.teacher_announcements (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_student_ids JSONB DEFAULT '[]'::JSONB,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_announcements_teacher ON public.teacher_announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_announcements_class ON public.teacher_announcements(class_id);

-- Enable RLS on all new tables
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_announcements ENABLE ROW LEVEL SECURITY;

-- Permissive service role & public policies for authenticated roles
DROP POLICY IF EXISTS "Teacher classes read policy" ON public.teacher_classes;
CREATE POLICY "Teacher classes read policy" ON public.teacher_classes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher classes write policy" ON public.teacher_classes;
CREATE POLICY "Teacher classes write policy" ON public.teacher_classes
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher class students read policy" ON public.teacher_class_students;
CREATE POLICY "Teacher class students read policy" ON public.teacher_class_students
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher class students write policy" ON public.teacher_class_students;
CREATE POLICY "Teacher class students write policy" ON public.teacher_class_students
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher assignments read policy" ON public.teacher_assignments;
CREATE POLICY "Teacher assignments read policy" ON public.teacher_assignments
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher assignments write policy" ON public.teacher_assignments;
CREATE POLICY "Teacher assignments write policy" ON public.teacher_assignments
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher submissions read policy" ON public.teacher_submissions;
CREATE POLICY "Teacher submissions read policy" ON public.teacher_submissions
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher submissions write policy" ON public.teacher_submissions;
CREATE POLICY "Teacher submissions write policy" ON public.teacher_submissions
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher quizzes read policy" ON public.teacher_quizzes;
CREATE POLICY "Teacher quizzes read policy" ON public.teacher_quizzes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher quizzes write policy" ON public.teacher_quizzes;
CREATE POLICY "Teacher quizzes write policy" ON public.teacher_quizzes
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher announcements read policy" ON public.teacher_announcements;
CREATE POLICY "Teacher announcements read policy" ON public.teacher_announcements
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Teacher announcements write policy" ON public.teacher_announcements;
CREATE POLICY "Teacher announcements write policy" ON public.teacher_announcements
  FOR ALL TO public USING (true) WITH CHECK (true);

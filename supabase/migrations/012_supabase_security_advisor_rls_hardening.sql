-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 012
-- SUPABASE SECURITY ADVISOR CRITICAL RLS HARDENING FOR REMAINING EXPOSED TABLES
-- ====================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL 23 TARGET TABLES
ALTER TABLE public.live_class_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_note_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ypt_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_note_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ypt_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ypt_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_note_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_resources_tombstone ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. LEAST-PRIVILEGE RLS POLICIES PER TABLE CLASSIFICATION
-- --------------------------------------------------------------------

-- Table 1: live_class_recordings (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_recordings_select ON public.live_class_recordings;
DROP POLICY IF EXISTS p_live_class_recordings_insert ON public.live_class_recordings;
DROP POLICY IF EXISTS p_live_class_recordings_update ON public.live_class_recordings;
DROP POLICY IF EXISTS p_live_class_recordings_delete ON public.live_class_recordings;

CREATE POLICY p_live_class_recordings_select ON public.live_class_recordings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_recordings_insert ON public.live_class_recordings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_live_class_recordings_update ON public.live_class_recordings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_live_class_recordings_delete ON public.live_class_recordings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 2: live_class_poll_responses (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_live_class_poll_responses_select ON public.live_class_poll_responses;
DROP POLICY IF EXISTS p_live_class_poll_responses_insert ON public.live_class_poll_responses;
DROP POLICY IF EXISTS p_live_class_poll_responses_update ON public.live_class_poll_responses;
DROP POLICY IF EXISTS p_live_class_poll_responses_delete ON public.live_class_poll_responses;

CREATE POLICY p_live_class_poll_responses_select ON public.live_class_poll_responses
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_poll_responses_insert ON public.live_class_poll_responses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_live_class_poll_responses_update ON public.live_class_poll_responses
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_live_class_poll_responses_delete ON public.live_class_poll_responses
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 3: live_class_messages (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_messages_select ON public.live_class_messages;
DROP POLICY IF EXISTS p_live_class_messages_insert ON public.live_class_messages;
DROP POLICY IF EXISTS p_live_class_messages_update ON public.live_class_messages;
DROP POLICY IF EXISTS p_live_class_messages_delete ON public.live_class_messages;

CREATE POLICY p_live_class_messages_select ON public.live_class_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_messages_insert ON public.live_class_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_messages_update ON public.live_class_messages
  FOR UPDATE TO authenticated
  USING (sender_id = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (sender_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_messages_delete ON public.live_class_messages
  FOR DELETE TO authenticated
  USING (sender_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 4: short_note_user_progress (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_short_note_user_progress_select ON public.short_note_user_progress;
DROP POLICY IF EXISTS p_short_note_user_progress_insert ON public.short_note_user_progress;
DROP POLICY IF EXISTS p_short_note_user_progress_update ON public.short_note_user_progress;
DROP POLICY IF EXISTS p_short_note_user_progress_delete ON public.short_note_user_progress;

CREATE POLICY p_short_note_user_progress_select ON public.short_note_user_progress
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_short_note_user_progress_insert ON public.short_note_user_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_short_note_user_progress_update ON public.short_note_user_progress
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_short_note_user_progress_delete ON public.short_note_user_progress
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 5: live_class_participants (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_participants_select ON public.live_class_participants;
DROP POLICY IF EXISTS p_live_class_participants_insert ON public.live_class_participants;
DROP POLICY IF EXISTS p_live_class_participants_update ON public.live_class_participants;
DROP POLICY IF EXISTS p_live_class_participants_delete ON public.live_class_participants;

CREATE POLICY p_live_class_participants_select ON public.live_class_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_participants_insert ON public.live_class_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_participants_update ON public.live_class_participants
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_participants_delete ON public.live_class_participants
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 6: test_series_tests (PUBLIC_READ)
DROP POLICY IF EXISTS p_test_series_tests_select ON public.test_series_tests;
DROP POLICY IF EXISTS p_test_series_tests_insert ON public.test_series_tests;
DROP POLICY IF EXISTS p_test_series_tests_update ON public.test_series_tests;
DROP POLICY IF EXISTS p_test_series_tests_delete ON public.test_series_tests;

CREATE POLICY p_test_series_tests_select ON public.test_series_tests
  FOR SELECT TO public
  USING (status IN ('ACTIVE', 'PUBLISHED') OR is_free_preview = true OR public.is_admin());

CREATE POLICY p_test_series_tests_insert ON public.test_series_tests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_test_series_tests_update ON public.test_series_tests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_test_series_tests_delete ON public.test_series_tests
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 7: short_notes (PUBLIC_READ)
DROP POLICY IF EXISTS p_short_notes_select ON public.short_notes;
DROP POLICY IF EXISTS p_short_notes_insert ON public.short_notes;
DROP POLICY IF EXISTS p_short_notes_update ON public.short_notes;
DROP POLICY IF EXISTS p_short_notes_delete ON public.short_notes;

CREATE POLICY p_short_notes_select ON public.short_notes
  FOR SELECT TO public
  USING (visibility = 'PUBLIC' OR status = 'PUBLISHED' OR public.is_admin());

CREATE POLICY p_short_notes_insert ON public.short_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_short_notes_update ON public.short_notes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_short_notes_delete ON public.short_notes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 8: test_series (PUBLIC_READ)
DROP POLICY IF EXISTS p_test_series_select ON public.test_series;
DROP POLICY IF EXISTS p_test_series_insert ON public.test_series;
DROP POLICY IF EXISTS p_test_series_update ON public.test_series;
DROP POLICY IF EXISTS p_test_series_delete ON public.test_series;

CREATE POLICY p_test_series_select ON public.test_series
  FOR SELECT TO public
  USING (visibility = 'PUBLIC' OR status = 'PUBLISHED' OR public.is_admin());

CREATE POLICY p_test_series_insert ON public.test_series
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_test_series_update ON public.test_series
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_test_series_delete ON public.test_series
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 9: live_class_attendance (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_live_class_attendance_select ON public.live_class_attendance;
DROP POLICY IF EXISTS p_live_class_attendance_insert ON public.live_class_attendance;
DROP POLICY IF EXISTS p_live_class_attendance_update ON public.live_class_attendance;
DROP POLICY IF EXISTS p_live_class_attendance_delete ON public.live_class_attendance;

CREATE POLICY p_live_class_attendance_select ON public.live_class_attendance
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_attendance_insert ON public.live_class_attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_attendance_update ON public.live_class_attendance
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_live_class_attendance_delete ON public.live_class_attendance
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 10: live_class_polls (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_polls_select ON public.live_class_polls;
DROP POLICY IF EXISTS p_live_class_polls_insert ON public.live_class_polls;
DROP POLICY IF EXISTS p_live_class_polls_update ON public.live_class_polls;
DROP POLICY IF EXISTS p_live_class_polls_delete ON public.live_class_polls;

CREATE POLICY p_live_class_polls_select ON public.live_class_polls
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_polls_insert ON public.live_class_polls
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_polls_update ON public.live_class_polls
  FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (created_by = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_polls_delete ON public.live_class_polls
  FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid())::text OR public.is_admin());

-- Table 11: ypt_study_sessions (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_ypt_study_sessions_select ON public.ypt_study_sessions;
DROP POLICY IF EXISTS p_ypt_study_sessions_insert ON public.ypt_study_sessions;
DROP POLICY IF EXISTS p_ypt_study_sessions_update ON public.ypt_study_sessions;
DROP POLICY IF EXISTS p_ypt_study_sessions_delete ON public.ypt_study_sessions;

CREATE POLICY p_ypt_study_sessions_select ON public.ypt_study_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_ypt_study_sessions_insert ON public.ypt_study_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_ypt_study_sessions_update ON public.ypt_study_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_ypt_study_sessions_delete ON public.ypt_study_sessions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 12: short_note_blocks (PUBLIC_READ)
DROP POLICY IF EXISTS p_short_note_blocks_select ON public.short_note_blocks;
DROP POLICY IF EXISTS p_short_note_blocks_insert ON public.short_note_blocks;
DROP POLICY IF EXISTS p_short_note_blocks_update ON public.short_note_blocks;
DROP POLICY IF EXISTS p_short_note_blocks_delete ON public.short_note_blocks;

CREATE POLICY p_short_note_blocks_select ON public.short_note_blocks
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.short_notes sn
      WHERE sn.id = short_note_blocks.short_note_id
        AND (sn.visibility = 'PUBLIC' OR sn.status = 'PUBLISHED')
    ) OR public.is_admin()
  );

CREATE POLICY p_short_note_blocks_insert ON public.short_note_blocks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_short_note_blocks_update ON public.short_note_blocks
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_short_note_blocks_delete ON public.short_note_blocks
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 13: live_class_files (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_files_select ON public.live_class_files;
DROP POLICY IF EXISTS p_live_class_files_insert ON public.live_class_files;
DROP POLICY IF EXISTS p_live_class_files_update ON public.live_class_files;
DROP POLICY IF EXISTS p_live_class_files_delete ON public.live_class_files;

CREATE POLICY p_live_class_files_select ON public.live_class_files
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_files_insert ON public.live_class_files
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_files_update ON public.live_class_files
  FOR UPDATE TO authenticated
  USING (uploaded_by = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (uploaded_by = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_files_delete ON public.live_class_files
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT auth.uid())::text OR public.is_admin());

-- Table 14: live_class_questions (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_class_questions_select ON public.live_class_questions;
DROP POLICY IF EXISTS p_live_class_questions_insert ON public.live_class_questions;
DROP POLICY IF EXISTS p_live_class_questions_update ON public.live_class_questions;
DROP POLICY IF EXISTS p_live_class_questions_delete ON public.live_class_questions;

CREATE POLICY p_live_class_questions_select ON public.live_class_questions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_live_class_questions_insert ON public.live_class_questions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_questions_update ON public.live_class_questions
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (student_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_live_class_questions_delete ON public.live_class_questions
  FOR DELETE TO authenticated
  USING (student_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 15: app_releases (PUBLIC_READ)
DROP POLICY IF EXISTS p_app_releases_select ON public.app_releases;
DROP POLICY IF EXISTS p_app_releases_insert ON public.app_releases;
DROP POLICY IF EXISTS p_app_releases_update ON public.app_releases;
DROP POLICY IF EXISTS p_app_releases_delete ON public.app_releases;

CREATE POLICY p_app_releases_select ON public.app_releases
  FOR SELECT TO public
  USING (status = 'ACTIVE' OR public.is_admin());

CREATE POLICY p_app_releases_insert ON public.app_releases
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_app_releases_update ON public.app_releases
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_app_releases_delete ON public.app_releases
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 16: question_revisions (ADMIN_ONLY)
DROP POLICY IF EXISTS p_question_revisions_select ON public.question_revisions;
DROP POLICY IF EXISTS p_question_revisions_insert ON public.question_revisions;
DROP POLICY IF EXISTS p_question_revisions_update ON public.question_revisions;
DROP POLICY IF EXISTS p_question_revisions_delete ON public.question_revisions;

CREATE POLICY p_question_revisions_select ON public.question_revisions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY p_question_revisions_insert ON public.question_revisions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_question_revisions_update ON public.question_revisions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_question_revisions_delete ON public.question_revisions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 17: ypt_groups (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_ypt_groups_select ON public.ypt_groups;
DROP POLICY IF EXISTS p_ypt_groups_insert ON public.ypt_groups;
DROP POLICY IF EXISTS p_ypt_groups_update ON public.ypt_groups;
DROP POLICY IF EXISTS p_ypt_groups_delete ON public.ypt_groups;

CREATE POLICY p_ypt_groups_select ON public.ypt_groups
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_ypt_groups_insert ON public.ypt_groups
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_ypt_groups_update ON public.ypt_groups
  FOR UPDATE TO authenticated
  USING (creator_id = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (creator_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_ypt_groups_delete ON public.ypt_groups
  FOR DELETE TO authenticated
  USING (creator_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 18: ypt_group_members (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_ypt_group_members_select ON public.ypt_group_members;
DROP POLICY IF EXISTS p_ypt_group_members_insert ON public.ypt_group_members;
DROP POLICY IF EXISTS p_ypt_group_members_update ON public.ypt_group_members;
DROP POLICY IF EXISTS p_ypt_group_members_delete ON public.ypt_group_members;

CREATE POLICY p_ypt_group_members_select ON public.ypt_group_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY p_ypt_group_members_insert ON public.ypt_group_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_ypt_group_members_update ON public.ypt_group_members
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_ypt_group_members_delete ON public.ypt_group_members
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.ypt_groups g
      WHERE g.id = ypt_group_members.group_id
        AND g.creator_id = (SELECT auth.uid())::text
    )
    OR public.is_admin()
  );

-- Table 19: direct_video_calls (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_direct_video_calls_select ON public.direct_video_calls;
DROP POLICY IF EXISTS p_direct_video_calls_insert ON public.direct_video_calls;
DROP POLICY IF EXISTS p_direct_video_calls_update ON public.direct_video_calls;
DROP POLICY IF EXISTS p_direct_video_calls_delete ON public.direct_video_calls;

CREATE POLICY p_direct_video_calls_select ON public.direct_video_calls
  FOR SELECT TO authenticated
  USING (
    caller_id = (SELECT auth.uid())::text
    OR callee_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_direct_video_calls_insert ON public.direct_video_calls
  FOR INSERT TO authenticated
  WITH CHECK (
    caller_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_direct_video_calls_update ON public.direct_video_calls
  FOR UPDATE TO authenticated
  USING (
    caller_id = (SELECT auth.uid())::text
    OR callee_id = (SELECT auth.uid())::text
    OR public.is_admin()
  )
  WITH CHECK (
    caller_id = (SELECT auth.uid())::text
    OR callee_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_direct_video_calls_delete ON public.direct_video_calls
  FOR DELETE TO authenticated
  USING (
    caller_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

-- Table 20: live_classes (AUTHENTICATED_SHARED)
DROP POLICY IF EXISTS p_live_classes_select ON public.live_classes;
DROP POLICY IF EXISTS p_live_classes_insert ON public.live_classes;
DROP POLICY IF EXISTS p_live_classes_update ON public.live_classes;
DROP POLICY IF EXISTS p_live_classes_delete ON public.live_classes;

CREATE POLICY p_live_classes_select ON public.live_classes
  FOR SELECT TO authenticated
  USING (
    is_published = true
    OR teacher_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_live_classes_insert ON public.live_classes
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_live_classes_update ON public.live_classes
  FOR UPDATE TO authenticated
  USING (
    teacher_id = (SELECT auth.uid())::text
    OR public.is_admin()
  )
  WITH CHECK (
    teacher_id = (SELECT auth.uid())::text
    OR public.is_admin()
  );

CREATE POLICY p_live_classes_delete ON public.live_classes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 21: oauth_integrations (SERVER_ONLY / ADMIN_ONLY)
-- CRITICAL SECURITY: Never allow public or unprivileged authenticated access to refresh tokens or client secrets
DROP POLICY IF EXISTS p_oauth_integrations_select ON public.oauth_integrations;
DROP POLICY IF EXISTS p_oauth_integrations_insert ON public.oauth_integrations;
DROP POLICY IF EXISTS p_oauth_integrations_update ON public.oauth_integrations;
DROP POLICY IF EXISTS p_oauth_integrations_delete ON public.oauth_integrations;

CREATE POLICY p_oauth_integrations_select ON public.oauth_integrations
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY p_oauth_integrations_insert ON public.oauth_integrations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_oauth_integrations_update ON public.oauth_integrations
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_oauth_integrations_delete ON public.oauth_integrations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Table 22: short_note_bookmarks (AUTHENTICATED_USER_OWNED)
DROP POLICY IF EXISTS p_short_note_bookmarks_select ON public.short_note_bookmarks;
DROP POLICY IF EXISTS p_short_note_bookmarks_insert ON public.short_note_bookmarks;
DROP POLICY IF EXISTS p_short_note_bookmarks_update ON public.short_note_bookmarks;
DROP POLICY IF EXISTS p_short_note_bookmarks_delete ON public.short_note_bookmarks;

CREATE POLICY p_short_note_bookmarks_select ON public.short_note_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

CREATE POLICY p_short_note_bookmarks_insert ON public.short_note_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_short_note_bookmarks_update ON public.short_note_bookmarks
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY p_short_note_bookmarks_delete ON public.short_note_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text OR public.is_admin());

-- Table 23: deleted_resources_tombstone (ADMIN_ONLY)
DROP POLICY IF EXISTS p_deleted_resources_tombstone_select ON public.deleted_resources_tombstone;
DROP POLICY IF EXISTS p_deleted_resources_tombstone_insert ON public.deleted_resources_tombstone;
DROP POLICY IF EXISTS p_deleted_resources_tombstone_update ON public.deleted_resources_tombstone;
DROP POLICY IF EXISTS p_deleted_resources_tombstone_delete ON public.deleted_resources_tombstone;

CREATE POLICY p_deleted_resources_tombstone_select ON public.deleted_resources_tombstone
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY p_deleted_resources_tombstone_insert ON public.deleted_resources_tombstone
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY p_deleted_resources_tombstone_update ON public.deleted_resources_tombstone
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY p_deleted_resources_tombstone_delete ON public.deleted_resources_tombstone
  FOR DELETE TO authenticated
  USING (public.is_admin());

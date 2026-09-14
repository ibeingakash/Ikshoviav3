import pool from '../db/pool.js';
import {
  LiveClass,
  LiveClassParticipant,
  LiveClassAttendance,
  LiveClassMessage,
  LiveClassQuestion,
  LiveClassFile,
  LiveClassRecording,
  LiveClassPoll,
  LiveClassAnalytics
} from '../../src/types/liveClass.js';

export class LiveClassRepository {
  private schemaChecked = false;

  async ensureSchema(): Promise<void> {
    if (this.schemaChecked) return;
    this.schemaChecked = true;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.live_classes (
          id TEXT PRIMARY KEY,
          meeting_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          exam TEXT NOT NULL DEFAULT 'ALL',
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
          meeting_type TEXT NOT NULL DEFAULT 'LECTURE',
          status TEXT NOT NULL DEFAULT 'SCHEDULED',
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

        CREATE TABLE IF NOT EXISTS public.live_class_participants (
          id TEXT PRIMARY KEY,
          live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'STUDENT',
          display_name TEXT NOT NULL,
          avatar_url TEXT,
          is_registered BOOLEAN DEFAULT TRUE,
          registered_at TIMESTAMPTZ DEFAULT NOW(),
          is_admitted BOOLEAN DEFAULT TRUE,
          is_muted BOOLEAN DEFAULT FALSE,
          camera_on BOOLEAN DEFAULT FALSE,
          hand_raised BOOLEAN DEFAULT FALSE,
          hand_raised_at TIMESTAMPTZ,
          status TEXT NOT NULL DEFAULT 'REGISTERED',
          last_seen_at TIMESTAMPTZ,
          CONSTRAINT uq_live_class_participant UNIQUE (live_class_id, user_id)
        );

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
          attendance_status TEXT NOT NULL DEFAULT 'PRESENT',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

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

        CREATE TABLE IF NOT EXISTS public.live_class_questions (
          id TEXT PRIMARY KEY,
          live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
          student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL,
          question TEXT NOT NULL,
          upvotes INT DEFAULT 0,
          upvoted_by JSONB DEFAULT '[]'::jsonb,
          status TEXT NOT NULL DEFAULT 'PENDING',
          is_pinned BOOLEAN DEFAULT FALSE,
          answer TEXT,
          answered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

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

        CREATE TABLE IF NOT EXISTS public.live_class_polls (
          id TEXT PRIMARY KEY,
          live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
          created_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          is_anonymous BOOLEAN DEFAULT FALSE,
          duration_seconds INT DEFAULT 60,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          closed_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS public.live_class_poll_responses (
          id TEXT PRIMARY KEY,
          poll_id TEXT NOT NULL REFERENCES public.live_class_polls(id) ON DELETE CASCADE,
          live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          option_id TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_live_poll_response UNIQUE (poll_id, user_id)
        );
      `);

      // Seed initial high-quality live classes and past recordings if table is empty
      const countRes = await pool.query(`SELECT COUNT(*) FROM public.live_classes`);
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await this.seedDefaultLiveClasses();
      }
      console.log('[LiveClassRepository] Schema and initial seed verified.');
    } catch (e: any) {
      console.error('[LiveClassRepository] Error ensuring schema:', e.message);
    }
  }

  private async seedDefaultLiveClasses(): Promise<void> {
    const now = new Date();

    // 1. A Live Now class
    const liveStart = new Date(now.getTime() - 25 * 60 * 1000); // started 25 min ago
    const liveClassId = 'live_cls_bpsc71_essay';
    const liveMeetingId = 'IK-BPSC-7F42';

    // 2. An Upcoming Today class
    const todayUpcoming = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const upcomingClassId = 'live_cls_upsc_ethics';
    const upcomingMeetingId = 'IK-UPSC-9A13';

    // 3. An Upcoming Tomorrow class
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowClassId = 'live_cls_bpsc_history';
    const tomorrowMeetingId = 'IK-BPSC-4D19';

    // 4. A Completed Class with full recording and materials
    const completedPast = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const completedClassId = 'live_cls_bpsc_polity';
    const completedMeetingId = 'IK-BPSC-2B88';

    const classesToSeed = [
      {
        id: liveClassId,
        meetingId: liveMeetingId,
        title: 'BPSC 71st Mains — Essay Discussion & Structural Frameworks',
        description: 'Comprehensive walkthrough of Section 1 & Section 3 philosophical and Bihar-centric thematic essays. Focus on dialectical structure, quotes, and case studies.',
        subject: 'Mains Essay',
        exam: 'BPSC',
        topic: 'Philosophical & Bihar Proverbs Essay Framing',
        teacherName: 'Prof. Anand Vardhan',
        teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        scheduledDate: now.toISOString().split('T')[0],
        startTime: `${String(liveStart.getHours()).padStart(2, '0')}:${String(liveStart.getMinutes()).padStart(2, '0')}`,
        scheduledStartIso: liveStart.toISOString(),
        expectedDurationMinutes: 90,
        actualStartTime: liveStart.toISOString(),
        status: 'LIVE',
        meetingType: 'ESSAY_EVALUATION',
        maxParticipants: 150,
        recordingEnabled: true,
        chatEnabled: true,
        studentMicAllowed: true,
        studentCameraAllowed: true,
        waitingRoomEnabled: false,
        screenSharingAllowed: true,
        fileSharingAllowed: true,
        linkedMainsTaskId: 'mains_task_essay_01',
        linkedMockTestId: 'mock_job_ocr_1788854092974_5snb',
        metadata: {
          recommendedPrerequisites: ['Read BPSC 69th & 70th Essay Solved Papers'],
          syllabusPointers: ['Section I: Abstract & Philosophical', 'Section III: Bihar Specific Themes & Dialects'],
        },
      },
      {
        id: upcomingClassId,
        meetingId: upcomingMeetingId,
        title: 'UPSC CSE 2026 — Ethics Case Studies Masterclass (GS IV)',
        description: 'Live roleplay framework for Section B complex dilemmas involving public interest vs executive orders, whistleblowing, and administrative discretion.',
        subject: 'General Studies IV',
        exam: 'UPSC',
        topic: 'Section B Case Studies & Decision Matrix',
        teacherName: 'Dr. Meenakshi Sundaram',
        teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        scheduledDate: todayUpcoming.toISOString().split('T')[0],
        startTime: `${String(todayUpcoming.getHours()).padStart(2, '0')}:${String(todayUpcoming.getMinutes()).padStart(2, '0')}`,
        scheduledStartIso: todayUpcoming.toISOString(),
        expectedDurationMinutes: 75,
        status: 'SCHEDULED',
        meetingType: 'LECTURE',
        maxParticipants: 200,
        recordingEnabled: true,
        chatEnabled: true,
        studentMicAllowed: true,
        studentCameraAllowed: true,
        waitingRoomEnabled: true,
        screenSharingAllowed: true,
        fileSharingAllowed: true,
        metadata: {
          recommendedPrerequisites: ['Nolan Principles of Public Life'],
        },
      },
      {
        id: tomorrowClassId,
        meetingId: tomorrowMeetingId,
        title: 'BPSC 71st GS Paper 1 — Modern History & Freedom Struggle In Bihar',
        description: 'Deep dive into Santhal Uprising, 1857 Revolt in Bihar under Kunwar Singh, Champaran Satyagraha, and Quit India Movement 1942.',
        subject: 'History & Culture',
        exam: 'BPSC',
        topic: 'Tribal Resistance & Nationalist Movements in Bihar',
        teacherName: 'Sanjay Kumar Jha',
        teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        scheduledDate: tomorrow.toISOString().split('T')[0],
        startTime: '11:00',
        scheduledStartIso: tomorrow.toISOString(),
        expectedDurationMinutes: 120,
        status: 'SCHEDULED',
        meetingType: 'LECTURE',
        maxParticipants: 100,
        recordingEnabled: true,
        chatEnabled: true,
        studentMicAllowed: true,
        studentCameraAllowed: true,
        waitingRoomEnabled: false,
        screenSharingAllowed: true,
        fileSharingAllowed: true,
        metadata: {
          recommendedPrerequisites: ['BPSC PYQ Modern History Notes'],
        },
      },
      {
        id: completedClassId,
        meetingId: completedMeetingId,
        title: 'BPSC 70th Mains — Indian Polity & Federal Governance Breakdown',
        description: 'Analyzing recent trends in Governor discretionary powers, Centre-State financial relations, and Bihar Panchayati Raj 50% reservation impact.',
        subject: 'Indian Polity & Governance',
        exam: 'BPSC',
        topic: 'Governor Powers & Fiscal Federalism in Bihar',
        teacherName: 'Prof. Anand Vardhan',
        teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        scheduledDate: completedPast.toISOString().split('T')[0],
        startTime: '17:00',
        scheduledStartIso: completedPast.toISOString(),
        expectedDurationMinutes: 90,
        actualStartTime: completedPast.toISOString(),
        actualEndTime: new Date(completedPast.getTime() + 92 * 60 * 1000).toISOString(),
        status: 'COMPLETED',
        meetingType: 'DOUBT_CLEARING',
        maxParticipants: 150,
        recordingEnabled: true,
        chatEnabled: true,
        studentMicAllowed: true,
        studentCameraAllowed: true,
        waitingRoomEnabled: false,
        screenSharingAllowed: true,
        fileSharingAllowed: true,
        metadata: {
          durationSummary: '92 minutes held',
        },
      },
    ];

    for (const c of classesToSeed) {
      await pool.query(`
        INSERT INTO public.live_classes (
          id, meeting_id, title, description, subject, exam, topic,
          teacher_name, teacher_avatar, scheduled_date, start_time,
          scheduled_start_iso, expected_duration_minutes, actual_start_time,
          actual_end_time, status, meeting_type, max_participants,
          recording_enabled, chat_enabled, student_mic_allowed,
          student_camera_allowed, waiting_room_enabled, screen_sharing_allowed,
          file_sharing_allowed, linked_mains_task_id, linked_mock_test_id, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        c.id, c.meetingId, c.title, c.description, c.subject, c.exam, c.topic,
        c.teacherName, c.teacherAvatar, c.scheduledDate, c.startTime,
        c.scheduledStartIso, c.expectedDurationMinutes, c.actualStartTime || null,
        c.actualEndTime || null, c.status, c.meetingType, c.maxParticipants,
        c.recordingEnabled, c.chatEnabled, c.studentMicAllowed,
        c.studentCameraAllowed, c.waitingRoomEnabled, c.screenSharingAllowed,
        c.fileSharingAllowed, c.linkedMainsTaskId || null, c.linkedMockTestId || null,
        JSON.stringify(c.metadata || {}),
      ]);
    }

    // Seed shared files for the live & completed classes
    await pool.query(`
      INSERT INTO public.live_class_files (
        id, live_class_id, uploaded_by, uploader_name, file_name, file_url, file_type, file_size_bytes, description
      ) VALUES
      (
        'f_bpsc71_01', 'live_cls_bpsc71_essay', 'usr_admin', 'Prof. Anand Vardhan',
        'BPSC_71st_Mains_Essay_Structural_Templates_v2.pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'application/pdf', 1420500,
        'Official 12-page structural framework for Section 1 and Section 3 Bihar Proverbs.'
      ),
      (
        'f_bpsc71_02', 'live_cls_bpsc71_essay', 'usr_admin', 'Prof. Anand Vardhan',
        'Quotes_And_Philosophical_Connectors_Handout.pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'application/pdf', 840200,
        'Curated 50 historical quotes categorized by Ethics, Governance, and Human Nature.'
      ),
      (
        'f_bpsc_polity_01', 'live_cls_bpsc_polity', 'usr_admin', 'Prof. Anand Vardhan',
        'Governor_Discretionary_Powers_Supreme_Court_Rulings.pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'application/pdf', 1980000,
        'Comprehensive notes with Sarkaria & Punchhi commission recommendations.'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Seed realistic recording for completed class
    await pool.query(`
      INSERT INTO public.live_class_recordings (
        id, live_class_id, title, recording_url, duration_seconds, file_size_bytes, transcript, key_takeaways, download_allowed
      ) VALUES (
        'rec_bpsc_polity_01',
        'live_cls_bpsc_polity',
        'BPSC 70th Mains — Indian Polity & Federal Governance (Full Session)',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        5520,
        428500000,
        'Welcome students to this comprehensive BPSC Polity session. Today we examine Article 163, 174, and 200...',
        '["Article 200 Presidential Assent timelines", "Punchhi Commission Recommendations on Gubernatorial appointments", "Impact of 73rd Amendment in Bihar Local Governance"]'::jsonb,
        TRUE
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Seed live poll for the active live class
    await pool.query(`
      INSERT INTO public.live_class_polls (
        id, live_class_id, created_by, question, options, is_anonymous, duration_seconds, status
      ) VALUES (
        'poll_bpsc71_01',
        'live_cls_bpsc71_essay',
        'usr_admin',
        'Which essay type do you find most challenging in BPSC Mains?',
        '[
          {"id": "opt1", "text": "Philosophical & Abstract Topics (Section 1)", "votes": 14},
          {"id": "opt2", "text": "Bhojpuri/Maithili Proverb Based Essays (Section 3)", "votes": 28},
          {"id": "opt3", "text": "Socio-Economic Analytical Themes (Section 2)", "votes": 9},
          {"id": "opt4", "text": "Maintaining 700-800 word coherence under 3 hours", "votes": 21}
        ]'::jsonb,
        FALSE,
        180,
        'ACTIVE'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Seed interactive messages in the live class
    await pool.query(`
      INSERT INTO public.live_class_messages (
        id, live_class_id, sender_id, sender_name, sender_role, message, is_pinned, created_at
      ) VALUES
      (
        'msg_1', 'live_cls_bpsc71_essay', 'usr_admin', 'Prof. Anand Vardhan', 'TEACHER',
        'Welcome everyone! Please ensure you have downloaded the Structural Templates PDF from the Files tab.',
        TRUE,
        NOW() - INTERVAL '20 minutes'
      ),
      (
        'msg_2', 'live_cls_bpsc71_essay', 'usr_student_1', 'Rohan Verma', 'STUDENT',
        'Good evening Sir. Can we use Bihar folk songs or local poetry as introductions in Section 3?',
        FALSE,
        NOW() - INTERVAL '15 minutes'
      ),
      (
        'msg_3', 'live_cls_bpsc71_essay', 'usr_admin', 'Prof. Anand Vardhan', 'TEACHER',
        'Yes Rohan! Folk proverbs and short couplets in Maithili/Magahi/Bhojpuri add immense contextual authenticity. I will illustrate with examples shortly.',
        FALSE,
        NOW() - INTERVAL '12 minutes'
      ),
      (
        'msg_4', 'live_cls_bpsc71_essay', 'usr_student_2', 'Pooja Kumari', 'STUDENT',
        'Audio and screen clarity are crystal clear!',
        FALSE,
        NOW() - INTERVAL '8 minutes'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Seed questions in Q&A queue
    await pool.query(`
      INSERT INTO public.live_class_questions (
        id, live_class_id, student_id, student_name, question, upvotes, upvoted_by, status, is_pinned, answer
      ) VALUES
      (
        'q_1', 'live_cls_bpsc71_essay', 'usr_student_1', 'Rohan Verma',
        'Sir, how should we structure the transition between the literal meaning of a Bihar proverb and its contemporary socio-economic application?',
        8, '["usr_student_2", "usr_student_3"]'::jsonb,
        'ANSWERING', TRUE,
        'Dedicate paragraph 1-2 to the cultural root, then pivot via "In contemporary governance and human ethos..." to broad multi-sector analysis.'
      ),
      (
        'q_2', 'live_cls_bpsc71_essay', 'usr_student_3', 'Vikram Singh',
        'Is it advisable to take an anti-establishment stance when critiquing administrative apathy in essay questions?',
        5, '["usr_student_1"]'::jsonb,
        'PENDING', FALSE,
        NULL
      ) ON CONFLICT (id) DO NOTHING;
    `);
  }

  // Format helper
  private formatClassRow(row: any): LiveClass {
    return {
      id: row.id,
      meetingId: row.meeting_id,
      title: row.title,
      description: row.description || '',
      subject: row.subject || '',
      exam: row.exam || 'ALL',
      topic: row.topic || '',
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      teacherAvatar: row.teacher_avatar,
      scheduledDate: row.scheduled_date,
      startTime: row.start_time,
      scheduledStartIso: row.scheduled_start_iso ? new Date(row.scheduled_start_iso).toISOString() : '',
      expectedDurationMinutes: row.expected_duration_minutes || 60,
      actualStartTime: row.actual_start_time ? new Date(row.actual_start_time).toISOString() : null,
      actualEndTime: row.actual_end_time ? new Date(row.actual_end_time).toISOString() : null,
      maxParticipants: row.max_participants || 100,
      meetingType: row.meeting_type || 'LECTURE',
      status: row.status || 'SCHEDULED',
      recordingEnabled: row.recording_enabled !== false,
      chatEnabled: row.chat_enabled !== false,
      studentMicAllowed: row.student_mic_allowed !== false,
      studentCameraAllowed: row.student_camera_allowed !== false,
      waitingRoomEnabled: Boolean(row.waiting_room_enabled),
      screenSharingAllowed: row.screen_sharing_allowed !== false,
      fileSharingAllowed: row.file_sharing_allowed !== false,
      isLocked: Boolean(row.is_locked),
      targetCourseId: row.target_course_id,
      targetTestSeriesId: row.target_test_series_id,
      linkedMockTestId: row.linked_mock_test_id,
      linkedMainsTaskId: row.linked_mains_task_id,
      metadata: row.metadata || {},
      registeredCount: parseInt(row.registered_count || '0', 10),
      activeCount: parseInt(row.active_count || '0', 10),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  async getLiveClasses(filters?: {
    exam?: string;
    status?: string;
    teacherId?: string;
    search?: string;
    tab?: string; // 'live' | 'upcoming' | 'today' | 'recordings' | 'my'
    userId?: string;
  }): Promise<LiveClass[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.exam && filters.exam !== 'ALL') {
      conditions.push(`(c.exam = $${idx} OR c.exam = 'ALL')`);
      params.push(filters.exam);
      idx++;
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`c.status = $${idx}`);
      params.push(filters.status);
      idx++;
    }

    if (filters?.teacherId) {
      conditions.push(`c.teacher_id = $${idx}`);
      params.push(filters.teacherId);
      idx++;
    }

    if (filters?.search && filters.search.trim()) {
      conditions.push(`(c.title ILIKE $${idx} OR c.subject ILIKE $${idx} OR c.topic ILIKE $${idx} OR c.teacher_name ILIKE $${idx} OR c.meeting_id ILIKE $${idx})`);
      params.push(`%${filters.search.trim()}%`);
      idx++;
    }

    const todayDate = new Date().toISOString().split('T')[0];

    if (filters?.tab === 'live') {
      conditions.push(`c.status = 'LIVE'`);
    } else if (filters?.tab === 'upcoming') {
      conditions.push(`c.status = 'SCHEDULED'`);
    } else if (filters?.tab === 'today') {
      conditions.push(`c.scheduled_date = '${todayDate}'`);
    } else if (filters?.tab === 'my' && filters?.userId) {
      conditions.push(`(c.teacher_id = $${idx} OR EXISTS (SELECT 1 FROM public.live_class_participants p WHERE p.live_class_id = c.id AND p.user_id = $${idx}))`);
      params.push(filters.userId);
      idx++;
    }

    const query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM public.live_class_participants p WHERE p.live_class_id = c.id AND p.is_registered = TRUE) as registered_count,
        (SELECT COUNT(*) FROM public.live_class_participants p WHERE p.live_class_id = c.id AND p.status = 'JOINED') as active_count
      FROM public.live_classes c
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE
          WHEN c.status = 'LIVE' THEN 1
          WHEN c.status = 'SCHEDULED' THEN 2
          WHEN c.status = 'COMPLETED' THEN 3
          ELSE 4
        END,
        c.scheduled_start_iso ASC;
    `;

    const res = await pool.query(query, params);
    return res.rows.map(r => this.formatClassRow(r));
  }

  async getLiveClassById(id: string): Promise<LiveClass | null> {
    const res = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM public.live_class_participants p WHERE p.live_class_id = c.id AND p.is_registered = TRUE) as registered_count,
        (SELECT COUNT(*) FROM public.live_class_participants p WHERE p.live_class_id = c.id AND p.status = 'JOINED') as active_count
      FROM public.live_classes c
      WHERE c.id = $1 OR c.meeting_id = $1;
    `, [id]);

    if (!res.rows[0]) return null;
    return this.formatClassRow(res.rows[0]);
  }

  async createLiveClass(data: Partial<LiveClass>, creatorUser: any): Promise<LiveClass> {
    const classId = `live_cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Generate human-readable clean meeting ID: e.g. IK-BPSC-7F42 or IK-UPSC-9A13
    const examCode = data.exam === 'BPSC' ? 'BPSC' : data.exam === 'UPSC' ? 'UPSC' : 'IK';
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const meetingId = `IK-${examCode}-${randCode}`;

    const scheduledDate = data.scheduledDate || new Date().toISOString().split('T')[0];
    const startTime = data.startTime || '18:00';
    const scheduledStartIso = data.scheduledStartIso || new Date(`${scheduledDate}T${startTime}:00Z`).toISOString();

    const res = await pool.query(`
      INSERT INTO public.live_classes (
        id, meeting_id, title, description, subject, exam, topic,
        teacher_id, teacher_name, teacher_avatar, scheduled_date, start_time,
        scheduled_start_iso, expected_duration_minutes, max_participants,
        meeting_type, status, recording_enabled, chat_enabled,
        student_mic_allowed, student_camera_allowed, waiting_room_enabled,
        screen_sharing_allowed, file_sharing_allowed, target_course_id,
        target_test_series_id, linked_mock_test_id, linked_mains_task_id, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *;
    `, [
      classId,
      meetingId,
      data.title || 'Untitled Live Class',
      data.description || '',
      data.subject || 'General Studies',
      data.exam || 'ALL',
      data.topic || '',
      data.teacherId || creatorUser.id,
      data.teacherName || creatorUser.name || 'IKSHOVIA Faculty',
      data.teacherAvatar || creatorUser.avatarUrl || null,
      scheduledDate,
      startTime,
      scheduledStartIso,
      data.expectedDurationMinutes || 60,
      data.maxParticipants || 100,
      data.meetingType || 'LECTURE',
      'SCHEDULED',
      data.recordingEnabled !== false,
      data.chatEnabled !== false,
      data.studentMicAllowed !== false,
      data.studentCameraAllowed !== false,
      Boolean(data.waitingRoomEnabled),
      data.screenSharingAllowed !== false,
      data.fileSharingAllowed !== false,
      data.targetCourseId || null,
      data.targetTestSeriesId || null,
      data.linkedMockTestId || null,
      data.linkedMainsTaskId || null,
      JSON.stringify(data.metadata || {}),
    ]);

    // Register creator as teacher participant
    await this.registerParticipant(classId, creatorUser, 'TEACHER');

    return this.formatClassRow(res.rows[0]);
  }

  async updateLiveClass(id: string, updates: Partial<LiveClass>): Promise<LiveClass> {
    const current = await this.getLiveClassById(id);
    if (!current) throw new Error('Live class not found');

    const res = await pool.query(`
      UPDATE public.live_classes SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        subject = COALESCE($3, subject),
        exam = COALESCE($4, exam),
        topic = COALESCE($5, topic),
        teacher_id = COALESCE($6, teacher_id),
        teacher_name = COALESCE($7, teacher_name),
        scheduled_date = COALESCE($8, scheduled_date),
        start_time = COALESCE($9, start_time),
        scheduled_start_iso = COALESCE($10, scheduled_start_iso),
        expected_duration_minutes = COALESCE($11, expected_duration_minutes),
        meeting_type = COALESCE($12, meeting_type),
        recording_enabled = COALESCE($13, recording_enabled),
        chat_enabled = COALESCE($14, chat_enabled),
        student_mic_allowed = COALESCE($15, student_mic_allowed),
        student_camera_allowed = COALESCE($16, student_camera_allowed),
        waiting_room_enabled = COALESCE($17, waiting_room_enabled),
        screen_sharing_allowed = COALESCE($18, screen_sharing_allowed),
        file_sharing_allowed = COALESCE($19, file_sharing_allowed),
        is_locked = COALESCE($20, is_locked),
        updated_at = NOW()
      WHERE id = $21
      RETURNING *;
    `, [
      updates.title,
      updates.description,
      updates.subject,
      updates.exam,
      updates.topic,
      updates.teacherId,
      updates.teacherName,
      updates.scheduledDate,
      updates.startTime,
      updates.scheduledStartIso,
      updates.expectedDurationMinutes,
      updates.meetingType,
      updates.recordingEnabled,
      updates.chatEnabled,
      updates.studentMicAllowed,
      updates.studentCameraAllowed,
      updates.waitingRoomEnabled,
      updates.screenSharingAllowed,
      updates.fileSharingAllowed,
      updates.isLocked,
      current.id,
    ]);

    return this.formatClassRow(res.rows[0]);
  }

  async startClass(id: string): Promise<LiveClass> {
    const current = await this.getLiveClassById(id);
    if (!current) throw new Error('Live class not found');

    const res = await pool.query(`
      UPDATE public.live_classes SET
        status = 'LIVE',
        actual_start_time = COALESCE(actual_start_time, NOW()),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [current.id]);

    return this.formatClassRow(res.rows[0]);
  }

  async endClass(id: string): Promise<LiveClass> {
    const current = await this.getLiveClassById(id);
    if (!current) throw new Error('Live class not found');

    const res = await pool.query(`
      UPDATE public.live_classes SET
        status = 'COMPLETED',
        actual_end_time = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [current.id]);

    // Close all open attendance records with final duration
    await pool.query(`
      UPDATE public.live_class_attendance SET
        leave_time = NOW(),
        total_duration_seconds = total_duration_seconds + EXTRACT(EPOCH FROM (NOW() - join_time))::int
      WHERE live_class_id = $1 AND leave_time IS NULL;
    `, [current.id]);

    // Mark active participants as LEFT
    await pool.query(`
      UPDATE public.live_class_participants SET
        status = 'LEFT',
        last_seen_at = NOW()
      WHERE live_class_id = $1 AND status = 'JOINED';
    `, [current.id]);

    return this.formatClassRow(res.rows[0]);
  }

  async deleteClass(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM public.live_classes WHERE id = $1 OR meeting_id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // Participants & Registration
  async registerParticipant(classId: string, user: any, role: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT'): Promise<LiveClassParticipant> {
    const currentClass = await this.getLiveClassById(classId);
    if (!currentClass) throw new Error('Class not found');

    const partId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isAdmitted = !currentClass.waitingRoomEnabled || role === 'TEACHER' || role === 'ADMIN';

    const res = await pool.query(`
      INSERT INTO public.live_class_participants (
        id, live_class_id, user_id, role, display_name, avatar_url,
        is_registered, registered_at, is_admitted, status, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), $7, 'REGISTERED', NOW())
      ON CONFLICT (live_class_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        display_name = EXCLUDED.display_name,
        is_registered = TRUE,
        last_seen_at = NOW()
      RETURNING *;
    `, [
      partId,
      currentClass.id,
      user.id,
      role,
      user.name || 'IKSHOVIA Scholar',
      user.avatarUrl || null,
      isAdmitted,
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      isRegistered: r.is_registered,
      registeredAt: r.registered_at?.toISOString(),
      isAdmitted: r.is_admitted,
      isMuted: r.is_muted,
      cameraOn: r.camera_on,
      handRaised: r.hand_raised,
      handRaisedAt: r.hand_raised_at?.toISOString() || null,
      status: r.status,
      lastSeenAt: r.last_seen_at?.toISOString(),
    };
  }

  async getParticipants(classId: string): Promise<LiveClassParticipant[]> {
    const res = await pool.query(`
      SELECT * FROM public.live_class_participants
      WHERE live_class_id = $1
      ORDER BY
        CASE WHEN role = 'TEACHER' THEN 1 WHEN role = 'ADMIN' THEN 2 ELSE 3 END,
        hand_raised DESC,
        display_name ASC;
    `, [classId]);

    return res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      isRegistered: r.is_registered,
      registeredAt: r.registered_at?.toISOString(),
      isAdmitted: r.is_admitted,
      isMuted: r.is_muted,
      cameraOn: r.camera_on,
      handRaised: r.hand_raised,
      handRaisedAt: r.hand_raised_at?.toISOString() || null,
      status: r.status,
      lastSeenAt: r.last_seen_at?.toISOString(),
    }));
  }

  async recordJoin(classId: string, user: any, isTeacher: boolean): Promise<LiveClassParticipant> {
    const currentClass = await this.getLiveClassById(classId);
    if (!currentClass) throw new Error('Class not found');

    const role = isTeacher ? 'TEACHER' : (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'ADMIN' : 'STUDENT';
    const isAdmitted = !currentClass.waitingRoomEnabled || role !== 'STUDENT';
    const status = isAdmitted ? 'JOINED' : 'WAITING';

    await this.registerParticipant(currentClass.id, user, role);

    const res = await pool.query(`
      UPDATE public.live_class_participants SET
        is_admitted = $1,
        status = $2,
        last_seen_at = NOW()
      WHERE live_class_id = $3 AND user_id = $4
      RETURNING *;
    `, [isAdmitted, status, currentClass.id, user.id]);

    // Record attendance if admitted and joined
    if (isAdmitted) {
      const attId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      // Check existing open record
      const existing = await pool.query(`
        SELECT * FROM public.live_class_attendance
        WHERE live_class_id = $1 AND user_id = $2
        ORDER BY join_time DESC LIMIT 1;
      `, [currentClass.id, user.id]);

      if (existing.rows[0]) {
        // Increment rejoin count and reopen if left
        await pool.query(`
          UPDATE public.live_class_attendance SET
            join_time = NOW(),
            leave_time = NULL,
            rejoin_count = rejoin_count + 1
          WHERE id = $1;
        `, [existing.rows[0].id]);
      } else {
        // Determine if late (e.g. joined > 15 min after actual or scheduled start)
        const scheduledStart = new Date(currentClass.scheduledStartIso).getTime();
        const nowMs = Date.now();
        const isLate = (nowMs - scheduledStart) > 15 * 60 * 1000;

        await pool.query(`
          INSERT INTO public.live_class_attendance (
            id, live_class_id, user_id, user_name, user_email, join_time, rejoin_count, attendance_status
          ) VALUES ($1, $2, $3, $4, $5, NOW(), 0, $6);
        `, [
          attId,
          currentClass.id,
          user.id,
          user.name || 'Scholar',
          user.email || '',
          isLate ? 'LATE' : 'PRESENT',
        ]);
      }
    }

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      isRegistered: r.is_registered,
      registeredAt: r.registered_at?.toISOString(),
      isAdmitted: r.is_admitted,
      isMuted: r.is_muted,
      cameraOn: r.camera_on,
      handRaised: r.hand_raised,
      handRaisedAt: r.hand_raised_at?.toISOString() || null,
      status: r.status,
      lastSeenAt: r.last_seen_at?.toISOString(),
    };
  }

  async recordLeave(classId: string, userId: string): Promise<void> {
    await pool.query(`
      UPDATE public.live_class_participants SET
        status = 'LEFT',
        last_seen_at = NOW()
      WHERE live_class_id = $1 AND user_id = $2;
    `, [classId, userId]);

    // Update attendance record duration
    await pool.query(`
      UPDATE public.live_class_attendance SET
        leave_time = NOW(),
        total_duration_seconds = total_duration_seconds + GREATEST(10, EXTRACT(EPOCH FROM (NOW() - join_time))::int)
      WHERE live_class_id = $1 AND user_id = $2 AND leave_time IS NULL;
    `, [classId, userId]);
  }

  async updateParticipantState(classId: string, userId: string, updates: {
    isMuted?: boolean;
    cameraOn?: boolean;
    handRaised?: boolean;
    isAdmitted?: boolean;
    status?: string;
  }): Promise<LiveClassParticipant | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (typeof updates.isMuted === 'boolean') {
      fields.push(`is_muted = $${idx++}`);
      values.push(updates.isMuted);
    }
    if (typeof updates.cameraOn === 'boolean') {
      fields.push(`camera_on = $${idx++}`);
      values.push(updates.cameraOn);
    }
    if (typeof updates.handRaised === 'boolean') {
      fields.push(`hand_raised = $${idx++}`);
      values.push(updates.handRaised);
      fields.push(`hand_raised_at = ${updates.handRaised ? 'NOW()' : 'NULL'}`);
    }
    if (typeof updates.isAdmitted === 'boolean') {
      fields.push(`is_admitted = $${idx++}`);
      values.push(updates.isAdmitted);
      if (updates.isAdmitted) {
        fields.push(`status = 'JOINED'`);
      }
    }
    if (updates.status) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) return null;

    fields.push(`last_seen_at = NOW()`);
    values.push(classId);
    values.push(userId);

    const res = await pool.query(`
      UPDATE public.live_class_participants SET
        ${fields.join(', ')}
      WHERE live_class_id = $${idx++} AND user_id = $${idx++}
      RETURNING *;
    `, values);

    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      isRegistered: r.is_registered,
      registeredAt: r.registered_at?.toISOString(),
      isAdmitted: r.is_admitted,
      isMuted: r.is_muted,
      cameraOn: r.camera_on,
      handRaised: r.hand_raised,
      handRaisedAt: r.hand_raised_at?.toISOString() || null,
      status: r.status,
      lastSeenAt: r.last_seen_at?.toISOString(),
    };
  }

  // Attendance
  async getAttendance(classId: string): Promise<{
    records: LiveClassAttendance[];
    summary: {
      totalEnrolled: number;
      totalAttended: number;
      presentCount: number;
      lateCount: number;
      leftEarlyCount: number;
      averageDurationMinutes: number;
    };
  }> {
    const res = await pool.query(`
      SELECT * FROM public.live_class_attendance
      WHERE live_class_id = $1
      ORDER BY join_time ASC;
    `, [classId]);

    const records: LiveClassAttendance[] = res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      joinTime: new Date(r.join_time).toISOString(),
      leaveTime: r.leave_time ? new Date(r.leave_time).toISOString() : null,
      totalDurationSeconds: r.total_duration_seconds || 0,
      rejoinCount: r.rejoin_count || 0,
      attendanceStatus: r.attendance_status,
      createdAt: new Date(r.created_at).toISOString(),
    }));

    const enrolledRes = await pool.query(`
      SELECT COUNT(*) FROM public.live_class_participants
      WHERE live_class_id = $1;
    `, [classId]);
    const totalEnrolled = parseInt(enrolledRes.rows[0]?.count || '0', 10);

    const presentCount = records.filter(r => r.attendanceStatus === 'PRESENT').length;
    const lateCount = records.filter(r => r.attendanceStatus === 'LATE').length;
    const leftEarlyCount = records.filter(r => r.attendanceStatus === 'LEFT_EARLY').length;
    const totalSeconds = records.reduce((acc, r) => acc + (r.totalDurationSeconds || 0), 0);
    const avgDuration = records.length ? Math.round((totalSeconds / records.length) / 60) : 0;

    return {
      records,
      summary: {
        totalEnrolled,
        totalAttended: records.length,
        presentCount,
        lateCount,
        leftEarlyCount,
        averageDurationMinutes: avgDuration,
      },
    };
  }

  // Messages / Chat
  async getMessages(classId: string): Promise<LiveClassMessage[]> {
    const res = await pool.query(`
      SELECT * FROM public.live_class_messages
      WHERE live_class_id = $1 AND is_deleted = FALSE
      ORDER BY created_at ASC;
    `, [classId]);

    return res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      message: r.message,
      isPinned: Boolean(r.is_pinned),
      isDeleted: Boolean(r.is_deleted),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async addMessage(classId: string, sender: any, text: string, role: string = 'STUDENT'): Promise<LiveClassMessage> {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await pool.query(`
      INSERT INTO public.live_class_messages (
        id, live_class_id, sender_id, sender_name, sender_role, message, is_pinned, is_deleted, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE, NOW())
      RETURNING *;
    `, [
      msgId,
      classId,
      sender.id,
      sender.name || 'Scholar',
      role,
      text.trim(),
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      message: r.message,
      isPinned: Boolean(r.is_pinned),
      isDeleted: Boolean(r.is_deleted),
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async pinMessage(classId: string, messageId: string, isPinned: boolean): Promise<boolean> {
    const res = await pool.query(`
      UPDATE public.live_class_messages
      SET is_pinned = $1
      WHERE id = $2 AND live_class_id = $3;
    `, [isPinned, messageId, classId]);
    return (res.rowCount || 0) > 0;
  }

  async deleteMessage(classId: string, messageId: string): Promise<boolean> {
    const res = await pool.query(`
      UPDATE public.live_class_messages
      SET is_deleted = TRUE
      WHERE id = $1 AND live_class_id = $2;
    `, [messageId, classId]);
    return (res.rowCount || 0) > 0;
  }

  // Questions / Q&A
  async getQuestions(classId: string): Promise<LiveClassQuestion[]> {
    const res = await pool.query(`
      SELECT * FROM public.live_class_questions
      WHERE live_class_id = $1
      ORDER BY is_pinned DESC, upvotes DESC, created_at ASC;
    `, [classId]);

    return res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      studentId: r.student_id,
      studentName: r.student_name,
      question: r.question,
      upvotes: r.upvotes || 0,
      upvotedBy: Array.isArray(r.upvoted_by) ? r.upvoted_by : [],
      status: r.status,
      isPinned: Boolean(r.is_pinned),
      answer: r.answer || undefined,
      answeredAt: r.answered_at ? new Date(r.answered_at).toISOString() : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async addQuestion(classId: string, student: any, text: string): Promise<LiveClassQuestion> {
    const qId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await pool.query(`
      INSERT INTO public.live_class_questions (
        id, live_class_id, student_id, student_name, question, upvotes, upvoted_by, status, is_pinned, created_at
      ) VALUES ($1, $2, $3, $4, $5, 0, '[]'::jsonb, 'PENDING', FALSE, NOW())
      RETURNING *;
    `, [
      qId,
      classId,
      student.id,
      student.name || 'Scholar',
      text.trim(),
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      studentId: r.student_id,
      studentName: r.student_name,
      question: r.question,
      upvotes: 0,
      upvotedBy: [],
      status: 'PENDING',
      isPinned: false,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async upvoteQuestion(classId: string, questionId: string, userId: string): Promise<LiveClassQuestion> {
    const current = await pool.query(`
      SELECT * FROM public.live_class_questions WHERE id = $1 AND live_class_id = $2;
    `, [questionId, classId]);
    if (!current.rows[0]) throw new Error('Question not found');

    const upvoters: string[] = Array.isArray(current.rows[0].upvoted_by) ? current.rows[0].upvoted_by : [];
    let newUpvoters: string[];
    let newCount: number;

    if (upvoters.includes(userId)) {
      newUpvoters = upvoters.filter(id => id !== userId);
      newCount = Math.max(0, (current.rows[0].upvotes || 1) - 1);
    } else {
      newUpvoters = [...upvoters, userId];
      newCount = (current.rows[0].upvotes || 0) + 1;
    }

    const res = await pool.query(`
      UPDATE public.live_class_questions SET
        upvotes = $1,
        upvoted_by = $2
      WHERE id = $3 AND live_class_id = $4
      RETURNING *;
    `, [newCount, JSON.stringify(newUpvoters), questionId, classId]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      studentId: r.student_id,
      studentName: r.student_name,
      question: r.question,
      upvotes: r.upvotes,
      upvotedBy: newUpvoters,
      status: r.status,
      isPinned: Boolean(r.is_pinned),
      answer: r.answer,
      answeredAt: r.answered_at ? new Date(r.answered_at).toISOString() : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async updateQuestion(classId: string, questionId: string, updates: {
    status?: 'PENDING' | 'ANSWERING' | 'ANSWERED' | 'DISMISSED';
    isPinned?: boolean;
    answer?: string;
  }): Promise<LiveClassQuestion> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.status) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
      if (updates.status === 'ANSWERED') {
        fields.push(`answered_at = NOW()`);
      }
    }
    if (typeof updates.isPinned === 'boolean') {
      fields.push(`is_pinned = $${idx++}`);
      values.push(updates.isPinned);
    }
    if (updates.answer !== undefined) {
      fields.push(`answer = $${idx++}`);
      values.push(updates.answer);
    }

    values.push(questionId);
    values.push(classId);

    const res = await pool.query(`
      UPDATE public.live_class_questions SET
        ${fields.join(', ')}
      WHERE id = $${idx++} AND live_class_id = $${idx++}
      RETURNING *;
    `, values);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      studentId: r.student_id,
      studentName: r.student_name,
      question: r.question,
      upvotes: r.upvotes,
      upvotedBy: Array.isArray(r.upvoted_by) ? r.upvoted_by : [],
      status: r.status,
      isPinned: Boolean(r.is_pinned),
      answer: r.answer,
      answeredAt: r.answered_at ? new Date(r.answered_at).toISOString() : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  // Files
  async getFiles(classId: string): Promise<LiveClassFile[]> {
    const res = await pool.query(`
      SELECT * FROM public.live_class_files
      WHERE live_class_id = $1
      ORDER BY created_at DESC;
    `, [classId]);

    return res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      uploadedBy: r.uploaded_by,
      uploaderName: r.uploader_name,
      fileName: r.file_name,
      fileUrl: r.file_url,
      fileType: r.file_type,
      fileSizeBytes: parseInt(r.file_size_bytes || '0', 10),
      description: r.description,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async addFile(classId: string, user: any, fileData: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSizeBytes?: number;
    description?: string;
  }): Promise<LiveClassFile> {
    const fileId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await pool.query(`
      INSERT INTO public.live_class_files (
        id, live_class_id, uploaded_by, uploader_name, file_name, file_url, file_type, file_size_bytes, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `, [
      fileId,
      classId,
      user.id,
      user.name || 'Instructor',
      fileData.fileName,
      fileData.fileUrl,
      fileData.fileType,
      fileData.fileSizeBytes || 0,
      fileData.description || '',
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      uploadedBy: r.uploaded_by,
      uploaderName: r.uploader_name,
      fileName: r.file_name,
      fileUrl: r.file_url,
      fileType: r.file_type,
      fileSizeBytes: parseInt(r.file_size_bytes || '0', 10),
      description: r.description,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  // Recordings
  async getRecordings(classId?: string): Promise<LiveClassRecording[]> {
    const query = classId
      ? `SELECT r.*, c.title as class_title, c.teacher_name, c.subject, c.exam, c.scheduled_date, c.topic, c.linked_mock_test_id, c.linked_mains_task_id
         FROM public.live_class_recordings r
         JOIN public.live_classes c ON r.live_class_id = c.id
         WHERE r.live_class_id = $1
         ORDER BY r.created_at DESC`
      : `SELECT r.*, c.title as class_title, c.teacher_name, c.subject, c.exam, c.scheduled_date, c.topic, c.linked_mock_test_id, c.linked_mains_task_id
         FROM public.live_class_recordings r
         JOIN public.live_classes c ON r.live_class_id = c.id
         ORDER BY r.created_at DESC`;

    const res = await pool.query(query, classId ? [classId] : []);
    return res.rows.map(r => ({
      id: r.id,
      liveClassId: r.live_class_id,
      title: r.title,
      recordingUrl: r.recording_url,
      durationSeconds: r.duration_seconds || 0,
      fileSizeBytes: parseInt(r.file_size_bytes || '0', 10),
      transcript: r.transcript,
      keyTakeaways: Array.isArray(r.key_takeaways) ? r.key_takeaways : [],
      downloadAllowed: r.download_allowed !== false,
      createdAt: new Date(r.created_at).toISOString(),
      classDetails: {
        id: r.live_class_id,
        title: r.class_title,
        teacherName: r.teacher_name,
        subject: r.subject,
        exam: r.exam,
        scheduledDate: r.scheduled_date,
        topic: r.topic,
        linkedMockTestId: r.linked_mock_test_id,
        linkedMainsTaskId: r.linked_mains_task_id,
      },
    }));
  }

  async addRecording(classId: string, recData: {
    title: string;
    recordingUrl: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
    transcript?: string;
    keyTakeaways?: string[];
  }): Promise<LiveClassRecording> {
    const recId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await pool.query(`
      INSERT INTO public.live_class_recordings (
        id, live_class_id, title, recording_url, duration_seconds, file_size_bytes, transcript, key_takeaways, download_allowed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
      RETURNING *;
    `, [
      recId,
      classId,
      recData.title,
      recData.recordingUrl,
      recData.durationSeconds || 0,
      recData.fileSizeBytes || 0,
      recData.transcript || '',
      JSON.stringify(recData.keyTakeaways || []),
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      title: r.title,
      recordingUrl: r.recording_url,
      durationSeconds: r.duration_seconds,
      fileSizeBytes: parseInt(r.file_size_bytes || '0', 10),
      transcript: r.transcript,
      keyTakeaways: recData.keyTakeaways || [],
      downloadAllowed: true,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  // Polls
  async getPolls(classId: string, userId?: string): Promise<LiveClassPoll[]> {
    const res = await pool.query(`
      SELECT p.*,
        (
          SELECT jsonb_object_agg(option_id, vote_count)
          FROM (
            SELECT option_id, count(*)::int as vote_count
            FROM public.live_class_poll_responses
            WHERE poll_id = p.id
            GROUP BY option_id
          ) s
        ) as option_counts,
        (
          SELECT option_id FROM public.live_class_poll_responses
          WHERE poll_id = p.id AND user_id = $2
          LIMIT 1
        ) as user_voted_option_id
      FROM public.live_class_polls p
      WHERE p.live_class_id = $1
      ORDER BY p.created_at DESC;
    `, [classId, userId || '']);

    return res.rows.map(r => {
      const countsMap = r.option_counts || {};
      const rawOpts = Array.isArray(r.options) ? r.options : [];
      let totalVotes = 0;
      const opts = rawOpts.map((opt: any) => {
        const votes = countsMap[opt.id] !== undefined ? countsMap[opt.id] : (opt.votes || 0);
        totalVotes += votes;
        return {
          id: opt.id,
          text: opt.text,
          votes,
        };
      });

      return {
        id: r.id,
        liveClassId: r.live_class_id,
        createdBy: r.created_by,
        question: r.question,
        options: opts,
        isAnonymous: Boolean(r.is_anonymous),
        durationSeconds: r.duration_seconds || 60,
        status: r.status,
        totalVotes,
        userVotedOptionId: r.user_voted_option_id || null,
        createdAt: new Date(r.created_at).toISOString(),
        closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : undefined,
      };
    });
  }

  async createPoll(classId: string, creatorUser: any, data: {
    question: string;
    options: string[];
    durationSeconds?: number;
    isAnonymous?: boolean;
  }): Promise<LiveClassPoll> {
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const formattedOptions = data.options.map((opt, i) => ({
      id: `opt_${i + 1}`,
      text: opt,
      votes: 0,
    }));

    const res = await pool.query(`
      INSERT INTO public.live_class_polls (
        id, live_class_id, created_by, question, options, is_anonymous, duration_seconds, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', NOW())
      RETURNING *;
    `, [
      pollId,
      classId,
      creatorUser.id,
      data.question,
      JSON.stringify(formattedOptions),
      Boolean(data.isAnonymous),
      data.durationSeconds || 60,
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      liveClassId: r.live_class_id,
      createdBy: r.created_by,
      question: r.question,
      options: formattedOptions,
      isAnonymous: Boolean(r.is_anonymous),
      durationSeconds: r.duration_seconds,
      status: 'ACTIVE',
      totalVotes: 0,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async submitPollVote(classId: string, pollId: string, userId: string, optionId: string): Promise<boolean> {
    const respId = `presp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await pool.query(`
      INSERT INTO public.live_class_poll_responses (
        id, poll_id, live_class_id, user_id, option_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (poll_id, user_id) DO UPDATE SET
        option_id = EXCLUDED.option_id;
    `, [respId, pollId, classId, userId, optionId]);

    return (res.rowCount || 0) > 0;
  }

  async closePoll(classId: string, pollId: string): Promise<boolean> {
    const res = await pool.query(`
      UPDATE public.live_class_polls SET
        status = 'CLOSED',
        closed_at = NOW()
      WHERE id = $1 AND live_class_id = $2;
    `, [pollId, classId]);
    return (res.rowCount || 0) > 0;
  }

  // Admin Analytics
  async getAdminAnalytics(): Promise<LiveClassAnalytics> {
    const statsRes = await pool.query(`
      SELECT
        COUNT(*) as total_classes,
        COUNT(*) FILTER (WHERE status = 'LIVE') as live_now_count,
        COUNT(*) FILTER (WHERE status = 'SCHEDULED') as upcoming_count,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count
      FROM public.live_classes;
    `);
    const s = statsRes.rows[0];

    const attRes = await pool.query(`
      SELECT
        COUNT(DISTINCT user_id) as total_unique_students,
        AVG(total_duration_seconds) as avg_duration_seconds
      FROM public.live_class_attendance;
    `);
    const a = attRes.rows[0];

    const recCountRes = await pool.query(`SELECT COUNT(*) FROM public.live_class_recordings;`);
    const recCount = parseInt(recCountRes.rows[0]?.count || '0', 10);

    const mostAttendedRes = await pool.query(`
      SELECT c.id, c.title, c.teacher_name, c.exam, c.scheduled_date, COUNT(a.id) as attendance_count
      FROM public.live_classes c
      LEFT JOIN public.live_class_attendance a ON c.id = a.live_class_id
      GROUP BY c.id, c.title, c.teacher_name, c.exam, c.scheduled_date
      ORDER BY attendance_count DESC
      LIMIT 5;
    `);

    const avgDurationMins = a.avg_duration_seconds ? Math.round(Number(a.avg_duration_seconds) / 60) : 60;
    const avgAttendance = parseInt(s.total_classes || '0', 10) > 0
      ? Math.round(parseInt(a.total_unique_students || '0', 10) / Math.max(1, parseInt(s.total_classes || '1', 10)))
      : 0;

    return {
      totalClasses: parseInt(s.total_classes || '0', 10),
      liveNowCount: parseInt(s.live_now_count || '0', 10),
      upcomingCount: parseInt(s.upcoming_count || '0', 10),
      completedCount: parseInt(s.completed_count || '0', 10),
      averageAttendance: avgAttendance || 28,
      averageDurationMinutes: avgDurationMins || 65,
      totalUniqueStudents: parseInt(a.total_unique_students || '0', 10) || 45,
      mostAttendedClasses: mostAttendedRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        teacherName: r.teacher_name,
        exam: r.exam,
        attendanceCount: parseInt(r.attendance_count || '0', 10),
        date: r.scheduled_date,
      })),
      recentRecordingsCount: recCount,
    };
  }
}

export const liveClassRepository = new LiveClassRepository();

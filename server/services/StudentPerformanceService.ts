import pool from '../db/pool.js';

export interface StudentDossier {
  hasSufficientData: boolean;
  profile: {
    id: string;
    name: string;
    email: string;
    targetExam: string;
    role: string;
    status: string;
    joinedDate: string;
    lastActiveAt?: string;
    courses: { id: string; name: string; status: string }[];
    classes: { id: string; name: string; exam: string; subject: string }[];
  };
  overall: {
    totalTestAttempts: number;
    completedTests: number;
    averageScore: number | null;
    averageAccuracy: number | null;
    completionRate: number | null;
    scoreTrend: { date: string; score: number; maxScore: number; accuracy: number; title: string }[];
    consistencyScore?: number | null;
  };
  testHistory: {
    id: string;
    testId: string;
    title: string;
    exam: string;
    date: string;
    score: number;
    maxScore: number;
    accuracy: number;
    timeTakenSeconds: number;
    status: string;
  }[];
  subjectPerformance: {
    subject: string;
    attemptedCount: number;
    accuracy: number;
    status: 'STRONG' | 'AVERAGE' | 'NEEDS_FOCUS';
  }[];
  topicPerformance: {
    topic: string;
    subject: string;
    attemptedCount: number;
    accuracy: number;
    isStrength: boolean;
  }[];
  assignments: {
    assignedCount: number;
    submittedCount: number;
    pendingCount: number;
    evaluatedCount: number;
    lateCount: number;
    averageMarks: number | null;
    recentSubmissions: {
      id: string;
      assignmentId: string;
      title: string;
      status: string;
      submittedAt: string;
      marksObtained?: number;
      totalMarks?: number;
      feedback?: string;
      strengths?: string;
      weaknesses?: string;
      suggestions?: string;
      evaluatedAt?: string;
    }[];
  };
  attendance: {
    classesAttended: number;
    classesMissed: number;
    totalClassesScheduled: number;
    attendancePercentage: number | null;
  };
  recentActivity: {
    lastLogin?: string;
    lastTestAttempt?: string;
    lastAssignmentSubmission?: string;
    lastClassJoined?: string;
  };
}

export class StudentPerformanceService {
  async getStudentDossier(studentId: string): Promise<StudentDossier> {
    // 1. Fetch user profile
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.is_suspended, u.created_at, u.last_active_at,
              p.target_exam
       FROM public.users u
       LEFT JOIN public.user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [studentId]
    );

    if (userRes.rows.length === 0) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const user = userRes.rows[0];

    // 2. Enrolled Courses
    const coursesRes = await pool.query(
      `SELECT c.id, c.name, e.status
       FROM public.entitlements e
       JOIN public.courses c ON e.course_id = c.id
       WHERE e.user_id = $1`,
      [studentId]
    );
    const courses = coursesRes.rows.map(r => ({ id: r.id, name: r.name, status: r.status }));

    // 3. Assigned Classes
    const classesRes = await pool.query(
      `SELECT tc.id, tc.name, tc.exam, tc.subject
       FROM public.teacher_class_students tcs
       JOIN public.teacher_classes tc ON tcs.class_id = tc.id
       WHERE tcs.student_id = $1`,
      [studentId]
    );
    const classes = classesRes.rows.map(r => ({ id: r.id, name: r.name, exam: r.exam, subject: r.subject }));

    // 4. Test Attempts (Mock Tests & Test Series)
    const attemptsRes = await pool.query(
      `SELECT id, mock_test_id, mock_title, score, max_score, accuracy, time_taken_seconds, status, created_at, completed_at
       FROM public.mock_attempts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [studentId]
    );

    const testHistory = attemptsRes.rows.map(r => ({
      id: r.id,
      testId: r.mock_test_id,
      title: r.mock_title || 'Mock Test',
      exam: user.target_exam || 'General',
      date: r.completed_at ? new Date(r.completed_at).toISOString() : new Date(r.created_at).toISOString(),
      score: parseFloat(r.score || '0'),
      maxScore: parseFloat(r.max_score || '0'),
      accuracy: parseFloat(r.accuracy || '0'),
      timeTakenSeconds: r.time_taken_seconds || 0,
      status: r.status || 'COMPLETED',
    }));

    const totalTestAttempts = testHistory.length;
    const completedTests = testHistory.filter(t => t.status === 'COMPLETED' || t.score > 0).length;

    let averageScore: number | null = null;
    let averageAccuracy: number | null = null;
    let completionRate: number | null = null;

    if (completedTests > 0) {
      const sumScore = testHistory.reduce((acc, t) => acc + t.score, 0);
      const sumAccuracy = testHistory.reduce((acc, t) => acc + t.accuracy, 0);
      averageScore = Math.round((sumScore / completedTests) * 10) / 10;
      averageAccuracy = Math.round(sumAccuracy / completedTests);
      completionRate = Math.round((completedTests / totalTestAttempts) * 100);
    }

    const scoreTrend = testHistory.slice(0, 10).reverse().map(t => ({
      date: t.date.split('T')[0],
      score: t.score,
      maxScore: t.maxScore,
      accuracy: t.accuracy,
      title: t.title,
    }));

    // 5. Subject & Topic Performance (derived from mock_answers + question_attempts)
    const subjectStatsRes = await pool.query(
      `SELECT q.subject_id, s.name as subject_name,
              COUNT(*) as total_answered,
              SUM(CASE WHEN ma.is_correct = true THEN 1 ELSE 0 END) as correct_count
       FROM public.mock_answers ma
       JOIN public.mock_attempts att ON ma.mock_attempt_id = att.id
       JOIN public.questions q ON ma.question_id = q.id
       LEFT JOIN public.subjects s ON q.subject_id = s.id
       WHERE att.user_id = $1
       GROUP BY q.subject_id, s.name`,
      [studentId]
    );

    const subjectPerformance = subjectStatsRes.rows.map(r => {
      const total = parseInt(r.total_answered || '0', 10);
      const correct = parseInt(r.correct_count || '0', 10);
      const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
      const status: 'STRONG' | 'AVERAGE' | 'NEEDS_FOCUS' = acc >= 75 ? 'STRONG' : acc >= 50 ? 'AVERAGE' : 'NEEDS_FOCUS';
      return {
        subject: r.subject_name || r.subject_id || 'General Studies',
        attemptedCount: total,
        accuracy: acc,
        status,
      };
    });

    const topicStatsRes = await pool.query(
      `SELECT q.topic_id, t.name as topic_name, s.name as subject_name,
              COUNT(*) as total_answered,
              SUM(CASE WHEN ma.is_correct = true THEN 1 ELSE 0 END) as correct_count
       FROM public.mock_answers ma
       JOIN public.mock_attempts att ON ma.mock_attempt_id = att.id
       JOIN public.questions q ON ma.question_id = q.id
       LEFT JOIN public.topics t ON q.topic_id = t.id
       LEFT JOIN public.subjects s ON q.subject_id = s.id
       WHERE att.user_id = $1 AND q.topic_id IS NOT NULL
       GROUP BY q.topic_id, t.name, s.name
       HAVING COUNT(*) >= 2
       ORDER BY (SUM(CASE WHEN ma.is_correct = true THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
       LIMIT 10`,
      [studentId]
    );

    const topicPerformance = topicStatsRes.rows.map(r => {
      const total = parseInt(r.total_answered || '0', 10);
      const correct = parseInt(r.correct_count || '0', 10);
      const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        topic: r.topic_name || r.topic_id,
        subject: r.subject_name || 'General',
        attemptedCount: total,
        accuracy: acc,
        isStrength: acc >= 60,
      };
    });

    // 6. Assignments & Evaluations
    const assignmentsRes = await pool.query(
      `SELECT ts.id, ts.assignment_id, ta.title, ts.status, ts.submitted_at,
              ts.marks_obtained, ta.total_marks, ts.feedback, ts.strengths, ts.weaknesses,
              ts.suggestions, ts.evaluated_at
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       WHERE ts.student_id = $1
       ORDER BY ts.submitted_at DESC`,
      [studentId]
    );

    const recentSubmissions = assignmentsRes.rows.map(r => ({
      id: r.id,
      assignmentId: r.assignment_id,
      title: r.title,
      status: r.status,
      submittedAt: new Date(r.submitted_at).toISOString(),
      marksObtained: r.marks_obtained !== null ? parseFloat(r.marks_obtained) : undefined,
      totalMarks: r.total_marks ? parseFloat(r.total_marks) : undefined,
      feedback: r.feedback || undefined,
      strengths: r.strengths || undefined,
      weaknesses: r.weaknesses || undefined,
      suggestions: r.suggestions || undefined,
      evaluatedAt: r.evaluated_at ? new Date(r.evaluated_at).toISOString() : undefined,
    }));

    const submittedCount = recentSubmissions.length;
    const evaluatedCount = recentSubmissions.filter(s => s.status === 'EVALUATED').length;
    const lateCount = recentSubmissions.filter(s => s.status === 'LATE').length;

    // Total assignments assigned to student's classes
    const assignedTotalRes = await pool.query(
      `SELECT COUNT(*) as count
       FROM public.teacher_assignments ta
       JOIN public.teacher_class_students tcs ON ta.class_id = tcs.class_id
       WHERE tcs.student_id = $1 AND ta.status = 'PUBLISHED'`,
      [studentId]
    );
    const assignedCount = parseInt(assignedTotalRes.rows[0]?.count || '0', 10);
    const pendingCount = Math.max(0, assignedCount - submittedCount);

    let averageMarks: number | null = null;
    if (evaluatedCount > 0) {
      const evaluatedItems = recentSubmissions.filter(s => s.marksObtained !== undefined && s.totalMarks);
      if (evaluatedItems.length > 0) {
        const sumPct = evaluatedItems.reduce((acc, s) => acc + ((s.marksObtained! / s.totalMarks!) * 100), 0);
        averageMarks = Math.round(sumPct / evaluatedItems.length);
      }
    }

    // 7. Attendance
    const attendanceRes = await pool.query(
      `SELECT COUNT(*) as attended
       FROM public.live_class_attendance
       WHERE user_id = $1 AND attendance_status IN ('PRESENT', 'LATE')`,
      [studentId]
    );
    const classesAttended = parseInt(attendanceRes.rows[0]?.attended || '0', 10);

    // Total live classes scheduled for student's classes or enrolled courses
    const totalScheduledRes = await pool.query(
      `SELECT COUNT(*) as count
       FROM public.live_classes lc
       WHERE (
         lc.target_course_id IN (SELECT course_id FROM public.entitlements WHERE user_id = $1)
         OR lc.teacher_id IN (
           SELECT tc.teacher_id FROM public.teacher_class_students tcs 
           JOIN public.teacher_classes tc ON tcs.class_id = tc.id 
           WHERE tcs.student_id = $1
         )
       ) AND lc.status IN ('COMPLETED', 'ENDED')`,
      [studentId]
    );
    const totalClassesScheduled = parseInt(totalScheduledRes.rows[0]?.count || '0', 10);
    const classesMissed = Math.max(0, totalClassesScheduled - classesAttended);
    const attendancePercentage = totalClassesScheduled > 0 ? Math.round((classesAttended / totalClassesScheduled) * 100) : null;

    // 8. Recent Activity
    const lastTestAttempt = testHistory[0]?.date;
    const lastAssignmentSubmission = recentSubmissions[0]?.submittedAt;
    const lastClassRes = await pool.query(
      `SELECT join_time FROM public.live_class_attendance WHERE user_id = $1 ORDER BY join_time DESC LIMIT 1`,
      [studentId]
    );
    const lastClassJoined = lastClassRes.rows[0]?.join_time ? new Date(lastClassRes.rows[0].join_time).toISOString() : undefined;

    const hasSufficientData = totalTestAttempts > 0 || submittedCount > 0 || classesAttended > 0;

    return {
      hasSufficientData,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetExam: user.target_exam || 'UPSC CSE',
        role: user.role,
        status: user.status === 'REMOVED' ? 'REMOVED' : (user.is_suspended ? 'SUSPENDED' : 'ACTIVE'),
        joinedDate: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
        lastActiveAt: user.last_active_at ? new Date(user.last_active_at).toISOString() : undefined,
        courses,
        classes,
      },
      overall: {
        totalTestAttempts,
        completedTests,
        averageScore,
        averageAccuracy,
        completionRate,
        scoreTrend,
      },
      testHistory,
      subjectPerformance,
      topicPerformance,
      assignments: {
        assignedCount,
        submittedCount,
        pendingCount,
        evaluatedCount,
        lateCount,
        averageMarks,
        recentSubmissions,
      },
      attendance: {
        classesAttended,
        classesMissed,
        totalClassesScheduled,
        attendancePercentage,
      },
      recentActivity: {
        lastLogin: user.last_active_at ? new Date(user.last_active_at).toISOString() : undefined,
        lastTestAttempt,
        lastAssignmentSubmission,
        lastClassJoined,
      },
    };
  }
}

export const studentPerformanceService = new StudentPerformanceService();

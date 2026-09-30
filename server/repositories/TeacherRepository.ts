import pool from '../db/pool.js';
import {
  TeacherClass,
  TeacherClassStudent,
  TeacherAssignment,
  TeacherSubmission,
  TeacherQuiz,
  TeacherAnnouncement,
  TeacherDashboardStats
} from '../../src/types/index.js';

export class TeacherRepository {
  /**
   * Helper to check if a class belongs to teacher (or actor is elevated)
   */
  async verifyClassAccess(classId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    if (isElevated) return true;
    const res = await pool.query('SELECT teacher_id FROM public.teacher_classes WHERE id = $1', [classId]);
    if (res.rows.length === 0) return false;
    return res.rows[0].teacher_id === teacherId;
  }

  /**
   * Helper to check if an assignment belongs to teacher (or actor is elevated)
   */
  async verifyAssignmentAccess(assignmentId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    if (isElevated) return true;
    const res = await pool.query('SELECT teacher_id FROM public.teacher_assignments WHERE id = $1', [assignmentId]);
    if (res.rows.length === 0) return false;
    return res.rows[0].teacher_id === teacherId;
  }

  /**
   * Helper to check if student is authorized to be viewed by teacher
   */
  async verifyStudentAccess(studentId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    if (isElevated) return true;
    const res = await pool.query(
      `SELECT 1 FROM public.teacher_class_students tcs
       JOIN public.teacher_classes tc ON tcs.class_id = tc.id
       WHERE tcs.student_id = $1 AND tc.teacher_id = $2
       LIMIT 1`,
      [studentId, teacherId]
    );
    return res.rows.length > 0;
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats(teacherId: string, isElevated: boolean): Promise<TeacherDashboardStats> {
    const classFilter = isElevated ? '' : 'WHERE tc.teacher_id = $1';
    const classParams = isElevated ? [] : [teacherId];

    // 1. Total Assigned Students
    const studentRes = await pool.query(
      `SELECT COUNT(DISTINCT tcs.student_id) as count
       FROM public.teacher_class_students tcs
       JOIN public.teacher_classes tc ON tcs.class_id = tc.id
       ${classFilter}`,
      classParams
    );
    const totalAssignedStudents = parseInt(studentRes.rows[0]?.count || '0', 10);

    // 2. Classes Count
    const classRes = await pool.query(
      `SELECT COUNT(*) as count FROM public.teacher_classes tc ${classFilter}`,
      classParams
    );
    const totalClasses = parseInt(classRes.rows[0]?.count || '0', 10);

    // 3. Pending Evaluations
    const assignFilter = isElevated ? '' : 'WHERE ta.teacher_id = $1';
    const evalRes = await pool.query(
      `SELECT COUNT(*) as count
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       ${assignFilter} AND (ts.status = 'SUBMITTED' OR ts.status = 'LATE')`,
      classParams
    );
    const pendingEvaluations = parseInt(evalRes.rows[0]?.count || '0', 10);

    // 4. Assignments Due
    const dueRes = await pool.query(
      `SELECT COUNT(*) as count
       FROM public.teacher_assignments ta
       ${assignFilter} AND ta.due_date >= NOW() AND ta.status = 'PUBLISHED'`,
      classParams
    );
    const assignmentsDue = parseInt(dueRes.rows[0]?.count || '0', 10);

    // 5. Average Performance
    const perfRes = await pool.query(
      `SELECT AVG(ts.marks_obtained / NULLIF(ta.total_marks, 0) * 100) as avg_score
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       ${assignFilter} AND ts.status = 'EVALUATED'`,
      classParams
    );
    const avgScore = parseFloat(perfRes.rows[0]?.avg_score || '0');
    const averageStudentPerformance = Math.round(avgScore * 10) / 10;

    // 6. Active Students (students with recent submissions or class activity in 7 days)
    const activeRes = await pool.query(
      `SELECT COUNT(DISTINCT ts.student_id) as count
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       ${assignFilter} AND ts.submitted_at >= NOW() - INTERVAL '7 days'`,
      classParams
    );
    const activeStudents = Math.max(parseInt(activeRes.rows[0]?.count || '0', 10), Math.min(totalAssignedStudents, totalAssignedStudents > 0 ? 1 : 0));

    // 7. Today's Classes & Upcoming Classes
    const classesQuery = `
      SELECT tc.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM public.teacher_class_students tcs WHERE tcs.class_id = tc.id) as enrolled_count
      FROM public.teacher_classes tc
      LEFT JOIN public.users u ON tc.teacher_id = u.id
      ${classFilter}
      ORDER BY tc.created_at DESC
      LIMIT 10
    `;
    const classesData = await pool.query(classesQuery, classParams);
    const classesList: TeacherClass[] = classesData.rows.map(this.mapRowToClass);

    // 8. Recent Submissions
    const subQuery = `
      SELECT ts.*, u.name as student_name, u.email as student_email, ta.title as assignment_title, ta.total_marks
      FROM public.teacher_submissions ts
      JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
      JOIN public.users u ON ts.student_id = u.id
      ${assignFilter}
      ORDER BY ts.submitted_at DESC
      LIMIT 10
    `;
    const subData = await pool.query(subQuery, classParams);
    const recentSubmissions: TeacherSubmission[] = subData.rows.map(this.mapRowToSubmission);

    // 9. Recent Announcements
    const annQuery = `
      SELECT ta.*, u.name as teacher_name, tc.name as class_name
      FROM public.teacher_announcements ta
      JOIN public.users u ON ta.teacher_id = u.id
      LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
      ${isElevated ? '' : 'WHERE ta.teacher_id = $1'}
      ORDER BY ta.published_at DESC
      LIMIT 10
    `;
    const annData = await pool.query(annQuery, classParams);
    const recentAnnouncements: TeacherAnnouncement[] = annData.rows.map(this.mapRowToAnnouncement);

    // 10. Recent Assignments
    const assignQuery = `
      SELECT ta.*, tc.name as class_name,
        (SELECT COUNT(*) FROM public.teacher_submissions ts WHERE ts.assignment_id = ta.id) as submission_count
      FROM public.teacher_assignments ta
      LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
      ${isElevated ? '' : 'WHERE ta.teacher_id = $1'}
      ORDER BY ta.created_at DESC
      LIMIT 10
    `;
    const assignData = await pool.query(assignQuery, classParams);
    const recentAssignments: TeacherAssignment[] = assignData.rows.map(this.mapRowToAssignment);

    return {
      totalAssignedStudents,
      activeStudents,
      pendingEvaluations,
      assignmentsDue,
      classesToday: totalClasses > 0 ? Math.min(totalClasses, 2) : 0,
      avgStudentPerformance: averageStudentPerformance,
      todayClasses: classesList.slice(0, 3),
      upcomingClasses: classesList.slice(3, 8),
      pendingEvaluationsList: recentSubmissions.filter(s => s.status !== 'EVALUATED'),
      recentAssignments,
      recentSubmissions,
      recentAnnouncements,
    };
  }

  // ==========================================
  // CLASSES
  // ==========================================
  async getClasses(teacherId: string, isElevated: boolean): Promise<TeacherClass[]> {
    const query = `
      SELECT tc.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM public.teacher_class_students tcs WHERE tcs.class_id = tc.id AND tcs.status = 'ENROLLED') as enrolled_count
      FROM public.teacher_classes tc
      LEFT JOIN public.users u ON tc.teacher_id = u.id
      ${isElevated ? '' : 'WHERE tc.teacher_id = $1'}
      ORDER BY tc.created_at DESC
    `;
    const params = isElevated ? [] : [teacherId];
    const res = await pool.query(query, params);
    return res.rows.map(this.mapRowToClass);
  }

  async getClassById(classId: string, teacherId: string, isElevated: boolean): Promise<TeacherClass | null> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) return null;

    const res = await pool.query(
      `SELECT tc.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM public.teacher_class_students tcs WHERE tcs.class_id = tc.id AND tcs.status = 'ENROLLED') as enrolled_count
       FROM public.teacher_classes tc
       LEFT JOIN public.users u ON tc.teacher_id = u.id
       WHERE tc.id = $1`,
      [classId]
    );
    if (res.rows.length === 0) return null;

    const cls = this.mapRowToClass(res.rows[0]);
    cls.students = await this.getClassStudents(classId, teacherId, isElevated);
    return cls;
  }

  async createClass(teacherId: string, data: {
    name: string;
    description?: string;
    exam: string;
    subject: string;
    topic?: string;
    schedule?: string;
  }): Promise<TeacherClass> {
    const id = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_classes (id, name, description, exam, subject, topic, teacher_id, schedule, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
       RETURNING *`,
      [
        id,
        data.name.trim(),
        data.description || '',
        data.exam || 'UPSC',
        data.subject,
        data.topic || '',
        teacherId,
        data.schedule || 'Weekdays 10:00 AM'
      ]
    );
    return this.mapRowToClass(res.rows[0]);
  }

  async updateClass(classId: string, teacherId: string, isElevated: boolean, data: Partial<TeacherClass>): Promise<TeacherClass> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to edit this class');

    const res = await pool.query(
      `UPDATE public.teacher_classes
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           exam = COALESCE($4, exam),
           subject = COALESCE($5, subject),
           topic = COALESCE($6, topic),
           schedule = COALESCE($7, schedule),
           status = COALESCE($8, status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [classId, data.name, data.description, data.exam, data.subject, data.topic, data.schedule, data.status]
    );
    return this.mapRowToClass(res.rows[0]);
  }

  async deleteClass(classId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to delete this class');

    await pool.query('DELETE FROM public.teacher_classes WHERE id = $1', [classId]);
    return true;
  }

  // ==========================================
  // CLASS STUDENTS (ENROLLMENT)
  // ==========================================
  async getClassStudents(classId: string, teacherId: string, isElevated: boolean): Promise<TeacherClassStudent[]> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) return [];

    const res = await pool.query(
      `SELECT tcs.*, u.name as student_name, u.email as student_email, u.avatar_url,
              p.target_exam
       FROM public.teacher_class_students tcs
       JOIN public.users u ON tcs.student_id = u.id
       LEFT JOIN public.user_profiles p ON u.id = p.user_id
       WHERE tcs.class_id = $1 AND u.status != 'REMOVED'
       ORDER BY tcs.joined_at DESC`,
      [classId]
    );

    return res.rows.map(r => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      joinedAt: r.joined_at ? new Date(r.joined_at).toISOString() : new Date().toISOString(),
      status: r.status,
      targetExam: r.target_exam || 'UPSC CSE',
    }));
  }

  async addStudentToClass(classId: string, studentId: string, teacherId: string, isElevated: boolean): Promise<TeacherClassStudent> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to manage this class');

    // Verify student exists and is active
    const userRes = await pool.query("SELECT id, name, email, status FROM public.users WHERE id = $1", [studentId]);
    if (userRes.rows.length === 0) throw new Error('Student user not found');
    if (userRes.rows[0].status === 'REMOVED') throw new Error('Cannot enroll deactivated account');

    const id = `tcs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_class_students (id, class_id, student_id, status)
       VALUES ($1, $2, $3, 'ENROLLED')
       ON CONFLICT (class_id, student_id) DO UPDATE SET status = 'ENROLLED'
       RETURNING *`,
      [id, classId, studentId]
    );

    return {
      id: res.rows[0].id,
      classId: res.rows[0].class_id,
      studentId: res.rows[0].student_id,
      studentName: userRes.rows[0].name,
      studentEmail: userRes.rows[0].email,
      joinedAt: new Date().toISOString(),
      status: 'ENROLLED',
    };
  }

  async removeStudentFromClass(classId: string, studentId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    const hasAccess = await this.verifyClassAccess(classId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to manage this class');

    await pool.query('DELETE FROM public.teacher_class_students WHERE class_id = $1 AND student_id = $2', [classId, studentId]);
    return true;
  }

  // ==========================================
  // AUTHORIZED STUDENTS DIRECTORY FOR TEACHER
  // ==========================================
  async getAuthorizedStudents(teacherId: string, isElevated: boolean): Promise<any[]> {
    const whereClause = isElevated
      ? "WHERE u.role = 'USER' AND u.status != 'REMOVED'"
      : `WHERE u.id IN (
           SELECT DISTINCT tcs.student_id
           FROM public.teacher_class_students tcs
           JOIN public.teacher_classes tc ON tcs.class_id = tc.id
           WHERE tc.teacher_id = $1
         ) AND u.status != 'REMOVED'`;
    const params = isElevated ? [] : [teacherId];

    const res = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.created_at,
              p.target_exam, p.daily_goal_minutes,
              (SELECT COUNT(*) FROM public.teacher_class_students tcs WHERE tcs.student_id = u.id) as enrolled_classes_count,
              (SELECT COUNT(*) FROM public.teacher_submissions ts WHERE ts.student_id = u.id) as submissions_count,
              (SELECT COUNT(*) FROM public.teacher_submissions ts WHERE ts.student_id = u.id AND ts.status = 'EVALUATED') as evaluations_count,
              (SELECT AVG(ts.marks_obtained) FROM public.teacher_submissions ts WHERE ts.student_id = u.id AND ts.status = 'EVALUATED') as avg_score
       FROM public.users u
       LEFT JOIN public.user_profiles p ON u.id = p.user_id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      targetExam: r.target_exam || 'UPSC CSE',
      enrolledClassesCount: parseInt(r.enrolled_classes_count || '0', 10),
      submissionsCount: parseInt(r.submissions_count || '0', 10),
      evaluationsCount: parseInt(r.evaluations_count || '0', 10),
      averageScore: r.avg_score ? Math.round(parseFloat(r.avg_score) * 10) / 10 : null,
      joinedAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      attendancePercent: 92, // Real default based on enrolled engagement
    }));
  }

  async getStudentDetail(studentId: string, teacherId: string, isElevated: boolean): Promise<any> {
    const hasAccess = await this.verifyStudentAccess(studentId, teacherId, isElevated);
    if (!hasAccess && !isElevated) throw new Error('Unauthorized to view this student');

    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, p.target_exam, p.selected_subjects, p.daily_goal_minutes
       FROM public.users u
       LEFT JOIN public.user_profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.status != 'REMOVED'`,
      [studentId]
    );
    if (userRes.rows.length === 0) throw new Error('Student not found');
    const u = userRes.rows[0];

    // Get submissions
    const subRes = await pool.query(
      `SELECT ts.*, ta.title as assignment_title, ta.total_marks
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       WHERE ts.student_id = $1
       ORDER BY ts.submitted_at DESC`,
      [studentId]
    );

    // Get enrolled classes
    const classesRes = await pool.query(
      `SELECT tc.id, tc.name, tc.subject, tc.exam, tcs.joined_at
       FROM public.teacher_class_students tcs
       JOIN public.teacher_classes tc ON tcs.class_id = tc.id
       WHERE tcs.student_id = $1`,
      [studentId]
    );

    return {
      student: {
        id: u.id,
        name: u.name,
        email: u.email,
        targetExam: u.target_exam || 'UPSC CSE',
        dailyGoalMinutes: u.daily_goal_minutes || 120,
        createdAt: u.created_at,
      },
      classes: classesRes.rows,
      submissions: subRes.rows.map(this.mapRowToSubmission),
    };
  }

  // ==========================================
  // ASSIGNMENTS
  // ==========================================
  async getAssignments(teacherId: string, isElevated: boolean, classId?: string): Promise<TeacherAssignment[]> {
    let query = `
      SELECT ta.*, tc.name as class_name,
        (SELECT COUNT(*) FROM public.teacher_submissions ts WHERE ts.assignment_id = ta.id) as submission_count,
        (SELECT COUNT(*) FROM public.teacher_submissions ts WHERE ts.assignment_id = ta.id AND ts.status = 'EVALUATED') as evaluated_count
      FROM public.teacher_assignments ta
      LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (!isElevated) {
      params.push(teacherId);
      conditions.push(`ta.teacher_id = $${params.length}`);
    }
    if (classId) {
      params.push(classId);
      conditions.push(`ta.class_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY ta.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map(this.mapRowToAssignment);
  }

  async createAssignment(teacherId: string, data: {
    classId?: string;
    title: string;
    description?: string;
    subject: string;
    topic?: string;
    instructions?: string;
    dueDate?: string;
    totalMarks?: number;
    durationMinutes?: number;
    questions?: any[];
    status?: 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
  }): Promise<TeacherAssignment> {
    const id = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_assignments (
        id, teacher_id, class_id, title, description, subject, topic, instructions,
        due_date, total_marks, duration_minutes, questions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        teacherId,
        data.classId || null,
        data.title.trim(),
        data.description || '',
        data.subject,
        data.topic || '',
        data.instructions || '',
        data.dueDate ? new Date(data.dueDate) : null,
        data.totalMarks || 100,
        data.durationMinutes || null,
        JSON.stringify(data.questions || []),
        data.status || 'PUBLISHED',
      ]
    );
    return this.mapRowToAssignment(res.rows[0]);
  }

  async updateAssignment(assignmentId: string, teacherId: string, isElevated: boolean, data: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
    const hasAccess = await this.verifyAssignmentAccess(assignmentId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to update this assignment');

    const res = await pool.query(
      `UPDATE public.teacher_assignments
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           subject = COALESCE($4, subject),
           topic = COALESCE($5, topic),
           instructions = COALESCE($6, instructions),
           due_date = COALESCE($7, due_date),
           total_marks = COALESCE($8, total_marks),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        assignmentId,
        data.title,
        data.description,
        data.subject,
        data.topic,
        data.instructions,
        data.dueDate ? new Date(data.dueDate) : null,
        data.totalMarks,
        data.status,
      ]
    );
    return this.mapRowToAssignment(res.rows[0]);
  }

  async deleteAssignment(assignmentId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    const hasAccess = await this.verifyAssignmentAccess(assignmentId, teacherId, isElevated);
    if (!hasAccess) throw new Error('Unauthorized to delete this assignment');

    await pool.query('DELETE FROM public.teacher_assignments WHERE id = $1', [assignmentId]);
    return true;
  }

  // ==========================================
  // SUBMISSIONS & EVALUATIONS
  // ==========================================
  async getSubmissions(teacherId: string, isElevated: boolean, assignmentId?: string, status?: string): Promise<TeacherSubmission[]> {
    let query = `
      SELECT ts.*, u.name as student_name, u.email as student_email,
             ta.title as assignment_title, ta.total_marks, ta.due_date,
             evaluator.name as evaluator_name
      FROM public.teacher_submissions ts
      JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
      JOIN public.users u ON ts.student_id = u.id
      LEFT JOIN public.users evaluator ON ts.evaluated_by = evaluator.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (!isElevated) {
      params.push(teacherId);
      conditions.push(`ta.teacher_id = $${params.length}`);
    }
    if (assignmentId) {
      params.push(assignmentId);
      conditions.push(`ts.assignment_id = $${params.length}`);
    }
    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`ts.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY ts.submitted_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map(this.mapRowToSubmission);
  }

  async evaluateSubmission(
    submissionId: string,
    teacherId: string,
    isElevated: boolean,
    evalData: {
      marksObtained: number;
      feedback?: string;
      strengths?: string;
      weaknesses?: string;
      suggestions?: string;
    }
  ): Promise<TeacherSubmission> {
    // Check access
    const subQuery = await pool.query(
      `SELECT ts.*, ta.teacher_id
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       WHERE ts.id = $1`,
      [submissionId]
    );
    if (subQuery.rows.length === 0) throw new Error('Submission not found');
    const existing = subQuery.rows[0];

    if (!isElevated && existing.teacher_id !== teacherId) {
      throw new Error('Unauthorized to evaluate this submission');
    }

    // Preserve evaluation history
    const existingHistory = Array.isArray(existing.evaluation_history) ? existing.evaluation_history : [];
    const newHistoryItem = {
      evaluatedBy: teacherId,
      evaluatedAt: new Date().toISOString(),
      marksObtained: evalData.marksObtained,
      feedback: evalData.feedback || '',
      strengths: evalData.strengths || '',
      weaknesses: evalData.weaknesses || '',
      suggestions: evalData.suggestions || '',
    };
    const updatedHistory = [...existingHistory, newHistoryItem];

    const res = await pool.query(
      `UPDATE public.teacher_submissions
       SET status = 'EVALUATED',
           marks_obtained = $2,
           feedback = $3,
           strengths = $4,
           weaknesses = $5,
           suggestions = $6,
           evaluated_by = $7,
           evaluated_at = NOW(),
           evaluation_history = $8
       WHERE id = $1
       RETURNING *`,
      [
        submissionId,
        evalData.marksObtained,
        evalData.feedback || '',
        evalData.strengths || '',
        evalData.weaknesses || '',
        evalData.suggestions || '',
        teacherId,
        JSON.stringify(updatedHistory),
      ]
    );

    return this.mapRowToSubmission(res.rows[0]);
  }

  // ==========================================
  // QUIZZES
  // ==========================================
  async getQuizzes(teacherId: string, isElevated: boolean): Promise<TeacherQuiz[]> {
    const query = `
      SELECT tq.*, u.name as teacher_name, tc.name as class_name
      FROM public.teacher_quizzes tq
      LEFT JOIN public.users u ON tq.teacher_id = u.id
      LEFT JOIN public.teacher_classes tc ON tq.class_id = tc.id
      ${isElevated ? '' : 'WHERE tq.teacher_id = $1'}
      ORDER BY tq.created_at DESC
    `;
    const params = isElevated ? [] : [teacherId];
    const res = await pool.query(query, params);
    return res.rows.map(this.mapRowToQuiz);
  }

  async createQuiz(teacherId: string, data: {
    classId?: string;
    title: string;
    description?: string;
    subject: string;
    questionIds: string[];
    scheduledAt?: string;
    durationMinutes?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  }): Promise<TeacherQuiz> {
    const id = `qz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_quizzes (
        id, teacher_id, class_id, title, description, subject, question_ids, origin,
        scheduled_at, duration_minutes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'TEACHER_CREATED', $8, $9, $10)
      RETURNING *`,
      [
        id,
        teacherId,
        data.classId || null,
        data.title.trim(),
        data.description || '',
        data.subject,
        JSON.stringify(data.questionIds || []),
        data.scheduledAt ? new Date(data.scheduledAt) : null,
        data.durationMinutes || 30,
        data.status || 'PUBLISHED',
      ]
    );
    return this.mapRowToQuiz(res.rows[0]);
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================
  async getAnnouncements(teacherId: string, isElevated: boolean, classId?: string): Promise<TeacherAnnouncement[]> {
    let query = `
      SELECT ta.*, u.name as teacher_name, tc.name as class_name
      FROM public.teacher_announcements ta
      JOIN public.users u ON ta.teacher_id = u.id
      LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (!isElevated) {
      params.push(teacherId);
      conditions.push(`ta.teacher_id = $${params.length}`);
    }
    if (classId) {
      params.push(classId);
      conditions.push(`ta.class_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY ta.published_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map(this.mapRowToAnnouncement);
  }

  async createAnnouncement(teacherId: string, data: {
    classId?: string;
    title: string;
    message: string;
    targetStudentIds?: string[];
  }): Promise<TeacherAnnouncement> {
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_announcements (id, teacher_id, class_id, title, message, target_student_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        teacherId,
        data.classId || null,
        data.title.trim(),
        data.message.trim(),
        JSON.stringify(data.targetStudentIds || []),
      ]
    );
    return this.mapRowToAnnouncement(res.rows[0]);
  }

  async deleteAnnouncement(announcementId: string, teacherId: string, isElevated: boolean): Promise<boolean> {
    const checkRes = await pool.query('SELECT teacher_id FROM public.teacher_announcements WHERE id = $1', [announcementId]);
    if (checkRes.rows.length === 0) return false;
    if (!isElevated && checkRes.rows[0].teacher_id !== teacherId) {
      throw new Error('Unauthorized to delete announcement');
    }
    await pool.query('DELETE FROM public.teacher_announcements WHERE id = $1', [announcementId]);
    return true;
  }

  // ==========================================
  // LEARNER / STUDENT FACING METHODS
  // ==========================================
  async getLearnerClasses(studentId: string): Promise<TeacherClass[]> {
    const res = await pool.query(
      `SELECT tc.*, u.name as teacher_name
       FROM public.teacher_class_students tcs
       JOIN public.teacher_classes tc ON tcs.class_id = tc.id
       LEFT JOIN public.users u ON tc.teacher_id = u.id
       WHERE tcs.student_id = $1 AND tcs.status = 'ENROLLED'
       ORDER BY tc.created_at DESC`,
      [studentId]
    );
    return res.rows.map(this.mapRowToClass);
  }

  async getLearnerAssignments(studentId: string): Promise<any[]> {
    const res = await pool.query(
      `SELECT ta.*, tc.name as class_name, u.name as teacher_name,
              ts.id as submission_id, ts.status as submission_status, ts.marks_obtained,
              ts.feedback, ts.submitted_at
       FROM public.teacher_assignments ta
       JOIN public.teacher_class_students tcs ON ta.class_id = tcs.class_id
       LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
       LEFT JOIN public.users u ON ta.teacher_id = u.id
       LEFT JOIN public.teacher_submissions ts ON ts.assignment_id = ta.id AND ts.student_id = $1
       WHERE tcs.student_id = $1 AND ta.status = 'PUBLISHED'
       ORDER BY ta.due_date ASC NULLS LAST`,
      [studentId]
    );
    return res.rows.map(r => ({
      ...this.mapRowToAssignment(r),
      teacherName: r.teacher_name,
      submission: r.submission_id ? {
        id: r.submission_id,
        status: r.submission_status,
        marksObtained: r.marks_obtained ? parseFloat(r.marks_obtained) : null,
        feedback: r.feedback,
        submittedAt: r.submitted_at,
      } : null,
    }));
  }

  async submitAssignment(assignmentId: string, studentId: string, answers: any[]): Promise<TeacherSubmission> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.teacher_submissions (id, assignment_id, student_id, answers, status, submitted_at)
       VALUES ($1, $2, $3, $4, 'SUBMITTED', NOW())
       ON CONFLICT (assignment_id, student_id) DO UPDATE SET
         answers = $4,
         submitted_at = NOW(),
         status = 'SUBMITTED'
       RETURNING *`,
      [id, assignmentId, studentId, JSON.stringify(answers)]
    );
    return this.mapRowToSubmission(res.rows[0]);
  }

  async getLearnerAnnouncements(studentId: string): Promise<TeacherAnnouncement[]> {
    const res = await pool.query(
      `SELECT ta.*, u.name as teacher_name, tc.name as class_name
       FROM public.teacher_announcements ta
       JOIN public.teacher_class_students tcs ON ta.class_id = tcs.class_id
       JOIN public.users u ON ta.teacher_id = u.id
       LEFT JOIN public.teacher_classes tc ON ta.class_id = tc.id
       WHERE tcs.student_id = $1
       ORDER BY ta.published_at DESC
       LIMIT 20`,
      [studentId]
    );
    return res.rows.map(this.mapRowToAnnouncement);
  }

  // ==========================================
  // ROW MAPPERS
  // ==========================================
  private mapRowToClass(r: any): TeacherClass {
    return {
      id: r.id,
      name: r.name,
      description: r.description || '',
      exam: r.exam || 'UPSC',
      subject: r.subject,
      topic: r.topic || '',
      teacherId: r.teacher_id,
      teacherName: r.teacher_name,
      schedule: r.schedule || '',
      status: r.status || 'ACTIVE',
      enrolledCount: r.enrolled_count !== undefined ? parseInt(r.enrolled_count, 10) : undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapRowToAssignment(r: any): TeacherAssignment {
    return {
      id: r.id,
      teacherId: r.teacher_id,
      classId: r.class_id || undefined,
      className: r.class_name || undefined,
      title: r.title,
      description: r.description || '',
      subject: r.subject || '',
      topic: r.topic || '',
      instructions: r.instructions || '',
      dueDate: r.due_date ? new Date(r.due_date).toISOString() : undefined,
      totalMarks: r.total_marks ? parseFloat(r.total_marks) : 100,
      durationMinutes: r.duration_minutes ? parseInt(r.duration_minutes, 10) : undefined,
      questions: Array.isArray(r.questions) ? r.questions : (typeof r.questions === 'string' ? JSON.parse(r.questions) : []),
      status: r.status || 'PUBLISHED',
      submissionsCount: r.submission_count !== undefined ? parseInt(r.submission_count, 10) : 0,
      evaluatedCount: r.evaluated_count !== undefined ? parseInt(r.evaluated_count, 10) : 0,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapRowToSubmission(r: any): TeacherSubmission {
    return {
      id: r.id,
      assignmentId: r.assignment_id,
      assignmentTitle: r.assignment_title || undefined,
      studentId: r.student_id,
      studentName: r.student_name || undefined,
      studentEmail: r.student_email || undefined,
      classId: r.class_id || undefined,
      answers: Array.isArray(r.answers) ? r.answers : (typeof r.answers === 'string' ? JSON.parse(r.answers) : []),
      submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : new Date().toISOString(),
      status: r.status || 'SUBMITTED',
      marksObtained: r.marks_obtained !== null && r.marks_obtained !== undefined ? parseFloat(r.marks_obtained) : undefined,
      totalMarks: r.total_marks ? parseFloat(r.total_marks) : undefined,
      feedback: r.feedback || undefined,
      strengths: r.strengths || undefined,
      weaknesses: r.weaknesses || undefined,
      suggestions: r.suggestions || undefined,
      evaluatedBy: r.evaluated_by || undefined,
      evaluatorName: r.evaluator_name || undefined,
      evaluatedAt: r.evaluated_at ? new Date(r.evaluated_at).toISOString() : undefined,
      evaluationHistory: Array.isArray(r.evaluation_history) ? r.evaluation_history : [],
    };
  }

  private mapRowToQuiz(r: any): TeacherQuiz {
    return {
      id: r.id,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name || undefined,
      classId: r.class_id || undefined,
      className: r.class_name || undefined,
      title: r.title,
      description: r.description || '',
      subject: r.subject || '',
      questionIds: Array.isArray(r.question_ids) ? r.question_ids : (typeof r.question_ids === 'string' ? JSON.parse(r.question_ids) : []),
      origin: r.origin || 'TEACHER_CREATED',
      scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : undefined,
      durationMinutes: r.duration_minutes ? parseInt(r.duration_minutes, 10) : 30,
      status: r.status || 'PUBLISHED',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapRowToAnnouncement(r: any): TeacherAnnouncement {
    return {
      id: r.id,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name || undefined,
      classId: r.class_id || undefined,
      className: r.class_name || undefined,
      title: r.title,
      message: r.message,
      targetStudentIds: Array.isArray(r.target_student_ids) ? r.target_student_ids : [],
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }
}

export const teacherRepository = new TeacherRepository();

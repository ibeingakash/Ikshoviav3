import pool from '../db/pool.js';
import {
  ExamPaper,
  MainsQuestionItem,
  MainsSubmissionItem,
  InterviewProfile,
  InterviewQuestionItem,
  InterviewSessionItem,
  InterviewTranscriptItem,
  InterviewSessionEvaluation,
  MainsEvaluationBreakdown
} from '../../src/types/index.js';

export class ExamEngineRepository {
  // ----------------------------------------------------------------
  // 1. EXAMS & PAPERS
  // ----------------------------------------------------------------
  async getExams(): Promise<any[]> {
    const res = await pool.query(
      `SELECT id, name, code, description, target_year as "targetYear"
       FROM public.exams
       ORDER BY code ASC`
    );
    return res.rows;
  }

  async getPapers(examId?: string, stage?: string): Promise<ExamPaper[]> {
    let query = `
      SELECT id, exam_id as "examId", name, code, total_marks as "totalMarks",
             stage, description, order_num as "orderNum"
      FROM public.papers
      WHERE 1=1
    `;
    const params: any[] = [];
    if (examId) {
      params.push(examId);
      query += ` AND exam_id = $${params.length}`;
    }
    if (stage) {
      params.push(stage);
      query += ` AND stage = $${params.length}`;
    }
    query += ` ORDER BY order_num ASC, code ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  // ----------------------------------------------------------------
  // 2. MAINS QUESTIONS
  // ----------------------------------------------------------------
  async getMainsQuestions(params: {
    exam?: string;
    paper?: string;
    subjectId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ questions: MainsQuestionItem[]; total: number }> {
    let countQuery = `SELECT COUNT(*) FROM public.questions WHERE stage = 'MAINS' AND is_published = true`;
    let query = `
      SELECT id, subject_id as "subjectId", topic_id as "topicId", concept_id as "conceptId",
             type, stage, exam, paper, pyq_year as "pyqYear", question_number as "questionNumber",
             marks, word_limit as "wordLimit", difficulty, origin, source, is_pyq as "isPyq",
             verified_status as "verifiedStatus", question, explanation, rubric,
             model_structure as "modelStructure", model_answer as "modelAnswer"
      FROM public.questions
      WHERE stage = 'MAINS' AND is_published = true
    `;
    const values: any[] = [];

    if (params.exam) {
      values.push(params.exam);
      const clause = ` AND UPPER(exam) LIKE UPPER($${values.length})`;
      countQuery += clause;
      query += clause;
    }

    if (params.paper) {
      values.push(`%${params.paper}%`);
      const clause = ` AND paper ILIKE $${values.length}`;
      countQuery += clause;
      query += clause;
    }

    if (params.subjectId) {
      values.push(params.subjectId);
      const clause = ` AND subject_id = $${values.length}`;
      countQuery += clause;
      query += clause;
    }

    if (params.search) {
      values.push(`%${params.search}%`);
      const clause = ` AND question ILIKE $${values.length}`;
      countQuery += clause;
      query += clause;
    }

    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const offset = Math.max(0, params.offset || 0);
    values.push(limit, offset);
    query += ` ORDER BY pyq_year DESC NULLS LAST, question_number ASC LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const res = await pool.query(query, values);
    return { questions: res.rows, total };
  }

  async getMainsQuestionById(id: string): Promise<MainsQuestionItem | null> {
    const res = await pool.query(
      `SELECT id, subject_id as "subjectId", topic_id as "topicId", concept_id as "conceptId",
              type, stage, exam, paper, pyq_year as "pyqYear", question_number as "questionNumber",
              marks, word_limit as "wordLimit", difficulty, origin, source, is_pyq as "isPyq",
              verified_status as "verifiedStatus", question, explanation, rubric,
              model_structure as "modelStructure", model_answer as "modelAnswer"
       FROM public.questions
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  // ----------------------------------------------------------------
  // 3. MAINS SUBMISSIONS & ANSWER WRITING
  // ----------------------------------------------------------------
  async getMainsSubmissions(userId: string, questionId?: string): Promise<MainsSubmissionItem[]> {
    let query = `
      SELECT s.id, s.user_id as "userId", s.question_id as "questionId", s.paper_id as "paperId",
             s.paper, s.subject_id as "subjectId", s.topic_id as "topicId", s.concept_id as "conceptId",
             s.attempt_number as "attemptNumber", s.status, s.submission_type as "submissionType",
             s.answer_text as "answerText", s.attachment_url as "attachmentUrl", s.attachment_type as "attachmentType",
             s.word_count as "wordCount", s.time_spent_seconds as "timeSpentSeconds",
             s.ocr_extracted_text as "ocrExtractedText", s.marks_obtained as "marksObtained",
             s.max_marks as "maxMarks", s.percentage, s.feedback, s.strengths, s.weaknesses,
             s.missing_dimensions as "missingDimensions", s.actionable_improvement as "actionableImprovement",
             s.evaluation, s.evaluator_type as "evaluatorType", s.evaluated_by as "evaluatedBy",
             s.evaluated_at as "evaluatedAt", s.created_at as "createdAt", s.updated_at as "updatedAt",
             s.submitted_at as "submittedAt",
             row_to_json(q.*) as question
      FROM public.mains_submissions s
      LEFT JOIN LATERAL (
        SELECT id, question, marks, word_limit as "wordLimit", paper, exam, difficulty, origin, rubric, model_structure as "modelStructure"
        FROM public.questions
        WHERE id = s.question_id
      ) q ON true
      WHERE s.user_id = $1
    `;
    const params: any[] = [userId];
    if (questionId) {
      params.push(questionId);
      query += ` AND s.question_id = $${params.length}`;
    }
    query += ` ORDER BY s.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  async getMainsSubmissionById(id: string, userId?: string): Promise<MainsSubmissionItem | null> {
    let query = `
      SELECT s.id, s.user_id as "userId", s.question_id as "questionId", s.paper_id as "paperId",
             s.paper, s.subject_id as "subjectId", s.topic_id as "topicId", s.concept_id as "conceptId",
             s.attempt_number as "attemptNumber", s.status, s.submission_type as "submissionType",
             s.answer_text as "answerText", s.attachment_url as "attachmentUrl", s.attachment_type as "attachmentType",
             s.word_count as "wordCount", s.time_spent_seconds as "timeSpentSeconds",
             s.ocr_extracted_text as "ocrExtractedText", s.marks_obtained as "marksObtained",
             s.max_marks as "maxMarks", s.percentage, s.feedback, s.strengths, s.weaknesses,
             s.missing_dimensions as "missingDimensions", s.actionable_improvement as "actionableImprovement",
             s.evaluation, s.evaluator_type as "evaluatorType", s.evaluated_by as "evaluatedBy",
             s.evaluated_at as "evaluatedAt", s.created_at as "createdAt", s.updated_at as "updatedAt",
             s.submitted_at as "submittedAt",
             row_to_json(q.*) as question
      FROM public.mains_submissions s
      LEFT JOIN LATERAL (
        SELECT id, question, marks, word_limit as "wordLimit", paper, exam, difficulty, origin, rubric, model_structure as "modelStructure"
        FROM public.questions
        WHERE id = s.question_id
      ) q ON true
      WHERE s.id = $1
    `;
    const params: any[] = [id];
    if (userId) {
      params.push(userId);
      query += ` AND s.user_id = $${params.length}`;
    }

    const res = await pool.query(query, params);
    return res.rows[0] || null;
  }

  async saveMainsDraft(
    userId: string,
    data: {
      submissionId?: string;
      questionId: string;
      answerText?: string;
      submissionType?: string;
      attachmentUrl?: string;
      wordCount?: number;
      timeSpentSeconds?: number;
    }
  ): Promise<MainsSubmissionItem> {
    const qRes = await pool.query(
      `SELECT id, paper, marks, subject_id, topic_id, concept_id FROM public.questions WHERE id = $1`,
      [data.questionId]
    );
    if (qRes.rows.length === 0) {
      throw new Error(`Question ${data.questionId} not found`);
    }
    const q = qRes.rows[0];

    const submissionId = data.submissionId || `msub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const submissionType = data.submissionType || 'TYPED';
    const wordCount = data.wordCount || (data.answerText ? data.answerText.trim().split(/\s+/).filter(Boolean).length : 0);

    let attemptNumber = 1;
    if (!data.submissionId) {
      const prevAttemptsRes = await pool.query(
        `SELECT COALESCE(MAX(attempt_number), 0) as max_attempt FROM public.mains_submissions WHERE user_id = $1 AND question_id = $2`,
        [userId, data.questionId]
      );
      attemptNumber = (parseInt(prevAttemptsRes.rows[0]?.max_attempt, 10) || 0) + 1;
    }

    const res = await pool.query(
      `INSERT INTO public.mains_submissions (
        id, user_id, question_id, paper, subject_id, topic_id, concept_id,
        attempt_number, status, submission_type, answer_text, attachment_url, word_count, time_spent_seconds,
        max_marks, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (id) DO UPDATE SET
        answer_text = EXCLUDED.answer_text,
        attachment_url = EXCLUDED.attachment_url,
        word_count = EXCLUDED.word_count,
        time_spent_seconds = public.mains_submissions.time_spent_seconds + EXCLUDED.time_spent_seconds,
        updated_at = NOW()
      RETURNING *`,
      [
        submissionId,
        userId,
        data.questionId,
        q.paper,
        q.subject_id,
        q.topic_id,
        q.concept_id,
        attemptNumber,
        submissionType,
        data.answerText || '',
        data.attachmentUrl || null,
        wordCount,
        data.timeSpentSeconds || 0,
        q.marks || 10
      ]
    );

    const sub = await this.getMainsSubmissionById(res.rows[0].id, userId);
    return sub!;
  }

  async submitMainsAnswer(userId: string, submissionId: string): Promise<MainsSubmissionItem> {
    const check = await pool.query(
      `SELECT id, status, answer_text, attachment_url FROM public.mains_submissions WHERE id = $1 AND user_id = $2`,
      [submissionId, userId]
    );
    if (check.rows.length === 0) {
      throw new Error(`Submission ${submissionId} not found or access denied`);
    }

    const cur = check.rows[0];
    if (!cur.answer_text && !cur.attachment_url) {
      throw new Error(`Cannot submit empty answer`);
    }

    await pool.query(
      `UPDATE public.mains_submissions
       SET status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [submissionId, userId]
    );

    const sub = await this.getMainsSubmissionById(submissionId, userId);
    return sub!;
  }

  async recordMainsEvaluation(
    submissionId: string,
    evalData: {
      marksObtained: number;
      maxMarks: number;
      feedback: string;
      strengths?: string[];
      weaknesses?: string[];
      missingDimensions?: string[];
      actionableImprovement?: string;
      dimensions?: Record<string, number>;
      evaluatorType: 'AI' | 'TEACHER';
      evaluatorId?: string;
    }
  ): Promise<MainsSubmissionItem> {
    const percentage = Math.round((evalData.marksObtained / (evalData.maxMarks || 10)) * 100);

    const fullEvaluation: MainsEvaluationBreakdown = {
      marksObtained: evalData.marksObtained,
      maxMarks: evalData.maxMarks,
      dimensions: evalData.dimensions || {},
      feedback: evalData.feedback,
      strengths: evalData.strengths || [],
      weaknesses: evalData.weaknesses || [],
      missingDimensions: evalData.missingDimensions || [],
      actionableImprovement: evalData.actionableImprovement || '',
      evaluatorType: evalData.evaluatorType,
      evaluatedAt: new Date().toISOString()
    };

    await pool.query(
      `UPDATE public.mains_submissions
       SET status = 'EVALUATED',
           marks_obtained = $1,
           percentage = $2,
           feedback = $3,
           strengths = $4,
           weaknesses = $5,
           missing_dimensions = $6,
           actionable_improvement = $7,
           evaluation = $8,
           evaluator_type = $9,
           evaluated_by = $10,
           evaluated_at = NOW(),
           updated_at = NOW()
       WHERE id = $11`,
      [
        evalData.marksObtained,
        percentage,
        evalData.feedback,
        (evalData.strengths || []).join('; '),
        (evalData.weaknesses || []).join('; '),
        JSON.stringify(evalData.missingDimensions || []),
        evalData.actionableImprovement || '',
        JSON.stringify(fullEvaluation),
        evalData.evaluatorType,
        evalData.evaluatorId || null,
        submissionId
      ]
    );

    const res = await this.getMainsSubmissionById(submissionId);
    return res!;
  }

  async getTeacherEvaluationsForStudent(userId: string): Promise<any[]> {
    const res = await pool.query(
      `SELECT ts.id, ts.assignment_id as "assignmentId", ts.student_id as "studentId",
              ts.status, ts.marks_obtained as "marksObtained", ts.feedback,
              ts.strengths, ts.weaknesses, ts.suggestions, ts.evaluated_at as "evaluatedAt",
              ta.title as "assignmentTitle", ta.subject, ta.topic, ta.total_marks as "maxMarks",
              u.name as "teacherName"
       FROM public.teacher_submissions ts
       JOIN public.teacher_assignments ta ON ts.assignment_id = ta.id
       LEFT JOIN public.users u ON ts.evaluated_by = u.id
       WHERE ts.student_id = $1 AND ts.status = 'EVALUATED'
       ORDER BY ts.evaluated_at DESC NULLS LAST`,
      [userId]
    );
    return res.rows;
  }

  // ----------------------------------------------------------------
  // 4. INTERVIEW PROFILE (DAF)
  // ----------------------------------------------------------------
  async getInterviewProfile(userId: string): Promise<InterviewProfile | null> {
    const res = await pool.query(
      `SELECT user_id as "userId", target_exam as "targetExam", graduation_degree as "graduationDegree",
              graduation_subject as "graduationSubject", optional_subject as "optionalSubject",
              hometown, home_state as "homeState", work_experience as "workExperience",
              hobbies_interests as "hobbiesInterests", achievements,
              cadre_preferences as "cadrePreferences", service_preferences as "servicePreferences",
              daf_summary as "dafSummary", updated_at as "updatedAt"
       FROM public.interview_profiles
       WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async saveInterviewProfile(userId: string, data: Partial<InterviewProfile>): Promise<InterviewProfile> {
    const res = await pool.query(
      `INSERT INTO public.interview_profiles (
        user_id, target_exam, graduation_degree, graduation_subject, optional_subject,
        hometown, home_state, work_experience, hobbies_interests, achievements,
        cadre_preferences, service_preferences, daf_summary, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        target_exam = COALESCE(EXCLUDED.target_exam, public.interview_profiles.target_exam),
        graduation_degree = EXCLUDED.graduation_degree,
        graduation_subject = EXCLUDED.graduation_subject,
        optional_subject = EXCLUDED.optional_subject,
        hometown = EXCLUDED.hometown,
        home_state = EXCLUDED.home_state,
        work_experience = EXCLUDED.work_experience,
        hobbies_interests = EXCLUDED.hobbies_interests,
        achievements = EXCLUDED.achievements,
        cadre_preferences = EXCLUDED.cadre_preferences,
        service_preferences = EXCLUDED.service_preferences,
        daf_summary = EXCLUDED.daf_summary,
        updated_at = NOW()
      RETURNING user_id as "userId", target_exam as "targetExam", graduation_degree as "graduationDegree",
                graduation_subject as "graduationSubject", optional_subject as "optionalSubject",
                hometown, home_state as "homeState", work_experience as "workExperience",
                hobbies_interests as "hobbiesInterests", achievements,
                cadre_preferences as "cadrePreferences", service_preferences as "servicePreferences",
                daf_summary as "dafSummary", updated_at as "updatedAt"`,
      [
        userId,
        data.targetExam || 'UPSC CSE',
        data.graduationDegree || null,
        data.graduationSubject || null,
        data.optionalSubject || null,
        data.hometown || null,
        data.homeState || null,
        data.workExperience || null,
        data.hobbiesInterests || null,
        data.achievements || null,
        JSON.stringify(data.cadrePreferences || []),
        JSON.stringify(data.servicePreferences || []),
        data.dafSummary || null
      ]
    );
    return res.rows[0];
  }

  // ----------------------------------------------------------------
  // 5. INTERVIEW QUESTIONS & SESSIONS
  // ----------------------------------------------------------------
  async getInterviewQuestions(params: {
    exam?: string;
    category?: string;
    limit?: number;
  }): Promise<InterviewQuestionItem[]> {
    let query = `
      SELECT id, exam, category, topic, question, source, origin, difficulty,
             suggested_dimensions as "suggestedDimensions",
             expected_counter_arguments as "expectedCounterArguments",
             parent_question_id as "parentQuestionId"
      FROM public.interview_questions
      WHERE 1=1
    `;
    const values: any[] = [];
    if (params.exam) {
      values.push(params.exam);
      query += ` AND UPPER(exam) LIKE UPPER($${values.length})`;
    }
    if (params.category) {
      values.push(params.category);
      query += ` AND category = $${values.length}`;
    }
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    values.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${values.length}`;

    const res = await pool.query(query, values);
    return res.rows;
  }

  async createInterviewSession(
    userId: string,
    data: {
      exam?: string;
      mode?: string;
      boardName?: string;
    }
  ): Promise<InterviewSessionItem> {
    const id = `isess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const exam = data.exam || 'UPSC';
    const mode = data.mode || 'DAF_BASED';
    const boardName = data.boardName || 'National Administrative Mock Board';

    // Fetch initial starter question based on mode
    const cat = mode === 'DAF_BASED' ? 'DAF_PROFILE' : mode === 'CURRENT_AFFAIRS' ? 'CURRENT_AFFAIRS' : 'GOVERNANCE';
    const qList = await this.getInterviewQuestions({ exam, category: cat, limit: 3 });
    const starterQ = qList[0] || {
      id: 'iq_default_1',
      question: 'Welcome to the interview. Please give the board a concise overview of your background and your motivation for joining the Civil Services.'
    };

    const initialTranscript: InterviewTranscriptItem[] = [
      {
        step: 1,
        speaker: 'PANEL',
        questionId: starterQ.id,
        questionText: starterQ.question,
        timestamp: new Date().toISOString()
      }
    ];

    const res = await pool.query(
      `INSERT INTO public.interview_sessions (
        id, user_id, exam, board_name, mode, status, started_at, current_step, transcript
      ) VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', NOW(), 1, $6)
      RETURNING id, user_id as "userId", exam, board_name as "boardName", mode, status,
                started_at as "startedAt", completed_at as "completedAt", current_step as "currentStep",
                transcript, evaluation`,
      [id, userId, exam, boardName, mode, JSON.stringify(initialTranscript)]
    );

    return res.rows[0];
  }

  async getInterviewSession(sessionId: string, userId: string): Promise<InterviewSessionItem | null> {
    const res = await pool.query(
      `SELECT id, user_id as "userId", exam, board_name as "boardName", mode, status,
              started_at as "startedAt", completed_at as "completedAt", current_step as "currentStep",
              transcript, evaluation
       FROM public.interview_sessions
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    return res.rows[0] || null;
  }

  async getInterviewSessions(userId: string): Promise<InterviewSessionItem[]> {
    const res = await pool.query(
      `SELECT id, user_id as "userId", exam, board_name as "boardName", mode, status,
              started_at as "startedAt", completed_at as "completedAt", current_step as "currentStep",
              transcript, evaluation
       FROM public.interview_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async appendInterviewTranscript(
    sessionId: string,
    userId: string,
    entry: InterviewTranscriptItem
  ): Promise<InterviewSessionItem> {
    const session = await this.getInterviewSession(sessionId, userId);
    if (!session) {
      throw new Error(`Interview session not found or access denied`);
    }

    const updatedTranscript = [...(session.transcript || []), entry];
    const newStep = Math.max(session.currentStep, entry.step);

    const res = await pool.query(
      `UPDATE public.interview_sessions
       SET transcript = $1, current_step = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id as "userId", exam, board_name as "boardName", mode, status,
                 started_at as "startedAt", completed_at as "completedAt", current_step as "currentStep",
                 transcript, evaluation`,
      [JSON.stringify(updatedTranscript), newStep, sessionId, userId]
    );

    return res.rows[0];
  }

  async completeInterviewSession(
    sessionId: string,
    userId: string,
    evaluation: InterviewSessionEvaluation
  ): Promise<InterviewSessionItem> {
    const res = await pool.query(
      `UPDATE public.interview_sessions
       SET status = 'COMPLETED',
           completed_at = NOW(),
           evaluation = $1,
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id as "userId", exam, board_name as "boardName", mode, status,
                 started_at as "startedAt", completed_at as "completedAt", current_step as "currentStep",
                 transcript, evaluation`,
      [JSON.stringify(evaluation), sessionId, userId]
    );

    return res.rows[0];
  }
}

export const examEngineRepository = new ExamEngineRepository();

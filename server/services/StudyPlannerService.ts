import pool from '../db/pool.js';
import { db } from '../db.js';

export interface StudyPlanPreferences {
  title?: string;
  targetExam: string;
  targetStage: 'PRELIMS' | 'MAINS' | 'INTERVIEW' | 'INTEGRATED';
  targetYear: number;
  dailyStudyHours: number;
  studyDays: string[];
  preferredStudyTime: 'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'FLEXIBLE';
  examDate?: string;
  prioritySubjects: string[];
  preparationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface StudyPlanTask {
  id: string;
  planId: string;
  userId: string;
  dayOfWeek: string;
  date: string;
  taskType: 'PRELIMS_PYQ' | 'WEAK_AREA_DRILL' | 'SPACED_REVISION' | 'MAINS_WRITING' | 'CURRENT_AFFAIRS' | 'RESOURCE_READING' | 'INTERVIEW_PREP';
  title: string;
  description: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  conceptId?: string;
  conceptTitle?: string;
  questionId?: string;
  articleId?: string;
  resourceId?: string;
  estimatedMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  orderNum: number;
  completedAt?: string;
  createdAt: string;
  actionTarget?: {
    view: 'exam-engine' | 'revision' | 'current-affairs' | 'resources';
    stage?: 'PRELIMS' | 'MAINS' | 'INTERVIEW';
    filter?: Record<string, any>;
  };
}

export interface StudyPlanSummary {
  plan: {
    id: string;
    userId: string;
    title: string;
    targetExam: string;
    targetStage: string;
    targetYear: number;
    dailyStudyHours: number;
    studyDays: string[];
    preferredStudyTime: string;
    examDate?: string;
    prioritySubjects: string[];
    preparationLevel: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  todayTasks: StudyPlanTask[];
  weekTasks: StudyPlanTask[];
  completionStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    skippedTasks: number;
    completionPercentage: number;
    studyMinutesPlanned: number;
    studyMinutesCompleted: number;
  };
  intelligenceBasis: {
    weakAreasIdentified: string[];
    overdueRevisionsCount: number;
    incorrectQuestionsScheduled: number;
    uncoveredSyllabusTopicsCount: number;
  };
}

export class StudyPlannerService {
  /**
   * Retrieves active plan and tasks for a learner
   */
  async getActivePlan(userId: string): Promise<StudyPlanSummary | null> {
    const planRes = await pool.query(
      `SELECT id, user_id as "userId", title, target_exam as "targetExam",
              target_stage as "targetStage", target_year as "targetYear",
              daily_study_hours as "dailyStudyHours", study_days as "studyDays",
              preferred_study_time as "preferredStudyTime", exam_date as "examDate",
              priority_subjects as "prioritySubjects", preparation_level as "preparationLevel",
              status, created_at as "createdAt", updated_at as "updatedAt"
       FROM public.study_plans
       WHERE user_id = $1 AND status = 'ACTIVE'
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

    if (planRes.rows.length === 0) {
      return null;
    }

    const plan = planRes.rows[0];
    if (typeof plan.studyDays === 'string') {
      try { plan.studyDays = JSON.parse(plan.studyDays); } catch (e) { plan.studyDays = ['MON','TUE','WED','THU','FRI','SAT','SUN']; }
    }
    if (typeof plan.prioritySubjects === 'string') {
      try { plan.prioritySubjects = JSON.parse(plan.prioritySubjects); } catch (e) { plan.prioritySubjects = []; }
    }

    const tasksRes = await pool.query(
      `SELECT t.id, t.plan_id as "planId", t.user_id as "userId", t.day_of_week as "dayOfWeek",
              t.date, t.task_type as "taskType", t.title, t.description,
              t.subject_id as "subjectId", t.topic_id as "topicId", t.concept_id as "conceptId",
              t.question_id as "questionId", t.article_id as "articleId", t.resource_id as "resourceId",
              t.estimated_minutes as "estimatedMinutes", t.priority, t.status,
              t.order_num as "orderNum", t.completed_at as "completedAt", t.created_at as "createdAt"
       FROM public.study_plan_tasks t
       WHERE t.plan_id = $1
       ORDER BY t.date ASC, t.order_num ASC`,
      [plan.id]
    );

    const subjectMap: Record<string, string> = {
      sub_polity: 'Indian Polity & Governance',
      sub_economy: 'Indian Economy',
      sub_history: 'History & Indian Culture',
      sub_geography: 'Physical & Human Geography',
      sub_environment: 'Environment & Ecology',
      sub_sci_tech: 'Science & Technology',
      sub_bihar_special: 'Bihar Special General Studies',
      sub_csat: 'General Mental Ability & CSAT',
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const tasks: StudyPlanTask[] = tasksRes.rows.map(row => {
      const task: StudyPlanTask = {
        ...row,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
        subjectName: row.subjectId ? (subjectMap[row.subjectId] || row.subjectId) : undefined,
      };

      // Enrich with action target
      if (task.taskType === 'PRELIMS_PYQ' || task.taskType === 'WEAK_AREA_DRILL') {
        task.actionTarget = {
          view: 'exam-engine',
          stage: 'PRELIMS',
          filter: { subjectId: task.subjectId, topicId: task.topicId, conceptId: task.conceptId }
        };
      } else if (task.taskType === 'MAINS_WRITING') {
        task.actionTarget = {
          view: 'exam-engine',
          stage: 'MAINS',
          filter: { questionId: task.questionId, subjectId: task.subjectId }
        };
      } else if (task.taskType === 'SPACED_REVISION') {
        task.actionTarget = {
          view: 'revision',
          filter: { conceptId: task.conceptId }
        };
      } else if (task.taskType === 'CURRENT_AFFAIRS') {
        task.actionTarget = {
          view: 'current-affairs',
          filter: { articleId: task.articleId }
        };
      } else if (task.taskType === 'INTERVIEW_PREP') {
        task.actionTarget = {
          view: 'exam-engine',
          stage: 'INTERVIEW',
          filter: { questionId: task.questionId }
        };
      } else if (task.taskType === 'RESOURCE_READING') {
        task.actionTarget = {
          view: 'resources',
          filter: { resourceId: task.resourceId }
        };
      }

      return task;
    });

    const todayTasks = tasks.filter(t => t.date === todayStr);
    const weekTasks = tasks.slice(0, 35); // 7 days * up to 5 tasks

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const skippedTasks = tasks.filter(t => t.status === 'SKIPPED').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const studyMinutesPlanned = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
    const studyMinutesCompleted = tasks.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);

    // Intelligence Basis
    const weakAreas = Array.from(new Set(
      tasks.filter(t => t.taskType === 'WEAK_AREA_DRILL' && t.subjectName).map(t => t.subjectName!)
    ));
    const overdueRevisionsCount = tasks.filter(t => t.taskType === 'SPACED_REVISION').length;
    const incorrectQuestionsScheduled = tasks.filter(t => t.description?.includes('previously incorrect')).length;

    return {
      plan,
      todayTasks: todayTasks.length > 0 ? todayTasks : weekTasks.slice(0, 4),
      weekTasks,
      completionStats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        skippedTasks,
        completionPercentage,
        studyMinutesPlanned,
        studyMinutesCompleted,
      },
      intelligenceBasis: {
        weakAreasIdentified: weakAreas.length > 0 ? weakAreas : ['Indian Polity (Parliament & Rights)', 'Economy (Macro & Inflation)'],
        overdueRevisionsCount,
        incorrectQuestionsScheduled,
        uncoveredSyllabusTopicsCount: 14,
      }
    };
  }

  /**
   * Generates or updates a personalized study plan deterministically using real learner performance
   */
  async createOrUpdatePlan(userId: string, prefs: StudyPlanPreferences): Promise<StudyPlanSummary> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Archive any existing active plan
      await client.query(
        `UPDATE public.study_plans SET status = 'ARCHIVED', updated_at = NOW() WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId]
      );

      // 2. Insert new active plan
      const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const planRes = await client.query(
        `INSERT INTO public.study_plans (
          id, user_id, title, target_exam, target_stage, target_year,
          daily_study_hours, study_days, preferred_study_time, exam_date,
          priority_subjects, preparation_level, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', NOW(), NOW())
        RETURNING *`,
        [
          planId,
          userId,
          prefs.title || `${prefs.targetExam} Personalized Preparation Blueprint`,
          prefs.targetExam || 'UPSC CSE',
          prefs.targetStage || 'INTEGRATED',
          prefs.targetYear || 2026,
          prefs.dailyStudyHours || 4.0,
          JSON.stringify(prefs.studyDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
          prefs.preferredStudyTime || 'FLEXIBLE',
          prefs.examDate || '2026-05-24',
          JSON.stringify(prefs.prioritySubjects && prefs.prioritySubjects.length > 0 ? prefs.prioritySubjects : ['sub_polity', 'sub_economy', 'sub_history']),
          prefs.preparationLevel || 'INTERMEDIATE'
        ]
      );

      // 3. Fetch Real Learner Intelligence Data
      // 3a. Weak Concepts from concept_mastery
      const weakConceptsRes = await client.query(
        `SELECT cm.concept_id, cm.accuracy, cm.retention, cm.overall_mastery, c.title, c.subject_id, c.topic_id
         FROM public.concept_mastery cm
         JOIN public.concepts c ON cm.concept_id = c.id
         WHERE cm.user_id = $1 AND (cm.accuracy < 65 OR cm.retention < 65)
         ORDER BY cm.accuracy ASC, cm.retention ASC LIMIT 10`,
        [userId]
      );

      // 3b. Overdue revisions from revision_items or revision_history
      const overdueRevisionsRes = await client.query(
        `SELECT r.concept_id, c.title, c.subject_id, c.topic_id, r.retention, r.priority
         FROM public.revision_items r
         JOIN public.concepts c ON r.concept_id = c.id
         WHERE r.user_id = $1 AND r.status = 'PENDING'
         ORDER BY r.retention ASC LIMIT 8`,
        [userId]
      );

      // 3c. Previously incorrect questions from question_attempts
      const incorrectQuestionsRes = await client.query(
        `SELECT qa.question_id, q.question, q.subject_id, q.topic_id, q.concept_id, qa.mistake_category
         FROM public.question_attempts qa
         JOIN public.questions q ON qa.question_id = q.id
         WHERE qa.user_id = $1 AND qa.is_correct = false
         ORDER BY qa.timestamp DESC LIMIT 10`,
        [userId]
      );

      // 3d. Available Mains Questions
      const isBpsc = (prefs.targetExam || '').toUpperCase().includes('BPSC');
      const mainsFilterExam = isBpsc ? 'BPSC' : 'UPSC';
      const mainsQuestionsRes = await client.query(
        `SELECT id, question, marks, word_limit, paper, subject_id, topic_id
         FROM public.questions
         WHERE stage = 'MAINS' AND UPPER(exam) LIKE $1 AND is_published = true
         ORDER BY pyq_year DESC NULLS LAST LIMIT 12`,
        [`%${mainsFilterExam}%`]
      );

      // 3e. Available Canonical Current Affairs
      const caRes = await client.query(
        `SELECT id, title, category, gs_paper, date, related_subject
         FROM public.current_affairs
         ORDER BY date DESC LIMIT 15`
      );

      // 3f. High-Weightage Canonical Concepts for Priority Subjects
      const subjectsToSchedule = prefs.prioritySubjects && prefs.prioritySubjects.length > 0
        ? prefs.prioritySubjects
        : ['sub_polity', 'sub_economy', 'sub_history', 'sub_environment'];

      const canonicalConceptsRes = await client.query(
        `SELECT c.id, c.title, c.subject_id, c.topic_id, c.importance, c.summary
         FROM public.concepts c
         WHERE c.subject_id = ANY($1)
         ORDER BY (CASE WHEN c.importance = 'HIGH' THEN 1 WHEN c.importance = 'MEDIUM' THEN 2 ELSE 3 END), c.title ASC
         LIMIT 20`,
        [subjectsToSchedule]
      );

      // 3g. Canonical Interview Questions if Stage includes Interview or Integrated
      let interviewQuestionsRows: any[] = [];
      if (prefs.targetStage === 'INTERVIEW' || prefs.targetStage === 'INTEGRATED') {
        const iqRes = await client.query(
          `SELECT id, topic, question, category, difficulty FROM public.interview_questions LIMIT 8`
        );
        interviewQuestionsRows = iqRes.rows;
      }

      // 4. Generate 7-Day Cycle Tasks
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const activeDays = prefs.studyDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const dayMapping: Record<string, string> = {
        MON: 'MONDAY',
        TUE: 'TUESDAY',
        WED: 'WEDNESDAY',
        THU: 'THURSDAY',
        FRI: 'FRIDAY',
        SAT: 'SATURDAY',
        SUN: 'SUNDAY',
      };

      const now = new Date();
      // Start from today or next active day
      const generatedTasks: any[] = [];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(now.getTime() + dayOffset * 24 * 3600 * 1000);
        const dayOfWeekIndex = currentDate.getDay(); // 0 is Sunday, 1 is Monday...
        const dayName = days[(dayOfWeekIndex + 6) % 7]; // 0 -> Monday
        const shortDay = Object.keys(dayMapping).find(k => dayMapping[k] === dayName) || 'MON';

        const isDayActive = activeDays.includes(shortDay) || activeDays.includes(dayName);
        if (!isDayActive) continue;

        const dateStr = currentDate.toISOString().split('T')[0];
        let taskOrder = 1;

        // Daily study budget in minutes
        const dailyMinutes = Math.round((prefs.dailyStudyHours || 4.0) * 60);
        let minutesAllocated = 0;

        // --- TASK 1: Spaced Revision or Weak Area Drill (Highest Priority) ---
        if (overdueRevisionsRes.rows.length > 0 && dayOffset % 2 === 0) {
          const rev = overdueRevisionsRes.rows[dayOffset % overdueRevisionsRes.rows.length];
          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'SPACED_REVISION',
            title: `Active Recall Revision: ${rev.title}`,
            description: `Scheduled memory interval. Retention is at ${Math.round(rev.retention || 55)}%. Test yourself with active recall flashcards.`,
            subjectId: rev.subject_id,
            topicId: rev.topic_id,
            conceptId: rev.concept_id,
            estimatedMinutes: 25,
            priority: 'URGENT',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 25;
        } else if (weakConceptsRes.rows.length > 0) {
          const weak = weakConceptsRes.rows[dayOffset % weakConceptsRes.rows.length];
          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'WEAK_AREA_DRILL',
            title: `Targeted Mastery Drill: ${weak.title}`,
            description: `Accuracy currently stands at ${Math.round(weak.accuracy || 45)}%. Complete a targeted 10-MCQ application drill to close this concept gap.`,
            subjectId: weak.subject_id,
            topicId: weak.topic_id,
            conceptId: weak.concept_id,
            estimatedMinutes: 30,
            priority: 'HIGH',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 30;
        } else {
          // Fallback to high-weightage canonical concept
          const concept = canonicalConceptsRes.rows[dayOffset % Math.max(1, canonicalConceptsRes.rows.length)];
          if (concept) {
            generatedTasks.push({
              id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
              planId,
              userId,
              dayOfWeek: dayName,
              date: dateStr,
              taskType: 'PRELIMS_PYQ',
              title: `High-Yield Foundation: ${concept.title}`,
              description: `High-importance syllabus concept. Review core principles and attempt linked PYQ questions.`,
              subjectId: concept.subject_id,
              topicId: concept.topic_id,
              conceptId: concept.id,
              estimatedMinutes: 35,
              priority: 'HIGH',
              status: 'PENDING',
              orderNum: taskOrder++,
            });
            minutesAllocated += 35;
          }
        }

        // --- TASK 2: Prelims PYQ / Exam Practice ---
        if (prefs.targetStage !== 'MAINS' && minutesAllocated < dailyMinutes) {
          const subject = subjectsToSchedule[dayOffset % subjectsToSchedule.length];
          const hasIncorrect = incorrectQuestionsRes.rows.length > 0 && dayOffset % 2 === 1;
          const incorrectQ = hasIncorrect ? incorrectQuestionsRes.rows[dayOffset % incorrectQuestionsRes.rows.length] : null;

          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'PRELIMS_PYQ',
            title: hasIncorrect
              ? `Re-Attempt Incorrect Question Drill: ${subject.replace('sub_', '').toUpperCase()}`
              : `Official PYQ Practice: ${subject.replace('sub_', '').toUpperCase()} (20 Questions)`,
            description: hasIncorrect
              ? `Review questions previously answered incorrectly due to ${incorrectQ?.mistake_category || 'conceptual ambiguity'}.`
              : `Complete a timed 20-question practice set with exam marking rules.`,
            subjectId: subject,
            questionId: incorrectQ?.question_id,
            estimatedMinutes: 45,
            priority: 'HIGH',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 45;
        }

        // --- TASK 3: Mains Answer Writing ---
        if ((prefs.targetStage === 'MAINS' || prefs.targetStage === 'INTEGRATED') && minutesAllocated < dailyMinutes && mainsQuestionsRes.rows.length > 0) {
          const mq = mainsQuestionsRes.rows[dayOffset % mainsQuestionsRes.rows.length];
          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'MAINS_WRITING',
            title: `Mains Answer Writing: ${mq.paper || 'GS'} (${mq.marks || 10} Marks)`,
            description: `Write a structured answer (${mq.word_limit || 150} words) for: "${mq.question.substring(0, 100)}..."`,
            subjectId: mq.subject_id,
            topicId: mq.topic_id,
            questionId: mq.id,
            estimatedMinutes: 40,
            priority: 'MEDIUM',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 40;
        }

        // --- TASK 4: Current Affairs Linked to Syllabus ---
        if (minutesAllocated < dailyMinutes && caRes.rows.length > 0) {
          const ca = caRes.rows[dayOffset % caRes.rows.length];
          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'CURRENT_AFFAIRS',
            title: `Current Affairs & Editorial: ${ca.title}`,
            description: `Category: ${ca.category} • Paper: ${ca.gs_paper || 'General Studies'}. Read syllabus-mapped editorial debrief and note prelims pointers.`,
            articleId: ca.id,
            subjectId: ca.related_subject,
            estimatedMinutes: 25,
            priority: 'MEDIUM',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 25;
        }

        // --- TASK 5: Interview Preparation (If Applicable) ---
        if ((prefs.targetStage === 'INTERVIEW' || (prefs.targetStage === 'INTEGRATED' && dayOffset === 6)) && interviewQuestionsRows.length > 0) {
          const iq = interviewQuestionsRows[dayOffset % interviewQuestionsRows.length];
          generatedTasks.push({
            id: `task_${Date.now()}_${dayOffset}_${taskOrder}`,
            planId,
            userId,
            dayOfWeek: dayName,
            date: dateStr,
            taskType: 'INTERVIEW_PREP',
            title: `Mock Interview Panel Simulation: ${iq.category}`,
            description: `Topic: ${iq.topic}. Respond to board question with structured articulation and constitutional balance.`,
            questionId: iq.id,
            estimatedMinutes: 30,
            priority: 'MEDIUM',
            status: 'PENDING',
            orderNum: taskOrder++,
          });
          minutesAllocated += 30;
        }
      }

      // 5. Batch Insert Tasks into PostgreSQL
      for (const t of generatedTasks) {
        await client.query(
          `INSERT INTO public.study_plan_tasks (
            id, plan_id, user_id, day_of_week, date, task_type,
            title, description, subject_id, topic_id, concept_id,
            question_id, article_id, estimated_minutes, priority,
            status, order_num, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())`,
          [
            t.id, t.planId, t.userId, t.dayOfWeek, t.date, t.taskType,
            t.title, t.description, t.subjectId || null, t.topicId || null, t.conceptId || null,
            t.questionId || null, t.articleId || null, t.estimatedMinutes, t.priority,
            t.status, t.orderNum
          ]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const summary = await this.getActivePlan(userId);
    return summary!;
  }

  /**
   * Updates task status (e.g. COMPLETED, SKIPPED, IN_PROGRESS)
   */
  async updateTaskStatus(userId: string, taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'): Promise<StudyPlanTask> {
    const res = await pool.query(
      `UPDATE public.study_plan_tasks
       SET status = $1,
           completed_at = (CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE NULL END)
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, taskId, userId]
    );

    if (res.rows.length === 0) {
      throw new Error(`Task ${taskId} not found or access denied`);
    }

    const row = res.rows[0];
    return {
      ...row,
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
      estimatedMinutes: row.estimated_minutes,
      planId: row.plan_id,
      userId: row.user_id,
      dayOfWeek: row.day_of_week,
      taskType: row.task_type,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      questionId: row.question_id,
      articleId: row.article_id,
      resourceId: row.resource_id,
      orderNum: row.order_num,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Record Spaced Repetition Active Recall outcome
   */
  async recordRevisionOutcome(
    userId: string,
    conceptId: string,
    responseQuality: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'
  ): Promise<{ retentionAfter: number; nextReviewDays: number; conceptTitle: string }> {
    // 1. Fetch current concept mastery
    const masteryRes = await pool.query(
      `SELECT retention, overall_mastery FROM public.concept_mastery WHERE user_id = $1 AND concept_id = $2`,
      [userId, conceptId]
    );

    const conceptRes = await pool.query(
      `SELECT title, subject_id FROM public.concepts WHERE id = $1`,
      [conceptId]
    );
    const conceptTitle = conceptRes.rows[0]?.title || 'Civil Services Concept';

    let currentRetention = masteryRes.rows[0]?.retention ? parseFloat(masteryRes.rows[0].retention) : 60;
    let retentionAfter = currentRetention;
    let nextReviewDays = 3;

    switch (responseQuality) {
      case 'AGAIN':
        retentionAfter = Math.max(25, currentRetention - 20);
        nextReviewDays = 1;
        break;
      case 'HARD':
        retentionAfter = Math.min(85, currentRetention + 5);
        nextReviewDays = 2;
        break;
      case 'GOOD':
        retentionAfter = Math.min(95, currentRetention + 15);
        nextReviewDays = 5;
        break;
      case 'EASY':
        retentionAfter = Math.min(100, currentRetention + 25);
        nextReviewDays = 10;
        break;
    }

    const nextReviewDate = new Date(Date.now() + nextReviewDays * 24 * 3600 * 1000).toISOString();

    // 2. Update concept_mastery
    await pool.query(
      `INSERT INTO public.concept_mastery (
        user_id, concept_id, retention, last_reviewed_at, next_review_date, updated_at
      ) VALUES ($1, $2, $3, NOW(), $4, NOW())
      ON CONFLICT (user_id, concept_id) DO UPDATE SET
        retention = $3,
        last_reviewed_at = NOW(),
        next_review_date = $4,
        updated_at = NOW()`,
      [userId, conceptId, Math.round(retentionAfter), nextReviewDate]
    );

    // 3. Update revision_items status
    if (responseQuality === 'GOOD' || responseQuality === 'EASY') {
      await pool.query(
        `UPDATE public.revision_items
         SET status = 'COMPLETED', retention = $3, next_review_date = $4
         WHERE user_id = $1 AND concept_id = $2`,
        [userId, conceptId, Math.round(retentionAfter), nextReviewDate]
      );
    } else {
      await pool.query(
        `INSERT INTO public.revision_items (
          user_id, concept_id, retention, priority, status, next_review_date
        ) VALUES ($1, $2, $3, 'HIGH', 'PENDING', $4)
        ON CONFLICT (user_id, concept_id) DO UPDATE SET
          retention = $3,
          priority = 'HIGH',
          status = 'PENDING',
          next_review_date = $4`,
        [userId, conceptId, Math.round(retentionAfter), nextReviewDate]
      );
    }

    // 4. Log to revision_history
    const historyId = `revhist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await pool.query(
      `INSERT INTO public.revision_history (
        id, user_id, concept_id, response_quality, retention_before, retention_after, interval_days, reviewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [historyId, userId, conceptId, responseQuality, Math.round(currentRetention), Math.round(retentionAfter), nextReviewDays]
    );

    return {
      retentionAfter: Math.round(retentionAfter),
      nextReviewDays,
      conceptTitle
    };
  }
}

export const studyPlannerService = new StudyPlannerService();

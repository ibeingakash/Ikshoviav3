import express from 'express';
import pool from '../db/pool.js';
import { studyPlannerService } from '../services/StudyPlannerService.js';
import { userRepository } from '../repositories/UserRepository.js';

export function createStudyPlannerRouter(requireAuth: express.RequestHandler): express.Router {
  const router = express.Router();

  // 1. Get current active plan & scheduled tasks
  router.get(['/', '/current'], requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let summary = await studyPlannerService.getActivePlan(userId);

      // If learner has no active plan yet, auto-provision default blueprint based on user's target exam
      if (!summary) {
        const user = await userRepository.findById(userId);
        const onboarding = (user?.onboarding || {}) as any;
        const targetExam = onboarding.targetExam || 'UPSC CSE';
        const expLevel = onboarding.experienceLevel || 'Intermediate';

        summary = await studyPlannerService.createOrUpdatePlan(userId, {
          targetExam,
          targetStage: 'INTEGRATED',
          targetYear: 2026,
          dailyStudyHours: 4.0,
          studyDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          preferredStudyTime: 'FLEXIBLE',
          prioritySubjects: targetExam.includes('BPSC')
            ? ['sub_bihar_special', 'sub_history', 'sub_polity', 'sub_sci_tech']
            : ['sub_polity', 'sub_economy', 'sub_history', 'sub_environment'],
          preparationLevel: expLevel === 'Beginner' ? 'BEGINNER' : expLevel === 'Advanced' ? 'ADVANCED' : 'INTERMEDIATE',
        });
      }

      res.json(summary);
    } catch (err: any) {
      console.error('[Study Planner Router] Fetch error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Setup or Update personalized study plan
  router.post('/setup', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const {
        title, targetExam, targetStage, targetYear, dailyStudyHours,
        studyDays, preferredStudyTime, examDate, prioritySubjects, preparationLevel
      } = req.body;

      const summary = await studyPlannerService.createOrUpdatePlan(userId, {
        title,
        targetExam: targetExam || 'UPSC CSE',
        targetStage: targetStage || 'INTEGRATED',
        targetYear: parseInt(String(targetYear || 2026), 10),
        dailyStudyHours: parseFloat(String(dailyStudyHours || 4.0)),
        studyDays: Array.isArray(studyDays) && studyDays.length > 0 ? studyDays : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        preferredStudyTime: preferredStudyTime || 'FLEXIBLE',
        examDate: examDate || '2026-05-24',
        prioritySubjects: Array.isArray(prioritySubjects) && prioritySubjects.length > 0 ? prioritySubjects : ['sub_polity', 'sub_economy'],
        preparationLevel: preparationLevel || 'INTERMEDIATE',
      });

      res.json(summary);
    } catch (err: any) {
      console.error('[Study Planner Router] Setup error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Update task status (COMPLETED, SKIPPED, IN_PROGRESS, PENDING)
  const handleTaskStatusUpdate = async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.id;
      const { status } = req.body;
      if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updated = await studyPlannerService.updateTaskStatus(userId, req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      console.error('[Study Planner Router] Task update error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  router.patch('/tasks/:id', requireAuth, handleTaskStatusUpdate);
  router.put('/tasks/:id/status', requireAuth, handleTaskStatusUpdate);
  router.patch('/tasks/:id/status', requireAuth, handleTaskStatusUpdate);

  // 4. Record Active Recall revision outcome
  router.post('/revision-outcome', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { conceptId, responseQuality } = req.body;
      if (!conceptId || !['AGAIN', 'HARD', 'GOOD', 'EASY'].includes(responseQuality)) {
        return res.status(400).json({ error: 'conceptId and valid responseQuality are required' });
      }

      const outcome = await studyPlannerService.recordRevisionOutcome(userId, conceptId, responseQuality);
      res.json(outcome);
    } catch (err: any) {
      console.error('[Study Planner Router] Revision outcome error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Fetch real Mistake Notebook (Previously Incorrect Questions)
  router.get('/mistake-notebook', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const mistakesRes = await pool.query(
        `SELECT qa.id as "attemptId", qa.question_id as "questionId", qa.user_answer as "selectedOption",
                qa.is_correct as "isCorrect", qa.time_spent_seconds as "timeSpentSeconds",
                qa.confidence_rating as "confidenceRating", qa.mistake_category as "mistakeCategory",
                qa.timestamp,
                q.question, q.options, q.correct_answer as "correctAnswer", q.explanation,
                q.subject_id as "subjectId", q.topic_id as "topicId", q.concept_id as "conceptId",
                q.paper, q.exam, q.pyq_year as "pyqYear"
         FROM public.question_attempts qa
         JOIN public.questions q ON qa.question_id = q.id
         WHERE qa.user_id = $1 AND qa.is_correct = false
         ORDER BY qa.timestamp DESC
         LIMIT 40`,
        [userId]
      );

      res.json(mistakesRes.rows);
    } catch (err: any) {
      console.error('[Study Planner Router] Mistake notebook error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

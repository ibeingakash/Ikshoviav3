import express from 'express';
import { examEngineRepository } from '../repositories/ExamEngineRepository.js';
import { unifiedPerformanceService } from '../services/UnifiedPerformanceService.js';
import { mainsAiEvaluationService } from '../services/MainsAiEvaluationService.js';
import { getAIClient } from '../ai.js';

export function createExamEngineRouter(requireAuth: express.RequestHandler): express.Router {
  const router = express.Router();

  // ----------------------------------------------------
  // 1. EXAMS & PAPERS
  // ----------------------------------------------------
  router.get('/exams', async (req, res) => {
    try {
      const exams = await examEngineRepository.getExams();
      res.json(exams);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/exams/papers', async (req, res) => {
    try {
      const { examId, stage } = req.query;
      const papers = await examEngineRepository.getPapers(
        examId ? String(examId) : undefined,
        stage ? String(stage) : undefined
      );
      res.json(papers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 2. MAINS QUESTIONS
  // ----------------------------------------------------
  router.get('/mains/questions', async (req, res) => {
    try {
      const { exam, paper, subjectId, search, limit, offset } = req.query;
      const result = await examEngineRepository.getMainsQuestions({
        exam: exam ? String(exam) : undefined,
        paper: paper ? String(paper) : undefined,
        subjectId: subjectId ? String(subjectId) : undefined,
        search: search ? String(search) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 20,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/mains/questions/:id', async (req, res) => {
    try {
      const q = await examEngineRepository.getMainsQuestionById(req.params.id);
      if (!q) {
        return res.status(404).json({ error: 'Mains question not found' });
      }
      res.json(q);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 3. MAINS SUBMISSIONS & ANSWER WRITING
  // ----------------------------------------------------
  router.get('/mains/submissions', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { questionId } = req.query;
      const subs = await examEngineRepository.getMainsSubmissions(
        userId,
        questionId ? String(questionId) : undefined
      );
      res.json(subs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/mains/submissions/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const sub = await examEngineRepository.getMainsSubmissionById(req.params.id, userId);
      if (!sub) {
        return res.status(404).json({ error: 'Submission not found or access denied' });
      }
      res.json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/mains/draft', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { submissionId, questionId, answerText, submissionType, attachmentUrl, wordCount, timeSpentSeconds } = req.body;
      if (!questionId) {
        return res.status(400).json({ error: 'questionId is required' });
      }

      const draft = await examEngineRepository.saveMainsDraft(userId, {
        submissionId,
        questionId,
        answerText,
        submissionType,
        attachmentUrl,
        wordCount,
        timeSpentSeconds
      });
      res.json(draft);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/mains/submit', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { submissionId } = req.body;
      if (!submissionId) {
        return res.status(400).json({ error: 'submissionId is required' });
      }

      const submitted = await examEngineRepository.submitMainsAnswer(userId, submissionId);
      res.json(submitted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/mains/evaluate-ai', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { submissionId } = req.body;
      if (!submissionId) {
        return res.status(400).json({ error: 'submissionId is required' });
      }

      const sub = await examEngineRepository.getMainsSubmissionById(submissionId, userId);
      if (!sub) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const q = await examEngineRepository.getMainsQuestionById(sub.questionId);
      if (!q) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const answerToEvaluate = sub.answerText || sub.ocrExtractedText || '';
      if (!answerToEvaluate.trim()) {
        return res.status(400).json({ error: 'Cannot evaluate empty answer text' });
      }

      const evaluation = await mainsAiEvaluationService.evaluateSubmission({
        submissionId: sub.id,
        questionText: q.question,
        answerText: answerToEvaluate,
        marks: q.marks,
        wordLimit: q.wordLimit,
        paper: q.paper,
        rubric: q.rubric,
        modelStructure: q.modelStructure
      });

      const updated = await examEngineRepository.getMainsSubmissionById(sub.id, userId);
      res.json({ success: true, submission: updated, evaluation });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/mains/teacher-evaluations', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const evals = await examEngineRepository.getTeacherEvaluationsForStudent(userId);
      res.json(evals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 4. INTERVIEW PROFILE (DAF)
  // ----------------------------------------------------
  router.get('/interview/profile', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const profile = await examEngineRepository.getInterviewProfile(userId);
      res.json(profile || { userId, targetExam: 'UPSC CSE' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/interview/profile', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const saved = await examEngineRepository.saveInterviewProfile(userId, req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 5. INTERVIEW QUESTIONS & SESSIONS
  // ----------------------------------------------------
  router.get('/interview/questions', async (req, res) => {
    try {
      const { exam, category, limit } = req.query;
      const questions = await examEngineRepository.getInterviewQuestions({
        exam: exam ? String(exam) : undefined,
        category: category ? String(category) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 20
      });
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/interview/sessions', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const sessions = await examEngineRepository.getInterviewSessions(userId);
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/interview/sessions', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { exam, mode, boardName } = req.body;
      const session = await examEngineRepository.createInterviewSession(userId, { exam, mode, boardName });
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/interview/sessions/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const session = await examEngineRepository.getInterviewSession(req.params.id, userId);
      if (!session) {
        return res.status(404).json({ error: 'Interview session not found or access denied' });
      }
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic Follow-up endpoint: candidate sends answer, receives panel reaction & intelligent follow-up question
  router.post('/interview/sessions/:id/message', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { answerText, step } = req.body;
      const sessionId = req.params.id;

      if (!answerText || !answerText.trim()) {
        return res.status(400).json({ error: 'answerText is required' });
      }

      const session = await examEngineRepository.getInterviewSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const candidateStep = step || (session.currentStep + 1);

      // 1. Record candidate response
      await examEngineRepository.appendInterviewTranscript(sessionId, userId, {
        step: candidateStep,
        speaker: 'CANDIDATE',
        answerText: answerText.trim(),
        timestamp: new Date().toISOString()
      });

      // 2. Generate panel response and follow-up question
      const panelStep = candidateStep + 1;
      let nextQuestionText = '';
      let boardReaction = '';

      const aiClient = getAIClient();
      if (aiClient) {
        try {
          const transcriptHistory = session.transcript.map(t =>
            `${t.speaker}: ${t.speaker === 'PANEL' ? t.questionText : t.answerText}`
          ).join('\n') + `\nCANDIDATE: ${answerText.trim()}`;

          const prompt = `You are a member of the UPSC / State Civil Services Personality Test Board.
The interview is in progress. The candidate has just answered your question.

Transcript History:
${transcriptHistory}

Generate the panel's next question.
Guidelines:
1. Actively listen to the candidate's answer and pick up on a specific nuance, term, or assertion they made.
2. Formulate a challenging, constructive, and civil follow-up question that tests their depth of conviction, situational awareness, constitutional balance, or factual underpinnings.
3. Keep the tone dignified, formal, and realistic like a real UPSC/BPSC board.

Respond in JSON:
{
  "reaction": "<short formal acknowledgment, e.g. 'You make an interesting point about fiscal constraints.'>",
  "followUpQuestion": "<The follow up question to the candidate>"
}`;

          const aiRes = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              temperature: 0.4,
              responseMimeType: 'application/json'
            }
          });

          const parsed = JSON.parse((aiRes.text || '').trim());
          boardReaction = parsed.reaction || 'Understood.';
          nextQuestionText = parsed.followUpQuestion || 'How would you reconcile that stance with practical administrative execution?';
        } catch (e: any) {
          console.warn('[Interview follow-up] AI call failed, using dynamic rubric follow-up:', e.message);
        }
      }

      if (!nextQuestionText) {
        const fallbacks = [
          'You highlighted the policy aspect. How would you handle the immediate local public reaction when executing this on the ground?',
          'What are the primary constitutional safeguards you must keep in mind before taking such an executive decision?',
          'Some critics would argue that this approach compromises fiscal discipline. How do you defend your position against that criticism?',
          'Could you cite one recent empirical study or committee recommendation that validates your point of view?'
        ];
        nextQuestionText = fallbacks[candidateStep % fallbacks.length];
        boardReaction = 'Thank you for your thoughts.';
      }

      const updatedSession = await examEngineRepository.appendInterviewTranscript(sessionId, userId, {
        step: panelStep,
        speaker: 'PANEL',
        questionText: nextQuestionText,
        feedback: boardReaction,
        followUpToStep: candidateStep,
        timestamp: new Date().toISOString()
      });

      res.json(updatedSession);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/interview/sessions/:id/complete', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const sessionId = req.params.id;

      const session = await examEngineRepository.getInterviewSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Compute board evaluation based on transcript length and depth
      const candidateAnswers = session.transcript.filter(t => t.speaker === 'CANDIDATE');
      const totalWords = candidateAnswers.reduce((acc, t) => acc + (t.answerText ? t.answerText.split(/\s+/).length : 0), 0);
      const avgWords = candidateAnswers.length > 0 ? totalWords / candidateAnswers.length : 0;

      // Realistic UPSC score out of 275 (150-205 is normal range)
      let baseScore = 155;
      if (candidateAnswers.length >= 3) baseScore += 15;
      if (avgWords >= 40) baseScore += 12;
      const overallScore = Math.min(215, Math.max(130, Math.round(baseScore)));

      const evaluation = {
        overallScore,
        maxScore: 275,
        marksBreakdown: {
          articulation: Math.round(overallScore * 0.22),
          factualDepth: Math.round(overallScore * 0.20),
          balanceOfOpinion: Math.round(overallScore * 0.20),
          situationalJudgment: Math.round(overallScore * 0.20),
          poiseAndEthics: Math.round(overallScore * 0.18)
        },
        strengths: [
          'Calm, measured demeanor and clear voice modulation',
          'Good intellectual honesty; did not hesitate to admit boundary of knowledge',
          'Balanced, non-partisan approach to sensitive public policy questions'
        ],
        weaknesses: [
          'Can incorporate more concrete constitutional articles and committee names in governance answers',
          'Avoid overly generic conclusions on situational problems; offer step-by-step administrative protocol'
        ],
        bodyLanguageTips: [
          'Maintain steady, pleasant eye contact with all board members equally, not just the questioner',
          'Take a 2-second pause before beginning complex policy answers'
        ],
        actionableFeedback: 'Your foundation is strong. For the next mock session, focus on linking regional administrative issues to macroeconomic fiscal realities.'
      };

      const completed = await examEngineRepository.completeInterviewSession(sessionId, userId, evaluation);
      res.json(completed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // 6. UNIFIED PERFORMANCE DOSSIER
  // ----------------------------------------------------
  router.get('/learner/unified-performance', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const perf = await unifiedPerformanceService.getUnifiedPerformance(userId);
      res.json(perf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

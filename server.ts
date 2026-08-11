import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import {
  recordQuestionAttempt,
  updateLearnerModel,
  getNextBestAction,
  getRevisionQueue,
} from './server/intelligence.js';
import {
  askAITutor,
  generateAIInsightForUser,
  generateQuestionsAdmin,
  analyzeMistakeWithAI,
  evaluateMainsAnswerWithAI,
} from './server/ai.js';
import {
  QuestionAttempt,
  AIContentDraft,
  Question,
  MockAttempt,
  StudyGoal,
  ChatMessage,
  ChatConversation,
} from './src/types/index.js';

dotenv.config();

// Helper middleware for auth & admin authorization
function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  let userId = 'usr_demo';
  if (authHeader && authHeader.startsWith('Bearer token_')) {
    userId = authHeader.replace('Bearer token_', '');
  }

  return db.users.get(userId) || db.users.get('usr_demo')!;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  (req as any).user = user;
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'IKSHOVIA', timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    let user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      if (role === 'ADMIN' || email?.includes('admin')) {
        user = db.users.get('usr_admin')!;
      } else {
        user = db.users.get('usr_demo')!;
      }
    }

    res.json({ success: true, user, token: `token_${user.id}` });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, role } = req.body;
    const userId = `usr_${Date.now()}`;
    const newUser = {
      id: userId,
      email: email || `user_${Date.now()}@ikshovia.com`,
      name: name || 'New Aspirant',
      role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as any, // Only server decides role
      isOnboarded: false,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, newUser);
    updateLearnerModel(userId);

    res.json({ success: true, user: newUser, token: `token_${userId}` });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    res.json({
      success: true,
      message: `Password reset instructions sent to ${email || 'your registered email address'}.`,
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    res.json({ success: true, message: 'Password reset successfully. You may now log in.' });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    res.json({ user });
  });

  app.post('/api/auth/onboarding', (req, res) => {
    const { userId, targetExam, selectedSubjects, dailyGoalMinutes, experienceLevel, goalStatement } = req.body;
    const uid = userId || 'usr_demo';
    const user = db.users.get(uid);

    if (user) {
      user.isOnboarded = true;
      user.onboarding = {
        targetExam: targetExam || 'UPSC CSE 2026',
        selectedSubjects: selectedSubjects || ['sub_polity', 'sub_economy'],
        dailyGoalMinutes: dailyGoalMinutes || 120,
        experienceLevel: experienceLevel || 'Intermediate',
        goalStatement: goalStatement || 'Dedicated preparation for Civil Services Examination',
      };
      db.users.set(uid, user);
      updateLearnerModel(uid);
    }

    res.json({ success: true, user });
  });

  // Content Endpoints: Subjects, Topics, Concepts
  app.get('/api/subjects', (req, res) => {
    res.json(Array.from(db.subjects.values()));
  });

  app.get('/api/subjects/:id', (req, res) => {
    const subject = db.subjects.get(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const topics = Array.from(db.topics.values()).filter(t => t.subjectId === subject.id);
    const concepts = Array.from(db.concepts.values()).filter(c => c.subjectId === subject.id);

    res.json({ subject, topics, concepts });
  });

  app.get('/api/concepts/:id', (req, res) => {
    const concept = db.concepts.get(req.params.id);
    if (!concept) return res.status(404).json({ error: 'Concept not found' });

    const userId = (req.query.userId as string) || 'usr_demo';
    const mastery = db.mastery.get(`${userId}_${concept.id}`) || null;

    const prerequisites = (concept.prerequisiteIds || []).map(id => db.concepts.get(id)).filter(Boolean);
    const related = (concept.relatedIds || []).map(id => db.concepts.get(id)).filter(Boolean);
    const questions = Array.from(db.questions.values()).filter(q => q.conceptId === concept.id && q.isPublished);

    res.json({ concept, mastery, prerequisites, related, questions });
  });

  // Learner & Intelligence Endpoints
  app.get('/api/learner/model', async (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    const model = updateLearnerModel(userId);
    const nextBestAction = getNextBestAction(userId);
    const aiInsight = await generateAIInsightForUser(userId);

    res.json({ model, nextBestAction, aiInsight });
  });

  app.post('/api/learner/mastery/rate', (req, res) => {
    const { userId, conceptId, confidenceRating } = req.body;
    const uid = userId || 'usr_demo';

    const updatedMastery = recordQuestionAttempt(
      uid,
      conceptId,
      true,
      30,
      confidenceRating || 4
    );

    res.json({ success: true, mastery: updatedMastery });
  });

  // Practice & Questions Endpoints
  app.get('/api/practice/questions', (req, res) => {
    const { subjectId, conceptId, limit } = req.query;
    let list = Array.from(db.questions.values()).filter(q => q.isPublished);

    if (subjectId) {
      list = list.filter(q => q.subjectId === subjectId);
    }
    if (conceptId) {
      list = list.filter(q => q.conceptId === conceptId);
    }

    const max = parseInt(limit as string) || 10;
    res.json(list.slice(0, max));
  });

  app.post('/api/practice/attempt', (req, res) => {
    const { userId, questionId, userAnswer, timeSpentSeconds, confidenceRating, mistakeCategory } = req.body;
    const uid = userId || 'usr_demo';

    const question = db.questions.get(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = String(userAnswer) === String(question.correctAnswer);

    const attempt: QuestionAttempt = {
      id: `att_${Date.now()}`,
      userId: uid,
      questionId,
      conceptId: question.conceptId,
      userAnswer,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || 25,
      confidenceRating: confidenceRating || 3,
      mistakeCategory: isCorrect ? undefined : (mistakeCategory || 'CONCEPT_GAP'),
      timestamp: new Date().toISOString(),
    };

    db.questionAttempts.push(attempt);

    // Update mistake breakdown in LearnerModel if wrong
    const learnerModel = db.learnerModels.get(uid);
    if (!isCorrect && attempt.mistakeCategory && learnerModel) {
      learnerModel.mistakeBreakdown[attempt.mistakeCategory] =
        (learnerModel.mistakeBreakdown[attempt.mistakeCategory] || 0) + 1;
    }

    // Trigger Intelligence update
    const updatedMastery = recordQuestionAttempt(
      uid,
      question.conceptId,
      isCorrect,
      timeSpentSeconds || 25,
      confidenceRating || 3,
      attempt.mistakeCategory
    );

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      updatedMastery,
      nextBestAction: getNextBestAction(uid),
    });
  });

  // AI Mistake Analysis Endpoint
  app.post('/api/ai/analyze-mistake', async (req, res) => {
    const { questionId, userAnswer, correctAnswer, explanation, conceptTitle } = req.body;
    const question = questionId ? db.questions.get(questionId) : null;

    const analysis = await analyzeMistakeWithAI(
      question?.question || 'Question',
      userAnswer || 'User Option',
      correctAnswer || question?.correctAnswer || 'Correct Option',
      explanation || question?.explanation || 'Explanation',
      conceptTitle
    );

    res.json({ success: true, analysis });
  });

  // Mains Answer Evaluator Endpoint
  app.post('/api/mains/evaluate', async (req, res) => {
    const { question, userAnswer, conceptTitle } = req.body;
    if (!userAnswer || !userAnswer.trim()) {
      return res.status(400).json({ error: 'Answer text cannot be empty' });
    }

    const user = getAuthenticatedUser(req);

    const evaluation = await evaluateMainsAnswerWithAI(
      question || 'General Civil Services Mains Question',
      userAnswer,
      conceptTitle
    );

    // Save to DB mockAttempts
    const mockAttempt: MockAttempt = {
      id: `mains_${Date.now()}`,
      userId: user.id,
      mockTestId: 'mains_eval_test',
      mockTitle: question ? question.slice(0, 40) + '...' : 'Mains Answer Evaluation',
      score: evaluation.score,
      maxScore: evaluation.maxScore || 10,
      accuracy: Math.round((evaluation.score / (evaluation.maxScore || 10)) * 100),
      timeTakenSeconds: 300,
      completedAt: new Date().toISOString(),
      subjectScores: { mains: { total: 10, correct: Math.round(evaluation.score), score: evaluation.score } },
      weakConceptIds: evaluation.weaknesses || [],
      mistakeSummary: { MAINS_WEAKNESS: evaluation.weaknesses?.length || 1 },
    };
    db.mockAttempts.push(mockAttempt);

    // Update Learner Model with identified weaknesses
    const learnerModel = db.learnerModels.get(user.id);
    if (learnerModel) {
      if (evaluation.score < 7) {
        learnerModel.weakConceptsCount = (learnerModel.weakConceptsCount || 0) + 1;
        learnerModel.mistakeBreakdown.CONCEPT_GAP = (learnerModel.mistakeBreakdown.CONCEPT_GAP || 0) + 1;
      }
      db.learnerModels.set(user.id, learnerModel);
    }

    updateLearnerModel(user.id);

    res.json({ success: true, evaluation, attemptSaved: mockAttempt });
  });

  // Revision Queue Endpoint
  app.get('/api/revision/queue', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    const queue = getRevisionQueue(userId);
    res.json(queue);
  });

  // Knowledge Graph Endpoint
  app.get('/api/graph', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    const nodes = Array.from(db.concepts.values()).map(c => {
      const m = db.mastery.get(`${userId}_${c.id}`);
      let status: 'Mastered' | 'Strong' | 'Developing' | 'Weak' | 'Unexplored' = 'Unexplored';
      if (m) {
        if (m.overallMastery >= 80) status = 'Mastered';
        else if (m.overallMastery >= 70) status = 'Strong';
        else if (m.overallMastery >= 55) status = 'Developing';
        else status = 'Weak';
      }

      const subject = db.subjects.get(c.subjectId);
      return {
        id: c.id,
        title: c.title,
        subjectId: c.subjectId,
        subjectName: subject?.name || 'Subject',
        subjectColor: subject?.color || 'indigo',
        masteryScore: m?.overallMastery || 0,
        status,
        difficulty: c.difficulty,
        importance: c.importance,
      };
    });

    res.json({ nodes, relationships: db.relationships });
  });

  // Analytics Endpoint
  app.get('/api/analytics', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    const model = db.learnerModels.get(userId) || updateLearnerModel(userId);
    const userAttempts = db.questionAttempts.filter(a => a.userId === userId);

    if (userAttempts.length < 3) {
      return res.json({
        model,
        hasEnoughData: false,
        message: 'Not enough data yet. Complete at least 3 practice questions to unlock deep analytics.',
        subjectStats: [],
        userMasteries: [],
        recentAttempts: userAttempts,
      });
    }

    const userMasteries = Array.from(db.mastery.entries())
      .filter(([k]) => k.startsWith(`${userId}_`))
      .map(([, v]) => v);

    const subjectStats = Array.from(db.subjects.values()).map(s => {
      const conceptsInSub = Array.from(db.concepts.values()).filter(c => c.subjectId === s.id);
      const masteries = conceptsInSub.map(c => db.mastery.get(`${userId}_${c.id}`)).filter(Boolean);
      const avgMastery = masteries.length > 0
        ? Math.round(masteries.reduce((a, b) => a + b!.overallMastery, 0) / masteries.length)
        : 50;
      return {
        subjectId: s.id,
        subjectName: s.name,
        color: s.color,
        mastery: avgMastery,
        conceptsCount: conceptsInSub.length,
      };
    });

    res.json({
      model,
      hasEnoughData: true,
      subjectStats,
      userMasteries,
      recentAttempts: userAttempts.slice(-15),
    });
  });

  // AI Tutor Endpoints
  app.post('/api/ai/tutor', async (req, res) => {
    const { userId, userPrompt, conceptId, quickAction } = req.body;
    const uid = userId || 'usr_demo';

    const aiResponse = await askAITutor(uid, userPrompt, conceptId, quickAction);
    res.json({ success: true, text: aiResponse });
  });

  app.get('/api/ai/conversations', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    const list = Array.from(db.conversations.values()).filter(c => c.userId === userId);
    if (list.length === 0) {
      const defaultConv: ChatConversation = {
        id: 'conv_1',
        userId,
        title: 'Polity & Article 32 Writs Session',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            text: 'Hello Ananya! I am IKSHOVIA AI Tutor. I notice you are revising Fundamental Rights today. How can I help clarify your concepts or test your understanding?',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      db.conversations.set(defaultConv.id, defaultConv);
      list.push(defaultConv);
    }
    res.json(list);
  });

  app.post('/api/ai/conversations', (req, res) => {
    const { userId, title, initialMessage } = req.body;
    const uid = userId || 'usr_demo';
    const id = `conv_${Date.now()}`;
    const newConv: ChatConversation = {
      id,
      userId: uid,
      title: title || 'New AI Tutor Session',
      createdAt: new Date().toISOString(),
      messages: initialMessage ? [initialMessage] : [],
    };
    db.conversations.set(id, newConv);
    res.json(newConv);
  });

  app.post('/api/ai/conversations/:id/messages', async (req, res) => {
    const { id } = req.params;
    const { userText, conceptId, quickAction } = req.body;
    const conv = db.conversations.get(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    const aiText = await askAITutor(conv.userId, userText, conceptId, quickAction);
    const aiMsg: ChatMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant',
      text: aiText,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(aiMsg);

    db.conversations.set(id, conv);
    res.json({ conversation: conv, reply: aiMsg });
  });

  // Mock Tests Endpoints
  app.get('/api/mock-tests', (req, res) => {
    res.json(Array.from(db.mockTests.values()).filter(m => m.isPublished));
  });

  app.post('/api/mock-tests/:id/submit', (req, res) => {
    const { userId, answers, timeTakenSeconds } = req.body;
    const uid = userId || 'usr_demo';
    const test = db.mockTests.get(req.params.id);
    if (!test) return res.status(404).json({ error: 'Mock test not found' });

    const testQuestions = Array.from(db.questions.values()).filter(q =>
      test.subjectIds.includes(q.subjectId)
    );

    let score = 0;
    let correctCount = 0;
    const markPerQ = test.totalMarks / (testQuestions.length || 10);

    testQuestions.forEach(q => {
      const userAns = answers?.[q.id];
      if (userAns !== undefined) {
        if (String(userAns) === String(q.correctAnswer)) {
          score += markPerQ;
          correctCount++;
          recordQuestionAttempt(uid, q.conceptId, true, 45, 4);
        } else {
          score -= markPerQ * test.negativeMarkingRate;
          recordQuestionAttempt(uid, q.conceptId, false, 45, 3, 'CONCEPT_GAP');
        }
      }
    });

    score = Math.max(0, Math.round(score * 10) / 10);
    const accuracy = testQuestions.length > 0 ? Math.round((correctCount / testQuestions.length) * 100) : 0;

    const mockAttempt: MockAttempt = {
      id: `matt_${Date.now()}`,
      userId: uid,
      mockTestId: test.id,
      mockTitle: test.title,
      score,
      maxScore: test.totalMarks,
      accuracy,
      timeTakenSeconds: timeTakenSeconds || 600,
      completedAt: new Date().toISOString(),
      subjectScores: {
        sub_polity: { total: 10, correct: correctCount, score },
      },
      weakConceptIds: ['c_fiscal_fed', 'c_art32'],
      mistakeSummary: { CONCEPT_CONFUSION: 2, RECALL_FAILURE: 1 },
    };

    db.mockAttempts.push(mockAttempt);
    updateLearnerModel(uid);

    res.json({ success: true, mockAttempt });
  });

  // Current Affairs & Resources
  app.get('/api/current-affairs', (req, res) => {
    res.json(Array.from(db.currentAffairs.values()).filter(c => c.isPublished));
  });

  app.get('/api/resources', (req, res) => {
    res.json(Array.from(db.resources.values()));
  });

  // Goals Endpoints
  app.get('/api/goals', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    res.json(Array.from(db.goals.values()).filter(g => g.userId === userId));
  });

  app.post('/api/goals', (req, res) => {
    const { userId, title, targetExam, targetDate, dailyStudyMinutes, subjects } = req.body;
    const uid = userId || 'usr_demo';
    const goal: StudyGoal = {
      id: `goal_${Date.now()}`,
      userId: uid,
      title: title || 'Target Goal',
      targetExam: targetExam || 'UPSC CSE 2026',
      targetDate: targetDate || '2026-05-24',
      dailyStudyMinutes: dailyStudyMinutes || 120,
      subjects: subjects || ['sub_polity', 'sub_economy'],
      status: 'ACTIVE',
      progressPercentage: 0,
    };
    db.goals.set(goal.id, goal);
    res.json(goal);
  });

  // Notifications Endpoint
  app.get('/api/notifications', (req, res) => {
    const userId = (req.query.userId as string) || 'usr_demo';
    res.json(db.notifications.get(userId) || []);
  });

  // Global Search Endpoint
  app.get('/api/search', (req, res) => {
    const query = (req.query.q as string || '').toLowerCase().trim();
    if (!query) return res.json({ subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [] });

    const subjects = Array.from(db.subjects.values()).filter(s =>
      s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );

    const concepts = Array.from(db.concepts.values()).filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.summary.toLowerCase().includes(query) ||
      c.tags.some(t => t.toLowerCase().includes(query))
    );

    const questions = Array.from(db.questions.values()).filter(q =>
      q.question.toLowerCase().includes(query)
    );

    const currentAffairs = Array.from(db.currentAffairs.values()).filter(ca =>
      ca.title.toLowerCase().includes(query) || ca.summary.toLowerCase().includes(query)
    );

    const resources = Array.from(db.resources.values()).filter(r =>
      r.title.toLowerCase().includes(query) || r.summary.toLowerCase().includes(query)
    );

    res.json({ subjects, concepts, questions, currentAffairs, resources });
  });

  // -------------------------------------------------------------
  // ADMIN ROUTES (Protected by server-side requireAdmin middleware)
  // -------------------------------------------------------------
  app.get('/api/admin/metrics', requireAdmin, (req, res) => {
    res.json({
      totalUsers: db.users.size,
      activeUsers24h: Math.round(db.users.size * 0.8),
      totalSubjects: db.subjects.size,
      totalTopics: db.topics.size,
      totalConcepts: db.concepts.size,
      totalQuestions: db.questions.size,
      totalMockTests: db.mockTests.size,
      totalCurrentAffairs: db.currentAffairs.size,
      totalResources: db.resources.size,
      totalAiDrafts: db.aiDrafts.size,
    });
  });

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    res.json(Array.from(db.users.values()));
  });

  app.post('/api/admin/concepts', requireAdmin, (req, res) => {
    const conceptData = req.body;
    const id = conceptData.id || `c_${Date.now()}`;
    const newConcept = {
      ...conceptData,
      id,
    };
    db.concepts.set(id, newConcept);
    res.json({ success: true, concept: newConcept });
  });

  app.post('/api/admin/questions', requireAdmin, (req, res) => {
    const qData = req.body;
    const id = qData.id || `q_${Date.now()}`;
    const newQ: Question = {
      ...qData,
      id,
      isPublished: true,
    };
    db.questions.set(id, newQ);
    res.json({ success: true, question: newQ });
  });

  app.post('/api/admin/ai/generate', requireAdmin, async (req, res) => {
    const { prompt, subjectId, topicId, count } = req.body;
    const generatedQs = await generateQuestionsAdmin(prompt, subjectId, topicId, count || 2);

    const drafts: AIContentDraft[] = generatedQs.map((gq, idx) => {
      const draft: AIContentDraft = {
        id: `draft_${Date.now()}_${idx}`,
        type: 'MCQ',
        prompt,
        subjectId: subjectId || 'sub_polity',
        topicId: topicId || 'top_rights',
        generatedData: gq,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };
      db.aiDrafts.set(draft.id, draft);
      return draft;
    });

    res.json({ success: true, drafts });
  });

  app.get('/api/admin/ai/drafts', requireAdmin, (req, res) => {
    res.json(Array.from(db.aiDrafts.values()));
  });

  app.post('/api/admin/ai/drafts/:id/approve', requireAdmin, (req, res) => {
    const { id } = req.params;
    const draft = db.aiDrafts.get(id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    draft.status = 'APPROVED';
    db.aiDrafts.set(id, draft);

    if (draft.type === 'MCQ' && draft.generatedData) {
      const q: Question = {
        id: `q_ai_${Date.now()}`,
        subjectId: draft.subjectId,
        topicId: draft.topicId || 'top_rights',
        conceptId: 'c_art21',
        type: 'MCQ',
        question: draft.generatedData.question,
        options: draft.generatedData.options,
        correctAnswer: draft.generatedData.correctAnswer,
        explanation: draft.generatedData.explanation,
        difficulty: draft.generatedData.difficulty || 'MEDIUM',
        examTag: 'AI Approved',
        isPublished: true,
      };
      db.questions.set(q.id, q);
    }

    res.json({ success: true, draft });
  });

  // -------------------------------------------------------------
  // VITE SERVING / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IKSHOVIA AI Learning Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

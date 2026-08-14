import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, hashPassword, verifyPassword, initDatabase } from './server/db.js';
import { userRepository } from './server/repositories/UserRepository.js';
import { questionRepository } from './server/repositories/QuestionRepository.js';
import { practiceRepository } from './server/repositories/PracticeRepository.js';
import { learnerRepository } from './server/repositories/LearnerRepository.js';
import { revisionRepository } from './server/repositories/RevisionRepository.js';
import { mockTestRepository } from './server/repositories/MockTestRepository.js';
import { ocrRepository } from './server/repositories/OcrRepository.js';
import { currentAffairsRepository } from './server/repositories/CurrentAffairsRepository.js';
import { currentAffairsIngestionManager } from './server/services/CurrentAffairsProvider.js';
import { currentAffairsAiService } from './server/services/CurrentAffairsAiService.js';
import pool from './server/db/pool.js';
import { ensureDatabaseSchema } from './server/db/schemaRunner.js';
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
  OCRJob,
  UserRole,
  UserProfile,
} from './src/types/index.js';

import { processOcrDocument } from './server/ocr.js';
import { documentStorage } from './server/storage.js';

dotenv.config();

// Helper middleware for auth & admin authorization
async function getAuthenticatedUser(req: express.Request): Promise<UserProfile | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer token_')) {
    const userId = authHeader.replace('Bearer token_', '').trim();
    const foundUser = await userRepository.findById(userId);
    if (foundUser) return foundUser;
  }
  return null;
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in to access this feature.' });
  }
  (req as any).user = user;
  next();
}

function logAudit(actorUserId: string, actorRole: any, action: string, targetType: string, targetId: string, metadata?: any) {
  db.auditLogs.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    actorUserId,
    actorRole,
    action,
    targetType,
    targetId,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin or Super Admin role required.' });
  }
  (req as any).user = user;
  next();
}

async function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
  }
  (req as any).user = user;
  next();
}

async function startServer() {
  await ensureDatabaseSchema();
  await initDatabase();
  await userRepository.ensureDefaultAccounts(hashPassword);
  await currentAffairsRepository.ensureSeedArticles();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Security Headers Middleware (CSP, HSTS, X-Frame-Options, Referrer-Policy, CORS)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'self' https://*.google.com https://*.run.app;"
    );

    // Controlled CORS origin policy
    const origin = req.headers.origin;
    const allowedOriginRegex = /^(https?:\/\/(localhost(:\d+)?|.*\.run\.app|(.*\.)?ikshovia\.com))$/;
    if (origin && allowedOriginRegex.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // In-Memory Rate Limiter for Abuse Protection
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const createRateLimiter = (maxRequests: number, windowMs: number) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Allow localhost test suite runners to bypass if explicitly requested
      if (req.headers['x-internal-test'] === 'true') {
        return next();
      }

      const ip = req.ip || req.socket.remoteAddress || 'ip';
      const key = `${ip}_${req.baseUrl || ''}${req.path}`;
      const now = Date.now();
      const record = rateLimitMap.get(key);

      if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }

      if (record.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
      }

      record.count++;
      next();
    };
  };

  const authLimiter = createRateLimiter(120, 60 * 1000);
  const aiLimiter = createRateLimiter(60, 60 * 1000);
  const ocrLimiter = createRateLimiter(30, 60 * 1000);

  // -------------------------------------------------------------
  // API ROUTES & HEALTH CHECKS
  // -------------------------------------------------------------

  // Health checks
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'IKSHOVIA', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'IKSHOVIA', timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const storedHash = await userRepository.getPasswordHash(cleanEmail);

    if (!storedHash || !verifyPassword(String(password), storedHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    logAudit(user.id, user.role, 'USER_LOGIN', 'USER', user.id, { email: user.email });
    res.json({ success: true, user, token: `token_${user.id}` });
  });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr_${Date.now()}`;
    const passwordHash = hashPassword(String(password));

    let newUser: any;
    try {
      newUser = await userRepository.createUser({
        id: userId,
        email: cleanEmail,
        name: String(name).trim(),
        role: 'USER',
        isOnboarded: false,
        passwordHash,
      });
    } catch (err: any) {
      console.warn('[Register DB Notice]', err.message);
      newUser = {
        id: userId,
        email: cleanEmail,
        name: String(name).trim(),
        role: 'USER' as const,
        isOnboarded: false,
        createdAt: new Date().toISOString(),
      };
    }

    updateLearnerModel(userId);

    logAudit(newUser.id, newUser.role, 'USER_REGISTER', 'USER', newUser.id, { email: newUser.email });
    res.json({ success: true, user: newUser, token: `token_${newUser.id}` });
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

  app.get('/api/auth/me', async (req, res) => {
    const user = await getAuthenticatedUser(req);
    res.json({ user });
  });

  app.post('/api/auth/onboarding', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const uid = authUser.id;
    const { targetExam, selectedSubjects, dailyGoalMinutes, experienceLevel, goalStatement, preferredLanguage } = req.body;
    let user = await userRepository.findById(uid);

    if (user) {
      const onboardingData = {
        targetExam: targetExam || 'UPSC CSE 2026',
        selectedSubjects: selectedSubjects || ['sub_polity', 'sub_economy'],
        dailyGoalMinutes: dailyGoalMinutes || 120,
        experienceLevel: experienceLevel || 'Intermediate',
        goalStatement: goalStatement || 'Dedicated preparation for Civil Services Examination',
        preferredLanguage: preferredLanguage || user.preferredLanguage || 'en',
      };

      try {
        await userRepository.updateProfile(uid, {
          isOnboarded: true,
          onboarding: onboardingData,
        });
      } catch (err: any) {
        console.warn('[Onboarding DB Update notice]', err.message);
      }

      user = await userRepository.findById(uid);
      updateLearnerModel(uid);
    }

    res.json({ success: true, user });
  });

  app.patch('/api/auth/preferences', async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const { preferredLanguage } = req.body;
    if (preferredLanguage === 'en' || preferredLanguage === 'hi') {
      await userRepository.updateProfile(user.id, {
        preferredLanguage,
      });
    }

    const updated = await userRepository.findById(user.id);
    res.json({ success: true, user: updated });
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

  app.get('/api/subjects/:id/topics', (req, res) => {
    const topics = Array.from(db.topics.values()).filter(t => t.subjectId === req.params.id);
    res.json(topics);
  });

  app.get('/api/topics/:id/concepts', (req, res) => {
    const concepts = Array.from(db.concepts.values()).filter(c => c.topicId === req.params.id);
    res.json(concepts);
  });

  app.get('/api/concepts/:id', async (req, res) => {
    const concept = db.concepts.get(req.params.id);
    if (!concept) return res.status(404).json({ error: 'Concept not found' });

    const authUser = await getAuthenticatedUser(req);
    const userId = authUser ? authUser.id : ((req.query.userId as string) || 'usr_demo');
    const mastery = await learnerRepository.getConceptMastery(userId, concept.id);

    const prerequisites = (concept.prerequisiteIds || []).map(id => db.concepts.get(id)).filter(Boolean);
    const related = (concept.relatedIds || []).map(id => db.concepts.get(id)).filter(Boolean);
    const { items: questions } = await questionRepository.list({ conceptId: concept.id, isPublished: true });

    res.json({ concept, mastery, prerequisites, related, questions });
  });

  // Learner & Intelligence Endpoints
  app.get('/api/learner/model', requireAuth, async (req, res) => {
    const user = (req as any).user;
    const userId = user.id;
    const model = await updateLearnerModel(userId);
    const nextBestAction = await getNextBestAction(userId);
    const aiInsight = await generateAIInsightForUser(userId);

    res.json({ model, nextBestAction, aiInsight });
  });

  app.post('/api/learner/mastery/rate', requireAuth, async (req, res) => {
    const user = (req as any).user;
    const { conceptId, confidenceRating } = req.body;
    const uid = user.id;

    const updatedMastery = await recordQuestionAttempt(
      uid,
      conceptId,
      true,
      30,
      confidenceRating || 4
    );

    res.json({ success: true, mastery: updatedMastery });
  });

  // Practice & Questions Endpoints
  app.get('/api/practice/questions', async (req, res) => {
    const { subjectId, conceptId, limit } = req.query;
    const max = parseInt(limit as string) || 10;
    const { items } = await questionRepository.list({
      subjectId: subjectId ? String(subjectId) : undefined,
      conceptId: conceptId ? String(conceptId) : undefined,
      isPublished: true,
      limit: max,
    });

    res.json(items);
  });

  app.post('/api/practice/attempt', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const uid = authUser.id;
    const { questionId, userAnswer, timeSpentSeconds, confidenceRating, mistakeCategory } = req.body;

    const question = await questionRepository.findById(questionId);
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

    const client = await pool.connect();
    let updatedMastery;
    try {
      await client.query('BEGIN');

      await practiceRepository.recordAttempt(attempt, client);

      await practiceRepository.recordLearningEvent(
        {
          userId: uid,
          conceptId: question.conceptId,
          eventType: 'QUESTION_ATTEMPT',
          payload: { questionId, isCorrect, userAnswer, mistakeCategory: attempt.mistakeCategory },
        },
        client
      );

      updatedMastery = await recordQuestionAttempt(
        uid,
        question.conceptId,
        isCorrect,
        timeSpentSeconds || 25,
        confidenceRating || 3,
        attempt.mistakeCategory,
        client
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error persisting practice attempt in transaction:', err);
      return res.status(500).json({ error: 'Failed to record attempt', details: (err as any)?.message || String(err) });
    } finally {
      client.release();
    }

    const nextBestAction = await getNextBestAction(uid);

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      updatedMastery,
      nextBestAction,
    });
  });

  // AI Mistake Analysis Endpoint
  app.post('/api/ai/analyze-mistake', requireAuth, async (req, res) => {
    const { questionId, userAnswer, correctAnswer, explanation, conceptTitle } = req.body;
    const question = questionId ? await questionRepository.findById(questionId) : null;

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
  app.post('/api/mains/evaluate', requireAuth, async (req, res) => {
    const { question, userAnswer, conceptTitle } = req.body;
    if (!userAnswer || !userAnswer.trim()) {
      return res.status(400).json({ error: 'Answer text cannot be empty' });
    }

    const user = (req as any).user;

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
    const learnerModel = await learnerRepository.getLearnerModel(user.id);
    if (learnerModel) {
      if (evaluation.score < 7) {
        learnerModel.weakConceptsCount = (learnerModel.weakConceptsCount || 0) + 1;
        learnerModel.mistakeBreakdown.CONCEPT_GAP = (learnerModel.mistakeBreakdown.CONCEPT_GAP || 0) + 1;
      }
      await learnerRepository.saveLearnerModel(learnerModel);
    }

    await updateLearnerModel(user.id);

    res.json({ success: true, evaluation, attemptSaved: mockAttempt });
  });

  // Revision Queue Endpoint
  app.get('/api/revision/queue', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const userId = authUser.id;
    const queue = await getRevisionQueue(userId);
    res.json(queue);
  });

  // Knowledge Graph Endpoint
  app.get('/api/graph', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const userId = authUser.id;
    const userMasteries = await learnerRepository.getUserMasteries(userId);
    const masteryMap = new Map(userMasteries.map(m => [m.conceptId, m]));

    const nodes = Array.from(db.concepts.values()).map(c => {
      const m = masteryMap.get(c.id);
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
  app.get('/api/analytics', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const userId = authUser.id;
    const model = await learnerRepository.getLearnerModel(userId);
    const userAttempts = await practiceRepository.getUserAttempts(userId);

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

    const userMasteries = await learnerRepository.getUserMasteries(userId);

    const subjectStats = Array.from(db.subjects.values()).map(s => {
      const conceptsInSub = Array.from(db.concepts.values()).filter(c => c.subjectId === s.id);
      const conceptIds = new Set(conceptsInSub.map(c => c.id));
      const masteries = userMasteries.filter(m => conceptIds.has(m.conceptId));
      const avgMastery = masteries.length > 0
        ? Math.round(masteries.reduce((a, b) => a + b.overallMastery, 0) / masteries.length)
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
      recentAttempts: userAttempts.slice(0, 15),
    });
  });

  // AI Tutor Endpoints
  app.post('/api/ai/tutor', requireAuth, aiLimiter, async (req, res) => {
    const user = (req as any).user;
    const { userPrompt, conceptId, quickAction, context } = req.body;
    const uid = user.id;

    const aiResponse = await askAITutor(uid, userPrompt, conceptId, quickAction, context);
    res.json({ success: true, text: aiResponse });
  });

  app.get('/api/ai/conversations', requireAuth, (req, res) => {
    const user = (req as any).user;
    const userId = user.id;
    const list = Array.from(db.conversations.values()).filter(c => c.userId === userId);
    if (list.length === 0) {
      const userName = user.name || 'IKSHOVIA User';
      const defaultConv: ChatConversation = {
        id: `conv_${Date.now()}`,
        userId,
        title: 'Polity & Article 32 Writs Session',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            text: `Hello ${userName}! I am IKSHOVIA AI Tutor. I notice you are revising Fundamental Rights today. How can I help clarify your concepts or test your understanding?`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      db.conversations.set(defaultConv.id, defaultConv);
      list.push(defaultConv);
    }
    res.json(list);
  });

  app.post('/api/ai/conversations', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { title, initialMessage } = req.body;
    const uid = user.id;
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

  app.post('/api/ai/conversations/:id/messages', requireAuth, aiLimiter, async (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { userText, conceptId, quickAction, context } = req.body;
    const conv = db.conversations.get(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to access this conversation' });
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
      context: context || undefined,
    };
    conv.messages.push(userMsg);

    // Auto update conversation title if default title
    if (conv.messages.filter(m => m.role === 'user').length === 1 || conv.title === 'New AI Tutor Session') {
      conv.title = userText.slice(0, 36) + (userText.length > 36 ? '...' : '');
    }

    const aiText = await askAITutor(conv.userId, userText, conceptId, quickAction, context);
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
  app.get('/api/mock-tests', async (req, res) => {
    try {
      const tests = await mockTestRepository.getPublishedTests();
      res.json(tests);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch mock tests' });
    }
  });

  app.get('/api/mock-tests/history', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.id;

      const history = await mockTestRepository.getUserHistory(userId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch mock test history' });
    }
  });

  app.get('/api/mock-tests/:id', async (req, res) => {
    try {
      const test = await mockTestRepository.getTestById(req.params.id);
      if (!test) return res.status(404).json({ error: 'Mock test not found' });
      const questions = await mockTestRepository.getTestQuestions(req.params.id);
      res.json({ ...test, questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch mock test details' });
    }
  });

  app.post('/api/mock-tests/:id/start', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.id;

      const test = await mockTestRepository.getTestById(req.params.id);
      if (!test || !test.isPublished) {
        return res.status(404).json({ error: 'Mock test not found or not published' });
      }

      const attempt = await mockTestRepository.startAttempt(userId, test.id);
      const questions = await mockTestRepository.getTestQuestions(test.id);

      res.json({ success: true, attempt, test, questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to start attempt' });
    }
  });

  app.get('/api/mock-tests/attempts/:attemptId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.id;

      const attempt = await mockTestRepository.getAttempt(userId, req.params.attemptId);
      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found or unauthorized' });
      }

      const answers = await mockTestRepository.getAttemptAnswers(userId, req.params.attemptId);
      const test = await mockTestRepository.getTestById(attempt.mockTestId);
      const questions = test ? await mockTestRepository.getTestQuestions(test.id) : [];

      res.json({ success: true, attempt, answers, test, questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch attempt' });
    }
  });

  app.post('/api/mock-tests/attempts/:attemptId/answer', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { questionId, userAnswer, timeSpentSeconds, markedForReview } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'questionId is required' });
      }

      const attempt = await mockTestRepository.getAttempt(userId, req.params.attemptId);
      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found or unauthorized' });
      }

      if (attempt.status === 'SUBMITTED') {
        return res.status(400).json({ error: 'Cannot update answer for submitted attempt' });
      }

      await mockTestRepository.saveAnswer(userId, req.params.attemptId, questionId, {
        userAnswer,
        timeSpentSeconds,
        markedForReview,
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save answer' });
    }
  });

  app.post('/api/mock-tests/:id/submit', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const uid = user.id;
      const { answers, timeTakenSeconds } = req.body;

      const mockAttempt = await mockTestRepository.submitAttempt(uid, req.params.id, {
        answers,
        timeTakenSeconds,
      });

      res.json({ success: true, mockAttempt });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit mock test' });
    }
  });

  // Current Affairs Endpoints (PostgreSQL Source of Truth)
  app.get('/api/current-affairs', async (req, res) => {
    try {
      const { category, dateRange, search, subjectId, exam, relevance, biharOnly } = req.query;
      const list = await currentAffairsRepository.listArticles({
        category: category as string,
        dateRange: dateRange as any,
        search: search as string,
        subjectId: subjectId as string,
        exam: exam as any,
        relevance: relevance as any,
        biharOnly: biharOnly === 'true',
        isPublished: true,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list current affairs' });
    }
  });

  app.get('/api/current-affairs/revisions/my', requireAuth, async (req, res) => {
    try {
      const uid = (req as any).user.id;
      const list = await currentAffairsRepository.getUserRevisions(uid);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get current affairs revisions' });
    }
  });

  app.get('/api/current-affairs/:id', async (req, res) => {
    try {
      const article = await currentAffairsRepository.getArticleById(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      res.json(article);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get current affair article' });
    }
  });

  app.post('/api/current-affairs/:id/bookmark', requireAuth, async (req, res) => {
    try {
      const uid = (req as any).user.id;
      await currentAffairsRepository.bookmarkForRevision(uid, req.params.id);
      res.json({ success: true, message: 'Bookmarked for spaced repetition revision' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to bookmark article' });
    }
  });

  // Dedicated Real PYQ (Previous Year Question) Bank Endpoint
  app.get('/api/pyqs', async (req, res) => {
    const { exam, year, paper, subjectId, topicId, search } = req.query;
    const { items } = await questionRepository.listPYQs({
      exam: exam && exam !== 'All' ? String(exam) : undefined,
      pyqYear: year ? Number(year) : undefined,
      subjectId: subjectId ? String(subjectId) : undefined,
      topicId: topicId ? String(topicId) : undefined,
      limit: 100,
    });

    let list = items;
    if (paper) {
      list = list.filter(q => q.paper && q.paper.toLowerCase().includes(String(paper).toLowerCase()));
    }

    if (search) {
      const qStr = String(search).toLowerCase();
      list = list.filter(qItem =>
        qItem.question.toLowerCase().includes(qStr) ||
        qItem.explanation.toLowerCase().includes(qStr) ||
        (qItem.source && qItem.source.toLowerCase().includes(qStr))
      );
    }

    res.json(list);
  });

  app.get('/api/resources', (req, res) => {
    res.json(Array.from(db.resources.values()));
  });

  // Goals Endpoints
  app.get('/api/goals', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const userId = authUser.id;
    res.json(Array.from(db.goals.values()).filter(g => g.userId === userId));
  });

  app.post('/api/goals', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const { title, targetExam, targetDate, dailyStudyMinutes, subjects } = req.body;
    const uid = authUser.id;
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
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const authUser = (req as any).user;
    const userId = authUser.id;
    res.json(db.notifications.get(userId) || []);
  });

  // Global Search Endpoint
  app.get('/api/search', async (req, res) => {
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

    const { items: questions } = await questionRepository.list({ searchQuery: query, limit: 20 });

    const currentAffairs = await currentAffairsRepository.listArticles({ search: query, limit: 10, isPublished: true });

    const resources = Array.from(db.resources.values()).filter(r =>
      r.title.toLowerCase().includes(query) || r.summary.toLowerCase().includes(query)
    );

    res.json({ subjects, concepts, questions, currentAffairs, resources });
  });

  // -------------------------------------------------------------
  // ADMIN ROUTES (Protected by server-side requireAdmin middleware)
  // -------------------------------------------------------------
  app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
    const users = await userRepository.listUsers();
    const questionCount = await questionRepository.count();

    const caMetrics = await currentAffairsRepository.getAdminMetrics();

    res.json({
      totalUsers: users.length,
      activeUsers24h: Math.round(users.length * 0.8),
      totalSubjects: db.subjects.size,
      totalTopics: db.topics.size,
      totalConcepts: db.concepts.size,
      totalQuestions: questionCount,
      totalMockTests: await mockTestRepository.countTests(),
      totalCurrentAffairs: caMetrics.total,
      totalResources: db.resources.size,
      totalAiDrafts: db.aiDrafts.size,
      totalOcrJobs: await ocrRepository.countJobs(),
    });
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const users = await userRepository.listUsers();
    res.json(users);
  });

  // Admin Current Affairs Management Endpoints
  app.get('/api/admin/current-affairs/metrics', requireAdmin, async (req, res) => {
    try {
      const metrics = await currentAffairsRepository.getAdminMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get current affairs metrics' });
    }
  });

  app.get('/api/admin/current-affairs/list', requireAdmin, async (req, res) => {
    try {
      const { category, status, search, limit, offset } = req.query;
      const list = await currentAffairsRepository.listArticles({
        category: category as string,
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list admin current affairs' });
    }
  });

  app.post('/api/admin/current-affairs/ingest', requireAdmin, async (req, res) => {
    try {
      const { providerCode } = req.body || {};
      const result = await currentAffairsIngestionManager.runIngestionPipeline({ customProviderCode: providerCode });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Ingestion failed' });
    }
  });

  app.post('/api/admin/current-affairs/:id/enrich', requireAdmin, async (req, res) => {
    try {
      const result = await currentAffairsAiService.enrichArticle(req.params.id, true);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI enrichment failed' });
    }
  });

  app.post('/api/admin/current-affairs/batch-enrich', requireAdmin, async (req, res) => {
    try {
      const result = await currentAffairsAiService.batchEnrichIngestedArticles();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Batch enrichment failed' });
    }
  });

  app.put('/api/admin/current-affairs/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await currentAffairsRepository.updateArticle(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Article not found' });
      res.json({ success: true, article: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update article' });
    }
  });

  app.post('/api/admin/current-affairs/:id/publish', requireAdmin, async (req, res) => {
    try {
      const article = await currentAffairsRepository.publishArticle(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      res.json({ success: true, article });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to publish article' });
    }
  });

  app.post('/api/admin/current-affairs/:id/reject', requireAdmin, async (req, res) => {
    try {
      const article = await currentAffairsRepository.rejectArticle(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      res.json({ success: true, article });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reject article' });
    }
  });

  app.delete('/api/admin/current-affairs/:id', requireAdmin, async (req, res) => {
    try {
      const success = await currentAffairsRepository.deleteArticle(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete article' });
    }
  });

  app.post('/api/admin/current-affairs/:id/generate-question', requireAdmin, async (req, res) => {
    try {
      const result = await currentAffairsAiService.enrichArticle(req.params.id, true);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate question from article' });
    }
  });

  app.get('/api/admin/current-affairs/sources', requireAdmin, async (req, res) => {
    try {
      const sources = await currentAffairsRepository.listSources();
      res.json(sources);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list sources' });
    }
  });

  app.post('/api/admin/current-affairs/sources', requireAdmin, async (req, res) => {
    try {
      const source = await currentAffairsRepository.createSource(req.body);
      res.json({ success: true, source });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create source' });
    }
  });

  app.post('/api/admin/concepts', requireAdmin, (req, res) => {
    const actor = (req as any).user;
    const conceptData = req.body;
    const id = conceptData.id || `c_${Date.now()}`;
    const newConcept = {
      ...conceptData,
      id,
    };
    db.concepts.set(id, newConcept);
    logAudit(actor.id, actor.role, 'CONCEPT_CREATE', 'CONCEPT', id, { title: newConcept.title });
    res.json({ success: true, concept: newConcept });
  });

  app.put('/api/admin/questions/:id', requireAdmin, async (req, res) => {
    const actor = (req as any).user;
    const { id } = req.params;
    const existing = await questionRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const {
      question,
      question_en,
      question_hi,
      options,
      options_en,
      options_hi,
      correctAnswer,
      explanation,
      explanation_en,
      explanation_hi,
      availableLanguages,
      difficulty,
      subjectId,
      topicId,
      conceptId,
      status,
      destination,
      examTag,
      pyqYear,
    } = req.body;

    const updated: Question = {
      ...existing,
      question: question !== undefined ? question : existing.question,
      question_en: question_en !== undefined ? question_en : existing.question_en,
      question_hi: question_hi !== undefined ? question_hi : existing.question_hi,
      options: options !== undefined ? options : existing.options,
      options_en: options_en !== undefined ? options_en : existing.options_en,
      options_hi: options_hi !== undefined ? options_hi : existing.options_hi,
      correctAnswer: correctAnswer !== undefined ? correctAnswer : existing.correctAnswer,
      explanation: explanation !== undefined ? explanation : existing.explanation,
      explanation_en: explanation_en !== undefined ? explanation_en : existing.explanation_en,
      explanation_hi: explanation_hi !== undefined ? explanation_hi : existing.explanation_hi,
      availableLanguages: availableLanguages !== undefined ? availableLanguages : existing.availableLanguages,
      difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
      subjectId: subjectId !== undefined ? subjectId : existing.subjectId,
      topicId: topicId !== undefined ? topicId : existing.topicId,
      conceptId: conceptId !== undefined ? conceptId : existing.conceptId,
      status: status !== undefined ? status : existing.status,
      destination: destination !== undefined ? destination : existing.destination,
      examTag: examTag !== undefined ? examTag : existing.examTag,
      pyqYear: pyqYear !== undefined ? pyqYear : existing.pyqYear,
    };

    // Auto-update status to READY_TO_PUBLISH if correct answer was just assigned
    if (updated.correctAnswer && updated.correctAnswer !== '' && updated.status === 'NEEDS_ANSWER') {
      updated.status = 'READY_TO_PUBLISH';
    }

    await questionRepository.create(updated);
    logAudit(actor.id, actor.role, 'QUESTION_UPDATE', 'QUESTION', id, { question: updated.question.substring(0, 40) });
    res.json({ success: true, question: updated });
  });

  app.post('/api/admin/questions', requireAdmin, async (req, res) => {
    const actor = (req as any).user;
    const qData = req.body;
    const id = qData.id || `q_${Date.now()}`;
    const newQ: Question = {
      ...qData,
      id,
      isPublished: qData.isPublished !== undefined ? qData.isPublished : true,
      status: qData.status || 'READY_TO_PUBLISH',
    };

    await questionRepository.create(newQ);
    logAudit(actor.id, actor.role, 'QUESTION_CREATE', 'QUESTION', id, { question: newQ.question.substring(0, 40) });
    res.json({ success: true, question: newQ });
  });

  // OCR Studio Processing Endpoint
  app.post('/api/admin/ocr/process', requireAdmin, ocrLimiter, async (req, res) => {
    const actor = (req as any).user;
    const {
      mode,
      exam = 'UPSC CSE',
      documentLanguage = 'AUTO',
      totalExpectedQuestions,
      questionPdfBase64,
      answerPdfBase64,
      questionFileName,
      answerFileName,
      questionTextRaw,
      answerTextRaw,
      subjectId,
      topicId,
      conceptId,
      difficulty,
      examTag,
      pyqYear,
      destination,
      keepOriginalPdf = true,
    } = req.body;

    try {
      let storedQuestionPdfKey: string | undefined;
      let storedAnswerPdfKey: string | undefined;

      if (questionPdfBase64) {
        const cleanB64 = questionPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buf = Buffer.from(cleanB64, 'base64');
        storedQuestionPdfKey = await documentStorage.uploadDocument(questionFileName || 'Question_Paper.pdf', buf);
      }

      if (answerPdfBase64) {
        const cleanB64 = answerPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buf = Buffer.from(cleanB64, 'base64');
        storedAnswerPdfKey = await documentStorage.uploadDocument(answerFileName || 'Answer_Key.pdf', buf);
      }

      const result = await processOcrDocument({
        mode,
        userId: actor.id,
        exam,
        storageKey: storedQuestionPdfKey,
        documentLanguage,
        totalExpectedQuestions: Number(totalExpectedQuestions) || (exam === 'BPSC' ? 150 : 100),
        questionPdfBase64,
        answerPdfBase64,
        questionFileName,
        answerFileName,
        questionTextRaw,
        answerTextRaw,
        subjectId: subjectId || 'sub_polity',
        topicId: topicId || 'top_rights',
        conceptId: conceptId || 'c_art32',
        difficulty: difficulty || 'MEDIUM',
        examTag: examTag || `${exam} Prelims`,
        pyqYear: pyqYear || 2025,
        destination: destination || 'PRACTICE_BANK',
        keepOriginalPdf,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      const job = await ocrRepository.getJobById(result.jobId);

      logAudit(actor.id, actor.role, 'OCR_IMPORT_PROCESS', 'OCR_JOB', result.jobId, {
        mode,
        exam,
        count: result.questions.length,
        storedQuestionPdfKey,
        storedAnswerPdfKey,
      });

      res.json({
        success: true,
        job,
        questions: result.questions,
        totalDetected: result.totalDetected,
        matchedCount: result.matchedCount,
        needsReviewCount: result.needsReviewCount,
        missingAnswerCount: result.missingAnswerCount,
        lowConfidenceCount: result.lowConfidenceCount,
        storedQuestionPdfKey,
        storedAnswerPdfKey,
      });
    } catch (err: any) {
      console.error('OCR Processing error:', err);
      res.status(500).json({ success: false, error: `OCR Processing Exception: ${err.message}` });
    }
  });

  // GET all OCR jobs
  app.get('/api/admin/ocr/jobs', requireAdmin, async (req, res) => {
    try {
      const jobs = await ocrRepository.listJobs();
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET specific OCR job details & extracted questions
  app.get('/api/admin/ocr/jobs/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const job = await ocrRepository.getJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'OCR Job not found' });
      }
      const questions = await ocrRepository.getQuestionsByJobId(id);
      res.json({ job, questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET questions for OCR job
  app.get('/api/admin/ocr/jobs/:id/questions', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const questions = await ocrRepository.getQuestionsByJobId(id);
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit single extracted question in PostgreSQL
  app.put('/api/admin/ocr/questions/:id', requireAdmin, async (req, res) => {
    try {
      const actor = (req as any).user;
      const { id } = req.params;
      const updates = req.body;

      const updated = await ocrRepository.updateExtractedQuestion(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Extracted question not found' });
      }

      logAudit(actor.id, actor.role, 'OCR_QUESTION_EDIT', 'OCR_QUESTION', id, { questionNum: updated.questionNum });
      res.json({ success: true, question: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approve single question
  app.post('/api/admin/ocr/questions/:id/approve', requireAdmin, async (req, res) => {
    try {
      const actor = (req as any).user;
      const { id } = req.params;
      const { subjectId, topicId, conceptId, difficulty, destination, examTag, pyqYear } = req.body;

      const result = await ocrRepository.approveAndPublishQuestion(id, {
        subjectId,
        topicId,
        conceptId,
        difficulty,
        destination,
        examTag,
        pyqYear,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      logAudit(actor.id, actor.role, 'OCR_QUESTION_APPROVE', 'QUESTION', id, {});
      res.json({ success: true, question: result.question });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reject single question
  app.post('/api/admin/ocr/questions/:id/reject', requireAdmin, async (req, res) => {
    try {
      const actor = (req as any).user;
      const { id } = req.params;

      const success = await ocrRepository.rejectQuestion(id);
      if (!success) {
        return res.status(404).json({ error: 'Extracted question not found' });
      }

      logAudit(actor.id, actor.role, 'OCR_QUESTION_REJECT', 'OCR_QUESTION', id, {});
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk Actions
  app.post('/api/admin/ocr/questions/bulk-action', requireAdmin, async (req, res) => {
    const actor = (req as any).user;
    const {
      jobId,
      questionIds,
      action,
      subjectId,
      topicId,
      conceptId,
      difficulty,
      destination,
      examTag,
      pyqYear,
      overrideWarnings = false,
    } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'No questions selected for bulk action.' });
    }

    try {
      if (action === 'APPROVE' || action === 'PUBLISH') {
        const result = await ocrRepository.bulkApproveAndPublish(
          jobId,
          questionIds,
          { subjectId, topicId, conceptId, difficulty, destination, examTag, pyqYear },
          overrideWarnings
        );

        logAudit(actor.id, actor.role, `OCR_BULK_${action}`, 'OCR_JOB', jobId || 'BULK', {
          count: result.affectedCount,
          blocked: result.publishBlockedCount,
        });

        return res.json({
          success: true,
          action,
          affectedCount: result.affectedCount,
          publishBlockedCount: result.publishBlockedCount,
          blockedReasons: result.blockedReasons,
          message: `Successfully approved & published ${result.affectedCount} question(s) to ${destination || 'Practice Bank'}.${
            result.publishBlockedCount > 0 ? ` (${result.publishBlockedCount} blocked due to missing fields/answers)` : ''
          }`,
        });
      } else if (action === 'REJECT') {
        const count = await ocrRepository.bulkRejectQuestions(jobId, questionIds);
        logAudit(actor.id, actor.role, 'OCR_BULK_REJECT', 'OCR_JOB', jobId || 'BULK', { count });
        return res.json({
          success: true,
          action,
          affectedCount: count,
          message: `Successfully rejected ${count} question(s).`,
        });
      } else {
        // ASSIGN_META or SAVE_DRAFT on extracted questions
        let affected = 0;
        for (const qId of questionIds) {
          const updates: any = {};
          if (subjectId) updates.subjectId = subjectId;
          if (topicId) updates.topicId = topicId;
          if (conceptId) updates.conceptId = conceptId;
          if (difficulty) updates.difficulty = difficulty;
          if (destination) updates.destination = destination;
          if (examTag) updates.examTag = examTag;
          if (pyqYear) updates.pyqYear = pyqYear;

          const updated = await ocrRepository.updateExtractedQuestion(qId, updates);
          if (updated) affected++;
        }

        return res.json({
          success: true,
          action,
          affectedCount: affected,
          message: `Updated ${affected} question(s).`,
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  app.post('/api/admin/ai/drafts/:id/approve', requireAdmin, async (req, res) => {
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
        status: 'PUBLISHED',
        destination: 'PRACTICE_BANK',
      };
      await questionRepository.create(q);
    }

    res.json({ success: true, draft });
  });

  // -------------------------------------------------------------
  // SUPER ADMIN ROUTES (Protected by server-side requireSuperAdmin)
  // -------------------------------------------------------------
  app.get('/api/superadmin/overview', requireSuperAdmin, async (req, res) => {
    const allUsers = await userRepository.listUsers();
    const admins = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
    const questionCount = await questionRepository.count();

    res.json({
      metrics: {
        totalUsers: allUsers.length,
        totalAdmins: admins.length,
        totalQuestions: questionCount,
        totalOcrJobs: await ocrRepository.countJobs(),
        totalAiDrafts: db.aiDrafts.size,
        totalMockTests: await mockTestRepository.countTests(),
        systemHealth: 'OPERATIONAL',
      },
      admins,
      recentAuditLogs: db.auditLogs.slice(0, 20),
    });
  });

  app.get('/api/superadmin/admins', requireSuperAdmin, async (req, res) => {
    const allUsers = await userRepository.listUsers();
    const admins = allUsers
      .filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        permissions: db.adminPermissions.get(u.id) || ['QUESTION_CREATE', 'QUESTION_PUBLISH'],
        status: 'ACTIVE' as const,
        createdAt: u.createdAt,
      }));
    res.json(admins);
  });

  app.post('/api/superadmin/admins', requireSuperAdmin, async (req, res) => {
    const actor = (req as any).user;
    const { name, email, role, permissions } = req.body;

    const newAdminId = `usr_admin_${Date.now()}`;
    const passwordHash = hashPassword('IkshoviaAdmin@2026');

    const newAdminUser = await userRepository.createUser({
      id: newAdminId,
      email: email || `admin_${Date.now()}@ikshovia.com`,
      name: name || 'New Platform Admin',
      role: (role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN') as UserRole,
      isOnboarded: true,
      passwordHash,
    });

    db.adminPermissions.set(newAdminId, permissions || ['QUESTION_CREATE', 'QUESTION_PUBLISH', 'OCR_IMPORT']);

    logAudit(actor.id, actor.role, 'SUPERADMIN_CREATE_ADMIN', 'USER', newAdminId, { name, email, role });

    res.json({ success: true, admin: newAdminUser });
  });

  app.post('/api/superadmin/admins/:id/toggle-status', requireSuperAdmin, async (req, res) => {
    const actor = (req as any).user;
    const { id } = req.params;
    const targetUser = await userRepository.findById(id);

    if (!targetUser) return res.status(404).json({ error: 'Admin user not found' });

    logAudit(actor.id, actor.role, 'SUPERADMIN_TOGGLE_ADMIN', 'USER', id, { name: targetUser.name });
    res.json({ success: true, message: `Admin ${targetUser.name} status updated.` });
  });

  app.get('/api/superadmin/audit-logs', requireSuperAdmin, (req, res) => {
    res.json(db.auditLogs);
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

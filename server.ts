import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, hashPassword, verifyPassword } from './server/db.js';
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
} from './src/types/index.js';

import { processOcrDocument } from './server/ocr.js';
import { documentStorage } from './server/storage.js';

dotenv.config();

// Helper middleware for auth & admin authorization
function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer token_')) {
    const userId = authHeader.replace('Bearer token_', '').trim();
    const foundUser = db.users.get(userId);
    if (foundUser) return foundUser;
  }
  return null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
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

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin or Super Admin role required.' });
  }
  (req as any).user = user;
  next();
}

function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
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
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'IKSHOVIA', timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const storedHash = db.userPasswords.get(cleanEmail);
    if (!storedHash || !verifyPassword(String(password), storedHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    logAudit(user.id, user.role, 'USER_LOGIN', 'USER', user.id, { email: user.email });
    res.json({ success: true, user, token: `token_${user.id}` });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existingUser = Array.from(db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr_${Date.now()}`;
    const newUser = {
      id: userId,
      email: cleanEmail,
      name: String(name).trim(),
      role: 'USER' as const, // All registrations default to USER role
      isOnboarded: false,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, newUser);
    db.userPasswords.set(cleanEmail, hashPassword(String(password)));
    updateLearnerModel(userId);

    logAudit(newUser.id, newUser.role, 'USER_REGISTER', 'USER', newUser.id, { email: newUser.email });
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
    const { userId, targetExam, selectedSubjects, dailyGoalMinutes, experienceLevel, goalStatement, preferredLanguage } = req.body;
    const uid = userId || 'usr_demo';
    const user = db.users.get(uid);

    if (user) {
      user.isOnboarded = true;
      user.preferredLanguage = preferredLanguage || user.preferredLanguage || 'en';
      user.onboarding = {
        targetExam: targetExam || 'UPSC CSE 2026',
        selectedSubjects: selectedSubjects || ['sub_polity', 'sub_economy'],
        dailyGoalMinutes: dailyGoalMinutes || 120,
        experienceLevel: experienceLevel || 'Intermediate',
        goalStatement: goalStatement || 'Dedicated preparation for Civil Services Examination',
        preferredLanguage: user.preferredLanguage,
      };
      db.users.set(uid, user);
      updateLearnerModel(uid);
    }

    res.json({ success: true, user });
  });

  app.patch('/api/auth/preferences', (req, res) => {
    const user = getAuthenticatedUser(req);
    const { preferredLanguage } = req.body;
    if (preferredLanguage === 'en' || preferredLanguage === 'hi') {
      user.preferredLanguage = preferredLanguage;
      if (user.onboarding) {
        user.onboarding.preferredLanguage = preferredLanguage;
      }
      db.users.set(user.id, user);
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

  app.get('/api/subjects/:id/topics', (req, res) => {
    const topics = Array.from(db.topics.values()).filter(t => t.subjectId === req.params.id);
    res.json(topics);
  });

  app.get('/api/topics/:id/concepts', (req, res) => {
    const concepts = Array.from(db.concepts.values()).filter(c => c.topicId === req.params.id);
    res.json(concepts);
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
  app.get('/api/learner/model', requireAuth, async (req, res) => {
    const user = (req as any).user;
    const userId = user.id;
    const model = updateLearnerModel(userId);
    const nextBestAction = getNextBestAction(userId);
    const aiInsight = await generateAIInsightForUser(userId);

    res.json({ model, nextBestAction, aiInsight });
  });

  app.post('/api/learner/mastery/rate', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { conceptId, confidenceRating } = req.body;
    const uid = user.id;

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
  app.post('/api/ai/analyze-mistake', requireAuth, async (req, res) => {
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
  app.post('/api/ai/tutor', requireAuth, async (req, res) => {
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

  app.post('/api/ai/conversations/:id/messages', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { userText, conceptId, quickAction, context } = req.body;
    const conv = db.conversations.get(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

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

  // Current Affairs & Resources Endpoints (Date-wise, topic-wise, source-backed)
  app.get('/api/current-affairs', (req, res) => {
    const { category, dateRange, search, subjectId } = req.query;
    let list = Array.from(db.currentAffairs.values()).filter(c => c.isPublished);

    if (category && category !== 'All') {
      const catStr = String(category).toLowerCase();
      list = list.filter(c => c.category.toLowerCase().includes(catStr) || (c.subtopic && c.subtopic.toLowerCase().includes(catStr)));
    }

    if (subjectId) {
      list = list.filter(c => c.relatedSubject === subjectId || c.relatedConceptIds.includes(String(subjectId)));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        (c.keywords && c.keywords.some(k => k.toLowerCase().includes(q))) ||
        c.source.toLowerCase().includes(q)
      );
    }

    if (dateRange && dateRange !== 'ALL') {
      const now = new Date();
      if (dateRange === 'TODAY') {
        const todayStr = now.toISOString().split('T')[0];
        list = list.filter(c => c.date === todayStr);
      } else if (dateRange === 'YESTERDAY') {
        const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        list = list.filter(c => c.date === yest);
      } else if (dateRange === 'LAST_7_DAYS') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        list = list.filter(c => c.date >= cutoff);
      } else if (dateRange === 'LAST_30_DAYS') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        list = list.filter(c => c.date >= cutoff);
      }
    }

    // Sort by published date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(list);
  });

  // Dedicated Real PYQ (Previous Year Question) Bank Endpoint
  app.get('/api/pyqs', (req, res) => {
    const { exam, year, paper, subjectId, topicId, search } = req.query;
    let list = Array.from(db.questions.values()).filter(q => q.isPublished && (q.isPyq || (q.examTag && q.examTag.includes('PYQ'))));

    if (exam && exam !== 'All') {
      list = list.filter(q => (q.exam && q.exam.toLowerCase().includes(String(exam).toLowerCase())) || (q.examTag && q.examTag.toLowerCase().includes(String(exam).toLowerCase())));
    }

    if (year) {
      const yr = Number(year);
      list = list.filter(q => q.pyqYear === yr);
    }

    if (paper) {
      list = list.filter(q => q.paper && q.paper.toLowerCase().includes(String(paper).toLowerCase()));
    }

    if (subjectId) {
      list = list.filter(q => q.subjectId === subjectId);
    }

    if (topicId) {
      list = list.filter(q => q.topicId === topicId);
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(qItem =>
        qItem.question.toLowerCase().includes(q) ||
        qItem.explanation.toLowerCase().includes(q) ||
        (qItem.source && qItem.source.toLowerCase().includes(q))
      );
    }

    res.json(list);
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
      totalOcrJobs: db.ocrJobs.size,
    });
  });

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    res.json(Array.from(db.users.values()));
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

  app.put('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const actor = (req as any).user;
    const { id } = req.params;
    const existing = db.questions.get(id);
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

    db.questions.set(id, updated);
    logAudit(actor.id, actor.role, 'QUESTION_UPDATE', 'QUESTION', id, { question: updated.question.substring(0, 40) });
    res.json({ success: true, question: updated });
  });

  app.post('/api/admin/questions', requireAdmin, (req, res) => {
    const actor = (req as any).user;
    const qData = req.body;
    const id = qData.id || `q_${Date.now()}`;
    const newQ: Question = {
      ...qData,
      id,
      isPublished: qData.isPublished !== undefined ? qData.isPublished : true,
      status: qData.status || 'READY_TO_PUBLISH',
    };
    db.questions.set(id, newQ);
    logAudit(actor.id, actor.role, 'QUESTION_CREATE', 'QUESTION', id, { question: newQ.question.substring(0, 40) });
    res.json({ success: true, question: newQ });
  });

  // OCR Studio Processing Endpoint
  app.post('/api/admin/ocr/process', requireAdmin, async (req, res) => {
    const actor = (req as any).user;
    const {
      mode,
      documentLanguage = 'AUTO',
      totalExpectedQuestions = 150,
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
      keepOriginalPdf = false,
    } = req.body;

    try {
      const result = await processOcrDocument({
        mode,
        documentLanguage,
        totalExpectedQuestions: Number(totalExpectedQuestions) || 150,
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
        examTag: examTag || 'UPSC CSE Prelims',
        pyqYear: pyqYear || 2025,
        destination: destination || 'PRACTICE_BANK',
        keepOriginalPdf,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Handle optional storage retention
      let storedQuestionPdfKey: string | undefined;
      let storedAnswerPdfKey: string | undefined;

      if (keepOriginalPdf && questionPdfBase64) {
        const cleanB64 = questionPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buf = Buffer.from(cleanB64, 'base64');
        storedQuestionPdfKey = await documentStorage.uploadDocument(questionFileName || 'Question_Paper.pdf', buf);
      }

      if (keepOriginalPdf && answerPdfBase64) {
        const cleanB64 = answerPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buf = Buffer.from(cleanB64, 'base64');
        storedAnswerPdfKey = await documentStorage.uploadDocument(answerFileName || 'Answer_Key.pdf', buf);
      }

      // Store questions in database
      result.questions.forEach(q => db.questions.set(q.id, q));

      const ocrJob: OCRJob = {
        id: result.jobId,
        mode,
        questionPdfName: questionFileName || 'Question_Paper.pdf',
        answerPdfName: answerFileName || (mode === 'SEPARATE_PDFS' || mode === 'ANSWER_PDF_ONLY' ? 'Solution_Key.pdf' : undefined),
        totalDetected: result.totalDetected,
        matchedCount: result.matchedCount,
        needsReviewCount: result.needsReviewCount,
        missingAnswerCount: result.missingAnswerCount,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        questions: result.questions,
      };

      db.ocrJobs.set(result.jobId, ocrJob);
      logAudit(actor.id, actor.role, 'OCR_IMPORT_PROCESS', 'OCR_JOB', result.jobId, {
        mode,
        count: result.questions.length,
        keepOriginalPdf,
        storedQuestionPdfKey,
        storedAnswerPdfKey,
      });

      res.json({
        success: true,
        job: ocrJob,
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

  app.get('/api/admin/ocr/jobs', requireAdmin, (req, res) => {
    res.json(Array.from(db.ocrJobs.values()));
  });

  // Bulk Operations & Publishing Destination
  app.post('/api/admin/ocr/questions/bulk-action', requireAdmin, (req, res) => {
    const actor = (req as any).user;
    const { questionIds, action, subjectId, topicId, conceptId, difficulty, destination, examTag, pyqYear } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'No questions selected for bulk action.' });
    }

    let affectedCount = 0;
    let publishBlockedCount = 0;

    questionIds.forEach(qId => {
      const q = db.questions.get(qId);
      if (!q) return;

      if (action === 'DELETE') {
        db.questions.delete(qId);
        affectedCount++;
      } else if (action === 'ASSIGN_META') {
        if (subjectId) q.subjectId = subjectId;
        if (topicId) q.topicId = topicId;
        if (conceptId) q.conceptId = conceptId;
        if (difficulty) q.difficulty = difficulty;
        if (examTag) q.examTag = examTag;
        if (pyqYear) q.pyqYear = pyqYear;
        db.questions.set(qId, q);
        affectedCount++;
      } else if (action === 'SAVE_DRAFT') {
        q.isPublished = false;
        q.status = 'DRAFT';
        db.questions.set(qId, q);
        affectedCount++;
      } else if (action === 'APPROVE') {
        q.status = 'READY_TO_PUBLISH';
        db.questions.set(qId, q);
        affectedCount++;
      } else if (action === 'PUBLISH') {
        // Enforce lifecycle rule: A question without a verified answer CANNOT be published!
        if (!q.correctAnswer || q.correctAnswer === '' || q.status === 'NEEDS_ANSWER') {
          publishBlockedCount++;
          return;
        }

        q.isPublished = true;
        q.status = 'PUBLISHED';
        q.destination = destination || 'PRACTICE_BANK';
        if (subjectId) q.subjectId = subjectId;
        if (topicId) q.topicId = topicId;
        if (conceptId) q.conceptId = conceptId;
        if (difficulty) q.difficulty = difficulty;
        if (examTag) q.examTag = examTag;
        if (pyqYear) q.pyqYear = pyqYear;

        db.questions.set(qId, q);
        affectedCount++;
      }
    });

    const subObj = subjectId ? db.subjects.get(subjectId) : null;
    const conObj = conceptId ? db.concepts.get(conceptId) : null;

    const confirmationMsg = action === 'PUBLISH'
      ? `Successfully published ${affectedCount} question(s) to ${destination || 'Practice Bank'} under ${subObj?.name || 'Polity'} -> ${conObj?.title || 'Article 32'}.${publishBlockedCount > 0 ? ` (${publishBlockedCount} question(s) were blocked because they lack verified correct answers)` : ''}`
      : `Successfully performed ${action} on ${affectedCount} question(s).`;

    logAudit(actor.id, actor.role, `QUESTION_BULK_${action}`, 'QUESTION', 'BULK', { count: affectedCount, action, destination });

    res.json({
      success: true,
      action,
      affectedCount,
      publishBlockedCount,
      message: confirmationMsg,
    });
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
        status: 'PUBLISHED',
        destination: 'PRACTICE_BANK',
      };
      db.questions.set(q.id, q);
    }

    res.json({ success: true, draft });
  });

  // -------------------------------------------------------------
  // SUPER ADMIN ROUTES (Protected by server-side requireSuperAdmin)
  // -------------------------------------------------------------
  app.get('/api/superadmin/overview', requireSuperAdmin, (req, res) => {
    const admins = Array.from(db.users.values()).filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
    res.json({
      metrics: {
        totalUsers: db.users.size,
        totalAdmins: admins.length,
        totalQuestions: db.questions.size,
        totalOcrJobs: db.ocrJobs.size,
        totalAiDrafts: db.aiDrafts.size,
        totalMockTests: db.mockTests.size,
        systemHealth: 'OPERATIONAL',
      },
      admins,
      recentAuditLogs: db.auditLogs.slice(0, 20),
    });
  });

  app.get('/api/superadmin/admins', requireSuperAdmin, (req, res) => {
    const admins = Array.from(db.users.values())
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

  app.post('/api/superadmin/admins', requireSuperAdmin, (req, res) => {
    const actor = (req as any).user;
    const { name, email, role, permissions } = req.body;

    const newAdminId = `usr_admin_${Date.now()}`;
    const newAdminUser = {
      id: newAdminId,
      email: email || `admin_${Date.now()}@ikshovia.com`,
      name: name || 'New Platform Admin',
      role: (role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN') as UserRole,
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };

    db.users.set(newAdminId, newAdminUser);
    db.adminPermissions.set(newAdminId, permissions || ['QUESTION_CREATE', 'QUESTION_PUBLISH', 'OCR_IMPORT']);

    logAudit(actor.id, actor.role, 'SUPERADMIN_CREATE_ADMIN', 'USER', newAdminId, { name, email, role });

    res.json({ success: true, admin: newAdminUser });
  });

  app.post('/api/superadmin/admins/:id/toggle-status', requireSuperAdmin, (req, res) => {
    const actor = (req as any).user;
    const { id } = req.params;
    const targetUser = db.users.get(id);

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

import {
  UserProfile,
  Subject,
  Topic,
  Concept,
  LearnerModel,
  NextBestAction,
  Question,
  RevisionItem,
  MockTest,
  CurrentAffairArticle,
  LearningResource,
  StudyGoal,
  ChatConversation,
  NotificationItem,
  MistakeCategory,
} from '../types/index.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('ikshovia_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  login: async (email?: string, password?: string, role?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return res.json();
  },

  register: async (name: string, email: string, role?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    });
    return res.json();
  },

  forgotPassword: async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
    return res.json();
  },

  saveOnboarding: async (data: any) => {
    const res = await fetch('/api/auth/onboarding', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Subjects & Content
  getSubjects: async (): Promise<Subject[]> => {
    const res = await fetch('/api/subjects');
    return res.json();
  },

  getSubjectDetail: async (id: string) => {
    const res = await fetch(`/api/subjects/${id}`);
    return res.json();
  },

  getConceptDetail: async (id: string, userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/concepts/${id}?userId=${uid}`);
    return res.json();
  },

  // Learner Intelligence
  getLearnerModel: async (userId?: string): Promise<{ model: LearnerModel; nextBestAction: NextBestAction; aiInsight: string }> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/learner/model?userId=${uid}`);
    return res.json();
  },

  rateConceptConfidence: async (conceptId: string, confidenceRating: number, userId?: string) => {
    const res = await fetch('/api/learner/mastery/rate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, conceptId, confidenceRating }),
    });
    return res.json();
  },

  // Practice & Questions
  getPracticeQuestions: async (subjectId?: string, conceptId?: string, limit = 10): Promise<Question[]> => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId);
    if (conceptId) params.append('conceptId', conceptId);
    params.append('limit', String(limit));

    const res = await fetch(`/api/practice/questions?${params.toString()}`);
    return res.json();
  },

  submitQuestionAttempt: async (
    questionId: string,
    userAnswer: string,
    timeSpentSeconds: number,
    confidenceRating: number,
    mistakeCategory?: MistakeCategory,
    userId?: string
  ) => {
    const res = await fetch('/api/practice/attempt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId,
        questionId,
        userAnswer,
        timeSpentSeconds,
        confidenceRating,
        mistakeCategory,
      }),
    });
    return res.json();
  },

  analyzeMistakeWithAI: async (questionId: string, userAnswer: string, correctAnswer?: string, explanation?: string, conceptTitle?: string) => {
    const res = await fetch('/api/ai/analyze-mistake', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questionId, userAnswer, correctAnswer, explanation, conceptTitle }),
    });
    return res.json();
  },

  evaluateMainsAnswer: async (question: string, userAnswer: string, conceptTitle?: string) => {
    const res = await fetch('/api/mains/evaluate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, userAnswer, conceptTitle }),
    });
    return res.json();
  },

  // Revision Engine
  getRevisionQueue: async (userId?: string): Promise<RevisionItem[]> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/revision/queue?userId=${uid}`);
    return res.json();
  },

  // Knowledge Graph
  getKnowledgeGraph: async (userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/graph?userId=${uid}`);
    return res.json();
  },

  // Analytics
  getAnalytics: async (userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/analytics?userId=${uid}`);
    return res.json();
  },

  // AI Tutor
  askAITutor: async (userPrompt: string, conceptId?: string, quickAction?: string, userId?: string) => {
    const res = await fetch('/api/ai/tutor', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, userPrompt, conceptId, quickAction }),
    });
    return res.json();
  },

  getConversations: async (userId?: string): Promise<ChatConversation[]> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/ai/conversations?userId=${uid}`);
    return res.json();
  },

  sendChatMessage: async (conversationId: string, userText: string, conceptId?: string, quickAction?: string) => {
    const res = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userText, conceptId, quickAction }),
    });
    return res.json();
  },

  // Mock Tests
  getMockTests: async (): Promise<MockTest[]> => {
    const res = await fetch('/api/mock-tests');
    return res.json();
  },

  submitMockTest: async (mockTestId: string, answers: Record<string, string>, timeTakenSeconds: number, userId?: string) => {
    const res = await fetch(`/api/mock-tests/${mockTestId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, answers, timeTakenSeconds }),
    });
    return res.json();
  },

  // Current Affairs & Resources
  getCurrentAffairs: async (): Promise<CurrentAffairArticle[]> => {
    const res = await fetch('/api/current-affairs');
    return res.json();
  },

  getResources: async (): Promise<LearningResource[]> => {
    const res = await fetch('/api/resources');
    return res.json();
  },

  // Goals
  getGoals: async (userId?: string): Promise<StudyGoal[]> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/goals?userId=${uid}`);
    return res.json();
  },

  createGoal: async (goalData: any) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData),
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (userId?: string): Promise<NotificationItem[]> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/notifications?userId=${uid}`);
    return res.json();
  },

  // Global Search
  searchGlobal: async (query: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  // Admin API
  getAdminMetrics: async () => {
    const res = await fetch('/api/admin/metrics', { headers: getAuthHeaders() });
    return res.json();
  },

  getAdminUsers: async () => {
    const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
    return res.json();
  },

  createConcept: async (conceptData: any) => {
    const res = await fetch('/api/admin/concepts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conceptData),
    });
    return res.json();
  },

  createQuestion: async (questionData: any) => {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    return res.json();
  },

  generateAdminAIQuestions: async (prompt: string, subjectId?: string, topicId?: string, count = 2) => {
    const res = await fetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, subjectId, topicId, count }),
    });
    return res.json();
  },

  generateAIQuestions: async (prompt: string, subjectId?: string, topicId?: string, count = 2) => {
    const res = await fetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, subjectId, topicId, count }),
    });
    return res.json();
  },

  getAdminAIDrafts: async () => {
    const res = await fetch('/api/admin/ai/drafts', { headers: getAuthHeaders() });
    return res.json();
  },

  getAdminDrafts: async () => {
    const res = await fetch('/api/admin/ai/drafts', { headers: getAuthHeaders() });
    return res.json();
  },

  approveAdminAIDraft: async (draftId: string) => {
    const res = await fetch(`/api/admin/ai/drafts/${draftId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  approveDraft: async (draftId: string) => {
    const res = await fetch(`/api/admin/ai/drafts/${draftId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

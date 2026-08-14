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
  login: async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
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

  updateUserPreferences: async (preferredLanguage: 'en' | 'hi') => {
    const res = await fetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ preferredLanguage }),
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

  getTopics: async (subjectId: string): Promise<Topic[]> => {
    const res = await fetch(`/api/subjects/${subjectId}/topics`);
    return res.json();
  },

  getConceptDetail: async (id: string, userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/concepts/${id}?userId=${uid}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Learner Intelligence
  getLearnerModel: async (userId?: string): Promise<{ model: LearnerModel; nextBestAction: NextBestAction; aiInsight: string }> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/learner/model?userId=${uid}`, { headers: getAuthHeaders() });
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
    const res = await fetch(`/api/revision/queue?userId=${uid}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Knowledge Graph
  getKnowledgeGraph: async (userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/graph?userId=${uid}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Analytics
  getAnalytics: async (userId?: string) => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/analytics?userId=${uid}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // AI Tutor
  askAITutor: async (userPrompt: string, conceptId?: string, quickAction?: string, userId?: string, context?: any) => {
    const res = await fetch('/api/ai/tutor', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, userPrompt, conceptId, quickAction, context }),
    });
    return res.json();
  },

  getConversations: async (): Promise<ChatConversation[]> => {
    const res = await fetch('/api/ai/conversations', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load AI conversations (${res.status})`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.conversations)) {
      return data.conversations;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  },

  createConversation: async (title?: string, initialMessage?: any): Promise<ChatConversation> => {
    const res = await fetch('/api/ai/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, initialMessage }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create AI conversation (${res.status})`);
    }
    return res.json();
  },

  sendChatMessage: async (conversationId: string, userText: string, conceptId?: string, quickAction?: string, context?: any) => {
    const res = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userText, conceptId, quickAction, context }),
    });
    if (!res.ok) {
      throw new Error(`Failed to send message (${res.status})`);
    }
    return res.json();
  },

  // Mock Tests
  getMockTests: async (): Promise<MockTest[]> => {
    const res = await fetch('/api/mock-tests');
    return res.json();
  },

  getMockTest: async (id: string): Promise<MockTest & { questions?: Question[] }> => {
    const res = await fetch(`/api/mock-tests/${id}`);
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
  getCurrentAffairs: async (filters?: { category?: string; dateRange?: string; search?: string; subjectId?: string; exam?: string; relevance?: string; biharOnly?: boolean }): Promise<CurrentAffairArticle[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.exam) params.append('exam', filters.exam);
    if (filters?.relevance) params.append('relevance', filters.relevance);
    if (filters?.biharOnly) params.append('biharOnly', 'true');

    const res = await fetch(`/api/current-affairs?${params.toString()}`);
    return res.json();
  },

  getCurrentAffairById: async (id: string): Promise<CurrentAffairArticle> => {
    const res = await fetch(`/api/current-affairs/${id}`);
    return res.json();
  },

  bookmarkCurrentAffairForRevision: async (id: string) => {
    const res = await fetch(`/api/current-affairs/${id}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getMyCurrentAffairsRevisions: async (): Promise<CurrentAffairArticle[]> => {
    const res = await fetch(`/api/current-affairs/revisions/my`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminGetCurrentAffairsMetrics: async () => {
    const res = await fetch(`/api/admin/current-affairs/metrics`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminListCurrentAffairs: async (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    const res = await fetch(`/api/admin/current-affairs/list?${q}`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminTriggerIngestion: async (providerCode?: string) => {
    const res = await fetch(`/api/admin/current-affairs/ingest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ providerCode }),
    });
    return res.json();
  },

  adminEnrichCurrentAffair: async (id: string) => {
    const res = await fetch(`/api/admin/current-affairs/${id}/enrich`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminUpdateCurrentAffair: async (id: string, updates: any) => {
    const res = await fetch(`/api/admin/current-affairs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  adminPublishCurrentAffair: async (id: string) => {
    const res = await fetch(`/api/admin/current-affairs/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminRejectCurrentAffair: async (id: string) => {
    const res = await fetch(`/api/admin/current-affairs/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminGenerateQuestionFromCurrentAffair: async (id: string) => {
    const res = await fetch(`/api/admin/current-affairs/${id}/generate-question`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getPYQs: async (filters?: { exam?: string; year?: number; paper?: string; subjectId?: string; topicId?: string; search?: string }): Promise<Question[]> => {
    const params = new URLSearchParams();
    if (filters?.exam) params.append('exam', filters.exam);
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.paper) params.append('paper', filters.paper);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.topicId) params.append('topicId', filters.topicId);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/pyqs?${params.toString()}`);
    return res.json();
  },

  getResources: async (): Promise<LearningResource[]> => {
    const res = await fetch('/api/resources');
    return res.json();
  },

  // Goals
  getGoals: async (userId?: string): Promise<StudyGoal[]> => {
    const uid = userId || 'usr_demo';
    const res = await fetch(`/api/goals?userId=${uid}`, { headers: getAuthHeaders() });
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
    const res = await fetch(`/api/notifications?userId=${uid}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Global Search
  searchGlobal: async (query: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  // Admin API
  getConcepts: async (topicId?: string): Promise<Concept[]> => {
    const url = topicId ? `/api/topics/${topicId}/concepts` : '/api/concepts';
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

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

  updateQuestion: async (id: string, questionData: any) => {
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: 'PUT',
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

  // OCR Studio API
  processOcrImport: async (data: any) => {
    const res = await fetch('/api/admin/ocr/process', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getOcrJobs: async () => {
    const res = await fetch('/api/admin/ocr/jobs', { headers: getAuthHeaders() });
    return res.json();
  },

  getOcrJobDetails: async (id: string) => {
    const res = await fetch(`/api/admin/ocr/jobs/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  updateOcrQuestion: async (id: string, updates: any) => {
    const res = await fetch(`/api/admin/ocr/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  approveOcrQuestion: async (id: string, data?: any) => {
    const res = await fetch(`/api/admin/ocr/questions/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    return res.json();
  },

  rejectOcrQuestion: async (id: string) => {
    const res = await fetch(`/api/admin/ocr/questions/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  bulkActionOcrQuestions: async (data: any) => {
    const res = await fetch('/api/admin/ocr/questions/bulk-action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Super Admin API
  getSuperAdminOverview: async () => {
    const res = await fetch('/api/superadmin/overview', { headers: getAuthHeaders() });
    return res.json();
  },

  getSuperAdminAdmins: async () => {
    const res = await fetch('/api/superadmin/admins', { headers: getAuthHeaders() });
    return res.json();
  },

  createSuperAdminAdmin: async (data: any) => {
    const res = await fetch('/api/superadmin/admins', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  toggleSuperAdminAdminStatus: async (adminId: string) => {
    const res = await fetch(`/api/superadmin/admins/${adminId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getSuperAdminAuditLogs: async () => {
    const res = await fetch('/api/superadmin/audit-logs', { headers: getAuthHeaders() });
    return res.json();
  },
};

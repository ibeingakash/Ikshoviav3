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
  MockAttempt,
  CurrentAffairArticle,
  LearningResource,
  StudyGoal,
  ChatConversation,
  NotificationItem,
  MistakeCategory,
} from '../types/index.js';

export const PRODUCTION_API_URL = 'https://ikshoviav3.onrender.com';

/**
 * Detects if the current environment is running inside Capacitor (specifically Android native app).
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;

  const win = window as any;

  // 1. Explicit Capacitor object injected by native bridge
  if (win.Capacitor) {
    if (typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof win.Capacitor.getPlatform === 'function') {
      const platform = win.Capacitor.getPlatform();
      if (platform === 'android' || platform === 'ios') {
        return true;
      }
    }
  }

  // 2. Protocol check for native app WebView (e.g. capacitor://localhost or file:)
  const protocol = window.location.protocol;
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') {
    return true;
  }

  // 3. In Capacitor Android APK, the origin is usually https://localhost or http://localhost
  // We distinguish this from desktop web development by checking Android WebView user-agent or capacitor indicators.
  const isAndroidWebView =
    /Android.*(wv|\.apk|Version\/[\d.]+).*Chrome/i.test(navigator.userAgent || '') ||
    /Capacitor/i.test(navigator.userAgent || '');
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && isAndroidWebView) {
    return true;
  }

  return false;
}

/**
 * Resolves the appropriate API base URL dynamically:
 * - If VITE_API_BASE_URL is explicitly set, uses it.
 * - If running inside Capacitor Android native APK, uses production backend https://ikshoviav3.onrender.com.
 * - Otherwise (local development & web production), uses relative URL / same origin.
 */
export function getApiBaseUrl(): string {
  const meta = import.meta as any;
  const envUrl = (meta?.env?.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (isCapacitorNative()) {
    return PRODUCTION_API_URL;
  }

  return '';
}

/**
 * Builds a normalized API URL with the resolved base URL.
 */
export function apiUrl(endpoint: string): string {
  if (!endpoint) return getApiBaseUrl();
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${normalizedEndpoint}` : normalizedEndpoint;
}

/**
 * Centralized fetch wrapper ensuring all requests target the resolved base URL.
 */
export const apiFetch = (endpoint: string, init?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(endpoint), init);
};

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
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (name: string, email: string, password: string) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  forgotPassword: async (email: string) => {
    const res = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return res.json();
  },

  getMe: async () => {
    const res = await apiFetch('/api/auth/me', { headers: getAuthHeaders() });
    return res.json();
  },

  saveOnboarding: async (data: any) => {
    const res = await apiFetch('/api/auth/onboarding', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateUserPreferences: async (preferredLanguage: 'en' | 'hi') => {
    const res = await apiFetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ preferredLanguage }),
    });
    return res.json();
  },

  // Subjects & Content
  getSubjects: async (): Promise<Subject[]> => {
    try {
      const res = await apiFetch('/api/subjects');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.subjects) ? data.subjects : []);
    } catch {
      return [];
    }
  },

  getSubjectDetail: async (id: string) => {
    try {
      const res = await apiFetch(`/api/subjects/${id}`);
      if (!res.ok) return { subject: null, topics: [], concepts: [] };
      const data = await res.json();
      return {
        subject: data?.subject || null,
        topics: Array.isArray(data?.topics) ? data.topics : [],
        concepts: Array.isArray(data?.concepts) ? data.concepts : [],
      };
    } catch {
      return { subject: null, topics: [], concepts: [] };
    }
  },

  getTopics: async (subjectId: string): Promise<Topic[]> => {
    try {
      const res = await apiFetch(`/api/subjects/${subjectId}/topics`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.topics) ? data.topics : []);
    } catch {
      return [];
    }
  },

  getConceptDetail: async (id: string, userId?: string) => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/concepts/${id}?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return { concept: null, mastery: null, prerequisites: [], related: [] };
      const data = await res.json();
      return {
        concept: data?.concept || null,
        mastery: data?.mastery || null,
        prerequisites: Array.isArray(data?.prerequisites) ? data.prerequisites : [],
        related: Array.isArray(data?.related) ? data.related : [],
      };
    } catch {
      return { concept: null, mastery: null, prerequisites: [], related: [] };
    }
  },

  // Learner Intelligence
  getLearnerModel: async (userId?: string): Promise<{ model: LearnerModel; nextBestAction: NextBestAction; aiInsight: string }> => {
    const uid = userId || 'usr_demo';
    const fallbackModel: LearnerModel = {
      userId: uid,
      overallScore: 0,
      totalStudyTimeMinutes: 0,
      currentStreak: 0,
      highestStreak: 0,
      activeDaysCount: 0,
      confidenceBias: 'BALANCED',
      mistakeBreakdown: {
        CONCEPT_GAP: 0,
        RECALL_FAILURE: 0,
        CONCEPT_CONFUSION: 0,
        MISINTERPRETATION: 0,
        CARELESS_ERROR: 0,
        TIME_PRESSURE: 0,
      },
      subjectMastery: {},
      masteredConceptsCount: 0,
      weakConceptsCount: 0,
      dueRevisionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
    const fallbackNBA: NextBestAction = {
      id: 'nba_default',
      actionType: 'PRACTICE',
      title: 'Begin Practice Session',
      description: 'Explore fundamental concepts and diagnose your baseline mastery.',
      reason: 'Diagnose your baseline mastery.',
      estimatedMinutes: 15,
      priority: 'MEDIUM',
    };
    const fallbackInsight = 'Start practicing to unlock personalized learning insights.';

    try {
      const res = await apiFetch(`/api/learner/model?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        return {
          model: fallbackModel,
          nextBestAction: fallbackNBA,
          aiInsight: fallbackInsight,
        };
      }
      const data = await res.json();
      return {
        model: data?.model || fallbackModel,
        nextBestAction: data?.nextBestAction || fallbackNBA,
        aiInsight: data?.aiInsight || fallbackInsight,
      };
    } catch {
      return {
        model: fallbackModel,
        nextBestAction: fallbackNBA,
        aiInsight: fallbackInsight,
      };
    }
  },

  rateConceptConfidence: async (conceptId: string, confidenceRating: number, userId?: string) => {
    const res = await apiFetch('/api/learner/mastery/rate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, conceptId, confidenceRating }),
    });
    return res.json();
  },

  // Practice & Questions
  getPracticeQuestions: async (subjectId?: string, conceptId?: string, limit = 10): Promise<Question[]> => {
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (conceptId) params.append('conceptId', conceptId);
      params.append('limit', String(limit));

      const res = await apiFetch(`/api/practice/questions?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : []);
    } catch {
      return [];
    }
  },

  submitQuestionAttempt: async (
    questionId: string,
    userAnswer: string,
    timeSpentSeconds: number,
    confidenceRating: number,
    mistakeCategory?: MistakeCategory,
    userId?: string
  ) => {
    const res = await apiFetch('/api/practice/attempt', {
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
    const res = await apiFetch('/api/ai/analyze-mistake', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questionId, userAnswer, correctAnswer, explanation, conceptTitle }),
    });
    return res.json();
  },

  evaluateMainsAnswer: async (question: string, userAnswer: string, conceptTitle?: string) => {
    const res = await apiFetch('/api/mains/evaluate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, userAnswer, conceptTitle }),
    });
    return res.json();
  },

  // Revision Engine
  getRevisionQueue: async (userId?: string): Promise<RevisionItem[]> => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/revision/queue?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.queue) ? data.queue : []);
    } catch {
      return [];
    }
  },

  // Knowledge Graph
  getKnowledgeGraph: async (userId?: string) => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/graph?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return { nodes: [], links: [] };
      const data = await res.json();
      return {
        nodes: Array.isArray(data?.nodes) ? data.nodes : [],
        links: Array.isArray(data?.links) ? data.links : [],
      };
    } catch {
      return { nodes: [], links: [] };
    }
  },

  // Analytics
  getAnalytics: async (userId?: string) => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/analytics?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // AI Tutor
  askAITutor: async (userPrompt: string, conceptId?: string, quickAction?: string, userId?: string, context?: any) => {
    const res = await apiFetch('/api/ai/tutor', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, userPrompt, conceptId, quickAction, context }),
    });
    return res.json();
  },

  getConversations: async (): Promise<ChatConversation[]> => {
    try {
      const res = await apiFetch('/api/ai/conversations', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return [];
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
    } catch {
      return [];
    }
  },

  createConversation: async (title?: string, initialMessage?: any): Promise<ChatConversation> => {
    const res = await apiFetch('/api/ai/conversations', {
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
    const res = await apiFetch(`/api/ai/conversations/${conversationId}/messages`, {
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
    try {
      const res = await apiFetch('/api/mock-tests');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.mockTests) ? data.mockTests : []);
    } catch {
      return [];
    }
  },

  getMockTest: async (id: string): Promise<MockTest & { questions?: Question[] }> => {
    const res = await apiFetch(`/api/mock-tests/${id}`);
    if (!res.ok) throw new Error('Mock test not found');
    const data = await res.json();
    return {
      ...data,
      questions: Array.isArray(data?.questions) ? data.questions : [],
    };
  },

  createCustomMockTest: async (params: {
    title?: string;
    subjectIds?: string[];
    totalQuestions: number;
    durationMinutes?: number;
    difficulty?: string;
    examTag?: string;
  }): Promise<{ success: boolean; test: MockTest; questions: Question[] }> => {
    const res = await apiFetch('/api/mock-tests/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to generate mock test');
    const data = await res.json();
    return {
      success: true,
      test: data.test,
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  },

  startMockAttempt: async (mockTestId: string): Promise<{ attempt: MockAttempt; test: MockTest; questions: Question[] }> => {
    const res = await apiFetch(`/api/mock-tests/${mockTestId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start mock test attempt');
    const data = await res.json();
    return {
      attempt: data.attempt,
      test: data.test,
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  },

  submitMockTest: async (mockTestId: string, answers: Record<string, string>, timeTakenSeconds: number, userId?: string) => {
    const res = await apiFetch(`/api/mock-tests/${mockTestId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, answers, timeTakenSeconds }),
    });
    return res.json();
  },

  // Current Affairs & Resources
  getCurrentAffairs: async (filters?: { category?: string; dateRange?: string; search?: string; subjectId?: string; exam?: string; relevance?: string; biharOnly?: boolean }): Promise<CurrentAffairArticle[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.dateRange) params.append('dateRange', filters.dateRange);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.relevance) params.append('relevance', filters.relevance);
      if (filters?.biharOnly) params.append('biharOnly', 'true');

      const res = await apiFetch(`/api/current-affairs?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.articles) ? data.articles : []);
    } catch {
      return [];
    }
  },

  getCurrentAffairById: async (id: string): Promise<CurrentAffairArticle> => {
    const res = await apiFetch(`/api/current-affairs/${id}`);
    return res.json();
  },

  bookmarkCurrentAffairForRevision: async (id: string) => {
    const res = await apiFetch(`/api/current-affairs/${id}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getMyCurrentAffairsRevisions: async (): Promise<CurrentAffairArticle[]> => {
    try {
      const res = await apiFetch(`/api/current-affairs/revisions/my`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  adminGetCurrentAffairsMetrics: async () => {
    const res = await apiFetch(`/api/admin/current-affairs/metrics`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminListCurrentAffairs: async (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    const res = await apiFetch(`/api/admin/current-affairs/list?${q}`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminTriggerIngestion: async (providerCode?: string) => {
    const res = await apiFetch(`/api/admin/current-affairs/ingest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ providerCode }),
    });
    return res.json();
  },

  adminEnrichCurrentAffair: async (id: string) => {
    const res = await apiFetch(`/api/admin/current-affairs/${id}/enrich`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminUpdateCurrentAffair: async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/current-affairs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  adminPublishCurrentAffair: async (id: string) => {
    const res = await apiFetch(`/api/admin/current-affairs/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminRejectCurrentAffair: async (id: string) => {
    const res = await apiFetch(`/api/admin/current-affairs/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  adminGenerateQuestionFromCurrentAffair: async (id: string) => {
    const res = await apiFetch(`/api/admin/current-affairs/${id}/generate-question`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getPYQs: async (filters?: { exam?: string; year?: number; paper?: string; subjectId?: string; topicId?: string; search?: string }): Promise<Question[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.year) params.append('year', String(filters.year));
      if (filters?.paper) params.append('paper', filters.paper);
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);
      if (filters?.topicId) params.append('topicId', filters.topicId);
      if (filters?.search) params.append('search', filters.search);

      const res = await apiFetch(`/api/pyqs?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : []);
    } catch {
      return [];
    }
  },

  getResources: async (): Promise<LearningResource[]> => {
    try {
      const res = await apiFetch('/api/resources');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.resources) ? data.resources : []);
    } catch {
      return [];
    }
  },

  // Goals
  getGoals: async (userId?: string): Promise<StudyGoal[]> => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/goals?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.goals) ? data.goals : []);
    } catch {
      return [];
    }
  },

  createGoal: async (goalData: any) => {
    const res = await apiFetch('/api/goals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData),
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (userId?: string): Promise<NotificationItem[]> => {
    try {
      const uid = userId || 'usr_demo';
      const res = await apiFetch(`/api/notifications?userId=${uid}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.notifications) ? data.notifications : []);
    } catch {
      return [];
    }
  },

  // Global Search
  searchGlobal: async (query: string) => {
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return { subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [] };
      const data = await res.json();
      return {
        subjects: Array.isArray(data?.subjects) ? data.subjects : [],
        concepts: Array.isArray(data?.concepts) ? data.concepts : [],
        questions: Array.isArray(data?.questions) ? data.questions : [],
        currentAffairs: Array.isArray(data?.currentAffairs) ? data.currentAffairs : [],
        resources: Array.isArray(data?.resources) ? data.resources : [],
      };
    } catch {
      return { subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [] };
    }
  },

  // Admin API
  getConcepts: async (topicId?: string): Promise<Concept[]> => {
    try {
      const url = topicId ? `/api/topics/${topicId}/concepts` : '/api/concepts';
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.concepts) ? data.concepts : []);
    } catch {
      return [];
    }
  },

  getAdminMetrics: async () => {
    const res = await apiFetch('/api/admin/metrics', { headers: getAuthHeaders() });
    return res.json();
  },

  getAdminUsers: async () => {
    try {
      const res = await apiFetch('/api/admin/users', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []);
    } catch {
      return [];
    }
  },

  createConcept: async (conceptData: any) => {
    const res = await apiFetch('/api/admin/concepts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conceptData),
    });
    return res.json();
  },

  createQuestion: async (questionData: any) => {
    const res = await apiFetch('/api/admin/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    return res.json();
  },

  updateQuestion: async (id: string, questionData: any) => {
    const res = await apiFetch(`/api/admin/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    return res.json();
  },

  generateAdminAIQuestions: async (prompt: string, subjectId?: string, topicId?: string, count = 2) => {
    const res = await apiFetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, subjectId, topicId, count }),
    });
    return res.json();
  },

  generateAIQuestions: async (prompt: string, subjectId?: string, topicId?: string, count = 2) => {
    const res = await apiFetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, subjectId, topicId, count }),
    });
    return res.json();
  },

  getAdminAIDrafts: async () => {
    try {
      const res = await apiFetch('/api/admin/ai/drafts', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.drafts) ? data.drafts : []);
    } catch {
      return [];
    }
  },

  getAdminDrafts: async () => {
    try {
      const res = await apiFetch('/api/admin/ai/drafts', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.drafts) ? data.drafts : []);
    } catch {
      return [];
    }
  },

  approveAdminAIDraft: async (draftId: string) => {
    const res = await apiFetch(`/api/admin/ai/drafts/${draftId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  approveDraft: async (draftId: string) => {
    const res = await apiFetch(`/api/admin/ai/drafts/${draftId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // OCR Studio API
  processOcrImport: async (data: any) => {
    const res = await apiFetch('/api/admin/ocr/process', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getOcrJobs: async () => {
    try {
      const res = await apiFetch('/api/admin/ocr/jobs', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
    } catch {
      return [];
    }
  },

  getOcrJobDetails: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/jobs/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  updateOcrQuestion: async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  approveOcrQuestion: async (id: string, data?: any) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    return res.json();
  },

  rejectOcrQuestion: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  bulkActionOcrQuestions: async (data: any) => {
    const res = await apiFetch('/api/admin/ocr/questions/bulk-action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Super Admin API
  getSuperAdminOverview: async () => {
    const res = await apiFetch('/api/superadmin/overview', { headers: getAuthHeaders() });
    return res.json();
  },

  getSuperAdminAdmins: async () => {
    try {
      const res = await apiFetch('/api/superadmin/admins', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.admins) ? data.admins : []);
    } catch {
      return [];
    }
  },

  createSuperAdminAdmin: async (data: any) => {
    const res = await apiFetch('/api/superadmin/admins', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  toggleSuperAdminAdminStatus: async (adminId: string) => {
    const res = await apiFetch(`/api/superadmin/admins/${adminId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getSuperAdminAuditLogs: async () => {
    try {
      const res = await apiFetch('/api/superadmin/audit-logs', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.auditLogs) ? data.auditLogs : []);
    } catch {
      return [];
    }
  },
};


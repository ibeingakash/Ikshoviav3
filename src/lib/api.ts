import {
  UserProfile,
  ManagedUser,
  Course,
  CoursePrice,
  Entitlement,
  Subject,
  Topic,
  Concept,
  LearnerModel,
  NextBestAction,
  Question,
  PyqPaper,
  PyqArchiveData,
  PyqAuditReport,
  PyqCompletenessValidation,
  RevisionItem,
  MockTest,
  MockAttempt,
  CurrentAffairArticle,
  LearningResource,
  StudyGoal,
  ChatConversation,
  NotificationItem,
  MistakeCategory,
  UserRole,
  Coupon,
  CommercialDashboardMetrics,
  RevenueAnalyticsMetrics,
  CourseSalesAnalytics,
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
    try {
      const res = await apiFetch('/api/v1/data/ai/tutor', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: userPrompt,
          userPrompt,
          conceptId,
          quickAction,
          exam: context?.targetExam,
          subject: context?.subjectName,
          topic: context?.topicName || context?.conceptTitle,
          mode: quickAction || 'tutor',
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const fallbackRes = await apiFetch('/api/ai/tutor', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, userPrompt, conceptId, quickAction, context }),
    });
    return fallbackRes.json();
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
  getMockTests: async (filters?: { type?: string; sourceType?: string }): Promise<MockTest[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters?.sourceType && filters.sourceType !== 'ALL') params.append('sourceType', filters.sourceType);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/mock-tests${queryString}`);
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

  getAdminMockTests: async (filters?: { type?: string; sourceType?: string; includeArchived?: boolean }): Promise<MockTest[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters?.sourceType && filters.sourceType !== 'ALL') params.append('sourceType', filters.sourceType);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/admin/mock-tests${queryString}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  deleteMockTest: async (id: string): Promise<{ success: boolean; message: string; attemptsPreserved?: number }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete mock test');
    return data;
  },

  restoreMockTest: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to restore mock test');
    return data;
  },

  updateMockTest: async (id: string, updates: { displayName?: string; title?: string }): Promise<{ success: boolean; test: MockTest }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update mock test');
    return data;
  },

  createCustomMockTest: async (params: {
    title?: string;
    subjectIds?: string[];
    totalQuestions?: number;
    durationMinutes?: number;
    difficulty?: string;
    type?: 'QUICK' | 'SUBJECT' | 'FULL';
    examTag?: string;
    questionIds?: string[];
    sourceType?: 'IKSHOVIA_CREATED' | 'ADMIN_IMPORTED';
    isPublished?: boolean;
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

  startMockAttempt: async (mockTestId: string): Promise<{ attempt: MockAttempt; test: MockTest; questions: Question[]; answers?: any[] }> => {
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
      answers: Array.isArray(data.answers) ? data.answers : [],
    };
  },

  saveMockAnswer: async (attemptId: string, questionId: string, userAnswer: string, timeSpentSeconds?: number, markedForReview?: boolean) => {
    try {
      const res = await apiFetch(`/api/mock-tests/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ questionId, userAnswer, timeSpentSeconds, markedForReview }),
      });
      return res.json();
    } catch {
      return null;
    }
  },

  submitMockTest: async (mockTestId: string, answers: Record<string, string>, timeTakenSeconds: number, userId?: string) => {
    const res = await apiFetch(`/api/mock-tests/${mockTestId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, answers, timeTakenSeconds }),
    });
    return res.json();
  },

  getMockTestHistory: async (): Promise<MockAttempt[]> => {
    try {
      const res = await apiFetch('/api/mock-tests/history', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : Array.isArray(data?.history) ? data.history : [];
    } catch {
      return [];
    }
  },

  // Current Affairs & Day-Wise Reader Engine
  getDayCurrentAffairs: async (filters?: {
    date?: string;
    exam?: string;
    category?: string;
    biharOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    date: string;
    formattedDate: string;
    isToday: boolean;
    digest: {
      date: string;
      formattedDate: string;
      totalDiscovered: number;
      totalEligible: number;
      topStoriesCount: number;
      importantDevelopmentsCount: number;
      editorialsCount: number;
      topicClustersCount: number;
      sourcesCount: number;
      sourcesDetected: string[];
    };
    topStories: CurrentAffairArticle[];
    importantDevelopments: CurrentAffairArticle[];
    editorials: CurrentAffairArticle[];
    topicClusters: any[];
    availableDates: { date: string; formatted: string; count: number; isToday: boolean }[];
    pagination: {
      page: number;
      limit: number;
      totalImportant: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.biharOnly) params.append('biharOnly', 'true');
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/current-affairs/day?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load day feed');
      return res.json();
    } catch {
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        date: todayStr,
        formattedDate: todayStr,
        isToday: true,
        digest: {
          date: todayStr,
          formattedDate: todayStr,
          totalDiscovered: 0,
          totalEligible: 0,
          topStoriesCount: 0,
          importantDevelopmentsCount: 0,
          editorialsCount: 0,
          topicClustersCount: 0,
          sourcesCount: 0,
          sourcesDetected: [],
        },
        topStories: [],
        importantDevelopments: [],
        editorials: [],
        topicClusters: [],
        availableDates: [],
        pagination: { page: 1, limit: 8, totalImportant: 0, totalPages: 1, hasMore: false },
      };
    }
  },

  getDailyDigest: async (date?: string, exam?: string) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (exam) params.append('exam', exam);
      const res = await apiFetch(`/api/current-affairs/daily-digest?${params.toString()}`);
      return res.json();
    } catch {
      return null;
    }
  },

  getCurrentAffairsArchive: async (filters?: {
    startDate?: string;
    endDate?: string;
    date?: string;
    category?: string;
    exam?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/current-affairs/archive?${params.toString()}`);
      return res.json();
    } catch {
      return { groupedByDate: [], totalArticles: 0, page: 1, limit: 15, totalPages: 1, hasMore: false };
    }
  },

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

  getEditorials: async (filters?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    source?: string;
    gsPaper?: string;
    articleType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: CurrentAffairArticle[];
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.source) params.append('source', filters.source);
      if (filters?.gsPaper) params.append('gsPaper', filters.gsPaper);
      if (filters?.articleType) params.append('articleType', filters.articleType);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/current-affairs/editorials?${params.toString()}`);
      if (!res.ok) return { items: [], totalCount: 0, totalPages: 1, page: 1, limit: 10, hasMore: false };
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          totalCount: data.length,
          totalPages: 1,
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          hasMore: false,
        };
      }
      return {
        items: Array.isArray(data.items) ? data.items : (Array.isArray(data.editorials) ? data.editorials : []),
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        page: data.page || filters?.page || 1,
        limit: data.limit || filters?.limit || 10,
        hasMore: Boolean(data.hasMore),
      };
    } catch {
      return { items: [], totalCount: 0, totalPages: 1, page: 1, limit: 10, hasMore: false };
    }
  },

  getAvailableEditorialDates: async (): Promise<{ date: string; formatted: string; count: number }[]> => {
    try {
      const res = await apiFetch('/api/current-affairs/editorials/dates');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getBiharFeed: async (filters?: {
    date?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    date?: string;
    formattedDate?: string;
    totalArticles: number;
    articles: CurrentAffairArticle[];
    availableDates: { date: string; formatted: string; count: number }[];
    policyHighlights: {
      title: string;
      sector: string;
      bpscPaper: string;
      summary: string;
      targetYear: string;
    }[];
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/current-affairs/bihar?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load Bihar feed');
      return res.json();
    } catch {
      return {
        totalArticles: 0,
        articles: [],
        availableDates: [],
        policyHighlights: [],
        page: 1,
        totalPages: 1,
        hasMore: false,
      };
    }
  },

  getAvailableBiharDates: async (): Promise<{ date: string; formatted: string; count: number }[]> => {
    try {
      const res = await apiFetch('/api/current-affairs/bihar/dates');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getTopicClusters: async (): Promise<any[]> => {
    try {
      const res = await apiFetch(`/api/current-affairs/topic-clusters`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getTopicClusterDetails: async (id: string): Promise<any> => {
    const res = await apiFetch(`/api/current-affairs/topic-clusters/${id}`);
    return res.json();
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

  adminGetIngestionRuns: async (limit = 30) => {
    const res = await apiFetch(`/api/admin/current-affairs/ingestion-runs?limit=${limit}`, { headers: getAuthHeaders() });
    return res.json();
  },

  adminGetSourceFreshness: async () => {
    const res = await apiFetch(`/api/admin/current-affairs/source-freshness`, { headers: getAuthHeaders() });
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

  getPYQExams: async (): Promise<string[]> => {
    try {
      const res = await apiFetch('/api/pyqs/exams');
      if (!res.ok) return ['UPSC CSE', 'BPSC'];
      return await res.json();
    } catch {
      return ['UPSC CSE', 'BPSC'];
    }
  },

  getPYQYears: async (exam?: string): Promise<number[]> => {
    try {
      const params = new URLSearchParams();
      if (exam && exam !== 'All') params.append('exam', exam);
      const res = await apiFetch(`/api/pyqs/years?${params.toString()}`);
      if (!res.ok) return [2024, 2023];
      return await res.json();
    } catch {
      return [2024, 2023];
    }
  },

  getPYQMetadata: async (): Promise<{
    exams: string[];
    years: number[];
    stages: string[];
    papers: string[];
    papersList: PyqPaper[];
    totalQuestions: number;
    completenessSummary: {
      totalPapers: number;
      completePapers: number;
      incompletePapers: number;
    };
  }> => {
    try {
      const res = await apiFetch('/api/pyqs/metadata');
      if (!res.ok) throw new Error('Failed to fetch PYQ metadata');
      return await res.json();
    } catch {
      return {
        exams: ['All', 'UPSC CSE', 'BPSC'],
        years: [2024, 2023],
        stages: ['All Stages', 'Prelims'],
        papers: ['All Papers', 'GS Paper I', 'CSAT', 'General Studies'],
        papersList: [],
        totalQuestions: 660,
        completenessSummary: {
          totalPapers: 6,
          completePapers: 6,
          incompletePapers: 0,
        },
      };
    }
  },

  getPYQPapers: async (filters?: { exam?: string; year?: number | string; stage?: string; paper?: string }): Promise<PyqPaper[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.exam && filters.exam !== 'All') params.append('exam', filters.exam);
      if (filters?.year && String(filters.year) !== 'All') params.append('year', String(filters.year));
      if (filters?.stage && filters.stage !== 'All Stages') params.append('stage', filters.stage);
      if (filters?.paper && filters.paper !== 'All Papers') params.append('paper', filters.paper);

      const res = await apiFetch(`/api/pyqs/papers?${params.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  validatePYQPaper: async (paperId: string): Promise<PyqCompletenessValidation | null> => {
    try {
      const res = await apiFetch(`/api/pyqs/validate/${paperId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getPYQs: async (filters?: {
    exam?: string;
    year?: number | string;
    stage?: string;
    paper?: string;
    paperId?: string;
    subjectId?: string;
    topicId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Question[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
    paper?: PyqPaper;
    validation?: PyqCompletenessValidation;
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.paperId) params.append('paperId', filters.paperId);
      if (filters?.exam && filters.exam !== 'All') params.append('exam', filters.exam);
      if (filters?.year && String(filters.year) !== 'All') params.append('year', String(filters.year));
      if (filters?.stage && filters.stage !== 'All Stages') params.append('stage', filters.stage);
      if (filters?.paper && filters.paper !== 'All Papers') params.append('paper', filters.paper);
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);
      if (filters?.topicId) params.append('topicId', filters.topicId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/pyqs?${params.toString()}`);
      if (!res.ok) {
        return {
          items: [],
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasMore: false
        };
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          page: 1,
          limit: data.length,
          totalCount: data.length,
          totalPages: 1,
          hasMore: false
        };
      }
      return {
        items: data.items || data.questions || [],
        page: Number(data.page) || 1,
        limit: Number(data.limit) || 20,
        totalCount: Number(data.totalCount) || 0,
        totalPages: Number(data.totalPages) || 1,
        hasMore: !!data.hasMore,
        paper: data.paper,
        validation: data.validation
      };
    } catch {
      return {
        items: [],
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasMore: false
      };
    }
  },

  getPYQPaperById: async (paperId: string): Promise<PyqPaper | null> => {
    try {
      const res = await apiFetch(`/api/pyqs/papers/${paperId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getPYQPaperQuestions: async (paperId: string): Promise<{ paper: PyqPaper | null; questions: Question[]; totalQuestions: number }> => {
    try {
      const res = await apiFetch(`/api/pyqs/papers/${paperId}/questions`);
      if (!res.ok) return { paper: null, questions: [], totalQuestions: 0 };
      return await res.json();
    } catch {
      return { paper: null, questions: [], totalQuestions: 0 };
    }
  },

  getPYQArchive: async (): Promise<PyqArchiveData> => {
    try {
      const res = await apiFetch('/api/pyqs/archive');
      if (!res.ok) throw new Error('Failed to fetch PYQ archive');
      return await res.json();
    } catch {
      return {
        exams: ['UPSC CSE', 'BPSC'],
        papers: [],
        cyclesByExam: {},
        yearsByExam: {},
        totalPapers: 0,
        totalVerifiedQuestions: 0,
        totalExpectedQuestions: 0,
      };
    }
  },

  getRandomPYQ: async (filters?: { exam?: string; year?: number | string; paper?: string; subjectId?: string }): Promise<Question | null> => {
    try {
      const params = new URLSearchParams();
      if (filters?.exam && filters.exam !== 'All') params.append('exam', filters.exam);
      if (filters?.year && String(filters.year) !== 'All') params.append('year', String(filters.year));
      if (filters?.paper && filters.paper !== 'All Papers') params.append('paper', filters.paper);
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);

      const res = await apiFetch(`/api/pyqs/random?${params.toString()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getPYQAudit: async (): Promise<{ reports: PyqAuditReport[]; summary: any }> => {
    try {
      const res = await apiFetch('/api/pyqs/audit');
      if (!res.ok) throw new Error('Failed to fetch audit report');
      return await res.json();
    } catch {
      return { reports: [], summary: { totalPapers: 0, completeVerifiedPapers: 0, totalExpectedQuestions: 0, totalExtractedQuestions: 0, totalVerifiedQuestions: 0, overallVerificationRate: 0 } };
    }
  },

  runPYQDiscovery: async (): Promise<{ success: boolean; message: string; summary?: any; archive: PyqArchiveData }> => {
    const res = await apiFetch('/api/pyqs/discovery/run', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  getPYQIngestionStatus: async (): Promise<any> => {
    try {
      const res = await apiFetch('/api/admin/pyq/ingestion/status', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  triggerPYQIngestionScan: async (commission: 'UPSC' | 'BPSC' | 'ALL' = 'ALL'): Promise<any> => {
    const res = await apiFetch('/api/admin/pyq/ingestion/scan', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ commission }),
    });
    return await res.json();
  },

  simulatePYQFutureIngestion: async (examType: 'UPSC_2027_GS1' | 'BPSC_72ND_CCE' | 'UPSC_2027_CSAT' = 'UPSC_2027_GS1'): Promise<any> => {
    const res = await apiFetch('/api/admin/pyq/ingestion/simulate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ examType }),
    });
    return await res.json();
  },

  getPYQIngestionRuns: async (limit = 10): Promise<any[]> => {
    try {
      const res = await apiFetch(`/api/admin/pyq/ingestion/runs?limit=${limit}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  getResources: async (filters?: {
    subject?: string;
    exam?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ resources: LearningResource[]; total: number; page: number; totalPages: number }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/resources?${params.toString()}`);
      if (!res.ok) return { resources: [], total: 0, page: 1, totalPages: 1 };
      const data = await res.json();
      if (Array.isArray(data)) {
        return { resources: data, total: data.length, page: 1, totalPages: 1 };
      }
      return {
        resources: Array.isArray(data?.resources) ? data.resources : [],
        total: Number(data?.total || 0),
        page: Number(data?.page || 1),
        totalPages: Number(data?.totalPages || 1),
      };
    } catch {
      return { resources: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  getAdminResources: async (filters?: {
    status?: string;
    subject?: string;
    exam?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ resources: LearningResource[]; total: number; page: number; totalPages: number }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/admin/resources?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return { resources: [], total: 0, page: 1, totalPages: 1 };
      const data = await res.json();
      return {
        resources: Array.isArray(data?.resources) ? data.resources : [],
        total: Number(data?.total || 0),
        page: Number(data?.page || 1),
        totalPages: Number(data?.totalPages || 1),
      };
    } catch {
      return { resources: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  uploadResource: async (payload: {
    pdfBase64: string;
    fileName: string;
    title: string;
    author?: string;
    description?: string;
    tags?: string[];
    resourceType: string;
    subject: string;
    topic?: string;
    exam: string;
    visibility: string;
    autoPublish?: boolean;
  }) => {
    const res = await apiFetch('/api/admin/resources/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload resource');
    }
    return res.json();
  },

  updateResource: async (id: string, updates: Partial<LearningResource>) => {
    const res = await apiFetch(`/api/admin/resources/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(err.error || 'Failed to update resource');
    }
    return res.json();
  },

  deleteResource: async (id: string) => {
    const res = await apiFetch(`/api/admin/resources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(err.error || 'Failed to delete resource');
    }
    return res.json();
  },

  // Google Drive Admin Integration
  getDriveStatus: async (): Promise<{ connected: boolean; accountEmail?: string; folders?: any; lastSync?: string }> => {
    try {
      const res = await apiFetch('/api/admin/drive/status', { headers: getAuthHeaders() });
      if (!res.ok) return { connected: false };
      return res.json();
    } catch {
      return { connected: false };
    }
  },

  disconnectDrive: async () => {
    const res = await apiFetch('/api/admin/drive/disconnect', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  ensureDriveFolders: async () => {
    const res = await apiFetch('/api/admin/drive/ensure-folders', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
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

  getAdminQuestions: async (params?: {
    subjectId?: string;
    topicId?: string;
    conceptId?: string;
    difficulty?: string;
    status?: string;
    examTag?: string;
    searchQuery?: string;
    sourceType?: string;
    isPyq?: boolean;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Question[]; total: number }> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.subjectId) searchParams.append('subjectId', params.subjectId);
      if (params?.topicId) searchParams.append('topicId', params.topicId);
      if (params?.conceptId) searchParams.append('conceptId', params.conceptId);
      if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.examTag) searchParams.append('examTag', params.examTag);
      if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery);
      if (params?.sourceType) searchParams.append('sourceType', params.sourceType);
      if (params?.isPyq !== undefined) searchParams.append('isPyq', String(params.isPyq));
      if (params?.isPublished !== undefined) searchParams.append('isPublished', String(params.isPublished));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      if (params?.offset) searchParams.append('offset', String(params.offset));

      const res = await apiFetch(`/api/admin/questions?${searchParams.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return { items: [], total: 0 };
      const data = await res.json();
      return {
        items: Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []),
        total: Number(data?.total) || 0,
      };
    } catch {
      return { items: [], total: 0 };
    }
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
  validateOcrPdf: async (data: { pdfBase64?: string; rawText?: string }) => {
    const res = await apiFetch('/api/admin/ocr/validate-pdf', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  processOcrImport: async (data: any) => {
    const res = await apiFetch('/api/admin/ocr/import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getOcrJobs: async () => {
    try {
      const res = await apiFetch('/api/admin/ocr/imports', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
    } catch {
      return [];
    }
  },

  getOcrJobDetails: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/import/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  updateOcrQuestion: async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/ocr/question/${id}`, {
      method: 'PATCH',
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

  parseOcrAnswerKey: async (jobId: string, answerTextRaw: string) => {
    const res = await apiFetch(`/api/admin/ocr/import/${jobId}/parse-answer-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answerTextRaw }),
    });
    return res.json();
  },

  publishOcrJobToPyq: async (jobId: string, overrideMeta?: any) => {
    const res = await apiFetch(`/api/admin/ocr/import/${jobId}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ overrideMeta }),
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

  updateAdminPermissions: async (adminId: string, permissions: string[]) => {
    const res = await apiFetch(`/api/superadmin/admins/${adminId}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) throw new Error('Failed to update admin permissions');
    return res.json();
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    const res = await apiFetch(`/api/superadmin/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return res.json();
  },

  toggleUserSuspension: async (userId: string, suspend?: boolean) => {
    const res = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ suspend }),
    });
    if (!res.ok) throw new Error('Failed to toggle user status');
    return res.json();
  },

  getMyPermissions: async () => {
    try {
      const res = await apiFetch('/api/admin/my-permissions', { headers: getAuthHeaders() });
      if (!res.ok) return { role: 'USER', permissions: [], isSuperAdmin: false };
      return res.json();
    } catch {
      return { role: 'USER', permissions: [], isSuperAdmin: false };
    }
  },

  getAdminManagedUsers: async (): Promise<ManagedUser[]> => {
    try {
      const res = await apiFetch('/api/admin/users', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getAdminUserDetail: async (userId: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user details');
    return res.json();
  },

  // Courses & Pricing
  getCourses: async (filter?: { exam?: string; activeOnly?: boolean }): Promise<Course[]> => {
    try {
      const params = new URLSearchParams();
      if (filter?.exam) params.append('exam', filter.exam);
      if (filter?.activeOnly) params.append('activeOnly', 'true');
      const res = await apiFetch(`/api/admin/courses?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  createCourse: async (courseData: any): Promise<Course> => {
    const res = await apiFetch('/api/admin/courses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create course');
    }
    return res.json();
  },

  updateCourse: async (id: string, courseData: Partial<Course>): Promise<Course> => {
    const res = await apiFetch(`/api/admin/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update course');
    }
    return res.json();
  },

  archiveCourse: async (id: string) => {
    const res = await apiFetch(`/api/admin/courses/${id}/archive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to archive course');
    return res.json();
  },

  setCoursePrice: async (courseId: string, priceData: { basePrice: number; salePrice?: number | null; currency?: string; validFrom?: string; validUntil?: string }): Promise<CoursePrice> => {
    const res = await apiFetch(`/api/admin/courses/${courseId}/price`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(priceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to set course price');
    }
    return res.json();
  },

  // Entitlements
  getAdminEntitlements: async (filter?: { status?: string; courseId?: string; userId?: string }): Promise<Entitlement[]> => {
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.courseId) params.append('courseId', filter.courseId);
      if (filter?.userId) params.append('userId', filter.userId);
      const res = await apiFetch(`/api/admin/entitlements?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  grantEntitlement: async (data: { userId: string; courseId: string; durationDays?: number; source?: string; notes?: string; startDate?: string }): Promise<Entitlement> => {
    const res = await apiFetch('/api/admin/entitlements/grant', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to grant entitlement');
    }
    return res.json();
  },

  extendEntitlement: async (entitlementId: string, additionalDays: number, notes?: string): Promise<Entitlement> => {
    const res = await apiFetch(`/api/admin/entitlements/${entitlementId}/extend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ additionalDays, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to extend entitlement');
    }
    return res.json();
  },

  revokeEntitlement: async (entitlementId: string, reason?: string): Promise<Entitlement> => {
    const res = await apiFetch(`/api/admin/entitlements/${entitlementId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke entitlement');
    }
    return res.json();
  },

  // Learner side course catalog & features
  getCourseCatalog: async (exam?: string): Promise<Course[]> => {
    try {
      const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
      const res = await apiFetch(`/api/courses/catalog${q}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  getLearnerEntitlements: async (): Promise<Entitlement[]> => {
    try {
      const res = await apiFetch('/api/learner/entitlements', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  getLearnerFeatures: async (): Promise<{ role: string; isAllUnlocked: boolean; features: string[] }> => {
    try {
      const res = await apiFetch('/api/learner/features', { headers: getAuthHeaders() });
      if (!res.ok) return { role: 'USER', isAllUnlocked: false, features: [] };
      return res.json();
    } catch {
      return { role: 'USER', isAllUnlocked: false, features: [] };
    }
  },

  checkFeatureAccess: async (featureCode: string): Promise<{ hasAccess: boolean; role?: string; entitlement?: any }> => {
    try {
      const res = await apiFetch(`/api/learner/feature-check/${encodeURIComponent(featureCode)}`, { headers: getAuthHeaders() });
      if (!res.ok) return { hasAccess: false };
      return res.json();
    } catch {
      return { hasAccess: false };
    }
  },

  // Payments & Checkout Architecture
  getPaymentConfig: async (): Promise<{
    provider: string;
    isConfigured: boolean;
    mode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
    keyId: string | null;
    webhookConfigured: boolean;
  }> => {
    try {
      const res = await apiFetch('/api/payments/config');
      if (!res.ok) return { provider: 'RAZORPAY', isConfigured: false, mode: 'NOT_CONFIGURED', keyId: null, webhookConfigured: false };
      return res.json();
    } catch {
      return { provider: 'RAZORPAY', isConfigured: false, mode: 'NOT_CONFIGURED', keyId: null, webhookConfigured: false };
    }
  },

  createPaymentOrder: async (courseId: string, couponCode?: string): Promise<{
    orderId: string;
    provider: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    appliedCoupon?: {
      code: string;
      discountAmount: number;
      originalAmount: number;
      finalAmount: number;
    } | null;
    course: { id: string; name: string; exam: string; defaultDurationDays: number };
  }> => {
    const res = await apiFetch('/api/payments/create-order', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ courseId, couponCode: couponCode?.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to create payment order') as any;
      err.code = data.code;
      throw err;
    }
    return data;
  },

  verifyPayment: async (params: {
    orderId: string;
    providerPaymentId: string;
    providerOrderId: string;
    signature: string;
  }): Promise<{
    success: boolean;
    paymentId: string;
    orderId: string;
    status: string;
    courseId: string;
    courseName?: string;
    expiresAt?: string;
    alreadyVerified?: boolean;
  }> => {
    const res = await apiFetch('/api/payments/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Payment signature verification failed');
    }
    return data;
  },

  getLearnerPurchases: async (): Promise<any[]> => {
    try {
      const res = await apiFetch('/api/learner/purchases', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  getAdminPayments: async (filters?: {
    status?: string;
    courseId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: any[];
    total: number;
    metrics: {
      totalRevenue: number;
      paidCount: number;
      pendingCount: number;
      refundedCount: number;
      failedCount: number;
    };
    gatewayStatus: {
      provider: string;
      isConfigured: boolean;
      mode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
      keyId: string | null;
      webhookConfigured: boolean;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.courseId && filters.courseId !== 'ALL') params.append('courseId', filters.courseId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/admin/payments${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      let errMsg = 'Failed to fetch admin payments';
      try {
        const errorData = await res.json();
        if (errorData && errorData.error) {
          errMsg = errorData.error;
        }
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  refundPayment: async (paymentId: string, reason?: string, amount?: number): Promise<{ success: boolean; message: string; refundResult?: any }> => {
    const res = await apiFetch(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, amount }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to refund payment') as any;
      err.code = data.code;
      throw err;
    }
    return data;
  },

  // Coupons & Offers Management
  validateCoupon: async (code: string, courseId: string): Promise<{
    isValid: boolean;
    error?: string;
    coupon?: Coupon;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  }> => {
    const res = await apiFetch('/api/coupons/validate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, courseId }),
    });
    return res.json();
  },

  getAdminCoupons: async (filter?: { activeOnly?: boolean; courseId?: string; search?: string }): Promise<Coupon[]> => {
    try {
      const params = new URLSearchParams();
      if (filter?.activeOnly !== undefined) params.append('activeOnly', String(filter.activeOnly));
      if (filter?.courseId) params.append('courseId', filter.courseId);
      if (filter?.search) params.append('search', filter.search);
      const res = await apiFetch(`/api/admin/coupons?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  createCoupon: async (couponData: Partial<Coupon>): Promise<Coupon> => {
    const res = await apiFetch('/api/admin/coupons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(couponData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create coupon');
    }
    return res.json();
  },

  updateCoupon: async (id: string, updates: Partial<Coupon>): Promise<Coupon> => {
    const res = await apiFetch(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update coupon');
    }
    return res.json();
  },

  deleteCoupon: async (id: string): Promise<{ success: boolean; archived: boolean; message: string }> => {
    const res = await apiFetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete coupon');
    }
    return res.json();
  },

  // Commercial & Revenue Analytics
  getCommercialMetrics: async (): Promise<CommercialDashboardMetrics> => {
    const res = await apiFetch('/api/admin/commercial/metrics', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch commercial metrics');
    }
    return res.json();
  },

  getRevenueAnalytics: async (timeRange = '30days', customStart?: string, customEnd?: string): Promise<RevenueAnalyticsMetrics> => {
    const params = new URLSearchParams({ timeRange });
    if (customStart) params.append('customStart', customStart);
    if (customEnd) params.append('customEnd', customEnd);
    const res = await apiFetch(`/api/admin/revenue/analytics?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch revenue analytics');
    }
    return res.json();
  },

  getCourseSalesAnalytics: async (timeRange = '30days', customStart?: string, customEnd?: string): Promise<CourseSalesAnalytics[]> => {
    const params = new URLSearchParams({ timeRange });
    if (customStart) params.append('customStart', customStart);
    if (customEnd) params.append('customEnd', customEnd);
    const res = await apiFetch(`/api/admin/revenue/course-sales?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch course sales analytics');
    }
    return res.json();
  },
};


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
  ShortNote,
  ShortNotesHierarchyResponse,
  TestSeries,
  TestSeriesTest,
  TestSeriesWithTests,
  AppRelease,
  AppVersionResponse,
} from '../types/index.js';

export const PRODUCTION_API_URL = 'https://ikshoviacse.onrender.com';

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
    if (win.Capacitor.platform === 'android' || win.Capacitor.platform === 'ios') {
      return true;
    }
  }

  // 2. Protocol check for native app WebView (e.g. capacitor://localhost or file:)
  const protocol = window.location.protocol;
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') {
    return true;
  }

  // 3. In Capacitor Android APK, the origin is https://localhost (with androidScheme: https)
  // Check if running in an Android device on localhost
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isAndroid && isLocalhost) {
    return true;
  }

  // In Capacitor Android with androidScheme: "https", window.location.origin is "https://localhost"
  if (window.location.origin === 'https://localhost' && (!window.location.port || window.location.port === '443')) {
    return true;
  }

  return false;
}

/**
 * Resolves the appropriate API base URL dynamically:
 * - If running inside Capacitor Android native APK, strictly uses production backend.
 * - If VITE_API_BASE_URL is explicitly set, uses it.
 * - If runtime config (window.IKSHOVIA_CONFIG.API_URL) is set, uses it.
 * - Otherwise (local development & web production), uses relative URL / same origin.
 */
export function getApiBaseUrl(): string {
  // CRITICAL: Android native app MUST always target the canonical production server
  if (isCapacitorNative()) {
    return PRODUCTION_API_URL;
  }

  const meta = import.meta as any;
  const envUrl = (meta?.env?.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const configUrl = (window as any).IKSHOVIA_CONFIG?.API_URL;
    if (configUrl && typeof configUrl === 'string' && configUrl.trim()) {
      return configUrl.trim().replace(/\/+$/, '');
    }

    const storedUrl = localStorage.getItem('ikshovia_api_url');
    if (storedUrl && storedUrl.trim()) {
      const clean = storedUrl.trim().replace(/\/+$/, '');
      if (!clean.includes('ikshoviav3') && !clean.includes('localhost')) {
        return clean;
      }
      localStorage.removeItem('ikshovia_api_url');
    }
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

// Global circuit-breaker for upstream 402 Payment Required / Egress restriction
let isEgressRestricted = false;
let last402NoticeTime = 0;

export function isQuotaRestricted(): boolean {
  return isEgressRestricted;
}

export function resetQuotaRestriction(): void {
  isEgressRestricted = false;
}

/**
 * Centralized fetch wrapper ensuring all requests target the resolved base URL.
 * Automatically halts infinite retries when encountering HTTP 402 (fair-use / quota restriction).
 */
export const apiFetch = async (endpoint: string, init?: RequestInit): Promise<Response> => {
  const primaryUrl = apiUrl(endpoint);

  const res = await fetch(primaryUrl, init);

  // If an API request returns text/html (e.g. Vite SPA router fallback on cold start or 404),
  // prevent "Unexpected token '<', <!doctype... is not valid JSON" errors by returning a clean JSON 404.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') && (endpoint.includes('/api/') || primaryUrl.includes('/api/'))) {
    return new Response(JSON.stringify({ error: `API route not found or server starting: ${endpoint}`, notFound: true }), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If HTTP 402 is returned, trip the circuit breaker to prevent storming upstream services
  if (res.status === 402) {
    const now = Date.now();
    isEgressRestricted = true;
    if (now - last402NoticeTime > 30000) {
      last402NoticeTime = now;
      console.warn('[Egress Protection] HTTP 402 detected on endpoint:', endpoint, '- Circuit breaker active.');
    }
  }

  return res;
};

/**
 * Helper to determine if an error represents a server cold-start / wake-up state.
 */
export function isBackendStartingError(err: any): boolean {
  if (!err) return false;
  if (err.code === 'BACKEND_STARTING' || err.stage === 'SERVICE_NOT_READY' || err.isBackendStarting) return true;
  const msg = (err.message || '').toLowerCase();
  const raw = (err.rawText || '').toLowerCase();
  return (
    msg.includes('please wait while your application starts') ||
    msg.includes('ocr server is starting') ||
    msg.includes('backend is starting') ||
    msg.includes('service is waking up') ||
    raw.includes('please wait while your application starts') ||
    raw.includes('service is starting') ||
    raw.includes('application starts')
  );
}

export interface BackendReadinessResult {
  ready: boolean;
  isStarting: boolean;
  elapsedMs: number;
  attempts: number;
  statusText?: string;
}

/**
 * Checks the lightweight /api/health endpoint with bounded exponential backoff
 * to detect and wait for Render cold-starts BEFORE uploading heavy payloads.
 * RETRIES ONLY the lightweight /api/health check, NEVER the main payload.
 */
export async function waitForBackendReadiness(options: {
  maxWaitMs?: number; // default: 75000 (75 seconds, within 60-90s window)
  initialDelayMs?: number; // default: 2000 (2 seconds)
  maxDelayMs?: number; // default: 8000 (8 seconds)
  onProgress?: (info: { attempt: number; elapsedMs: number; delayMs: number; message: string }) => void;
} = {}): Promise<BackendReadinessResult> {
  const {
    maxWaitMs = 75000,
    initialDelayMs = 2000,
    maxDelayMs = 8000,
    onProgress,
  } = options;

  const startTime = Date.now();
  let attempt = 0;
  let currentDelay = initialDelayMs;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    const elapsedMs = Date.now() - startTime;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await apiFetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
          const body = await res.json().catch(() => null);
          if (body && (body.status === 'ok' || body.app === 'IKSHOVIA')) {
            return {
              ready: true,
              isStarting: false,
              elapsedMs: Date.now() - startTime,
              attempts: attempt,
            };
          }
        }
      }
    } catch {
      // Ignore transient network errors during startup
    }

    const nextElapsed = Date.now() - startTime;
    if (nextElapsed >= maxWaitMs) {
      break;
    }

    const delayMs = Math.min(currentDelay, maxWaitMs - nextElapsed);
    const message = `OCR server is starting. Checking readiness (attempt #${attempt}, waiting ${Math.round(delayMs / 1000)}s)...`;

    if (onProgress) {
      onProgress({
        attempt,
        elapsedMs: nextElapsed,
        delayMs,
        message,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    currentDelay = Math.min(currentDelay * 2, maxDelayMs);
  }

  return {
    ready: false,
    isStarting: true,
    elapsedMs: Date.now() - startTime,
    attempts: attempt,
    statusText: 'OCR server is starting. Please try again in a moment. Your PDF was not submitted.',
  };
}

/**
 * Safe API response parser preventing syntax errors when HTML or non-JSON is returned by reverse proxies or server fallbacks.
 * Inspects response.ok, Content-Type, status codes, extracts HTML snippets, and preserves structured JSON errors.
 */
export async function parseSafeApiResponse<T = any>(res: Response, endpointLabel = 'API'): Promise<T> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    const rawText = await res.text().catch(() => '');
    const isHtml = /<!DOCTYPE|<html|<body|<head/i.test(rawText) || contentType.includes('text/html');

    // Detect Render cold-start / reverse-proxy startup HTML pages
    const isBackendStarting = /please wait while your application starts|application is starting|service is waking up|backend is starting/i.test(rawText);

    if (isBackendStarting) {
      const startErr: any = new Error('OCR server is starting. Please try again in a moment.');
      startErr.code = 'BACKEND_STARTING';
      startErr.stage = 'SERVICE_NOT_READY';
      startErr.status = res.status;
      startErr.statusText = res.statusText;
      startErr.isHtml = true;
      startErr.isBackendStarting = true;
      startErr.rawText = rawText;
      throw startErr;
    }

    let extractedDetail = '';
    if (isHtml) {
      const preMatch = rawText.match(/<pre[^>]*>([^<]+)<\/pre>/i);
      const h1Match = rawText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const titleMatch = rawText.match(/<title[^>]*>([^<]+)<\/title>/i);
      extractedDetail = preMatch?.[1] || h1Match?.[1] || titleMatch?.[1] || '';
      extractedDetail = extractedDetail.replace(/<[^>]+>/g, '').replace(/&[a-z0-9#]+;/gi, ' ').trim();
      if (extractedDetail.length > 150) {
        extractedDetail = extractedDetail.slice(0, 150) + '...';
      }
    } else if (rawText) {
      extractedDetail = rawText.slice(0, 150).trim();
    }

    // Secondary cold start detection from extracted snippet
    if (/wait while your application starts|service is waking up/i.test(extractedDetail)) {
      const startErr: any = new Error('OCR server is starting. Please try again in a moment.');
      startErr.code = 'BACKEND_STARTING';
      startErr.stage = 'SERVICE_NOT_READY';
      startErr.status = res.status;
      startErr.statusText = res.statusText;
      startErr.isHtml = isHtml;
      startErr.isBackendStarting = true;
      startErr.rawText = rawText;
      throw startErr;
    }

    const detailMsg = extractedDetail ? `: "${extractedDetail}"` : '';
    const statusText = res.statusText ? ` (${res.statusText})` : '';
    const errorMsg = isHtml
      ? `${endpointLabel} returned HTTP ${res.status}${statusText} with HTML page instead of JSON${detailMsg}. Please check backend server status and route.`
      : `${endpointLabel} returned HTTP ${res.status}${statusText} with unexpected Content-Type "${contentType || 'none'}"${detailMsg}.`;

    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.statusText = res.statusText;
    err.isHtml = isHtml;
    err.rawText = rawText;
    throw err;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (jsonParseErr: any) {
    throw new Error(`${endpointLabel} returned invalid JSON: ${jsonParseErr.message}`);
  }

  // If status is not 2xx, check if structured JSON response exists
  if (!res.ok) {
    // If backend returned a structured JSON payload with error info or success: false, return it so callers can inspect
    if (data && typeof data === 'object' && ('error' in data || 'success' in data || 'message' in data || 'diagnostics' in data)) {
      return data as T;
    }
    const errorText =
      data?.error ||
      data?.message ||
      data?.details ||
      `${endpointLabel} failed with HTTP ${res.status} (${res.statusText || 'Error'})`;
    const err: any = new Error(errorText);
    err.status = res.status;
    err.stage = data?.stage;
    err.details = data?.details;
    err.diagnostics = data?.diagnostics;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const getAuthHeaders = () => {
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

  changePassword: async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
    const res = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
    return data;
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

  getLearnerProgress: async (): Promise<Array<{
    conceptId: string;
    conceptTitle: string;
    subjectId: string;
    subjectName: string;
    topicName: string;
    overallMastery: number;
    accuracy: number;
    retention: number;
    attemptsCount: number;
    lastStudiedAt: string;
  }>> => {
    try {
      const res = await apiFetch('/api/learner/progress', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
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
  getPracticeQuestions: async (
    subjectId?: string,
    conceptId?: string,
    limit = 10,
    topicId?: string,
    shuffle = false
  ): Promise<Question[]> => {
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (conceptId) params.append('conceptId', conceptId);
      if (topicId) params.append('topicId', topicId);
      if (shuffle) params.append('shuffle', 'true');
      params.append('limit', String(limit));

      const res = await apiFetch(`/api/practice/questions?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : []);
    } catch {
      return [];
    }
  },

  getPracticePoolCount: async (subjectId?: string, topicId?: string, conceptId?: string): Promise<number> => {
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (topicId) params.append('topicId', topicId);
      if (conceptId) params.append('conceptId', conceptId);
      const res = await apiFetch(`/api/practice/pool-count?${params.toString()}`);
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data?.count === 'number' ? data.count : 0;
    } catch {
      return 0;
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
  askAITutor: async (
    userPromptOrPayload: string | { prompt: string; context?: any; conceptId?: string; quickAction?: string; userId?: string },
    conceptId?: string,
    quickAction?: string,
    userId?: string,
    context?: any
  ) => {
    const promptText = typeof userPromptOrPayload === 'string' ? userPromptOrPayload : userPromptOrPayload.prompt;
    const effConceptId = typeof userPromptOrPayload === 'string' ? conceptId : (userPromptOrPayload.conceptId || conceptId);
    const effQuickAction = typeof userPromptOrPayload === 'string' ? quickAction : (userPromptOrPayload.quickAction || quickAction);
    const effUserId = typeof userPromptOrPayload === 'string' ? userId : (userPromptOrPayload.userId || userId);
    const effContext = typeof userPromptOrPayload === 'string' ? context : (userPromptOrPayload.context || context);

    try {
      const res = await apiFetch('/api/v1/data/ai/tutor', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: promptText,
          userPrompt: promptText,
          conceptId: effConceptId,
          quickAction: effQuickAction,
          exam: effContext?.targetExam,
          subject: effContext?.subjectName,
          topic: effContext?.topicName || effContext?.conceptTitle,
          mode: effQuickAction || 'tutor',
          context: effContext,
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
      body: JSON.stringify({ userId: effUserId, userPrompt: promptText, conceptId: effConceptId, quickAction: effQuickAction, context: effContext }),
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

  updateMockTest: async (id: string, updates: {
    displayName?: string;
    title?: string;
    durationMinutes?: number;
    totalMarks?: number;
    negativeMarkingRate?: number;
    instructions?: string;
    isPublished?: boolean;
    type?: 'FULL' | 'SUBJECT' | 'QUICK';
    subjectIds?: string[];
  }): Promise<{ success: boolean; test: MockTest }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update mock test');
    return data;
  },

  getAdminMockTestQuestions: async (mockTestId: string): Promise<Question[]> => {
    const res = await apiFetch(`/api/admin/mock-tests/${mockTestId}/questions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch mock test questions');
    const data = await res.json();
    return Array.isArray(data.questions) ? data.questions : [];
  },

  updateAdminQuestion: async (mockTestId: string, questionId: string, updates: any): Promise<{ success: boolean; question: Question; revision?: any }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${mockTestId}/questions/${questionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update question');
    return data;
  },

  addAdminQuestionToMockTest: async (mockTestId: string, questionId: string, orderNum?: number): Promise<{ success: boolean }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${mockTestId}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questionId, orderNum }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add question to mock test');
    return data;
  },

  removeAdminQuestionFromMockTest: async (mockTestId: string, questionId: string): Promise<{ success: boolean }> => {
    const res = await apiFetch(`/api/admin/mock-tests/${mockTestId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove question from mock test');
    return data;
  },

  getMockQuestionRevisions: async (questionId: string): Promise<any[]> => {
    const res = await apiFetch(`/api/admin/questions/${questionId}/revisions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.revisions) ? data.revisions : [];
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

  startMockAttempt: async (mockTestId: string, forceNew = false): Promise<{ attempt: MockAttempt; test: MockTest; questions: Question[]; answers?: any[] }> => {
    const res = await apiFetch(`/api/mock-tests/${mockTestId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ forceNew }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const err: any = new Error(errData.message || errData.error || 'Failed to start mock test attempt');
      err.status = res.status;
      err.code = errData.error;
      err.testSeries = errData.testSeries;
      throw err;
    }
    const data = await res.json();
    return {
      attempt: data.attempt,
      test: data.test,
      questions: Array.isArray(data.questions) ? data.questions : [],
      answers: Array.isArray(data.answers) ? data.answers : [],
    };
  },

  getMockAttempt: async (attemptId: string): Promise<{ success: boolean; attempt: MockAttempt; answers: any[]; test: MockTest; questions: Question[] }> => {
    const res = await apiFetch(`/api/mock-tests/attempts/${attemptId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load mock test attempt');
    return res.json();
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
    topic?: string;
    exam?: string;
    type?: string;
    search?: string;
    sort?: 'recent' | 'pages' | 'title' | 'progress';
    page?: number;
    limit?: number;
  }): Promise<{ resources: LearningResource[]; total: number; page: number; totalPages: number }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.topic) params.append('topic', filters.topic);
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await apiFetch(`/api/resources?${params.toString()}`, { headers: getAuthHeaders() });
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

  getResource: async (id: string): Promise<LearningResource | null> => {
    try {
      const res = await apiFetch(`/api/resources/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getResourceFiltersMeta: async (): Promise<{
    subjects: string[];
    topics: string[];
    resourceTypes: string[];
    exams: string[];
    tags: string[];
  }> => {
    try {
      const res = await apiFetch('/api/resources/filters/meta');
      if (!res.ok) throw new Error('Failed');
      return await res.json();
    } catch {
      return {
        subjects: ['Indian Polity', 'Modern History', 'Economy', 'Environment & Ecology', 'Bihar Special', 'General Studies'],
        topics: ['Fundamental Rights & Constitutional Governance', 'Indian National Movement (1857-1947)', 'Fiscal Policy, Monetary Framework & Economic Survey', 'Ecosystems, Protected Areas & Climate Treaties', 'History, Freedom Struggle & Geography of Bihar'],
        resourceTypes: ['BOOK', 'NOTES', 'SYLLABUS', 'PREVIOUS_YEAR_QUESTION', 'ARTICLE'],
        exams: ['UPSC CSE', 'BPSC', 'ALL'],
        tags: ['Prelims Core', 'Mains GS-I', 'Mains GS-II', 'Mains GS-III', 'Constitution', 'BPSC 71st', 'Syllabus'],
      };
    }
  },

  getContinueReading: async (limit = 8): Promise<LearningResource[]> => {
    try {
      const res = await apiFetch(`/api/resources/continue-reading?limit=${limit}`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.resources) ? data.resources : [];
    } catch {
      return [];
    }
  },

  getResourceBookmarks: async (page = 1, limit = 20): Promise<{ bookmarks: LearningResource[]; total: number; page: number; totalPages: number }> => {
    try {
      const res = await apiFetch(`/api/resources/bookmarks?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
      if (!res.ok) return { bookmarks: [], total: 0, page: 1, totalPages: 1 };
      const data = await res.json();
      return {
        bookmarks: Array.isArray(data?.bookmarks) ? data.bookmarks : [],
        total: Number(data?.total || 0),
        page: Number(data?.page || 1),
        totalPages: Number(data?.totalPages || 1),
      };
    } catch {
      return { bookmarks: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  toggleResourceBookmark: async (id: string, notes?: string): Promise<{ isBookmarked: boolean }> => {
    try {
      const res = await apiFetch(`/api/resources/${id}/bookmark`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) return { isBookmarked: false };
      const data = await res.json();
      return { isBookmarked: Boolean(data?.isBookmarked) };
    } catch {
      return { isBookmarked: false };
    }
  },

  saveResourceProgress: async (id: string, lastPage: number, totalPages?: number, progressPercentage?: number): Promise<any> => {
    try {
      const res = await apiFetch(`/api/resources/${id}/progress`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lastPage, totalPages, progressPercentage }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getResourceProgress: async (id: string): Promise<any> => {
    try {
      const res = await apiFetch(`/api/resources/${id}/progress`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.progress || null;
    } catch {
      return null;
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

  checkResourceDuplicate: async (payload: { title: string; author?: string; fileHash?: string }) => {
    try {
      const res = await apiFetch('/api/admin/resources/check-duplicate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { isDuplicate: false };
      return res.json();
    } catch {
      return { isDuplicate: false };
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
    subjectId?: string;
    subject: string;
    topic?: string;
    exam: string;
    visibility: string;
    autoPublish?: boolean;
    edition?: string;
    publicationYear?: number;
    publisher?: string;
    language?: string;
    isbn?: string;
    licenseStatus?: string;
    coverImageUrl?: string;
    sourceAttribution?: string;
    allowDuplicate?: boolean;
  }) => {
    const res = await apiFetch('/api/admin/resources/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 409) {
      const duplicateData = await res.json().catch(() => ({}));
      const err: any = new Error(duplicateData.message || 'A similar book already exists.');
      err.code = 'DUPLICATE_DETECTED';
      err.existing = duplicateData.existing;
      throw err;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload resource');
    }
    return res.json();
  },

  getResourceReview: async (id: string) => {
    const res = await apiFetch(`/api/admin/resources/${id}/review`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch review details' }));
      throw new Error(err.error || 'Failed to fetch review details');
    }
    return res.json();
  },

  reprocessResource: async (id: string) => {
    const res = await apiFetch(`/api/admin/resources/${id}/reprocess`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Reprocess failed' }));
      throw new Error(err.error || 'Failed to reprocess resource');
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

  // Personalized Study Planner & Intelligence
  getStudyPlan: async (): Promise<any> => {
    try {
      const res = await apiFetch('/api/study-planner/current', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  setupStudyPlan: async (planData: any): Promise<any> => {
    const res = await apiFetch('/api/study-planner/setup', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    if (!res.ok) {
      throw new Error(`Failed to configure study plan: ${res.status}`);
    }
    return res.json();
  },

  updateStudyPlanTask: async (taskId: string, status: string): Promise<any> => {
    const res = await apiFetch(`/api/study-planner/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update task status: ${res.status}`);
    }
    return res.json();
  },

  recordRevisionOutcome: async (conceptId: string, responseQuality: string): Promise<any> => {
    const res = await apiFetch('/api/study-planner/revision-outcome', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conceptId, responseQuality }),
    });
    if (!res.ok) {
      throw new Error(`Failed to record revision outcome: ${res.status}`);
    }
    return res.json();
  },

  getMistakeNotebook: async (): Promise<any[]> => {
    try {
      const res = await apiFetch('/api/study-planner/mistake-notebook', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  // Notifications
  getNotifications: async (optionsOrUserId?: string | { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (typeof optionsOrUserId === 'object' && optionsOrUserId !== null) {
        if (optionsOrUserId.limit) params.append('limit', String(optionsOrUserId.limit));
        if (optionsOrUserId.offset) params.append('offset', String(optionsOrUserId.offset));
        if (optionsOrUserId.unreadOnly) params.append('unreadOnly', 'true');
      }
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/notifications${q}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const fallback: any = [];
        fallback.notifications = [];
        fallback.unreadCount = 0;
        fallback.totalCount = 0;
        return fallback;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.notifications) ? data.notifications : []);
      const result: any = [...list];
      result.notifications = list;
      result.unreadCount = data?.unreadCount ?? list.filter((n: any) => !n.isRead).length;
      result.totalCount = data?.totalCount ?? list.length;
      return result;
    } catch {
      const fallback: any = [];
      fallback.notifications = [];
      fallback.unreadCount = 0;
      fallback.totalCount = 0;
      return fallback;
    }
  },

  // Global Search
  searchGlobal: async (query: string) => {
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return { subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [], pyqPapers: [], books: [], shortNotes: [], syllabus: [], mockTests: [] };
      const data = await res.json();
      return {
        subjects: Array.isArray(data?.subjects) ? data.subjects : [],
        concepts: Array.isArray(data?.concepts) ? data.concepts : [],
        questions: Array.isArray(data?.questions) ? data.questions : [],
        currentAffairs: Array.isArray(data?.currentAffairs) ? data.currentAffairs : [],
        resources: Array.isArray(data?.resources) ? data.resources : [],
        pyqPapers: Array.isArray(data?.pyqPapers) ? data.pyqPapers : [],
        books: Array.isArray(data?.books) ? data.books : [],
        shortNotes: Array.isArray(data?.shortNotes) ? data.shortNotes : [],
        syllabus: Array.isArray(data?.syllabus) ? data.syllabus : [],
        mockTests: Array.isArray(data?.mockTests) ? data.mockTests : [],
      };
    } catch {
      return { subjects: [], concepts: [], questions: [], currentAffairs: [], resources: [], pyqPapers: [], books: [], shortNotes: [], syllabus: [], mockTests: [] };
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
    const fallbackMetrics = {
      totalUsers: 6,
      activeUsers24h: 5,
      totalSubjects: 11,
      totalTopics: 51,
      totalConcepts: 25,
      totalQuestions: 5729,
      totalMockTests: 18,
      totalCurrentAffairs: 5672,
      totalResources: 24,
      totalAiDrafts: 0,
      totalOcrJobs: 85,
    };

    try {
      let res: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await apiFetch('/api/admin/metrics', { headers: getAuthHeaders() });
          if (res && res.ok) break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
        }
      }

      if (!res || !res.ok) {
        return fallbackMetrics;
      }

      const data = await res.json().catch(() => null);
      if (data && typeof data === 'object' && !data.error) {
        return data;
      }
      return fallbackMetrics;
    } catch {
      return fallbackMetrics;
    }
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
    return parseSafeApiResponse(res, 'OCR PDF Validation API');
  },

  processOcrImport: async (data: any) => {
    const idempotencyKey = data.idempotencyKey || `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      'x-idempotency-key': idempotencyKey,
    };
    const res = await apiFetch('/api/admin/ocr/import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, idempotencyKey }),
    });
    return parseSafeApiResponse(res, 'OCR Import Extraction API');
  },

  getOcrJobs: async () => {
    try {
      const res = await apiFetch('/api/admin/ocr/imports', { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await parseSafeApiResponse(res, 'OCR Jobs List API');
      return Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
    } catch {
      return [];
    }
  },

  getOcrJobDetails: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/import/${id}`, { headers: getAuthHeaders() });
    return parseSafeApiResponse(res, 'OCR Job Details API');
  },

  getOcrJobStatus: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/jobs/${id}/status`, { headers: getAuthHeaders() });
    return parseSafeApiResponse(res, 'OCR Job Status API');
  },

  updateOcrQuestion: async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/ocr/question/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseSafeApiResponse(res, 'OCR Question Update API');
  },

  approveOcrQuestion: async (id: string, data?: any) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    return parseSafeApiResponse(res, 'OCR Question Approve API');
  },

  rejectOcrQuestion: async (id: string) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'OCR Question Reject API');
  },

  parseOcrAnswerKey: async (jobId: string, answerTextRaw: string) => {
    const res = await apiFetch(`/api/admin/ocr/import/${jobId}/parse-answer-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answerTextRaw }),
    });
    return parseSafeApiResponse(res, 'OCR Answer Key Parse API');
  },

  publishOcrJobToPyq: async (jobId: string, overrideMeta?: any) => {
    const res = await apiFetch(`/api/admin/ocr/import/${jobId}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ overrideMeta }),
    });
    return parseSafeApiResponse(res, 'OCR Publish API');
  },

  bulkActionOcrQuestions: async (data: any) => {
    const res = await apiFetch('/api/admin/ocr/questions/bulk-action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return parseSafeApiResponse(res, 'OCR Bulk Action API');
  },

  getOcrJobCompleteness: async (jobId: string) => {
    const res = await apiFetch(`/api/admin/ocr/jobs/${jobId}/completeness`, {
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'OCR Job Completeness API');
  },

  getOcrJobReview: async (jobId: string) => {
    const res = await apiFetch(`/api/admin/ocr/jobs/${jobId}/review`, {
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'OCR Job Review API');
  },

  addMissingQuestionToOcrJob: async (jobId: string, questionData: any) => {
    const res = await apiFetch(`/api/admin/ocr/jobs/${jobId}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    });
    return parseSafeApiResponse(res, 'OCR Add Question API');
  },

  correctQuestion: async (questionId: string, correctionData: any) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${questionId}/correct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(correctionData),
    });
    return parseSafeApiResponse(res, 'OCR Question Correction API');
  },

  getQuestionRevisions: async (questionId: string) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${questionId}/revisions`, {
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'OCR Question Revisions API');
  },

  updateQuestionFigure: async (questionId: string, figureData: any) => {
    const res = await apiFetch(`/api/admin/ocr/questions/${questionId}/figure`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(figureData),
    });
    return parseSafeApiResponse(res, 'OCR Question Figure API');
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

  removeUser: async (userId: string, reason?: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}/remove`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove user account');
    }
    return res.json();
  },

  restoreUser: async (userId: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore user account');
    }
    return res.json();
  },

  permanentDeleteUser: async (userId: string, confirmationText: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}/permanent-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirmationText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to permanently delete user account');
    }
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

  createPaymentOrder: async (courseId?: string, couponCode?: string, testSeriesId?: string): Promise<{
    orderId: string;
    provider: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    productType?: 'COURSE' | 'TEST_SERIES';
    appliedCoupon?: {
      code: string;
      discountAmount: number;
      originalAmount: number;
      finalAmount: number;
    } | null;
    course?: { id: string; name: string; exam: string; defaultDurationDays: number } | null;
    testSeries?: { id: string; name: string; targetExam: string; durationDays: number } | null;
  }> => {
    const res = await apiFetch('/api/payments/create-order', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        courseId: courseId || undefined,
        testSeriesId: testSeriesId || undefined,
        couponCode: couponCode?.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to create payment order') as any;
      err.code = data.code;
      throw err;
    }
    return data;
  },

  createTestSeriesPaymentOrder: async (testSeriesId: string, couponCode?: string) => {
    return api.createPaymentOrder(undefined, couponCode, testSeriesId);
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
    productType?: string;
    courseId?: string;
    testSeriesId?: string;
    courseName?: string;
    productName?: string;
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
    environment?: string;
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
      testRevenue?: number;
      testPaidCount?: number;
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
    if (filters?.environment && filters.environment !== 'ALL') params.append('environment', filters.environment);
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

  purgeTestTransactions: async (): Promise<{
    success: boolean;
    message: string;
    purgedPaymentsCount: number;
    purgedOrdersCount: number;
    purgedEntitlementsCount: number;
  }> => {
    const res = await apiFetch('/api/admin/payments/purge-test-transactions', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to purge test payment data');
    }
    return data;
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
  validateCoupon: async (code: string, courseId?: string): Promise<{
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

  // ==========================================
  // SHORT NOTES APIs (LEARNER & ADMIN)
  // ==========================================

  getShortNotesHierarchy: async (exam = 'ALL'): Promise<ShortNotesHierarchyResponse> => {
    const res = await apiFetch(`/api/short-notes/hierarchy?exam=${encodeURIComponent(exam)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch short notes hierarchy');
    }
    return res.json();
  },

  getShortNotes: async (params?: {
    subject?: string;
    topic?: string;
    exam?: string;
    search?: string;
    onlyBookmarked?: boolean;
    onlyReviewed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ notes: ShortNote[]; total: number }> => {
    const sp = new URLSearchParams();
    if (params?.subject) sp.append('subject', params.subject);
    if (params?.topic) sp.append('topic', params.topic);
    if (params?.exam) sp.append('exam', params.exam);
    if (params?.search) sp.append('search', params.search);
    if (params?.onlyBookmarked) sp.append('onlyBookmarked', 'true');
    if (params?.onlyReviewed) sp.append('onlyReviewed', 'true');
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));

    const res = await apiFetch(`/api/short-notes?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch short notes');
    }
    return res.json();
  },

  getShortNoteById: async (id: string): Promise<{ success: boolean; shortNote: ShortNote }> => {
    const res = await apiFetch(`/api/short-notes/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch short note');
    }
    return res.json();
  },

  toggleShortNoteBookmark: async (id: string, blockId?: string): Promise<{ success: boolean; bookmarked: boolean }> => {
    const res = await apiFetch(`/api/short-notes/${encodeURIComponent(id)}/bookmark`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle bookmark');
    }
    return res.json();
  },

  updateShortNoteProgress: async (
    id: string,
    payload: { progressPercentage: number; isReviewed?: boolean; lastPage?: number; lastBlockId?: string }
  ): Promise<{ success: boolean; progressPercentage: number; isReviewed: boolean }> => {
    const res = await apiFetch(`/api/short-notes/${encodeURIComponent(id)}/progress`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update reading progress');
    }
    return res.json();
  },

  // Admin Short Notes APIs
  uploadShortNote: async (payload: {
    title: string;
    exam?: string;
    subject: string;
    topic: string;
    tags?: string[];
    description?: string;
    year?: number;
    language?: string;
    visibility?: string;
    fileBase64: string;
    fileName?: string;
    autoPublish?: boolean;
  }): Promise<any> => {
    const res = await apiFetch('/api/admin/short-notes/upload', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload and OCR short note');
    }
    return res.json();
  },

  getAdminShortNotes: async (params?: {
    subject?: string;
    topic?: string;
    exam?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; notes: ShortNote[]; total: number }> => {
    try {
      const sp = new URLSearchParams();
      if (params?.subject) sp.append('subject', params.subject);
      if (params?.topic) sp.append('topic', params.topic);
      if (params?.exam) sp.append('exam', params.exam);
      if (params?.status) sp.append('status', params.status);
      if (params?.search) sp.append('search', params.search);
      if (params?.limit) sp.append('limit', String(params.limit));
      if (params?.offset) sp.append('offset', String(params.offset));

      const res = await apiFetch(`/api/admin/short-notes?${sp.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return { success: false, notes: [], total: 0 };
      }
      return await parseSafeApiResponse<{ success: boolean; notes: ShortNote[]; total: number }>(res, 'Admin Short Notes');
    } catch {
      return { success: false, notes: [], total: 0 };
    }
  },

  getAdminShortNoteById: async (id: string): Promise<{ success: boolean; shortNote: ShortNote }> => {
    const res = await apiFetch(`/api/admin/short-notes/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'Admin Short Note By ID');
  },

  updateAdminShortNote: async (id: string, payload: any): Promise<{ success: boolean; shortNote: ShortNote }> => {
    const res = await apiFetch(`/api/admin/short-notes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseSafeApiResponse(res, 'Admin Update Short Note');
  },

  publishAdminShortNote: async (id: string): Promise<{ success: boolean; shortNote: ShortNote }> => {
    const res = await apiFetch(`/api/admin/short-notes/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'Admin Publish Short Note');
  },

  archiveAdminShortNote: async (id: string): Promise<{ success: boolean; shortNote: ShortNote }> => {
    const res = await apiFetch(`/api/admin/short-notes/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'Admin Archive Short Note');
  },

  deleteAdminShortNote: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiFetch(`/api/admin/short-notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseSafeApiResponse(res, 'Admin Delete Short Note');
  },

  // --------------------------------------------------------------------------
  // TEST SERIES MARKETPLACE & ADMIN TEST SERIES STUDIO
  // --------------------------------------------------------------------------

  getTestSeriesList: async (filters?: {
    exam?: string;
    cycle?: string;
    category?: string;
    isFree?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ series: TestSeries[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters?.exam && filters.exam !== 'ALL') params.append('exam', filters.exam);
    if (filters?.cycle && filters.cycle !== 'ALL') params.append('cycle', filters.cycle);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (typeof filters?.isFree === 'boolean') params.append('isFree', String(filters.isFree));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await apiFetch(`/api/test-series?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      return { series: [], total: 0, page: 1, totalPages: 1 };
    }
    return res.json();
  },

  getTestSeriesExamsSummary: async (): Promise<{ code: string; name: string; seriesCount: number }[]> => {
    try {
      const res = await apiFetch('/api/test-series/exams/summary');
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  getTestSeriesDetail: async (slugOrId: string): Promise<TestSeriesWithTests | null> => {
    try {
      const res = await apiFetch(`/api/test-series/${encodeURIComponent(slugOrId)}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  enrollFreeTestSeries: async (id: string): Promise<{ success: boolean; message: string; entitlement: any }> => {
    const res = await apiFetch(`/api/test-series/${encodeURIComponent(id)}/enroll-free`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to enroll');
    return data;
  },

  getAdminTestSeriesList: async (filters?: {
    status?: string;
    targetExam?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ series: TestSeries[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.targetExam && filters.targetExam !== 'ALL') params.append('targetExam', filters.targetExam);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await apiFetch(`/api/admin/test-series?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return { series: [], total: 0, page: 1, totalPages: 1 };
    return res.json();
  },

  getAdminTestSeriesDetail: async (id: string): Promise<TestSeriesWithTests | null> => {
    try {
      const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  createAdminTestSeries: async (payload: any): Promise<TestSeries> => {
    const res = await apiFetch('/api/admin/test-series', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create test series');
    return data;
  },

  updateAdminTestSeries: async (id: string, payload: any): Promise<TestSeries> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update test series');
    return data;
  },

  deleteAdminTestSeries: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  getAdminAvailableMockTestsForSeries: async (seriesId: string, search?: string): Promise<any[]> => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(seriesId)}/available-tests?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  adminLinkTestToSeries: async (seriesId: string, payload: { mockTestId: string; isFreePreview?: boolean; sequenceNumber?: number }): Promise<any> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(seriesId)}/tests`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link test to series');
    return data;
  },

  adminUpdateTestInSeries: async (seriesId: string, mockTestId: string, payload: { isFreePreview?: boolean; sequenceNumber?: number; status?: string }): Promise<any> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(mockTestId)}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update test in series');
    return data;
  },

  adminUnlinkTestFromSeries: async (seriesId: string, mockTestId: string): Promise<any> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(mockTestId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unlink test from series');
    return data;
  },

  adminReorderTestsInSeries: async (seriesId: string, testIdsInOrder: string[]): Promise<boolean> => {
    const res = await apiFetch(`/api/admin/test-series/${encodeURIComponent(seriesId)}/tests-reorder`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ testIdsInOrder }),
    });
    return res.ok;
  },

  // ----------------------------------------------------
  // APP RELEASES & IN-APP UPDATE CHECK APIS
  // ----------------------------------------------------
  getAppVersion: async (currentBuildNumber?: number, currentVersion?: string): Promise<AppVersionResponse | null> => {
    try {
      const params = new URLSearchParams();
      params.set('platform', 'android');
      if (currentBuildNumber !== undefined && currentBuildNumber !== null) {
        params.set('currentBuildNumber', String(currentBuildNumber));
      }
      if (currentVersion) {
        params.set('currentVersion', currentVersion);
      }
      params.set('_t', String(Date.now())); // Cache-busting parameter

      const res = await apiFetch(`/api/app/version?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('[getAppVersion Error]', err);
      return null;
    }
  },

  getAdminAppReleases: async (): Promise<AppRelease[]> => {
    try {
      const res = await apiFetch('/api/admin/app/releases', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.releases || [];
    } catch (err) {
      console.error('[getAdminAppReleases Error]', err);
      return [];
    }
  },

  createOrUpdateAppRelease: async (payload: Partial<AppRelease>): Promise<{ success: boolean; release?: AppRelease; error?: string }> => {
    try {
      const res = await apiFetch('/api/admin/app/releases', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save release' };
      }
      return { success: true, release: data.release };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  publishAppRelease: async (id: string): Promise<{ success: boolean; release?: AppRelease; error?: string }> => {
    try {
      const res = await apiFetch(`/api/admin/app/releases/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to publish release' };
      }
      return { success: true, release: data.release };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  archiveAppRelease: async (id: string): Promise<{ success: boolean; release?: AppRelease; error?: string }> => {
    try {
      const res = await apiFetch(`/api/admin/app/releases/${encodeURIComponent(id)}/archive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to archive release' };
      }
      return { success: true, release: data.release };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  rollbackAppRelease: async (id: string): Promise<{ success: boolean; release?: AppRelease; error?: string }> => {
    try {
      const res = await apiFetch(`/api/admin/app/releases/${encodeURIComponent(id)}/rollback`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to rollback release' };
      }
      return { success: true, release: data.release };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  deleteAppRelease: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch(`/api/admin/app/releases/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete release' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  inspectLocalServerApk: async (): Promise<{
    success: boolean;
    fileName?: string;
    fileSizeBytes?: number;
    fileSizeMb?: string;
    sha256Checksum?: string;
    suggestedApkUrl?: string;
    error?: string;
  }> => {
    try {
      const res = await apiFetch('/api/admin/app/releases/inspect-local', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to inspect local APK' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  getAppReleaseAuditLogs: async (): Promise<any[]> => {
    try {
      const res = await apiFetch('/api/admin/app/releases/audit', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.auditLogs || [];
    } catch {
      return [];
    }
  },

  // ==========================================
  // TEACHER WORKSPACE APIS
  // ==========================================
  getTeacherDashboardStats: async (): Promise<any> => {
    const res = await apiFetch('/api/teacher/dashboard-stats', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load teacher dashboard statistics');
    return res.json();
  },

  getTeacherClasses: async (): Promise<any[]> => {
    const res = await apiFetch('/api/teacher/classes', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getTeacherClassById: async (classId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load class details');
    return res.json();
  },

  createTeacherClass: async (data: any): Promise<any> => {
    const res = await apiFetch('/api/teacher/classes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create class');
    }
    return res.json();
  },

  updateTeacherClass: async (classId: string, data: any): Promise<any> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update class');
    }
    return res.json();
  },

  deleteTeacherClass: async (classId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete class');
    return res.json();
  },

  getTeacherClassStudents: async (classId: string): Promise<any[]> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}/students`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getClassStudents: async (classId: string): Promise<any[]> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}/students`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  addStudentToClass: async (classId: string, studentId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to enroll student');
    }
    return res.json();
  },

  removeStudentFromClass: async (classId: string, studentId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove student from class');
    return res.json();
  },

  getTeacherStudents: async (): Promise<any[]> => {
    const res = await apiFetch('/api/teacher/students', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getTeacherStudentDetail: async (studentId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/students/${studentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load student details');
    return res.json();
  },

  getTeacherAssignments: async (classId?: string): Promise<any[]> => {
    const url = classId ? `/api/teacher/assignments?classId=${encodeURIComponent(classId)}` : '/api/teacher/assignments';
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createTeacherAssignment: async (data: any): Promise<any> => {
    const res = await apiFetch('/api/teacher/assignments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create assignment');
    }
    return res.json();
  },

  updateTeacherAssignment: async (assignmentId: string, data: any): Promise<any> => {
    const res = await apiFetch(`/api/teacher/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update assignment');
    return res.json();
  },

  deleteTeacherAssignment: async (assignmentId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete assignment');
    return res.json();
  },

  getTeacherSubmissions: async (assignmentId?: string, status?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignmentId', assignmentId);
    if (status && status !== 'ALL') params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/teacher/submissions${query}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  evaluateTeacherSubmission: async (submissionId: string, data: any): Promise<any> => {
    const res = await apiFetch(`/api/teacher/submissions/${submissionId}/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save evaluation');
    }
    return res.json();
  },

  getTeacherQuizzes: async (): Promise<any[]> => {
    const res = await apiFetch('/api/teacher/quizzes', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createTeacherQuiz: async (data: any): Promise<any> => {
    const res = await apiFetch('/api/teacher/quizzes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create quiz');
    }
    return res.json();
  },

  getTeacherAnnouncements: async (classId?: string): Promise<any[]> => {
    const url = classId ? `/api/teacher/announcements?classId=${encodeURIComponent(classId)}` : '/api/teacher/announcements';
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createTeacherAnnouncement: async (data: any): Promise<any> => {
    const res = await apiFetch('/api/teacher/announcements', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post announcement');
    }
    return res.json();
  },

  deleteTeacherAnnouncement: async (announcementId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete announcement');
    return res.json();
  },

  getTeacherAnalytics: async (): Promise<any> => {
    const res = await apiFetch('/api/teacher/analytics', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load teacher analytics');
    return res.json();
  },

  // Learner-facing Class & Assignment APIs
  getLearnerClasses: async (): Promise<any[]> => {
    const res = await apiFetch('/api/learner/classes', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getLearnerAssignments: async (): Promise<any[]> => {
    const res = await apiFetch('/api/learner/assignments', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  submitLearnerAssignment: async (assignmentId: string, answers: any[]): Promise<any> => {
    const res = await apiFetch(`/api/learner/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit assignment');
    }
    return res.json();
  },

  getLearnerAnnouncements: async (): Promise<any[]> => {
    const res = await apiFetch('/api/learner/announcements', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // Candidate Dossier & Performance Aggregation
  getStudentDossier: async (studentId: string): Promise<any> => {
    const res = await apiFetch(`/api/teacher/students/${studentId}/dossier`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch candidate dossier');
    }
    return res.json();
  },

  getLearnerSelfDossier: async (): Promise<any> => {
    const res = await apiFetch('/api/student/dossier', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch learner dossier');
    }
    return res.json();
  },

  // Platform Analytics (Admin/Super Admin)
  getAdminPlatformAnalytics: async (): Promise<any> => {
    const res = await apiFetch('/api/admin/analytics/platform', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load platform analytics');
    }
    return res.json();
  },

  markNotificationRead: async (notificationId: string): Promise<boolean> => {
    const res = await apiFetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  markAllNotificationsRead: async (): Promise<boolean> => {
    const res = await apiFetch('/api/notifications/read-all', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  getNotificationPreferences: async (): Promise<any> => {
    const res = await apiFetch('/api/notifications/preferences', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  updateNotificationPreferences: async (preferences: any): Promise<any> => {
    const res = await apiFetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences),
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    return res.json();
  },

  registerDeviceToken: async (token: string, platform: 'android' | 'ios' | 'web' = 'android', appVersion?: string) => {
    const res = await apiFetch('/api/notifications/devices', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, platform, appVersion }),
    });
    return res.json();
  },

  deactivateDeviceToken: async (token: string) => {
    const res = await apiFetch('/api/notifications/devices/deactivate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  getRegisteredDevices: async () => {
    const res = await apiFetch('/api/notifications/devices', { headers: getAuthHeaders() });
    if (!res.ok) return { count: 0, devices: [] };
    return res.json();
  },

  getPushSubsystemStatus: async () => {
    const res = await apiFetch('/api/admin/push/status', { headers: getAuthHeaders() });
    return res.json();
  },

  // ----------------------------------------------------
  // UNIFIED PRELIMS + MAINS + INTERVIEW ENGINE APIs
  // ----------------------------------------------------
  getExams: async () => {
    const res = await apiFetch('/api/exams');
    if (!res.ok) return [];
    return res.json();
  },

  getPapers: async (examId?: string, stage?: string) => {
    const params = new URLSearchParams();
    if (examId) params.append('examId', examId);
    if (stage) params.append('stage', stage);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/exams/papers${qs}`);
    if (!res.ok) return [];
    return res.json();
  },

  getMainsQuestions: async (params?: { exam?: string; paper?: string; subjectId?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.exam) query.append('exam', params.exam);
    if (params?.paper) query.append('paper', params.paper);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/mains/questions${qs}`);
    if (!res.ok) return { questions: [], total: 0 };
    return res.json();
  },

  getMainsQuestionById: async (id: string) => {
    const res = await apiFetch(`/api/mains/questions/${id}`);
    if (!res.ok) throw new Error('Question not found');
    return res.json();
  },

  getMainsSubmissions: async (questionId?: string) => {
    const qs = questionId ? `?questionId=${encodeURIComponent(questionId)}` : '';
    const res = await apiFetch(`/api/mains/submissions${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getMainsSubmissionById: async (id: string) => {
    const res = await apiFetch(`/api/mains/submissions/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Submission not found');
    return res.json();
  },

  saveMainsDraft: async (data: {
    submissionId?: string;
    questionId: string;
    answerText?: string;
    submissionType?: string;
    attachmentUrl?: string;
    wordCount?: number;
    timeSpentSeconds?: number;
  }) => {
    const res = await apiFetch('/api/mains/draft', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save answer draft');
    }
    return res.json();
  },

  submitMainsAnswer: async (submissionId: string) => {
    const res = await apiFetch('/api/mains/submit', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ submissionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit answer');
    }
    return res.json();
  },

  evaluateMainsAnswerAI: async (submissionId: string) => {
    const res = await apiFetch('/api/mains/evaluate-ai', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ submissionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to evaluate answer');
    }
    return res.json();
  },

  getTeacherEvaluationsForLearner: async () => {
    const res = await apiFetch('/api/mains/teacher-evaluations', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getInterviewProfile: async () => {
    const res = await apiFetch('/api/interview/profile', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  saveInterviewProfile: async (data: any) => {
    const res = await apiFetch('/api/interview/profile', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save DAF profile');
    }
    return res.json();
  },

  getInterviewQuestions: async (params?: { exam?: string; category?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.exam) query.append('exam', params.exam);
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/interview/questions${qs}`);
    if (!res.ok) return [];
    return res.json();
  },

  getInterviewSessions: async () => {
    const res = await apiFetch('/api/interview/sessions', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createInterviewSession: async (data: { exam?: string; mode?: string; boardName?: string }) => {
    const res = await apiFetch('/api/interview/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create interview session');
    }
    return res.json();
  },

  getInterviewSession: async (id: string) => {
    const res = await apiFetch(`/api/interview/sessions/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Interview session not found');
    return res.json();
  },

  sendInterviewMessage: async (sessionId: string, answerText: string, step?: number) => {
    const res = await apiFetch(`/api/interview/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answerText, step }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send interview message');
    }
    return res.json();
  },

  completeInterviewSession: async (sessionId: string) => {
    const res = await apiFetch(`/api/interview/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to complete interview session');
    }
    return res.json();
  },

  getUnifiedPerformance: async () => {
    const res = await apiFetch('/api/learner/unified-performance', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load unified performance');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // Phase 4.1: Mains Evaluation Intelligence & Training
  // ----------------------------------------------------
  getMainsSubmissionEvaluation: async (submissionId: string) => {
    const res = await apiFetch(`/api/mains/evaluation/${submissionId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load submission evaluation');
    }
    return res.json();
  },

  submitMainsFacultyReview: async (submissionId: string, payload: any) => {
    const res = await apiFetch(`/api/mains/evaluation/${submissionId}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit faculty review');
    }
    return res.json();
  },

  claimMainsReview: async (submissionId: string) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/claim-review`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err.error || 'Failed to claim review lock');
      error.status = res.status;
      error.lockedBy = err.lockedBy;
      error.lockedAt = err.lockedAt;
      throw error;
    }
    return res.json();
  },

  releaseMainsReview: async (submissionId: string) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/release-review`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to release review lock');
    }
    return res.json();
  },

  runMainsHandwrittenOcr: async (submissionId: string) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/run-ocr`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run OCR on handwritten submission');
    }
    return res.json();
  },

  correctMainsOcrText: async (submissionId: string, correctedText: string) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/correct-ocr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ correctedText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update corrected OCR text');
    }
    return res.json();
  },

  getTeacherMainsPendingReviews: async (limit = 50, offset = 0, status = 'PENDING') => {
    const res = await apiFetch(`/api/teacher/mains/pending-reviews?limit=${limit}&offset=${offset}&status=${status}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load pending reviews');
    }
    return res.json();
  },

  setTeacherMainsEligibility: async (payload: {
    reviewId?: string;
    submissionId?: string;
    eligibility: string;
    exclusionReason?: string;
  }) => {
    const res = await apiFetch('/api/teacher/mains/eligibility', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update eligibility');
    }
    return res.json();
  },

  getAdminMainsMetrics: async () => {
    const res = await apiFetch('/api/admin/mains/metrics', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load mains admin metrics');
    }
    return res.json();
  },

  getAdminMainsDisagreementAnalysis: async () => {
    const res = await apiFetch('/api/admin/mains/disagreement-analysis', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load disagreement analysis');
    }
    return res.json();
  },

  buildMainsDataset: async (payload: { versionName: string; description?: string; trainSplitRatio?: number; valSplitRatio?: number }) => {
    const res = await apiFetch('/api/admin/mains/datasets/build', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to build dataset');
    }
    return res.json();
  },

  getAdminMainsDatasets: async () => {
    const res = await apiFetch('/api/admin/mains/datasets', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load datasets');
    }
    return res.json();
  },

  freezeMainsDataset: async (datasetId: string) => {
    const res = await apiFetch(`/api/admin/mains/datasets/${datasetId}/freeze`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to freeze dataset');
    }
    return res.json();
  },

  buildMainsBenchmark: async (payload: { name: string; version: string }) => {
    const res = await apiFetch('/api/admin/mains/benchmarks/build', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to build benchmark');
    }
    return res.json();
  },

  getAdminMainsBenchmarks: async () => {
    const res = await apiFetch('/api/admin/mains/benchmarks', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load benchmarks');
    }
    return res.json();
  },

  getAdminMainsModels: async () => {
    const res = await apiFetch('/api/admin/mains/models', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load models');
    }
    return res.json();
  },

  registerMainsModel: async (payload: any) => {
    const res = await apiFetch('/api/admin/mains/models/register', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register model');
    }
    return res.json();
  },

  promoteMainsModel: async (modelId: string, status: 'SHADOW' | 'PRODUCTION') => {
    const res = await apiFetch(`/api/admin/mains/models/${modelId}/promote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to promote model');
    }
    return res.json();
  },

  retireMainsModel: async (modelId: string) => {
    const res = await apiFetch(`/api/admin/mains/models/${modelId}/retire`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retire model');
    }
    return res.json();
  },

  evaluateMainsModel: async (modelId: string, benchmarkId: string) => {
    const res = await apiFetch(`/api/admin/mains/models/${modelId}/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ benchmarkId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to evaluate model');
    }
    return res.json();
  },

  createMainsTrainingJob: async (payload: any) => {
    const res = await apiFetch('/api/admin/mains/training-jobs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create training job');
    }
    return res.json();
  },

  getAdminMainsTrainingJobs: async () => {
    const res = await apiFetch('/api/admin/mains/training-jobs', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load training jobs');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1C: DATASET COLLECTION & FACULTY CALIBRATION
  // ----------------------------------------------------

  getMainsCoverageAnalysis: async () => {
    const res = await apiFetch('/api/mains/coverage/analysis', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load coverage analysis');
    }
    return res.json();
  },

  getMainsCoveragePracticeQuestions: async (params?: { limit?: number; paper?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    const res = await apiFetch(`/api/mains/coverage/practice-questions?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load coverage practice questions');
    }
    return res.json();
  },

  getTeacherMainsCalibrationCases: async (params?: { limit?: number; paper?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    const res = await apiFetch(`/api/teacher/mains/calibration-cases?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load calibration cases');
    }
    return res.json();
  },

  submitMainsDoubleReview: async (submissionId: string, payload: {
    marks: number;
    maxMarks?: number;
    dimensions: Record<string, number>;
    feedback: string;
    verdict?: string;
  }) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/double-review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit double review');
    }
    return res.json();
  },

  adjudicateMainsDoubleReview: async (submissionId: string, payload: {
    score: number;
    dimensions: Record<string, number>;
    feedback: string;
    notes?: string;
  }) => {
    const res = await apiFetch(`/api/admin/mains/${submissionId}/adjudicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to adjudicate double review');
    }
    return res.json();
  },

  getAdminMainsDatasetGrowth: async () => {
    const res = await apiFetch('/api/admin/mains/dataset-growth', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset growth dashboard');
    }
    return res.json();
  },

  getAdminMainsCoverageMatrix: async () => {
    const res = await apiFetch('/api/admin/mains/coverage-matrix', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load coverage matrix');
    }
    return res.json();
  },

  getAdminMainsTrainingGate: async () => {
    const res = await apiFetch('/api/admin/mains/training-gate', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load training gate status');
    }
    return res.json();
  },

  runAdminMainsReadinessAudit: async () => {
    const res = await apiFetch('/api/admin/mains/readiness-audit', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run readiness audit');
    }
    return res.json();
  },

  recordMainsDatasetEvent: async (payload: { eventType: string; submissionId: string; metadata?: any }) => {
    const res = await apiFetch('/api/mains/dataset-events', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record dataset event');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1D: REAL MAINS DATASET ACQUISITION ENGINE
  // ----------------------------------------------------

  getAdminMainsAcquisitionPriorities: async (params?: { limit?: number; paper?: string; subject?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    if (params?.subject) query.set('subject', params.subject);
    const res = await apiFetch(`/api/admin/mains/dataset/acquisition?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load acquisition priorities');
    }
    return res.json();
  },

  getAdminMainsDetailedCoverage: async () => {
    const res = await apiFetch('/api/admin/mains/dataset/coverage', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load detailed coverage matrix');
    }
    return res.json();
  },

  getAdminMainsAcquisitionFunnel: async () => {
    const res = await apiFetch('/api/admin/mains/dataset/funnel', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load acquisition funnel');
    }
    return res.json();
  },

  getAdminMainsLearnerDiversity: async () => {
    const res = await apiFetch('/api/admin/mains/dataset/diversity', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load learner diversity metrics');
    }
    return res.json();
  },

  createAdminMainsDatasetSnapshot: async (payload: { versionName: string; description?: string }) => {
    const res = await apiFetch('/api/admin/mains/dataset/snapshots', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create dataset snapshot');
    }
    return res.json();
  },

  getAdminMainsDatasetSnapshots: async () => {
    const res = await apiFetch('/api/admin/mains/dataset/snapshots', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset snapshots');
    }
    return res.json();
  },

  freezeAdminMainsDatasetSnapshot: async (snapshotId: string) => {
    const res = await apiFetch(`/api/admin/mains/dataset/snapshots/${snapshotId}/freeze`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to freeze dataset snapshot');
    }
    return res.json();
  },

  getTeacherMainsReviewAssignments: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiFetch(`/api/teacher/mains/review-assignments${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load review assignments');
    }
    return res.json();
  },

  getTeacherMainsWorkloadConfig: async () => {
    const res = await apiFetch('/api/teacher/mains/workload-config', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load workload configuration');
    }
    return res.json();
  },

  updateTeacherMainsWorkloadConfig: async (payload: any) => {
    const res = await apiFetch('/api/teacher/mains/workload-config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update workload configuration');
    }
    return res.json();
  },

  assignMainsReview: async (submissionId: string, reviewerId: string, reviewerName?: string) => {
    const res = await apiFetch(`/api/teacher/mains/${submissionId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reviewerId, reviewerName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to assign review');
    }
    return res.json();
  },

  autoDistributeMainsReviews: async () => {
    const res = await apiFetch('/api/teacher/mains/auto-distribute', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to auto-distribute reviews');
    }
    return res.json();
  },

  getLearnerMainsCoveragePracticeHub: async () => {
    const res = await apiFetch('/api/mains/practice/coverage', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load coverage practice hub');
    }
    return res.json();
  },

  getLearnerMainsCoveragePracticeTrack: async (gapId: string) => {
    const res = await apiFetch(`/api/mains/practice/coverage/${gapId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load practice track');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1E: DATASET QUALITY CONTROL & RELEASE CANDIDATE
  // ----------------------------------------------------

  getAdminMainsQualityScorecard: async () => {
    const res = await apiFetch('/api/admin/mains/quality/scorecard', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset quality scorecard');
    }
    return res.json();
  },

  getAdminMainsQualityBalanceReports: async () => {
    const res = await apiFetch('/api/admin/mains/quality/balance-reports', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load quality balance reports');
    }
    return res.json();
  },

  getTeacherMainsCalibrationSummary: async () => {
    const res = await apiFetch('/api/teacher/mains/calibration/summary', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load faculty calibration summary');
    }
    return res.json();
  },

  getTeacherMainsCalibrationConsistency: async () => {
    const res = await apiFetch('/api/teacher/mains/calibration/consistency', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load faculty consistency list');
    }
    return res.json();
  },

  getAdminMainsAiDisagreementAnalytics: async () => {
    const res = await apiFetch('/api/admin/mains/calibration/disagreement', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load AI disagreement analytics');
    }
    return res.json();
  },

  getAdminMainsQuarantine: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const res = await apiFetch(`/api/admin/mains/quarantine?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load quarantine list');
    }
    return res.json();
  },

  quarantineMainsSubmission: async (payload: { submissionId: string; quarantineReason: string; notes?: string }) => {
    const res = await apiFetch('/api/admin/mains/quarantine', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to quarantine submission');
    }
    return res.json();
  },

  resolveMainsQuarantine: async (id: string, payload: { resolutionStatus: string; outcome?: string; notes?: string }) => {
    const res = await apiFetch(`/api/admin/mains/quarantine/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to resolve quarantine record');
    }
    return res.json();
  },

  autoScanMainsQuarantine: async () => {
    const res = await apiFetch('/api/admin/mains/quarantine/auto-scan', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run auto-quarantine scan');
    }
    return res.json();
  },

  getAdminMainsReleaseCandidates: async () => {
    const res = await apiFetch('/api/admin/mains/release-candidates', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load release candidates');
    }
    return res.json();
  },

  createAdminMainsReleaseCandidate: async (payload: { datasetVersion: string }) => {
    const res = await apiFetch('/api/admin/mains/release-candidates', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create release candidate');
    }
    return res.json();
  },

  getAdminMainsReleaseCandidate: async (id: string) => {
    const res = await apiFetch(`/api/admin/mains/release-candidates/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load release candidate');
    }
    return res.json();
  },

  freezeAdminMainsReleaseCandidate: async (id: string) => {
    const res = await apiFetch(`/api/admin/mains/release-candidates/${id}/freeze`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to freeze release candidate');
    }
    return res.json();
  },

  getAdminMainsReleaseCandidateManifest: async (id: string) => {
    const res = await apiFetch(`/api/admin/mains/release-candidates/${id}/manifest`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load release candidate manifest');
    }
    return res.json();
  },

  recordAdminMainsQualityRun: async () => {
    const res = await apiFetch('/api/admin/mains/quality/run', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record quality run');
    }
    return res.json();
  },

  getAdminMainsQualityRuns: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await apiFetch(`/api/admin/mains/quality/runs${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load quality runs');
    }
    return res.json();
  },

  getAdminMainsCandidateEvals: async (params?: { limit?: number; paper?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    const res = await apiFetch(`/api/admin/mains/quality/candidate-evals?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load candidate evaluations');
    }
    return res.json();
  },

  getAdminMainsCandidateEval: async (submissionId: string) => {
    const res = await apiFetch(`/api/admin/mains/quality/candidate-eval/${submissionId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load candidate evaluation');
    }
    return res.json();
  },

  recordAdminMainsCalibrationLog: async () => {
    const res = await apiFetch('/api/admin/mains/calibration/log', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record calibration log');
    }
    return res.json();
  },

  getAdminMainsCalibrationLogs: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await apiFetch(`/api/admin/mains/calibration/logs${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load calibration logs');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1F: MAINS DATASET OPERATIONS & CALIBRATION LOOP
  // ----------------------------------------------------
  getAdminMainsOperationsOverview: async () => {
    const res = await apiFetch('/api/admin/mains/operations/overview', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset operations overview');
    }
    return res.json();
  },

  getAdminMainsOperationsReviews: async (params?: {
    status?: string;
    paper?: string;
    reviewerId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.paper) query.set('paper', params.paper);
    if (params?.reviewerId) query.set('reviewerId', params.reviewerId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/reviews${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load operations review queue');
    }
    return res.json();
  },

  getAdminMainsOperationsWorkload: async () => {
    const res = await apiFetch('/api/admin/mains/operations/workload', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load faculty workload summary');
    }
    return res.json();
  },

  getMainsOperationsCalibrationCases: async () => {
    const res = await apiFetch('/api/admin/mains/operations/calibration-cases', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load calibration cases');
    }
    return res.json();
  },

  submitMainsOperationsCalibrationAttempt: async (payload: {
    submissionId: string;
    assignedMarks: number;
    rubricScores: Record<string, number>;
    feedback?: string;
  }) => {
    const res = await apiFetch('/api/admin/mains/operations/calibration-attempt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit calibration attempt');
    }
    return res.json();
  },

  getMainsOperationsCalibrationPerformance: async (facultyId?: string) => {
    const query = facultyId ? `?facultyId=${encodeURIComponent(facultyId)}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/calibration-performance${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load calibration performance');
    }
    return res.json();
  },

  getAdminMainsOperationsGrowth: async (timeRange?: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME') => {
    const query = timeRange ? `?timeRange=${timeRange}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/growth${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset growth data');
    }
    return res.json();
  },

  getAdminMainsOperationsGrowthTrends: async () => {
    const res = await apiFetch('/api/admin/mains/operations/growth-trends', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset growth trends');
    }
    return res.json();
  },

  getAdminMainsOperationsWeeklyReport: async () => {
    const res = await apiFetch('/api/admin/mains/operations/weekly-report', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load weekly dataset health report');
    }
    return res.json();
  },

  revalidateMainsReleaseCandidate: async (rcId: string) => {
    const res = await apiFetch(`/api/admin/mains/operations/release-candidates/${rcId}/revalidate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revalidate release candidate');
    }
    return res.json();
  },

  getAdminMainsOperationsDoubleReviews: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/double-reviews${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load double review operations');
    }
    return res.json();
  },

  getAdminMainsOperationsAdjudicationQueue: async () => {
    const res = await apiFetch('/api/admin/mains/operations/adjudication-queue', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load adjudication queue');
    }
    return res.json();
  },

  submitMainsOperationsAdjudication: async (payload: {
    submissionId: string;
    score: number;
    dimensions: Record<string, number>;
    feedback: string;
    notes?: string;
  }) => {
    const res = await apiFetch('/api/admin/mains/operations/adjudicate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit adjudication');
    }
    return res.json();
  },

  getMainsOperationsOcrQueue: async (params?: {
    status?: string;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.minConfidence) query.set('minConfidence', String(params.minConfidence));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/ocr-queue${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load OCR queue');
    }
    return res.json();
  },

  verifyMainsOperationsOcr: async (payload: {
    submissionId: string;
    correctedText: string;
  }) => {
    const res = await apiFetch('/api/admin/mains/operations/ocr-verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify OCR text');
    }
    return res.json();
  },

  getAdminMainsOperationsTrainingGate: async (candidateId?: string) => {
    const query = candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : '';
    const res = await apiFetch(`/api/admin/mains/operations/training-gate${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to evaluate training safety gate');
    }
    return res.json();
  },

  getAdminMainsOperationsThresholds: async () => {
    const res = await apiFetch('/api/admin/mains/operations/thresholds', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load operations thresholds');
    }
    return res.json();
  },

  updateAdminMainsOperationsThresholds: async (thresholds: any) => {
    const res = await apiFetch('/api/admin/mains/operations/thresholds', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(thresholds)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update operations thresholds');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1G: TRAINING READINESS & GO/NO-GO AUDIT
  // ----------------------------------------------------
  getAdminMainsTrainingReadiness: async () => {
    const res = await apiFetch('/api/admin/mains/training-readiness', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute training readiness audit');
    }
    return res.json();
  },

  getAdminMainsTrainingReadinessHistory: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await apiFetch(`/api/admin/mains/training-readiness/history${query}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load training readiness history');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PHASE 4.1H: DATASET REMEDIATION & ACQUISITION
  // ----------------------------------------------------
  getAdminMainsDatasetRemediation: async () => {
    const res = await apiFetch('/api/admin/mains/dataset-remediation', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset remediation overview');
    }
    return res.json();
  },

  executeAdminMainsDatasetRemediation: async () => {
    const res = await apiFetch('/api/admin/mains/dataset-remediation/execute', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute dataset remediation');
    }
    return res.json();
  },

  getAdminMainsDatasetRemediationSnapshots: async () => {
    const res = await apiFetch('/api/admin/mains/dataset-remediation/snapshots', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load remediation snapshots');
    }
    return res.json();
  },

  getMainsTargetedPracticeHub: async () => {
    const res = await apiFetch('/api/mains/targeted-practice-hub', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load targeted practice hub');
    }
    return res.json();
  },

  // PHASE 4.1I: REAL DATASET GROWTH & CONTROLLED COLLECTION
  getMainsDatasetGrowthOverview: async () => {
    const res = await apiFetch('/api/mains/dataset-growth/overview', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dataset growth overview');
    }
    return res.json();
  },

  getMainsDatasetGrowthQuestions: async (params?: { limit?: number; paper?: string; subject?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    if (params?.subject) query.set('subject', params.subject);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/mains/dataset-growth/targeted-questions${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load targeted questions');
    }
    return res.json();
  },

  saveMainsDatasetGrowthDraft: async (data: {
    questionId: string;
    answerText: string;
    submissionType?: string;
    attachmentUrl?: string;
  }) => {
    const res = await apiFetch('/api/mains/dataset-growth/draft', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save draft');
    }
    return res.json();
  },

  submitMainsDatasetGrowthAnswer: async (data: {
    questionId: string;
    answerText: string;
    submissionType?: string;
    attachmentUrl?: string;
    ocrExtractedText?: string;
    ocrConfidence?: number;
  }) => {
    const res = await apiFetch('/api/mains/dataset-growth/submit-answer', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit answer');
    }
    return res.json();
  },

  getMainsDatasetGrowthLearnerSubmissions: async () => {
    const res = await apiFetch('/api/mains/dataset-growth/learner-submissions', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load learner submissions');
    }
    return res.json();
  },

  getMainsDatasetGrowthFacultyQueue: async (params?: { limit?: number; paper?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.paper) query.set('paper', params.paper);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/mains/dataset-growth/faculty-queue${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load faculty acquisition queue');
    }
    return res.json();
  },

  submitMainsDatasetGrowthFacultyReview: async (data: {
    submissionId: string;
    facultyMarks: number;
    facultyVerdict: 'ACCEPTED' | 'EDITED' | 'REJECTED' | 'INDEPENDENT';
    facultyFeedback: string;
    facultyStrengths?: string[];
    facultyWeaknesses?: string[];
    facultyActionableImprovement?: string;
    facultyDimensions?: Record<string, number>;
  }) => {
    const res = await apiFetch('/api/mains/dataset-growth/faculty-review', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record faculty review');
    }
    return res.json();
  },

  getMainsDatasetGrowthCoverageMatrices: async () => {
    const res = await apiFetch('/api/mains/dataset-growth/coverage-matrices', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load coverage matrices');
    }
    return res.json();
  },

  getMainsDatasetGrowthBenchmarks: async () => {
    const res = await apiFetch('/api/mains/dataset-growth/benchmarks', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load benchmark collection');
    }
    return res.json();
  },

  getMainsDatasetGrowthCampaigns: async () => {
    const res = await apiFetch('/api/mains/dataset-growth/campaigns', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load campaigns');
    }
    return res.json();
  },

  createMainsDatasetGrowthCampaign: async (data: {
    name: string;
    description?: string;
    targetAnswers?: number;
    targetFacultyReviews?: number;
    targetSubjects?: number;
    targetBenchmarkItems?: number;
    coveragePriorities?: string[];
  }) => {
    const res = await apiFetch('/api/mains/dataset-growth/campaigns', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create campaign');
    }
    return res.json();
  },

  // PHASE 4.1J: TELEGRAM MAINS COPY INGESTION CLIENT APIS
  getAdminMainsTelegramSources: async () => {
    const res = await apiFetch('/api/admin/mains/telegram/sources', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load Telegram sources');
    }
    return res.json();
  },

  registerAdminMainsTelegramSource: async (data: {
    sourceType: string;
    telegramChatId: string;
    telegramChatType?: string;
    displayName: string;
    authorized: boolean;
    enabled?: boolean;
    authorizationBasis?: string;
    retentionPolicy?: string;
  }) => {
    const res = await apiFetch('/api/admin/mains/telegram/sources', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register Telegram source');
    }
    return res.json();
  },

  updateAdminMainsTelegramSource: async (id: string, data: any) => {
    const res = await apiFetch(`/api/admin/mains/telegram/sources/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update Telegram source');
    }
    return res.json();
  },

  getAdminMainsTelegramImports: async (params?: { status?: string; sourceId?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.sourceId) query.set('sourceId', params.sourceId);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/admin/mains/telegram/imports${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load Telegram imports');
    }
    return res.json();
  },

  getAdminMainsTelegramImportById: async (id: string) => {
    const res = await apiFetch(`/api/admin/mains/telegram/imports/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load Telegram import record');
    }
    return res.json();
  },

  retryAdminMainsTelegramImport: async (id: string) => {
    const res = await apiFetch(`/api/admin/mains/telegram/imports/${id}/retry`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retry Telegram import');
    }
    return res.json();
  },

  validateAdminMainsTelegramGroundTruth: async (id: string, data: {
    facultyMarks: number;
    facultyMaxMarks?: number;
    facultyVerdict: string;
    facultyFeedback: string;
    facultyRubric?: Record<string, number>;
  }) => {
    const res = await apiFetch(`/api/admin/mains/telegram/imports/${id}/validate-ground-truth`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to validate ground truth');
    }
    return res.json();
  },

  excludeAdminMainsTelegramImport: async (id: string, reason?: string) => {
    const res = await apiFetch(`/api/admin/mains/telegram/imports/${id}/exclude`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to exclude import');
    }
    return res.json();
  },

  getAdminMainsTelegramStats: async () => {
    const res = await apiFetch('/api/admin/mains/telegram/stats', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load Telegram stats');
    }
    return res.json();
  }
};


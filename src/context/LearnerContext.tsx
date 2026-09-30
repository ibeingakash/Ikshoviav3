import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearnerModel, NextBestAction, NotificationItem, AiContextData, Entitlement } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.js';

export type NavigationSection =
  | 'dashboard'
  | 'learn'
  | 'exam-engine'
  | 'mains'
  | 'interview'
  | 'ai-tutor'
  | 'daily-quiz'
  | 'pyq-practice'
  | 'mock-tests'
  | 'practice'
  | 'practice-pyq'
  | 'practice-subject'
  | 'practice-full'
  | 'mock-pyq'
  | 'mock-custom'
  | 'mock-attempts'
  | 'revision'
  | 'bookmarks'
  | 'notes'
  | 'short-notes'
  | 'ypt'
  | 'live-classes'
  | 'live-classroom'
  | 'graph'
  | 'analytics'
  | 'current-affairs'
  | 'resources'
  | 'goals'
  | 'profile'
  | 'settings'
  | 'download'
  | 'admin-dashboard'
  | 'admin-short-notes'
  | 'admin-commercial'
  | 'admin-coupons'
  | 'admin-revenue'
  | 'admin-users'
  | 'admin-courses'
  | 'admin-test-series'
  | 'admin-entitlements'
  | 'admin-payments'
  | 'admin-content'
  | 'admin-questions'
  | 'admin-mock-builder'
  | 'admin-ai'
  | 'admin-ocr'
  | 'admin-content-import'
  | 'admin-current-affairs'
  | 'admin-import-logs'
  | 'admin-resources'
  | 'admin-app-releases'
  | 'admin-releases'
  | 'admin-settings'
  | 'courses-catalog'
  | 'course-catalog'
  | 'test-series'
  | 'test-series-marketplace'
  | 'mock'
  | 'ypt-groups'
  | 'admin-resource-studio'
  | 'admin-offers'
  | 'learner-purchases'
  | 'super-admin'
  | 'superadmin-console'
  | 'super-admin-dashboard'
  | 'super-admin-users'
  | 'super-admin-admins'
  | 'super-admin-permissions'
  | 'super-admin-audit'
  | 'super-admin-settings'
  | 'teacher-dashboard'
  | 'teacher-classes'
  | 'teacher-students'
  | 'teacher-assignments'
  | 'teacher-evaluations'
  | 'teacher-quizzes'
  | 'teacher-resources'
  | 'teacher-live'
  | 'teacher-announcements'
  | 'teacher-analytics'
  | 'learner-classes'
  | 'learner-assignments';

export type AppTheme = 'futuristic-glass' | 'upsc-parchment' | 'bpsc-navy';

interface LearnerContextType {
  activeSection: NavigationSection;
  setActiveSection: (sec: NavigationSection) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  learnerModel: LearnerModel | null;
  nextBestAction: NextBestAction | null;
  aiInsight: string;
  notifications: NotificationItem[];
  entitlements: Entitlement[];
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedConceptId: string | null;
  setSelectedConceptId: (id: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  aiContext: AiContextData | null;
  setAiContext: (ctx: AiContextData | null) => void;
  pendingAiPrompt: { prompt: string; quickAction?: string } | null;
  setPendingAiPrompt: (p: { prompt: string; quickAction?: string } | null) => void;
  askTutorWithContext: (userText: string, ctx?: AiContextData | string, quickAction?: string) => void;
  refreshLearnerData: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  navigateToConcept: (conceptId: string) => void;
  navigateBack: () => boolean;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const initialSection: NavigationSection = (() => {
    if (user?.role === 'SUPER_ADMIN') return 'super-admin-dashboard';
    if (user?.role === 'ADMIN') return 'admin-dashboard';
    return 'dashboard';
  })();
  const [activeSection, setActiveSectionState] = useState<NavigationSection>(initialSection);
  const navHistoryRef = React.useRef<NavigationSection[]>([]);
  const [appTheme, setAppTheme] = useState<AppTheme>('upsc-parchment');
  const [learnerModel, setLearnerModel] = useState<LearnerModel | null>(null);
  const [nextBestAction, setNextBestAction] = useState<NextBestAction | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('Analyzing your learning health...');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>('sub_polity');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>('c_art21');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [aiContext, setAiContext] = useState<AiContextData | null>(null);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<{ prompt: string; quickAction?: string } | null>(null);

  const prevAuthUserRef = React.useRef<{ id: string; role: string } | null>(null);

  const refreshLearnerData = async () => {
    try {
      if (!user) {
        setNotifications([]);
        setEntitlements([]);
        return;
      }

      // Fetch model, notifications, and entitlements resiliently
      const [modelRes, notifsRes, entsRes] = await Promise.allSettled([
        api.getLearnerModel(user.id),
        api.getNotifications(),
        api.getLearnerEntitlements(),
      ]);

      if (modelRes.status === 'fulfilled' && modelRes.value && typeof modelRes.value === 'object') {
        const data = modelRes.value;
        if (data.model) setLearnerModel(data.model);
        if (data.nextBestAction) setNextBestAction(data.nextBestAction);
        if (data.aiInsight) setAiInsight(data.aiInsight);
      }

      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        const notifs = Array.isArray(notifsRes.value)
          ? notifsRes.value
          : (notifsRes.value?.notifications || []);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }

      if (entsRes.status === 'fulfilled' && entsRes.value) {
        setEntitlements(Array.isArray(entsRes.value) ? entsRes.value : []);
      } else {
        setEntitlements([]);
      }
    } catch (err) {
      console.warn('[LearnerContext] Failed to load learner data notice:', err);
      setNotifications([]);
      setEntitlements([]);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  useEffect(() => {
    if (user) {
      const isNewLoginOrSwitch =
        !prevAuthUserRef.current ||
        prevAuthUserRef.current.id !== user.id ||
        prevAuthUserRef.current.role !== user.role;

      if (isNewLoginOrSwitch) {
        prevAuthUserRef.current = { id: user.id, role: user.role };
        // Route directly to the role-appropriate initial screen
        if (user.role === 'SUPER_ADMIN') {
          setActiveSection('super-admin-dashboard');
        } else if (user.role === 'ADMIN') {
          setActiveSection('admin-dashboard');
        } else {
          setActiveSection('dashboard');
        }
      } else {
        // Enforce RBAC bounds if user role does not allow current section
        if (activeSection.startsWith('super-admin-') && user.role !== 'SUPER_ADMIN') {
          setActiveSection(user.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
        } else if (
          (activeSection.startsWith('admin-') || activeSection === 'admin-ocr' || activeSection === 'admin-current-affairs') &&
          user.role !== 'ADMIN' &&
          user.role !== 'SUPER_ADMIN'
        ) {
          setActiveSection('dashboard');
        }
      }

      refreshLearnerData();
    } else {
      prevAuthUserRef.current = null;
      setNotifications([]);
      setActiveSection('dashboard');
    }
  }, [user?.id, user?.role]);

  // Handle Ctrl+K shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setActiveSection = (nextSection: NavigationSection) => {
    setActiveSectionState(current => {
      if (current !== nextSection) {
        navHistoryRef.current.push(current);
        if (navHistoryRef.current.length > 20) {
          navHistoryRef.current.shift();
        }
      }
      return nextSection;
    });
  };

  const navigateBack = (): boolean => {
    if (navHistoryRef.current.length > 0) {
      const prev = navHistoryRef.current.pop();
      if (prev && prev !== activeSection) {
        setActiveSectionState(prev);
        return true;
      }
    }
    // If not at default root, go to dashboard
    if (activeSection !== 'dashboard') {
      setActiveSectionState('dashboard');
      return true;
    }
    return false;
  };

  const navigateToConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setActiveSection('learn');
  };

  const askTutorWithContext = (userText: string, ctx?: AiContextData | string, quickAction?: string) => {
    if (ctx) {
      if (typeof ctx === 'string') {
        setAiContext({ contextSummary: ctx });
      } else {
        setAiContext(ctx);
      }
    }
    setPendingAiPrompt({ prompt: userText, quickAction });
    setActiveSection('ai-tutor');
  };

  return (
    <LearnerContext.Provider
      value={{
        activeSection,
        setActiveSection,
        appTheme,
        setAppTheme,
        learnerModel,
        nextBestAction,
        aiInsight,
        notifications,
        entitlements,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedConceptId,
        setSelectedConceptId,
        isSearchOpen,
        setIsSearchOpen,
        aiContext,
        setAiContext,
        pendingAiPrompt,
        setPendingAiPrompt,
        askTutorWithContext,
        refreshLearnerData,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        navigateToConcept,
        navigateBack,
      }}
    >
      {children}
    </LearnerContext.Provider>
  );
};

export const useLearner = () => {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error('useLearner must be used within LearnerProvider');
  return ctx;
};

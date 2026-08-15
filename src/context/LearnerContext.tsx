import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearnerModel, NextBestAction, NotificationItem, AiContextData } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.js';

export type NavigationSection =
  | 'dashboard'
  | 'learn'
  | 'ai-tutor'
  | 'practice'
  | 'mock-tests'
  | 'revision'
  | 'graph'
  | 'analytics'
  | 'current-affairs'
  | 'resources'
  | 'goals'
  | 'profile'
  | 'settings'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-content'
  | 'admin-questions'
  | 'admin-ai'
  | 'admin-ocr'
  | 'admin-current-affairs'
  | 'super-admin-dashboard'
  | 'super-admin-users'
  | 'super-admin-admins'
  | 'super-admin-audit'
  | 'super-admin-settings';

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
  askTutorWithContext: (userText: string, ctx?: AiContextData, quickAction?: string) => void;
  refreshLearnerData: () => Promise<void>;
  navigateToConcept: (conceptId: string) => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<NavigationSection>(() => {
    if (user?.role === 'SUPER_ADMIN') return 'super-admin-dashboard';
    if (user?.role === 'ADMIN') return 'admin-dashboard';
    return 'dashboard';
  });
  const [appTheme, setAppTheme] = useState<AppTheme>('upsc-parchment');
  const [learnerModel, setLearnerModel] = useState<LearnerModel | null>(null);
  const [nextBestAction, setNextBestAction] = useState<NextBestAction | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('Analyzing your learning health...');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
        return;
      }
      const data = await api.getLearnerModel(user.id);
      if (data && typeof data === 'object') {
        if (data.model) setLearnerModel(data.model);
        if (data.nextBestAction) setNextBestAction(data.nextBestAction);
        if (data.aiInsight) setAiInsight(data.aiInsight);
      }

      const notifs = await api.getNotifications(user.id);
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (err) {
      console.error('Failed to load learner data:', err);
      setNotifications([]);
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

  const navigateToConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setActiveSection('learn');
  };

  const askTutorWithContext = (userText: string, ctx?: AiContextData, quickAction?: string) => {
    if (ctx) {
      setAiContext(ctx);
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
        navigateToConcept,
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

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LearnerProvider, useLearner } from './context/LearnerContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal.js';
import { OnboardingModal } from './components/auth/OnboardingModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { LandingPage } from './components/landing/LandingPage.js';

import { DashboardView } from './components/dashboard/DashboardView.js';
import { LearnView } from './components/learn/LearnView.js';
import { AITutorView } from './components/ai/AITutorView.js';
import { PracticeView } from './components/practice/PracticeView.js';
import { PyqPracticeView } from './components/pyq/PyqPracticeView.js';
import { MockTestView } from './components/mock/MockTestView.js';
import { RevisionView } from './components/revision/RevisionView.js';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView.js';
import { AnalyticsView } from './components/analytics/AnalyticsView.js';
import { CurrentAffairsView } from './components/currentaffairs/CurrentAffairsView.js';
import { ResourcesView } from './components/resources/ResourcesView.js';
import { ShortNotesView } from './components/resources/ShortNotesView.js';
import { ShortNotesAdminView } from './components/admin/ShortNotesAdminView.js';
import { GoalsView } from './components/goals/GoalsView.js';
import { ProfileView } from './components/profile/ProfileView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { AdminView } from './components/admin/AdminView.js';
import { OCRStudioView } from './components/admin/OCRStudioView.js';
import { CurrentAffairsAdminView } from './components/admin/CurrentAffairsAdminView.js';
import { SuperAdminConsoleView } from './components/admin/SuperAdminConsoleView.js';
import { QuestionBankView } from './components/admin/QuestionBankView.js';
import { MockTestBuilderView } from './components/admin/MockTestBuilderView.js';
import { ImportPublishLogsView } from './components/admin/ImportPublishLogsView.js';
import { SubjectsConceptsView } from './components/admin/SubjectsConceptsView.js';
import { AdminDashboardView } from './components/admin/AdminDashboardView.js';
import { AdminResourceStudioView } from './components/admin/AdminResourceStudioView.js';
import { AdminTestSeriesStudioView } from './components/admin/AdminTestSeriesStudioView.js';
import { UserManagementView } from './components/admin/UserManagementView.js';
import { CoursesPricingView } from './components/admin/CoursesPricingView.js';
import { EntitlementsView } from './components/admin/EntitlementsView.js';
import { AdminPaymentsView } from './components/admin/AdminPaymentsView.js';
import { CommercialHubView } from './components/admin/CommercialHubView.js';
import { CouponsAdminView } from './components/admin/CouponsAdminView.js';
import { CourseCatalogView } from './components/courses/CourseCatalogView.js';
import { LearnerPurchasesView } from './components/courses/LearnerPurchasesView.js';
import { TestSeriesMarketplaceView } from './components/mock/TestSeriesMarketplaceView.js';
import { NotesSyllabusView } from './components/syllabus/NotesSyllabusView.js';
import { DownloadAppView } from './components/download/DownloadAppView.js';
import { LiveClassesHubView } from './components/live/LiveClassesHubView.js';
import { GlobalCallManager } from './components/live/GlobalCallManager.js';
import { YptView } from './components/ypt/YptView.js';
import { AppReleasesView } from './components/admin/AppReleasesView.js';
import { MainsEvaluationIntelligenceDashboard } from './components/admin/MainsEvaluationIntelligenceDashboard.js';
import { AndroidUpdateGateway } from './components/common/AndroidUpdateGateway.js';
import { TeacherWorkspaceView, TeacherTab } from './components/teacher/TeacherWorkspaceView.js';
import { LearnerClassesAndAssignmentsView } from './components/teacher/LearnerClassesAndAssignmentsView.js';
import { UnifiedExamEngineView } from './components/exam/UnifiedExamEngineView.js';
import { initCapacitorApp } from './lib/capacitor.js';
import { initPushNotifications } from './lib/pushNotifications.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeSection, setActiveSection, appTheme, navigateBack } = useLearner();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Track /download and /app direct URL routing
  const [isDownloadPath, setIsDownloadPath] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.toLowerCase();
    return p === '/download' || p === '/app' || p.startsWith('/download/') || p.startsWith('/app/');
  });

  // Test Series & Mock Test Navigation State
  const [activeTestParams, setActiveTestParams] = useState<{
    testId: string;
    seriesId?: string;
    forceNew?: boolean;
  } | null>(() => {
    try {
      const stored = sessionStorage.getItem('active_test_params');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const [activeTestSeriesId, setActiveTestSeriesId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('active_test_series_id');
    } catch {}
    return null;
  });

  const handleStartMockTestFromSeries = (mockTestId: string, seriesId?: string, forceNew = false) => {
    const params = { testId: mockTestId, seriesId, forceNew };
    setActiveTestParams(params);
    try {
      sessionStorage.setItem('active_test_params', JSON.stringify(params));
      if (seriesId) {
        sessionStorage.setItem('active_test_series_id', seriesId);
      }
    } catch {}
    if (seriesId) {
      setActiveTestSeriesId(seriesId);
    }
    setActiveSection('mock-tests');
  };

  const handleBackToSeries = (seriesId: string) => {
    setActiveTestParams(null);
    try {
      sessionStorage.removeItem('active_test_params');
      sessionStorage.setItem('active_test_series_id', seriesId);
    } catch {}
    setActiveTestSeriesId(seriesId);
    setActiveSection('test-series');
  };

  const handleClearActiveTest = () => {
    setActiveTestParams(null);
    try {
      sessionStorage.removeItem('active_test_params');
    } catch {}
  };

  React.useEffect(() => {
    const handleUrlChange = () => {
      const p = window.location.pathname.toLowerCase();
      if (p === '/app' || p.startsWith('/app/')) {
        window.history.replaceState(null, '', '/download');
        setIsDownloadPath(true);
      } else if (p === '/download' || p.startsWith('/download/')) {
        setIsDownloadPath(true);
      } else {
        setIsDownloadPath(false);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Initialize Android back button handling via Capacitor
  React.useEffect(() => {
    initCapacitorApp({
      onNavigateBack: () => {
        if (isDownloadPath) {
          setIsDownloadPath(false);
          window.history.pushState(null, '', '/');
          return true;
        }
        return navigateBack();
      }
    });
  }, [navigateBack, isDownloadPath]);

  // Initialize native Push Notifications when user is authenticated
  React.useEffect(() => {
    if (user) {
      initPushNotifications();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center text-[#111827] font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold tracking-wide text-slate-600 font-sans">
            Loading IKSHOVIA Learning Intelligence...
          </div>
        </div>
      </div>
    );
  }

  // If visitor is directly on /download or /app, show the Download App page
  if (isDownloadPath) {
    return (
      <DownloadAppView
        onBackToHome={() => {
          setIsDownloadPath(false);
          window.history.pushState(null, '', '/');
          if (user) {
            setActiveSection('dashboard');
          }
        }}
      />
    );
  }

  // Unauthenticated visitors see the Public Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  const getThemeClass = () => {
    return 'bg-[#FAF8F5] text-stone-900';
  };

  const renderSection = () => {
    // Super Admin Route Guard
    if (activeSection.startsWith('super-admin') || activeSection === 'super-admin') {
      if (user?.role !== 'SUPER_ADMIN') {
        return user?.role === 'ADMIN' ? <AdminDashboardView /> : <DashboardView />;
      }
      return <SuperAdminConsoleView />;
    }

    // Admin Route Guard
    if (activeSection.startsWith('admin-')) {
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return <DashboardView />;
      }
    }

    // Teacher Route Guard
    if (activeSection.startsWith('teacher-')) {
      if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return <DashboardView />;
      }
    }

    switch (activeSection) {
      case 'dashboard':
        if (user?.role === 'TEACHER') {
          return <TeacherWorkspaceView initialTab="dashboard" />;
        }
        return <DashboardView />;
      case 'teacher-dashboard':
        return <TeacherWorkspaceView initialTab="dashboard" />;
      case 'teacher-classes':
        return <TeacherWorkspaceView initialTab="classes" />;
      case 'teacher-students':
        return <TeacherWorkspaceView initialTab="students" />;
      case 'teacher-assignments':
        return <TeacherWorkspaceView initialTab="assignments" />;
      case 'teacher-evaluations':
        return <TeacherWorkspaceView initialTab="evaluations" />;
      case 'teacher-quizzes':
        return <TeacherWorkspaceView initialTab="quizzes" />;
      case 'teacher-resources':
        return <TeacherWorkspaceView initialTab="resources" />;
      case 'teacher-live':
        return <TeacherWorkspaceView initialTab="live" />;
      case 'teacher-announcements':
        return <TeacherWorkspaceView initialTab="announcements" />;
      case 'teacher-analytics':
        return <TeacherWorkspaceView initialTab="analytics" />;
      case 'learner-classes':
      case 'learner-assignments':
        return <LearnerClassesAndAssignmentsView />;
      case 'exam-engine':
        return <UnifiedExamEngineView initialStage="PRELIMS" />;
      case 'mains':
        return <UnifiedExamEngineView initialStage="MAINS" />;
      case 'interview':
        return <UnifiedExamEngineView initialStage="INTERVIEW" />;
      case 'learn':
        return <LearnView />;
      case 'ai-tutor':
        return <AITutorView />;
      case 'daily-quiz':
      case 'practice':
      case 'practice-subject':
      case 'practice-full':
        return <PracticeView />;
      case 'pyq-practice':
      case 'practice-pyq':
        return <PyqPracticeView />;
      case 'mock-tests':
      case 'mock':
      case 'mock-pyq':
      case 'mock-custom':
      case 'mock-attempts':
        return (
          <MockTestView
            initialTestId={activeTestParams?.testId || null}
            initialSeriesId={activeTestParams?.seriesId || activeTestSeriesId || null}
            forceNew={activeTestParams?.forceNew || false}
            onClearInitialTest={handleClearActiveTest}
            onBackToSeries={handleBackToSeries}
          />
        );
      case 'revision':
      case 'bookmarks':
        return <RevisionView />;
      case 'graph':
        return <KnowledgeGraphView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'current-affairs':
        return <CurrentAffairsView />;
      case 'resources':
        return <ResourcesView />;
      case 'notes':
        return <NotesSyllabusView />;
      case 'short-notes':
        return <ShortNotesView />;
      case 'ypt':
      case 'ypt-groups':
        return <YptView />;
      case 'live-classes':
      case 'live-classroom':
        return <LiveClassesHubView />;
      case 'goals':
        return <GoalsView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
      case 'admin-settings':
        return <SettingsView />;
      case 'download':
        return <DownloadAppView onBackToHome={() => setActiveSection('dashboard')} />;
      case 'admin-app-releases':
      case 'admin-releases':
        return <AppReleasesView />;
      case 'admin-dashboard':
        return <AdminDashboardView />;
      case 'admin-resources':
      case 'admin-resource-studio':
        return <AdminResourceStudioView />;
      case 'admin-short-notes':
        return <ShortNotesAdminView />;
      case 'admin-questions':
        return <QuestionBankView />;
      case 'admin-mock-builder':
        return <MockTestBuilderView />;
      case 'admin-ocr':
      case 'admin-content-import':
        return <OCRStudioView />;
      case 'admin-current-affairs':
        return <CurrentAffairsAdminView />;
      case 'admin-content':
        return <SubjectsConceptsView />;
      case 'admin-import-logs':
        return <ImportPublishLogsView />;
      case 'courses-catalog':
      case 'course-catalog':
        return <CourseCatalogView />;
      case 'admin-commercial':
      case 'admin-revenue':
        return <CommercialHubView />;
      case 'admin-coupons':
      case 'admin-offers':
        return <CouponsAdminView />;
      case 'admin-users':
        return <UserManagementView />;
      case 'admin-courses':
        return <CoursesPricingView />;
      case 'admin-test-series':
        return <AdminTestSeriesStudioView />;
      case 'admin-entitlements':
        return <EntitlementsView />;
      case 'admin-payments':
        return <AdminPaymentsView />;
      case 'learner-purchases':
        return <LearnerPurchasesView />;
      case 'test-series':
      case 'test-series-marketplace':
        return (
          <TestSeriesMarketplaceView
            initialSeriesId={activeTestSeriesId || undefined}
            onStartMockTest={handleStartMockTestFromSeries}
          />
        );
      case 'admin-mains-intelligence':
      case 'admin-mains-readiness':
      case 'admin-mains-remediation':
      case 'admin-mains-growth':
      case 'admin-mains-telegram':
        return (
          <MainsEvaluationIntelligenceDashboard
            initialTab={
              activeSection === 'admin-mains-telegram' ? 'TELEGRAM_IMPORT' :
              activeSection === 'admin-mains-growth' ? 'GROWTH_HUB' :
              activeSection === 'admin-mains-remediation' ? 'REMEDIATION' :
              activeSection === 'admin-mains-readiness' ? 'READINESS' : 'OVERVIEW'
            }
            onTabChange={(tab) => {
              if (tab === 'TELEGRAM_IMPORT') setActiveSection('admin-mains-telegram');
              else if (tab === 'GROWTH_HUB') setActiveSection('admin-mains-growth');
              else if (tab === 'REMEDIATION') setActiveSection('admin-mains-remediation');
              else if (tab === 'READINESS') setActiveSection('admin-mains-readiness');
              else if (tab === 'OVERVIEW') setActiveSection('admin-mains-intelligence');
            }}
          />
        );
      case 'superadmin-console':
        return <SuperAdminConsoleView />;
      case 'admin-ai':
        return <AdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} flex flex-col font-sans-editorial selection:bg-amber-500 selection:text-white transition-colors duration-200`}>
      <Header />
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto min-w-0">
        <Sidebar />
        <main id="app-main-content" className="flex-1 min-w-0 w-full max-w-full p-3 sm:p-6 pb-28 sm:pb-12 lg:p-8 overflow-y-auto overflow-x-hidden">
          <ErrorBoundary key={activeSection} onReset={() => setActiveSection('dashboard')}>
            {renderSection()}
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav />
      <GlobalSearchModal />
      <OnboardingModal />
      <GlobalCallManager />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="IKSHOVIA Application Error">
      <AuthProvider>
        <LearnerProvider>
          <MainContent />
          <AndroidUpdateGateway />
        </LearnerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

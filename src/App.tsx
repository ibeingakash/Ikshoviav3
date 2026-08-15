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
import { MockTestView } from './components/mock/MockTestView.js';
import { RevisionView } from './components/revision/RevisionView.js';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView.js';
import { AnalyticsView } from './components/analytics/AnalyticsView.js';
import { CurrentAffairsView } from './components/currentaffairs/CurrentAffairsView.js';
import { ResourcesView } from './components/resources/ResourcesView.js';
import { GoalsView } from './components/goals/GoalsView.js';
import { ProfileView } from './components/profile/ProfileView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { AdminView } from './components/admin/AdminView.js';
import { OCRStudioView } from './components/admin/OCRStudioView.js';
import { CurrentAffairsAdminView } from './components/admin/CurrentAffairsAdminView.js';
import { SuperAdminConsoleView } from './components/admin/SuperAdminConsoleView.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeSection, setActiveSection, appTheme } = useLearner();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

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

  // Unauthenticated visitors ALWAYS see the Public Landing Page
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
    return 'bg-[#FAFAF8] text-[#111827]';
  };

  const renderSection = () => {
    // Super Admin Route Guard
    if (activeSection.startsWith('super-admin-')) {
      if (user?.role !== 'SUPER_ADMIN') {
        return user?.role === 'ADMIN' ? <AdminView /> : <DashboardView />;
      }
      return <SuperAdminConsoleView />;
    }

    // Admin Route Guard
    if (
      activeSection.startsWith('admin-') ||
      activeSection === 'admin-ocr' ||
      activeSection === 'admin-current-affairs'
    ) {
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return <DashboardView />;
      }
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'learn':
        return <LearnView />;
      case 'ai-tutor':
        return <AITutorView />;
      case 'practice':
        return <PracticeView />;
      case 'mock-tests':
        return <MockTestView />;
      case 'revision':
        return <RevisionView />;
      case 'graph':
        return <KnowledgeGraphView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'current-affairs':
        return <CurrentAffairsView />;
      case 'resources':
        return <ResourcesView />;
      case 'goals':
        return <GoalsView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'admin-ocr':
        return <OCRStudioView />;
      case 'admin-current-affairs':
        return <CurrentAffairsAdminView />;
      case 'admin-dashboard':
      case 'admin-users':
      case 'admin-content':
      case 'admin-questions':
      case 'admin-ai':
        return <AdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300`}>
      {/* Accent Ribbon */}
      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500" />
      <Header />
      <div className="flex flex-1 max-w-[1700px] w-full mx-auto min-w-0">
        <Sidebar />
        <main id="app-main-content" className="flex-1 min-w-0 w-full max-w-full p-3 pb-24 sm:p-6 sm:pb-8 lg:p-8 overflow-y-auto">
          <ErrorBoundary key={activeSection} onReset={() => setActiveSection('dashboard')}>
            {renderSection()}
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav />
      <GlobalSearchModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="IKSHOVIA Application Error">
      <AuthProvider>
        <LearnerProvider>
          <MainContent />
        </LearnerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

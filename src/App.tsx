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
import { SuperAdminConsoleView } from './components/admin/SuperAdminConsoleView.js';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeSection, appTheme } = useLearner();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1933] flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#E7A91A] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold tracking-wide text-slate-200 font-serif">
            Initializing IKSHOVIA Intelligence...
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
    switch (appTheme) {
      case 'futuristic-glass':
        return 'bg-[#FAF9F5] text-[#0B1933]';
      case 'upsc-parchment':
        return 'bg-upsc-parchment text-slate-800';
      case 'bpsc-navy':
        return 'bg-bpsc-navy text-slate-100';
      default:
        return 'bg-[#FAF9F5] text-[#0B1933]';
    }
  };

  const renderSection = () => {
    if (activeSection.startsWith('super-admin-')) {
      return <SuperAdminConsoleView />;
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
    <div className={`min-h-screen ${getThemeClass()} flex flex-col font-sans selection:bg-[#D99A16] selection:text-white transition-colors duration-300`}>
      {/* Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0B1933] via-[#D99A16] to-[#5B5CE2] shadow-sm" />
      <Header />
      <div className="flex flex-1 max-w-[1700px] w-full mx-auto">
        <Sidebar />
        <main id="app-main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderSection()}
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
    <AuthProvider>
      <LearnerProvider>
        <MainContent />
      </LearnerProvider>
    </AuthProvider>
  );
}

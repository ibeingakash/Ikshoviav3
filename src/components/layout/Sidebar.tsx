import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Target,
  FileCheck2,
  RefreshCw,
  GitGraph,
  BarChart3,
  Newspaper,
  FolderArchive,
  Flag,
  User,
  Settings,
  Shield,
  Users,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  FileUp,
  ShieldAlert,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { IKBrandMark } from '../common/IKBrandMark.js';

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, learnerModel } = useLearner();
  const { user } = useAuth();

  const learnNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'mock-tests', label: 'Mock Tests', icon: FileCheck2 },
    { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
    {
      id: 'revision',
      label: 'Revision',
      icon: RefreshCw,
      badge: learnerModel?.dueRevisionCount ? `${learnerModel.dueRevisionCount} Due` : undefined,
    },
    { id: 'graph', label: 'Knowledge Graph', icon: GitGraph },
  ];

  const intelligenceNavItems: NavItem[] = [
    { id: 'ai-tutor', label: 'AI Tutor', icon: Bot, badge: 'Active' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const resourcesNavItems: NavItem[] = [
    { id: 'resources', label: 'Resources & PYQs', icon: FolderArchive },
  ];

  const planningNavItems: NavItem[] = [
    { id: 'goals', label: 'Goals & Planner', icon: Flag },
  ];

  const accountNavItems: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: Shield, adminOnly: true },
    { id: 'admin-users', label: 'User Directory', icon: Users, adminOnly: true },
    { id: 'admin-content', label: 'Subjects & Concepts', icon: FileSpreadsheet, adminOnly: true },
    { id: 'admin-questions', label: 'Question Bank', icon: HelpCircle, adminOnly: true },
    { id: 'admin-ocr', label: 'OCR Import Studio', icon: FileUp, adminOnly: true, badge: '4 Modes' },
    { id: 'admin-current-affairs', label: 'Current Affairs Studio', icon: Newspaper, adminOnly: true, badge: 'Pipeline' },
    { id: 'admin-ai', label: 'AI Content Studio', icon: Sparkles, adminOnly: true, badge: 'Drafts' },
  ];

  const superAdminNavItems: NavItem[] = [
    { id: 'super-admin-dashboard', label: 'Console Overview', icon: ShieldAlert, adminOnly: true },
    { id: 'super-admin-admins', label: 'Administrators & RBAC', icon: Users, adminOnly: true },
    { id: 'super-admin-audit', label: 'Security Audit Logs', icon: History, adminOnly: true },
    { id: 'super-admin-settings', label: 'System Settings', icon: SlidersHorizontal, adminOnly: true },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <div className="text-[10px] font-mono font-bold tracking-wider uppercase px-3 py-1 text-amber-400/80">
        {title}
      </div>
      <nav className="space-y-0.5">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isAITutor = item.id === 'ai-tutor';
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#35156B] text-amber-300 font-bold border-l-2 border-amber-400 shadow-xs'
                  : isAITutor
                  ? 'text-purple-300 hover:text-white hover:bg-[#121027] font-medium'
                  : 'hover:bg-[#121027] text-stone-300 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : isAITutor ? 'text-purple-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-amber-400 text-[#0C1024]'
                      : item.label === 'Revision'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                      : isAITutor
                      ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                      : 'bg-[#121027] text-stone-300 border border-stone-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside
      id="app-sidebar"
      className="hidden md:flex flex-col w-64 min-h-[calc(100vh-61px)] p-3.5 select-none bg-[#0C1024] text-stone-300 border-r border-amber-500/20 shrink-0 font-sans-editorial overflow-y-auto"
    >
      <div className="space-y-4 flex-1">
        {renderNavGroup('LEARN', learnNavItems)}
        {renderNavGroup('INTELLIGENCE', intelligenceNavItems)}
        {renderNavGroup('RESOURCES', resourcesNavItems)}
        {renderNavGroup('PLANNING', planningNavItems)}
        {renderNavGroup('ACCOUNT', accountNavItems)}

        {/* Admin Navigation */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <div className="border-t border-slate-800/80 pt-3">
            <div className="text-[10px] font-mono font-bold text-rose-400 tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN STUDIO</span>
            </div>
            <nav className="space-y-0.5">
              {adminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md font-semibold'
                        : 'hover:bg-[#121027] text-stone-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Super Admin Console */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="border-t border-amber-500/30 pt-3">
            <div className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
            <nav className="space-y-0.5">
              {superAdminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-[#0C1024] font-bold shadow-md'
                        : 'hover:bg-[#121027] text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0C1024]' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Profile Card at Sidebar Bottom */}
      <div className="border-t border-slate-800/80 pt-3 mt-auto">
        <div
          onClick={() => setActiveSection('profile')}
          className="bg-[#121027] border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer hover:border-amber-400/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#35156B] text-amber-300 border border-amber-500/30 font-bold flex items-center justify-center text-xs font-serif-editorial">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Aspirant'}</div>
            <div className="text-[10px] text-stone-400 truncate font-mono">{user?.onboarding?.targetExam || 'UPSC CSE 2026'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

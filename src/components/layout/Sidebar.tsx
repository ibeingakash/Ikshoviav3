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
  Brain,
} from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';

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

  const userNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Bot, badge: 'Active' },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'mock-tests', label: 'Mock Tests', icon: FileCheck2 },
    {
      id: 'revision',
      label: 'Revision',
      icon: RefreshCw,
      badge: learnerModel?.dueRevisionCount ? `${learnerModel.dueRevisionCount} Due` : undefined,
    },
    { id: 'graph', label: 'Knowledge Graph', icon: GitGraph },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
    { id: 'resources', label: 'Resources & PYQs', icon: FolderArchive },
    { id: 'goals', label: 'Goals & Planner', icon: Flag },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: Shield, adminOnly: true },
    { id: 'admin-users', label: 'User Directory', icon: Users, adminOnly: true },
    { id: 'admin-content', label: 'Subjects & Concepts', icon: FileSpreadsheet, adminOnly: true },
    { id: 'admin-questions', label: 'Question Bank', icon: HelpCircle, adminOnly: true },
    { id: 'admin-ocr', label: 'OCR Import Studio', icon: FileUp, adminOnly: true, badge: '4 Modes' },
    { id: 'admin-ai', label: 'AI Content Studio', icon: Sparkles, adminOnly: true, badge: 'Drafts' },
  ];

  const superAdminNavItems: NavItem[] = [
    { id: 'super-admin-dashboard', label: 'Console Overview', icon: ShieldAlert, adminOnly: true },
    { id: 'super-admin-admins', label: 'Administrators & RBAC', icon: Users, adminOnly: true },
    { id: 'super-admin-audit', label: 'Security Audit Logs', icon: History, adminOnly: true },
    { id: 'super-admin-settings', label: 'System Settings', icon: SlidersHorizontal, adminOnly: true },
  ];

  return (
    <aside
      id="app-sidebar"
      className="hidden md:flex flex-col w-64 min-h-[calc(100vh-61px)] p-3 select-none bg-[#0B1933] border-r border-[#0B1933]/30 text-slate-300 shrink-0"
    >
      <div className="space-y-6 flex-1">
        
        {/* Navigation Category Label */}
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase px-3 mb-2 flex items-center justify-between text-[#E7A91A] font-serif">
            <span>Learning Intelligence</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-[#E7A91A] border border-amber-600/50 font-sans font-bold">
              v3.0
            </span>
          </div>

          <nav className="space-y-1">
            {userNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E7A91A] text-[#0B1933] font-bold shadow-md'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B1933]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#0B1933] text-[#E7A91A]'
                          : item.label === 'Revision'
                          ? 'bg-amber-950 text-[#E7A91A] border border-amber-600/60'
                          : 'bg-indigo-950 text-indigo-200 border border-indigo-700/60'
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

        {/* Admin Navigation (Visible if user is ADMIN or SUPER_ADMIN) */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <div className="border-t border-slate-800/80 pt-3">
            <div className="text-[11px] font-bold text-rose-400 tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </div>
            <nav className="space-y-1">
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
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Super Admin Console (Visible only if user is SUPER_ADMIN) */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="border-t border-amber-500/30 pt-3">
            <div className="text-[11px] font-bold text-[#E7A91A] tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E7A91A]" />
              <span>Super Admin Console</span>
            </div>
            <nav className="space-y-1">
              {superAdminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#E7A91A] text-[#0B1933] font-bold shadow-md'
                        : 'hover:bg-slate-800/80 text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B1933]' : 'text-[#E7A91A]'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer System Info */}
      <div className="border-t border-slate-800/80 pt-3 mt-auto">
        <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-2.5 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#E7A91A] font-serif">IKSHOVIA Engine</span>
            <span className="text-emerald-400 font-extrabold text-[10px] uppercase">Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Personal Learning Intelligence Engine actively predicting retention decay.
          </p>
        </div>
      </div>
    </aside>
  );
};

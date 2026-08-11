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

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, learnerModel, appTheme } = useLearner();
  const { user } = useAuth();

  const isParchment = appTheme === 'upsc-parchment';

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
      className={`hidden md:flex flex-col w-64 min-h-[calc(100vh-57px)] p-3 select-none border-r transition-colors duration-300 ${
        isParchment
          ? 'bg-white/80 border-slate-200/90 text-slate-700 shadow-sm'
          : 'bg-[#0b1428] border-slate-800 text-slate-300'
      }`}
    >
      <div className="space-y-6 flex-1">
        {/* Main Learner Navigation */}
        <div>
          <div className={`text-[11px] font-bold tracking-wider uppercase px-3 mb-2 flex items-center justify-between ${
            isParchment ? 'text-amber-800 font-serif' : 'text-slate-400'
          }`}>
            <span>UPSC • BPSC Academy</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold">SYLLABUS</span>
          </div>
          <nav className="space-y-1">
            {userNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? isParchment
                        ? 'bg-[#0F1E36] text-amber-300 shadow-md font-bold'
                        : 'bg-amber-600 text-white shadow-md font-bold'
                      : isParchment
                      ? 'hover:bg-amber-100/60 text-slate-700 hover:text-slate-900'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (isParchment ? 'text-amber-300' : 'text-white') : (isParchment ? 'text-slate-500' : 'text-slate-400')}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-amber-400 text-slate-950'
                          : item.label === 'Revision'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
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
              <Shield className="w-3 h-3" />
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
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-semibold'
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
            <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
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
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'hover:bg-slate-800/80 text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className={`border-t pt-3 mt-auto ${isParchment ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className={`border rounded-xl p-2.5 text-[11px] space-y-1 ${
          isParchment
            ? 'bg-amber-50/80 border-amber-200 text-slate-700'
            : 'bg-slate-950/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 font-serif">Satyameva Jayate</span>
            <span className="text-emerald-600 font-extrabold text-[10px] uppercase">Active</span>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">
            Targeting UPSC & BPSC Civil Services Prelims & Mains Syllabus.
          </p>
        </div>
      </div>
    </aside>
  );
};

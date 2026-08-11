import React from 'react';
import {
  Search,
  Bell,
  Flame,
  User,
  ShieldCheck,
  Brain,
  Sparkles,
  ChevronDown,
  LogOut,
  Palette,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

export const Header: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { learnerModel, notifications, setIsSearchOpen, setActiveSection, activeSection, appTheme, setAppTheme } = useLearner();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0F1E36] text-slate-100 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 shadow-lg backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Civil Services Emblem Badge */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-indigo-900 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-300/40">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white font-serif">
                  IKSHOVIA
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-md">
                  Intelligence
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium tracking-wide hidden md:block">
                Personal Learning Intelligence Platform
              </div>
            </div>
          </div>
        </div>

        {/* Global Search Bar Button */}
        <button
          id="global-search-btn"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 transition-all w-64 shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <span className="flex-1 text-left text-slate-300">Search Polity, PYQs, Current Affairs...</span>
          <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Quick Switcher Toggle */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 p-0.5 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setAppTheme('futuristic-glass')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                appTheme === 'futuristic-glass'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Futuristic Cyber Glass Theme"
            >
              <span>⚡ Cyber</span>
            </button>
            <button
              onClick={() => setAppTheme('upsc-parchment')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                appTheme === 'upsc-parchment'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="UPSC Ivory Parchment Theme"
            >
              <span>📜 Parchment</span>
            </button>
            <button
              onClick={() => setAppTheme('bpsc-navy')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                appTheme === 'bpsc-navy'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="BPSC Royal Navy Theme"
            >
              <span>🏛️ Navy</span>
            </button>
          </div>

          {/* Search icon for mobile */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Streak Badge */}
          {learnerModel && (
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-amber-900/80 transition-colors"
              title="Daily Study Streak"
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{learnerModel.currentStreak} Days</span>
            </div>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Role-Authenticated Workspace Links */}
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveSection('super-admin-dashboard')}
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400 transition-all shadow-sm"
              title="Super Admin Control Console"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setActiveSection('admin-dashboard')}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-indigo-950/90 border-indigo-500 text-amber-300 hover:bg-indigo-900 transition-all"
              title="Admin Content Studio"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          )}

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-2.5">
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-amber-400/60 group-hover:ring-2 ring-amber-400 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-100 leading-none">{user?.name || 'IKSHOVIA User'}</div>
                <div className="text-[10px] text-amber-300/80 mt-0.5">{user?.onboarding?.targetExam || 'UPSC 2026'}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

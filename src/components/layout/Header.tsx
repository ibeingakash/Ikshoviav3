import React from 'react';
import {
  Search,
  Bell,
  Flame,
  ShieldCheck,
  Brain,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { learnerModel, notifications, setIsSearchOpen, setActiveSection } = useLearner();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0B1933] text-white border-b border-[#0B1933]/40 px-4 sm:px-6 py-3 shadow-md">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E7A91A] text-[#0B1933] flex items-center justify-center font-serif font-bold text-lg shadow-sm border border-amber-300 group-hover:scale-105 transition-transform">
              I
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-serif">
                  IKSHOVIA
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#E7A91A] bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md font-sans font-bold">
                  Intelligence
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium tracking-wide hidden md:block">
                Personal Learning Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Global Search Button */}
        <button
          id="global-search-btn"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 transition-all w-72 shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-[#E7A91A]" />
          <span className="flex-1 text-left text-slate-300">Search Polity, PYQs, Current Affairs...</span>
          <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-700"
          >
            <Search className="w-4 h-4 text-[#E7A91A]" />
          </button>

          {/* Daily Streak Pill */}
          {learnerModel && (
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 text-[#E7A91A] text-xs font-semibold px-2.5 py-1 rounded-xl cursor-pointer hover:bg-amber-900/80 transition-colors"
              title="Daily Study Streak"
            >
              <Flame className="w-4 h-4 text-[#E7A91A] fill-[#E7A91A]" />
              <span>{learnerModel.currentStreak} Days</span>
            </div>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Super Admin Badge (when authorized) */}
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveSection('super-admin-dashboard')}
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border bg-[#E7A91A] text-[#0B1933] border-amber-300 hover:bg-amber-400 transition-all shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          )}

          {/* Admin Studio Badge (when authorized) */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setActiveSection('admin-dashboard')}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border bg-indigo-950/90 border-indigo-500 text-[#E7A91A] hover:bg-indigo-900 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          )}

          {/* Dynamic Authenticated User Profile */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#E7A91A] group-hover:ring-2 ring-[#E7A91A] transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#101C35] border border-[#E7A91A]/60 flex items-center justify-center text-[#E7A91A] font-bold text-xs font-serif">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-white leading-none">{user?.name || 'Aspirant'}</div>
                <div className="text-[10px] text-[#E7A91A] mt-0.5">{user?.onboarding?.targetExam || 'UPSC CSE 2026'}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors ml-1 cursor-pointer"
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

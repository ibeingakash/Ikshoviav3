import React from 'react';
import { Search, Bell, Flame, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';
import { IKLogo } from '../common/IKLogo.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { learnerModel, notifications, setIsSearchOpen, setActiveSection } = useLearner();

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md text-[#111426] border-b border-stone-200/80 px-2.5 sm:px-6 py-2 shadow-2xs font-sans-editorial">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <IKLogo
            onClick={() => setActiveSection('dashboard')}
            showTagline={true}
            taglineText="Unlock Human Potential Through Understanding"
            size="sm"
          />
        </div>

        {/* Global Search Button */}
        <button
          id="global-search-btn"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl px-3.5 py-1.5 text-xs text-stone-600 transition-all w-80 shadow-2xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-amber-700" />
          <span className="flex-1 text-left text-stone-500">Search Polity, PYQs, Current Affairs...</span>
          <kbd className="hidden sm:inline-block bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-stone-500">
            ⌘K
          </kbd>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-1.5 rounded-xl bg-white text-stone-700 border border-stone-200 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-amber-700" />
          </button>

          {/* Daily Streak Pill */}
          {learnerModel && (
            <div
              onClick={() => setActiveSection('profile')}
              className="hidden min-[360px]:flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] sm:text-xs font-bold px-2 py-1 rounded-xl cursor-pointer hover:bg-amber-100/80 transition-colors shrink-0"
              title="Daily Study Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{learnerModel.currentStreak}d</span>
            </div>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className="relative p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Super Admin Badge (when authorized) */}
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveSection('super-admin-dashboard')}
              className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-xl border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 transition-all shadow-2xs cursor-pointer"
              title="Open Super Admin Console"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Super Admin</span>
              <span className="sm:hidden">Super</span>
            </button>
          )}

          {/* Admin Studio Badge (when authorized) */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setActiveSection('admin-dashboard')}
              className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-xl border bg-rose-50 border-rose-200 text-rose-850 hover:bg-rose-100 transition-all cursor-pointer"
              title="Open Admin Studio"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Admin Studio</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* Dynamic Authenticated User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-stone-200 pl-1.5 sm:pl-3 shrink-0">
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-200 group-hover:ring-2 ring-amber-500 transition-all"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0C1024] border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-serif-editorial">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-stone-900 leading-none">{user?.name || 'Aspirant'}</div>
                <div className="text-[10px] text-stone-500 mt-0.5 font-medium">{user?.onboarding?.targetExam || 'UPSC CSE 2026'}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1 sm:p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

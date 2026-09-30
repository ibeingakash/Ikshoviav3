import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sparkles, LogOut, ChevronDown, Smartphone, CheckCheck, BookOpen, GraduationCap, Video, Volume2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';
import { DashboardLogo } from '../common/BrandLogo.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, setIsSearchOpen, setActiveSection, markNotificationAsRead, markAllNotificationsAsRead } = useLearner();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    setIsNotificationsOpen(false);

    const link = notif.deepLink || notif.actionUrl;
    if (link) {
      if (link.includes('assignments')) {
        setActiveSection('learner-assignments');
      } else if (link.includes('classes')) {
        setActiveSection('live-classroom');
      } else if (link.includes('resources')) {
        setActiveSection('resources');
      } else if (link.includes('mock')) {
        setActiveSection('mock-tests');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT_ASSIGNED':
      case 'ASSIGNMENT_EVALUATED':
        return <GraduationCap className="w-4 h-4 text-amber-600" />;
      case 'LIVE_CLASS_STARTED':
      case 'CLASS_SCHEDULED':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'NEW_RESOURCE':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'ANNOUNCEMENT':
        return <Volume2 className="w-4 h-4 text-purple-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md text-stone-900 border-b border-[#EAE6DF] px-3 sm:px-6 py-2.5 shadow-2xs font-sans-editorial">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-0">
        
        {/* Brand Logo & Wordmark (Dashboard variant) */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <DashboardLogo
            onClick={() => setActiveSection('dashboard')}
            size="sm"
            className="hover:opacity-90 transition-opacity"
          />
        </div>

        {/* Global Search Input Trigger */}
        <div className="flex-1 max-w-xl mx-2 hidden sm:block">
          <button
            id="global-search-btn"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2.5 bg-white hover:bg-stone-50/90 border border-[#E0DBD2] rounded-2xl px-4 py-2 text-xs text-stone-600 transition-all shadow-2xs cursor-pointer group"
          >
            <Search className="w-4 h-4 text-stone-400 group-hover:text-amber-700 transition-colors shrink-0" />
            <span className="flex-1 text-left text-stone-400 font-normal">Search topics, tests, notes...</span>
            <kbd className="inline-block bg-[#F4F0E8] border border-[#E0DBD2] rounded-lg px-2 py-0.5 text-[10px] font-mono text-stone-500 font-semibold shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white text-stone-700 border border-[#EAE6DF] cursor-pointer flex items-center justify-center shadow-2xs"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-amber-700" />
          </button>

          {/* AI Assistant Quick Pill */}
          <button
            onClick={() => setActiveSection('ai-tutor')}
            className="inline-flex items-center gap-1.5 min-h-[40px] bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer group"
            title="Open AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
            <span className="tracking-tight hidden xs:inline">AI Assistant</span>
            <span className="tracking-tight xs:hidden">AI</span>
          </button>

          {/* Download Android App Button */}
          <button
            onClick={() => setActiveSection('download')}
            className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] bg-white hover:bg-stone-100 border border-[#EAE6DF] text-stone-700 hover:text-stone-900 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer"
            title="IKSHOVIA Android App"
          >
            <Smartphone className="w-3.5 h-3.5 text-stone-600" />
            <span className="tracking-tight">Get App</span>
          </button>

          {/* Notifications Button & Dropdown Drawer */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="relative min-w-[40px] min-h-[40px] p-2 rounded-full bg-white hover:bg-stone-100 text-stone-700 border border-[#EAE6DF] transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center justify-center"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-stone-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-2xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in font-sans-editorial">
                {/* Panel Header */}
                <div className="p-3.5 bg-stone-50/90 border-b border-stone-200/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-serif-editorial text-stone-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await markAllNotificationsAsRead();
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100">
                  {safeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-stone-400 space-y-1">
                      <Bell className="w-6 h-6 mx-auto text-stone-300 mb-2" />
                      <p className="font-medium text-stone-600">All caught up!</p>
                      <p className="text-[11px]">No notifications right now.</p>
                    </div>
                  ) : (
                    safeNotifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-stone-50 transition-colors cursor-pointer flex gap-3 text-xs ${
                          !notif.isRead ? 'bg-amber-50/30 font-medium' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 border border-stone-200/80">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-stone-900 truncate text-xs">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="text-[10px] text-stone-400 font-mono mt-1">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-stone-50 border-t border-stone-200/80 text-center">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      setActiveSection('settings');
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    Notification Preferences & Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with dropdown trigger */}
          <div className="flex items-center gap-1.5 border-l border-[#EAE6DF] pl-2 sm:pl-3 shrink-0">
            <div
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-2 cursor-pointer group min-h-[40px] p-1 rounded-xl hover:bg-stone-100/70 transition-all"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#EAE6DF] group-hover:ring-2 ring-amber-500 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 font-semibold flex items-center justify-center text-xs font-serif-editorial shadow-2xs">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors hidden sm:block" />
            </div>

            <button
              onClick={logout}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

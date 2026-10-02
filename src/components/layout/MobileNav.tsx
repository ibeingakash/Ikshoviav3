import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronRight,
  Shield,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  HelpCircle,
  FileUp,
  Newspaper,
  Sparkles,
  History,
  SlidersHorizontal,
  TrendingUp,
  Tag,
  Package,
  Layers,
  Key,
  CreditCard,
  Brain,
  Send,
} from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { PRIMARY_MOBILE_ITEMS, MORE_MENU_CATEGORIES, NavItemConfig } from '../../config/navigation.js';
import { DashboardLogo } from '../common/BrandLogo.js';
import { registerBackButtonHandler } from '../../lib/capacitor.js';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection, learnerModel } = useLearner();
  const { user } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close More drawer on Android hardware back button
  React.useEffect(() => {
    if (!isMoreOpen) return;
    return registerBackButtonHandler(() => {
      setIsMoreOpen(false);
      return true;
    });
  }, [isMoreOpen]);

  // Build role-aware dynamic menu categories
  const categories: { title: string; items: NavItemConfig[] }[] = [...MORE_MENU_CATEGORIES];

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    categories.push({
      title: 'ADMINISTRATION',
      items: [
        { id: 'admin-dashboard', label: 'Admin Overview', icon: Shield },
        { id: 'admin-mains-intelligence', label: 'Mains Evaluation Intelligence', icon: Brain, badge: '4.1J' },
        { id: 'admin-mains-telegram', label: 'Telegram Ingestion', icon: Send, badge: '4.1J' },
        { id: 'admin-courses', label: 'Courses & Pricing', icon: Package, badge: 'Catalog' },
        { id: 'admin-test-series', label: 'Test Series Studio', icon: Layers, badge: 'Packs' },
        { id: 'admin-commercial', label: 'Commercial Hub', icon: TrendingUp, badge: 'Finance' },
        { id: 'admin-coupons', label: 'Coupons & Offers', icon: Tag, badge: 'Discounts' },
        { id: 'admin-entitlements', label: 'Access & Subscriptions', icon: Key },
        { id: 'admin-payments', label: 'Payments & Revenue', icon: CreditCard },
        { id: 'admin-questions', label: 'Question Bank', icon: HelpCircle, badge: 'Canonical' },
        { id: 'admin-mock-builder', label: 'Mock Test Builder', icon: FileSpreadsheet },
        { id: 'admin-ocr', label: 'Content Import', icon: FileUp, badge: '4 Modes' },
        { id: 'admin-current-affairs', label: 'Current Affairs Studio', icon: Newspaper },
        { id: 'admin-content', label: 'Subjects & Concepts', icon: FileSpreadsheet },
        { id: 'admin-users', label: 'User Directory', icon: Users },
        { id: 'admin-import-logs', label: 'Import & Publish Logs', icon: History },
      ],
    });
  }

  if (user?.role === 'SUPER_ADMIN') {
    categories.push({
      title: 'SUPER ADMIN CONSOLE',
      items: [
        { id: 'super-admin-dashboard', label: 'Console Overview', icon: ShieldAlert },
        { id: 'super-admin-admins', label: 'Administrators & RBAC', icon: Users },
        { id: 'super-admin-audit', label: 'Security Audit Logs', icon: History },
        { id: 'super-admin-settings', label: 'System Settings', icon: SlidersHorizontal },
      ],
    });
  }

  // Determine if activeSection is inside the More menu
  const isMoreActive = categories.some(cat =>
    cat.items.some(item => item.id === activeSection)
  );

  const handleSelectSection = (secId: NavigationSection) => {
    setActiveSection(secId);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-stone-200/90 z-40 flex items-center justify-between py-1.5 px-1 text-stone-600 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {PRIMARY_MOBILE_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id && !isMoreOpen;
          return (
            <button
              key={item.id}
              onClick={() => {
                setIsMoreOpen(false);
                setActiveSection(item.id);
              }}
              className={`flex-1 min-w-0 max-w-[76px] flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-900 font-extrabold bg-amber-100/70 border border-amber-300'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-amber-800' : 'text-stone-400'}`} />
              <span className="leading-none truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}

        {/* More Destination Button */}
        <button
          onClick={() => setIsMoreOpen(prev => !prev)}
          className={`flex-1 min-w-0 max-w-[76px] flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
            isMoreOpen || (isMoreActive && !PRIMARY_MOBILE_ITEMS.some(i => i.id === activeSection))
              ? 'text-amber-900 font-extrabold bg-amber-100/70 border border-amber-300'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Menu className={`w-4 h-4 sm:w-5 sm:h-5 ${isMoreOpen || isMoreActive ? 'text-amber-800' : 'text-stone-400'}`} />
          <span className="leading-none truncate w-full text-center">More</span>
        </button>
      </nav>

      {/* More Sheet Backdrop & Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Slide-Up Bottom Drawer */}
          <div className="relative w-full max-w-full bg-[#FAF8F5] border-t border-amber-500/30 rounded-t-3xl p-4 sm:p-5 text-stone-900 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl space-y-6 pb-[max(2rem,env(safe-area-inset-bottom))] animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <DashboardLogo
                size="sm"
              />
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            {/* Categorized Menu Sections */}
            <div className="space-y-5">
              {categories.map(category => (
                <div key={category.title} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-mono px-1 flex items-center justify-between">
                    <span>{category.title}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {category.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      const badgeText = item.id === 'revision' && learnerModel?.dueRevisionCount
                        ? `${learnerModel.dueRevisionCount} Due`
                        : undefined;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSection(item.id)}
                          className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border text-xs font-semibold ${
                            isActive
                              ? 'bg-[#1C1917] text-amber-300 border-[#1C1917] font-bold shadow-2xs'
                              : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-amber-800'}`} />
                            <span>{item.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {badgeText && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isActive ? 'bg-[#292524] text-amber-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {badgeText}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

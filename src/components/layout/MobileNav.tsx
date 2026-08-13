import React, { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { PRIMARY_MOBILE_ITEMS, MORE_MENU_CATEGORIES } from '../../config/navigation.js';
import { IKLogo } from '../common/IKLogo.js';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection, learnerModel } = useLearner();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Determine if activeSection is inside the More menu
  const isMoreActive = MORE_MENU_CATEGORIES.some(cat =>
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
                  ? 'text-[#35156B] font-extrabold bg-amber-100/60 border border-amber-300'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-[#35156B]' : 'text-stone-400'}`} />
              <span className="leading-none truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}

        {/* More Destination Button */}
        <button
          onClick={() => setIsMoreOpen(prev => !prev)}
          className={`flex-1 min-w-0 max-w-[76px] flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
            isMoreOpen || (isMoreActive && !PRIMARY_MOBILE_ITEMS.some(i => i.id === activeSection))
              ? 'text-[#35156B] font-extrabold bg-amber-100/60 border border-amber-300'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Menu className={`w-4 h-4 sm:w-5 sm:h-5 ${isMoreOpen || isMoreActive ? 'text-[#35156B]' : 'text-stone-400'}`} />
          <span className="leading-none truncate w-full text-center">More</span>
        </button>
      </nav>

      {/* More Sheet Backdrop & Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0C1024]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Slide-Up Bottom Drawer */}
          <div className="relative w-full max-w-full bg-[#FAF7F0] border-t border-amber-500/30 rounded-t-3xl p-4 sm:p-5 text-[#111426] max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl space-y-6 pb-[max(2rem,env(safe-area-inset-bottom))] animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <IKLogo
                showTagline={true}
                taglineText="Unlock Human Potential Through Understanding"
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
              {MORE_MENU_CATEGORIES.map(category => (
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
                              ? 'bg-[#35156B] text-amber-300 border-[#35156B] font-bold shadow-2xs'
                              : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#35156B]'}`} />
                            <span>{item.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {badgeText && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isActive ? 'bg-[#121027] text-amber-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
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

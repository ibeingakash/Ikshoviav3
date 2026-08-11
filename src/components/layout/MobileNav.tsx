import React from 'react';
import { LayoutDashboard, BookOpen, Target, Bot, User } from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection } = useLearner();

  const items: { id: NavigationSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center justify-around py-2 px-1 text-slate-400">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400 animate-pulse' : ''}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

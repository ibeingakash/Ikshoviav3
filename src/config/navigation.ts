import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Target,
  FileCheck2,
  Bookmark,
  Calendar,
  BarChart3,
  Newspaper,
  FolderArchive,
  User,
  Settings,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { NavigationSection } from '../context/LearnerContext.js';

export interface NavItemConfig {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: 'LEARN' | 'PROGRESS' | 'ACCOUNT' | 'PRIMARY';
  badge?: string;
}

export const PRIMARY_MOBILE_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, category: 'PRIMARY' },
  { id: 'pyq-practice', label: 'PYQ', icon: FolderArchive, category: 'PRIMARY' },
  { id: 'mock-tests', label: 'Mocks', icon: FileCheck2, category: 'PRIMARY' },
  { id: 'practice', label: 'Practice', icon: BookOpen, category: 'PRIMARY' },
  { id: 'ai-tutor', label: 'AI Tutor', icon: Bot, category: 'PRIMARY', badge: 'Smart' },
];

export const MORE_MENU_CATEGORIES = [
  {
    title: 'LEARNING HUB',
    items: [
      { id: 'daily-quiz', label: 'Daily Quiz', icon: CheckSquare },
      { id: 'pyq-practice', label: 'Official PYQ Practice', icon: FolderArchive, badge: 'Official' },
      { id: 'mock-tests', label: 'Mock Tests & Simulations', icon: FileCheck2, badge: 'Simulations' },
      { id: 'practice', label: 'Topic & Subject Practice', icon: BookOpen },
      { id: 'goals', label: 'Study Plan', icon: Calendar },
      { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
      { id: 'notes', label: 'Notes & Syllabus', icon: FileText },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'revision', label: 'Bookmarks & Mistakes', icon: Bookmark },
      { id: 'resources', label: 'Resource Library', icon: FolderArchive },
    ] as NavItemConfig[],
  },
  {
    title: 'ACCOUNT',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] as NavItemConfig[],
  },
];


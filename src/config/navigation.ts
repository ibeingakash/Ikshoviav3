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
  { id: 'practice', label: 'Practice', icon: Target, category: 'PRIMARY' },
  { id: 'mock-tests', label: 'Mock Tests', icon: FileCheck2, category: 'PRIMARY' },
  { id: 'ai-tutor', label: 'AI Tutor', icon: Bot, category: 'PRIMARY', badge: 'Active' },
];

export const MORE_MENU_CATEGORIES = [
  {
    title: 'LEARN',
    items: [
      { id: 'revision', label: 'Revision', icon: RefreshCw },
      { id: 'graph', label: 'Knowledge Graph', icon: GitGraph },
      { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
      { id: 'resources', label: 'Resources & PYQs', icon: FolderArchive },
    ] as NavItemConfig[],
  },
  {
    title: 'PROGRESS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'goals', label: 'Goals & Planner', icon: Flag },
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

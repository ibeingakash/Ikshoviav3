import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  FileCheck2,
  Calendar,
  Newspaper,
  FileText,
  BarChart3,
  Bookmark,
  FolderArchive,
  BookOpen,
  RefreshCw,
  Shield,
  Users,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  Upload,
  ShieldAlert,
  SlidersHorizontal,
  History,
  ChevronRight,
  ChevronDown,
  Sun,
  Database,
  Layers,
  GraduationCap,
  Package,
  Key,
  Tag,
  CreditCard,
  Receipt,
  TrendingUp,
  Percent,
  Smartphone,
  Video,
  Flame,
  Compass,
  Brain,
  Send,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, learnerModel } = useLearner();
  const { user } = useAuth();

  const [learningOpen, setLearningOpen] = useState<boolean>(true);
  const [adminOpen, setAdminOpen] = useState<boolean>(true);
  const [teacherOpen, setTeacherOpen] = useState<boolean>(true);
  const [mainsIntelligenceOpen, setMainsIntelligenceOpen] = useState<boolean>(true);

  // Top General / Core Items
  const coreNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Bot, badge: 'Smart', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'daily-quiz', label: 'Daily Quiz', icon: CheckSquare, badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-800' },
  ];

  // Learning Hub Items
  const learningNavItems: NavItem[] = [
    { id: 'exam-engine', label: 'Prelims • Mains • Interview', icon: Compass, badge: 'Unified', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' },
    { id: 'ypt', label: 'YPT Focus & Groups', icon: Flame, badge: 'Focus', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
    { id: 'learner-classes', label: 'My Enrolled Classes', icon: BookOpen, badge: 'Faculty', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
    { id: 'live-classes', label: 'Live Classes & Faculty', icon: Video, badge: 'Live', badgeColor: 'bg-rose-100 text-rose-900 border border-rose-300' },
    { id: 'pyq-practice', label: 'Official PYQ Papers', icon: FolderArchive, badge: 'Official', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
    { id: 'test-series', label: 'Exam Test Series', icon: Layers, badge: 'Packs', badgeColor: 'bg-amber-100 text-amber-950 border border-amber-300' },
    { id: 'mock-tests', label: 'Mock Tests', icon: FileCheck2, badge: 'Simulations', badgeColor: 'bg-stone-100 text-stone-800 border border-stone-300' },
    { id: 'practice', label: 'Topic & Subject Practice', icon: BookOpen },
    { id: 'courses-catalog', label: 'Course Catalog & Plans', icon: Tag, badge: 'Courses', badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300' },
    { id: 'learner-purchases', label: 'My Purchases & Receipts', icon: Receipt },
    { id: 'goals', label: 'Study Plan', icon: Calendar },
    { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
    { id: 'short-notes', label: 'Short Notes & Cards', icon: BookOpen, badge: 'High Yield', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
    { id: 'notes', label: 'Notes & Syllabus', icon: FileText },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'revision', label: 'Bookmarks & Mistakes', icon: Bookmark, badge: learnerModel?.dueRevisionCount ? `${learnerModel.dueRevisionCount}` : undefined },
    { id: 'resources', label: 'Resource Library', icon: Layers, badge: 'Books', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
  ];

  // Administration Hub Items
  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: Shield },
    { id: 'admin-app-releases', label: 'App Releases & APK', icon: Smartphone, badge: 'APK', badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300' },
    { id: 'admin-resources', label: 'Resource Studio', icon: FolderArchive, badge: 'Drive', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' },
    { id: 'admin-short-notes', label: 'Short Notes Studio', icon: BookOpen, badge: 'OCR' },
    { id: 'admin-commercial', label: 'Commercial Hub', icon: TrendingUp, badge: 'Finance' },
    { id: 'admin-coupons', label: 'Coupons & Offers', icon: Tag, badge: 'Discounts' },
    { id: 'admin-users', label: 'User Management', icon: Users, badge: 'Users' },
    { id: 'admin-courses', label: 'Courses & Pricing', icon: Package, badge: 'Catalog' },
    { id: 'admin-test-series', label: 'Test Series Studio', icon: Layers, badge: 'Packs', badgeColor: 'bg-amber-100 text-amber-950 border border-amber-300' },
    { id: 'admin-entitlements', label: 'Access & Subscriptions', icon: Key, badge: 'Grants' },
    { id: 'admin-payments', label: 'Payments & Revenue', icon: CreditCard, badge: 'Razorpay' },
    { id: 'admin-questions', label: 'Question Bank', icon: Database, badge: 'Canonical' },
    { id: 'admin-mock-builder', label: 'Mock Test Builder', icon: FileCheck2 },
    { id: 'admin-ocr', label: 'Content Import', icon: Upload, badge: '4 Modes' },
    { id: 'admin-current-affairs', label: 'Current Affairs Studio', icon: Newspaper },
    { id: 'admin-content', label: 'Subjects & Concepts', icon: Layers },
    { id: 'admin-import-logs', label: 'Import & Publish Logs', icon: History },
  ];

  // Super Admin Items
  const superAdminNavItems: NavItem[] = [
    { id: 'super-admin-dashboard', label: 'Security Overview', icon: ShieldAlert },
    { id: 'super-admin-admins', label: 'Admin Permissions & RBAC', icon: Key, badge: 'RBAC' },
    { id: 'super-admin-audit', label: 'Audit Telemetry', icon: History },
  ];

  // Teacher Workspace Items
  const teacherNavItems: NavItem[] = [
    { id: 'teacher-dashboard', label: 'Faculty Overview', icon: LayoutDashboard },
    { id: 'teacher-classes', label: 'Classes & Batches', icon: BookOpen, badge: 'Cohorts' },
    { id: 'teacher-students', label: 'Assigned Students', icon: Users },
    { id: 'teacher-assignments', label: 'Assignments & Mains', icon: FileCheck2 },
    { id: 'teacher-evaluations', label: 'Answer Evaluation', icon: CheckSquare, badge: 'Grading' },
    { id: 'teacher-quizzes', label: 'Quizzes & Tests', icon: Database },
    { id: 'teacher-resources', label: 'Handouts & Notes', icon: FolderArchive },
    { id: 'teacher-live', label: 'Live Classroom', icon: Video, badge: 'WebRTC' },
    { id: 'teacher-announcements', label: 'Notice Board', icon: Newspaper },
    { id: 'teacher-analytics', label: 'Cohort Analytics', icon: BarChart3 },
  ];

  const isMainsActive =
    activeSection === 'admin-mains-intelligence' ||
    activeSection === 'admin-mains-readiness' ||
    activeSection === 'admin-mains-remediation' ||
    activeSection === 'admin-mains-growth' ||
    activeSection === 'admin-mains-telegram';

  const isSectionActive = (itemId: NavigationSection, label: string) => {
    if (activeSection === itemId) return true;
    if (itemId === 'teacher-dashboard' && activeSection === 'teacher-dashboard') return true;
    if (itemId.startsWith('teacher-') && activeSection === itemId) return true;
    if (itemId === 'learner-classes' && (activeSection === 'learner-classes' || activeSection === 'learner-assignments')) return true;
    if (itemId === 'ypt' && (activeSection === 'ypt' || activeSection === 'ypt-groups')) return true;
    if (itemId === 'pyq-practice' && (activeSection === 'pyq-practice' || activeSection === 'practice-pyq' || activeSection === 'mock-pyq')) return true;
    if (itemId === 'mock-tests' && (activeSection === 'mock-tests' || activeSection === 'mock-custom' || activeSection === 'mock-attempts')) return true;
    if (itemId === 'practice' && (activeSection === 'practice' || activeSection === 'practice-subject' || activeSection === 'practice-full')) return true;
    if (label.includes('Daily Quiz') && (activeSection === 'daily-quiz')) return true;
    if (label.includes('Bookmarks') && (activeSection === 'revision' || activeSection === 'bookmarks')) return true;
    if (itemId === 'short-notes' && (activeSection === 'short-notes')) return true;
    if (itemId === 'admin-short-notes' && (activeSection === 'admin-short-notes')) return true;
    if (itemId === 'admin-mains-intelligence' && (activeSection === 'admin-mains-intelligence')) return true;
    if (itemId === 'admin-mains-readiness' && (activeSection === 'admin-mains-readiness')) return true;
    if (itemId === 'admin-mains-remediation' && (activeSection === 'admin-mains-remediation')) return true;
    if (itemId === 'admin-mains-growth' && (activeSection === 'admin-mains-growth')) return true;
    if (itemId === 'admin-mains-telegram' && (activeSection === 'admin-mains-telegram')) return true;
    if (itemId === 'admin-app-releases' && (activeSection === 'admin-app-releases' || activeSection === 'admin-releases')) return true;
    if ((itemId === 'admin-resources' || label.includes('Resource Studio')) && (activeSection === 'admin-resources' || activeSection === 'admin-resource-studio')) return true;
    if (itemId === 'notes' && activeSection === 'notes') return true;
    if (itemId === 'resources' && activeSection === 'resources') return true;
    if (label.includes('Content Import') && (activeSection === 'admin-ocr' || activeSection === 'admin-content-import')) return true;
    return false;
  };

  return (
    <aside
      id="app-sidebar"
      className="hidden md:flex flex-col w-64 min-h-[calc(100vh-61px)] bg-[#FCFBF9] text-stone-700 border-r border-[#EAE6DF] shrink-0 font-sans-editorial select-none p-3.5"
    >
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Core Nav */}
        <div className="space-y-1">
          {coreNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = isSectionActive(item.id, item.label);
            const isAITutor = item.id === 'ai-tutor';

            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-50/90 text-amber-950 font-bold border border-amber-200/80 shadow-2xs'
                    : isAITutor
                    ? 'text-stone-800 hover:bg-amber-50/40 hover:text-amber-900 font-medium'
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-700' : isAITutor ? 'text-amber-600' : 'text-stone-400'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* LEARNING HUB */}
        <div className="border-t border-[#EAE6DF] pt-3">
          <button
            onClick={() => setLearningOpen(prev => !prev)}
            className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase px-3 py-1 mb-1 hover:text-stone-700 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-stone-500" />
              <span>LEARNING HUB</span>
            </div>
            {learningOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {learningOpen && (
            <div className="space-y-0.5 mt-1">
              {learningNavItems.map(item => {
                const Icon = item.icon;
                const isActive = isSectionActive(item.id, item.label);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-50/90 text-amber-950 font-bold border border-amber-200/80 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* TEACHER / FACULTY WORKSPACE */}
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <div className="border-t border-[#EAE6DF] pt-3">
            <button
              onClick={() => setTeacherOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-amber-800 tracking-wider uppercase px-3 py-1 mb-1 hover:text-amber-950 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>TEACHER WORKSPACE</span>
              </div>
              {teacherOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {teacherOpen && (
              <div className="space-y-0.5 mt-1">
                {teacherNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = isSectionActive(item.id, item.label);

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'hover:bg-amber-50/60 text-stone-600 hover:text-amber-950 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ADMINISTRATION */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <div className="border-t border-[#EAE6DF] pt-3">
            <button
              onClick={() => setAdminOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase px-3 py-1 mb-1 hover:text-stone-700 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>ADMINISTRATION</span>
              </div>
              {adminOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {adminOpen && (
              <div className="space-y-0.5 mt-1">
                {/* Admin Overview (first item) */}
                {adminNavItems.slice(0, 1).map(item => {
                  const Icon = item.icon;
                  const isActive = isSectionActive(item.id, item.label);

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-white font-bold shadow-2xs'
                          : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* MAINS EVALUATION INTELLIGENCE (PHASE 4.1J HIERARCHICAL ENTRY) */}
                <div className="my-1">
                  <button
                    onClick={() => {
                      setMainsIntelligenceOpen(prev => !prev);
                      if (!isMainsActive) {
                        setActiveSection('admin-mains-intelligence');
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isMainsActive
                        ? 'bg-amber-950 text-amber-100 font-bold shadow-2xs'
                        : 'hover:bg-amber-50/70 text-stone-700 hover:text-stone-900 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Brain className={`w-3.5 h-3.5 shrink-0 ${isMainsActive ? 'text-amber-400' : 'text-amber-700'}`} />
                      <span className="truncate">Mains Evaluation Intelligence</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isMainsActive ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        4.1J
                      </span>
                      {mainsIntelligenceOpen ? (
                        <ChevronDown className={`w-3.5 h-3.5 ${isMainsActive ? 'text-amber-300' : 'text-stone-400'}`} />
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 ${isMainsActive ? 'text-amber-300' : 'text-stone-400'}`} />
                      )}
                    </div>
                  </button>

                  {mainsIntelligenceOpen && (
                    <div className="ml-3 pl-2.5 my-1 space-y-0.5 border-l-2 border-amber-300/80">
                      {[
                        { id: 'admin-mains-intelligence' as NavigationSection, label: 'Overview', icon: BarChart3, badge: 'KPIs' },
                        { id: 'admin-mains-readiness' as NavigationSection, label: 'Training Readiness', icon: ShieldAlert, badge: '4.1G' },
                        { id: 'admin-mains-remediation' as NavigationSection, label: 'Dataset Remediation', icon: ShieldCheck, badge: '4.1H' },
                        { id: 'admin-mains-growth' as NavigationSection, label: 'Dataset Growth', icon: Target, badge: '4.1I' },
                        { id: 'admin-mains-telegram' as NavigationSection, label: 'Telegram Ingestion', icon: Send, badge: '4.1J' },
                      ].map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setActiveSection(sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300/80 shadow-2xs'
                                : 'hover:bg-amber-50/60 text-stone-600 hover:text-stone-900 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-amber-800' : 'text-stone-400'}`} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                                  isSubActive ? 'bg-amber-300 text-amber-950' : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Remaining Admin Navigation Items */}
                {adminNavItems.slice(1).map(item => {
                  const Icon = item.icon;
                  const isActive = isSectionActive(item.id, item.label);

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-white font-bold shadow-2xs'
                          : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUPER ADMIN CONSOLE */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="border-t border-[#EAE6DF] pt-3">
            <div className="text-[10px] font-mono font-bold text-amber-800 tracking-wider uppercase px-3 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
            <div className="space-y-0.5">
              {superAdminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'hover:bg-amber-50 text-stone-600 hover:text-amber-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Card at Bottom */}
      <div className="pt-3 mt-2 border-t border-[#EAE6DF]">
        <div
          onClick={() => setActiveSection('profile')}
          className="bg-white border border-[#EAE6DF] rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:border-amber-400 hover:shadow-2xs transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 font-bold flex items-center justify-center text-xs font-serif-editorial shrink-0 shadow-2xs">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden min-w-0 text-left">
              <div className="text-xs font-bold text-stone-900 truncate">{user?.name || 'Aspirant'}</div>
              <div className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                <span>{user?.role || 'STUDENT'} • Profile</span>
              </div>
            </div>
          </div>
          <Sun className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  Award,
  FileQuestion,
  FolderArchive,
  Video,
  Bell,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import { TeacherDashboardView } from './TeacherDashboardView.js';
import { TeacherClassesView } from './TeacherClassesView.js';
import { TeacherStudentsView } from './TeacherStudentsView.js';
import { TeacherAssignmentsView } from './TeacherAssignmentsView.js';
import { TeacherEvaluationsView } from './TeacherEvaluationsView.js';
import { TeacherQuizzesView } from './TeacherQuizzesView.js';
import { TeacherResourcesView } from './TeacherResourcesView.js';
import { TeacherLiveClassesView } from './TeacherLiveClassesView.js';
import { TeacherAnnouncementsView } from './TeacherAnnouncementsView.js';
import { TeacherAnalyticsView } from './TeacherAnalyticsView.js';
import { MainsFacultyReviewQueueView } from './MainsFacultyReviewQueueView.js';

export type TeacherTab =
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'assignments'
  | 'evaluations'
  | 'mains-ground-truth'
  | 'quizzes'
  | 'resources'
  | 'live'
  | 'announcements'
  | 'analytics';

interface TeacherWorkspaceViewProps {
  initialTab?: TeacherTab;
}

export const TeacherWorkspaceView: React.FC<TeacherWorkspaceViewProps> = ({
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>(initialTab);
  const [targetAssignmentId, setTargetAssignmentId] = useState<string | undefined>(undefined);

  const tabs: Array<{ id: TeacherTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes & Batches', icon: BookOpen },
    { id: 'students', label: 'Assigned Students', icon: Users },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
    { id: 'evaluations', label: 'Answer Evaluations', icon: Award },
    { id: 'mains-ground-truth', label: 'Mains Ground Truth', icon: ClipboardCheck },
    { id: 'quizzes', label: 'Quizzes & Tests', icon: FileQuestion },
    { id: 'resources', label: 'Handouts & Notes', icon: FolderArchive },
    { id: 'live', label: 'Live Classes', icon: Video },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_class':
        setActiveTab('classes');
        break;
      case 'create_assignment':
        setActiveTab('assignments');
        break;
      case 'create_quiz':
        setActiveTab('quizzes');
        break;
      case 'upload_resource':
        setActiveTab('resources');
        break;
      case 'start_live':
        setActiveTab('live');
        break;
      case 'evaluate':
        setActiveTab('evaluations');
        break;
      default:
        break;
    }
  };

  const handleEvaluateAssignment = (assignmentId: string) => {
    setTargetAssignmentId(assignmentId);
    setActiveTab('evaluations');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-16">
      {/* Top Workspace Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-2xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm font-serif-editorial text-stone-900">
                  IKSHOVIA Teacher Workspace
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.2 rounded-full">
                  Faculty Portal
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Ribbon */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'evaluations') setTargetAssignmentId(undefined);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <TeacherDashboardView
            onNavigateTab={tab => setActiveTab(tab as TeacherTab)}
            onQuickAction={handleQuickAction}
          />
        )}
        {activeTab === 'classes' && <TeacherClassesView />}
        {activeTab === 'students' && <TeacherStudentsView />}
        {activeTab === 'assignments' && (
          <TeacherAssignmentsView onEvaluateAssignment={handleEvaluateAssignment} />
        )}
        {activeTab === 'evaluations' && (
          <TeacherEvaluationsView initialAssignmentId={targetAssignmentId} />
        )}
        {activeTab === 'mains-ground-truth' && (
          <MainsFacultyReviewQueueView />
        )}
        {activeTab === 'quizzes' && <TeacherQuizzesView />}
        {activeTab === 'resources' && <TeacherResourcesView />}
        {activeTab === 'live' && <TeacherLiveClassesView />}
        {activeTab === 'announcements' && <TeacherAnnouncementsView />}
        {activeTab === 'analytics' && <TeacherAnalyticsView />}
      </main>
    </div>
  );
};

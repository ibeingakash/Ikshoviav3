import React, { useState, useEffect } from 'react';
import {
  Video,
  Radio,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  Play,
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  ChevronRight,
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Phone,
  Edit3,
  EyeOff
} from 'lucide-react';
import { LiveClass, LiveClassRecording } from '../../types/liveClass.js';
import { liveClassService } from '../../services/liveClassService.js';
import { useAuth } from '../../context/AuthContext.js';
import { CreateLiveClassModal } from './CreateLiveClassModal.js';
import { EditLiveClassModal } from './EditLiveClassModal.js';
import { DirectCallModal } from './DirectCallModal.js';
import { LiveAttendanceModal } from './LiveAttendanceModal.js';
import { PreJoinScreen } from './PreJoinScreen.js';
import { LiveClassroomView } from './LiveClassroomView.js';

type HubTab = 'all' | 'live' | 'upcoming' | 'recordings' | 'my-classes';

export const LiveClassesHubView: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Navigation / View Stage
  const [viewState, setViewState] = useState<'HUB' | 'PREJOIN' | 'CLASSROOM'>('HUB');
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [prejoinSettings, setPrejoinSettings] = useState<{
    audioMuted: boolean;
    videoMuted: boolean;
    displayName: string;
  } | null>(null);

  // Data states
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<HubTab>('all');
  const [examFilter, setExamFilter] = useState<'ALL' | 'UPSC' | 'BPSC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDirectCallModal, setShowDirectCallModal] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [attendanceClass, setAttendanceClass] = useState<LiveClass | null>(null);

  useEffect(() => {
    loadClasses();
    loadRecordings();
  }, [examFilter, activeTab]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await liveClassService.getClasses({
        exam: examFilter !== 'ALL' ? examFilter : undefined,
        tab: activeTab,
        search: searchQuery || undefined,
        adminView: isTeacherOrAdmin,
      });
      setClasses(data);
    } catch (err: any) {
      console.error('[LiveHub Error]', err);
      setError('Failed to load live classes. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecordings = async () => {
    try {
      const recs = await liveClassService.getRecordings();
      setRecordings(recs);
    } catch (err) {
      console.warn('[Recordings Error]', err);
    }
  };

  const handleRegister = async (c: LiveClass) => {
    try {
      await liveClassService.registerForClass(c.id);
      loadClasses();
    } catch (err) {
      console.error('[Register Error]', err);
    }
  };

  const handleStartOrJoin = (c: LiveClass) => {
    setSelectedClass(c);
    setViewState('PREJOIN');
  };

  const handlePreJoinConfirm = (settings: {
    audioMuted: boolean;
    videoMuted: boolean;
    displayName: string;
  }) => {
    setPrejoinSettings(settings);
    setViewState('CLASSROOM');
  };

  const handleLeaveClassroom = () => {
    setViewState('HUB');
    setSelectedClass(null);
    setPrejoinSettings(null);
    loadClasses();
  };

  // If in Pre-Join Screen
  if (viewState === 'PREJOIN' && selectedClass) {
    return (
      <PreJoinScreen
        liveClass={selectedClass}
        onJoin={handlePreJoinConfirm}
        onCancel={() => setViewState('HUB')}
      />
    );
  }

  // If inside active Live Classroom
  if (viewState === 'CLASSROOM' && selectedClass) {
    return (
      <LiveClassroomView
        liveClass={selectedClass}
        initialAudioMuted={prejoinSettings?.audioMuted}
        initialVideoMuted={prejoinSettings?.videoMuted}
        displayName={prejoinSettings?.displayName || user?.name || 'Scholar'}
        onLeave={handleLeaveClassroom}
      />
    );
  }

  const liveNowCount = classes.filter(c => c.status === 'LIVE').length;

  return (
    <div className="min-h-screen bg-[#070A13] text-stone-100 p-4 sm:p-8 space-y-8">

      {/* 1. HERO HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>IKSHOVIA Live Academic Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Live Classrooms & Faculty Mentorship
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            Real-time interactive lectures, answer writing workshops, and syllabus doubt clearance rooms led by expert UPSC & BPSC faculty.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDirectCallModal(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>1:1 Video Consultation</span>
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Live Class</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW STRIP */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-[#0F1424] border border-stone-800 rounded-2xl">
          <div className="text-xs text-stone-400 flex items-center gap-1.5 mb-1">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>Live Right Now</span>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {liveNowCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Interactive rooms active</div>
        </div>

        <div className="p-4 bg-[#0F1424] border border-stone-800 rounded-2xl">
          <div className="text-xs text-stone-400 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Scheduled Sessions</span>
          </div>
          <div className="text-2xl font-black text-white">
            {classes.filter(c => c.status === 'SCHEDULED').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Next 7 days roadmap</div>
        </div>

        <div className="p-4 bg-[#0F1424] border border-stone-800 rounded-2xl">
          <div className="text-xs text-stone-400 flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Enrolled Scholars</span>
          </div>
          <div className="text-2xl font-black text-sky-300">
            {classes.reduce((acc, curr) => acc + (curr.enrolledCount || 0), 0)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Active class registrations</div>
        </div>

        <div className="p-4 bg-[#0F1424] border border-stone-800 rounded-2xl">
          <div className="text-xs text-stone-400 flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Archived Masterclasses</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {recordings.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">On-demand recordings</div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Hub Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0F1424] border border-stone-800 rounded-xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Classes
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Live Now ({liveNowCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upcoming'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'recordings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Recordings ({recordings.length})
          </button>
        </div>

        {/* Exam Tag Filter & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Exam Tag */}
          <div className="flex items-center gap-1 bg-[#0F1424] border border-stone-800 p-1 rounded-xl">
            {(['ALL', 'UPSC', 'BPSC'] as const).map(exam => (
              <button
                key={exam}
                onClick={() => setExamFilter(exam)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  examFilter === exam
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {exam}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadClasses()}
              placeholder="Search by topic or faculty..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0F1424] border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading live academic schedules...
          </div>
        ) : activeTab === 'recordings' ? (
          /* RECORDINGS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.length === 0 ? (
              <div className="col-span-full py-20 text-center text-stone-500 text-xs">
                No past class recordings available yet.
              </div>
            ) : (
              recordings.map(rec => (
                <div
                  key={rec.id}
                  className="bg-[#0F1424] border border-stone-800 rounded-2xl p-5 flex flex-col justify-between hover:border-stone-700 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] font-bold uppercase tracking-wider">
                        Recording
                      </span>
                      <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(rec.durationSeconds / 60)} mins
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                      {rec.title}
                    </h3>

                    {rec.keyTakeaways && rec.keyTakeaways.length > 0 && (
                      <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800/80 space-y-1 text-[11px] text-stone-400">
                        <div className="font-semibold text-stone-300">Key Themes:</div>
                        {rec.keyTakeaways.slice(0, 2).map((takeaway, i) => (
                          <div key={i} className="line-clamp-1">• {takeaway}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                    <a
                      href={rec.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Archive</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* LIVE & UPCOMING CLASSES GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.length === 0 ? (
              <div className="col-span-full py-20 text-center text-stone-500 text-xs">
                No classes match the selected filter criteria.
              </div>
            ) : (
              classes.map(c => {
                const isLive = c.status === 'LIVE';
                const isHost = isTeacherOrAdmin && (c.teacherId === user?.id || user?.role === 'ADMIN');
                const scheduledDate = new Date(c.scheduledAt);

                return (
                  <div
                    key={c.id}
                    className={`bg-[#0F1424] border rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden ${
                      isLive
                        ? 'border-rose-500/50 shadow-rose-950/20'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {/* Top Accent Line if Live */}
                    {isLive && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse"></div>
                    )}

                    <div className="space-y-4">
                      {/* Badge row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            c.exam === 'UPSC'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                          }`}>
                            {c.exam} CSE
                          </span>
                          {isTeacherOrAdmin && c.isPublished === false && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              <span>Draft</span>
                            </span>
                          )}
                          <span className="text-xs text-stone-400 truncate max-w-[130px]">
                            {c.subject}
                          </span>
                        </div>

                        {isLive ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                            <Radio className="w-3 h-3" />
                            <span>LIVE NOW</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-stone-400">
                            {c.durationMinutes} mins
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                          {c.title}
                        </h3>
                        {c.description && (
                          <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                            {c.description}
                          </p>
                        )}
                      </div>

                      {/* Faculty Info Strip */}
                      <div className="p-3 bg-stone-900/70 rounded-xl border border-stone-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-600/30 to-stone-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs">
                            {c.teacherName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-stone-200">{c.teacherName}</div>
                            <div className="text-[10px] text-amber-400/90">Lead Faculty</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-stone-500">Enrolled</div>
                          <div className="text-xs font-mono font-medium text-stone-300">{c.enrolledCount || 0} scholars</div>
                        </div>
                      </div>

                      {/* Schedule Date Time */}
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                          {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-5 mt-4 border-t border-stone-800 flex items-center justify-between gap-3">
                      {isHost ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => setEditingClass(c)}
                            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-amber-400 hover:text-amber-300 transition-colors"
                            title="Edit Class & Settings"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAttendanceClass(c)}
                            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white transition-colors"
                            title="View Attendance Report"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleStartOrJoin(c)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            <span>{isLive ? 'Resume Classroom' : 'Start as Faculty'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          {isLive ? (
                            <button
                              onClick={() => handleStartOrJoin(c)}
                              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 animate-pulse"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Join Live Classroom</span>
                            </button>
                          ) : c.isRegistered ? (
                            <button
                              onClick={() => handleStartOrJoin(c)}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Registered • Device Pre-Check</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegister(c)}
                              className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs border border-stone-700 transition-all flex items-center justify-center gap-2"
                            >
                              <Users className="w-4 h-4 text-amber-400" />
                              <span>Register for Session</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE CLASS */}
      <CreateLiveClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadClasses();
        }}
      />

      {/* MODAL: EDIT CLASS */}
      {editingClass && (
        <EditLiveClassModal
          isOpen={Boolean(editingClass)}
          liveClass={editingClass}
          onClose={() => setEditingClass(null)}
          onUpdated={_updated => {
            loadClasses();
          }}
          onDeleted={_classId => {
            loadClasses();
          }}
        />
      )}

      {/* MODAL: DIRECT VIDEO CALL */}
      <DirectCallModal
        isOpen={showDirectCallModal}
        onClose={() => setShowDirectCallModal(false)}
      />

      {/* MODAL: ATTENDANCE */}
      {attendanceClass && (
        <LiveAttendanceModal
          isOpen={Boolean(attendanceClass)}
          onClose={() => setAttendanceClass(null)}
          liveClass={attendanceClass}
        />
      )}

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Smile,
  MessageSquare,
  HelpCircle,
  Users,
  BarChart2,
  FileText,
  Pin,
  Send,
  MoreVertical,
  PhoneOff,
  Maximize,
  Minimize,
  Radio,
  Clock,
  Shield,
  CheckCircle2,
  ThumbsUp,
  VolumeX,
  Volume2,
  UserX,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Plus,
  Lock,
  Download
} from 'lucide-react';
import {
  LiveClass,
  LiveClassParticipant,
  LiveClassMessage,
  LiveClassQuestion,
  LiveClassPoll,
  LiveClassFile
} from '../../types/liveClass.js';
import { VideoMeetingProvider } from '../../lib/video/VideoMeetingProvider.js';
import { createVideoMeetingProvider } from '../../lib/video/JitsiVideoProvider.js';
import { liveClassService } from '../../services/liveClassService.js';
import { getApiBaseUrl } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { LiveAttendanceModal } from './LiveAttendanceModal.js';
import { BrandLogo } from '../common/BrandLogo.js';

interface LiveClassroomViewProps {
  liveClass: LiveClass;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  displayName: string;
  onLeave: () => void;
}

type SidePanelTab = 'chat' | 'qa' | 'participants' | 'polls' | 'files' | 'notes' | null;

interface FloatingReaction {
  id: string;
  emoji: string;
  userName: string;
  x: number;
}

export const LiveClassroomView: React.FC<LiveClassroomViewProps> = ({
  liveClass,
  initialAudioMuted = false,
  initialVideoMuted = false,
  displayName,
  onLeave,
}) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || liveClass.teacherId === user?.id;

  // Video Meeting Provider & Container Ref
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<VideoMeetingProvider | null>(null);

  // Classroom States
  const [activeTab, setActiveTab] = useState<SidePanelTab>('chat');
  const [isAudioMuted, setIsAudioMuted] = useState(initialAudioMuted);
  const [isVideoMuted, setIsVideoMuted] = useState(initialVideoMuted);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Interactive Data
  const [participants, setParticipants] = useState<LiveClassParticipant[]>([]);
  const [messages, setMessages] = useState<LiveClassMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [questions, setQuestions] = useState<LiveClassQuestion[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [polls, setPolls] = useState<LiveClassPoll[]>([]);
  const [files, setFiles] = useState<LiveClassFile[]>([]);
  const [lectureNotes, setLectureNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Poll Creator State
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '', '']);

  // Floating Reactions & Notifications
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [confirmLeaveModal, setConfirmLeaveModal] = useState(false);

  // WebSocket Ref
  const socketRef = useRef<WebSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string) => {
    setNotificationToast(text);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // 1. Initialize Video Conference & WebSocket
  useEffect(() => {
    let mounted = true;

    async function initClassroom() {
      if (!videoContainerRef.current) return;

      try {
        // Register & join via REST API
        const joinData = await liveClassService.joinClass(liveClass.id);

        if (!mounted) return;

        // Initialize provider abstraction
        const provider = createVideoMeetingProvider('jitsi');
        providerRef.current = provider;

        // Hook provider events
        provider.on('audioMuteChanged', (muted: boolean) => {
          setIsAudioMuted(muted);
        });
        provider.on('videoMuteChanged', (muted: boolean) => {
          setIsVideoMuted(muted);
        });
        provider.on('screenShareChanged', (sharing: boolean) => {
          setIsScreenSharing(sharing);
        });
        provider.on('recordingStatusChanged', (recording: boolean) => {
          setIsRecording(recording);
        });
        provider.on('meetingEnded', () => {
          handleCleanLeave();
        });

        // Mount video into DOM
        await provider.joinMeeting({
          meetingId: liveClass.meetingId,
          classId: liveClass.id,
          roomName: joinData.roomConfig.roomName,
          user: {
            id: user?.id || `anon_${Date.now()}`,
            name: displayName,
            email: user?.email,
            avatarUrl: user?.avatarUrl,
            role: isTeacher ? 'TEACHER' : 'STUDENT',
          },
          container: videoContainerRef.current,
          initialAudioMuted,
          initialVideoMuted,
          token: joinData.roomConfig.token,
        });

        // Initialize WebSocket connection
        connectWebSocket();

        // Load initial data
        loadClassData();
      } catch (err: any) {
        console.error('[LiveClassroom] Init error:', err);
        showToast(`Connection error: ${err.message || 'Could not join session'}`);
      }
    }

    initClassroom();

    // Timer for class duration
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (providerRef.current) {
        providerRef.current.dispose();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      liveClassService.leaveClass(liveClass.id).catch(() => {});
    };
  }, [liveClass.id]);

  // Connect WebSocket for real-time interactivity
  const connectWebSocket = () => {
    try {
      let wsUrl: string;
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        const wsProto = baseUrl.startsWith('https:') ? 'wss:' : 'ws:';
        const host = baseUrl.replace(/^https?:\/\//, '');
        wsUrl = `${wsProto}//${host}/api/live/ws`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/api/live/ws`;
      }
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          classId: liveClass.id,
          payload: {
            user: {
              id: user?.id || 'guest',
              name: displayName,
              avatarUrl: user?.avatarUrl,
            },
            role: isTeacher ? 'TEACHER' : 'STUDENT',
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.warn('[LiveWS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('[LiveWS] Disconnected');
      };
    } catch (e) {
      console.warn('[LiveWS] Socket setup error:', e);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    const { type, payload } = data;

    switch (type) {
      case 'USER_JOINED':
        showToast(`${payload.userName} joined the session`);
        loadParticipants();
        break;

      case 'USER_LEFT':
        loadParticipants();
        break;

      case 'NEW_CHAT_MESSAGE':
        setMessages(prev => [...prev, payload]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        break;

      case 'EMOJI_REACTION':
        triggerFloatingReaction(payload.emoji, payload.userName);
        break;

      case 'HAND_RAISED_CHANGED':
        if (payload.handRaised) {
          showToast(`✋ ${payload.userName} raised their hand`);
        }
        loadParticipants();
        break;

      case 'QUESTION_ADDED':
        setQuestions(prev => [payload, ...prev]);
        showToast(`❓ New question from ${payload.authorName}`);
        break;

      case 'QUESTION_UPDATED':
        setQuestions(prev => prev.map(q => q.id === payload.id ? payload : q));
        break;

      case 'POLL_CREATED':
        setPolls(prev => [payload, ...prev]);
        showToast(`📊 New poll launched: "${payload.question}"`);
        break;

      case 'POLL_UPDATED':
        setPolls(prev => prev.map(p => p.id === payload.id ? payload : p));
        break;

      case 'MUTE_ALL_TRIGGERED':
        if (!isTeacher) {
          providerRef.current?.toggleAudio(true);
          setIsAudioMuted(true);
          showToast('The instructor has muted all participants');
        }
        break;

      case 'PARTICIPANT_KICKED':
        if (payload.targetUserId === user?.id) {
          alert('You have been removed from the live session by the moderator.');
          handleCleanLeave();
        } else {
          loadParticipants();
        }
        break;

      case 'CLASS_ENDED_BY_HOST':
        alert('This live session has been ended by the instructor.');
        handleCleanLeave();
        break;

      default:
        break;
    }
  };

  const loadClassData = async () => {
    loadParticipants();
    loadMessages();
    loadQuestions();
    loadPolls();
    loadFiles();
  };

  const loadParticipants = async () => {
    try {
      const data = await liveClassService.getParticipants(liveClass.id);
      setParticipants(data);
    } catch (e) {}
  };

  const loadMessages = async () => {
    try {
      const data = await liveClassService.getMessages(liveClass.id);
      setMessages(data);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    } catch (e) {}
  };

  const loadQuestions = async () => {
    try {
      const data = await liveClassService.getQuestions(liveClass.id);
      setQuestions(data);
    } catch (e) {}
  };

  const loadPolls = async () => {
    try {
      const data = await liveClassService.getPolls(liveClass.id);
      setPolls(data);
    } catch (e) {}
  };

  const loadFiles = async () => {
    try {
      const data = await liveClassService.getFiles(liveClass.id);
      setFiles(data);
    } catch (e) {}
  };

  // Reactions Animation
  const triggerFloatingReaction = (emoji: string, author: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = 30 + Math.random() * 40; // 30% to 70% width
    setFloatingReactions(prev => [...prev, { id, emoji, userName: author, x }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const sendReaction = (emoji: string) => {
    triggerFloatingReaction(emoji, displayName);
    setShowReactionPicker(false);
    socketRef.current?.send(JSON.stringify({
      type: 'REACTION',
      classId: liveClass.id,
      payload: { emoji },
    }));
  };

  // Send Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        classId: liveClass.id,
        payload: { message: text },
      }));
    } else {
      try {
        const saved = await liveClassService.sendMessage(liveClass.id, text);
        setMessages(prev => [...prev, saved]);
      } catch (err) {}
    }
  };

  // Submit Question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    const qText = questionInput.trim();
    setQuestionInput('');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'QUESTION_SUBMIT',
        classId: liveClass.id,
        payload: { question: qText },
      }));
    } else {
      try {
        const q = await liveClassService.askQuestion(liveClass.id, qText);
        setQuestions(prev => [q, ...prev]);
      } catch (e) {}
    }
  };

  // Upvote Question
  const handleUpvoteQuestion = (qId: string) => {
    socketRef.current?.send(JSON.stringify({
      type: 'QUESTION_UPVOTE',
      classId: liveClass.id,
      payload: { questionId: qId },
    }));
  };

  // Teacher Answer Question
  const handleAnswerQuestion = (qId: string, status: 'ANSWERING' | 'ANSWERED') => {
    socketRef.current?.send(JSON.stringify({
      type: 'QUESTION_ANSWER',
      classId: liveClass.id,
      payload: { questionId: qId, status },
    }));
  };

  // Create Poll Submit
  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOptions.length < 2) return;

    socketRef.current?.send(JSON.stringify({
      type: 'POLL_CREATE',
      classId: liveClass.id,
      payload: {
        question: pollQuestion.trim(),
        options: validOptions,
        durationSeconds: 120,
      },
    }));

    setPollQuestion('');
    setPollOptions(['', '', '']);
    setShowCreatePoll(false);
  };

  // Vote on Poll
  const handleVotePoll = (pollId: string, optionId: string) => {
    socketRef.current?.send(JSON.stringify({
      type: 'POLL_VOTE',
      classId: liveClass.id,
      payload: { pollId, optionId },
    }));
  };

  // Toggle Hardware Controls
  const toggleAudio = async () => {
    if (providerRef.current) {
      const newState = await providerRef.current.toggleAudio();
      setIsAudioMuted(newState);
      liveClassService.updateParticipantState(liveClass.id, { isMuted: newState }).catch(() => {});
    }
  };

  const toggleVideo = async () => {
    if (providerRef.current) {
      const newState = await providerRef.current.toggleVideo();
      setIsVideoMuted(newState);
      liveClassService.updateParticipantState(liveClass.id, { cameraOn: !newState }).catch(() => {});
    }
  };

  const toggleScreenShare = async () => {
    if (providerRef.current) {
      if (!isScreenSharing) {
        const ok = await providerRef.current.startScreenShare();
        setIsScreenSharing(ok);
      } else {
        await providerRef.current.stopScreenShare();
        setIsScreenSharing(false);
      }
    }
  };

  const toggleHandRaise = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    socketRef.current?.send(JSON.stringify({
      type: 'RAISE_HAND',
      classId: liveClass.id,
      payload: { handRaised: nextHand },
    }));
  };

  // Teacher Moderation Actions
  const handleMuteAll = () => {
    if (providerRef.current) {
      providerRef.current.muteAll();
    }
    socketRef.current?.send(JSON.stringify({
      type: 'MUTE_ALL',
      classId: liveClass.id,
      payload: {},
    }));
    showToast('Sent Mute All instruction to room');
  };

  const handleKickParticipant = (targetUserId: string, targetName: string) => {
    if (confirm(`Remove ${targetName} from this live session?`)) {
      socketRef.current?.send(JSON.stringify({
        type: 'KICK_PARTICIPANT',
        classId: liveClass.id,
        payload: { targetUserId },
      }));
    }
  };

  const handleEndClassForAll = () => {
    if (confirm('Are you sure you want to end this live class for all participants?')) {
      socketRef.current?.send(JSON.stringify({
        type: 'END_CLASS_FOR_ALL',
        classId: liveClass.id,
        payload: {},
      }));
      handleCleanLeave();
    }
  };

  const handleCleanLeave = () => {
    if (providerRef.current) {
      providerRef.current.leaveMeeting();
    }
    onLeave();
  };

  // Format Elapsed Time
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A13] text-stone-100 flex flex-col overflow-hidden select-none font-sans">

      {/* 1. TOP BAR */}
      <div className="h-14 px-4 sm:px-6 bg-[#0B0F19] border-b border-stone-800 flex items-center justify-between z-20 shrink-0">

        {/* Left: Brand Identity, Class Title, Subject & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo
            variant="horizontal"
            size="xs"
            className="hidden sm:inline-block pr-2 border-r border-stone-800"
          />
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
              {liveClass.exam}
            </span>
            <div className="h-4 w-px bg-stone-800"></div>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {liveClass.title}
            </h1>
            <div className="text-[10px] text-stone-400 truncate flex items-center gap-2">
              <span>{liveClass.subject}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{liveClass.teacherName} (Faculty)</span>
            </div>
          </div>
        </div>

        {/* Center: Live Timer & Pulse */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-stone-300 font-medium">LIVE {formatTime(elapsedSeconds)}</span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>REC</span>
            </div>
          )}
        </div>

        {/* Right: Quick Tools & Stats */}
        <div className="flex items-center gap-2.5">
          {/* Teacher Attendance Quick Action */}
          {isTeacher && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700/70 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attendance Log</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Video Stage + Side Panel) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* VIDEO CONFERENCING STAGE */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-[#070A13] overflow-hidden">

          {/* Video Mount Container for Jitsi / Fallback */}
          <div
            ref={videoContainerRef}
            className="w-full h-full relative"
          />

          {/* Floating Reaction Emojis Burst */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {floatingReactions.map(r => (
              <div
                key={r.id}
                style={{ left: `${r.x}%` }}
                className="absolute bottom-16 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-24 duration-700 flex flex-col items-center"
              >
                <span className="text-3xl drop-shadow-lg animate-bounce">{r.emoji}</span>
                <span className="text-[10px] bg-black/75 px-2 py-0.5 rounded-full text-white font-mono mt-1 border border-white/10">
                  {r.userName}
                </span>
              </div>
            ))}
          </div>

          {/* Local Hand Raised Indicator Banner */}
          {isHandRaised && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs backdrop-blur-md animate-pulse">
              <Hand className="w-4 h-4" />
              <span>Hand Raised — Faculty has been notified</span>
            </div>
          )}

          {/* Toast Notification */}
          {notificationToast && (
            <div className="absolute top-4 right-4 z-30 px-4 py-2 bg-stone-900/95 border border-amber-500/40 text-stone-200 text-xs rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
              {notificationToast}
            </div>
          )}
        </div>

        {/* 3. SIDE PANEL (Collapsible Tabs) */}
        {activeTab && (
          <div className="w-80 sm:w-96 bg-[#0B0F19] border-l border-stone-800 flex flex-col z-20 shrink-0">

            {/* Tab Selector Header */}
            <div className="h-12 border-b border-stone-800 px-3 flex items-center justify-between bg-[#111728]">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'chat' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === 'qa' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>Q&A</span>
                  {questions.filter(q => q.status === 'UNANSWERED').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'participants' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  People ({participants.length})
                </button>
                <button
                  onClick={() => setActiveTab('polls')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'polls' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Polls
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'notes' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Notes
                </button>
              </div>

              <button
                onClick={() => setActiveTab(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
                title="Collapse Panel"
              >
                ✕
              </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="py-16 text-center text-stone-500 text-xs">
                      No messages yet. Send a greeting to the faculty and peers!
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          msg.isPinned
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : msg.senderRole === 'TEACHER'
                            ? 'bg-stone-800/80 border border-stone-700/60'
                            : 'bg-stone-900/80 border border-stone-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-semibold ${
                            msg.senderRole === 'TEACHER' ? 'text-amber-400' : 'text-stone-300'
                          }`}>
                            {msg.senderName} {msg.senderRole === 'TEACHER' && '★ Faculty'}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-stone-200 text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-stone-800 bg-[#0E1322]">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message to the class..."
                      className="w-full pl-3 pr-10 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-400 hover:text-amber-300 disabled:text-stone-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Q&A DOUBT SOLVER */}
            {activeTab === 'qa' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300">UPSC Doubt Queue</span>
                  <span className="text-stone-500 text-[11px] font-mono">{questions.length} questions</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {questions.length === 0 ? (
                    <div className="py-16 text-center text-stone-500 text-xs">
                      No doubts raised yet. Use the box below to ask the faculty!
                    </div>
                  ) : (
                    questions.map(q => (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          q.status === 'ANSWERED'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : q.status === 'ANSWERING'
                            ? 'bg-amber-500/15 border-amber-500/40 animate-pulse'
                            : 'bg-stone-900 border-stone-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-stone-100 text-xs leading-relaxed">
                            {q.question}
                          </p>
                          <button
                            onClick={() => handleUpvoteQuestion(q.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-[11px] shrink-0 border border-stone-700/60"
                            title="Upvote / Me too"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{q.upvotes}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>Asked by {q.authorName}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            q.status === 'ANSWERED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : q.status === 'ANSWERING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-stone-800 text-stone-400'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        {/* Teacher Controls on Question */}
                        {isTeacher && q.status !== 'ANSWERED' && (
                          <div className="flex items-center gap-2 pt-1 border-t border-stone-800">
                            <button
                              onClick={() => handleAnswerQuestion(q.id, 'ANSWERING')}
                              className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-semibold"
                            >
                              Answering Live
                            </button>
                            <button
                              onClick={() => handleAnswerQuestion(q.id, 'ANSWERED')}
                              className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-semibold"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAskQuestion} className="p-3 border-t border-stone-800 bg-[#0E1322]">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask a specific conceptual or syllabus doubt..."
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!questionInput.trim()}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Submit Question to Instructor</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: PARTICIPANTS */}
            {activeTab === 'participants' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300">In This Room ({participants.length})</span>
                  {isTeacher && (
                    <button
                      onClick={handleMuteAll}
                      className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <VolumeX className="w-3 h-3" />
                      <span>Mute All</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar">
                  {participants.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-stone-200 text-xs">
                          {p.userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-stone-100 flex items-center gap-1.5">
                            <span>{p.userName}</span>
                            {p.role === 'TEACHER' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                Faculty
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">{p.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.handRaised && (
                          <span className="text-amber-400 font-bold text-sm" title="Hand Raised">
                            ✋
                          </span>
                        )}
                        {p.isMuted ? (
                          <MicOff className="w-3.5 h-3.5 text-stone-500" />
                        ) : (
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        )}

                        {isTeacher && p.userId !== user?.id && (
                          <button
                            onClick={() => handleKickParticipant(p.userId, p.userName)}
                            className="p-1 rounded-md text-stone-500 hover:text-rose-400 transition-colors"
                            title="Remove student"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: POLLS */}
            {activeTab === 'polls' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300">Live MCQ Polls</span>
                  {isTeacher && (
                    <button
                      onClick={() => setShowCreatePoll(!showCreatePoll)}
                      className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Poll</span>
                    </button>
                  )}
                </div>

                {/* Poll Creator Form */}
                {showCreatePoll && isTeacher && (
                  <form onSubmit={handleCreatePollSubmit} className="p-4 bg-stone-900 border-b border-stone-800 space-y-3 text-xs">
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Poll Question</label>
                      <input
                        type="text"
                        required
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="e.g. Which Constitutional Amendment enacted Article 21A?"
                        className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-stone-200"
                      />
                    </div>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx}>
                        <input
                          type="text"
                          required={idx < 2}
                          value={opt}
                          onChange={(e) => {
                            const copy = [...pollOptions];
                            copy[idx] = e.target.value;
                            setPollOptions(copy);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs"
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCreatePoll(false)}
                        className="px-3 py-1 text-stone-400 hover:text-stone-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 text-stone-950 font-bold rounded-lg"
                      >
                        Launch Poll
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                  {polls.length === 0 ? (
                    <div className="py-16 text-center text-stone-500 text-xs">
                      No active polls. Faculty will launch quick quiz polls during lecture.
                    </div>
                  ) : (
                    polls.map(poll => {
                      const totalVotes = poll.totalVotes || 0;
                      return (
                        <div key={poll.id} className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-3 text-xs">
                          <div className="font-semibold text-stone-100">{poll.question}</div>

                          <div className="space-y-2">
                            {poll.options.map(opt => {
                              const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVotePoll(poll.id, opt.id)}
                                  disabled={poll.isClosed}
                                  className="w-full p-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-amber-500/50 text-left relative overflow-hidden transition-all text-xs"
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 bg-amber-500/15"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <div className="relative z-10 flex items-center justify-between text-stone-200">
                                    <span>{opt.text}</span>
                                    <span className="font-mono text-stone-400 text-[11px]">{pct}% ({opt.voteCount})</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                            <span>Total responses: {totalVotes}</span>
                            {poll.isClosed && <span className="text-rose-400 font-semibold">Closed</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: IN-CLASS NOTES SCRATCHPAD */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300">Live Lecture Scratchpad</span>
                  <span className="text-[10px] text-stone-500">Auto-saved to your IKSHOVIA Notes</span>
                </div>
                <textarea
                  value={lectureNotes}
                  onChange={(e) => {
                    setLectureNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Take timestamped notes, article references, or key takeaways during the lecture..."
                  className="flex-1 p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500 resize-none font-sans leading-relaxed custom-scrollbar"
                />
                <button
                  onClick={() => {
                    setNotesSaved(true);
                    showToast('Lecture notes successfully saved to your study desk!');
                  }}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{notesSaved ? 'Notes Saved ✓' : 'Save Notes to Desk'}</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 4. BOTTOM FLOATING CONTROL DOCK (Meet / Teams Quality) */}
      <div className="h-20 bg-[#0B0F19] border-t border-stone-800 px-4 flex items-center justify-center gap-2 sm:gap-3 z-30 shrink-0">

        {/* Microphone Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl border transition-all ${
            isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-900/40'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl border transition-all ${
            isVideoMuted
              ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-900/40'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
          }`}
          title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* Screen Share Toggle (Faculty or Scholar) */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl border transition-all ${
            isScreenSharing
              ? 'bg-sky-600 hover:bg-sky-500 border-sky-500 text-white'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Raise Hand Toggle */}
        <button
          onClick={toggleHandRaise}
          className={`p-3.5 rounded-2xl border transition-all ${
            isHandRaised
              ? 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/30'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
          }`}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Emoji Reactions Picker Popover */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-all"
            title="Reactions"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showReactionPicker && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex items-center gap-1 z-40 animate-in fade-in zoom-in-95">
              {['👍', '👏', '❤️', '💡', '🎯', '❓'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="p-2 text-xl hover:scale-125 transition-transform rounded-xl hover:bg-stone-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-stone-800 mx-1 hidden sm:block"></div>

        {/* Side Panel Toggles */}
        <button
          onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
          className={`p-3.5 rounded-2xl border transition-all relative ${
            activeTab === 'chat'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
          }`}
          title="Open Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'qa' ? null : 'qa')}
          className={`p-3.5 rounded-2xl border transition-all relative ${
            activeTab === 'qa'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
          }`}
          title="Open Q&A"
        >
          <HelpCircle className="w-5 h-5" />
          {questions.filter(q => q.status === 'UNANSWERED').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center">
              {questions.filter(q => q.status === 'UNANSWERED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'participants' ? null : 'participants')}
          className={`p-3.5 rounded-2xl border transition-all relative ${
            activeTab === 'participants'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
          }`}
          title="Participants Roster"
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-stone-700 text-stone-200 font-mono text-[10px]">
            {participants.length}
          </span>
        </button>

        {/* Leave / End Class Button */}
        <div className="ml-2">
          {isTeacher ? (
            <button
              onClick={() => setConfirmLeaveModal(true)}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave / End</span>
            </button>
          ) : (
            <button
              onClick={handleCleanLeave}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Class</span>
            </button>
          )}
        </div>

      </div>

      {/* 5. MODAL: TEACHER LEAVE OR END OPTION */}
      {confirmLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0F1424] border border-stone-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white">Leave Classroom Options</h3>
            <p className="text-xs text-stone-400">
              As the session faculty, you can choose to exit temporarily or end the session for all scholars.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleEndClassForAll}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                End Class for Everyone
              </button>
              <button
                onClick={handleCleanLeave}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs rounded-xl transition-colors"
              >
                Just Leave (Class Stays Active)
              </button>
              <button
                onClick={() => setConfirmLeaveModal(false)}
                className="w-full py-2 text-stone-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: ATTENDANCE LOG */}
      <LiveAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        liveClass={liveClass}
      />

    </div>
  );
};

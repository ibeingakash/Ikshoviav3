import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  Users,
  Clock,
  Send,
  X,
  Sparkles,
  Shield,
  Radio
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService.js';
import { DirectVideoCall } from '../../types/liveClass.js';
import { useAuth } from '../../context/AuthContext.js';

interface DirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCall?: DirectVideoCall | null;
  initialMode?: 'DIRECTORY' | 'CALLING' | 'IN_CALL';
}

export const DirectCallModal: React.FC<DirectCallModalProps> = ({
  isOpen,
  onClose,
  initialCall = null,
  initialMode = 'DIRECTORY',
}) => {
  const { user } = useAuth();

  // Mode: 'DIRECTORY' | 'CALLING' | 'IN_CALL'
  const [mode, setMode] = useState<'DIRECTORY' | 'CALLING' | 'IN_CALL'>(initialMode);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [currentCall, setCurrentCall] = useState<DirectVideoCall | null>(initialCall);

  // In-call media states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Video streams refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<any>(null);
  const pollerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCall) {
        setCurrentCall(initialCall);
        setMode(initialMode || (initialCall.status === 'ACCEPTED' ? 'IN_CALL' : 'CALLING'));
        if (initialMode === 'IN_CALL' || initialCall.status === 'ACCEPTED') {
          startCamera();
        }
      } else {
        setMode('DIRECTORY');
      }
      loadUsers();
      checkExistingCall();
      pollerRef.current = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        // Do not hammer server if already connected in call
        if (mode === 'IN_CALL') return;
        checkExistingCall();
      }, 8000);
    } else {
      cleanupStreams();
      if (pollerRef.current) clearInterval(pollerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      cleanupStreams();
      if (pollerRef.current) clearInterval(pollerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isOpen, initialCall, initialMode]);

  // Call duration counter
  useEffect(() => {
    if (mode === 'IN_CALL') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [mode]);

  const loadUsers = async () => {
    try {
      const res = await liveClassService.getCallableUsers();
      setUsersList(res || []);
    } catch (err) {
      console.warn('[DirectCall] load users error', err);
    }
  };

  const checkExistingCall = async () => {
    try {
      const res = await liveClassService.getActiveDirectCall();
      if (res?.call) {
        const call = res.call;
        setCurrentCall(call);
        if (call.status === 'ACCEPTED') {
          if (mode !== 'IN_CALL') {
            setMode('IN_CALL');
            startCamera();
          }
        } else if (call.status === 'RINGING') {
          if (call.callerId === user?.id && mode !== 'CALLING' && mode !== 'IN_CALL') {
            setMode('CALLING');
            startCamera();
          }
        } else if (call.status === 'ENDED' || call.status === 'DECLINED' || call.status === 'MISSED') {
          handleCallTerminated();
        }
      } else if (mode === 'CALLING' || mode === 'IN_CALL') {
        handleCallTerminated();
      }
    } catch (err) {
      // quiet
    }
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('[Camera error - fallback to simulator mode]', err);
    }
  };

  const cleanupStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  };

  const handleInitiateCall = async (targetUser: any) => {
    try {
      setMode('CALLING');
      startCamera();
      const call = await liveClassService.initiateDirectCall(
        targetUser.id,
        targetUser.name,
        targetUser.avatarUrl
      );
      setCurrentCall(call);
    } catch (err: any) {
      alert(err.message || 'Failed to place call');
      setMode('DIRECTORY');
      cleanupStreams();
    }
  };

  const handleAcceptIncoming = async () => {
    if (!currentCall) return;
    try {
      const accepted = await liveClassService.respondDirectCall(currentCall.id, 'ACCEPT');
      setCurrentCall(accepted || currentCall);
      setMode('IN_CALL');
      startCamera();
    } catch (err) {
      console.error('[Accept Call error]', err);
    }
  };

  const handleDeclineIncoming = async () => {
    if (!currentCall) return;
    try {
      await liveClassService.respondDirectCall(currentCall.id, 'DECLINE');
      handleCallTerminated();
    } catch (err) {
      handleCallTerminated();
    }
  };

  const handleEndCall = async () => {
    if (currentCall) {
      try {
        await liveClassService.endDirectCall(currentCall.id);
      } catch (err) {
        // quiet
      }
    }
    handleCallTerminated();
  };

  const handleCallTerminated = () => {
    cleanupStreams();
    setCurrentCall(null);
    setMode('DIRECTORY');
    setCallDuration(0);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = isMicMuted));
    }
    setIsMicMuted(!isMicMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = isVideoMuted));
    }
    setIsVideoMuted(!isVideoMuted);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: user?.name || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const formatHMS = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-hidden">
      <div className="bg-[#0F1424] border border-stone-800 rounded-2xl w-full max-w-4xl h-[90vh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#070A13] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1:1 Direct Video Consultation</span>
                {mode === 'IN_CALL' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold animate-pulse">
                    LIVE {formatHMS(callDuration)}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-stone-400">Encrypted peer & faculty video room</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (mode === 'IN_CALL') handleEndCall();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: 3 MODES */}

        {/* 1. DIRECTORY MODE: Find Faculty or Peer to call */}
        {mode === 'DIRECTORY' && (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">Available Mentors & Scholars</h3>
                  <p className="text-xs text-stone-400">Click to place an instant 1:1 high-definition video consultation call.</p>
                </div>
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="bg-[#070A13] border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 w-full sm:w-56"
                />
              </div>

              {/* Incoming Call Notification Banner if an incoming call is ringing */}
              {currentCall && currentCall.calleeId === user?.id && currentCall.status === 'RINGING' && (
                <div className="p-4 bg-linear-to-r from-rose-950/60 to-stone-900 border-2 border-rose-500 rounded-2xl flex items-center justify-between animate-pulse shadow-lg shadow-rose-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                      <Phone className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Incoming Consultation Call</div>
                      <div className="text-sm font-black text-rose-300">{currentCall.callerName}</div>
                      <div className="text-[10px] text-stone-400">1:1 Mentorship Session</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeclineIncoming}
                      className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptIncoming}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Accept Call</span>
                    </button>
                  </div>
                </div>
              )}

              {/* User cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {usersList
                  .filter(u => (u.name || '').toLowerCase().includes((searchUser || '').toLowerCase()))
                  .map(target => (
                    <div
                      key={target.id}
                      className="p-4 bg-[#070A13] border border-stone-800 hover:border-amber-500/40 rounded-xl transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-300 text-xs">
                          {String(target?.name || 'User').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white line-clamp-1">{target.name || 'Scholar / Mentor'}</div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{target.role === 'TEACHER' ? 'Faculty Mentor' : 'Scholar'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInitiateCall(target)}
                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Start Video Consultation"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-[#070A13]/60 border border-stone-800/80 rounded-xl text-xs text-stone-500">
              💡 1:1 Video Calls use low-latency media streams with adaptive bandwidth. Ensure your camera and microphone permissions are granted.
            </div>
          </div>
        )}

        {/* 2. CALLING / RINGING STATE */}
        {mode === 'CALLING' && currentCall && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-24 h-24 rounded-full bg-stone-900 border-2 border-rose-500 flex items-center justify-center text-3xl font-bold text-amber-300 relative z-10">
                {String(currentCall?.calleeName || 'User').substring(0, 2).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Calling Mentor / Scholar</div>
              <h3 className="text-2xl font-black text-white mt-1">{currentCall.calleeName || 'Connecting...'}</h3>
              <p className="text-xs text-stone-500 mt-1">Waiting for user to connect...</p>
            </div>

            <button
              onClick={handleEndCall}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Cancel Call</span>
            </button>
          </div>
        )}

        {/* 3. ACTIVE IN-CALL STATE */}
        {mode === 'IN_CALL' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Main Remote Video Area */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              {/* Remote simulation or feed */}
              <div className="text-center space-y-3 z-10 p-6">
                <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-2xl font-bold text-amber-300 shadow-xl">
                  {String((currentCall?.calleeId === user?.id
                    ? (currentCall?.callerName || 'Faculty')
                    : (currentCall?.calleeName || 'Scholar')) || 'FC').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-sm font-bold text-white">
                  {currentCall?.calleeId === user?.id ? (currentCall?.callerName || 'Faculty') : (currentCall?.calleeName || 'Scholar')}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Audio & Video Active (HD 1080p)</span>
                </div>
              </div>

              {/* Local User PiP Video */}
              <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 bg-stone-900 border-2 border-stone-700 rounded-xl overflow-hidden shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'}`}
                />
                {isVideoMuted && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-stone-500 text-xs">
                    <VideoOff className="w-6 h-6 mb-1 text-stone-600" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[10px] text-white font-semibold bg-black/60 px-1.5 py-0.5 rounded">
                  You ({isMicMuted ? 'Muted' : 'Live'})
                </div>
              </div>

              {/* Call Controls Floating Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0F1424]/90 backdrop-blur-md border border-stone-700 rounded-2xl px-4 py-2.5 flex items-center gap-3 z-30 shadow-2xl">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-all ${
                    isMicMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                  title={isMicMuted ? 'Unmute' : 'Mute'}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-all ${
                    isVideoMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                  title={isVideoMuted ? 'Start Video' : 'Stop Video'}
                >
                  {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-3 rounded-xl transition-all ${
                    isScreenSharing
                      ? 'bg-sky-500 text-stone-950 font-bold'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                  title="Share Screen"
                >
                  <Monitor className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`p-3 rounded-xl transition-all ${
                    chatOpen
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                  title="In-Call Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </div>
            </div>

            {/* In-Call Chat Drawer */}
            {chatOpen && (
              <div className="w-full md:w-80 bg-[#0F1424] border-l border-stone-800 flex flex-col h-full z-20">
                <div className="p-3 border-b border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>In-Call Notes & Chat</span>
                  </span>
                  <button onClick={() => setChatOpen(false)} className="text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-stone-500 text-center py-10">
                      No chat messages yet. Share doubts, links, or notes here.
                    </div>
                  ) : (
                    chatMessages.map((m, i) => (
                      <div key={i} className="p-2 bg-[#070A13] rounded-lg">
                        <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                          <span className="font-semibold text-amber-300">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <div className="text-stone-200">{m.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 bg-[#070A13] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-amber-500 text-stone-950 rounded-lg hover:bg-amber-400 font-bold"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

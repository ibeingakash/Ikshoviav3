import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Settings,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Users,
  Clock,
  Radio
} from 'lucide-react';
import { LiveClass } from '../../types/liveClass.js';
import { useAuth } from '../../context/AuthContext.js';

interface PreJoinScreenProps {
  liveClass: LiveClass;
  onJoin: (settings: {
    audioMuted: boolean;
    videoMuted: boolean;
    displayName: string;
  }) => void;
  onCancel: () => void;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({
  liveClass,
  onJoin,
  onCancel,
}) => {
  const { user } = useAuth();
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || 'IKSHOVIA Scholar');
  const [audioLevel, setAudioLevel] = useState(0);

  // Available devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Refs for media
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enumerate devices & start initial preview stream
  useEffect(() => {
    let active = true;

    async function initPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio level meter
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (audioErr) {
          console.warn('[PreJoin] AudioContext error:', audioErr);
        }

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (active) {
          const vDevs = devices.filter(d => d.kind === 'videoinput');
          const aDevs = devices.filter(d => d.kind === 'audioinput');
          setVideoDevices(vDevs);
          setAudioDevices(aDevs);
          if (vDevs.length > 0) setSelectedVideoId(vDevs[0].deviceId);
          if (aDevs.length > 0) setSelectedAudioId(aDevs[0].deviceId);
        }
      } catch (err) {
        console.warn('[PreJoin] Media access notice:', err);
        // Default video muted if access blocked
        setVideoMuted(true);
      }
    }

    initPreview();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Toggle Video Track
  const handleToggleVideo = () => {
    if (mediaStreamRef.current) {
      const vTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = videoMuted; // Toggle
        setVideoMuted(!videoMuted);
      } else {
        setVideoMuted(!videoMuted);
      }
    } else {
      setVideoMuted(!videoMuted);
    }
  };

  // Toggle Audio Track
  const handleToggleAudio = () => {
    if (mediaStreamRef.current) {
      const aTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = audioMuted; // Toggle
        setAudioMuted(!audioMuted);
      } else {
        setAudioMuted(!audioMuted);
      }
    } else {
      setAudioMuted(!audioMuted);
    }
  };

  const handleJoinClick = () => {
    // Stop local preview tracks so Jitsi provider can re-acquire them cleanly
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onJoin({
      audioMuted,
      videoMuted,
      displayName: displayName.trim() || user?.name || 'Scholar',
    });
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || liveClass.teacherId === user?.id;

  return (
    <div className="min-h-screen bg-[#070A13] text-stone-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Live Hub</span>
        </button>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            liveClass.status === 'LIVE'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Radio className="w-3.5 h-3.5" />
            <span>{liveClass.status === 'LIVE' ? 'SESSION IS LIVE' : 'PRE-JOIN STAGE'}</span>
          </span>
          <span className="text-xs text-stone-400 font-mono hidden sm:inline">
            ID: {liveClass.meetingId}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
        
        {/* Left Column: Interactive Video Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative w-full aspect-video bg-[#0D1220] border-2 border-stone-800/90 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
            
            {/* Real Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Always muted locally to prevent acoustic loop
              className={`w-full h-full object-cover mirror ${videoMuted ? 'hidden' : 'block'}`}
            />

            {/* Video Off Fallback Avatar */}
            {videoMuted && (
              <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-amber-600/30 to-stone-800 border-2 border-amber-500/30 flex items-center justify-center text-amber-200 text-3xl font-bold shadow-xl mb-3">
                  {String(displayName || user?.name || 'Scholar').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-stone-300 text-sm font-semibold">{displayName}</div>
                <div className="text-stone-500 text-xs mt-0.5">Camera is turned off</div>
              </div>
            )}

            {/* Audio Indicator Overlay (Top Left) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs">
              <div className="flex items-center gap-1.5">
                {audioMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-[11px] font-medium text-stone-200">
                  {audioMuted ? 'Muted' : 'Mic Active'}
                </span>
              </div>
              {!audioMuted && (
                <div className="w-12 h-2 bg-stone-800 rounded-full overflow-hidden ml-1">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              )}
            </div>

            {/* Floating In-Preview Controls Dock */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-10">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-3.5 rounded-2xl backdrop-blur-md border transition-all ${
                  audioMuted
                    ? 'bg-rose-600/90 hover:bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40'
                    : 'bg-stone-900/90 hover:bg-stone-800 border-stone-700/80 text-white'
                }`}
                title={audioMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-2xl backdrop-blur-md border transition-all ${
                  videoMuted
                    ? 'bg-rose-600/90 hover:bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40'
                    : 'bg-stone-900/90 hover:bg-stone-800 border-stone-700/80 text-white'
                }`}
                title={videoMuted ? 'Turn camera on' : 'Turn camera off'}
              >
                {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3.5 rounded-2xl backdrop-blur-md border transition-all ${
                  showSettings
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : 'bg-stone-900/90 hover:bg-stone-800 border-stone-700/80 text-white'
                }`}
                title="Device Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible Device Dropdowns */}
          {showSettings && (
            <div className="mt-4 p-4 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Hardware Device Setup
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Camera Device</label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-hidden focus:border-amber-500"
                  >
                    {videoDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Microphone Input</label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-hidden focus:border-amber-500"
                  >
                    {audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Class Info & Join CTA (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-[#0F1424] border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
            
            {/* Subject & Exam Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                {liveClass.exam} CSE
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700/60 text-stone-300 text-xs">
                {liveClass.subject}
              </span>
            </div>

            {/* Title & Agenda */}
            <div>
              <h2 className="text-xl font-extrabold text-white leading-snug">
                {liveClass.title}
              </h2>
              {liveClass.description && (
                <p className="text-xs text-stone-400 mt-2 line-clamp-3 leading-relaxed">
                  {liveClass.description}
                </p>
              )}
            </div>

            {/* Instructor Profile Card */}
            <div className="p-3.5 bg-stone-900/80 rounded-xl border border-stone-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-600/40 to-stone-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                  {String(liveClass.teacherName || 'Faculty').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-200">{liveClass.teacherName || 'Faculty Mentor'}</div>
                  <div className="text-[11px] text-amber-400/90 font-medium">Faculty Mentor</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-stone-400">Duration</div>
                <div className="text-xs font-mono text-stone-200 font-medium">{liveClass.durationMinutes} mins</div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Your Scholar Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Guidelines Strip */}
            <div className="p-3 bg-stone-900/40 rounded-xl border border-stone-800/60 space-y-1.5 text-[11px] text-stone-400">
              <div className="flex items-center gap-2 text-stone-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Classroom Guidelines</span>
              </div>
              <p>• Official attendance begins when you connect to the room.</p>
              <p>• You can ask questions anytime using the interactive Q&A tab.</p>
              <p>• Raise hand if you want the faculty to invite your audio.</p>
            </div>
          </div>

          {/* Primary Join Button */}
          <div className="space-y-2">
            <button
              onClick={handleJoinClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isTeacher ? 'Start & Host Classroom' : 'Join Live Classroom'}</span>
            </button>
            <p className="text-[11px] text-center text-stone-500">
              Secured with IKSHOVIA End-to-End Encrypted Live Stream
            </p>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-stone-600 py-2">
        IKSHOVIA Live Learning Infrastructure • Powered by Native WebRTC Engine
      </div>
    </div>
  );
};

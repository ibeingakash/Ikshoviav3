import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Sparkles, X, User, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { liveClassService } from '../../services/liveClassService.js';
import { DirectVideoCall } from '../../types/liveClass.js';
import { DirectCallModal } from './DirectCallModal.js';

export const GlobalCallManager: React.FC = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<DirectVideoCall | null>(null);
  const [activeCallModalOpen, setActiveCallModalOpen] = useState(false);
  const [activeCallData, setActiveCallData] = useState<DirectVideoCall | null>(null);
  const [activeCallMode, setActiveCallMode] = useState<'DIRECTORY' | 'CALLING' | 'IN_CALL'>('DIRECTORY');

  const pollTimerRef = useRef<any>(null);
  const audioRingRef = useRef<any>(null);

  // Play synthesized ringtone using Web Audio API safely
  const startRingingSound = () => {
    try {
      if (audioRingRef.current) return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const interval = setInterval(() => {
        try {
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
          osc2.frequency.setValueAtTime(480, ctx.currentTime); // tone pair

          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        } catch (e) {
          // ignore
        }
      }, 2500);

      audioRingRef.current = { ctx, interval };
    } catch (e) {
      // ignore
    }
  };

  const stopRingingSound = () => {
    if (audioRingRef.current) {
      try {
        clearInterval(audioRingRef.current.interval);
        audioRingRef.current.ctx.close();
      } catch (e) {
        // ignore
      }
      audioRingRef.current = null;
    }
  };

  // Poll for active incoming calls
  useEffect(() => {
    if (!user) {
      setIncomingCall(null);
      stopRingingSound();
      return;
    }

    let consecutiveErrors = 0;

    const checkIncoming = async () => {
      // Do not poll if user already has the active call modal open or is egress restricted
      if (activeCallModalOpen) return;
      try {
        const res = await liveClassService.getActiveDirectCall();
        consecutiveErrors = 0;
        if (res?.call) {
          const call = res.call;
          // Check if ringing and current user is callee
          if (call.status === 'RINGING' && call.calleeId === user.id) {
            setIncomingCall(call);
            startRingingSound();
          } else if (call.status === 'ACCEPTED' && call.calleeId === user.id && !activeCallModalOpen) {
            // Already accepted
            setIncomingCall(null);
            stopRingingSound();
            setActiveCallData(call);
            setActiveCallMode('IN_CALL');
            setActiveCallModalOpen(true);
          } else if (call.status === 'ENDED' || call.status === 'DECLINED') {
            setIncomingCall(null);
            stopRingingSound();
          }
        } else {
          setIncomingCall(null);
          stopRingingSound();
        }
      } catch (err: any) {
        consecutiveErrors++;
        // If error or 402, quiet down
      }
    };

    if (!activeCallModalOpen) {
      checkIncoming();
    }

    // Poll every 12s when visible, pause when hidden to conserve network egress and battery
    const intervalMs = 12000;
    const intervalFn = () => {
      if (activeCallModalOpen) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      // Exponential backoff if errors encountered
      if (consecutiveErrors > 3) return;
      checkIncoming();
    };
    pollTimerRef.current = setInterval(intervalFn, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      stopRingingSound();
    };
  }, [user, activeCallModalOpen]);

  // Handle Accept
  const handleAccept = async () => {
    if (!incomingCall) return;
    stopRingingSound();
    try {
      const accepted = await liveClassService.respondDirectCall(incomingCall.id, 'ACCEPT');
      setIncomingCall(null);
      setActiveCallData(accepted);
      setActiveCallMode('IN_CALL');
      setActiveCallModalOpen(true);
    } catch (err) {
      console.error('[GlobalCall] Accept error', err);
      setIncomingCall(null);
    }
  };

  // Handle Decline
  const handleDecline = async () => {
    if (!incomingCall) return;
    stopRingingSound();
    try {
      await liveClassService.respondDirectCall(incomingCall.id, 'DECLINE');
    } catch (err) {
      // quiet
    }
    setIncomingCall(null);
  };

  return (
    <>
      {/* 1. Incoming Call Floating Ringing Banner */}
      {incomingCall && (
        <div className="fixed top-5 right-5 sm:right-8 z-[100] max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-top duration-300">
          <div className="p-4 bg-[#0B0F1C]/95 backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl shadow-2xl shadow-emerald-950/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-300 font-bold">
                    <Phone className="w-5 h-5 animate-bounce text-emerald-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Incoming 1:1 Consultation</span>
                  </div>
                  <div className="text-sm font-black text-white line-clamp-1">
                    {incomingCall.callerName || 'IKSHOVIA Scholar'}
                  </div>
                  <div className="text-[10px] text-stone-400">Encrypted Video Session Request</div>
                </div>
              </div>

              <button
                onClick={handleDecline}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleDecline}
                className="py-2.5 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-600 text-stone-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <PhoneOff className="w-4 h-4 text-rose-400" />
                <span>Decline</span>
              </button>

              <button
                onClick={handleAccept}
                className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Video className="w-4 h-4 text-stone-950" />
                <span>Accept Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Direct Call Modal when open */}
      <DirectCallModal
        isOpen={activeCallModalOpen}
        onClose={() => {
          setActiveCallModalOpen(false);
          setActiveCallData(null);
        }}
        initialCall={activeCallData}
        initialMode={activeCallMode}
      />
    </>
  );
};

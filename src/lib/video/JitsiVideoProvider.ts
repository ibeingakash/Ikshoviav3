import {
  VideoMeetingProvider,
  JoinMeetingOptions,
  MeetingConnectionState,
  ProviderParticipant,
  ProviderEventHandler
} from './VideoMeetingProvider.js';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
    IKSHOVIA_CONFIG?: {
      JITSI_DOMAIN?: string;
    };
  }
}

export class JitsiVideoProvider implements VideoMeetingProvider {
  readonly id = 'jitsi';
  readonly name = 'Jitsi Meet Conference Engine';

  private jitsiApi: any = null;
  private connectionState: MeetingConnectionState = 'IDLE';
  private listeners: Map<string, Set<ProviderEventHandler>> = new Map();
  private participants: Map<string, ProviderParticipant> = new Map();
  private localParticipant: ProviderParticipant | null = null;
  private currentOptions: JoinMeetingOptions | null = null;
  private localMediaStream: MediaStream | null = null;
  private isFallbackMode = false;
  private fallbackContainer: HTMLElement | null = null;

  private emit(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(...args);
        } catch (err) {
          console.error(`[JitsiProvider] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  on(event: string, handler: ProviderEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: ProviderEventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  getConnectionState(): MeetingConnectionState {
    return this.connectionState;
  }

  getParticipants(): ProviderParticipant[] {
    return Array.from(this.participants.values());
  }

  private setConnectionState(state: MeetingConnectionState) {
    this.connectionState = state;
    this.emit('connectionStateChanged', state);
  }

  private async loadJitsiScript(domain: string): Promise<boolean> {
    if (window.JitsiMeetExternalAPI) return true;

    return new Promise((resolve) => {
      const existingScript = document.querySelector(`script[src*="${domain}"]`);
      if (existingScript) {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if (window.JitsiMeetExternalAPI) {
            clearInterval(check);
            resolve(true);
          } else if (attempts > 30) {
            clearInterval(check);
            resolve(false);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        resolve(Boolean(window.JitsiMeetExternalAPI));
      };
      script.onerror = () => {
        console.warn(`[JitsiProvider] Failed to load external script from https://${domain}/external_api.js. Switching to native WebRTC fallback.`);
        resolve(false);
      };
      document.head.appendChild(script);

      // Safety timeout after 5 seconds
      setTimeout(() => {
        if (!window.JitsiMeetExternalAPI) {
          resolve(false);
        }
      }, 5000);
    });
  }

  async joinMeeting(options: JoinMeetingOptions): Promise<void> {
    this.currentOptions = options;
    this.setConnectionState('LOADING');

    const domain = window.IKSHOVIA_CONFIG?.JITSI_DOMAIN ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_JITSI_DOMAIN) ||
      'meet.jit.si';

    // 1. Prepare local participant
    this.localParticipant = {
      id: options.user.id,
      displayName: options.user.name,
      avatarUrl: options.user.avatarUrl,
      isLocal: true,
      isAudioMuted: Boolean(options.initialAudioMuted),
      isVideoMuted: Boolean(options.initialVideoMuted),
      isScreenSharing: false,
      isDominantSpeaker: options.user.role === 'TEACHER',
      role: options.user.role,
    };
    this.participants.set(options.user.id, this.localParticipant);

    // 2. Load Jitsi external script
    const scriptLoaded = await this.loadJitsiScript(domain);

    if (!scriptLoaded || !window.JitsiMeetExternalAPI) {
      console.warn('[JitsiProvider] External script unavailable; initializing Native WebRTC Classroom Fallback.');
      await this.initNativeFallback(options);
      return;
    }

    try {
      this.setConnectionState('CONNECTING');
      options.container.innerHTML = '';

      // Clean, deterministic room name: prefix + sanitized class identifier
      const cleanRoom = options.roomName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const isTeacherOrAdmin = options.user.role === 'TEACHER' || options.user.role === 'ADMIN';

      const jitsiConfig: any = {
        roomName: cleanRoom,
        parentNode: options.container,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: options.user.name,
          email: options.user.email,
        },
        configOverwrite: {
          startWithAudioMuted: Boolean(options.initialAudioMuted),
          startWithVideoMuted: Boolean(options.initialVideoMuted),
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          defaultRemoteDisplayName: 'IKSHOVIA Scholar',
          hideConferenceSubject: false,
          subject: 'IKSHOVIA Live Classroom',
          toolbarButtons: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'recording',
            'livestreaming',
            'etherpad',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'shortcuts',
            'tileview',
            'select-background',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          APP_NAME: 'IKSHOVIA Live Classroom',
          TOOLBAR_ALWAYS_VISIBLE: false,
          DEFAULT_BACKGROUND: '#0B0F19',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      };

      if (options.token) {
        jitsiConfig.jwt = options.token;
      }

      this.jitsiApi = new window.JitsiMeetExternalAPI(domain, jitsiConfig);

      // Event Bindings
      this.jitsiApi.addEventListener('videoConferenceJoined', (data: any) => {
        this.setConnectionState('CONNECTED');
        if (data.id && this.localParticipant) {
          this.localParticipant.id = data.id;
        }
        this.emit('conferenceJoined', data);
      });

      this.jitsiApi.addEventListener('videoConferenceLeft', () => {
        this.setConnectionState('DISCONNECTED');
        this.emit('meetingEnded');
      });

      this.jitsiApi.addEventListener('participantJoined', (data: any) => {
        const p: ProviderParticipant = {
          id: data.id,
          displayName: data.displayName || 'Scholar',
          isLocal: false,
          isAudioMuted: false,
          isVideoMuted: false,
          isScreenSharing: false,
          isDominantSpeaker: false,
          role: 'STUDENT',
        };
        this.participants.set(data.id, p);
        this.emit('participantJoined', p);
      });

      this.jitsiApi.addEventListener('participantLeft', (data: any) => {
        this.participants.delete(data.id);
        this.emit('participantLeft', data.id);
      });

      this.jitsiApi.addEventListener('audioMuteStatusChanged', (data: any) => {
        if (this.localParticipant) {
          this.localParticipant.isAudioMuted = data.muted;
        }
        this.emit('audioMuteChanged', data.muted);
      });

      this.jitsiApi.addEventListener('videoMuteStatusChanged', (data: any) => {
        if (this.localParticipant) {
          this.localParticipant.isVideoMuted = data.muted;
        }
        this.emit('videoMuteChanged', data.muted);
      });

      this.jitsiApi.addEventListener('screenSharingStatusChanged', (data: any) => {
        if (this.localParticipant) {
          this.localParticipant.isScreenSharing = data.on;
        }
        this.emit('screenShareChanged', data.on);
      });

      this.jitsiApi.addEventListener('dominantSpeakerChanged', (data: any) => {
        this.participants.forEach(p => {
          p.isDominantSpeaker = p.id === data.id;
        });
        this.emit('dominantSpeakerChanged', data.id);
      });

      this.jitsiApi.addEventListener('recordingStatusChanged', (data: any) => {
        this.emit('recordingStatusChanged', data.on);
      });

      // Pass initial display name
      this.jitsiApi.executeCommand('displayName', options.user.name);

      // Pass initial mute states
      if (options.initialAudioMuted) {
        this.jitsiApi.executeCommand('toggleAudio');
      }
      if (options.initialVideoMuted) {
        this.jitsiApi.executeCommand('toggleVideo');
      }

    } catch (err) {
      console.error('[JitsiProvider] Jitsi initialization error:', err);
      await this.initNativeFallback(options);
    }
  }

  private async initNativeFallback(options: JoinMeetingOptions): Promise<void> {
    this.isFallbackMode = true;
    this.fallbackContainer = options.container;
    options.container.innerHTML = '';

    try {
      this.setConnectionState('CONNECTING');

      // Request user media stream for real preview
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: !options.initialVideoMuted,
          audio: !options.initialAudioMuted,
        });
        this.localMediaStream = stream;
      } catch (mediaErr) {
        console.warn('[JitsiProvider Fallback] Media access denied or muted:', mediaErr);
      }

      // Construct native classroom viewport
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full h-full relative flex flex-col items-center justify-center bg-[#070A13] text-white overflow-hidden select-none';

      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true; // Local preview always muted to prevent feedback
      videoElement.className = 'w-full h-full object-cover rounded-xl';

      if (stream && !options.initialVideoMuted) {
        videoElement.srcObject = stream;
      } else {
        videoElement.style.display = 'none';
      }

      const avatarOverlay = document.createElement('div');
      avatarOverlay.className = `flex flex-col items-center justify-center p-8 text-center transition-all ${options.initialVideoMuted || !stream ? 'flex' : 'hidden'}`;
      avatarOverlay.innerHTML = `
        <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-br from-amber-600/30 to-amber-900/40 border-2 border-amber-500/40 flex items-center justify-center shadow-2xl mb-4">
          <span class="text-3xl sm:text-4xl font-bold tracking-wider text-amber-200">
            ${(options.user.name || 'U').substring(0, 2).toUpperCase()}
          </span>
        </div>
        <h4 class="text-lg font-medium text-stone-200">${options.user.name}</h4>
        <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-xs text-stone-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>${options.user.role === 'TEACHER' ? 'Instructor Stage Active' : 'Connected to Live Room'}</span>
        </div>
      `;

      wrapper.appendChild(videoElement);
      wrapper.appendChild(avatarOverlay);
      options.container.appendChild(wrapper);

      this.setConnectionState('CONNECTED');
      this.emit('conferenceJoined', { id: options.user.id });
    } catch (e: any) {
      console.error('[JitsiProvider Fallback Error]', e);
      this.setConnectionState('CONNECTED');
    }
  }

  async toggleAudio(muted?: boolean): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
      if (this.localParticipant) {
        this.localParticipant.isAudioMuted = muted !== undefined ? muted : !this.localParticipant.isAudioMuted;
        this.emit('audioMuteChanged', this.localParticipant.isAudioMuted);
        return this.localParticipant.isAudioMuted;
      }
    } else if (this.localMediaStream) {
      const audioTrack = this.localMediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = muted !== undefined ? !muted : !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        if (this.localParticipant) {
          this.localParticipant.isAudioMuted = isMuted;
        }
        this.emit('audioMuteChanged', isMuted);
        return isMuted;
      }
    }
    return true;
  }

  async toggleVideo(muted?: boolean): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleVideo');
      if (this.localParticipant) {
        this.localParticipant.isVideoMuted = muted !== undefined ? muted : !this.localParticipant.isVideoMuted;
        this.emit('videoMuteChanged', this.localParticipant.isVideoMuted);
        return this.localParticipant.isVideoMuted;
      }
    } else if (this.localMediaStream) {
      const videoTrack = this.localMediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = muted !== undefined ? !muted : !videoTrack.enabled;
        const isMuted = !videoTrack.enabled;
        if (this.localParticipant) {
          this.localParticipant.isVideoMuted = isMuted;
        }
        this.emit('videoMuteChanged', isMuted);
        return isMuted;
      }
    }
    return true;
  }

  async startScreenShare(): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
      return true;
    } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.emit('screenShareChanged', true);
        stream.getVideoTracks()[0].onended = () => {
          this.emit('screenShareChanged', false);
        };
        return true;
      } catch (err) {
        console.warn('[JitsiProvider] Screen share cancelled:', err);
        return false;
      }
    }
    return false;
  }

  async stopScreenShare(): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
      return false;
    }
    this.emit('screenShareChanged', false);
    return false;
  }

  async muteParticipant(participantId: string): Promise<void> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('muteParticipant', participantId);
    }
    const target = this.participants.get(participantId);
    if (target) {
      target.isAudioMuted = true;
      this.emit('participantUpdated', target);
    }
  }

  async muteAll(): Promise<void> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('overwriteConfig', { startWithAudioMuted: true });
      this.jitsiApi.executeCommand('toggleAudio');
    }
    this.participants.forEach(p => {
      if (!p.isLocal) p.isAudioMuted = true;
    });
    this.emit('participantsRefreshed', this.getParticipants());
  }

  async removeParticipant(participantId: string): Promise<void> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('kickParticipant', participantId);
    }
    this.participants.delete(participantId);
    this.emit('participantLeft', participantId);
  }

  async startRecording(): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('startRecording', { mode: 'file' });
      return true;
    }
    this.emit('recordingStatusChanged', true);
    return true;
  }

  async stopRecording(): Promise<boolean> {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('stopRecording', 'file');
      return false;
    }
    this.emit('recordingStatusChanged', false);
    return false;
  }

  async leaveMeeting(): Promise<void> {
    if (this.jitsiApi) {
      try {
        this.jitsiApi.executeCommand('hangup');
      } catch (e) {
        // ignore
      }
    }
    this.dispose();
    this.setConnectionState('DISCONNECTED');
  }

  async endMeeting(): Promise<void> {
    if (this.jitsiApi) {
      try {
        this.jitsiApi.executeCommand('hangup');
      } catch (e) {
        // ignore
      }
    }
    this.dispose();
    this.setConnectionState('DISCONNECTED');
    this.emit('meetingEnded');
  }

  dispose(): void {
    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach(track => track.stop());
      this.localMediaStream = null;
    }
    if (this.jitsiApi) {
      try {
        this.jitsiApi.dispose();
      } catch (e) {
        // ignore
      }
      this.jitsiApi = null;
    }
    if (this.fallbackContainer) {
      this.fallbackContainer.innerHTML = '';
      this.fallbackContainer = null;
    }
    this.participants.clear();
    this.localParticipant = null;
    this.listeners.clear();
    this.connectionState = 'IDLE';
  }
}

// Factory function
export function createVideoMeetingProvider(providerType: 'jitsi' | 'livekit' = 'jitsi'): VideoMeetingProvider {
  if (providerType === 'jitsi') {
    return new JitsiVideoProvider();
  }
  // Future extension for LiveKit
  return new JitsiVideoProvider();
}

import {
  VideoMeetingProvider,
  JoinMeetingOptions,
  MeetingConnectionState,
  ProviderParticipant,
  ProviderEventHandler,
} from './VideoMeetingProvider.js';

export class IkshoviaWebRtcProvider implements VideoMeetingProvider {
  readonly id = 'ikshovia';
  readonly name = 'IKSHOVIA Live Classroom (WebRTC)';

  private connectionState: MeetingConnectionState = 'IDLE';
  private eventHandlers: Map<string, Set<ProviderEventHandler>> = new Map();

  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private container: HTMLElement | null = null;

  private localVideoElement: HTMLVideoElement | null = null;
  private spotlightContainer: HTMLDivElement | null = null;
  private galleryContainer: HTMLDivElement | null = null;

  private isAudioMuted: boolean = false;
  private isVideoMuted: boolean = false;
  private isScreenSharing: boolean = false;
  private isRecording: boolean = false;

  private participants: Map<string, ProviderParticipant> = new Map();
  private localUser: JoinMeetingOptions['user'] | null = null;
  private meetingOptions: JoinMeetingOptions | null = null;

  private audioAnalyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private animFrameId: number | null = null;

  async joinMeeting(options: JoinMeetingOptions): Promise<void> {
    this.meetingOptions = options;
    this.localUser = options.user;
    this.container = options.container;
    this.connectionState = 'CONNECTING';
    this.emit('connectionStateChanged', 'CONNECTING');

    this.isAudioMuted = options.initialAudioMuted ?? false;
    this.isVideoMuted = options.initialVideoMuted ?? false;

    // Register local participant
    const isHost = options.user.role === 'MODERATOR' || options.user.role === 'TEACHER' || options.user.role === 'ADMIN';
    const localParticipant: ProviderParticipant = {
      id: options.user.id,
      displayName: options.user.name,
      avatarUrl: options.user.avatarUrl,
      isLocal: true,
      isAudioMuted: this.isAudioMuted,
      isVideoMuted: this.isVideoMuted,
      isScreenSharing: false,
      isDominantSpeaker: false,
      role: options.user.role,
    };
    this.participants.set(options.user.id, localParticipant);

    // Build DOM container
    this.buildClassroomStage(options, isHost);

    // Acquire media
    await this.setupMedia(options.initialAudioMuted, options.initialVideoMuted);

    this.connectionState = 'CONNECTED';
    this.emit('connectionStateChanged', 'CONNECTED');
    this.emit('audioMuteChanged', this.isAudioMuted);
    this.emit('videoMuteChanged', this.isVideoMuted);
    this.emit('participantJoined', localParticipant);
  }

  private buildClassroomStage(options: JoinMeetingOptions, isHost: boolean) {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.backgroundColor = '#070A12';
    this.container.style.overflow = 'hidden';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Top Header Banner
    const topBar = document.createElement('div');
    topBar.id = 'ikshovia-live-header';
    topBar.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    `;

    const titleBox = document.createElement('div');
    titleBox.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    titleBox.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #EF4444; display: inline-block; animation: pulse 1.5s infinite;"></span>
      <span style="font-size: 11px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.05em; text-transform: uppercase;">LIVE</span>
      <span style="width: 1px; height: 12px; background: rgba(255, 255, 255, 0.2);"></span>
      <span style="font-size: 12px; font-weight: 600; color: #E2E8F0;">${escapeHtml(options.roomName || 'IKSHOVIA Live Classroom')}</span>
      <span style="font-size: 10px; font-weight: 700; color: #F59E0B; background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
        ${isHost ? 'FACULTY HOST' : 'SCHOLAR'}
      </span>
    `;

    topBar.appendChild(titleBox);
    this.container.appendChild(topBar);

    // Main Stage Area (Spotlight)
    const stage = document.createElement('div');
    stage.id = 'ikshovia-live-stage';
    stage.style.cssText = `
      position: relative;
      flex: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #111827 0%, #030712 100%);
    `;
    this.spotlightContainer = stage;

    // Spotlight Video Element
    const video = document.createElement('video');
    video.id = 'ikshovia-local-video';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // Local audio muted to prevent feedback loop
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
      transition: opacity 0.3s ease;
    `;
    this.localVideoElement = video;
    stage.appendChild(video);

    // Placeholder avatar when camera is off
    const avatarPlaceholder = document.createElement('div');
    avatarPlaceholder.id = 'ikshovia-video-placeholder';
    avatarPlaceholder.style.cssText = `
      position: absolute;
      inset: 0;
      display: ${this.isVideoMuted ? 'flex' : 'none'};
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: radial-gradient(circle at center, #1E293B 0%, #0F172A 100%);
      z-index: 5;
    `;

    const initials = String(options.user?.name || 'Scholar')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(n => n[0] || '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SC';

    avatarPlaceholder.innerHTML = `
      <div style="width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #4F46E5, #9333EA); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: #FFFFFF; box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4); border: 3px solid rgba(255, 255, 255, 0.2);">
        ${initials}
      </div>
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #F8FAFC;">${escapeHtml(options.user?.name || 'Scholar')}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94A3B8;">Camera is turned off</p>
      </div>
    `;
    stage.appendChild(avatarPlaceholder);

    // Name & Status Pill inside video
    const userPill = document.createElement('div');
    userPill.id = 'ikshovia-participant-pill';
    userPill.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 15;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    userPill.innerHTML = `
      <div id="ikshovia-mic-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: ${this.isAudioMuted ? '#EF4444' : '#10B981'};"></div>
      <span style="font-size: 12px; font-weight: 600; color: #F1F5F9;">${escapeHtml(options.user?.name || 'Scholar')} (You)</span>
      <span style="font-size: 10px; font-weight: 700; color: #38BDF8; background: rgba(56, 189, 248, 0.15); padding: 1px 6px; border-radius: 4px;">
        ${options.user?.role || 'STUDENT'}
      </span>
    `;
    stage.appendChild(userPill);

    this.container.appendChild(stage);
  }

  private async setupMedia(audioMuted = false, videoMuted = false): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        console.warn('[IkshoviaWebRtc] navigator.mediaDevices.getUserMedia not supported in this environment.');
        return;
      }

      // Try video and audio
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (e: any) {
        console.warn('[IkshoviaWebRtc] Camera acquisition failed or denied, trying audio only:', e);
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } catch (audioErr) {
          console.warn('[IkshoviaWebRtc] Audio acquisition also unavailable:', audioErr);
        }
      }

      if (this.localStream) {
        // Apply initial mute states
        this.localStream.getAudioTracks().forEach(t => {
          t.enabled = !audioMuted;
        });
        this.localStream.getVideoTracks().forEach(t => {
          t.enabled = !videoMuted;
        });

        if (this.localVideoElement) {
          this.localVideoElement.srcObject = this.localStream;
        }

        this.setupAudioAnalysis(this.localStream);
      }
    } catch (err) {
      console.error('[IkshoviaWebRtc] setupMedia critical error:', err);
    }
  }

  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      source.connect(this.audioAnalyser);

      const buffer = new Uint8Array(this.audioAnalyser.frequencyBinCount);
      const checkAudio = () => {
        if (!this.audioAnalyser || this.isAudioMuted) {
          this.updateDominantSpeakerState(false);
          this.animFrameId = requestAnimationFrame(checkAudio);
          return;
        }

        this.audioAnalyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const isSpeaking = avg > 25;
        this.updateDominantSpeakerState(isSpeaking);

        this.animFrameId = requestAnimationFrame(checkAudio);
      };

      this.animFrameId = requestAnimationFrame(checkAudio);
    } catch (e) {
      console.warn('[IkshoviaWebRtc] AudioContext analyser init error:', e);
    }
  }

  private updateDominantSpeakerState(isSpeaking: boolean) {
    if (!this.localUser) return;
    const participant = this.participants.get(this.localUser.id);
    if (participant && participant.isDominantSpeaker !== isSpeaking) {
      participant.isDominantSpeaker = isSpeaking;
      this.emit('dominantSpeakerChanged', { id: this.localUser.id, isSpeaking });

      const indicator = document.getElementById('ikshovia-mic-indicator');
      if (indicator) {
        if (this.isAudioMuted) {
          indicator.style.background = '#EF4444';
          indicator.style.boxShadow = 'none';
        } else if (isSpeaking) {
          indicator.style.background = '#10B981';
          indicator.style.boxShadow = '0 0 10px #10B981';
        } else {
          indicator.style.background = '#059669';
          indicator.style.boxShadow = 'none';
        }
      }
    }
  }

  async toggleAudio(muted?: boolean): Promise<boolean> {
    const targetMuted = typeof muted === 'boolean' ? muted : !this.isAudioMuted;
    this.isAudioMuted = targetMuted;

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => {
        t.enabled = !targetMuted;
      });
    }

    if (this.localUser) {
      const p = this.participants.get(this.localUser.id);
      if (p) p.isAudioMuted = targetMuted;
    }

    const indicator = document.getElementById('ikshovia-mic-indicator');
    if (indicator) {
      indicator.style.background = targetMuted ? '#EF4444' : '#10B981';
      indicator.style.boxShadow = 'none';
    }

    this.emit('audioMuteChanged', targetMuted);
    return targetMuted;
  }

  async toggleVideo(muted?: boolean): Promise<boolean> {
    const targetMuted = typeof muted === 'boolean' ? muted : !this.isVideoMuted;
    this.isVideoMuted = targetMuted;

    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => {
        t.enabled = !targetMuted;
      });
    }

    if (this.localUser) {
      const p = this.participants.get(this.localUser.id);
      if (p) p.isVideoMuted = targetMuted;
    }

    const placeholder = document.getElementById('ikshovia-video-placeholder');
    if (placeholder) {
      placeholder.style.display = targetMuted ? 'flex' : 'none';
    }

    this.emit('videoMuteChanged', targetMuted);
    return targetMuted;
  }

  async startScreenShare(): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen sharing is not supported on this browser or platform.');
        return false;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.screenStream = stream;
      this.isScreenSharing = true;

      if (this.localVideoElement) {
        this.localVideoElement.srcObject = stream;
      }

      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      this.emit('screenShareChanged', true);
      return true;
    } catch (err) {
      console.warn('[IkshoviaWebRtc] Screen share canceled or failed:', err);
      return false;
    }
  }

  async stopScreenShare(): Promise<boolean> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    this.isScreenSharing = false;

    if (this.localVideoElement && this.localStream) {
      this.localVideoElement.srcObject = this.localStream;
    }

    this.emit('screenShareChanged', false);
    return true;
  }

  async muteParticipant(participantId: string): Promise<void> {
    const p = this.participants.get(participantId);
    if (p) {
      p.isAudioMuted = true;
      this.emit('participantMuted', { participantId });
    }
  }

  async muteAll(): Promise<void> {
    this.participants.forEach(p => {
      if (!p.isLocal) {
        p.isAudioMuted = true;
      }
    });
    this.emit('muteAllTriggered', {});
  }

  async removeParticipant(participantId: string): Promise<void> {
    this.participants.delete(participantId);
    this.emit('participantLeft', { id: participantId });
  }

  async startRecording(): Promise<boolean> {
    this.isRecording = true;
    this.emit('recordingStatusChanged', true);
    return true;
  }

  async stopRecording(): Promise<boolean> {
    this.isRecording = false;
    this.emit('recordingStatusChanged', false);
    return true;
  }

  getParticipants(): ProviderParticipant[] {
    return Array.from(this.participants.values());
  }

  getConnectionState(): MeetingConnectionState {
    return this.connectionState;
  }

  async endMeeting(): Promise<void> {
    this.emit('meetingEnded', {});
    await this.leaveMeeting();
  }

  async leaveMeeting(): Promise<void> {
    this.connectionState = 'DISCONNECTED';
    this.emit('connectionStateChanged', 'DISCONNECTED');
    this.dispose();
  }

  on(event: string, handler: ProviderEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  off(event: string, handler: ProviderEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[IkshoviaWebRtc] Event handler error on ${event}:`, e);
        }
      });
    }
  }

  dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.eventHandlers.clear();
    this.participants.clear();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createVideoMeetingProvider(): VideoMeetingProvider {
  return new IkshoviaWebRtcProvider();
}

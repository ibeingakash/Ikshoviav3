export type MeetingConnectionState = 
  | 'IDLE'
  | 'LOADING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'WAITING_ROOM'
  | 'DISCONNECTED'
  | 'ERROR';

export interface ProviderParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isLocal: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isDominantSpeaker: boolean;
  role: 'MODERATOR' | 'PARTICIPANT' | 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface JoinMeetingOptions {
  meetingId: string;
  classId: string;
  roomName: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    role: 'MODERATOR' | 'PARTICIPANT' | 'STUDENT' | 'TEACHER' | 'ADMIN';
  };
  container: HTMLElement;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  token?: string;
}

export type ProviderEventHandler = (...args: any[]) => void;

export interface VideoMeetingProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Initializes and joins the video conference
   */
  joinMeeting(options: JoinMeetingOptions): Promise<void>;

  /**
   * Leaves the current meeting session for the local user
   */
  leaveMeeting(): Promise<void>;

  /**
   * Ends meeting for all participants (Teacher/Admin only)
   */
  endMeeting(): Promise<void>;

  /**
   * Toggle local microphone
   */
  toggleAudio(muted?: boolean): Promise<boolean>;

  /**
   * Toggle local camera
   */
  toggleVideo(muted?: boolean): Promise<boolean>;

  /**
   * Start screen sharing
   */
  startScreenShare(): Promise<boolean>;

  /**
   * Stop screen sharing
   */
  stopScreenShare(): Promise<boolean>;

  /**
   * Mute an individual participant (moderator)
   */
  muteParticipant(participantId: string): Promise<void>;

  /**
   * Mute all non-moderator participants
   */
  muteAll(): Promise<void>;

  /**
   * Remove a participant from the room
   */
  removeParticipant(participantId: string): Promise<void>;

  /**
   * Start recording session (where supported)
   */
  startRecording(): Promise<boolean>;

  /**
   * Stop recording session
   */
  stopRecording(): Promise<boolean>;

  /**
   * Retrieve list of active participants
   */
  getParticipants(): ProviderParticipant[];

  /**
   * Get current connection state
   */
  getConnectionState(): MeetingConnectionState;

  /**
   * Subscribe to provider lifecycle events
   */
  on(event: string, handler: ProviderEventHandler): void;
  off(event: string, handler: ProviderEventHandler): void;

  /**
   * Clean up resources
   */
  dispose(): void;
}

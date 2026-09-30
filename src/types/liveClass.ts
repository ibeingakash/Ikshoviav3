export type LiveClassRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type MeetingType = 
  | 'LECTURE' 
  | 'DOUBT_CLEARING' 
  | 'ESSAY_EVALUATION' 
  | 'MENTORSHIP' 
  | 'ANSWER_WRITING'
  | 'GROUP_STUDY';

export type LiveClassStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'ENDED' | 'CANCELLED' | 'DELETED';

export type DirectCallStatus = 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'ENDED' | 'MISSED';

export interface DirectVideoCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  calleeAvatar?: string;
  roomId: string;
  status: DirectCallStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClass {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  subject?: string;
  exam: 'UPSC' | 'BPSC' | 'ALL' | 'BOTH';
  topic?: string;
  teacherId?: string | null;
  teacherName: string;
  teacherAvatar?: string;
  scheduledDate?: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:MM'
  scheduledStartIso?: string;
  scheduledAt?: string; // Alias for scheduled date & time ISO
  expectedDurationMinutes?: number;
  durationMinutes?: number; // Alias for expected duration
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  maxParticipants?: number;
  meetingType?: MeetingType;
  status: LiveClassStatus;
  isInstant?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  enableChat?: boolean;
  enableQA?: boolean;
  studentMicAllowed?: boolean;
  allowStudentMic?: boolean;
  studentCameraAllowed?: boolean;
  allowStudentCamera?: boolean;
  waitingRoomEnabled?: boolean;
  screenSharingAllowed?: boolean;
  fileSharingAllowed?: boolean;
  isLocked?: boolean;
  targetCourseId?: string | null;
  targetTestSeriesId?: string | null;
  linkedMockTestId?: string | null;
  linkedMainsTaskId?: string | null;
  metadata?: Record<string, any>;
  registeredCount?: number;
  enrolledCount?: number;
  isRegistered?: boolean;
  activeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveClassParticipant {
  id: string;
  liveClassId: string;
  userId: string;
  role: LiveClassRole;
  displayName: string;
  userName?: string;
  avatarUrl?: string;
  isRegistered: boolean;
  registeredAt?: string;
  isAdmitted: boolean;
  isMuted: boolean;
  cameraOn: boolean;
  handRaised: boolean;
  handRaisedAt?: string | null;
  status: 'REGISTERED' | 'WAITING' | 'JOINED' | 'LEFT' | 'REMOVED';
  lastSeenAt?: string;
}

export interface LiveClassAttendance {
  id: string;
  liveClassId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  joinTime: string;
  leaveTime?: string | null;
  totalDurationSeconds: number;
  rejoinCount: number;
  attendanceStatus: 'PRESENT' | 'LATE' | 'LEFT_EARLY' | 'ABSENT';
  createdAt: string;
}

export interface LiveClassMessage {
  id: string;
  liveClassId: string;
  senderId: string;
  senderName: string;
  senderRole: LiveClassRole;
  message: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface LiveClassQuestion {
  id: string;
  liveClassId: string;
  studentId: string;
  studentName: string;
  authorName?: string;
  question: string;
  upvotes: number;
  upvotedBy: string[]; // userIds
  status: 'PENDING' | 'ANSWERING' | 'ANSWERED' | 'DISMISSED' | 'UNANSWERED';
  isPinned: boolean;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface LiveClassFile {
  id: string;
  liveClassId: string;
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  description?: string;
  createdAt: string;
}

export interface LiveClassRecording {
  id: string;
  liveClassId: string;
  title: string;
  recordingUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  transcript?: string;
  keyTakeaways?: string[];
  downloadAllowed: boolean;
  createdAt: string;
  classDetails?: Partial<LiveClass>;
}

export interface LiveClassPoll {
  id: string;
  liveClassId: string;
  createdBy: string;
  question: string;
  options: { id: string; text: string; votes?: number; voteCount?: number }[];
  isAnonymous: boolean;
  durationSeconds: number;
  status: 'ACTIVE' | 'CLOSED';
  isClosed?: boolean;
  totalVotes?: number;
  userVotedOptionId?: string | null;
  createdAt: string;
  closedAt?: string;
}

export interface LiveClassPollResponse {
  id: string;
  pollId: string;
  liveClassId: string;
  userId: string;
  optionId: string;
  createdAt: string;
}

export interface LiveClassAnalytics {
  totalClasses: number;
  liveNowCount: number;
  upcomingCount: number;
  completedCount: number;
  averageAttendance: number;
  averageDurationMinutes: number;
  totalUniqueStudents: number;
  mostAttendedClasses: {
    id: string;
    title: string;
    teacherName: string;
    exam: string;
    attendanceCount: number;
    date: string;
  }[];
  recentRecordingsCount: number;
}

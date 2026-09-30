import {
  LiveClass,
  LiveClassParticipant,
  LiveClassAttendance,
  LiveClassMessage,
  LiveClassQuestion,
  LiveClassFile,
  LiveClassRecording,
  LiveClassPoll,
  LiveClassAnalytics,
  DirectVideoCall
} from '../types/liveClass.js';
import { apiFetch, getAuthHeaders } from '../lib/api.js';

const liveFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const authHeaders = getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers || {})
  };
  return apiFetch(endpoint, {
    ...options,
    headers
  });
};

export const liveClassService = {
  async getClasses(filters?: {
    exam?: string;
    status?: string;
    teacherId?: string;
    search?: string;
    tab?: string;
    adminView?: boolean;
  }): Promise<LiveClass[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.exam) params.append('exam', filters.exam);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.teacherId) params.append('teacherId', filters.teacherId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tab) params.append('tab', filters.tab);
      if (filters?.adminView) params.append('adminView', 'true');

      const res = await liveFetch(`/api/live/classes?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getClassById(id: string): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}`);
    if (!res.ok) throw new Error('Class not found');
    return res.json();
  },

  async createClass(data: Partial<LiveClass>): Promise<LiveClass> {
    const res = await liveFetch('/api/live/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create live class');
    }
    return res.json();
  },

  async createGroupCall(data: { title: string; topic?: string; exam?: string; maxParticipants?: number; description?: string }): Promise<LiveClass> {
    const res = await liveFetch('/api/live/group-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      if (res.status === 404) {
        // Fallback for servers that create instant group rooms through standard classes
        return this.createClass({
          title: data.title,
          description: data.topic || data.description || 'Live Peer Study Room',
          exam: (data.exam as any) || 'BOTH',
          subject: data.topic || 'General Discussion',
          scheduledStartIso: new Date().toISOString(),
          durationMinutes: 90,
          maxParticipants: data.maxParticipants || 25,
          isInstant: true,
          isPublished: true,
        });
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize group call room');
    }
    return res.json();
  },

  async getMeetingById(meetingId: string): Promise<LiveClass> {
    const cleanId = meetingId.trim().toUpperCase();
    const res = await liveFetch(`/api/live/meetings/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      return res.json();
    }
    if (res.status === 404) {
      // Fallback: search classes list by meetingId or id
      const classes = await this.getClasses();
      const match = classes.find(c =>
        c.meetingId?.toUpperCase() === cleanId ||
        c.id === meetingId.trim()
      );
      if (match) return match;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Meeting '${meetingId}' not found`);
  },

  async updateClass(id: string, updates: Partial<LiveClass>): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update class');
    return res.json();
  },

  async startClass(id: string): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}/start`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start class');
    return res.json();
  },

  async endClass(id: string): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}/end`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to end class');
    return res.json();
  },

  async publishClass(id: string, isPublished: boolean): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished }),
    });
    if (!res.ok) throw new Error('Failed to update publication status');
    return res.json();
  },

  async cancelClass(id: string): Promise<LiveClass> {
    const res = await liveFetch(`/api/live/classes/${id}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to cancel class');
    return res.json();
  },

  async deleteClass(id: string): Promise<boolean> {
    const res = await liveFetch(`/api/live/classes/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async registerForClass(id: string): Promise<LiveClassParticipant> {
    const res = await liveFetch(`/api/live/classes/${id}/register`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to register for class');
    return res.json();
  },

  async joinClass(id: string): Promise<{
    participant: LiveClassParticipant;
    roomConfig: {
      roomName: string;
      meetingId: string;
      title: string;
      isTeacher: boolean;
      waitingRoom: boolean;
      token?: string;
    };
  }> {
    const res = await liveFetch(`/api/live/classes/${id}/join`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to join class');
    }
    return res.json();
  },

  async leaveClass(id: string): Promise<void> {
    await liveFetch(`/api/live/classes/${id}/leave`, {
      method: 'POST',
    }).catch(() => {});
  },

  async updateParticipantState(id: string, updates: {
    isMuted?: boolean;
    cameraOn?: boolean;
    handRaised?: boolean;
    isAdmitted?: boolean;
    status?: string;
    targetUserId?: string;
  }): Promise<LiveClassParticipant> {
    const res = await liveFetch(`/api/live/classes/${id}/participants/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update participant status');
    return res.json();
  },

  async getParticipants(id: string): Promise<LiveClassParticipant[]> {
    const res = await liveFetch(`/api/live/classes/${id}/participants`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAttendance(id: string): Promise<{
    records: LiveClassAttendance[];
    summary: {
      totalEnrolled: number;
      totalAttended: number;
      presentCount: number;
      lateCount: number;
      leftEarlyCount: number;
      averageDurationMinutes: number;
    };
  }> {
    const res = await liveFetch(`/api/live/classes/${id}/attendance`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  async getMessages(id: string): Promise<LiveClassMessage[]> {
    const res = await liveFetch(`/api/live/classes/${id}/messages`);
    if (!res.ok) return [];
    return res.json();
  },

  async sendMessage(id: string, message: string): Promise<LiveClassMessage> {
    const res = await liveFetch(`/api/live/classes/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async pinMessage(id: string, messageId: string, isPinned: boolean): Promise<boolean> {
    const res = await liveFetch(`/api/live/classes/${id}/messages/${messageId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned }),
    });
    return res.ok;
  },

  async deleteMessage(id: string, messageId: string): Promise<boolean> {
    const res = await liveFetch(`/api/live/classes/${id}/messages/${messageId}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async getQuestions(id: string): Promise<LiveClassQuestion[]> {
    const res = await liveFetch(`/api/live/classes/${id}/questions`);
    if (!res.ok) return [];
    return res.json();
  },

  async askQuestion(id: string, question: string): Promise<LiveClassQuestion> {
    const res = await liveFetch(`/api/live/classes/${id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('Failed to submit question');
    return res.json();
  },

  async upvoteQuestion(id: string, questionId: string): Promise<LiveClassQuestion> {
    const res = await liveFetch(`/api/live/classes/${id}/questions/${questionId}/upvote`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to upvote question');
    return res.json();
  },

  async updateQuestion(id: string, questionId: string, updates: {
    status?: string;
    isPinned?: boolean;
    answer?: string;
  }): Promise<LiveClassQuestion> {
    const res = await liveFetch(`/api/live/classes/${id}/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update question');
    return res.json();
  },

  async getFiles(id: string): Promise<LiveClassFile[]> {
    const res = await liveFetch(`/api/live/classes/${id}/files`);
    if (!res.ok) return [];
    return res.json();
  },

  async addFile(id: string, fileData: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSizeBytes?: number;
    description?: string;
  }): Promise<LiveClassFile> {
    const res = await liveFetch(`/api/live/classes/${id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  async getRecordings(classId?: string): Promise<LiveClassRecording[]> {
    try {
      const url = classId ? `/api/live/recordings?classId=${classId}` : '/api/live/recordings';
      const res = await liveFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async addRecording(id: string, recordingData: {
    title: string;
    recordingUrl: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
    transcript?: string;
    keyTakeaways?: string[];
  }): Promise<LiveClassRecording> {
    const res = await liveFetch(`/api/live/classes/${id}/recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordingData),
    });
    if (!res.ok) throw new Error('Failed to save recording');
    return res.json();
  },

  async getPolls(id: string): Promise<LiveClassPoll[]> {
    const res = await liveFetch(`/api/live/classes/${id}/polls`);
    if (!res.ok) return [];
    return res.json();
  },

  async createPoll(id: string, pollData: {
    question: string;
    options: string[];
    durationSeconds?: number;
    isAnonymous?: boolean;
  }): Promise<LiveClassPoll> {
    const res = await liveFetch(`/api/live/classes/${id}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pollData),
    });
    if (!res.ok) throw new Error('Failed to create poll');
    return res.json();
  },

  async votePoll(id: string, pollId: string, optionId: string): Promise<boolean> {
    const res = await liveFetch(`/api/live/classes/${id}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    return res.ok;
  },

  async closePoll(id: string, pollId: string): Promise<boolean> {
    const res = await liveFetch(`/api/live/classes/${id}/polls/${pollId}/close`, {
      method: 'POST',
    });
    return res.ok;
  },

  async getAdminAnalytics(): Promise<LiveClassAnalytics> {
    const res = await liveFetch('/api/live/admin/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // 1:1 Direct Video Calling
  async getCallableUsers(search?: string): Promise<{ id: string; name: string; email: string; role: string; avatarUrl?: string }[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const res = await liveFetch(`/api/live/calls/users?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getActiveDirectCall(): Promise<{ call: DirectVideoCall | null }> {
    const res = await liveFetch('/api/live/calls/active');
    if (!res.ok) return { call: null };
    return res.json();
  },

  async initiateDirectCall(calleeId: string, calleeName?: string, calleeAvatar?: string): Promise<DirectVideoCall> {
    const res = await liveFetch('/api/live/calls/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calleeId, calleeName, calleeAvatar }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initiate call');
    }
    return res.json();
  },

  async respondDirectCall(callId: string, action: 'ACCEPT' | 'DECLINE'): Promise<DirectVideoCall> {
    const res = await liveFetch(`/api/live/calls/${callId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to respond to call');
    }
    return res.json();
  },

  async endDirectCall(callId: string): Promise<DirectVideoCall> {
    const res = await liveFetch(`/api/live/calls/${callId}/end`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to end call');
    return res.json();
  },

  async getDirectCallRoom(roomId: string): Promise<DirectVideoCall> {
    const res = await liveFetch(`/api/live/calls/room/${roomId}`);
    if (!res.ok) throw new Error('Failed to load call room');
    return res.json();
  },
};

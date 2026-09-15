import {
  YptGroup,
  YptMember,
  YptStudySession,
  YptTodaySummary
} from '../types/index.js';
import { apiUrl, getAuthHeaders } from '../lib/api.js';

const yptFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const authHeaders = getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers || {})
  };
  return fetch(apiUrl(endpoint), {
    ...options,
    headers
  });
};

export const yptService = {
  async getTodaySummary(): Promise<YptTodaySummary> {
    const res = await yptFetch('/api/ypt/today');
    if (!res.ok) throw new Error('Failed to fetch today study summary');
    return res.json();
  },

  async startSession(subjectId: string, subjectName: string, topic?: string): Promise<{ session: YptStudySession }> {
    const res = await yptFetch('/api/ypt/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, subjectName, topic }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start study session');
    }
    return res.json();
  },

  async stopSession(sessionId: string): Promise<{ session: YptStudySession }> {
    const res = await yptFetch('/api/ypt/session/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error('Failed to stop study session');
    return res.json();
  },

  async getGroups(filters?: { search?: string; category?: string; myGroups?: boolean }): Promise<{ groups: YptGroup[] }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.myGroups) params.append('myGroups', 'true');

    const res = await yptFetch(`/api/ypt/groups?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch groups');
    return res.json();
  },

  async createGroup(data: {
    name: string;
    description?: string;
    category?: string;
    maxMembers?: number;
    isPrivate?: boolean;
    accessCode?: string;
    targetDailyMinutes?: number;
  }): Promise<{ group: YptGroup }> {
    const res = await yptFetch('/api/ypt/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create group');
    }
    return res.json();
  },

  async getGroupDetails(groupId: string): Promise<{ group: YptGroup; members: YptMember[] }> {
    const res = await yptFetch(`/api/ypt/groups/${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch group details');
    return res.json();
  },

  async joinGroup(groupId: string, accessCode?: string): Promise<{ success: boolean; message: string }> {
    const res = await yptFetch(`/api/ypt/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to join group');
    }
    return res.json();
  },

  async leaveGroup(groupId: string): Promise<{ success: boolean }> {
    const res = await yptFetch(`/api/ypt/groups/${groupId}/leave`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to leave group');
    return res.json();
  },

  async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    const res = await yptFetch(`/api/ypt/groups/${groupId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete group');
    return res.json();
  },

  async getLeaderboard(groupId: string): Promise<{ leaderboard: YptMember[] }> {
    const res = await yptFetch(`/api/ypt/groups/${groupId}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch group leaderboard');
    return res.json();
  },
};

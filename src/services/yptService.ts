import {
  YptGroup,
  YptMember,
  YptStudySession,
  YptTodaySummary
} from '../types/index.js';
import { apiFetch, getAuthHeaders } from '../lib/api.js';

const yptFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
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

export const yptService = {
  async getTodaySummary(): Promise<YptTodaySummary> {
    try {
      const res = await yptFetch('/api/ypt/today');
      if (!res.ok) {
        return {
          todaySeconds: 0,
          todayMinutes: 0,
          dailyGoalMinutes: 120,
          goalProgressPercent: 0,
          sessionsCount: 0,
          activeStudying: false,
          activeGroupsCount: 0,
        };
      }
      return await res.json();
    } catch {
      return {
        todaySeconds: 0,
        todayMinutes: 0,
        dailyGoalMinutes: 120,
        goalProgressPercent: 0,
        sessionsCount: 0,
        activeStudying: false,
        activeGroupsCount: 0,
      };
    }
  },

  async startSession(subjectId: string, subjectName: string, topic?: string): Promise<{ session: YptStudySession }> {
    let res = await yptFetch('/api/ypt/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, subjectName, topic }),
    });
    // Fallback for older backend versions that only accept /api/ypt/sessions
    if (!res.ok && res.status === 404) {
      res = await yptFetch('/api/ypt/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectName || subjectId || 'General Study',
          durationSeconds: 1,
          startedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const legacySession = await res.json();
        return { session: legacySession };
      }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start study session');
    }
    return res.json();
  },

  async stopSession(
    sessionId: string,
    options?: { durationSeconds?: number; endedAt?: string; subject?: string }
  ): Promise<{ session: YptStudySession }> {
    let res = await yptFetch('/api/ypt/session/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        durationSeconds: options?.durationSeconds,
        endedAt: options?.endedAt,
      }),
    });
    // Fallback for older backend versions that only accept /api/ypt/sessions
    if (!res.ok && res.status === 404) {
      res = await yptFetch('/api/ypt/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: options?.subject || 'General Study',
          durationSeconds: Math.max(1, options?.durationSeconds || 60),
          endedAt: options?.endedAt || new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const legacySession = await res.json();
        return { session: legacySession };
      }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to stop study session');
    }
    return res.json();
  },

  async getGroups(filters?: { search?: string; category?: string; myGroups?: boolean }): Promise<{ groups: YptGroup[] }> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.myGroups) params.append('myGroups', 'true');

      const res = await yptFetch(`/api/ypt/groups?${params.toString()}`);
      if (!res.ok) return { groups: [] };
      const data = await res.json();
      return { groups: Array.isArray(data.groups) ? data.groups : [] };
    } catch {
      return { groups: [] };
    }
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
    try {
      const res = await yptFetch(`/api/ypt/groups/${groupId}/leaderboard`);
      if (!res.ok) return { leaderboard: [] };
      const data = await res.json();
      return { leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [] };
    } catch {
      return { leaderboard: [] };
    }
  },
};

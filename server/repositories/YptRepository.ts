import pool from '../db/pool.js';

export interface YptGroup {
  id: string;
  name: string;
  description?: string;
  exam: string;
  creatorId: string;
  creatorName: string;
  inviteCode: string;
  dailyGoalMinutes: number;
  isArchived: boolean;
  memberCount: number;
  activeStudyingCount: number;
  userRole?: 'CREATOR' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
}

export interface YptMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  role: 'CREATOR' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isActiveStudying: boolean;
  currentSubject?: string;
  lastActiveAt: string;
  todaySeconds: number;
}

export interface YptStudySession {
  id: string;
  userId: string;
  groupId?: string;
  subject: string;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  sessionDate: string;
  createdAt: string;
}

export interface YptTodaySummary {
  todaySeconds: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  goalProgressPercent: number;
  sessionsCount: number;
  activeStudying: boolean;
  currentSubject?: string;
  activeGroupsCount: number;
  primaryGroup?: {
    id: string;
    name: string;
    activeMembersCount: number;
    memberCount: number;
  };
}

export class YptRepository {
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `YPT-${rand}`;
  }

  async createGroup(
    data: { name: string; description?: string; exam?: string; dailyGoalMinutes?: number },
    creator: { id: string; name: string }
  ): Promise<YptGroup> {
    const groupId = `ypt_grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteCode = this.generateInviteCode();

    const groupRes = await pool.query(
      `INSERT INTO public.ypt_groups (
        id, name, description, exam, creator_id, creator_name, invite_code, daily_goal_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        groupId,
        data.name.trim(),
        data.description?.trim() || '',
        data.exam || 'ALL',
        creator.id,
        creator.name,
        inviteCode,
        data.dailyGoalMinutes || 360,
      ]
    );

    // Creator is automatically registered as CREATOR member
    const memberId = `ypt_mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO public.ypt_group_members (
        id, group_id, user_id, user_name, role, joined_at
      ) VALUES ($1, $2, $3, $4, 'CREATOR', NOW())
      ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'CREATOR'`,
      [memberId, groupId, creator.id, creator.name]
    );

    const row = groupRes.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      exam: row.exam,
      creatorId: row.creator_id,
      creatorName: row.creator_name,
      inviteCode: row.invite_code,
      dailyGoalMinutes: row.daily_goal_minutes,
      isArchived: row.is_archived,
      memberCount: 1,
      activeStudyingCount: 0,
      userRole: 'CREATOR',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getUserGroups(userId: string): Promise<YptGroup[]> {
    const res = await pool.query(
      `SELECT
        g.*,
        m.role AS user_role,
        (SELECT COUNT(*) FROM public.ypt_group_members m2 WHERE m2.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM public.ypt_group_members m3 WHERE m3.group_id = g.id AND m3.is_active_studying = TRUE) AS active_studying_count
      FROM public.ypt_groups g
      JOIN public.ypt_group_members m ON m.group_id = g.id AND m.user_id = $1
      WHERE g.is_archived = FALSE
      ORDER BY g.created_at DESC`,
      [userId]
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      exam: r.exam,
      creatorId: r.creator_id,
      creatorName: r.creator_name,
      inviteCode: r.invite_code,
      dailyGoalMinutes: r.daily_goal_minutes,
      isArchived: r.is_archived,
      memberCount: parseInt(r.member_count, 10) || 0,
      activeStudyingCount: parseInt(r.active_studying_count, 10) || 0,
      userRole: r.user_role,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getDiscoverableGroups(userId: string, search?: string): Promise<YptGroup[]> {
    const conditions = ['g.is_archived = FALSE'];
    const values: any[] = [userId];
    let idx = 2;

    if (search && search.trim()) {
      conditions.push(`(g.name ILIKE $${idx} OR g.description ILIKE $${idx} OR g.exam ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const res = await pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM public.ypt_group_members m2 WHERE m2.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM public.ypt_group_members m3 WHERE m3.group_id = g.id AND m3.is_active_studying = TRUE) AS active_studying_count,
        (SELECT m4.role FROM public.ypt_group_members m4 WHERE m4.group_id = g.id AND m4.user_id = $1) AS user_role
      FROM public.ypt_groups g
      WHERE ${conditions.join(' AND ')}
      ORDER BY member_count DESC
      LIMIT 30`,
      values
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      exam: r.exam,
      creatorId: r.creator_id,
      creatorName: r.creator_name,
      inviteCode: r.invite_code,
      dailyGoalMinutes: r.daily_goal_minutes,
      isArchived: r.is_archived,
      memberCount: parseInt(r.member_count, 10) || 0,
      activeStudyingCount: parseInt(r.active_studying_count, 10) || 0,
      userRole: r.user_role || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getGroupById(groupId: string, userId?: string): Promise<{ group: YptGroup; members: YptMember[] } | null> {
    const groupRes = await pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM public.ypt_group_members m2 WHERE m2.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM public.ypt_group_members m3 WHERE m3.group_id = g.id AND m3.is_active_studying = TRUE) AS active_studying_count,
        (SELECT m4.role FROM public.ypt_group_members m4 WHERE m4.group_id = g.id AND m4.user_id = $2) AS user_role
      FROM public.ypt_groups g
      WHERE g.id = $1`,
      [groupId, userId || null]
    );

    if (groupRes.rows.length === 0) return null;
    const r = groupRes.rows[0];

    const group: YptGroup = {
      id: r.id,
      name: r.name,
      description: r.description,
      exam: r.exam,
      creatorId: r.creator_id,
      creatorName: r.creator_name,
      inviteCode: r.invite_code,
      dailyGoalMinutes: r.daily_goal_minutes,
      isArchived: r.is_archived,
      memberCount: parseInt(r.member_count, 10) || 0,
      activeStudyingCount: parseInt(r.active_studying_count, 10) || 0,
      userRole: r.user_role || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };

    // Fetch members with today's study duration
    const membersRes = await pool.query(
      `SELECT
        m.*,
        COALESCE((
          SELECT SUM(s.duration_seconds)
          FROM public.ypt_study_sessions s
          WHERE s.user_id = m.user_id AND s.session_date = CURRENT_DATE
        ), 0) AS today_seconds
      FROM public.ypt_group_members m
      WHERE m.group_id = $1
      ORDER BY today_seconds DESC, m.joined_at ASC`,
      [groupId]
    );

    const members: YptMember[] = membersRes.rows.map(m => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      userName: m.user_name,
      role: m.role,
      joinedAt: m.joined_at,
      isActiveStudying: Boolean(m.is_active_studying),
      currentSubject: m.current_subject,
      lastActiveAt: m.last_active_at,
      todaySeconds: parseInt(m.today_seconds, 10) || 0,
    }));

    return { group, members };
  }

  async joinByCode(code: string, user: { id: string; name: string }): Promise<YptGroup> {
    const cleanCode = code.trim().toUpperCase();
    const groupRes = await pool.query(
      `SELECT * FROM public.ypt_groups WHERE UPPER(invite_code) = $1 AND is_archived = FALSE`,
      [cleanCode]
    );

    if (groupRes.rows.length === 0) {
      throw new Error('Invalid or expired invite code. Please verify and try again.');
    }

    const group = groupRes.rows[0];

    // Insert membership
    const memberId = `ypt_mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO public.ypt_group_members (
        id, group_id, user_id, user_name, role, joined_at
      ) VALUES ($1, $2, $3, $4, 'MEMBER', NOW())
      ON CONFLICT (group_id, user_id) DO UPDATE SET user_name = $4`,
      [memberId, group.id, user.id, user.name]
    );

    const full = await this.getGroupById(group.id, user.id);
    return full!.group;
  }

  async updateGroup(
    groupId: string,
    updates: { name?: string; description?: string; exam?: string; dailyGoalMinutes?: number },
    userId: string
  ): Promise<YptGroup> {
    const check = await pool.query(
      `SELECT creator_id FROM public.ypt_groups WHERE id = $1`,
      [groupId]
    );
    if (check.rows.length === 0) throw new Error('Group not found');
    if (check.rows[0].creator_id !== userId) {
      throw new Error('Only the group creator can edit group details');
    }

    const res = await pool.query(
      `UPDATE public.ypt_groups SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        exam = COALESCE($3, exam),
        daily_goal_minutes = COALESCE($4, daily_goal_minutes),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
      [updates.name?.trim(), updates.description?.trim(), updates.exam, updates.dailyGoalMinutes, groupId]
    );

    const full = await this.getGroupById(groupId, userId);
    return full!.group;
  }

  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const check = await pool.query(
      `SELECT creator_id FROM public.ypt_groups WHERE id = $1`,
      [groupId]
    );
    if (check.rows.length === 0) return false;
    if (check.rows[0].creator_id !== userId) {
      throw new Error('Only the group creator can delete this group');
    }

    await pool.query(`DELETE FROM public.ypt_groups WHERE id = $1`, [groupId]);
    return true;
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const check = await pool.query(
      `SELECT role FROM public.ypt_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    if (check.rows.length === 0) return false;

    // If creator leaves, check if there are other members
    if (check.rows[0].role === 'CREATOR') {
      const nextMember = await pool.query(
        `SELECT user_id, user_name FROM public.ypt_group_members
         WHERE group_id = $1 AND user_id != $2
         ORDER BY joined_at ASC LIMIT 1`,
        [groupId, userId]
      );
      if (nextMember.rows.length > 0) {
        // Transfer creator role to next member
        await pool.query(
          `UPDATE public.ypt_group_members SET role = 'CREATOR' WHERE group_id = $1 AND user_id = $2`,
          [groupId, nextMember.rows[0].user_id]
        );
        await pool.query(
          `UPDATE public.ypt_groups SET creator_id = $1, creator_name = $2 WHERE id = $3`,
          [nextMember.rows[0].user_id, nextMember.rows[0].user_name, groupId]
        );
      } else {
        // No other members, delete the group
        await pool.query(`DELETE FROM public.ypt_groups WHERE id = $1`, [groupId]);
        return true;
      }
    }

    await pool.query(
      `DELETE FROM public.ypt_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    return true;
  }

  async removeMember(groupId: string, targetUserId: string, requesterUserId: string): Promise<boolean> {
    const check = await pool.query(
      `SELECT creator_id FROM public.ypt_groups WHERE id = $1`,
      [groupId]
    );
    if (check.rows.length === 0) return false;
    if (check.rows[0].creator_id !== requesterUserId) {
      throw new Error('Only the group creator can remove members');
    }

    await pool.query(
      `DELETE FROM public.ypt_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, targetUserId]
    );
    return true;
  }

  async logStudySession(data: {
    userId: string;
    groupId?: string;
    subject: string;
    durationSeconds: number;
    startedAt: string;
    endedAt: string;
  }): Promise<YptStudySession> {
    const sessionId = `ypt_ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.ypt_study_sessions (
        id, user_id, group_id, subject, duration_seconds, started_at, ended_at, session_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
      RETURNING *`,
      [
        sessionId,
        data.userId,
        data.groupId || null,
        data.subject,
        data.durationSeconds,
        data.startedAt,
        data.endedAt,
      ]
    );

    // Reset is_active_studying
    await pool.query(
      `UPDATE public.ypt_group_members
       SET is_active_studying = FALSE, current_subject = NULL, last_active_at = NOW()
       WHERE user_id = $1`,
      [data.userId]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      groupId: r.group_id,
      subject: r.subject,
      durationSeconds: r.duration_seconds,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      sessionDate: r.session_date,
      createdAt: r.created_at,
    };
  }

  async updateStudyStatus(userId: string, isStudying: boolean, subject?: string): Promise<void> {
    await pool.query(
      `UPDATE public.ypt_group_members
       SET is_active_studying = $1, current_subject = $2, last_active_at = NOW()
       WHERE user_id = $3`,
      [isStudying, subject || null, userId]
    );
  }

  async getUserTodaySummary(userId: string): Promise<YptTodaySummary> {
    const secRes = await pool.query(
      `SELECT
        COALESCE(SUM(duration_seconds), 0) AS total_seconds,
        COUNT(*) AS sessions_count
       FROM public.ypt_study_sessions
       WHERE user_id = $1 AND session_date = CURRENT_DATE`,
      [userId]
    );

    const totalSeconds = parseInt(secRes.rows[0]?.total_seconds || '0', 10);
    const sessionsCount = parseInt(secRes.rows[0]?.sessions_count || '0', 10);
    const todayMinutes = Math.floor(totalSeconds / 60);

    const statusRes = await pool.query(
      `SELECT is_active_studying, current_subject
       FROM public.ypt_group_members
       WHERE user_id = $1
       ORDER BY is_active_studying DESC LIMIT 1`,
      [userId]
    );
    const isStudying = Boolean(statusRes.rows[0]?.is_active_studying);
    const currentSubject = statusRes.rows[0]?.current_subject || undefined;

    // Get primary active group
    const groupRes = await pool.query(
      `SELECT
        g.id, g.name, g.daily_goal_minutes,
        (SELECT COUNT(*) FROM public.ypt_group_members m WHERE m.group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM public.ypt_group_members m WHERE m.group_id = g.id AND m.is_active_studying = TRUE) AS active_studying_count
       FROM public.ypt_groups g
       JOIN public.ypt_group_members m ON m.group_id = g.id AND m.user_id = $1
       WHERE g.is_archived = FALSE
       ORDER BY g.created_at DESC
       LIMIT 1`,
      [userId]
    );

    let dailyGoal = 360; // 6 hours default
    let primaryGroup: YptTodaySummary['primaryGroup'] | undefined = undefined;

    if (groupRes.rows.length > 0) {
      const g = groupRes.rows[0];
      dailyGoal = g.daily_goal_minutes || 360;
      primaryGroup = {
        id: g.id,
        name: g.name,
        memberCount: parseInt(g.member_count, 10) || 1,
        activeMembersCount: parseInt(g.active_studying_count, 10) || 0,
      };
    }

    const groupsCountRes = await pool.query(
      `SELECT COUNT(*) FROM public.ypt_group_members WHERE user_id = $1`,
      [userId]
    );
    const activeGroupsCount = parseInt(groupsCountRes.rows[0]?.count || '0', 10);

    const goalProgressPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

    return {
      todaySeconds: totalSeconds,
      todayMinutes,
      dailyGoalMinutes: dailyGoal,
      goalProgressPercent,
      sessionsCount,
      activeStudying: isStudying,
      currentSubject,
      activeGroupsCount,
      primaryGroup,
    };
  }
}

export const yptRepository = new YptRepository();

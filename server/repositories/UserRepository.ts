import pool from '../db/pool.js';
import { UserProfile } from '../../src/types/index.js';

export class UserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.created_at,
        p.target_exam, p.selected_subjects, p.daily_goal_minutes, p.experience_level, p.goal_statement
      FROM public.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToUserProfile(res.rows[0]);
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.created_at,
        p.target_exam, p.selected_subjects, p.daily_goal_minutes, p.experience_level, p.goal_statement
      FROM public.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `;
    const res = await pool.query(query, [email]);
    if (res.rows.length === 0) return null;
    return this.mapRowToUserProfile(res.rows[0]);
  }

  async getPasswordHash(email: string): Promise<string | null> {
    const res = await pool.query('SELECT password_hash FROM public.user_passwords WHERE email = $1', [email]);
    if (res.rows.length === 0) return null;
    return res.rows[0].password_hash;
  }

  async createUser(data: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    isOnboarded?: boolean;
    passwordHash: string;
    onboarding?: {
      targetExam?: string;
      selectedSubjects?: string[];
      dailyGoalMinutes?: number;
      experienceLevel?: string;
      goalStatement?: string;
    };
  }): Promise<UserProfile> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `INSERT INTO public.users (id, email, name, avatar_url, role, is_onboarded)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.id,
          data.email,
          data.name,
          data.avatarUrl || null,
          data.role || 'USER',
          data.isOnboarded || false,
        ]
      );

      await client.query(
        `INSERT INTO public.user_passwords (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
        [data.email, data.passwordHash]
      );

      const onboarding = data.onboarding || {};
      const profileRes = await client.query(
        `INSERT INTO public.user_profiles (user_id, target_exam, selected_subjects, daily_goal_minutes, experience_level, goal_statement)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.id,
          onboarding.targetExam || 'UPSC CSE 2026',
          JSON.stringify(onboarding.selectedSubjects || []),
          onboarding.dailyGoalMinutes || 120,
          onboarding.experienceLevel || 'Intermediate',
          onboarding.goalStatement || '',
        ]
      );

      await client.query('COMMIT');

      const row = { ...profileRes.rows[0], ...userRes.rows[0] };
      return this.mapRowToUserProfile(row);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (updates.name !== undefined || updates.avatarUrl !== undefined || updates.isOnboarded !== undefined) {
        await client.query(
          `UPDATE public.users
           SET name = COALESCE($2, name),
               avatar_url = COALESCE($3, avatar_url),
               is_onboarded = COALESCE($4, is_onboarded),
               updated_at = NOW()
           WHERE id = $1`,
          [id, updates.name, updates.avatarUrl, updates.isOnboarded]
        );
      }

      if (updates.onboarding) {
        const ob = updates.onboarding;
        await client.query(
          `INSERT INTO public.user_profiles (user_id, target_exam, selected_subjects, daily_goal_minutes, experience_level, goal_statement)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO UPDATE SET
             target_exam = COALESCE($2, user_profiles.target_exam),
             selected_subjects = COALESCE($3, user_profiles.selected_subjects),
             daily_goal_minutes = COALESCE($4, user_profiles.daily_goal_minutes),
             experience_level = COALESCE($5, user_profiles.experience_level),
             goal_statement = COALESCE($6, user_profiles.goal_statement),
             updated_at = NOW()`,
          [
            id,
            ob.targetExam,
            ob.selectedSubjects ? JSON.stringify(ob.selectedSubjects) : null,
            ob.dailyGoalMinutes,
            ob.experienceLevel,
            ob.goalStatement,
          ]
        );
      }

      await client.query('COMMIT');
      return await this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getAdminPermissions(userId: string): Promise<string[]> {
    const res = await pool.query(
      'SELECT permission_code FROM public.admin_permissions WHERE user_id = $1',
      [userId]
    );
    return res.rows.map(r => r.permission_code);
  }

  async listUsers(): Promise<UserProfile[]> {
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.created_at,
        p.target_exam, p.selected_subjects, p.daily_goal_minutes, p.experience_level, p.goal_statement
      FROM public.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows.map(r => this.mapRowToUserProfile(r));
  }

  private mapRowToUserProfile(row: any): UserProfile {
    const selectedSubjects = Array.isArray(row.selected_subjects)
      ? row.selected_subjects
      : (typeof row.selected_subjects === 'string' ? JSON.parse(row.selected_subjects) : []);

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url || undefined,
      role: row.role,
      isOnboarded: row.is_onboarded,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      onboarding: row.target_exam ? {
        targetExam: row.target_exam,
        selectedSubjects: selectedSubjects,
        dailyGoalMinutes: row.daily_goal_minutes,
        experienceLevel: row.experience_level,
        goalStatement: row.goal_statement,
      } : undefined,
    };
  }
}

export const userRepository = new UserRepository();

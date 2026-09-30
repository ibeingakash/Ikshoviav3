import pool from '../db/pool.js';
import { getSupabase } from '../supabase.js';
import { UserProfile, ManagedUser, UserRole, EntitlementStatus, TEACHER_PERMISSIONS } from '../../src/types/index.js';

export const DEFAULT_ADMIN_PERMISSIONS: string[] = [
  'USERS_VIEW',
  'USERS_EDIT',
  'USERS_SUSPEND',
  'USERS_GRANT_ACCESS',
  'USERS_REVOKE_ACCESS',
  'COURSES_VIEW',
  'COURSES_CREATE',
  'COURSES_EDIT',
  'COURSES_ARCHIVE',
  'PRICING_VIEW',
  'PRICING_EDIT',
  'ENTITLEMENTS_VIEW',
  'ENTITLEMENTS_GRANT',
  'ENTITLEMENTS_EXTEND',
  'ENTITLEMENTS_REVOKE',
  'COUPONS_VIEW',
  'COUPONS_CREATE',
  'COUPONS_EDIT',
  'COUPONS_DELETE',
  'COMMERCIAL_VIEW',
  'PAYMENTS_VIEW',
  'PAYMENTS_REFUND',
  'REVENUE_VIEW',
  'QUESTION_BANK_VIEW',
  'QUESTION_BANK_EDIT',
  'QUESTION_CREATE',
  'QUESTION_EDIT',
  'QUESTION_PUBLISH',
  'MOCKS_VIEW',
  'MOCKS_CREATE',
  'MOCKS_EDIT',
  'MOCKS_DELETE',
  'CONTENT_IMPORT',
  'OCR_IMPORT',
  'OCR_REVIEW',
  'CONCEPT_CREATE',
  'CURRENT_AFFAIRS_MANAGE',
  'ANALYTICS_VIEW',
];

export const SUPER_ADMIN_PERMISSIONS: string[] = [
  'ALL_PERMISSIONS',
  'ADMIN_MANAGE',
  'SYSTEM_SETTINGS',
  'AUDIT_LOG_VIEW',
];

export class UserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.status, u.is_suspended, u.created_at,
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
    const cleanEmail = email.trim().toLowerCase();
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.status, u.is_suspended, u.created_at,
        p.target_exam, p.selected_subjects, p.daily_goal_minutes, p.experience_level, p.goal_statement
      FROM public.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const res = await pool.query(query, [cleanEmail]);
    if (res.rows.length === 0) return null;
    return this.mapRowToUserProfile(res.rows[0]);
  }

  async getPasswordHash(email: string): Promise<string | null> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await pool.query('SELECT password_hash FROM public.user_passwords WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (res.rows.length === 0) return null;
    return res.rows[0].password_hash;
  }

  async updatePassword(email: string, passwordHash: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await pool.query(
      `INSERT INTO public.user_passwords (email, password_hash, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [cleanEmail, passwordHash]
    );
    return (res.rowCount || 0) > 0;
  }

  async createUser(data: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER';
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
        `INSERT INTO public.users (id, email, name, avatar_url, role, is_onboarded, status, is_suspended)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', false)
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
    try {
      const res = await pool.query(
        'SELECT permission_code FROM public.admin_permissions WHERE user_id = $1',
        [userId]
      );
      const perms = res.rows.map(r => r.permission_code);
      if (perms.length > 0) {
        if (userId === 'usr_admin') {
          return Array.from(new Set([...perms, ...DEFAULT_ADMIN_PERMISSIONS]));
        }
        return perms;
      }
    } catch (err: any) {
      console.warn('[UserRepository] getAdminPermissions query notice:', err.message);
    }

    if (userId === 'usr_superadmin') {
      return SUPER_ADMIN_PERMISSIONS;
    }
    if (userId === 'usr_admin') {
      return DEFAULT_ADMIN_PERMISSIONS;
    }
    if (userId === 'usr_teacher') {
      return Object.values(TEACHER_PERMISSIONS);
    }
    try {
      const uRoleRes = await pool.query('SELECT role FROM public.users WHERE id = $1', [userId]);
      if (uRoleRes.rows[0]?.role === 'TEACHER') {
        return Object.values(TEACHER_PERMISSIONS);
      }
    } catch {}
    return [];
  }

  async setAdminPermissions(userId: string, permissions: string[]): Promise<string[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM public.admin_permissions WHERE user_id = $1', [userId]);
      for (const p of permissions) {
        if (p && p.trim()) {
          await client.query(
            'INSERT INTO public.admin_permissions (user_id, permission_code) VALUES ($1, $2)',
            [userId, p.trim()]
          );
        }
      }
      await client.query('COMMIT');
      return this.getAdminPermissions(userId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<UserProfile> {
    if (userId === 'usr_superadmin' && newRole !== 'SUPER_ADMIN') {
      throw new Error('Cannot demote root Super Admin account');
    }
    await pool.query(
      'UPDATE public.users SET role = $2, updated_at = NOW() WHERE id = $1',
      [userId, newRole]
    );
    const updated = await this.findById(userId);
    if (!updated) throw new Error(`User with ID ${userId} not found`);
    return updated;
  }

  async toggleUserSuspension(userId: string, suspend?: boolean): Promise<{ isSuspended: boolean }> {
    if (userId === 'usr_superadmin') {
      throw new Error('Cannot suspend root Super Admin account');
    }
    const currentRes = await pool.query('SELECT is_suspended FROM public.users WHERE id = $1', [userId]);
    if (currentRes.rows.length === 0) throw new Error(`User with ID ${userId} not found`);
    const nextState = suspend !== undefined ? suspend : !currentRes.rows[0].is_suspended;
    await pool.query('UPDATE public.users SET is_suspended = $2, updated_at = NOW() WHERE id = $1', [userId, nextState]);
    return { isSuspended: nextState };
  }

  async removeUser(
    userId: string,
    actorId: string,
    actorRole: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; previousStatus: string }> {
    const protectedIds = new Set(['usr_superadmin', 'usr_admin', 'usr_student', 'usr_teacher']);
    const protectedEmails = new Set(['superadmin@ikshovia.com', 'admin@ikshovia.com', 'student@ikshovia.com', 'teacher@ikshovia.com']);

    if (protectedIds.has(userId)) {
      throw new Error('Action forbidden: Protected system accounts cannot be removed.');
    }

    const targetUser = await this.findById(userId);
    if (!targetUser) throw new Error(`User with ID ${userId} not found.`);

    if (protectedEmails.has(targetUser.email.toLowerCase())) {
      throw new Error('Action forbidden: Protected system accounts cannot be removed.');
    }

    // Role-based restrictions:
    // Admin can remove normal USER accounts.
    // Admin must NOT be able to remove: SUPER_ADMIN, ADMIN, TEACHER
    if (actorRole === 'ADMIN') {
      if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN' || targetUser.role === 'TEACHER') {
        throw new Error(`Administrators are not permitted to remove ${targetUser.role} accounts. Only Super Administrators can perform higher-level account removal.`);
      }
    } else if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Administrative authority required.');
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new Error('Action forbidden: Super Admin account cannot be removed.');
    }

    const previousStatus = targetUser.status || (targetUser.isSuspended ? 'SUSPENDED' : 'ACTIVE');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Mark account as REMOVED and suspended
      await client.query(
        `UPDATE public.users 
         SET status = 'REMOVED', is_suspended = true, updated_at = NOW() 
         WHERE id = $1`,
        [userId]
      );

      // 2. Safely revoke active entitlements to cut access immediately without destroying historical payment/course records
      await client.query(
        `UPDATE public.entitlements 
         SET status = 'REVOKED', updated_at = NOW() 
         WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: `Account for ${targetUser.name} (${targetUser.email}) removed successfully. Active access and sessions revoked.`,
        previousStatus,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async restoreUser(
    userId: string,
    actorId: string,
    actorRole: string
  ): Promise<{ success: boolean; message: string }> {
    const targetUser = await this.findById(userId);
    if (!targetUser) throw new Error(`User with ID ${userId} not found.`);

    // Role-based restrictions:
    // Admin can restore normal USER accounts.
    // Admin must NOT be able to restore: SUPER_ADMIN, ADMIN, TEACHER
    if (actorRole === 'ADMIN') {
      if (targetUser.role !== 'USER') {
        throw new Error(`Administrators are only permitted to restore USER accounts. Only Super Administrators can restore ${targetUser.role} accounts.`);
      }
    } else if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Administrative authority required.');
    }

    if (targetUser.status !== 'REMOVED' && (targetUser as any).accountStatus !== 'REMOVED') {
      throw new Error(`Account for ${targetUser.name} (${targetUser.email}) is not in REMOVED status.`);
    }

    await pool.query(
      `UPDATE public.users 
       SET status = 'ACTIVE', is_suspended = false, updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );

    return {
      success: true,
      message: `Account for ${targetUser.name} (${targetUser.email}) restored to ACTIVE status.`,
    };
  }

  async permanentDeleteUser(
    userId: string,
    actorId: string,
    actorRole: string,
    confirmationText: string
  ): Promise<{ success: boolean; message: string; deletedEmail: string; deletedName: string }> {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Only Super Administrators have authority to permanently delete accounts.');
    }

    if (confirmationText !== 'PERMANENT DELETE') {
      throw new Error('Invalid confirmation text. You must type "PERMANENT DELETE" to execute permanent deletion.');
    }

    if (userId === actorId) {
      throw new Error('Action forbidden: Super Administrators cannot permanently delete their own account.');
    }

    const protectedIds = new Set(['usr_superadmin', 'usr_admin', 'usr_student', 'usr_teacher']);
    const protectedEmails = new Set(['superadmin@ikshovia.com', 'admin@ikshovia.com', 'student@ikshovia.com', 'teacher@ikshovia.com']);

    if (protectedIds.has(userId)) {
      throw new Error('Action forbidden: Protected system seed accounts cannot be deleted.');
    }

    const targetUser = await this.findById(userId);
    if (!targetUser) throw new Error(`User with ID ${userId} not found.`);

    if (protectedEmails.has(targetUser.email.toLowerCase())) {
      throw new Error('Action forbidden: Protected system seed accounts cannot be deleted.');
    }

    // Safety rule: Only REMOVED accounts can be permanently deleted (not active accounts)
    if (targetUser.status !== 'REMOVED' && (targetUser as any).accountStatus !== 'REMOVED') {
      throw new Error('Action forbidden: Only removed accounts can be permanently deleted. Please remove the account first.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Clear references in non-cascading or audit tables
      await client.query('UPDATE public.question_versions SET created_by = NULL WHERE created_by = $1', [userId]);
      await client.query('DELETE FROM public.notifications WHERE recipient_user_id = $1 OR actor_user_id = $1', [userId]);
      await client.query('DELETE FROM public.user_notification_preferences WHERE user_id = $1', [userId]);

      // 2. Anonymize user in audit logs so audit trail is preserved without PII
      await client.query(
        `UPDATE public.audit_logs 
         SET details = jsonb_set(
           CASE WHEN details IS NOT NULL AND details != '' AND details ~ '^\\s*\\{' THEN details::jsonb ELSE '{}'::jsonb END,
           '{anonymizedUserId}',
           to_jsonb($1::text)
         )::text
         WHERE user_id = $1`,
        [userId]
      );

      // 3. Delete from public.users (cascades to user_profiles, entitlements, mock_attempts, teacher_submissions, etc.)
      await client.query('DELETE FROM public.users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      return {
        success: true,
        message: `Account for ${targetUser.name} (${targetUser.email}) has been permanently purged from the system.`,
        deletedEmail: targetUser.email,
        deletedName: targetUser.name,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getManagedUsers(): Promise<ManagedUser[]> {
    const query = `
      SELECT 
        u.id, u.email, u.name, u.avatar_url, u.role, u.is_onboarded, u.status, u.is_suspended, u.created_at,
        p.target_exam, p.selected_subjects, p.daily_goal_minutes, p.experience_level, p.goal_statement,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', e.id,
            'courseId', e.course_id,
            'courseName', c.name,
            'status', e.status,
            'source', e.source,
            'startsAt', e.starts_at,
            'expiresAt', e.expires_at
          ) ORDER BY e.created_at DESC)
          FROM public.entitlements e
          LEFT JOIN public.courses c ON e.course_id = c.id
          WHERE e.user_id = u.id), '[]'::json
        ) as user_entitlements
      FROM public.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows.map(r => {
      const profile = this.mapRowToUserProfile(r);
      const rawEnts: any[] = Array.isArray(r.user_entitlements) ? r.user_entitlements : [];
      
      const courses = rawEnts.map(e => ({
        courseId: e.courseId,
        courseName: e.courseName || 'Enrolled Course',
        status: e.status as EntitlementStatus,
        expiresAt: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
      }));

      const activeEnts = rawEnts.filter(e => e.status === 'ACTIVE');
      const activeAccessCount = activeEnts.length;

      let latestExpiry: string | null = null;
      for (const e of activeEnts) {
        if (e.expiresAt) {
          const expDate = new Date(e.expiresAt).toISOString();
          if (!latestExpiry || expDate > latestExpiry) {
            latestExpiry = expDate;
          }
        }
      }

      let paymentStatus: 'PAID' | 'COMPLIMENTARY' | 'NONE' = 'NONE';
      if (rawEnts.some(e => e.source === 'PAYMENT')) {
        paymentStatus = 'PAID';
      } else if (activeAccessCount > 0) {
        paymentStatus = 'COMPLIMENTARY';
      }

      const accountStatus = r.status === 'REMOVED'
        ? 'REMOVED'
        : (r.is_suspended || r.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');

      return {
        ...profile,
        targetExam: r.target_exam || 'UPSC',
        accountStatus,
        status: accountStatus,
        courses,
        activeAccessCount,
        latestExpiry,
        paymentStatus,
        entitlementsCount: rawEnts.length,
      };
    });
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

  async deleteUsers(userIds: string[]): Promise<{ deletedCount: number; deletedIds: string[] }> {
    if (!userIds || userIds.length === 0) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const protectedIds = new Set(['usr_student', 'usr_admin', 'usr_superadmin']);
    const protectedEmails = new Set(['student@ikshovia.com', 'admin@ikshovia.com', 'superadmin@ikshovia.com']);

    // Filter out protected accounts strictly
    const safeUserIds = userIds.filter(id => !protectedIds.has(id));
    if (safeUserIds.length === 0) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify none of safeUserIds match protected emails
      const protectedCheck = await client.query(
        `SELECT id, email FROM public.users WHERE id = ANY($1) AND LOWER(email) = ANY($2)`,
        [safeUserIds, Array.from(protectedEmails)]
      );
      const trulySafeIds = safeUserIds.filter(
        id => !protectedCheck.rows.some((r: any) => r.id === id)
      );

      if (trulySafeIds.length === 0) {
        await client.query('COMMIT');
        return { deletedCount: 0, deletedIds: [] };
      }

      // Explicitly delete user dependencies (FK cascades also handle, but explicit cleanup guarantees zero orphans)
      await client.query(`DELETE FROM public.user_profiles WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.learner_models WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.concept_mastery WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.retention_state WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.mistake_patterns WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.learning_events WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.revision_items WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.revision_sessions WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.practice_sessions WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.question_attempts WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.mock_attempts WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.goals WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.notifications WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.shared_tests WHERE owner_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.ai_conversations WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.ai_messages WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`DELETE FROM public.admin_permissions WHERE user_id = ANY($1)`, [trulySafeIds]);

      // Nullify references in logs/audits to preserve system history without broken user references
      await client.query(`UPDATE public.ocr_jobs SET user_id = NULL WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`UPDATE public.ai_requests SET user_id = NULL WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`UPDATE public.ai_usage SET user_id = NULL WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`UPDATE public.ai_errors SET user_id = NULL WHERE user_id = ANY($1)`, [trulySafeIds]);
      await client.query(`UPDATE public.audit_logs SET user_id = NULL WHERE user_id = ANY($1)`, [trulySafeIds]);

      // Delete from user_passwords using emails of target users (excluding protected emails)
      const emailRes = await client.query(`SELECT email FROM public.users WHERE id = ANY($1)`, [trulySafeIds]);
      const emailsToDelete = emailRes.rows
        .map((r: any) => r.email)
        .filter((e: string) => !protectedEmails.has(e.toLowerCase()));

      if (emailsToDelete.length > 0) {
        await client.query(`DELETE FROM public.user_passwords WHERE email = ANY($1)`, [emailsToDelete]);
      }

      // Finally delete the users from public.users
      const deleteRes = await client.query(`DELETE FROM public.users WHERE id = ANY($1) RETURNING id`, [trulySafeIds]);

      await client.query('COMMIT');

      // Also clean up from Supabase Auth if client is configured
      const supabase = getSupabase();
      if (supabase) {
        for (const uid of trulySafeIds) {
          try {
            await supabase.auth.admin.deleteUser(uid);
          } catch {
            // Ignored if user not found in supabase auth
          }
        }
      }

      return {
        deletedCount: deleteRes.rowCount || deleteRes.rows.length,
        deletedIds: deleteRes.rows.map((r: any) => r.id),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    const res = await this.deleteUsers([userId]);
    return res.deletedCount > 0;
  }

  async ensureDefaultAccounts(hashPasswordFn: (p: string) => string): Promise<void> {
    try {
      const accounts = [
        { id: 'usr_student', email: 'student@ikshovia.com', name: 'Akash', role: 'USER' as const, password: 'password123' },
        { id: 'usr_teacher', email: 'teacher@ikshovia.com', name: 'Teacher Faculty', role: 'TEACHER' as const, password: 'teacher123' },
        { id: 'usr_admin', email: 'admin@ikshovia.com', name: 'Akash Singh', role: 'ADMIN' as const, password: 'admin123' },
        { id: 'usr_superadmin', email: 'superadmin@ikshovia.com', name: 'Akash Pratap Singh', role: 'SUPER_ADMIN' as const, password: 'superadmin123' },
      ];

      for (const acc of accounts) {
        const existing = await this.findByEmail(acc.email);
        const hash = hashPasswordFn(acc.password);
        if (!existing) {
          await this.createUser({
            id: acc.id,
            email: acc.email,
            name: acc.name,
            role: acc.role,
            isOnboarded: true,
            passwordHash: hash,
          });
        } else {
          // Ensure password hash is set correctly in user_passwords table
          await pool.query(
            'INSERT INTO public.user_passwords (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash',
            [acc.email, hash]
          );
        }
      }

      // Ensure full default permissions exist for usr_admin
      for (const perm of DEFAULT_ADMIN_PERMISSIONS) {
        await pool.query(
          'INSERT INTO public.admin_permissions (user_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          ['usr_admin', perm]
        );
      }

      // Ensure superadmin permissions exist for usr_superadmin
      for (const perm of SUPER_ADMIN_PERMISSIONS) {
        await pool.query(
          'INSERT INTO public.admin_permissions (user_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          ['usr_superadmin', perm]
        );
      }
    } catch (err: any) {
      console.warn('[UserRepository] Ensure default accounts notice:', err.message);
    }
  }

  private mapRowToUserProfile(row: any): UserProfile {
    let selectedSubjects: string[] = [];
    if (Array.isArray(row.selected_subjects)) {
      selectedSubjects = row.selected_subjects;
    } else if (typeof row.selected_subjects === 'string') {
      try {
        selectedSubjects = JSON.parse(row.selected_subjects);
      } catch {
        selectedSubjects = [];
      }
    }

    const accountStatus = row.status === 'REMOVED'
      ? 'REMOVED'
      : (row.is_suspended || row.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url || undefined,
      role: row.role,
      isOnboarded: row.is_onboarded,
      status: accountStatus,
      isSuspended: accountStatus !== 'ACTIVE',
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

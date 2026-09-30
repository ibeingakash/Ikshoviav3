import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Award,
  UserMinus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { ManagedUser, UserRole, Course, Entitlement } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED'>('ALL');

  // Selected User Detail Modal
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userDetails, setUserDetails] = useState<{ user: any; entitlements: Entitlement[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Grant Access Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantDurationDays, setGrantDurationDays] = useState(90);
  const [grantSource, setGrantSource] = useState('ADMIN_GRANT');
  const [grantNotes, setGrantNotes] = useState('');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  // Remove User Confirmation Modal
  const [removeModalUser, setRemoveModalUser] = useState<ManagedUser | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Permanent Delete Modal (SUPER_ADMIN only)
  const [permanentModalUser, setPermanentModalUser] = useState<ManagedUser | null>(null);
  const [permanentConfirmText, setPermanentConfirmText] = useState('');
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);

  // Feedback Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [managedUsers, courseList] = await Promise.all([
        api.getAdminManagedUsers(),
        api.getCourses({ activeOnly: true }),
      ]);
      setUsers(managedUsers);
      setCourses(courseList);
      if (courseList.length > 0 && !grantCourseId) {
        setGrantCourseId(courseList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load user management directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openUserDetails = async (u: ManagedUser) => {
    setSelectedUser(u);
    setLoadingDetail(true);
    try {
      const detail = await api.getAdminUserDetail(u.id);
      setUserDetails(detail);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to load user detail: ' + err.message });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleSuspend = async (u: ManagedUser) => {
    if (u.id === 'usr_superadmin' || u.email === 'superadmin@ikshovia.com') {
      alert('Action forbidden: Super Admin is a protected account.');
      return;
    }

    const nextSuspend = !u.isSuspended;
    const confirmText = nextSuspend
      ? `Are you sure you want to suspend account for ${u.name} (${u.email})? They will immediately lose access to all modules.`
      : `Re-activate platform access for ${u.name}?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await api.toggleUserSuspension(u.id, nextSuspend);
      setNotification({ type: 'success', message: res.message });
      await fetchData();
      if (selectedUser?.id === u.id) {
        setSelectedUser(prev => prev ? { ...prev, isSuspended: res.isSuspended } : null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Action failed' });
    }
  };

  const handleOpenGrantModal = (userId?: string) => {
    if (userId) setGrantUserId(userId);
    else if (users.length > 0) setGrantUserId(users[0].id);
    setGrantModalOpen(true);
  };

  const handleGrantAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantCourseId) {
      setNotification({ type: 'error', message: 'Please select both a User and a Course' });
      return;
    }

    setIsSubmittingGrant(true);
    try {
      await api.grantEntitlement({
        userId: grantUserId,
        courseId: grantCourseId,
        durationDays: Number(grantDurationDays),
        source: grantSource,
        notes: grantNotes || 'Manual grant via Admin Console',
      });

      setNotification({ type: 'success', message: `Access granted successfully for ${grantDurationDays} days.` });
      setGrantModalOpen(false);
      setGrantNotes('');
      await fetchData();
      if (selectedUser?.id === grantUserId) {
        openUserDetails(selectedUser);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to grant entitlement' });
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  const handleRevokeEntitlement = async (entitlementId: string, courseName?: string) => {
    const reason = window.prompt(`Please provide a reason to revoke access to "${courseName || 'Course'}":`, 'Administrative adjustment');
    if (reason === null) return;

    try {
      await api.revokeEntitlement(entitlementId, reason);
      setNotification({ type: 'success', message: 'Access revoked successfully.' });
      await fetchData();
      if (selectedUser) {
        openUserDetails(selectedUser);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to revoke access' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrators can modify user roles.');
      return;
    }
    if (userId === 'usr_superadmin') {
      alert('Action forbidden: Super Admin role cannot be demoted.');
      return;
    }

    if (!window.confirm(`Confirm changing user role to ${newRole}?`)) return;

    try {
      await api.updateUserRole(userId, newRole);
      setNotification({ type: 'success', message: `User role changed to ${newRole}` });
      await fetchData();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update role' });
    }
  };

  const protectedIds = ['usr_student', 'usr_admin', 'usr_superadmin', 'usr_teacher'];
  const protectedEmails = ['student@ikshovia.com', 'admin@ikshovia.com', 'superadmin@ikshovia.com', 'teacher@ikshovia.com'];

  const canRemoveUser = (target: ManagedUser) => {
    if (protectedIds.includes(target.id) || protectedEmails.includes(target.email.toLowerCase())) {
      return false;
    }
    if (target.accountStatus === 'REMOVED' || target.status === 'REMOVED') return false;
    if (isSuperAdmin) {
      return target.role !== 'SUPER_ADMIN';
    }
    if (currentUser?.role === 'ADMIN') {
      return target.role === 'USER';
    }
    return false;
  };

  const canRestoreUser = (target: ManagedUser) => {
    const isRemoved = target.accountStatus === 'REMOVED' || target.status === 'REMOVED';
    if (!isRemoved) return false;
    if (isSuperAdmin) {
      return true;
    }
    if (currentUser?.role === 'ADMIN') {
      return target.role === 'USER';
    }
    return false;
  };

  const canPermanentDeleteUser = (target: ManagedUser) => {
    if (!isSuperAdmin) return false;
    if (protectedIds.includes(target.id) || protectedEmails.includes(target.email.toLowerCase())) {
      return false;
    }
    if (target.id === currentUser?.id) return false;
    const isRemoved = target.accountStatus === 'REMOVED' || target.status === 'REMOVED';
    return isRemoved;
  };

  const handleConfirmRemove = async () => {
    if (!removeModalUser) return;
    setIsRemoving(true);
    try {
      const res = await api.removeUser(removeModalUser.id, removeReason.trim() || undefined);
      setNotification({ type: 'success', message: res.message || 'User account removed successfully.' });
      setRemoveModalUser(null);
      setRemoveReason('');
      await fetchData();
      if (selectedUser?.id === removeModalUser.id) {
        setSelectedUser(null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to remove user' });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRestoreUser = async (u: ManagedUser) => {
    if (!isSuperAdmin && currentUser?.role !== 'ADMIN') {
      alert('Administrative authority required to restore accounts.');
      return;
    }
    if (currentUser?.role === 'ADMIN' && u.role !== 'USER') {
      alert('Administrators can only restore normal USER accounts.');
      return;
    }
    if (!window.confirm(`Restore account platform access for ${u.name} (${u.email})?`)) return;
    try {
      const res = await api.restoreUser(u.id);
      setNotification({ type: 'success', message: res.message || 'Account restored to ACTIVE status.' });
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, accountStatus: 'ACTIVE', status: 'ACTIVE', isSuspended: false } : usr));
      await fetchData();
      if (selectedUser?.id === u.id) {
        setSelectedUser(prev => prev ? { ...prev, accountStatus: 'ACTIVE', status: 'ACTIVE', isSuspended: false } : null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to restore user' });
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentModalUser) return;
    if (permanentConfirmText.trim() !== 'PERMANENT DELETE') {
      alert('You must type "PERMANENT DELETE" exactly to execute permanent deletion.');
      return;
    }
    const deletingId = permanentModalUser.id;
    setIsPermanentlyDeleting(true);
    try {
      await api.permanentDeleteUser(deletingId, permanentConfirmText.trim());
      setUsers(prev => prev.filter(u => u.id !== deletingId));
      setNotification({ type: 'success', message: 'User permanently deleted.' });
      setPermanentModalUser(null);
      setPermanentConfirmText('');
      if (selectedUser?.id === deletingId) {
        setSelectedUser(null);
        setUserDetails(null);
      }
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to permanently delete user' });
    } finally {
      setIsPermanentlyDeleting(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    const isUserRemoved = u.accountStatus === 'REMOVED' || u.status === 'REMOVED';
    const isUserSuspended = !isUserRemoved && (u.accountStatus === 'SUSPENDED' || u.status === 'SUSPENDED' || u.isSuspended);
    const isUserActive = !isUserRemoved && !isUserSuspended;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isUserActive) ||
      (statusFilter === 'SUSPENDED' && isUserSuspended) ||
      (statusFilter === 'REMOVED' && isUserRemoved);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 shadow-2xs">
              <Users className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                User Management
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Administer learner accounts, granular access entitlements, status control, and course enrollments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleOpenGrantModal()}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Key className="w-4 h-4 text-amber-300" />
            <span>Grant Manual Access</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">Total Accounts</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">{users.length}</span>
          <span className="text-[10px] text-stone-500">Platform directory</span>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">Learners</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">
            {users.filter(u => u.role === 'USER').length}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">Standard candidates</span>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">Teachers</span>
          <span className="text-2xl font-bold text-amber-800 mt-1 block">
            {users.filter(u => u.role === 'TEACHER').length}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">Instructors & evaluators</span>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">Administrators</span>
          <span className="text-2xl font-bold text-stone-800 mt-1 block">
            {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
          </span>
          <span className="text-[10px] text-stone-500">Privileged staff</span>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">Active Entitlements</span>
          <span className="text-2xl font-bold text-emerald-800 mt-1 block">
            {users.reduce((acc, u) => acc + (u.activeEntitlementsCount || 0), 0)}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">Course grants active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates by name, email, or user ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-[11px] text-stone-400">ROLE:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER (Learner)</option>
              <option value="TEACHER">TEACHER (Faculty)</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
            <span className="font-mono text-[11px] text-stone-400">STATUS:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REMOVED">Removed</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#FAF8F5] border-b border-stone-200/90 font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Enrolled Courses</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-300" />
                    <span>Loading verified users...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No users match current criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isProtected = protectedIds.includes(u.id) || protectedEmails.includes(u.email.toLowerCase());
                  const isRemoved = u.accountStatus === 'REMOVED' || u.status === 'REMOVED';
                  const isSuspended = !isRemoved && (u.isSuspended || u.accountStatus === 'SUSPENDED' || u.status === 'SUSPENDED');

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/80 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-serif-editorial font-bold text-stone-700 border border-stone-200">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">{u.name}</span>
                              {isProtected && (
                                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                                  PROTECTED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                              <span>{u.email}</span>
                              <span className="text-stone-300">•</span>
                              <span className="text-stone-400 text-[10px]">{u.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : u.role === 'ADMIN'
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                              : u.role === 'TEACHER'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {isRemoved ? (
                          <span className="text-[10px] font-bold font-mono text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3 text-stone-500" />
                            <span>REMOVED</span>
                          </span>
                        ) : isSuspended ? (
                          <span className="text-[10px] font-bold font-mono text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>SUSPENDED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">
                            {u.activeEntitlementsCount || 0} active
                          </span>
                          {u.enrolledCourseNames && u.enrolledCourseNames.length > 0 && (
                            <span
                              className="text-[10px] text-stone-400 truncate max-w-[150px] inline-block"
                              title={u.enrolledCourseNames.join(', ')}
                            >
                              ({u.enrolledCourseNames[0]}
                              {u.enrolledCourseNames.length > 1 ? ` +${u.enrolledCourseNames.length - 1}` : ''})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openUserDetails(u)}
                            className="px-2.5 py-1 text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                            title="View Full Profile & Entitlements"
                          >
                            Details
                          </button>

                          {!isRemoved && (
                            <>
                              <button
                                onClick={() => handleOpenGrantModal(u.id)}
                                className="px-2.5 py-1 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Grant Course Access"
                              >
                                <Key className="w-3 h-3 text-amber-700" />
                                <span>Grant</span>
                              </button>

                              {!isProtected && (
                                <button
                                  onClick={() => handleToggleSuspend(u)}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                    u.isSuspended
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  }`}
                                  title={u.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                                >
                                  {u.isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Remove User Action */}
                              {canRemoveUser(u) && (
                                <button
                                  onClick={() => {
                                    setRemoveModalUser(u);
                                    setRemoveReason('');
                                  }}
                                  className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Remove User Account"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* REMOVED USER ACTIONS */}
                          {isRemoved && (
                            <>
                              {canRestoreUser(u) && (
                                <button
                                  onClick={() => handleRestoreUser(u)}
                                  className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Restore Removed Account"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                                  <span>Restore</span>
                                </button>
                              )}

                              {canPermanentDeleteUser(u) && (
                                <button
                                  onClick={() => {
                                    setPermanentModalUser(u);
                                    setPermanentConfirmText('');
                                  }}
                                  className="px-2.5 py-1 text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Permanently Delete Account from System"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-700" />
                                  <span>Permanent Delete</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: USER DETAILS & ENTITLEMENTS DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                  <span>Candidate Profile & Entitlements</span>
                  {protectedIds.includes(selectedUser.id) && (
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                      PROTECTED ACCOUNT
                    </span>
                  )}
                </h2>
                <p className="text-xs text-stone-500 font-mono">{selectedUser.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserDetails(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-stone-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-300" />
                <span>Loading profile & entitlements...</span>
              </div>
            ) : (
              <>
                {/* User Basic Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Full Name</span>
                    <span className="font-bold text-stone-900">{selectedUser.name}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Email Address</span>
                    <span className="font-mono text-stone-800">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Account Status</span>
                    <span
                      className={`font-bold font-mono text-[11px] ${
                        selectedUser.accountStatus === 'REMOVED' || selectedUser.status === 'REMOVED'
                          ? 'text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200'
                          : selectedUser.isSuspended || selectedUser.accountStatus === 'SUSPENDED'
                          ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                          : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200'
                      }`}
                    >
                      {selectedUser.accountStatus || (selectedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Platform Role</span>
                    {isSuperAdmin && !protectedIds.includes(selectedUser.id) ? (
                      <select
                        value={selectedUser.role}
                        onChange={e => handleRoleChange(selectedUser.id, e.target.value as UserRole)}
                        className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-stone-800 mt-0.5"
                      >
                        <option value="USER">USER</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    ) : (
                      <span className="font-mono font-bold text-stone-900">{selectedUser.role}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Registration Date</span>
                    <span className="font-mono text-stone-700">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">Target Exam</span>
                    <span className="font-bold text-stone-900">{selectedUser.onboarding?.targetExam || 'UPSC CSE'}</span>
                  </div>
                </div>

                {/* Entitlements Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-700" />
                      <span>Course Entitlements ({userDetails?.entitlements?.length || 0})</span>
                    </h3>
                    <button
                      onClick={() => handleOpenGrantModal(selectedUser.id)}
                      className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Grant New Course</span>
                    </button>
                  </div>

                  {!userDetails?.entitlements || userDetails.entitlements.length === 0 ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-500">
                      No active course entitlements. Use the button above to manually grant test series or full course access.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userDetails.entitlements.map(ent => {
                        const isExpired = ent.status === 'EXPIRED' || (ent.expiresAt && new Date(ent.expiresAt) < new Date());
                        const isRevoked = ent.status === 'REVOKED';
                        const isActive = ent.status === 'ACTIVE' && !isExpired;

                        return (
                          <div
                            key={ent.id}
                            className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-sm">
                                  {ent.courseName || ent.courseId}
                                </span>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                      : isRevoked
                                      ? 'bg-rose-50 text-rose-900 border-rose-200'
                                      : 'bg-stone-100 text-stone-600 border-stone-200'
                                  }`}
                                >
                                  {isActive ? 'ACTIVE' : isRevoked ? 'REVOKED' : 'EXPIRED'}
                                </span>
                                <span className="text-[10px] font-mono text-stone-400 bg-stone-50 border border-stone-200 px-1 rounded">
                                  {ent.source}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono flex items-center gap-3">
                                <span>Valid: {new Date(ent.startsAt).toLocaleDateString()} → {ent.expiresAt ? new Date(ent.expiresAt).toLocaleDateString() : 'Lifetime'}</span>
                                {ent.metadata?.notes && (
                                  <span className="text-stone-400 italic">Note: {ent.metadata.notes}</span>
                                )}
                              </div>
                            </div>

                            {isActive && (
                              <button
                                onClick={() => handleRevokeEntitlement(ent.id, ent.courseName)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Account Lifecycle Actions in Drawer */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-400 uppercase font-semibold">Account Actions</span>
                  <div className="flex items-center gap-2">
                    {canRestoreUser(selectedUser) && (
                      <button
                        type="button"
                        onClick={() => handleRestoreUser(selectedUser)}
                        className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Restore Account</span>
                      </button>
                    )}
                    {canPermanentDeleteUser(selectedUser) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPermanentModalUser(selectedUser);
                          setPermanentConfirmText('');
                        }}
                        className="px-3 py-1.5 text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        <span>Permanent Delete</span>
                      </button>
                    )}
                    {canRemoveUser(selectedUser) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveModalUser(selectedUser);
                          setRemoveReason('');
                        }}
                        className="px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove Account</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GRANT MANUAL ACCESS */}
      {grantModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleGrantAccessSubmit}
            className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-700" />
                <span>Grant Manual Course Access</span>
              </h2>
              <button
                type="button"
                onClick={() => setGrantModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Recipient User
                </label>
                <select
                  value={grantUserId}
                  onChange={e => setGrantUserId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-amber-600"
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Select Course / Product
                </label>
                <select
                  value={grantCourseId}
                  onChange={e => setGrantCourseId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-amber-600"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.exam} - {c.courseType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={grantDurationDays}
                    onChange={e => setGrantDurationDays(Number(e.target.value))}
                    min={1}
                    max={730}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Grant Source
                  </label>
                  <select
                    value={grantSource}
                    onChange={e => setGrantSource(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="ADMIN_GRANT">Administrative Grant</option>
                    <option value="SCHOLARSHIP">Merit Scholarship</option>
                    <option value="PROMOTIONAL">Early Access Trial</option>
                    <option value="OFFLINE_PAYMENT">Offline Payment Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Reason / Internal Notes
                </label>
                <textarea
                  value={grantNotes}
                  onChange={e => setGrantNotes(e.target.value)}
                  placeholder="e.g. Granted for UPSC Prelims 2026 Batch admission..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setGrantModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingGrant}
                className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingGrant ? 'Granting...' : 'Confirm Grant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION MODAL: REMOVE USER */}
      {removeModalUser && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif-editorial font-bold text-stone-900">
                  Remove User?
                </h3>
                <p className="text-xs text-stone-500">
                  Safe administrative account deactivation
                </p>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono text-[11px]">Name:</span>
                <span className="font-bold text-stone-900">{removeModalUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono text-[11px]">Email:</span>
                <span className="font-mono text-stone-700">{removeModalUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono text-[11px]">Role:</span>
                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {removeModalUser.role}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Warning:</span>
                <p className="text-[11px] leading-relaxed">
                  This will disable this account and revoke its active access.
                  Historical test attempts, audit logs, and purchases will be safely preserved.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-stone-500 uppercase font-bold block">
                Removal Reason (Optional for audit trail)
              </label>
              <input
                type="text"
                placeholder="e.g. Unnecessary account / User requested removal"
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setRemoveModalUser(null);
                  setRemoveReason('');
                }}
                disabled={isRemoving}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                {isRemoving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Removal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENT DELETE USER (SUPER_ADMIN ONLY) */}
      {permanentModalUser && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-red-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 border border-red-300">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-editorial text-red-950">
                  Permanently Delete User?
                </h3>
                <p className="text-xs text-stone-500">Super Administrator High-Privilege Action</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>This action is permanent and cannot be undone.</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-lg border border-red-200">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">Name</span>
                  <span className="font-bold text-stone-900">{permanentModalUser.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">Email</span>
                  <span className="font-mono text-stone-900 text-[11px] truncate block">{permanentModalUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">Role</span>
                  <span className="font-bold font-mono text-stone-900">{permanentModalUser.role}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">Current Status</span>
                  <span className="font-bold font-mono text-red-700 bg-red-100 px-1.5 py-0.5 rounded text-[10px] inline-block">
                    {permanentModalUser.accountStatus || permanentModalUser.status || 'REMOVED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-stone-700 uppercase font-bold block">
                Type <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-bold">PERMANENT DELETE</span> to confirm:
              </label>
              <input
                type="text"
                placeholder="PERMANENT DELETE"
                value={permanentConfirmText}
                onChange={e => setPermanentConfirmText(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setPermanentModalUser(null);
                  setPermanentConfirmText('');
                }}
                disabled={isPermanentlyDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={isPermanentlyDeleting || permanentConfirmText.trim() !== 'PERMANENT DELETE'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                {isPermanentlyDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

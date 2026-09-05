import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  User,
  Package,
  Calendar,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Entitlement, ManagedUser, Course } from '../../types/index.js';

export const EntitlementsView: React.FC = () => {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Grant Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantDurationDays, setGrantDurationDays] = useState(90);
  const [grantStartDate, setGrantStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [grantSource, setGrantSource] = useState('ADMIN_GRANT');
  const [grantNotes, setGrantNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extend Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedEntitlementForExtend, setSelectedEntitlementForExtend] = useState<Entitlement | null>(null);
  const [additionalDays, setAdditionalDays] = useState(30);
  const [extendNotes, setExtendNotes] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ents, managedUsers, courseList] = await Promise.all([
        api.getAdminEntitlements(),
        api.getAdminManagedUsers(),
        api.getCourses({ activeOnly: true }),
      ]);
      setEntitlements(ents);
      setUsers(managedUsers);
      setCourses(courseList);
      if (managedUsers.length > 0 && !grantUserId) setGrantUserId(managedUsers[0].id);
      if (courseList.length > 0 && !grantCourseId) setGrantCourseId(courseList[0].id);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load entitlements registry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantCourseId) {
      setNotification({ type: 'error', message: 'Please choose both a user and a course product' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.grantEntitlement({
        userId: grantUserId,
        courseId: grantCourseId,
        durationDays: Number(grantDurationDays),
        startDate: grantStartDate ? new Date(grantStartDate).toISOString() : undefined,
        source: grantSource,
        notes: grantNotes || 'Manual grant from Access Registry',
      });
      setNotification({ type: 'success', message: 'Course entitlement granted successfully.' });
      setGrantModalOpen(false);
      setGrantNotes('');
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to grant entitlement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenExtendModal = (ent: Entitlement) => {
    setSelectedEntitlementForExtend(ent);
    setAdditionalDays(30);
    setExtendNotes('');
    setExtendModalOpen(true);
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntitlementForExtend) return;

    setIsExtending(true);
    try {
      const updated = await api.extendEntitlement(
        selectedEntitlementForExtend.id,
        Number(additionalDays),
        extendNotes || 'Extended via Access Registry'
      );
      setNotification({
        type: 'success',
        message: `Entitlement extended by ${additionalDays} days (New expiry: ${new Date(updated.expiresAt).toLocaleDateString()}).`,
      });
      setExtendModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to extend entitlement' });
    } finally {
      setIsExtending(false);
    }
  };

  const handleRevoke = async (entId: string, courseName?: string) => {
    const reason = window.prompt(`Revoke access to "${courseName || 'Course'}"? Reason:`, 'Administrative adjustment');
    if (reason === null) return;

    try {
      await api.revokeEntitlement(entId, reason);
      setNotification({ type: 'success', message: 'Entitlement revoked successfully.' });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to revoke entitlement' });
    }
  };

  // Filtered List
  const filteredEntitlements = entitlements.filter(ent => {
    const q = searchQuery.toLowerCase();
    const user = users.find(u => u.id === ent.userId);
    const userName = user?.name?.toLowerCase() || '';
    const userEmail = user?.email?.toLowerCase() || '';
    const courseName = ent.courseName?.toLowerCase() || '';

    const matchesSearch = userName.includes(q) || userEmail.includes(q) || courseName.includes(q) || ent.userId.includes(q);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ent.status === 'ACTIVE' && (!ent.expiresAt || new Date(ent.expiresAt) > new Date())) ||
      (statusFilter === 'EXPIRED' && (ent.status === 'EXPIRED' || (ent.expiresAt && new Date(ent.expiresAt) <= new Date()))) ||
      (statusFilter === 'REVOKED' && ent.status === 'REVOKED');

    const matchesCourse = courseFilter === 'ALL' || ent.courseId === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 shadow-2xs">
              <Key className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
                Access & Entitlements Registry
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Server-side access control linking Learners to Courses and allowed feature capabilities.
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
            onClick={() => setGrantModalOpen(true)}
            className="px-4 py-2 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Grant Manual Access</span>
          </button>
        </div>
      </div>

      {/* Notification */}
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

      {/* Filter and Search */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or course..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-[11px] text-stone-400">STATUS:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Grants</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
            <span className="font-mono text-[11px] text-stone-400">COURSE:</span>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entitlements Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#FAF8F5] border-b border-stone-200/90 font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-3">Course / Product</th>
                <th className="py-3 px-3">Access Status</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Validity Window</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-300" />
                    <span>Loading entitlements...</span>
                  </td>
                </tr>
              ) : filteredEntitlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No entitlements found matching filter.
                  </td>
                </tr>
              ) : (
                filteredEntitlements.map(ent => {
                  const user = users.find(u => u.id === ent.userId);
                  const isExpired =
                    ent.status === 'EXPIRED' ||
                    (ent.expiresAt && new Date(ent.expiresAt) <= new Date());
                  const isRevoked = ent.status === 'REVOKED';
                  const isActive = ent.status === 'ACTIVE' && !isExpired;

                  const daysRemaining = ent.expiresAt
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(ent.expiresAt).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0;

                  return (
                    <tr key={ent.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-stone-900">{user?.name || ent.userId}</span>
                          <div className="text-[11px] text-stone-500 font-mono">
                            {user?.email || ent.userId}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-bold text-stone-900">{ent.courseName || ent.courseId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isActive ? (
                          <div className="flex items-center gap-1.5">
                            {daysRemaining <= 7 ? (
                              <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>EXPIRING IN {daysRemaining}d</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                ACTIVE ({daysRemaining}d left)
                              </span>
                            )}
                          </div>
                        ) : isRevoked ? (
                          <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            REVOKED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            EXPIRED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                          {ent.source}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                        <span>{new Date(ent.startsAt).toLocaleDateString()}</span>
                        <span className="text-stone-300 mx-1">→</span>
                        <span className="font-bold text-stone-700">
                          {new Date(ent.expiresAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenExtendModal(ent)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
                          >
                            Extend
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleRevoke(ent.id, ent.courseName)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                            >
                              Revoke
                            </button>
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
                <span>Grant Course Entitlement</span>
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
                  Learner / Candidate
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
                  Course Product
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={grantStartDate}
                    onChange={e => setGrantStartDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

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
                    <option value="OFFLINE_PAYMENT">Offline Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={grantNotes}
                  onChange={e => setGrantNotes(e.target.value)}
                  placeholder="e.g. Granted by SuperAdmin Akash Pratap Singh for test batch..."
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
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Granting...' : 'Confirm Grant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EXTEND ACCESS VALIDITY */}
      {extendModalOpen && selectedEntitlementForExtend && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleExtendSubmit}
            className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Extend Entitlement Access</span>
              </h2>
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-stone-900">
                {selectedEntitlementForExtend.courseName || 'Course'}
              </div>
              <div className="text-stone-500 text-[11px]">
                User ID: <span className="font-mono">{selectedEntitlementForExtend.userId}</span>
              </div>
              <div className="text-stone-600 text-[11px] pt-1">
                Current Expiry:{' '}
                <span className="font-mono font-bold text-stone-800">
                  {new Date(selectedEntitlementForExtend.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Additional Days to Grant
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 60, 90].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAdditionalDays(days)}
                      className={`py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                        additionalDays === days
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={additionalDays}
                  onChange={e => setAdditionalDays(Number(e.target.value))}
                  min={1}
                  max={730}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Reason / Notes for Extension
                </label>
                <input
                  type="text"
                  value={extendNotes}
                  onChange={e => setExtendNotes(e.target.value)}
                  placeholder="e.g. Exam date postponed / Merit extension"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExtending}
                className="px-5 py-2 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isExtending ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

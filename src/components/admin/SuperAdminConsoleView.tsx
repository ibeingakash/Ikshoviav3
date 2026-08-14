import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  History,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  Activity,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { AdminUser, AuditLogRecord } from '../../types/index.js';

export const SuperAdminConsoleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ADMINS' | 'AUDIT_LOGS' | 'SETTINGS'>('OVERVIEW');
  const [metrics, setMetrics] = useState<any>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Admin Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'QUESTION_CREATE',
    'QUESTION_PUBLISH',
    'OCR_IMPORT',
  ]);

  const allAvailablePermissions = [
    'QUESTION_CREATE',
    'QUESTION_EDIT',
    'QUESTION_PUBLISH',
    'OCR_IMPORT',
    'OCR_REVIEW',
    'MOCK_CREATE',
    'CONCEPT_CREATE',
    'ALL_PERMISSIONS',
  ];

  useEffect(() => {
    loadConsoleData();
  }, []);

  const loadConsoleData = async () => {
    setIsLoading(true);
    try {
      const overviewRes = await api.getSuperAdminOverview();
      if (overviewRes.metrics) {
        setMetrics(overviewRes.metrics);
        setAdmins(overviewRes.admins || []);
        setAuditLogs(overviewRes.recentAuditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load superadmin overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName) {
      setStatusMessage({ type: 'error', text: 'Name and Email are required.' });
      return;
    }

    try {
      const res = await api.createSuperAdminAdmin({
        name: newAdminName,
        email: newAdminEmail,
        role: newAdminRole,
        permissions: selectedPermissions,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: `Admin ${newAdminName} created successfully.` });
        setShowAddModal(false);
        setNewAdminName('');
        setNewAdminEmail('');
        loadConsoleData();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create admin.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Server error creating admin.' });
    }
  };

  const handleToggleAdminStatus = async (adminId: string) => {
    try {
      const res = await api.toggleSuperAdminAdminStatus(adminId);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        loadConsoleData();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update admin status.' });
    }
  };

  const togglePermission = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              Root Authority & Compliance
            </span>
          </div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] tracking-tight">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed font-medium">
            Manage platform administrators, configure role-based access control (RBAC), enforce security protocols, and review real-time audit logs across IKSHOVIA V3.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold px-4 py-2 rounded-xl shadow-2xs border border-amber-500/30 transition-all flex items-center gap-2 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Provision Admin</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs'
              : 'bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/90'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Console Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMINS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'ADMINS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs'
              : 'bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/90'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Administrators & RBAC ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs'
              : 'bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/90'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'bg-[#35156B] text-amber-300 shadow-2xs'
              : 'bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/90'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2 font-mono">
                <span className="text-xs font-bold uppercase">Total Platform Users</span>
                <Users className="w-4 h-4 text-[#35156B]" />
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426]">{metrics?.totalUsers ?? 0}</div>
              <p className="text-xs text-stone-500 mt-1">Aspirants & Admins registered</p>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2 font-mono">
                <span className="text-xs font-bold uppercase">Active Administrators</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-amber-700">{metrics?.totalAdmins ?? 0}</div>
              <p className="text-xs text-stone-500 mt-1">Admin & Super Admin accounts</p>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2 font-mono">
                <span className="text-xs font-bold uppercase">Question Bank Items</span>
                <Key className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426]">{metrics?.totalQuestions ?? 0}</div>
              <p className="text-xs text-stone-500 mt-1">Practice Bank + OCR Drafts</p>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-2 font-mono">
                <span className="text-xs font-bold uppercase">Security Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-serif-editorial font-bold text-emerald-700">{metrics?.systemHealth || 'OPERATIONAL'}</div>
              <p className="text-xs text-stone-500 mt-1">Server Auth Middleware Active</p>
            </div>
          </div>

          {/* Audit Trail Preview */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>Recent System Activity & Compliance Stream</span>
            </h3>

            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-400">No security audit logs recorded yet.</div>
              ) : (
                auditLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="p-3 bg-stone-50 border border-stone-200/90 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-[#35156B] border border-purple-200 font-mono font-bold text-[10px]">
                        {log.actorRole}
                      </span>
                      <span className="font-bold text-[#111426]">{log.action}</span>
                      <span className="text-stone-500">Target: {log.targetType} ({log.targetId})</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMINS */}
      {activeTab === 'ADMINS' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono">Platform Administrators & Role Permissions</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#0C1024] hover:bg-[#121027] text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Admin</span>
            </button>
          </div>

          <div className="space-y-3">
            {admins.map(admin => (
              <div key={admin.id} className="p-4 bg-stone-50 border border-stone-200/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#111426] text-sm">{admin.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                        admin.role === 'SUPER_ADMIN'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-purple-50 text-[#35156B] border-purple-200'
                      }`}
                    >
                      {admin.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mb-2">{admin.email}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {admin.permissions?.map(perm => (
                      <span key={perm} className="text-[10px] bg-white text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-mono">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAdminStatus(admin.id)}
                    className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manage Account</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono">Platform Security Audit Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Actor ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-400">No audit log entries recorded.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-[11px] text-stone-500">{log.id}</td>
                      <td className="p-3 font-semibold text-[#111426]">{log.actorUserId}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-[#35156B] border border-purple-200 text-[10px] font-bold font-mono">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-800">{log.action}</td>
                      <td className="p-3 text-stone-600">{log.targetType} ({log.targetId})</td>
                      <td className="p-3 text-stone-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-6 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono">Global Platform Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-[#111426] text-sm">Server-Side Auth Enforcement</h4>
              <p className="text-stone-600">All admin API endpoints enforce strict server-side HTTP header token verification and role checking.</p>
              <div className="flex items-center gap-2 pt-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ACTIVE (Strict Protection)</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-[#111426] text-sm">Gemini AI Safety Filtering</h4>
              <p className="text-stone-600">Content generated by AI Tutor and AI Question Studio is checked for civil services syllabus alignment.</p>
              <div className="flex items-center gap-2 pt-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ENABLED (Strict Syllabus Grounding)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0C1024]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif-editorial font-bold text-[#111426] text-base">Provision Platform Administrator</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1 font-mono">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  placeholder="e.g. Akash Singh"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#35156B]"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="rajesh.admin@ikshovia.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#35156B]"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 font-mono">Role Level</label>
                <select
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:outline-none"
                >
                  <option value="ADMIN">Standard Admin</option>
                  <option value="SUPER_ADMIN">Super Admin (Root Permission)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-2 font-mono">Assign Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                  {allAvailablePermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-stone-300 text-[#35156B] accent-[#35156B]"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold border border-amber-500/30 cursor-pointer shadow-2xs"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

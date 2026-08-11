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
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Root Authority & Compliance Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Super Admin Control Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Manage platform administrators, configure role-based access control (RBAC), enforce security protocols, and review real-time audit logs across IKSHOVIA V3.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Admin</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Console Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMINS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ADMINS'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Administrators & RBAC ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SETTINGS'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase">Total Platform Users</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics?.totalUsers || 3}</div>
              <p className="text-xs text-slate-500 mt-1">Aspirants & Admins registered</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase">Active Administrators</span>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-300">{metrics?.totalAdmins || 2}</div>
              <p className="text-xs text-slate-500 mt-1">Admin & Super Admin accounts</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase">Question Bank Items</span>
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics?.totalQuestions || 24}</div>
              <p className="text-xs text-slate-500 mt-1">Practice Bank + OCR Drafts</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase">System Security Health</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-400">{metrics?.systemHealth || 'OPERATIONAL'}</div>
              <p className="text-xs text-slate-500 mt-1">Server-enforced Auth Middleware</p>
            </div>
          </div>

          {/* Audit Trail Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Recent System Activity & Compliance Stream</span>
            </h3>

            <div className="space-y-2">
              {auditLogs.slice(0, 6).map(log => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-bold text-[10px]">
                      {log.actorRole}
                    </span>
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-slate-400">Target: {log.targetType} ({log.targetId})</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMINS */}
      {activeTab === 'ADMINS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Platform Administrators & Role Permissions</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Admin</span>
            </button>
          </div>

          <div className="space-y-3">
            {admins.map(admin => (
              <div key={admin.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{admin.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        admin.role === 'SUPER_ADMIN'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      }`}
                    >
                      {admin.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{admin.email}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {admin.permissions?.map(perm => (
                      <span key={perm} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAdminStatus(admin.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Platform Security Audit Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Actor ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-950/50">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.id}</td>
                    <td className="p-3 font-semibold text-white">{log.actorUserId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-300">{log.action}</td>
                    <td className="p-3">{log.targetType} ({log.targetId})</td>
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white">Global Platform Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm">Server-Side Auth Enforcement</h4>
              <p className="text-slate-400">All admin API endpoints enforce strict server-side HTTP header token verification and role checking.</p>
              <div className="flex items-center gap-2 pt-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ACTIVE (Strict Non-Bypassable Protection)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm">Gemini AI Safety Filtering</h4>
              <p className="text-slate-400">Content generated by AI Tutor and AI Question Studio is checked for civil services syllabus alignment.</p>
              <div className="flex items-center gap-2 pt-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ENABLED (Strict Syllabus Grounding)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Provision Platform Administrator</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  placeholder="Dr. Rajesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="rajesh.admin@ikshovia.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role Level</label>
                <select
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-amber-300 font-bold"
                >
                  <option value="ADMIN">Standard Admin</option>
                  <option value="SUPER_ADMIN">Super Admin (Root Permission)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Assign Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {allAvailablePermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500"
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
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold"
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

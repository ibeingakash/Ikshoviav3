import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { api } from '../../lib/api.js';

interface ChangePasswordSectionProps {
  onSuccess?: () => void;
  onOpenForgotPassword?: () => void;
}

export const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  onSuccess,
  onOpenForgotPassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword, confirmNewPassword);
      setSuccess(res.message || 'Password changed successfully! A security notification has been dispatched.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please verify current credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="text-lg font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
              <span>Change Account Password</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </h2>
            <p className="text-xs text-stone-500 font-sans">
              Update your account password. Security events and audit logs are recorded upon change.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Current Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-700">Current Password</label>
            {onOpenForgotPassword && (
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] text-amber-800 hover:text-amber-900 font-medium underline cursor-pointer"
              >
                Forgot current password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 transition-all pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 transition-all pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Must be at least 8 characters long.</p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all pr-10 ${
                confirmNewPassword && confirmNewPassword !== newPassword
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-stone-200 focus:ring-amber-500/20 focus:border-amber-700'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmNewPassword && confirmNewPassword !== newPassword && (
            <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
          )}
          {confirmNewPassword && confirmNewPassword === newPassword && (
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">✓ Passwords match</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

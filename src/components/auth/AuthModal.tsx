import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ArrowRight, X, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { IKBrandMark } from '../common/IKBrandMark.js';
import { IKLogo } from '../common/IKLogo.js';

interface AuthModalProps {
  isOpen?: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = false,
  initialMode = 'login',
  onClose,
}) => {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(name.trim() || email.split('@')[0] || 'Learner', email, password);
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setMessage(res.message || 'Password reset link sent to your email address.');
      }
      if (onClose && mode !== 'forgot') {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F0]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0C1024] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 text-white">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#17132B] hover:bg-[#35156B] text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Ambient Radial Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="space-y-2">
          <IKLogo
            variant="dark"
            showTagline={true}
            taglineText="Unlock Human Potential Through Understanding"
            size="md"
          />
          <p className="text-xs text-stone-300 pt-1">
            {mode === 'login' && 'Enter your credentials to access your personal learning intelligence.'}
            {mode === 'register' && 'Start your personalized learning path today.'}
            {mode === 'forgot' && 'Reset your password to regain access to your account.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#121027] border border-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-[#35156B] text-amber-300 shadow-xs border border-amber-500/30' : 'text-stone-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-[#35156B] text-amber-300 shadow-xs border border-amber-500/30' : 'text-stone-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl font-medium">
            {message}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Akash Kumar"
                  className="w-full bg-[#121027] border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@ikshovia.com"
                className="w-full bg-[#121027] border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#121027] border border-stone-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-amber-500/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In to IKSHOVIA'}
                  {mode === 'register' && 'Create Free Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-slate-800">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Forgot Password?
            </button>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

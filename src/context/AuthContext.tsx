import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email?: string, password?: string, role?: string) => Promise<void>;
  register: (name: string, email: string, role?: string) => Promise<void>;
  logout: () => void;
  saveOnboarding: (data: any) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to fetch user auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email?: string, password?: string, role?: string) => {
    setLoading(true);
    const res = await api.login(email, password, role);
    if (res.user && res.token) {
      localStorage.setItem('ikshovia_token', res.token);
      setUser(res.user);
    }
    setLoading(false);
  };

  const register = async (name: string, email: string, role?: string) => {
    setLoading(true);
    const res = await api.register(name, email, role);
    if (res.user && res.token) {
      localStorage.setItem('ikshovia_token', res.token);
      setUser(res.user);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('ikshovia_token');
    setUser(null);
  };

  const saveOnboarding = async (data: any) => {
    if (!user) return;
    const res = await api.saveOnboarding({ userId: user.id, ...data });
    if (res.user) {
      setUser(res.user);
    }
  };

  const switchRole = async (role: UserRole) => {
    let targetEmail = 'student@ikshovia.com';
    if (role === 'SUPER_ADMIN') {
      targetEmail = 'superadmin@ikshovia.com';
    } else if (role === 'ADMIN') {
      targetEmail = 'admin@ikshovia.com';
    }
    await login(targetEmail, 'password', role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, saveOnboarding, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

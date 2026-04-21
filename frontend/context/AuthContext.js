'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';
import { setTokens, clearTokens, isAuthenticated } from '../lib/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setTokens(res.data.access, res.data.refresh);
    const profile = await authApi.getProfile();
    setUser(profile.data);
    return profile.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    setTokens(res.data.access, res.data.refresh);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshUser = () => fetchProfile();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

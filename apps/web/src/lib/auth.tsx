'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, getToken, ApiError } from './api';

export interface MeUser {
  id: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'COMPANION' | 'ADMIN';
  status: string;
  customerProfile: { displayName: string; city: string | null } | null;
  companionProfile?: { id: string; displayName: string; verificationStatus: string; isLive: boolean } | null;
}

interface AuthState {
  user: MeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  dateOfBirth: string;
  ageAcknowledged: true;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<MeUser>('/auth/me');
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ accessToken: string; user: MeUser }>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setToken(res.accessToken);
    await refresh();
  }, [refresh]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      auth: false,
      body: data,
    });
    setToken(res.accessToken);
    await refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

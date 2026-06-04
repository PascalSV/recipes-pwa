import { useState, useEffect } from 'react';
import type { AuthSession } from '../types';
import { getSession, saveSession, clearSession } from '../lib/db';
import { login as apiLogin } from '../lib/api';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(s => {
      setSession(s ?? null);
      setLoading(false);
    });
  }, []);

  const login = async (user: string, token: string): Promise<void> => {
    const s = await apiLogin(user, token);
    await saveSession(s);
    setSession(s);
  };

  const logout = async (): Promise<void> => {
    await clearSession();
    setSession(null);
  };

  return { session, loading, login, logout };
}

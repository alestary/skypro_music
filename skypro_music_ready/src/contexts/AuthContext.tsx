'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { clearSession, getAccessToken, getRefreshToken } from '@/api/musicApi';

interface AuthValue { isAuthenticated: boolean; isReady: boolean; username: string; logout: () => void; }
const AuthContext = createContext<AuthValue | null>(null);
function subscribeAuth(onStoreChange: () => void) {
  window.addEventListener('auth-change', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => { window.removeEventListener('auth-change', onStoreChange); window.removeEventListener('storage', onStoreChange); };
}
function getAuthSnapshot() { return Boolean(getAccessToken() && getRefreshToken()); }
function getUsernameSnapshot() { return typeof window === 'undefined' ? '' : localStorage.getItem('username') || ''; }
export function AuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);
  const username = useSyncExternalStore(subscribeAuth, getUsernameSnapshot, () => '');
  const isReady = useSyncExternalStore(subscribeAuth, () => true, () => false);
  const logout = useCallback(() => clearSession(), []);
  const value = useMemo(() => ({ isAuthenticated, isReady, username, logout }), [isAuthenticated, isReady, username, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return value;
}

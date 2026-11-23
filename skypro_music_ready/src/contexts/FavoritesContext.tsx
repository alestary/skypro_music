'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addFavorite, getAccessToken, getFavoriteTracks, removeFavorite } from '@/api/musicApi';
import type { Track } from '@/types/track';
import { useAuth } from './AuthContext';

interface FavoritesValue {
  favoriteTracks: Track[]; favoriteIds: Set<number>; loading: boolean; error: string;
  toggleFavorite: (track: Track) => Promise<void>; refreshFavorites: () => Promise<void>;
}
const FavoritesContext = createContext<FavoritesValue | null>(null);
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    try { setFavoriteTracks(await getFavoriteTracks()); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить избранное.'); }
    finally { setLoading(false); }
  }, [isAuthenticated]);
  useEffect(() => { void refreshFavorites(); }, [refreshFavorites]);
  useEffect(() => {
    const clearOnLogout = () => { if (!getAccessToken()) { setFavoriteTracks([]); setError(''); setLoading(false); } };
    window.addEventListener('auth-change', clearOnLogout);
    return () => window.removeEventListener('auth-change', clearOnLogout);
  }, []);
  const favoriteIds = useMemo(() => new Set(favoriteTracks.map((track) => track._id)), [favoriteTracks]);
  const toggleFavorite = useCallback(async (track: Track) => {
    if (!isAuthenticated) throw new Error('Чтобы добавлять треки в избранное, войдите в аккаунт.');
    const exists = favoriteIds.has(track._id);
    // Optimistic update: интерфейс сразу отражает действие, при ошибке состояние откатывается.
    setFavoriteTracks((current) => exists ? current.filter((item) => item._id !== track._id) : [...current, track]);
    setError('');
    try { if (exists) await removeFavorite(track._id); else await addFavorite(track._id); }
    catch (reason) {
      setFavoriteTracks((current) => exists ? [...current, track] : current.filter((item) => item._id !== track._id));
      const message = reason instanceof Error ? reason.message : 'Не удалось изменить избранное.';
      setError(message); throw new Error(message);
    }
  }, [favoriteIds, isAuthenticated]);
  const value = useMemo(() => ({ favoriteTracks, favoriteIds, loading, error, toggleFavorite, refreshFavorites }), [favoriteTracks, favoriteIds, loading, error, toggleFavorite, refreshFavorites]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites должен использоваться внутри FavoritesProvider');
  return value;
}

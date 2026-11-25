'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addFavoriteTrack, getFavoriteTracks, removeFavoriteTrack } from '@/api/musicApi';
import type { Track } from '@/types/track';

interface FavoritesContextValue {
  favorites: Track[];
  favoriteIds: Set<number>;
  loading: boolean;
  error: string;
  toggleFavorite: (track: Track) => Promise<boolean>;
  reloadFavorites: () => Promise<void>;
}
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('access'));

  const reloadFavorites = useCallback(async () => {
    if (!window.localStorage.getItem('access')) { setFavorites([]); return; }
    setLoading(true);
    try { setFavorites(await getFavoriteTracks()); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить избранное.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const syncAuth = () => { if (window.localStorage.getItem('access')) void reloadFavorites(); else setFavorites([]); };
    if (isAuthenticated) void Promise.resolve().then(reloadFavorites);
    window.addEventListener('auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => { window.removeEventListener('auth-changed', syncAuth); window.removeEventListener('storage', syncAuth); };
  }, [isAuthenticated, reloadFavorites]);

  const toggleFavorite = useCallback(async (track: Track) => {
    if (!window.localStorage.getItem('access')) { setError('Чтобы добавлять треки в избранное, войдите в аккаунт.'); return false; }
    const wasFavorite = favorites.some((item) => item._id === track._id);
    const previous = favorites;
    setFavorites((current) => wasFavorite ? current.filter((item) => item._id !== track._id) : [...current, track]);
    try {
      if (wasFavorite) await removeFavoriteTrack(track._id);
      else await addFavoriteTrack(track._id);
      setError('');
      return true;
    } catch (reason) {
      setFavorites(previous);
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить избранное.');
      return false;
    }
  }, [favorites]);

  const value = useMemo(() => ({ favorites, favoriteIds: new Set(favorites.map((track) => track._id)), loading, error, toggleFavorite, reloadFavorites }), [favorites, loading, error, toggleFavorite, reloadFavorites]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites должен использоваться внутри FavoritesProvider.');
  return context;
}

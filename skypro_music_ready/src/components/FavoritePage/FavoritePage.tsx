'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import TrackItem from '@/components/TrackItem/TrackItem';
import styles from './FavoritePage.module.css';
export default function FavoritePage() {
  const router = useRouter(); const { isAuthenticated, isReady } = useAuth();
  const { favoriteTracks, loading, error, refreshFavorites } = useFavorites();
  useEffect(() => { if (isReady && !isAuthenticated) router.replace('/'); }, [isAuthenticated, isReady, router]);
  if (!isReady || !isAuthenticated) return <section className={styles.page}><p>Проверяем авторизацию…</p></section>;
  return <section className={styles.page} aria-label="Избранные треки">
    <h1 className={styles.title}>Мой плейлист</h1><p className={styles.subtitle}>Избранные треки</p>
    <div className={styles.heading}><span>Трек</span><span>Исполнитель</span><span>Альбом</span><span>Время</span></div>
    {loading && <p className={styles.message}>Загружаем избранное…</p>}
    {!loading && error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => void refreshFavorites()}>Повторить</button></div>}
    {!loading && !error && favoriteTracks.length === 0 && <p className={styles.message}>В избранном пока нет треков. Добавьте их с помощью значка сердца в списке или плеере.</p>}
    {!loading && favoriteTracks.map((track) => <TrackItem key={track._id} track={track} />)}
  </section>;
}

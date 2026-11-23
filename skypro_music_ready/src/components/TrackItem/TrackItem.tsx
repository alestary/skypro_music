'use client';
import { useState } from 'react';
import type { Track } from '@/types/track';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTrack } from '@/store/playerSlice';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserId } from '@/api/musicApi';
import styles from './TrackItem.module.css';
interface TrackItemProps { track: Track; }
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
export default function TrackItem({ track }: TrackItemProps) {
  const dispatch = useAppDispatch(); const { currentTrack, isPlaying } = useAppSelector((state) => state.player);
  const { favoriteIds, toggleFavorite } = useFavorites(); const { isAuthenticated } = useAuth();
  const [error, setError] = useState(''); const isCurrentTrack = currentTrack?._id === track._id; const isFavorite = favoriteIds.has(track._id);
  const userId = getUserId(); const users = track.stared_user ?? [];
  const count = Math.max(0, users.length + (isFavorite && !users.some((id) => String(id) === userId) ? 1 : 0) - (!isFavorite && users.some((id) => String(id) === userId) ? 1 : 0));
  const onFavorite = async () => { setError(''); if (!isAuthenticated) { setError('Войдите в аккаунт, чтобы добавить трек в избранное.'); return; } try { await toggleFavorite(track); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось обновить избранное.'); } };
  return <div className={styles.trackRow}>
    <button type="button" className={styles.playlist__track} onClick={() => dispatch(selectTrack(track))} aria-label={`Воспроизвести ${track.name} — ${track.author}`} aria-pressed={isCurrentTrack}>
      <span className={styles.track__title}><span className={styles.track__titleImage} aria-hidden="true"><svg className={styles.track__titleSvg}><use href="/icon/sprite.svg#icon-note" /></svg></span><span className={styles['track__title-text']}><span className={styles.track__titleLink}>{track.name}</span>{isCurrentTrack && <span className={`${styles.track__playingDot} ${isPlaying ? styles.track__playingDot_active : ''}`} aria-label={isPlaying ? 'Сейчас играет' : 'На паузе'} />}</span></span>
      <span className={styles.track__author}><span className={styles.track__authorLink}>{track.author}</span></span><span className={styles.track__album}><span className={styles.track__albumLink}>{track.album}</span></span>
      <span className={styles.track__time}><span className={styles.track__timeText}>{formatDuration(track.duration_in_seconds)}</span></span>
    </button>
    <div className={styles.favoriteCell}><button type="button" className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`} onClick={onFavorite} aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'} aria-pressed={isFavorite}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg></button><span className={styles.favoriteCount}>{count}</span></div>
    {error && <span className={styles.favoriteError} role="alert">{error}</span>}
  </div>;
}

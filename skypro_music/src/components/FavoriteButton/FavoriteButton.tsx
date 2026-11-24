'use client';

import { useState } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Track } from '@/types/track';
import styles from './FavoriteButton.module.css';

export default function FavoriteButton({ track, compact = false }: { track: Track; compact?: boolean }) {
  const { favoriteIds, toggleFavorite, error } = useFavorites();
  const active = favoriteIds.has(track._id);
  const [count, setCount] = useState(() => Array.isArray(track.stared_user) ? track.stared_user.length : 0);
  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const changed = await toggleFavorite(track);
    if (changed) setCount((value) => Math.max(0, value + (active ? -1 : 1)));
  };
  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.button} ${active ? styles.active : ''} ${compact ? styles.compact : ''}`}
        onClick={handleToggle}
        aria-label={active ? `Убрать ${track.name} из избранного` : `Добавить ${track.name} в избранное`}
        aria-pressed={active}
        title={active ? 'Убрать из избранного' : 'В избранное'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
      </button>
      <span className={styles.count} aria-label={`Лайков: ${count}`}>{count}</span>
      {error && <span className={styles.error} role="status">{error}</span>}
    </span>
  );
}

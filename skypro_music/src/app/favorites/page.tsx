'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MusicShell from '@/components/MusicShell/MusicShell';
import TrackItem from '@/components/TrackItem/TrackItem';
import { useFavorites } from '@/contexts/FavoritesContext';
import styles from '@/components/CenterBlock/CenterBlock.module.css';

function FavoritesContent() {
  const router = useRouter();
  const { favorites, loading, error, reloadFavorites } = useFavorites();

  useEffect(() => {
    if (!window.localStorage.getItem('access')) router.replace('/signin');
    else void reloadFavorites();
  }, [router, reloadFavorites]);

  if (typeof window !== 'undefined' && !window.localStorage.getItem('access')) return null;
  return (
    <section className={styles.centerblock} aria-label="Избранные треки">
      <h2 className={styles.centerblock__h2}>Мой плейлист</h2>
      <div className={styles.centerblock__content}>
        <div className={styles.content__title}>
          <div className={`${styles.playlistTitle__col} ${styles.col01}`}>Трек</div>
          <div className={`${styles.playlistTitle__col} ${styles.col02}`}>Исполнитель</div>
          <div className={`${styles.playlistTitle__col} ${styles.col03}`}>Альбом</div>
          <div className={`${styles.playlistTitle__col} ${styles.col04}`}>Время</div>
        </div>
        <div className={styles.content__playlist} aria-live="polite">
          {loading && <p className={styles.status}>Загружаем избранное…</p>}
          {!loading && error && <div className={styles.errorState}><p>{error}</p><button type="button" onClick={() => void reloadFavorites()}>Повторить</button></div>}
          {!loading && !error && favorites.length === 0 && <p className={styles.status}>Вы пока не добавили ни одного трека в избранное.</p>}
          {!loading && !error && favorites.map((track) => <TrackItem key={track._id} track={track} />)}
        </div>
      </div>
    </section>
  );
}

export default function FavoritesPage() {
  return <MusicShell><FavoritesContent /></MusicShell>;
}

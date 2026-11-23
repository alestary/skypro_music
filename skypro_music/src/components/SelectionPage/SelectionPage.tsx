'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/components/CenterBlock/CenterBlock.module.css';
import pageStyles from './SelectionPage.module.css';
import TrackItem from '@/components/TrackItem/TrackItem';
import { getSelectionTracks } from '@/api/musicApi';
import type { Track } from '@/types/track';
import { useAppDispatch } from '@/store/hooks';
import { setTracks } from '@/store/playerSlice';

export default function SelectionPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('Подборка');
  const [tracks, setLocalTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSelectionTracks(params.id)
      .then(({ selection, tracks: items }) => {
        if (!active) return;
        setName(selection.name || 'Подборка');
        setLocalTracks(items);
        if (items.length) dispatch(setTracks(items));
        if (!items.length) setError('В этой подборке пока нет треков.');
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить подборку.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id, dispatch]);

  return (
    <section className={`${styles.centerblock} ${pageStyles.selection}`} aria-label={`Подборка ${name}`}>
      <h2 className={styles.centerblock__h2}>{name}</h2>
      <div className={styles.centerblock__content}>
        <div className={styles.content__title}>
          <div className={`${styles.playlistTitle__col} ${styles.col01}`}>Трек</div>
          <div className={`${styles.playlistTitle__col} ${styles.col02}`}>Исполнитель</div>
          <div className={`${styles.playlistTitle__col} ${styles.col03}`}>Альбом</div>
          <div className={`${styles.playlistTitle__col} ${styles.col04}`}>Время</div>
        </div>
        <div className={styles.content__playlist} aria-live="polite">
          {loading && <p className={styles.status}>Загружаем подборку…</p>}
          {!loading && error && <p className={styles.errorState}>{error}</p>}
          {!loading && !error && tracks.map((track) => <TrackItem key={track._id} track={track} />)}
        </div>
      </div>
    </section>
  );
}

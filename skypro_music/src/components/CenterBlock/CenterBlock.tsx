'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './CenterBlock.module.css';
import TrackItem from '@/components/TrackItem/TrackItem';
import { getTracks } from '@/api/musicApi';
import type { Track } from '@/types/track';
import { useAppDispatch } from '@/store/hooks';
import { setTracks } from '@/store/playerSlice';
import SearchInput from '@/components/SearchInput/SearchInput';
import TrackFilters from '@/components/TrackFilters/TrackFilters';
import TrackSort from '@/components/TrackSort/TrackSort';
import { EMPTY_FILTERS, filterTracks, getFilterOptions, sortTracks, toggleFilterValue, type SortOrder, type TrackFilterState } from '@/lib/trackFilters';

export default function CenterBlock() {
  const dispatch = useAppDispatch();
  const [tracks, setLocalTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [selectedFilters, setSelectedFilters] = useState<TrackFilterState>(EMPTY_FILTERS);

  useEffect(() => {
    let active = true;
    getTracks()
      .then((items) => {
        if (!active) return;
        setLocalTracks(items);
        dispatch(setTracks(items));
        setError(items.length ? '' : 'В каталоге пока нет треков.');
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить треки.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dispatch]);

  const filterOptions = useMemo(() => getFilterOptions(tracks), [tracks]);

  const visibleTracks = useMemo(() => {
    const filtered = filterTracks(tracks, selectedFilters, search);
    return sortTracks(filtered, sortOrder);
  }, [tracks, selectedFilters, search, sortOrder]);

  const toggleFilter = (filter: keyof TrackFilterState, value: string) => {
    setSelectedFilters((current) => ({
      ...current,
      [filter]: toggleFilterValue(current[filter], value),
    }));
  };

  return (
    <section className={styles.centerblock} aria-label="Список треков">
      <SearchInput value={search} onChange={setSearch} />
      <h2 className={styles.centerblock__h2}>Треки</h2>
      <TrackFilters options={filterOptions} selected={selectedFilters} onToggle={toggleFilter} />
      <TrackSort value={sortOrder} onChange={setSortOrder} />
      <div className={styles.centerblock__content}>
        <div className={styles.content__title}>
          <div className={`${styles.playlistTitle__col} ${styles.col01}`}>Трек</div>
          <div className={`${styles.playlistTitle__col} ${styles.col02}`}>Исполнитель</div>
          <div className={`${styles.playlistTitle__col} ${styles.col03}`}>Альбом</div>
          <div className={`${styles.playlistTitle__col} ${styles.col04}`}><svg className={styles.playlistTitle__svg} aria-label="Длительность"><use href="/icon/sprite.svg#icon-watch" /></svg></div>
        </div>
        <div className={styles.content__playlist} aria-live="polite">
          {loading && <p className={styles.status}>Загружаем треки…</p>}
          {!loading && error && <div className={styles.errorState}><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Повторить</button></div>}
          {!loading && !error && visibleTracks.map((track) => <TrackItem key={track._id} track={track} />)}
          {!loading && !error && visibleTracks.length === 0 && <p className={styles.status}>Нет подходящих треков</p>}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './CenterBlock.module.css';
import TrackItem from '@/components/TrackItem/TrackItem';
import { getTracks } from '@/api/musicApi';
import type { Track } from '@/types/track';
import { useAppDispatch } from '@/store/hooks';
import { setTracks } from '@/store/playerSlice';

type FilterName = 'author' | 'year' | 'genre';
const filterLabels: Record<FilterName, string> = { author: 'исполнителю', year: 'году выпуска', genre: 'жанру' };

export default function CenterBlock() {
  const dispatch = useAppDispatch();
  const [tracks, setLocalTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterName | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<FilterName, string[]>>({ author: [], year: [], genre: [] });

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

  const filterOptions = useMemo<Record<FilterName, string[]>>(() => ({
    author: [...new Set(tracks.map((track) => track.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')),
    year: [...new Set(tracks.map((track) => track.release_date?.slice(0, 4)).filter(Boolean))].sort((a, b) => Number(b) - Number(a)),
    genre: [...new Set(tracks.flatMap((track) => track.genre ?? []))].sort((a, b) => a.localeCompare(b, 'ru')),
  }), [tracks]);

  const visibleTracks = useMemo(() => tracks.filter((track) => {
    const query = search.trim().toLocaleLowerCase('ru');
    const matchesSearch = !query || `${track.name} ${track.author} ${track.album}`.toLocaleLowerCase('ru').includes(query);
    const matchesAuthor = !selectedFilters.author.length || selectedFilters.author.includes(track.author);
    const matchesYear = !selectedFilters.year.length || selectedFilters.year.includes(track.release_date?.slice(0, 4));
    const matchesGenre = !selectedFilters.genre.length || (track.genre ?? []).some((genre) => selectedFilters.genre.includes(genre));
    return matchesSearch && matchesAuthor && matchesYear && matchesGenre;
  }), [tracks, search, selectedFilters]);

  const toggleFilter = (filter: FilterName, value: string) => {
    setSelectedFilters((current) => ({
      ...current,
      [filter]: current[filter].includes(value) ? current[filter].filter((item) => item !== value) : [...current[filter], value],
    }));
  };

  return (
    <section className={styles.centerblock} aria-label="Список треков">
      <div className={styles.centerblock__search}>
        <svg className={styles.search__svg} aria-hidden="true"><use href="/icon/sprite.svg#icon-search" /></svg>
        <input className={styles.search__text} type="search" placeholder="Поиск" name="search" aria-label="Поиск треков" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <h2 className={styles.centerblock__h2}>Треки</h2>
      <div className={styles.centerblock__filter}>
        <div className={styles.filter__title}>Искать по:</div>
        {(Object.keys(filterLabels) as FilterName[]).map((filter) => (
          <div className={styles.filter__group} key={filter}>
            <button type="button" className={`${styles.filter__button} ${activeFilter === filter || selectedFilters[filter].length ? styles.active : ''}`} aria-expanded={activeFilter === filter} onClick={() => setActiveFilter((current) => current === filter ? null : filter)}>
              {filterLabels[filter]}{selectedFilters[filter].length ? ` (${selectedFilters[filter].length})` : ''}
            </button>
            {activeFilter === filter && (
              <div className={styles.filter__dropdown}>
                <ul className={styles.filter__list}>
                  {filterOptions[filter].map((option) => (
                    <li className={styles.filter__option} key={option}>
                      <label className={styles.filter__choice}>
                        <input type="checkbox" checked={selectedFilters[filter].includes(option)} onChange={() => toggleFilter(filter, option)} />
                        <span>{option}</span>
                      </label>
                    </li>
                  ))}
                  {filterOptions[filter].length === 0 && <li className={styles.filter__option}>Нет данных</li>}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
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
          {!loading && !error && visibleTracks.length === 0 && <p className={styles.status}>По вашему запросу ничего не найдено.</p>}
        </div>
      </div>
    </section>
  );
}

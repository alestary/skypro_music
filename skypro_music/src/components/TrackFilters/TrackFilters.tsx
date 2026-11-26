'use client';

import { useState } from 'react';
import type { TrackFilterState } from '@/lib/trackFilters';
import styles from './TrackFilters.module.css';

export type FilterOptions = { author: string[]; genre: string[]; year: string[] };
type FilterKey = keyof TrackFilterState;
type TrackFiltersProps = {
  options: FilterOptions;
  selected: TrackFilterState;
  onToggle: (filter: FilterKey, value: string) => void;
};

const labels: Record<FilterKey, string> = {
  author: 'исполнителю',
  year: 'году выпуска',
  genre: 'жанру',
};

export default function TrackFilters({ options, selected, onToggle }: TrackFiltersProps) {
  const [opened, setOpened] = useState<FilterKey | null>(null);

  return (
    <div className={styles.filters} aria-label="Фильтры треков">
      <span className={styles.title}>Искать по:</span>
      {(Object.keys(labels) as FilterKey[]).map((filter) => (
        <div className={styles.group} key={filter}>
          <button
            type="button"
            className={`${styles.button} ${opened === filter || selected[filter].length ? styles.active : ''}`}
            aria-expanded={opened === filter}
            aria-controls={`filter-options-${filter}`}
            onClick={() => setOpened((current) => current === filter ? null : filter)}
          >
            {labels[filter]}{selected[filter].length ? ` (${selected[filter].length})` : ''}
          </button>
          {opened === filter && (
            <div className={styles.dropdown} id={`filter-options-${filter}`}>
              <ul className={styles.list}>
                {options[filter].map((option) => (
                  <li className={styles.option} key={option}>
                    <label className={styles.choice}>
                      <input type="checkbox" checked={selected[filter].includes(option)} onChange={() => onToggle(filter, option)} />
                      <span>{option}</span>
                    </label>
                  </li>
                ))}
                {options[filter].length === 0 && <li className={styles.option}>Нет данных</li>}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

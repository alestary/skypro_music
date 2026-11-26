'use client';

import type { SortOrder } from '@/lib/trackFilters';
import styles from './TrackSort.module.css';

type TrackSortProps = { value: SortOrder; onChange: (value: SortOrder) => void };

export default function TrackSort({ value, onChange }: TrackSortProps) {
  return (
    <label className={styles.sort}>
      <span>Сортировка:</span>
      <select aria-label="Сортировка треков по дате" value={value} onChange={(event) => onChange(event.target.value as SortOrder)}>
        <option value="default">По умолчанию</option>
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
      </select>
    </label>
  );
}

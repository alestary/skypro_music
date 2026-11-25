'use client';

import styles from './SearchInput.module.css';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className={styles.search}>
      <svg className={styles.icon} aria-hidden="true"><use href="/icon/sprite.svg#icon-search" /></svg>
      <input
        className={styles.input}
        type="search"
        placeholder="Поиск"
        name="search"
        aria-label="Поиск треков по названию"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

import styles from './FilterDropdown.module.css';

export type FilterName = 'Исполнителю' | 'году выпуска' | 'жанру';
type FilterDropdownProps = { title: FilterName; options: string[] };

export default function FilterDropdown({ title, options }: FilterDropdownProps) {
  return (
    <div className={styles.popup}>
      <ul className={styles.list} aria-label={`Фильтр: ${title}`}>
        {options.map((option) => <li className={styles.option} key={option}>{option}</li>)}
      </ul>
    </div>
  );
}

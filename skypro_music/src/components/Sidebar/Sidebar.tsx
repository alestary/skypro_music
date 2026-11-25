'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import type { Selection } from '@/types/track';
import styles from './Sidebar.module.css';

interface SidebarProps { selections: Selection[]; error?: string; }

export default function Sidebar({ selections, error }: SidebarProps) {
  const router = useRouter();
  const username = useSyncExternalStore(
    (onStoreChange) => { window.addEventListener('storage', onStoreChange); return () => window.removeEventListener('storage', onStoreChange); },
    () => window.localStorage.getItem('username') || '',
    () => '',
  );
  const logout = () => {
    window.localStorage.removeItem('access');
    window.localStorage.removeItem('refresh');
    window.localStorage.removeItem('username');
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/');
  };
  return (
    <aside className={styles.main__sidebar} aria-label="Профиль и подборки">
      <div className={styles.sidebar__personal}>
        <p className={styles.sidebar__personalName}>{username || 'Гость'}</p>
        <button type="button" className={styles.sidebar__icon} onClick={logout} aria-label="Выйти из аккаунта">
          <svg aria-hidden="true"><use href="/icon/sprite.svg#logout" /></svg>
        </button>
      </div>
      <div className={styles.sidebar__block}>
        <div className={styles.sidebar__list}>
          {selections.slice(0, 3).map((selection, index) => (
            <div className={styles.sidebar__item} key={selection._id}>
              <Link className={styles.sidebar__link} href={`/selection/${selection._id}`} aria-label={selection.name}>
                <Image className={styles.sidebar__img} src={`/playlist0${index + 1}.png`} alt={selection.name} width={250} height={150} />
                <span className={styles.selectionName}>{selection.name}</span>
              </Link>
            </div>
          ))}
          {selections.length === 0 && !error && <p className={styles.sidebar__hint}>Загружаем подборки…</p>}
          {error && <p className={styles.sidebar__hint}>{error}</p>}
        </div>
      </div>
    </aside>
  );
}

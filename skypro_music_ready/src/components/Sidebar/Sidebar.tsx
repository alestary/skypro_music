'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { Selection } from '@/types/track';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.css';
interface SidebarProps { selections: Selection[]; error?: string; }
export default function Sidebar({ selections, error }: SidebarProps) {
  const router = useRouter(); const pathname = usePathname();
  const { username, isAuthenticated, logout } = useAuth();
  const handleLogout = () => { logout(); router.replace(pathname === '/favorite' ? '/' : '/signin'); };
  return <aside className={styles.main__sidebar} aria-label="Профиль и подборки">
    <div className={styles.sidebar__personal}>
      <p className={styles.sidebar__personalName}>{username || 'Гость'}</p>
      {isAuthenticated ? <button type="button" className={styles.sidebar__icon} onClick={handleLogout} aria-label="Выйти из аккаунта"><svg aria-hidden="true"><use href="/icon/sprite.svg#logout" /></svg></button> : <Link className={styles.signInLink} href="/signin">Войти</Link>}
    </div>
    <div className={styles.sidebar__block}><div className={styles.sidebar__list}>
      {selections.slice(0, 3).map((selection, index) => <div className={styles.sidebar__item} key={selection._id}><Link className={styles.sidebar__link} href={`/selection/${selection._id}`} aria-label={selection.name}><Image className={styles.sidebar__img} src={`/playlist0${index + 1}.png`} alt={selection.name} width={250} height={150} /><span className={styles.selectionName}>{selection.name}</span></Link></div>)}
      {selections.length === 0 && !error && <p className={styles.sidebar__hint}>Загружаем подборки…</p>}{error && <p className={styles.sidebar__hint}>{error}</p>}
    </div></div>
  </aside>;
}

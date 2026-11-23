'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getSelections } from '@/api/musicApi';
import type { Selection } from '@/types/track';
import Navigation from '@/components/Navigation/Navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import Player from '@/components/Player/Player';
import styles from './MusicShell.module.css';

export default function MusicShell({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    let active = true;
    getSelections()
      .then((items) => { if (active) setSelections(items); })
      .catch((error: unknown) => {
        if (active) setSelectionError(error instanceof Error ? error.message : 'Не удалось загрузить подборки');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          <Navigation />
          <div className={styles.content}>{children}</div>
          <Sidebar selections={selections} error={selectionError} />
        </main>
        <Player />
        <footer className={styles.footer} />
      </div>
    </div>
  );
}

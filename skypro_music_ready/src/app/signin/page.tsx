'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getTokens, saveSession, signIn } from '@/api/musicApi';
import styles from './signin.module.css';

export default function Signin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Введите почту и пароль.'); return; }
    setBusy(true);
    try {
      const credentials = { email: email.trim(), password };
      const user = await signIn(credentials);
      const tokens = await getTokens(credentials);
      if (!tokens.access || !tokens.refresh) throw new Error('Сервер не вернул токены авторизации.');
      const userData = user && typeof user === 'object' ? user as { username?: unknown; _id?: unknown } : {};
      saveSession(tokens, typeof userData.username === 'string' ? userData.username : undefined, typeof userData._id === 'string' || typeof userData._id === 'number' ? userData._id : undefined);
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти. Попробуйте ещё раз.');
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modal__block}>
          <form className={styles.modal__form} onSubmit={handleSubmit}>
            <Link href="/" className={styles.modal__logo}><Image src="/logo_modal.png" width={140} height={21} alt="Skypro Music" priority /></Link>
            <input className={`${styles.modal__input} ${styles.login}`} type="email" name="email" placeholder="Почта" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input className={styles.modal__input} type="password" name="password" placeholder="Пароль" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <div className={styles.errorContainer} role="alert">{error}</div>
            <button className={styles.modal__btnEnter} type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
            <Link href="/signup" className={styles.modal__btnSignup}>Зарегистрироваться</Link>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/api/musicApi';
import styles from './signup.module.css';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password !== passwordAgain) { setError('Пароли не совпадают.'); return; }
    if (password.length < 6) { setError('Пароль должен содержать не менее 6 символов.'); return; }
    setBusy(true);
    try {
      await signUp({ email: email.trim(), username: username.trim(), password });
      router.replace('/signin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось зарегистрироваться. Попробуйте ещё раз.');
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modal__block}>
          <form className={styles.modal__form} onSubmit={handleSubmit}>
            <Link href="/" className={styles.modal__logo}><Image src="/logo_modal.png" width={140} height={21} alt="Skypro Music" priority /></Link>
            <input className={`${styles.modal__input} ${styles.login}`} type="email" name="email" placeholder="Почта" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input className={styles.modal__input} type="text" name="username" placeholder="Имя пользователя" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            <input className={styles.modal__input} type="password" name="password" placeholder="Пароль" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <input className={styles.modal__input} type="password" name="passwordAgain" placeholder="Повторите пароль" autoComplete="new-password" value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} required />
            <div className={styles.errorContainer} role="alert">{error}</div>
            <button className={styles.modal__btnSignupEnt} type="submit" disabled={busy}>{busy ? 'Регистрируем…' : 'Зарегистрироваться'}</button>
            <Link href="/signin" className={styles.backToLogin}>Уже есть аккаунт? Войти</Link>
          </form>
        </div>
      </div>
    </div>
  );
}

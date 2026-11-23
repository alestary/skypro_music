import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin', 'cyrillic'], display: 'swap' });
export const metadata: Metadata = { title: 'Skypro.Music', description: 'Музыкальный сервис Skypro.Music' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className={montserrat.variable}><body><StoreProvider><AuthProvider><FavoritesProvider>{children}</FavoritesProvider></AuthProvider></StoreProvider></body></html>;
}

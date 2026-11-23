import type { Selection, Track } from '@/types/track';

const API_URL = 'https://webdev-music-003b5b991590.herokuapp.com';
type ApiErrorBody = { message?: string; detail?: string; error?: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

const isBrowser = () => typeof window !== 'undefined';
export const getAccessToken = () => isBrowser() ? localStorage.getItem('access') : null;
export const getRefreshToken = () => isBrowser() ? localStorage.getItem('refresh') : null;
export const getUserId = () => isBrowser() ? localStorage.getItem('userId') : null;
export function saveSession(tokens: TokenPair, username?: string, userId?: string | number) {
  if (!isBrowser()) return;
  localStorage.setItem('access', tokens.access);
  localStorage.setItem('refresh', tokens.refresh);
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  if (username) localStorage.setItem('username', username);
  if (userId !== undefined) localStorage.setItem('userId', String(userId));
  window.dispatchEvent(new Event('auth-change'));
}
export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem('access'); localStorage.removeItem('refresh'); localStorage.removeItem('username'); localStorage.removeItem('userId');
  window.dispatchEvent(new Event('auth-change'));
}

let refreshPromise: Promise<string> | null = null;
async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError('Сессия завершена. Войдите в аккаунт снова.', 401);
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/user/token/refresh/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }), cache: 'no-store',
    }).then(async (response) => {
      const payload = await response.json() as { access?: string; detail?: string };
      if (!response.ok || !payload.access) throw new ApiError(payload.detail || 'Не удалось обновить токен. Войдите снова.', response.status);
      localStorage.setItem('access', payload.access);
      window.dispatchEvent(new Event('auth-change'));
      return payload.access;
    }).catch((error: unknown) => {
      clearSession();
      throw error instanceof Error ? error : new ApiError('Не удалось обновить токен.', 401);
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise as Promise<string>;
}

async function rawRequest<T>(path: string, init?: RequestInit, authorized = false, retry = true): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authorized) {
    const access = getAccessToken();
    if (!access) throw new ApiError('Для выполнения действия войдите в аккаунт.', 401);
    headers.set('Authorization', `Bearer ${access}`);
  }
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' }); }
  catch { throw new ApiError('Не удалось связаться с сервером. Проверьте подключение к интернету.', 0); }
  if (response.status === 401 && authorized && retry) {
    await refreshAccessToken();
    return rawRequest<T>(path, init, true, false);
  }
  if (response.status === 401 && authorized && !retry) clearSession();
  const text = await response.text();
  let payload: unknown = null;
  if (text) { try { payload = JSON.parse(text) as unknown; } catch { payload = text; } }
  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? payload as ApiErrorBody : null;
    throw new ApiError(body?.message || body?.detail || body?.error || `Ошибка запроса (${response.status})`, response.status);
  }
  return payload as T;
}

function collectionFrom<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const object = payload as Record<string, unknown>;
  for (const key of ['results', 'result', 'data', 'items', 'tracks', 'selections']) {
    const value = object[key];
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') { const nested = collectionFrom<T>(value); if (nested.length) return nested; }
  }
  return [];
}
function objectFrom(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const value = payload as Record<string, unknown>;
  for (const key of ['result', 'data', 'selection']) {
    const nested = value[key];
    if (Array.isArray(nested) && nested[0] && typeof nested[0] === 'object') return nested[0] as Record<string, unknown>;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as Record<string, unknown>;
  }
  return value;
}

export interface SignUpData { email: string; password: string; username: string; }
export interface SignInData { email: string; password: string; }
export interface TokenPair { access: string; refresh: string; }
export async function signUp(data: SignUpData): Promise<unknown> { return rawRequest('/user/signup/', { method: 'POST', body: JSON.stringify(data) }); }
export async function signIn(data: SignInData): Promise<unknown> { return rawRequest('/user/login/', { method: 'POST', body: JSON.stringify(data) }); }
export async function getTokens(data: SignInData): Promise<TokenPair> { return rawRequest<TokenPair>('/user/token/', { method: 'POST', body: JSON.stringify(data) }); }
export async function getTracks(): Promise<Track[]> { return collectionFrom<Track>(await rawRequest('/catalog/track/all/')); }
export async function getSelections(): Promise<Selection[]> { return collectionFrom<Selection>(await rawRequest('/catalog/selection/all')); }
export async function getSelectionById(id: string): Promise<Selection> { return objectFrom(await rawRequest(`/catalog/selection/${encodeURIComponent(id)}/`)) as Selection; }
export function withReAuth<T>(path: string, init?: RequestInit): Promise<T> { return rawRequest<T>(path, init, true); }
export async function getFavoriteTracks(): Promise<Track[]> { return collectionFrom<Track>(await withReAuth('/catalog/track/favorite/all/')); }
export async function addFavorite(trackId: number): Promise<unknown> { return withReAuth(`/catalog/track/${trackId}/favorite/`, { method: 'POST' }); }
export async function removeFavorite(trackId: number): Promise<unknown> { return withReAuth(`/catalog/track/${trackId}/favorite/`, { method: 'DELETE' }); }

export async function getSelectionTracks(id: string): Promise<{ selection: Selection; tracks: Track[] }> {
  const selection = await getSelectionById(id);
  const rawItems = selection.items ?? selection.tracks ?? [];
  const items = Array.isArray(rawItems) ? rawItems : collectionFrom<unknown>(rawItems);
  const embeddedTracks: Track[] = []; const ids: string[] = [];
  for (const item of items) {
    if (typeof item === 'number' || typeof item === 'string') { ids.push(String(item)); continue; }
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const nested = record.track && typeof record.track === 'object' ? record.track as Record<string, unknown> : record;
    if (typeof nested.track_file === 'string' && typeof nested._id === 'number') embeddedTracks.push(nested as unknown as Track);
    else { const itemId = nested._id ?? nested.track_id ?? nested.trackId ?? nested.id; if (typeof itemId === 'number' || typeof itemId === 'string') ids.push(String(itemId)); }
  }
  if (embeddedTracks.length || ids.length === 0) return { selection, tracks: embeddedTracks };
  const all = await getTracks(); return { selection, tracks: all.filter((track) => ids.includes(String(track._id))) };
}

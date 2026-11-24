import type { Selection, Track } from '@/types/track';

const API_URL = 'https://webdev-music-003b5b991590.herokuapp.com';
type ApiErrorBody = { message?: string; detail?: string; error?: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

function getStoredToken(key: 'access' | 'refresh'): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
}

async function rawRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте подключение к интернету.', 0);
  }
  const text = await response.text();
  let payload: unknown = null;
  if (text) { try { payload = JSON.parse(text) as unknown; } catch { payload = text; } }
  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? payload as ApiErrorBody : null;
    throw new ApiError(body?.message || body?.detail || body?.error || `Ошибка запроса (${response.status})`, response.status);
  }
  return payload as T;
}

let refreshPromise: Promise<string> | null = null;
export async function withReAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
  const access = getStoredToken('access');
  if (!access) throw new ApiError('Войдите в аккаунт, чтобы продолжить.', 401);
  const send = (token: string) => rawRequest<T>(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  try { return await send(access); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const refresh = getStoredToken('refresh');
    if (!refresh) throw error;
    if (!refreshPromise) {
      refreshPromise = rawRequest<{ access: string }>('/user/token/refresh/', {
        method: 'POST', body: JSON.stringify({ refresh }),
      }).then(({ access: newAccess }) => {
        if (!newAccess) throw new ApiError('Сервер не вернул новый токен.', 401);
        window.localStorage.setItem('access', newAccess);
        return newAccess;
      }).catch((refreshError: unknown) => {
        window.localStorage.removeItem('access');
        window.localStorage.removeItem('refresh');
        window.localStorage.removeItem('username');
        window.dispatchEvent(new Event('auth-changed'));
        throw refreshError;
      }).finally(() => { refreshPromise = null; });
    }
    return send(await refreshPromise);
  }
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
export async function getFavoriteTracks(): Promise<Track[]> { return collectionFrom<Track>(await withReAuth('/catalog/track/favorite/all/')); }
export async function addFavoriteTrack(id: number): Promise<unknown> { return withReAuth(`/catalog/track/${id}/favorite/`, { method: 'POST' }); }
export async function removeFavoriteTrack(id: number): Promise<unknown> { return withReAuth(`/catalog/track/${id}/favorite/`, { method: 'DELETE' }); }

export async function getSelectionTracks(id: string): Promise<{ selection: Selection; tracks: Track[] }> {
  const selection = await getSelectionById(id);
  const rawItems = selection.items ?? selection.tracks ?? [];
  const items = Array.isArray(rawItems) ? rawItems : collectionFrom<unknown>(rawItems);
  const embeddedTracks: Track[] = [];
  const ids: string[] = [];
  for (const item of items) {
    if (typeof item === 'number' || typeof item === 'string') { ids.push(String(item)); continue; }
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const nestedTrack = record.track && typeof record.track === 'object' ? record.track as Record<string, unknown> : record;
    if (typeof nestedTrack.track_file === 'string' && typeof nestedTrack._id === 'number') embeddedTracks.push(nestedTrack as unknown as Track);
    else { const itemId = nestedTrack._id ?? nestedTrack.track_id ?? nestedTrack.trackId ?? nestedTrack.id; if (typeof itemId === 'number' || typeof itemId === 'string') ids.push(String(itemId)); }
  }
  if (embeddedTracks.length || ids.length === 0) return { selection, tracks: embeddedTracks };
  const allTracks = await getTracks();
  return { selection, tracks: allTracks.filter((track) => ids.includes(String(track._id))) };
}

import type { Selection, Track } from '@/types/track';

const API_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

type ApiErrorBody = { message?: string; detail?: string; error?: string };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте подключение к интернету.', 0);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? (payload as ApiErrorBody) : null;
    const message = body?.message || body?.detail || body?.error || `Ошибка запроса (${response.status})`;
    throw new ApiError(message, response.status);
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
    if (value && typeof value === 'object') {
      const nested = collectionFrom<T>(value);
      if (nested.length) return nested;
    }
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

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function signUp(data: SignUpData): Promise<unknown> {
  return request('/user/signup/', { method: 'POST', body: JSON.stringify(data) });
}

export async function signIn(data: SignInData): Promise<unknown> {
  return request('/user/login/', { method: 'POST', body: JSON.stringify(data) });
}

export async function getTokens(data: SignInData): Promise<TokenPair> {
  return request<TokenPair>('/user/token/', { method: 'POST', body: JSON.stringify(data) });
}

export async function refreshAccessToken(refresh: string): Promise<{ access: string }> {
  return request('/user/token/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) });
}

export async function getTracks(): Promise<Track[]> {
  const payload = await request<unknown>('/catalog/track/all/');
  return collectionFrom<Track>(payload);
}

export async function getSelections(): Promise<Selection[]> {
  const payload = await request<unknown>('/catalog/selection/all');
  return collectionFrom<Selection>(payload);
}

export async function getSelectionById(id: string): Promise<Selection> {
  const payload = await request<unknown>(`/catalog/selection/${encodeURIComponent(id)}/`);
  return objectFrom(payload) as Selection;
}

export async function getSelectionTracks(id: string): Promise<{ selection: Selection; tracks: Track[] }> {
  const selection = await getSelectionById(id);
  const rawItems = selection.items ?? selection.tracks ?? [];
  const items = Array.isArray(rawItems) ? rawItems : collectionFrom<unknown>(rawItems);
  const embeddedTracks: Track[] = [];
  const ids: string[] = [];

  for (const item of items) {
    if (typeof item === 'number' || typeof item === 'string') {
      ids.push(String(item));
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const nestedTrack = record.track && typeof record.track === 'object' ? record.track as Record<string, unknown> : record;
    if (typeof nestedTrack.track_file === 'string' && typeof nestedTrack._id === 'number') {
      embeddedTracks.push(nestedTrack as unknown as Track);
      continue;
    }
    const itemId = nestedTrack._id ?? nestedTrack.track_id ?? nestedTrack.trackId ?? nestedTrack.id;
    if (typeof itemId === 'number' || typeof itemId === 'string') ids.push(String(itemId));
  }

  if (embeddedTracks.length || ids.length === 0) return { selection, tracks: embeddedTracks };
  const allTracks = await getTracks();
  return { selection, tracks: allTracks.filter((track) => ids.includes(String(track._id))) };
}

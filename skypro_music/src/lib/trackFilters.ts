import type { Track } from '../types/track';

export type TrackFilterState = {
  author: string[];
  genre: string[];
  year: string[];
};

export type SortOrder = 'default' | 'newest' | 'oldest';

export const EMPTY_FILTERS: TrackFilterState = {
  author: [],
  genre: [],
  year: [],
};

export function getFilterOptions(tracks: Track[]) {
  return {
    author: [...new Set(tracks.map((track) => track.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')),
    genre: [...new Set(tracks.flatMap((track) => track.genre ?? []).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')),
    year: [...new Set(tracks.map((track) => track.release_date?.slice(0, 4)).filter((year): year is string => Boolean(year)))].sort((a, b) => Number(b) - Number(a)),
  };
}

export function filterTracks(
  tracks: Track[],
  filters: TrackFilterState = EMPTY_FILTERS,
  searchQuery = '',
): Track[] {
  const query = searchQuery.trim().toLocaleLowerCase('ru');

  return tracks.filter((track) => {
    const matchesSearch = !query || track.name.trim().toLocaleLowerCase('ru').startsWith(query);
    const matchesAuthor = filters.author.length === 0 || filters.author.includes(track.author);
    const year = track.release_date?.slice(0, 4) ?? '';
    const matchesYear = filters.year.length === 0 || filters.year.includes(year);
    const matchesGenre = filters.genre.length === 0 || (track.genre ?? []).some((genre) => filters.genre.includes(genre));

    return matchesSearch && matchesAuthor && matchesYear && matchesGenre;
  });
}

export function sortTracks(tracks: Track[], order: SortOrder = 'default'): Track[] {
  if (order === 'default') return [...tracks];

  return tracks
    .map((track, index) => ({ track, index, date: Date.parse(track.release_date) }))
    .sort((left, right) => {
      const leftValid = Number.isFinite(left.date);
      const rightValid = Number.isFinite(right.date);
      if (!leftValid && !rightValid) return left.index - right.index;
      if (!leftValid) return 1;
      if (!rightValid) return -1;
      const difference = order === 'newest' ? right.date - left.date : left.date - right.date;
      return difference || left.index - right.index;
    })
    .map(({ track }) => track);
}

export function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

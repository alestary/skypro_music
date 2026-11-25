import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  filterTracks,
  getFilterOptions,
  sortTracks,
  toggleFilterValue,
  type TrackFilterState,
} from './trackFilters';
import type { Track } from '@/types/track';

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  _id: 1,
  name: 'Alpha Song',
  author: 'Artist A',
  release_date: '2020-01-01',
  genre: ['Pop'],
  duration_in_seconds: 180,
  album: 'First Album',
  logo: null,
  track_file: '/alpha.mp3',
  stared_user: [],
  ...overrides,
});

const tracks = [
  makeTrack({ _id: 1, name: 'Alpha Song', author: 'Artist A', release_date: '2020-01-01', genre: ['Pop', 'Rock'] }),
  makeTrack({ _id: 2, name: 'Beta Song', author: 'Artist B', release_date: '2022-05-10', genre: ['Jazz'] }),
  makeTrack({ _id: 3, name: 'Alpine Road', author: 'Artist A', release_date: '2018-03-20', genre: ['Rock'] }),
];

describe('getFilterOptions', () => {
  it('returns unique sorted filter values from the full catalogue', () => {
    expect(getFilterOptions(tracks)).toEqual({
      author: ['Artist A', 'Artist B'],
      genre: ['Jazz', 'Pop', 'Rock'],
      year: ['2022', '2020', '2018'],
    });
  });

  it('handles an empty catalogue and missing optional values', () => {
    expect(getFilterOptions([])).toEqual({ author: [], genre: [], year: [] });
    const incomplete = makeTrack({ author: '', release_date: undefined as unknown as string, genre: undefined as unknown as string[] });
    expect(getFilterOptions([incomplete])).toEqual({ author: [], genre: [], year: [] });
  });
});

describe('filterTracks', () => {
  it('returns all tracks when no filters or query are provided', () => {
    expect(filterTracks(tracks)).toEqual(tracks);
    expect(filterTracks(tracks, EMPTY_FILTERS, '   ')).toEqual(tracks);
  });

  it('matches the beginning of the track title case-insensitively', () => {
    expect(filterTracks(tracks, EMPTY_FILTERS, '  alP ' ).map((track) => track._id)).toEqual([1, 3]);
    expect(filterTracks(tracks, EMPTY_FILTERS, 'song').map((track) => track._id)).toEqual([]);
  });

  it('filters by selected authors and years', () => {
    const filters: TrackFilterState = { author: ['Artist A'], genre: [], year: ['2018'] };
    expect(filterTracks(tracks, filters).map((track) => track._id)).toEqual([3]);
  });

  it('filters by any selected genre and combines conditions with AND', () => {
    const filters: TrackFilterState = { author: ['Artist A'], genre: ['Pop'], year: ['2020'] };
    expect(filterTracks(tracks, filters, 'alpha').map((track) => track._id)).toEqual([1]);
    expect(filterTracks(tracks, filters, 'beta')).toEqual([]);
  });

  it('supports multiple values within one filter as OR and safely handles missing genres', () => {
    const noGenre = makeTrack({ _id: 4, name: 'No genre', genre: undefined as unknown as string[], release_date: undefined as unknown as string });
    const values: TrackFilterState = { author: ['Artist A', 'Artist B'], genre: ['Jazz', 'Rock'], year: [] };
    expect(filterTracks([...tracks, noGenre], values).map((track) => track._id)).toEqual([1, 2, 3]);
  });
});

describe('sortTracks', () => {
  it('preserves source order by default and does not mutate the input', () => {
    const result = sortTracks(tracks);
    expect(result).toEqual(tracks);
    expect(result).not.toBe(tracks);
  });

  it('sorts newest first and keeps stable order for equal dates', () => {
    const sameDate = makeTrack({ _id: 4, release_date: '2022-05-10' });
    expect(sortTracks([tracks[0], tracks[1], sameDate], 'newest').map((track) => track._id)).toEqual([2, 4, 1]);
  });

  it('sorts oldest first', () => {
    expect(sortTracks(tracks, 'oldest').map((track) => track._id)).toEqual([3, 1, 2]);
  });

  it('places invalid dates after valid dates and preserves order for invalid dates', () => {
    const invalidA = makeTrack({ _id: 4, release_date: 'not-a-date' });
    const invalidB = makeTrack({ _id: 5, release_date: '' });
    expect(sortTracks([invalidA, tracks[0], invalidB], 'newest').map((track) => track._id)).toEqual([1, 4, 5]);
    expect(sortTracks([invalidA, invalidB], 'oldest').map((track) => track._id)).toEqual([4, 5]);
  });
});

describe('toggleFilterValue', () => {
  it('adds a value when it is not selected', () => {
    expect(toggleFilterValue(['A'], 'B')).toEqual(['A', 'B']);
  });

  it('removes a value when it is already selected', () => {
    expect(toggleFilterValue(['A', 'B'], 'A')).toEqual(['B']);
  });
});

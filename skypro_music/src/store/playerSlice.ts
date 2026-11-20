import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Track } from '@/types/track';

interface PlayerState {
  currentTrack: Track | null;
  tracks: Track[];
  isPlaying: boolean;
}

const initialState: PlayerState = { currentTrack: null, tracks: [], isPlaying: false };

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setTracks(state, action: PayloadAction<Track[]>) {
      state.tracks = action.payload;
      if (state.currentTrack && !action.payload.some((track) => track._id === state.currentTrack?._id)) {
        state.currentTrack = null;
        state.isPlaying = false;
      }
    },
    selectTrack(state, action: PayloadAction<Track>) {
      state.currentTrack = action.payload;
      state.isPlaying = true;
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload && state.currentTrack !== null;
    },
    clearTrack(state) {
      state.currentTrack = null;
      state.isPlaying = false;
    },
  },
});

export const { setTracks, selectTrack, setPlaying, clearTrack } = playerSlice.actions;
export default playerSlice.reducer;

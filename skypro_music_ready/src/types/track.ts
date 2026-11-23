export interface Track {
  _id: number;
  name: string;
  author: string;
  release_date: string;
  genre: string[];
  duration_in_seconds: number;
  album: string;
  logo: string | null;
  track_file: string;
  stared_user: number[];
}

export interface Selection {
  _id: number | string;
  name: string;
  items?: unknown;
  tracks?: Track[];
  image?: string | null;
  [key: string]: unknown;
}

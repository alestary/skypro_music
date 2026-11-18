'use client';

import { useEffect, useRef, useState } from 'react';
import { data } from '@/data';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTrack, setPlaying } from '@/store/playerSlice';
import styles from './Player.module.css';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function createShuffledTrackIds(excludedTrackId?: number): number[] {
  const trackIds = data
    .filter((track) => track._id !== excludedTrackId)
    .map((track) => track._id);

  for (let index = trackIds.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [trackIds[index], trackIds[randomIndex]] = [trackIds[randomIndex], trackIds[index]];
  }

  return trackIds;
}

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying } = useAppSelector((state) => state.player);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    if (audio.getAttribute('src') !== currentTrack.track_file) {
      audio.src = currentTrack.track_file;
      audio.load();
    }

    if (isPlaying) {
      void audio.play().catch(() => dispatch(setPlaying(false)));
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, dispatch]);


  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const currentIndex = currentTrack
    ? data.findIndex((track) => track._id === currentTrack._id)
    : -1;

  const changeTrack = (direction: -1 | 1) => {
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= data.length) return;

    dispatch(selectTrack(data[nextIndex]));
  };

  const playRandomTrack = () => {
    const remainingQueue = shuffleQueue.filter((trackId) => trackId !== currentTrack?._id);
    const nextQueue = remainingQueue.length > 0
      ? remainingQueue
      : createShuffledTrackIds(currentTrack?._id);
    const [nextTrackId, ...updatedQueue] = nextQueue;
    const nextTrack = data.find((track) => track._id === nextTrackId);

    if (!nextTrack) {
      dispatch(setPlaying(false));
      return;
    }

    setShuffleQueue(updatedQueue);
    dispatch(selectTrack(nextTrack));
  };

  const toggleShuffle = () => {
    const nextShuffleState = !isShuffle;
    setIsShuffle(nextShuffleState);
    setShuffleQueue(nextShuffleState ? createShuffledTrackIds(currentTrack?._id) : []);
  };

  const togglePlayback = () => {
    if (!currentTrack) {
      dispatch(selectTrack(data[0]));
      return;
    }
    dispatch(setPlaying(!isPlaying));
  };

  const handleSeek = (value: string) => {
    const nextTime = Number(value);
    if (audioRef.current && Number.isFinite(nextTime)) {
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleTrackEnded = () => {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => dispatch(setPlaying(false)));
      return;
    }

    if (isShuffle) {
      playRandomTrack();
      return;
    }

    if (currentIndex >= 0 && currentIndex < data.length - 1) {
      dispatch(selectTrack(data[currentIndex + 1]));
      return;
    }

    dispatch(setPlaying(false));
  };

  return (
    <div className={styles.bar}>
      <audio
        ref={audioRef}
        className={styles.audio}
        preload="none"
        onPlay={() => dispatch(setPlaying(true))}
        onLoadStart={() => {
          setCurrentTime(0);
          setDuration(0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onEnded={handleTrackEnded}
        onError={() => dispatch(setPlaying(false))}
      />
      <div className={styles.bar__content}>
        <div className={styles.bar__playerProgress}>
          <progress
            className={styles.progress__bar}
            max={duration || 1}
            value={Math.min(currentTime, duration || 1)}
            aria-hidden="true"
          />
          <input
            className={styles.progress__input}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(event.target.value)}
            aria-label="Позиция воспроизведения"
            disabled={!currentTrack || !duration}
          />
        </div>
        <div className={styles.bar__playerBlock}>
          <div className={styles.bar__player}>
            <div className={styles.player__controls}>
              <button type="button" className={styles.player__btnPrev} onClick={() => changeTrack(-1)} disabled={!currentTrack || currentIndex <= 0} aria-label="Предыдущий трек">
                <svg className={styles.player__btnPrevSvg}><use href="/icon/sprite.svg#icon-prev" /></svg>
              </button>
              <button type="button" className={`${styles.player__btnPlay} ${styles.btn}`} onClick={togglePlayback} aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'} disabled={data.length === 0}>
                <svg className={styles.player__btnPlaySvg}>
                  <use href={`/icon/sprite.svg#icon-${isPlaying ? 'pause' : 'play'}`} />
                </svg>
              </button>
              <button type="button" className={styles.player__btnNext} onClick={() => (isShuffle ? playRandomTrack() : changeTrack(1))} disabled={!currentTrack || (!isShuffle && currentIndex >= data.length - 1)} aria-label="Следующий трек">
                <svg className={styles.player__btnNextSvg}><use href="/icon/sprite.svg#icon-next" /></svg>
              </button>
              <button type="button" className={`${styles.player__btnRepeat} ${styles.btnIcon} ${isRepeat ? styles.controlActive : ''}`} onClick={() => setIsRepeat((value) => !value)} aria-label="Повтор трека" aria-pressed={isRepeat}>
                <svg className={styles.player__btnRepeatSvg}><use href="/icon/sprite.svg#icon-repeat" /></svg>
              </button>
              <button type="button" className={`${styles.player__btnShuffle} ${styles.btnIcon} ${isShuffle ? styles.controlActive : ''}`} onClick={toggleShuffle} aria-label="Случайный порядок" aria-pressed={isShuffle}>
                <svg className={styles.player__btnShuffleSvg}><use href="/icon/sprite.svg#icon-shuffle" /></svg>
              </button>
            </div>

            <div className={styles.player__trackPlay}>
              <div className={styles.trackPlay__contain}>
                <div className={styles.trackPlay__image} aria-hidden="true">
                  <svg className={styles.trackPlay__svg}><use href="/icon/sprite.svg#icon-note" /></svg>
                </div>
                <div className={styles.trackPlay__author}>
                  <span className={styles.trackPlay__authorLink}>{currentTrack?.name ?? 'Выберите трек'}</span>
                </div>
                <div className={styles.trackPlay__album}>
                  <span className={styles.trackPlay__albumLink} title={currentTrack?.album ?? ''}>{currentTrack?.author ?? 'Skypro.Music'}</span>
                </div>
              </div>
              <div className={styles.trackPlay__dislike}>
                <button type="button" className={`${styles.player__btnShuffle} ${styles.btnIcon}`} aria-label="Добавить в избранное">
                  <svg className={styles.trackPlay__likeSvg}><use href="/icon/sprite.svg#icon-like" /></svg>
                </button>
                <button type="button" className={`${styles.trackPlay__dislike} ${styles.btnIcon}`} aria-label="Не нравится">
                  <svg className={styles.trackPlay__dislikeSvg}><use href="/icon/sprite.svg#icon-dislike" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.bar__volumeBlock}>
            <div className={styles.volume__content}>
              <div className={styles.volume__image}>
                <svg className={styles.volume__svg} aria-hidden="true"><use href="/icon/sprite.svg#icon-volume" /></svg>
              </div>
              <div className={styles.volume__progress}>
                <input
                  className={styles.volume__progressLine}
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="Громкость"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.player__time} aria-live="off">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

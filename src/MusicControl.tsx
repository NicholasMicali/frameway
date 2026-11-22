import { useEffect, useRef } from 'react';
import { createMusicPlayer } from './music-player';
import { musicURL } from './music';
import './music.css';
export function MusicControl({ volume }: { volume: number }) {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (host.current) return createMusicPlayer(host.current, musicURL, volume);
  }, [volume]);
  return <span className="music-control" ref={host} />;
}

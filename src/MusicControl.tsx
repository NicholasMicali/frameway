import { useEffect, useRef } from 'react';
import { createMusicPlayer } from './music-player';
import { musicURL, trackCredit } from './music';
import type { Project } from './model';
import './music.css';
export function MusicControl({ project }: { project: Project }) {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const upload = project.music?.track === 'upload' && project.musicAudio;
    const src = upload ? URL.createObjectURL(upload) : musicURL(project.music);
    const dispose = host.current
      ? createMusicPlayer(host.current, src, project.music!.volume, trackCredit(project.music))
      : undefined;
    return () => {
      dispose?.();
      if (upload) URL.revokeObjectURL(src);
    };
  }, [project.music, project.musicAudio]);
  return <span className="music-control" ref={host} />;
}

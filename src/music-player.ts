// Self-contained: the standalone exporter embeds this function alongside its player.
export function createMusicPlayer(container: HTMLElement, src: string, volume: number) {
  const audio = document.createElement('audio');
  audio.src = src;
  audio.loop = true;
  audio.volume = volume;
  audio.preload = 'none';
  audio.className = 'walkthrough-music';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  let wanted = true,
    disposed = false,
    pending = false,
    failed = false;
  const update = () => {
    const playing = wanted && !audio.paused && !audio.muted && !pending;
    const label = failed
      ? 'Retry background music'
      : playing
        ? 'Mute background music'
        : wanted
          ? 'Play background music'
          : 'Unmute background music';
    button.setAttribute('aria-label', label);
    button.title = failed ? 'Music could not play. Click to retry.' : label;
    button.setAttribute('aria-pressed', String(playing));
    button.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-3 0h6"/>${playing ? '' : '<path d="m3 3 18 18"/>'}</svg>`;
  };
  const start = async () => {
    if (disposed || pending || !wanted || document.hidden) return;
    pending = true;
    if (failed) audio.load();
    audio.muted = false;
    try {
      await audio.play();
      failed = false;
      if (disposed || document.hidden) audio.pause();
      if (!wanted) audio.muted = true;
    } catch (error) {
      failed = !(error instanceof DOMException && error.name === 'NotAllowedError');
    } finally {
      pending = false;
      if (!disposed) update();
    }
  };
  button.onclick = () => {
    if (wanted && !audio.paused && !audio.muted && !pending) {
      wanted = false;
      audio.muted = true;
      update();
    } else {
      wanted = true;
      audio.muted = false;
      void start();
    }
  };
  const interact = (event: Event) => {
    if (!button.contains(event.target as Node)) void start();
  };
  const visibility = () => {
    if (document.hidden) audio.pause();
    else if (wanted) void start();
    update();
  };
  const error = () => {
    failed = true;
    update();
  };
  audio.addEventListener('error', error);
  document.addEventListener('click', interact);
  document.addEventListener('keydown', interact);
  document.addEventListener('visibilitychange', visibility);
  container.append(audio, button);
  update();
  void start();
  return () => {
    disposed = true;
    document.removeEventListener('click', interact);
    document.removeEventListener('keydown', interact);
    document.removeEventListener('visibilitychange', visibility);
    audio.removeEventListener('error', error);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.remove();
    button.remove();
  };
}

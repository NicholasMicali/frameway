export type Music = { track: 'exploration-theme'; enabled: boolean; volume: number };
export const defaultMusic: Music = { track: 'exploration-theme', enabled: true, volume: 0.2 };
export const musicURL = './audio/exploration-theme.ogg';
export const musicCredit =
  'Exploration Theme by Cleyton Kauffman · CC0 1.0 · https://opengameart.org/content/exploration-theme';
export function validateMusic(value: unknown): asserts value is Music | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid music settings');
  const m = value as Record<string, unknown>;
  if (
    m.track !== 'exploration-theme' ||
    typeof m.enabled !== 'boolean' ||
    typeof m.volume !== 'number' ||
    !Number.isFinite(m.volume) ||
    m.volume < 0 ||
    m.volume > 1 ||
    Object.keys(m).some((k) => !['track', 'enabled', 'volume'].includes(k))
  )
    throw Error('Invalid music settings');
}
let cached: Promise<Blob> | undefined;
export function loadMusic() {
  return (cached ??= fetch(musicURL)
    .then(async (response) => {
      if (!response.ok)
        throw Error('Could not load the bundled soundtrack. Reload Frameway and try again.');
      return new Blob([await response.arrayBuffer()], { type: 'audio/ogg' });
    })
    .catch((error) => {
      cached = undefined;
      throw error;
    }));
}

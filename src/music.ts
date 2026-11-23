export const bundledMusic = {
  'exploration-theme': {
    name: 'Exploration',
    title: 'Exploration Theme',
    artist: 'Cleyton Kauffman',
    file: 'exploration-theme.ogg',
    mimeType: 'audio/ogg',
    source: 'https://opengameart.org/content/exploration-theme',
    license: 'CC0 1.0',
    licenseURL: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  daylight: {
    name: 'Daylight',
    title: 'Soft Corporate',
    artist: 'MusicLFiles',
    file: 'daylight.ogg',
    mimeType: 'audio/ogg',
    source: 'https://commons.wikimedia.org/wiki/File:Soft_Corporate_by_MusicLFiles.ogg',
    license: 'CC BY 4.0',
    licenseURL: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'lofi-focus': {
    name: 'Lo-fi Focus',
    title: 'Chill lofi inspired',
    artist: 'omfgdude',
    file: 'lofi-focus.mp3',
    mimeType: 'audio/mpeg',
    source: 'https://opengameart.org/content/chill-lofi-inspired',
    license: 'CC0 1.0',
    licenseURL: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  sunrise: {
    name: 'Sunrise',
    title: 'Adding the Sun',
    artist: 'Kevin MacLeod (incompetech.com)',
    file: 'sunrise.mp3',
    mimeType: 'audio/mpeg',
    source: 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900041',
    license: 'CC BY 4.0',
    licenseURL: 'https://creativecommons.org/licenses/by/4.0/',
  },
} as const;
export type BundledTrack = keyof typeof bundledMusic;
export function builtInTrack(music?: Music) {
  return music?.track === 'upload' ? undefined : bundledMusic[music?.track ?? 'exploration-theme'];
}
export function musicURL(music?: Music) {
  const track = builtInTrack(music);
  return track ? `./audio/${track.file}` : '';
}
export type Music = { enabled: boolean; volume: number } & (
  | { track: BundledTrack }
  | { track: 'upload'; name: string; mimeType: string; duration: number; id: string }
);
export const maxMusicBytes = 20 * 1024 * 1024;
export const musicTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
export async function prepareMusic(file: File): Promise<{ music: Music; audio: Blob }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeType = (
    { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' } as Record<string, string>
  )[ext ?? ''];
  if (!mimeType) throw Error('Choose an MP3, WAV, or OGG audio file.');
  if (!file.size || file.size > maxMusicBytes)
    throw Error('Choose an audio file smaller than 20 MB.');
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 600)
      throw Error('Choose a track no longer than 10 minutes.');
    return {
      music: {
        track: 'upload',
        enabled: true,
        volume: 0.2,
        name: file.name.slice(0, 255),
        mimeType,
        duration: buffer.duration,
        id: crypto.randomUUID(),
      },
      audio: new Blob([file], { type: mimeType }),
    };
  } catch (error) {
    if (error instanceof DOMException)
      throw Error('This audio file could not be decoded. Try another MP3, WAV, or OGG file.');
    throw error;
  } finally {
    await context.close();
  }
}
export function musicExtension(music?: Music) {
  return music?.track === 'upload'
    ? ({ 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg' }[music.mimeType] ?? 'ogg')
    : builtInTrack(music)!.file.split('.').pop()!;
}
export function trackCredit(music?: Music) {
  if (music?.track === 'upload') return `Uploaded audio: ${music.name}`;
  const track = builtInTrack(music)!;
  return `${track.title} — ${track.artist}\n${track.source}\n${track.license} · ${track.licenseURL}\nOriginal audio bundled unchanged; playback may loop, adjust volume, and use fades in video exports.`;
}

export const defaultMusic: Music = { track: 'exploration-theme', enabled: true, volume: 0.2 };
export function validateMusic(value: unknown): asserts value is Music | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid music settings');
  const m = value as Record<string, unknown>;
  if (
    !(m.track === 'upload' || Object.hasOwn(bundledMusic, m.track as string)) ||
    typeof m.enabled !== 'boolean' ||
    typeof m.volume !== 'number' ||
    !Number.isFinite(m.volume) ||
    m.volume < 0 ||
    m.volume > 1 ||
    Object.keys(m).some(
      (k) =>
        !(
          m.track === 'upload'
            ? ['track', 'enabled', 'volume', 'name', 'mimeType', 'duration', 'id']
            : ['track', 'enabled', 'volume']
        ).includes(k),
    )
  )
    throw Error('Invalid music settings');
  if (
    m.track === 'upload' &&
    (typeof m.name !== 'string' ||
      !m.name ||
      m.name.length > 255 ||
      typeof m.id !== 'string' ||
      !m.id ||
      m.id.length > 100 ||
      !musicTypes.includes(m.mimeType as string) ||
      typeof m.duration !== 'number' ||
      !Number.isFinite(m.duration) ||
      m.duration <= 0 ||
      m.duration > 600)
  )
    throw Error('Invalid uploaded music settings');
}
const cached = new Map<string, Promise<Blob>>();
export function loadMusic(project?: { music?: Music; musicAudio?: Blob }): Promise<Blob> {
  if (project?.music?.track === 'upload') {
    const audio = project.musicAudio;
    if (
      !(audio instanceof Blob) ||
      !audio.size ||
      audio.size > maxMusicBytes ||
      audio.type !== project.music.mimeType
    )
      return Promise.reject(
        Error(
          'Uploaded music is missing or invalid. Choose the audio file again in project settings.',
        ),
      );
    return Promise.resolve(audio);
  }
  const track = builtInTrack(project?.music)!;
  const url = musicURL(project?.music);
  if (cached.has(url)) return cached.get(url)!;
  const pending = fetch(url)
    .then(async (response) => {
      if (!response.ok)
        throw Error('Could not load the bundled soundtrack. Reload Frameway and try again.');
      return new Blob([await response.arrayBuffer()], { type: track.mimeType });
    })
    .catch((error) => {
      cached.delete(url);
      throw error;
    });
  cached.set(url, pending);
  return pending;
}

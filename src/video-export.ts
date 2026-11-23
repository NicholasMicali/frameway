import { ensureFont } from './fonts';
import { walkthroughStyle } from './appearance';
import { loadMusic, builtInTrack } from './music';
import { presentationFrame } from './presentation-frame';
import { layoutVideoText } from './video-text';
import { type Project, type Step, clamp, validateManifest, nextId } from './model';
import { themeVars } from './themes';
import { areaZoom } from './area-zoom';
import fixWebmDuration from 'fix-webm-duration';

export type VideoOptions = { seconds: number; durations: Record<string, number>; width: number };
export function videoPlan(project: Project, options: VideoOptions) {
  if (![1280, 1920].includes(options.width)) throw Error('Choose a supported resolution.');
  return project.steps.map((step) => {
    const seconds =
      step.kind === 'video'
        ? step.clipEnd - step.clipStart
        : (options.durations[step.id] ?? options.seconds);
    if (
      !Number.isFinite(seconds) ||
      seconds <= 0 ||
      (step.kind !== 'video' && (seconds < 1 || seconds > 60))
    )
      throw Error('Slide durations must be between 1 and 60 seconds.');
    return { step, seconds };
  });
}
export function videoFormat(withAudio = false) {
  if (typeof MediaRecorder === 'undefined')
    throw Error('Video export requires a browser with MediaRecorder, such as Chrome.');
  const mime = [
    withAudio ? 'video/mp4;codecs=avc1.420028,mp4a.40.2' : 'video/mp4;codecs=avc1.420028',
    'video/mp4',
    withAudio ? 'video/webm;codecs=vp9,opus' : 'video/webm;codecs=vp9',
    withAudio ? 'video/webm;codecs=vp8,opus' : 'video/webm;codecs=vp8',
  ].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) throw Error('This browser cannot encode MP4 or WebM video. Try current Chrome.');
  return { mime, extension: mime.startsWith('video/mp4') ? 'mp4' : 'webm' };
}
const abortError = () => new DOMException('Video export cancelled.', 'AbortError');
function waitForMedia(
  media: HTMLMediaElement,
  event: string,
  signal: AbortSignal,
  action: () => void,
) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(Error('The recorded video could not be decoded.'));
    };
    const abort = () => {
      cleanup();
      reject(abortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(Error('Timed out loading the recording.'));
    }, 15000);
    const cleanup = () => {
      clearTimeout(timer);
      media.removeEventListener(event, done);
      media.removeEventListener('error', fail);
      signal.removeEventListener('abort', abort);
    };
    media.addEventListener(event, done, { once: true });
    media.addEventListener('error', fail, { once: true });
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else action();
  });
}

// A bounded canvas compositor: no uploads, remote fonts, media URLs, or screen-capture permission.
export async function exportVideo(
  project: Project,
  options: VideoOptions,
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  progress: (value: { fraction: number; slide: number; total: number }) => void,
) {
  validateManifest(project);
  await ensureFont(project.appearance?.font);
  const plan = videoPlan(project, options),
    format = videoFormat(!!project.music?.enabled);
  const total = plan.reduce((sum, item) => sum + item.seconds, 0);
  if (total > 1800)
    throw Error(
      'This prototype supports videos up to 30 minutes. Shorten slide durations or export a shorter project.',
    );
  const width = Math.min(
    options.width,
    (((options.width * 9) / 16) * project.width) / project.height,
  );
  canvas.width = Math.floor(width / 2) * 2;
  canvas.height = Math.max(2, Math.floor((canvas.width * project.height) / project.width / 2) * 2);
  const ctx = canvas.getContext('2d')!;
  const w = 1280,
    h = (canvas.height / canvas.width) * w;
  const theme = themeVars(project.theme, project.customColor),
    a = project.appearance ?? {};
  const style = walkthroughStyle(a);
  const accent = theme['--accent'],
    ink = style.cardText;
  const family = style.fontFamily;
  const font = (size: number, weight = '400') => {
    ctx.font = `${weight} ${size}px ${family}`;
  };
  function box(x: number, y: number, bw: number, bh: number, color: string, radius = 10) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, radius);
    ctx.fill();
  }
  function lines(value: string, max: number, size: number, weight = '400') {
    font(size, weight);
    const result: string[] = [];
    for (const paragraph of value.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (ctx.measureText(line + word).width > max && line) {
          result.push(line.trimEnd());
          line = '';
        }
        for (const char of word) {
          if (ctx.measureText(line + char).width > max && line) {
            result.push(line);
            line = '';
          }
          line += char;
        }
        line += ' ';
      }
      result.push(line.trimEnd());
    }
    return result;
  }
  function text(
    value: string,
    x: number,
    y: number,
    max: number,
    size: number,
    color: string,
    weight = '400',
    center = false,
  ) {
    const rows = lines(value, max, size, weight);
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    rows.forEach((line, i) =>
      ctx.fillText(
        line,
        center ? x + (max - ctx.measureText(line).width) / 2 : x,
        y + i * size * 1.4,
      ),
    );
    return rows.length * size * 1.4;
  }
  const radius = style.buttonRadius;
  function button(label: string, x: number, y: number, max: number, size = 18) {
    font(size, '650');
    const bw = Math.min(max, ctx.measureText(label).width + 36);
    box(x, y, bw, 44, accent, Math.min(radius, 22, bw / 2));
    text(label, x + 18, y + 10, Math.max(1, bw - 36), size, theme['--accent-text'], '650');
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function entrance(t: number, draw: () => void) {
    ctx.save();
    const n = reduced ? 1 : clamp(t / 0.32);
    ctx.globalAlpha = n;
    ctx.translate(0, 8 * (1 - n));
    draw();
    ctx.restore();
  }
  function card(
    title: string,
    body: string,
    x: number,
    y: number,
    bw: number,
    color: string,
    t: number,
    primary = false,
    label?: string,
    continueLabel = 'Continue →',
  ) {
    const size = primary ? style.bodySize : 14;
    const rows = layoutVideoText(
      body,
      bw - 40,
      (value, weight) => {
        font(size, weight);
        return ctx.measureText(value).width;
      },
      primary,
    );
    const headingSize = primary ? style.headingSize : 16;
    const titleHeight = lines(title, bw - 40, headingSize, '700').length * headingSize * 1.4;
    const bh =
      40 +
      titleHeight +
      rows.reduce((height, row) => height + size * (1.5 + row.gapAfter), 0) +
      (primary ? 64 : 0) +
      (label ? 44 : 0);
    if (bh > h - 16)
      throw Error(
        `“${title}” is too tall for video export. Shorten its text or increase the card width.`,
      );
    x = clamp(x, 8, w - bw - 8);
    y = clamp(y, 8, h - bh - 8);
    entrance(t, () => {
      ctx.save();
      ctx.shadowColor = '#17202e30';
      ctx.shadowBlur = 18;
      box(x, y, bw, bh, a.cardBackground ?? '#ffffff');
      ctx.restore();
      box(x, y, bw, 4, color, 2);
      text(title, x + 20, y + 18, bw - 40, headingSize, ink, '700');
      let yy = y + 24 + titleHeight;
      for (const row of rows) {
        let xx = x + 20 + row.indent;
        for (const token of row.runs) {
          font(size, token.weight);
          ctx.fillStyle = ink;
          ctx.fillText(token.text, xx, yy);
          xx += ctx.measureText(token.text).width;
        }
        yy += size * (1.5 + row.gapAfter);
      }
      if (label) {
        text(`${label} ↗`, x + 20, yy + 10, bw - 40, size, ink, '600');
        yy += 44;
      }
      if (primary) button(continueLabel, x + 20, yy + 10, bw - 40, size);
    });
  }
  const urls: string[] = [];
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  let image: ImageBitmap | undefined, logo: HTMLImageElement | undefined;
  let stream: MediaStream | undefined, recorder: MediaRecorder | undefined;
  let musicContext: AudioContext | undefined, musicSource: AudioBufferSourceNode | undefined;
  let musicDestination: MediaStreamAudioDestinationNode | undefined;
  const chunks: Blob[] = [];
  let bytes = 0,
    recordingError: Error | undefined;
  const abortHidden = () => {
    if (document.hidden)
      recordingError = Error(
        'Export stopped because the tab was hidden. Keep Frameway visible while rendering, then try again.',
      );
  };
  document.addEventListener('visibilitychange', abortHidden);
  abortHidden();
  try {
    if (signal.aborted) throw abortError();
    if (recordingError) throw recordingError;
    if (project.music?.enabled) {
      musicContext = new AudioContext();
      await musicContext.resume();
      await musicContext.suspend();
      const audio = await loadMusic(project);
      if (signal.aborted) throw abortError();
      const buffer = await musicContext.decodeAudioData(await audio.arrayBuffer());
      if (signal.aborted) throw abortError();
      musicSource = musicContext.createBufferSource();
      musicSource.buffer = buffer;
      musicSource.loop = true;
      const gain = musicContext.createGain();
      const start = musicContext.currentTime,
        fade = Math.min(1, total / 3);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(project.music.volume, start + fade);
      gain.gain.setValueAtTime(project.music.volume, start + total - fade);
      gain.gain.linearRampToValueAtTime(0, start + total);
      musicDestination = musicContext.createMediaStreamDestination();
      musicSource.connect(gain).connect(musicDestination);
      musicSource.start();
    }
    if (project.logo) {
      logo = new Image();
      logo.src = project.logo;
      await logo.decode();
    }
    if (plan.some(({ step }) => step.kind === 'video')) {
      const url = URL.createObjectURL(project.video);
      urls.push(url);
      await waitForMedia(video, 'loadeddata', signal, () => {
        video.src = url;
        video.load();
      });
    }
    stream = canvas.captureStream(30);
    musicDestination?.stream.getAudioTracks().forEach((track) => stream!.addTrack(track));
    recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: 6_000_000 });
    recorder.ondataavailable = (e) => {
      if (e.data.size) {
        chunks.push(e.data);
        bytes += e.data.size;
        if (bytes > 512 * 1024 * 1024)
          recordingError = Error(
            'Video reached the 512 MB prototype limit. Try a shorter project or 720p.',
          );
      }
    };
    recorder.onerror = () => {
      recordingError = Error(
        'The browser video encoder failed. Try a shorter video or lower resolution.',
      );
    };
    const stopped = new Promise<void>((resolve) =>
      recorder!.addEventListener('stop', () => resolve(), { once: true }),
    );
    let elapsed = 0;
    for (let index = 0; index < plan.length; index++) {
      const { step: s, seconds } = plan[index];
      if (signal.aborted) throw abortError();
      if (recorder.state === 'recording') recorder.pause();
      if (musicContext?.state === 'running') await musicContext.suspend();
      image?.close();
      image = await createImageBitmap(s.image);
      if (s.kind === 'video') {
        if (Math.abs(video.currentTime - s.clipStart) > 0.001)
          await waitForMedia(video, 'seeked', signal, () => {
            video.currentTime = s.clipStart;
          });
      }
      const drawContent = (t: number) => {
        ctx.globalAlpha = 1;
        ctx.textBaseline = 'top';
        ctx.clearRect(0, 0, w, h);
        box(0, 0, w, h, '#ffffff', 0);
        if (s.kind === 'video') {
          ctx.drawImage(video, 0, 0, w, h);
          return;
        }
        if (s.kind === 'title' || s.kind === 'closing') {
          const center = s.kind === 'closing' || a.titleLayout === 'centered';
          const gradient = ctx.createLinearGradient(0, 0, w, h);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(1, theme['--accent-soft']);
          ctx.fillStyle = a.titleBackground ?? gradient;
          ctx.fillRect(0, 0, w, h);
          if (!center) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(w * 0.5, h * 0.2, w, h, 18);
            ctx.clip();
            ctx.drawImage(image!, w * 0.5, h * 0.2, w, h);
            ctx.restore();
          }
          const bw = center ? w * 0.68 : w * 0.35,
            x = center ? (w - bw) / 2 : w * 0.09;
          const titleSize = 48,
            bodySize = 25;
          const logoH = logo ? ((a.logoSize ?? 5) / 100) * w : 0;
          const titleH = lines(s.title, bw, titleSize, '750').length * titleSize * 1.4;
          const bodyH = lines(s.body, bw, bodySize).length * bodySize * 1.4;
          const contentH = logoH + (logo ? 24 : 0) + titleH + bodyH + 120;
          if (contentH > h - 24)
            throw Error(
              `“${s.title}” is too tall for video export. Shorten its title or description.`,
            );
          entrance(t, () => {
            let y = center ? (h - contentH) / 2 : logo ? h * 0.1 : h * 0.18;
            y = Math.min(y, h - contentH - 12);
            if (logo) {
              const lw = Math.min(bw, (logoH * logo.naturalWidth) / logo.naturalHeight);
              const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
              const align = a.logoAlignment ?? 'left';
              ctx.drawImage(
                logo,
                x + (align === 'right' ? bw - lw : align === 'center' ? (bw - lw) / 2 : 0),
                y,
                lw,
                lh,
              );
              y += logoH + 24;
            }
            y += text(s.title, x, y, bw, titleSize, a.titleText ?? '#17202e', '750', center) + 28;
            y += text(s.body, x, y, bw, bodySize, a.titleText ?? '#334155', '400', center) + 28;
            const label = s.kind === 'closing' ? 'Replay walkthrough' : s.buttonText;
            font(18, '650');
            const buttonW = Math.min(bw, ctx.measureText(label).width + 36);
            button(label, center ? x + (bw - buttonW) / 2 : x, y, bw);
          });
          return;
        }
        const z = areaZoom(s),
          enter = reduced ? 1 : 1 - Math.pow(1 - clamp(t / 0.65), 3),
          leave = reduced ? 1 : clamp((seconds - t) / 0.65),
          zoom = enter * leave;
        const scale = 1 + (z.scale - 1) * zoom,
          tx = z.tx * zoom,
          ty = z.ty * zoom;
        ctx.save();
        ctx.translate(tx * w, ty * h);
        ctx.scale(scale, scale);
        ctx.drawImage(image!, 0, 0, w, h);
        ctx.restore();
        const px = (s.x * scale + tx) * w,
          py = (s.y * scale + ty) * h;
        if (s.style === 'area') {
          const aw = (s.areaWidth ?? 0.25) * w * scale,
            ah = (s.areaHeight ?? 0.2) * h * scale;
          const ax = (z.x * scale + tx) * w - aw / 2,
            ay = (z.y * scale + ty) * h - ah / 2;
          ctx.fillStyle = '#07112088';
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.roundRect(ax, ay, aw, ah, 8);
          ctx.fill('evenodd');
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.strokeRect(ax, ay, aw, ah);
        } else if (s.style === 'hotspot') {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fill();
          const pulse = reduced ? 0 : (t % 1.8) / 1.8;
          ctx.save();
          ctx.globalAlpha = 0.65 * (1 - pulse);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 14 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        for (const e of s.elements ?? []) {
          const ex = (e.x * scale + tx) * w,
            ey = (e.y * scale + ty) * h;
          if (e.kind === 'arrow') {
            const endX = (e.endX * scale + tx) * w,
              endY = (e.endY * scale + ty) * h,
              angle = Math.atan2(endY - ey, endX - ex);
            ctx.save();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.setLineDash([1, 10]);
            ctx.lineDashOffset = reduced ? 0 : (-t * 11) / 0.9;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(endX - 15 * Math.cos(angle - 0.5), endY - 15 * Math.sin(angle - 0.5));
            ctx.lineTo(endX, endY);
            ctx.lineTo(endX - 15 * Math.cos(angle + 0.5), endY - 15 * Math.sin(angle + 0.5));
            ctx.stroke();
            ctx.restore();
          } else {
            const label = { card: '', tip: '✧ ', warning: '! ', info: 'i ' }[e.variant];
            card(
              label + e.title,
              e.body,
              ex,
              ey,
              e.width * w,
              { card: accent, tip: '#087b70', warning: '#a85d00', info: '#2264c5' }[e.variant],
              t,
            );
          }
        }
        card(
          s.title,
          s.body,
          s.cardX * w,
          s.cardY * h,
          (s.cardWidth ?? 0.32) * w,
          accent,
          t,
          true,
          s.actionUrl ? s.actionLabel || 'Learn more' : undefined,
          nextId(project, s) ? 'Continue →' : 'Replay →',
        );
      };
      const drawStage = (t: number) => {
        ctx.setTransform(canvas.width / w, 0, 0, canvas.width / w, 0, 0);
        const frame = presentationFrame(a);
        if (!frame.enabled || s.kind === 'title' || s.kind === 'closing') {
          drawContent(t);
          return;
        }
        ctx.globalAlpha = 1;
        const background = ctx.createLinearGradient(0, 0, w, h);
        background.addColorStop(0, frame.background);
        background.addColorStop(1, frame.gradient ? frame.endColor : frame.background);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
        const insetX = w * frame.padding,
          insetY = h * frame.padding,
          scale = 1 - 2 * frame.padding;
        ctx.save();
        if (frame.shadow) {
          ctx.shadowColor = '#17253626';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;
        }
        box(insetX, insetY, w * scale, h * scale, '#ffffff', frame.radius);
        ctx.restore();
        ctx.save();
        try {
          ctx.beginPath();
          ctx.roundRect(insetX, insetY, w * scale, h * scale, frame.radius);
          ctx.clip();
          ctx.translate(insetX, insetY);
          ctx.scale(scale, scale);
          drawContent(t);
        } finally {
          ctx.restore();
        }
      };
      const draw = (t: number) => {
        drawStage(t);
        const track = builtInTrack(project.music);
        if (project.music?.enabled && track?.license === 'CC BY 4.0' && elapsed + t >= total - 5) {
          ctx.save();
          ctx.setTransform(canvas.width / w, 0, 0, canvas.width / w, 0, 0);
          ctx.globalAlpha = 1;
          const lines = [
            `Music: ${track.title} — ${track.artist}`,
            track.source,
            `${track.license} · ${track.licenseURL}`,
            'Audio looped / excerpted, volume adjusted, and faded for this walkthrough.',
          ];
          ctx.fillStyle = '#ffffffee';
          ctx.fillRect(0, h - 96, w, 96);
          ctx.fillStyle = '#17202e';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          lines.forEach((line, i) => ctx.fillText(line, 18, h - 84 + i * 20, w - 36));
          ctx.restore();
        }
      };
      draw(0);
      if (recorder.state === 'inactive') recorder.start(1000);
      else recorder.resume();
      if (musicContext) await musicContext.resume();
      if (s.kind === 'video') await video.play();
      await new Promise<void>((resolve, reject) => {
        const start = performance.now();
        let frame = 0;
        const abort = () => {
          cancelAnimationFrame(frame);
          signal.removeEventListener('abort', abort);
          video.pause();
          reject(abortError());
        };
        signal.addEventListener('abort', abort, { once: true });
        const tick = () => {
          try {
            if (signal.aborted) {
              abort();
              return;
            }
            if (recordingError) throw recordingError;
            const t =
              s.kind === 'video'
                ? video.currentTime - s.clipStart
                : (performance.now() - start) / 1000;
            if (s.kind === 'video' && performance.now() - start > (seconds + 15) * 1000)
              throw Error('Video playback stalled during export. Please try again.');
            draw(Math.min(seconds, t));
            progress({
              fraction: Math.min(1, (elapsed + Math.min(seconds, t)) / total),
              slide: index + 1,
              total: plan.length,
            });
            if (
              t >= seconds - (s.kind === 'video' ? 0.015 : 0) ||
              (s.kind === 'video' && video.ended)
            ) {
              signal.removeEventListener('abort', abort);
              video.pause();
              resolve();
            } else frame = requestAnimationFrame(tick);
          } catch (error) {
            signal.removeEventListener('abort', abort);
            video.pause();
            reject(error);
          }
        };
        frame = requestAnimationFrame(tick);
      });
      elapsed += seconds;
    }
    recorder.stop();
    await stopped;
    if (recordingError) throw recordingError;
    if (signal.aborted) throw abortError();
    let blob = new Blob(chunks, { type: format.mime });
    if (!blob.size) throw Error('The browser did not produce video data.');
    if (format.extension === 'webm')
      blob = await fixWebmDuration(blob, total * 1000, { logger: false });
    progress({ fraction: 1, slide: plan.length, total: plan.length });
    return { blob, extension: format.extension };
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    musicSource?.stop();
    musicDestination?.stream.getTracks().forEach((track) => track.stop());
    if (musicContext && musicContext.state !== 'closed') await musicContext.close();
    video.pause();
    video.removeAttribute('src');
    video.load();
    stream?.getTracks().forEach((track) => track.stop());
    image?.close();
    urls.forEach(URL.revokeObjectURL);
    document.removeEventListener('visibilitychange', abortHidden);
  }
}

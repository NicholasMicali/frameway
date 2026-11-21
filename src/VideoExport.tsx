import { useEffect, useRef, useState } from 'react';
import type { Project } from './model';
import { exportVideo, videoFormat, videoPlan } from './video-export';
import { download } from './archive';
import { exportName } from './export-name';
import './video-export.css';

export function VideoExport({
  project,
  onBusy,
}: {
  project: Project;
  onBusy: (busy: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [seconds, setSeconds] = useState(5);
  const [width, setWidth] = useState(1280);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [fraction, setFraction] = useState(0);
  useEffect(() => () => controller.current?.abort(), []);
  let extension = '',
    duration = 0,
    validation = '';
  try {
    extension = videoFormat().extension.toUpperCase();
    duration = videoPlan(project, { seconds, durations, width }).reduce(
      (sum, entry) => sum + entry.seconds,
      0,
    );
  } catch (e) {
    validation = String((e as Error).message);
  }
  async function run() {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(true);
    onBusy(true);
    setError('');
    setFraction(0);
    setStatus('Preparing video…');
    try {
      const result = await exportVideo(
        project,
        { seconds, durations, width },
        canvas.current!,
        abort.signal,
        ({ fraction, slide, total }) => {
          setFraction(fraction);
          setStatus(`Rendering slide ${slide} of ${total} · ${Math.round(fraction * 100)}%`);
        },
      );
      if (abort.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      download(result.blob, `${exportName(project.title)}.${result.extension}`);
      setStatus('Video downloaded. Your editable project is unchanged.');
    } catch (e) {
      if (abort.signal.aborted) setStatus('Export cancelled. Your project is unchanged.');
      else {
        setError((e as Error).message);
        setStatus('');
      }
    } finally {
      controller.current = null;
      setRunning(false);
      onBusy(false);
    }
  }
  return (
    <section className="video-export">
      <p className="video-export-note">Silent · Slides in order · Cards expanded</p>
      <fieldset disabled={running}>
        <div className="video-export-options">
          <label>
            Slide duration (seconds)
            <input
              aria-label="Seconds per still slide"
              type="number"
              min="1"
              max="60"
              step="1"
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
            />
          </label>
          <label>
            Resolution
            <select
              aria-label="Video resolution"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            >
              <option value={1280}>720p</option>
              <option value={1920}>1080p</option>
            </select>
          </label>
        </div>
        <details>
          <summary>Timing per slide</summary>
          <div className="video-slide-durations">
            {project.steps.map((s, i) => (
              <label key={s.id}>
                <span>
                  {i + 1}. {s.title}
                </span>
                {s.kind === 'video' ? (
                  <small>{(s.clipEnd - s.clipStart).toFixed(1)}s clip</small>
                ) : (
                  <input
                    aria-label={`Seconds for slide ${i + 1}`}
                    type="number"
                    min="1"
                    max="60"
                    value={durations[s.id] ?? ''}
                    placeholder={String(seconds)}
                    onChange={(e) =>
                      setDurations((prev) => {
                        const next = { ...prev };
                        if (!e.target.value) delete next[s.id];
                        else next[s.id] = Number(e.target.value);
                        return next;
                      })
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </details>
        <p className="video-export-estimate">
          {extension} · {Math.floor(duration / 60)}:
          {String(Math.round(duration % 60)).padStart(2, '0')} video{' '}
          <span>Keep this tab visible while exporting.</span>
        </p>
        <button className="primary" disabled={!!validation} onClick={() => void run()}>
          Download video{extension ? ` (${extension})` : ''}
        </button>
      </fieldset>
      <canvas
        ref={canvas}
        className="video-export-preview"
        aria-label="Video export preview"
        hidden={!running && !fraction}
      />
      {running && (
        <>
          <progress aria-label="Video export progress" max={1} value={fraction} />
          <button
            onClick={() => {
              setStatus('Cancelling…');
              controller.current?.abort();
            }}
          >
            Cancel video export
          </button>
        </>
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
      {(error || validation) && (
        <p role="alert" className="export-error">
          {error || validation}
        </p>
      )}
    </section>
  );
}

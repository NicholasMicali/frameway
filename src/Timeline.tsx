import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import type { Step } from './model';
import { clamp } from './model';
type Props = {
  step: Step;
  duration: number;
  playhead: number;
  onPatch: (value: Partial<Step>) => void;
  onSeek: (time: number) => void;
  onBoundary: () => void;
};
export function ClipTimeline({ step, duration, playhead, onPatch, onSeek, onBoundary }: Props) {
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 600, left: 0 });
  useEffect(() => {
    const el = viewport.current!;
    const measure = () => setView({ width: el.clientWidth, left: el.scrollLeft });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  function centerAt(time: number, scale = zoom) {
    const el = viewport.current;
    if (el) el.scrollLeft = (time / duration) * el.clientWidth * scale - el.clientWidth / 2;
  }
  function zoomTo(value: number, anchor = playhead) {
    const next = clamp(value, 1, 4096);
    setZoom(next);
    requestAnimationFrame(() => centerAt(anchor, next));
  }
  const secondsPerTick = duration / zoom / Math.max(1, view.width / 90);
  const magnitude = 10 ** Math.floor(Math.log10(secondsPerTick));
  const tickSize = [1, 2, 5, 10].find((n) => n * magnitude >= secondsPerTick)! * magnitude;
  const firstTick = Math.max(
    0,
    Math.floor(((view.left / (view.width * zoom)) * duration) / tickSize),
  );
  const ticks = Array.from(
    { length: Math.ceil(view.width / 60) + 3 },
    (_, i) => (firstTick + i) * tickSize,
  ).filter((t) => t <= duration);
  function scrubAt(e: React.PointerEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    onSeek(clamp((e.clientX - box.left) / box.width) * duration);
  }
  function change(kind: 'start' | 'end', value: number) {
    onPatch(
      kind === 'start'
        ? { clipStart: clamp(value, 0, step.clipEnd - 0.05) }
        : { clipEnd: clamp(value, step.clipStart + 0.05, duration) },
    );
  }
  function handle(kind: 'start' | 'end') {
    const value = kind === 'start' ? step.clipStart : step.clipEnd;
    return (
      <button
        type="button"
        className={`trim-handle ${kind}`}
        role="slider"
        aria-label={kind === 'start' ? 'Trim start' : 'Trim end'}
        title="Arrow keys: 0.05s · Shift + arrows: 0.5s · Home/End: recording boundaries"
        aria-valuemin={kind === 'start' ? 0 : step.clipStart + 0.05}
        aria-valuemax={kind === 'start' ? step.clipEnd - 0.05 : duration}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)} seconds`}
        style={{ left: `${(value / duration) * 100}%` }}
        onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
        onPointerDown={(e) => {
          e.stopPropagation();
          onBoundary();
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const box = e.currentTarget.parentElement!.getBoundingClientRect();
          change(kind, ((e.clientX - box.left) / box.width) * duration);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          onBoundary();
        }}
        onPointerCancel={onBoundary}
        onKeyUp={(e) => {
          onBoundary();
          e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            change(
              kind,
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? duration
                  : value + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.5 : 0.05),
            );
          }
        }}
      >
        Ⅱ
      </button>
    );
  }
  return (
    <div className="visual-timeline">
      <div className="timeline-zoom">
        <span>Timeline zoom · {zoom.toFixed(zoom % 1 ? 1 : 0)}×</span>
        <button
          className="icon-button"
          aria-label="Zoom out timeline"
          title="Zoom out timeline"
          disabled={zoom === 1}
          onClick={() => zoomTo(Math.max(1, zoom / 2))}
        >
          <Icon name="minus" />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom in timeline"
          title="Zoom in timeline"
          disabled={zoom >= 4096}
          onClick={() => zoomTo(Math.min(4096, zoom * 2))}
        >
          <Icon name="plus" />
        </button>
        <button
          onClick={() =>
            zoomTo(
              duration / Math.max(0.05, step.clipEnd - step.clipStart) / 1.25,
              (step.clipStart + step.clipEnd) / 2,
            )
          }
        >
          Fit selected clip
        </button>
        <button onClick={() => centerAt(playhead)}>Show playhead</button>
        <button onClick={() => zoomTo(1)} disabled={zoom === 1}>
          Show full video
        </button>
      </div>
      <div className="clip-summary" aria-label="Clip timing">
        <span>
          Start <strong>{step.clipStart.toFixed(2)}s</strong>
        </span>
        <span>
          End <strong>{step.clipEnd.toFixed(2)}s</strong>
        </span>
        <span>
          Duration <strong>{(step.clipEnd - step.clipStart).toFixed(2)}s</strong>
        </span>
        <span>
          Playhead <strong>{playhead.toFixed(2)}s</strong>
        </span>
      </div>
      <div
        onScroll={(e) =>
          setView({ width: e.currentTarget.clientWidth, left: e.currentTarget.scrollLeft })
        }
        className="timeline-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label="Scrollable clip timeline"
      >
        <div className="timeline-content" style={{ width: `${zoom * 100}%` }}>
          <div className="time-ruler">
            {ticks.map((time) => (
              <span
                key={time}
                style={{
                  position: 'absolute',
                  left: `${(time / duration) * 100}%`,
                  transform: time === 0 ? undefined : 'translateX(-100%)',
                }}
              >
                {time.toFixed(tickSize < 1 ? 2 : 1)}s
              </span>
            ))}
          </div>
          <div
            className="clip-track"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrubAt(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) scrubAt(e);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            <div
              className="clip-range"
              style={{
                left: `${(step.clipStart / duration) * 100}%`,
                width: `${((step.clipEnd - step.clipStart) / duration) * 100}%`,
              }}
            />
            <span className="clip-range-label">
              Selected clip · {(step.clipEnd - step.clipStart).toFixed(2)}s
            </span>
            <div
              className="timeline-playhead"
              style={{ left: `${clamp(playhead / duration) * 100}%` }}
              aria-hidden="true"
            />
            {handle('start')}
            {handle('end')}
          </div>
        </div>
      </div>
      <p className="field-note">
        Zoom follows the playhead. Scroll horizontally or use Fit selected clip. Click or drag the
        track to seek. Drag either edge to trim. Arrow keys adjust by 0.05s; Shift + arrow adjusts
        by 0.5s.
      </p>
    </div>
  );
}

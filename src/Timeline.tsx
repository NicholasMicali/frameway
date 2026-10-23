import { useRef, useState } from 'react';
import { Icon } from './Icon';
import type { Step } from './model';
import { clamp } from './model';
type Props = {
  step: Step;
  duration: number;
  onPatch: (value: Partial<Step>) => void;
  onSeek: (time: number) => void;
  onBoundary: () => void;
};
export function ClipTimeline({ step, duration, onPatch, onSeek, onBoundary }: Props) {
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  function zoomTo(value: number) {
    const el = viewport.current;
    if (!el) return;
    const center = (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth;
    setZoom(value);
    requestAnimationFrame(() => {
      el.scrollLeft = center * el.scrollWidth - el.clientWidth / 2;
    });
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
        aria-valuemin={kind === 'start' ? 0 : step.clipStart + 0.05}
        aria-valuemax={kind === 'start' ? step.clipEnd - 0.05 : duration}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)} seconds`}
        style={{ left: `${(value / duration) * 100}%` }}
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
        <span>Timeline zoom · {zoom}×</span>
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
          disabled={zoom === 16}
          onClick={() => zoomTo(Math.min(16, zoom * 2))}
        >
          <Icon name="plus" />
        </button>
        <button onClick={() => zoomTo(1)} disabled={zoom === 1}>
          Show full video
        </button>
      </div>
      <div
        className="timeline-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label="Scrollable clip timeline"
      >
        <div className="timeline-content" style={{ width: `${zoom * 100}%` }}>
          <div className="time-ruler">
            <span>0s</span>
            {Array.from({ length: zoom * 2 - 1 }, (_, i) => (
              <span key={i}>{((duration * (i + 1)) / (zoom * 2)).toFixed(2)}s</span>
            ))}
            <span>{duration.toFixed(1)}s</span>
          </div>
          <div
            className="clip-track"
            onPointerDown={(e) => {
              if (e.target !== e.currentTarget) return;
              const box = e.currentTarget.getBoundingClientRect();
              onSeek(clamp((e.clientX - box.left) / box.width) * duration);
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
            {handle('start')}
            {handle('end')}
          </div>
        </div>
      </div>
      <p className="field-note">
        Zoom in and scroll horizontally for precise trimming. Drag either edge to trim. Arrow keys
        adjust by 0.05s; Shift + arrow adjusts by 0.5s.
      </p>
    </div>
  );
}

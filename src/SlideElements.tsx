import { useEffect, useRef, useState } from 'react';
import { renderElements, newElement, type SlideElement } from './slide-elements';
import { areaZoom } from './area-zoom';
import type { Step } from './model';
import './slide-elements.css';

export function SlideElements({
  step,
  preview,
  selected,
  onSelect,
  onChange,
  boundary,
  leaving,
}: {
  step: Step;
  preview: boolean;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (elements: SlideElement[]) => void;
  boundary: () => void;
  leaving: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState('');
  const latest = useRef({ step, onChange });
  latest.current = { step, onChange };
  const stopDrag = useRef<() => void>(() => {});
  useEffect(() => () => stopDrag.current(), []);
  useEffect(() => {
    const el = host.current!;
    const draw = () =>
      renderElements(el, step.elements ?? [], {
        editing: !preview,
        selected,
        open,
        zoom: preview ? areaZoom(step) : undefined,
        select: onSelect,
        toggle: setOpen,
      });
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [step, preview, selected, open, onSelect]);
  return (
    <div
      className="extra-layer"
      style={{ visibility: leaving ? 'hidden' : undefined }}
      tabIndex={preview ? -1 : 0}
      aria-label="Additional slide elements"
      data-editing={!preview}
      ref={host}
      onPointerDown={(event) => {
        if (preview) return;
        host.current?.focus({ preventScroll: true });
        const handle = (event.target as Element).closest<HTMLElement>('[data-handle]');
        if (!handle) return;
        const element = step.elements?.find((e) => e.id === handle.dataset.elementId);
        if (!element) return;
        event.preventDefault();
        onSelect(element.id);
        boundary();
        const box = host.current!.getBoundingClientRect(),
          sx = event.clientX,
          sy = event.clientY;
        const clamp = (n: number) => Math.max(0, Math.min(1, n));
        const move = (e: PointerEvent) => {
          let dx = (e.clientX - sx) / box.width,
            dy = (e.clientY - sy) / box.height;
          const patch: Partial<SlideElement> = {};
          if (handle.dataset.handle === 'end') {
            patch.endX = clamp(element.endX + dx);
            patch.endY = clamp(element.endY + dy);
          } else {
            if (element.kind === 'arrow' && handle.dataset.handle === 'move') {
              dx = Math.max(
                -Math.min(element.x, element.endX),
                Math.min(1 - Math.max(element.x, element.endX), dx),
              );
              dy = Math.max(
                -Math.min(element.y, element.endY),
                Math.min(1 - Math.max(element.y, element.endY), dy),
              );
              patch.endX = element.endX + dx;
              patch.endY = element.endY + dy;
            }
            patch.x = clamp(element.x + dx);
            patch.y = clamp(element.y + dy);
          }
          latest.current.onChange(
            (latest.current.step.elements ?? []).map((item) =>
              item.id === element.id ? { ...item, ...patch } : item,
            ),
          );
        };
        const end = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          window.removeEventListener('pointercancel', end);
          boundary();
        };
        stopDrag.current();
        stopDrag.current = end;
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
      }}
    />
  );
}
export function ElementTools({
  elements,
  selected,
  onSelect,
  onChange,
}: {
  elements: SlideElement[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (elements: SlideElement[]) => void;
}) {
  const active = elements.find((e) => e.id === selected);
  const patch = (p: Partial<SlideElement>) =>
    onChange(elements.map((e) => (e.id === selected ? { ...e, ...p } : e)));
  return (
    <div className="element-tools">
      <strong>Add element</strong>
      <div className="element-toolbar" role="group" aria-label="Add element">
        {(['arrow', 'card', 'tip', 'warning', 'info'] as const).map((type) => (
          <button
            key={type}
            disabled={elements.length >= 20}
            onClick={() => {
              const e = newElement(type);
              onChange([...elements, e]);
              onSelect(e.id);
            }}
          >
            <span aria-hidden="true">
              {{ arrow: '↗', card: '▤', tip: '✧', warning: '⚠', info: 'ⓘ' }[type]}
            </span>
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <div className="element-selection-heading">
        <strong>Edit settings</strong>
        <p className="field-note">Select the slide or an element.</p>
      </div>
      <div className="element-list" role="group" aria-label="Slide elements">
        <button aria-pressed={!active} onClick={() => onSelect('')}>
          Slide & navigation
        </button>
        {elements.map((e) => (
          <button key={e.id} aria-pressed={e.id === selected} onClick={() => onSelect(e.id)}>
            {e.kind === 'arrow' ? '↗' : { card: '▤', tip: '✧', warning: '⚠', info: 'ⓘ' }[e.variant]}{' '}
            {e.title || 'Untitled element'}
          </button>
        ))}
      </div>
      {active && (
        <fieldset className="settings-section element-inspector">
          <legend>
            {active.kind === 'arrow'
              ? 'Arrow'
              : `${active.variant[0].toUpperCase() + active.variant.slice(1)} card`}
          </legend>
          <label>
            Title
            <input
              aria-label="Element title"
              maxLength={200}
              value={active.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          {active.kind === 'card' && (
            <>
              <label>
                Description
                <textarea
                  aria-label="Element description"
                  maxLength={5000}
                  value={active.body}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </label>
              <label>
                Card width
                <input
                  aria-label="Element width"
                  type="range"
                  min="0.18"
                  max="0.6"
                  step="0.01"
                  value={active.width}
                  onChange={(e) => patch({ width: Number(e.target.value) })}
                />
              </label>
              <label className="toggle">
                <input
                  aria-label="Start collapsed"
                  type="checkbox"
                  checked={active.collapsed}
                  onChange={(e) => patch({ collapsed: e.target.checked })}
                />
                Start as an expandable icon
              </label>
            </>
          )}
          <p className="field-note">
            {active.kind === 'arrow'
              ? 'Drag either endpoint to aim the arrow.'
              : 'Drag the card heading to position it. Preview to try expanding it.'}
          </p>
          <div className="element-actions">
            <button
              onClick={() => {
                const copy = {
                  ...active,
                  id: crypto.randomUUID(),
                  title: `${active.title} (copy)`.slice(0, 200),
                  x: Math.min(0.8, active.x + 0.04),
                  y: Math.min(0.8, active.y + 0.04),
                };
                onChange([...elements, copy]);
                onSelect(copy.id);
              }}
              disabled={elements.length >= 20}
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                onChange(elements.filter((e) => e.id !== selected));
                onSelect('');
              }}
            >
              Delete element
            </button>
          </div>
          <p className="field-note">
            Delete or Backspace removes the selected element when you aren’t typing.
          </p>
        </fieldset>
      )}
    </div>
  );
}

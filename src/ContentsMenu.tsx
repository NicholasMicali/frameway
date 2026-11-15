import { useEffect, useRef } from 'react';
import type { Step } from './model';
import { chaptersFor } from './chapters';
import './contents.css';

export function ContentsMenu({
  steps,
  selected,
  locked,
  onJump,
}: {
  steps: Step[];
  selected: string;
  locked: boolean;
  onJump: (id: string) => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const chapters = chaptersFor(steps);
  const index = steps.findIndex((s) => s.id === selected);
  const current = chapters.filter((c) => c.index <= index).at(-1);
  const close = () => {
    menu.current?.removeAttribute('open');
    menu.current?.querySelector('summary')?.focus();
  };
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) menu.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  if (!chapters.length) return null;
  return (
    <details
      className="contents-menu"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          close();
        }
      }}
    >
      <summary aria-label="Walkthrough contents">
        Contents <span>{current?.title ?? 'Before first chapter'}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="contents-panel" role="group" aria-label="Chapters">
        <p role="status">
          {locked
            ? 'Chapter jumps are available when playback stops.'
            : `Current: ${current?.title ?? 'Before first chapter'}`}
        </p>
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            disabled={locked}
            aria-current={current?.id === chapter.id ? 'step' : undefined}
            onClick={() => {
              close();
              if (selected !== chapter.id) onJump(chapter.id);
            }}
          >
            <span>{chapter.title}</span>
            <small>Step {chapter.index + 1}</small>
          </button>
        ))}
      </div>
    </details>
  );
}

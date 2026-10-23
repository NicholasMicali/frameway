import { useEffect, useRef } from 'react';
import type { Project } from './model';
import { themes, type ThemeName } from './themes';
import { Icon } from './Icon';

export function ProjectSettings({
  project,
  onChange,
}: {
  project: Project;
  onChange: (p: Project, key?: string) => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) menu.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <details
      className="project-settings"
      ref={menu}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          menu.current?.removeAttribute('open');
          menu.current?.querySelector('summary')?.focus();
        }
      }}
    >
      <summary>
        <Icon name="settings" />
        <span>Project settings</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="project-settings-panel">
        <strong>Walkthrough appearance</strong>
        <label className="theme-picker">
          <span>Theme</span>
          <select
            aria-label="Color theme"
            value={project.theme ?? 'violet'}
            onChange={(e) => onChange({ ...project, theme: e.target.value as ThemeName })}
          >
            {Object.entries(themes).map(([id, theme]) => (
              <option key={id} value={id}>
                {theme.label}
              </option>
            ))}
            <option value="custom">Custom color…</option>
          </select>
        </label>
        {project.theme === 'custom' && (
          <label className="custom-color-picker">
            Accent
            <input
              aria-label="Custom theme color"
              type="color"
              value={project.customColor ?? '#2264c5'}
              onChange={(e) =>
                onChange({ ...project, customColor: e.target.value }, 'custom-color')
              }
            />
            <span>{project.customColor ?? '#2264c5'}</span>
          </label>
        )}
        <p>Applies to walkthrough cards, highlights, and title slides.</p>
      </div>
    </details>
  );
}

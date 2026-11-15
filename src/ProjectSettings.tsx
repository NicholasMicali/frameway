import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Project, Step } from './model';
import { themes, themeVars, type ThemeName } from './themes';
import { appearanceChoices, appearanceVars, contrastRatio, type Appearance } from './appearance';
import { TitleSlide } from './TitleSlide';
import { Icon } from './Icon';

export function ProjectSettings({
  project,
  onChange,
}: {
  project: Project;
  onChange: (p: Project, key?: string) => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [draft, setDraft] = useState(project);
  const [image, setImage] = useState('');
  const intro =
    draft.steps.find((s) => s.kind === 'title') ??
    ({ ...draft.steps[0], kind: 'title', title: draft.title, buttonText: 'Get started' } as Step);
  useEffect(() => {
    const url = URL.createObjectURL(intro.image);
    setImage(url);
    return () => URL.revokeObjectURL(url);
  }, [intro.image]);
  useEffect(() => {
    if (!menu.current?.open) setDraft(project);
  }, [project]);
  const close = () => {
    menu.current?.removeAttribute('open');
    menu.current?.querySelector('summary')?.focus();
  };
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) menu.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const a = draft.appearance ?? {};
  const set = (patch: Partial<Appearance>) =>
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, ...patch } }));
  const palette = themeVars(draft.theme, draft.customColor);
  const ratios = [
    ['Card text', contrastRatio(a.cardText ?? '#111111', a.cardBackground ?? '#ffffff')],
    [
      'Title text',
      Math.min(
        contrastRatio(a.titleText ?? '#334155', a.titleBackground ?? '#ffffff'),
        contrastRatio(a.titleText ?? '#334155', a.titleBackground ?? palette['--accent-soft']),
      ),
    ],
    ['Button text', contrastRatio(palette['--accent-text'], palette['--accent'])],
  ] as const;
  const snapshot = (p: Project) => JSON.stringify([p.theme, p.customColor, p.appearance]);
  return (
    <details
      className="project-settings"
      ref={menu}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
        }
      }}
    >
      <summary
        onClick={() => {
          if (!menu.current?.open) setDraft(project);
        }}
      >
        <Icon name="settings" />
        <span>Project settings</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="project-settings-panel appearance-panel">
        <div>
          <strong>Walkthrough appearance</strong>
          <p>Preview your changes below, then apply them to this project.</p>
        </div>
        <div
          className="appearance-preview"
          style={{ ...palette, ...appearanceVars(a) } as CSSProperties}
          aria-label="Appearance preview"
        >
          <div className="appearance-title">
            <TitleSlide step={intro} src={image} logo={draft.logo} appearance={a} />
          </div>
          <div className="appearance-card">
            <h3>A clear next step</h3>
            <p>Guide your viewer through the workflow.</p>
            <span className="appearance-button">Continue →</span>
          </div>
        </div>
        <fieldset>
          <legend>Colors</legend>
          <label className="theme-picker">
            <span>Accent theme</span>
            <select
              aria-label="Color theme"
              value={draft.theme ?? 'violet'}
              onChange={(e) => {
                const theme = e.target.value as ThemeName;
                setDraft((current) => ({ ...current, theme }));
              }}
            >
              {Object.entries(themes).map(([id, theme]) => (
                <option key={id} value={id}>
                  {theme.label}
                </option>
              ))}
              <option value="custom">Custom color…</option>
            </select>
          </label>
          {draft.theme === 'custom' && (
            <label className="appearance-color">
              Accent
              <input
                aria-label="Custom theme color"
                type="color"
                value={draft.customColor ?? '#2264c5'}
                onChange={(e) => {
                  const customColor = e.target.value;
                  setDraft((current) => ({ ...current, customColor }));
                }}
              />
              <span>{draft.customColor ?? '#2264c5'}</span>
            </label>
          )}
          {(
            [
              ['cardBackground', 'Card background', '#ffffff'],
              ['cardText', 'Card text', '#111111'],
              ['titleBackground', 'Title background', '#ffffff'],
              ['titleText', 'Title text', '#334155'],
            ] as const
          ).map(([key, label, fallback]) => (
            <label className="appearance-color" key={key}>
              {label}
              <input
                aria-label={label}
                type="color"
                value={a[key] ?? fallback}
                onChange={(e) => set({ [key]: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Reset ${label.toLowerCase()}`}
                disabled={a[key] === undefined}
                onClick={() => set({ [key]: undefined })}
              >
                Reset
              </button>
            </label>
          ))}
          <div className="contrast-feedback" role="status">
            {ratios.map(([label, ratio]) => (
              <p key={label} className={ratio < 4.5 ? 'contrast-warning' : ''}>
                {label}: {ratio.toFixed(1)}:1{' '}
                {ratio < 4.5
                  ? '— low contrast; consider changing these colors.'
                  : '— good text contrast.'}
              </p>
            ))}
            <p>Color feedback only; preview readability at your intended viewing size.</p>
          </div>
        </fieldset>
        <fieldset>
          <legend>Layout and type</legend>
          {Object.entries(appearanceChoices).map(([key, choices]) => (
            <label key={key}>
              {
                {
                  titleLayout: 'Title layout',
                  logoAlignment: 'Logo alignment',
                  typography: 'Card typography',
                  font: 'Font family',
                  buttonShape: 'Button shape',
                }[key as keyof typeof appearanceChoices]
              }
              <select
                aria-label={
                  {
                    titleLayout: 'Title layout',
                    logoAlignment: 'Logo alignment',
                    typography: 'Card typography',
                    font: 'Font family',
                    buttonShape: 'Button shape',
                  }[key as keyof typeof appearanceChoices]
                }
                value={a[key as keyof typeof appearanceChoices] ?? ''}
                onChange={(e) => set({ [key]: e.target.value || undefined })}
              >
                <option value="">Original styling</option>
                {Object.entries(choices).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Title logo size · {a.logoSize ?? 5}
            <input
              aria-label="Title logo size"
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={a.logoSize ?? 5}
              onChange={(e) => set({ logoSize: Number(e.target.value) })}
            />
          </label>
          <p>
            Logo size and alignment apply to title slides only. Upload your logo in the title
            slide’s Appearance section. Fonts use this device’s installed system fonts.
          </p>
        </fieldset>
        <div className="appearance-actions">
          <button
            onClick={() =>
              setDraft({ ...draft, appearance: undefined, theme: 'violet', customColor: undefined })
            }
          >
            Reset appearance
          </button>
          <button onClick={close}>Cancel</button>
          <button
            className="primary"
            onClick={() => {
              if (snapshot(draft) !== snapshot(project))
                onChange({
                  ...project,
                  appearance: draft.appearance,
                  theme: draft.theme,
                  customColor: draft.customColor,
                });
              close();
            }}
          >
            Apply appearance
          </button>
        </div>
      </div>
    </details>
  );
}

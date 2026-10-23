export const themes = {
  violet: {
    label: 'Violet',
    accent: '#7050c9',
    soft: '#f1ecfb',
    border: '#c9b9ed',
    ink: '#493477',
  },
  ocean: { label: 'Ocean', accent: '#2264c5', soft: '#eaf2ff', border: '#aecbf2', ink: '#193f78' },
  forest: {
    label: 'Forest',
    accent: '#23754e',
    soft: '#eaf6ef',
    border: '#add6bc',
    ink: '#184c33',
  },
  rose: { label: 'Rose', accent: '#b13d68', soft: '#fceef3', border: '#edb6c9', ink: '#772947' },
  amber: { label: 'Amber', accent: '#92600d', soft: '#fff5df', border: '#e8cc91', ink: '#634109' },
  slate: { label: 'Slate', accent: '#526175', soft: '#eef1f5', border: '#bdc7d4', ink: '#303d50' },
} as const;
export type ThemeName = keyof typeof themes | 'custom';
export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function themeVars(name: ThemeName = 'violet', customColor?: string) {
  const hex = isHexColor(customColor) ? customColor : '#2264c5';
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (target: number, amount: number) =>
    '#' +
    rgb
      .map((v) =>
        Math.round(v * (1 - amount) + target * amount)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  const luminance = rgb
    .map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const t =
    name === 'custom'
      ? { accent: hex, soft: mix(255, 0.92), border: mix(255, 0.65), ink: mix(0, 0.55) }
      : (themes[name] ?? themes.violet);
  return {
    '--accent': t.accent,
    '--accent-soft': t.soft,
    '--accent-border': t.border,
    '--accent-ink': t.ink,
    '--accent-text': name === 'custom' && luminance > 0.179 ? '#17202e' : '#ffffff',
  };
}

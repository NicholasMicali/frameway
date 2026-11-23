import { isHexColor } from './themes';

export type Appearance = {
  // Accepted for backups from the early animation prototype; playback uses one default.
  motion?: 'subtle' | 'fade' | 'none';
  frameStyle?: 'none' | 'soft' | 'gradient';
  framePadding?: number;
  frameCorners?: 'rounded' | 'square';
  frameShadow?: 'soft' | 'none';
  cardBackground?: string;
  cardText?: string;
  titleBackground?: string;
  titleText?: string;
  titleLayout?: 'split' | 'centered';
  logoSize?: number;
  logoAlignment?: 'left' | 'center' | 'right';
  typography?: 'compact' | 'comfortable' | 'large';
  font?: 'system' | 'serif' | 'rounded';
  buttonShape?: 'rounded' | 'square' | 'pill';
};
export const appearanceChoices = {
  motion: { subtle: 'Subtle rise', fade: 'Fade', none: 'None' },
  titleLayout: { split: 'Split with recording', centered: 'Centered introduction' },
  logoAlignment: { left: 'Left', center: 'Center', right: 'Right' },
  typography: { compact: 'Compact', comfortable: 'Comfortable', large: 'Large' },
  font: { system: 'System sans serif', serif: 'Serif', rounded: 'Rounded system' },
  buttonShape: { rounded: 'Rounded', square: 'Square', pill: 'Pill' },
} as const;
export const frameChoices = {
  frameStyle: { none: 'Off', soft: 'Soft', gradient: 'Gradient' },
  frameCorners: { rounded: 'Rounded', square: 'Square' },
  frameShadow: { soft: 'Soft', none: 'None' },
} as const;
export function validateAppearance(value: unknown): asserts value is Appearance | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid appearance');
  const a = value as Record<string, unknown>;
  const colors = ['cardBackground', 'cardText', 'titleBackground', 'titleText'];
  for (const [key, v] of Object.entries(a)) {
    if (v === undefined) continue;
    if (colors.includes(key)) {
      if (!isHexColor(v)) throw Error('Invalid appearance color');
    } else if (key === 'framePadding') {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 2 || v > 8)
        throw Error('Invalid frame spacing');
    } else if (Object.hasOwn(frameChoices, key)) {
      if (
        typeof v !== 'string' ||
        !Object.hasOwn(frameChoices[key as keyof typeof frameChoices], v)
      )
        throw Error('Invalid frame option');
    } else if (key === 'logoSize') {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 3 || v > 10)
        throw Error('Invalid logo size');
    } else if (Object.hasOwn(appearanceChoices, key)) {
      if (
        typeof v !== 'string' ||
        !Object.hasOwn(appearanceChoices[key as keyof typeof appearanceChoices], v)
      )
        throw Error('Invalid appearance option');
    } else throw Error('Unsupported appearance setting');
  }
}
export function appearanceVars(a: Appearance = {}) {
  const vars: Record<string, string> = {};
  const colorNames = {
    cardBackground: '--card-background',
    cardText: '--card-text',
    titleBackground: '--title-background',
    titleText: '--title-text',
  } as const;
  for (const [key, name] of Object.entries(colorNames)) {
    const value = a[key as keyof typeof colorNames];
    if (isHexColor(value)) vars[name] = value;
  }
  if (a.font)
    vars['--walkthrough-font'] = {
      system: 'system-ui, sans-serif',
      serif: 'Georgia, serif',
      rounded: 'ui-rounded, system-ui, sans-serif',
    }[a.font];
  if (a.typography) {
    const sizes = { compact: [12, 16], comfortable: [14, 19], large: [16, 22] }[a.typography];
    vars['--card-body-size'] = `${sizes[0]}px`;
    vars['--card-heading-size'] = `${sizes[1]}px`;
  }
  if (a.logoSize !== undefined) {
    vars['--logo-height'] = `${a.logoSize}cqw`;
    vars['--logo-max-height'] = `${a.logoSize * 14}px`;
  }
  if (a.logoAlignment) {
    vars['--logo-margin-left'] = a.logoAlignment === 'left' ? '0' : 'auto';
    vars['--logo-margin-right'] = a.logoAlignment === 'right' ? '0' : 'auto';
  }
  if (a.buttonShape)
    vars['--button-radius'] = { rounded: '10px', square: '3px', pill: '999px' }[a.buttonShape];
  return vars;
}
export function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) =>
    [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

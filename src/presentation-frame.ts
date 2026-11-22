import type { Appearance } from './appearance';

// Insets use the same fraction on both axes, preserving the capture aspect ratio.
export function presentationFrame(a: Appearance = {}) {
  return {
    enabled: a.frameStyle === 'soft' || a.frameStyle === 'gradient',
    padding: (a.framePadding ?? 4) / 100,
    gradient: a.frameStyle === 'gradient',
    background: '#edf3f8',
    endColor: '#dce7f7',
    radius: a.frameCorners === 'square' ? 0 : 12,
    shadow: a.frameShadow !== 'none',
  };
}
export function frameVars(a: Appearance | undefined, ratio: number) {
  const f = presentationFrame(a);
  return {
    '--frame-x': `${f.padding * 100}%`,
    '--frame-y': `${f.padding * 100 * ratio}%`,
    '--frame-background': f.gradient
      ? `linear-gradient(135deg, ${f.background}, ${f.endColor})`
      : f.background,
    '--frame-radius': `${f.radius}px`,
    '--frame-shadow': f.shadow ? '0 8px 24px #17253626' : 'none',
  };
}

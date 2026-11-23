export const bundledFonts = {
  manrope: { family: 'Manrope', label: 'Manrope · clean sans', weight: '200 800' },
  sourcesans3: { family: 'Source Sans 3', label: 'Source Sans 3 · humanist', weight: '200 900' },
  lora: { family: 'Lora', label: 'Lora · editorial serif', weight: '400 700' },
  robotomono: { family: 'Roboto Mono', label: 'Roboto Mono · monospace', weight: '100 700' },
} as const;
export type BundledFont = keyof typeof bundledFonts;
export function isBundledFont(font?: string): font is BundledFont {
  return !!font && Object.hasOwn(bundledFonts, font);
}
export function fontRule(font: BundledFont, url: string) {
  const spec = bundledFonts[font];
  return `@font-face{font-family:'${spec.family}';src:url('${url}') format('truetype');font-weight:${spec.weight};font-style:normal;font-display:swap;}`;
}
const loaded = new Map<string, Promise<void>>();
export async function ensureFont(font?: string) {
  if (!isBundledFont(font)) return;
  if (!loaded.has(font)) {
    const spec = bundledFonts[font];
    const task = new FontFace(spec.family, `url('./fonts/${font}.ttf')`, { weight: spec.weight })
      .load()
      .then((face) => {
        document.fonts.add(face);
      })
      .catch(() => {
        loaded.delete(font);
        throw Error('Could not load the selected font. Reload Frameway and try again.');
      });
    loaded.set(font, task);
  }
  await loaded.get(font);
}
export async function exportFont(font?: string) {
  if (!isBundledFont(font)) return undefined;
  const [file, notice] = await Promise.all([
    fetch(`./fonts/${font}.ttf`),
    fetch(`./fonts/${font}-OFL.txt`),
  ]);
  if (!file.ok || !notice.ok) throw Error('Could not load the selected font for export.');
  return {
    id: font,
    blob: new Blob([await file.arrayBuffer()], { type: 'font/ttf' }),
    license: await notice.text(),
  };
}

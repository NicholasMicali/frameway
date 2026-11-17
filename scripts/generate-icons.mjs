// Run with the project's installed Playwright Chromium; no network assets are used.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const svg = await readFile(new URL('../extension/icons/frameway.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const size of [16, 32, 48, 128]) {
    const bytes = await page.evaluate(
      async ({ svg, size }) => {
        const img = new Image();
        img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        // Store icon guidance: 96px artwork inside a 128px transparent canvas.
        const padding = size === 128 ? 16 : 0;
        canvas
          .getContext('2d')
          .drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { svg, size },
    );
    await writeFile(
      new URL(`../extension/icons/frameway-${size}.png`, import.meta.url),
      Buffer.from(bytes, 'base64'),
    );
  }
} finally {
  await browser.close();
}

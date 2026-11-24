// Run from any directory: node docs/assets/launch-0.5/render.mjs
// Uses the repository's existing Playwright and Prettier dependencies; never opens your Chrome profile.
import { chromium } from 'playwright';
import { format } from 'prettier';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assets } from './layouts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const output = resolve(here, 'renders');
const mime = {
  '.html': 'text/html',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const bytes = await readFile(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((accept, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', accept);
});
const origin = `http://127.0.0.1:${server.address().port}`;
const prefix = `${origin}/docs/assets/launch-0.5`;
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'en-US',
    colorScheme: 'light',
  });
  const failures = [];
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    failures.push(`Unexpected external request: ${route.request().url()}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const checks = [];
  for (const asset of assets) {
    await page.setViewportSize({ width: asset.width, height: asset.height });
    await page.goto(`${prefix}/index.html?asset=${asset.id}`, { waitUntil: 'networkidle' });
    const inspection = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
      const board = document.querySelector('.artboard');
      const bounds = board.getBoundingClientRect();
      const textOutside = [
        ...board.querySelectorAll('h1,h2,h3,p,footer,.brand,.pill,.category-line'),
      ]
        .filter((node) => {
          const r = node.getBoundingClientRect();
          return (
            r.left < 0 ||
            r.top < 0 ||
            r.right > bounds.right + 1 ||
            r.bottom > bounds.bottom + 1 ||
            node.scrollWidth > node.clientWidth + 1 ||
            node.scrollHeight > node.clientHeight + 1
          );
        })
        .map((node) => ({
          text: node.textContent.trim(),
          width: node.clientWidth,
          scrollWidth: node.scrollWidth,
          height: node.clientHeight,
          scrollHeight: node.scrollHeight,
        }));
      return {
        width: bounds.width,
        height: bounds.height,
        textOutside,
        fontsLoaded:
          document.fonts.check('800 52px Manrope') &&
          document.fonts.check('400 25px "Source Sans 3"'),
        imagesLoaded: [...document.images].every((img) => img.naturalWidth > 0),
        hasDraftLabels: /DESIGN TEMPLATE|PROVISIONAL|PLACEHOLDER|OWNER EXAMPLES PENDING/i.test(
          board.textContent,
        ),
        currentCapturesOnly: [...board.querySelectorAll('figure img')].every((img) =>
          img.getAttribute('src').startsWith('captures/'),
        ),
      };
    });
    if (
      inspection.width !== asset.width ||
      inspection.height !== asset.height ||
      inspection.textOutside.length ||
      !inspection.fontsLoaded ||
      !inspection.imagesLoaded ||
      inspection.hasDraftLabels ||
      !inspection.currentCapturesOnly
    ) {
      throw new Error(`${asset.id}: ${JSON.stringify(inspection)}`);
    }
    const path = resolve(output, `${asset.id}.png`);
    await page.screenshot({ path, animations: 'disabled', omitBackground: false });
    const png = await readFile(path);
    const colorType = png[25];
    if (colorType !== 2)
      throw new Error(`${asset.id}: expected opaque RGB PNG, got color type ${colorType}`);
    checks.push({ id: asset.id, ...inspection, pngColorType: colorType });
  }

  // Export half-size proofs as actual raster images, not just a zoomed browser view.
  for (const asset of assets) {
    const width = asset.width / 2;
    const height = asset.height / 2;
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<style>body{margin:0}img{display:block;width:${width}px;height:${height}px}</style><img src="${prefix}/renders/${asset.id}.png" alt="Half-size proof">`,
    );
    await page.locator('img').evaluate((img) => img.decode());
    await page.screenshot({ path: resolve(output, `${asset.id}@half.png`), omitBackground: false });
  }

  const contact = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Frameway launch contact sheet</title><style>
  @font-face{font-family:Manrope;src:url('../../../public/fonts/manrope.ttf')}@font-face{font-family:Source;src:url('../../../public/fonts/sourcesans3.ttf')}
  *{box-sizing:border-box}body{margin:0;background:#e7edf3;color:#172638;font:18px Source,sans-serif;padding:40px;width:1400px}h1{font:800 32px Manrope;margin:0 0 10px}header p{margin:0 0 28px;color:#58697b}main{display:grid;grid-template-columns:1fr 1fr;gap:28px}figure{margin:0;background:white;border:1px solid #c6d5e2;border-radius:8px;overflow:hidden}.preview{height:400px;display:flex;align-items:center;justify-content:center;background:#dce5ee}.preview img{max-width:100%;max-height:100%;width:auto;height:auto;display:block}figcaption{padding:14px 18px}b{font-family:Manrope;font-size:16px}span{display:block;color:#58697b;font-size:16px;margin-top:5px}a{color:inherit;text-decoration:none}
  </style></head><body><header><h1>Frameway / Launch 0.5</h1><p>CRM Training example · current Frameway 0.5 UI · click a preview for its full-size PNG</p></header><main>${assets.map((asset) => `<figure><a class="preview" href="renders/${asset.id}.png"><img src="renders/${asset.id}.png" alt="${asset.title}"></a><figcaption><b>${asset.id} · ${asset.title}</b><span>${asset.width} × ${asset.height}${asset.id.includes('marquee') ? ' · optional' : ''}</span></figcaption></figure>`).join('')}</main></body></html>`;
  await writeFile(
    resolve(here, 'contact-sheet.html'),
    await format(contact, {
      parser: 'html',
      printWidth: 100,
      singleQuote: true,
      trailingComma: 'all',
    }),
  );
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto(`${prefix}/contact-sheet.html`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode()));
  });
  await page.screenshot({
    path: resolve(here, 'contact-sheet.png'),
    fullPage: true,
    omitBackground: false,
  });
  if (failures.length) throw new Error(failures.join('\n'));
  await writeFile(
    resolve(here, 'render-checks.json'),
    JSON.stringify(
      { status: 'PASS', chromium: browser.version(), externalRequests: 0, assets: checks },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Rendered ${assets.length} opaque RGB PNGs, ${assets.length} half-size proofs, and contact sheet. All checks passed.`,
  );
} finally {
  await browser?.close();
  await new Promise((accept) => server.close(accept));
}

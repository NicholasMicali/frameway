import { chromium } from 'playwright';
import { createServer } from 'vite';
import { openSample } from './sample-fixture.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const server = await createServer({ server: { host: '127.0.0.1', port: 4194, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await mkdir('test-results/output-consistency', { recursive: true });
try {
  await page.goto('http://127.0.0.1:4194');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const db = await import('/src/db.ts');
    const p = await db.get('projects', location.hash.split('/')[1]);
    p.steps = [
      {
        ...p.steps.find((s) => s.kind === 'image'),
        title: 'Final instructions',
        body: 'Read **these words** carefully.',
        target: 'end',
        style: 'callout',
        actionLabel: 'Reference',
        actionUrl: 'https://example.com',
      },
    ];
    p.appearance = { typography: 'compact', font: 'serif', buttonShape: 'pill' };
    await db.saveProject(p);
  });
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  const typography = (p, selector) =>
    p.locator(selector).evaluate((e) => {
      const s = getComputedStyle(e);
      return { size: s.fontSize, family: s.fontFamily, color: s.color };
    });
  const editor = await typography(page, '.callout h3');
  assert.equal(editor.size, '16px');
  assert.match(editor.family, /Georgia/);
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByLabel('Enable background music').check();
  await page.getByLabel('Music volume', { exact: true }).fill('25');
  assert.equal(
    await page.getByLabel('Music preview', { exact: true }).evaluate((a) => a.volume),
    0.25,
  );
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  assert.deepEqual(await typography(page, '.callout h3'), editor);
  assert.match(await page.locator('.card-next').textContent(), /Replay/);
  const result = await page.evaluate(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    const html = await (
      await (await import('/src/interactive-export.ts')).exportInteractive(p, 'html')
    ).text();
    const canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      drawn = [];
    const fill = context.fillText.bind(context);
    context.fillText = (text, ...args) => {
      drawn.push({ text, font: context.font, color: context.fillStyle });
      fill(text, ...args);
    };
    await (
      await import('/src/video-export.ts')
    ).exportVideo(
      p,
      { width: 1280, seconds: 1, durations: {} },
      canvas,
      new AbortController().signal,
      () => {},
    );
    return { html, drawn };
  });
  assert.ok(
    result.drawn.some((x) => x.text === 'Final instructions' && x.font.includes('16px Georgia')),
  );
  assert.ok(result.drawn.some((x) => x.text === 'Reference ↗' && x.color === '#111111'));
  assert.ok(result.drawn.some((x) => x.text === 'Replay →'));
  const file = path.resolve('test-results/output-consistency/index.html');
  await writeFile(file, result.html);
  const viewer = await browser.newPage();
  await viewer.context().setOffline(true);
  await viewer.goto(pathToFileURL(file).href);
  assert.deepEqual(await typography(viewer, '.card h2'), editor);
  assert.equal(await viewer.locator('.card button').textContent(), 'Replay →');
  console.log(
    'PASS output consistency: actual editor/preview/offline HTML typography, canvas fonts/link color/end label, and soundtrack audition volume.',
  );
} finally {
  await browser.close();
  await server.close();
}

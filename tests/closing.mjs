import { openSample, openAdvanced } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
await mkdir('test-results/closing', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4197, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1050 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
try {
  await page.goto('http://127.0.0.1:4197');
  const fixture = await openSample(page);
  await page.getByLabel('Title description').waitFor();
  await page.getByRole('button', { name: 'Add closing slide', exact: true }).click();
  await page.getByLabel('Closing description').fill('Your workflow is ready.');
  await page.getByLabel('Callout headline').fill('Nicely done');
  await openAdvanced(page);
  await page.getByRole('button', { name: 'Delete step', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByLabel('Closing description').waitFor();
  assert.equal(await page.locator('.step-list .step').count(), 8);
  await page.waitForTimeout(700);
  await page.reload();
  await page.locator('.step-list .step').last().click();
  assert.equal(
    await page.getByLabel('Closing description').inputValue(),
    'Your workflow is ready.',
  );
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: 'Replay walkthrough', exact: true }).click();
  await page.getByRole('button', { name: 'Get started', exact: true }).waitFor();
  assert.equal(await page.locator('video').evaluate((v) => v.paused), true);
  // Exercise exports with and without an opening title, and a final video or zoomed image.
  for (const mode of ['title', 'video', 'zoom']) {
    await page.bringToFront();
    console.log('Checking closing export:', mode);
    const exports = await page.evaluate(
      async ({ mode, fixture }) => {
        const { withClosingSlide } = await import('/src/model.ts');
        const { exportInteractive } = await import('/src/interactive-export.ts');
        const { exportProject, importProject } = await import('/src/archive.ts');
        const p = await importProject(new Blob([Uint8Array.from(fixture)]));
        const first = p.steps.find((s) => s.kind === (mode === 'video' ? 'video' : 'image'));
        const content = {
          ...first,
          target: 'end',
          ...(mode === 'zoom' ? { style: 'area', zoomEnabled: true, zoomPercent: 140 } : {}),
        };
        p.steps = mode === 'title' ? [p.steps[0], content] : [content];
        const q = await importProject(await exportProject(withClosingSlide(p)));
        return {
          html: await (await exportInteractive(q, 'html')).text(),
          zip: Array.from(new Uint8Array(await (await exportInteractive(q, 'zip')).arrayBuffer())),
        };
      },
      { mode, fixture },
    );
    const html = path.resolve(`test-results/closing/${mode}.html`);
    await writeFile(html, exports.html);
    const entries = unzipSync(Uint8Array.from(exports.zip));
    const root = path.resolve(`test-results/closing/${mode}`);
    for (const [name, data] of Object.entries(entries)) {
      await mkdir(path.dirname(path.join(root, name)), { recursive: true });
      await writeFile(path.join(root, name), data);
    }
    for (const file of [html, path.join(root, 'index.html')]) {
      const context = await browser.newContext({ offline: true });
      const viewer = await context.newPage();
      viewer.on('pageerror', (e) => errors.push(String(e)));
      await viewer.goto(pathToFileURL(file).href);
      if (mode === 'title')
        await viewer.getByRole('button', { name: 'Get started', exact: true }).click();
      const next = viewer.locator('nav .primary');
      await viewer.waitForFunction(() => !document.querySelector('nav .primary').disabled);
      await next.click();
      await viewer.getByRole('button', { name: 'Replay walkthrough', exact: true }).waitFor();
      assert.equal(await viewer.locator('video').evaluate((v) => v.paused), true);
      await viewer.screenshot({ path: `test-results/closing/${mode}-desktop.png` });
      await viewer.setViewportSize({ width: 390, height: 844 });
      await viewer.screenshot({ path: `test-results/closing/${mode}-mobile.png` });
      assert.ok(await viewer.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await viewer.getByRole('button', { name: 'Replay walkthrough', exact: true }).click();
      await viewer.locator('.closing-slide').waitFor({ state: 'hidden' });
      if (mode === 'title')
        await viewer.getByRole('button', { name: 'Get started', exact: true }).waitFor();
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: closing editing, delete/undo, persistence, preview replay, backup roundtrip and offline HTML/embed playback after title, video and zoom.',
  );
} finally {
  await browser.close();
  await server.close();
}

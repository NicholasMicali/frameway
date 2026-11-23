import { chromium } from 'playwright';
import { createServer } from 'vite';
import { openSample } from './sample-fixture.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const server = await createServer({ server: { host: '127.0.0.1', port: 4195, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4195');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.getByText('Project settings', { exact: true }).click();
  const choices = await page
    .getByLabel('Music track', { exact: true })
    .locator('option')
    .allTextContents();
  assert.deepEqual(
    choices,
    [...choices].sort((a, b) => a.localeCompare(b, 'en')),
  );
  for (const id of ['manrope', 'sourcesans3', 'lora', 'robotomono']) {
    await page.getByLabel('Font family', { exact: true }).selectOption(id);
    const result = await page.evaluate(async (id) => {
      const { bundledFonts, ensureFont } = await import('/src/fonts.ts');
      const { get } = await import('/src/db.ts');
      const { exportInteractive } = await import('/src/interactive-export.ts');
      const { exportProject, importProject } = await import('/src/archive.ts');
      const { unzipSync } = await import('/node_modules/fflate/esm/browser.js');
      const p = await get('projects', location.hash.split('/')[1]);
      p.appearance = { font: id };
      p.music = undefined;
      await ensureFont(id);
      const family = bundledFonts[id].family;
      const loaded = document.fonts.check(`650 19px "${family}"`);
      const restored = await importProject(await exportProject(p));
      const zip = unzipSync(
        new Uint8Array(await (await exportInteractive(p, 'zip')).arrayBuffer()),
      );
      return {
        family,
        loaded,
        restored: restored.appearance.font,
        files: Object.keys(zip),
        html: await (await exportInteractive(p, 'html')).text(),
      };
    }, id);
    assert.equal(result.loaded, true);
    assert.equal(result.restored, id);
    assert.deepEqual(
      result.files.filter((n) => n.endsWith('.ttf')),
      [`media/${id}.ttf`],
    );
    assert.ok(result.files.includes('FONT-LICENSE.txt'));
    await mkdir('test-results/fonts', { recursive: true });
    const file = path.resolve(`test-results/fonts/${id}.html`);
    await writeFile(file, result.html);
    const viewer = await browser.newPage();
    await viewer.context().setOffline(true);
    await viewer.goto(pathToFileURL(file).href);
    assert.equal(
      await viewer.evaluate(
        async (family) => (await document.fonts.load(`650 19px "${family}"`)).length,
        result.family,
      ),
      1,
    );
    assert.ok(
      (await viewer.locator('#font-license').textContent()).includes('SIL OPEN FONT LICENSE'),
    );
    await viewer.close();
  }
  const videoFonts = await page.evaluate(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    p.appearance = { font: 'lora' };
    p.music = undefined;
    p.steps = [
      { ...p.steps.find((s) => s.kind === 'image'), title: 'Bundled font check', target: 'end' },
    ];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fill = ctx.fillText.bind(ctx);
    const drawn = [];
    ctx.fillText = (text, ...args) => {
      if (text === 'Bundled font check')
        drawn.push({ font: ctx.font, loaded: document.fonts.check(ctx.font) });
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
    return drawn;
  });
  assert.ok(videoFonts.length > 0 && videoFonts.every((f) => f.loaded && f.font.includes('Lora')));
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = page.locator('.appearance-panel');
  assert.ok(await panel.evaluate((e) => e.scrollWidth <= e.clientWidth));
  await page.screenshot({ path: 'test-results/fonts/settings-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/fonts/settings-desktop.png' });
  console.log(
    'PASS fonts: local loading, backup roundtrip, selected-only embed, offline HTML, sorted music, narrow settings.',
  );
} finally {
  await browser.close();
  await server.close();
}

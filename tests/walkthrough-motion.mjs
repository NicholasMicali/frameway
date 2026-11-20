import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
const server = await createServer({ server: { host: '127.0.0.1', port: 4191, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'no-preference',
});
const settle = (p) =>
  p.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
page.setDefaultTimeout(15000);
const animationName = (el) => el.evaluate((e) => getComputedStyle(e).animationName);
try {
  await page.goto('http://127.0.0.1:4191');
  const fixture = await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.locator('.step').nth(2).click();
  assert.equal(await animationName(page.locator('.callout')), 'none');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  assert.equal(await animationName(page.locator('.callout')), 'walkthrough-enter');
  await settle(page);
  await page.locator('.hotspot').hover();
  await settle(page);
  assert.ok(Number(await page.locator('.hotspot').evaluate((e) => getComputedStyle(e).scale)) > 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await animationName(page.locator('.callout')), 'none');
  assert.equal(await page.locator('.hotspot').evaluate((e) => getComputedStyle(e).scale), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByLabel('Overlay animations').selectOption('none');
  await page.getByRole('button', { name: 'Apply appearance' }).click();
  await page.waitForTimeout(700);
  await page.getByText('Saved locally', { exact: true }).waitFor();
  console.log('Checking saved motion setting');
  await page.reload();
  await page.getByText('Project settings', { exact: true }).click();
  assert.equal(await page.getByLabel('Overlay animations').inputValue(), 'none');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.locator('.step').nth(2).click();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  assert.equal(await animationName(page.locator('.callout')), 'none');

  // Export generated fixture data, never a real user's library.
  console.log('Checking offline exports');
  for (const format of ['html', 'zip']) {
    for (const motion of ['subtle', 'fade', 'none']) {
      console.log(format, motion);
      const bytes = await page.evaluate(
        async ({ fixture, format, motion }) => {
          const { importProject } = await import('/src/archive.ts');
          const { exportInteractive } = await import('/src/interactive-export.ts');
          const p = await importProject(new Blob([Uint8Array.from(fixture)]));
          p.appearance = { motion };
          return Array.from(
            new Uint8Array(await (await exportInteractive(p, format)).arrayBuffer()),
          );
        },
        { fixture, format, motion },
      );
      const folder = path.resolve('test-results/motion', format, motion);
      await mkdir(folder, { recursive: true });
      if (format === 'html') await writeFile(path.join(folder, 'index.html'), Buffer.from(bytes));
      else
        for (const [file, data] of Object.entries(unzipSync(Uint8Array.from(bytes)))) {
          await mkdir(path.dirname(path.join(folder, file)), { recursive: true });
          await writeFile(path.join(folder, file), data);
        }
      const viewer = await browser.newPage({
        viewport: { width: 1280, height: 900 },
        reducedMotion: 'no-preference',
      });
      await viewer.context().setOffline(true);
      await viewer.goto(pathToFileURL(path.join(folder, 'index.html')).href);
      const expected = motion === 'none' ? 'none' : 'walkthrough-enter';
      assert.equal(await animationName(viewer.locator('.title-start')), expected);
      await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
      assert.equal(await animationName(viewer.locator('.card')), expected);
      await settle(viewer);
      await viewer.locator('.hotspot').hover();
      await settle(viewer);
      const scale = await viewer.locator('.hotspot').evaluate((e) => getComputedStyle(e).scale);
      assert.equal(motion === 'none' ? scale === 'none' : Number(scale) > 1, true);
      await viewer.getByRole('button', { name: 'Restart', exact: true }).click();
      assert.equal(await animationName(viewer.locator('.title-start')), expected);
      await viewer.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await animationName(viewer.locator('.title-start')), 'none');
      await viewer.emulateMedia({ reducedMotion: 'no-preference' });
      await settle(viewer);
      await viewer.screenshot({ path: path.join(folder, 'title.png') });
      await viewer.close();
    }
  }
  console.log(
    'Motion passed: edit/preview, hover, saved off setting, reduced motion, restart, offline HTML/embed presets.',
  );
} finally {
  await browser.close();
  await server.close();
}

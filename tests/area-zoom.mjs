import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4182, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const settle = async (p) =>
  p.evaluate(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
  });
const scale = (locator) =>
  locator.evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
try {
  await page.goto('http://127.0.0.1:4182');
  await page.getByRole('button', { name: 'Explore a sample walkthrough' }).click();
  await page.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await page.locator('.step').nth(2).click();
  await page.getByLabel('Overlay style').selectOption('area');
  assert.equal(await page.getByLabel('Zoom into highlighted area').isChecked(), true);
  assert.ok(Number(await page.getByLabel('Area zoom percentage').inputValue()) <= 120);
  await page.getByLabel('Area zoom percentage').fill('100');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await settle(page);
  const size = await page.locator('.callout').boundingBox();
  assert.equal(await scale(page.locator('.still')), 1);
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.getByLabel('Area zoom percentage').fill('150');
  assert.equal(await scale(page.locator('.still')), 1);
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await settle(page);
  assert.equal(await scale(page.locator('.still')), 1.5);
  assert.equal(await scale(page.locator('.area-hotspot')), 1.5);
  const after = await page.locator('.callout').boundingBox();
  assert.ok(Math.abs(size.width - after.width) < 1 && Math.abs(size.height - after.height) < 1);
  assert.equal(await scale(page.locator('.callout')), 1);
  await page.screenshot({ path: 'test-results/area-zoom-preview.png' });
  // Leaving holds the current image, reverses both transforms, and locks all navigation.
  const checkExit = async (p, imageSelector, cardSelector) => {
    const before = await p.locator(cardSelector).boundingBox();
    await p.getByRole('button', { name: /^Go to step 5:/ }).click();
    assert.equal(await p.locator('.area-zoom-image').count(), 1);
    assert.equal(await p.getByRole('button', { name: /^Go to step 5:/ }).isDisabled(), true);
    await p.evaluate(() => {
      for (const a of document.getAnimations()) {
        if (a.constructor.name === 'Animation') {
          a.pause();
          a.currentTime = 325;
        }
      }
    });
    const halfway = await scale(p.locator(imageSelector));
    assert.ok(halfway > 1 && halfway < 1.5, `Intermediate scale: ${halfway}`);
    const during = await p.locator(cardSelector).boundingBox();
    assert.ok(Math.abs(before.width - during.width) < 1);
    await p.evaluate(() => {
      for (const a of document.getAnimations()) if (a.constructor.name === 'Animation') a.finish();
    });
    await p.locator('.area-zoom-image').waitFor({ state: 'detached' });
    await p.getByRole('button', { name: '← Back', exact: true }).click();
    await p.locator('.area-zoom-image').waitFor();
    await settle(p);
  };
  await checkExit(page, '.still', '.callout');
  // Switching to Edit during exit cancels the pending destination.
  await page.getByRole('button', { name: /^Go to step 5:/ }).click();
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.waitForTimeout(700);
  assert.equal(await page.getByLabel('Area zoom percentage').inputValue(), '150');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await settle(page);

  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.waitForTimeout(450);
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  await page.locator('.step').nth(2).click();
  assert.equal(await page.getByLabel('Area zoom percentage').inputValue(), '150');
  await page.locator('.export-menu summary').click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project', exact: false }).click();
  const archive = path.resolve('test-results/zoom.frameway.zip');
  await (await dl).saveAs(archive);
  await page.locator('input[accept=".zip"]').setInputFiles(archive);
  await page.getByText('Importing walkthrough…').waitFor({ state: 'hidden' });
  await page.locator('.step').nth(2).click();
  assert.equal(await page.getByLabel('Area zoom percentage').inputValue(), '150');
  await page.locator('.export-menu summary').click();
  const html = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  const file = path.resolve('test-results/zoom.html');
  await (await html).saveAs(file);
  const context = await browser.newContext({ reducedMotion: 'reduce', offline: true });
  const viewer = await context.newPage();
  viewer.on('pageerror', (e) => errors.push(String(e)));
  await viewer.goto(pathToFileURL(file).href);
  await viewer.getByRole('button', { name: 'Get started', exact: true }).click();
  await viewer.locator('.area-zoom-image').waitFor();
  await settle(viewer);
  assert.equal(await scale(viewer.locator('.area-zoom-image')), 1.5);
  assert.equal(await scale(viewer.locator('.area-hotspot')), 1.5);
  assert.equal(await scale(viewer.locator('.card')), 1);
  assert.equal(
    await viewer.locator('.area-zoom-image').evaluate((e) => getComputedStyle(e).animationDuration),
    '0s',
  );
  await viewer.screenshot({ path: 'test-results/area-zoom-export.png' });
  // Jump to another image so Back tests zoom reset without skipping a playing clip.
  await viewer.getByRole('button', { name: /^Go to step 5:/ }).click();
  assert.equal(await viewer.locator('.area-zoom-image').count(), 0);
  await viewer.getByRole('button', { name: '← Back', exact: true }).click();
  assert.equal(await viewer.locator('.area-zoom-image').count(), 1);
  await viewer.emulateMedia({ reducedMotion: 'no-preference' });
  await settle(viewer);
  await checkExit(viewer, '.area-zoom-image', '.card');

  await page.getByLabel('Zoom into highlighted area').uncheck();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  assert.equal(await page.locator('.area-zoom-image').count(), 0);
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.getByLabel('Zoom into highlighted area').check();
  await page.getByRole('button', { name: 'Use automatic zoom' }).click();
  assert.ok(Number(await page.getByLabel('Area zoom percentage').inputValue()) < 150);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: area zoom default/override/disable, unchanged card size, preview, persistence, archive, offline playback, reduced motion and navigation reset.',
  );
} finally {
  await browser.close();
  await server.close();
}

import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const server = await createServer({ server: { host: '127.0.0.1', port: 4179, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
try {
  await page.goto('http://127.0.0.1:4179');
  await page.getByRole('button', { name: 'Explore a sample walkthrough' }).click();
  await page.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Delete step', exact: true }).click();
  await page.getByLabel('Callout headline').fill('Opening edit');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Opening footage');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Opening edit');
  const trim = page.getByRole('slider', { name: 'Trim start', exact: true });
  const initial = await trim.getAttribute('aria-valuenow');
  await trim.scrollIntoViewIfNeeded();
  const b = await trim.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + 30, b.y + 10, { steps: 12 });
  await page.mouse.up();
  assert.ok(Number(await trim.getAttribute('aria-valuenow')) > 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await trim.getAttribute('aria-valuenow'), initial);
  await page.getByLabel('Video scrubber').fill('0.7');
  await page.getByRole('button', { name: 'Split video here' }).click();
  assert.equal(await page.locator('.step-list .step').count(), 7);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.locator('.step-list .step').count(), 6);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  assert.equal(await page.locator('.step-list .step').count(), 7);
  await page.getByRole('button', { name: 'Duplicate step', exact: true }).click();
  assert.equal(await page.locator('.step-list .step').count(), 8);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.locator('.step-list .step').nth(2).click();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('heading', { name: 'Create your first project' }).waitFor();
  assert.equal(await page.getByText('Playing video').count(), 0);
  await page.locator('.card-next').click();
  await page.getByRole('heading', { name: 'Give your project a home' }).waitFor();
  await page.getByRole('button', { name: '✎ Edit' }).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Create your first project');
  await page.getByLabel('Overlay style').selectOption('area');
  await page.getByLabel('Area width').fill('0.4');
  await page.getByLabel('Area height').fill('0.3');
  await page.getByLabel('Card width').fill('0.4');
  await page.getByRole('button', { name: 'Bottom right', exact: true }).click();
  assert.ok((await page.locator('.area-hotspot').boundingBox()).width > 100);
  await page.screenshot({ path: 'test-results/editor-enhanced.png', fullPage: true });
  await page.getByRole('button', { name: 'Delete step', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.getByLabel('Overlay style').inputValue(), 'area');
  const studioAccent = await page
    .locator('.app')
    .evaluate((e) => getComputedStyle(e).getPropertyValue('--accent'));
  await page.getByLabel('Color theme').selectOption('forest');
  assert.equal(
    await page.locator('.app').evaluate((e) => getComputedStyle(e).getPropertyValue('--accent')),
    studioAccent,
  );
  assert.equal(
    await page.locator('.stage').evaluate((e) => getComputedStyle(e).getPropertyValue('--accent')),
    '#23754e',
  );
  await page.screenshot({ path: 'test-results/theme-scoped-editor.png', fullPage: true });
  await page.locator('.export-menu summary').click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  const file = path.resolve('test-results/area.html');
  await (await download).saveAs(file);
  const viewer = await browser.newPage();
  await viewer.goto(pathToFileURL(file).href);
  await viewer.locator('.area-hotspot').waitFor();
  assert.equal(
    await viewer.locator('body').evaluate((e) => getComputedStyle(e).backgroundColor),
    'rgb(255, 255, 255)',
  );
  assert.equal(
    await viewer.locator('.area-hotspot').evaluate((e) => getComputedStyle(e).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  assert.equal(
    await viewer.locator('.area-hotspot').evaluate((e) => getComputedStyle(e).borderTopColor),
    'rgb(35, 117, 78)',
  );
  assert.match(
    await viewer.locator('.area-hotspot').evaluate((e) => getComputedStyle(e).boxShadow),
    /9999px/,
  );
  await viewer.screenshot({ path: 'test-results/theme-spotlight.png', fullPage: true });
  assert.ok((await viewer.locator('.area-hotspot').boundingBox()).width > 100);
  await viewer.locator('.card button').click();
  await viewer.getByRole('heading', { name: 'Give your project a home' }).waitFor();
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByLabel('Color theme').waitFor();
  assert.equal(await page.getByLabel('Color theme').inputValue(), 'forest');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: grouped undo/redo, trim drag, split, duplicate, delete restoration, selected-step preview/return, card sizing/placement, area overlay and interactive export.',
  );
} catch (e) {
  await page.screenshot({ path: 'test-results/editor-failure.png', fullPage: true });
  throw e;
} finally {
  await browser.close();
  await server.close();
}

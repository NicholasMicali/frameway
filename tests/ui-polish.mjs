import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4183, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
try {
  await page.goto('http://127.0.0.1:4183');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  assert.equal(await page.locator('footer,.lab,.local-card').count(), 0);
  assert.match(await page.locator('.app-version').innerText(), /^v\d+\.\d+\.\d+$/);
  assert.equal(
    await page.getByRole('button', { name: 'Edit title slide', exact: true }).count(),
    0,
  );
  assert.equal(await page.getByLabel('Color theme').isVisible(), false);
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByLabel('Color theme').selectOption('rose');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByLabel('Color theme').isVisible(), false);
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByLabel('Callout headline').click();
  assert.equal(await page.getByLabel('Color theme').isVisible(), false);
  await page.getByLabel('Walkthrough title').fill('Tiny');
  const short = (await page.getByLabel('Open walkthrough').boundingBox()).width;
  await page.getByLabel('Walkthrough title').fill('A much longer walkthrough title');
  assert.ok((await page.getByLabel('Open walkthrough').boundingBox()).width > short + 70);
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 40;
    c.getContext('2d').fillRect(0, 0, 80, 40);
    return c.toDataURL().split(',')[1];
  });
  await page.getByLabel('Company logo', { exact: true }).setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(logo, 'base64'),
  });
  await page.getByRole('button', { name: 'Remove logo', exact: true }).waitFor();
  const actions = await page.locator('.logo-upload-actions').boundingBox(),
    note = await page.locator('.logo-upload .field-note').boundingBox();
  assert.ok(note.y >= actions.y + actions.height + 5);
  await page.getByRole('button', { name: 'Remove logo', exact: true }).click();
  assert.equal(await page.locator('.stage .title-logo').count(), 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.locator('.stage .title-logo').count(), 1);
  await page.screenshot({ path: 'test-results/ui-polish-editor.png' });
  await page.locator('.step').nth(1).click();
  await page.getByLabel('Clip end', { exact: true }).fill('5');
  await page.locator('.step').nth(0).click();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: /^Go to step 3:/ }).click();
  assert.equal(
    await page.locator('.callout p').evaluate((e) => getComputedStyle(e).color),
    'rgb(17, 17, 17)',
  );
  await page.getByRole('button', { name: '← Back', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: /^Go to step 1:/ }).getAttribute('aria-current'),
    'step',
  );
  await page.getByRole('button', { name: /^Go to step 2:/ }).click();
  await page.getByText('● Playing video', { exact: true }).waitFor();
  for (const locator of [
    page.getByRole('button', { name: /^Go to step 3:/ }),
    page.getByRole('button', { name: '← Back', exact: true }),
    page.getByRole('button', { name: 'Next step →', exact: true }),
    page.getByRole('button', { name: '↺ Restart', exact: true }),
  ])
    assert.equal(await locator.isDisabled(), true);
  await page.locator('video').evaluate((v) => {
    v.currentTime = 5;
  });
  await page.locator('.callout').waitFor();
  assert.equal(await page.getByRole('button', { name: /^Go to step 5:/ }).isDisabled(), false);
  await page.getByRole('button', { name: /^Go to step 5:/ }).click();
  await page.getByRole('button', { name: '← Back', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: /^Go to step 3:/ }).getAttribute('aria-current'),
    'step',
  );
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  await page.getByText('Download started — check your downloads', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close export' }).click();
  const file = path.resolve('test-results/ui-polish.html');
  await (await dl).saveAs(file);
  const viewer = await browser.newPage();
  viewer.on('pageerror', (e) => errors.push(String(e)));
  await viewer.goto(pathToFileURL(file).href);
  await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
  assert.equal(
    await viewer.locator('.card p').evaluate((e) => getComputedStyle(e).color),
    'rgb(17, 17, 17)',
  );
  await viewer.getByRole('button', { name: /^Go to step 2:/ }).click();
  await viewer.getByRole('button', { name: 'Pause', exact: true }).waitFor();
  assert.equal(await viewer.getByRole('button', { name: /^Go to step 3:/ }).isDisabled(), true);
  assert.equal(
    await viewer.getByRole('button', { name: '← Back', exact: true }).isDisabled(),
    true,
  );
  await viewer.getByRole('button', { name: 'Pause', exact: true }).click();
  assert.equal(await viewer.getByRole('button', { name: /^Go to step 3:/ }).isDisabled(), false);
  await viewer.getByRole('button', { name: /^Go to step 5:/ }).click();
  assert.equal(
    await viewer.getByRole('button', { name: /^Go to step 5:/ }).getAttribute('aria-current'),
    'step',
  );
  await viewer.screenshot({ path: 'test-results/ui-polish-player.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('Project settings', { exact: true }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/ui-polish-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: compact settings, logo controls, content-sized selector, cleanup, neutral card text, preview/export dot jumps and consistent playback locks.',
  );
} catch (e) {
  await page.screenshot({ path: 'test-results/ui-polish-failure.png', fullPage: true });
  throw e;
} finally {
  await browser.close();
  await server.close();
}

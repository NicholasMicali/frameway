import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
await mkdir('test-results/appearance', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4191, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const open = () => page.getByText('Project settings', { exact: true }).click();
try {
  await page.goto('http://127.0.0.1:4191');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  const appAccent = await page
    .locator('.app')
    .evaluate((e) => getComputedStyle(e).getPropertyValue('--accent'));
  await open();
  await page.getByLabel('Card text', { exact: true }).fill('#ffffff');
  await page.getByText(/Card text: 1.0:1 — low contrast/).waitFor();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Undo', exact: true }).isDisabled(), true);
  await open();
  assert.equal(await page.getByLabel('Card text', { exact: true }).inputValue(), '#111111');
  await page.getByLabel('Card background', { exact: true }).fill('#17202e');
  await page.getByLabel('Card text', { exact: true }).fill('#ffffff');
  await page.getByLabel('Title background', { exact: true }).fill('#edf7ff');
  await page.getByLabel('Title text', { exact: true }).fill('#18354f');
  await page.getByLabel('Title layout', { exact: true }).selectOption('centered');
  await page.getByLabel('Font family', { exact: true }).selectOption('serif');
  await page.getByLabel('Card typography', { exact: true }).selectOption('large');
  await page.getByLabel('Button shape', { exact: true }).selectOption('pill');
  await page.getByLabel('Logo alignment', { exact: true }).selectOption('center');
  await page.getByLabel('Title logo size', { exact: true }).fill('8');
  await page.locator('.appearance-panel').evaluate((e) => (e.scrollTop = 0));
  await page.screenshot({ path: 'test-results/appearance/draft.png', fullPage: true });
  await page.getByRole('button', { name: 'Apply appearance', exact: true }).click();
  assert.equal(
    await page.locator('.stage .title-slide').evaluate((e) => getComputedStyle(e).backgroundColor),
    'rgb(237, 247, 255)',
  );
  assert.equal(await page.locator('.stage .title-preview').isVisible(), false);
  assert.equal(
    await page.locator('.app').evaluate((e) => getComputedStyle(e).getPropertyValue('--accent')),
    appAccent,
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.locator('.stage .title-preview').isVisible(), true);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByText('Saved locally', { exact: true }).waitFor();
  await page.reload();
  await page.locator('.stage .title-layout-centered').waitFor();
  await page.locator('.step-list .step').nth(2).click();
  assert.equal(
    await page.locator('.callout p').evaluate((e) => getComputedStyle(e).color),
    'rgb(255, 255, 255)',
  );
  assert.equal(
    await page.locator('.callout p').evaluate((e) => getComputedStyle(e).fontSize),
    '16px',
  );
  await page.screenshot({ path: 'test-results/appearance/card.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole('button', { name: 'Reset appearance', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(
    await page.locator('.callout p').evaluate((e) => getComputedStyle(e).color),
    'rgb(255, 255, 255)',
  );
  for (const format of ['html', 'zip']) {
    const bytes = await page.evaluate(async (format) => {
      const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
      return Array.from(
        new Uint8Array(
          await (
            await (await import('/src/interactive-export.ts')).exportInteractive(p, format)
          ).arrayBuffer(),
        ),
      );
    }, format);
    const folder = path.resolve('test-results/appearance', format);
    await mkdir(folder, { recursive: true });
    if (format === 'html') await writeFile(path.join(folder, 'index.html'), Buffer.from(bytes));
    else
      for (const [file, data] of Object.entries(unzipSync(Uint8Array.from(bytes)))) {
        await mkdir(path.dirname(path.join(folder, file)), { recursive: true });
        await writeFile(path.join(folder, file), data);
      }
    const viewer = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await viewer.context().setOffline(true);
    await viewer.goto(pathToFileURL(path.join(folder, 'index.html')).href);
    assert.equal(await viewer.locator('.title-preview').isVisible(), false);
    assert.equal(
      await viewer.locator('.title-slide').evaluate((e) => getComputedStyle(e).backgroundColor),
      'rgb(237, 247, 255)',
    );
    assert.equal(
      await viewer.locator('.title-start').evaluate((e) => getComputedStyle(e).borderRadius),
      '999px',
    );
    await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
    assert.equal(
      await viewer.locator('.card p').evaluate((e) => getComputedStyle(e).color),
      'rgb(255, 255, 255)',
    );
    assert.equal(
      await viewer.locator('.card p').evaluate((e) => getComputedStyle(e).fontSize),
      '16px',
    );
    await viewer.screenshot({
      path: `test-results/appearance/${format}-mobile.png`,
      fullPage: true,
    });
    await viewer.close();
  }
  console.log(
    'Appearance passed: draft/cancel, contrast, apply/undo, persistence, neutral app chrome, mobile and offline HTML/embed styling.',
  );
} finally {
  await browser.close();
  await server.close();
}

import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { unzipSync } from 'fflate';
await mkdir('test-results/formatting', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4192, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  await page.goto('http://127.0.0.1:4192');
  await openSample(page);
  await page.locator('.step-list .step').nth(2).click();
  await page.screenshot({ path: 'test-results/formatting/before.png' });
  await page.getByLabel('Callout body', { exact: true }).fill('Important');
  await page.getByLabel('Callout body', { exact: true }).press('ControlOrMeta+A');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  assert.equal(await page.locator('.callout strong').innerText(), 'Important');
  await page
    .getByLabel('Callout body', { exact: true })
    .fill('**Important**\n- First\n- *Second*\n1. Review\n<script>alert(1)</script>');
  await page.getByLabel('Action button label').fill('Documentation');
  await page.getByLabel('Action button URL').fill('javascript:alert(1)');
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('.callout-action').count(), 0);
  await page.getByLabel('Action button URL').fill('https://example.com/docs');
  assert.equal(await page.locator('.callout li').count(), 3);
  assert.equal(await page.locator('.callout script').count(), 0);
  await page.getByText('Saved locally', { exact: true }).waitFor();
  await page.screenshot({ path: 'test-results/formatting/after.png' });
  await page.reload();
  await page.locator('.step-list .step').nth(2).click();
  await page.locator('.callout strong').waitFor();
  for (const format of ['html', 'zip']) {
    const bytes = await page.evaluate(async (format) => {
      const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
      const archive = await import('/src/archive.ts');
      const restored = await archive.importProject(await archive.exportProject(p));
      if (
        restored.steps[2].bodyFormat !== 'basic' ||
        restored.steps[2].actionUrl !== 'https://example.com/docs'
      )
        throw Error('Archive lost formatting');
      return Array.from(
        new Uint8Array(
          await (
            await (await import('/src/interactive-export.ts')).exportInteractive(restored, format)
          ).arrayBuffer(),
        ),
      );
    }, format);
    const folder = path.resolve('test-results/formatting', format);
    await mkdir(folder, { recursive: true });
    const files =
      format === 'html'
        ? { 'index.html': Uint8Array.from(bytes) }
        : unzipSync(Uint8Array.from(bytes));
    for (const [name, data] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(folder, name)), { recursive: true });
      await writeFile(path.join(folder, name), data);
    }
    const viewer = await browser.newPage();
    await viewer.context().setOffline(true);
    await viewer.goto(pathToFileURL(path.join(folder, 'index.html')).href);
    await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
    assert.equal(await viewer.locator('.card strong').innerText(), 'Important');
    assert.equal(await viewer.locator('.card li').count(), 3);
    assert.equal(await viewer.locator('.card script').count(), 0);
    assert.equal(
      await viewer.locator('.callout-action').getAttribute('rel'),
      'noopener noreferrer',
    );
    await viewer.close();
  }
  console.log(
    'PASS formatting toolbar, safe actions, persistence, backups and offline HTML/embed.',
  );
} finally {
  await browser.close();
  await server.close();
}

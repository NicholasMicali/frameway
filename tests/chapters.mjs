import { openSample, openAdvanced } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
await mkdir('test-results/chapters', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4190, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  await page.goto('http://127.0.0.1:4190');
  await openSample(page);
  await openAdvanced(page);
  await page.getByLabel('Start a chapter', { exact: true }).check();
  await openAdvanced(page);
  await page.getByLabel('Chapter name').fill('Introduction');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.getByLabel('Start a chapter', { exact: true }).isChecked(), false);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.locator('.step-list .step').last().click();
  await openAdvanced(page);
  await page.getByLabel('Start a chapter', { exact: true }).check();
  await openAdvanced(page);
  await page.getByLabel('Chapter name').fill('Finish');
  await page.getByText('Saved locally', { exact: true }).waitFor();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByLabel('Walkthrough contents').click();
  await page
    .getByRole('group', { name: 'Chapters', exact: true })
    .getByRole('button', { name: /Introduction/ })
    .click();
  await page.getByRole('button', { name: 'Get started', exact: true }).waitFor();
  assert.equal(
    await page.getByLabel('Walkthrough contents').evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByLabel('Walkthrough contents').click();
  await page.screenshot({ path: 'test-results/chapters/preview.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await page.getByText('● Playing video', { exact: true }).waitFor();
  await page.getByLabel('Walkthrough contents').click();
  assert.equal(
    await page
      .getByRole('group', { name: 'Chapters', exact: true })
      .getByRole('button')
      .first()
      .isDisabled(),
    true,
  );
  await page.getByRole('button', { name: '✎ Edit' }).click();
  assert.equal(await page.getByLabel('Chapter name').inputValue(), 'Finish');
  for (const format of ['html', 'zip']) {
    const bytes = await page.evaluate(async (format) => {
      const { get } = await import('/src/db.ts');
      const { exportInteractive } = await import('/src/interactive-export.ts');
      const p = await get('projects', location.hash.split('/')[1]);
      return Array.from(new Uint8Array(await (await exportInteractive(p, format)).arrayBuffer()));
    }, format);
    const folder = path.resolve('test-results/chapters', format);
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
    await viewer.getByLabel('Walkthrough contents').click();
    await viewer
      .getByRole('group', { name: 'Chapters', exact: true })
      .getByRole('button', { name: /Finish/ })
      .click();
    await viewer.getByRole('heading', { name: 'You’re all set', exact: true }).waitFor();
    assert.equal(
      await viewer
        .getByLabel('Walkthrough contents')
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await viewer.getByLabel('Walkthrough contents').click();
    assert.equal(
      await viewer
        .getByRole('group', { name: 'Chapters', exact: true })
        .getByRole('button', { name: /Finish/ })
        .getAttribute('aria-current'),
      'step',
    );
    await viewer.screenshot({ path: `test-results/chapters/${format}-mobile.png`, fullPage: true });
    await viewer.close();
  }
  console.log(
    'Chapters passed: authoring/undo, preview locks and return step, offline HTML/embed contents, mobile and focus.',
  );
} finally {
  await browser.close();
  await server.close();
}

import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4185, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => {
  window.failSave = false;
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'projects' && window.failSave)
      throw new DOMException('Test full storage', 'QuotaExceededError');
    return original.apply(this, args);
  };
  Object.defineProperty(navigator.storage, 'estimate', {
    value: async () => ({ usage: 95 * 1024 ** 2, quota: 100 * 1024 ** 2 }),
  });
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const stored = () =>
  page.evaluate(async () => {
    const { all } = await import('/src/db.ts');
    return all('projects');
  });
const saved = async () => {
  await page.waitForTimeout(450);
  await page.getByText('Saved locally', { exact: true }).waitFor();
};
const exportBackup = async () => {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('button', { name: 'Export project backup', exact: true }).click();
  await page.getByText('Download started — check your downloads', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close export' }).click();
  await (await pending).saveAs('test-results/storage.frameway.zip');
};
try {
  await page.goto('http://127.0.0.1:4185');
  await page.getByText(/Browser storage is nearly full/).waitFor();
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await saved();
  await exportBackup();
  await saved();
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByText('Backup exported for these edits', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByLabel('Walkthrough title').fill('Changed after backup');
  await saved();
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByText(/Changed since last backup export/)
    .waitFor();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await saved();
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  await saved();
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByText(/Backup exported for these edits/)
    .waitFor();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  const before = (await stored())[0].title;
  await page.evaluate(() => {
    window.failSave = true;
  });
  await page.getByLabel('Walkthrough title').fill('Unsaved but recoverable');
  await page.getByRole('button', { name: 'Retry saving', exact: true }).waitFor();
  assert.equal((await stored())[0].title, before);
  assert.equal(await page.getByText('Saved locally', { exact: true }).count(), 0);
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  assert.equal(await page.getByLabel('Walkthrough title').inputValue(), 'Unsaved but recoverable');
  await exportBackup();
  const data = JSON.parse(
    strFromU8(
      unzipSync(new Uint8Array(await readFile('test-results/storage.frameway.zip')))[
        'project.json'
      ],
    ),
  );
  assert.equal(data.title, 'Unsaved but recoverable');
  assert.equal(data.localBackup, undefined);
  assert.equal(data.localRevision, undefined);
  await page.evaluate(() => {
    window.failSave = false;
  });
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await saved();
  assert.equal((await stored())[0].title, 'Unsaved but recoverable');
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('.project-card').waitFor();
  assert.match(await page.locator('.project-card').innerText(), /About .*MB/);
  await page.evaluate(async () => {
    const { all, put } = await import('/src/db.ts');
    const p = (await all('projects'))[0];
    await put('sessions', {
      id: 'completed-test',
      status: 'complete',
      projectId: p.id,
      chunkCount: 1,
    });
    await put('chunks', new Blob(['sample']), 'completed-test:0');
  });
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await page.screenshot({ path: 'test-results/storage-manager.png' });
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  assert.equal((await stored()).length, 1);
  await page.getByRole('button', { name: 'Keep project', exact: true }).click();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
  await page.getByText('No saved projects in this library yet.').waitFor();
  assert.equal((await stored()).length, 0);
  assert.deepEqual(
    await page.evaluate(async () => {
      const { all } = await import('/src/db.ts');
      return [await all('sessions'), await all('chunks')];
    }),
    [[], []],
  );
  const other = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await other.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'estimate', {
      value: async () => {
        throw Error('Unavailable');
      },
    });
  });
  await other.goto('http://127.0.0.1:4185');
  await other.getByLabel('Workspace options', { exact: true }).click();
  await other.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await other
    .getByRole('dialog')
    .getByText('Browser storage estimate unavailable', { exact: true })
    .waitFor();
  assert.equal(
    await other.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await other.screenshot({ path: 'test-results/storage-mobile.png' });
  await other.getByRole('button', { name: 'Close', exact: true }).click();
  await other.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'projects')
        throw new DOMException('Full on first save', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await openSample(other);
  await other.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await other.getByRole('button', { name: 'Retry saving', exact: true }).waitFor();
  const emergencyDownload = other.waitForEvent('download');
  await other.getByRole('button', { name: 'Export backup', exact: true }).click();
  assert.match((await emergencyDownload).suggestedFilename(), /\.frameway\.zip$/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: backup revision/reload/undo, quota failure preserves saved data and live edits, backup while full, retry, media sizes, confirmed atomic deletion, and unavailable estimates.',
  );
} finally {
  await browser.close();
  await server.close();
}

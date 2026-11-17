import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4188, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const read = () =>
  page.evaluate(async () => (await import('/src/db.ts')).get('projects', 'rename-test'));
try {
  await page.goto('http://127.0.0.1:4188');
  await page.getByText('Opening your studio…').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const { sampleProject } = await import('/src/sample.ts');
    const { saveProject } = await import('/src/db.ts');
    const p = await sampleProject();
    await saveProject({ ...p, id: 'rename-test', title: 'Original', createdAt: 1000 });
    await saveProject({ ...p, id: 'newer', title: 'Newer', createdAt: 2000 });
  });
  // Reload recreates the app but preserves the seeded projects.
  await page.reload();
  await page.locator('.project-card').nth(1).waitFor();
  await page.screenshot({ path: 'test-results/library-before-rename.png', fullPage: true });
  await page.getByLabel('Options for Original').click();
  await page.getByRole('menuitem', { name: 'Rename Original', exact: true }).click();
  await page.getByLabel('Project name').fill('   ');
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /1 and 200/);
  await page.getByLabel('Project name').fill('Renamed');
  await page.screenshot({ path: 'test-results/library-rename-dialog.png' });
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (window.failRename) throw new DOMException('Test full storage', 'QuotaExceededError');
      return put.apply(this, args);
    };
    window.failRename = true;
  });
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await page.getByText(/previous name is unchanged/).waitFor();
  assert.equal((await read()).title, 'Original');
  await page.evaluate(() => {
    window.failRename = false;
  });
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(
    await page.getByLabel('Options for Renamed').evaluate((el) => el === document.activeElement),
    true,
  );
  const saved = await read();
  assert.equal(saved.title, 'Renamed');
  assert.ok(saved.localEditedAt > 2000);
  await page.getByLabel('Sort by').selectOption('edited');
  assert.equal(await page.locator('.project-card strong').first().innerText(), 'Renamed');
  await page.screenshot({ path: 'test-results/library-renamed.png', fullPage: true });
  await page.getByLabel('Options for Renamed').click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Export backup of Renamed', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'Renamed.frameway.zip');
  await page.getByText('Exporting editable backup…', { exact: true }).waitFor({ state: 'hidden' });
  assert.equal((await read()).localEditedAt, saved.localEditedAt);
  await page.locator('.project-card').filter({ hasText: 'Renamed' }).click();
  await page.getByLabel('Walkthrough title').waitFor();
  await page.waitForTimeout(600);
  assert.equal((await read()).localEditedAt, saved.localEditedAt);
  await page.getByLabel('Walkthrough title').fill('Edited in editor');
  await page.waitForFunction(async (previous) => {
    const p = await (await import('/src/db.ts')).get('projects', 'rename-test');
    return p.title === 'Edited in editor' && p.localEditedAt > previous;
  }, saved.localEditedAt);
  console.log(
    'Library rename: validation, failed save/retry, focus, sorting, filenames, and edit-only timestamps passed.',
  );
} finally {
  await browser.close();
  await server.close();
}

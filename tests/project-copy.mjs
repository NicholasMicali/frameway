import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4187, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const library = async () => {
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('.project-card').first().waitFor();
};
const makeCopy = async (title) => {
  await page.getByLabel(`Options for ${title}`, { exact: true }).click();
  await page.getByRole('button', { name: `Make a copy of ${title}`, exact: true }).click();
};
const remove = async (title) => {
  await page.getByLabel(`Options for ${title}`, { exact: true }).click();
  await page.getByRole('button', { name: `Delete ${title}`, exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
  await page.getByText('Deleting project…', { exact: true }).waitFor({ state: 'hidden' });
};
try {
  await page.goto('http://127.0.0.1:4187');
  await page.evaluate(async () => {
    const { sampleProject } = await import('/src/sample.ts');
    const { saveProject, put } = await import('/src/db.ts');
    const p = await sampleProject();
    p.id = 'original';
    p.title = 'Customer demo';
    p.localRevision = 'original-revision';
    p.localBackup = { revision: p.localRevision, exportedAt: Date.now() };
    p.theme = 'custom';
    p.customColor = '#123456';
    p.steps[0].target = p.steps[2].id;
    await saveProject(p);
    await put('sessions', { id: 'capture', projectId: p.id, status: 'complete', chunkCount: 1 });
    await put('chunks', p.video, 'capture:0');
  });
  // Reload the library, then simulate an aborted write transaction.
  await page.reload();
  await page.locator('.project-card').waitFor();
  await page.getByLabel('Options for Customer demo', { exact: true }).click();
  await page.screenshot({ path: 'test-results/project-copy-menu.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const write = IDBObjectStore.prototype.put;
    window.abortCopy = true;
    IDBObjectStore.prototype.put = function (...args) {
      const request = write.apply(this, args);
      if (this.name === 'projects' && window.abortCopy) this.transaction.abort();
      return request;
    };
  });
  await makeCopy('Customer demo');
  await page.getByText(/Could not make a copy/).waitFor();
  assert.equal(await page.locator('.project-card').count(), 1);
  assert.equal(
    await page.evaluate(async () => (await (await import('/src/db.ts')).all('projects')).length),
    1,
  );
  await page.evaluate(() => {
    window.abortCopy = false;
  });
  await makeCopy('Customer demo');
  await page.getByLabel('Walkthrough title').waitFor();
  assert.equal(await page.getByLabel('Walkthrough title').inputValue(), 'Customer demo (copy)');
  const copyId = await page.evaluate(async () => {
    const { all } = await import('/src/db.ts');
    const projects = await all('projects');
    const original = projects.find((p) => p.id === 'original');
    const copy = projects.find((p) => p.id !== 'original');
    const digest = async (blob) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())),
      ).join(',');
    if ((await digest(original.video)) !== (await digest(copy.video))) throw Error('Video changed');
    for (let i = 0; i < original.steps.length; i++) {
      if ((await digest(original.steps[i].image)) !== (await digest(copy.steps[i].image)))
        throw Error('Screenshot changed');
    }
    if (copy.localBackup || copy.steps[0].target !== copy.steps[2].id)
      throw Error('Copy bookkeeping or branch invalid');
    if (copy.customColor !== original.customColor) throw Error('Branding changed');
    return copy.id;
  });
  await page.getByLabel('Callout headline').fill('Only in the copy');
  await library();
  await makeCopy('Customer demo');
  assert.equal(await page.getByLabel('Walkthrough title').inputValue(), 'Customer demo (copy 2)');
  await library();
  await remove('Customer demo (copy 2)');
  assert.equal(
    await page.evaluate(
      async () => (await (await import('/src/db.ts')).get('projects', 'original')).title,
    ),
    'Customer demo',
  );
  await remove('Customer demo');
  assert.equal(
    await page.evaluate(async () => (await (await import('/src/db.ts')).all('sessions')).length),
    0,
  );
  await page.reload();
  await page.locator('.project-card').click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Only in the copy');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await page.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await page.getByRole('button', { name: '✎ Edit' }).click();
  const exportFile = async (button, file) => {
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: button, exact: true }).click();
    await (await pending).saveAs(file);
    await page.getByText('Download started — check your downloads', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close export' }).click();
  };
  const html = path.resolve('test-results/project-copy.html');
  const zip = path.resolve('test-results/project-copy.frameway.zip');
  await exportFile('Download HTML', html);
  await exportFile('Export project backup', zip);
  const offline = await browser.newContext({ offline: true });
  const viewer = await offline.newPage();
  await viewer.goto(pathToFileURL(html).href);
  await viewer.getByRole('button', { name: 'Get started', exact: true }).click();
  await viewer.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await offline.close();
  await page.locator('input[accept=".zip"]').setInputFiles(zip);
  await page.getByText('Importing walkthrough…').waitFor({ state: 'hidden' });
  await page.waitForFunction((id) => !location.hash.includes(id), copyId);
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Only in the copy');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: copy action, aborted-save recovery, independent edits/deletion, preserved media/branding/branches, unique names, preview, offline HTML and backup/import.',
  );
} finally {
  await browser.close();
  await server.close();
}

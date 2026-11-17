import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { openSample } from './sample-fixture.mjs';
// Entire extension and profile live in a disposable directory. Never use real Chrome storage.
const root = await mkdtemp(path.join(tmpdir(), 'frameway-update-'));
const extension = path.join(root, 'extension');
const profile = path.join(root, 'profile');
const server = await createServer({ server: { host: '127.0.0.1', port: 4199, strictPort: true } });
let generator, context;
try {
  await server.listen();
  generator = await chromium.launch({ headless: true });
  const source = await generator.newPage();
  await source.goto('http://127.0.0.1:4199');
  const fixture = await openSample(source);
  await generator.close();
  generator = undefined;
  await cp('dist', extension, { recursive: true });
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
  context = await launch();
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  const remote = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url())) remote.push(r.url());
  });
  await page.goto(`chrome-extension://${id}/index.html`);
  await page.locator('input[type=file][accept=".zip"]').setInputFiles({
    name: 'synthetic.frameway.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(fixture),
  });
  await page.getByLabel('Title description').waitFor();
  await page.getByRole('button', { name: 'Add closing slide', exact: true }).click();
  await page.getByLabel('Closing description').fill('Saved across update');
  await page.waitForTimeout(800);
  const url = page.url();
  await context.close();
  context = undefined;
  const manifestFile = path.join(extension, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.version = '0.4.1'; // Only the disposable copy changes; simulate a successive build.
  await writeFile(manifestFile, JSON.stringify(manifest));
  context = await launch();
  const updatedWorker =
    context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  assert.equal(new URL(updatedWorker.url()).host, id);
  const restored = await context.newPage();
  await restored.goto(url);
  await restored.locator('.step-list .step').last().click();
  assert.equal(
    await restored.getByLabel('Closing description').inputValue(),
    'Saved across update',
  );
  assert.equal(await restored.locator('.step-list .step').count(), 8);
  assert.deepEqual(remote, []);
  console.log(
    'PASS packaged extension imports, edits, persists through same-path version update, and makes no HTTP(S) app requests. Actual Store delivery remains a post-publication check.',
  );
} finally {
  await context?.close();
  await generator?.close();
  await server.close();
  await rm(root, { recursive: true, force: true });
}

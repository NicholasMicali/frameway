import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4173, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1050 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
try {
  await page.goto('http://127.0.0.1:4173');
  await page.getByText('Opening your studio…').waitFor({ state: 'hidden' });
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Delete step', exact: true }).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Opening footage');
  assert.equal(await page.locator('.step-list .step').count(), 6);
  await page.locator('.step-list .step').nth(1).click();
  await page.screenshot({ path: 'test-results/editor.png', fullPage: true });
  const hotspot = page.getByRole('button', { name: 'Hotspot', exact: true });
  const before = await hotspot.getAttribute('style');
  const box = await hotspot.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 40, box.y + 40, { steps: 8 });
  await page.mouse.up();
  assert.notEqual(await hotspot.getAttribute('style'), before);
  await page.getByLabel('Callout headline').fill('Create something great');
  await page
    .getByLabel('Callout body')
    .fill('A short, useful callout attached to your first click.');
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  await page.locator('.step-list .step').nth(1).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Create something great');
  await page.getByLabel('Open by default').uncheck();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Create something great' }).count(), 0);
  await page.getByRole('button', { name: 'Hotspot', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page.getByText('Playing video').waitFor();
  await page.getByRole('heading', { name: 'Give your project a home' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page.getByRole('heading', { name: 'You’re all set' }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: 'test-results/player.png', fullPage: true });
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByText('Playing video').waitFor();
  await page.getByRole('heading', { name: 'You’re all set' }).waitFor();
  await page.getByRole('button', { name: '↺ Restart' }).click();
  await page.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.getByLabel('Video scrubber').fill('0.5');
  await page.getByRole('button', { name: 'Use this frame as still' }).click();
  await page.getByText('Extracting still frame…').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project' }).click();
  await page.getByText('Download started — check your downloads', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close export' }).click();
  const download = await downloadPromise;
  await download.saveAs('test-results/roundtrip.zip');
  await page.locator('input[type=file][accept=".zip"]').setInputFiles('test-results/roundtrip.zip');
  await page.getByText('Importing walkthrough…').waitFor({ state: 'hidden' });
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Opening footage');
  await page.locator('.step-list .step').nth(1).click();
  assert.equal(await page.getByLabel('Open by default').isChecked(), false);
  await page.getByLabel('Overlay style').selectOption('callout');
  assert.equal(await page.getByRole('button', { name: 'Hotspot', exact: true }).count(), 0);
  await page.getByLabel('Move step down').click();
  assert.equal(await page.locator('.step-list .step.selected .clip-pill').textContent(), '▧ image');
  await page.getByRole('button', { name: 'Delete step', exact: true }).click();
  assert.equal(await page.locator('.step-list .step').count(), 5);
  await page.getByLabel('Autoplay video').uncheck();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: '▶ Play clip' }).waitFor();
  assert.equal(await page.getByText('Playing video').count(), 0);
  await page.getByRole('button', { name: '▶ Play clip' }).click();
  await page.getByText('Playing video').waitFor();
  await page.getByRole('heading', { name: 'Give your project a home' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.locator('.step-list .step').nth(2).click();
  await page.setViewportSize({ width: 900, height: 850 });
  await page.screenshot({ path: 'test-results/editor-compact.png', fullPage: true });
  const cardBox = await page.locator('.callout').boundingBox(),
    stageBox = await page.locator('.stage').boundingBox();
  assert.ok(
    cardBox.y + cardBox.height <= stageBox.y + stageBox.height + 1,
    'Card stays inside the compact stage',
  );
  // Seed a genuine v1 stored project using the generated assets, then exercise migration in the app.
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('frameway', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const p = await new Promise((resolve) => {
      const r = db.transaction('projects').objectStore('projects').getAll();
      r.onsuccess = () => resolve(r.result[0]);
    });
    const images = p.steps.filter((s) => s.kind === 'image');
    const base = images[0];
    const steps = ['legacy-a', 'legacy-b', 'legacy-c'].map((id, i) => ({
      ...base,
      id,
      title: ['Migration first', 'Skipped image', 'Migration destination'][i],
      transition: i === 0,
      clipStart: 0,
      clipEnd: 0.2,
      target: i === 0 ? 'legacy-c' : i === 2 ? 'end' : 'next',
    }));
    await new Promise((resolve, reject) => {
      const t = db.transaction('projects', 'readwrite');
      t.objectStore('projects').put({
        ...p,
        id: 'legacy-fixture',
        schemaVersion: 1,
        createdAt: Date.now() + 1000,
        steps,
      });
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
    db.close();
  });
  await page.evaluate(() => {
    location.hash = 'project/legacy-fixture';
  });
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Migration first');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page.getByRole('heading', { name: 'Migration destination' }).waitFor({ timeout: 10000 });
  assert.equal(await page.getByRole('heading', { name: 'Skipped image' }).count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: sample media, editing, save/reload, still/video playback, restart, frame extraction, binary archive roundtrip, reorder, delete, compact layout, stored v1 migration and explicit branching.',
  );
} catch (e) {
  await page.screenshot({ path: 'test-results/failure.png', fullPage: true });
  throw e;
} finally {
  await browser.close();
  await server.close();
}

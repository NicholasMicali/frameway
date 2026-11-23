import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { unzipSync } from 'fflate';
const server = await createServer({ server: { host: '127.0.0.1', port: 4191, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const outputDir = 'test-results/presentation-frame';
await mkdir(outputDir, { recursive: true });
const open = () => page.getByText('Project settings', { exact: true }).click();
const frame = page.locator('.stage-wrap > .presentation-frame');
const geometry = async (target) =>
  target.evaluate((el) => {
    const outer = el.getBoundingClientRect(),
      inner = el.querySelector('.stage').getBoundingClientRect();
    return {
      ratio: inner.width / inner.height,
      outerRatio: outer.width / outer.height,
      insetX: (inner.x - outer.x) / outer.width,
      insetY: (inner.y - outer.y) / outer.height,
    };
  });
try {
  await page.goto('http://127.0.0.1:4191');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.locator('.step').nth(2).click();
  assert.equal(await frame.getAttribute('data-framed'), 'false');
  await page.screenshot({
    path: `${outputDir}/before.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await open();
  await page.getByRole('combobox', { name: 'Presentation frame', exact: true }).selectOption('gradient');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(await frame.getAttribute('data-framed'), 'false');
  await open();
  await page.getByRole('combobox', { name: 'Presentation frame', exact: true }).selectOption('gradient');
  await page.getByLabel('Frame spacing', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Apply appearance', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.stage-wrap > .presentation-frame').dataset.framed === 'true',
  );
  const g = await geometry(frame);
  assert.ok(Math.abs(g.ratio - g.outerRatio) < 0.01, 'frame preserves aspect ratio');
  assert.ok(Math.abs(g.insetX - 0.06) < 0.002 && Math.abs(g.insetY - 0.06) < 0.002);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await frame.getAttribute('data-framed'), 'false');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  // Check drag coordinates use the inset stage, not the outer frame.
  const hotspot = await page.getByRole('button', { name: 'Hotspot', exact: true }).boundingBox();
  const stage = await page.locator('.stage').boundingBox();
  await page.mouse.move(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * 0.4, stage.y + stage.height * 0.45, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${outputDir}/editor.png`,
    fullPage: true,
    animations: 'disabled',
  });
  const exported = await page.evaluate(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    const { exportProject, importProject } = await import('/src/archive.ts');
    const restored = await importProject(await exportProject(p));
    const { exportInteractive } = await import('/src/interactive-export.ts');
    return {
      appearance: restored.appearance,
      point: p.steps[2],
      html: await (await exportInteractive(restored, 'html')).text(),
      zip: Array.from(
        new Uint8Array(await (await exportInteractive(restored, 'zip')).arrayBuffer()),
      ),
    };
  });
  assert.equal(exported.appearance.frameStyle, 'gradient');
  assert.equal(exported.appearance.framePadding, 6);
  assert.ok(Math.abs(exported.point.x - 0.4) < 0.02 && Math.abs(exported.point.y - 0.45) < 0.02);
  await page.reload();
  await page.locator('.step').nth(2).click();
  assert.equal(await frame.getAttribute('data-framed'), 'true');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  assert.ok(Math.abs((await geometry(frame)).insetX - 0.06) < 0.002);
  await page.screenshot({
    path: `${outputDir}/preview.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await writeFile(`${outputDir}/index.html`, exported.html);
  const files = unzipSync(new Uint8Array(exported.zip));
  for (const [name, bytes] of Object.entries(files)) {
    const file = path.join(outputDir, 'embed', name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }
  const viewer = await browser.newPage();
  viewer.on('pageerror', (e) => errors.push(e.message));
  await viewer.context().setOffline(true);
  for (const file of ['index.html', 'embed/index.html']) {
    await viewer.goto(pathToFileURL(path.resolve(outputDir, file)).href);
    const shell = viewer.locator('.presentation-frame');
    assert.equal(await shell.getAttribute('data-framed'), 'false', 'title is not framed');
    await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
    assert.equal(await shell.getAttribute('data-framed'), 'true');
    assert.ok(Math.abs((await geometry(shell)).insetX - 0.06) < 0.002);
    await viewer.setViewportSize({ width: 390, height: 844 });
    const mobile = await geometry(shell);
    assert.ok(Math.abs(mobile.insetX - 0.06) < 0.002);
    // Mobile intentionally stacks the readable primary card below the recording.
    const screenRatio = await viewer
      .locator('.screen')
      .evaluate((el) => el.clientWidth / el.clientHeight);
    assert.ok(Math.abs(screenRatio - 1.6) < 0.02);
    assert.equal(
      await viewer.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await viewer.screenshot({
      path: `${outputDir}/${file.includes('embed') ? 'embed' : 'html'}-mobile.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS presentation frame: defaults, draft/cancel, apply/undo, geometry, dragging, persistence, backup, preview, offline HTML/embed and mobile.',
  );
} finally {
  await browser.close();
  await server.close();
}

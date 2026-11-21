import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const server = await createServer({ server: { host: '127.0.0.1', port: 4191, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await mkdir('test-results/elements', { recursive: true });
try {
  await page.goto('http://127.0.0.1:4191');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.locator('.step').nth(2).click();
  const add = page.getByRole('group', { name: 'Add element', exact: true });
  await add.getByRole('button', { name: 'Tip', exact: true }).click();
  await page.getByLabel('Element title').fill('A useful tip');
  await page.getByLabel('Element description').fill('This does not advance the walkthrough.');
  await page.getByLabel('Element description').press('Backspace');
  assert.equal(await page.locator('.extra-panel').count(), 1, 'typing must not delete elements');
  // A narrow desktop editor canvas must not use the mobile reader width override.
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.getByLabel('Element width').fill('0.2');
  // Read both boxes in one browser task after the requested width has rendered.
  // React may replace the element between separate locator measurements.
  const measureWidth = async (ratio) => {
    const result = await page.waitForFunction((expected) => {
      const item = document.querySelector('.extra-item');
      const layer = document.querySelector('.extra-layer');
      if (!item || !layer) return false;
      const width = item.getBoundingClientRect().width;
      const canvas = layer.getBoundingClientRect().width;
      return canvas > 0 && Math.abs(width - canvas * expected) < 2 ? { width, canvas } : false;
    }, ratio);
    return result.jsonValue();
  };
  const { width: smallWidth, canvas: canvasWidth } = await measureWidth(0.2);
  assert.ok(canvasWidth < 600);
  assert.ok(Math.abs(smallWidth - canvasWidth * 0.2) < 2);
  await page.getByLabel('Element width').fill('0.4');
  const { width: largeWidth } = await measureWidth(0.4);
  assert.ok(
    largeWidth > smallWidth * 1.8,
    'width control must resize cards on narrow desktop canvases',
  );
  await page.getByLabel('Element width').fill('0.28');
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Drag by the heading and verify the new position survives selection rerenders.
  await page.waitForTimeout(400);
  const heading = page.locator('.extra-heading');
  await heading.waitFor({ state: 'visible' });
  const before = await heading.boundingBox();
  await page.mouse.move(before.x + 20, before.y + 10);
  await page.mouse.down();
  await page.mouse.move(before.x + 120, before.y + 70, { steps: 5 });
  await page.mouse.up();
  const after = await heading.boundingBox();
  assert.ok(after.x > before.x + 50);
  await page.getByLabel('Element title').blur();
  await page.keyboard.press('Delete');
  await page.locator('.extra-panel').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.extra-panel').count(), 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await page.locator('.extra-panel').count(), 1);
  await page.locator('.extra-panel').waitFor();
  await add.getByRole('button', { name: 'Arrow', exact: true }).click();
  assert.equal(await page.locator('.extra-arrow').count(), 1);
  const expectAnimation = async (selector, property, expected, pseudo = null) => {
    const result = await page.waitForFunction(
      ({ selector, property, expected, pseudo }) => {
        const el = document.querySelector(selector);
        if (!el?.isConnected) return false;
        const value = getComputedStyle(el, pseudo)[property];
        return value === expected ? value : false;
      },
      { selector, property, expected, pseudo },
    );
    assert.equal(await result.jsonValue(), expected);
  };
  await expectAnimation('.extra-arrow-stem', 'animationIterationCount', 'infinite');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectAnimation('.extra-arrow-stem', 'animationName', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.getByLabel('Element title').fill('Look here');
  const endpoint = page.getByRole('button', { name: 'Look here end' });
  await endpoint.waitFor({ state: 'visible' });
  const box = await endpoint.boundingBox();
  await page.mouse.move(box.x + 9, box.y + 9);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 70, { steps: 5 });
  await page.mouse.up();
  await page.screenshot({ path: 'test-results/elements/editor.png', fullPage: true });
  await page.getByRole('button', { name: 'Slide & navigation', exact: true }).click();
  assert.equal(await page.getByLabel('Overlay style').isVisible(), true);
  assert.equal(await page.getByLabel('Navigation target').isVisible(), false);
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  assert.equal(await page.getByLabel('Navigation target').isVisible(), true);
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await expectAnimation('.extra-trigger', 'animationName', 'extra-icon-pulse', '::after');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectAnimation('.extra-trigger', 'animationName', 'none', '::after');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.getByRole('button', { name: 'Open tip: A useful tip' }).click();
  await page.getByRole('button', { name: 'Close A useful tip' }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: /^Go to step 3:/ }).getAttribute('aria-current'),
    'step',
  );
  await page.getByRole('button', { name: 'Close A useful tip' }).click();
  await page.getByRole('button', { name: 'Open tip: A useful tip' }).waitFor();
  await page.screenshot({ path: 'test-results/elements/preview.png', fullPage: true });
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.waitForTimeout(700);
  // This page is a fresh disposable browser profile containing only the generated fixture.
  const output = await page.evaluate(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    const { exportProject, importProject } = await import('/src/archive.ts');
    const backup = await exportProject(p);
    const restored = await importProject(backup);
    const { exportInteractive } = await import('/src/interactive-export.ts');
    return {
      elements: restored.steps.flatMap((s) => s.elements ?? []),
      html: await (await exportInteractive(restored, 'html')).text(),
      backup: Array.from(new Uint8Array(await backup.arrayBuffer())),
    };
  });
  assert.equal(output.elements.length, 2);
  await writeFile('test-results/elements/index.html', output.html);
  const viewer = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  viewer.on('pageerror', (e) => errors.push(String(e)));
  await viewer.context().setOffline(true);
  await viewer.goto(pathToFileURL(path.resolve('test-results/elements/index.html')).href);
  await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
  await viewer.getByRole('button', { name: 'Open tip: A useful tip' }).click();
  await viewer.getByRole('button', { name: 'Close A useful tip' }).waitFor();
  assert.equal(await viewer.locator('.extra-arrow').count(), 1);
  await viewer.setViewportSize({ width: 390, height: 844 });
  await viewer.screenshot({
    animations: 'disabled',
    path: 'test-results/elements/mobile.png',
    fullPage: true,
  });
  const panel = await viewer.locator('.extra-panel').boundingBox();
  assert.ok(panel.x >= 0 && panel.x + panel.width <= 390);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: add/select/drag, safe Delete, undo, advanced sidebar, preview expansion, backup roundtrip, offline player and narrow layout.',
  );
} finally {
  await browser.close();
  await server.close();
}

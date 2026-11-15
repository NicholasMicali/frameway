import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/timeline', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4193, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  await page.goto('http://127.0.0.1:4193');
  await openSample(page);
  await page.evaluate(async () => {
    const db = await import('/src/db.ts');
    const p = await db.get('projects', location.hash.split('/')[1]);
    p.duration = 60;
    p.steps[1].clipStart = 2;
    p.steps[1].clipEnd = 3;
    await db.put('projects', p);
  });
  await page.reload();
  await page.locator('.step-list .step').nth(1).click();
  await page
    .getByRole('button', { name: 'Fit selected clip', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/timeline/full.png' });
  await page.getByRole('button', { name: 'Fit selected clip', exact: true }).click();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const viewport = page.locator('.timeline-viewport');
  assert.ok((await viewport.evaluate((e) => e.scrollWidth / e.clientWidth)) > 40);
  assert.equal(await page.getByLabel('Clip start', { exact: true }).inputValue(), '2');
  assert.equal(await page.getByLabel('Clip end', { exact: true }).inputValue(), '3');
  const track = page.locator('.clip-track');
  await viewport.scrollIntoViewIfNeeded();
  const view = await viewport.boundingBox();
  const box = await track.boundingBox();
  const x = view.x + view.width / 2;
  await page.mouse.click(x, box.y + box.height / 2);
  const expected = ((x - box.x) / box.width) * 60;
  const actual = Number(await page.getByLabel('Video scrubber', { exact: true }).inputValue());
  assert.ok(Math.abs(expected - actual) < 0.1, `${expected} vs ${actual}`);
  const start = page.getByRole('slider', { name: 'Trim start', exact: true });
  await start.focus();
  await page.keyboard.press('ArrowRight');
  assert.ok(
    Math.abs(Number(await page.getByLabel('Clip start', { exact: true }).inputValue()) - 2.05) <
      0.001,
  );
  const handleBox = await start.boundingBox();
  const trackBox = await track.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 20,
    handleBox.y + handleBox.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  const dragged = Number(await page.getByLabel('Clip start', { exact: true }).inputValue());
  assert.ok(Math.abs(dragged - (2.05 + (20 / trackBox.width) * 60)) < 0.01);
  await page.getByLabel('Clip start', { exact: true }).fill('2.05');
  await page.getByRole('button', { name: 'Fit selected clip', exact: true }).click();
  await page.screenshot({ path: 'test-results/timeline/fit.png' });
  await viewport.evaluate((e) => (e.scrollLeft = e.scrollWidth));
  await page.getByRole('button', { name: 'Show playhead', exact: true }).click();
  const playhead = await page.locator('.timeline-playhead').boundingBox();
  const visible = await viewport.boundingBox();
  assert.ok(playhead.x >= visible.x && playhead.x < visible.x + visible.width);
  await page.setViewportSize({ width: 700, height: 900 });
  await page.getByRole('button', { name: 'Fit selected clip', exact: true }).click();
  await page.getByRole('button', { name: 'Show full video', exact: true }).click();
  assert.ok(await viewport.evaluate((e) => Math.abs(e.scrollWidth - e.clientWidth) < 3));
  assert.ok(
    Math.abs(Number(await page.getByLabel('Clip start', { exact: true }).inputValue()) - 2.05) <
      0.001,
  );
  console.log(
    'PASS timeline fit, zoom/scroll mapping, playhead recovery, keyboard trim, resize and unchanged trims.',
  );
} finally {
  await browser.close();
  await server.close();
}

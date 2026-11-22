import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
await mkdir('test-results/video-export', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4199, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:4199');
  await page.getByText('Opening your studio…').waitFor({ state: 'hidden' });
  await page.waitForTimeout(700);
  await openSample(page);
  // Disposable fixture only: include an additional arrow, generic card, a closed info card,
  // a closing slide, and a loop target. Video always uses library order once.
  const expected = await page.evaluate(async () => {
    const db = await import('/src/db.ts'),
      model = await import('/src/model.ts');
    let p = await db.get('projects', location.hash.split('/')[1]);
    const { newElement } = await import('/src/slide-elements.ts');
    p.appearance = { ...p.appearance, frameStyle: 'soft', framePadding: 6 };
    const image = p.steps.find((s) => s.kind === 'image');
    image.body =
      'Keep **complete words** together when wrapping. This sentence includes *italic text* and a longer explanation.\n- A list item that wraps naturally to the next line.\n1. Follow the instructions.';
    image.target = p.steps[0].id;
    image.style = 'area';
    image.zoomEnabled = true;
    image.elements = [
      { ...newElement('arrow'), x: 0.05, y: 0.7, endX: 0.3, endY: 0.5 },
      { ...newElement('card'), x: 0.05, y: 0.1, width: 0.25, body: 'Generic context' },
      { ...newElement('info'), x: 0.05, y: 0.7, width: 0.25, body: 'Expanded in video' },
    ];
    p = model.withClosingSlide(p);
    await db.put('projects', p);
    const { videoPlan } = await import('/src/video-export.ts');
    return {
      duration: videoPlan(p, { seconds: 1, durations: {}, width: 1280 }).reduce(
        (n, s) => n + s.seconds,
        0,
      ),
      json: JSON.stringify(p),
    };
  });
  await page.reload();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await page.locator('.share-video > summary').click();
  await page.getByLabel('Seconds per still slide', { exact: true }).fill('1');
  await page.context().setOffline(true);
  await page.getByRole('button', { name: /^Download video/ }).click();
  await page.getByRole('button', { name: 'Cancel video export' }).click();
  await page.getByText('Export cancelled. Your project is unchanged.', { exact: true }).waitFor();
  const download = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: /^Download video/ }).click();
  await page.waitForFunction(() =>
    document.querySelector('.video-export [role=status]')?.textContent.includes('slide 3'),
  );
  await page.waitForTimeout(400);
  assert.deepEqual(
    await page
      .locator('canvas')
      .evaluate((c) => Array.from(c.getContext('2d').getImageData(1, 1, 1, 1).data)),
    [237, 243, 248, 255],
    'video frame background is rendered',
  );
  await page.locator('canvas').screenshot({ path: 'test-results/video-export/text.png' });
  await page.screenshot({ path: 'test-results/video-export/rendering.png', fullPage: true });
  const file = await download;
  assert.ok(file.suggestedFilename().startsWith('A better first impression.'));
  const filename = path.resolve('test-results/video-export', file.suggestedFilename());
  await file.saveAs(filename);
  await page
    .getByText('Video downloaded. Your editable project is unchanged.', { exact: true })
    .waitFor();
  assert.equal(
    await page.evaluate(async () =>
      JSON.stringify(
        await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]),
      ),
    ),
    expected.json,
  );
  const player = await browser.newPage();
  await player.goto(pathToFileURL(filename).href);
  await player.locator('video').waitFor();
  const metadata = await player.locator('video').evaluate(async (video) => {
    if (video.readyState < 1)
      await new Promise((resolve) =>
        video.addEventListener('loadedmetadata', resolve, { once: true }),
      );
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  });
  assert.ok(metadata.width <= 1280 && metadata.height <= 720);
  assert.ok(Math.abs(metadata.width / metadata.height - 1.6) < 0.01);
  assert.ok(
    Math.abs(metadata.duration - expected.duration) < 1,
    JSON.stringify({ metadata, expected: expected.duration }),
  );
  await player.locator('video').evaluate(async (v) => {
    v.muted = true;
    await v.play();
  });
  await player.waitForTimeout(400);
  assert.ok(await player.locator('video').evaluate((v) => v.currentTime > 0));
  await player.screenshot({ path: 'test-results/video-export/playback.png' });
  await player.close();
  await page.bringToFront();
  await page.evaluate(() => {
    const original = MediaRecorder.isTypeSupported.bind(MediaRecorder);
    MediaRecorder.isTypeSupported = (type) => type.startsWith('video/webm') && original(type);
  });
  const webmDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: /^Download video/ }).click();
  const webm = await webmDownload;
  assert.ok(webm.suggestedFilename().endsWith('.webm'));
  await webm.saveAs(path.resolve('test-results/video-export/fallback.webm'));
  const fallback = await browser.newPage();
  await fallback.goto(pathToFileURL(path.resolve('test-results/video-export/fallback.webm')).href);
  await fallback.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  assert.ok(
    await fallback
      .locator('video')
      .evaluate((video) => Number.isFinite(video.duration) && video.duration > 0),
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS local video export: mixed slides, expanded elements, trimmed clip duration, linear loop handling, cancellation/retry, project unchanged, downloaded file playback.',
    metadata,
  );
} finally {
  await browser.close();
  await server.close();
}

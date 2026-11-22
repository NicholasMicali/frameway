import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
const server = await createServer({ server: { host: '127.0.0.1', port: 4192, strictPort: true } });
await server.listen();
const browser = await chromium.launch({
  args: ['--autoplay-policy=document-user-activation-required'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const dir = 'test-results/music';
await mkdir(dir, { recursive: true });
const settings = () => page.getByText('Project settings', { exact: true }).click();
try {
  await page.goto('http://127.0.0.1:4192');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await settings();
  assert.equal(await page.getByLabel('Enable background music').isChecked(), false);
  await page.getByLabel('Enable background music').check();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await settings();
  assert.equal(await page.getByLabel('Enable background music').isChecked(), false);
  await page.getByLabel('Enable background music').check();
  await page.getByLabel('Music volume', { exact: true }).fill('25');
  await page.screenshot({ path: `${dir}/settings.png`, fullPage: true });
  await page.getByRole('button', { name: 'Apply appearance', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await settings();
  assert.equal(await page.getByLabel('Enable background music').isChecked(), false);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByRole('button', { name: /^Go to step 3:/ }).click();
  await page.waitForFunction(() => {
    const a = document.querySelector('.walkthrough-music');
    return a && !a.paused && a.currentTime > 0.1;
  });
  assert.equal(await page.locator('audio').count(), 1);
  const initial = await page.locator('audio').evaluate((a) => {
    a.dataset.instance = 'original';
    return { volume: a.volume, loop: a.loop };
  });
  assert.deepEqual(initial, { volume: 0.25, loop: true });
  await page.getByRole('button', { name: /^Go to step 3:/ }).click();
  assert.equal(await page.locator('audio').getAttribute('data-instance'), 'original');
  await page.getByRole('button', { name: 'Mute background music', exact: true }).click();
  assert.equal(await page.locator('audio').evaluate((a) => a.muted), true);
  await page.getByRole('button', { name: 'Unmute background music', exact: true }).click();
  await page.waitForFunction(() => {
    const a = document.querySelector('audio');
    return !a.paused && !a.muted && a.duration > 100;
  });
  await page.locator('audio').evaluate((a) => {
    a.currentTime = a.duration - 0.15;
  });
  await page.waitForFunction(() => document.querySelector('audio').currentTime < 2);
  await page.getByRole('button', { name: '✎ Edit' }).click();
  assert.equal(await page.locator('audio').count(), 0);
  await page.waitForTimeout(700);
  const output = await page.evaluate(async () => {
    const { get } = await import('/src/db.ts');
    const { exportProject, importProject } = await import('/src/archive.ts');
    const { exportInteractive } = await import('/src/interactive-export.ts');
    const { copyProject } = await import('/src/model.ts');
    const p = await get('projects', location.hash.split('/')[1]);
    const restored = await importProject(await exportProject(p));
    const html = await (await exportInteractive(restored, 'html')).text();
    const zip = Array.from(
      new Uint8Array(await (await exportInteractive(restored, 'zip')).arrayBuffer()),
    );
    return { music: restored.music, copied: copyProject(p).music, html, zip };
  });
  assert.deepEqual(output.music, { enabled: true, track: 'exploration-theme', volume: 0.25 });
  assert.deepEqual(output.copied, output.music);
  await writeFile(`${dir}/index.html`, output.html);
  for (const [name, bytes] of Object.entries(unzipSync(new Uint8Array(output.zip)))) {
    const file = path.join(dir, 'embed', name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }
  const viewer = await browser.newPage();
  viewer.setDefaultTimeout(15000);
  viewer.on('pageerror', (e) => errors.push(e.message));
  await viewer.context().setOffline(true);
  for (const name of ['index.html', 'embed/index.html']) {
    await viewer.goto(pathToFileURL(path.resolve(dir, name)).href);
    await viewer.locator('.music-toggle').click();
    await viewer.waitForFunction(() => {
      const a = document.querySelector('audio');
      return a && !a.paused && !a.muted && a.currentTime > 0.1;
    });
    assert.equal(await viewer.locator('audio').evaluate((a) => a.loop), true);
    await viewer.getByRole('button', { name: 'Mute background music', exact: true }).click();
    await viewer.getByRole('button', { name: /^Go to step 3:/ }).click();
    assert.equal(await viewer.locator('audio').count(), 1);
    assert.equal(await viewer.locator('audio').evaluate((a) => a.muted), true);
  }
  await viewer.close();
  // Native encoding must actually include decodable, non-silent audio, not just UI state.
  const encoded = await page.evaluate(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    const { exportVideo } = await import('/src/video-export.ts');
    const canvas = document.createElement('canvas');
    const single = { ...p, steps: [p.steps.find((s) => s.kind === 'image')] };
    const controller = new AbortController();
    let cancelled = false;
    try {
      await exportVideo(
        single,
        { width: 1280, seconds: 3, durations: {} },
        canvas,
        controller.signal,
        () => controller.abort(),
      );
    } catch (e) {
      cancelled = e.name === 'AbortError';
    }
    const supports = MediaRecorder.isTypeSupported.bind(MediaRecorder);
    const outputs = [];
    try {
      for (const forceWebm of [false, true]) {
        MediaRecorder.isTypeSupported = (mime) =>
          (!forceWebm || mime.startsWith('video/webm')) && supports(mime);
        const result = await exportVideo(
          single,
          { width: 1280, seconds: 3, durations: {} },
          canvas,
          new AbortController().signal,
          () => {},
        );
        const context = new AudioContext();
        try {
          const decoded = await context.decodeAudioData(await result.blob.arrayBuffer());
          let peak = 0;
          for (const value of decoded.getChannelData(0)) peak = Math.max(peak, Math.abs(value));
          outputs.push({
            peak,
            duration: decoded.duration,
            bytes: Array.from(new Uint8Array(await result.blob.arrayBuffer())),
            extension: result.extension,
          });
        } finally {
          await context.close();
        }
      }
    } finally {
      MediaRecorder.isTypeSupported = supports;
    }
    return { cancelled, outputs };
  });
  assert.equal(encoded.cancelled, true);
  assert.equal(encoded.outputs[1].extension, 'webm');
  for (const output of encoded.outputs) {
    assert.ok(output.peak > 0.001, 'soundtrack is audible in encoded output');
    assert.ok(output.duration > 2.5 && output.duration < 4, 'audio matches video length');
    await writeFile(`${dir}/with-music.${output.extension}`, new Uint8Array(output.bytes));
  }
  await page.reload();
  await settings();
  assert.equal(await page.getByLabel('Enable background music').isChecked(), true);
  assert.equal(await page.getByLabel('Music volume', { exact: true }).inputValue(), '25');
  assert.deepEqual(errors, []);
  console.log(
    'PASS music: opt-in, draft/undo, one looping player, mute/navigation, cleanup, backup/copy, offline HTML/embed, native encoded audio and cancellation/retry.',
  );
} finally {
  await browser.close();
  await server.close();
}

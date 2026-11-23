import { chromium } from 'playwright';
import { createServer } from 'vite';
import { openSample } from './sample-fixture.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const server = await createServer({ server: { host: '127.0.0.1', port: 4193, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('test-results/music-library', { recursive: true });
try {
  await page.goto('http://127.0.0.1:4193');
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  await page.getByText('Project settings', { exact: true }).click();
  assert.deepEqual(
    await page.getByLabel('Music track', { exact: true }).locator('option').allTextContents(),
    ['Exploration', 'Daylight', 'Lo-fi Focus', 'Sunrise'],
  );
  for (const id of ['daylight', 'lofi-focus', 'sunrise']) {
    await page.getByLabel('Music track', { exact: true }).selectOption(id);
    await page.getByLabel('Music preview', { exact: true }).evaluate(async (a) => {
      await a.play();
    });
    await page.waitForFunction(() => {
      const a = document.querySelector('audio[aria-label="Music preview"]');
      return a && a.currentTime > 0 && a.duration > 60;
    });
  }
  await page.screenshot({ path: 'test-results/music-library/settings.png' });
  await page.getByRole('button', { name: 'Apply appearance', exact: true }).click();
  await page.waitForTimeout(700);
  await page.getByText('Saved locally', { exact: true }).waitFor();
  await page.waitForFunction(async () => {
    const p = await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]);
    return p?.music?.track === 'sunrise';
  });
  await page.reload();
  await page.getByLabel('Callout headline').waitFor();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.waitForFunction(() =>
    document.querySelector('.walkthrough-music')?.src.endsWith('/sunrise.mp3'),
  );
  await page.getByLabel('Music credits', { exact: true }).click();
  assert.match(
    await page.locator('.music-credits').textContent(),
    /Adding the Sun.*Kevin MacLeod/s,
  );
  assert.equal(
    await page.locator('.music-credits a').last().getAttribute('href'),
    'https://creativecommons.org/licenses/by/4.0/',
  );
  const output = await page.evaluate(async () => {
    const { get } = await import('/src/db.ts');
    const { exportProject, importProject } = await import('/src/archive.ts');
    const { exportInteractive } = await import('/src/interactive-export.ts');
    const { exportVideo } = await import('/src/video-export.ts');
    const { loadMusic, bundledMusic } = await import('/src/music.ts');
    const { unzipSync, strFromU8 } = await import('/node_modules/fflate/esm/browser.js');
    const saved = await get('projects', location.hash.split('/')[1]);
    const step = saved.steps.find((s) => s.kind === 'image');
    const p = {
      ...saved,
      video: saved.video,
      steps: [{ ...step, target: 'end' }],
      music: { track: 'daylight', enabled: true, volume: 0.2 },
    };
    const restored = await importProject(await exportProject(p));
    const html = await (await exportInteractive(restored, 'html')).text();
    const tracks = [];
    for (const track of Object.keys(bundledMusic)) {
      const project = { ...p, music: { ...p.music, track } };
      const context = new AudioContext();
      const audio = await loadMusic(project);
      const decoded = await context.decodeAudioData(await audio.arrayBuffer());
      await context.close();
      const files = unzipSync(
        new Uint8Array(await (await exportInteractive(project, 'zip')).arrayBuffer()),
      );
      tracks.push({
        track,
        duration: decoded.duration,
        keys: Object.keys(files),
        credits: strFromU8(files['MUSIC-CREDITS.txt']),
      });
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const drawn = [];
    const original = context.fillText.bind(context);
    context.fillText = (text, ...args) => {
      drawn.push(text);
      original(text, ...args);
    };
    const video = await exportVideo(
      p,
      { width: 1280, seconds: 3, durations: {} },
      canvas,
      new AbortController().signal,
      () => {},
    );
    const audioContext = new AudioContext();
    const decoded = await audioContext.decodeAudioData(await video.blob.arrayBuffer());
    await audioContext.close();
    return { html, tracks, drawn, audioDuration: decoded.duration };
  });
  for (const track of output.tracks) {
    assert.ok(track.duration > 60);
    assert.equal(track.keys.filter((k) => k.startsWith('media/music.')).length, 1);
    assert.match(track.credits, /https:\/\/creativecommons.org\//);
    if (['sunrise', 'daylight'].includes(track.track)) assert.match(track.credits, /CC BY 4.0/);
  }
  assert.ok(output.drawn.some((t) => t.includes('Soft Corporate') && t.includes('MusicLFiles')));
  assert.ok(output.drawn.some((t) => t.includes('https://creativecommons.org/licenses/by/4.0/')));
  assert.ok(output.audioDuration > 2.5 && output.audioDuration < 4);
  const file = path.resolve('test-results/music-library/index.html');
  await writeFile(file, output.html);
  const viewer = await browser.newPage();
  await viewer.context().setOffline(true);
  await viewer.goto(pathToFileURL(file).href);
  await viewer.getByLabel('Music credits', { exact: true }).click();
  assert.match(
    await viewer.locator('.music-credits').textContent(),
    /Soft Corporate.*MusicLFiles/s,
  );
  await viewer.waitForFunction(() => {
    const a = document.querySelector('audio');
    return a && !a.paused && a.currentTime > 0;
  });
  await viewer.screenshot({ path: 'test-results/music-library/credits.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    'PASS music library: all tracks preview/decode, persisted selection, selected-only exports, offline attribution, video credits and encoded audio.',
  );
} catch (error) {
  await page.screenshot({ path: 'test-results/music-library/failure.png', fullPage: true });
  console.log(
    await page.evaluate(async () => ({
      audio: [...document.querySelectorAll('audio')].map((a) => a.src),
      music: (await (await import('/src/db.ts')).get('projects', location.hash.split('/')[1]))
        ?.music,
    })),
  );
  throw error;
} finally {
  await browser.close();
  await server.close();
}

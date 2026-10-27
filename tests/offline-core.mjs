import { chromium } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

await mkdir('test-results', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const requests = [],
  errors = [];
context.on('request', (request) => requests.push(request.url()));
page.on('pageerror', (error) => errors.push(String(error)));
await context.route('**/*', (route) => {
  const url = new URL(route.request().url());
  return url.hostname === '127.0.0.1' || ['blob:', 'data:', 'file:'].includes(url.protocol)
    ? route.continue()
    : route.abort();
});
try {
  await page.addInitScript(() => {
    navigator.mediaDevices.getDisplayMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      let frame = 0;
      const timer = setInterval(() => {
        ctx.fillStyle = '#eff7fd';
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = '#2264c5';
        ctx.fillRect(40 + (frame++ % 200), 80, 120, 100);
      }, 30);
      const stream = canvas.captureStream(30);
      const track = stream.getVideoTracks()[0],
        stop = track.stop.bind(track);
      track.stop = () => {
        clearInterval(timer);
        stop();
      };
      return stream;
    };
  });
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: 'Record my screen', exact: true }).waitFor();
  await context.setOffline(true);
  const runtimeStart = requests.length;
  await page.getByRole('button', { name: 'Record my screen', exact: true }).click();
  await page.getByRole('button', { name: 'Choose screen to record' }).click();
  await page.getByRole('button', { name: 'Stop and edit' }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Stop and edit' }).click();
  await page.getByLabel('Walkthrough title').waitFor({ timeout: 30000 });
  await page.getByLabel('Walkthrough title').fill('Offline workflow');
  await page.getByLabel('Callout headline').fill('Works without a backend');
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: /Offline workflow.*Open walkthrough/ }).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Works without a backend');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  await page.getByText('Download started — check your downloads', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close export' }).click();
  const file = path.resolve('test-results/offline-core.html');
  await (await download).saveAs(file);
  const viewer = await context.newPage();
  viewer.on('pageerror', (error) => errors.push(String(error)));
  await viewer.goto(pathToFileURL(file).href);
  await viewer.getByRole('heading', { name: 'Works without a backend', exact: true }).waitFor();
  await viewer.getByRole('button', { name: 'Get started', exact: true }).click();
  await viewer.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  assert.equal(
    requests.filter((url) => /^https?:/.test(url) && new URL(url).hostname !== '127.0.0.1').length,
    0,
  );
  assert.equal(requests.slice(runtimeStart).filter((url) => /^https?:/.test(url)).length, 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: built app records a synthetic stream, edits, saves/reopens, and exports/plays HTML offline without HTTP requests after loading.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
const server = await createServer({ server: { host: '127.0.0.1', port: 4178, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    let attempts = 0;
    navigator.mediaDevices.getDisplayMedia = async () => {
      if (!sessionStorage.getItem('testedCancel')) {
        sessionStorage.setItem('testedCancel', '1');
        throw new DOMException('Canceled', 'NotAllowedError');
      }
      const c = document.createElement('canvas');
      c.width = 1280;
      c.height = 720;
      const ctx = c.getContext('2d');
      let n = 0;
      const timer = setInterval(() => {
        ctx.fillStyle = '#ede8fa';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#6948ce';
        ctx.fillRect(100 + (n++ % 300), 100, 300, 200);
        ctx.fillStyle = '#222';
        ctx.font = '40px sans-serif';
        ctx.fillText('My captured screen', 100, 450);
      }, 30);
      const stream = c.captureStream(30);
      stream.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
      return stream;
    };
  });
  await page.goto('http://127.0.0.1:4178');
  await page.getByRole('button', { name: 'Record my screen', exact: true }).click();
  await page.getByRole('button', { name: 'Choose screen to record' }).click();
  await page.getByRole('alert').filter({ hasText: 'canceled' }).waitFor();
  await page.getByRole('button', { name: 'Choose screen to record' }).click();
  await page.getByRole('button', { name: 'Stop and edit' }).waitFor();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Mark screenshot step' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Stop and edit' }).click();
  await page.getByLabel('Walkthrough title').waitFor({ timeout: 30000 });
  assert.equal(await page.getByLabel('Walkthrough title').inputValue(), 'My screen recording');
  assert.ok((await page.locator('.step-list .step').count()) >= 4);
  await page.getByLabel('Walkthrough title').fill('My first recording');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('heading', { name: 'Your walkthroughs' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Your walkthroughs' }).waitFor();
  await page.getByRole('button', { name: /My first recording.*Open walkthrough/ }).click();
  await page.locator('.step-list .step').nth(1).click();
  await page.getByLabel('Video scrubber').fill('0.5');
  await page.getByRole('button', { name: 'Add screenshot step here' }).click();
  await page.getByLabel('Callout headline').waitFor();
  await page.getByText('Adding screenshot step…').waitFor({ state: 'hidden' });
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Explain this moment');
  assert.ok((await page.locator('.step-list .step').count()) >= 6);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.screenshot({ path: 'test-results/home.png', fullPage: true });
  await page.getByRole('button', { name: 'Record screen', exact: true }).click();
  await page.getByRole('button', { name: 'Choose screen to record' }).click();
  await page.getByRole('button', { name: 'Stop and edit' }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Stop and edit' }).click();
  await page.getByLabel('Walkthrough title').waitFor();
  assert.equal(await page.locator('.step-list .step').count(), 3);
  await page.locator('.step-list .step').nth(1).click();
  assert.equal(await page.getByLabel('Callout headline').inputValue(), 'Screen recording');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: home navigation, saved library, cancellation/retry, real MediaRecorder with synthetic screen stream, manual markers, no-marker video capture, and screenshot insertion/splitting.',
  );
} finally {
  await browser.close();
  await server.close();
}

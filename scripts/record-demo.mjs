// Record the real editor with generated sample content; never use a personal browser profile.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('test-results/readme-demo');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4184, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: output, size: { width: 1440, height: 900 } },
});
let video;
try {
  const seed = await context.newPage();
  await seed.goto('http://127.0.0.1:4184');
  await seed.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true });
  await seed.setViewportSize({ width: 390, height: 844 });
  await seed.screenshot({ path: path.join(output, 'home-mobile.png'), fullPage: true });
  if (await seed.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error('Home overflows on mobile');
  await seed.setViewportSize({ width: 1440, height: 900 });
  await seed.getByRole('button', { name: 'Explore a sample walkthrough' }).click();
  await seed.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await seed.getByLabel('Walkthrough title').fill('Welcome to Orbit');
  await seed.waitForTimeout(600);
  const page = await context.newPage();
  video = page.video();
  await page.goto(seed.url());
  await page.getByLabel('Callout headline').waitFor();
  const caption = async (text) => {
    await page.evaluate((text) => {
      let el = document.getElementById('demo-caption');
      if (!el) {
        el = document.createElement('div');
        el.id = 'demo-caption';
        el.style.cssText =
          'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:30px;background:#10243eee;color:white;font:600 18px system-ui;z-index:9999;pointer-events:none;box-shadow:0 4px 20px #0002';
        document.body.append(el);
      }
      el.textContent = text;
    }, text);
  };
  await caption('Turn a recorded workflow into a walkthrough');
  await page.waitForTimeout(1800);
  await page.locator('.step').nth(2).click();
  await caption('Edit each step and focus attention');
  await page.getByLabel('Callout headline').fill('Create your first project');
  await page.waitForTimeout(700);
  await page.getByLabel('Overlay style').selectOption('area');
  await page.getByLabel('Area zoom percentage').fill('120');
  await page.waitForTimeout(1800);
  await page.getByText('Project settings', { exact: true }).click();
  await page.getByLabel('Color theme').selectOption('ocean');
  await page.waitForTimeout(1100);
  await page.keyboard.press('Escape');
  await caption('Preview interactive callouts and smooth zoom');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.waitForTimeout(2300);
  await page.getByRole('button', { name: /^Go to step 5:/ }).click();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: '← Back', exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await caption('Send one interactive HTML file. Keep an editable ZIP backup.');
  await page.locator('.export-menu summary').click();
  await page.waitForTimeout(2200);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  await (await downloaded).saveAs(path.join(output, 'demo-export.html'));
  await caption('Frameway · local recording, editing, and sharing');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(output, 'editor.png') });
  await page.close();
  await writeFile(path.join(output, 'video-path.txt'), await video.path());
  console.log(`Demo recording: ${await video.path()}`);
} finally {
  await context.close();
  await browser.close();
  await server.close();
}

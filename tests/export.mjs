import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'node:http';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
const directory = path.resolve('test-results/export');
await mkdir(directory, { recursive: true });
const vite = await createViteServer({
  server: { host: '127.0.0.1', port: 4176, strictPort: true },
});
await vite.listen();
const staticServer = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(directory, '.' + name);
    if (!file.startsWith(directory + path.sep)) throw Error();
    const data = await readFile(file);
    res.setHeader(
      'Content-Type',
      file.endsWith('.html')
        ? 'text/html'
        : file.endsWith('.js')
          ? 'text/javascript'
          : file.endsWith('.webm')
            ? 'video/webm'
            : 'image/png',
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => staticServer.listen(4177, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true });
try {
  const editor = await browser.newPage();
  await editor.goto('http://127.0.0.1:4176');
  await editor.getByRole('button', { name: 'Explore a sample walkthrough' }).click();
  await editor.getByLabel('Callout headline').waitFor({ timeout: 30000 });
  await editor.getByRole('button', { name: 'Delete step', exact: true }).click();
  await editor.locator('.step-list .step').nth(1).click();
  await editor.getByLabel('Open by default').uncheck();
  const title = 'Demo </script><script>window.injected=true</script>';
  await editor.getByLabel('Walkthrough title').fill(title);
  async function download(name, file) {
    await editor.locator('.export-menu summary').click();
    const promise = editor.waitForEvent('download');
    await editor.getByRole('button', { name, exact: true }).click();
    await (await promise).saveAs(path.join(directory, file));
  }
  await download('Download HTML', 'portable.html');
  await download('Export embed', 'embed.zip');
  const files = unzipSync(new Uint8Array(await readFile(path.join(directory, 'embed.zip'))));
  for (const [name, bytes] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true });
    await writeFile(path.join(directory, name), bytes);
  }
  // No editor storage or network is available to the single-file viewer.
  const context = await browser.newContext();
  await context.setOffline(true);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(directory, 'portable.html')).href);
  assert.equal(await page.title(), title);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await page.locator('video').evaluate((v) => v.currentTime);
  await page.waitForTimeout(200);
  assert.ok(Math.abs((await page.locator('video').evaluate((v) => v.currentTime)) - paused) < 0.05);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  assert.equal(await page.locator('.card').isVisible(), false);
  await page.getByRole('button', { name: 'Hotspot', exact: true }).click();
  await page.getByRole('heading', { name: 'Create your first project' }).waitFor();
  await page.locator('.card button').click();
  await page.getByRole('heading', { name: 'Give your project a home' }).waitFor();
  await page.locator('.card button').click();
  await page.getByRole('heading', { name: 'You’re all set' }).waitFor();
  await page.getByRole('button', { name: '← Back', exact: true }).click();
  await page.getByRole('heading', { name: 'You’re all set' }).waitFor();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Hotspot', exact: true }).click();
  await page.getByRole('heading', { name: 'Create your first project' }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/export-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  await context.close();
  // The extracted package also works directly from disk, with relative media paths.
  const disk = await browser.newPage();
  await disk.goto(pathToFileURL(path.join(directory, 'index.html')).href);
  await disk.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await disk.close();
  // Render the exported React wrapper in a separate host app.
  await writeFile(
    path.join(directory, 'host.tsx'),
    `import React from 'react';import {createRoot} from 'react-dom/client';import {WalkthroughEmbed} from './WalkthroughEmbed';createRoot(document.getElementById('root')).render(<WalkthroughEmbed src="./index.html" title="Embedded walkthrough"/>);`,
  );
  await build({
    entryPoints: [path.join(directory, 'host.tsx')],
    outfile: path.join(directory, 'host.js'),
    bundle: true,
    jsx: 'automatic',
    format: 'iife',
  });
  await writeFile(
    path.join(directory, 'host.html'),
    '<!doctype html><html><body><div id="root"></div><script src="./host.js"></script></body></html>',
  );
  const host = await browser.newPage();
  await host.goto('http://127.0.0.1:4177/host.html');
  const frame = host.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Hotspot', exact: true }).click();
  await frame.locator('.card button').click();
  await frame.getByRole('heading', { name: 'Give your project a home' }).waitFor();
  await host.screenshot({ path: 'test-results/export-embed.png', fullPage: true });
  // Export an explicit branch and confirm the downloaded player follows it.
  await editor.getByLabel('Navigation target').selectOption({ label: 'You’re all set' });
  await download('Download HTML', 'branch.html');
  await host.goto(pathToFileURL(path.join(directory, 'branch.html')).href);
  await host.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  await host.getByRole('button', { name: 'Hotspot', exact: true }).click();
  await host.locator('.card button').click();
  await host.getByRole('heading', { name: 'You’re all set' }).waitFor();
  await host.getByRole('button', { name: '← Back', exact: true }).click();
  await host.getByRole('button', { name: 'Hotspot', exact: true }).waitFor();
  console.log(
    'PASS: offline single HTML, relative-file package, HTML escaping, pause/resume, video boundaries, hotspots, Back/Restart, branching, mobile layout, and React iframe embed without editor storage.',
  );
} finally {
  await browser.close();
  await vite.close();
  await new Promise((r) => staticServer.close(r));
}

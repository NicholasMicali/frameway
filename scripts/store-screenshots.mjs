import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import { openSample } from '../tests/sample-fixture.mjs';
// Fresh browser profile and generated content only; never attach to a user's browser.
const server = await createServer({ server: { host: '127.0.0.1', port: 4198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  await mkdir('docs/assets/store', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:4198');
  await openSample(page);
  await page.getByLabel('Title description').waitFor();
  await page.getByRole('button', { name: 'Step 1 options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.section-heading').first().click();
  await page.screenshot({ path: 'docs/assets/store/editor.png' });
  await page.getByRole('button', { name: 'Add closing slide', exact: true }).click();
  await page.getByLabel('Closing description').waitFor();
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.getByText('Saved locally', { exact: true }).waitFor();
  await page.screenshot({ path: 'docs/assets/store/completion.png' });
  await page.goto('http://127.0.0.1:4198/#home');
  await page.reload();
  await page.getByRole('heading', { name: 'Your walkthroughs', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/assets/store/library.png' });
} finally {
  await browser.close();
  await server.close();
}

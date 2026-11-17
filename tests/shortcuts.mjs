import { openSample } from './sample-fixture.mjs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4189, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const openHelp = async () => {
  await page.getByLabel('Workspace options', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Storage & backups', exact: true }).waitFor();
  await page.keyboard.press('End');
  assert.equal(
    await page
      .getByRole('menuitem', { name: 'Keyboard shortcuts', exact: true })
      .evaluate((el) => document.activeElement === el),
    true,
  );
  await page.keyboard.press('Enter');
  await page.getByRole('dialog', { name: 'Keyboard shortcuts' }).waitFor();
};
try {
  await page.goto('http://127.0.0.1:4189');
  await page.getByText('Opening your studio…').waitFor({ state: 'hidden' });
  await openHelp();
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(
      () => document.activeElement === document.body || !!document.activeElement.closest('dialog'),
    ),
    true,
  );
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await page.evaluate(
      () => document.activeElement === document.body || !!document.activeElement.closest('dialog'),
    ),
    true,
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page
      .getByLabel('Workspace options', { exact: true })
      .evaluate((el) => document.activeElement === el),
    true,
  );
  await openSample(page);
  await page.getByLabel('Callout headline').waitFor();
  const title = page.getByLabel('Walkthrough title');
  const original = await title.inputValue();
  await title.fill('Shortcut test');
  await openHelp();
  await page.keyboard.press('Control+z');
  assert.equal(await title.inputValue(), 'Shortcut test');
  await page.screenshot({ path: 'test-results/shortcuts-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth),
    true,
  );
  await page.screenshot({ path: 'test-results/shortcuts-mobile.png' });
  await page.keyboard.press('Escape');
  await page.getByLabel('Workspace options', { exact: true }).focus();
  await page.keyboard.press('Control+z');
  assert.equal(await title.inputValue(), original);
  await page.keyboard.press('Control+Shift+z');
  assert.equal(await title.inputValue(), 'Shortcut test');
  await page.getByRole('button', { name: '▷ Preview' }).click();
  await page.keyboard.press('Control+z');
  assert.equal(await title.inputValue(), 'Shortcut test');
  await page.getByRole('button', { name: '✎ Edit' }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('.step-list .step').nth(1).click();
  const trim = page.getByRole('slider', { name: 'Trim start', exact: true });
  await trim.focus();
  const start = Number(await trim.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowRight');
  assert.ok(Math.abs(Number(await trim.getAttribute('aria-valuenow')) - start - 0.05) < 0.001);
  await page.keyboard.press('Shift+ArrowRight');
  assert.ok(Math.abs(Number(await trim.getAttribute('aria-valuenow')) - start - 0.55) < 0.001);
  await page.keyboard.press('Home');
  assert.equal(Number(await trim.getAttribute('aria-valuenow')), 0);
  console.log(
    'Shortcut help: keyboard access, focus, mobile, dialog and preview guards, undo/redo and timeline keys passed.',
  );
} finally {
  await browser.close();
  await server.close();
}

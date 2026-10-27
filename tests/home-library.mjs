import { chromium } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4186, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
try {
  await page.goto('http://127.0.0.1:4186');
  await page.getByText('Opening your studio…').waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('heading', { name: 'Record your clicks' }).isVisible(), true);
  assert.equal(await page.getByRole('button', { name: /sample/i }).count(), 0);
  await page.locator('#extension-setup > summary').click();
  assert.equal(
    await page.getByRole('heading', { name: 'Install from the extension ZIP' }).isVisible(),
    true,
  );
  await page.locator('#extension-setup > summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(
    await page.getByRole('heading', { name: 'Install from the extension ZIP' }).isVisible(),
    false,
  );
  await page.screenshot({ path: 'test-results/home-first-run.png', fullPage: true });
  await page.evaluate(async () => {
    const { sampleProject } = await import('/src/sample.ts');
    const { saveProject } = await import('/src/db.ts');
    const p = await sampleProject();
    for (const [id, title, createdAt] of [
      ['one', 'Zulu demo', Date.UTC(2026, 9, 24)],
      ['two', 'Alpha demo', Date.UTC(2026, 9, 25)],
      ['three', 'Support demo', Date.UTC(2026, 9, 26)],
    ]) {
      await saveProject({ ...p, id, title, createdAt });
    }
  });
  await page.reload();
  await page.locator('.project-card').nth(2).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Send it to someone' }).isVisible(), true);
  assert.ok(
    (await page.locator('.project-library').boundingBox()).y <
      (await page.locator('.quick-guide').boundingBox()).y,
  );
  assert.equal(await page.locator('.project-card strong').first().innerText(), 'Support demo');
  await page.getByLabel('Sort by').selectOption('name');
  assert.equal(await page.locator('.project-card strong').first().innerText(), 'Alpha demo');
  await page.getByLabel('Find a walkthrough').fill('ALPHA');
  assert.equal(await page.locator('.project-card').count(), 1);
  await page.getByLabel('Find a walkthrough').fill('missing');
  assert.equal(await page.locator('.project-card').count(), 0);
  await page.getByRole('button', { name: 'Clear search' }).click();
  assert.equal(await page.locator('.project-card').count(), 3);
  const download = page.waitForEvent('download');
  await page.getByLabel('Options for Alpha demo').click();
  await page.keyboard.press('Escape');
  assert.equal(
    await page
      .getByRole('button', { name: 'Export backup of Alpha demo', exact: true })
      .isVisible(),
    false,
  );
  await page.getByLabel('Options for Alpha demo').click();
  await page.getByRole('button', { name: 'Export backup of Alpha demo', exact: true }).click();
  assert.match((await download).suggestedFilename(), /Alpha demo/);
  await page
    .getByText(/Creating.*backup|Exporting/, { exact: false })
    .waitFor({ state: 'hidden' })
    .catch(() => {});
  await page.getByLabel('Options for Alpha demo').click();
  await page.getByRole('button', { name: 'Delete Alpha demo', exact: true }).click();
  await page.getByRole('button', { name: 'Keep project', exact: true }).click();
  assert.equal(await page.locator('.project-card').count(), 3);
  await page.getByLabel('Options for Alpha demo').click();
  await page.getByRole('button', { name: 'Delete Alpha demo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.project-card').length === 2);
  await page.reload();
  await page.locator('.project-card').nth(1).waitFor();
  assert.equal(await page.locator('.project-card').count(), 2);
  await page.screenshot({ path: 'test-results/home-returning.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByLabel('Options for Support demo').click();
  assert.ok(
    (await page.locator('.project-actions[open] .project-actions-panel').boundingBox()).x >= 0,
  );
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.getByRole('heading', { name: 'Your walkthroughs' }).click();
  assert.equal(await page.locator('.project-actions[open]').count(), 0);
  await page.locator('.project-card').first().click();
  await page.getByLabel('Walkthrough title').waitFor();
  assert.equal(await page.locator('.workspace a[href="demo.html"]').count(), 0);
  await page.getByLabel('Walkthrough title').fill('Support revised');
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByLabel('Find a project').fill('Zulu');
  await page.locator('.navigation-projects button').filter({ hasText: 'Zulu demo' }).click();
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Walkthrough title"]').value === 'Zulu demo',
  );
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByLabel('Find a project').fill('Support');
  await page.locator('.navigation-projects button').filter({ hasText: 'Support revised' }).click();
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Walkthrough title"]').value === 'Support revised',
  );
  await page.getByLabel('Workspace options', { exact: true }).click();
  const bounds = await page.locator('.workspace-options .header-menu-panel').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  assert.equal(
    await page.getByRole('button', { name: 'Import project backup', exact: true }).isVisible(),
    true,
  );
  await page.screenshot({ path: 'test-results/header-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.workspace-options[open]').count(), 0);
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Storage & backups', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.screenshot({ path: 'test-results/header-projects.png', fullPage: true });
  await page.keyboard.press('Escape');

  await page.getByLabel('Open walkthrough', { exact: true }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('.project-card').first().waitFor();
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Home/library passed: guide, returning layout, search, sort, backup, cancel/delete, persistence, mobile and reopen.',
  );
} finally {
  await browser.close();
  await server.close();
}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const html = await readFile('dist/popup.html', 'utf8');
  const script = await readFile('dist/popup.js', 'utf8');
  async function scenario(state, url = 'https://example.com', failure = false) {
    await page.goto('about:blank');
    await page.setContent(html.replace('<script src="popup.js"></script>', ''));
    await page.evaluate(
      ({ state, url, failure }) => {
        window.calls = [];
        window.close = () => window.calls.push('close');
        window.chrome = {
          storage: {
            session: { get: async () => ({ capture: state ? { state } : undefined }) },
            onChanged: { addListener: () => {} },
          },
          tabs: {
            query: async () => [{ id: 1, url }],
            create: async (options) => window.calls.push(options),
          },
          runtime: {
            getURL: (path) => `chrome-extension://test/${path}`,
            sendMessage: async (message) => {
              window.calls.push(message);
              return failure ? { ok: false, error: 'Capture failed' } : { ok: true };
            },
          },
        };
      },
      { state, url, failure },
    );
    await page.addScriptTag({ content: script });
    await page.waitForFunction(
      () => document.querySelector('#record-label').textContent !== 'Loading…',
    );
  }
  await scenario();
  assert.equal(await page.locator('#record-label').textContent(), 'Record this tab');
  await page.locator('#open').click();
  assert.deepEqual(await page.evaluate(() => window.calls), [
    { url: 'chrome-extension://test/index.html#home' },
    'close',
  ]);
  await scenario();
  await page.locator('#record').click();
  assert.equal((await page.evaluate(() => window.calls))[0].type, 'start-capture');
  await scenario('recording', 'chrome://extensions');
  assert.equal(await page.locator('#record-label').textContent(), 'Stop recording');
  await page.locator('#record').click();
  assert.equal((await page.evaluate(() => window.calls))[0].type, 'stop-capture');
  for (const state of ['starting', 'stopping']) {
    await scenario(state);
    assert.equal(await page.locator('#record').isDisabled(), true);
    assert.equal(await page.locator('#open').isEnabled(), true);
  }
  await scenario(undefined, 'chrome://extensions');
  assert.equal(await page.locator('#record').isDisabled(), true);
  assert.equal(await page.locator('#open').isEnabled(), true);
  await scenario(undefined, 'https://example.com', true);
  await page.locator('#record').click();
  await page.waitForFunction(() => !document.querySelector('#error').hidden);
  assert.match(await page.locator('#error').textContent(), /Capture failed/);
  assert.equal(await page.locator('#record').isEnabled(), true);
  assert.equal((await page.evaluate(() => window.calls)).includes('close'), false);
  console.log(
    'Extension menu: open without capture, start/stop, transitions, restricted pages and errors passed.',
  );
} finally {
  await browser.close();
}

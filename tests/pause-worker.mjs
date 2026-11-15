import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.evaluate(() => {
    window.capture = { id: 'test', tabId: 1, origin: 'https://example.com', state: 'recording' };
    window.calls = [];
    window.chrome = {
      storage: {
        session: {
          get: async () => ({ capture: window.capture }),
          set: async (v) => {
            window.capture = v.capture;
          },
          remove: async () => {
            window.capture = undefined;
          },
        },
        local: { set: async () => {} },
      },
      action: {
        setBadgeText: async (v) => window.calls.push(v),
        setBadgeBackgroundColor: async () => {},
      },
      tabs: {
        onUpdated: { addListener: (fn) => (window.updated = fn) },
        onRemoved: { addListener: (fn) => (window.removed = fn) },
        create: async () => {},
      },
      scripting: { executeScript: async () => {} },
      runtime: {
        getURL: (path) => `chrome-extension://test/${path}`,
        onMessage: { addListener: (fn) => (window.listener = fn) },
        sendMessage: async (m) => {
          window.calls.push(m);
          if (window.fail) return { ok: false, error: 'Synthetic failure' };
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { ok: true };
        },
      },
    };
    window.command = (type) =>
      new Promise((resolve) =>
        window.listener(
          { to: 'worker', type },
          { url: 'chrome-extension://test/popup.html' },
          resolve,
        ),
      );
  });
  await page.addScriptTag({ content: await readFile('dist/background.js', 'utf8') });
  const result = await page.evaluate(async () => {
    const first = window.command('pause-capture');
    const duplicate = await window.command('pause-capture');
    const paused = await first;
    const pausedState = window.capture.state;
    window.fail = true;
    const failure = await window.command('resume-capture');
    const failedState = window.capture.state;
    window.fail = false;
    await window.command('resume-capture');
    const resumedState = window.capture.state;
    await window.command('pause-capture');
    await window.command('stop-capture');
    const stoppingState = window.capture.state;
    window.capture = { id: 'test', tabId: 1, origin: 'https://example.com', state: 'paused' };
    window.updated(1, { url: 'https://other.example/' }, {});
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      duplicate,
      paused,
      pausedState,
      failure,
      failedState,
      resumedState,
      stoppingState,
      changedOriginState: window.capture.state,
      calls: window.calls,
    };
  });
  assert.equal(result.duplicate.ok, false);
  assert.equal(result.paused.ok, true);
  assert.equal(result.pausedState, 'paused');
  assert.equal(result.failure.ok, false);
  assert.equal(result.failedState, 'paused');
  assert.equal(result.resumedState, 'recording');
  assert.equal(result.stoppingState, 'stopping');
  assert.equal(result.changedOriginState, 'stopping');
  assert.ok(result.calls.some((c) => c.text === 'Ⅱ'));
  console.log(
    'PASS worker pause/resume acknowledgement, duplicate control rejection, failure rollback, finish paused, and origin-change stop.',
  );
} finally {
  await browser.close();
}

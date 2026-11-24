// Purpose-built launch capture workflow, based on scripts/store-screenshots.mjs and
// tests/extension-update.mjs. Imports the supplied backup into a disposable profile.
// No project edits, UI mocks, live browser access, or external uploads.
import { chromium } from 'playwright';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const backup = process.argv[2];
if (!backup)
  throw new Error('Usage: node docs/assets/launch-0.5/capture.mjs /path/to/approved.frameway.zip');
const bytes = await readFile(resolve(backup));
const extension = resolve(root, 'dist');
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json')));
if (manifest.version !== '0.5.0') throw new Error('Build the Frameway 0.5.0 candidate first.');
const profile = await mkdtemp(resolve(tmpdir(), 'frameway-launch-profile-'));
const output = resolve(here, 'captures');
await mkdir(output, { recursive: true });
let context;
const records = [];
const externalRequests = [];
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.on('request', (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  const base = `chrome-extension://${new URL(worker.url()).host}`;
  const page = await context.newPage();
  await page.goto(`${base}/index.html`);
  await page
    .locator('input[type=file][accept=".zip"]')
    .setInputFiles({ name: 'approved.frameway.zip', mimeType: 'application/zip', buffer: bytes });
  await page.getByLabel('Title description').waitFor();
  const title = await page.getByLabel('Walkthrough title').inputValue();
  if (title !== 'CRM Training')
    throw new Error('This capture recipe expects the approved CRM Training project.');
  const save = async (name, locator, description, maxHeight, maxWidth) => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    });
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Missing capture: ${name}`);
    if (maxHeight) box.height = Math.min(box.height, maxHeight);
    if (maxWidth) box.width = Math.min(box.width, maxWidth);
    await page.screenshot({
      path: resolve(output, `${name}.png`),
      clip: box,
      animations: 'disabled',
    });
    records.push({ file: `${name}.png`, description, cropCssPixels: box });
  };
  await page.locator('.step-list .step').nth(2).click();
  await page.getByLabel('Callout headline').waitFor();
  await save(
    'editor-controls',
    page.locator('.inspector'),
    'Unmodified image-step inspector for Welcome to your pipeline',
    470,
  );
  await save('editor-stage', page.locator('.stage'), 'Welcome to your pipeline, in Edit mode');
  await save('sequence', page.locator('.steps'), 'Actual first three steps from CRM Training', 525);
  await page.getByRole('button', { name: '▷ Preview', exact: true }).click();
  await save(
    'walkthrough',
    page.locator('.stage'),
    'Finished Welcome to your pipeline step, in Preview mode',
  );
  await page.getByRole('button', { name: '✎ Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await save(
    'share',
    page.getByRole('dialog', { name: 'Share walkthrough' }),
    'Full current Share dialog, tightly cropped; no download or export initiated',
  );
  await page.getByRole('button', { name: 'Close export', exact: true }).click();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('heading', { name: 'Project library', exact: true }).waitFor();
  await page.setViewportSize({ width: 900, height: 1100 });
  await save(
    'library',
    page.locator('.project-library'),
    'Left crop of the actual isolated Library, with the supplied CRM Training example',
    undefined,
    380,
  );

  await save(
    'recording-guide',
    page.locator('.capture-recommended'),
    'Current Library guidance for Chrome-tab capture; no recording simulated or started',
  );
  if (externalRequests.length) throw new Error('Unexpected network request during local capture');
  await writeFile(
    resolve(here, 'capture-provenance.json'),
    JSON.stringify(
      {
        project: title,
        sourceSha256: createHash('sha256').update(bytes).digest('hex'),
        version: manifest.version,
        chromium: context.browser()?.version(),
        deviceScaleFactor: 2,
        externalRequests: externalRequests.length,
        method:
          'Actual packaged extension in a disposable local Chromium profile; backup imported through standard UI; no content edits.',
        captures: records,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Captured ${records.length} current UI images from ${title}; no backup copied into the asset folder.`,
  );
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}

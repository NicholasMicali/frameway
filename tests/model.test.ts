import { RecordingClock } from '../src/recording-clock';
import { formattedText, safeActionURL } from '../src/formatted-text';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  withTitleSlide,
  withClosingSlide,
  normalizedPoint,
  splitVideo,
  duplicateStep,
  copyProject,
  moveStep,
  deleteStep,
  nextId,
  validateManifest,
  migrateProject,
  type LegacyProject,
  type Project,
} from '../src/model';
const step = (id: string, target = 'next') => ({
  id,
  title: id,
  body: 'text',
  x: 0.5,
  y: 0.5,
  cardX: 0.2,
  cardY: 0.2,
  stillTime: 0,
  image: new Blob(),
  target,
  clipStart: 0,
  clipEnd: 1,
  kind: 'image' as const,
  style: 'hotspot' as const,
  openByDefault: true,
});
const project = (): Project => ({
  schemaVersion: 2,
  id: 'p',
  title: 'Test',
  createdAt: 0,
  duration: 5,
  width: 1280,
  height: 800,
  video: new Blob(),
  steps: [step('a', 'c'), step('b'), step('c', 'end')],
  markers: [],
  status: 'ready',
  warning: '',
});
test('coordinates normalize against viewport and clamp', () => {
  assert.deepEqual(normalizedPoint(640, 400, 1280, 800), { x: 0.5, y: 0.5 });
  assert.deepEqual(normalizedPoint(-1, 900, 1280, 800), { x: 0, y: 1 });
  assert.throws(() => normalizedPoint(1, 1, 0, 1));
});
test('reorder preserves explicit targets and clip ranges', () => {
  const p = moveStep(project(), 'c', -1);
  assert.equal(nextId(p, p.steps[0]), 'c');
  assert.equal(p.steps[1].id, 'c');
  assert.equal(p.steps[0].clipEnd, 1);
});
test('deletion repairs references to removed step', () => {
  const p = deleteStep(project(), 'c');
  assert.equal(p.steps[0].target, 'next');
  assert.equal(nextId(p, p.steps[0]), 'b');
});
test('import rejects invalid ranges, duplicate IDs and missing targets', () => {
  validateManifest(project());
  for (const change of [
    { clipEnd: 8 },
    { x: NaN },
    { target: 'missing' },
    { clipStart: 2, clipEnd: 1 },
  ]) {
    const p = project();
    Object.assign(p.steps[0], change);
    assert.throws(() => validateManifest(p));
  }
  const p = project();
  p.steps[1].id = 'a';
  assert.throws(() => validateManifest(p));
});

test('v1 migration preserves branches, images and timing without adding opening footage', () => {
  const p = project();
  const legacy: LegacyProject = {
    ...p,
    schemaVersion: 1,
    steps: p.steps.map(({ kind, ...s }) => ({ ...s, transition: true })),
  };
  const migrated = migrateProject(legacy);
  validateManifest(migrated);
  assert.equal(migrated.steps[0].id, 'a');
  assert.equal(migrated.steps.length, 5);
  const clip = migrated.steps.find((s) => s.id === migrated.steps[0].target)!;
  assert.equal(clip.kind, 'video');
  assert.equal(nextId(migrated, clip), 'c');
  assert.equal(clip.clipEnd, 1);
  assert.equal(migrated.steps[0].image, p.steps[0].image);
  assert.equal(migrated.video, p.video);
  assert.equal(migrated.steps.at(-1)?.target, 'end');
  assert.equal(migrateProject(migrated), migrated);
});
test('v2 validates overlay settings, autoplay and nonempty clips', () => {
  for (const change of [
    { kind: 'unknown' },
    { style: 'invalid' },
    { areaWidth: 0 },
    { cardWidth: 2 },
    { openByDefault: 'yes' },
    { kind: 'video', autoplay: true, clipStart: 1, clipEnd: 1 },
    { kind: 'video', autoplay: 'yes' },
  ]) {
    const p = project();
    Object.assign(p.steps[0], change);
    assert.throws(() => validateManifest(p));
  }
});

test('v1 ZIP import and v2 export roundtrip preserve images and explicit branches', async () => {
  const { zipSync, strToU8 } = await import('fflate');
  const { importProject, exportProject } = await import('../src/archive');
  const p = project();
  const steps = p.steps.map(({ image, kind, ...s }) => ({ ...s, transition: true }));
  const bytes = zipSync({
    'project.json': strToU8(
      JSON.stringify({ ...p, schemaVersion: 1, steps, mimeType: 'video/webm' }),
    ),
    'recording.webm': new Uint8Array([1, 2, 3]),
    ...Object.fromEntries(steps.map((_, i) => [`stills/${i}.png`, new Uint8Array([i, 4, 5])])),
  });
  const migrated = await importProject(new Blob([bytes]));
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.steps.length, 5);
  const restored = await importProject(await exportProject(migrated));
  assert.deepEqual(
    restored.steps.map(({ image, ...s }) => s),
    migrated.steps.map(({ image, ...s }) => s),
  );
  assert.deepEqual(
    await restored.steps[0].image.arrayBuffer(),
    await migrated.steps[0].image.arrayBuffer(),
  );
  assert.deepEqual(await restored.video.arrayBuffer(), await migrated.video.arrayBuffer());
});

test('split preserves incoming IDs, contiguous ranges, and outgoing branches', () => {
  const p = project();
  p.steps[0] = { ...p.steps[0], kind: 'video', autoplay: true };
  const q = splitVideo(p, 'a', 0.4);
  validateManifest(q);
  assert.equal(q.steps.length, 4);
  assert.equal(q.steps[0].id, 'a');
  assert.equal(q.steps[0].clipEnd, 0.4);
  assert.equal(q.steps[1].clipStart, 0.4);
  assert.equal(nextId(q, q.steps[0]), q.steps[1].id);
  assert.equal(nextId(q, q.steps[1]), 'c');
  assert.equal(p.steps[0].clipEnd, 1);
  assert.equal(splitVideo(p, 'a', 0), p);
  assert.equal(splitVideo(p, 'a', 1), p);
});
test('duplicate uses a unique ID and keeps original media and branch', () => {
  const p = project(),
    q = duplicateStep(p, 'a');
  validateManifest(q);
  assert.equal(q.steps.length, 4);
  assert.notEqual(q.steps[0].id, q.steps[1].id);
  assert.equal(q.steps[1].target, 'c');
  assert.equal(q.steps[1].image, p.steps[0].image);
});

test('title insertion preserves all existing steps and is idempotent', () => {
  const p = project(),
    image = new Blob(['opening']);
  const q = withTitleSlide(p, image);
  validateManifest(q);
  assert.equal(q.steps[0].kind, 'title');
  assert.equal(q.steps[0].image, image);
  assert.equal(nextId(q, q.steps[0]), 'a');
  assert.equal(q.steps[1], p.steps[0]);
  assert.equal(withTitleSlide(q, image), q);
  const bad = {
    ...q,
    steps: q.steps.map((s) => (s.kind === 'title' ? { ...s, buttonText: 123 } : s)),
  };
  assert.throws(() => validateManifest(bad));
});

test('custom theme and logo validation rejects invalid imported values', () => {
  const p = {
    ...project(),
    theme: 'custom' as const,
    customColor: '#ffd500',
    logo: 'data:image/png;base64,aGVsbG8=',
  };
  validateManifest(p);
  for (const change of [
    { customColor: 'red' },
    { customColor: '#12345g' },
    { logo: 'https://example.com/logo.png' },
    { logo: 'data:image/svg+xml;base64,aA==' },
    { logo: 'data:image/png;base64,' + 'a'.repeat(700000) },
  ])
    assert.throws(() => validateManifest({ ...p, ...change }));
});

import { automaticZoom, areaZoom } from '../src/area-zoom';
test('automatic area zoom is subtle, size-aware, and keeps the image over the viewport', () => {
  const s = {
    ...step('zoom'),
    style: 'area' as const,
    zoomEnabled: true,
    areaWidth: 0.1,
    areaHeight: 0.1,
  };
  assert.ok(automaticZoom(s) > automaticZoom({ ...s, areaWidth: 0.6, areaHeight: 0.6 }));
  assert.ok(automaticZoom(s) <= 120);
  assert.equal(automaticZoom({ ...s, areaWidth: 1 }), 100);
  for (const x of [0, 0.5, 1])
    for (const y of [0, 0.5, 1]) {
      const z = areaZoom({ ...s, x, y });
      assert.ok(z.tx <= 0 && z.ty <= 0 && z.tx + z.scale >= 1 && z.ty + z.scale >= 1);
      assert.ok((z.x - 0.05) * z.scale + z.tx >= -1e-8);
      assert.ok((z.x + 0.05) * z.scale + z.tx <= 1 + 1e-8);
    }
  assert.equal(areaZoom({ ...s, zoomEnabled: false }).scale, 1);
  assert.equal(areaZoom({ ...s, zoomPercent: 237.5 }).scale, 2.375);
  const p = project();
  p.steps[0] = s;
  validateManifest(p);
  for (const zoomPercent of [99, -1, NaN, Infinity])
    assert.throws(() => validateManifest({ ...p, steps: [{ ...s, zoomPercent }] }));
});

test('export filenames preserve readable titles and are portable on Windows', async () => {
  const { exportName } = await import('../src/export-name');
  assert.equal(exportName('CloudGo Advisor'), 'CloudGo Advisor');
  assert.equal(exportName('  Sales: Q4 / demo?  '), 'Sales- Q4 - demo-');
  assert.equal(exportName('../CON'), '..-CON');
  assert.equal(exportName('CON.txt'), '_CON.txt');
  assert.equal(exportName('...'), 'Untitled project');
  assert.equal(exportName('   '), 'Untitled project');
  assert.equal(exportName('Démo 日本語'), 'Démo 日本語');
  assert.ok(new TextEncoder().encode(exportName('😀'.repeat(200)) + '.frameway.zip').length <= 255);
});

test('storage estimates degrade gracefully and backup status follows content revisions', async () => {
  const { storageSummary, backupStatus, revision } = await import('../src/storage-health');
  assert.equal(storageSummary().low, false);
  assert.match(storageSummary({ usage: 5, quota: 0 }).text, /unavailable/);
  assert.equal(storageSummary({ usage: 95, quota: 100 }).low, true);
  assert.equal(storageSummary({ usage: 50, quota: 100 }).low, false);
  const p = project();
  assert.equal(backupStatus(p), 'No backup export recorded');
  p.localBackup = { revision: revision(p), exportedAt: 123 };
  assert.equal(backupStatus(p), 'Backup exported for these edits');
  p.localRevision = 'edited';
  assert.equal(backupStatus(p), 'Changed since last backup export');
});

test('project copies isolate edits, remap branches, reset backups, and preserve media', async () => {
  const source = project();
  source.title = 'x'.repeat(200);
  source.video = new Blob(['video'], { type: 'video/webm' });
  source.steps[0].image = new Blob(['image'], { type: 'image/png' });
  source.localRevision = 'revision';
  source.localBackup = { revision: 'revision', exportedAt: 1 };
  source.theme = 'custom';
  source.customColor = '#123456';
  const copy = copyProject(source);
  assert.notEqual(copy.id, source.id);
  assert.equal(copy.title.length, 200);
  assert.ok(copy.title.endsWith(' (copy)'));
  assert.ok(copyProject(source, [copy.title]).title.endsWith(' (copy 2)'));
  assert.equal(copy.localBackup, undefined);
  assert.equal(copy.localRevision, undefined);
  assert.equal(copy.customColor, source.customColor);
  assert.equal(await copy.video.text(), await source.video.text());
  assert.equal(await copy.steps[0].image.text(), await source.steps[0].image.text());
  assert.ok(copy.steps.every((s) => !source.steps.some((original) => original.id === s.id)));
  assert.equal(nextId(copy, copy.steps[0]), copy.steps[2].id);
  const reordered = moveStep(copy, copy.steps[2].id, -1);
  assert.equal(nextId(reordered, reordered.steps[0]), copy.steps[2].id);
  validateManifest(deleteStep(reordered, copy.steps[2].id));
  copy.steps[0].body = 'Changed only in copy';
  assert.equal(source.steps[0].body, 'text');
  assert.equal(source.steps[0].target, 'c');
});

test('local edit history is reset for portable imports and copies', async () => {
  const { exportProject, importProject } = await import('../src/archive');
  const p = { ...project(), localEditedAt: 123, video: new Blob([], { type: 'video/webm' }) };
  assert.equal(copyProject(p, []).localEditedAt, undefined);
  const restored = await importProject(await exportProject(p));
  assert.equal(restored.localEditedAt, undefined);
});

test('chapter labels follow steps and survive backups without creating duplicate section starts', async () => {
  const { chaptersFor } = await import('../src/chapters');
  const { exportProject, importProject } = await import('../src/archive');
  const p = project();
  p.video = new Blob([], { type: 'video/webm' });
  p.steps[0].chapter = 'Introduction';
  p.steps[2].chapter = 'Finish';
  assert.equal(chaptersFor(moveStep(p, 'c', -1).steps)[1].index, 1);
  assert.equal(chaptersFor(deleteStep(p, 'c').steps).length, 1);
  assert.equal(chaptersFor(duplicateStep(p, 'a').steps).length, 2);
  assert.equal(chaptersFor(withTitleSlide(p, new Blob()).steps).length, 2);
  assert.deepEqual(
    chaptersFor((await importProject(await exportProject(p))).steps),
    chaptersFor(p.steps),
  );
  const legacy = {
    ...p,
    schemaVersion: 1 as const,
    steps: p.steps.map((s) => ({ ...s, transition: true })),
  };
  assert.equal(chaptersFor(migrateProject(legacy).steps).length, 2);
  p.steps[0].chapter = 'x'.repeat(121);
  assert.throws(() => validateManifest(p), /chapter/);
});

test('appearance defaults preserve old projects and validated styling survives backup import', async () => {
  const { appearanceVars, contrastRatio, validateAppearance } = await import('../src/appearance');
  const { exportProject, importProject } = await import('../src/archive');
  assert.deepEqual(appearanceVars(), {});
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  for (const appearance of [
    null,
    [],
    { cardText: 'red' },
    { titleLayout: 'html' },
    { logoSize: 100 },
    { font: 'https://font.test' },
    { css: 'color:red' },
  ]) {
    assert.throws(() => validateAppearance(appearance));
  }
  const p = project();
  p.video = new Blob([], { type: 'video/webm' });
  p.appearance = {
    cardBackground: '#112233',
    cardText: '#ffffff',
    titleBackground: '#eeeeee',
    titleText: '#222222',
    titleLayout: 'centered',
    logoSize: 8,
    logoAlignment: 'center',
    font: 'serif',
    typography: 'large',
    buttonShape: 'pill',
  };
  validateManifest(p);
  assert.deepEqual((await importProject(await exportProject(p))).appearance, p.appearance);
});

test('basic formatting escapes HTML and permits only explicit web actions', () => {
  assert.equal(formattedText('**literal**'), '<p>**literal**</p>');
  assert.equal(
    formattedText('**Bold** and *italic*\n- First\n- Second\n1. Ordered', true),
    '<p><strong>Bold</strong> and <em>italic</em></p><ul><li>First</li><li>Second</li></ul><ol><li>Ordered</li></ol>',
  );
  assert.ok(!formattedText('<img src=x onerror=alert(1)>', true).includes('<img'));
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,x',
    'file:///tmp/x',
    '//example.com',
    'https://user:pass@example.com',
  ])
    assert.equal(safeActionURL(url), false);
  assert.equal(safeActionURL('https://example.com/docs?a=1'), true);
});

test('recording clock excludes repeated pauses and rejects delayed paused clicks', () => {
  const clock = new RecordingClock(1000);
  assert.equal(clock.time(900), undefined);
  clock.pause(2000);
  assert.equal(clock.duration(5000), 1);
  clock.resume(5000);
  assert.equal(clock.time(3000), undefined);
  assert.equal(clock.time(5100), 1.1);
  clock.pause(6000);
  clock.pause(6500);
  assert.equal(clock.duration(8000), 2);
  clock.resume(9000);
  assert.equal(clock.time(7000), undefined);
  assert.equal(clock.time(9500), 2.5);
  assert.equal(clock.duration(10000), 3);
});

test('closing slides are optional terminal steps with portable editing behavior', async () => {
  const { exportProject, importProject } = await import('../src/archive');
  const original = project();
  original.video = new Blob([], { type: 'video/webm' });
  const p = withClosingSlide(original);
  const closing = p.steps.at(-1)!;
  validateManifest(p);
  assert.equal(original.steps.length, 3);
  assert.equal(p.steps[0].target, 'c');
  assert.equal(nextId(p, p.steps[2]), closing.id);
  assert.equal(nextId(p, closing), undefined);
  assert.equal(withClosingSlide(p), p);
  const moved = moveStep(p, closing.id, -1);
  assert.equal(nextId(moved, closing), undefined);
  const copied = duplicateStep(p, closing.id);
  assert.equal(copied.steps.at(-1)?.kind, 'closing');
  validateManifest(copied);
  assert.equal(deleteStep(p, closing.id).steps.length, 3);
  const restored = await importProject(await exportProject(p));
  assert.equal(restored.steps.at(-1)?.kind, 'closing');
  assert.equal(restored.steps.at(-1)?.body, closing.body);
  assert.throws(() =>
    validateManifest({
      ...p,
      steps: p.steps.map((s) => (s.id === closing.id ? { ...s, target: 'next' } : s)),
    }),
  );
  original.steps[2].target = 'a';
  assert.equal(withClosingSlide(original).steps[2].target, 'a');
});

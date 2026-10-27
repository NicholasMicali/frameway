import test from 'node:test';
import assert from 'node:assert/strict';
import {
  withTitleSlide,
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

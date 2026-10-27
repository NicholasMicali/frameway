import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { validateManifest, migrateProject, type Project } from './model';
export async function exportProject(p: Project) {
  const manifest = {
    ...p,
    localRevision: undefined,
    localBackup: undefined,
    video: undefined,
    markers: undefined,
    steps: p.steps.map(({ image, ...s }) => s),
    mimeType: p.video.type,
  };
  const entries: Record<string, Uint8Array> = {
    'project.json': strToU8(JSON.stringify(manifest)),
    'recording.webm': new Uint8Array(await p.video.arrayBuffer()),
  };
  for (let i = 0; i < p.steps.length; i++)
    entries[`stills/${i}.png`] = new Uint8Array(await p.steps[i].image.arrayBuffer());
  if (Object.values(entries).reduce((n, b) => n + b.byteLength, 0) > 149 * 1024 * 1024)
    throw Error('Project is too large for the prototype archive limit. Use a shorter recording.');
  const bytes = zipSync(entries, { level: 0 });
  return new Blob([bytes as BlobPart], { type: 'application/zip' });
}
export async function importProject(file: Blob): Promise<Project> {
  if (file.size > 150 * 1024 * 1024)
    throw Error('Project exceeds the 150 MB prototype import limit.');
  let size = 0,
    count = 0;
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (e) => {
      size += e.originalSize;
      count++;
      if (size > 200 * 1024 * 1024 || count > 403)
        throw Error('Archive exceeds the decoded size or file limit.');
      if (
        e.name !== 'project.json' &&
        e.name !== 'recording.webm' &&
        !/^stills\/\d+\.png$/.test(e.name)
      )
        throw Error('Unexpected archive entry');
      return true;
    },
  });
  if (
    !files['project.json'] ||
    files['project.json'].length > 2 * 1024 * 1024 ||
    !files['recording.webm']
  )
    throw Error('Missing media or project manifest');
  const p = JSON.parse(strFromU8(files['project.json']));
  validateManifest(p);
  if (typeof p.mimeType !== 'string' || !/^video\/webm(?:;|$)/.test(p.mimeType))
    throw Error('Only WebM recordings are supported');
  const steps = p.steps.map((s: any, i: number) => {
    if (!files[`stills/${i}.png`]) throw Error('Missing still image');
    return { ...s, image: new Blob([files[`stills/${i}.png`] as BlobPart], { type: 'image/png' }) };
  });
  return migrateProject({
    ...p,
    localRevision: undefined,
    localBackup: undefined,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    steps,
    markers: [],
    video: new Blob([files['recording.webm'] as BlobPart], { type: p.mimeType }),
    status: 'needs-review',
    warning: 'Imported project. Preview the media and step boundaries.',
  });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

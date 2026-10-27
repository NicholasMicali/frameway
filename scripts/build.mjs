import { build as viteBuild } from 'vite';
import { build } from 'esbuild';
import { readFile, writeFile, copyFile, cp } from 'node:fs/promises';
await viteBuild({ base: './' });
await build({
  entryPoints: [
    'extension/background.ts',
    'extension/offscreen.ts',
    'extension/content.ts',
    'extension/popup.ts',
  ],
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome116',
  sourcemap: true,
});
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
if (manifest.version !== pkg.version) throw Error('Package and extension versions must match');
await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
await copyFile('extension/offscreen.html', 'dist/offscreen.html');

await copyFile('extension/popup.html', 'dist/popup.html');
await copyFile('extension/popup.css', 'dist/popup.css');
await cp('extension/icons', 'dist/icons', { recursive: true });

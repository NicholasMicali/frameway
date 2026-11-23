import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
for (const test of [
  'extension-popup',
  'pause-worker',
  'pause-resume',
  'e2e',
  'recording',
  'editor',
  'editor-polish',
  'area-zoom',
  'export',
  'title',
  'closing',
  'offline-core',
  'ui-polish',
  'storage',
  'home-library',
  'library-rename',
  'shortcuts',
  'chapters',
  'appearance',
  'bundled-fonts',
  'presentation-frame',
  'walkthrough-motion',
  'slide-elements',
  'timeline-navigation',
  'callout-formatting',
  'project-copy',
  'video-export',
  'output-consistency',
  'music',
  'music-upload',
  'music-library',
]) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`tests/${test}.mjs`], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(Error(`${test} failed (${code})`)),
    );
  });
}

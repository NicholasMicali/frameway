import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
for (const test of [
  'extension-popup',
  'e2e',
  'recording',
  'editor',
  'editor-polish',
  'area-zoom',
  'export',
  'title',
  'offline-core',
  'ui-polish',
  'storage',
  'home-library',
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

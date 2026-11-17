import { readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
// Include production dependencies conservatively, including their transitive notices.
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const sections = [];
for (const [folder, entry] of Object.entries(lock.packages)) {
  if (!folder || entry.dev) continue;
  const pkg = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8'));
  const files = (await readdir(folder))
    .filter((name) => /^(licen[sc]e|copying|notice)(\.|$)/i.test(name))
    .sort();
  const texts = await Promise.all(files.map((name) => readFile(path.join(folder, name), 'utf8')));
  if (!texts.length && pkg.name === 'react-remove-scroll-bar' && pkg.version === '2.3.8') {
    texts.push(await readFile('licenses/react-remove-scroll-bar-2.3.8.txt', 'utf8'));
  }
  if (!texts.length) throw Error(`Missing license notice for ${pkg.name}@${pkg.version}`);
  sections.push(`${pkg.name}@${pkg.version} (${pkg.license})\n\n${texts.join('\n\n')}`);
}
await writeFile(
  'dist/THIRD_PARTY_NOTICES.txt',
  sections.join('\n\n----------------------------------------\n\n'),
);
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('NOTICE', 'dist/NOTICE');

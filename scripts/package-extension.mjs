import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {zipSync,unzipSync} from 'fflate';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const entries={};
async function collect(dir,prefix=''){for(const item of await readdir(dir,{withFileTypes:true})){const name=prefix+item.name;if(item.isDirectory())await collect(path.join(dir,item.name),name+'/');else if(!name.endsWith('.map'))entries[name]=new Uint8Array(await readFile(path.join(dir,item.name)));}}
await collect('dist');
const manifest=JSON.parse(new TextDecoder().decode(entries['manifest.json']));
if(manifest.version!==pkg.version)throw Error('Build version mismatch; run npm run build');
for(const name of ['index.html','background.js','offscreen.js','offscreen.html','content.js'])if(!entries[name])throw Error(`Missing ${name}`);
const bytes=zipSync(entries,{level:6});const check=unzipSync(bytes);if(!check['manifest.json'])throw Error('Invalid release ZIP');
await mkdir('release',{recursive:true});const target=`release/frameway-extension-v${pkg.version}.zip`;await writeFile(target,bytes);console.log(`Created ${target} (${Object.keys(entries).length} files; no source maps)`);

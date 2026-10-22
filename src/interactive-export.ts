import {themeVars} from './themes';
import {zipSync,strToU8} from 'fflate';
import {validateManifest,type Project} from './model';
import runtime from './player/runtime.js?raw';
import css from './player/style.css?raw';
import titleCSS from './title-slide.css?raw';

const jsonForHTML=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
const escapeHTML=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function playerDocument(p:Project,video:string,images:string[]){
 const data={theme:themeVars(p.theme),title:p.title,width:p.width,height:p.height,video,steps:p.steps.map(({image,...s},i)=>({...s,image:images[i]}))};
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(p.title)}</title><style>${css}
${titleCSS}</style></head><body><main id="player"></main><noscript>This walkthrough requires JavaScript.</noscript><script id="walkthrough-data" type="application/json">${jsonForHTML(data)}</script><script>${runtime}</script></body></html>`;
}
function dataURL(blob:Blob){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Could not read export media'));reader.readAsDataURL(blob);});}
export async function exportInteractive(p:Project,format:'html'|'zip'){
 validateManifest(p);
 const bytes=p.video.size+p.steps.reduce((n,s)=>n+s.image.size,0);
 if(bytes>100*1024*1024)throw Error('Interactive export supports up to 100 MB of media. Use a shorter recording.');
 if(format==='html'){
  const video=await dataURL(p.video),images=[];
  for(const s of p.steps)images.push(await dataURL(s.image));
  return new Blob([playerDocument(p,video,images)],{type:'text/html;charset=utf-8'});
 }
 const entries:Record<string,Uint8Array>={};
 entries['media/recording.webm']=new Uint8Array(await p.video.arrayBuffer());
 const images=[];
 for(let i=0;i<p.steps.length;i++){const path=`media/${i}.png`;images.push(path);entries[path]=new Uint8Array(await p.steps[i].image.arrayBuffer());}
 entries['index.html']=strToU8(playerDocument(p,'media/recording.webm',images));
 entries['embed.html']=strToU8(`<!-- Place the exported folder on your website. Change src to its index.html URL. -->\n<iframe src="./index.html" title="${escapeHTML(p.title)}" style="width:100%;height:850px;border:0" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>\n`);
 entries['WalkthroughEmbed.tsx']=strToU8(`import type { CSSProperties } from 'react';\n\n/** Point src to the exported folder's index.html on your website. */\nexport function WalkthroughEmbed({src, title = 'Interactive walkthrough', style}: {src: string; title?: string; style?: CSSProperties}) {\n  return <iframe src={src} title={title} loading="lazy" allow="autoplay; fullscreen" allowFullScreen style={{width:'100%', height:'850px', border:0, ...style}} />;\n}\n`);
 entries['README.txt']=strToU8(`FRAMEWAY INTERACTIVE WALKTHROUGH\n\nUnzip and open index.html in a modern browser, keeping media/ beside it.\nFor embedding, copy the entire folder to your existing website or internal static server.\nUse embed.html or WalkthroughEmbed.tsx with the URL of index.html. The React wrapper loads this same standalone player in an iframe.\nA localhost URL only works on your computer; send the exported files or use a server accessible to your viewers.\nNo account, editor, browser storage, CDN, or Frameway service is required.\nThe export contains your recording and screenshots. Anyone receiving it can access these assets.\nThis is a playback export. Keep Export project for later editing.\nFor a single file to send, choose Download HTML in the studio. Some email/file-sharing previews block scripts; download the HTML and open it in a browser.\n`);
 return new Blob([zipSync(entries,{level:0}) as BlobPart],{type:'application/zip'});
}

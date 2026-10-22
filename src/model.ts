import {themes,type ThemeName} from './themes';
export type Marker = { id:string; time:number; x:number; y:number; label:string; viewportWidth:number; viewportHeight:number; lagMs:number };
type StepBase = { id:string; title:string; body:string; x:number; y:number; cardX:number; cardY:number; stillTime:number; image:Blob; target:string; clipStart:number; clipEnd:number; cardWidth?:number; areaWidth?:number; areaHeight?:number };
export type Step = StepBase & ({kind:'image';style:'hotspot'|'callout'|'area';openByDefault:boolean}|{kind:'video';autoplay:boolean}|{kind:'title';buttonText:string});
export type LegacyStep = StepBase & {transition:boolean};
type ProjectBase = { theme?:ThemeName; id:string; title:string; createdAt:number; duration:number; width:number; height:number; video:Blob; markers:Marker[]; status:'ready'|'needs-review'; warning:string };
export type Project = ProjectBase & {schemaVersion:2;steps:Step[]};
export type LegacyProject = ProjectBase & {schemaVersion:1;steps:LegacyStep[]};
export const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function normalizedPoint(x:number,y:number,width:number,height:number){if(width<=0||height<=0)throw Error('Invalid viewport');return {x:clamp(x/width),y:clamp(y/height)};}
export function nextId(p:Project,s:Step){return s.target==='next' ? p.steps[p.steps.findIndex(x=>x.id===s.id)+1]?.id : s.target==='end'?undefined:s.target;}
export function migrateProject(p:Project|LegacyProject):Project{
 if(p.schemaVersion===2)return p;
 const steps:Step[]=[];
 for(let i=0;i<p.steps.length;i++){
  const {transition,...s}=p.steps[i];const target=s.target==='next'?p.steps[i+1]?.id:s.target==='end'?undefined:s.target;
  const play=transition&&s.clipEnd-s.clipStart>=.05&&!!target;
  const clipId=play?crypto.randomUUID():'';
  steps.push({...s,kind:'image',style:'hotspot',openByDefault:true,target:play?clipId:s.target});
  if(play)steps.push({...s,id:clipId,title:`Video · ${s.title}`.slice(0,200),kind:'video',autoplay:true,target:target!});
 }
 return {...p,schemaVersion:2,steps};
}
export function deleteStep(p:Project,id:string):Project{return {...p,steps:p.steps.filter(s=>s.id!==id).map(s=>s.target===id?{...s,target:'next'}:s)};}
export function moveStep(p:Project,id:string,delta:number):Project{const steps=[...p.steps],i=steps.findIndex(s=>s.id===id),j=i+delta;if(i<0||j<0||j>=steps.length)return p;[steps[i],steps[j]]=[steps[j],steps[i]];return {...p,steps};}
export function validateManifest(v:any){
 if(v?.theme!==undefined&&!Object.hasOwn(themes,v.theme))throw Error('Invalid color theme');
 if(!v||![1,2].includes(v.schemaVersion)||typeof v.title!=='string'||v.title.length>200||!Number.isFinite(v.duration)||v.duration<=0||v.duration>3600||!Number.isFinite(v.width)||v.width<1||v.width>8192||!Number.isFinite(v.height)||v.height<1||v.height>8192||!Array.isArray(v.steps)||v.steps.length<1||v.steps.length>401)throw Error('Invalid project manifest');
 const ids=new Set<string>();for(const s of v.steps){if(typeof s.id!=='string'||!s.id||ids.has(s.id))throw Error('Duplicate or invalid step ID');ids.add(s.id);}
 for(const s of v.steps){if([s.cardWidth,s.areaWidth,s.areaHeight].some(n=>n!==undefined&&(!Number.isFinite(n)||n<=0||n>1)))throw Error('Invalid overlay dimensions');if(typeof s.title!=='string'||s.title.length>200||typeof s.body!=='string'||s.body.length>5000||![s.x,s.y,s.cardX,s.cardY].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||![s.stillTime,s.clipStart,s.clipEnd].every(n=>Number.isFinite(n)&&n>=0&&n<=v.duration)||s.clipEnd<s.clipStart||!(s.target==='next'||s.target==='end'||ids.has(s.target)))throw Error('Invalid step values or navigation target');
 if(v.schemaVersion===1?typeof s.transition!=='boolean':s.kind==='image'?(!['hotspot','callout','area'].includes(s.style)||typeof s.openByDefault!=='boolean'):s.kind==='title'?(typeof s.buttonText!=='string'||s.buttonText.length>80):s.kind==='video'?(typeof s.autoplay!=='boolean'||s.clipEnd-s.clipStart<.05-1e-8):true)throw Error('Invalid step type or settings');
 }
}

export function splitVideo(p:Project,id:string,time:number):Project{
 const i=p.steps.findIndex(s=>s.id===id),s=p.steps[i];
 if(!s||s.kind!=='video'||time-s.clipStart<.05-1e-8||s.clipEnd-time<.05-1e-8)return p;
 const tail:Step={...s,id:crypto.randomUUID(),title:`${s.title} (continued)`.slice(0,200),clipStart:time};
 return {...p,steps:[...p.steps.slice(0,i),{...s,clipEnd:time,target:tail.id},tail,...p.steps.slice(i+1)]};
}
export function duplicateStep(p:Project,id:string):Project{
 const i=p.steps.findIndex(s=>s.id===id);if(i<0)return p;
 const s=p.steps[i],copy={...s,id:crypto.randomUUID(),title:`${s.title} (copy)`.slice(0,200)};
 return {...p,steps:[...p.steps.slice(0,i+1),copy,...p.steps.slice(i+1)]};
}

export function withTitleSlide(p:Project,image:Blob):Project{
 if(p.steps.some(s=>s.kind==='title'))return p;
 const title:Step={...p.steps[0],id:crypto.randomUUID(),kind:'title',title:p.title,body:'Follow along with this interactive walkthrough.',buttonText:'Get started',image,stillTime:0,clipStart:0,clipEnd:0,target:'next'};
 return {...p,steps:[title,...p.steps]};
}

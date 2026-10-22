import test from 'node:test';import assert from 'node:assert/strict';import {withTitleSlide,normalizedPoint,splitVideo,duplicateStep,moveStep,deleteStep,nextId,validateManifest,migrateProject,type LegacyProject,type Project} from '../src/model';
const step=(id:string,target='next')=>({id,title:id,body:'text',x:.5,y:.5,cardX:.2,cardY:.2,stillTime:0,image:new Blob(),target,clipStart:0,clipEnd:1,kind:'image' as const,style:'hotspot' as const,openByDefault:true});const project=():Project=>({schemaVersion:2,id:'p',title:'Test',createdAt:0,duration:5,width:1280,height:800,video:new Blob(),steps:[step('a','c'),step('b'),step('c','end')],markers:[],status:'ready',warning:''});
test('coordinates normalize against viewport and clamp',()=>{assert.deepEqual(normalizedPoint(640,400,1280,800),{x:.5,y:.5});assert.deepEqual(normalizedPoint(-1,900,1280,800),{x:0,y:1});assert.throws(()=>normalizedPoint(1,1,0,1));});
test('reorder preserves explicit targets and clip ranges',()=>{const p=moveStep(project(),'c',-1);assert.equal(nextId(p,p.steps[0]),'c');assert.equal(p.steps[1].id,'c');assert.equal(p.steps[0].clipEnd,1);});
test('deletion repairs references to removed step',()=>{const p=deleteStep(project(),'c');assert.equal(p.steps[0].target,'next');assert.equal(nextId(p,p.steps[0]),'b');});
test('import rejects invalid ranges, duplicate IDs and missing targets',()=>{validateManifest(project());for(const change of [{clipEnd:8},{x:NaN},{target:'missing'},{clipStart:2,clipEnd:1}]){const p=project();Object.assign(p.steps[0],change);assert.throws(()=>validateManifest(p));}const p=project();p.steps[1].id='a';assert.throws(()=>validateManifest(p));});

test('v1 migration preserves branches, images and timing without adding opening footage',()=>{
 const p=project();const legacy:LegacyProject={...p,schemaVersion:1,steps:p.steps.map(({kind,...s})=>({...s,transition:true}))};
 const migrated=migrateProject(legacy);validateManifest(migrated);
 assert.equal(migrated.steps[0].id,'a');assert.equal(migrated.steps.length,5);
 const clip=migrated.steps.find(s=>s.id===migrated.steps[0].target)!;
 assert.equal(clip.kind,'video');assert.equal(nextId(migrated,clip),'c');assert.equal(clip.clipEnd,1);
 assert.equal(migrated.steps[0].image,p.steps[0].image);assert.equal(migrated.video,p.video);
 assert.equal(migrated.steps.at(-1)?.target,'end');assert.equal(migrateProject(migrated),migrated);
});
test('v2 validates overlay settings, autoplay and nonempty clips',()=>{
 for(const change of [{kind:'unknown'},{style:'invalid'},{areaWidth:0},{cardWidth:2},{openByDefault:'yes'},{kind:'video',autoplay:true,clipStart:1,clipEnd:1},{kind:'video',autoplay:'yes'}]){const p=project();Object.assign(p.steps[0],change);assert.throws(()=>validateManifest(p));}
});

test('v1 ZIP import and v2 export roundtrip preserve images and explicit branches',async()=>{
 const {zipSync,strToU8}=await import('fflate');const {importProject,exportProject}=await import('../src/archive');
 const p=project();const steps=p.steps.map(({image,kind,...s})=>({...s,transition:true}));
 const bytes=zipSync({'project.json':strToU8(JSON.stringify({...p,schemaVersion:1,steps,mimeType:'video/webm'})),'recording.webm':new Uint8Array([1,2,3]),...Object.fromEntries(steps.map((_,i)=>[`stills/${i}.png`,new Uint8Array([i,4,5])]))});
 const migrated=await importProject(new Blob([bytes]));assert.equal(migrated.schemaVersion,2);assert.equal(migrated.steps.length,5);
 const restored=await importProject(await exportProject(migrated));assert.deepEqual(restored.steps.map(({image,...s})=>s),migrated.steps.map(({image,...s})=>s));
 assert.deepEqual(await restored.steps[0].image.arrayBuffer(),await migrated.steps[0].image.arrayBuffer());assert.deepEqual(await restored.video.arrayBuffer(),await migrated.video.arrayBuffer());
});

test('split preserves incoming IDs, contiguous ranges, and outgoing branches',()=>{const p=project();p.steps[0]={...p.steps[0],kind:'video',autoplay:true};const q=splitVideo(p,'a',.4);validateManifest(q);assert.equal(q.steps.length,4);assert.equal(q.steps[0].id,'a');assert.equal(q.steps[0].clipEnd,.4);assert.equal(q.steps[1].clipStart,.4);assert.equal(nextId(q,q.steps[0]),q.steps[1].id);assert.equal(nextId(q,q.steps[1]),'c');assert.equal(p.steps[0].clipEnd,1);assert.equal(splitVideo(p,'a',0),p);assert.equal(splitVideo(p,'a',1),p);});
test('duplicate uses a unique ID and keeps original media and branch',()=>{const p=project(),q=duplicateStep(p,'a');validateManifest(q);assert.equal(q.steps.length,4);assert.notEqual(q.steps[0].id,q.steps[1].id);assert.equal(q.steps[1].target,'c');assert.equal(q.steps[1].image,p.steps[0].image);});

test('title insertion preserves all existing steps and is idempotent',()=>{const p=project(),image=new Blob(['opening']);const q=withTitleSlide(p,image);validateManifest(q);assert.equal(q.steps[0].kind,'title');assert.equal(q.steps[0].image,image);assert.equal(nextId(q,q.steps[0]),'a');assert.equal(q.steps[1],p.steps[0]);assert.equal(withTitleSlide(q,image),q);const bad={...q,steps:q.steps.map(s=>s.kind==='title'?{...s,buttonText:123}:s)};assert.throws(()=>validateManifest(bad));});

import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:4181,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:800}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:4181');await page.getByRole('button',{name:'Explore a sample walkthrough'}).click();await page.getByLabel('Callout headline').waitFor({timeout:30000});
 assert.equal(await page.locator('header').getByLabel('Open walkthrough').count(),1);
 const headline=await page.getByLabel('Callout headline').inputValue();
 const row=page.locator('.step-row').nth(2);await row.locator('summary').click();await row.getByRole('button',{name:'Duplicate',exact:true}).click();assert.equal(await page.locator('.step').count(),8);assert.equal(await page.getByLabel('Callout headline').inputValue(),headline);await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.locator('.step').count(),7);
 const originalOrder=await page.locator('.step-label').allTextContents();await row.locator('summary').click();await row.getByRole('button',{name:'Move up',exact:true}).click();assert.equal((await page.locator('.step-label').allTextContents())[1],originalOrder[2]);await page.getByRole('button',{name:'Undo',exact:true}).click();
 await row.locator('summary').click();await row.getByRole('button',{name:'Delete',exact:true}).click();assert.equal(await page.locator('.step').count(),6);assert.equal(await page.getByLabel('Callout headline').inputValue(),headline);await page.getByRole('button',{name:'Undo',exact:true}).click();
 await page.locator('.step').nth(1).click();const before=Number(await page.getByLabel('Clip start',{exact:true}).inputValue());
 await page.getByLabel('Zoom in timeline',{exact:true}).click();await page.getByLabel('Zoom in timeline',{exact:true}).click();assert.equal(Number(await page.getByLabel('Clip start',{exact:true}).inputValue()),before);
 const vp=page.locator('.timeline-viewport');assert.ok(await vp.evaluate(e=>e.scrollWidth>e.clientWidth*3));await vp.evaluate(e=>e.scrollLeft=0);
 const trim=page.getByRole('slider',{name:'Trim start',exact:true});await trim.scrollIntoViewIfNeeded();const box=await trim.boundingBox();const trackWidth=await page.locator('.clip-track').evaluate(e=>e.getBoundingClientRect().width);const duration=Number(await page.getByRole('slider',{name:'Trim end',exact:true}).getAttribute('aria-valuemax'));
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+25,box.y+box.height/2,{steps:5});await page.mouse.up();assert.ok(Math.abs(Number(await trim.getAttribute('aria-valuenow'))-(before+25/trackWidth*duration))<.02);
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(Number(await page.getByLabel('Clip start',{exact:true}).inputValue()),before);
 await page.getByRole('button',{name:'Show full video',exact:true}).click();assert.ok(await vp.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await page.locator('.step').nth(2).click();await page.getByLabel('Overlay style').selectOption('area');
 const inspector=page.locator('.inspector');assert.ok(await inspector.evaluate(e=>e.scrollHeight>e.clientHeight));await inspector.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await inspector.evaluate(e=>e.scrollTop>0));assert.equal(await page.evaluate(()=>window.scrollY),0);
 await page.screenshot({path:'test-results/editor-polish.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/editor-polish-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: header selector, non-selected slide menus and undo, zoomed trim mapping, independent settings scroll, mobile layout.');
}finally{await browser.close();await server.close();}

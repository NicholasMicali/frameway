import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { host: '127.0.0.1', port: 4194, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4194');
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    let count = 0;
    setInterval(() => {
      ctx.fillStyle = count++ % 2 ? '#2264c5' : '#ffffff';
      ctx.fillRect(0, 0, 320, 180);
    }, 33);
    navigator.mediaDevices.getUserMedia = async () => canvas.captureStream(30);
    window.chrome = {
      runtime: {
        onMessage: { addListener: (fn) => (window.recorderListener = fn) },
        sendMessage: async (message) => {
          window.lastMessage = message;
        },
      },
    };
    window.sendRecorder = (message) =>
      new Promise((resolve) =>
        window.recorderListener({ to: 'recorder', ...message }, {}, resolve),
      );
  });
  await page.addScriptTag({ content: await readFile('dist/offscreen.js', 'utf8') });
  const result = await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const now = () => performance.timeOrigin + performance.now();
    const send = window.sendRecorder;
    const marker = (epoch) =>
      send({
        type: 'marker',
        epoch,
        x: 20,
        y: 20,
        width: 320,
        height: 180,
        label: 'Synthetic click',
      });
    const start = await send({ type: 'start', streamId: 'test', session: { id: 'pause-test' } });
    await wait(450);
    await marker(now());
    const pause = await send({ type: 'pause' });
    await wait(300);
    const ignoredTime = now();
    await marker(ignoredTime);
    await wait(900);
    const resume = await send({ type: 'resume' });
    await marker(ignoredTime); // A delayed paused click must not become a recorded click.
    await wait(450);
    await marker(now());
    await send({ type: 'pause' });
    await wait(400);
    await send({ type: 'resume' });
    await wait(350);
    await send({ type: 'stop' });
    while (window.lastMessage?.type !== 'finished') await wait(20);
    const db = await import('/src/db.ts');
    const session = await db.get('sessions', 'pause-test');
    const chunks = [];
    for (let i = 0; i < session.chunkCount; i++)
      chunks.push(await db.get('chunks', `pause-test:${i}`));
    const blob = new Blob(chunks, { type: session.mimeType });
    const video = document.createElement('video');
    video.muted = true;
    video.src = URL.createObjectURL(blob);
    document.body.append(video);
    const frames = [];
    function frame(_, meta) {
      frames.push(meta.mediaTime);
      video.requestVideoFrameCallback(frame);
    }
    video.requestVideoFrameCallback(frame);
    const ended = new Promise((resolve, reject) => {
      video.onended = resolve;
      video.onerror = () => reject(Error('Undecodable video'));
      setTimeout(() => reject(Error('Playback timed out')), 8000);
    });
    await video.play();
    await ended;
    const lastTime = video.currentTime;
    video.remove();
    URL.revokeObjectURL(video.src);
    window.lastMessage = undefined;
    await send({ type: 'start', streamId: 'test', session: { id: 'finish-paused' } });
    await wait(400);
    await send({ type: 'pause' });
    await wait(500);
    await send({ type: 'stop' });
    while (window.lastMessage?.type !== 'finished') await wait(20);
    return {
      start,
      pause,
      resume,
      session,
      lastTime,
      frames,
      pausedSession: await db.get('sessions', 'finish-paused'),
    };
  });
  assert.equal(result.start.ok, true);
  assert.equal(result.pause.ok, true);
  assert.equal(result.resume.ok, true);
  assert.equal(result.session.status, 'complete');
  assert.equal(result.session.markers.length, 2);
  assert.ok(
    result.session.duration > 1 && result.session.duration < 2,
    JSON.stringify(result.session),
  );
  assert.ok(Math.abs(result.lastTime - result.session.duration) < 0.3, JSON.stringify(result));
  assert.ok(result.frames.length > 10);
  assert.ok(
    Math.max(...result.frames.slice(1).map((time, i) => time - result.frames[i])) < 0.5,
    'Paused intervals leaked into playback',
  );
  assert.equal(result.pausedSession.status, 'complete');
  assert.ok(result.pausedSession.duration < 0.8);
  console.log(
    'PASS real MediaRecorder repeated pause/resume, continuous playback timestamps, ignored paused/delayed clicks, and finish while paused.',
  );
} finally {
  await browser.close();
  await server.close();
}

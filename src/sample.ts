import { createProject, fixDuration } from './media';
export async function sampleProject() {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const c = canvas.getContext('2d')!;
  function draw(t: number) {
    const phase = Math.min(2, Math.floor(t / 1.7));
    c.fillStyle = '#f4f5f8';
    c.fillRect(0, 0, 1280, 800);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 220, 800);
    c.fillStyle = '#6354d7';
    c.font = 'bold 25px sans-serif';
    c.fillText('◈  Orbit', 30, 55);
    c.font = '16px sans-serif';
    ['Overview', 'Projects', 'Customers', 'Reports', 'Settings'].forEach((x, i) => {
      c.fillStyle = i === 1 ? '#eeeafd' : '#fff';
      c.fillRect(14, 100 + i * 54, 190, 44);
      c.fillStyle = i === 1 ? '#6354d7' : '#78818c';
      c.fillText(x, 35, 128 + i * 54);
    });
    c.fillStyle = '#253040';
    c.font = 'bold 32px sans-serif';
    c.fillText(phase === 2 ? 'Your workspace is ready' : 'Projects', 270, 80);
    c.font = '16px sans-serif';
    c.fillStyle = '#8b94a1';
    c.fillText('A little more clarity. A lot more momentum.', 270, 116);
    c.fillStyle = '#6858df';
    c.fillRect(1000, 45, 220, 48);
    c.fillStyle = '#fff';
    c.fillText('+  New project', 1050, 75);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = '#fff';
      c.fillRect(270 + i * 320, 165, 294, 150);
      c.fillStyle = '#9198a5';
      c.fillText(['Active projects', 'Team members', 'On track'][i], 292 + i * 320, 198);
      c.fillStyle = '#253040';
      c.font = 'bold 36px sans-serif';
      c.fillText(['12', '8', '94%'][i], 292 + i * 320, 257);
      c.font = '16px sans-serif';
    }
    c.fillStyle = '#fff';
    c.fillRect(270, 350, 934, 355);
    c.fillStyle = '#253040';
    c.font = 'bold 20px sans-serif';
    c.fillText(phase === 2 ? 'Website redesign · created' : 'Recent projects', 295, 392);
    c.font = '16px sans-serif';
    ['Website redesign', 'Brand refresh', 'Customer onboarding', 'Spring launch'].forEach(
      (x, i) => {
        c.fillStyle = '#f0f2f5';
        c.fillRect(295, 420 + i * 65, 880, 1);
        c.fillStyle = '#596576';
        c.fillText(x, 310, 460 + i * 65);
        c.fillStyle = '#dff4e9';
        c.fillRect(1000, 438 + i * 65, 135, 28);
        c.fillStyle = '#368466';
        c.fillText('In progress', 1015, 458 + i * 65);
      },
    );
    if (phase === 1) {
      c.fillStyle = 'rgba(25,30,50,.3)';
      c.fillRect(0, 0, 1280, 800);
      c.fillStyle = '#fff';
      c.fillRect(390, 220, 500, 335);
      c.fillStyle = '#253040';
      c.font = 'bold 24px sans-serif';
      c.fillText('Create a project', 425, 270);
      c.font = '16px sans-serif';
      c.fillStyle = '#7d8798';
      c.fillText('Project name', 425, 320);
      c.strokeStyle = '#d8dce5';
      c.strokeRect(425, 340, 430, 52);
      c.fillStyle = '#253040';
      c.fillText('Website redesign', 440, 373);
      c.fillStyle = '#6858df';
      c.fillRect(655, 455, 200, 50);
      c.fillStyle = '#fff';
      c.fillText('Create project', 698, 487);
    }
    const x = phase === 0 ? 1110 : phase === 1 ? 750 : 750,
      y = phase === 0 ? 72 : phase === 1 ? 480 : 465;
    c.fillStyle = '#f6b85c';
    c.beginPath();
    c.arc(x, y, 9 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
    c.fill();
  }
  draw(0);
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const start = performance.now();
  recorder.start(500);
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      draw(t);
      if (t < 5.2) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });
  stream.getTracks().forEach((t) => t.stop());
  const duration = (performance.now() - start) / 1000;
  const blob = await fixDuration(new Blob(chunks, { type: mime }), duration * 1000);
  const markers = [
    { time: 1.5, x: 1110 / 1280, y: 72 / 800, label: 'Create your first project' },
    { time: 3.2, x: 750 / 1280, y: 480 / 800, label: 'Give your project a home' },
  ].map((m) => ({
    ...m,
    id: crypto.randomUUID(),
    viewportWidth: 1280,
    viewportHeight: 800,
    lagMs: 0,
  }));
  const p = await createProject(blob, duration, markers, 'A better first impression');
  p.steps.filter((s) => s.kind === 'image')[0].body =
    'Start something new. Open a project to bring your team, plans, and progress together.';
  p.steps.filter((s) => s.kind === 'image')[1].body =
    'Name your project, then make it official. Watch the next moment unfold.';
  return p;
}

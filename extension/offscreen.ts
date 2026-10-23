import { put } from '../src/db';
import { normalizedPoint, type Marker } from '../src/model';
let recorder: MediaRecorder | undefined,
  stream: MediaStream | undefined,
  active: any,
  epoch = 0,
  index = 0,
  markers: Marker[] = [],
  writes = Promise.resolve(),
  warning = '',
  failure = '';
function enqueue(fn: () => Promise<void>) {
  writes = writes.then(fn).catch((e) => {
    failure = String(e);
    if (recorder?.state === 'recording') recorder.stop();
  });
}
async function start(m: any) {
  if (recorder && recorder.state !== 'inactive') throw Error('Already recording');
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId },
    } as MediaTrackConstraints,
  });
  // Wait for a decodable stream frame before starting the recorder clock.
  const probe = document.createElement('video');
  probe.muted = true;
  probe.srcObject = stream;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Capture stream did not deliver a frame')), 10000);
    probe.onloadeddata = () => {
      clearTimeout(timer);
      resolve();
    };
    probe.onerror = () => {
      clearTimeout(timer);
      reject(Error('Capture stream could not be decoded'));
    };
    probe.play().catch(reject);
  });
  probe.pause();
  probe.srcObject = null;
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((x) =>
    MediaRecorder.isTypeSupported(x),
  );
  if (!mime) throw Error('WebM recording is unavailable');
  active = { ...m.session, status: 'recording', mimeType: mime };
  index = 0;
  markers = [];
  warning = '';
  failure = '';
  writes = Promise.resolve();
  await put('sessions', active);
  recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
  recorder.ondataavailable = (e) => {
    if (e.data.size) {
      const key = `${active.id}:${index++}`;
      enqueue(() => put('chunks', e.data, key));
    }
  };
  recorder.onerror = () => {
    failure = 'MediaRecorder failed';
  };
  recorder.onstop = async () => {
    const duration = (performance.timeOrigin + performance.now() - epoch) / 1000;
    stream?.getTracks().forEach((t) => t.stop());
    await writes;
    try {
      await put('sessions', {
        ...active,
        status: failure ? 'failed' : 'complete',
        duration,
        markers,
        chunkCount: index,
        warning: failure || warning,
      });
      await chrome.runtime.sendMessage({
        to: 'worker',
        type: failure ? 'error' : 'finished',
        id: active.id,
        error: failure,
      });
    } catch (e) {
      await chrome.runtime.sendMessage({
        to: 'worker',
        type: 'error',
        error: `Saving failed: ${e}`,
      });
    }
  };
  stream.getVideoTracks()[0].onended = () => {
    warning = 'Sharing stopped. Review the last step.';
    if (recorder?.state === 'recording') recorder.stop();
  };
  await new Promise<void>((resolve) => {
    recorder!.onstart = () => {
      epoch = performance.timeOrigin + performance.now();
      resolve();
    };
    recorder!.start(1000);
  });
  return { ok: true };
}
chrome.runtime.onMessage.addListener((m, _sender, reply) => {
  if (m.to !== 'recorder') return;
  (async () => {
    if (m.type === 'start') return start(m);
    if (m.type === 'stop') {
      warning = m.reason || warning;
      if (recorder?.state === 'recording') recorder.stop();
      else if (!recorder) throw Error('No active recorder');
      return { ok: true };
    }
    if (m.type === 'marker' && recorder?.state === 'recording') {
      const received = performance.timeOrigin + performance.now();
      const p = normalizedPoint(m.x, m.y, m.width, m.height);
      markers.push({
        id: crypto.randomUUID(),
        time: Math.max(0, (m.epoch - epoch) / 1000),
        ...p,
        label: m.label,
        viewportWidth: m.width,
        viewportHeight: m.height,
        lagMs: received - m.epoch,
      });
      enqueue(() => put('sessions', { ...active, markers: [...markers], chunkCount: index }));
      return { ok: true };
    }
    return { ok: false };
  })().then(reply, (e) => {
    stream?.getTracks().forEach((t) => t.stop());
    reply({ ok: false, error: String(e) });
  });
  return true;
});

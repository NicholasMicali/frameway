import { RecordingClock } from '../src/recording-clock';
import { put } from '../src/db';
import { normalizedPoint, type Marker } from '../src/model';
let recorder: MediaRecorder | undefined,
  stream: MediaStream | undefined,
  active: any,
  clock = new RecordingClock(0),
  index = 0,
  markers: Marker[] = [],
  writes = Promise.resolve(),
  warning = '',
  failure = '';
function enqueue(fn: () => Promise<void>) {
  writes = writes.then(fn).catch((e) => {
    failure = String(e);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
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
    const duration = clock.duration(performance.timeOrigin + performance.now());
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
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  };
  await new Promise<void>((resolve) => {
    recorder!.onstart = () => {
      clock = new RecordingClock(performance.timeOrigin + performance.now());
      resolve();
    };
    recorder!.start(1000);
  });
  return { ok: true };
}
async function changeState(type: 'pause' | 'resume') {
  const current = recorder;
  if (!current || current.state !== (type === 'pause' ? 'recording' : 'paused'))
    throw Error('Recording is not ready for this action. Reopen the recording menu.');
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      current.removeEventListener(type, done);
      current.removeEventListener('stop', ended);
      current.removeEventListener('error', ended);
    };
    const done = () => {
      cleanup();
      const now = performance.timeOrigin + performance.now();
      if (type === 'pause') clock.pause(now);
      else clock.resume(now);
      resolve();
    };
    const ended = () => {
      cleanup();
      reject(Error('Recording ended before the action completed.'));
    };
    const timer = setTimeout(ended, 5000);
    current.addEventListener(type, done);
    current.addEventListener('stop', ended);
    current.addEventListener('error', ended);
    try {
      current[type]();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
  return { ok: true };
}
chrome.runtime.onMessage.addListener((m, _sender, reply) => {
  if (m.to !== 'recorder') return;
  (async () => {
    if (m.type === 'start') return start(m);
    if (m.type === 'pause' || m.type === 'resume') return changeState(m.type);
    if (m.type === 'stop') {
      warning = m.reason || warning;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      else if (!recorder) throw Error('No active recorder');
      return { ok: true };
    }
    if (m.type === 'marker' && recorder?.state === 'recording') {
      const time = clock.time(m.epoch);
      if (time === undefined || !Number.isFinite(time)) return { ok: false };
      const received = performance.timeOrigin + performance.now();
      const p = normalizedPoint(m.x, m.y, m.width, m.height);
      markers.push({
        id: crypto.randomUUID(),
        time,
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
    if (m.type === 'start') stream?.getTracks().forEach((t) => t.stop());
    reply({ ok: false, error: String(e) });
  });
  return true;
});

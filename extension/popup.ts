import type { CaptureSession, CaptureControl } from './protocol';
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
let paused = false;
export {};
const record = document.querySelector<HTMLButtonElement>('#record')!;
const label = document.querySelector<HTMLElement>('#record-label')!;
const status = document.querySelector<HTMLElement>('#status')!;
const error = document.querySelector<HTMLElement>('#error')!;
let recording = false;
let busy = false;
function showError(e: unknown) {
  error.textContent = String(e);
  error.hidden = false;
}
async function refresh() {
  const capture = (await chrome.storage.session.get('capture')).capture as
    CaptureSession | undefined;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  paused = capture?.state === 'paused';
  recording = capture?.state === 'recording' || paused;
  const transitioning = capture && !recording;
  pauseButton.hidden = !capture || capture.state === 'starting' || capture.state === 'stopping';
  pauseButton.disabled = busy || !!transitioning;
  document.body.dataset.capture = capture?.state ?? 'idle';
  pauseButton.dataset.paused = String(paused);
  document.querySelector('#pause-label')!.textContent = paused
    ? 'Resume'
    : capture?.state === 'pausing'
      ? 'Pausing…'
      : capture?.state === 'resuming'
        ? 'Resuming…'
        : 'Pause';
  const supported = !!tab?.url && /^https?:\/\//.test(tab.url);
  label.textContent = recording
    ? 'Finish'
    : transitioning
      ? capture.state === 'starting'
        ? 'Starting…'
        : capture.state === 'stopping'
          ? 'Finishing…'
          : 'Please wait…'
      : 'Record this tab';
  record.setAttribute('aria-label', recording ? 'Finish recording' : label.textContent!);
  pauseButton.setAttribute('aria-label', paused ? 'Resume recording' : 'Pause recording');
  record.dataset.recording = String(recording);
  record.disabled = busy || !!transitioning || (!capture && !supported);
  status.textContent = capture
    ? recording
      ? paused
        ? 'Paused · Nothing is being captured.'
        : 'Recording · Video and clicks'
      : capture?.state === 'stopping'
        ? 'Finishing your recording. The editor will open when it is ready.'
        : 'Please wait while your recording is prepared.'
    : supported
      ? 'Capture this tab’s video and clicks.'
      : 'Open a regular web page to record. Your projects are always available below.';
}
record.addEventListener('click', async () => {
  busy = true;
  record.disabled = true;
  pauseButton.disabled = true;
  error.hidden = true;
  try {
    const result = await chrome.runtime.sendMessage({
      to: 'worker',
      type: recording ? 'stop-capture' : 'start-capture',
    } satisfies CaptureControl);
    if (!result?.ok) throw Error(result?.error || 'Could not update recording. Please try again.');
    window.close();
  } catch (e) {
    showError(e);
  } finally {
    busy = false;
    await refresh().catch(showError);
  }
});
document.querySelector('#open')!.addEventListener('click', async () => {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL('index.html#home') });
    window.close();
  } catch (e) {
    showError(e);
  }
});
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'session') void refresh().catch(showError);
});
void refresh().catch(showError);

pauseButton.addEventListener('click', async () => {
  busy = true;
  record.disabled = true;
  pauseButton.disabled = true;
  error.hidden = true;
  try {
    const result = await chrome.runtime.sendMessage({
      to: 'worker',
      type: paused ? 'resume-capture' : 'pause-capture',
    } satisfies CaptureControl);
    if (!result?.ok) throw Error(result?.error || 'Could not update recording.');
    window.close();
  } catch (e) {
    showError(e);
  } finally {
    busy = false;
    await refresh().catch(showError);
  }
});

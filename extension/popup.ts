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
    { state: 'starting' | 'recording' | 'stopping' } | undefined;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  recording = capture?.state === 'recording';
  const transitioning = capture && !recording;
  const supported = !!tab?.url && /^https?:\/\//.test(tab.url);
  label.textContent = recording
    ? 'Stop recording'
    : transitioning
      ? capture.state === 'starting'
        ? 'Starting…'
        : 'Finishing…'
      : 'Record this tab';
  document.querySelector('#record-icon')!.textContent = recording ? '■' : '●';
  record.dataset.recording = String(recording);
  record.disabled = busy || !!transitioning || (!capture && !supported);
  status.textContent = capture
    ? recording
      ? 'Recording in progress. Stop to open the editor.'
      : 'Please wait while your recording is prepared.'
    : supported
      ? 'Capture this tab’s video and clicks.'
      : 'Open a regular web page to record. Your projects are always available below.';
}
record.addEventListener('click', async () => {
  busy = true;
  record.disabled = true;
  error.hidden = true;
  try {
    const result = await chrome.runtime.sendMessage({
      to: 'worker',
      type: recording ? 'stop-capture' : 'start-capture',
    });
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

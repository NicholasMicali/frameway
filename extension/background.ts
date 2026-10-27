type Session = {
  id: string;
  tabId: number;
  origin: string;
  title: string;
  state: 'starting' | 'recording' | 'stopping';
};
const session = async () =>
  (await chrome.storage.session.get('capture')).capture as Session | undefined;
async function badge(text: string, color = '#1685e6') {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}
async function start(tab: chrome.tabs.Tab) {
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url))
    throw Error('Open a regular http or https page before recording.');
  const s: Session = {
    id: crypto.randomUUID(),
    tabId: tab.id,
    origin: new URL(tab.url).origin,
    title: tab.title || 'Untitled walkthrough',
    state: 'starting',
  };
  await chrome.storage.session.set({ capture: s });
  try {
    if (
      !(
        await chrome.runtime.getContexts({
          contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
        })
      ).length
    )
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Record continuous tab video with click markers',
      });
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
    const response = await chrome.runtime.sendMessage({
      to: 'recorder',
      type: 'start',
      streamId,
      session: s,
    });
    if (!response?.ok) throw Error(response?.error || 'Recorder did not start');
    await chrome.storage.session.set({ capture: { ...s, state: 'recording' } });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await badge('REC');
  } catch (e) {
    await chrome.runtime
      .sendMessage({ to: 'recorder', type: 'stop', reason: 'Recording setup failed' })
      .catch(() => {});
    await chrome.storage.session.remove('capture');
    throw e;
  }
}
async function stop(reason = '') {
  const s = await session();
  if (!s || s.state === 'stopping') return;
  await chrome.storage.session.set({ capture: { ...s, state: 'stopping' } });
  await badge('…');
  const result = await chrome.runtime.sendMessage({ to: 'recorder', type: 'stop', reason });
  if (!result?.ok)
    throw Error(result?.error || 'Recorder unavailable. Open the studio to inspect saved chunks.');
}
async function fail(e: unknown) {
  await chrome.storage.session.remove('capture');
  await chrome.storage.local.set({ captureError: String(e) });
  await badge('!', '#c33f55');
  await chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
}
chrome.tabs.onUpdated.addListener((id, info, tab) => {
  (async () => {
    const s = await session();
    if (!s || s.tabId !== id || s.state !== 'recording') return;
    if (info.url && new URL(info.url).origin !== s.origin) {
      await stop('Recording ended at an origin change. Review the final step.');
      return;
    }
    if (info.status === 'complete') {
      await chrome.scripting.executeScript({ target: { tabId: id }, files: ['content.js'] });
    }
  })().catch((e) => stop(String(e)).catch(fail));
});
chrome.tabs.onRemoved.addListener((id) => {
  session()
    .then((s) => {
      if (s?.tabId === id) return stop('The recorded tab was closed.');
    })
    .catch(fail);
});
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (m.to !== 'worker') return;
  (async () => {
    if (m.type === 'start-capture' || m.type === 'stop-capture') {
      if (sender.url !== chrome.runtime.getURL('popup.html')) return { ok: false };
      const current = await session();
      if (m.type === 'start-capture') {
        if (current) return { ok: false, error: 'A recording is already in progress.' };
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return { ok: false, error: 'Open a web page before recording.' };
        await start(tab);
      } else {
        if (current?.state !== 'recording')
          return { ok: false, error: 'Recording is not ready to stop.' };
        await stop();
      }
      return { ok: true };
    }
    if (m.type === 'marker') {
      const s = await session();
      if (!s || s.state !== 'recording' || sender.tab?.id !== s.tabId || sender.frameId !== 0)
        return { ok: false };
      await chrome.runtime.sendMessage({ ...m, to: 'recorder' });
      return { ok: true };
    }
    if (m.type === 'finished') {
      await chrome.storage.session.remove('capture');
      await badge('');
      await chrome.tabs.create({
        url: chrome.runtime.getURL(`index.html?session=${encodeURIComponent(m.id)}`),
      });
      return { ok: true };
    }
    if (m.type === 'error') {
      await chrome.storage.session.remove('capture');
      await fail(m.error);
      return { ok: false };
    }
    return { ok: false };
  })().then(reply, (e) => reply({ ok: false, error: String(e) }));
  return true;
});

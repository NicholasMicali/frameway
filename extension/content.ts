(() => {
  const w = window as typeof window & { __frameway?: boolean };
  if (w.__frameway) return;
  w.__frameway = true;
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return;
      const el = e.composedPath().find((x) => x instanceof HTMLElement) as HTMLElement | undefined;
      // Do not collect input values or arbitrary page text.
      const label =
        el?.closest('button,a,[role="button"]')?.getAttribute('aria-label') ||
        el?.closest('button,a,[role="button"]')?.textContent?.trim().slice(0, 80) ||
        'Click to continue';
      chrome.runtime
        .sendMessage({
          to: 'worker',
          type: 'marker',
          epoch: performance.timeOrigin + performance.now(),
          x: e.clientX,
          y: e.clientY,
          width: innerWidth,
          height: innerHeight,
          label,
        })
        .catch(() => {});
    },
    true,
  );
})();

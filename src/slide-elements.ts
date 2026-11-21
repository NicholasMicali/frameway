export type SlideElement = {
  id: string;
  kind: 'arrow' | 'card';
  variant: 'card' | 'tip' | 'warning' | 'info';
  x: number;
  y: number;
  endX: number;
  endY: number;
  width: number;
  title: string;
  body: string;
  collapsed: boolean;
};
export function validateElements(value: unknown) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 20) throw Error('Invalid slide elements');
  const ids = new Set();
  for (const e of value) {
    if (
      !e ||
      typeof e.id !== 'string' ||
      !e.id ||
      e.id.length > 100 ||
      ids.has(e.id) ||
      !['arrow', 'card'].includes(e.kind) ||
      !['card', 'tip', 'warning', 'info'].includes(e.variant) ||
      ![e.x, e.y, e.endX, e.endY].every((n) => Number.isFinite(n) && n >= 0 && n <= 1) ||
      !Number.isFinite(e.width) ||
      e.width < 0.18 ||
      e.width > 0.6 ||
      typeof e.title !== 'string' ||
      e.title.length > 200 ||
      typeof e.body !== 'string' ||
      e.body.length > 5000 ||
      typeof e.collapsed !== 'boolean'
    )
      throw Error('Invalid slide element');
    ids.add(e.id);
  }
}
export function newElement(type: 'arrow' | SlideElement['variant']): SlideElement {
  return {
    id: crypto.randomUUID(),
    kind: type === 'arrow' ? 'arrow' : 'card',
    variant: type === 'arrow' ? 'card' : type,
    x: 0.15,
    y: 0.2,
    endX: 0.42,
    endY: 0.4,
    width: 0.28,
    title:
      type === 'arrow'
        ? 'Arrow'
        : { card: 'More context', tip: 'Helpful tip', warning: 'Important', info: 'Good to know' }[
            type
          ],
    body: 'Add your explanation here.',
    collapsed: type === 'tip' || type === 'info',
  };
}

// Self-contained DOM renderer shared by the editor and offline player.
export function renderElements(
  host: HTMLElement,
  elements: SlideElement[],
  options: {
    editing?: boolean;
    selected?: string;
    open?: string;
    zoom?: { scale: number; tx: number; ty: number };
    select?: (id: string) => void;
    toggle?: (id: string) => void;
  },
) {
  const focusWasInside = host.contains(document.activeElement);
  const focusLabel = document.activeElement?.getAttribute('aria-label');
  host.replaceChildren();
  const z = options.zoom ?? { scale: 1, tx: 0, ty: 0 };
  host.dataset.zoom = String(z.scale > 1);
  const point = (x: number, y: number) => ({ x: x * z.scale + z.tx, y: y * z.scale + z.ty });
  const node = (tag: string, className: string, parent: Element, text = '') => {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    parent.append(el);
    return el;
  };
  const symbols = { card: '▤', tip: '✧', warning: '!', info: 'i' };
  for (const e of elements) {
    const p = point(e.x, e.y);
    if (e.kind === 'arrow') {
      const end = point(e.endX, e.endY);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.classList.add('extra-arrow');
      svg.setAttribute('aria-label', e.title || 'Arrow');
      // Two lines form a screen-space arrowhead, avoiding distortion at wide aspect ratios.
      const w = host.clientWidth || 1,
        h = host.clientHeight || 1;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const angle = Math.atan2((end.y - p.y) * h, (end.x - p.x) * w);
      const path = document.createElementNS(svg.namespaceURI, 'path');
      const a = (offset: number) =>
        `${end.x * w - 15 * Math.cos(angle + offset)} ${end.y * h - 15 * Math.sin(angle + offset)}`;
      path.setAttribute('d', `M ${p.x * w} ${p.y * h} L ${end.x * w} ${end.y * h}`);
      path.classList.add('extra-arrow-stem');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('data-element-id', e.id);
      path.setAttribute('data-handle', 'move');
      path.addEventListener('click', () => options.select?.(e.id));
      const head = document.createElementNS(svg.namespaceURI, 'path');
      head.setAttribute('d', `M ${a(0.5)} L ${end.x * w} ${end.y * h} L ${a(-0.5)}`);
      head.setAttribute('vector-effect', 'non-scaling-stroke');
      head.setAttribute('data-element-id', e.id);
      head.setAttribute('data-handle', 'move');
      head.addEventListener('click', () => options.select?.(e.id));
      svg.append(path, head);
      host.append(svg);
      if (options.editing)
        for (const [handle, pos] of [
          ['start', p],
          ['end', end],
        ] as const) {
          const dot = node(
            'button',
            `extra-arrow-handle ${options.selected === e.id ? 'selected' : ''}`,
            host,
          );
          dot.setAttribute('aria-label', `${e.title} ${handle}`);
          dot.dataset.elementId = e.id;
          dot.dataset.handle = handle;
          dot.style.left = `${pos.x * 100}%`;
          dot.style.top = `${pos.y * 100}%`;
          dot.onclick = () => options.select?.(e.id);
        }
      continue;
    }
    const expanded = options.editing || !e.collapsed || options.open === e.id;
    const wrap = node(
      'div',
      `extra-item extra-${e.variant} ${options.selected === e.id && options.editing ? 'selected' : ''}`,
      host,
    );
    wrap.dataset.elementId = e.id;
    const width = expanded
      ? Math.min(
          host.clientWidth * (window.matchMedia('(max-width: 600px)').matches ? 0.8 : e.width),
          Math.max(0, host.clientWidth - 16),
        )
      : 36;
    wrap.style.width = `${width}px`;
    // Expanded panels keep their readable size even when the screenshot is zoomed.
    wrap.style.left = `${Math.max(8, Math.min(p.x * host.clientWidth, host.clientWidth - width - 8))}px`;
    wrap.style.top = `${Math.max(8, p.y * host.clientHeight)}px`;
    if (!expanded) {
      const button = node('button', 'extra-trigger motion-enter', wrap, symbols[e.variant]);
      button.setAttribute('aria-label', `Open ${e.variant}: ${e.title}`);
      button.setAttribute('aria-expanded', 'false');
      button.onclick = () => options.toggle?.(e.id);
    } else {
      const panel = node('section', 'extra-panel motion-enter', wrap);
      panel.setAttribute('aria-label', `${e.variant}: ${e.title}`);
      const heading = node('div', 'extra-heading', panel);
      if (options.editing) {
        heading.dataset.handle = 'move';
        heading.dataset.elementId = e.id;
      }
      if (e.variant !== 'card') node('span', 'extra-symbol', heading, symbols[e.variant]);
      node('strong', '', heading, e.title);
      if (!options.editing && e.collapsed) {
        const close = node('button', 'extra-close', heading, '×');
        close.setAttribute('aria-label', `Close ${e.title}`);
        close.onclick = () => options.toggle?.('');
      }
      node('p', '', panel, e.body);
      if (options.editing) wrap.onclick = () => options.select?.(e.id);
      // Keep the whole panel on screen, including long descriptions.
      panel.style.maxHeight = `${Math.max(60, host.clientHeight - 16)}px`;
      wrap.style.top = `${Math.max(8, Math.min(p.y * host.clientHeight, host.clientHeight - wrap.offsetHeight - 8))}px`;
    }
  }
  if (focusWasInside) {
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
    const previous = buttons.find((b) => b.getAttribute('aria-label') === focusLabel);
    const replacement = options.open
      ? buttons.find((b) => b.classList.contains('extra-close'))
      : buttons.find(
          (b) =>
            b.classList.contains('extra-trigger') &&
            b.getAttribute('aria-label')?.endsWith(focusLabel?.replace(/^Close /, '') ?? ''),
        );
    (previous ?? replacement)?.focus({ preventScroll: true });
  }
}

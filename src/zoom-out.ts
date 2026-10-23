// Self-contained: this function is also embedded in the offline player.
export function zoomOut(container: HTMLElement) {
  const image = container.querySelector<HTMLElement>('.area-zoom-image');
  const outline = container.querySelector<HTMLElement>('.area-zoom-hotspot');
  if (
    !image ||
    !outline ||
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Number(image.style.getPropertyValue('--zoom-scale')) <= 1
  )
    return;
  const imageStyle = getComputedStyle(image);
  const outlineStyle = getComputedStyle(outline);
  const options: KeyframeAnimationOptions = {
    duration: 650,
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    fill: 'forwards',
  };
  const animations = [
    image.animate(
      [{ transform: imageStyle.transform }, { transform: 'translate(0, 0) scale(1)' }],
      options,
    ),
    outline.animate(
      [
        { transform: outlineStyle.transform, left: outlineStyle.left, top: outlineStyle.top },
        {
          transform: 'translate(-50%, -50%) scale(1)',
          left: outline.style.left,
          top: outline.style.top,
        },
      ],
      options,
    ),
  ];
  return {
    finished: Promise.all(animations.map((animation) => animation.finished)).catch(() => undefined),
    cancel: () => animations.forEach((animation) => animation.cancel()),
  };
}

type IconName = 'undo' | 'redo' | 'more' | 'plus' | 'minus' | 'settings' | 'upload' | 'trash';
const paths: Record<IconName, string> = {
  settings: 'M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  undo: 'M9 5 4 10l5 5M4 10h9a7 7 0 0 1 7 7',
  redo: 'm15 5 5 5-5 5M20 10h-9a7 7 0 0 0-7 7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
};
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

type IconName = 'undo' | 'redo' | 'more' | 'plus' | 'minus';
const paths: Record<IconName, string> = {
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

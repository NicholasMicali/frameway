type IconName =
  | 'copy'
  | 'undo'
  | 'redo'
  | 'more'
  | 'plus'
  | 'minus'
  | 'settings'
  | 'upload'
  | 'trash'
  | 'search'
  | 'download'
  | 'record'
  | 'edit'
  | 'share'
  | 'chevron'
  | 'folder'
  | 'arrow';
const paths: Record<IconName, string> = {
  copy: 'M9 9h12v12H9ZM15 9V3H3v12h6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  record: 'M15 8l6-3v14l-6-3M3 5h12v14H3Z',
  edit: 'm14 4 6 6M3 21l5-1L21 7l-4-4L4 16Z',
  share: 'M12 16V3m-5 5 5-5 5 5M4 13v8h16v-8',
  chevron: 'm6 9 6 6 6-6',
  folder: 'M3 5h7l2 3h9v12H3Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
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

/** Portable download basename; keep project titles unchanged inside the export. */
export function exportName(title: string): string {
  let name = Array.from(
    title
      .normalize('NFC')
      .replace(/[<>:"/\\|?*\p{Cc}]/gu, '-')
      .trim(),
  )
    .slice(0, 60)
    .join('')
    .replace(/[. ]+$/g, '');
  if (!name || /^[-. ]+$/.test(name)) name = 'Untitled project';
  if (/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(name)) name = '_' + name;
  return name;
}

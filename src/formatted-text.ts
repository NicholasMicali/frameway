/** A deliberately small text format. Raw HTML is always escaped, never interpreted. */
export const escapeText = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function safeActionURL(value: string) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function formattedText(text: string, enabled = false): string {
  if (!enabled) return `<p>${escapeText(text)}</p>`;
  const inline = (value: string) =>
    escapeText(value)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  let list = '';
  let result = '';
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*(- |\d+\. )(.*)$/);
    const kind = match ? (match[1] === '- ' ? 'ul' : 'ol') : '';
    if (list !== kind) {
      if (list) result += `</${list}>`;
      if (kind) result += `<${kind}>`;
      list = kind;
    }
    result += match ? `<li>${inline(match[2])}</li>` : `<p>${inline(line) || '<br>'}</p>`;
  }
  return result + (list ? `</${list}>` : '');
}

export type TextRun = { text: string; weight: string };
export type TextLine = { runs: TextRun[]; indent: number; gapAfter: number };

// Lay out whole words across style boundaries; split only words wider than the card.
export function layoutVideoText(
  value: string,
  width: number,
  measure: (text: string, weight: string) => number,
  formatted = true,
): TextLine[] {
  const result: TextLine[] = [];
  for (const paragraph of value.split('\n')) {
    const list = formatted ? paragraph.match(/^\s*(- |\d+\. )(.*)$/) : null;
    const prefix = list ? (list[1] === '- ' ? '• ' : list[1]) : '';
    const indent = measure(prefix, '400');
    let runs: TextRun[] = prefix ? [{ text: prefix, weight: '400' }] : [];
    let length = indent;
    let firstLine = true;
    const push = () => {
      result.push({ runs, indent: firstLine ? 0 : indent, gapAfter: 0 });
      firstLine = false;
      runs = [];
      length = indent;
    };
    const append = (run: TextRun) => {
      const last = runs.at(-1);
      if (last?.weight === run.weight) {
        const before = measure(last.text, last.weight);
        last.text += run.text;
        length += measure(last.text, last.weight) - before;
      } else {
        runs.push({ ...run });
        length += measure(run.text, run.weight);
      }
    };
    const source = list ? list[2] : paragraph;
    const tokens = formatted ? source.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g) : [source];
    const words: TextRun[][] = [];
    let word: TextRun[] = [];
    for (const token of tokens) {
      const weight =
        formatted && /^\*\*[^*]+\*\*$/.test(token)
          ? '700'
          : formatted && /^\*[^*]+\*$/.test(token)
            ? 'italic'
            : '400';
      const clean =
        weight === '700' ? token.slice(2, -2) : weight === 'italic' ? token.slice(1, -1) : token;
      for (const part of clean.split(/(\s+)/).filter(Boolean)) {
        if (/^\s+$/.test(part)) {
          if (word.length) words.push(word);
          words.push([{ text: ' ', weight }]);
          word = [];
        } else word.push({ text: part, weight });
      }
    }
    if (word.length) words.push(word);
    let space: TextRun | undefined;
    for (const parts of words) {
      if (parts.length === 1 && parts[0].text === ' ') {
        space = parts[0];
        continue;
      }
      const wordWidth = parts.reduce((n, r) => n + measure(r.text, r.weight), 0);
      if (length > indent && length + (space ? measure(' ', space.weight) : 0) + wordWidth > width)
        push();
      if (space && length > indent) append(space);
      space = undefined;
      if (wordWidth <= width - indent) parts.forEach(append);
      else
        for (const part of parts)
          for (const char of part.text) {
            if (length > indent && length + measure(char, part.weight) > width) push();
            append({ text: char, weight: part.weight });
          }
    }
    push();
    result.at(-1)!.gapAfter = formatted ? (list ? 0.25 : 0.6) : 0;
  }
  return result;
}

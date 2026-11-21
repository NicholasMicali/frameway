import { useEffect, useRef, useState } from 'react';
import type { Step } from './model';
import { safeActionURL } from './formatted-text';
export function BodyEditor({
  step,
  onPatch,
}: {
  step: Step;
  onPatch: (patch: Partial<Step>) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  function format(kind: string) {
    const el = input.current!;
    const start = el.selectionStart,
      end = el.selectionEnd;
    const selection = step.body.slice(start, end);
    const replacement = `${kind}${selection || 'text'}${kind}`;
    const body = step.body.slice(0, start) + replacement + step.body.slice(end);
    if (body.length > 5000) return;
    onPatch({ body, bodyFormat: 'basic' });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  }
  return (
    <>
      <div className="format-tools" role="group" aria-label="Callout formatting">
        <button type="button" aria-label="Bold" onClick={() => format('**')}>
          <strong>B</strong>
        </button>
        <button type="button" aria-label="Italic" onClick={() => format('*')}>
          <em>I</em>
        </button>
      </div>
      <label>
        A little context
        <textarea
          ref={input}
          aria-label="Callout body"
          value={step.body}
          maxLength={5000}
          onChange={(e) => onPatch({ body: e.target.value, bodyFormat: 'basic' })}
        />
      </label>
    </>
  );
}

export function OptionalLinkEditor({
  step,
  onPatch,
}: {
  step: Step;
  onPatch: (patch: Partial<Step>) => void;
}) {
  const [url, setURL] = useState(step.actionUrl ?? '');
  useEffect(() => setURL(step.actionUrl ?? ''), [step.actionUrl]);
  const invalid = !!url && !safeActionURL(url);
  return (
    <details className="optional-link">
      <summary>Optional link</summary>
      <label>
        Link button label
        <input
          aria-label="Action button label"
          maxLength={80}
          value={step.actionLabel ?? ''}
          placeholder="Open documentation"
          onChange={(e) => onPatch({ actionLabel: e.target.value })}
        />
      </label>
      <label>
        Link destination
        <input
          aria-label="Action button URL"
          type="url"
          maxLength={2048}
          value={url}
          placeholder="https://…"
          aria-invalid={invalid}
          onChange={(e) => {
            const value = e.target.value;
            setURL(value);
            if (!value || safeActionURL(value)) onPatch({ actionUrl: value || undefined });
          }}
        />
      </label>
      {invalid ? (
        <p role="alert">
          Enter a full http:// or https:// address without credentials. This invalid address has not
          been saved.
        </p>
      ) : (
        <p className="field-note">
          Optional. Opens a new tab only when clicked. Clear the destination to remove the button.
        </p>
      )}
    </details>
  );
}

import { useEffect, useRef } from 'react';

export function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement) queueMicrotask(() => trigger.focus());
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="utility-dialog shortcut-help"
      aria-labelledby="shortcuts-heading"
      onCancel={onClose}
    >
      <h2 id="shortcuts-heading">Keyboard shortcuts</h2>
      <p>Use Command (⌘) on Mac or Ctrl on Windows and Linux.</p>
      <h3>While editing</h3>
      <dl>
        <div>
          <dt>Undo</dt>
          <dd>
            <kbd>⌘ / Ctrl</kbd> + <kbd>Z</kbd>
          </dd>
        </div>
        <div>
          <dt>Redo</dt>
          <dd>
            <kbd>⌘ / Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
          </dd>
        </div>
      </dl>
      <p className="field-note">
        Project undo and redo apply outside text fields and dialogs, in Edit mode. Inside a text
        field, your browser handles text undo.
      </p>
      <h3>With a timeline trim handle focused</h3>
      <dl>
        <div>
          <dt>Adjust by 0.05 seconds</dt>
          <dd>
            <kbd>←</kbd> / <kbd>→</kbd>
          </dd>
        </div>
        <div>
          <dt>Adjust by 0.5 seconds</dt>
          <dd>
            <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>
          </dd>
        </div>
        <div>
          <dt>Move toward recording start / end</dt>
          <dd>
            <kbd>Home</kbd> / <kbd>End</kbd>
          </dd>
        </div>
      </dl>
      <p className="field-note">Trim handles stop at the other boundary to keep a valid clip.</p>
      <h3>Menus and dialogs</h3>
      <dl>
        <div>
          <dt>Move between controls</dt>
          <dd>
            <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd>
          </dd>
        </div>
        <div>
          <dt>Close a menu or idle dialog</dt>
          <dd>
            <kbd>Esc</kbd>
          </dd>
        </div>
      </dl>
      <div className="utility-actions">
        <button onClick={onClose}>Close shortcuts</button>
      </div>
    </dialog>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { Project } from './model';
import { Icon } from './Icon';
import { download } from './archive';
import { exportInteractive } from './interactive-export';
import { exportName } from './export-name';
import { backupStatus } from './storage-health';

type Format = 'html' | 'zip' | 'backup';
const instructions: Record<Format, string> = {
  html: 'Send the HTML file to your recipient. They should download it and open it in a modern browser. Email and file-sharing previews may block interactive content. No Frameway installation, account, or internet connection is needed to view it.',
  zip: 'Extract the ZIP and keep its files together. Place the folder on your existing website or internal static server. Use embed.html for an HTML iframe example or WalkthroughEmbed.tsx for React. A localhost URL only works on your own computer.',
  backup:
    'Keep the .frameway.zip file somewhere safe. To reopen or edit it later, choose Options → Import project backup in Frameway. This is an editable project, not a file for viewers.',
};
export function ExportDialog({
  project,
  onBackup,
  onClose,
}: {
  project: Project;
  onBackup: (project: Project) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const working = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<Format>();
  const [completed, setCompleted] = useState<Format>();
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement) queueMicrotask(() => trigger.focus());
    };
  }, []);
  useEffect(() => {
    if (completed || error) feedback.current?.scrollIntoView({ block: 'nearest' });
  }, [completed, error]);
  async function run(format: Format) {
    if (working.current) return;
    working.current = true;
    setPending(format);
    setCompleted(undefined);
    setError('');
    try {
      if (format === 'backup') await onBackup(project);
      else
        download(
          await exportInteractive(project, format),
          `${exportName(project.title)}.${format === 'html' ? 'html' : 'zip'}`,
        );
      setCompleted(format);
    } catch (cause) {
      setError(
        `Could not export this project. ${cause instanceof Error ? cause.message : String(cause)} Try again; your project is still here.`,
      );
    } finally {
      working.current = false;
      setPending(undefined);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="export-dialog"
      aria-labelledby="export-heading"
      onCancel={(event) => {
        if (working.current) event.preventDefault();
        else onClose();
      }}
    >
      <div className="export-heading">
        <div>
          <h2 id="export-heading">Export your walkthrough</h2>
          <p>{project.title}</p>
        </div>
        <button aria-label="Close export" disabled={!!pending} onClick={onClose}>
          Close
        </button>
      </div>
      <p className="export-intro">
        Choose how you want to share or keep your work. Files are created on this device.
      </p>
      <div className="export-choices" aria-busy={!!pending}>
        <section className="export-choice export-featured">
          <span className="export-symbol">
            <Icon name="share" />
          </span>
          <div>
            <span className="export-badge">Best for sharing</span>
            <h3>Send a walkthrough</h3>
            <p>
              One interactive HTML file with your screenshots and video. Anyone can open it in a
              browser, even offline.
            </p>
            <button className="primary" disabled={!!pending} onClick={() => void run('html')}>
              <Icon name="download" />
              Download HTML
            </button>
          </div>
        </section>
        <section className="export-choice">
          <span className="export-symbol">
            <Icon name="folder" />
          </span>
          <div>
            <h3>Website embed</h3>
            <p>
              A ZIP with the player, media, and HTML / React embed examples for your existing
              website or internal server.
            </p>
            <button disabled={!!pending} onClick={() => void run('zip')}>
              <Icon name="download" />
              Export embed
            </button>
          </div>
        </section>
        <section className="export-choice">
          <span className="export-symbol">
            <Icon name="edit" />
          </span>
          <div>
            <h3>Editable project backup</h3>
            <p>
              Save a copy you can import into Frameway to continue editing or move to another
              device. HTML and embed exports are for viewing.
            </p>
            <button disabled={!!pending} onClick={() => void run('backup')}>
              <Icon name="download" />
              Export project backup
            </button>
            <small>{backupStatus(project)}. Keep the downloaded ZIP.</small>
          </div>
        </section>
      </div>
      <div ref={feedback}>
        <div role="status" aria-live="polite">
          {pending && (
            <p className="export-result">
              {pending === 'backup'
                ? 'Preparing editable backup'
                : pending === 'html'
                  ? 'Building HTML walkthrough'
                  : 'Building embed package'}
              … Large recordings may take a moment. Please keep this window open.
            </p>
          )}
          {completed && (
            <div className="export-result">
              <strong>Download started — check your downloads</strong>
              <p>{instructions[completed]}</p>
            </div>
          )}
        </div>
        {error && (
          <p className="export-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <p className="export-privacy">
        Exports include the complete original recording. Trimming changes playback ranges; it does
        not remove footage or redact sensitive information. Only share files with people who should
        have access to that recording.
      </p>
    </dialog>
  );
}

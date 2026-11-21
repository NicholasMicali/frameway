import { VideoExport } from './VideoExport';
import { useEffect, useRef, useState } from 'react';
import type { Project } from './model';
import { Icon } from './Icon';
import { download } from './archive';
import { exportInteractive } from './interactive-export';
import { exportName } from './export-name';

type Format = 'html' | 'zip' | 'backup';
const instructions: Record<Format, string> = {
  html: 'Send this HTML file. Recipients download it and open it in their browser, even offline.',
  zip: 'Extract the ZIP on your website or internal server. HTML and React embed examples are included.',
  backup:
    'Send the .frameway.zip file. The recipient opens Options → Import project backup in their Frameway to edit a separate copy. You can also keep it as a backup.',
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
  const [videoBusy, setVideoBusy] = useState(false);
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
          <h2 id="export-heading">Share walkthrough</h2>
          <p>{project.title}</p>
        </div>
        <button
          className="share-close"
          aria-label="Close export"
          disabled={!!pending || videoBusy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="export-intro">Choose a format. Your files stay on this device.</p>
      <div className="share-options" aria-busy={!!pending || videoBusy}>
        {(
          [
            {
              format: 'html',
              icon: 'share',
              title: 'Interactive walkthrough',
              description: 'One HTML file. Watch in any browser, even offline.',
              button: 'Download HTML',
            },
            {
              format: 'zip',
              icon: 'monitor',
              title: 'Website embed',
              description: 'Player files with HTML and React embed examples.',
              button: 'Export embed',
            },
            {
              format: 'backup',
              icon: 'edit',
              title: 'Send to a teammate',
              description: 'An editable copy they can import into their Frameway.',
              button: 'Download project',
            },
          ] as const
        ).map((item) => (
          <section className="share-option" key={item.format}>
            <span className="export-symbol">
              <Icon name={item.icon} />
            </span>
            <div className="share-option-copy">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <button
              className={item.format === 'html' ? 'primary' : ''}
              disabled={!!pending || videoBusy}
              onClick={() => void run(item.format)}
            >
              <Icon name="download" />
              {item.button}
            </button>
          </section>
        ))}
      </div>
      <details
        className="share-video"
        onClick={(event) => {
          if (videoBusy && (event.target as Element).closest('summary')) event.preventDefault();
        }}
      >
        <summary>
          <span className="export-symbol">
            <Icon name="record" />
          </span>
          <span>
            <strong>Video</strong>
            <span className="share-video-caption">
              A video that plays the walkthrough automatically.
            </span>
          </span>
          <Icon name="chevron" />
        </summary>
        {!pending && (
          <VideoExport
            project={project}
            onBusy={(busy) => {
              working.current = busy;
              setVideoBusy(busy);
            }}
          />
        )}
      </details>
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
        HTML, embed, and editable projects contain the original recording, including trimmed
        footage. Video contains rendered clip ranges. Share only content intended for your
        recipient.
      </p>
    </dialog>
  );
}

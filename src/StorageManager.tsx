import { useEffect, useRef, useState } from 'react';
import type { Project } from './model';
import { backupStatus, formatBytes, mediaBytes, storageSummary } from './storage-health';

export function StorageManager({
  projects,
  currentId,
  busy,
  error,
  onClose,
  onBackup,
  onDelete,
}: {
  projects: Project[];
  currentId?: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onBackup: (p: Project) => void;
  onDelete: (p: Project) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [estimate, setEstimate] = useState<StorageEstimate>();
  const [confirm, setConfirm] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    let active = true;
    void navigator.storage
      ?.estimate?.()
      .then((value) => {
        if (active) setEstimate(value);
      })
      .catch(() => {
        if (active) setEstimate(undefined);
      });
    return () => {
      active = false;
    };
  }, [projects]);
  const summary = storageSummary(estimate);
  return (
    <dialog
      ref={dialog}
      className="storage-dialog"
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="storage-heading"
    >
      <div className="storage-heading">
        <h2 id="storage-heading">Storage & backups</h2>
        <button onClick={onClose}>Close</button>
      </div>
      <p role="status">{summary.text}</p>
      {error && <p role="alert">{error}</p>}
      {summary.low && (
        <p className="storage-warning">
          Storage is nearly full. Export backups before removing projects you no longer need.
        </p>
      )}
      <p className="field-note">
        Estimates include this library’s recordings and other browser data. The extension and
        localhost editor have separate libraries. A backup export record does not confirm that you
        kept the downloaded file.
      </p>
      <div className="storage-projects">
        {[...projects]
          .sort((a, b) => mediaBytes(b) - mediaBytes(a))
          .map((p) => (
            <article key={p.id}>
              <strong>{p.title}</strong>
              <p>
                About {formatBytes(mediaBytes(p))} of media · {backupStatus(p)}
              </p>
              {p.localBackup && (
                <p className="field-note">
                  Last export: {new Date(p.localBackup.exportedAt).toLocaleString()}
                </p>
              )}
              <div className="storage-actions">
                <button disabled={busy} onClick={() => onBackup(p)}>
                  Export backup
                </button>
                <button
                  disabled={busy || currentId === p.id}
                  title={
                    currentId === p.id ? 'Return Home before deleting the open project' : undefined
                  }
                  onClick={() => setConfirm(p.id)}
                >
                  Delete project
                </button>
              </div>
              {confirm === p.id && (
                <div className="storage-confirm">
                  <p>
                    Delete “{p.title}” from this browser? Export and keep a backup first. This
                    cannot be undone.
                  </p>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      await onDelete(p);
                      setConfirm('');
                    }}
                  >
                    Confirm delete
                  </button>{' '}
                  <button onClick={() => setConfirm('')}>Keep project</button>
                </div>
              )}
            </article>
          ))}
      </div>
      {!projects.length && <p>No saved projects in this library yet.</p>}
    </dialog>
  );
}

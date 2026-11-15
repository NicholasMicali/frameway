import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import type { Project } from './model';
import { backupStatus, formatBytes, mediaBytes } from './storage-health';

function ProjectActions({
  project,
  busy,
  onBackup,
  onCopy,
  onDelete,
  onRename,
}: {
  project: Project;
  busy: boolean;
  onBackup: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => menu.current?.removeAttribute('open');
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return (
    <details
      ref={menu}
      className="project-actions"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          close();
          menu.current?.querySelector('summary')?.focus();
        }
      }}
    >
      <summary aria-label={`Options for ${project.title}`} title="Project options">
        <Icon name="more" />
      </summary>
      <div className="project-actions-panel">
        <button
          disabled={busy}
          aria-label={`Rename ${project.title}`}
          onClick={() => {
            close();
            menu.current?.querySelector('summary')?.focus();
            onRename();
          }}
        >
          <Icon name="edit" /> Rename
        </button>
        <button
          disabled={busy}
          aria-label={`Make a copy of ${project.title}`}
          onClick={() => {
            close();
            menu.current?.querySelector('summary')?.focus();
            onCopy();
          }}
        >
          <Icon name="copy" /> Make a copy
        </button>
        <button
          disabled={busy}
          onClick={() => {
            close();
            menu.current?.querySelector('summary')?.focus();
            onBackup();
          }}
          aria-label={`Export backup of ${project.title}`}
        >
          <Icon name="download" />
          Export backup
        </button>
        <button
          disabled={busy}
          className="danger-action"
          onClick={() => {
            close();
            menu.current?.querySelector('summary')?.focus();
            onDelete();
          }}
          aria-label={`Delete ${project.title}`}
        >
          <Icon name="trash" />
          Delete project
        </button>
      </div>
    </details>
  );
}

export function ProjectLibrary({
  projects,
  busy,
  onOpen,
  onBackup,
  onCopy,
  onDelete,
  onRename,
  thumbnail,
}: {
  projects: Project[];
  busy: boolean;
  onOpen: (p: Project) => void;
  onBackup: (p: Project) => void;
  onCopy: (p: Project) => void;
  onDelete: (p: Project) => void;
  onRename: (p: Project, title: string) => Promise<void>;
  thumbnail: (p: Project) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [confirm, setConfirm] = useState('');
  const [renaming, setRenaming] = useState<Project>();
  const visible = projects
    .filter((p) => p.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : sort === 'size'
          ? mediaBytes(b) - mediaBytes(a)
          : sort === 'edited'
            ? (b.localEditedAt ?? b.createdAt) - (a.localEditedAt ?? a.createdAt)
            : b.createdAt - a.createdAt,
    );
  return (
    <section className="project-library" aria-labelledby="library-title">
      {renaming && (
        <RenameProject
          project={renaming}
          onSave={onRename}
          onClose={() => setRenaming(undefined)}
        />
      )}
      <div className="library-heading">
        <div>
          <h2 id="library-title">Your walkthroughs</h2>
          <p className="field-note">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} · Open a walkthrough
            to pick up where you left off.
          </p>
        </div>
      </div>
      {!!projects.length && (
        <div className="library-tools">
          <label className="library-search">
            <span className="sr-only">Find a walkthrough</span>
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="library-sort">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest created</option>
              <option value="edited">Last edited</option>
              <option value="name">Name A–Z</option>
              <option value="size">Largest media first</option>
            </select>
          </label>
        </div>
      )}
      <p className="field-note" role="status">
        {query && `${visible.length} matching ${visible.length === 1 ? 'project' : 'projects'}`}
      </p>
      <div className="project-grid">
        {visible.map((p) => (
          <article className="project-library-item" key={p.id}>
            <button className="project-card" disabled={busy} onClick={() => onOpen(p)}>
              <div className="project-cover">{thumbnail(p)}</div>
              <strong>{p.title}</strong>
              <span>
                {p.steps.length} steps · {p.duration.toFixed(1)}s · About{' '}
                {formatBytes(mediaBytes(p))}
              </span>
              <span>
                {p.localEditedAt ? 'Edited' : 'Created'}{' '}
                {new Date(p.localEditedAt ?? p.createdAt).toLocaleDateString()}
              </span>
              <span className="project-open">
                Open walkthrough <Icon name="arrow" />
              </span>
            </button>
            <div className="library-card-footer">
              <span>{backupStatus(p)}</span>
              <ProjectActions
                project={p}
                busy={busy}
                onBackup={() => onBackup(p)}
                onCopy={() => onCopy(p)}
                onRename={() => setRenaming(p)}
                onDelete={() => setConfirm(p.id)}
              />
            </div>
            {confirm === p.id && (
              <div
                className="library-delete"
                role="group"
                aria-label={`Confirm deletion of ${p.title}`}
              >
                <p>
                  Delete “{p.title}” from this browser? This cannot be undone. Keep an exported
                  backup if you need it later.
                </p>
                <button disabled={busy} onClick={() => onDelete(p)}>
                  Confirm delete
                </button>
                <button disabled={busy} onClick={() => setConfirm('')}>
                  Keep project
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!projects.length ? (
        <div className="library-empty">
          <Icon name="folder" />
          <h3>Your next walkthrough starts here</h3>
          <p>
            Record with the extension to create your first project, or choose Options → Import
            project backup to restore an editable project ZIP.
          </p>
        </div>
      ) : (
        !visible.length && (
          <div className="library-empty">
            <p>No walkthroughs match “{query}”.</p>
            <button onClick={() => setQuery('')}>Clear search</button>
          </div>
        )
      )}
    </section>
  );
}

function RenameProject({
  project,
  onSave,
  onClose,
}: {
  project: Project;
  onSave: (project: Project, title: string) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const working = useRef(false);
  const [title, setTitle] = useState(project.title);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    element?.querySelector('input')?.select();
    return () => {
      element?.close();
      queueMicrotask(() => {
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
        else document.querySelector<HTMLInputElement>('.library-search input')?.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="utility-dialog"
      aria-labelledby="rename-heading"
      onCancel={(event) => {
        if (working.current) event.preventDefault();
        else onClose();
      }}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (working.current) return;
          const value = title.trim();
          if (!value || value.length > 200) {
            setError('Enter a name between 1 and 200 characters.');
            return;
          }
          working.current = true;
          setPending(true);
          setError('');
          try {
            await onSave(project, value);
            onClose();
          } catch {
            setError(
              'Could not save the name. The previous name is unchanged. Check available browser storage and try again.',
            );
          } finally {
            working.current = false;
            setPending(false);
          }
        }}
      >
        <h2 id="rename-heading">Rename walkthrough</h2>
        <label>
          Project name
          <input
            value={title}
            maxLength={200}
            disabled={pending}
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
          />
        </label>
        <p className="field-note">This name is also used for downloaded files.</p>
        {error && <p role="alert">{error}</p>}
        <div className="utility-actions">
          <button type="button" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={pending} type="submit">
            {pending ? 'Saving…' : 'Save name'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

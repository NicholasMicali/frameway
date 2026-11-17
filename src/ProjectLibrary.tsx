import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { Menu, MenuItem } from './ui/Menu';
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
  return (
    <Menu
      label={`Options for ${project.title}`}
      trigger={
        <Button variant="ghost" iconOnly aria-label={`Options for ${project.title}`}>
          <Icon name="more" />
        </Button>
      }
    >
      <MenuItem label={`Rename ${project.title}`} disabled={busy} onSelect={onRename}>
        <Icon name="edit" /> Rename
      </MenuItem>
      <MenuItem label={`Make a copy of ${project.title}`} disabled={busy} onSelect={onCopy}>
        <Icon name="copy" /> Make a copy
      </MenuItem>
      <MenuItem label={`Export backup of ${project.title}`} disabled={busy} onSelect={onBackup}>
        <Icon name="download" /> Export backup
      </MenuItem>
      <MenuItem label={`Delete ${project.title}`} disabled={busy} danger onSelect={onDelete}>
        <Icon name="trash" /> Delete project
      </MenuItem>
    </Menu>
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
          <h2 id="library-title">Project library</h2>
          <p className="field-note">
            {projects.length
              ? `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · Pick up where you left off.`
              : 'Your recordings will appear here, ready to edit.'}
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
                <Button variant="danger" disabled={busy} onClick={() => onDelete(p)}>
                  Confirm delete
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => setConfirm('')}>
                  Keep project
                </Button>
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
            Record a Chrome tab for automatic click-by-click steps, or use Record my screen for a
            window or your whole screen. Already have an editable backup? Restore it through Options
            → Import project backup.
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

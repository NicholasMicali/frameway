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
}: {
  project: Project;
  busy: boolean;
  onBackup: () => void;
  onCopy: () => void;
  onDelete: () => void;
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
  thumbnail,
}: {
  projects: Project[];
  busy: boolean;
  onOpen: (p: Project) => void;
  onBackup: (p: Project) => void;
  onCopy: (p: Project) => void;
  onDelete: (p: Project) => void;
  thumbnail: (p: Project) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [confirm, setConfirm] = useState('');
  const visible = projects
    .filter((p) => p.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : sort === 'size'
          ? mediaBytes(b) - mediaBytes(a)
          : b.createdAt - a.createdAt,
    );
  return (
    <section className="project-library" aria-labelledby="library-title">
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
              <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
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

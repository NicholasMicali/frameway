import { useState, type ReactNode } from 'react';
import type { Project } from './model';
import { backupStatus, formatBytes, mediaBytes } from './storage-health';

export function ProjectLibrary({
  projects,
  busy,
  onOpen,
  onBackup,
  onDelete,
  onImport,
  thumbnail,
}: {
  projects: Project[];
  busy: boolean;
  onOpen: (p: Project) => void;
  onBackup: (p: Project) => void;
  onDelete: (p: Project) => void;
  onImport: () => void;
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
            {projects.length} saved {projects.length === 1 ? 'project' : 'projects'} in this
            browser. Open one to keep editing.
          </p>
        </div>
        <button onClick={onImport} disabled={busy}>
          Import project backup
        </button>
      </div>
      {!!projects.length && (
        <div className="library-tools">
          <label>
            Find a walkthrough
            <input
              type="search"
              placeholder="Search by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Sort by
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
              {thumbnail(p)}
              <strong>{p.title}</strong>
              <span>
                {p.steps.length} steps · {p.duration.toFixed(1)}s · About{' '}
                {formatBytes(mediaBytes(p))}
              </span>
              <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
              <span>{backupStatus(p)}</span>
              <span>Open walkthrough →</span>
            </button>
            <div className="library-card-actions">
              <button
                disabled={busy}
                onClick={() => onBackup(p)}
                aria-label={`Export backup of ${p.title}`}
              >
                Export backup
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirm(p.id)}
                aria-label={`Delete ${p.title}`}
              >
                Delete
              </button>
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
          <h3>Your next walkthrough starts here</h3>
          <p>
            Record with the extension to create your first project, or import an editable project
            ZIP from another installation.
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

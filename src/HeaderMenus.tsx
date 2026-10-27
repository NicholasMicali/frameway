import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Project } from './model';
import { Icon } from './Icon';

function HeaderMenu({
  label,
  trigger,
  children,
  className = '',
}: {
  label: string;
  trigger: ReactNode;
  className?: string;
  children: (close: () => void) => ReactNode;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => {
    menu.current?.removeAttribute('open');
    menu.current?.querySelector('summary')?.focus();
  };
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) menu.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return (
    <details
      ref={menu}
      className={`header-menu ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
        }
      }}
    >
      <summary aria-label={label}>{trigger}</summary>
      <div className="header-menu-panel">{children(close)}</div>
    </details>
  );
}

export function ProjectNavigation({
  projects,
  project,
  busy,
  onLibrary,
  onProject,
}: {
  projects: Project[];
  project?: Project;
  busy: boolean;
  onLibrary: () => void;
  onProject: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const entries = project ? [project, ...projects.filter((p) => p.id !== project.id)] : projects;
  const filtered = entries.filter((p) =>
    p.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <nav className="project-navigation" aria-label="Workspace navigation">
      <HeaderMenu
        label="Open walkthrough"
        className="project-navigation-menu"
        trigger={
          <>
            <Icon name="folder" />
            <span className="navigation-title">
              {project?.title || (project ? 'Untitled walkthrough' : 'Library')}
            </span>
            <Icon name="chevron" />
          </>
        }
      >
        {(close) => (
          <>
            <button
              disabled={busy}
              aria-label="Library"
              aria-current={!project ? 'page' : undefined}
              onClick={() => {
                close();
                setQuery('');
                onLibrary();
              }}
            >
              <Icon name="folder" />
              <span>
                <strong>Library</strong>
                <small>All your walkthroughs</small>
              </span>
            </button>
            <div className="navigation-divider" />
            <label className="navigation-search">
              <Icon name="search" />
              <input
                aria-label="Find a project"
                placeholder="Find a project…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="navigation-projects">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  disabled={busy}
                  aria-current={p.id === project?.id ? 'page' : undefined}
                  onClick={() => {
                    close();
                    setQuery('');
                    if (p.id !== project?.id) onProject(p.id);
                  }}
                >
                  <span>
                    <strong>{p.title || 'Untitled walkthrough'}</strong>
                    <small>{p.steps.length} steps</small>
                  </span>
                  {p.id === project?.id && <span className="current-project">Current</span>}
                </button>
              ))}
              {!filtered.length && (
                <p>
                  {query
                    ? 'No projects match your search.'
                    : 'Your recorded walkthroughs will appear here.'}
                </p>
              )}
            </div>
          </>
        )}
      </HeaderMenu>
    </nav>
  );
}

export function WorkspaceOptions({
  busy,
  onStorage,
  onImport,
}: {
  busy: boolean;
  onStorage: () => void;
  onImport: () => void;
}) {
  return (
    <HeaderMenu
      label="Workspace options"
      className="workspace-options"
      trigger={
        <>
          <Icon name="settings" />
          <span>Options</span>
          <Icon name="chevron" />
        </>
      }
    >
      {(close) => (
        <>
          <button
            aria-label="Storage & backups"
            disabled={busy}
            onClick={() => {
              close();
              onStorage();
            }}
          >
            <Icon name="folder" />
            <span>
              <strong>Storage & backups</strong>
              <small>Review space and manage saved work</small>
            </span>
          </button>
          <button
            aria-label="Import project backup"
            disabled={busy}
            onClick={() => {
              close();
              onImport();
            }}
          >
            <Icon name="upload" />
            <span>
              <strong>Import project backup</strong>
              <small>Restore an editable project ZIP</small>
            </span>
          </button>
        </>
      )}
    </HeaderMenu>
  );
}

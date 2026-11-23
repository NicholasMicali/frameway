import { useState, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from './ui/Button';
import { Menu, MenuItem } from './ui/Menu';
import './styles/navigation.css';
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
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={`header-menu ${className}`}>
        <Popover.Trigger asChild>
          <Button className="header-menu-trigger" aria-label={label}>
            {trigger}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="header-menu-panel"
            aria-label={label}
            sideOffset={8}
            align={className === 'workspace-options' ? 'end' : 'start'}
            collisionPadding={16}
          >
            {children(() => setOpen(false))}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
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
  onShortcuts,
  onImport,
}: {
  busy: boolean;
  onStorage: () => void;
  onShortcuts: () => void;
  onImport: () => void;
}) {
  return (
    <div className="workspace-options">
      <Menu
        label="Workspace options"
        trigger={
          <Button variant="ghost" aria-label="Workspace options">
            <Icon name="settings" />
            <span>Options</span>
            <Icon name="chevron" />
          </Button>
        }
      >
        <MenuItem label="Storage & backups" disabled={busy} onSelect={onStorage}>
          <Icon name="folder" />
          <span>
            <strong>Storage & backups</strong>
            <small>Review space and manage saved work</small>
          </span>
        </MenuItem>
        <MenuItem label="Import projects" disabled={busy} onSelect={onImport}>
          <Icon name="upload" />
          <span>
            <strong>Import projects</strong>
            <small>Open a teammate’s project or restore your own</small>
          </span>
        </MenuItem>
        <MenuItem label="Keyboard shortcuts" onSelect={onShortcuts}>
          <Icon name="keyboard" />
          <span>
            <strong>Keyboard shortcuts</strong>
            <small>Editing, trimming, and navigation keys</small>
          </span>
        </MenuItem>
      </Menu>
    </div>
  );
}

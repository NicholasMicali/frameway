import { ProjectNavigation, WorkspaceOptions } from './HeaderMenus';
import { Disclosure } from './Disclosure';
import { ProjectLibrary } from './ProjectLibrary';
import { StorageManager } from './StorageManager';
import { revision, saveFailure, storageSummary } from './storage-health';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { all, get, put, saveProject, deleteProject } from './db';
import {
  clamp,
  migrateProject,
  withTitleSlide,
  splitVideo,
  duplicateStep,
  copyProject,
  deleteStep,
  moveStep,
  nextId,
  type Project,
  type LegacyProject,
  type Step,
} from './model';
import { createProject, eventOnce, fixDuration, frameAt, openVideo, releaseVideo } from './media';
import { exportName } from './export-name';
import { download, exportProject, importProject } from './archive';
import './style.css';
import { HomeIntro, UseCases } from './HomeIntro';
import packageInfo from '../package.json';
import './title-slide.css';
import { TitleSlide } from './TitleSlide';
import { themeVars } from './themes';
import { ProjectSettings } from './ProjectSettings';
import { LogoUpload } from './LogoUpload';
import { prepareLogo } from './branding';
import { automaticZoom, areaZoomVars } from './area-zoom';
import './area-zoom.css';
import { zoomOut } from './zoom-out';
import { Icon } from './Icon';
import { ClipTimeline } from './Timeline';
import { ScreenRecorder } from './ScreenRecorder';
import { ExportDialog } from './ExportDialog';
function useURL(blob?: Blob) {
  const [url, set] = useState('');
  useEffect(() => {
    if (!blob) {
      set('');
      return;
    }
    const u = URL.createObjectURL(blob);
    set(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
function Thumb({ step, logo }: { step: Step; logo?: string }) {
  const src = useURL(step.image);
  return step.kind === 'title' ? (
    <div className="title-thumb">
      <TitleSlide step={step} src={src} logo={logo} thumbnail />
    </div>
  ) : (
    <img alt="" src={src} />
  );
}
function App() {
  const [recording, setRecording] = useState(false);
  const copying = useRef(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>();
  const [leaving, setLeaving] = useState(false);
  const [visit, setVisit] = useState(0);
  const exitAnimation = useRef<ReturnType<typeof zoomOut>>(undefined);
  useEffect(() => {
    return () => {
      exitAnimation.current?.cancel();
      exitAnimation.current = undefined;
    };
  }, []);
  const [projects, setProjects] = useState<Project[]>([]),
    [project, setProject] = useState<Project>(),
    [selected, setSelected] = useState(''),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(''),
    [cardOpen, setCardOpen] = useState(true),
    [preview, setPreview] = useState(false),
    [playing, setPlaying] = useState(false),
    [frameTime, setFrameTime] = useState(0),
    [scrub, setScrub] = useState(false),
    [recordingWarning, setRecordingWarning] = useState('');
  const past = useRef<{ project: Project; selected: string }[]>([]),
    future = useRef<{ project: Project; selected: string }[]>([]),
    editGroup = useRef({ key: '', time: 0 }),
    editOrigin = useRef('');
  const card = useRef<HTMLDivElement>(null),
    [cardBounds, setCardBounds] = useState({ x: 1, y: 1 });
  const video = useRef<HTMLVideoElement>(null),
    stage = useRef<HTMLDivElement>(null),
    importInput = useRef<HTMLInputElement>(null),
    generation = useRef(0),
    saveQueue = useRef(Promise.resolve()),
    history = useRef<string[]>([]),
    destination = useRef<string | undefined>(undefined),
    playDeadline = useRef(0);
  const step = project?.steps.find((s) => s.id === selected),
    imageURL = useURL(step?.image),
    videoURL = useURL(project?.video);
  const currentProject = useRef(project);
  currentProject.current = project;
  const storage = storageSummary(storageEstimate);
  useEffect(() => {
    let active = true;
    void navigator.storage
      ?.estimate?.()
      .then((e) => {
        if (active) setStorageEstimate(e);
      })
      .catch(() => {
        if (active) setStorageEstimate(undefined);
      });
    return () => {
      active = false;
    };
  }, [projects]);
  useEffect(() => {
    if (!saveError && saved !== 'Saving…') return;
    const preventClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [saveError, saved]);
  const zooming = preview && step?.kind === 'image' && step.style === 'area' && !!step.zoomEnabled;
  useEffect(() => {
    const el = card.current,
      container = stage.current;
    if (!el || !container) return;
    const measure = () => {
      const r = container.getBoundingClientRect(),
        c = el.getBoundingClientRect();
      setCardBounds({
        x: Math.max(0, 1 - c.width / r.width),
        y: Math.max(0, 1 - c.height / r.height),
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(container);
    measure();
    return () => observer.disconnect();
  }, [selected, preview, playing, scrub, cardOpen, step?.kind === 'image' ? step.style : '']);
  useEffect(() => {
    setCardOpen(step?.kind === 'image' ? step.openByDefault : true);
  }, [selected, preview, step?.kind === 'image' ? step.openByDefault : true]);
  function choose(input: Project | LegacyProject) {
    past.current = [];
    future.current = [];
    editGroup.current = { key: '', time: 0 };
    location.hash = `project/${input.id}`;
    const p = migrateProject(input);
    generation.current++;
    setSaveError('');
    setProject(p);
    setSelected(p.steps[0]?.id || '');
    setPreview(false);
    setPlaying(false);
    setScrub(false);
    history.current = [];
  }
  async function task(message: string, fn: () => Promise<void>) {
    setBusy(message);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }
  async function refresh() {
    const list = (await all<Project | LegacyProject>('projects'))
      .map(migrateProject)
      .sort((a, b) => b.createdAt - a.createdAt);
    setProjects(list);
    return list;
  }
  useEffect(() => {
    task('Opening your studio…', async () => {
      const list = await refresh();
      const sessions = await all<any>('sessions');
      const id = new URLSearchParams(location.search).get('session');
      const pending = id
        ? sessions.find((x) => x.id === id)
        : sessions.find((x) => x.status === 'complete' && !x.projectId);
      if (pending?.projectId) {
        const p = await get<Project>('projects', pending.projectId);
        if (p) choose(p);
      } else if (pending?.status === 'complete') {
        setBusy('Preparing your recording and still frames…');
        const chunks = [];
        for (let i = 0; i < pending.chunkCount; i++) {
          const b = await get<Blob>('chunks', `${pending.id}:${i}`);
          if (!b) throw Error('A recording chunk is missing. Original session retained.');
          chunks.push(b);
        }
        const b = await fixDuration(
          new Blob(chunks, { type: pending.mimeType }),
          pending.duration * 1000,
        );
        const p = await createProject(
          b,
          pending.duration,
          pending.markers || [],
          pending.title,
          pending.warning || 'Automatic frames are approximate. Review each still and transition.',
        );
        choose(p);
        await persist(p);
        await put('sessions', { ...pending, projectId: p.id });
        await refresh();
      } else {
        const wanted = location.hash.slice(1).replace(/^project\//, '');
        const saved = list.find((p) => p.id === wanted);
        if (saved) choose(saved);
      }
      const damaged = sessions.filter((x) => x.status === 'failed' || x.status === 'recording');
      if (damaged.length)
        setRecordingWarning(
          'An unfinished recording is retained locally. It may still be recording or may have been interrupted; it is not a finalized walkthrough.',
        );
      if (globalThis.chrome?.storage) {
        const x = await chrome.storage.local.get('captureError');
        if (x.captureError) {
          setError(String(x.captureError));
          await chrome.storage.local.remove('captureError');
        }
      }
    });
  }, []);
  async function persist(p: Project) {
    const operation = saveQueue.current.then(() => saveProject(p));
    saveQueue.current = operation.catch(() => {});
    try {
      await operation;
      setProjects((ps) => [p, ...ps.filter((x) => x.id !== p.id)]);
      if (currentProject.current === p) {
        setSaved('Saved locally');
        setSaveError('');
      }
    } catch (error) {
      if (currentProject.current?.id === p.id) {
        setSaved('Save failed');
        setSaveError(saveFailure(error));
      }
      throw error;
    }
  }
  async function makeCopy(source: Project) {
    if (copying.current) return;
    copying.current = true;
    try {
      await task('Making a copy…', async () => {
        const copy = copyProject(
          source,
          projects.map((p) => p.title),
        );
        try {
          await persist(copy);
        } catch (cause) {
          throw new Error(
            `Could not make a copy. ${
              cause instanceof DOMException && cause.name === 'QuotaExceededError'
                ? 'Browser storage is full. Export backups, free space in Options → Storage & backups, then try Make a copy again.'
                : 'The browser could not save it. Check available storage and try Make a copy again.'
            } The original project is unchanged.`,
          );
        }
        choose(copy);
      });
    } finally {
      copying.current = false;
    }
  }
  async function backup(p: Project) {
    await task('Exporting editable backup…', () => downloadBackup(p));
  }
  async function downloadBackup(p: Project) {
    const blob = await exportProject(p);
    download(blob, `${exportName(p.title)}.frameway.zip`);
    const localBackup = { revision: revision(p), exportedAt: Date.now() };
    if (currentProject.current?.id === p.id) {
      setProject((current) => (current?.id === p.id ? { ...current, localBackup } : current));
    } else {
      try {
        await persist({ ...p, localBackup });
      } catch {
        setError(
          'Backup download started, but its export record could not be saved. Keep the ZIP file.',
        );
      }
    }
  }
  useEffect(() => {
    if (!project) return;
    setSaved('Saving…');
    const timer = setTimeout(() => {
      void persist(project).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [project]);
  useEffect(() => {
    setFrameTime(step?.kind === 'video' ? step.clipStart : step?.stillTime || 0);
    setScrub(false);
    setPlaying(false);
    video.current?.pause();
    if (video.current && step?.kind === 'video' && video.current.readyState >= 1)
      video.current.currentTime = step.clipStart;
  }, [selected]);
  useEffect(() => {
    if (!playing) return;
    let request = 0;
    const tick = () => {
      const v = video.current;
      if (v && v.currentTime >= playDeadline.current - 0.025) {
        v.pause();
        setPlaying(false);
        if (destination.current) {
          history.current.push(selected);
          select(destination.current);
        }
        return;
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, selected]);
  function boundary() {
    editGroup.current = { key: '', time: 0 };
  }
  function update(p: Project, key = '') {
    if (!project || p === project) return;
    const now = performance.now();
    if (!key || key !== editGroup.current.key || now - editGroup.current.time > 800) {
      past.current.push({ project, selected });
      if (past.current.length > 80) past.current.shift();
    }
    future.current = [];
    editGroup.current = { key, time: now };
    setProject({ ...p, localRevision: crypto.randomUUID() });
  }
  function travel(direction: 'undo' | 'redo') {
    if (!project || preview || busy) return;
    const from = direction === 'undo' ? past : future,
      to = direction === 'undo' ? future : past;
    const frame = from.current.pop();
    if (!frame) return;
    to.current.push({ project, selected });
    boundary();
    setProject({ ...frame.project, localBackup: project.localBackup });
    select(
      frame.project.steps.some((s) => s.id === frame.selected)
        ? frame.selected
        : frame.project.steps[0].id,
    );
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input,textarea,select,[contenteditable=true]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        travel(e.shiftKey ? 'redo' : 'undo');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  function patch(s: Partial<Step>) {
    if (project && step)
      update(
        {
          ...project,
          steps: project.steps.map((x) => (x.id === step.id ? ({ ...x, ...s } as Step) : x)),
        },
        `${selected}:${Object.keys(s).sort().join(',')}`,
      );
  }
  function select(id: string) {
    generation.current++;
    setSelected(id);
    setPlaying(false);
    setScrub(false);
    video.current?.pause();
  }
  async function playClip() {
    if (!project || step?.kind !== 'video') return;
    const v = video.current;
    if (!v) return;
    destination.current = nextId(project, step);
    playDeadline.current = step.clipEnd;
    const token = ++generation.current;
    try {
      if (v.readyState < 1) await eventOnce(v, 'loadedmetadata');
      if (token !== generation.current) return;
      v.currentTime = step.clipStart;
      setPlaying(true);
      await v.play();
      if (token !== generation.current) v.pause();
    } catch (e) {
      if (token === generation.current) {
        setPlaying(false);
        setError(`Video could not play: ${e}`);
      }
    }
  }
  useEffect(() => {
    if (preview && step?.kind === 'video' && step.autoplay) void playClip();
    return () => {
      generation.current++;
      video.current?.pause();
    };
  }, [selected, preview, videoURL]);
  useEffect(() => {
    exitAnimation.current?.cancel();
    exitAnimation.current = undefined;
    setLeaving(false);
  }, [selected, preview, project?.id, visit]);
  function navigate(id: string, direction: 'forward' | 'back' | 'restart' = 'forward') {
    if (exitAnimation.current || playing) return;
    const commit = () => {
      setVisit((value) => value + 1);
      if (direction === 'forward') history.current.push(selected);
      if (direction === 'back') history.current.pop();
      if (direction === 'restart') history.current = [];
      select(id);
    };
    const animation = preview && stage.current ? zoomOut(stage.current) : undefined;
    if (!animation) {
      commit();
      return;
    }
    exitAnimation.current = animation;
    setLeaving(true);
    const token = generation.current;
    void animation.finished.then(() => {
      if (exitAnimation.current !== animation || generation.current !== token) return;
      commit();
      // Keep the final frame until React commits the destination and cleans up.
    });
  }
  function advance() {
    if (!project || !step) return;
    const id = nextId(project, step);
    if (id) {
      navigate(id);
    }
  }
  function back() {
    const id = history.current.at(-1);
    if (id) navigate(id, 'back');
  }
  function restart() {
    if (project) {
      navigate(project.steps[0].id, 'restart');
    }
  }
  function drag(e: React.PointerEvent, kind: 'anchor' | 'card') {
    if (preview || !stage.current || !step) return;
    boundary();
    e.preventDefault();
    const rect = stage.current.getBoundingClientRect(),
      startX = e.clientX,
      startY = e.clientY,
      origin =
        kind === 'anchor'
          ? { x: step.x, y: step.y }
          : { x: Math.min(step.cardX, cardBounds.x), y: Math.min(step.cardY, cardBounds.y) };
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = e.currentTarget;
    const move = (ev: Event) => {
      const p = ev as PointerEvent,
        box = kind === 'card' ? el.parentElement!.getBoundingClientRect() : null,
        x = clamp(
          origin.x + (p.clientX - startX) / rect.width,
          0,
          box ? Math.max(0, 1 - box.width / rect.width) : 1,
        ),
        y = clamp(
          origin.y + (p.clientY - startY) / rect.height,
          0,
          box ? Math.max(0, 1 - box.height / rect.height) : 1,
        );
      patch(kind === 'anchor' ? { x, y } : { cardX: x, cardY: y });
    };
    const end = () => {
      boundary();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  async function switchProject(id: string) {
    await task('Opening walkthrough…', async () => {
      if (project) await persist(project);
      const p = await get<Project>('projects', id);
      if (p) choose(p);
    });
  }
  async function home() {
    await task('Saving walkthrough…', async () => {
      await saveQueue.current;
      if (project) await persist(project);
      generation.current++;
      video.current?.pause();
      setPlaying(false);
      setPreview(false);
      setProject(undefined);
      setSelected('');
      setSaved('');
      location.hash = 'home';
      await refresh();
    });
  }
  async function finishRecording(
    blob: Blob,
    duration: number,
    markers: import('./model').Marker[],
  ) {
    const fixed = await fixDuration(blob, duration * 1000);
    const p = await createProject(
      fixed,
      duration,
      markers,
      'My screen recording',
      'Review your screenshot timing and position each hotspot.',
    );
    if (!markers.length) {
      const last = p.steps.at(-1)!;
      p.steps = [
        p.steps[0],
        {
          ...last,
          id: crypto.randomUUID(),
          title: 'Screen recording',
          kind: 'video',
          autoplay: true,
          clipStart: 0,
          clipEnd: duration,
          target: 'next',
        },
        last,
      ];
    }
    setRecording(false);
    choose(p);
    await persist(p);
    await refresh();
  }
  async function addScreenshot() {
    if (!project || !step) return;
    await task('Adding screenshot step…', async () => {
      const v = await openVideo(project.video);
      try {
        const time =
          step.kind === 'video' ? clamp(frameTime, step.clipStart, step.clipEnd) : frameTime;
        const image = await frameAt(v, time);
        const fresh: Step = {
          id: crypto.randomUUID(),
          kind: 'image',
          style: 'hotspot',
          openByDefault: true,
          title: 'Explain this moment',
          body: 'Add context for your viewer.',
          x: 0.5,
          y: 0.5,
          cardX: 0.1,
          cardY: 0.1,
          image,
          stillTime: time,
          clipStart: time,
          clipEnd: time,
          target: 'next',
        };
        const i = project.steps.indexOf(step);
        const inserted: Step[] = [];
        if (step.kind === 'video') {
          if (time - step.clipStart >= 0.05)
            inserted.push({ ...step, clipEnd: time, target: fresh.id });
          else fresh.id = step.id;
          inserted.push(fresh);
          if (step.clipEnd - time >= 0.05) {
            const tail = { ...step, id: crypto.randomUUID(), clipStart: time };
            fresh.target = tail.id;
            inserted.push(tail);
          } else fresh.target = step.target;
        } else {
          inserted.push({ ...step, target: fresh.id }, fresh);
          fresh.target = step.target;
        }
        update({
          ...project,
          steps: [...project.steps.slice(0, i), ...inserted, ...project.steps.slice(i + 1)],
        });
        select(fresh.id);
      } finally {
        releaseVideo(v);
      }
    });
  }
  async function addTitle() {
    if (!project) return;
    const existing = project.steps.find((s) => s.kind === 'title');
    if (existing) {
      select(existing.id);
      return;
    }
    await task('Creating title slide…', async () => {
      const v = await openVideo(project.video);
      try {
        const p = withTitleSlide(project, await frameAt(v, 0));
        update(p);
        select(p.steps[0].id);
      } finally {
        releaseVideo(v);
      }
    });
  }
  function seek(t: number) {
    setFrameTime(t);
    setScrub(true);
    setPlaying(false);
    if (video.current) {
      video.current.pause();
      video.current.currentTime = t;
    }
  }
  return (
    <div className={`app ${project ? 'editor-app' : ''}`}>
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void home();
          }}
          aria-label="Library"
        >
          <span className="brand-icon">◈</span> frameway
          <span className="app-version" title="Beta version">
            v{packageInfo.version}
          </span>
        </a>
        <ProjectNavigation
          projects={projects}
          project={project}
          busy={!!busy}
          onLibrary={() => void home()}
          onProject={(id) => void switchProject(id)}
        />
        <div className="header-actions">
          <span className="save-state" role="status">
            {saved}
          </span>
          <button
            className={project ? 'primary' : ''}
            disabled={!!busy}
            onClick={() =>
              task('Preparing recorder…', async () => {
                if (project) await persist(project);
                setRecording(true);
              })
            }
          >
            Record screen
          </button>
          <WorkspaceOptions
            busy={!!busy}
            onStorage={() => setStorageOpen(true)}
            onImport={() => importInput.current?.click()}
          />
          {project && (
            <button disabled={!!busy} onClick={() => setExportOpen(true)} aria-haspopup="dialog">
              <Icon name="share" /> Export
            </button>
          )}
        </div>
      </header>
      <input
        ref={importInput}
        type="file"
        accept=".zip"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file)
            task('Importing walkthrough…', async () => {
              if (project) await persist(project);
              const p = await importProject(file);
              choose(p);
              await persist(p);
              await refresh();
            });
        }}
      />
      {exportOpen && project && (
        <ExportDialog
          project={project}
          onBackup={downloadBackup}
          onClose={() => setExportOpen(false)}
        />
      )}
      {storageOpen && (
        <StorageManager
          projects={project ? [project, ...projects.filter((p) => p.id !== project.id)] : projects}
          currentId={project?.id}
          error={error}
          busy={!!busy}
          onClose={() => setStorageOpen(false)}
          onBackup={backup}
          onDelete={async (p) => {
            await task('Deleting project…', async () => {
              await deleteProject(p.id);
              await refresh();
            });
          }}
        />
      )}
      {saveError && project && (
        <div className="banner error" role="alert">
          <span>{saveError} Your current edits are still open in this tab.</span>
          <button disabled={!!busy} onClick={() => backup(project)}>
            Export backup
          </button>
          <button disabled={!!busy} onClick={() => task('Retrying save…', () => persist(project))}>
            Retry saving
          </button>
          <button onClick={() => setStorageOpen(true)}>Manage storage</button>
        </div>
      )}
      {storage.low && !saveError && (
        <div className="banner storage-warning">
          <span>
            Browser storage is nearly full. Export backups and review projects before recording
            more.
          </span>
          <button onClick={() => setStorageOpen(true)}>Manage storage</button>
        </div>
      )}
      {error && (
        <div role="alert" className="banner error">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {recordingWarning && (
        <div className="banner">
          {recordingWarning}
          <button onClick={() => setRecordingWarning('')}>Dismiss</button>
        </div>
      )}
      {busy && (
        <div className="busy" role="status">
          <span className="spinner" />
          {busy}
        </div>
      )}
      {recording && (
        <ScreenRecorder onClose={() => setRecording(false)} onComplete={finishRecording} />
      )}
      {!project ? (
        <main className="welcome home-page">
          <div className="home-heading">
            <div>
              <div className="eyebrow">WELCOME TO FRAMEWAY</div>
              <h1>
                {projects.length
                  ? 'Pick up where you left off.'
                  : 'Show a workflow. Let people try it.'}
              </h1>
              <p>
                {projects.length
                  ? 'Open a project below, or start a new recording from the Frameway toolbar icon.'
                  : 'Record your screen, edit the steps, and share a walkthrough anyone can open.'}
              </p>
            </div>
          </div>
          <div className={`home-workspace ${projects.length ? 'has-projects' : ''}`}>
            {!projects.length && (
              <HomeIntro onRecord={() => setRecording(true)} returning={false} />
            )}
            <ProjectLibrary
              projects={projects}
              busy={!!busy}
              onOpen={choose}
              onBackup={backup}
              onCopy={makeCopy}
              onDelete={(p) => {
                void task('Deleting project…', async () => {
                  await deleteProject(p.id);
                  await refresh();
                });
              }}
              thumbnail={(p) => <Thumb step={p.steps[0]} logo={p.logo} />}
            />
            {!!projects.length && <HomeIntro onRecord={() => setRecording(true)} returning />}
          </div>
          <div className="home-help">
            <Disclosure
              title="Ideas for your next walkthrough"
              description="Product demos, training, support, and more."
            >
              <UseCases />
            </Disclosure>
            <Disclosure
              title="Keeping your work safe"
              description="Projects are saved on this device. Back them up to keep a copy."
            >
              <p>
                Use Export backup on a project to save an editable ZIP. Import that backup to
                restore your work or move it to another computer. Keep a backup before removing or
                reinstalling Frameway.
              </p>
            </Disclosure>
            {location.protocol !== 'chrome-extension:' && (
              <Disclosure
                title="Can’t find a recording?"
                description="Open Frameway from Chrome’s toolbar to find extension recordings."
              >
                <p>
                  This is the local development app. To find walkthroughs recorded with the Chrome
                  extension, click the Frameway icon in Chrome and choose Open Frameway. Opening a
                  project here does not switch apps.
                </p>
                <p>
                  To bring a project here, export its project backup there, then choose Options →
                  Import project backup.
                </p>
              </Disclosure>
            )}
          </div>
        </main>
      ) : (
        <>
          <div className="toolbar">
            <div>
              <div className="title-and-theme">
                <input
                  className="project-title"
                  aria-label="Walkthrough title"
                  value={project.title}
                  maxLength={200}
                  onChange={(e) => update({ ...project, title: e.target.value })}
                />
              </div>
              <div className="subtitle">
                {project.steps.length} steps <span>·</span> {project.duration.toFixed(1)}s captured{' '}
                <span>·</span> Browser walkthrough
              </div>
            </div>
            <div className="toolbar-right">
              <ProjectSettings key={project.id} project={project} onChange={update} />
              {!preview && (
                <>
                  <button
                    disabled={!past.current.length || !!busy}
                    onClick={() => travel('undo')}
                    className="icon-button"
                    aria-label="Undo"
                    title="Undo (⌘/Ctrl Z)"
                  >
                    <Icon name="undo" />
                  </button>
                  <button
                    disabled={!future.current.length || !!busy}
                    onClick={() => travel('redo')}
                    className="icon-button"
                    aria-label="Redo"
                    title="Redo (⌘/Ctrl Shift Z)"
                  >
                    <Icon name="redo" />
                  </button>
                </>
              )}
              <div className="mode">
                <button
                  className={!preview ? 'active' : ''}
                  onClick={() => {
                    setPreview(false);
                    setPlaying(false);
                    video.current?.pause();
                    if (editOrigin.current) select(editOrigin.current);
                  }}
                >
                  ✎ Edit
                </button>
                <button
                  className={preview ? 'active' : ''}
                  onClick={() => {
                    editOrigin.current = selected;
                    history.current = [];
                    setScrub(false);
                    setPlaying(false);
                    video.current?.pause();
                    setPreview(true);
                  }}
                >
                  ▷ Preview
                </button>
              </div>
            </div>
          </div>
          <div className={`workspace ${preview ? 'preview' : ''}`}>
            {!preview && (
              <aside className="steps">
                <div className="section-heading">
                  YOUR STORY <span>{project.steps.length}</span>
                </div>
                <div className="step-list">
                  {project.steps.map((s, i) => (
                    <div className="step-row" key={s.id}>
                      <button
                        className={`step ${selected === s.id ? 'selected' : ''}`}
                        key={s.id}
                        onClick={() => select(s.id)}
                      >
                        <div className="thumb">
                          <Thumb step={s} logo={project.logo} />
                          <span className="step-number">{i + 1}</span>
                          {
                            <span className="clip-pill">
                              {s.kind === 'title'
                                ? 'T title'
                                : s.kind === 'video'
                                  ? '▷ video'
                                  : '▧ image'}
                            </span>
                          }
                        </div>
                        <span className="step-label">{s.title}</span>
                      </button>
                      <details
                        className="step-menu"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.currentTarget.open = false;
                            e.currentTarget.querySelector('summary')?.focus();
                          }
                        }}
                      >
                        <summary
                          aria-label={`Options for step ${i + 1}`}
                          title={`Options for step ${i + 1}`}
                        >
                          <Icon name="more" />
                        </summary>
                        <div
                          className="step-menu-actions"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button'))
                              e.currentTarget.closest('details')?.removeAttribute('open');
                          }}
                        >
                          <button
                            disabled={!!busy}
                            onClick={() => update(duplicateStep(project, s.id))}
                          >
                            Duplicate
                          </button>
                          <button
                            disabled={i === 0 || !!busy}
                            onClick={() => update(moveStep(project, s.id, -1))}
                          >
                            Move up
                          </button>
                          <button
                            disabled={i === project.steps.length - 1 || !!busy}
                            onClick={() => update(moveStep(project, s.id, 1))}
                          >
                            Move down
                          </button>
                          <button
                            className="danger-text"
                            disabled={project.steps.length <= 1 || !!busy}
                            onClick={() => {
                              const p = deleteStep(project, s.id);
                              update(p);
                              if (selected === s.id)
                                select(p.steps[Math.min(i, p.steps.length - 1)].id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
                {!project.steps.some((s) => s.kind === 'title') && (
                  <button className="sample-link" onClick={() => void addTitle()} disabled={!!busy}>
                    ＋ Add title slide
                  </button>
                )}
              </aside>
            )}
            <main className="canvas-area">
              <div className="canvas-meta">
                <span>
                  {preview ? 'INTERACTIVE PREVIEW' : 'STEP ' + (project.steps.indexOf(step!) + 1)}
                </span>
                <span>
                  {preview
                    ? 'Click the card or hotspot to continue'
                    : step?.kind === 'title'
                      ? 'Edit your introduction in the panel on the right'
                      : step?.kind === 'video'
                        ? 'Trim this video step below'
                        : 'Drag the dot or card to reposition'}
                </span>
              </div>
              {project.warning && !preview && (
                <div className="review-note">◌ {project.warning}</div>
              )}
              <div className="stage-wrap">
                <div
                  ref={stage}
                  className="stage"
                  style={
                    {
                      ...themeVars(project.theme, project.customColor),
                      aspectRatio: `${project.width}/${project.height}`,
                    } as React.CSSProperties
                  }
                >
                  <img
                    key={`${selected}:${preview}:${visit}`}
                    style={zooming ? (areaZoomVars(step) as React.CSSProperties) : undefined}
                    hidden={step?.kind === 'title'}
                    className={`still ${zooming ? 'area-zoom-image' : ''}`}
                    src={imageURL}
                    alt={step?.title}
                  />
                  <video
                    ref={video}
                    src={videoURL}
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={() => {
                      if (video.current && step?.kind === 'video')
                        video.current.currentTime = step.clipStart;
                    }}
                    className={`recording ${playing || scrub || step?.kind === 'video' ? 'visible' : ''}`}
                    onEnded={() => {
                      if (playing) {
                        setPlaying(false);
                        if (destination.current) {
                          history.current.push(selected);
                          select(destination.current);
                        }
                      }
                    }}
                    onError={() =>
                      setError('The recording could not be decoded. Check the imported media.')
                    }
                  />
                  {step?.kind === 'title' && (
                    <TitleSlide
                      step={step}
                      src={imageURL}
                      logo={project.logo}
                      onStart={
                        preview ? () => (nextId(project, step) ? advance() : restart()) : undefined
                      }
                    />
                  )}
                  {step?.kind === 'image' && !playing && !scrub && (
                    <>
                      {step.style !== 'callout' && (
                        <button
                          key={`${selected}:${preview}:${visit}`}
                          aria-label="Hotspot"
                          disabled={leaving}
                          className={`hotspot ${zooming ? 'area-zoom-hotspot' : ''} ${step.style === 'area' ? 'area-hotspot' : ''}`}
                          style={{
                            ...(zooming ? areaZoomVars(step) : {}),
                            width:
                              step.style === 'area'
                                ? `${(step.areaWidth ?? 0.25) * 100}%`
                                : undefined,
                            height:
                              step.style === 'area'
                                ? `${(step.areaHeight ?? 0.2) * 100}%`
                                : undefined,
                            left: `${(step.style === 'area' ? clamp(step.x, (step.areaWidth ?? 0.25) / 2, 1 - (step.areaWidth ?? 0.25) / 2) : step.x) * 100}%`,
                            top: `${(step.style === 'area' ? clamp(step.y, (step.areaHeight ?? 0.2) / 2, 1 - (step.areaHeight ?? 0.2) / 2) : step.y) * 100}%`,
                          }}
                          onPointerDown={(e) => drag(e, 'anchor')}
                          onClick={() => {
                            if (preview) {
                              if (cardOpen) advance();
                              else setCardOpen(true);
                            }
                          }}
                        >
                          <span />
                        </button>
                      )}
                      {(!preview || cardOpen || step.style === 'callout') && (
                        <div
                          key={step.id}
                          ref={card}
                          className="callout"
                          style={{
                            width: step.cardWidth ? `${step.cardWidth * 100}%` : undefined,
                            left: `${Math.min(step.cardX, cardBounds.x) * 100}%`,
                            top: `${Math.min(step.cardY, cardBounds.y) * 100}%`,
                          }}
                        >
                          <div className="card-handle" onPointerDown={(e) => drag(e, 'card')}>
                            <span>
                              {String(project.steps.indexOf(step) + 1).padStart(2, '0')} /{' '}
                              {String(project.steps.length).padStart(2, '0')}
                            </span>
                            <span>{preview ? '✦' : '⠿'}</span>
                          </div>
                          <h3>{step.title}</h3>
                          <p>{step.body}</p>
                          {preview ? (
                            <button
                              className="card-next"
                              disabled={leaving}
                              onClick={() => (nextId(project, step) ? advance() : restart())}
                            >
                              {nextId(project, step) ? 'Continue' : 'Replay'} <span>→</span>
                            </button>
                          ) : (
                            <div className="card-footer">
                              Your next moment starts here <span>→</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {step?.kind === 'video' && !playing && (
                    <button className="clip-play" onClick={() => void playClip()}>
                      ▶ Play clip
                    </button>
                  )}
                  {playing && <div className="playing-label">● Playing video</div>}
                </div>
              </div>
              <div className="player-bar">
                <button onClick={restart} disabled={!preview || playing || leaving}>
                  ↺ Restart
                </button>
                <nav className="progress-dots" aria-label="Walkthrough steps">
                  {project.steps.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={`Go to step ${i + 1}: ${s.title}`}
                      title={`Step ${i + 1}: ${s.title}`}
                      aria-current={s.id === selected ? 'step' : undefined}
                      className={s.id === selected ? 'current' : ''}
                      disabled={!preview || playing || leaving}
                      onClick={() => {
                        if (!preview || playing || leaving || s.id === selected) return;
                        navigate(s.id);
                      }}
                    >
                      <span />
                    </button>
                  ))}
                </nav>
                <div>
                  <button
                    onClick={back}
                    disabled={!preview || !history.current.length || playing || leaving}
                  >
                    ← Back
                  </button>
                  <button
                    className="primary"
                    disabled={!preview || playing || leaving}
                    onClick={() => step && (nextId(project, step) ? advance() : restart())}
                  >
                    {step && nextId(project, step) ? 'Next step' : 'Replay'} →
                  </button>
                </div>
              </div>
              {!preview && step && step.kind !== 'title' && (
                <section className="timeline">
                  <div className="timeline-head">
                    <strong>{step.kind === 'video' ? 'Video clip' : 'Still frame'}</strong>
                    <span>
                      {step.kind === 'video'
                        ? `${(step.clipEnd - step.clipStart).toFixed(2)}s clip · `
                        : ''}
                      {project.duration.toFixed(2)}s source · {frameTime.toFixed(2)}s
                    </span>
                  </div>
                  {step.kind === 'video' && (
                    <ClipTimeline
                      key={step.id}
                      step={step}
                      duration={project.duration}
                      onPatch={patch}
                      onSeek={seek}
                      onBoundary={boundary}
                    />
                  )}
                  <input
                    aria-label="Video scrubber"
                    type="range"
                    min="0"
                    max={Math.max(0, project.duration - 0.05)}
                    step="0.01"
                    value={frameTime}
                    onChange={(e) => seek(Number(e.target.value))}
                  />
                  <div className="timeline-actions">
                    {step.kind === 'video' && (
                      <button
                        disabled={
                          frameTime - step.clipStart < 0.05 || step.clipEnd - frameTime < 0.05
                        }
                        onClick={() => update(splitVideo(project, step.id, frameTime))}
                      >
                        Split video here
                      </button>
                    )}
                    <button onClick={() => void addScreenshot()}>Add screenshot step here</button>
                    {step.kind === 'image' && (
                      <>
                        <button
                          onClick={() =>
                            task('Extracting still frame…', async () => {
                              const v = await openVideo(project.video);
                              try {
                                const image = await frameAt(v, frameTime);
                                patch({ image, stillTime: frameTime });
                                setScrub(false);
                              } finally {
                                releaseVideo(v);
                              }
                            })
                          }
                        >
                          Use this frame as still
                        </button>
                        <button onClick={() => setScrub(false)}>Show callout</button>
                      </>
                    )}
                    <span>Original video is preserved</span>
                  </div>
                </section>
              )}
            </main>
            {!preview && step && (
              <aside className="inspector">
                <div className="section-heading">
                  MAKE IT CLEAR <span>✦</span>
                </div>
                <h2 className="inspector-heading">
                  {step.kind === 'title'
                    ? 'Title slide'
                    : step.kind === 'image'
                      ? 'Image & callout'
                      : 'Video clip'}
                </h2>
                <label>
                  Headline
                  <input
                    aria-label="Callout headline"
                    value={step.title}
                    maxLength={200}
                    onChange={(e) => patch({ title: e.target.value })}
                  />
                </label>
                {step.kind === 'title' && (
                  <>
                    <LogoUpload
                      logo={project.logo}
                      disabled={!!busy}
                      onRemove={() => update({ ...project, logo: undefined })}
                      onUpload={(file) =>
                        void task('Preparing logo…', async () =>
                          update({ ...project, logo: await prepareLogo(file) }),
                        )
                      }
                    />
                    <label>
                      Description
                      <textarea
                        aria-label="Title description"
                        value={step.body}
                        maxLength={5000}
                        onChange={(e) => patch({ body: e.target.value })}
                      />
                    </label>
                    <label>
                      Button label
                      <input
                        aria-label="Title button label"
                        value={step.buttonText}
                        maxLength={80}
                        onChange={(e) => patch({ buttonText: e.target.value })}
                      />
                    </label>
                    <p className="field-note">
                      The image shows the upper-left corner of the recording’s opening frame.
                    </p>
                  </>
                )}
                {step.kind === 'image' && (
                  <>
                    <div className="placement-controls">
                      <span>Card placement</span>
                      <div>
                        {[
                          ['Top left', 0.03, 0.03],
                          ['Top right', 0.97, 0.03],
                          ['Bottom left', 0.03, 0.97],
                          ['Bottom right', 0.97, 0.97],
                        ].map(([label, x, y]) => (
                          <button
                            key={label}
                            onClick={() => patch({ cardX: Number(x), cardY: Number(y) })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label>
                      Display style
                      <select
                        aria-label="Overlay style"
                        value={step.style}
                        onChange={(e) =>
                          patch({
                            style: e.target.value as 'hotspot' | 'callout' | 'area',
                            ...(e.target.value === 'area'
                              ? { zoomEnabled: step.zoomEnabled ?? true }
                              : {}),
                          })
                        }
                      >
                        <option value="hotspot">Hotspot</option>
                        <option value="callout">Callout</option>
                        <option value="area">Area hotspot</option>
                      </select>
                    </label>
                    {step.style !== 'callout' && (
                      <label className="toggle">
                        <input
                          aria-label="Open by default"
                          type="checkbox"
                          checked={step.openByDefault}
                          onChange={(e) => patch({ openByDefault: e.target.checked })}
                        />
                        Open by default
                      </label>
                    )}
                    <label>
                      Card width
                      <input
                        aria-label="Card width"
                        type="range"
                        min="0.18"
                        max="0.6"
                        step="0.01"
                        value={step.cardWidth ?? 0.32}
                        onChange={(e) => patch({ cardWidth: Number(e.target.value) })}
                      />
                    </label>
                    {step.style === 'area' && (
                      <>
                        <label className="toggle">
                          <input
                            aria-label="Zoom into highlighted area"
                            type="checkbox"
                            checked={step.zoomEnabled ?? false}
                            onChange={(e) => patch({ zoomEnabled: e.target.checked })}
                          />
                          Zoom into highlighted area
                        </label>
                        {step.zoomEnabled && (
                          <>
                            <label>
                              Zoom (%)
                              <input
                                aria-label="Area zoom percentage"
                                type="number"
                                min="100"
                                step="any"
                                value={step.zoomPercent ?? automaticZoom(step)}
                                onChange={(e) => {
                                  const n = e.target.valueAsNumber;
                                  if (Number.isFinite(n) && n >= 100) patch({ zoomPercent: n });
                                }}
                              />
                            </label>
                            <button
                              disabled={step.zoomPercent === undefined}
                              onClick={() => patch({ zoomPercent: undefined })}
                            >
                              Use automatic zoom
                            </button>
                            <p className="field-note">
                              {step.zoomPercent === undefined
                                ? 'Automatic: smaller areas get a little more zoom.'
                                : 'Custom zoom.'}{' '}
                              100% is original size. Preview to see the animation; the callout stays
                              its normal size. Large values may crop the highlighted area.
                            </p>
                          </>
                        )}
                        <label>
                          Area width
                          <input
                            aria-label="Area width"
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.01"
                            value={step.areaWidth ?? 0.25}
                            onChange={(e) => patch({ areaWidth: Number(e.target.value) })}
                          />
                        </label>
                        <label>
                          Area height
                          <input
                            aria-label="Area height"
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.01"
                            value={step.areaHeight ?? 0.2}
                            onChange={(e) => patch({ areaHeight: Number(e.target.value) })}
                          />
                        </label>
                      </>
                    )}
                    <label>
                      A little context
                      <textarea
                        aria-label="Callout body"
                        value={step.body}
                        maxLength={5000}
                        onChange={(e) => patch({ body: e.target.value })}
                      />
                    </label>
                    <div className="field-note">Keep it short. Let the product do the talking.</div>
                  </>
                )}
                <hr />
                <div className="section-heading">NAVIGATION</div>
                <label>
                  Continue to
                  <select
                    aria-label="Navigation target"
                    value={step.target}
                    onChange={(e) => patch({ target: e.target.value })}
                  >
                    <option value="next">Next step</option>
                    <option value="end">End walkthrough</option>
                    {project.steps
                      .filter((s) => s.id !== step.id)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.title}
                        </option>
                      ))}
                  </select>
                </label>
                {step.kind === 'video' && (
                  <>
                    <label className="toggle">
                      <input
                        aria-label="Autoplay video"
                        type="checkbox"
                        checked={step.autoplay}
                        onChange={(e) => patch({ autoplay: e.target.checked })}
                      />
                      Autoplay video
                    </label>
                    <div className="range-fields">
                      <label>
                        Clip start (s)
                        <input
                          aria-label="Clip start"
                          type="number"
                          min="0"
                          max={step.clipEnd - 0.05}
                          step="0.01"
                          value={Number(step.clipStart.toFixed(2))}
                          onChange={(e) =>
                            patch({
                              clipStart: clamp(Number(e.target.value), 0, step.clipEnd - 0.05),
                            })
                          }
                        />
                      </label>
                      <label>
                        Clip end (s)
                        <input
                          aria-label="Clip end"
                          type="number"
                          min={step.clipStart + 0.05}
                          max={project.duration}
                          step="0.01"
                          value={Number(step.clipEnd.toFixed(2))}
                          onChange={(e) =>
                            patch({
                              clipEnd: clamp(
                                Number(e.target.value),
                                step.clipStart + 0.05,
                                project.duration,
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                  </>
                )}
                <hr />
                <div className="section-heading">ARRANGE STEP</div>
                <button onClick={() => update(duplicateStep(project, step.id))}>
                  Duplicate step
                </button>
                <div className="arrange">
                  <button
                    aria-label="Move step up"
                    disabled={project.steps[0].id === step.id}
                    onClick={() => update(moveStep(project, step.id, -1))}
                  >
                    ↑ Move up
                  </button>
                  <button
                    aria-label="Move step down"
                    disabled={project.steps.at(-1)?.id === step.id}
                    onClick={() => update(moveStep(project, step.id, 1))}
                  >
                    ↓ Move down
                  </button>
                </div>
                <p className="field-note">
                  Video clips move with their own ranges. Check navigation after rearranging.
                </p>
                <button
                  className="delete"
                  disabled={project.steps.length <= 1}
                  onClick={() => {
                    const p = deleteStep(project, step.id);
                    update(p);
                    select(p.steps[0].id);
                  }}
                >
                  Delete step
                </button>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);

import type { Project } from './model';

export const revision = (p: Project) => p.localRevision ?? p.id;
export function mediaBytes(p: Project) {
  return (
    p.video.size +
    p.steps.reduce((n, s) => n + s.image.size, 0) +
    (p.logo ? Math.ceil(p.logo.length * 0.75) : 0)
  );
}
export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
export function backupStatus(p: Project) {
  if (!p.localBackup) return 'No backup export recorded';
  return p.localBackup.revision === revision(p)
    ? 'Backup exported for these edits'
    : 'Changed since last backup export';
}
export function saveFailure(error: unknown) {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'Browser storage is full. Export a backup, remove an unneeded project, then retry saving.'
    : 'Could not save to this browser. Keep this tab open, export a backup, and retry saving.';
}
export function storageSummary(estimate?: StorageEstimate) {
  const { usage, quota } = estimate ?? {};
  if (
    typeof usage !== 'number' ||
    typeof quota !== 'number' ||
    !Number.isFinite(usage) ||
    !Number.isFinite(quota) ||
    usage < 0 ||
    quota <= 0
  )
    return { text: 'Browser storage estimate unavailable', low: false };
  return {
    text: `About ${formatBytes(usage)} of ${formatBytes(quota)} browser storage used`,
    low: usage / quota >= 0.9,
  };
}

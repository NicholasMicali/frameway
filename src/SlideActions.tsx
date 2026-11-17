import type { Project, Step } from './model';
import { deleteStep, duplicateStep, moveStep } from './model';
import { Button } from './ui/Button';
import { Menu, MenuItem } from './ui/Menu';
import { Icon } from './Icon';

export function SlideActions({
  project,
  step,
  busy,
  selected,
  onChange,
  onSelect,
}: {
  project: Project;
  step: Step;
  busy: boolean;
  selected: string;
  onChange: (project: Project) => void;
  onSelect: (id: string) => void;
}) {
  const index = project.steps.indexOf(step);
  return (
    <Menu
      label={`Step ${index + 1} options`}
      trigger={
        <Button variant="ghost" iconOnly aria-label={`Step ${index + 1} options`}>
          <Icon name="more" />
        </Button>
      }
    >
      <MenuItem onSelect={() => onChange(duplicateStep(project, step.id))} disabled={busy}>
        <Icon name="copy" /> Duplicate
      </MenuItem>
      <MenuItem
        onSelect={() => onChange(moveStep(project, step.id, -1))}
        disabled={busy || index === 0}
      >
        <Icon name="up" /> Move up
      </MenuItem>
      <MenuItem
        onSelect={() => onChange(moveStep(project, step.id, 1))}
        disabled={busy || index === project.steps.length - 1}
      >
        <Icon name="down" /> Move down
      </MenuItem>
      <MenuItem
        danger
        disabled={busy || project.steps.length <= 1}
        onSelect={() => {
          const next = deleteStep(project, step.id);
          onChange(next);
          if (selected === step.id) onSelect(next.steps[Math.min(index, next.steps.length - 1)].id);
        }}
      >
        <Icon name="trash" /> Delete
      </MenuItem>
    </Menu>
  );
}

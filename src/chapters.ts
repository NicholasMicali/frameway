import type { Step } from './model';

/** Section membership follows current step order; the label belongs to its stable starting ID. */
export function chaptersFor(steps: Step[]) {
  return steps.flatMap((step, index) =>
    step.chapter === undefined
      ? []
      : [
          {
            id: step.id,
            index,
            title: step.chapter.trim() || step.title || 'Untitled chapter',
          },
        ],
  );
}

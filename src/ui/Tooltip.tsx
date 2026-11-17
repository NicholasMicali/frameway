import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactElement } from 'react';

/** Tooltips supplement a control's accessible name; they never replace it. */
export function Tooltip({ children, label }: { children: ReactElement; label: string }) {
  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="ui-tooltip" sideOffset={6} collisionPadding={12}>
            {label}
            <TooltipPrimitive.Arrow />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

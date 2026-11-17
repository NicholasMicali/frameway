import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { createContext, useContext, useRef, type ReactElement, type ReactNode } from 'react';

const SelectionContext = createContext<((action: () => void) => void) | null>(null);

export function Menu({
  trigger,
  label,
  children,
}: {
  trigger: ReactElement;
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selection = useRef<(() => void) | undefined>(undefined);
  return (
    <SelectionContext.Provider
      value={(action) => {
        selection.current = action;
      }}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger ref={triggerRef} asChild>
          {trigger}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="ui-menu"
            aria-label={label}
            align="end"
            sideOffset={8}
            collisionPadding={16}
            onCloseAutoFocus={(event) => {
              // Restore focus before opening a dialog so it has a persistent return target.
              event.preventDefault();
              triggerRef.current?.focus();
              const action = selection.current;
              selection.current = undefined;
              action?.();
            }}
          >
            {children}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </SelectionContext.Provider>
  );
}

export function MenuItem({
  children,
  onSelect,
  disabled = false,
  danger = false,
  label,
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  label?: string;
}) {
  const select = useContext(SelectionContext);
  return (
    <DropdownMenu.Item
      className={`ui-menu-item ${danger ? 'ui-menu-danger' : ''}`}
      aria-label={label}
      disabled={disabled}
      onSelect={() => (select ? select(onSelect) : onSelect())}
    >
      {children}
    </DropdownMenu.Item>
  );
}

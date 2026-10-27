import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Native keyboard-operable disclosure shared by secondary help sections. */
export function Disclosure({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <details className="disclosure" id={id}>
      <summary>
        <span>
          <strong>{title}</strong>
          {description && <span className="disclosure-description">{description}</span>}
        </span>
        <Icon name="chevron" />
      </summary>
      <div className="disclosure-content">{children}</div>
    </details>
  );
}

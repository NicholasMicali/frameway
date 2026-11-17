import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  iconOnly?: boolean;
};

/** Native button semantics, including refs needed by Radix asChild triggers. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', iconOnly = false, className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`ui-button ui-button-${variant} ${iconOnly ? 'ui-button-icon' : ''} ${className}`}
      {...props}
    />
  );
});

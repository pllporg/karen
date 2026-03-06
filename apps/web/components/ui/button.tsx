'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export type ButtonTone = 'default' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: ButtonSize;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, tone = 'default', size = 'md', block = false, type = 'button', disabled, ...props },
  ref,
) {
  const state =
    disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true' ? 'disabled' : 'default';

  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'button',
        tone === 'secondary' && 'secondary',
        tone === 'ghost' && 'ghost',
        tone === 'danger' && 'danger',
        block && 'button-block',
        className,
      )}
      disabled={disabled}
      data-tone={tone}
      data-size={size}
      data-state={state}
      {...props}
    />
  );
});

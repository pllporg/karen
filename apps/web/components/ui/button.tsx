'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export type ButtonTone = 'default' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, tone = 'default', block = false, type = 'button', disabled, ...props },
  ref,
) {
  const state =
    disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true' ? 'disabled' : 'enabled';

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
      data-state={state}
      {...props}
    />
  );
});

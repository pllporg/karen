'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  const resolvedInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(invalid);
  const state = disabled ? 'disabled' : resolvedInvalid ? 'error' : 'default';

  return (
    <input
      ref={ref}
      className={cx('input', className)}
      disabled={disabled}
      aria-invalid={ariaInvalid ?? (resolvedInvalid ? 'true' : undefined)}
      data-state={state}
      {...props}
    />
  );
});

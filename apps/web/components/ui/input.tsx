'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cx('input', className)}
      aria-invalid={ariaInvalid ?? (invalid ? 'true' : undefined)}
      {...props}
    />
  );
});

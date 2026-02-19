'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cx } from './cx';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cx('select', className)}
      aria-invalid={ariaInvalid ?? (invalid ? 'true' : undefined)}
      {...props}
    />
  );
});

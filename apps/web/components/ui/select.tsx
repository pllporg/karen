'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cx } from './cx';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  const resolvedInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(invalid);
  const state = disabled ? 'disabled' : resolvedInvalid ? 'error' : 'default';

  return (
    <select
      ref={ref}
      className={cx('select', className)}
      disabled={disabled}
      aria-invalid={ariaInvalid ?? (resolvedInvalid ? 'true' : undefined)}
      data-state={state}
      {...props}
    />
  );
});

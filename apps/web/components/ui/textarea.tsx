'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cx } from './cx';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  const resolvedInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(invalid);
  const state = disabled ? 'disabled' : resolvedInvalid ? 'error' : 'default';

  return (
    <textarea
      ref={ref}
      className={cx('textarea', className)}
      disabled={disabled}
      aria-invalid={ariaInvalid ?? (resolvedInvalid ? 'true' : undefined)}
      data-state={state}
      {...props}
    />
  );
});

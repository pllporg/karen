'use client';

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

export type FormFieldProps = {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

export function FormField({
  label,
  name,
  error,
  required = false,
  hint,
  children,
}: FormFieldProps) {
  const fieldId = name;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: fieldId,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
        'aria-describedby': describedBy || undefined,
        'aria-errormessage': error ? errorId : undefined,
      })
    : children;

  return (
    <div className="stack-1">
      <label htmlFor={fieldId} className="type-label">
        {label}
        {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="form-field-hint">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="form-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

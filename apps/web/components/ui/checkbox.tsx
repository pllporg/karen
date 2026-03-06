'use client';

import { useId } from 'react';

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
};

export function Checkbox({ checked, onChange, label, disabled = false, id }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className="checkbox-wrapper" htmlFor={inputId}>
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="checkbox-box" data-checked={checked} data-disabled={disabled || undefined} aria-hidden="true" />
      <span className="checkbox-label" data-disabled={disabled || undefined}>
        {label}
      </span>
    </label>
  );
}

'use client';

import { useId } from 'react';

export type RadioProps = {
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  name: string;
  disabled?: boolean;
};

export function Radio({ value, checked, onChange, label, name, disabled = false }: RadioProps) {
  const id = useId();

  return (
    <label className="radio-wrapper" htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="radio-circle" data-checked={checked} data-disabled={disabled || undefined} aria-hidden="true" />
      <span className="radio-label" data-disabled={disabled || undefined}>
        {label}
      </span>
    </label>
  );
}

'use client';

import { useId } from 'react';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  const toggleId = useId();

  return (
    <label className="toggle-wrapper" htmlFor={toggleId}>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle-track"
        data-checked={checked}
        data-disabled={disabled || undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
      >
        <span className="toggle-knob" aria-hidden="true" />
      </button>
      <span className="toggle-label" data-disabled={disabled || undefined}>
        {label}
      </span>
    </label>
  );
}

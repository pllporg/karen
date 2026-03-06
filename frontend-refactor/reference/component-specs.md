# Component API Specifications

> Exact TypeScript interfaces for every new or modified component.
> Implementations must match these signatures exactly.
> All components live in `apps/web/components/`.

---

## Modified Components

### Button (`components/ui/button.tsx`)

**Add `size` prop. Preserve existing `tone` and `block` props.**

```typescript
import { ButtonHTMLAttributes } from 'react';

type ButtonTone = 'default' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;     // Default: 'default'
  size?: ButtonSize;     // Default: 'md'
  block?: boolean;       // Full-width
}

export function Button({ tone = 'default', size = 'md', block, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cx('button', block && 'button-block')}
      data-tone={tone}
      data-size={size}
      data-state={props.disabled ? 'disabled' : 'default'}
      type={type}
      {...props}
    />
  );
}
```

### Input (`components/ui/input.tsx`)

**No signature change. Ensure `data-state` maps correctly.**

Existing behavior is correct. Verify that:
- `invalid={true}` produces `data-state="error"`
- `disabled={true}` produces `data-state="disabled"`
- Default produces `data-state="default"`

### Select (`components/ui/select.tsx`)

Same as Input — verify state mapping.

### Textarea (`components/ui/textarea.tsx`)

Same as Input — verify state mapping.

### Card (`components/ui/card.tsx`)

**Add structured sub-components. Preserve existing `Card` and `CardGrid`.**

```typescript
import { HTMLAttributes, ReactNode } from 'react';

// Existing (keep)
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card', className)} {...props} />;
}

export function CardGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card-grid', className)} {...props} />;
}

// New: structured card parts
interface CardHeaderProps {
  module?: string;       // Module code (e.g., "INTK")
  status?: ReactNode;    // Badge or status indicator
  children?: ReactNode;
}

export function CardHeader({ module, status, children }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div>
        {module && <span className="card-module">{module}</span>}
        {children}
      </div>
      {status}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card-footer', className)}>{children}</div>;
}
```

### Table (`components/ui/table.tsx`)

**Add alternating and sortable props.**

```typescript
import { forwardRef, TableHTMLAttributes, HTMLAttributes } from 'react';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  alternating?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  function Table({ className, alternating, ...props }, ref) {
    return (
      <table
        ref={ref}
        className={cx('table', className)}
        data-alternating={alternating || undefined}
        {...props}
      />
    );
  }
);

// Existing (keep)
export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('table-wrap', className)} {...props} />;
}

// New: sortable column header
interface SortableThProps extends HTMLAttributes<HTMLTableCellElement> {
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
  scope?: 'col' | 'row';
}

export function SortableTh({ children, sorted, onSort, scope = 'col', ...props }: SortableThProps) {
  const indicator = sorted === 'asc' ? ' ▲' : sorted === 'desc' ? ' ▼' : '';
  return (
    <th
      scope={scope}
      data-sortable={!!onSort || undefined}
      onClick={onSort}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
      {...props}
    >
      {children}
      {indicator && <span className="sort-indicator" aria-hidden="true">{indicator}</span>}
    </th>
  );
}
```

### Toast Stack (`components/toast-stack.tsx`)

**Enforce 3-toast max and 8-second duration.**

```typescript
// In the parent component that manages toast items:
// When adding a new toast, if items.length >= 3, remove the oldest.
// Set default duration to 8000ms for each toast.
// Add onKeyDown handler: Escape dismisses the most recent toast.
```

### Confirm Dialog (`components/confirm-dialog.tsx`)

**Add `typedConfirmation` prop.**

```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'default' | 'danger';
  busy?: boolean;
  typedConfirmation?: string; // If set, user must type this to enable confirm
  onConfirm: () => void;
  onCancel: () => void;
}
```

When `typedConfirmation` is set:
- Render `<Input>` below description
- Placeholder: `Type "${typedConfirmation}" to confirm`
- Confirm button disabled until input value === typedConfirmation
- Input shows error state until match

---

## New Components

### Checkbox (`components/ui/checkbox.tsx`)

```typescript
import { useId } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({ checked, onChange, label, disabled, id }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <label className="checkbox-wrapper" htmlFor={inputId}>
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only" // visually hidden, still accessible
      />
      <span
        className="checkbox-box"
        data-checked={checked}
        data-disabled={disabled || undefined}
        aria-hidden="true"
      />
      <span
        className="checkbox-label"
        data-disabled={disabled || undefined}
      >
        {label}
      </span>
    </label>
  );
}
```

### Radio (`components/ui/radio.tsx`)

```typescript
interface RadioProps {
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  name: string;
  disabled?: boolean;
}

export function Radio({ value, checked, onChange, label, name, disabled }: RadioProps) {
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
      <span
        className="radio-circle"
        data-checked={checked}
        aria-hidden="true"
      />
      <span className="checkbox-label" data-disabled={disabled || undefined}>
        {label}
      </span>
    </label>
  );
}
```

### Toggle (`components/ui/toggle.tsx`)

```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const id = useId();

  return (
    <label className="toggle-wrapper" htmlFor={id}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className="toggle-track"
        data-checked={checked}
        data-disabled={disabled || undefined}
        aria-hidden="true"
      >
        <span className="toggle-knob" />
      </span>
      <span className="checkbox-label" data-disabled={disabled || undefined}>
        {label}
      </span>
    </label>
  );
}
```

### Stepper (`components/ui/stepper.tsx`)

```typescript
interface StepperStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'blocked';
}

interface StepperProps {
  steps: StepperStep[];
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, onStepClick }: StepperProps) {
  return (
    <nav className="stepper" aria-label="Progress">
      {steps.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div
              className="stepper-connector"
              data-complete={steps[i - 1].status === 'complete' || undefined}
            />
          )}
          <div
            className="stepper-step"
            data-status={step.status}
          >
            <button
              className="stepper-circle"
              onClick={() => {
                if (step.status === 'complete' && onStepClick) onStepClick(i);
              }}
              disabled={step.status === 'blocked' || step.status === 'pending'}
              aria-label={`Step ${i + 1}: ${step.label} (${step.status})`}
              aria-current={step.status === 'active' ? 'step' : undefined}
              type="button"
            >
              {step.status === 'complete' ? '✓' : i + 1}
            </button>
            <span className="stepper-label">{step.label}</span>
          </div>
        </Fragment>
      ))}
    </nav>
  );
}
```

### Key-Value Display (`components/ui/kv-display.tsx`)

```typescript
import { ReactNode } from 'react';

interface KVPair {
  label: string;
  value: ReactNode;
}

interface KVStackProps {
  pairs: KVPair[];
  columns?: 1 | 2 | 3;
}

export function KVStack({ pairs, columns = 1 }: KVStackProps) {
  return (
    <div className="kv-stack" data-columns={columns > 1 ? columns : undefined}>
      {pairs.map((pair) => (
        <div key={pair.label} className="kv-pair-stacked">
          <dt className="kv-label">{pair.label}</dt>
          <dd className="kv-value">{pair.value || '—'}</dd>
        </div>
      ))}
    </div>
  );
}

interface KVInlineProps {
  pairs: KVPair[];
}

export function KVInline({ pairs }: KVInlineProps) {
  return (
    <dl className="kv-inline">
      {pairs.map((pair) => (
        <div key={pair.label} className="kv-pair-inline">
          <dt className="kv-label">{pair.label}</dt>
          <dd className="kv-value">{pair.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
```

### FormField (`components/ui/form-field.tsx`)

```typescript
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, name, error, required, hint, children }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="stack-1">
      <label htmlFor={name} className="type-label">
        {label}
        {required && <span className="form-field-required" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={hintId} className="form-field-hint">{hint}</p>}
      {children}
      {error && (
        <p id={errorId} className="form-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### LoadingState (`components/loading-state.tsx`)

```typescript
interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <div className="loading-bar" aria-hidden="true" />
      <span className="loading-label">{label}</span>
    </div>
  );
}
```

### ErrorState (`components/error-state.tsx`)

```typescript
import { Button } from './ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <Button tone="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
```

### EmptyState (`components/empty-state.tsx`)

```typescript
import { Button } from './ui/button';

interface EmptyStateProps {
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {action && (
        <Button tone="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### InlineAlert (`components/inline-alert.tsx`)

```typescript
import { ReactNode } from 'react';

interface InlineAlertProps {
  tone?: 'info' | 'warning' | 'success';
  children: ReactNode;
}

export function InlineAlert({ tone = 'info', children }: InlineAlertProps) {
  return (
    <div
      className="inline-alert"
      data-tone={tone === 'info' ? undefined : tone}
      role={tone === 'warning' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
```

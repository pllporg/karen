'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  titleId,
  descriptionId,
  className,
  children,
  closeOnOverlay = true,
  busy = false,
  onClose,
}: {
  open: boolean;
  titleId?: string;
  descriptionId?: string;
  className?: string;
  children: ReactNode;
  closeOnOverlay?: boolean;
  busy?: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) {
        onClose();
      }
      return;
    }

    if (event.key !== 'Tab') return;
    const container = dialogRef.current;
    if (!container) return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="ui-modal-overlay"
      role="presentation"
      onMouseDown={() => (closeOnOverlay && !busy ? onClose() : undefined)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={busy ? 'true' : 'false'}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-state="open"
        className={cx('ui-modal', className)}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}

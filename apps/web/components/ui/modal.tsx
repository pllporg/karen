'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { cx } from './cx';
import { focusOverlayElement, trapOverlayFocus } from './overlay-focus';

export function Modal({
  open,
  titleId,
  descriptionId,
  className,
  children,
  closeOnOverlay = true,
  busy = false,
  initialFocusRef,
  onClose,
}: {
  open: boolean;
  titleId?: string;
  descriptionId?: string;
  className?: string;
  children: ReactNode;
  closeOnOverlay?: boolean;
  busy?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const raf =
      dialog ?
        requestAnimationFrame(() => {
          focusOverlayElement(dialog, initialFocusRef?.current || null);
        })
      : null;

    return () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [initialFocusRef, open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) {
        onClose();
      }
      return;
    }

    const container = dialogRef.current;
    if (!container) return;
    trapOverlayFocus(container, event);
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
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}

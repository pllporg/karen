'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  side = 'left',
  title,
  children,
  closeOnOverlay = true,
  onClose,
}: {
  open: boolean;
  side?: 'left' | 'right';
  title?: string;
  children: ReactNode;
  closeOnOverlay?: boolean;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const container = drawerRef.current;

    if (container) {
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const target = focusable[0] || container;
      target.focus();
    }

    return () => {
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const container = drawerRef.current;
    if (!container) return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
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
    <>
      <aside
        ref={drawerRef}
        className={cx('ui-drawer', `ui-drawer-${side}`, open && 'is-open')}
        data-state="open"
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : 'Drawer'}
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="ui-drawer-header">
          {title ? (
            <p className="ui-drawer-title" id={titleId}>
              {title}
            </p>
          ) : null}
          <button className="button ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="ui-drawer-body">{children}</div>
      </aside>
      <button
        className="ui-drawer-overlay"
        type="button"
        aria-label="Close drawer"
        onClick={() => (closeOnOverlay ? onClose() : undefined)}
      />
    </>
  );
}

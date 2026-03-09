'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';
import { focusOverlayElement, trapOverlayFocus } from './overlay-focus';

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
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    const raf =
      drawer ?
        requestAnimationFrame(() => {
          focusOverlayElement(drawer, closeButtonRef.current);
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
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    const drawer = drawerRef.current;
    if (!drawer) return;
    trapOverlayFocus(drawer, event);
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
            <p id={titleId} className="ui-drawer-title">
              {title}
            </p>
          ) : null}
          <button ref={closeButtonRef} className="button ghost" type="button" onClick={onClose}>
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

'use client';

import { type ReactNode } from 'react';
import { cx } from './cx';

export function Drawer({
  open,
  side = 'left',
  title,
  children,
  onClose,
}: {
  open: boolean;
  side?: 'left' | 'right';
  title?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={cx('ui-drawer', `ui-drawer-${side}`, open && 'is-open')} aria-hidden={!open}>
        <div className="ui-drawer-header">
          {title ? <p className="ui-drawer-title">{title}</p> : null}
          <button className="button ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="ui-drawer-body">{children}</div>
      </aside>
      {open ? <button className="ui-drawer-overlay" type="button" aria-label="Close drawer" onClick={onClose} /> : null}
    </>
  );
}

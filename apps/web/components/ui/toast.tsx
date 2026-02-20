'use client';

import { type ReactNode } from 'react';
import { cx } from './cx';

export type ToastTone = 'success' | 'warning' | 'error';

export function Toast({
  tone,
  title,
  time,
  detail,
  actions,
}: {
  tone: ToastTone;
  title: string;
  time: string;
  detail: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cx('toast', `toast-${tone}`)} role={tone === 'error' ? 'alert' : 'status'} data-tone={tone}>
      <div className="toast-header">
        <p className="toast-title">{title}</p>
        <p className="toast-time">{time}</p>
      </div>
      <p className="toast-detail">{detail}</p>
      {actions}
    </section>
  );
}

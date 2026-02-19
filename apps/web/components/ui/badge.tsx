'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export type BadgeTone =
  | 'default'
  | 'proposed'
  | 'in-review'
  | 'approved'
  | 'executed'
  | 'returned'
  | 'blocked';

export function Badge({
  children,
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={cx('badge', tone !== 'default' && `status-${tone}`, className)} {...props}>
      {children}
    </span>
  );
}

'use client';

import { forwardRef, type HTMLAttributes, type TableHTMLAttributes } from 'react';
import { cx } from './cx';

export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(function Table(
  { className, ...props },
  ref,
) {
  return <table ref={ref} className={cx('table', className)} {...props} />;
});

export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('table-wrapper', className)} {...props} />;
}

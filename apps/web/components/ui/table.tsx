'use client';

import { forwardRef, type HTMLAttributes, type TableHTMLAttributes } from 'react';
import { cx } from './cx';

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  alternating?: boolean;
  sortable?: boolean;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, alternating, sortable, ...props },
  ref,
) {
  const tableLabel = props['aria-label'] || props['aria-labelledby'] ? undefined : 'Data table';

  return (
    <table
      ref={ref}
      className={cx('table', className)}
      data-alternating={alternating || undefined}
      data-sortable={sortable || undefined}
      aria-label={tableLabel}
      {...props}
    />
  );
});

export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('table-wrapper', className)} {...props} />;
}

export type SortableState = 'asc' | 'desc' | false;

export type SortableThProps = HTMLAttributes<HTMLTableCellElement> & {
  sorted?: SortableState;
  onSort?: () => void;
  scope?: 'col' | 'row';
};

export function SortableTh({ children, sorted = false, onSort, scope = 'col', ...props }: SortableThProps) {
  const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : onSort ? '–' : '';

  const handleClick = () => {
    if (!onSort) return;
    onSort();
  };

  return (
    <th
      scope={scope}
      data-sortable={onSort ? 'true' : undefined}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
      onClick={handleClick}
      {...props}
    >
      <span>{children}</span>
      {indicator ? (
        <span className="sort-indicator" aria-hidden="true">
          {' '}
          {indicator}
        </span>
      ) : null}
    </th>
  );
}

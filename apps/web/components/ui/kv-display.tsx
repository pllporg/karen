'use client';

import { type ReactNode } from 'react';
import { cx } from './cx';

export type KVPair = {
  label: string;
  value: ReactNode;
};

export function KVStack({
  pairs,
  columns = 1,
  className,
}: {
  pairs: KVPair[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={cx('kv-stack', className)} data-columns={columns}>
      {pairs.map((pair) => (
        <div key={pair.label} className="kv-pair-stacked">
          <div className="kv-label">{pair.label}</div>
          <div className="kv-value">{pair.value}</div>
        </div>
      ))}
    </div>
  );
}

export function KVInline({ pairs, className }: { pairs: KVPair[]; className?: string }) {
  return (
    <div className={cx('kv-inline', className)}>
      {pairs.map((pair) => (
        <div key={pair.label} className="kv-pair-inline">
          <div className="kv-label">{pair.label}</div>
          <div className="kv-value">{pair.value}</div>
        </div>
      ))}
    </div>
  );
}

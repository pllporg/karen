'use client';

import { type HTMLAttributes } from 'react';
import { cx } from './cx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card', className)} {...props} />;
}

export function CardGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card-grid', className)} {...props} />;
}

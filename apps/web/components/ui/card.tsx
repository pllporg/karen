'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card', className)} {...props} />;
}

export function CardGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card-grid', className)} {...props} />;
}

export type CardHeaderProps = {
  module?: string;
  status?: ReactNode;
  children?: ReactNode;
};

export function CardHeader({ module, status, children }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div>
        {module ? <span className="card-module">{module}</span> : null}
        {children}
      </div>
      {status}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card-footer', className)}>{children}</div>;
}

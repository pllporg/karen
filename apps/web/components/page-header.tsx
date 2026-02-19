import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div className="topbar-copy">
        <h1 className="topbar-title">{title}</h1>
        {subtitle ? <p className="topbar-subtitle">{subtitle}</p> : null}
      </div>
      {right ? <div className="topbar-actions">{right}</div> : null}
    </div>
  );
}

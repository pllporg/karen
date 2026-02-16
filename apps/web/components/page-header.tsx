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
      <div>
        <h1 style={{ fontSize: '1.65rem', margin: 0 }}>{title}</h1>
        {subtitle ? <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

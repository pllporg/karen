'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSessionToken } from '../lib/api';
import type { ReactNode } from 'react';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin', label: 'Admin' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/matters', label: 'Matters' },
  { href: '/communications', label: 'Communications' },
  { href: '/documents', label: 'Documents' },
  { href: '/billing', label: 'Billing & Trust' },
  { href: '/imports', label: 'Imports' },
  { href: '/exports', label: 'Exports' },
  { href: '/ai', label: 'AI Workspace' },
  { href: '/reporting', label: 'Reporting' },
  { href: '/portal', label: 'Client Portal' },
  { href: '/data-dictionary', label: 'Data Dictionary' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand">Karen Legal Suite</div>
        <div className="badge" style={{ marginBottom: 12 }}>Attorney Review Required for AI</div>
        <nav>
          {LINKS.map((item) => (
            <Link
              className="nav-link"
              style={{
                background: path === item.href ? '#1f7a8c20' : undefined,
                fontWeight: path === item.href ? 700 : 500,
              }}
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="button ghost"
          onClick={() => {
            clearSessionToken();
            router.push('/login');
          }}
        >
          Sign out
        </button>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}

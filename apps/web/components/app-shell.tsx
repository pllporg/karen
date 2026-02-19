'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSessionToken } from '../lib/api';
import { useState, type ReactNode } from 'react';

const LINKS = [
  { href: '/dashboard', label: 'Command Center', code: '00' },
  { href: '/admin', label: 'Administration', code: '01' },
  { href: '/contacts', label: 'Contacts Graph', code: '02' },
  { href: '/matters', label: 'Matter Registry', code: '03' },
  { href: '/communications', label: 'Communications', code: '04' },
  { href: '/documents', label: 'Document Vault', code: '05' },
  { href: '/billing', label: 'Billing Trust', code: '06' },
  { href: '/imports', label: 'Import Queue', code: '07' },
  { href: '/exports', label: 'Export Archive', code: '08' },
  { href: '/ai', label: 'AI Workspace', code: '09' },
  { href: '/reporting', label: 'Reporting', code: '10' },
  { href: '/portal', label: 'Client Portal', code: '11' },
  { href: '/data-dictionary', label: 'Data Dictionary', code: '12' },
];

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }
  if (href === '/dashboard') {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || '';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    clearSessionToken();
    router.push('/login');
  };

  return (
    <div className="page-shell shell-root">
      <button
        type="button"
        className="shell-menu-toggle"
        onClick={() => setMobileOpen((current) => !current)}
        aria-expanded={mobileOpen}
        aria-controls="karen-primary-nav"
      >
        {mobileOpen ? 'Close' : 'Menu'}
      </button>

      <aside className="shell-sidebar" data-open={mobileOpen ? 'true' : 'false'}>
        <div className="shell-sidebar-header">
          <p className="shell-header-kicker">Standards Manual</p>
          <p className="shell-header-title">Karen Legal Suite</p>
          <p className="shell-header-meta">Rev. 2026 - Internal</p>
        </div>

        <nav id="karen-primary-nav" className="shell-nav" aria-label="Primary navigation">
          {LINKS.map((item) => {
            const active = isActivePath(path, item.href);
            return (
              <Link
                className={`shell-nav-link${active ? ' is-active' : ''}`}
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="shell-nav-code">§{item.code}</span>
                <span className="shell-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shell-sidebar-footer">
          <p className="shell-footer-note">
            AI work product is draft-only and must remain in attorney review until explicitly approved.
          </p>
          <button type="button" className="shell-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <button type="button" className="shell-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      ) : null}

      <main className="main-panel" onClick={() => setMobileOpen(false)}>
        {children}
      </main>
    </div>
  );
}

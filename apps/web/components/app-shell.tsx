'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSessionToken } from '../lib/api';
import { useEffect, useState, type ReactNode } from 'react';

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

type ShellViewportMode = 'desktop' | 'compact' | 'tablet' | 'unsupported';

function resolveShellViewportMode(width: number): ShellViewportMode {
  if (width < 768) {
    return 'unsupported';
  }
  if (width < 1024) {
    return 'tablet';
  }
  if (width < 1280) {
    return 'compact';
  }
  return 'desktop';
}

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
  const [shellMode, setShellMode] = useState<ShellViewportMode>(() => {
    if (typeof window === 'undefined') {
      return 'desktop';
    }
    return resolveShellViewportMode(window.innerWidth);
  });

  const handleSignOut = () => {
    clearSessionToken();
    router.push('/login');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleResize = () => {
      setShellMode(resolveShellViewportMode(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (shellMode !== 'tablet' && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen, shellMode]);

  if (shellMode === 'unsupported') {
    return (
      <div className="page-shell unsupported-shell" data-shell-mode={shellMode}>
        <a className="skip-link" href="#lic-unsupported-content">
          Skip to main content
        </a>
        <main id="lic-unsupported-content" tabIndex={-1} className="unsupported-panel">
          <div className="unsupported-card" role="status" aria-live="polite">
            <p className="unsupported-code">Viewport Notice</p>
            <h1>Desktop Required</h1>
            <p className="unsupported-message">
              LIC is designed for desktop use. For the best experience, use a device with a screen width of 768px or
              greater.
            </p>
            <button type="button" className="shell-signout unsupported-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell shell-root" data-shell-mode={shellMode}>
      <a className="skip-link" href="#lic-main-content">
        Skip to main content
      </a>
      <button
        type="button"
        className="shell-menu-toggle"
        onClick={() => {
          if (shellMode === 'tablet') {
            setMobileOpen((current) => !current);
          }
        }}
        aria-expanded={shellMode === 'tablet' ? mobileOpen : false}
        aria-controls="lic-primary-nav"
      >
        {shellMode === 'tablet' && mobileOpen ? 'Close' : 'Menu'}
      </button>

      <aside
        className="shell-sidebar"
        data-open={shellMode === 'tablet' && mobileOpen ? 'true' : 'false'}
        data-shell-mode={shellMode}
      >
        <div className="shell-sidebar-header">
          <div className="shell-brand-lockup" aria-hidden="true">
            <span className="shell-brand-mark">LIC</span>
          </div>
          <p className="shell-header-kicker">Standards Manual</p>
          <p className="shell-header-title">LIC Legal Suite</p>
          <p className="shell-header-meta">Rev. 2026 - Internal</p>
        </div>

        <nav id="lic-primary-nav" className="shell-nav" aria-label="Primary navigation">
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

      {shellMode === 'tablet' && mobileOpen ? (
        <button type="button" className="shell-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      ) : null}

      <main
        id="lic-main-content"
        tabIndex={-1}
        className="main-panel"
        onClick={() => {
          if (shellMode === 'tablet') {
            setMobileOpen(false);
          }
        }}
      >
        <div className="main-panel-content">{children}</div>
      </main>
    </div>
  );
}

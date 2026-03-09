'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { bootstrapSession, clearSessionToken, getSessionToken, logoutSession } from '../lib/api';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', shortCode: 'DB' },
  { href: '/intake', label: 'Intake Queue', shortCode: 'IQ' },
  { href: '/analyst', label: 'Analyst Dashboard', shortCode: 'AN' },
  { href: '/auditor', label: 'Auditor Queue', shortCode: 'AQ' },
  { href: '/admin', label: 'Admin', shortCode: 'AD' },
  { href: '/contacts', label: 'Contacts', shortCode: 'CT' },
  { href: '/matters', label: 'Matters', shortCode: 'MT' },
  { href: '/communications', label: 'Communications', shortCode: 'CM' },
  { href: '/documents', label: 'Documents', shortCode: 'DC' },
  { href: '/billing', label: 'Billing & Trust', shortCode: 'BL' },
  { href: '/imports', label: 'Imports', shortCode: 'IM' },
  { href: '/exports', label: 'Exports', shortCode: 'EX' },
  { href: '/ai', label: 'AI Workspace', shortCode: 'AI' },
  { href: '/reporting', label: 'Reporting', shortCode: 'RP' },
  { href: '/portal', label: 'Client Portal', shortCode: 'PT' },
  { href: '/data-dictionary', label: 'Data Dictionary', shortCode: 'DD' },
];

// `/shared-doc/[token]` remains intentionally out of primary navigation.
// It is an access-token scoped context route entered from explicit share links.

type ShellViewportMode = 'desktop' | 'compact' | 'tablet' | 'unsupported';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const [authReady, setAuthReady] = useState(() => path.startsWith('/login') || Boolean(getSessionToken()));
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const shouldReturnFocusToMenuRef = useRef(false);
  const [shellMode, setShellMode] = useState<ShellViewportMode>(() => {
    if (typeof window === 'undefined') {
      return 'desktop';
    }
    return resolveShellViewportMode(window.innerWidth);
  });
  const isTabletNavOpen = shellMode === 'tablet' && mobileOpen;
  const isTabletNavHidden = shellMode === 'tablet' && !mobileOpen;

  const handleSignOut = async () => {
    await logoutSession();
    router.push('/login');
  };

  function closeTabletNav({ returnFocus = true }: { returnFocus?: boolean } = {}) {
    shouldReturnFocusToMenuRef.current = returnFocus;
    setMobileOpen(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (path.startsWith('/login')) {
      setAuthReady(true);
      return undefined;
    }
    if (getSessionToken()) {
      setAuthReady(true);
      return undefined;
    }

    setAuthReady(false);
    bootstrapSession()
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          clearSessionToken();
          const nextPath = path && path !== '/' ? path : '/dashboard';
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearSessionToken();
        const nextPath = path && path !== '/' ? path : '/dashboard';
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [path, router]);

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
      shouldReturnFocusToMenuRef.current = false;
      setMobileOpen(false);
    }
  }, [mobileOpen, shellMode]);

  useEffect(() => {
    if (!isTabletNavOpen) {
      if (shouldReturnFocusToMenuRef.current) {
        shouldReturnFocusToMenuRef.current = false;
        const raf = requestAnimationFrame(() => {
          menuToggleRef.current?.focus();
        });
        return () => cancelAnimationFrame(raf);
      }
      return undefined;
    }

    const raf = requestAnimationFrame(() => {
      const container = sidebarRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const target =
        container.querySelector<HTMLElement>('[data-sidebar-close="true"]') ||
        container.querySelector<HTMLElement>('[aria-current="page"]') ||
        focusable[0] ||
        container;
      target.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [isTabletNavOpen]);

  function handleTabletNavKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isTabletNavOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeTabletNav();
      return;
    }

    if (event.key !== 'Tab') return;

    const container = sidebarRef.current;
    if (!container) return;

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

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

  if (!authReady) {
    return (
      <div className="page-shell shell-root" data-shell-mode={shellMode}>
        <a className="skip-link" href="#lic-main-content">
          Skip to main content
        </a>
        <main id="lic-main-content" tabIndex={-1} className="main-panel">
          <div className="main-panel-content">
            <div className="card">
              <p className="meta-note">SESSION CHECK</p>
              <h1 style={{ marginTop: 0 }}>Verifying Session</h1>
              <p style={{ color: 'var(--lic-text-muted)' }}>
                Confirming authenticated access before loading tenant data.
              </p>
            </div>
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
        ref={menuToggleRef}
        type="button"
        className="shell-menu-toggle"
        onClick={() => {
          if (shellMode === 'tablet') {
            if (mobileOpen) {
              closeTabletNav();
              return;
            }
            setMobileOpen(true);
          }
        }}
        aria-expanded={isTabletNavOpen}
        aria-controls="lic-primary-nav-drawer"
        aria-hidden={isTabletNavOpen ? 'true' : undefined}
        tabIndex={isTabletNavOpen ? -1 : undefined}
      >
        {isTabletNavOpen ? 'Close' : 'Menu'}
      </button>

      <aside
        id="lic-primary-nav-drawer"
        ref={sidebarRef}
        className="shell-sidebar"
        data-open={isTabletNavOpen ? 'true' : 'false'}
        data-shell-mode={shellMode}
        role={shellMode === 'tablet' ? 'dialog' : undefined}
        aria-label={shellMode === 'tablet' ? 'Primary navigation' : undefined}
        aria-modal={isTabletNavOpen ? 'true' : undefined}
        aria-hidden={isTabletNavHidden ? 'true' : undefined}
        tabIndex={isTabletNavOpen ? -1 : undefined}
        onKeyDown={handleTabletNavKeyDown}
      >
        <div className="shell-sidebar-header">
          <div className="shell-sidebar-header-top">
            <div className="shell-brand-lockup" aria-hidden="true">
              <span className="shell-brand-mark">LIC</span>
            </div>
            {shellMode === 'tablet' ? (
              <button
                type="button"
                className="shell-sidebar-close"
                data-sidebar-close="true"
                onClick={() => closeTabletNav()}
              >
                Close
              </button>
            ) : null}
          </div>
          <p className="shell-header-kicker">Practice Operations</p>
          <p className="shell-header-title">LIC Legal Suite</p>
          <p className="shell-header-meta">Tenant-Isolated Workspace</p>
        </div>

        <nav id="lic-primary-nav" className="shell-nav" aria-label="Primary navigation">
          {LINKS.map((item) => {
            const active = isActivePath(path, item.href);
            return (
              <Link
                className={`shell-nav-link${active ? ' is-active' : ''}`}
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                tabIndex={isTabletNavHidden ? -1 : undefined}
                onClick={() => closeTabletNav({ returnFocus: false })}
              >
                <span className="shell-nav-short" aria-hidden="true">
                  {item.shortCode}
                </span>
                <span className="shell-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shell-sidebar-footer">
          <p className="shell-footer-note">
            AI work product is draft-only and must remain in attorney review until explicitly approved.
          </p>
          <button
            type="button"
            className="shell-signout"
            onClick={handleSignOut}
            tabIndex={isTabletNavHidden ? -1 : undefined}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {isTabletNavOpen ? (
        <button type="button" className="shell-overlay" aria-label="Close navigation" onClick={() => closeTabletNav()} />
      ) : null}

      <main
        id="lic-main-content"
        tabIndex={-1}
        className="main-panel"
        aria-hidden={isTabletNavOpen ? 'true' : undefined}
        onClick={() => {
          if (shellMode === 'tablet') {
            closeTabletNav({ returnFocus: false });
          }
        }}
      >
        <div className="main-panel-content">{children}</div>
      </main>
    </div>
  );
}

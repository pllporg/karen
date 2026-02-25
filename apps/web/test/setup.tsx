import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useParams: () => ({}),
  useSearchParams: () => ({
    get: () => null,
  }),
  redirect: vi.fn(),
}));

beforeEach(() => {
  window.localStorage.setItem('session_token', 'test-session-token');
});

afterEach(() => {
  window.localStorage.removeItem('session_token');
  cleanup();
  vi.restoreAllMocks();
});

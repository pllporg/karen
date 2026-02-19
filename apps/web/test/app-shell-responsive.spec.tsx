import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AppShell } from '../components/app-shell';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('AppShell responsive behavior matrix', () => {
  it('uses full desktop mode at >=1280px', () => {
    setViewport(1366);
    render(
      <AppShell>
        <div>Desktop content</div>
      </AppShell>,
    );

    const shellRoot = document.querySelector('.shell-root');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'desktop');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('uses compact desktop mode at 1024-1279px', () => {
    setViewport(1120);
    render(
      <AppShell>
        <div>Compact content</div>
      </AppShell>,
    );

    const shellRoot = document.querySelector('.shell-root');
    const sidebar = document.querySelector('.shell-sidebar');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'compact');
    expect(sidebar).toHaveAttribute('data-shell-mode', 'compact');
  });

  it('uses drawer behavior at tablet widths', () => {
    setViewport(900);
    render(
      <AppShell>
        <div>Tablet content</div>
      </AppShell>,
    );

    const shellRoot = document.querySelector('.shell-root');
    const sidebar = document.querySelector('.shell-sidebar');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'tablet');
    expect(sidebar).toHaveAttribute('data-open', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(sidebar).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
  });

  it('shows unsupported notice below 768px', () => {
    setViewport(640);
    render(
      <AppShell>
        <div>Unsupported content</div>
      </AppShell>,
    );

    expect(screen.getByText('Desktop Required')).toBeInTheDocument();
    expect(
      screen.getByText(
        'LIC is designed for desktop use. For the best experience, use a device with a screen width of 768px or greater.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument();
  });
});

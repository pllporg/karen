import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AppShell } from '../components/app-shell';
import { useStrictAuthBootstrapMode } from './setup';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}


describe('AppShell responsive behavior matrix', () => {
  it('uses full desktop mode at >=1280px', async () => {
    useStrictAuthBootstrapMode();
    setViewport(1366);
    render(
      <AppShell>
        <div>Desktop content</div>
      </AppShell>,
    );

    await screen.findByRole('navigation', { name: 'Primary navigation' });
    const shellRoot = document.querySelector('.shell-root');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'desktop');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('uses compact desktop mode at 1024-1279px', async () => {
    useStrictAuthBootstrapMode();
    setViewport(1120);
    render(
      <AppShell>
        <div>Compact content</div>
      </AppShell>,
    );

    await screen.findByRole('navigation', { name: 'Primary navigation' });
    const shellRoot = document.querySelector('.shell-root');
    const sidebar = document.querySelector('.shell-sidebar');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'compact');
    expect(sidebar).toHaveAttribute('data-shell-mode', 'compact');
  });

  it('uses drawer behavior at tablet widths', async () => {
    useStrictAuthBootstrapMode();
    setViewport(900);
    render(
      <AppShell>
        <div>Tablet content</div>
      </AppShell>,
    );

    const menuButton = await screen.findByRole('button', { name: 'Menu' });
    const shellRoot = document.querySelector('.shell-root');
    const sidebar = document.querySelector('.shell-sidebar');
    expect(shellRoot).toHaveAttribute('data-shell-mode', 'tablet');
    expect(sidebar).toHaveAttribute('data-open', 'false');
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Dashboard$/i })).not.toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(sidebar).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('dialog', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
  });

  it('traps focus inside the tablet navigation drawer and restores focus on escape close', async () => {
    useStrictAuthBootstrapMode();
    setViewport(900);
    render(
      <AppShell>
        <div>Tablet content</div>
      </AppShell>,
    );

    const menuButton = await screen.findByRole('button', { name: 'Menu' });
    menuButton.focus();
    fireEvent.click(menuButton);

    const drawer = await screen.findByRole('dialog', { name: 'Primary navigation' });
    const closeButton = screen.getByRole('button', { name: 'Close' });
    const signOutButton = screen.getByRole('button', { name: 'Sign Out' });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    fireEvent.keyDown(drawer, { key: 'Tab', shiftKey: true });
    expect(signOutButton).toHaveFocus();

    fireEvent.keyDown(drawer, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(drawer, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Primary navigation' })).not.toBeInTheDocument();
      expect(menuButton).toHaveFocus();
    });
  });

  it('shows unsupported notice below 768px', () => {
    useStrictAuthBootstrapMode();
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

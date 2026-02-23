import React from 'react';
import { render, screen } from '@testing-library/react';

import { AppShell } from '../components/app-shell';

describe('AppShell', () => {
  it('renders standardized sidebar navigation with active route semantics', () => {
    render(
      <AppShell>
        <div>Body Content</div>
      </AppShell>,
    );

    expect(screen.getByText('Practice Operations')).toBeInTheDocument();
    expect(screen.getByText('LIC Legal Suite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#lic-main-content');

    const activeLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    expect(screen.getByRole('link', { name: /Matters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    const mainPanelContent = document.querySelector('.main-panel-content');
    expect(mainPanelContent).toBeInTheDocument();
    expect(mainPanelContent).toContainElement(screen.getByText('Body Content'));
  });
});

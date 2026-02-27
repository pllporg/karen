import React from 'react';
import { render, screen } from '@testing-library/react';

import { AppShell } from '../components/app-shell';
import { useStrictAuthBootstrapMode } from './setup';

describe('AppShell', () => {
  beforeEach(() => {
    useStrictAuthBootstrapMode();
  });

  it('renders standardized sidebar navigation with active route semantics', async () => {
    render(
      <AppShell>
        <div>Body Content</div>
      </AppShell>,
    );

    expect(await screen.findByText('Practice Operations')).toBeInTheDocument();
    expect(await screen.findByText('LIC Legal Suite')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#lic-main-content');

    const activeLink = screen.getByRole('link', { name: /^Dashboard$/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    expect(screen.getByRole('link', { name: /Intake Queue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Analyst Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Auditor Queue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Matters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    const mainPanelContent = document.querySelector('.main-panel-content');
    expect(mainPanelContent).toBeInTheDocument();
    expect(mainPanelContent).toContainElement(screen.getByText('Body Content'));
  });
});

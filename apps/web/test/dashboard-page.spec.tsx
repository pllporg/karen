import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../app/dashboard/page';

describe('DashboardPage', () => {
  it('renders dashboard shell and falls back to zero counts on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Matter Operations Dashboard' })).toBeInTheDocument();
    expect(
      screen.getByText(/AI outputs are drafts only\. Attorney review and approval are required before use\./i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(5);
    });
  });
});

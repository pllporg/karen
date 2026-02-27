import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AnalystPage from '../app/analyst/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('AnalystPage', () => {
  it('renders analyst table, supports drilldown, and builds csv export link from filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        rows: [
          {
            id: 'm1',
            matterName: 'Ortega v. Kelvin',
            clientName: 'Ortega Holdings',
            stage: 'Discovery',
            owner: 'A. Vega',
            overdueTasks: 2,
            upcomingDeadlines: 1,
            arBucket: '31-60',
            arBalance: 12000,
            lastActivity: 'Deposition prep started',
          },
          {
            id: 'm2',
            matterName: 'Cline NDA Review',
            clientName: 'Cline Tech',
            stage: 'Intake',
            owner: 'M. Park',
            overdueTasks: 0,
            upcomingDeadlines: 3,
            arBucket: 'Current',
            arBalance: 3200,
            lastActivity: 'Conflict check complete',
          },
        ],
        detailsById: {
          m1: [
            {
              id: 'd1',
              date: '2026-01-03',
              type: 'Task',
              actor: 'A. Vega',
              summary: 'Drafted witness questions',
            },
          ],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<AnalystPage />);

    await screen.findByRole('table', { name: 'Analyst matter drilldown table' });

    expect(screen.getByText('Ortega v. Kelvin')).toBeInTheDocument();
    expect(screen.getByText('Cline NDA Review')).toBeInTheDocument();

    const drilldownTable = screen.getByRole('table', { name: 'Selected matter activity drilldown' });
    expect(within(drilldownTable).getByText('Drafted witness questions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show drilldown details for Cline NDA Review' }));
    expect(screen.getByText('No drilldown events were returned for this matter.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'Intake' } });
    fireEvent.change(screen.getByLabelText('AR bucket'), { target: { value: 'Current' } });
    fireEvent.change(screen.getByLabelText('Matter, client, owner, or recent activity'), { target: { value: 'cline' } });

    const exportLink = screen.getByRole('link', { name: 'Export CSV' });
    expect(exportLink).toHaveAttribute('href', 'http://localhost:4000/reporting/analyst/csv?stage=Intake&bucket=Current&q=cline');

    await waitFor(() => {
      expect(screen.queryByText('Ortega v. Kelvin')).not.toBeInTheDocument();
    });
  });

  it('renders empty state copy when filters exclude all rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          rows: [
            {
              id: 'm1',
              matterName: 'Ortega v. Kelvin',
              clientName: 'Ortega Holdings',
              stage: 'Discovery',
              owner: 'A. Vega',
              overdueTasks: 2,
              upcomingDeadlines: 1,
              arBucket: '31-60',
              arBalance: 12000,
              lastActivity: 'Deposition prep started',
            },
          ],
          detailsById: {},
        }),
      ),
    );

    render(<AnalystPage />);

    await screen.findByRole('table', { name: 'Analyst matter drilldown table' });
    fireEvent.change(screen.getByLabelText('Matter, client, owner, or recent activity'), { target: { value: 'no-match' } });

    expect(
      await screen.findByText('No analyst rows match the current filters. Clear one or more filters to continue the review workflow.'),
    ).toBeInTheDocument();
  });

  it('renders loading and error states when analyst endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<AnalystPage />);

    expect(screen.getByText('Loading analyst worklist…')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load analyst reporting data. Please retry in a few minutes.',
    );
  });
});

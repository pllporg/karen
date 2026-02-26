import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminPage from '../app/admin/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('AdminPage webhook delivery monitor', () => {
  it('filters and retries webhook deliveries', async () => {
    const endpoints = [
      {
        id: 'endpoint-1',
        url: 'https://hooks.example/receiver',
        isActive: true,
        events: ['record.updated'],
      },
    ];

    let failedDeliveries = [
      {
        id: 'delivery-1',
        eventType: 'record.updated',
        status: 'FAILED',
        attemptCount: 3,
        responseCode: 500,
        createdAt: '2026-02-17T20:00:00.000Z',
        lastAttemptAt: '2026-02-17T20:05:00.000Z',
        webhookEndpoint: {
          id: 'endpoint-1',
          url: 'https://hooks.example/receiver',
          isActive: true,
        },
      },
    ];

    const allDeliveries = [
      {
        id: 'delivery-2',
        eventType: 'record.created',
        status: 'DELIVERED',
        attemptCount: 1,
        responseCode: 200,
        createdAt: '2026-02-17T20:10:00.000Z',
        lastAttemptAt: '2026-02-17T20:10:02.000Z',
        webhookEndpoint: {
          id: 'endpoint-1',
          url: 'https://hooks.example/receiver',
          isActive: true,
        },
      },
    ];

    const providerStatus = {
      profile: 'staging',
      healthy: false,
      evaluatedAt: '2026-02-26T18:30:00.000Z',
      providers: [
        {
          key: 'stripe',
          mode: 'live',
          critical: true,
          healthy: true,
          detail: 'configured',
          missingEnv: [],
        },
        {
          key: 'email',
          mode: 'stub',
          critical: true,
          healthy: false,
          detail: 'stub provider',
          missingEnv: ['RESEND_API_KEY'],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.endsWith('/admin/organization')) return jsonResponse({ name: 'LIC Legal', slug: 'lic' });
      if (url.endsWith('/admin/users')) return jsonResponse([]);
      if (url.endsWith('/admin/roles')) return jsonResponse([]);
      if (url.endsWith('/admin/stages')) return jsonResponse([]);
      if (url.endsWith('/admin/participant-roles')) return jsonResponse([]);
      if (url.endsWith('/audit?limit=25')) return jsonResponse([]);
      if (url.endsWith('/config/custom-fields')) return jsonResponse([]);
      if (url.endsWith('/config/sections')) return jsonResponse([]);
      if (url.endsWith('/admin/conflict-rule-profiles')) return jsonResponse([]);
      if (url.endsWith('/admin/conflict-checks?limit=15')) return jsonResponse([]);
      if (url.endsWith('/ops/provider-status')) return jsonResponse(providerStatus);
      if (url.endsWith('/webhooks/endpoints')) return jsonResponse(endpoints);

      if (url.includes('/webhooks/deliveries?') && method === 'GET') {
        const query = url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        if (params.get('status') === 'FAILED' && params.get('limit') === '25') {
          return jsonResponse(failedDeliveries);
        }
        if (!params.has('status') && params.get('limit') === '25') {
          return jsonResponse(allDeliveries);
        }
      }
      if (url.endsWith('/webhooks/deliveries/delivery-1/retry') && method === 'POST') {
        failedDeliveries = [];
        return jsonResponse({ id: 'delivery-1', status: 'DELIVERED' });
      }

      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<AdminPage />);

    await screen.findByText('Webhook Delivery Monitor');
    await screen.findByText('https://hooks.example/receiver');
    expect(await screen.findByText('Provider Readiness')).toBeInTheDocument();
    expect(screen.getByText('Profile: STAGING')).toBeInTheDocument();
    expect(screen.getByText('RESEND_API_KEY')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/webhooks/deliveries/delivery-1/retry',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('No deliveries for current filter.')).toBeInTheDocument();
    });

    const filterSelect = screen
      .getAllByRole('combobox')
      .find(
        (node) =>
          node instanceof HTMLSelectElement &&
          Array.from(node.options).some((option) => option.value === 'FAILED') &&
          Array.from(node.options).some((option) => option.value === 'DELIVERED'),
      ) as HTMLSelectElement;

    fireEvent.change(filterSelect, { target: { value: 'ALL' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/webhooks/deliveries?limit=25',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(screen.getByText('record.created')).toBeInTheDocument();
      expect(screen.getAllByText('DELIVERED').length).toBeGreaterThan(0);
    });
  });
});

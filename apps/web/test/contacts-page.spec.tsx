import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactsPage from '../app/contacts/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

const contactsFixture = [
  { id: 'c1', kind: 'PERSON', displayName: 'Jane Doe', primaryEmail: 'jane@example.com', primaryPhone: '555-000-1111' },
  { id: 'c2', kind: 'PERSON', displayName: 'J. Doe', primaryEmail: 'jane.alt@example.com', primaryPhone: '555-000-1111' },
];

const dedupeOpenFixture = [
  {
    primaryId: 'c1',
    duplicateId: 'c2',
    pairKey: 'c1::c2',
    score: 0.9,
    confidence: 'HIGH',
    decision: 'OPEN',
    reasons: ['same phone', 'similar name'],
    primary: {
      id: 'c1',
      displayName: 'Jane Doe',
      kind: 'PERSON',
      primaryEmail: 'jane@example.com',
      primaryPhone: '555-000-1111',
      tags: [],
    },
    duplicate: {
      id: 'c2',
      displayName: 'J. Doe',
      kind: 'PERSON',
      primaryEmail: 'jane.alt@example.com',
      primaryPhone: '555-000-1111',
      tags: [],
    },
    fieldDiffs: [
      { field: 'displayName', primaryValue: 'Jane Doe', duplicateValue: 'J. Doe' },
      { field: 'primaryEmail', primaryValue: 'jane@example.com', duplicateValue: 'jane.alt@example.com' },
    ],
  },
];

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts dedupe decision actions and refreshes suggestion list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(contactsFixture))
      .mockResolvedValueOnce(jsonResponse(dedupeOpenFixture))
      .mockResolvedValueOnce(jsonResponse({ pairKey: 'c1::c2', decision: 'IGNORE' }))
      .mockResolvedValueOnce(jsonResponse(contactsFixture))
      .mockResolvedValueOnce(jsonResponse([{ ...dedupeOpenFixture[0], decision: 'IGNORE' }]));
    vi.stubGlobal('fetch', fetchMock);

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe ↔ J. Doe (90%)')).toBeInTheDocument();
      expect(screen.getByText('displayName')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ignore' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/contacts/dedupe/decisions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ primaryId: 'c1', duplicateId: 'c2', decision: 'IGNORE' }),
        }),
      );
    });
  });

  it('confirms and posts merge actions for dedupe suggestions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(contactsFixture))
      .mockResolvedValueOnce(jsonResponse(dedupeOpenFixture))
      .mockResolvedValueOnce(jsonResponse({ id: 'c1', displayName: 'Jane Doe' }))
      .mockResolvedValueOnce(jsonResponse([contactsFixture[0]]))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Merge' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Merge' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/contacts/dedupe/merge',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ primaryId: 'c1', duplicateId: 'c2' }),
        }),
      );
    });
  });
});

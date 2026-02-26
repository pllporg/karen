import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MattersPage from '../app/matters/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('MattersPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('session_token', 'test-session-token');
  });

  afterEach(() => {
    window.localStorage.removeItem('session_token');
  });

  it('creates a matter and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'created' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'matter-1',
            matterNumber: 'M-2026-001',
            name: 'Kitchen Remodel Defect - Ortega',
            practiceArea: 'Construction Litigation',
            status: 'OPEN',
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MattersPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/matters/intake-wizard/drafts',
      expect.objectContaining({ credentials: 'include' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"matterNumber":"M-2026-001"'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'M-2026-001' })).toBeInTheDocument();
    });
  });

  it('creates a matter via intake wizard with full domain sections', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'created-intake' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'matter-2',
            matterNumber: 'M-2026-001-INTAKE',
            name: 'Kitchen Remodel Defect - Ortega (Intake)',
            practiceArea: 'Construction Litigation',
            status: 'OPEN',
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MattersPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create via Intake Wizard' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/intake-wizard',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"damages":[{"category":"Repair Estimate","repairEstimate":28500}]'),
        }),
      );
    });

    const wizardCall = fetchMock.mock.calls.find((call) => call[0] === 'http://localhost:4000/matters/intake-wizard');
    expect(wizardCall).toBeDefined();
    const body = JSON.parse(String((wizardCall?.[1] as RequestInit).body));
    expect(body).toEqual(
      expect.objectContaining({
        matterNumber: 'M-2026-001-INTAKE',
        name: 'Kitchen Remodel Defect - Ortega (Intake)',
        practiceArea: 'Construction Litigation',
        property: expect.objectContaining({
          addressLine1: '1234 Orchard Lane',
          city: 'Pasadena',
          state: 'CA',
          parcelNumber: 'APN-1234-99',
        }),
        contract: expect.objectContaining({
          contractDate: '2025-10-01',
          contractPrice: 125000,
        }),
      }),
    );
    expect(body.defects[0]).toEqual(
      expect.objectContaining({
        category: 'Water Intrusion',
        severity: 'High',
      }),
    );
    expect(body.liens[0]).toEqual(
      expect.objectContaining({
        claimantName: 'Sunset Carpentry LLC',
        amount: 14250,
        status: 'RECORDED',
      }),
    );
    expect(body.insuranceClaims[0]).toEqual(
      expect.objectContaining({
        claimNumber: 'CLM-77821',
        policyNumber: 'HO-445-992',
        insurerName: 'Blue Harbor Insurance',
        adjusterName: 'Jordan Adjuster',
      }),
    );
    expect(body.expertEngagements[0]).toEqual(
      expect.objectContaining({
        expertName: 'Dr. Maya Expert',
      }),
    );
    expect(body.milestones[0]).toEqual(
      expect.objectContaining({
        name: 'Initial inspection complete',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'M-2026-001-INTAKE' })).toBeInTheDocument();
    });
  });

  it('saves and resumes intake drafts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'draft-1', savedAt: '2026-02-17T01:00:00.000Z' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'draft-1',
            label: 'M-2026-001-INTAKE - Kitchen Remodel Defect - Ortega (Intake)',
            savedAt: '2026-02-17T01:00:00.000Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'draft-1',
          savedAt: '2026-02-17T01:01:00.000Z',
          payload: {
            matterNumber: 'M-2026-009-INTAKE',
            name: 'Deck Collapse - Draft (Intake)',
            practiceArea: 'Construction Litigation',
            property: {
              addressLine1: '88 Cedar Avenue',
              city: 'Burbank',
              state: 'CA',
              parcelNumber: 'APN-22',
            },
            contract: { contractDate: '2025-05-01', contractPrice: 88000 },
            defects: [{ category: 'Structural', severity: 'Critical', description: 'Beam failure' }],
            damages: [{ category: 'Repair Estimate', repairEstimate: 99000 }],
            liens: [{ claimantName: 'Westline Framing', amount: 25000, status: 'RECORDED' }],
            insuranceClaims: [{ claimNumber: 'CLM-999', policyNumber: 'PL-1', insurerName: 'North Harbor', adjusterName: 'Alex Adjuster' }],
            expertEngagements: [{ expertName: 'Taylor Expert', scope: 'Structural engineering analysis' }],
          },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MattersPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/intake-wizard/drafts',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Intake Draft' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/intake-wizard/drafts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"payload"'),
        }),
      );
    });

    // Wait for the refreshed draft list before asserting selected value to avoid race conditions.
    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: 'M-2026-001-INTAKE - Kitchen Remodel Defect - Ortega (Intake)',
        }),
      ).toBeInTheDocument();
    });
    const draftSelector = screen.getByLabelText('Intake draft selector') as HTMLSelectElement;
    await waitFor(() => {
      expect(draftSelector.value).toBe('draft-1');
      expect(screen.getByRole('button', { name: 'Resume Draft' })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/intake-wizard/drafts/draft-1',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('88 Cedar Avenue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CLM-999')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Taylor Expert')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Structural engineering analysis')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Deck Collapse - Draft')).toBeInTheDocument();
    });
  });
});

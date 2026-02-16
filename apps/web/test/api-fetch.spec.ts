import { apiFetch, setSessionToken } from '../lib/api';

describe('apiFetch', () => {
  it('throws a detailed error for non-2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'invalid credentials',
      }),
    );

    await expect(apiFetch('/auth/login', { method: 'POST', body: '{}' })).rejects.toThrow(
      '401 Unauthorized: invalid credentials',
    );
  });

  it('adds session token and default headers on successful requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    setSessionToken('session-token-123');
    const result = await apiFetch<{ ok: boolean }>('/health');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/health',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-session-token': 'session-token-123',
        }),
      }),
    );
  });
});

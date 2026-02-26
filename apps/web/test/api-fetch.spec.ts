import { apiFetch, clearSessionToken, setSessionToken } from '../lib/api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearSessionToken();
  });

  it('throws a detailed error for non-2xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'invalid credentials',
    });
    vi.stubGlobal(
      'fetch',
      fetchMock,
    );

    await expect(apiFetch('/auth/login', { method: 'POST', body: '{}' })).rejects.toThrow(
      '401 Unauthorized: invalid credentials',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it('clears stale token, bootstraps session, and retries request once', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'stale session',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          user: { id: 'user-1' },
          token: 'session-token-recovered',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal('fetch', fetchMock);
    setSessionToken('stale-session-token');

    const result = await apiFetch<{ ok: boolean }>('/matters');

    expect(result.ok).toBe(true);
    expect(window.localStorage.getItem('session_token')).toBe('session-token-recovered');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:4000/matters',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-session-token': 'stale-session-token',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4000/auth/session',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.not.objectContaining({
          'x-session-token': expect.any(String),
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:4000/matters',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-session-token': 'session-token-recovered',
        }),
      }),
    );
  });

  it('clears stale token and fails deterministically when bootstrap cannot recover', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'expired session',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'invalid session',
      });
    vi.stubGlobal('fetch', fetchMock);
    setSessionToken('expired-session-token');

    await expect(apiFetch('/documents')).rejects.toThrow('401 Unauthorized: expired session');
    expect(window.localStorage.getItem('session_token')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4000/auth/session',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });
});

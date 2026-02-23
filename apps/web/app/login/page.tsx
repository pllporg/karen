'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setSessionToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@lic-demo.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [organizationName, setOrganizationName] = useState('Stonebridge Construction Law');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : { email, password, organizationName, fullName: 'Admin User' },
        ),
      });
      setSessionToken(result.token);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ width: 'min(520px, 100%)' }}>
        <p className="meta-note" style={{ marginBottom: 8 }}>
          LIC LEGAL SUITE
        </p>
        <h1 style={{ marginTop: 0 }}>{mode === 'login' ? 'Sign In' : 'Create Organization'}</h1>
        <p style={{ color: 'var(--lic-text-muted)' }}>Secure session auth with optional MFA (TOTP)</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {mode === 'register' ? (
            <input
              className="input"
              placeholder="Organization Name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          ) : null}
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div className="error">{error}</div> : null}
          <button className="button" onClick={submit} disabled={loading}>
            {loading ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create'}
          </button>
          <button
            className="button ghost"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch, setSessionToken } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { loginSchema, type LoginFormData } from '../../lib/schemas/auth';
import { requiredEmail, requiredString } from '../../lib/schemas/common';

const registerWithOrgSchema = z
  .object({
    organizationName: requiredString,
    email: requiredEmail,
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerWithOrgSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: 'admin@lic-demo.local',
      password: 'ChangeMe123!',
    },
  });
  const {
    register: registerRegistration,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerWithOrgSchema),
    mode: 'onBlur',
    defaultValues: {
      email: 'admin@lic-demo.local',
      password: 'ChangeMe123!',
      confirmPassword: 'ChangeMe123!',
      organizationName: 'Stonebridge Construction Law',
    },
  });

  async function completeAuth(modeValue: 'login' | 'register', payload: Record<string, string>) {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await apiFetch<{ token: string }>(`/auth/${modeValue}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSessionToken(result.token);
      const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const nextPath = query?.get('next') || '/dashboard';
      const safePath = nextPath.startsWith('/') ? nextPath : '/dashboard';
      router.push(safePath);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  const submitLogin = handleLoginSubmit(async (data) => {
    await completeAuth('login', {
      email: data.email,
      password: data.password,
    });
  });

  const submitRegister = handleRegisterSubmit(async (data) => {
    await completeAuth('register', {
      email: data.email,
      password: data.password,
      organizationName: data.organizationName,
      fullName: 'Admin User',
    });
  });

  return (
    <div className="auth-shell">
      <div className="card auth-card stack-4">
        <p className="meta-note mb-2">LIC LEGAL SUITE</p>
        <h1>{mode === 'login' ? 'Sign In' : 'Create Organization'}</h1>
        <p className="type-caption muted">Secure session auth with optional MFA (TOTP)</p>

        {mode === 'login' ? (
          <form className="stack-3" onSubmit={submitLogin}>
            <FormField label="Email" name="login-email" error={loginErrors.email?.message} required>
              <Input placeholder="Email" {...registerLogin('email')} invalid={!!loginErrors.email} />
            </FormField>
            <FormField label="Password" name="login-password" error={loginErrors.password?.message} required>
              <Input
                type="password"
                placeholder="Password"
                {...registerLogin('password')}
                invalid={!!loginErrors.password}
              />
            </FormField>
            {authError ? <div className="error">{authError}</div> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Working...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form className="stack-3" onSubmit={submitRegister}>
            <FormField
              label="Organization Name"
              name="register-organizationName"
              error={registerErrors.organizationName?.message}
              required
            >
              <Input
                placeholder="Organization Name"
                {...registerRegistration('organizationName')}
                invalid={!!registerErrors.organizationName}
              />
            </FormField>
            <FormField label="Email" name="register-email" error={registerErrors.email?.message} required>
              <Input placeholder="Email" {...registerRegistration('email')} invalid={!!registerErrors.email} />
            </FormField>
            <FormField label="Password" name="register-password" error={registerErrors.password?.message} required>
              <Input
                type="password"
                placeholder="Password"
                {...registerRegistration('password')}
                invalid={!!registerErrors.password}
              />
            </FormField>
            <FormField
              label="Confirm Password"
              name="register-confirmPassword"
              error={registerErrors.confirmPassword?.message}
              required
            >
              <Input
                type="password"
                placeholder="Confirm Password"
                {...registerRegistration('confirmPassword')}
                invalid={!!registerErrors.confirmPassword}
              />
            </FormField>
            {authError ? <div className="error">{authError}</div> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Working...' : 'Create'}
            </Button>
          </form>
        )}

        <Button
          tone="ghost"
          type="button"
          onClick={() => {
            setAuthError(null);
            setMode((prev) => (prev === 'login' ? 'register' : 'login'));
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
        </Button>
      </div>
    </div>
  );
}

import { assertProviderReadiness, isProductionLikeProfile } from '../src/ops/provider-readiness.util';

describe('provider readiness util', () => {
  it('treats production and staging as production-like profiles', () => {
    expect(isProductionLikeProfile('production')).toBe(true);
    expect(isProductionLikeProfile('staging')).toBe(true);
    expect(isProductionLikeProfile('development')).toBe(false);
  });

  it('throws for unhealthy critical providers in production-like profiles', () => {
    expect(() =>
      assertProviderReadiness('production', [
        {
          key: 'stripe',
          mode: 'stub',
          critical: true,
          healthy: false,
          issues: ['Critical provider cannot run in stub mode for production-like profiles'],
          detail: 'stub provider',
        },
      ]),
    ).toThrow('Provider readiness check failed');
  });

  it('includes missing credential hints in failure output', () => {
    expect(() =>
      assertProviderReadiness('staging', [
        {
          key: 'email',
          mode: 'resend',
          critical: true,
          healthy: false,
          issues: ['Missing required configuration: RESEND_API_KEY, RESEND_FROM_EMAIL'],
          detail: 'missing resend credentials',
          missingEnv: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
        },
      ]),
    ).toThrow('RESEND_API_KEY');
    expect(() =>
      assertProviderReadiness('staging', [
        {
          key: 'email',
          mode: 'resend',
          critical: true,
          healthy: false,
          issues: ['Missing required configuration: RESEND_API_KEY'],
          detail: 'missing resend credentials',
        },
      ]),
    ).toThrow('issues=Missing required configuration: RESEND_API_KEY');
  });

  it('allows unhealthy providers in non-production profiles', () => {
    expect(() =>
      assertProviderReadiness('development', [
        {
          key: 'stripe',
          mode: 'stub',
          critical: true,
          healthy: false,
          detail: 'stub provider',
        },
      ]),
    ).not.toThrow();
  });
});

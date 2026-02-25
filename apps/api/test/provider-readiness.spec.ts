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
          detail: 'missing resend credentials',
          missingEnv: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
        },
      ]),
    ).toThrow('RESEND_API_KEY');
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

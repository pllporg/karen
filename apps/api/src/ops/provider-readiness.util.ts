type ProviderStatusRow = {
  key: string;
  mode: string;
  provider?: string;
  critical: boolean;
  healthy: boolean;
  issues?: string[];
  checkedAt?: string;
  detail: string;
  missingEnv?: string[];
};

export function isProductionLikeProfile(profileRaw: string): boolean {
  const profile = String(profileRaw || '').trim().toLowerCase();
  return profile === 'production' || profile === 'staging';
}

export function assertProviderReadiness(profile: string, providers: ProviderStatusRow[]): void {
  if (!isProductionLikeProfile(profile)) {
    return;
  }
  const unhealthyCritical = providers.filter((provider) => provider.critical && !provider.healthy);
  if (unhealthyCritical.length === 0) {
    return;
  }

  const breakdown = unhealthyCritical
    .map((provider) => {
      const missing = provider.missingEnv && provider.missingEnv.length > 0 ? ` missing=${provider.missingEnv.join('|')}` : '';
      const issues = provider.issues && provider.issues.length > 0 ? ` issues=${provider.issues.join('|')}` : '';
      return `${provider.key} (mode=${provider.mode}${missing}${issues})`;
    })
    .join('; ');
  throw new Error(
    `Provider readiness check failed for profile "${profile}". Configure live providers and credentials for: ${breakdown}.`,
  );
}

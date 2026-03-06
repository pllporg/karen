import { TrustAccountOption } from './types';

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

export function isCounselRole(roleKey?: string, roleLabel?: string | null) {
  const fingerprint = `${roleKey || ''} ${roleLabel || ''}`.toLowerCase();
  return /(counsel|attorney|lawyer)/.test(fingerprint);
}

export function withTimestamp(message: string) {
  return `${message} ${new Date().toLocaleString()}`;
}

export function collectTrustAccountOptions(dashboard: any): TrustAccountOption[] {
  if (!dashboard) {
    return [];
  }
  const options: TrustAccountOption[] = [];
  const seen = new Set<string>();

  const push = (id?: string | null, name?: string | null) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId || seen.has(normalizedId)) {
      return;
    }
    seen.add(normalizedId);
    options.push({
      id: normalizedId,
      label: name && String(name).trim() ? String(name) : normalizedId,
    });
  };

  for (const row of dashboard.trustLedgers || []) {
    push(row.trustAccount?.id || row.trustAccountId, row.trustAccount?.name);
  }
  for (const row of dashboard.trustTransactions || []) {
    push(row.trustAccount?.id || row.trustAccountId, row.trustAccount?.name);
  }

  return options;
}

export type ConflictMatchResolution = '' | 'CLEAR' | 'POTENTIAL' | 'CONFIRMED';
export type ConflictMatchType = 'Contact' | 'Matter' | 'Organization';

export type ConflictMatch = {
  id: string;
  entity: string;
  type: ConflictMatchType;
  confidence: number;
  rationale: string;
  resolution: ConflictMatchResolution;
  resolutionNotes: string;
};

export type ConflictAuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  notes?: string | null;
};

export type ConflictCheckPayload = {
  matches: ConflictMatch[];
  auditTrail: ConflictAuditEntry[];
  lastRunAt: string;
};

const defaultConflictSeeds = ['Primary Client', 'Property Address', 'Builder Entity'];

function makeConflictId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function buildConflictRationale(index: number, token: string) {
  if (index === 0) return `Name and contact overlap detected for "${token}".`;
  if (index === 1) return `Property or matter context overlaps with "${token}".`;
  return `Entity reference or vendor overlap detected for "${token}".`;
}

export function buildConflictCheckPayload(queryText: string): ConflictCheckPayload {
  const lastRunAt = new Date().toISOString();
  const tokens = queryText
    .split(/[,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const seeds =
    tokens.length >= 3
      ? tokens.slice(0, 3)
      : [...tokens, ...defaultConflictSeeds.slice(tokens.length)].slice(0, 3);

  const matches: ConflictMatch[] = seeds.map((seed, index) => ({
    id: makeConflictId('match', index),
    entity: seed,
    type: index === 0 ? 'Contact' : index === 1 ? 'Matter' : 'Organization',
    confidence: index === 0 ? 92 : index === 1 ? 74 : 63,
    rationale: buildConflictRationale(index, seed),
    resolution: '',
    resolutionNotes: '',
  }));

  return {
    matches,
    auditTrail: [
      {
        id: 'audit-run',
        timestamp: lastRunAt,
        actor: 'INTAKE REVIEW',
        action: 'Conflict check run',
        detail: `${matches.length} candidate matches returned for review.`,
      },
    ],
    lastRunAt,
  };
}

export function requiresResolutionNotes(resolution: ConflictMatchResolution) {
  return resolution === 'POTENTIAL' || resolution === 'CONFIRMED';
}

export function canRecordConflictOutcome(matches: ConflictMatch[]) {
  return (
    matches.length > 0 &&
    matches.every(
      (match) =>
        Boolean(match.resolution) &&
        (!requiresResolutionNotes(match.resolution) || match.resolutionNotes.trim().length > 0),
    )
  );
}

export function canProceedFromConflict(matches: ConflictMatch[]) {
  return canRecordConflictOutcome(matches) && matches.every((match) => match.resolution !== 'CONFIRMED');
}

export function summarizeConflictResolution(matches: ConflictMatch[]) {
  return matches
    .map((match) => {
      const summary = `${match.entity}: ${match.resolution || 'UNRESOLVED'}`;
      return match.resolutionNotes.trim().length > 0 ? `${summary} (${match.resolutionNotes.trim()})` : summary;
    })
    .join(' | ');
}

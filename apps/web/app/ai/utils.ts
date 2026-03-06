import {
  AiArtifact,
  AiJob,
  DeadlineCandidate,
  DeadlineSelection,
  ReviewGateStep,
  StylePack,
  StylePackDraft,
} from './types';

const DATE_TOKEN_REGEX =
  /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4})\b/gi;

export function resolveReviewGateStep(artifact: AiArtifact): ReviewGateStep {
  if (artifact.reviewedStatus === 'REJECTED') return 'RETURNED';
  if (artifact.metadataJson?.executedAt) return 'EXECUTED';
  if (artifact.reviewedStatus === 'APPROVED') return 'APPROVED';
  return 'IN REVIEW';
}

export function reviewGateReached(current: ReviewGateStep, step: ReviewGateStep): boolean {
  if (current === 'RETURNED') {
    return step === 'PROPOSED' || step === 'IN REVIEW' || step === 'RETURNED';
  }
  const order: Record<Exclude<ReviewGateStep, 'RETURNED'>, number> = {
    PROPOSED: 0,
    'IN REVIEW': 1,
    APPROVED: 2,
    EXECUTED: 3,
  };
  if (step === 'RETURNED') return false;
  return order[step] <= order[current as Exclude<ReviewGateStep, 'RETURNED'>];
}

export function reviewGateTone(step: ReviewGateStep): 'proposed' | 'in-review' | 'approved' | 'executed' | 'returned' {
  if (step === 'IN REVIEW') return 'in-review';
  if (step === 'APPROVED') return 'approved';
  if (step === 'EXECUTED') return 'executed';
  if (step === 'RETURNED') return 'returned';
  return 'proposed';
}

export function formatUtcTimestamp(value: string | null | undefined): string {
  if (!value) return 'pending';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'invalid';
  return parsed.toISOString();
}

export function buildSelectionState(
  jobs: AiJob[],
  previous: Record<string, Record<string, DeadlineSelection>>,
): Record<string, Record<string, DeadlineSelection>> {
  const nextSelections: Record<string, Record<string, DeadlineSelection>> = {};

  for (const job of jobs) {
    for (const artifact of job.artifacts || []) {
      const candidates = getDeadlineCandidates(artifact);
      if (!candidates.length) continue;

      const existing = previous[artifact.id] || {};
      const artifactSelection: Record<string, DeadlineSelection> = {};
      for (const candidate of candidates) {
        artifactSelection[candidate.id] = existing[candidate.id] || {
          selected: false,
          createTask: true,
          createEvent: true,
        };
      }
      nextSelections[artifact.id] = artifactSelection;
    }
  }

  return nextSelections;
}

export function buildStylePackDrafts(
  stylePacks: StylePack[],
  previous: Record<string, StylePackDraft>,
): Record<string, StylePackDraft> {
  const nextDrafts: Record<string, StylePackDraft> = {};
  for (const stylePack of stylePacks) {
    const existing = previous[stylePack.id];
    nextDrafts[stylePack.id] = {
      name: existing?.name ?? stylePack.name,
      description: existing?.description ?? (stylePack.description || ''),
      documentVersionId: existing?.documentVersionId ?? '',
    };
  }
  return nextDrafts;
}

export function getDeadlineCandidates(artifact: AiArtifact): DeadlineCandidate[] {
  const metadata = artifact.metadataJson || {};
  const fromMetadata = Array.isArray(metadata.deadlineCandidates)
    ? metadata.deadlineCandidates
        .filter((candidate): candidate is DeadlineCandidate => Boolean(candidate?.id && candidate.date && candidate.description))
        .map((candidate) => ({
          ...candidate,
          date: normalizeDate(candidate.date) || candidate.date,
        }))
    : [];
  if (fromMetadata.length) return fromMetadata;

  const fallback: DeadlineCandidate[] = [];
  for (const excerpt of metadata.excerptEvidence || []) {
    const dates = excerpt.excerpt?.match(DATE_TOKEN_REGEX) || [];
    for (const rawDate of dates) {
      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) continue;
      fallback.push({
        id: `${excerpt.chunkId}-${normalizedDate}-${fallback.length + 1}`,
        date: normalizedDate,
        description: 'Review scheduling order deadline',
        chunkId: excerpt.chunkId,
        excerpt: excerpt.excerpt,
      });
    }
  }

  return dedupeFallback(fallback);
}

function dedupeFallback(candidates: DeadlineCandidate[]): DeadlineCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.date}|${candidate.description}|${candidate.chunkId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findExcerpt(
  excerpts: Array<{ chunkId: string; excerpt: string }> | undefined,
  chunkId: string | undefined,
): string {
  if (!chunkId || !Array.isArray(excerpts)) return '';
  return excerpts.find((item) => item.chunkId === chunkId)?.excerpt || '';
}

export function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

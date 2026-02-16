export type AiExcerptEvidence = {
  chunkId: string;
  excerpt: string;
};

export type DeadlineCandidate = {
  id: string;
  date: string;
  description: string;
  chunkId?: string;
  excerpt?: string;
};

const DATE_TOKEN_REGEX =
  /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4})\b/gi;

export function deriveDeadlineCandidates(input: {
  toolName: string;
  content: string;
  excerptEvidence: AiExcerptEvidence[];
}): DeadlineCandidate[] {
  if (input.toolName !== 'deadline_extraction') return [];

  const parsedRows = parseStructuredRows(input.content);
  const fallbackRows = parseFromExcerpts(input.excerptEvidence);
  const candidates = dedupeCandidates([...parsedRows, ...fallbackRows]).slice(0, 12);

  return candidates.map((candidate, index) => ({
    ...candidate,
    id: `deadline-${index + 1}`,
  }));
}

function parseStructuredRows(content: string): Array<Omit<DeadlineCandidate, 'id'>> {
  const candidates: Array<Omit<DeadlineCandidate, 'id'>> = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes('|')) continue;

    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (cells.length < 2) continue;

    const firstCell = cells[0].toLowerCase();
    if (firstCell.includes('date') || /^-+$/.test(firstCell)) continue;

    const normalizedDate = normalizeDate(cells[0]);
    if (!normalizedDate) continue;

    const chunkMatch = line.match(/\[chunk:([^\]]+)\]/i);
    const chunkId = chunkMatch?.[1] || extractChunkId(cells[3] ?? cells[2] ?? '');

    candidates.push({
      date: normalizedDate,
      description: cells[1] || 'Deadline obligation',
      excerpt: cells[2],
      chunkId,
    });
  }

  const bulletRegex =
    /(?:^|\n)\s*[-*]\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4})\s*[:\-]\s*([^\n]+)/gi;
  let match = bulletRegex.exec(content);
  while (match) {
    const normalizedDate = normalizeDate(match[1]);
    if (normalizedDate) {
      candidates.push({
        date: normalizedDate,
        description: match[2].trim(),
      });
    }
    match = bulletRegex.exec(content);
  }

  return candidates;
}

function parseFromExcerpts(excerpts: AiExcerptEvidence[]): Array<Omit<DeadlineCandidate, 'id'>> {
  const candidates: Array<Omit<DeadlineCandidate, 'id'>> = [];

  for (const item of excerpts) {
    const dates = item.excerpt.match(DATE_TOKEN_REGEX) ?? [];
    for (const rawDate of dates) {
      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) continue;

      candidates.push({
        date: normalizedDate,
        description: 'Review scheduling order deadline',
        chunkId: item.chunkId,
        excerpt: item.excerpt,
      });
    }
  }

  return candidates;
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractChunkId(value: string): string | undefined {
  const match = value.match(/chunk[:\s-]*([A-Za-z0-9-]+)/i);
  return match?.[1];
}

function dedupeCandidates(candidates: Array<Omit<DeadlineCandidate, 'id'>>): Array<Omit<DeadlineCandidate, 'id'>> {
  const result: Array<Omit<DeadlineCandidate, 'id'>> = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const key = [candidate.date, candidate.description.toLowerCase(), candidate.chunkId ?? ''].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }

  return result;
}

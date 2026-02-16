import { deriveDeadlineCandidates } from '../src/ai/deadline-candidates.util';

describe('deriveDeadlineCandidates', () => {
  it('extracts structured rows from deadline_extraction markdown output', () => {
    const candidates = deriveDeadlineCandidates({
      toolName: 'deadline_extraction',
      content: `
| Date | Obligation | Source Excerpt | Chunk |
| --- | --- | --- | --- |
| 2026-03-01 | Serve initial disclosures | Within 14 days after Rule 26(f) conference. | [chunk:abc123] |
| 03/15/2026 | File joint status report | Parties must file report by 03/15/2026. | chunk:def456 |
      `,
      excerptEvidence: [],
    });

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'deadline-1',
          date: '2026-03-01',
          description: 'Serve initial disclosures',
          chunkId: 'abc123',
        }),
        expect.objectContaining({
          date: '2026-03-15',
          description: 'File joint status report',
          chunkId: 'def456',
        }),
      ]),
    );
  });

  it('falls back to source excerpts when structured rows are missing', () => {
    const candidates = deriveDeadlineCandidates({
      toolName: 'deadline_extraction',
      content: 'No table generated.',
      excerptEvidence: [
        {
          chunkId: 'chunk-7',
          excerpt:
            'Scheduling order entered January 20, 2026. Discovery closes 4/10/2026 and dispositive motions due 05/01/2026.',
        },
      ],
    });

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-01-20',
          chunkId: 'chunk-7',
        }),
        expect.objectContaining({
          date: '2026-04-10',
          chunkId: 'chunk-7',
        }),
        expect.objectContaining({
          date: '2026-05-01',
          chunkId: 'chunk-7',
        }),
      ]),
    );
  });

  it('returns no candidates for non-deadline tools', () => {
    const candidates = deriveDeadlineCandidates({
      toolName: 'case_summary',
      content: '| 2026-02-02 | fake |',
      excerptEvidence: [{ chunkId: 'chunk-1', excerpt: 'Deadline 2026-03-01' }],
    });

    expect(candidates).toEqual([]);
  });
});

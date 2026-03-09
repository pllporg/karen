'use client';

import { Button } from '../ui/button';

export type DuplicateContactMatch = {
  id: string;
  label: string;
  rationale: string;
  confidence: number;
};

export function DuplicateAlert({
  matches,
  linkedContactId,
  onLinkExisting,
  onCreateNew,
}: {
  matches: DuplicateContactMatch[];
  linkedContactId?: string;
  onLinkExisting: (contactId: string) => void;
  onCreateNew: () => void;
}) {
  if (!matches.length) return null;

  return (
    <div className="intake-duplicate-alert" role="status" aria-live="polite">
      <div className="stack-2">
        <p className="intake-duplicate-title">Potential duplicate contacts detected.</p>
        {matches.map((match) => (
          <div key={match.id} className="intake-duplicate-row">
            <div className="stack-1">
              <p className="intake-duplicate-label">
                {match.label} <span className="mono-meta">({match.confidence}%)</span>
              </p>
              <p className="form-field-hint">{match.rationale}</p>
            </div>
            <div className="inline-stack">
              <Button
                type="button"
                tone={linkedContactId === match.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLinkExisting(match.id)}
              >
                {linkedContactId === match.id ? 'Linked' : 'Link to Existing'}
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button type="button" tone="secondary" size="sm" onClick={onCreateNew}>
            Create New Contact
          </Button>
        </div>
      </div>
    </div>
  );
}

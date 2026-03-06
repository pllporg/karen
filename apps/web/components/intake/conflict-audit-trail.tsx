'use client';

import type { ConflictAuditEntry } from '../../lib/intake/conflict-check';

export function ConflictAuditTrail({ entries }: { entries: ConflictAuditEntry[] }) {
  if (!entries.length) {
    return <p className="meta-note">No conflict review activity recorded in this session.</p>;
  }

  return (
    <div className="conflict-audit-trail" role="list" aria-label="Conflict audit trail">
      {entries.map((entry) => (
        <div key={entry.id} className="conflict-audit-entry" role="listitem">
          <p className="mono-meta">
            {new Date(entry.timestamp).toLocaleString()} · {entry.actor}
          </p>
          <p className="conflict-audit-action">{entry.action}</p>
          <p>{entry.detail}</p>
          {entry.notes ? <p className="meta-note">Notes: {entry.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}

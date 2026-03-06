'use client';

import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { Table, TableWrapper } from '../ui/table';
import { Textarea } from '../ui/textarea';
import type { ConflictMatch, ConflictMatchResolution } from '../../lib/intake/conflict-check';

const resolutionLabels: Record<Exclude<ConflictMatchResolution, ''>, string> = {
  CLEAR: 'Clear',
  POTENTIAL: 'Potential Conflict',
  CONFIRMED: 'Confirmed Conflict',
};

const resolutionBadgeTone: Record<Exclude<ConflictMatchResolution, ''>, 'approved' | 'in-review' | 'blocked'> = {
  CLEAR: 'approved',
  POTENTIAL: 'in-review',
  CONFIRMED: 'blocked',
};

export function ConflictResultsTable({
  matches,
  resolutionErrors,
  onResolutionChange,
  onNotesChange,
}: {
  matches: ConflictMatch[];
  resolutionErrors: Record<string, string>;
  onResolutionChange: (matchId: string, resolution: ConflictMatchResolution) => void;
  onNotesChange: (matchId: string, notes: string) => void;
}) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <th scope="col">Entity</th>
            <th scope="col">Type</th>
            <th scope="col">Match</th>
            <th scope="col">Rationale</th>
            <th scope="col">Resolve</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => (
            <tr key={match.id}>
              <td>
                <div className="stack-1">
                  <strong>{match.entity}</strong>
                  <span className="mono-meta">ROW {index + 1}</span>
                </div>
              </td>
              <td>
                <Badge>{match.type}</Badge>
              </td>
              <td>
                <span className="mono-meta">{match.confidence}%</span>
              </td>
              <td>{match.rationale}</td>
              <td>
                <div className="stack-2">
                  <Select
                    aria-label={`Resolution row ${index + 1}`}
                    value={match.resolution}
                    invalid={Boolean(resolutionErrors[match.id])}
                    onChange={(event) => onResolutionChange(match.id, event.target.value as ConflictMatchResolution)}
                  >
                    <option value="">Select resolution</option>
                    <option value="CLEAR">Clear</option>
                    <option value="POTENTIAL">Potential Conflict</option>
                    <option value="CONFIRMED">Confirmed Conflict</option>
                  </Select>
                  {match.resolution ? (
                    <Badge tone={resolutionBadgeTone[match.resolution]}>{resolutionLabels[match.resolution]}</Badge>
                  ) : null}
                  {resolutionErrors[match.id] ? <p className="form-field-error">{resolutionErrors[match.id]}</p> : null}
                </div>
              </td>
              <td>
                <Textarea
                  aria-label={`Notes row ${index + 1}`}
                  rows={2}
                  value={match.resolutionNotes}
                  onChange={(event) => onNotesChange(match.id, event.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}

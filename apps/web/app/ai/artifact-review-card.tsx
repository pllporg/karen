import { AiArtifact, DeadlineCandidate, DeadlineSelection, ReviewGateStep, REVIEW_GATE_SEQUENCE } from './types';
import { findExcerpt, formatUtcTimestamp, getDeadlineCandidates, resolveReviewGateStep, reviewGateReached, reviewGateTone } from './utils';

type ArtifactReviewCardProps = {
  artifact: AiArtifact;
  createdByUserId?: string | null;
  busyArtifactId: string | null;
  statusText?: string;
  deadlineSelectionByCandidate: Record<string, DeadlineSelection>;
  onReviewArtifact: (artifactId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onToggleCandidateSelection: (
    artifactId: string,
    candidateId: string,
    key: keyof DeadlineSelection,
    value: boolean,
  ) => void;
  onConfirmDeadlines: (artifact: AiArtifact, candidates: DeadlineCandidate[]) => Promise<void>;
};

export function ArtifactReviewCard({
  artifact,
  createdByUserId,
  busyArtifactId,
  statusText,
  deadlineSelectionByCandidate,
  onReviewArtifact,
  onToggleCandidateSelection,
  onConfirmDeadlines,
}: ArtifactReviewCardProps) {
  const metadata = artifact.metadataJson || {};
  const candidates = getDeadlineCandidates(artifact);
  const selectedCount = candidates.filter((candidate) => deadlineSelectionByCandidate[candidate.id]?.selected).length;
  const reviewStep = resolveReviewGateStep(artifact);

  return (
    <div className="card ai-artifact-card stack-2">
      <div className="ai-artifact-header">
        <div className="stack-1">
          <div className="row-2">
            <strong>{artifact.type}</strong>
            <span className="badge">{reviewStep}</span>
          </div>
        </div>
        <div className="row-2">
          <button
            className="button secondary"
            type="button"
            onClick={() => onReviewArtifact(artifact.id, 'APPROVED')}
            disabled={busyArtifactId === artifact.id}
          >
            {busyArtifactId === artifact.id ? 'Saving...' : 'Approve'}
          </button>
          <button
            className="button danger"
            type="button"
            onClick={() => onReviewArtifact(artifact.id, 'REJECTED')}
            disabled={busyArtifactId === artifact.id}
          >
            {busyArtifactId === artifact.id ? 'Saving...' : 'Return'}
          </button>
        </div>
      </div>

      <div className="ai-review-gate">
        {REVIEW_GATE_SEQUENCE.map((step) => (
          <span
            key={`${artifact.id}-${step}`}
            className={`badge ${reviewGateReached(reviewStep, step) ? `status-${reviewGateTone(step)}` : ''}`}
          >
            {step}
          </span>
        ))}
      </div>

      <p className="mono-meta">
        Submitted {formatUtcTimestamp(artifact.createdAt)} by {createdByUserId || 'system'} | Review: {artifact.reviewedByUserId || 'pending'} at{' '}
        {formatUtcTimestamp(artifact.reviewedAt)}
      </p>

      <div className="notice">External send/file actions remain blocked until review status is APPROVED.</div>

      {metadata.banner ? <div className="notice">{metadata.banner}</div> : null}
      {metadata.stylePack ? (
        <div>
          <span className="badge">
            Style Pack: {metadata.stylePack.name} ({metadata.stylePack.sourceDocCount || 0} source docs)
          </span>
        </div>
      ) : null}

      <pre className="ai-artifact-content">{artifact.content}</pre>

      {candidates.length > 0 ? (
        <div className="stack-2">
          <h4 className="ai-deadline-title">Confirm Extracted Deadlines (with source evidence)</h4>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Deadline Draft</th>
                <th scope="col">Source Excerpt</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const selection = deadlineSelectionByCandidate[candidate.id] || {
                  selected: false,
                  createTask: true,
                  createEvent: true,
                };
                return (
                  <tr key={candidate.id}>
                    <td>
                      <label className="ai-confirm-toggle">
                        <input
                          type="checkbox"
                          checked={selection.selected}
                          onChange={(event) =>
                            onToggleCandidateSelection(artifact.id, candidate.id, 'selected', event.target.checked)
                          }
                        />{' '}
                        Confirm
                      </label>
                      <div>
                        <strong>{candidate.date}</strong>
                      </div>
                      <div>{candidate.description}</div>
                      <div className="ai-candidate-options">
                        <label>
                          <input
                            type="checkbox"
                            checked={selection.createTask}
                            onChange={(event) =>
                              onToggleCandidateSelection(artifact.id, candidate.id, 'createTask', event.target.checked)
                            }
                          />{' '}
                          Create task
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={selection.createEvent}
                            onChange={(event) =>
                              onToggleCandidateSelection(artifact.id, candidate.id, 'createEvent', event.target.checked)
                            }
                          />{' '}
                          Create event
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="ai-excerpt">{candidate.excerpt || findExcerpt(metadata.excerptEvidence, candidate.chunkId)}</div>
                      {candidate.chunkId ? (
                        <div className="mt-2">
                          <span className="badge">chunk:{candidate.chunkId}</span>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ai-deadline-actions">
            <button
              className="button secondary"
              type="button"
              disabled={selectedCount === 0 || busyArtifactId === artifact.id}
              onClick={() => onConfirmDeadlines(artifact, candidates)}
            >
              {busyArtifactId === artifact.id ? 'Submitting...' : 'Confirm Selected Deadlines'}
            </button>
            <span className="badge">{selectedCount} selected</span>
          </div>
        </div>
      ) : null}

      {statusText ? (
        <div>
          <span className="badge">{statusText}</span>
        </div>
      ) : null}
    </div>
  );
}

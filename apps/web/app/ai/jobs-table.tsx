import { Fragment } from 'react';
import { AiArtifact, AiJob, DeadlineCandidate, DeadlineSelection } from './types';
import { ArtifactReviewCard } from './artifact-review-card';

type JobsTableProps = {
  jobs: AiJob[];
  deadlineSelections: Record<string, Record<string, DeadlineSelection>>;
  statusByArtifact: Record<string, string>;
  busyArtifactId: string | null;
  resolveMatterLabel: (matterId: string | null | undefined) => string;
  onReviewArtifact: (artifactId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onToggleCandidateSelection: (
    artifactId: string,
    candidateId: string,
    key: keyof DeadlineSelection,
    value: boolean,
  ) => void;
  onConfirmDeadlines: (artifact: AiArtifact, candidates: DeadlineCandidate[]) => Promise<void>;
};

export function JobsTable({
  jobs,
  deadlineSelections,
  statusByArtifact,
  busyArtifactId,
  resolveMatterLabel,
  onReviewArtifact,
  onToggleCandidateSelection,
  onConfirmDeadlines,
}: JobsTableProps) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Tool</th>
            <th scope="col">Matter</th>
            <th scope="col">Status</th>
            <th scope="col">Artifacts</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <Fragment key={job.id}>
              <tr>
                <td>{job.toolName}</td>
                <td>{resolveMatterLabel(job.matterId)}</td>
                <td>{job.status}</td>
                <td>{job.artifacts?.length || 0}</td>
              </tr>
              {job.artifacts?.map((artifact) => (
                <tr key={artifact.id}>
                  <td colSpan={4}>
                    <ArtifactReviewCard
                      artifact={artifact}
                      createdByUserId={job.createdByUserId}
                      busyArtifactId={busyArtifactId}
                      statusText={statusByArtifact[artifact.id]}
                      deadlineSelectionByCandidate={deadlineSelections[artifact.id] || {}}
                      onReviewArtifact={onReviewArtifact}
                      onToggleCandidateSelection={onToggleCandidateSelection}
                      onConfirmDeadlines={onConfirmDeadlines}
                    />
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

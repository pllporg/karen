type AiWorkspacePanelProps = {
  dashboard: any;
};

export function AiWorkspacePanel({ dashboard }: AiWorkspacePanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>AI Workspace</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {dashboard.aiJobs?.map((job: any) => (
          <li key={job.id}>{job.toolName} - {job.status}</li>
        ))}
      </ul>
    </div>
  );
}

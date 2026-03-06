type TimelineDocketPanelProps = {
  dashboard: any;
};

export function TimelineDocketPanel({ dashboard }: TimelineDocketPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Timeline & Docket</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {dashboard.docketEntries?.map((entry: any) => (
          <li key={entry.id}>{new Date(entry.filedAt).toLocaleDateString()} - {entry.description}</li>
        ))}
      </ul>
    </div>
  );
}

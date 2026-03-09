import Link from 'next/link';

const stages = [
  { key: 'intake', label: 'Intake Draft' },
  { key: 'conflict', label: 'Conflict Check' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'convert', label: 'Convert' },
] as const;

export function StageNav({ leadId, active }: { leadId: string; active: (typeof stages)[number]['key'] }) {
  return (
    <table aria-label="Data table" className="table" style={{ marginBottom: 16 }}>
      <thead>
        <tr>
          <th scope="col">Stage</th>
          <th scope="col">Route</th>
        </tr>
      </thead>
      <tbody>
        {stages.map((stage) => (
          <tr key={stage.key}>
            <td>
              <span className={`badge ${stage.key === active ? 'status-in-review' : 'status-proposed'}`}>{stage.label}</span>
            </td>
            <td>
              <Link href={`/intake/${leadId}/${stage.key}`} prefetch={false} className="button ghost" style={{ minHeight: 28 }}>
                Open {stage.label}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

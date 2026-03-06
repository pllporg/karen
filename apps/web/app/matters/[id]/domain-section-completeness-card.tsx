type DomainSectionCompletenessCardProps = {
  dashboard: any;
};

export function DomainSectionCompletenessCard({ dashboard }: DomainSectionCompletenessCardProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Domain Section Completeness</h3>
      <p>
        {dashboard.domainSectionCompleteness?.completedCount || 0}/
        {dashboard.domainSectionCompleteness?.totalCount || 0} sections complete
        {' '}({dashboard.domainSectionCompleteness?.completionPercent || 0}%)
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {Object.entries(dashboard.domainSectionCompleteness?.sections || {}).map(([section, done]) => (
          <li key={section}>
            {section}: {done ? 'Complete' : 'Missing'}
          </li>
        ))}
      </ul>
    </div>
  );
}

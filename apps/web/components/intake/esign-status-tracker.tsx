'use client';

const lifecycle: Array<{ key: string; label: string }> = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'SENT', label: 'Sent' },
  { key: 'VIEWED', label: 'Viewed' },
  { key: 'SIGNED', label: 'Signed' },
];

const stageOrder: Record<string, number> = {
  DRAFT: 0,
  IN_REVIEW: 1,
  PENDING_SIGNATURE: 2,
  SENT: 2,
  VIEWED: 3,
  SIGNED: 4,
};

export function EsignStatusTracker({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const failed = normalized === 'DECLINED' || normalized === 'EXPIRED' || normalized === 'VOIDED' || normalized === 'ERROR';
  const currentOrder = stageOrder[normalized] ?? 0;

  return (
    <div className="stack-3">
      <div className="engagement-status-track" aria-label="Envelope status lifecycle">
        {lifecycle.map((stage, index) => {
          const complete = currentOrder > index;
          const active = currentOrder === index;
          return (
            <div
              key={stage.key}
              className="engagement-status-step"
              data-complete={complete ? 'true' : undefined}
              data-active={active ? 'true' : undefined}
            >
              <span className="engagement-status-circle" aria-hidden="true" />
              <span className="engagement-status-label">{stage.label}</span>
            </div>
          );
        })}
      </div>
      {failed ? (
        <p className="error" role="alert">
          Envelope status is {normalized}. Review provider activity before proceeding.
        </p>
      ) : null}
    </div>
  );
}

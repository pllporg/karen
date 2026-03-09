import { Badge } from '../../../../components/ui/badge';
import { type LeadConvertPageState, statusTone } from './use-lead-convert-page';

type ConvertGateSectionProps = {
  page: LeadConvertPageState;
};

export function ConvertGateSection({ page }: ConvertGateSectionProps) {
  const { checklist } = page;

  return (
    <section className="card stack-4">
      <div className="card-header">
        <div>
          <p className="card-module">GP-01-F</p>
          <h2 className="type-section-title">Conversion Gate</h2>
        </div>
        <Badge tone={checklist?.readyToConvert ? 'approved' : 'returned'}>
          {checklist?.readyToConvert ? 'READY TO CONVERT' : 'GATE BLOCKED'}
        </Badge>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Checkpoint</th>
            <th>Status</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Intake Draft</td>
            <td>
              <Badge tone={statusTone(Boolean(checklist?.intakeDraftCreated))}>
                {checklist?.intakeDraftCreated ? 'COMPLETE' : 'PENDING'}
              </Badge>
            </td>
            <td>{checklist?.conversionPreview?.clientName ?? 'No draft summary available.'}</td>
          </tr>
          <tr>
            <td>Conflict Resolution</td>
            <td>
              <Badge tone={statusTone(Boolean(checklist?.conflictResolved))}>
                {checklist?.conflictResolved ? 'CLEARED' : 'OPEN'}
              </Badge>
            </td>
            <td>{checklist?.conflictChecked ? 'Conflict check recorded.' : 'Conflict check not run.'}</td>
          </tr>
          <tr>
            <td>Engagement</td>
            <td>
              <Badge tone={statusTone(Boolean(checklist?.engagementSigned))}>
                {checklist?.engagementSigned ? 'SIGNED' : 'UNSIGNED'}
              </Badge>
            </td>
            <td>{checklist?.engagementSent ? 'Envelope sent to recipient.' : 'Envelope still in review.'}</td>
          </tr>
        </tbody>
      </table>

      {checklist?.conversionPreview ? (
        <div className="convert-preview-grid">
          <div className="stack-2">
            <p className="type-label">Client Record</p>
            <p className="type-caption">{checklist.conversionPreview.clientName || 'Unnamed client'}</p>
            {checklist.conversionPreview.clientEmail ? (
              <p className="type-caption muted">{checklist.conversionPreview.clientEmail}</p>
            ) : null}
            {checklist.conversionPreview.clientPhone ? (
              <p className="type-caption muted">{checklist.conversionPreview.clientPhone}</p>
            ) : null}
          </div>
          <div className="stack-2">
            <p className="type-label">Property Record</p>
            <p className="type-caption">
              {checklist.conversionPreview.propertyAddress || 'No property address recorded in intake draft.'}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

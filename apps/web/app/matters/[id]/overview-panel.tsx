import { Dispatch, SetStateAction } from 'react';
import { MATTER_STATUS_OPTIONS } from './types';

type OverviewPanelProps = {
  dashboard: any;
  editingOverview: boolean;
  setEditingOverview: Dispatch<SetStateAction<boolean>>;
  overviewName: string;
  setOverviewName: Dispatch<SetStateAction<string>>;
  overviewMatterNumber: string;
  setOverviewMatterNumber: Dispatch<SetStateAction<string>>;
  overviewPracticeArea: string;
  setOverviewPracticeArea: Dispatch<SetStateAction<string>>;
  overviewStatus: (typeof MATTER_STATUS_OPTIONS)[number];
  setOverviewStatus: Dispatch<SetStateAction<(typeof MATTER_STATUS_OPTIONS)[number]>>;
  overviewVenue: string;
  setOverviewVenue: Dispatch<SetStateAction<string>>;
  overviewJurisdiction: string;
  setOverviewJurisdiction: Dispatch<SetStateAction<string>>;
  overviewOpenedAt: string;
  setOverviewOpenedAt: Dispatch<SetStateAction<string>>;
  overviewClosedAt: string;
  setOverviewClosedAt: Dispatch<SetStateAction<string>>;
  overviewStatusMessage: string | null;
  updateMatterOverview: () => Promise<void>;
  cancelOverviewEdit: () => void;
};

export function OverviewPanel({
  dashboard,
  editingOverview,
  setEditingOverview,
  overviewName,
  setOverviewName,
  overviewMatterNumber,
  setOverviewMatterNumber,
  overviewPracticeArea,
  setOverviewPracticeArea,
  overviewStatus,
  setOverviewStatus,
  overviewVenue,
  setOverviewVenue,
  overviewJurisdiction,
  setOverviewJurisdiction,
  overviewOpenedAt,
  setOverviewOpenedAt,
  overviewClosedAt,
  setOverviewClosedAt,
  overviewStatusMessage,
  updateMatterOverview,
  cancelOverviewEdit,
}: OverviewPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Overview</h3>
      {editingOverview ? (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <input
            className="input"
            aria-label="Matter Name"
            value={overviewName}
            onChange={(event) => setOverviewName(event.target.value)}
            placeholder="Matter name"
          />
          <input
            className="input"
            aria-label="Matter Number"
            value={overviewMatterNumber}
            onChange={(event) => setOverviewMatterNumber(event.target.value)}
            placeholder="Matter number"
          />
          <input
            className="input"
            aria-label="Practice Area"
            value={overviewPracticeArea}
            onChange={(event) => setOverviewPracticeArea(event.target.value)}
            placeholder="Practice area"
          />
          <select
            className="select"
            aria-label="Matter Status"
            value={overviewStatus}
            onChange={(event) => setOverviewStatus(event.target.value as (typeof MATTER_STATUS_OPTIONS)[number])}
          >
            {MATTER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            className="input"
            aria-label="Matter Venue"
            value={overviewVenue}
            onChange={(event) => setOverviewVenue(event.target.value)}
            placeholder="Venue"
          />
          <input
            className="input"
            aria-label="Matter Jurisdiction"
            value={overviewJurisdiction}
            onChange={(event) => setOverviewJurisdiction(event.target.value)}
            placeholder="Jurisdiction"
          />
          <input
            className="input"
            aria-label="Matter Opened At"
            type="datetime-local"
            value={overviewOpenedAt}
            onChange={(event) => setOverviewOpenedAt(event.target.value)}
          />
          <input
            className="input"
            aria-label="Matter Closed At"
            type="datetime-local"
            value={overviewClosedAt}
            onChange={(event) => setOverviewClosedAt(event.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button" type="button" onClick={updateMatterOverview}>
              Save Overview
            </button>
            <button className="button secondary" type="button" onClick={cancelOverviewEdit}>
              Cancel Overview Edit
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Name: {dashboard.name}</p>
          <p>Matter Number: {dashboard.matterNumber}</p>
          <p>Practice Area: {dashboard.practiceArea}</p>
          <p>Status: {dashboard.status}</p>
          <p>Venue: {dashboard.venue || '-'}</p>
          <p>Jurisdiction: {dashboard.jurisdiction || '-'}</p>
          <p>Opened: {dashboard.openedAt ? new Date(dashboard.openedAt).toLocaleString() : '-'}</p>
          <p>Closed: {dashboard.closedAt ? new Date(dashboard.closedAt).toLocaleString() : '-'}</p>
          <button className="button secondary" type="button" onClick={() => setEditingOverview(true)}>
            Edit Overview
          </button>
        </div>
      )}
      {overviewStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{overviewStatusMessage}</p> : null}
    </div>
  );
}

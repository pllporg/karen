import { useCallback, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import { MATTER_STATUS_OPTIONS } from './types';
import { toDateTimeLocalValue } from './utils';

export function useMatterOverview(matterId: string, refreshDashboard: () => Promise<void>) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewName, setOverviewName] = useState('');
  const [overviewMatterNumber, setOverviewMatterNumber] = useState('');
  const [overviewPracticeArea, setOverviewPracticeArea] = useState('');
  const [overviewStatus, setOverviewStatus] = useState<(typeof MATTER_STATUS_OPTIONS)[number]>('OPEN');
  const [overviewVenue, setOverviewVenue] = useState('');
  const [overviewJurisdiction, setOverviewJurisdiction] = useState('');
  const [overviewOpenedAt, setOverviewOpenedAt] = useState('');
  const [overviewClosedAt, setOverviewClosedAt] = useState('');
  const [overviewStatusMessage, setOverviewStatusMessage] = useState<string | null>(null);

  const syncOverviewFromDashboard = useCallback((nextDashboard: any) => {
    setOverviewName(nextDashboard.name || '');
    setOverviewMatterNumber(nextDashboard.matterNumber || '');
    setOverviewPracticeArea(nextDashboard.practiceArea || '');
    setOverviewStatus(
      MATTER_STATUS_OPTIONS.includes(nextDashboard.status as (typeof MATTER_STATUS_OPTIONS)[number])
        ? nextDashboard.status
        : 'OPEN',
    );
    setOverviewVenue(nextDashboard.venue || '');
    setOverviewJurisdiction(nextDashboard.jurisdiction || '');
    setOverviewOpenedAt(toDateTimeLocalValue(nextDashboard.openedAt));
    setOverviewClosedAt(toDateTimeLocalValue(nextDashboard.closedAt));
  }, []);

  function cancelOverviewEdit(currentDashboard: any | null) {
    if (!currentDashboard) {
      setEditingOverview(false);
      return;
    }

    syncOverviewFromDashboard(currentDashboard);
    setEditingOverview(false);
    setOverviewStatusMessage('Matter overview edit cancelled.');
  }

  async function updateMatterOverview() {
    if (!matterId) {
      return;
    }
    if (!overviewName.trim() || !overviewMatterNumber.trim() || !overviewPracticeArea.trim()) {
      setOverviewStatusMessage('Matter name, number, and practice area are required.');
      return;
    }
    if (!MATTER_STATUS_OPTIONS.includes(overviewStatus)) {
      setOverviewStatusMessage('Matter status is invalid.');
      return;
    }

    await apiFetch(`/matters/${matterId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: overviewName.trim(),
        matterNumber: overviewMatterNumber.trim(),
        practiceArea: overviewPracticeArea.trim(),
        status: overviewStatus,
        venue: overviewVenue.trim() ? overviewVenue.trim() : null,
        jurisdiction: overviewJurisdiction.trim() ? overviewJurisdiction.trim() : null,
        ...(overviewOpenedAt ? { openedAt: new Date(overviewOpenedAt).toISOString() } : {}),
        closedAt: overviewClosedAt ? new Date(overviewClosedAt).toISOString() : null,
      }),
    });

    setEditingOverview(false);
    setOverviewStatusMessage('Matter overview updated.');
    await refreshDashboard();
  }

  return {
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
    syncOverviewFromDashboard,
    cancelOverviewEdit,
    updateMatterOverview,
  };
}

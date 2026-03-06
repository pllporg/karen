import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '../../../lib/api';
import { matterOverviewSchema, type MatterOverviewFormData } from '../../../lib/schemas/matter-overview';
import { toDateTimeLocalValue } from './utils';

export function useMatterOverview(matterId: string, refreshDashboard: () => Promise<void>) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewStatusMessage, setOverviewStatusMessage] = useState<string | null>(null);
  const overviewForm = useForm<MatterOverviewFormData>({
    resolver: zodResolver(matterOverviewSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      matterNumber: '',
      practiceArea: '',
      status: 'OPEN',
      venue: '',
      jurisdiction: '',
      openedAt: '',
      closedAt: '',
    },
  });

  const syncOverviewFromDashboard = useCallback((nextDashboard: any) => {
    overviewForm.reset({
      name: nextDashboard.name || '',
      matterNumber: nextDashboard.matterNumber || '',
      practiceArea: nextDashboard.practiceArea || '',
      status:
        nextDashboard.status === 'OPEN' ||
        nextDashboard.status === 'PENDING' ||
        nextDashboard.status === 'CLOSED' ||
        nextDashboard.status === 'ARCHIVED'
          ? nextDashboard.status
          : 'OPEN',
      venue: nextDashboard.venue || '',
      jurisdiction: nextDashboard.jurisdiction || '',
      openedAt: toDateTimeLocalValue(nextDashboard.openedAt),
      closedAt: toDateTimeLocalValue(nextDashboard.closedAt),
    });
  }, [overviewForm]);

  function startOverviewEdit(currentDashboard: any | null) {
    if (currentDashboard) {
      syncOverviewFromDashboard(currentDashboard);
    }
    setOverviewStatusMessage(null);
    setEditingOverview(true);
  }

  function cancelOverviewEdit(currentDashboard: any | null) {
    if (!currentDashboard) {
      setEditingOverview(false);
      return;
    }

    syncOverviewFromDashboard(currentDashboard);
    setEditingOverview(false);
    setOverviewStatusMessage('Matter overview edit cancelled.');
  }

  const updateMatterOverview = overviewForm.handleSubmit(async (values) => {
    if (!matterId) {
      return;
    }

    await apiFetch(`/matters/${matterId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: values.name.trim(),
        matterNumber: values.matterNumber.trim(),
        practiceArea: values.practiceArea.trim(),
        status: values.status,
        venue: values.venue?.trim() ? values.venue.trim() : null,
        jurisdiction: values.jurisdiction?.trim() ? values.jurisdiction.trim() : null,
        ...(values.openedAt ? { openedAt: new Date(values.openedAt).toISOString() } : {}),
        closedAt: values.closedAt ? new Date(values.closedAt).toISOString() : null,
      }),
    });

    setEditingOverview(false);
    setOverviewStatusMessage('Matter overview updated.');
    await refreshDashboard();
  });

  return {
    editingOverview,
    overviewForm,
    overviewStatusMessage,
    syncOverviewFromDashboard,
    startOverviewEdit,
    cancelOverviewEdit,
    updateMatterOverview,
  };
}

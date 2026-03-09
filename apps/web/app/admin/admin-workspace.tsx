'use client';

import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { AdminConflictPanels } from './admin-conflict-panels';
import { AdminOperationsPanels } from './admin-operations-panels';
import { AdminReferencePanels } from './admin-reference-panels';
import { useAdminConfigurationForms } from './use-admin-configuration-forms';
import { useAdminPage } from './use-admin-page';

export function AdminWorkspace() {
  const admin = useAdminPage();
  const forms = useAdminConfigurationForms(admin);

  return (
    <AppShell>
      <PageHeader title="Admin & Configuration" subtitle="Firm settings, roles, permissions, and matter pipeline controls." />
      <div className="card-grid">
        <AdminReferencePanels admin={admin} forms={forms} />
        <AdminConflictPanels admin={admin} forms={forms} />
        <AdminOperationsPanels
          providerStatus={admin.providerStatus}
          providerStatusError={admin.providerStatusError}
          launchBlockers={admin.launchBlockers}
          launchBlockersError={admin.launchBlockersError}
          webhookStatusFilter={admin.webhookStatusFilter}
          updateWebhookFilter={admin.updateWebhookFilter}
          webhookEndpoints={admin.webhookEndpoints}
          webhookError={admin.webhookError}
          webhookDeliveries={admin.webhookDeliveries}
          retryingDeliveryId={admin.retryingDeliveryId}
          retryWebhookDelivery={admin.retryWebhookDelivery}
        />
      </div>
    </AppShell>
  );
}

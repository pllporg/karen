'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { AiWorkspacePanel } from './ai-workspace-panel';
import { BillingPanel } from './billing-panel';
import { CalendarPanel } from './calendar-panel';
import { CommunicationsPanel } from './communications-panel';
import { DeadlineRulesPanel } from './deadline-rules-panel';
import { DomainSectionCompletenessCard } from './domain-section-completeness-card';
import { DocumentsPanel } from './documents-panel';
import { OverviewPanel } from './overview-panel';
import { ParticipantsPanel } from './participants-panel';
import { TasksPanel } from './tasks-panel';
import { TimelineDocketPanel } from './timeline-docket-panel';
import { useMatterDashboard } from './use-matter-dashboard';

export default function MatterDashboardPage() {
  const params = useParams() as { id: string };
  const matterId = params.id;
  const vm = useMatterDashboard(matterId);

  return (
    <AppShell>
      <PageHeader
        title={vm.dashboard ? `${vm.dashboard.matterNumber} - ${vm.dashboard.name}` : 'Matter Dashboard'}
        subtitle="Overview, participants, timeline, tasks, calendar, communications, documents, billing, and AI workspace"
      />

      {!vm.dashboard ? <div className="card">Loading...</div> : null}

      {vm.dashboard ? (
        <div className="card-grid">
          <OverviewPanel
            dashboard={vm.dashboard}
            editingOverview={vm.editingOverview}
            register={vm.overviewForm.register}
            errors={vm.overviewForm.formState.errors}
            isSubmitting={vm.overviewForm.formState.isSubmitting}
            overviewStatusMessage={vm.overviewStatusMessage}
            startOverviewEdit={vm.startOverviewEdit}
            updateMatterOverview={vm.updateMatterOverview}
            cancelOverviewEdit={vm.cancelOverviewEdit}
          />

          <DomainSectionCompletenessCard dashboard={vm.dashboard} />

          <ParticipantsPanel
            dashboard={vm.dashboard}
            participantContacts={vm.participantContacts}
            participantRoleOptions={vm.participantRoleOptions}
            register={vm.participantForm.register}
            errors={vm.participantForm.formState.errors}
            isSubmitting={vm.participantForm.formState.isSubmitting}
            selectedParticipantContactId={vm.selectedParticipantContactId}
            selectedParticipantRoleKey={vm.selectedParticipantRoleKey}
            participantSide={vm.participantSide}
            participantIsPrimary={vm.participantIsPrimary}
            participantRepresentedByContactId={vm.participantRepresentedByContactId}
            participantLawFirmContactId={vm.participantLawFirmContactId}
            participantNotes={vm.participantNotes}
            participantRoleIsCounsel={vm.participantRoleIsCounsel}
            participantStatusMessage={vm.participantStatusMessage}
            editingParticipantId={vm.editingParticipantId}
            createOrUpdateParticipant={vm.createOrUpdateParticipant}
            cancelEditingParticipant={vm.cancelEditingParticipant}
            onParticipantRoleChange={vm.onParticipantRoleChange}
            onParticipantSideChange={vm.onParticipantSideChange}
            startEditingParticipant={vm.startEditingParticipant}
            removeParticipant={vm.removeParticipant}
          />

          <TimelineDocketPanel dashboard={vm.dashboard} />

          <TasksPanel
            dashboard={vm.dashboard}
            register={vm.taskForm.register}
            errors={vm.taskForm.formState.errors}
            isSubmitting={vm.taskForm.formState.isSubmitting}
            taskStatusMessage={vm.taskStatusMessage}
            editingTaskId={vm.editingTaskId}
            createOrUpdateTask={vm.createOrUpdateTask}
            cancelEditingTask={vm.cancelEditingTask}
            updateTaskStatus={vm.updateTaskStatus}
            startEditingTask={vm.startEditingTask}
            deleteTask={vm.deleteTask}
          />

          <CalendarPanel
            dashboard={vm.dashboard}
            register={vm.calendarEventForm.register}
            errors={vm.calendarEventForm.formState.errors}
            isSubmitting={vm.calendarEventForm.formState.isSubmitting}
            calendarStatusMessage={vm.calendarStatusMessage}
            editingCalendarEventId={vm.editingCalendarEventId}
            createOrUpdateCalendarEvent={vm.createOrUpdateCalendarEvent}
            cancelEditingCalendarEvent={vm.cancelEditingCalendarEvent}
            deleteCalendarEvent={vm.deleteCalendarEvent}
            startEditingCalendarEvent={vm.startEditingCalendarEvent}
            exportCalendarIcs={vm.exportCalendarIcs}
          />

          <DeadlineRulesPanel
            rulesPacks={vm.rulesPacks}
            selectedRulesPackId={vm.selectedRulesPackId}
            setSelectedRulesPackId={vm.setSelectedRulesPackId}
            triggerDate={vm.triggerDate}
            setTriggerDate={vm.setTriggerDate}
            previewRows={vm.previewRows}
            overrideDates={vm.overrideDates}
            setOverrideDates={vm.setOverrideDates}
            overrideReasons={vm.overrideReasons}
            setOverrideReasons={vm.setOverrideReasons}
            deadlineStatus={vm.deadlineStatus}
            previewDeadlines={vm.previewDeadlines}
            applyDeadlines={vm.applyDeadlines}
          />

          <CommunicationsPanel
            dashboard={vm.dashboard}
            participantContacts={vm.participantContacts}
            register={vm.communicationForm.register}
            errors={vm.communicationForm.formState.errors}
            isSubmitting={vm.communicationForm.formState.isSubmitting}
            selectedCommunicationThreadId={vm.selectedCommunicationThreadId}
            communicationStatusMessage={vm.communicationStatusMessage}
            editingCommunicationId={vm.editingCommunicationId}
            communicationRows={vm.communicationRows}
            logCommunicationEntry={vm.logCommunicationEntry}
            cancelEditingCommunication={vm.cancelEditingCommunication}
            deleteCommunicationEntry={vm.deleteCommunicationEntry}
            startEditingCommunication={vm.startEditingCommunication}
          />

          <DocumentsPanel
            dashboard={vm.dashboard}
            documentTitle={vm.documentTitle}
            setDocumentTitle={vm.setDocumentTitle}
            setDocumentFile={vm.setDocumentFile}
            setDocumentVersionFiles={vm.setDocumentVersionFiles}
            documentStatusMessage={vm.documentStatusMessage}
            uploadMatterDocument={vm.uploadMatterDocument}
            uploadMatterDocumentVersion={vm.uploadMatterDocumentVersion}
            toggleMatterDocumentSharing={vm.toggleMatterDocumentSharing}
            createMatterDocumentShareLink={vm.createMatterDocumentShareLink}
            issueLatestDocumentDownload={vm.issueLatestDocumentDownload}
          />

          <BillingPanel
            dashboard={vm.dashboard}
            billingStatusMessage={vm.billingStatusMessage}
            timeEntryDescription={vm.timeEntryDescription}
            setTimeEntryDescription={vm.setTimeEntryDescription}
            timeEntryStartAt={vm.timeEntryStartAt}
            setTimeEntryStartAt={vm.setTimeEntryStartAt}
            timeEntryEndAt={vm.timeEntryEndAt}
            setTimeEntryEndAt={vm.setTimeEntryEndAt}
            timeEntryRate={vm.timeEntryRate}
            setTimeEntryRate={vm.setTimeEntryRate}
            expenseDescription={vm.expenseDescription}
            setExpenseDescription={vm.setExpenseDescription}
            expenseAmount={vm.expenseAmount}
            setExpenseAmount={vm.setExpenseAmount}
            expenseIncurredAt={vm.expenseIncurredAt}
            setExpenseIncurredAt={vm.setExpenseIncurredAt}
            invoiceLineDescription={vm.invoiceLineDescription}
            setInvoiceLineDescription={vm.setInvoiceLineDescription}
            invoiceLineQuantity={vm.invoiceLineQuantity}
            setInvoiceLineQuantity={vm.setInvoiceLineQuantity}
            invoiceLineUnitPrice={vm.invoiceLineUnitPrice}
            setInvoiceLineUnitPrice={vm.setInvoiceLineUnitPrice}
            invoiceDueAt={vm.invoiceDueAt}
            setInvoiceDueAt={vm.setInvoiceDueAt}
            trustAccountId={vm.trustAccountId}
            setTrustAccountId={vm.setTrustAccountId}
            trustTransactionType={vm.trustTransactionType}
            setTrustTransactionType={vm.setTrustTransactionType}
            trustTransactionAmount={vm.trustTransactionAmount}
            setTrustTransactionAmount={vm.setTrustTransactionAmount}
            trustTransactionDescription={vm.trustTransactionDescription}
            setTrustTransactionDescription={vm.setTrustTransactionDescription}
            trustAccountOptions={vm.trustAccountOptions}
            invoicePaymentAmountById={vm.invoicePaymentAmountById}
            setInvoicePaymentAmountById={vm.setInvoicePaymentAmountById}
            invoicePaymentReferenceById={vm.invoicePaymentReferenceById}
            setInvoicePaymentReferenceById={vm.setInvoicePaymentReferenceById}
            invoicePaymentMethodById={vm.invoicePaymentMethodById}
            setInvoicePaymentMethodById={vm.setInvoicePaymentMethodById}
            createMatterTimeEntry={vm.createMatterTimeEntry}
            createMatterExpense={vm.createMatterExpense}
            createMatterInvoice={vm.createMatterInvoice}
            createMatterTrustTransaction={vm.createMatterTrustTransaction}
            createInvoiceCheckoutLink={vm.createInvoiceCheckoutLink}
            recordInvoicePayment={vm.recordInvoicePayment}
          />

          <AiWorkspacePanel dashboard={vm.dashboard} />
        </div>
      ) : null}
    </AppShell>
  );
}

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
            setEditingOverview={vm.setEditingOverview}
            overviewName={vm.overviewName}
            setOverviewName={vm.setOverviewName}
            overviewMatterNumber={vm.overviewMatterNumber}
            setOverviewMatterNumber={vm.setOverviewMatterNumber}
            overviewPracticeArea={vm.overviewPracticeArea}
            setOverviewPracticeArea={vm.setOverviewPracticeArea}
            overviewStatus={vm.overviewStatus}
            setOverviewStatus={vm.setOverviewStatus}
            overviewVenue={vm.overviewVenue}
            setOverviewVenue={vm.setOverviewVenue}
            overviewJurisdiction={vm.overviewJurisdiction}
            setOverviewJurisdiction={vm.setOverviewJurisdiction}
            overviewOpenedAt={vm.overviewOpenedAt}
            setOverviewOpenedAt={vm.setOverviewOpenedAt}
            overviewClosedAt={vm.overviewClosedAt}
            setOverviewClosedAt={vm.setOverviewClosedAt}
            overviewStatusMessage={vm.overviewStatusMessage}
            updateMatterOverview={vm.updateMatterOverview}
            cancelOverviewEdit={vm.cancelOverviewEdit}
          />

          <DomainSectionCompletenessCard dashboard={vm.dashboard} />

          <ParticipantsPanel
            dashboard={vm.dashboard}
            participantContacts={vm.participantContacts}
            participantRoleOptions={vm.participantRoleOptions}
            selectedParticipantContactId={vm.selectedParticipantContactId}
            setSelectedParticipantContactId={vm.setSelectedParticipantContactId}
            selectedParticipantRoleKey={vm.selectedParticipantRoleKey}
            setSelectedParticipantRoleKey={vm.setSelectedParticipantRoleKey}
            participantSide={vm.participantSide}
            setParticipantSide={vm.setParticipantSide}
            participantIsPrimary={vm.participantIsPrimary}
            setParticipantIsPrimary={vm.setParticipantIsPrimary}
            participantRepresentedByContactId={vm.participantRepresentedByContactId}
            setParticipantRepresentedByContactId={vm.setParticipantRepresentedByContactId}
            participantLawFirmContactId={vm.participantLawFirmContactId}
            setParticipantLawFirmContactId={vm.setParticipantLawFirmContactId}
            participantNotes={vm.participantNotes}
            setParticipantNotes={vm.setParticipantNotes}
            participantRoleIsCounsel={vm.participantRoleIsCounsel}
            participantStatusMessage={vm.participantStatusMessage}
            editingParticipantId={vm.editingParticipantId}
            createOrUpdateParticipant={vm.createOrUpdateParticipant}
            cancelEditingParticipant={vm.cancelEditingParticipant}
            startEditingParticipant={vm.startEditingParticipant}
            removeParticipant={vm.removeParticipant}
          />

          <TimelineDocketPanel dashboard={vm.dashboard} />

          <TasksPanel
            dashboard={vm.dashboard}
            taskTitle={vm.taskTitle}
            setTaskTitle={vm.setTaskTitle}
            taskDueAt={vm.taskDueAt}
            setTaskDueAt={vm.setTaskDueAt}
            taskPriority={vm.taskPriority}
            setTaskPriority={vm.setTaskPriority}
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
            eventType={vm.eventType}
            setEventType={vm.setEventType}
            eventStartAt={vm.eventStartAt}
            setEventStartAt={vm.setEventStartAt}
            eventEndAt={vm.eventEndAt}
            setEventEndAt={vm.setEventEndAt}
            eventLocation={vm.eventLocation}
            setEventLocation={vm.setEventLocation}
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
            selectedCommunicationThreadId={vm.selectedCommunicationThreadId}
            setSelectedCommunicationThreadId={vm.setSelectedCommunicationThreadId}
            newCommunicationThreadSubject={vm.newCommunicationThreadSubject}
            setNewCommunicationThreadSubject={vm.setNewCommunicationThreadSubject}
            communicationType={vm.communicationType}
            setCommunicationType={vm.setCommunicationType}
            communicationDirection={vm.communicationDirection}
            setCommunicationDirection={vm.setCommunicationDirection}
            communicationSubject={vm.communicationSubject}
            setCommunicationSubject={vm.setCommunicationSubject}
            communicationBody={vm.communicationBody}
            setCommunicationBody={vm.setCommunicationBody}
            communicationParticipantContactId={vm.communicationParticipantContactId}
            setCommunicationParticipantContactId={vm.setCommunicationParticipantContactId}
            communicationOccurredAt={vm.communicationOccurredAt}
            setCommunicationOccurredAt={vm.setCommunicationOccurredAt}
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

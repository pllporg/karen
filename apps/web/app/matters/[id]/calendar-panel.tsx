import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import type { MatterCalendarEventFormData } from '../../../lib/schemas/matter-dashboard';

type CalendarPanelProps = {
  dashboard: any;
  register: UseFormRegister<MatterCalendarEventFormData>;
  errors: FieldErrors<MatterCalendarEventFormData>;
  isSubmitting: boolean;
  calendarStatusMessage: string | null;
  editingCalendarEventId: string | null;
  createOrUpdateCalendarEvent: FormEventHandler<HTMLFormElement>;
  cancelEditingCalendarEvent: () => void;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  startEditingCalendarEvent: (event: {
    id: string;
    type: string;
    startAt: string;
    endAt?: string | null;
    location?: string | null;
  }) => void;
  exportCalendarIcs: () => Promise<void>;
};

export function CalendarPanel({
  dashboard,
  register,
  errors,
  isSubmitting,
  calendarStatusMessage,
  editingCalendarEventId,
  createOrUpdateCalendarEvent,
  cancelEditingCalendarEvent,
  deleteCalendarEvent,
  startEditingCalendarEvent,
  exportCalendarIcs,
}: CalendarPanelProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>Calendar</h3>
        <Button tone="secondary" type="button" onClick={exportCalendarIcs}>
          Export ICS
        </Button>
      </div>
      <form style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 180px 1fr auto' }} onSubmit={createOrUpdateCalendarEvent}>
        <FormField label="Calendar Event Type" name="matter-calendar-type" error={errors.type?.message} required>
          <Input
            aria-label="Calendar Event Type"
            placeholder="Event type"
            {...register('type')}
            invalid={!!errors.type}
          />
        </FormField>
        <FormField label="Calendar Event Start" name="matter-calendar-start" error={errors.startAt?.message} required>
          <Input
            aria-label="Calendar Event Start"
            type="datetime-local"
            {...register('startAt')}
            invalid={!!errors.startAt}
          />
        </FormField>
        <FormField label="Calendar Event End" name="matter-calendar-end" error={errors.endAt?.message}>
          <Input
            aria-label="Calendar Event End"
            type="datetime-local"
            {...register('endAt')}
            invalid={!!errors.endAt}
          />
        </FormField>
        <FormField label="Calendar Event Location" name="matter-calendar-location" error={errors.location?.message}>
          <Input
            aria-label="Calendar Event Location"
            placeholder="Location (optional)"
            {...register('location')}
            invalid={!!errors.location}
          />
        </FormField>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Working...' : editingCalendarEventId ? 'Save Event Edit' : 'Add Event'}
        </Button>
      </form>
      {editingCalendarEventId ? (
        <div style={{ marginTop: 8 }}>
          <Button tone="secondary" type="button" onClick={cancelEditingCalendarEvent}>
            Cancel Event Edit
          </Button>
        </div>
      ) : null}
      {calendarStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{calendarStatusMessage}</p> : null}
      <table aria-label="Data table" className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
            <th scope="col">Location</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(dashboard.calendarEvents || []).map((event: any) => (
            <tr key={event.id}>
              <td>{event.type}</td>
              <td>{new Date(event.startAt).toLocaleString()}</td>
              <td>{event.endAt ? new Date(event.endAt).toLocaleString() : '-'}</td>
              <td>{event.location || '-'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <Button
                  tone="secondary"
                  type="button"
                  aria-label={`Edit Calendar Event ${event.id}`}
                  onClick={() =>
                    startEditingCalendarEvent({
                      id: event.id,
                      type: event.type,
                      startAt: event.startAt,
                      endAt: event.endAt,
                      location: event.location,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  tone="secondary"
                  type="button"
                  aria-label={`Delete Calendar Event ${event.id}`}
                  onClick={() => deleteCalendarEvent(event.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {(dashboard.calendarEvents || []).length === 0 ? (
            <tr>
              <td colSpan={5}>No calendar events for this matter yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

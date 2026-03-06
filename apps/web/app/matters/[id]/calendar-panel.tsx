import { Dispatch, SetStateAction } from 'react';

type CalendarPanelProps = {
  dashboard: any;
  eventType: string;
  setEventType: Dispatch<SetStateAction<string>>;
  eventStartAt: string;
  setEventStartAt: Dispatch<SetStateAction<string>>;
  eventEndAt: string;
  setEventEndAt: Dispatch<SetStateAction<string>>;
  eventLocation: string;
  setEventLocation: Dispatch<SetStateAction<string>>;
  calendarStatusMessage: string | null;
  editingCalendarEventId: string | null;
  createOrUpdateCalendarEvent: () => Promise<void>;
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
  eventType,
  setEventType,
  eventStartAt,
  setEventStartAt,
  eventEndAt,
  setEventEndAt,
  eventLocation,
  setEventLocation,
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
        <button className="button secondary" type="button" onClick={exportCalendarIcs}>
          Export ICS
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 180px 1fr auto' }}>
        <input
          className="input"
          aria-label="Calendar Event Type"
          placeholder="Event type"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
        />
        <input
          className="input"
          aria-label="Calendar Event Start"
          type="datetime-local"
          value={eventStartAt}
          onChange={(event) => setEventStartAt(event.target.value)}
        />
        <input
          className="input"
          aria-label="Calendar Event End"
          type="datetime-local"
          value={eventEndAt}
          onChange={(event) => setEventEndAt(event.target.value)}
        />
        <input
          className="input"
          aria-label="Calendar Event Location"
          placeholder="Location (optional)"
          value={eventLocation}
          onChange={(event) => setEventLocation(event.target.value)}
        />
        <button className="button" type="button" onClick={createOrUpdateCalendarEvent}>
          {editingCalendarEventId ? 'Save Event Edit' : 'Add Event'}
        </button>
      </div>
      {editingCalendarEventId ? (
        <div style={{ marginTop: 8 }}>
          <button className="button secondary" type="button" onClick={cancelEditingCalendarEvent}>
            Cancel Event Edit
          </button>
        </div>
      ) : null}
      {calendarStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{calendarStatusMessage}</p> : null}
      <table className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Location</th>
            <th>Actions</th>
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
                <button
                  className="button secondary"
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
                </button>
                <button
                  className="button secondary"
                  type="button"
                  aria-label={`Delete Calendar Event ${event.id}`}
                  onClick={() => deleteCalendarEvent(event.id)}
                >
                  Delete
                </button>
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

import { Dispatch, SetStateAction } from 'react';
import { DeadlinePreviewRow } from './types';

type RulesPack = { id: string; name: string; pack?: { version?: string } };

type DeadlineRulesPanelProps = {
  rulesPacks: RulesPack[];
  selectedRulesPackId: string;
  setSelectedRulesPackId: Dispatch<SetStateAction<string>>;
  triggerDate: string;
  setTriggerDate: Dispatch<SetStateAction<string>>;
  previewRows: DeadlinePreviewRow[];
  overrideDates: Record<string, string>;
  setOverrideDates: Dispatch<SetStateAction<Record<string, string>>>;
  overrideReasons: Record<string, string>;
  setOverrideReasons: Dispatch<SetStateAction<Record<string, string>>>;
  deadlineStatus: string | null;
  previewDeadlines: () => Promise<void>;
  applyDeadlines: () => Promise<void>;
};

export function DeadlineRulesPanel({
  rulesPacks,
  selectedRulesPackId,
  setSelectedRulesPackId,
  triggerDate,
  setTriggerDate,
  previewRows,
  overrideDates,
  setOverrideDates,
  overrideReasons,
  setOverrideReasons,
  deadlineStatus,
  previewDeadlines,
  applyDeadlines,
}: DeadlineRulesPanelProps) {
  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <h3 style={{ marginTop: 0 }}>Jurisdictional Deadline Rules Pack</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px auto auto' }}>
        <select
          className="select"
          aria-label="Rules Pack"
          value={selectedRulesPackId}
          onChange={(event) => setSelectedRulesPackId(event.target.value)}
        >
          <option value="">Select rules pack</option>
          {rulesPacks.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.name} {pack.pack?.version ? `(v${pack.pack.version})` : ''}
            </option>
          ))}
        </select>
        <input
          aria-label="Trigger Date"
          className="input"
          type="date"
          value={triggerDate}
          onChange={(event) => setTriggerDate(event.target.value)}
        />
        <button className="button secondary" type="button" onClick={previewDeadlines}>
          Preview Deadlines
        </button>
        <button className="button" type="button" onClick={applyDeadlines}>
          Apply Selected
        </button>
      </div>
      {deadlineStatus ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{deadlineStatus}</p> : null}
      {previewRows.length > 0 ? (
        <table aria-label="Data table" className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Computed Date</th>
              <th scope="col">Override Date</th>
              <th scope="col">Override Reason</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr key={row.ruleId}>
                <td>{row.name}</td>
                <td>{new Date(row.computedDate).toLocaleDateString()}</td>
                <td>
                  <input
                    className="input"
                    type="date"
                    aria-label={`Override Date ${row.ruleId}`}
                    value={overrideDates[row.ruleId] || ''}
                    onChange={(event) =>
                      setOverrideDates((current) => ({
                        ...current,
                        [row.ruleId]: event.target.value,
                      }))
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    aria-label={`Override Reason ${row.ruleId}`}
                    placeholder="Required if override date is set"
                    value={overrideReasons[row.ruleId] || ''}
                    onChange={(event) =>
                      setOverrideReasons((current) => ({
                        ...current,
                        [row.ruleId]: event.target.value,
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ marginTop: 10 }}>Preview rules to review computed deadlines before creating events.</p>
      )}
    </div>
  );
}

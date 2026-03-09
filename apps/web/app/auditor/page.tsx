'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { PageHeader } from '../../components/page-header';
import { ToastStack, type ToastItem } from '../../components/toast-stack';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Drawer } from '../../components/ui/drawer';
import { Select } from '../../components/ui/select';
import { Table, TableWrapper } from '../../components/ui/table';
import { getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type QueueStatus = 'PROPOSED' | 'IN REVIEW' | 'APPROVED' | 'EXECUTED' | 'RETURNED';
type QueueAction = 'APPROVE' | 'RETURN' | 'EXECUTE';
type PendingQueueAction = { action: QueueAction; signal: AuditorSignal } | null;

type AuditorSignal = {
  id: string;
  severity: string;
  signalType: string;
  matterLabel: string;
  status: QueueStatus;
  updatedAt: string;
  summary: string;
  detail: string;
};

function toIsoOrPending(value: string | null | undefined): string {
  if (!value) return 'pending';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'invalid';
  return parsed.toISOString();
}

function formatUtcTimestamp(value: string | null | undefined): string {
  const iso = toIsoOrPending(value);
  if (iso === 'pending') return 'PENDING';
  if (iso === 'invalid') return 'INVALID';
  return iso.replace('T', ' ').replace('Z', ' UTC');
}

function formatFeedbackTimestamp(value: Date): string {
  return formatUtcTimestamp(value.toISOString());
}

function normalizeStatus(value: unknown): QueueStatus {
  const raw = String(value || '')
    .replaceAll('_', ' ')
    .trim()
    .toUpperCase();
  if (raw === 'APPROVED') return 'APPROVED';
  if (raw === 'EXECUTED') return 'EXECUTED';
  if (raw === 'RETURNED' || raw === 'REJECTED') return 'RETURNED';
  if (raw === 'IN REVIEW') return 'IN REVIEW';
  return 'PROPOSED';
}

function parseSignals(payload: unknown): AuditorSignal[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown[] } | null)?.items)
      ? (payload as { items: unknown[] }).items
      : [];

  return rows.map((row, index) => {
    const item = (row || {}) as Record<string, unknown>;
    return {
      id: String(item.id || item.signalId || `signal-${index}`),
      severity: String(item.severity || 'LOW').toUpperCase(),
      signalType: String(item.signalType || item.type || 'UNSPECIFIED').replaceAll('_', ' '),
      matterLabel: String(item.matterLabel || item.matterName || item.matterId || 'UNASSIGNED MATTER'),
      status: normalizeStatus(item.status || item.reviewStatus || item.reviewedStatus),
      updatedAt: String(item.updatedAt || item.reviewedAt || item.createdAt || ''),
      summary: String(item.summary || item.title || 'Audit signal requires review.'),
      detail: String(item.detail || item.description || 'No additional signal detail returned by endpoint.'),
    };
  });
}

async function fetchSignals(): Promise<AuditorSignal[]> {
  const token = getSessionToken();
  const response = await fetch(`${API_BASE}/auditor/signals`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
    },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`QUEUE_FETCH_FAILED:${response.status}`);
  }
  const payload = await response.json().catch(() => []);
  return parseSignals(payload);
}

async function reviewSignal(signalId: string, action: QueueAction): Promise<void> {
  const token = getSessionToken();
  const baseHeaders = {
    'content-type': 'application/json',
    ...(token ? { 'x-session-token': token } : {}),
  };

  const attempts: Array<{ path: string; body: Record<string, string> }> = [
    { path: `/auditor/signals/${signalId}/review`, body: { action } },
    { path: `/auditor/signals/${signalId}/review`, body: { decision: action } },
    { path: `/auditor/signals/${signalId}/${action.toLowerCase()}`, body: { notes: `Operator decision: ${action}.` } },
  ];

  let lastStatus = 500;
  for (const attempt of attempts) {
    const response = await fetch(`${API_BASE}${attempt.path}`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(attempt.body),
      credentials: 'include',
    }).catch(() => null);

    if (response?.ok) {
      return;
    }
    lastStatus = response?.status || 500;
  }

  throw new Error(`QUEUE_ACTION_FAILED:${lastStatus}`);
}

export default function AuditorPage() {
  const [signals, setSignals] = useState<AuditorSignal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QueueStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<QueueAction | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingQueueAction>(null);
  const [errorText, setErrorText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const selectedSignalIdRef = useRef<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    selectedSignalIdRef.current = selectedSignalId;
  }, [selectedSignalId]);

  const selectedSignal = useMemo(
    () => signals.find((signal) => signal.id === selectedSignalId) || null,
    [selectedSignalId, signals],
  );

  const visibleSignals = useMemo(
    () =>
      signals.filter((signal) => {
        const severityMatches = severityFilter === 'ALL' || signal.severity === severityFilter;
        const statusMatches = statusFilter === 'ALL' || signal.status === statusFilter;
        return severityMatches && statusMatches;
      }),
    [severityFilter, signals, statusFilter],
  );

  const uniqueSeverities = useMemo(() => ['ALL', ...new Set(signals.map((signal) => signal.severity))], [signals]);

  function pushToast(tone: ToastItem['tone'], title: string, detail: string) {
    setToasts((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
        tone,
        title,
        detail,
        occurredAt: formatFeedbackTimestamp(new Date()),
      },
    ]);
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const nextSignals = await fetchSignals();
      setSignals(nextSignals);
      if (selectedSignalIdRef.current && !nextSignals.some((signal) => signal.id === selectedSignalIdRef.current)) {
        setSelectedSignalId(null);
      }
    } catch {
      setErrorText('Unable to load auditor queue. Verify API connectivity and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue().catch(() => undefined);
  }, [loadQueue]);

  async function executeAction(currentAction: PendingQueueAction) {
    if (!currentAction) return;
    const { action, signal } = currentAction;
    setActionBusy(action);
    setErrorText('');
    setFeedbackText(`Applying ${action} to ${signal.id}...`);
    setPendingAction(null);
    try {
      await reviewSignal(signal.id, action);
      await loadQueue();
      const timestamp = formatFeedbackTimestamp(new Date());
      setFeedbackText(`${action} recorded for ${signal.id} at ${timestamp}.`);
      pushToast(
        action === 'RETURN' ? 'warning' : 'success',
        `${action} Recorded`,
        `Signal ${signal.id} updated and audit timestamp recorded.`,
      );
      setSelectedSignalId(null);
    } catch {
      setFeedbackText('');
      setErrorText(`Unable to ${action.toLowerCase()} signal ${signal.id}. No transition applied.`);
    } finally {
      setActionBusy(null);
    }
  }

  const pendingActionDialog = useMemo(() => {
    if (!pendingAction) return null;

    if (pendingAction.action === 'APPROVE') {
      return {
        title: 'Confirm Signal Approval',
        description: `Approve signal ${pendingAction.signal.id}. This records the operator decision and advances review state.`,
        confirmLabel: 'Approve Signal',
        confirmTone: 'default' as const,
      };
    }

    if (pendingAction.action === 'RETURN') {
      return {
        title: 'Confirm Signal Return',
        description: `Return signal ${pendingAction.signal.id} for follow-up. This records a returned disposition in the audit log.`,
        confirmLabel: 'Return Signal',
        confirmTone: 'danger' as const,
      };
    }

    return {
      title: 'Confirm Signal Execution',
      description: `Execute signal ${pendingAction.signal.id}. Confirm the queue item is ready for execution before proceeding.`,
      confirmLabel: 'Execute Signal',
      confirmTone: 'default' as const,
    };
  }, [pendingAction]);

  return (
    <AppShell>
      <PageHeader
        title="Auditor Queue"
        subtitle="Table queue for daily case monitoring decisions. Actions require explicit operator confirmation."
      />

      <div className="card" style={{ marginBottom: 14, display: 'grid', gap: 12 }}>
        <div className="row-between">
          <p className="mono-meta">Operations Queue</p>
          <Button tone="secondary" onClick={() => loadQueue()} disabled={loading}>
            Refresh Queue
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 220px))', gap: 8 }}>
          <label htmlFor="auditor-severity-filter">
            Severity Filter
            <Select id="auditor-severity-filter" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              {uniqueSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </Select>
          </label>

          <label htmlFor="auditor-status-filter">
            Status Filter
            <Select
              id="auditor-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | QueueStatus)}
            >
              <option value="ALL">ALL</option>
              <option value="PROPOSED">PROPOSED</option>
              <option value="IN REVIEW">IN REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="EXECUTED">EXECUTED</option>
              <option value="RETURNED">RETURNED</option>
            </Select>
          </label>
        </div>

        {feedbackText ? (
          <p className="notice" role="status" aria-live="polite">
            {feedbackText}
          </p>
        ) : null}
        {errorText ? (
          <p className="error" role="alert">
            {errorText}
          </p>
        ) : null}

        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th scope="col">Severity</th>
                <th scope="col">Signal Type</th>
                <th scope="col">Matter Label</th>
                <th scope="col">Status</th>
                <th scope="col">Updated Timestamp</th>
                <th scope="col">Review</th>
              </tr>
            </thead>
            <tbody>
              {visibleSignals.map((signal) => (
                <tr key={signal.id}>
                  <td>{signal.severity}</td>
                  <td>{signal.signalType}</td>
                  <td>{signal.matterLabel}</td>
                  <td>
                    <Badge className={`status-${signal.status.toLowerCase().replaceAll(' ', '-')}`}>{signal.status}</Badge>
                  </td>
                  <td>{formatUtcTimestamp(signal.updatedAt)}</td>
                  <td>
                    <Button
                      tone="secondary"
                      aria-label={`Review ${signal.id}`}
                      onClick={() => setSelectedSignalId(signal.id)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && visibleSignals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No signals matched current filters. Adjust filters or refresh queue.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading queue records...</td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrapper>
      </div>

      <Drawer open={Boolean(selectedSignal)} side="right" title="Review Signal" onClose={() => setSelectedSignalId(null)}>
        {selectedSignal ? (
          <div className="inline-stack">
            <p className="mono-meta">Signal ID: {selectedSignal.id}</p>
            <p>{selectedSignal.summary}</p>
            <p>{selectedSignal.detail}</p>
            <p className="mono-meta">Last Updated: {formatUtcTimestamp(selectedSignal.updatedAt)}</p>
            <p className="mono-meta">Review Gate: PROPOSED → IN REVIEW → APPROVED → EXECUTED / RETURNED</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <Button onClick={() => selectedSignal && setPendingAction({ action: 'APPROVE', signal: selectedSignal })} disabled={Boolean(actionBusy)}>
                {actionBusy === 'APPROVE' ? 'Recording...' : 'Approve'}
              </Button>
              <Button
                tone="danger"
                onClick={() => selectedSignal && setPendingAction({ action: 'RETURN', signal: selectedSignal })}
                disabled={Boolean(actionBusy)}
              >
                {actionBusy === 'RETURN' ? 'Recording...' : 'Return'}
              </Button>
              <Button
                tone="secondary"
                onClick={() => selectedSignal && setPendingAction({ action: 'EXECUTE', signal: selectedSignal })}
                disabled={Boolean(actionBusy)}
              >
                {actionBusy === 'EXECUTE' ? 'Recording...' : 'Execute'}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
      <ConfirmDialog
        open={Boolean(pendingActionDialog)}
        title={pendingActionDialog?.title || 'Confirm Queue Action'}
        description={pendingActionDialog?.description || ''}
        confirmLabel={pendingActionDialog?.confirmLabel || 'Confirm'}
        confirmTone={pendingActionDialog?.confirmTone || 'default'}
        cancelLabel="Return to Review"
        busy={actionBusy !== null}
        onCancel={() => {
          if (!actionBusy) {
            setPendingAction(null);
          }
        }}
        onConfirm={() => executeAction(pendingAction)}
      />
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

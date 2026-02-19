'use client';

export type ToastItem = {
  id: string;
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail: string;
  occurredAt: string;
};

export function ToastStack({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-label="Status updates">
      {items.map((item) => (
        <section key={item.id} className={`toast toast-${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'}>
          <div className="toast-header">
            <p className="toast-title">{item.title}</p>
            <p className="toast-time">{item.occurredAt}</p>
          </div>
          <p className="toast-detail">{item.detail}</p>
          <button className="button ghost toast-dismiss" type="button" onClick={() => onDismiss(item.id)}>
            Dismiss
          </button>
        </section>
      ))}
    </div>
  );
}

'use client';

import { Button } from './ui/button';
import { Toast } from './ui/toast';

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
        <Toast
          key={item.id}
          tone={item.tone}
          title={item.title}
          time={item.occurredAt}
          detail={item.detail}
          actions={
            <Button className="toast-dismiss" tone="ghost" type="button" onClick={() => onDismiss(item.id)}>
              Dismiss
            </Button>
          }
        />
      ))}
    </div>
  );
}

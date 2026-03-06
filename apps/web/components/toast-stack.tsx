'use client';

import { useEffect } from 'react';
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
  const maxVisible = 3;
  const defaultDurationMs = 8000;
  const visibleItems = items.slice(-maxVisible);

  useEffect(() => {
    if (items.length <= maxVisible) return;
    const overflow = items.slice(0, items.length - maxVisible);
    overflow.forEach((item) => onDismiss(item.id));
  }, [items, onDismiss]);

  useEffect(() => {
    if (visibleItems.length === 0) return;
    const timers = visibleItems.map((item) => window.setTimeout(() => onDismiss(item.id), defaultDurationMs));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDismiss, visibleItems]);

  useEffect(() => {
    if (visibleItems.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const newest = visibleItems[visibleItems.length - 1];
      if (newest) {
        onDismiss(newest.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss, visibleItems]);

  if (items.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-label="Status updates">
      {visibleItems.map((item) => (
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

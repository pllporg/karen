'use client';

import { Button } from './ui/button';

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

export function EmptyState({ message, action }: { message: string; action?: EmptyStateAction }) {
  return (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {action ? (
        <Button type="button" tone="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

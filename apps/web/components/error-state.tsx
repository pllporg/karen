'use client';

import { Button } from './ui/button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state-message">{message}</p>
      {onRetry ? (
        <Button type="button" tone="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

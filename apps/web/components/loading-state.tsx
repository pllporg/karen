'use client';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-bar" aria-hidden="true" />
      <p className="loading-label">{label}</p>
    </div>
  );
}

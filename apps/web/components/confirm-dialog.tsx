'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from './ui/button';
import { Modal } from './ui/modal';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'default' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const raf = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <Modal
      open={open}
      titleId={titleId}
      descriptionId={descriptionId}
      className="confirm-dialog"
      busy={busy}
      onClose={onCancel}
    >
      <div className="confirm-body">
        <p id={titleId} className="confirm-title">
          {title}
        </p>
        <p id={descriptionId} className="confirm-description">
          {description}
        </p>
        <div className="confirm-actions">
          <Button
            ref={cancelButtonRef}
            tone="ghost"
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            tone={confirmTone === 'danger' ? 'danger' : 'default'}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

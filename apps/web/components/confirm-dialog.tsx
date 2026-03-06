'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Modal } from './ui/modal';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'default' | 'danger';
  busy?: boolean;
  typedConfirmation?: string;
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
  typedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const typedInputId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [typedValue, setTypedValue] = useState('');
  const requiresTypedConfirmation = Boolean(typedConfirmation);
  const typedMatches = !requiresTypedConfirmation || typedValue === typedConfirmation;

  useEffect(() => {
    if (!open) return undefined;
    const raf = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTypedValue('');
    }
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
        {requiresTypedConfirmation ? (
          <div className="confirm-typed">
            <label htmlFor={typedInputId}>Confirmation Token</label>
            <Input
              id={typedInputId}
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              placeholder={`Type "${typedConfirmation}" to confirm`}
              invalid={!typedMatches}
              autoComplete="off"
              spellCheck={false}
            />
            {!typedMatches ? (
              <p className="confirm-typed-help">Token does not match required confirmation text.</p>
            ) : null}
          </div>
        ) : null}
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
            onClick={() => {
              if (!typedMatches) return;
              onConfirm();
            }}
            disabled={busy || !typedMatches}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

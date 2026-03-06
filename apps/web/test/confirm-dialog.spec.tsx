import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ConfirmDialog } from '../components/confirm-dialog';

function ConfirmDialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open Review Gate
      </button>
      <ConfirmDialog
        open={open}
        title="Confirm External Send"
        description="External send requires explicit approval."
        confirmLabel="Approve Send"
        cancelLabel="Return to Review"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('traps keyboard focus and restores focus to trigger on close', async () => {
    render(<ConfirmDialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open Review Gate' });
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Confirm External Send' });
    const cancelButton = screen.getByRole('button', { name: 'Return to Review' });
    const approveButton = screen.getByRole('button', { name: 'Approve Send' });

    await waitFor(() => {
      expect(cancelButton).toHaveFocus();
    });

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(approveButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Confirm External Send' })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('requires exact typed confirmation when configured', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Confirm External Send"
        description="External send requires explicit approval."
        confirmLabel="Approve Send"
        cancelLabel="Return to Review"
        typedConfirmation="APPROVE SEND"
        onCancel={() => undefined}
        onConfirm={onConfirm}
      />,
    );

    const approveButton = screen.getByRole('button', { name: 'Approve Send' });
    const confirmationInput = screen.getByPlaceholderText('Type "APPROVE SEND" to confirm');

    expect(approveButton).toBeDisabled();
    fireEvent.change(confirmationInput, { target: { value: 'APPROVE' } });
    expect(approveButton).toBeDisabled();

    fireEvent.change(confirmationInput, { target: { value: 'APPROVE SEND' } });
    expect(approveButton).toBeEnabled();

    fireEvent.click(approveButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

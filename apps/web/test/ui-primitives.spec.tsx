import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import fs from 'node:fs';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardGrid } from '../components/ui/card';
import { Drawer } from '../components/ui/drawer';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { Select } from '../components/ui/select';
import { Table } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Toast } from '../components/ui/toast';

describe('UI primitives', () => {
  it('renders canonical button/input/select/badge/table/card primitives with expected state classes', () => {
    render(
      <>
        <CardGrid>
          <Card>Card body</Card>
        </CardGrid>
        <Button tone="danger" disabled>
          Delete
        </Button>
        <Input aria-label="Email" invalid defaultValue="x@example.com" />
        <Select aria-label="Status" invalid defaultValue="OPEN">
          <option value="OPEN">Open</option>
        </Select>
        <Textarea aria-label="Narrative" invalid defaultValue="Detail" />
        <Badge tone="in-review">IN REVIEW</Badge>
        <Table>
          <tbody>
            <tr>
              <td>Row</td>
            </tr>
          </tbody>
        </Table>
      </>,
    );

    expect(screen.getByText('Card body').closest('div')).toHaveClass('card');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('button', 'danger');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-state', 'disabled');
    expect(screen.getByLabelText('Email')).toHaveClass('input');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-state', 'error');
    expect(screen.getByLabelText('Status')).toHaveClass('select');
    expect(screen.getByLabelText('Status')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Status')).toHaveAttribute('data-state', 'error');
    expect(screen.getByLabelText('Narrative')).toHaveClass('textarea');
    expect(screen.getByLabelText('Narrative')).toHaveAttribute('data-state', 'error');
    expect(screen.getByText('IN REVIEW')).toHaveClass('badge', 'status-in-review');
    expect(screen.getByText('IN REVIEW')).toHaveAttribute('data-tone', 'in-review');
    expect(screen.getByRole('table')).toHaveClass('table');
  });

  it('renders modal and closes on escape when not busy', () => {
    const onClose = vi.fn();
    render(
      <Modal open titleId="modal-title" descriptionId="modal-desc" onClose={onClose}>
        <p id="modal-title">Confirm Action</p>
        <p id="modal-desc">Review required.</p>
        <Button>Confirm</Button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirm Action' });
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps modal open while busy and blocks escape close', () => {
    const onClose = vi.fn();
    render(
      <Modal open titleId="modal-title" descriptionId="modal-desc" busy onClose={onClose}>
        <p id="modal-title">Confirm Action</p>
        <p id="modal-desc">Review required.</p>
        <Button>Confirm</Button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirm Action' });
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders drawer and closes from close button', () => {
    const onClose = vi.fn();
    render(
      <Drawer open title="Review Queue" onClose={onClose}>
        <p>Drawer body</p>
      </Drawer>,
    );

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(document.querySelector('.ui-drawer')).toHaveAttribute('data-state', 'open');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders toast primitive with severity role', () => {
    render(<Toast tone="error" title="Failed" time="2026-02-19 11:00:00" detail="Request failed" />);
    expect(screen.getByRole('alert')).toHaveClass('toast', 'toast-error');
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'error');
  });

  it('defines focus-visible styles for keyboard navigation in core primitives', () => {
    const globalsCss = fs.readFileSync('app/globals.css', 'utf8');
    expect(globalsCss).toContain('button:focus-visible');
    expect(globalsCss).toContain('input:focus-visible');
    expect(globalsCss).toContain('select:focus-visible');
    expect(globalsCss).toContain('textarea:focus-visible');
  });
});

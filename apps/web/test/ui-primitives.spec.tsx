import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import fs from 'node:fs';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardGrid } from '../components/ui/card';
import { Drawer } from '../components/ui/drawer';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { Select } from '../components/ui/select';
import { SortableTh, Table } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Toast } from '../components/ui/toast';
import { Toggle } from '../components/ui/toggle';

describe('UI primitives', () => {
  it('renders canonical button/input/select/badge/table/card primitives with expected state classes', () => {
    render(
      <>
        <CardGrid>
          <Card>Card body</Card>
        </CardGrid>
        <Button tone="danger" size="lg" disabled>
          Delete
        </Button>
        <Input aria-label="Email" invalid defaultValue="x@example.com" />
        <Select aria-label="Status" invalid defaultValue="OPEN">
          <option value="OPEN">Open</option>
        </Select>
        <Textarea aria-label="Narrative" invalid defaultValue="Detail" />
        <Badge tone="in-review">IN REVIEW</Badge>
        <Table alternating>
          <thead>
            <tr>
              <th scope="col">Row</th>
            </tr>
          </thead>
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
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-size', 'lg');
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
    expect(screen.getByRole('table', { name: 'Data table' })).toHaveClass('table');
    expect(screen.getByRole('table', { name: 'Data table' })).toHaveAttribute('data-alternating', 'true');
    expect(screen.getByRole('columnheader', { name: 'Row' })).toHaveAttribute('scope', 'col');
  });

  it('wires form labels and error semantics to controls', () => {
    render(
      <FormField label="Matter Name" name="matter-name" error="Matter Name is required." required>
        <Input defaultValue="" />
      </FormField>,
    );

    const field = screen.getByRole('textbox', { name: /Matter Name/i });
    expect(field).toHaveAttribute('id', 'matter-name');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-required', 'true');
    expect(field).toHaveAttribute('aria-errormessage', 'matter-name-error');
    expect(field).toHaveAttribute('aria-describedby', 'matter-name-error');
    expect(screen.getByText('Matter Name is required.')).toHaveAttribute('role', 'alert');
  });

  it('keeps explicit table announcement attributes when provided', () => {
    render(
      <>
        <p id="jobs-table-label">Jobs Queue</p>
        <Table aria-labelledby="jobs-table-label">
          <thead>
            <tr>
              <th scope="col">Job</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Export</td>
            </tr>
          </tbody>
        </Table>
      </>,
    );

    const table = screen.getByRole('table', { name: 'Jobs Queue' });
    expect(table).toHaveAttribute('aria-labelledby', 'jobs-table-label');
    expect(table).not.toHaveAttribute('aria-label', 'Data table');
  });

  it('combines hint and error ids in form field descriptions', () => {
    render(
      <FormField
        label="Reference Code"
        name="reference-code"
        hint="Use filing code format."
        error="Reference Code is required."
        required
      >
        <Input defaultValue="" />
      </FormField>,
    );

    const field = screen.getByRole('textbox', { name: /Reference Code/i });
    expect(field).toHaveAttribute('aria-describedby', 'reference-code-hint reference-code-error');
    expect(field).toHaveAttribute('aria-errormessage', 'reference-code-error');
    expect(screen.getByText('Use filing code format.')).toHaveAttribute('id', 'reference-code-hint');
    const requiredMarker = screen.getByText('*');
    expect(requiredMarker).toHaveAttribute('aria-hidden', 'true');
  });

  it('wires toggle labels to switch semantics and updates checked state', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Send Update" />);

    const toggle = screen.getByRole('switch', { name: 'Send Update' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('id');
    expect(toggle.closest('label')).toHaveAttribute('for', toggle.getAttribute('id'));

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
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

  it('renders drawer with dialog semantics and keyboard-close behavior', () => {
    const onClose = vi.fn();
    render(
      <Drawer open title="Review Queue" onClose={onClose}>
        <button type="button">Second Action</button>
      </Drawer>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Review Queue' });
    const closeButton = screen.getByRole('button', { name: 'Close' });
    const secondAction = screen.getByRole('button', { name: 'Second Action' });
    expect(dialog).toBeInTheDocument();
    expect(closeButton).toHaveFocus();

    secondAction.focus();
    fireEvent.keyDown(secondAction, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(secondAction).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render drawer focusable controls when closed', () => {
    const onClose = vi.fn();
    render(
      <Drawer open={false} title="Review Queue" onClose={onClose}>
        <p>Drawer body</p>
      </Drawer>,
    );

    expect(screen.queryByRole('dialog', { name: 'Review Queue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close drawer' })).not.toBeInTheDocument();
  });

  it('renders sortable table headers as keyboard-focusable buttons', () => {
    const onSort = vi.fn();
    render(
      <Table>
        <thead>
          <tr>
            <SortableTh onSort={onSort}>Matter</SortableTh>
          </tr>
        </thead>
      </Table>,
    );

    const sortButton = screen.getByRole('button', { name: 'Matter' });
    expect(sortButton).toHaveClass('table-sort-button');
    fireEvent.click(sortButton);
    expect(onSort).toHaveBeenCalledTimes(1);
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

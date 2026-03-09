import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { MatterTaskFormData } from '../../../lib/schemas/matter-dashboard';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './types';

type TasksPanelProps = {
  dashboard: any;
  register: UseFormRegister<MatterTaskFormData>;
  errors: FieldErrors<MatterTaskFormData>;
  isSubmitting: boolean;
  taskStatusMessage: string | null;
  editingTaskId: string | null;
  createOrUpdateTask: FormEventHandler<HTMLFormElement>;
  cancelEditingTask: () => void;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  startEditingTask: (task: {
    id: string;
    title: string;
    dueAt?: string | null;
    priority?: (typeof TASK_PRIORITY_OPTIONS)[number];
  }) => void;
  deleteTask: (taskId: string) => Promise<void>;
};

export function TasksPanel({
  dashboard,
  register,
  errors,
  isSubmitting,
  taskStatusMessage,
  editingTaskId,
  createOrUpdateTask,
  cancelEditingTask,
  updateTaskStatus,
  startEditingTask,
  deleteTask,
}: TasksPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Tasks</h3>
      <form style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 140px auto' }} onSubmit={createOrUpdateTask}>
        <FormField label="Task Title" name="matter-task-title" error={errors.title?.message} required>
          <Input aria-label="Task Title" placeholder="Task title" {...register('title')} invalid={!!errors.title} />
        </FormField>
        <FormField label="Task Due At" name="matter-task-due-at" error={errors.dueAt?.message}>
          <Input
            aria-label="Task Due At"
            type="datetime-local"
            {...register('dueAt')}
            invalid={!!errors.dueAt}
          />
        </FormField>
        <FormField label="Task Priority" name="matter-task-priority" error={errors.priority?.message} required>
          <Select aria-label="Task Priority" {...register('priority')} invalid={!!errors.priority}>
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormField>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Working...' : editingTaskId ? 'Save Task Edit' : 'Add Task'}
        </Button>
      </form>
      {editingTaskId ? (
        <div style={{ marginTop: 8 }}>
          <Button tone="secondary" type="button" onClick={cancelEditingTask}>
            Cancel Task Edit
          </Button>
        </div>
      ) : null}
      {taskStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{taskStatusMessage}</p> : null}
      <table aria-label="Data table" className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Due</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(dashboard.tasks || []).map((task: any) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>
                <select
                  className="select"
                  aria-label={`Task Status ${task.id}`}
                  value={task.status}
                  onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                >
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>{task.dueAt ? new Date(task.dueAt).toLocaleString() : '-'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <Button
                  tone="secondary"
                  type="button"
                  aria-label={`Edit Task ${task.id}`}
                  onClick={() =>
                    startEditingTask({
                      id: task.id,
                      title: task.title,
                      dueAt: task.dueAt,
                      priority: TASK_PRIORITY_OPTIONS.includes(task.priority) ? task.priority : undefined,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  tone="secondary"
                  type="button"
                  aria-label={`Delete Task ${task.id}`}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

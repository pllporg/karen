import { Dispatch, SetStateAction } from 'react';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './types';

type TasksPanelProps = {
  dashboard: any;
  taskTitle: string;
  setTaskTitle: Dispatch<SetStateAction<string>>;
  taskDueAt: string;
  setTaskDueAt: Dispatch<SetStateAction<string>>;
  taskPriority: (typeof TASK_PRIORITY_OPTIONS)[number];
  setTaskPriority: Dispatch<SetStateAction<(typeof TASK_PRIORITY_OPTIONS)[number]>>;
  taskStatusMessage: string | null;
  editingTaskId: string | null;
  createOrUpdateTask: () => Promise<void>;
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
  taskTitle,
  setTaskTitle,
  taskDueAt,
  setTaskDueAt,
  taskPriority,
  setTaskPriority,
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
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 140px auto' }}>
        <input
          className="input"
          aria-label="Task Title"
          placeholder="Task title"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
        />
        <input
          className="input"
          aria-label="Task Due At"
          type="datetime-local"
          value={taskDueAt}
          onChange={(event) => setTaskDueAt(event.target.value)}
        />
        <select
          className="select"
          aria-label="Task Priority"
          value={taskPriority}
          onChange={(event) => setTaskPriority(event.target.value as (typeof TASK_PRIORITY_OPTIONS)[number])}
        >
          {TASK_PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button className="button" type="button" onClick={createOrUpdateTask}>
          {editingTaskId ? 'Save Task Edit' : 'Add Task'}
        </button>
      </div>
      {editingTaskId ? (
        <div style={{ marginTop: 8 }}>
          <button className="button secondary" type="button" onClick={cancelEditingTask}>
            Cancel Task Edit
          </button>
        </div>
      ) : null}
      {taskStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{taskStatusMessage}</p> : null}
      <table className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Due</th>
            <th>Actions</th>
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
                <button
                  className="button secondary"
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
                </button>
                <button
                  className="button secondary"
                  type="button"
                  aria-label={`Delete Task ${task.id}`}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

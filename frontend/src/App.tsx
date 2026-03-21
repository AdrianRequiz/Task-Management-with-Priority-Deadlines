import { useEffect, useMemo, useState } from 'react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Task {
  id: number;
  project: number;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

interface OverdueResponse {
  count: number;
  results: Task[];
}

interface TaskErrorResponse {
  deadline?: string[];
}

function App() {
  const API_BASE = 'http://localhost:8000/api';

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({
    project: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    status: 'TODO' as TaskStatus,
    deadline: '',
  });

  const priorityBadge = useMemo(
    (): Record<Priority, string> => ({
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-green-100 text-green-700',
    }),
    []
  );

  const fetchProjects = async () => {
    const response = await fetch(`${API_BASE}/projects/`);
    if (!response.ok) throw new Error('Failed to load projects.');
    const data: Project[] = await response.json();
    setProjects(data);
  };

  const fetchTasks = async (deadline = deadlineFilter) => {
    const query = deadline ? `?deadline_lte=${deadline}` : '';
    const response = await fetch(`${API_BASE}/tasks/${query}`);
    if (!response.ok) throw new Error('Failed to load tasks.');
    const data: Task[] = await response.json();
    setTasks(data);
  };

  const fetchOverdue = async () => {
    const response = await fetch(`${API_BASE}/tasks/overdue/`);
    if (!response.ok) throw new Error('Failed to load overdue data.');
    const data: OverdueResponse = await response.json();
    setOverdueCount(data.count);
  };

  const refreshAll = async (deadline = deadlineFilter) => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchProjects(), fetchTasks(deadline), fetchOverdue()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!response.ok) throw new Error('Unable to create project.');
      setNewProject({ name: '', description: '' });
      await refreshAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) {
        const errorData: TaskErrorResponse = await response.json();
        throw new Error(errorData.deadline?.[0] || 'Unable to create task.');
      }
      setNewTask({
        project: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '',
      });
      await refreshAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateStatus = async (task: Task, status: TaskStatus) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Unable to update status.');
      await refreshAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const projectNameById = (projectId: number) => projects.find((project) => project.id === projectId)?.name || 'Unknown Project';

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-slate-800">Task Management with Priority & Deadlines</h1>
          <p className="mt-2 text-slate-600">Create projects, add tasks, validate deadlines, and track overdue work.</p>
          <p className="mt-3 inline-block rounded bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
            Overdue Tasks: {overdueCount}
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={handleProjectSubmit} className="rounded-xl bg-white p-6 shadow space-y-3">
            <h2 className="text-lg font-semibold">Create Project</h2>
            <input
              className="w-full rounded border p-2"
              placeholder="Project name"
              value={newProject.name}
              onChange={(event) => setNewProject({ ...newProject, name: event.target.value })}
              required
            />
            <textarea
              className="w-full rounded border p-2"
              placeholder="Description"
              value={newProject.description}
              onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
            />
            <button className="rounded bg-slate-800 px-4 py-2 text-white">Save Project</button>
          </form>

          <form onSubmit={handleTaskSubmit} className="rounded-xl bg-white p-6 shadow space-y-3">
            <h2 className="text-lg font-semibold">Add Task</h2>
            <select
              className="w-full rounded border p-2"
              value={newTask.project}
              onChange={(event) => setNewTask({ ...newTask, project: event.target.value })}
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded border p-2"
              placeholder="Task title"
              value={newTask.title}
              onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded border p-2"
                value={newTask.priority}
                onChange={(event) => setNewTask({ ...newTask, priority: event.target.value as Priority })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <input
                type="date"
                className="rounded border p-2"
                value={newTask.deadline}
                onChange={(event) => setNewTask({ ...newTask, deadline: event.target.value })}
                required
              />
            </div>
            <textarea
              className="w-full rounded border p-2"
              placeholder="Task description"
              value={newTask.description}
              onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}
            />
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Save Task</button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="deadlineFilter" className="text-sm text-slate-600">
                Deadline up to:
              </label>
              <input
                id="deadlineFilter"
                type="date"
                className="rounded border p-2"
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value)}
              />
              <button type="button" onClick={() => refreshAll(deadlineFilter)} className="rounded bg-slate-700 px-3 py-2 text-white">
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : (
            <div className="space-y-3">
              {tasks.length === 0 && <p className="text-slate-600">No tasks found.</p>}
              {tasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>{task.priority}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Project: {projectNameById(task.project)}</p>
                  <p className="text-sm text-slate-600">Deadline: {task.deadline}</p>
                  <p className="text-sm text-slate-600">Status: {task.status}</p>
                  {task.is_overdue && <p className="text-sm font-semibold text-red-600">Overdue</p>}
                  <div className="mt-3 flex gap-2">
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => updateStatus(task, status)}
                        className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, isAuthenticated, logout, getUserInfo } from './auth';
import Login from './Login';
import Register from './Register';
import FileUpload from './components/FileUpload';
import Chatbot from './components/Chatbot';
// Dashboard and Profile are used via routing, not directly in this component
// import Dashboard from './components/Dashboard';
// import Profile from './components/Profile';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  owner_email?: string;
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
  owner_email?: string;
  attachment?: string | null;
  image?: string | null;
}

function App() {
  const API_BASE = 'http://localhost:8000/api';
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [showRegister, setShowRegister] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

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
    deadline: '',
    attachment: null as string | null,
    image: null as string | null,
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState({
    project: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    deadline: '',
    attachment: null as string | null,
    image: null as string | null,
  });
  const [editProjectData, setEditProjectData] = useState({ name: '', description: '' });

  const [projectNameError, setProjectNameError] = useState('');
  const [projectDescError, setProjectDescError] = useState('');
  const [taskTitleError, setTaskTitleError] = useState('');
  const [taskDescError, setTaskDescError] = useState('');
  const [taskDeadlineError, setTaskDeadlineError] = useState('');
  const [taskProjectError, setTaskProjectError] = useState('');
  const [editTaskErrors, setEditTaskErrors] = useState({ title: '', deadline: '' });
  const [editProjectErrors, setEditProjectErrors] = useState({ name: '' });

  const priorityBadge = useMemo(
    () => ({
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-green-100 text-green-700',
    }),
    []
  );

  const validateProjectName = (name: string): string => {
    if (!name.trim()) return 'Project name is required.';
    if (name.length > 150) return 'Project name must be ≤150 characters.';
    return '';
  };
  const validateProjectDesc = (desc: string): string => {
    if (desc.length > 500) return 'Description must be ≤500 characters.';
    return '';
  };
  const validateTaskTitle = (title: string): string => {
    if (!title.trim()) return 'Task title is required.';
    if (title.length > 200) return 'Task title must be ≤200 characters.';
    return '';
  };
  const validateTaskDesc = (desc: string): string => {
    if (desc.length > 500) return 'Description must be ≤500 characters.';
    return '';
  };
  const validateTaskDeadline = (deadline: string): string => {
    if (!deadline) return 'Deadline is required.';
    const today = new Date().toISOString().split('T')[0];
    if (deadline < today) return 'Deadline cannot be in the past.';
    return '';
  };

  const fetchProjects = async () => {
    const response = await authFetch(`${API_BASE}/projects/`);
    if (!response.ok) throw new Error('Failed to load projects.');
    const data = await response.json();
    setProjects(data);
  };
  const fetchTasks = async (deadline = deadlineFilter) => {
    const query = deadline ? `?deadline_lte=${deadline}` : '';
    const response = await authFetch(`${API_BASE}/tasks/${query}`);
    if (!response.ok) throw new Error('Failed to load tasks.');
    const data = await response.json();
    setTasks(data);
  };
  const fetchOverdue = async () => {
    const response = await authFetch(`${API_BASE}/tasks/overdue/`);
    if (!response.ok) throw new Error('Failed to load overdue data.');
    const data = await response.json();
    setOverdueCount(data.count);
  };
  const refreshAll = async (deadline = deadlineFilter) => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchProjects(), fetchTasks(deadline), fetchOverdue()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getUserInfo()
        .then(data => {
          setUserRole(data.role);
          setUserEmail(data.email);
        })
        .catch(err => console.error('Failed to fetch user info:', err));
      refreshAll();
    }
  }, [isLoggedIn]);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateProjectName(newProject.name);
    const descErr = validateProjectDesc(newProject.description);
    if (nameErr || descErr) {
      setProjectNameError(nameErr);
      setProjectDescError(descErr);
      return;
    }
    setError('');
    setProjectNameError('');
    setProjectDescError('');
    try {
      const response = await authFetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.name?.[0] || errData.description?.[0] || 'Unable to create project.');
      }
      setNewProject({ name: '', description: '' });
      await refreshAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleErr = validateTaskTitle(newTask.title);
    const descErr = validateTaskDesc(newTask.description);
    const deadlineErr = validateTaskDeadline(newTask.deadline);
    const projectErr = !newTask.project ? 'Please select a project.' : '';
    if (titleErr || descErr || deadlineErr || projectErr) {
      setTaskTitleError(titleErr);
      setTaskDescError(descErr);
      setTaskDeadlineError(deadlineErr);
      setTaskProjectError(projectErr);
      return;
    }
    setError('');
    setTaskTitleError('');
    setTaskDescError('');
    setTaskDeadlineError('');
    setTaskProjectError('');

    // Convert project to integer and prepare payload
    const payload = {
      ...newTask,
      project: parseInt(newTask.project),
      attachment: newTask.attachment || null,
      image: newTask.image || null,
    };

    try {
      const response = await authFetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.deadline?.[0] || errData.title?.[0] || 'Unable to create task.');
      }
      setNewTask({
        project: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        deadline: '',
        attachment: null,
        image: null,
      });
      await refreshAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTask = async (taskId: number, data: any) => {
    const titleErr = validateTaskTitle(data.title);
    const deadlineErr = validateTaskDeadline(data.deadline);
    if (titleErr || deadlineErr) {
      setEditTaskErrors({ title: titleErr, deadline: deadlineErr });
      return;
    }
    setEditTaskErrors({ title: '', deadline: '' });
    const payload = {
      project: data.project,
      title: data.title,
      description: data.description,
      priority: data.priority,
      deadline: data.deadline,
      status: data.status,
      attachment: data.attachment || null,
      image: data.image || null,
    };
    try {
      const response = await authFetch(`${API_BASE}/tasks/${taskId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Unable to update task.');
      setEditingTask(null);
      await refreshAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateProject = async (projectId: number, data: { name: string; description: string }) => {
    const nameErr = validateProjectName(data.name);
    if (nameErr) {
      setEditProjectErrors({ name: nameErr });
      return;
    }
    setEditProjectErrors({ name: '' });
    try {
      const response = await authFetch(`${API_BASE}/projects/${projectId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description }),
      });
      if (!response.ok) throw new Error('Unable to update project.');
      setEditingProject(null);
      await refreshAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canModify = (ownerEmail?: string) => {
    if (userRole === 'admin') return true;
    return ownerEmail === userEmail;
  };

  const deleteTask = async (taskId: number, ownerEmail?: string) => {
    if (!canModify(ownerEmail)) {
      setError('You do not have permission to delete this task.');
      return;
    }
    if (window.confirm('Delete this task permanently?')) {
      try {
        await authFetch(`${API_BASE}/tasks/${taskId}/`, { method: 'DELETE' });
        await refreshAll();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const deleteProject = async (projectId: number, ownerEmail?: string) => {
    if (!canModify(ownerEmail)) {
      setError('You do not have permission to delete this project.');
      return;
    }
    if (window.confirm('Delete this project and all its tasks? This cannot be undone.')) {
      try {
        await authFetch(`${API_BASE}/projects/${projectId}/`, { method: 'DELETE' });
        await refreshAll();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const updateStatus = async (task: Task, status: TaskStatus) => {
    setError('');
    try {
      const response = await authFetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Permission denied');
      }
      await refreshAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const projectNameById = (id: number) => projects.find((p) => p.id === id)?.name || 'Unknown Project';

  const openEditTask = (task: Task) => {
    if (!canModify(task.owner_email)) {
      setError('You do not have permission to edit this task.');
      return;
    }
    setEditingTask(task);
    setEditFormData({
      project: String(task.project),
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      attachment: task.attachment || null,
      image: task.image || null,
    });
    setEditTaskErrors({ title: '', deadline: '' });
  };

  const openEditProject = (project: Project) => {
    if (!canModify(project.owner_email)) {
      setError('You do not have permission to edit this project.');
      return;
    }
    setEditingProject(project);
    setEditProjectData({ name: project.name, description: project.description });
    setEditProjectErrors({ name: '' });
  };

  if (!isLoggedIn) {
    return showRegister ? (
      <Register
        onRegisterSuccess={() => setShowRegister(false)}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLoginSuccess={() => setIsLoggedIn(true)}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-6 shadow flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Task Management</h1>
            <p className="mt-2 text-slate-600">Manage projects, tasks, deadlines</p>
            <p className="mt-3 inline-block rounded bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
              Overdue Tasks: {overdueCount}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="rounded bg-green-600 px-4 py-2 text-white">Dashboard</button>
            <button onClick={() => navigate('/profile')} className="rounded bg-indigo-600 px-4 py-2 text-white">Profile</button>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">Role: {userRole || 'User'}</span>
            <button onClick={() => { logout(); setIsLoggedIn(false); }} className="rounded bg-red-600 px-4 py-2 text-white">Logout</button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Create forms */}
        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={handleProjectSubmit} className="rounded-xl bg-white p-6 shadow space-y-3">
            <h2 className="text-lg font-semibold">Create Project</h2>
            <div>
              <input className="w-full rounded border p-2" placeholder="Project name" value={newProject.name}
                onChange={(e) => { setNewProject({ ...newProject, name: e.target.value }); setProjectNameError(validateProjectName(e.target.value)); }} required />
              {projectNameError && <p className="text-red-500 text-xs mt-1">{projectNameError}</p>}
            </div>
            <div>
              <textarea className="w-full rounded border p-2" placeholder="Description" value={newProject.description}
                onChange={(e) => { setNewProject({ ...newProject, description: e.target.value }); setProjectDescError(validateProjectDesc(e.target.value)); }} />
              {projectDescError && <p className="text-red-500 text-xs mt-1">{projectDescError}</p>}
            </div>
            <button className="rounded bg-slate-800 px-4 py-2 text-white">Save Project</button>
          </form>

          <form onSubmit={handleTaskSubmit} className="rounded-xl bg-white p-6 shadow space-y-3">
            <h2 className="text-lg font-semibold">Add Task</h2>
            <select className="w-full rounded border p-2" value={newTask.project}
              onChange={(e) => { setNewTask({ ...newTask, project: e.target.value }); setTaskProjectError(''); }} required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {taskProjectError && <p className="text-red-500 text-xs mt-1">{taskProjectError}</p>}
            <input className="w-full rounded border p-2" placeholder="Task title" value={newTask.title}
              onChange={(e) => { setNewTask({ ...newTask, title: e.target.value }); setTaskTitleError(validateTaskTitle(e.target.value)); }} required />
            {taskTitleError && <p className="text-red-500 text-xs mt-1">{taskTitleError}</p>}
            <textarea className="w-full rounded border p-2" placeholder="Description" value={newTask.description}
              onChange={(e) => { setNewTask({ ...newTask, description: e.target.value }); setTaskDescError(validateTaskDesc(e.target.value)); }} />
            {taskDescError && <p className="text-red-500 text-xs mt-1">{taskDescError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded border p-2" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as Priority })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
              <div>
                <input type="date" className="rounded border p-2 w-full" value={newTask.deadline}
                  onChange={(e) => { setNewTask({ ...newTask, deadline: e.target.value }); setTaskDeadlineError(validateTaskDeadline(e.target.value)); }} required />
                {taskDeadlineError && <p className="text-red-500 text-xs mt-1">{taskDeadlineError}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (any file)</label>
              <FileUpload onUploadSuccess={(url: string) => setNewTask(prev => ({ ...prev, attachment: url }))} accept="*/*" label="Upload Attachment" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <FileUpload onUploadSuccess={(url: string) => setNewTask(prev => ({ ...prev, image: url }))} accept="image/*" label="Upload Image" />
            </div>
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Save Task</button>
          </form>
        </div>

        {/* Projects List */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Projects</h2>
          {projects.length === 0 ? <p>No projects yet.</p> : (
            <div className="space-y-3">
              {projects.map(proj => (
                <div key={proj.id} className="rounded-lg border p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{proj.name}</h3>
                    <p className="text-sm text-slate-600">{proj.description || 'No description'}</p>
                    <p className="text-xs text-slate-400">Owner: {proj.owner_email || 'Unknown'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditProject(proj)} className="rounded bg-blue-500 px-3 py-1 text-white text-sm">Edit</button>
                    <button onClick={() => deleteProject(proj.id, proj.owner_email)} className="rounded bg-red-500 px-3 py-1 text-white text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="flex gap-2">
              <input type="date" className="rounded border p-2" value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)} />
              <button onClick={() => refreshAll(deadlineFilter)} className="rounded bg-slate-700 px-3 py-2 text-white">Filter</button>
            </div>
          </div>
          {loading ? <p>Loading...</p> : (
            <div className="space-y-3">
              {tasks.length === 0 && <p>No tasks found.</p>}
              {tasks.map(task => (
                <div key={task.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm">Project: {projectNameById(task.project)}</p>
                      <p className="text-sm">Deadline: {task.deadline}</p>
                      <p className="text-sm">Status: {task.status}</p>
                      {task.attachment && (
                        <p className="text-xs text-blue-600"><a href={task.attachment} target="_blank" rel="noopener noreferrer">📎 Attachment</a></p>
                      )}
                      {task.image && (
                        <img src={task.image} alt="task" className="mt-2 max-h-32 rounded border" />
                      )}
                      <p className="text-xs text-slate-400">Owner: {task.owner_email || 'Unknown'}</p>
                      {task.is_overdue && <p className="text-sm font-semibold text-red-600">Overdue</p>}
                    </div>
                    <div className="flex gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>{task.priority}</span>
                      <button onClick={() => openEditTask(task)} className="rounded bg-blue-500 px-2 py-1 text-white text-xs">Edit</button>
                      <button onClick={() => deleteTask(task.id, task.owner_email)} className="rounded bg-red-500 px-2 py-1 text-white text-xs">Delete</button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map(status => (
                      <button key={status} onClick={() => updateStatus(task, status)} className="rounded border px-2 py-1 text-xs hover:bg-slate-100">{status}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Edit Task</h2>
            <select className="w-full rounded border p-2" value={editFormData.project} onChange={e => setEditFormData({ ...editFormData, project: e.target.value })}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div>
              <input className="w-full rounded border p-2" placeholder="Title" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
              {editTaskErrors.title && <p className="text-red-500 text-xs">{editTaskErrors.title}</p>}
            </div>
            <textarea className="w-full rounded border p-2" placeholder="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
            <select className="w-full rounded border p-2" value={editFormData.priority} onChange={e => setEditFormData({ ...editFormData, priority: e.target.value as Priority })}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </select>
            <div>
              <input type="date" className="w-full rounded border p-2" value={editFormData.deadline} onChange={e => setEditFormData({ ...editFormData, deadline: e.target.value })} />
              {editTaskErrors.deadline && <p className="text-red-500 text-xs">{editTaskErrors.deadline}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Attachment</label>
              <FileUpload onUploadSuccess={(url: string) => setEditFormData(prev => ({ ...prev, attachment: url }))} accept="*/*" label="Replace Attachment" currentFileUrl={editFormData.attachment || undefined} />
            </div>
            <div>
              <label className="block text-sm font-medium">Image</label>
              <FileUpload onUploadSuccess={(url: string) => setEditFormData(prev => ({ ...prev, image: url }))} accept="image/*" label="Replace Image" currentFileUrl={editFormData.image || undefined} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTask(null)} className="rounded border px-4 py-2">Cancel</button>
              <button onClick={() => updateTask(editingTask.id, { ...editFormData, project: parseInt(editFormData.project), status: editingTask.status })} className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Edit Project</h2>
            <input className="w-full rounded border p-2" placeholder="Project name" value={editProjectData.name} onChange={e => setEditProjectData({ ...editProjectData, name: e.target.value })} />
            {editProjectErrors.name && <p className="text-red-500 text-xs">{editProjectErrors.name}</p>}
            <textarea className="w-full rounded border p-2" placeholder="Description" value={editProjectData.description} onChange={e => setEditProjectData({ ...editProjectData, description: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingProject(null)} className="rounded border px-4 py-2">Cancel</button>
              <button onClick={() => updateProject(editingProject.id, editProjectData)} className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
}

export default App;
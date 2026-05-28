import React, { useEffect, useState } from 'react';
import { authFetch } from '../auth';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardStats {
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  project_count: number;
  recent_tasks: { id: number; title: string; status: string; deadline: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    project_count: 0,
    recent_tasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch('/dashboard/stats/');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const chartData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        label: 'Task Count',
        data: [stats.todo, stats.in_progress, stats.done],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">To Do</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.todo}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.in_progress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Done</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.done}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
        </div>
      </div>

      {/* Chart and project count row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Status</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Projects</p>
          <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.project_count}</p>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recent_tasks.length === 0 ? (
            <p className="text-gray-500 p-6 text-center">No tasks yet.</p>
          ) : (
            stats.recent_tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <p className="font-medium text-gray-900">{task.title}</p>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                  <span>Status: <span className="font-medium">{task.status}</span></span>
                  <span>Deadline: <span className="font-medium">{task.deadline}</span></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
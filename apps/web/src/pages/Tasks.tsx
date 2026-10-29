import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import api from '../lib/api';

export const Tasks: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'CALL',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', {
        params: { status: statusFilter || undefined },
      });
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...newTask,
        dueDate: new Date(newTask.dueDate).toISOString(),
      });
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        type: 'CALL',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Sales Tasks & Follow-up Queue</h1>
          <p className="text-sm text-slate-400">Never miss a renewal, PRO callback, or Etisalat quote submission</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(99,102,241,0.15)] pb-3">
        {['', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st === '' ? 'All Tasks' : st.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading task queue...</div>
        ) : tasks.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400/50 mb-3" />
            <span>No tasks found in this view. Great job!</span>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`glass-card p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted ? 'opacity-60 bg-[#0f1629]/40' : 'hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.status)}
                    className={`mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-500 hover:border-indigo-400'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div>
                    <h2 className={`font-semibold text-slate-200 text-sm ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </h2>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                      {task.company && (
                        <span className="flex items-center gap-1 text-indigo-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{task.company.name}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>

                      <span className="flex items-center gap-1 text-slate-400 capitalize">
                        {task.type === 'CALL' && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                        {task.type === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-indigo-400" />}
                        {task.type === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-green-400" />}
                        <span>{task.type?.toLowerCase()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      task.priority === 'URGENT' || task.priority === 'HIGH'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="badge-purple text-xs uppercase">{task.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold font-display text-white mb-4">Create Sales Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="label">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Follow up on SIM plan contract"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Specific details for this action..."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  required
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(99,102,241,0.15)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

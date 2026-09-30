import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { CheckCircle2, Clock, MapPin, Camera, Play, CheckCheck, RefreshCw } from 'lucide-react';

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/operations/tasks/');
      setTasks(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTransitioning(true);
      await api.post(`/api/operations/tasks/${taskId}/transition/`, {
        status: newStatus,
        notes: notes || undefined,
      });
      setNotes('');
      fetchTasks();
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert('Error updating task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTransitioning(false);
    }
  };

  // Convert tasks to report markers for map
  const taskReports = tasks
    .filter(t => t.report)
    .map(t => ({
      ...t.report,
      id: t.report.id,
      title: `[Task #${t.id}] ${t.report.title}`,
      priority_level: t.report.priority_level,
      status: t.status,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Field Sanitation Operative
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">Today's Assigned Route</h1>
          <p className="text-teal-100 mt-1 max-w-xl text-sm">
            Access assigned waste heaps, update cleaning status in real-time, and log before/after verification evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">{tasks.length}</div>
            <div className="text-[11px] text-teal-200">Total Route Jobs</div>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">
              {tasks.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div className="text-[11px] text-teal-200">Cleared Today</div>
          </div>
        </div>
      </div>

      {/* Route Map */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Active work route coordinates</span>
          <span className="font-semibold text-slate-700">Click a marker to review job details</span>
        </div>
        <MapView
          height="380px"
          items={taskReports}
          onItemClick={(item) => {
            const matched = tasks.find(t => t.report?.id === item.id);
            if (matched) setSelectedTask(matched);
          }}
        />
      </div>

      {/* Task List and Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Assigned Dispatch Queue</h3>
            <button onClick={fetchTasks} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-5 cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  selectedTask?.id === task.id ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Job #{task.id}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    {task.report ? task.report.title : task.pickup ? `Pickup: ${task.pickup.waste_type}` : 'General Sanitation Job'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>{task.report?.address || task.pickup?.address || 'Site Coordinates'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.report?.priority_level && (
                    <PriorityBadge
                      level={task.report.priority_level}
                      score={task.report.priority_score}
                      factors={task.report.priority_factors}
                    />
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-400">No tasks assigned to this route.</div>
            )}
          </div>
        </div>

        {/* Task Inspector & Control Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Field Action Panel</h3>

          {selectedTask ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Current Job</div>
                <div className="font-bold text-slate-900 text-sm">#{selectedTask.id} - {selectedTask.report?.title || 'Sanitation Task'}</div>
                <div className="text-slate-600">{selectedTask.report?.address || selectedTask.pickup?.address}</div>
                <div className="pt-2 flex items-center justify-between">
                  <StatusBadge status={selectedTask.status} />
                  <span className="text-[10px] text-slate-400">Updated {new Date(selectedTask.updated_at || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Cleanup Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Cleared 2 tons of mixed plastic using loader vehicle..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedTask.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask.id, 'IN_PROGRESS')}
                    disabled={transitioning}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4" /> Start Cleaning Work
                  </button>
                )}

                {selectedTask.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask.id, 'COMPLETED')}
                    disabled={transitioning}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark as Fully Resolved
                  </button>
                )}

                {selectedTask.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-center font-bold">
                    ✓ Job Completed & Submitted
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select a task from the list or map to start cleaning or mark resolution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

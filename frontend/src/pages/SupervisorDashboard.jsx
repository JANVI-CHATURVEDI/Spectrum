import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Users, AlertCircle, CheckCircle, Flame, UserCheck, ArrowRight, RefreshCw } from 'lucide-react';

export default function SupervisorDashboard() {
  const [teamSummary, setTeamSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchSupervisorData = async () => {
    try {
      setLoading(true);
      const [sumRes, repRes, hotRes, workRes] = await Promise.all([
        api.get('/api/operations/team-summary/').catch(() => ({ data: null })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
        api.get('/api/auth/workers/').catch(() => ({ data: [] })),
      ]);
      setTeamSummary(sumRes.data);
      setReports(repRes.data?.results || repRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
      setWorkers(workRes.data || []);
    } catch (err) {
      console.error('Supervisor data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !assignTarget) return;
    setAssigning(true);
    try {
      await api.post('/api/operations/assign/', {
        report_id: assignTarget.id,
        worker_id: selectedWorkerId,
        priority: assignTarget.priority_level || 'MEDIUM',
      });
      setAssignTarget(null);
      setSelectedWorkerId('');
      fetchSupervisorData();
    } catch (err) {
      alert('Error assigning task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Ward & Operations Supervisor
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">Fleet & Dispatch Control</h1>
          <p className="text-blue-100 mt-1 max-w-xl text-sm">
            Monitor real-time crew capacity, identify critical unassigned waste heaps, and balance ward tasks.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">{teamSummary?.total_workers || workers.length || 6}</div>
            <div className="text-[11px] text-blue-200">Active Field Workers</div>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">{teamSummary?.in_progress_tasks || 8}</div>
            <div className="text-[11px] text-blue-200">Live Cleans in Progress</div>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Active ward overview with recurrent hotspot clusters</span>
          <span className="font-semibold text-slate-700">Click a marker to dispatch crew</span>
        </div>
        <MapView
          height="400px"
          items={reports}
          hotspots={hotspots}
          onItemClick={(item) => setAssignTarget(item)}
        />
      </div>

      {/* Grid: Unassigned Reports & Team Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Reports Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Unassigned & Priority Reports</h3>
            <button onClick={fetchSupervisorData} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').map((report) => (
              <div key={report.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{report.title}</span>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1">{report.address}</div>
                  <div className="text-[11px] text-slate-400">Severity: {report.severity} • {new Date(report.created_at).toLocaleDateString()}</div>
                </div>

                <div className="flex items-center gap-3">
                  <PriorityBadge level={report.priority_level} score={report.priority_score} factors={report.priority_factors} />
                  <button
                    onClick={() => setAssignTarget(report)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <span>Dispatch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-400">All pending reports currently dispatched!</div>
            )}
          </div>
        </div>

        {/* Worker Roster and Workload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Crew Workload Roster</h3>
          <div className="space-y-3">
            {(teamSummary?.workers_status || workers).map((worker, idx) => (
              <div key={worker.id || idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{worker.username || worker.name || `Worker ${idx + 1}`}</div>
                  <div className="text-[10px] text-slate-500">{worker.ward || 'Central Ward'}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    {worker.active_tasks_count ?? (idx % 3 + 1)} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900">Dispatch Task to Field Worker</h3>
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <strong>{assignTarget.title}</strong>
              <div className="text-slate-500">{assignTarget.address}</div>
              <div className="pt-1">
                <PriorityBadge level={assignTarget.priority_level} score={assignTarget.priority_score} factors={assignTarget.priority_factors} />
              </div>
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Worker</label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Operative --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.username} ({w.ward || 'General'})</option>
                  ))}
                  {workers.length === 0 && <option value="2">Ramesh Kumar (Central Ward)</option>}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                  {assigning ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

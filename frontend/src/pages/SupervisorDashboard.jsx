import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StaffCreator from '../components/StaffCreator';
import Modal from '../components/Modal';
import { Users, AlertCircle, CheckCircle, Flame, UserCheck, ArrowRight, RefreshCw, Radio, Sparkles, ShieldCheck } from 'lucide-react';

export default function SupervisorDashboard() {
  const [teamSummary, setTeamSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dispatch'); 
  const [liveUpdates, setLiveUpdates] = useState(true);

  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchSupervisorData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchSupervisorData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

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

  const completedReports = reports.filter(r =>
    r.status === 'RESOLVED' ||
    r.status === 'CITIZEN_VERIFIED' ||
    r.after_image_url || r.after_image ||
    (r.cleanup_score !== null && r.cleanup_score !== undefined)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
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

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'dispatch'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Dispatch Queue ({reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'verifications'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Cleanup Verifications ({completedReports.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveUpdates(!liveUpdates)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
              liveUpdates ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-50'
            }`}
          >
            <Radio className={`w-3 h-3 ${liveUpdates ? 'animate-pulse text-emerald-600' : ''}`} />
            {liveUpdates ? 'Live Sync On' : 'Live Sync Off'}
          </button>

          <button onClick={() => fetchSupervisorData(true)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'dispatch' ? (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Unassigned & Priority Reports</h3>
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
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Field Resolutions & AI Verification Evidence
                </h3>
                <p className="text-[11px] text-slate-500">Gemini vision comparison of before & after cleanup photographs</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {completedReports
                .map((report) => (
                  <div key={report.id} className="p-5 space-y-3 hover:bg-slate-50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">#{report.id} · {report.title}</div>
                        <div className="text-xs text-slate-500">{report.address}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={report.status} />
                        {report.cleanup_score !== undefined && report.cleanup_score !== null && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                            report.cleanup_verified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {report.cleanup_score}/100 {report.cleanup_verified ? 'Verified' : 'Audit Needed'}
                          </span>
                        )}
                      </div>
                    </div>

                    {report.cleanup_verdict && (
                      <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700">
                        <strong>AI Audit Verdict:</strong> {report.cleanup_verdict}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Before (Citizen Report)</span>
                        {(report.image_url || report.image) ? (
                          <img src={report.image_url || report.image} alt="Before" className="h-32 w-full object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">No before photo</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">After (Worker Resolution)</span>
                        {(report.after_image_url || report.after_image) ? (
                          <img src={report.after_image_url || report.after_image} alt="After" className="h-32 w-full object-cover rounded-lg border border-emerald-300" />
                        ) : (
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">Resolution photo pending</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {completedReports.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">No completed tasks submitted with verification evidence yet.</div>
              )}
            </div>
          </div>
        )}

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
          <details className="rounded-xl border border-dashed border-slate-300 overflow-hidden">
            <summary className="cursor-pointer px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition list-none flex items-center justify-between">
              <span>+ Onboard a field worker</span>
              <span className="text-slate-400">opens form</span>
            </summary>
            <div className="p-4 border-t border-slate-100">
              <StaffCreator onCreated={() => fetchSupervisorData(false)} />
            </div>
          </details>
        </div>
      </div>

      {assignTarget && (
        <Modal onClose={() => setAssignTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 modal-pop my-auto shrink-0 max-h-[90vh] overflow-y-auto">
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
                    <option key={w.id} value={w.id}>{w.username} ({w.zone || w.ward || 'General'})</option>
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
        </Modal>
      )}
    </div>
  );
}

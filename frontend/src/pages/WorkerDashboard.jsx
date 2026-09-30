import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { CheckCircle2, Clock, MapPin, Camera, Play, CheckCheck, RefreshCw, Navigation, Radio, Sparkles } from 'lucide-react';

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [notes, setNotes] = useState('');
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [precheck, setPrecheck] = useState(null);
  const [prechecking, setPrechecking] = useState(false);

  const fetchTasks = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/api/operations/tasks/');
      setTasks(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchTasks(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  const runPrecheck = async (file) => {
    const reportId = getTaskReport(selectedTask)?.id;
    if (!file || !reportId) {
      setPrecheck(null);
      return;
    }
    setPrechecking(true);
    setPrecheck(null);
    try {
      const fd = new FormData();
      fd.append('report_id', reportId);
      fd.append('after_image', file);
      const res = await api.post('/api/ai/verify-cleanup/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPrecheck(res.data);
    } catch {
      setPrecheck(null);
    } finally {
      setPrechecking(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTransitioning(true);
      let payload;
      let headers = {};
      if (afterPhoto && newStatus === 'COMPLETED') {
        payload = new FormData();
        payload.append('status', newStatus);
        payload.append('notes', notes || 'Sanitation team finished clearing and disinfecting site.');
        payload.append('after_image', afterPhoto);
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = {
          status: newStatus,
          notes: notes || undefined,
        };
      }

      const res = await api.post(`/api/operations/tasks/${taskId}/transition/`, payload, { headers });
      setNotes('');
      setAfterPhoto(null);
      setPhotoPreview(null);
      setPrecheck(null);
      await fetchTasks(false);
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { 
          ...prev, 
          status: newStatus,
          report_details: res.data?.report_details || prev.report_details,
        } : null);
      }
    } catch (err) {
      alert('Error updating task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTransitioning(false);
    }
  };

  const getTaskReport = (t) => t.report_details || (typeof t.report === 'object' ? t.report : null);
  const getTaskPickup = (t) => t.pickup_details || (typeof t.pickup === 'object' ? t.pickup : null);

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const orderedTasks = useMemo(() => {
    if (!optimizeRoute || tasks.length <= 1) return tasks;

    const unvisited = [...tasks];
    const pWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    unvisited.sort((a, b) => {
      const repA = getTaskReport(a);
      const repB = getTaskReport(b);
      const wA = pWeights[repA?.priority_level] || 1;
      const wB = pWeights[repB?.priority_level] || 1;
      return wB - wA;
    });

    const route = [];
    let current = unvisited.shift();
    route.push(current);

    while (unvisited.length > 0) {
      const curRep = getTaskReport(current);
      const curLat = parseFloat(curRep?.latitude || 28.628);
      const curLng = parseFloat(curRep?.longitude || 77.218);

      let bestIdx = 0;
      let bestScore = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const nextRep = getTaskReport(unvisited[i]);
        const nextLat = parseFloat(nextRep?.latitude || curLat);
        const nextLng = parseFloat(nextRep?.longitude || curLng);
        const dist = getDistanceKm(curLat, curLng, nextLat, nextLng);
        const pWeight = pWeights[nextRep?.priority_level] || 1;
        const cost = dist / (pWeight * 1.5);
        if (cost < bestScore) {
          bestScore = cost;
          bestIdx = i;
        }
      }

      current = unvisited.splice(bestIdx, 1)[0];
      route.push(current);
    }
    return route;
  }, [tasks, optimizeRoute]);

  const routePolyline = useMemo(() => {
    if (!optimizeRoute) return null;
    return orderedTasks
      .map(t => {
        const rep = getTaskReport(t);
        return rep ? [parseFloat(rep.latitude), parseFloat(rep.longitude)] : null;
      })
      .filter(Boolean);
  }, [orderedTasks, optimizeRoute]);

  const taskReports = orderedTasks
    .map((t, idx) => {
      const rep = getTaskReport(t);
      if (!rep) return null;
      return {
        ...rep,
        id: rep.id,
        title: `[#${idx + 1} - Job #${t.id}] ${rep.title}`,
        priority_level: rep.priority_level,
        status: t.status,
        route_order: optimizeRoute ? `${idx + 1}` : '',
      };
    })
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-gradient-to-r from-teal-700 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Field Sanitation Operative
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">Today's Assigned Route</h1>
          <p className="text-teal-100 mt-1 max-w-xl text-sm">
            Access assigned waste heaps, optimize your collection circuit, and log AI-verified before/after evidence.
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

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">Dispatch Map</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              {optimizeRoute ? 'Showing priority-weighted nearest-neighbour path' : 'Click a marker or job card to begin'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOptimizeRoute(!optimizeRoute)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                optimizeRoute
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {optimizeRoute ? 'Route Optimized (Active)' : 'Optimize Route (Nearest-First)'}
            </button>

            <button
              onClick={() => setLiveUpdates(!liveUpdates)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                liveUpdates ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-50'
              }`}
            >
              <Radio className={`w-3 h-3 ${liveUpdates ? 'animate-pulse text-emerald-600' : ''}`} />
              {liveUpdates ? 'Live Sync On' : 'Live Sync Off'}
            </button>
          </div>
        </div>

        <MapView
          height="390px"
          items={taskReports}
          routePolyline={routePolyline}
          onItemClick={(item) => {
            const matched = tasks.find(t => {
              const rep = getTaskReport(t);
              return rep && rep.id === item.id;
            });
            if (matched) setSelectedTask(matched);
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Assigned Dispatch Queue</h3>
              {optimizeRoute && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Sequential Route
                </span>
              )}
            </div>
            <button onClick={() => fetchTasks(true)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orderedTasks.map((task, idx) => {
              const rep = getTaskReport(task);
              const pick = getTaskPickup(task);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-5 cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    selectedTask?.id === task.id ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {optimizeRoute && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Job #{task.id}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        {rep ? rep.title : pick ? `Pickup: ${pick.waste_type}` : 'General Sanitation Job'}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{rep?.address || pick?.address || 'Site Coordinates'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rep?.priority_level && (
                      <PriorityBadge
                        level={rep.priority_level}
                        score={rep.priority_score}
                        factors={rep.priority_factors}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-400">No tasks assigned to this route.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Field Action Panel</h3>

          {selectedTask ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Current Job</div>
                <div className="font-bold text-slate-900 text-sm">#{selectedTask.id} - {getTaskReport(selectedTask)?.title || 'Sanitation Task'}</div>
                <div className="text-slate-600">{getTaskReport(selectedTask)?.address || getTaskPickup(selectedTask)?.address}</div>
                <div className="pt-2 flex items-center justify-between">
                  <StatusBadge status={selectedTask.status} />
                  <span className="text-[10px] text-slate-400">Updated {new Date(selectedTask.updated_at || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              {getTaskReport(selectedTask)?.image_url && (
                <div>
                  <div className="text-[11px] font-bold text-slate-700 mb-1">Citizen Before Photo:</div>
                  <img
                    src={getTaskReport(selectedTask).image_url}
                    alt="Before"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Cleanup Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Cleared 2 tons of mixed plastic using loader vehicle..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="space-y-3 pt-1">
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
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Completion Photo <span className="text-slate-400 font-normal">(Powers AI Cleanup Verification)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAfterPhoto(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhotoPreview(ev.target.result);
                            reader.readAsDataURL(file);
                            runPrecheck(file);
                          } else {
                            setPhotoPreview(null);
                            setPrecheck(null);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {photoPreview && (
                        <div className="mt-2 relative">
                          <img src={photoPreview} alt="After Preview" className="h-28 w-full object-cover rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => { setAfterPhoto(null); setPhotoPreview(null); setPrecheck(null); }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {prechecking && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
                        AI is comparing before/after photos…
                      </div>
                    )}
                    {precheck && (
                      <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${precheck.verified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI pre-check: {precheck.cleanup_score}/100
                          </span>
                          <span className="font-black uppercase text-[10px]">
                            {precheck.verified ? 'Looks clean' : 'May need more work'}
                          </span>
                        </div>
                        <div className="italic">"{precheck.verdict}"</div>
                        {Array.isArray(precheck.reasons) && precheck.reasons.length > 0 && (
                          <ul className="space-y-0.5">
                            {precheck.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleStatusChange(selectedTask.id, 'COMPLETED')}
                      disabled={transitioning}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <CheckCheck className="w-4 h-4" /> {transitioning ? 'Verifying with AI...' : 'Submit Resolution with Evidence'}
                    </button>
                  </div>
                )}

                {selectedTask.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl space-y-2 border border-emerald-200">
                    <div className="text-center font-bold text-emerald-800">✓ Job Completed & Submitted</div>
                    {getTaskReport(selectedTask)?.cleanup_score !== undefined && (
                      <div className="border-t border-emerald-200 pt-2 text-[11px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Cleanup Score:
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            getTaskReport(selectedTask)?.cleanup_verified ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {getTaskReport(selectedTask)?.cleanup_score}/100 - {getTaskReport(selectedTask)?.cleanup_verified ? 'Verified' : 'Manual Review'}
                          </span>
                        </div>
                        {getTaskReport(selectedTask)?.cleanup_verdict && (
                          <div className="text-slate-600 italic">"{getTaskReport(selectedTask).cleanup_verdict}"</div>
                        )}
                      </div>
                    )}
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

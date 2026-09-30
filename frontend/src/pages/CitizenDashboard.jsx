import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Plus, CheckCircle, RefreshCw, AlertTriangle, Sparkles, Navigation } from 'lucide-react';

export default function CitizenDashboard() {
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'reports' | 'pickups' | 'new-report' | 'new-pickup'
  const [viewTab, setViewTab] = useState('reports');

  // Report Creation State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 28.6280, lng: 77.2180 });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pickup Creation State
  const [pickupType, setPickupType] = useState('BULK');
  const [pickupVolume, setPickupVolume] = useState('MEDIUM');
  const [pickupAddress, setPickupAddress] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Resolution verification state
  const [verifyingReport, setVerifyingReport] = useState(null);
  const [verifyFeedback, setVerifyFeedback] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, pickRes, hotRes, catRes] = await Promise.all([
        api.get('/api/reports/'),
        api.get('/api/pickups/'),
        api.get('/api/hotspots/'),
        api.get('/api/reports/categories/').catch(() => ({ data: [] }))
      ]);
      setReports(repRes.data?.results || repRes.data || []);
      setPickups(pickRes.data?.results || pickRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
      const catData = catRes.data?.results || catRes.data;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Failed to load citizen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Duplicate & AI Check when location or description changes
  const handleAiAssistance = async () => {
    if (!description && !title) return;
    try {
      setAiAnalyzing(true);
      const res = await api.post('/api/ai/classify/', {
        text: `${title} ${description}`,
        latitude: coords.lat,
        longitude: coords.lng
      });
      if (res.data) {
        setAiSummary(res.data);
        if (res.data.suggested_severity) setSeverity(res.data.suggested_severity);
        if (res.data.suggested_category_name && categories.length > 0) {
          const match = categories.find(c => c.name.toLowerCase().includes(res.data.suggested_category_name.toLowerCase()));
          if (match) setCategory(match.id);
        }
      }
    } catch (err) {
      console.error('AI Suggestion error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setCoords({ lat, lng });
    // Check duplicates
    try {
      const dupRes = await api.get(`/api/reports/check-duplicate/?latitude=${lat}&longitude=${lng}&radius_meters=100`);
      if (dupRes.data?.has_duplicate) {
        setDuplicateWarning(dupRes.data.existing_reports[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/reports/', {
        title,
        description,
        category: category || (categories[0]?.id || 1),
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address || 'Current pinned location',
      });
      setTitle('');
      setDescription('');
      setAddress('');
      setAiSummary(null);
      setViewTab('reports');
      fetchData();
    } catch (err) {
      alert('Error creating report: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/pickups/', {
        waste_type: pickupType,
        estimated_volume: pickupVolume,
        latitude: coords.lat,
        longitude: coords.lng,
        address: pickupAddress || 'User Home Address',
        preferred_time: preferredTime || 'Morning (9 AM - 12 PM)',
      });
      setPickupAddress('');
      setViewTab('pickups');
      fetchData();
    } catch (err) {
      alert('Error requesting pickup: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCitizenVerify = async (reportId, isResolved) => {
    try {
      await api.post(`/api/reports/${reportId}/verify/`, {
        is_resolved: isResolved,
        feedback: verifyFeedback || (isResolved ? 'Cleaned up nicely!' : 'Waste still visible'),
      });
      setVerifyingReport(null);
      setVerifyFeedback('');
      fetchData();
    } catch (err) {
      alert('Error submitting verification: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Citizen Dashboard
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">Keep Your City Pristine</h1>
          <p className="text-emerald-100 mt-1 max-w-xl text-sm">
            Empower municipal crews with location-verified waste reports, track pickup progress, and confirm resolutions.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewTab('new-report')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 rounded-xl font-bold hover:bg-emerald-50 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Report Waste
          </button>
          <button
            onClick={() => setViewTab('new-pickup')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/60 border border-emerald-400 text-white rounded-xl font-bold hover:bg-emerald-800 transition text-sm"
          >
            Request Pickup
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setViewTab('reports')}
          className={`pb-3 transition-colors ${viewTab === 'reports' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
        >
          My & City Reports ({reports.length})
        </button>
        <button
          onClick={() => setViewTab('pickups')}
          className={`pb-3 transition-colors ${viewTab === 'pickups' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
        >
          On-Demand Pickups ({pickups.length})
        </button>
      </div>

      {/* Main Interactive Map */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Click on the map or drag the pin to choose an incident spot.</span>
          <span className="font-medium text-slate-700">Recurring hotspots shown with red boundaries</span>
        </div>
        <MapView
          height="420px"
          items={reports}
          pickups={pickups}
          hotspots={hotspots}
          selectedLocation={coords}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Form Modal / Overlay: New Waste Report */}
      {viewTab === 'new-report' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Report a Waste Issue</h2>
                <p className="text-xs text-slate-500 mt-1">Submit a location-verified waste pile or missed collection</p>
              </div>
              <button 
                onClick={() => setViewTab('reports')} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

          {duplicateWarning && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Similar report already detected nearby:</strong> "{duplicateWarning.title}" ({duplicateWarning.status}).
                You can still submit if this is a separate pile or new recurrence.
              </div>
            </div>
          )}

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Short Heading</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overflowing dumpster near community park"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Waste Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {(Array.isArray(categories) ? categories : []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {(!categories || categories.length === 0) && <option value="1">General / Mixed Waste</option>}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Detailed Description</label>
                <button
                  type="button"
                  onClick={handleAiAssistance}
                  disabled={aiAnalyzing || (!title && !description)}
                  className="flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:text-emerald-800"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {aiAnalyzing ? 'Analyzing with AI...' : 'AI Auto-Classify'}
                </button>
              </div>
              <textarea
                rows="3"
                placeholder="Describe the waste situation, accumulation, odor, or hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            {aiSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-emerald-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Suggestion:
                </div>
                <div className="text-emerald-800">{aiSummary.summary || 'Classified from text'}</div>
                <div className="text-emerald-700 text-[11px]">Recommended Severity: <strong>{aiSummary.suggested_severity || severity}</strong></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity / Urgency</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="LOW">Low - Small trash</option>
                  <option value="MEDIUM">Medium - Normal accumulation</option>
                  <option value="HIGH">High - Road blockage / severe overflow</option>
                  <option value="CRITICAL">Critical - Hazardous / medical / toxic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Street Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Pillar 42"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setViewTab('reports')}
                className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Form Overlay: New Pickup Request */}
      {viewTab === 'new-pickup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Request On-Demand Bulk / E-Waste Pickup</h2>
            <button onClick={() => setViewTab('pickups')} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
          </div>

          <form onSubmit={handlePickupSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Waste Stream Type</label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="BULK">Bulky / Furniture</option>
                  <option value="E_WASTE">Electronics & Appliances</option>
                  <option value="CONSTRUCTION">Construction & Demolition</option>
                  <option value="GARDEN">Garden & Organic Waste</option>
                  <option value="HAZARDOUS">Household Hazardous Waste</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Load / Volume</label>
                <select
                  value={pickupVolume}
                  onChange={(e) => setPickupVolume(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="SMALL">Small (1-2 bags or small appliance)</option>
                  <option value="MEDIUM">Medium (Pickup truck half load)</option>
                  <option value="LARGE">Large (Multiple furniture pieces / full truck)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Address / Doorstep</label>
                <input
                  type="text"
                  required
                  placeholder="House #, Street name, Pincode"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Slot</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow Morning (9 AM - 12 PM)"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setViewTab('pickups')}
                className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
              >
                {submitting ? 'Submitting...' : 'Schedule Pickup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Listing Table */}
      {viewTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Active & Resolved Waste Reports</h3>
            <button onClick={fetchData} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{r.description || 'No extended description.'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span>📍 {r.address}</span>
                    <span>• {new Date(r.created_at).toLocaleDateString()}</span>
                    <span>• Cat: {r.category_details?.name || 'General'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <PriorityBadge level={r.priority_level} score={r.priority_score} factors={r.priority_factors} />

                  {/* Citizen Verification prompt if resolved */}
                  {r.status === 'RESOLVED' && !r.verification && (
                    <button
                      onClick={() => setVerifyingReport(r)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      Confirm Cleanup
                    </button>
                  )}
                  {r.verification && (
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                      ✓ Verified by Citizen
                    </span>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-400">No reports submitted yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Pickups Listing */}
      {viewTab === 'pickups' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">On-Demand Pickup Requests</h3>
            <button onClick={fetchData} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {pickups.map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Pickup #{p.id} - {p.waste_type}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-slate-600">Volume: <strong>{p.estimated_volume}</strong> • Slot: {p.preferred_time}</div>
                  <div className="text-[11px] text-slate-400">📍 {p.address}</div>
                </div>
              </div>
            ))}
            {pickups.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-400">No pickup requests found.</div>
            )}
          </div>
        </div>
      )}

      {/* Verification Modal Dialog */}
      {verifyingReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Did the crew resolve this issue?</h3>
            <p className="text-xs text-slate-600">
              Your verification creates transparency and confirms the spot is spotless.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <strong>{verifyingReport.title}</strong>
              <div className="text-slate-500">{verifyingReport.address}</div>
            </div>
            <textarea
              rows="2"
              placeholder="Optional remarks or cleanliness feedback..."
              value={verifyFeedback}
              onChange={(e) => setVerifyFeedback(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            ></textarea>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleCitizenVerify(verifyingReport.id, false)}
                className="px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50 rounded-lg text-xs font-bold hover:bg-rose-100"
              >
                Not Cleaned
              </button>
              <button
                onClick={() => handleCitizenVerify(verifyingReport.id, true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
              >
                Yes, Completely Cleaned!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ImpactCard from '../components/ImpactCard';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckCircle, RefreshCw, AlertTriangle, Sparkles, Navigation } from 'lucide-react';

import { ChevronRight, X, MapPin, Camera } from 'lucide-react';
import { EmptyState, loadJSON, saveJSON } from '../components/ui';

const REPORT_PREFS_KEY = 'swachdrishti.report.prefs.v1';
const REPORT_DRAFT_KEY = 'swachdrishti.report.draft.v1';
const PICKUP_PREFS_KEY = 'swachdrishti.pickup.prefs.v1';
const HOME_SPOT = { lat: 28.6280, lng: 77.2180 };

export default function CitizenDashboard() {
  const { user, refreshUser } = useAuth();
  const [impact, setImpact] = useState({ stats: null, catalog: [] });
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewTab, setViewTab] = useState('reports');
  const [openReport, setOpenReport] = useState(null);
  const [brokenPhotoId, setBrokenPhotoId] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);

  const openReportDetail = (r) => {
    setBrokenPhotoId(null);
    setOpenReport(r);
    if (r && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))) {
      setMapFocus({ lat: Number(r.latitude), lng: Number(r.longitude), key: Date.now() });
    }
  };

  const [title, setTitle] = useState(() => loadJSON(REPORT_DRAFT_KEY, {}).title || '');
  const [description, setDescription] = useState(() => loadJSON(REPORT_DRAFT_KEY, {}).description || '');
  const [category, setCategory] = useState(() => loadJSON(REPORT_PREFS_KEY, {}).category || '');
  const [severity, setSeverity] = useState(() => loadJSON(REPORT_PREFS_KEY, {}).severity || 'MEDIUM');
  const [address, setAddress] = useState(() => loadJSON(REPORT_PREFS_KEY, {}).address || '');
  const [coords, setCoords] = useState(() => {
    const c = loadJSON(REPORT_PREFS_KEY, {}).coords;
    return c && Number.isFinite(c.lat) && Number.isFinite(c.lng) ? { lat: c.lat, lng: c.lng } : { ...HOME_SPOT };
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [pickupType, setPickupType] = useState('BULK');
  const [pickupVolume, setPickupVolume] = useState(() => loadJSON(PICKUP_PREFS_KEY, {}).pickupVolume || 'MEDIUM');
  const [pickupAddress, setPickupAddress] = useState(() => loadJSON(PICKUP_PREFS_KEY, {}).pickupAddress || '');
  const [preferredTime, setPreferredTime] = useState(() => loadJSON(PICKUP_PREFS_KEY, {}).preferredTime || '');

  const [verifyingReport, setVerifyingReport] = useState(null);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    if ((viewTab === 'new-pickup' || viewTab === 'new-report') && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [viewTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, pickRes, hotRes, catRes] = await Promise.all([
        api.get('/api/reports/'),
        api.get('/api/pickups/'),
        api.get('/api/hotspots/'),
        api.get('/api/reports/categories/').catch(() => ({ data: [] }))
      ]);
      try {
        const meRes = await api.get('/api/auth/me/');
        if (meRes.data?.user) refreshUser(meRes.data.user);
        setImpact({ stats: meRes.data?.stats || null, catalog: meRes.data?.badge_catalog?.citizen || [] });
      } catch {
        /* impact card stays hidden when logged out */
      }
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

  const handleAiAssistance = async (customPhoto = null) => {
    const photoToUse = customPhoto || photo;
    if (!description && !title && !photoToUse) return;
    try {
      setAiAnalyzing(true);
      const payload = new FormData();
      payload.append('text', `${title} ${description}`.trim());
      payload.append('latitude', coords.lat);
      payload.append('longitude', coords.lng);
      if (photoToUse) payload.append('image', photoToUse);
      const res = await api.post('/api/ai/classify/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
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

  const handlePhotoSelect = (file) => {
    setPhoto(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
      handleAiAssistance(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setCoords({ lat, lng });
    try {
      const dupRes = await api.get(`/api/reports/check-duplicate/?latitude=${lat}&longitude=${lng}&radius_meters=100`);
      const dup = dupRes.data?.existing_reports?.[0] || dupRes.data?.nearby_incidents?.[0];
      if (dupRes.data?.has_duplicate && dup) {
        setDuplicateWarning(dup);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [locating, setLocating] = useState(false);
  const [gpsFix, setGpsFix] = useState(null);   
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    saveJSON(REPORT_PREFS_KEY, { address, coords, severity, category });
  }, [address, coords, severity, category]);

  useEffect(() => {
    saveJSON(REPORT_DRAFT_KEY, { title, description });
  }, [title, description]);

  useEffect(() => {
    saveJSON(PICKUP_PREFS_KEY, { pickupAddress, pickupVolume, preferredTime });
  }, [pickupAddress, pickupVolume, preferredTime]);

  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsFix({ lat: latitude, lng: longitude, accuracy, at: Date.now() });
        setLocating(false);
        handleLocationSelect(latitude, longitude);
        if (!address.trim()) {
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              { headers: { Accept: 'application/json' } }
            );
            const d = await r.json();
            const a = d.address || {};
            const pretty = [
              [a.house_number, a.road].filter(Boolean).join(' '),
              a.suburb || a.neighbourhood || a.hamlet,
              a.city || a.town || a.village,
            ].filter(Boolean).join(', ') || d.display_name;
            if (pretty) setAddress(pretty.split(',').slice(0, 4).join(','));
          } catch (e) {
            console.warn('reverse geocode skipped', e);
          }
        }
      },
      (err) => {
        setLocating(false);
        setGpsError(
          err.code === 1
            ? 'Location permission denied. Allow it in your browser, or click the map instead.'
            : err.code === 3
              ? 'Location request timed out. Try again.'
              : 'Could not get your location. Click the map to drop the pin instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      alert('Please add a street landmark or area name so the crew can find the spot.');
      return;
    }
    if (!gpsFix && coords.lat === HOME_SPOT.lat && coords.lng === HOME_SPOT.lng) {
      alert('Please drop the pin on the map or tap Detect my live location.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', title);
      payload.append('description', description);
      payload.append('category', category || (categories[0]?.id || 1));
      payload.append('severity', severity);
      payload.append('latitude', coords.lat);
      payload.append('longitude', coords.lng);
      payload.append('address', address.trim());
      if (photo) payload.append('image', photo);

      await api.post('/api/reports/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTitle('');
      setDescription('');
      setAiSummary(null);
      handlePhotoSelect(null);
      setViewTab('reports');
      fetchData();
    } catch (err) {
      alert('Error creating report: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const detectPickupLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocating(false);
        handleLocationSelect(latitude, longitude);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } }
          );
          const d = await r.json();
          if (d.display_name) setPickupAddress(d.display_name.split(',').slice(0, 4).join(','));
        } catch {
          setPickupAddress(`Pinned spot ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      () => {
        setLocating(false);
        setGpsError('Could not get your location. Click the map to drop the pin instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);    try {
      await api.post('/api/pickups/', {
        waste_type: pickupType,
        estimated_volume: pickupVolume,
        latitude: coords.lat,
        longitude: coords.lng,
        address: pickupAddress || 'User Home Address',
        preferred_slot: preferredTime || 'Morning (9:00 AM - 12:00 PM)',
        preferred_time: preferredTime || 'Morning (9:00 AM - 12:00 PM)',
      });
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Citizen Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Keep Your City Pristine</h1>
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

      {user && impact.stats && (
        <ImpactCard
          user={user}
          stats={impact.stats}
          catalog={impact.catalog}
          headline="My Civic Impact"
          subline={`${impact.stats.reports} reports · ${impact.stats.verifications} cleanups confirmed`}
        />
      )}

      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setViewTab('reports')}
          className={`pb-3 transition-colors ${viewTab === 'reports' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
        >
          My & City Reports ({reports.length})
        </button>        <button
          onClick={() => setViewTab('pickups')}
          className={`pb-3 transition-colors ${viewTab === 'pickups' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
        >
          On-Demand Pickups ({pickups.length})
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
          <span>Click on the map or drag the pin to choose an incident spot.</span>
          <div className="flex items-center gap-2">
            {gpsFix && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE · {gpsFix.lat.toFixed(5)}, {gpsFix.lng.toFixed(5)}
              </span>
            )}
            <button
              type="button"
              onClick={detectMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-50 disabled:opacity-60 transition"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
              {locating ? 'Detecting…' : 'Detect my live location'}
            </button>
            <span className="font-medium text-slate-700 hidden sm:inline">Recurring hotspots shown with red boundaries</span>
          </div>
        </div>
        <MapView
          height="420px"
          items={reports}
          pickups={pickups}
          hotspots={hotspots}
          selectedLocation={coords}
          onLocationSelect={handleLocationSelect}
          focusRequest={mapFocus}
        />
      </div>

      {viewTab === 'new-report' && (
        <Modal onClose={() => setViewTab('reports')}>
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
                  disabled={aiAnalyzing || (!title && !description && !photo)}
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

            {}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo Evidence <span className="font-normal text-slate-400">(optional, improves AI accuracy)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => handlePhotoSelect(null)}
                    className="text-[11px] text-rose-600 font-semibold whitespace-nowrap"
                  >
                    Remove
                  </button>
                )}
              </div>
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="mt-2 h-24 rounded-lg border border-slate-200 object-cover" />
              )}
            </div>

            {aiSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-emerald-900 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggestion:
                  </span>
                  {aiSummary.ai_suggested && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wide">
                      AI suggested - you can override
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-emerald-600 bg-white/70 px-1.5 py-0.5 rounded">
                    {aiSummary.source === 'gemini_vision' ? 'Vision' : aiSummary.source === 'gemini' ? 'Gemini' : 'Heuristic fallback'}
                    {aiSummary.confidence ? ` · ${Math.round(aiSummary.confidence * 100)}%` : ''}
                  </span>
                </div>
                <div className="text-emerald-800">{aiSummary.summary || 'Classified from text'}</div>
                <div className="text-emerald-700 text-[11px]">
                  Recommended Severity: <strong>{aiSummary.suggested_severity || severity}</strong>
                  {' · '}Category: <strong>{aiSummary.suggested_category_name || 'Mixed waste'}</strong>
                  {aiSummary.estimated_volume && (<> {' · '}Est. volume: <strong>{aiSummary.estimated_volume}</strong></>)}
                </div>
                {(aiSummary.suggested_title || aiSummary.suggested_description) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (aiSummary.suggested_title) setTitle(aiSummary.suggested_title);
                      if (aiSummary.suggested_description) setDescription(aiSummary.suggested_description);
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Use AI draft for title & description
                  </button>
                )}
                {Array.isArray(aiSummary.hazard_flags) && aiSummary.hazard_flags.filter(h => h && h !== 'none').length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiSummary.hazard_flags.filter(h => h && h !== 'none').map((h) => (
                      <span key={h} className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                        ⚠ {h.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {aiSummary.translated_text && (
                  <div className="text-[11px] text-emerald-600 border-t border-emerald-200 pt-1">
                    Translated from {aiSummary.detected_language}: "{aiSummary.translated_text}"
                  </div>
                )}
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Location / Street Landmark <span className="text-rose-500">*</span></label>
                  <button
                    type="button"
                    onClick={detectMyLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 disabled:opacity-60 transition shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
                    {locating ? 'Detecting…' : 'Detect my live location'}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Required — e.g. Near Metro Pillar 42"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {gpsFix && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE · {gpsFix.lat.toFixed(5)}, {gpsFix.lng.toFixed(5)}
                    </span>
                    <span className="text-slate-400">
                      ±{Math.round(gpsFix.accuracy)}m · {new Date(gpsFix.at).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGpsFix(null)}
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      clear
                    </button>
                  </div>
                )}
                {gpsError && (
                  <div className="mt-1.5 text-[11px] text-rose-600 font-semibold">{gpsError}</div>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {(address || coords.lat !== HOME_SPOT.lat || coords.lng !== HOME_SPOT.lng)
                      ? '✓ Spot remembered for your next report'
                      : 'Spot saves automatically as you type'}
                  </span>
                  {(address || coords.lat !== HOME_SPOT.lat || coords.lng !== HOME_SPOT.lng) && (
                    <button
                      type="button"
                      onClick={() => { setAddress(''); setCoords({ ...HOME_SPOT }); setGpsFix(null); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
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
        </Modal>
      )}

      {viewTab === 'new-pickup' && (
        <div ref={formRef} className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 scroll-mt-4">
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

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-700">
                <span className="font-bold">Pickup location: </span>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                <span className="block text-[11px] text-slate-500">Move the map pin or use GPS — these coordinates are sent with your request.</span>
              </div>
              <button
                type="button"
                onClick={detectPickupLocation}
                disabled={locating}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5" /> {locating ? 'Locating…' : 'Use my GPS location'}
              </button>
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
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => openReportDetail(r)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReportDetail(r); } }}
                title="Open issue details"
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-emerald-50/40 focus:bg-emerald-50/60 focus:outline-none transition cursor-pointer group"
              >
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

                  {}
                  {r.status === 'RESOLVED' && !(r.citizen_verification || r.verification) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setVerifyingReport(r); }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      Confirm Cleanup
                    </button>
                  )}
                  {(r.citizen_verification || r.verification) && (
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                      ✓ Verified by Citizen
                    </span>
                  )}

                  <span className="hidden sm:flex items-center text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition">
                    Open <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
            {reports.length === 0 && !loading && (
              <EmptyState
                title="No reports yet"
                sub="Be the first to flag a waste issue in your ward — it takes under a minute."
              />
            )}
          </div>
        </div>
      )}

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
                  <div className="text-xs text-slate-600">Volume: <strong>{p.estimated_volume}</strong> • Slot: {p.preferred_slot || p.preferred_time}</div>
                  <div className="text-[11px] text-slate-400">📍 {p.address}</div>
                </div>
              </div>
            ))}
            {pickups.length === 0 && !loading && (
              <EmptyState
                title="No pickup requests"
                sub="Schedule a doorstep pickup and track the crew right here."
              />
            )}
          </div>
        </div>
      )}

      {openReport && (
        <Modal onClose={() => setOpenReport(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto modal-pop my-auto shrink-0"
          >
            <div className="relative bg-slate-100">
              {(openReport.image_url || openReport.image) && brokenPhotoId !== openReport.id ? (
                <img
                  src={openReport.image_url || openReport.image}
                  alt={openReport.title}
                  className="w-full h-52 object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    const alt = openReport.image && openReport.image !== (openReport.image_url || openReport.image)
                      ? openReport.image : '';
                    if (alt && !el.dataset.triedFallback) {
                      el.dataset.triedFallback = '1';
                      el.src = alt;               
                    } else {
                      setBrokenPhotoId(openReport.id);   
                    }
                  }}
                />
              ) : (
                <div className="w-full h-36 flex items-center justify-center text-slate-400 text-xs font-semibold">
                  <Camera className="w-5 h-5 mr-2" />
                  {(openReport.image_url || openReport.image)
                    ? 'Photo could not be loaded'
                    : 'No photo attached'}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none" />
              <button
                onClick={() => setOpenReport(null)}
                aria-label="Close"
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-slate-700 hover:bg-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base leading-tight drop-shadow">{openReport.title}</span>
                  <span className="text-[10px] font-black bg-white/25 rounded px-1.5 py-0.5">#{openReport.id}</span>
                </div>
                <div className="text-[11px] text-white/85 mt-0.5">
                  {openReport.category_details?.name || 'General'} • {new Date(openReport.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={openReport.status} />
                <PriorityBadge
                  level={openReport.priority_level}
                  score={openReport.priority_score}
                  factors={openReport.priority_factors}
                />
              </div>

              <p className="text-slate-700 leading-relaxed">
                {openReport.description || 'No extended description was provided for this issue.'}
              </p>

              {(openReport.after_image_url || openReport.after_image) && (
                <div className="rounded-xl overflow-hidden border border-emerald-200">
                  <img
                    src={openReport.after_image_url || openReport.after_image}
                    alt="Cleanup proof uploaded by the field worker"
                    className="w-full h-44 object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                    Cleanup proof · uploaded by field worker
                    {openReport.cleanup_score !== null && openReport.cleanup_score !== undefined
                      ? ` · AI score ${openReport.cleanup_score}/100` : ''}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex items-start gap-1.5 text-slate-700 font-semibold">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                  <span>{openReport.address}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-5">
                  {Number(openReport.latitude).toFixed(5)}, {Number(openReport.longitude).toFixed(5)}
                  {openReport.zone ? ` • ${openReport.zone}` : ''}
                </div>
              </div>

              {Array.isArray(openReport.priority_factors) && openReport.priority_factors.length > 0 && (
                <div>
                  <div className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Why this priority?
                  </div>
                  <ul className="space-y-1 text-slate-600">
                    {openReport.priority_factors.map((f, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 uppercase font-bold text-[9px]">Reported</div>
                  <div className="text-slate-700 font-semibold">
                    {new Date(openReport.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 uppercase font-bold text-[9px]">Last update</div>
                  <div className="text-slate-700 font-semibold">
                    {new Date(openReport.updated_at).toLocaleString()}
                  </div>
                </div>
                {openReport.resolved_at && (
                  <div className="p-2 bg-emerald-50 rounded-lg col-span-2">
                    <div className="text-emerald-500 uppercase font-bold text-[9px]">Resolved</div>
                    <div className="text-emerald-700 font-semibold">
                      {new Date(openReport.resolved_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {openReport.is_duplicate && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  Flagged as a duplicate of another report nearby.
                </div>
              )}
              {(openReport.citizen_verification || openReport.verification) ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  ✓ Confirmed cleaned by a citizen
                  {openReport.citizen_verification?.feedback
                    ? ` — "${openReport.citizen_verification.feedback}"`
                    : ''}
                </div>
              ) : openReport.status === 'RESOLVED' ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                  Waiting for a citizen to confirm this cleanup.
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setOpenReport(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition"
                >
                  Close
                </button>
                {openReport.status === 'RESOLVED' && !(openReport.citizen_verification || openReport.verification) && (
                  <button
                    onClick={() => { setVerifyingReport(openReport); setOpenReport(null); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Confirm Cleanup
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {verifyingReport && (
        <Modal onClose={() => setVerifyingReport(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 modal-pop my-auto shrink-0 max-h-[90vh] overflow-y-auto">
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
        </Modal>
      )}
    </div>
  );
}

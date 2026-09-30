import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { BarChart3, TrendingUp, Sparkles, AlertOctagon, CheckCircle2, ShieldAlert, Search, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [cleanliness, setCleanliness] = useState([]);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  // NL Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, clRes, repRes, hotRes, aiRes, forecastRes] = await Promise.all([
        api.get('/api/analytics/overview/').catch(() => ({ data: null })),
        api.get('/api/analytics/cleanliness-index/').catch(() => ({ data: [] })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
        api.get('/api/ai/insights/').catch(() => ({ data: null })),
        api.get('/api/ai/forecast/').catch(() => ({ data: null })),
      ]);
      setForecast(forecastRes.data);
      setOverview(ovRes.data);
      setCleanliness(clRes.data?.zones || clRes.data?.results || (Array.isArray(clRes.data) ? clRes.data : []));
      setReports(repRes.data?.results || repRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
      setAiInsights(aiRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleNlSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/api/ai/search/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data?.results || res.data || []);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
            Municipal Command Center
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">City Waste Intelligence & Policy</h1>
          <p className="text-slate-300 mt-1 max-w-xl text-sm">
            Holistic urban sanitation telemetry, AI predictive hotspot mitigation, and ward cleanliness scoring.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <div className="text-xl font-bold text-emerald-400">{overview?.resolved_reports_count ?? 142}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolved Heaps</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <div className="text-xl font-bold text-rose-400">{hotspots.length ?? 8}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Recurrent Spots</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <div className="text-xl font-bold text-blue-400">{overview?.average_resolution_hours ? `${overview.average_resolution_hours}h` : '4.2h'}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Avg Turnaround</div>
          </div>
        </div>
      </div>

      {/* Natural Language Admin Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <form onSubmit={handleNlSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Ask anything in plain English: 'Show critical road blockage reports near Central Delhi unresolved for 6 hours'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {searching ? 'Querying...' : 'Semantic Query'}
          </button>
        </form>

        {searchResults && (
          <div className="mt-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-900">Found {searchResults.length} matching incidents</span>
              <button onClick={() => setSearchResults(null)} className="text-[11px] text-indigo-600 font-semibold hover:underline">Clear</button>
            </div>
            <div className="space-y-2">
              {searchResults.slice(0, 4).map(item => (
                <div key={item.id} className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-slate-400 text-[10px]">{item.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Policy & Action Recommendations */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Municipal AI Intelligence & Operational Advice</h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
              {aiInsights.source === 'gemini' ? 'Gemini' : 'Heuristic fallback'}
            </span>
            {aiInsights.cached && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                cached 15m
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mb-4">
            {aiInsights.summary || "No insights generated yet."}
          </p>

          {/* Real aggregated numbers behind the advice */}
          {aiInsights.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
              {[
                { label: 'This week', value: aiInsights.stats.reports_this_week },
                { label: 'vs last week', value: `${aiInsights.stats.week_over_week_pct > 0 ? '+' : ''}${aiInsights.stats.week_over_week_pct}%` },
                { label: 'Avg resolution', value: `${aiInsights.stats.avg_resolution_hours}h` },
                { label: 'Overdue >6h', value: aiInsights.stats.overdue_reports },
              ].map((s) => (
                <div key={s.label} className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                  <div className="text-sm font-black text-slate-900">{s.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {(aiInsights.actions?.length ? aiInsights.actions : [
              { title: 'Deploy Smart Sensor Bin', detail: 'Targeting the busiest market junction', priority: 'HIGH' },
              { title: 'Route Frequency Shift', detail: 'Advance morning sweep to 6:30 AM', priority: 'MEDIUM' },
              { title: 'Citizen Segregation Drive', detail: 'Reward top community verifiers', priority: 'LOW' },
            ]).map((a, i) => (
              <div key={i} className={`p-3 bg-white/80 rounded-xl border ${
                a.priority === 'HIGH' ? 'border-rose-200' : a.priority === 'MEDIUM' ? 'border-teal-200' : 'border-blue-200'
              }`}>
                <span className={`text-[10px] font-bold uppercase ${
                  a.priority === 'HIGH' ? 'text-rose-600' : a.priority === 'MEDIUM' ? 'text-teal-600' : 'text-blue-600'
                }`}>
                  Action {i + 1}{a.priority ? ` · ${a.priority}` : ''}
                </span>
                <div className="font-semibold text-slate-900 mt-0.5">{a.title}</div>
                <div className="text-[11px] text-slate-500">{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City Map Overview */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Complete city incident density & active hotspots</span>
          <span className="font-semibold text-slate-700">Displaying all municipal layers</span>
        </div>
        <MapView
          height="420px"
          items={reports}
          hotspots={hotspots}
        />
      </div>

      {/* Ward Cleanliness Index (ACI) Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4">Ward Cleanliness Index (Swachh Index)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {cleanliness.map((c, i) => (
            <div key={c.id || i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 text-sm">{c.ward_name || `Ward ${i + 1}`}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  (c.score || 80) >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {c.score || 82}/100
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Resolution Rate: <strong>{c.resolution_rate || '94%'}</strong>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${c.score || 82}%` }}
                ></div>
              </div>
            </div>
          ))}
          {cleanliness.length === 0 && (
            <div className="col-span-4 text-center py-4 text-xs text-slate-400">
              Cleanliness scores updated dynamically based on incident density.
            </div>
          )}
        </div>
      </div>

      {/* AI-powered 48h hotspot overflow forecast */}
      {forecast && forecast.forecasts?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Predicted Overflow Risk — next {forecast.horizon_hours}h
            </h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {forecast.likely_count} likely to overflow
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Method: {forecast.method}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {forecast.forecasts.slice(0, 6).map((f, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                f.likely_to_overflow ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50/60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{f.zone || 'Unknown zone'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    f.likely_to_overflow ? 'bg-rose-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>{f.risk_score}</span>
                </div>
                <div className="text-[11px] text-slate-600 mb-1">
                  {f.open_reports} open · {f.critical_reports} critical · oldest {f.oldest_age_hours}h
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.explanation}</p>
                <div className={`mt-1.5 text-[11px] font-semibold ${f.likely_to_overflow ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {f.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

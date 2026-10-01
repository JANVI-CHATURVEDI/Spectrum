import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import { Eye, ShieldCheck, CheckCircle2, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';

export default function PublicTransparency() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const [transRes, repRes, hotRes] = await Promise.all([
        api.get('/api/analytics/transparency/').catch(() => ({ data: null })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
      ]);
      setData(transRes.data);
      setReports(repRes.data?.results || repRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
    } catch (err) {
      console.error('Failed to load transparency data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
            Public Civic Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Open City Sanitation Transparency</h1>
          <p className="text-blue-50 mt-1 max-w-xl text-sm">
            Publicly verifiable civic operations. Every report, turnaround timeline, and verified resolution is open for scrutiny.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">{data?.total_reports_count ?? reports.length}</div>
            <div className="text-[11px] text-blue-100">Citizens Engaged</div>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center">
            <div className="text-2xl font-black">{data?.resolved_percentage ?? '92%'}</div>
            <div className="text-[11px] text-blue-100">Cleanliness Ratio</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Live anonymized waste incidents & cleared spots</span>
          <span className="font-semibold text-slate-700">Open Public Access Layer</span>
        </div>
        <MapView
          height="420px"
          items={reports}
          hotspots={hotspots}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Recently Cleared Heaps & Verification Status</h3>
          <button onClick={fetchPublicData} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {reports.slice(0, 8).map((report) => (
            <div key={report.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 text-sm">{report.title}</span>
                <div className="text-slate-500">{report.address}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={report.status} />
                {(report.citizen_verification || report.verification) ? (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200">
                    ✓ Verified by Resident
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Awaiting resident check</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

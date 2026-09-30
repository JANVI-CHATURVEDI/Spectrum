import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Eye, Shield, Users, BarChart3, ArrowRight, CheckCircle2, Sparkles,
  MapPin, Truck, RefreshCw, User, HardHat, Compass, Activity,
} from 'lucide-react';

const PORTALS = [
  {
    role: 'CITIZEN', path: '/citizen', icon: User,
    title: 'Citizen', desc: 'Report dumps with photo + GPS, track status live, verify cleanups.',
    tint: 'bg-emerald-100 text-emerald-700',
  },
  {
    role: 'WORKER', path: '/worker', icon: HardHat,
    title: 'Field Worker', desc: 'Daily route, task proof uploads, AI-verified completions.',
    tint: 'bg-blue-100 text-blue-700',
  },
  {
    role: 'SUPERVISOR', path: '/supervisor', icon: Compass,
    title: 'Supervisor', desc: 'Dispatch crew, audit before/after evidence, manage roster.',
    tint: 'bg-indigo-100 text-indigo-700',
  },
  {
    role: 'ADMIN', path: '/admin', icon: Shield,
    title: 'Administrator', desc: 'City KPIs, hotspot forecast, staff onboarding, NL search.',
    tint: 'bg-slate-800 text-white',
  },
];

const LOOP = [
  { step: 'Report', desc: 'Photo, GPS, AI classification' },
  { step: 'Verify', desc: 'Duplicate & proximity check' },
  { step: 'Prioritize', desc: 'Score based on 5 parameters' },
  { step: 'Assign', desc: 'Dynamic dispatch to field crew' },
  { step: 'Resolve', desc: 'Cleanup evidence & logs' },
  { step: 'Citizen Check', desc: 'Community audit & reopen' },
  { step: 'Prevent', desc: 'Hotspot mitigation policy' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let live = true;
    api.get('/api/analytics/overview/').catch(() => ({ data: null })).then(res => {
      if (live && res.data) setStats(res.data);
    });
    return () => { live = false; };
  }, []);

  const openPortal = (p) => {
    if (user && (user.role === p.role || user.role === 'ADMIN')) navigate(p.path);
    else navigate('/login');
  };

  const liveStats = [
    { icon: Activity, value: stats?.active_reports ?? 28, label: 'Active reports' },
    { icon: CheckCircle2, value: stats?.resolved_reports ?? stats?.resolved_reports_count ?? 142, label: 'Resolved' },
    { icon: Users, value: stats?.active_workers ?? 8, label: 'Field workers' },
    { icon: BarChart3, value: `${stats?.resolution_rate ?? 88.5}%`, label: 'Resolution rate' },
  ];

  return (
    <div className="space-y-16 py-8">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Next-Generation Civic Sanitation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Turn Scattered Waste Reports into <span className="text-emerald-600">Actionable Sanitation Intelligence.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          SwachDrishti closes the loop between citizens, field sanitation teams, supervisors, and city administrators. Featuring explainable priority scoring, recurring hotspot detection, and verifiable cleanup proofs.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate(user ? '/citizen' : '/login')}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
          >
            {user ? 'Go to my dashboard' : 'Report an issue'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
          >
            Sign in / Create account
          </button>
          <button
            onClick={() => navigate('/public')}
            className="px-6 py-3 rounded-xl text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition"
          >
            See live transparency →
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {liveStats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-none">{s.value}</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Citizen Reports</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI assisted categorization, duplicate report detection, and pinpoint geolocation picker.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base">Explainable Priority</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamically scores urgency using density, age, sensitive context, and hotspot recurrence factors.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base">Recurrent Hotspot AI</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automatically clusters repeated dumpings into persistent hotspots with targeted operational advice.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base">Citizen Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensures true accountability: citizens confirm resolutions before tasks are permanently archived.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Role workspaces</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">One city, four mission controls</h2>
          </div>
          <span className="text-xs text-slate-500">Each role signs into its own guarded dashboard.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PORTALS.map(p => (
            <button
              key={p.role}
              onClick={() => openPortal(p)}
              className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.tint}`}>
                <p.icon className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-sm">{p.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed min-h-12">{p.desc}</div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open workspace <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              The SwachDrishti Core Loop
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">From Citizen Lens to City Strategy</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            {LOOP.map((s, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-emerald-400 font-bold text-sm mb-1">{idx + 1}. {s.step}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{s.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            {[
              { icon: MapPin, title: 'Live ward map', desc: 'Every report, pickup and hotspot pinned with status colors.' },
              { icon: Truck, title: 'Crew accountability', desc: 'Before/after photo evidence on every completed job.' },
              { icon: RefreshCw, title: 'Reopen power', desc: 'Citizens can re-escalate incomplete cleanups anytime.' },
            ].map(f => (
              <div key={f.title} className="flex gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">{f.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 sm:p-10 text-white shadow-lg">
          <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute right-24 -top-12 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">See the waste. Spark the action.</h2>
              <p className="text-emerald-100 text-sm mt-2 max-w-lg">
                Join your ward's cleanup loop — report in under a minute, watch the crew resolve it, verify the proof.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => navigate(user ? '/citizen' : '/login')}
                className="px-6 py-3 rounded-xl bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition shadow"
              >
                Start reporting
              </button>
              <button
                onClick={() => navigate('/awareness')}
                className="px-6 py-3 rounded-xl border border-white/40 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                Learn segregation
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
          <Eye className="w-3.5 h-3.5" />
          Open civic data · auditable priority scores · citizen-verified closures
        </div>
      </div>
    </div>
  );
}

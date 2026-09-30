import React from 'react';
import { Award, Lock, Medal, ShieldCheck, Sparkles, Star, Trash2, Truck } from 'lucide-react';

const BADGE_META = {
  'Waste Watcher': { icon: Trash2, color: 'emerald' },
  'Street Reporter': { icon: Medal, color: 'blue' },
  'Neighborhood Guardian': { icon: ShieldCheck, color: 'teal' },
  'City Sentinel': { icon: Star, color: 'amber' },
  'Verified Voice': { icon: Sparkles, color: 'purple' },
  'Clean Street Contributor': { icon: Sparkles, color: 'purple' },
  'First Fix': { icon: Truck, color: 'blue' },
  'Street Doctor': { icon: Medal, color: 'emerald' },
  'Zone Champion': { icon: ShieldCheck, color: 'teal' },
  'City Healer': { icon: Star, color: 'amber' },
  'Quality Star': { icon: Award, color: 'purple' },
};

const COLOR_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};

const METRIC_LABEL = { reports: 'reports', verifications: 'confirmations', completions: 'cleanups', quality: 'quality cleanups' };

export default function ImpactCard({ user, stats, catalog, headline, subline }) {
  const badges = user?.badges || [];
  const points = user?.impact_points ?? 0;
  const rows = (catalog || []).map((b) => ({
    ...b,
    earned: badges.includes(b.name),
    progress: Math.min(100, Math.round(((stats?.[b.metric] || 0) / Math.max(1, b.threshold)) * 100)),
  }));
  const next = rows.find((b) => !b.earned);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{headline}</div>
          <div className="flex items-center gap-2 mt-1">
            <Award className="h-5 w-5 text-emerald-600" />
            <span className="text-2xl font-extrabold text-slate-900">{points}</span>
            <span className="text-xs font-semibold text-slate-500">impact points</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subline}</p>
        </div>
        {next && (
          <div className="min-w-44 flex-1 max-w-xs">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>Next: {next.name}</span>
              <span>{stats?.[next.metric] || 0}/{next.threshold} {METRIC_LABEL[next.metric]}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${next.progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
        {rows.map((b) => {
          const meta = BADGE_META[b.name] || { icon: Medal, color: 'emerald' };
          const Icon = b.earned ? meta.icon : Lock;
          return (
            <div
              key={b.name}
              title={`${b.description} (${stats?.[b.metric] || 0}/${b.threshold})`}
              className={`rounded-xl border px-2 py-2.5 text-center transition ${b.earned ? COLOR_CLASSES[meta.color] : 'bg-slate-50 text-slate-400 border-slate-200'}`}
            >
              <Icon className="h-5 w-5 mx-auto" />
              <div className="text-[11px] font-bold mt-1 leading-tight">{b.name}</div>
              <div className="text-[10px] mt-0.5">{b.earned ? 'Earned' : `${stats?.[b.metric] || 0}/${b.threshold}`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

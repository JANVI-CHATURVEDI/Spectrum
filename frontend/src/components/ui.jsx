import React from 'react';
import { Inbox } from 'lucide-react';

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {sub && <p className="text-sm text-slate-500 mt-1 max-w-xl">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', sub = '', action = null }) {
  return (
    <div className="py-10 px-6 text-center">
      <div className="mx-auto w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
        <Inbox className="w-5 h-5" />
      </div>
      <div className="mt-3 font-bold text-sm text-slate-800">{title}</div>
      {sub && <div className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />;
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
      {label}
    </div>
  );
}

export function StatChip({ icon: Icon, value, label, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    slate: 'bg-slate-100 border-slate-200 text-slate-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tones[tone] || tones.slate}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {value} <span className="font-semibold opacity-80">{label}</span>
    </span>
  );
}

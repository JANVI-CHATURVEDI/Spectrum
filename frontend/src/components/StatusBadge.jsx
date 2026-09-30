import React from 'react';

const statusConfigs = {
  REPORTED: { label: 'Reported', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  VERIFIED: { label: 'Verified', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  RESOLVED: { label: 'Resolved (Pending Verification)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CITIZEN_VERIFIED: { label: 'Citizen Verified ✓', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  REOPENED: { label: 'Reopened', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  REQUESTED: { label: 'Requested', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  SCHEDULED: { label: 'Scheduled', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  COLLECTED: { label: 'Collected', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export default function StatusBadge({ status }) {
  const norm = (status || 'REPORTED').toUpperCase();
  const config = statusConfigs[norm] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {config.label}
    </span>
  );
}

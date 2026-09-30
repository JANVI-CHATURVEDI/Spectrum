import React, { useState } from 'react';
import { AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const priorityConfigs = {
  CRITICAL: {
    label: 'Critical Priority',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    indicator: 'bg-rose-500',
  },
  HIGH: {
    label: 'High Priority',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    indicator: 'bg-amber-500',
  },
  MEDIUM: {
    label: 'Medium Priority',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    indicator: 'bg-blue-500',
  },
  LOW: {
    label: 'Low Priority',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    indicator: 'bg-slate-400',
  },
};

export default function PriorityBadge({ level = 'MEDIUM', score, factors = [], showDetails = false }) {
  const [expanded, setExpanded] = useState(false);
  const norm = (level || 'MEDIUM').toUpperCase();
  const config = priorityConfigs[norm] || priorityConfigs.MEDIUM;

  return (
    <div className="inline-block relative">
      <div
        onClick={() => factors.length > 0 && setExpanded(!expanded)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${
          factors.length > 0 ? 'cursor-pointer hover:opacity-90' : ''
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${config.indicator} animate-pulse`} />
        <span>{config.label}</span>
        {score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
        {factors.length > 0 && (
          <span className="ml-1 opacity-70">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      {expanded && factors.length > 0 && (
        <div className="absolute left-0 mt-1.5 w-64 z-30 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
          <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Why this priority?</span>
          </div>
          <ul className="space-y-1 text-slate-200">
            {factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

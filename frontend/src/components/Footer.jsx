import React from 'react';
import { Eye, Heart } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="SwachDrishti Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-8 h-8 rounded-lg bg-emerald-600 items-center justify-center text-white">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Swach<span className="text-emerald-500">Drishti</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Making civic action visible. Transforming scattered citizen waste reports into location-aware, prioritized municipal operations.
            </p>
            <div className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 inline-block px-2.5 py-1 rounded-md">
              Citizen-powered • Location-aware • Action-driven
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Operational Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('citizen')} className="hover:text-emerald-400 transition-colors">Citizen Report & Track</button></li>
              <li><button onClick={() => setActiveTab('worker')} className="hover:text-emerald-400 transition-colors">Sanitation Route App</button></li>
              <li><button onClick={() => setActiveTab('supervisor')} className="hover:text-emerald-400 transition-colors">Supervisor Operations</button></li>
              <li><button onClick={() => setActiveTab('admin')} className="hover:text-emerald-400 transition-colors">Admin Command Center</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Transparency & Learning</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('public')} className="hover:text-emerald-400 transition-colors">Your City's Waste Picture</button></li>
              <li><button onClick={() => setActiveTab('awareness')} className="hover:text-emerald-400 transition-colors">Know Your Waste Guide</button></li>
              <li><button onClick={() => setActiveTab('awareness')} className="hover:text-emerald-400 transition-colors">Segregation Quiz</button></li>
              <li><span className="text-slate-500">Spectrum Cleanliness Index</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Civic Core</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              "See the waste. Spark the action." Built for resilient municipalities, dedicated sanitation workers, and proactive citizens.
            </p>
            <div className="text-[11px] text-slate-500">
              Deterministic priority • Geographic hotspot clustering • Zero PII leak
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} SwachDrishti. All rights reserved.</div>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            Designed for high-impact municipal waste operations.
          </div>
        </div>
      </div>
    </footer>
  );
}

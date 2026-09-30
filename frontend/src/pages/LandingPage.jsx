import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, Shield, Users, BarChart3, ArrowRight, CheckCircle2, Sparkles, MapPin, Truck, RefreshCw } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="space-y-16 py-8">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
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

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              The SwachDrishti Core Loop
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">From Citizen Lens to City Strategy</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            {[
              { step: 'Report', desc: 'Photo, GPS, AI classification' },
              { step: 'Verify', desc: 'Duplicate & proximity check' },
              { step: 'Prioritize', desc: 'Score based on 5 parameters' },
              { step: 'Assign', desc: 'Dynamic dispatch to field crew' },
              { step: 'Resolve', desc: 'Cleanup evidence & logs' },
              { step: 'Citizen Check', desc: 'Community audit & reopen' },
              { step: 'Prevent', desc: 'Hotspot mitigation policy' },
            ].map((s, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-emerald-400 font-bold text-sm mb-1">{idx + 1}. {s.step}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

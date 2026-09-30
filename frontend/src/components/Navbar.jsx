import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Eye, Shield, User, HardHat, Compass, ChevronDown,
  Award, LogOut, FlaskConical,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PERSONAS = [
  { id: 'citizen', label: 'Citizen', icon: User, desc: 'Report & track neighborhood waste' },
  { id: 'worker', label: 'Sanitation Worker', icon: HardHat, desc: "Manage today's route & upload proof" },
  { id: 'supervisor', label: 'Supervisor', icon: Compass, desc: 'Operations dispatch & team rebalancing' },
  { id: 'admin', label: 'Administrator', icon: Shield, desc: 'City Command Center & analytics' },
];

const PERSONA_HOME = { citizen: '/citizen', worker: '/worker', supervisor: '/supervisor', admin: '/admin' };

const LINKS = [
  { tab: 'landing', path: '/', label: 'Overview', active: 'bg-slate-100 text-slate-900 font-semibold', roles: null },
  { tab: 'citizen', path: '/citizen', label: 'Citizen', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['CITIZEN'] },
  { tab: 'worker', path: '/worker', label: 'Route', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['WORKER'] },
  { tab: 'supervisor', path: '/supervisor', label: 'Operations', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['SUPERVISOR'] },
  { tab: 'admin', path: '/admin', label: 'Command Center', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['ADMIN'] },
  { tab: 'public', path: '/public', label: 'City Transparency', active: 'bg-blue-50 text-blue-700 font-semibold', roles: null },
  { tab: 'awareness', path: '/awareness', label: 'Know Your Waste', active: 'bg-teal-50 text-teal-700 font-semibold', roles: null },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, switchRole, logout } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handlePersona = async (roleId) => {
    await switchRole(roleId);
    setDemoOpen(false);
    setActiveTab(roleId);
    navigate(PERSONA_HOME[roleId]);
  };

  const handleNav = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    handleNav('landing', '/');
  };

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    : '';

  const visibleLinks = LINKS.filter(l => !l.roles || !user || role === 'ADMIN' || l.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            onClick={() => handleNav('landing', '/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/logo.png"
              alt="SwachDrishti Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform bg-white p-0.5 border border-slate-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                Swach<span className="text-emerald-600">Drishti</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                Civic Operations
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {visibleLinks.map(l => (
              <button
                key={l.tab}
                onClick={() => handleNav(l.tab, l.path)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.path ? l.active : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {user && role === 'CITIZEN' && (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user.impact_points ?? 0} pts</span>
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(o => !o); setDemoOpen(false); }}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition shadow-sm"
                >
                  <span className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {(displayName[0] || 'U').toUpperCase()}
                  </span>
                  <span className="max-w-24 truncate hidden sm:inline">{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] text-slate-500">
                      Signed in as <strong className="text-slate-800">{displayName}</strong>
                      <span className="block text-[10px] uppercase tracking-wide font-bold text-emerald-700">{role}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNav('login', '/login')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                Login / Sign up
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => { setDemoOpen(o => !o); setUserOpen(false); }}
                title="One-click demo personas for evaluation"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 text-[11px] font-bold transition"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Demo</span>
              </button>
              {demoOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch persona for demo
                  </div>
                  {PERSONAS.map((r) => {
                    const Icon = r.icon;
                    const isCurrent = user && role.toLowerCase() === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handlePersona(r.id)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-emerald-50/70 text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 ${isCurrent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{r.label} {isCurrent && '✓'}</div>
                          <div className="text-[10px] text-slate-500">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

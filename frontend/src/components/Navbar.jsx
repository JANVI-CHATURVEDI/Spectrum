import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Eye, Shield, User, HardHat, Compass, ChevronDown,
  Award, LogOut, FlaskConical, Menu, X, Bell,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDismiss } from './ui';

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
  const { user, role, token, switchRole, logout } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const notifRef = useDismiss(notifOpen, () => setNotifOpen(false));
  const userRef = useDismiss(userOpen, () => setUserOpen(false));
  const demoRef = useDismiss(demoOpen, () => setDemoOpen(false));

  const handlePersona = async (roleId) => {
    await switchRole(roleId);
    setDemoOpen(false);
    setMobileOpen(false);
    setActiveTab(roleId);
    navigate(PERSONA_HOME[roleId]);
  };

  const handleNav = (tab, path) => {
    setActiveTab(tab);
    setMobileOpen(false);
    setNotifOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (!token) {
      setNotifs([]);
      setUnread(0);
      return;
    }
    let live = true;
    const load = async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          api.get('/api/notifications/unread-count/').catch(() => ({ data: { unread: 0 } })),
          api.get('/api/notifications/').catch(() => ({ data: { results: [] } })),
        ]);
        if (!live) return;
        setUnread(cRes.data?.unread || 0);
        setNotifs(lRes.data?.results || lRes.data || []);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { live = false; clearInterval(t); };
  }, [token]);

  const openNotif = async (n) => {
    setNotifOpen(false);
    try {
      await api.post('/api/notifications/mark-read/', { ids: [n.id] });
    } catch {}
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    setUnread(u => Math.max(0, u - 1));
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read/', {});
    } catch {}
    setNotifs(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnread(0);
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          <div
            onClick={() => handleNav('landing', '/')}
            className="flex shrink-0 cursor-pointer items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="SwachDrishti Logo"
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-0.5 shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
              <Eye className="h-5 w-5" />
            </div>
            <div className="whitespace-nowrap leading-none">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Swach<span className="text-emerald-600">Drishti</span>
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Civic Operations
              </span>
            </div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex" aria-label="Primary">
            {visibleLinks.map(l => (
              <button
                key={l.tab}
                onClick={() => handleNav(l.tab, l.path)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === l.path ? l.active : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setUserOpen(false); setDemoOpen(false); }}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-[calc(100vw-2.5rem)] max-w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notifications</span>
                      <button onClick={markAllRead} className="text-[11px] font-bold text-emerald-700 hover:underline">
                        Mark all read
                      </button>
                    </div>
                    {notifs.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-slate-400">All caught up.</div>
                    )}
                    {notifs.slice(0, 12).map(n => (
                      <button
                        key={n.id}
                        onClick={() => openNotif(n)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition hover:bg-slate-50 ${n.is_read ? '' : 'bg-emerald-50/50'}`}
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800">{n.title}</span>
                          <span className="block text-[11px] text-slate-500 line-clamp-2">{n.body}</span>
                          <span className="block text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {user && (role === 'CITIZEN' || role === 'WORKER') && (
              <div className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 min-[420px]:flex">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>{user.impact_points ?? 0} pts</span>
              </div>
            )}

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserOpen(o => !o); setDemoOpen(false); setNotifOpen(false); }}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 py-1 pl-1 pr-2.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 font-bold text-white">
                    {(displayName[0] || 'U').toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate xl:inline">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    <div className="px-3 py-1.5 text-[11px] text-slate-500">
                      Signed in as <strong className="text-slate-800">{displayName}</strong>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-700">{role}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNav('login', '/login')}
                className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Login / Sign up
              </button>
            )}

            <div className="relative" ref={demoRef}>
              <button
                onClick={() => { setDemoOpen(o => !o); setUserOpen(false); setNotifOpen(false); }}
                title="One-click demo personas for evaluation"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-slate-300 px-2.5 py-2 text-[11px] font-bold text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Demo</span>
              </button>
              {demoOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
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
                        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-50 ${
                          isCurrent ? 'bg-emerald-50/70 text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <div className={`mt-0.5 rounded-md p-1.5 ${isCurrent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold">{r.label} {isCurrent && '✓'}</div>
                          <div className="text-[10px] text-slate-500">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-2 shadow-lg lg:hidden" aria-label="Mobile">
          {visibleLinks.map(l => (
            <button
              key={l.tab}
              onClick={() => handleNav(l.tab, l.path)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                location.pathname === l.path ? l.active : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

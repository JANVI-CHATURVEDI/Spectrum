import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, FlaskConical, AlertCircle } from 'lucide-react';

const ROLE_HOME = { CITIZEN: '/citizen', WORKER: '/worker', SUPERVISOR: '/supervisor', ADMIN: '/admin' };

const DEMO_ROLES = [
  { id: 'citizen', label: 'Citizen' },
  { id: 'worker', label: 'Worker' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'admin', label: 'Admin' },
];

const QUICK_FILL = [
  { label: 'citizen', u: 'citizen', p: 'citizen123' },
  { label: 'worker', u: 'worker', p: 'worker123' },
  { label: 'supervisor', u: 'supervisor', p: 'supervisor123' },
  { label: 'admin', u: 'admin', p: 'admin123' },
];

export default function Login() {
  const { user, loading, login, register, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '', phone: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const goHome = (user) => {
    const from = location.state?.from;
    navigate(from && from !== '/login' ? from : (ROLE_HOME[user?.role] || '/citizen'));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        const user = await login(form.username.trim(), form.password);
        goHome(user);
      } else {
        const user = await register({
          username: form.username.trim(),
          password: form.password,
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
        });
        goHome(user);
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'string' ? data
        : data?.non_field_errors?.[0] || data?.username?.[0] || data?.password?.[0]
        || data?.email?.[0] || data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (roleId) => {
    setBusy(true);
    setError('');
    try {
      const user = await switchRole(roleId);
      if (user) goHome(user);
    } catch {
      setError('Demo login failed. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none bg-white';

  if (!loading && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/citizen'} replace />;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
          <h1 className="text-xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Join SwachDrishti'}
          </h1>
          <p className="text-emerald-100 text-xs mt-1">
            {mode === 'login'
              ? 'Sign in to report issues, track cleanups and earn impact points.'
              : 'Create a citizen account — report issues and verify cleanups in your ward.'}
          </p>
        </div>

        <div className="grid grid-cols-2 text-sm font-bold border-b border-slate-100">
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`py-3 transition ${mode === m ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="p-6 space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First name" value={form.first_name} onChange={set('first_name')} className={inputCls} />
              <input placeholder="Last name" value={form.last_name} onChange={set('last_name')} className={inputCls} />
            </div>
          )}

          <input
            placeholder="Username"
            value={form.username} onChange={set('username')}
            className={inputCls} required autoComplete="username"
          />

          {mode === 'register' && (
            <>
              <input
                placeholder="Email (for report + verification alerts)"
                type="email" value={form.email} onChange={set('email')}
                className={inputCls} required autoComplete="email"
              />
              <input
                placeholder="Phone, e.g. +919876543210 (optional, for SMS alerts)"
                value={form.phone} onChange={set('phone')}
                className={inputCls} autoComplete="tel"
              />
            </>
          )}

          <input
            placeholder={mode === 'register' ? 'Password (min 6 characters)' : 'Password'}
            type="password" value={form.password} onChange={set('password')}
            className={inputCls} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold w-full">Seeded accounts — tap to fill, then sign in:</span>
            {QUICK_FILL.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => { setMode('login'); setError(''); setForm(f => ({ ...f, username: q.u, password: q.p })); }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition"
              >
                {q.label}
              </button>
            ))}
          </div>

          <button
            type="submit" disabled={busy}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create citizen account'}
          </button>
        </form>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            <span className="flex-1 h-px bg-slate-100" /> Demo shortcuts <span className="flex-1 h-px bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {DEMO_ROLES.map(r => (
              <button
                key={r.id} onClick={() => demoLogin(r.id)} disabled={busy}
                className="py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <FlaskConical className="w-3 h-3" /> {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

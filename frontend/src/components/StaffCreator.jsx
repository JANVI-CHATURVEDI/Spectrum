import React, { useState } from 'react';
import api from '../api/client';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

const ZONES = ['Zone 1 - Central', 'Zone 2 - South', 'Zone 3 - East', 'Zone 4 - West', 'Zone 5 - North'];

export default function StaffCreator({ onCreated, allowSupervisorRole = false }) {
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', zone: ZONES[0], role: 'WORKER',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setOk('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      const res = await api.post('/api/auth/staff/', form);
      setOk(`${res.data.user.username} joined as ${res.data.user.role} — live in the Crew Workload Roster.`);
      setForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', zone: ZONES[0], role: 'WORKER',
      });
      if (onCreated) onCreated(res.data.user);
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'string' ? data
        : data?.username?.[0] || data?.password?.[0] || data?.role?.[0]
        || data?.email?.[0] || data?.detail || 'Could not create the account.'
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white';

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {ok && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {ok}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <input placeholder="First name" value={form.first_name} onChange={set('first_name')} className={inputCls} />
        <input placeholder="Last name" value={form.last_name} onChange={set('last_name')} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <input placeholder="Username (login id)" value={form.username} onChange={set('username')} className={inputCls} required autoComplete="off" />
        <input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={set('password')} className={inputCls} required minLength={8} autoComplete="new-password" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <input placeholder="Email (optional)" type="email" value={form.email} onChange={set('email')} className={inputCls} />
        <input placeholder="Phone, e.g. +919876543210" value={form.phone} onChange={set('phone')} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <select value={form.zone} onChange={set('zone')} className={inputCls}>
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <select value={form.role} onChange={set('role')} className={inputCls}>
          <option value="WORKER">Sanitation Worker</option>
          {allowSupervisorRole && <option value="SUPERVISOR">Supervisor</option>}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        {busy ? 'Creating…' : `Create ${form.role === 'SUPERVISOR' ? 'supervisor' : 'worker'} account`}
      </button>
    </form>
  );
}

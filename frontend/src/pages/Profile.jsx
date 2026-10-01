import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Save, AlertCircle, CheckCircle2, BellRing, Award } from 'lucide-react';

const ZONES = ['Zone 1 - Central', 'Zone 2 - South', 'Zone 3 - East', 'Zone 4 - West', 'Zone 5 - North'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    zone: user?.zone || ZONES[0],
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
      const res = await api.patch('/api/auth/me/', {
        ...form,
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setUser(res.data.user);
      setOk(res.data.message || 'Profile updated.');
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'string' ? data
        : data?.email?.[0] || data?.detail || 'Could not save. Check the email format.'
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none bg-white';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Account</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Profile & notifications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Report receipts, verification requests, pickup updates and dispatches reach you on the email below.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 mb-4">
          <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
            {((form.first_name || user?.username) || 'U')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm truncate">@{user?.username}</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">{user?.role}</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <Award className="w-3.5 h-3.5" /> {user?.impact_points ?? 0} pts
          </span>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First name</label>
              <input value={form.first_name} onChange={set('first_name')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last name</label>
              <input value={form.last_name} onChange={set('last_name')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email for alerts <span className="text-rose-500">*</span>
            </label>
            <input type="email" required value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone for SMS</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+919876543210" className={inputCls} autoComplete="tel" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward zone</label>
              <select value={form.zone} onChange={set('zone')} className={inputCls}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] font-semibold">
            <BellRing className="w-4 h-4 shrink-0 mt-0.5" />
            Dispatch pings, verification requests and the bell inbox all follow this address. Role and login id can only be changed by an administrator.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

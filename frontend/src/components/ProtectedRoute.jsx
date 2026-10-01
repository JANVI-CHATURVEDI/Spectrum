import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, SearchX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ROLE_HOME = {
  CITIZEN: '/citizen',
  WORKER: '/worker',
  SUPERVISOR: '/supervisor',
  ADMIN: '/admin',
};

function LoadingGate() {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
      <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
      Checking access…
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles.includes(role) || role === 'ADMIN') return children;
  return <Navigate to={ROLE_HOME[role] || '/'} replace />;
}

export function AccessDenied() {
  const { role } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">Restricted area</h1>
        <p className="text-sm text-slate-500">
          Your <strong>{role}</strong> account can't open this dashboard. Each role gets its own
          workspace — you'll find everything you need in yours.
        </p>
        <button
          onClick={() => navigate(ROLE_HOME[role] || '/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
        >
          <Home className="w-4 h-4" /> Go to my dashboard
        </button>
      </div>
    </div>
  );
}

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
          <SearchX className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-500">This civic corner doesn't exist — let's get you back on route.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
        >
          <Home className="w-4 h-4" /> Back to overview
        </button>
      </div>
    </div>
  );
}

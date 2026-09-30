import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, Shield, User, HardHat, Compass, BarChart3, BookOpen, LogOut, ChevronDown, Award } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rolesList = [
    { id: 'citizen', label: 'Citizen', icon: User, desc: 'Report & track neighborhood waste' },
    { id: 'worker', label: 'Sanitation Worker', icon: HardHat, desc: "Manage today's route & upload proof" },
    { id: 'supervisor', label: 'Supervisor', icon: Compass, desc: 'Operations dispatch & team rebalancing' },
    { id: 'admin', label: 'Administrator', icon: Shield, desc: 'City Command Center & analytics' },
  ];

  const handleRoleSelect = async (roleId) => {
    await switchRole(roleId);
    setRoleMenuOpen(false);
    setActiveTab(roleId);
    if (roleId === 'citizen') navigate('/citizen');
    else if (roleId === 'worker') navigate('/worker');
    else if (roleId === 'supervisor') navigate('/supervisor');
    else if (roleId === 'admin') navigate('/admin');
  };

  const handleNav = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
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

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNav('landing', '/')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleNav('citizen', '/citizen')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/citizen' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Citizen
            </button>
            <button
              onClick={() => handleNav('worker', '/worker')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/worker' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Route
            </button>
            <button
              onClick={() => handleNav('supervisor', '/supervisor')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/supervisor' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Operations
            </button>
            <button
              onClick={() => handleNav('admin', '/admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/admin' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => handleNav('public', '/public')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/public' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              City Transparency
            </button>
            <button
              onClick={() => handleNav('awareness', '/awareness')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/awareness' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Know Your Waste
            </button>
          </nav>

          {/* Right Action: Demo Role Switcher & Profile */}
          <div className="flex items-center gap-3">
            {role === 'CITIZEN' && (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user?.impact_points || 140} pts</span>
              </div>
            )}

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Role: <strong className="font-semibold text-slate-900">{role}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Persona for Demo
                  </div>
                  {rolesList.map((r) => {
                    const IconComponent = r.icon;
                    const isCurrent = role.toLowerCase() === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRoleSelect(r.id)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-emerald-50/70 text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 ${isCurrent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          <IconComponent className="w-4 h-4" />
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

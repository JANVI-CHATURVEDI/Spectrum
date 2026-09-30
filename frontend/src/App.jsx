import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RequireAuth, RequireRole, NotFound } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicTransparency from './pages/PublicTransparency';
import AwarenessPage from './pages/AwarenessPage';
import Login from './pages/Login';

function App() {
  const { role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');

  useEffect(() => {
    if (role && role !== 'CITIZEN') {
      setActiveTab(role.toLowerCase());
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2 text-sm text-slate-500">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
        Loading SwachDrishti…
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/public" element={<PublicTransparency />} />
            <Route path="/awareness" element={<AwarenessPage />} />
            <Route
              path="/citizen"
              element={
                <RequireRole roles={['CITIZEN']}>
                  <CitizenDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/worker"
              element={
                <RequireRole roles={['WORKER']}>
                  <WorkerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/supervisor"
              element={
                <RequireRole roles={['SUPERVISOR']}>
                  <SupervisorDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole roles={['ADMIN']}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route path="/me" element={<RequireAuth><Navigate to="/" replace /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

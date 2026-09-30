import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicTransparency from './pages/PublicTransparency';
import AwarenessPage from './pages/AwarenessPage';

function App() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');

  // Ensure default tab matches role on load
  useEffect(() => {
    if (role && role !== 'CITIZEN') {
      setActiveTab(role.toLowerCase());
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-slate-600">Loading...</span>
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
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/public" element={<PublicTransparency />} />
            <Route path="/awareness" element={<AwarenessPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

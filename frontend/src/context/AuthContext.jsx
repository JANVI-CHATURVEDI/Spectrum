import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('swachdrishti_token') || '');
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        // Fallback default demo citizen for immediate frictionless hackathon view
        setUser({
          id: 1,
          username: 'citizen',
          first_name: 'Aarav',
          last_name: 'Sharma',
          role: 'CITIZEN',
          zone: 'Zone 1 - Central',
          impact_points: 140,
          badges: ['Waste Watcher', 'Clean Street Contributor'],
        });
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/auth/me/');
        setUser(res.data.user);
      } catch (err) {
        console.warn('Token expired or invalid, resetting to demo citizen');
        localStorage.removeItem('swachdrishti_token');
        setToken('');
        setUser({
          id: 1,
          username: 'citizen',
          first_name: 'Aarav',
          last_name: 'Sharma',
          role: 'CITIZEN',
          zone: 'Zone 1 - Central',
          impact_points: 140,
          badges: ['Waste Watcher', 'Clean Street Contributor'],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login/', { username, password });
    localStorage.setItem('swachdrishti_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const switchRole = async (roleName) => {
    try {
      const res = await api.post('/api/auth/demo-login/', { role: roleName });
      localStorage.setItem('swachdrishti_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('Demo switch failed:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('swachdrishti_token');
    setToken('');
    setUser({
      id: 0,
      username: 'guest',
      first_name: 'Guest',
      last_name: 'Citizen',
      role: 'CITIZEN',
      impact_points: 0,
      badges: [],
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'CITIZEN',
        token,
        loading,
        login,
        logout,
        switchRole,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

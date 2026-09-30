import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('swachdrishti_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/auth/me/');
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('swachdrishti_token');
        setToken('');
        setUser(null);
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

  const register = async (payload) => {
    const res = await api.post('/api/auth/register/', payload);
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
    setUser(null);
  };

  const refreshUser = async (prefetched = null) => {
    if (prefetched) {
      setUser(prefetched);
      return prefetched;
    }
    if (!token) return null;
    try {
      const res = await api.get('/api/auth/me/');
      setUser(res.data.user);
      return res.data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'CITIZEN',
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('navratri_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('navratri_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.valid) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    verify();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('navratri_admin_token', res.data.token);
      localStorage.setItem('navratri_admin_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error('Invalid login response');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('navratri_admin_token');
    localStorage.removeItem('navratri_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(user && token), loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

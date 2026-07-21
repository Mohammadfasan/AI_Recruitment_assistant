import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Fetch current user profile
  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data && response.data.success) {
        setUser(response.data.data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Perform auto-login on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      fetchProfile();
    } else {
      setLoading(false);
    }

    // Event listener for global 401 interceptor logout
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('unauthorized-logout', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized-logout', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token, ...userData } = response.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const msg = error.response?.data?.error || 'Invalid credentials. Please try again.';
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role = 'Recruiter') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      if (response.data && response.data.success) {
        // Automatically login after registration
        const { token, ...userData } = response.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed. Try a different email.';
      return { success: false, error: msg };
    }
  };



  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current authenticated user profile if token exists
  const fetchCurrentUser = async () => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.data) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, token: newToken } = response.data.data;
    
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const register = async (name, email, password, password_confirmation) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    const { user: userData, token: newToken } = response.data.data;

    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (name, email) => {
    const response = await api.put('/profile', { name, email });
    const updatedUser = response.data.data.user;
    setUser(updatedUser);
    return response.data;
  };

  const changePassword = async (current_password, password, password_confirmation) => {
    const response = await api.post('/profile/change-password', {
      current_password,
      password,
      password_confirmation,
    });
    const newToken = response.data.data.token;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
    }
    return response.data;
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

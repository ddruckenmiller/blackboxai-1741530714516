import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      api.setAuthToken(token);
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password, userType) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
        role: userType
      });

      const { token, user: userData } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set auth header for future requests
      api.setAuthToken(token);
      
      setUser(userData);

      // Redirect based on role and show welcome message
      if (userData.isDefaultPassword) {
        toast.warning('Please change your default password');
        navigate('/change-password');
      } else {
        toast.success('Welcome back!');
        navigate(userData.role === 'admin' ? '/admin' : '/rider');
      }

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.removeAuthToken();
    setUser(null);
    
    // Redirect to login
    navigate('/login');
    toast.info('You have been logged out');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      toast.success('Password changed successfully');
      
      // Update user's default password status
      const updatedUser = { ...user, isDefaultPassword: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Redirect based on role
      navigate(user.role === 'admin' ? '/admin' : '/rider');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      throw error;
    }
  };

  const updateUserProfile = (updatedProfile) => {
    const updatedUser = { ...user, ...updatedProfile };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    changePassword,
    updateUserProfile
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

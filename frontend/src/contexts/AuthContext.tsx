// AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  registerCompanyAndAdmin: (formData: CompanyRegistrationData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface CompanyRegistrationData {
  companyName: string;
  plan: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Checking auth, token exists:', !!token);
    if (token) {
      try {
        console.log('Sending verify request');
        console.log('Token being sent:', token);
        const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Verify response:', response.data);
        setIsAuthenticated(true);
        setUser(response.data.user);
      } catch (error) {
        console.error('Error verifying token:', error);
        if (axios.isAxiosError(error)) {
          console.log('Response status:', error.response?.status);
          console.log('Response data:', error.response?.data);
          console.log('Error message:', error.message);
          console.log('Error config:', error.config);
        }
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login');
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setUser(response.data.user);
      await checkAuth(); // Chama checkAuth após o login para garantir que tudo está sincronizado
    } catch (error) {
      console.error('Login failed:', error);
      if (axios.isAxiosError(error)) {
        console.log('Response status:', error.response?.status);
        console.log('Response data:', error.response?.data);
      }
      throw error;
    }
  };

  const registerCompanyAndAdmin = async (formData: CompanyRegistrationData) => {
    try {
      console.log('Attempting company and admin registration');
      const response = await axios.post(`${API_BASE_URL}/api/auth/register-company`, formData);
      console.log('Registration response:', response.data);
      // Você pode decidir se quer fazer login automaticamente após o registro
      // ou apenas redirecionar para a página de login
    } catch (error) {
      console.error('Registration failed:', error);
      if (axios.isAxiosError(error)) {
        console.log('Response status:', error.response?.status);
        console.log('Response data:', error.response?.data);
      }
      throw error;
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, registerCompanyAndAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

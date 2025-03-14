// AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
const API_BASE_URL = config.API_BASE_URL;

// Interface para o papel/função do usuário
interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Interface para o usuário com permissões
interface User {
  _id: string;
  email: string;
  username: string;
  fullName?: string;
  role: string;       // Agora sempre será uma string (o nome da role)
  roleData?: Role;    // Armazena o objeto completo da role quando disponível
  company: string;
  permissions: string[]; // Campo de permissões
  bookmarks?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  registerCompanyAndAdmin: (formData: CompanyRegistrationData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string | string[]) => boolean;
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

// Função de utilidade para normalizar o objeto do usuário
const normalizeUserData = (userData: any): User => {
  if (!userData) return userData;

  // Criar uma cópia do objeto do usuário
  const normalizedUser = { ...userData };

  // Normalizar o objeto role se existir
  if (normalizedUser.role && typeof normalizedUser.role === 'object') {
    // Armazenar o objeto original em roleData
    normalizedUser.roleData = { ...normalizedUser.role };
    // Usar apenas o nome como string para o campo role
    normalizedUser.role = normalizedUser.role.name || 'Usuário';
  }

  // Garantir que o campo de permissões seja um array
  if (!Array.isArray(normalizedUser.permissions)) {
    normalizedUser.permissions = [];
  }

  return normalizedUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
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

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = useCallback((permission: string | string[]): boolean => {
    if (!user || !user.permissions) return false;
    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    return permissionsToCheck.every(p => user.permissions.includes(p));
  }, [user]);

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

        // Verificar se as permissões estão presentes na resposta
        if (!response.data.user.permissions) {
          // Se não estiverem, buscar permissões atualizadas
          try {
            const permissionsResponse = await axios.get(`${API_BASE_URL}/api/auth/my-permissions`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Mesclar as permissões com os dados do usuário
            response.data.user.permissions = permissionsResponse.data.permissions;
          } catch (permError) {
            console.error('Error fetching permissions:', permError);
          }
        }

        // Normalizar os dados do usuário
        const normalizedUser = normalizeUserData(response.data.user);

        setIsAuthenticated(true);
        setUser(normalizedUser);
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

      // Garantir que as permissões estão presentes
      if (!response.data.user.permissions) {
        console.warn('Permissions not found in login response');
        response.data.user.permissions = [];
      } else {
        console.log('User permissions:', response.data.user.permissions);
      }

      // Normalizar os dados do usuário antes de armazená-los
      const normalizedUser = normalizeUserData(response.data.user);

      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setUser(normalizedUser);

      // Como já normalizamos o usuário, não precisamos chamar checkAuth aqui
      // a menos que haja outras lógicas importantes nessa função
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
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      registerCompanyAndAdmin,
      logout,
      loading,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acessar o AuthContext
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

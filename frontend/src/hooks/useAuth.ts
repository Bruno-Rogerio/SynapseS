// hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { registerCompanyAndAdmin, login, logout, user } = context;

  return {
    registerCompanyAndAdmin,
    login,
    logout,
    user,
    isAuthenticated: !!user,
  };
};

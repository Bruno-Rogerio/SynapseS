// src/App.tsx - Com proteção de rotas
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import AcceptInviteForm from './components/AcceptInviteForm';
import ForumList from './components/ForumList';
import ForumDetail from './components/ForumDetail';
import UnauthorizedPage from './components/UnauthorizedPage';
import LoadingPage from './components/LoadingPage'; // Crie este componente se não existir

import { ProtectedRoute } from './components/ProtectedRoute';
import { PERMISSIONS } from './constants/permissions';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A5FE0',
    },
    secondary: {
      main: '#6C63FF',
    },
    background: {
      default: '#F4F7FE',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
  },
});

// Componente para gerenciar redirecionamentos baseados em autenticação
const AuthenticatedRedirect: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingPage />;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<AuthenticatedRedirect />} />
              <Route path="/accept-invite/:token" element={<AcceptInviteForm />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Rotas protegidas */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              
              <Route path="/forums" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.FORUM_VIEW}>
                  <ForumList />
                </ProtectedRoute>
              } />

              <Route path="/forum/:id" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.FORUM_VIEW}>
                  <ForumDetail />
                </ProtectedRoute>
              } />

              {/* Rota de fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

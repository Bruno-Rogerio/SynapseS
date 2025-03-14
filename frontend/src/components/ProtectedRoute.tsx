// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingPage from './LoadingPage'; // Crie um componente de loading se não tiver

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string | string[];
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission,
    redirectTo = '/'
}) => {
    const { isAuthenticated, hasPermission, loading } = useAuth();

    // Mostra indicador de carregamento enquanto verifica autenticação
    if (loading) {
        return <LoadingPage />;
    }

    // Redireciona para a página inicial se não estiver autenticado
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Se não há permissão exigida ou o usuário tem a permissão necessária
    if (!requiredPermission || hasPermission(requiredPermission)) {
        return <>{children}</>;
    }

    // Se chegar aqui, o usuário está autenticado mas não tem permissão
    return <Navigate to="/unauthorized" replace />;
};

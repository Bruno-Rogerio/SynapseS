// src/contexts/NotificationContext.tsx - versão corrigida
import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { Notification } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    loadMoreNotifications: () => void;
    hasMoreNotifications: boolean;
    refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Regra importante: NUNCA chame hooks condicionalmente
    // Sempre chame o hook useNotifications(), mesmo que não vá usar o resultado
    const { isAuthenticated, user } = useAuth();

    // Hook é sempre chamado, independentemente da autenticação
    const notificationData = useNotifications();

    // Depois de chamar o hook, você pode usar seus valores condicionalmente
    const contextValue = isAuthenticated && user?._id
        ? notificationData
        : {
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: null,
            isConnected: false,
            markAsRead: async () => { },
            markAllAsRead: async () => { },
            deleteNotification: async () => { },
            loadMoreNotifications: () => { },
            hasMoreNotifications: false,
            refreshNotifications: () => { }
        };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

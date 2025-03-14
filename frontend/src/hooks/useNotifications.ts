// src/hooks/useNotifications.ts - correção para o problema do userId
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useWebSocket } from './useWebSocket';
import { Notification, NotificationResponse, WebSocketMessage } from '../types';
import { useAuth } from './useAuth';

export const useNotifications = () => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const initializedRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const fetchInProgressRef = useRef(false);

    const wsUrl = import.meta.env.VITE_WS_URL;
    const wsEndpoint = `${wsUrl}/notifications`;

    useEffect(() => {
        console.log('WebSocket URL for notifications:', wsEndpoint);
    }, [wsEndpoint]);

    // Extrair userId do token JWT para garantir que sempre temos um userId
    const getUserIdFromToken = useCallback(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            // Decodificar o token JWT (que tem formato xxx.yyy.zzz)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                window.atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );

            const payload = JSON.parse(jsonPayload);
            return payload.userId || null;
        } catch (e) {
            console.error('Error extracting userId from token:', e);
            return null;
        }
    }, []);

    // Garantir que sempre temos um userId para o WebSocket, mesmo que o objeto user ainda não esteja preenchido
    const userId = useMemo(() => {
        return user?._id || getUserIdFromToken();
    }, [user, getUserIdFromToken]);

    // Memoizar as opções do WebSocket com userId do token se necessário
    const wsOptions = useMemo(() => {
        const token = localStorage.getItem('token') || '';

        console.log('Creating WebSocket options:', {
            hasToken: !!token,
            hasUserId: !!userId,
            userId
        });

        return {
            token,
            auth: {
                userId: userId || '',
                token
            }
        };
    }, [userId]);

    const {
        isConnected,
        sendMessage,
        lastMessage,
        error: wsError
    } = useWebSocket<WebSocketMessage>(wsEndpoint, wsOptions);

    // Função utilitária para obter o token
    const getAuthToken = useCallback(() => {
        return localStorage.getItem('token') || '';
    }, []);

    // Verificar o status da autenticação
    useEffect(() => {
        if (!initializedRef.current && isAuthenticated && userId) {
            console.log('Notification system initialized for user:', userId);
            initializedRef.current = true;
        }
    }, [isAuthenticated, userId]);

    // Buscar notificações com proteção contra múltiplas chamadas
    const fetchNotifications = useCallback(async (page = 1, limit = 10, forceRefresh = false) => {
        const token = getAuthToken();
        if (!token) {
            console.log('Skipping notification fetch: no token available');
            setLoading(false);
            return;
        }

        // Evitar chamadas duplicadas
        const now = Date.now();
        if (!forceRefresh && !fetchInProgressRef.current &&
            now - lastFetchTimeRef.current < 2000 && page === 1) {
            console.log('Skipping fetch - last request was too recent');
            return;
        }

        // Evitar chamadas simultâneas
        if (fetchInProgressRef.current) {
            console.log('Fetch already in progress, skipping');
            return;
        }

        fetchInProgressRef.current = true;
        console.log('Fetching notifications for page:', page);

        if (page === 1) {
            setLoading(true);
        }

        try {
            lastFetchTimeRef.current = now;

            const response = await axios.get<NotificationResponse>(
                `${import.meta.env.VITE_API_BASE_URL}/api/notifications`,
                {
                    params: { page, limit },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('Notifications response:', response.data);

            if (page === 1) {
                setNotifications(response.data.notifications || []);
            } else {
                setNotifications(prevNotifications => [
                    ...prevNotifications,
                    ...(response.data.notifications || [])
                ]);
            }

            setUnreadCount(response.data.unreadCount || 0);
            setCurrentPage(response.data.currentPage || 1);
            setTotalPages(response.data.totalPages || 1);
            setError('');
        } catch (err) {
            console.error('Error fetching notifications:', err);
            if (axios.isAxiosError(err)) {
                setError(`Failed to fetch notifications: ${err.response?.data?.message || err.message}`);
            } else {
                setError('An unknown error occurred while fetching notifications');
            }
        } finally {
            setLoading(false);
            fetchInProgressRef.current = false;
        }
    }, [getAuthToken]);

    // Buscar notificações apenas uma vez quando estiver autenticado
    useEffect(() => {
        // Só inicializar quando tivermos um userId
        if (isAuthenticated && userId && !initializedRef.current) {
            console.log('Initial fetch of notifications');
            setTimeout(() => {
                fetchNotifications();
            }, 500); // Pequeno atraso para garantir que a autenticação está estabilizada
        } else if (!isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, userId, fetchNotifications]);

    // Log de status da conexão WebSocket
    useEffect(() => {
        if (isConnected) {
            console.log('Notifications WebSocket connected successfully');
        }
    }, [isConnected]);

    // Processar novas notificações recebidas via WebSocket
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'notification') {
            console.log('New notification received via WebSocket:', lastMessage.notification);

            // Adicionar nova notificação ao início da lista
            setNotifications(prevNotifications => [
                lastMessage.notification,
                ...prevNotifications.filter(n => n._id !== lastMessage.notification._id)
            ]);

            // Atualizar contador se a notificação não estiver lida
            if (!lastMessage.notification.isRead) {
                setUnreadCount(prevCount => prevCount + 1);
            }
        }
    }, [lastMessage]);

    // Resto das funções igual...
    const markAsRead = useCallback(async (notificationId: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    }, [getAuthToken]);

    const markAllAsRead = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/notifications/read-all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({ ...notification, isRead: true }))
            );

            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            throw err;
        }
    }, [getAuthToken]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notificationId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(prevNotifications =>
                prevNotifications.filter(notification => notification._id !== notificationId)
            );

            const wasUnread = notifications.find(n => n._id === notificationId)?.isRead === false;
            if (wasUnread) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    }, [getAuthToken, notifications]);

    const loadMoreNotifications = useCallback(() => {
        if (currentPage < totalPages && !loading && !fetchInProgressRef.current) {
            fetchNotifications(currentPage + 1);
        }
    }, [currentPage, totalPages, loading, fetchNotifications]);

    // Evitar múltiplas chamadas de refresh usando debounce
    const refreshCounter = useRef(0);
    const refreshNotifications = useCallback(() => {
        const currentCounter = ++refreshCounter.current;

        // Adicionar pequeno delay para deduplicate chamadas em sequência
        setTimeout(() => {
            if (currentCounter === refreshCounter.current) {
                fetchNotifications(1, 10, true);  // force refresh
            }
        }, 100);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error: error || wsError,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMoreNotifications,
        hasMoreNotifications: currentPage < totalPages,
        refreshNotifications
    };
};

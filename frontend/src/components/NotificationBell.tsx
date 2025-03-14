// src/components/NotificationBell.tsx - melhorias na experiência do usuário
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IconButton,
    Badge,
    useTheme,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { keyframes } from '@mui/system';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationMenu from './NotificationMenu';
import { useNotificationContext } from '../contexts/NotificationContext';

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const NotificationBell: React.FC = () => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loading,
        error,
        refreshNotifications,
        isConnected
    } = useNotificationContext();

    // Estado local para evitar muitos refreshes
    const [menuOpenTime, setMenuOpenTime] = useState<number | null>(null);

    // Memorizar notificações recentes para evitar re-renderizações
    const recentNotifications = useMemo(() => {
        return (notifications?.slice(0, 5) || []);
    }, [notifications]);

    // Efeito para atualizar notificações quando abrir o menu e não tiver atualizado recentemente
    useEffect(() => {
        if (anchorEl) {
            const now = Date.now();
            if (!menuOpenTime || now - menuOpenTime > 10000) { // 10 segundos
                console.log('Refreshing notifications on menu open');
                refreshNotifications();
                setMenuOpenTime(now);
            }
        }
    }, [anchorEl, refreshNotifications, menuOpenTime]);

    // Handler para abrir o menu
    const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    // Handler para fechar o menu
    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // Handler para refresh manual
    const handleRefresh = useCallback(() => {
        refreshNotifications();
        setMenuOpenTime(Date.now());
    }, [refreshNotifications]);

    // Determinar o estado do ícone
    const renderIcon = () => {
        if (loading && !anchorEl) {
            return <CircularProgress size={20} color="inherit" />;
        }

        if (error && !notifications.length) {
            return <ErrorIcon color="error" />;
        }

        return (
            <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                overlap="circular"
            >
                <NotificationsIcon />
            </Badge>
        );
    };

    // Determinar o texto da tooltip
    const getTooltipText = () => {
        if (loading && !anchorEl) return "Carregando notificações...";
        if (error && !notifications.length) return "Erro ao carregar notificações";
        if (!isConnected) return "Notificações offline - clique para atualizar manualmente";
        return unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Notificações";
    };

    return (
        <>
            <Tooltip title={getTooltipText()}>
                <IconButton
                    color="inherit"
                    onClick={handleOpenMenu}
                    disabled={loading && !anchorEl}
                    sx={{
                        position: 'relative',
                        '& .MuiBadge-badge': unreadCount > 0
                            ? {
                                animation: `${pulse} 2s infinite ease-in-out`,
                                backgroundColor: theme.palette.error.main
                            }
                            : {}
                    }}
                >
                    {renderIcon()}
                </IconButton>
            </Tooltip>
            <NotificationMenu
                anchorEl={anchorEl}
                onClose={handleCloseMenu}
                notifications={recentNotifications}
                loading={loading && Boolean(anchorEl)}
                error={error}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onRefresh={handleRefresh}
                hasNotifications={notifications?.length > 0}
            />
        </>
    );
};

export default React.memo(NotificationBell);

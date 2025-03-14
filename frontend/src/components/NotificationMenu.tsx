// src/components/NotificationMenu.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Popover,
    List,
    Typography,
    Box,
    Button,
    Divider,
    IconButton,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    CheckCircleOutline,
    DeleteSweep,
    Refresh,
    ErrorOutline
} from '@mui/icons-material';
import NotificationItem from './NotificationItem';
import { Notification } from '../types';

interface NotificationMenuProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    notifications: Notification[];
    loading: boolean;
    error: string | null;
    onMarkAsRead: (id: string) => Promise<void>;
    onMarkAllAsRead: () => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRefresh?: () => void; // Nova prop opcional para atualizar
    hasNotifications?: boolean; // Nova prop opcional para verificar se há notificações
}

const NotificationMenu: React.FC<NotificationMenuProps> = ({
    anchorEl,
    onClose,
    notifications,
    loading,
    error,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onRefresh, // Nova prop para atualizar as notificações
    hasNotifications = notifications?.length > 0 // Valor padrão baseado nas notificações
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const open = Boolean(anchorEl);

    const handleViewAllClick = () => {
        onClose();
        // Caso você tenha uma página dedicada para notificações
        // navigate('/notifications');
    };

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            slotProps={{
                paper: {
                    elevation: 2,
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        maxWidth: '100%',
                        mt: 1,
                        borderRadius: 2,
                        maxHeight: 'calc(100vh - 100px)',
                        overflow: 'hidden'
                    }
                }
            }}
        >
            {/* Cabeçalho */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Notificações
                </Typography>
                <Box>
                    {/* Botão de atualizar */}
                    {onRefresh && (
                        <IconButton
                            size="small"
                            onClick={handleRefresh}
                            disabled={loading}
                            title="Atualizar notificações"
                            sx={{ mr: 1 }}
                        >
                            {loading ?
                                <CircularProgress size={18} /> :
                                <Refresh fontSize="small" />
                            }
                        </IconButton>
                    )}

                    {/* Botão de marcar todas como lidas */}
                    <IconButton
                        size="small"
                        onClick={onMarkAllAsRead}
                        disabled={loading || !hasNotifications || !notifications.some(n => !n.isRead)}
                        title="Marcar todas como lidas"
                    >
                        <CheckCircleOutline fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Lista de notificações */}
            <Box sx={{
                overflowY: 'auto',
                maxHeight: 350
            }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3, flexDirection: 'column' }}>
                        <CircularProgress size={30} />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Carregando notificações...
                        </Typography>
                    </Box>
                )}

                {error && !loading && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <ErrorOutline color="error" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={onRefresh || (() => window.location.reload())}
                            startIcon={<Refresh />}
                        >
                            Tentar novamente
                        </Button>
                    </Box>
                )}

                {!loading && !error && !hasNotifications && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                            Não há notificações.
                        </Typography>
                    </Box>
                )}

                <List sx={{ py: 0, px: 0.5 }}>
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onRead={onMarkAsRead}
                            onDelete={onDelete}
                        />
                    ))}
                </List>
            </Box>

            {/* Rodapé */}
            <Box
                sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    p: 1.5,
                    textAlign: 'center',
                }}
            >
                <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={handleViewAllClick}
                    disabled={!hasNotifications}
                    sx={{ textTransform: 'none' }}
                >
                    Ver todas as notificações
                </Button>
            </Box>
        </Popover>
    );
};

export default NotificationMenu;

// src/components/NotificationItem.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    IconButton,
    Box,
    useTheme
} from '@mui/material';
import {
    CheckCircleOutline as ReadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { Notification } from '../types';

// Importações para ícones específicos por tipo de notificação
import AssignmentIcon from '@mui/icons-material/Assignment';
import ForumIcon from '@mui/icons-material/Forum';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import FlagIcon from '@mui/icons-material/Flag';

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}

// Função utilitária para formatar data relativa
const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'agora mesmo';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
    }

    // Formato para datas mais antigas
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onRead,
    onDelete
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // Função para determinar o ícone com base no tipo de notificação
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_assigned':
            case 'task_completed':
                return <AssignmentIcon />;
            case 'forum_message':
            case 'forum_reply':
                return <ForumIcon />;
            case 'forum_mention':
                return <PersonIcon />;
            case 'mission_created':
            case 'mission_updated':
            case 'mission_task_assigned':
            case 'mission_checkpoint_assigned':
                return <FlagIcon />;
            case 'chat_message':
                return <ChatIcon />;
            case 'user_mention':
                return <PersonIcon />;
            case 'system_announcement':
                return <NotificationsIcon />;
            default:
                return <NotificationsIcon />;
        }
    };

    // Função para determinar cor do ícone com base no tipo de notificação
    const getIconColor = (type: string) => {
        switch (type) {
            case 'task_assigned':
                return theme.palette.info.main;
            case 'task_completed':
                return theme.palette.success.main;
            case 'forum_message':
            case 'forum_reply':
            case 'forum_mention':
                return theme.palette.primary.main;
            case 'mission_created':
            case 'mission_updated':
                return theme.palette.warning.main;
            case 'mission_task_assigned':
            case 'mission_checkpoint_assigned':
                return theme.palette.secondary.main;
            case 'system_announcement':
                return theme.palette.error.main;
            default:
                return theme.palette.primary.main;
        }
    };

    // Função para lidar com o clique na notificação
    const handleClick = () => {
        onRead(notification._id);

        if (notification.link) {
            navigate(notification.link);
        }
    };

    // Usar nossa função personalizada em vez de date-fns
    const formattedDate = formatRelativeTime(notification.createdAt);

    return (
        <ListItem
            alignItems="flex-start"
            sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1,
                transition: 'background-color 0.2s',
                backgroundColor: notification.isRead
                    ? 'transparent'
                    : alpha(theme.palette.primary.light, 0.1),
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.light, 0.05),
                    cursor: 'pointer'
                },
                position: 'relative'
            }}
            onClick={handleClick}
        >
            <ListItemAvatar>
                <Avatar
                    sx={{
                        bgcolor: alpha(getIconColor(notification.type), 0.2),
                        color: getIconColor(notification.type)
                    }}
                >
                    {getNotificationIcon(notification.type)}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            color: notification.isRead ? 'text.secondary' : 'text.primary',
                            pr: 6
                        }}
                    >
                        {notification.title}
                    </Typography>
                }
                secondary={
                    <>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: 'inline',
                                fontSize: '0.85rem',
                                wordBreak: 'break-word'
                            }}
                        >
                            {notification.content}
                        </Typography>
                        <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.5, fontSize: '0.75rem' }}
                        >
                            {formattedDate}
                        </Typography>
                    </>
                }
            />

            {/* Ações - posicionadas absolutamente para não interferir no clique da notificação */}
            <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                {!notification.isRead && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRead(notification._id);
                        }}
                        sx={{ color: theme.palette.success.main }}
                    >
                        <ReadIcon fontSize="small" />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                    }}
                    sx={{ color: theme.palette.error.light }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        </ListItem>
    );
};

export default NotificationItem;

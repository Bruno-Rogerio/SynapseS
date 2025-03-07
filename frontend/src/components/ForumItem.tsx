// components/ForumItem.tsx
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    CardActionArea,
    useTheme
} from '@mui/material';
import { Forum } from '../types';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UpdateIcon from '@mui/icons-material/Update';

interface ForumItemProps {
    forum: Forum;
}

const ForumItem: React.FC<ForumItemProps> = ({ forum }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const handleClick = () => {
        navigate(`/forum/${forum._id}`);
    };

    const truncateDescription = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
            },
        }}>
            <CardActionArea onClick={handleClick} sx={{ flexGrow: 1 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                            {forum.title[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                            {forum.title}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {truncateDescription(forum.description, 100)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {forum.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                        ))}
                        {forum.tags.length > 3 && (
                            <Chip label={`+${forum.tags.length - 3}`} size="small" />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ChatIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {forum.messageCount} mensagens
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {forum.followers.length} seguidores
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {forum.viewCount} visualizações
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <UpdateIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(forum.lastActivity)}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ForumItem;

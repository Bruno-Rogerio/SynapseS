// components/ForumItem.tsx
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    CardActionArea
} from '@mui/material';
import { Forum } from '../types';
import { useNavigate } from 'react-router-dom';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';

interface ForumItemProps {
    forum: Forum;
}

const ForumItem: React.FC<ForumItemProps> = ({ forum }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/forum/${forum._id}`);
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
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{forum.title[0].toUpperCase()}</Avatar>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                            {forum.title}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {forum.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {forum.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ForumIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {forum.postCount} posts
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {forum.followers.length} seguidores
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ForumItem;
